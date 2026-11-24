/* ═══ রুমে ঢোকার এনিমেশন (Entry Effect) — রুমের সবাই দেখে ═══
   - ভিডিও স্বচ্ছ এনিমেটেড WebP (সাউন্ড নেই), শেষের ~৩ সেকেন্ডে ইউজারের ছবি+নাম কার্ড
   - নতুন এফেক্ট: EFFECTS এ এক এন্ট্রি + shared/svip/levels/levelN/entry.webp  */
(function(){
    const BASE = (function(){ const s = document.currentScript; return s ? s.src.replace(/[^\/]*$/, '') : '../shared/'; })() + 'levels/';
    const EFFECTS = {
        /* স্ট্রিপ-কার্ড এন্ট্রি: ডান থেকে ঢোকে, থামে, বাঁয়ে বেরিয়ে যায়। geo = ছবির পিক্সেল মাপ (hole কেন্দ্র/ব্যাসার্ধ, নামের ঘর) */
        svip1: { kind: 'strip', strip: 'level1/entry_strip.webp', h: 62, stretch: { L: 530, R: 107 },
                 geo: { w: 1058, h: 169, cx: 118.1, cy: 81.4, r: 55.7, barT: 53, barB: 135 } },
        vip1: { kind: 'strip', strip: 'vip1/entry_head.webp', w: 330, smoke: 'vip1/smoke.mp4', smokeMs: 5800,
                geo: { w: 1079, h: 351, cx: 166.1, cy: 216, r: 82.8, barL: 288, barR: 841, barT: 188, barB: 273 } },
        /* স্টোরের এন্ট্রি: রুমের মাঝখানে (pos:'center'), সাউন্ড সহ। ফাইল shared/store/entries/ এ */
        eyes1: { img: '../../store/entries/entry_eyes1.webp', sound: '../../store/entries/entry_eyes1.mp3', dur: 8400, card: 3000, pos: 'center', ring: '#4fc3ff', ring2: '#1d6bff', plate: ['#1456c8', '#0a2a6b'] }
    };
    let queue = [], busy = false, ROOM = null, seen = {};

    function css(){
        if (document.getElementById('moi-entry-css')) return;
        const s = document.createElement('style'); s.id = 'moi-entry-css';
        s.textContent = `
        #moiEntry{position:fixed;left:0;right:0;top:20%;z-index:99990;pointer-events:none;display:flex;justify-content:center}
        #moiEntry.pc{top:50%;transform:translateY(-50%)}
        #moiEntry.pc .en-box{width:min(100vw,520px)}
        #moiEntry.pc .en-card{bottom:-13%}
        #moiEntry .en-box{position:relative;width:min(100vw,560px);opacity:0;transition:opacity .35s}
        #moiEntry .en-box.on{opacity:1}
        #moiEntry .en-v{display:block;width:100%;height:auto;-webkit-user-drag:none;user-select:none}
        #moiEntry .en-card{position:absolute;left:50%;bottom:-6%;transform:translate(-50%,24px) scale(.6);opacity:0;display:flex;flex-direction:column;align-items:center;transition:transform .55s cubic-bezier(.2,1.4,.4,1),opacity .4s}
        #moiEntry .en-card.on{transform:translate(-50%,0) scale(1);opacity:1}
        #moiEntry .en-ph{position:relative;width:64px;height:64px;border-radius:50%;padding:3px;background:conic-gradient(from 0deg,var(--r1),var(--r2),#ffe08a,var(--r1));box-shadow:0 0 14px var(--r2),0 0 30px var(--r1);animation:enSpin 3s linear infinite}
        #moiEntry .en-ph img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;border:2px solid #1a0a2e;background:#222}
        @keyframes enSpin{to{filter:hue-rotate(0deg) brightness(1.15)}}
        #moiEntry .en-nm{margin-top:-8px;position:relative;z-index:2;min-width:110px;max-width:200px;padding:3px 22px 4px;color:#fff;font:800 13px/1.2 system-ui,sans-serif;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:linear-gradient(180deg,var(--p1),var(--p2));border:1.5px solid #ffd36b;clip-path:polygon(0 0,100% 0,calc(100% - 9px) 50%,100% 100%,0 100%,9px 50%);text-shadow:0 1px 2px #000}
        #moiEntry .en-sub{margin-top:2px;font:700 10px/1 system-ui,sans-serif;color:#ffe08a;letter-spacing:.5px;text-shadow:0 1px 3px #000}
        `;
        document.head.appendChild(s);
    }
    function esc(t){ return String(t == null ? '' : t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

    /* ═══ স্ট্রিপ-কার্ড এন্ট্রি (SVIP১ / VIP১) ═══ */
    function stripCss(){
        if (document.getElementById('moi-strip-css')) return;
        const s = document.createElement('style'); s.id = 'moi-strip-css';
        s.textContent = '#moiStrip{position:fixed;left:0;right:0;bottom:150px;z-index:99990;pointer-events:none;display:flex;justify-content:center;overflow:visible}' +
            '#moiStrip .es{position:relative;display:inline-block;will-change:transform}' +
            '#moiStrip .es-av{position:absolute;border-radius:50%;object-fit:cover;background:#222}' +
            '#moiStrip .es-bg{position:relative;box-sizing:border-box;border-style:solid;border-top:0;border-bottom:0;border-image-repeat:stretch}' +
            '#moiStrip .es-nm{display:block;box-sizing:border-box;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff;font:800 13px system-ui,sans-serif;text-shadow:0 1px 3px #000,0 0 6px #000}' +
            '#moiStrip .es-img{display:block;width:100%;height:100%}' +
            '#moiStrip .es-fix .es-nm{position:absolute}' +
            '#moiSmoke{position:fixed;inset:0;z-index:99980;pointer-events:none;opacity:0;transition:opacity .35s}' +
            '#moiSmoke.on{opacity:1}#moiSmoke canvas{width:100%;height:100%;object-fit:cover;display:block}';
        document.head.appendChild(s);
    }
    function buildStrip(fx, ev){
        const g = fx.geo, wrap = document.createElement('div'); wrap.className = 'es';
        const photo = esc(ev.photo || window.FALLBACK_IMG || ''), name = esc(ev.name || 'MOI');
        let k, H;
        if (fx.stretch){                                   /* নামের ঘর নামের মাপ অনুযায়ী বাড়ে/কমে */
            H = fx.h; k = H / g.h;
            const rr = g.r * 0.97 * k;
            wrap.innerHTML = '<img class="es-av" alt="" src="' + photo + '" style="left:' + (g.cx * k - rr).toFixed(1) + 'px;top:' + (g.cy * k - rr).toFixed(1) + 'px;width:' + (rr * 2).toFixed(1) + 'px;height:' + (rr * 2).toFixed(1) + 'px">' +
                '<div class="es-bg" style="height:' + H + 'px;padding-top:' + (g.barT * k).toFixed(1) + 'px;border-width:0 ' + (fx.stretch.R * k).toFixed(1) + 'px 0 ' + (fx.stretch.L * k).toFixed(1) + 'px;border-image-source:url(' + BASE + fx.strip + ');border-image-slice:0 ' + fx.stretch.R + ' 0 ' + fx.stretch.L + ' fill">' +
                '<span class="es-nm" style="height:' + ((g.barB - g.barT) * k).toFixed(1) + 'px;line-height:' + ((g.barB - g.barT) * k).toFixed(1) + 'px;min-width:40px;max-width:170px;padding:0 10px">' + name + '</span></div>';
        } else {                                           /* ফিক্সড মাপ (ড্রাগন কার্ড) */
            k = fx.w / g.w; H = g.h * k;
            const rr = g.r * 0.97 * k;
            wrap.className = 'es es-fix'; wrap.style.width = fx.w + 'px'; wrap.style.height = H.toFixed(1) + 'px';
            wrap.innerHTML = '<img class="es-av" alt="" src="' + photo + '" style="left:' + (g.cx * k - rr).toFixed(1) + 'px;top:' + (g.cy * k - rr).toFixed(1) + 'px;width:' + (rr * 2).toFixed(1) + 'px;height:' + (rr * 2).toFixed(1) + 'px">' +
                '<img class="es-img" alt="" draggable="false" style="position:relative" src="' + BASE + fx.strip + '">' +
                '<span class="es-nm" style="left:' + (g.barL * k + 10).toFixed(1) + 'px;width:' + ((g.barR - g.barL) * k - 20).toFixed(1) + 'px;top:' + (g.barT * k).toFixed(1) + 'px;height:' + ((g.barB - g.barT) * k).toFixed(1) + 'px;line-height:' + ((g.barB - g.barT) * k).toFixed(1) + 'px">' + name + '</span>';
        }
        return wrap;
    }
    function playStrip(ev, done){
        const fx = EFFECTS[ev.fx]; stripCss();
        let root = document.getElementById('moiStrip');
        if (!root){ root = document.createElement('div'); root.id = 'moiStrip'; document.body.appendChild(root); }
        root.innerHTML = '';
        let smoke = null, cvs = null, over = false;
        const timers = [];
        function finish(){ if (over) return; over = true; timers.forEach(clearTimeout); if (cvs && window.MOIRingVid) MOIRingVid.unmount(cvs); if (smoke) smoke.remove(); root.innerHTML = ''; done(); }
        function slide(){
            const el = buildStrip(fx, ev); root.appendChild(el);
            const run = () => {
                const a = el.animate([{ transform: 'translateX(110vw)' }, { transform: 'translateX(0)' }], { duration: 650, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });
                a.onfinish = () => timers.push(setTimeout(() => {
                    const b = el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-110vw)' }], { duration: 900, easing: 'ease-in', fill: 'forwards' });
                    b.onfinish = finish;
                }, 1700));
            };
            const im = el.querySelector('.es-img') || null;
            el.style.visibility = 'hidden'; requestAnimationFrame(() => { el.style.visibility = ''; run(); });
        }
        if (fx.smoke && window.MOIRingVid){
            smoke = document.createElement('div'); smoke.id = 'moiSmoke'; document.body.appendChild(smoke);
            const url = BASE + fx.smoke; let started = false;
            const begin = () => {
                if (started) return; started = true; smoke.classList.add('on');
                timers.push(setTimeout(() => { smoke.classList.remove('on'); timers.push(setTimeout(() => { if (cvs) MOIRingVid.unmount(cvs); cvs = null; if (smoke){ smoke.remove(); smoke = null; } slide(); }, 350)); }, fx.smokeMs));
            };
            MOIRingVid.restart(url);
            cvs = MOIRingVid.mount(smoke, url, begin);
            timers.push(setTimeout(begin, 2500));            /* ভিডিও না এলেও আটকে না থাকে */
        } else slide();
        timers.push(setTimeout(finish, 20000));
    }
    function play(ev, done){
        const fx = EFFECTS[ev.fx]; if (!fx){ done(); return; }
        if (fx.kind === 'strip'){ playStrip(ev, done); return; }
        css();
        let root = document.getElementById('moiEntry');
        if (!root){ root = document.createElement('div'); root.id = 'moiEntry'; document.body.appendChild(root); }
        root.innerHTML = ''; root.className = fx.pos === 'center' ? 'pc' : '';
        const box = document.createElement('div'); box.className = 'en-box';
        const im = new Image(); im.className = 'en-v'; im.draggable = false; im.alt = '';
        let finished = false, timers = [], au = null;
        function end(){ if (finished) return; finished = true; try { if (au){ au.pause(); au = null; } } catch(e){} timers.forEach(clearTimeout); box.classList.remove('on'); setTimeout(() => { root.innerHTML = ''; done(); }, 400); }
        im.onerror = () => end();
        im.onload = () => {
            box.classList.add('on');
            if (fx.sound){ try { au = new Audio(BASE + fx.sound); au.volume = 1; const pr = au.play(); if (pr && pr.catch) pr.catch(() => {}); } catch(e){} }   /* সাউন্ড */
            const card = document.createElement('div'); card.className = 'en-card';
            card.style.cssText = '--r1:' + fx.ring + ';--r2:' + fx.ring2 + ';--p1:' + fx.plate[0] + ';--p2:' + fx.plate[1];
            card.innerHTML = '<div class="en-ph"><img src="' + esc(ev.photo || window.FALLBACK_IMG || '') + '" alt=""></div><div class="en-nm">' + esc(ev.name) + '</div><div class="en-sub">ENTERED THE ROOM</div>';
            box.appendChild(card);
            timers.push(setTimeout(() => card.classList.add('on'), Math.max(0, fx.dur - fx.card)));
            timers.push(setTimeout(() => { card.classList.remove('on'); }, fx.dur - 250));
            timers.push(setTimeout(end, fx.dur + 150));
        };
        box.appendChild(im); root.appendChild(box);
        im.src = BASE + fx.img + '?p=' + Date.now();          /* নতুন করে শুরু থেকে চলবে */
        timers.push(setTimeout(end, fx.dur + 6000));           /* নেট ধীর হলে আটকে না থাকে */
    }
    function pump(){
        if (busy || !queue.length) return;
        busy = true; play(queue.shift(), () => { busy = false; pump(); });
    }
    /* হালকা মোড: ভারী ভিডিও/ছবি নয়, শুধু ছোট "ঢুকলো" ব্যানার */
    const LITE = true;
    function liteBanner(ev){
        const app = document.querySelector('.app-container') || document.body; if (!app) return;
        const b = document.createElement('div'); b.className = 'en-lite';
        b.style.cssText = 'position:absolute;left:50%;top:132px;transform:translateX(-50%);z-index:80;padding:6px 14px;border-radius:18px;background:linear-gradient(90deg,#7a2bd6,#3b1180);color:#fff;font-size:12px;font-weight:700;border:1px solid #ffb02e;white-space:nowrap;pointer-events:none';
        b.textContent = '✨ ' + (ev.name || 'MOI') + ' ঢুকলেন';
        app.appendChild(b);
        b.animate([{ opacity: 0, transform: 'translateX(-50%) translateY(-10px)' }, { opacity: 1, transform: 'translateX(-50%)', offset: .15 }, { opacity: 1, transform: 'translateX(-50%)', offset: .8 }, { opacity: 0, transform: 'translateX(-50%)' }], { duration: 2800, fill: 'forwards' });
        setTimeout(() => b.remove(), 2900);
    }
    function enqueue(ev){
        const f0 = EFFECTS[ev.fx];
        if (f0 && f0.kind === 'strip'){ if (queue.length >= 3) return; queue.push(ev); pump(); return; }
        if (LITE){ liteBanner(ev); return; }
        if (queue.length >= 3) return;
        queue.push(ev); pump();
    }
    function FB(){ return window.MOIFB; }

    /* রুমে ঢোকার সময় ডাকুন — SVIP থাকলে সবার কাছে ইভেন্ট যায় */
    function announce(p){
        try {
            if (!p || !ROOM || !FB()) return;
            const pk = window.MOIPerks ? MOIPerks.perksOf(p.uid) : null;
            const fxId = (window.MOIStore && MOIStore.entryFor(p.uid)) || (pk && pk.entry);   /* ব্যাগ থেকে পরা স্টোর-এন্ট্রি আগে, নইলে SVIP */
            if (!fxId) return;
            const k = 'moi_entry_last_' + ROOM + '_' + p.uid;
            try { if (Date.now() - Number(sessionStorage.getItem(k) || 0) < 20000) return; sessionStorage.setItem(k, Date.now()); } catch(e){}
            FB().rtdb.ref(FB().LIVE + '/rooms/' + ROOM + '/entries').push({ uid: p.uid, name: p.name || '', photo: p.photo || p.avatar || '', fx: fxId, ts: Date.now() }).catch(() => {});
        } catch(e){ console.warn('entry announce', e); }
    }
    /* ডেমো: রুমে ঢোকার একটু পরে একজন VIP বট আর একজন SVIP বট ঢোকে, যাতে এন্ট্রি দেখা যায় (আসল ব্যাকএন্ডে এটা বাদ) */
    function demoVisitors(){
        try {
            if (window._entryDemo || !window.DEMO || !DEMO.USERS || !window.MOIPerks) return; window._entryDemo = 1;
            const U = DEMO.USERS, pick = vip => Object.keys(U).find(u => { const pk = MOIPerks.perksOf(u); return pk && pk.entry && EFFECTS[pk.entry] && !!pk.vip === vip && U[u] && U[u].name; });
            [[pick(true), 7000], [pick(false), 21000]].forEach(a => { if (!a[0]) return; setTimeout(() => { const u = U[a[0]], pk = MOIPerks.perksOf(a[0]); enqueue({ uid: a[0], name: u.name, photo: u.photo, fx: pk.entry, ts: Date.now() }); }, a[1]); });
        } catch(e){}
    }
    function listen(roomId){
        try {
            ROOM = roomId; demoVisitors(); if (!FB() || window._entryOn) return; window._entryOn = true;
            const since = Date.now() - 3000;
            FB().rtdb.ref(FB().LIVE + '/rooms/' + roomId + '/entries').orderByChild('ts').startAt(since).on('child_added', snap => {
                const v = snap.val(); if (!v || seen[snap.key]) return; seen[snap.key] = 1;
                if (Date.now() - v.ts > 8000) return;
                enqueue(v);
            });
        } catch(e){ console.warn('entry listen', e); }
    }
    /* টেস্ট: কনসোল বা ?entrytest=1 */
    function test(p, fx){ p = p || (window.myProfile || {}); enqueue({ uid: p.uid, name: p.name || 'MOI', photo: p.photo || p.avatar, fx: fx || 'svip1', ts: Date.now() }); }
    window.MOIEntry = { listen, announce, play: enqueue, test, EFFECTS };
})();
