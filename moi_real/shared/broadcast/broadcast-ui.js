/* shared/broadcast-ui.js — পপআপ দেখানো: লাইনে সাজানো, ডান থেকে ঢুকে বাম দিয়ে বেরোয়, টিপলে "রুমে যাবেন?" বক্স */
(function(){
    'use strict';
    const SRC = (document.currentScript && document.currentScript.src) || location.href;
    function gIco(ev){ return ev.giftId ? '<img src="' + GIFTIMG + encodeURIComponent(ev.giftId) + '.webp" alt="" style="width:100%;height:100%;object-fit:contain" onerror="this.replaceWith(document.createTextNode(\'🎁\'))">' : esc(ev.icon || '🎁'); }
    const PANELS = new URL('panels/', SRC).href, ICONS = new URL('../gameicons/', SRC).href, GIFTIMG = new URL('../../room/gifts/img/', SRC).href, GEMIMG = new URL('../../room/gifts/lb/gem_badge.png', SRC).href;
    if (window.top !== window || !window.MOIBroadcast || window.__bcUi) return;
    window.__bcUi = true;
    const BC = window.MOIBroadcast;
    const SHOW_MS = 3200;                     /* স্ক্রিনে থাকার সময় */
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const PH = n => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#4a3a8a"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#fff">' + esc((n || 'U').charAt(0)) + '</text></svg>');
    const SP = '<i class="sp">✦</i><i class="sp">✦</i><i class="sp">✦</i><i class="sp">✦</i>';

    let layer = null, queue = [], busy = false, paused = false;
    function ensureLayer(){
        if (!layer){
            layer = document.createElement('div'); layer.id = 'bcLayer';
            layer.innerHTML = '<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="bcGemG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#9be8ff"/><stop offset=".7" stop-color="#36b4ff"/><stop offset="1" stop-color="#1a6fe0"/></linearGradient></defs></svg>';
            document.body.appendChild(layer);
        }
        return layer;
    }

    /* গিফটের Lottie ছবি — room পেজে lottie আগে থেকেই আছে, অন্য পেজে দরকার হলে নিজে লোড করে */
    const LOTTIE_SRC = (function(){ try { return new URL('../../assets/lib/lottie.min.js', document.currentScript.src).href; } catch(e){ return location.href.split('?')[0].replace(/[^\/]*\/[^\/]*$/,'') + 'assets/lib/lottie.min.js'; } })();
    const jsonCache = {};
    let lottieP = null;
    function needLottie(){
        if (window.lottie) return Promise.resolve(window.lottie);
        if (!lottieP) lottieP = new Promise(res => {
            const s = document.createElement('script'); s.src = LOTTIE_SRC;
            s.onload = () => res(window.lottie); s.onerror = () => res(null); document.head.appendChild(s);
        });
        return lottieP;
    }
    async function loadGiftJson(url, filter){
        const key = url + '||' + filter;
        if (jsonCache[key]) return jsonCache[key];
        const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status);
        const j = await r.json(), f = filter ? filter.split('|') : [];
        if (f.length && j && Array.isArray(j.layers)) j.layers = j.layers.filter(l => f.indexOf(l.nm) === -1);
        return (jsonCache[key] = j);
    }
    async function mountGift(el, ev){
        return;   /* হালকা মোড: Lottie নয়, 🎁 ইমোজিই থাকবে (ভারী json নামে না) */
        if (!ev.giftUrl) return;
        try {
            const [lt, json] = await Promise.all([needLottie(), loadGiftJson(ev.giftUrl, ev.giftFilter || '')]);
            if (!lt || !json || !el.isConnected) return;
            el.textContent = '';
            lt.loadAnimation({ container: el, renderer: 'canvas', rendererSettings: { clearCanvas: true, progressiveLoad: true }, loop: true, autoplay: true, animationData: JSON.parse(JSON.stringify(json)) });
        } catch(e){ /* ছবি না এলে 🎁 ইমোজিই থাকবে */ }
    }

    /* অ্যাপের আসল ডায়মন্ড আকার (Font Awesome gem) — SVG হিসেবে বসানো, তাই আইকন-ফন্ট লোড না হলেও দেখা যায় */
    const GEM = '<svg class="bc-gem" viewBox="0 0 512 512" aria-hidden="true"><path d="M116.7 33.8c4.5-6.1 11.7-9.8 19.3-9.8h240c7.6 0 14.8 3.6 19.3 9.8l112 152c6.8 9.2 6.1 21.9-1.5 30.4l-232 256c-4.5 5-11 7.9-17.8 7.9s-13.2-2.9-17.8-7.9l-232-256c-7.7-8.5-8.3-21.2-1.5-30.4zm38.5 39.8c-3.3 2.5-4.2 7-2.1 10.5l57.4 95.7L63.3 192c-4.1.3-7.3 3.8-7.3 8s3.2 7.6 7.3 8l192 16h1.3l192-16c4.1-.3 7.3-3.8 7.3-8s-3.2-7.6-7.3-8l-147.2-12.3 57.4-95.6c2.1-3.5 1.2-8.1-2.1-10.5s-7.9-2-10.7 1l-90 97.6-90.1-97.6c-2.8-3-7.4-3.4-10.7-1"/></svg>';
    const fmt = n => Number(n || 0).toLocaleString('en-US');
    function who(ev, sub){
        return '<span class="bc-txt"><b class="bc-name">' + esc(ev.name || 'User') + '</b><span class="bc-sub">' + sub + '</span></span>';
    }

    /* ═══ ৩টা ছবির প্যানেল (গেম / গিফট / লাকি বক্স) — ফাঁকা জায়গাগুলো % মাপে; ভেতরে ছবি/নাম/ডায়মন্ড বসে ═══ */
    const GEO = {
        game:  { ar: 0.1885, ring: [4.64, 11.54, 14.5, 75.9], bar1: [24.55, 21.03, 38.86, 27.95], bar2: [23.39, 57.95, 40.31, 23.33], sq: [68.05, 17.18, 12.76, 65.13], pill: [82.46, 46.67, 13.87, 19.23] },
        gift:  { ar: 0.2829, ring: [8.4, 20.81, 18.37, 62.25], pill: [39.91, 78.86, 19.98, 14.93], sq: [41.2, 19.97, 17.37, 53.36], ring2: [72.99, 20.81, 18.41, 62.25] },
        lucky: { ar: 0.2437, ring: [6.12, 20.72, 15.92, 62.55], pill: [44.66, 39.44, 44.17, 31.47] }
    };
    const slot = (g, cls, inner) => '<div class="bcp-s ' + cls + '" style="left:' + g[0] + '%;top:' + g[1] + '%;width:' + g[2] + '%;height:' + g[3] + '%">' + inner + '</div>';
    const avImg = (src, nm) => '<img src="' + esc(src || PH(nm)) + '" onerror="this.onerror=null;this.src=\'' + PH(nm) + '\'">';
    const gemAmt = (n) => '<img class="bcp-gem" src="' + GEMIMG + '" alt=""><b>' + fmt(n) + '</b>';
    function panel(ev){
        const k = ev.type === 'lucky' ? 'lucky' : (ev.type === 'game' ? 'game' : 'gift'), g = GEO[k];
        let c = slot(g.ring, 'av', avImg(ev.photo, ev.name));
        if (k === 'game'){
            const key = /^(game2?|gedi|horse|jackpot|ludo|rocket|slot)$/.test(ev.gameKey || '') ? ev.gameKey : 'game';
            c += slot(g.bar1, 'nm', '<span>' + esc(ev.name || 'User') + '</span>');
            c += slot(g.bar2, 'sb', '<span>' + (ev.round ? 'Round ' + esc(ev.round) + ' · ' : '') + 'জিতেছেন 🎉</span>');
            c += slot(g.sq, 'ic', '<img src="' + ICONS + key + '.webp" alt="">');
            c += slot(g.pill, 'pl', gemAmt(ev.amount));
        } else if (k === 'gift'){
            c += slot(g.ring2, 'av', avImg(ev.toPhoto, ev.toName));
            c += slot(g.sq, 'gf', '<span class="bc-gico">' + gIco(ev) + '</span>');
            c += slot(g.pill, 'pl', gemAmt(ev.amount));
        } else {
            c += slot(g.pill, 'pl big', gemAmt(ev.amount));
        }
        return '<div class="bcp-in"><div class="bcp-c">' + c + '</div><img class="bcp-img" src="' + PANELS + k + '.webp" alt=""></div>';
    }
    function html(ev){
        if (ev.type === 'game' || ev.type === 'lucky' || ev.type === 'gift' || !ev.type) return panel(ev);
        const av = '<div class="bc-av"><img src="' + esc(ev.photo || PH(ev.name)) + '" onerror="this.onerror=null;this.src=\'' + PH(ev.name) + '\'"></div>';
        if (ev.type === 'game'){
            return '<div class="bc-in">' + SP + av + who(ev, ev.round ? 'Round ' + ev.round : 'Game 🎮') + '<span class="bc-win">WIN</span><span class="bc-logo"></span><span class="bc-amtbox">' + GEM + '<span class="bc-amt">' + fmt(ev.amount) + '</span></span></div>';
        }
        if (ev.type === 'rocket'){
            return '<div class="bc-in">' + SP + av + who(ev, 'Rocket launched 🚀') + '<span class="bc-rk"></span><span class="bc-rkt">LIFT OFF!</span></div>';
        }
        if (ev.type === 'lucky'){
            return '<div class="bc-in">' + SP + av + who(ev, 'Lucky Box 🎁') + '<span class="bc-pkt"></span><span class="bc-amtbox">' + GEM + '<span class="bc-amt">' + fmt(ev.amount) + '</span></span></div>';
        }
        const to = ev.toName ? '&rarr; ' + esc(ev.toName) + ((ev.toCount || 1) > 1 ? ' +' + (ev.toCount - 1) : '') : esc(ev.giftName || 'Gift');
        const toAv = ev.toName ? '<img class="bc-to" src="' + esc(ev.toPhoto || PH(ev.toName)) + '" onerror="this.onerror=null;this.src=\'' + PH(ev.toName) + '\'">' : '';
        return '<div class="bc-in">' + SP + av + who(ev, to) + toAv + '<span class="bc-gico">' + gIco(ev) + '</span></div>';
    }
    function cls(ev){
        if (ev.type === 'rocket') return 'bc bc-rocket';
        return 'bcp bcp-' + (ev.type === 'lucky' ? 'lucky' : (ev.type === 'game' ? 'game' : 'gift'));
    }

    function next(){
        if (busy || paused || !queue.length) return;
        busy = true;
        const ev = queue.shift(), el = document.createElement('div');
        el.className = cls(ev); el.innerHTML = html(ev);
        ensureLayer().appendChild(el);
        if (ev.type === 'gift'){ const g = el.querySelector('.bc-gico'); if (g) mountGift(g, ev); }
        requestAnimationFrame(() => el.classList.add('in'));
        let timer = setTimeout(leave, SHOW_MS + 600);
        function leave(){
            el.classList.remove('in'); el.classList.add('out');
            setTimeout(() => { el.remove(); busy = false; setTimeout(next, 220); }, 520);
        }
        el.addEventListener('click', () => {
            clearTimeout(timer); paused = true;
            confirmGo(ev, () => { paused = false; timer = setTimeout(leave, 700); });
        });
    }

    function line(ev){
        if (ev.type === 'game') return 'গেমে <b>' + fmt(ev.amount) + '</b> 💎 জিতেছেন 🎉';
        if (ev.type === 'rocket') return 'রকেট ছেড়েছেন 🚀';
        if (ev.type === 'lucky') return 'লাকি বক্স ছেড়েছেন — <b>' + fmt(ev.amount) + '</b> 💎';
        return esc(ev.giftName || 'গিফট') + ' <b>&times;' + (ev.qty || 1) + '</b> পাঠিয়েছেন' + (ev.toName ? ' &rarr; <b>' + esc(ev.toName) + '</b>' : '') + ' (' + fmt(ev.amount) + ' 💎)';
    }
    function confirmGo(ev, done){
        if (!ev.roomId){ toast('এই ঘটনাটা কোনো রুমে হয়নি'); done(); return; }
        if (ev.roomId && ev.roomId === BC.currentRoomId()){
            toast('আপনি এই রুমেই আছেন'); done(); return;
        }
        const d = document.createElement('div'); d.className = 'bc-dlg';
        d.innerHTML = '<div class="bc-card"><div class="av"><img src="' + esc(ev.photo || PH(ev.name)) + '" onerror="this.onerror=null;this.src=\'' + PH(ev.name) + '\'"></div>' +
            '<h3>' + esc(ev.name) + '</h3><p>' + line(ev) + '</p>' +
            '<div class="room">🎙 ' + esc(ev.roomName || 'Room') + '</div><p style="margin-bottom:12px">আপনি কি ওই রুমে যেতে চান?</p>' +
            '<div class="bc-btns"><button class="no">বাতিল</button><button class="ok">ঠিক আছে</button></div></div>';
        document.body.appendChild(d);
        const close = () => { d.remove(); done(); };
        d.querySelector('.no').onclick = close;
        d.addEventListener('click', e => { if (e.target === d) close(); });
        d.querySelector('.ok').onclick = async () => {
            d.remove();
            /* রুমটা এখনো আছে কি না দেখে তবে যাই */
            try { const s = await MOIFB.db.collection('rooms').doc(ev.roomId).get(); if (!s.exists){ toast('রুমটা আর নেই'); done(); return; } } catch(e){}
            BC.goRoom(ev.roomId);
        };
    }
    function toast(m){
        const t = document.createElement('div');
        t.textContent = m;
        t.style.cssText = 'position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:9600;padding:10px 16px;border-radius:14px;background:rgba(20,14,44,.95);color:#fff;font:600 13px system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.4)';
        document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
    }

    function enqueue(key, ev){
        if (document.hidden) return;
        queue.push(ev); if (queue.length > 6) queue.shift();
        next();
    }
    function init(n){
        if (!window.MOIFB || !MOIFB.rtdb || !(window.MOIAuth && MOIAuth.profile)){ if (n < 160) setTimeout(() => init(n + 1), 250); return; }
        BC.subscribe(enqueue);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(0)); else init(0);
})();
