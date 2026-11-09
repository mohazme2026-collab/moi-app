/* ═══ রুমে ঢোকার এনিমেশন (Entry Effect) — রুমের সবাই দেখে ═══
   - ভিডিও স্বচ্ছ এনিমেটেড WebP (সাউন্ড নেই), শেষের ~৩ সেকেন্ডে ইউজারের ছবি+নাম কার্ড
   - নতুন এফেক্ট: EFFECTS এ এক এন্ট্রি + shared/svip/levels/levelN/entry.webp  */
(function(){
    const BASE = (function(){ const s = document.currentScript; return s ? s.src.replace(/[^\/]*$/, '') : '../shared/'; })() + 'levels/';
    const EFFECTS = {
        svip1: { img: 'level1/entry.webp', dur: 12800, card: 3200, ring: '#ffb02e', ring2: '#ff5a1f', plate: ['#7a2bd6', '#3b1180'] },
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

    function play(ev, done){
        const fx = EFFECTS[ev.fx]; if (!fx){ done(); return; }
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
    function enqueue(ev){
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
    function listen(roomId){
        try {
            ROOM = roomId; if (!FB() || window._entryOn) return; window._entryOn = true;
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
