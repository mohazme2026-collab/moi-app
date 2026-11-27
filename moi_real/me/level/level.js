/* me/level/level.js — Level (Wealth Privilege) পেজ
   ▸ কার্ড ডানে-বাঁয়ে সরালে লেভেল ১–১০০ বদলায়  ▸ নিচের Consumption / To upgrade বদলায়
   ▸ ব্যাজ/গিফট/প্যাকেজের ছবি এখন ফাঁকা — পরে #ic-… #gift-… #pkg-… ঘরে বসবে */
(function(){
    'use strict';
    const $ = id => document.getElementById(id);
    const ME = '../index.html';   /* level ফোল্ডার me-এর ভিতরে, তাই এক ধাপ উপরে = Me পেজ */
    const MAXLV = 100;

    /* ─── কোন লেভেলে পৌঁছাতে মোট কত কয়েন লাগে ───
       LEVEL_COINS[n] = লেভেল n-এ উঠতে মোট কয়েন। এখন সব ০ — হিসাবটা পরে এখানে বসবে।
       (To upgrade = পরের লেভেলের কয়েন − আপনার Consumption, প্রোগ্রেস বার = Consumption ÷ পরের লেভেলের কয়েন) */
    const LEVEL_COINS = {};
    /* অ্যাপের আসল লেভেল-হিসাবের সাথে মিল: লেভেল n = xp ≥ 50·n·(n−1); গিফটে খরচের অর্ধেক xp হয় → কয়েন ≈ 100·n·(n−1) */
    for (let i = 1; i <= MAXLV + 1; i++) LEVEL_COINS[i] = 100 * i * (i - 1);

    const cardsEl = $('lvCards');
    let cards = [], cur = 1, toastT = null;

    function toast(m){ const t = $('lvToast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800); }
    $('lvBack').addEventListener('click', () => { if (document.referrer && history.length > 1) history.back(); else location.href = ME; });
    if ($('lvCharm')) $('lvCharm').addEventListener('click', () => {});          /* Charm level — এখন শুধু লেখা */
    /* Go To upgrade → যেকোনো একটা র‍্যান্ডম লাইভ রুমে (রুমে সময় দিলে লেভেল বাড়ে) */
    $('lvGo').addEventListener('click', () => {
        let rooms = []; try { rooms = (window.DEMO && DEMO.ROOMS) || []; } catch(e){}
        const r = rooms.length ? rooms[Math.floor(Math.random() * rooms.length)] : null;
        if (r) location.href = '../../room/index.html?room=' + encodeURIComponent(r.id); else toast('এখন কোনো রুম নেই');
    });

    /* ব্যাজের রঙ (লেভেলের ধাপ অনুযায়ী) */
    function tint(n){
        if (n < 1) return '#8d9aa6'; if (n < 10) return '#1fae63'; if (n < 20) return '#17a3b8'; if (n < 30) return '#2a86e8'; if (n < 40) return '#2358d6';
        if (n < 50) return '#3b63d9'; if (n < 60) return '#6a3fd0'; if (n < 70) return '#8a35c9'; if (n < 80) return '#c42a95'; if (n < 90) return '#d62a4a'; return '#e8741c';
    }
    const badge = n => '<span class="lvb" style="--bc:' + tint(n) + '"><i></i><b>' + n + '</b></span>';

    const ph = n => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#8b6a3a"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#fff">' + String(n || 'U').charAt(0).toUpperCase().replace(/[<>&]/g, '') + '</text></svg>');
    function me(){
        const p = window.MOIAuth && MOIAuth.profile; if (p && p.uid) return p;
        try { return JSON.parse(localStorage.getItem('moi_user')) || null; } catch(e){ return null; }
    }
    /* Consumption = গিফটে খরচ আর xp (মিশন ইত্যাদি) — যেটা বেশি; এতে আপনার আসল লেভেলের সাথে এই পেজ সবসময় মিলে থাকে */
    const consumption = () => {
        const p = me(); if (!p) return 0;
        const lv = Math.max(1, Math.min(MAXLV, Number(p.level) || 1));
        return Math.max(0, Number(p.giftsSent) || 0, (Number(p.xp) || 0) * 2, LEVEL_COINS[lv]);
    };

    /* ১–১০০ কার্ড বানানো */
    function build(){
        let h = '';
        for (let n = 1; n <= MAXLV; n++){
            h += '<div class="lv-card" data-lv="' + n + '"><div class="wm">MOI</div>' +
                 '<div class="lvn"><small>Lv.</small> ' + n + '</div><img class="av" alt="">' +
                 '<div class="bar">' + MOILv.badge(n, { h: 36 }) + '<div class="track"><div class="fill"></div><span class="tl"></span><span class="tr"></span></div>' + MOILv.badge(Math.min(n + 1, MAXLV), { h: 36 }) + '</div></div>';
        }
        cardsEl.innerHTML = h;
        cards = [...cardsEl.querySelectorAll('.lv-card')];
    }

    const fmt = v => Math.floor(v).toString();
    function renderNumbers(){
        if (!$('lvCons')) return;
        const c = consumption(), next = LEVEL_COINS[Math.min(cur + 1, MAXLV + 1)] || 0;
        $('lvCons').textContent = fmt(c);
        $('lvUp').textContent = Math.max(0, next - c).toFixed(2);
    }
    /* প্রতিটা কার্ডের বার: বাঁয়ে = এই লেভেলে এখন পর্যন্ত কত ডায়মন্ড জমেছে, ডানে = পূর্ণ হতে আর কত লাগবে।
       আগের লেভেলের কার্ড = পূর্ণ, পরের লেভেলের কার্ড = ফাঁকা (পুরো দাম দেখায়) */
    function renderBars(){
        const c = consumption(), f = v => Math.floor(v).toLocaleString('en');
        cards.forEach((card, i) => {
            const n = i + 1, lo = LEVEL_COINS[n] || 0, hi = LEVEL_COINS[Math.min(n + 1, MAXLV + 1)] || lo, span = Math.max(1, hi - lo);
            const done = Math.max(0, Math.min(span, c - lo)), need = span - done;
            card.querySelector('.fill').style.width = (done / span * 100) + '%';
            card.querySelector('.tl').textContent = '💎 ' + f(done);
            card.querySelector('.tr').textContent = n >= MAXLV ? 'MAX' : f(need) + ' বাকি';
        });
    }
    function renderUser(){
        const p = me(); if (!p) return;
        const name = p.name || 'User', photo = p.photo || ph(name);
        cards.forEach(card => { const a = card.querySelector('.av'); if (a.getAttribute('src') !== photo){ a.onerror = () => { a.onerror = null; a.src = ph(name); }; a.src = photo; } });
    }
    function setLevel(n){
        cur = n; renderNumbers();
        document.querySelectorAll('.lv-gift').forEach(g => g.classList.toggle('reached', n >= +g.dataset.m));
    }
    function goTo(n, smooth){
        const c = cards[n - 1]; if (!c) return;
        cardsEl.scrollTo({ left: c.offsetLeft - (cardsEl.clientWidth - c.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
    }

    let st = null;
    cardsEl.addEventListener('scroll', () => {
        clearTimeout(st);
        st = setTimeout(() => {
            const mid = cardsEl.scrollLeft + cardsEl.clientWidth / 2; let best = 1, bd = 1e9;
            const w = cards[0].offsetWidth + 8, guess = Math.max(1, Math.min(MAXLV, Math.round((mid - cards[0].offsetLeft - w / 2) / w) + 1));
            for (let i = Math.max(1, guess - 2); i <= Math.min(MAXLV, guess + 2); i++){ const c = cards[i - 1], d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd){ bd = d; best = i; } }
            if (best !== cur) setLevel(best);
        }, 60);
    });

    function init(){
        build(); renderUser(); renderBars();
        const p = me(), start = Math.max(1, Math.min(MAXLV, Number(p && p.level) || 1));   /* শুরুতে আপনার নিজের লেভেলের কার্ড */
        setLevel(start); requestAnimationFrame(() => goTo(start, false));
        window.addEventListener('moi:sync', e => { const k = (e.detail && e.detail.key) || ''; if (k === 'moi_demo_users' || k === 'moi_user'){ renderUser(); renderBars(); renderNumbers(); } });
    }
    (window.MOIReady || Promise.resolve()).then(() => { try { init(); } catch(e){ console.error('[Level]', e); } });
})();
