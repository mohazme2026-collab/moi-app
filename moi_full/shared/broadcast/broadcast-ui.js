/* shared/broadcast-ui.js — পপআপ দেখানো: লাইনে সাজানো, ডান থেকে ঢুকে বাম দিয়ে বেরোয়, টিপলে "রুমে যাবেন?" বক্স */
(function(){
    'use strict';
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
    const LOTTIE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js';
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
        if (!ev.giftUrl) return;
        try {
            const [lt, json] = await Promise.all([needLottie(), loadGiftJson(ev.giftUrl, ev.giftFilter || '')]);
            if (!lt || !json || !el.isConnected) return;
            el.textContent = '';
            lt.loadAnimation({ container: el, renderer: 'svg', loop: true, autoplay: true, animationData: JSON.parse(JSON.stringify(json)) });
        } catch(e){ /* ছবি না এলে 🎁 ইমোজিই থাকবে */ }
    }

    /* অ্যাপের আসল ডায়মন্ড আকার (Font Awesome gem) — SVG হিসেবে বসানো, তাই আইকন-ফন্ট লোড না হলেও দেখা যায় */
    const GEM = '<svg class="bc-gem" viewBox="0 0 512 512" aria-hidden="true"><path d="M116.7 33.8c4.5-6.1 11.7-9.8 19.3-9.8h240c7.6 0 14.8 3.6 19.3 9.8l112 152c6.8 9.2 6.1 21.9-1.5 30.4l-232 256c-4.5 5-11 7.9-17.8 7.9s-13.2-2.9-17.8-7.9l-232-256c-7.7-8.5-8.3-21.2-1.5-30.4zm38.5 39.8c-3.3 2.5-4.2 7-2.1 10.5l57.4 95.7L63.3 192c-4.1.3-7.3 3.8-7.3 8s3.2 7.6 7.3 8l192 16h1.3l192-16c4.1-.3 7.3-3.8 7.3-8s-3.2-7.6-7.3-8l-147.2-12.3 57.4-95.6c2.1-3.5 1.2-8.1-2.1-10.5s-7.9-2-10.7 1l-90 97.6-90.1-97.6c-2.8-3-7.4-3.4-10.7-1"/></svg>';
    const fmt = n => Number(n || 0).toLocaleString('en-US');
    function who(ev, sub){
        return '<span class="bc-txt"><b class="bc-name">' + esc(ev.name || 'User') + '</b><span class="bc-sub">' + sub + '</span></span>';
    }
    function html(ev){
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
        return '<div class="bc-in">' + SP + av + who(ev, to) + toAv + '<span class="bc-gico">' + esc(ev.icon || '🎁') + '</span><span class="bc-x">&times;</span><span class="bc-qty">' + (ev.qty || 1) + '</span></div>';
    }
    function cls(ev){
        if (ev.type === 'game') return 'bc bc-game' + (ev.amount >= BC.CONFIG.RED_GAME ? ' red' : '');
        if (ev.type === 'rocket') return 'bc bc-rocket';
        return ev.type === 'lucky' ? 'bc bc-green' : 'bc bc-gift';
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
