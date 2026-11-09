/* me/wallet.js — Wallet পেজ + Official Seller (ডায়মন্ড কেনার যোগাযোগ) পেজ
   খোলে: Me পেজের Wallet বাটনে টিপলে → MOIWallet.open()
   ───────── সেলারদের তালিকা (আসল সেলার এলে শুধু এই লিস্ট বদলান) ───────── */
(function(){
    'use strict';
    const COUNTRY_NAME = 'Bangladesh', COUNTRY_CODE = 'BD';
    const SELLERS = [                    /* ডেমো সেলার — আসল ID/নাম/নাম্বার পরে বসবে */
        { id: '10021', name: 'Official Seller 1', phone: '+880 1700 000001', country: 'BD' },
        { id: '10022', name: 'Official Seller 2', phone: '+880 1700 000002', country: 'BD' },
        { id: '10023', name: 'Official Seller 3', phone: '+880 1700 000003', country: 'BD' },
        { id: '10024', name: 'Official Seller 4', phone: '+880 1700 000004', country: 'BD' }
    ];
    const ART = (function(){ const sc = document.currentScript; return sc ? sc.src.replace(/[^\/]*$/, '') : 'wallet/'; })() + 'wallet_page.webp';
    const PAYS = [['Google Pay', 570, 0], ['Visa / Master Card', 712, .5], ['bKash', 852, 1], ['Nagad', 985, 1.5], ['Razer Gold', 1120, 2]];
    const SPARKS = (function(){ let h = ''; for (let i = 0; i < 16; i++){ h += '<i class="wl-sp2" style="left:' + (6 + (i * 53) % 88) + '%;top:' + (10 + (i * 37) % 80) + '%;animation-delay:' + ((i * 0.37) % 4).toFixed(2) + 's;animation-duration:' + (2.6 + (i % 4) * .7).toFixed(1) + 's"></i>'; } return h; })();
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const PH = n => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1d5a55"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#bff5e4">' + esc((n || 'S').charAt(0)) + '</text></svg>');
    const GEMPATH = 'M116.7 33.8c4.5-6.1 11.7-9.8 19.3-9.8h240c7.6 0 14.8 3.6 19.3 9.8l112 152c6.8 9.2 6.1 21.9-1.5 30.4l-232 256c-4.5 5-11 7.9-17.8 7.9s-13.2-2.9-17.8-7.9l-232-256c-7.7-8.5-8.3-21.2-1.5-30.4zm38.5 39.8c-3.3 2.5-4.2 7-2.1 10.5l57.4 95.7L63.3 192c-4.1.3-7.3 3.8-7.3 8s3.2 7.6 7.3 8l192 16h1.3l192-16c4.1-.3 7.3-3.8 7.3-8s-3.2-7.6-7.3-8l-147.2-12.3 57.4-95.6c2.1-3.5 1.2-8.1-2.1-10.5s-7.9-2-10.7 1l-90 97.6-90.1-97.6c-2.8-3-7.4-3.4-10.7-1';
    const GEM = '<svg class="wl-gem" viewBox="0 0 512 512" aria-hidden="true"><path fill="url(#wlGemG)" d="' + GEMPATH + '"/></svg>';
    const BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
    const CHEV = '<svg class="wl-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';
    const FLAG = '<svg class="wl-flag" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#0a7a4b"/><circle cx="11" cy="12" r="6" fill="#e63946"/></svg>';
    const WA = '<svg viewBox="0 0 32 32"><path fill="none" stroke="#0d2a1c" stroke-width="2.2" d="M16 4.5a11.5 11.5 0 00-9.9 17.3L4.5 27.5l5.9-1.5A11.5 11.5 0 1016 4.5z"/><path fill="#0d2a1c" d="M12 10c-.5 0-1.2.3-1.5 1-.7 1.6.2 3.6 1.7 5.3 1.6 1.800 3.700 3 5.500 3.200.8.100 1.800-.5 2.100-1.300.1-.4 0-.7-.3-.9l-1.900-.9c-.3-.1-.6 0-.8.200l-.6.700c-1.100-.4-2.700-1.700-3.200-2.800l.6-.7c.2-.2.2-.5.1-.8l-.8-1.900c-.1-.3-.4-.5-.9-.5z"/></svg>';
    const COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 012-2h9"/></svg>';
    const SELLER_LOGO = '<svg class="wl-lg" viewBox="0 0 64 64"><defs><linearGradient id="wlLg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".5" stop-color="#f2b92e"/><stop offset="1" stop-color="#a86a06"/></linearGradient><linearGradient id="wlLb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7ff0c9"/><stop offset="1" stop-color="#14a37a"/></linearGradient></defs>' +
        '<path d="M32 3l24 8v17c0 15-10 26-24 33C18 54 8 43 8 28V11z" fill="url(#wlLg)"/><path d="M32 9l18 6v13c0 11-7.500 19.500-18 25-10.500-5.500-18-14-18-25V15z" fill="#0b3b36"/>' +
        '<g transform="translate(17.500 14) scale(.058)"><path fill="url(#wlLb)" d="' + GEMPATH + '"/></g>' +
        '<circle cx="46" cy="46" r="9.500" fill="#1fcf86" stroke="#0b3b36" stroke-width="2"/><path d="M41.500 46l3.200 3.300 5.200-6" fill="none" stroke="#fff" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const COINS = '<svg class="wl-art" viewBox="0 0 220 150"><defs><linearGradient id="wlA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9ffff"/><stop offset=".35" stop-color="#7fe0ff"/><stop offset=".75" stop-color="#2f9bff"/><stop offset="1" stop-color="#1747b8"/></linearGradient></defs>' +
        '<g opacity=".25" fill="none" stroke="#7fe0ff"><circle cx="150" cy="70" r="58"/><circle cx="150" cy="70" r="78"/></g>' +
        '<g transform="translate(34 62) scale(.16)"><path fill="url(#wlA)" d="' + GEMPATH + '"/></g><g transform="translate(104 14) scale(.22)"><path fill="url(#wlA)" d="' + GEMPATH + '"/></g><g transform="translate(88 92) scale(.13)"><path fill="url(#wlA)" d="' + GEMPATH + '"/></g></svg>';

    const $ = s => root.querySelector(s);
    let root = null, sellers = null, sheet = null, pushed = 0, tT = null;
    const me = () => { const p = window.MOIAuth && MOIAuth.profile; return p && p.uid ? p : null; };
    function balance(){
        const p = me(); if (!p) return 0;
        let u = null; try { u = window.getUser ? getUser(p.uid) : null; } catch(e){}
        return Number((u && u.diamonds) != null ? u.diamonds : p.diamonds) || 0;
    }
    function toast(m){ const t = $('.wl-toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tT); tT = setTimeout(() => t.classList.remove('show'), 1800); }
    const setBal = () => { if (!root) return; const t = balance().toLocaleString('en-US'), el = $('.wl-bal'); el.textContent = t; el.dataset.len = t.length > 9 ? 'xl' : t.length > 7 ? 'l' : ''; };

    function build(){
        root = document.createElement('div'); root.className = 'wl'; root.id = 'walletPage'; root.style.setProperty('--wl-art', 'url("' + ART + '")');
        root.innerHTML = '<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="wlGemG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#9be8ff"/><stop offset=".7" stop-color="#36b4ff"/><stop offset="1" stop-color="#1a6fe0"/></linearGradient></defs></svg>' +
            '<div class="wl-sc"><div class="wl-stage">' +
            '<img class="wl-bg" src="' + ART + '" alt="" draggable="false">' +
            '<div class="wl-spot"></div><i class="wl-tgl"></i>' +
            '<div class="wl-balbox"><b class="wl-bal">0</b></div><i class="wl-balglow"></i>' +
            PAYS.map(p => '<button class="wl-row" data-act="pay" data-n="' + p[0] + '" style="top:' + (p[1] / 15.36).toFixed(2) + '%"><i class="wl-gl" style="animation-delay:' + p[2] + 's"></i></button>').join('') +
            '<button class="wl-sell2" data-act="seller" style="top:' + (1268 / 15.36).toFixed(2) + '%"><i class="wl-gl" style="animation-delay:2.4s"></i>' + SELLER_LOGO + '<span class="tx"><b>Official Seller</b><small>Buy diamonds from verified sellers</small></span>' + CHEV + '</button>' +
            SPARKS + '</div></div>' +
            '<button class="wl-back" data-act="back" aria-label="Back">' + BACK + '</button>' +
            '<div class="wl-toast"></div>';
        document.body.appendChild(root);
        root.addEventListener('click', onClick);
        window.addEventListener('moi:diamonds', setBal);
        window.addEventListener('moi:sync', e => { const k = e.detail && e.detail.key; if (k && /diamond|users/i.test(k)) setBal(); });
        window.addEventListener('popstate', () => {
            if (!root || !root.classList.contains('show')) return;
            if (pushed > 0) pushed--;
            if (sheet){ closeSheet(); return; }
            if (sellers){ closeSellers(); return; }
            hide();
        });
    }
    function onClick(e){
        const b = e.target.closest('[data-act]'); if (!b) return;
        const a = b.dataset.act;
        if (a === 'back') close();
        else if (a === 'refresh'){ b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin'); setBal(); }
        else if (a === 'country') toast('More countries coming soon');
        else if (a === 'pay') toast(b.dataset.n + ' — coming soon');
        else if (a === 'seller') openSellers();
        else if (a === 'sback'){ if (pushed > 1){ try { history.back(); return; } catch(x){} } closeSellers(); }
        else if (a === 'copy') copy(b.dataset.v);
        else if (a === 'wa') openSheet(+b.dataset.i);
        else if (a === 'sclose') closeSheetUi();
    }
    function copy(v){
        const done = () => toast('Number copied');
        try { navigator.clipboard.writeText(v).then(done, fb); } catch(e){ fb(); }
        function fb(){ const t = document.createElement('textarea'); t.value = v; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch(e){} t.remove(); done(); }
    }
    function hide(){ if (!root) return; root.classList.remove('show'); document.documentElement.classList.remove('wl-lock'); if (sheet){ sheet.remove(); sheet = null; } if (sellers){ sellers.remove(); sellers = null; } }
    function close(){ if (pushed > 0){ try { history.back(); return; } catch(e){} } hide(); }

    function avatar(s, i){
        const U = (window.DEMO && DEMO.USERS) || {}, k = Object.keys(U).filter(u => U[u] && U[u].photo);
        return s.photo || (k.length ? U[k[(i * 5 + 3) % k.length]].photo : '') || PH(s.name);
    }
    function openSellers(){
        if (sellers) return;
        sellers = document.createElement('section'); sellers.className = 'wl-pg';
        sellers.innerHTML = '<header class="wl-top"><button class="wl-back" data-act="sback" aria-label="Back">' + BACK + '</button><div class="wl-title">Diamonds Service</div><span class="wl-sp"></span></header><div class="wl-sc">' +
            SELLERS.map((s, i) => '<div class="wl-sl"><div class="wl-sh"><img src="' + esc(avatar(s, i)) + '" onerror="this.onerror=null;this.src=\'' + PH(s.name) + '\'" alt=""><div class="in"><b>' + GEM + '<span>' + esc(s.name) + '</span></b><small>ID:' + esc(s.id) + '</small></div><span class="cc">' + esc(s.country || COUNTRY_CODE) + FLAG + '</span></div>' +
                '<div class="wl-ph"><span>WhatsApp: ' + esc(s.phone) + '</span><button data-act="copy" data-v="' + esc(s.phone) + '" aria-label="Copy">' + COPY + '</button></div>' +
                '<button class="wl-wa" data-act="wa" data-i="' + i + '">' + WA + 'WhatsApp</button></div>').join('') + '</div>';
        root.appendChild(sellers);
        requestAnimationFrame(() => requestAnimationFrame(() => sellers && sellers.classList.add('in')));
        try { history.pushState({ moiWlS: 1 }, ''); pushed++; } catch(e){}
    }
    function closeSellers(){ if (!sellers) return; const el = sellers; sellers = null; el.classList.remove('in'); setTimeout(() => el.remove(), 260); }

    function openSheet(i){
        if (sheet) return; const s = SELLERS[i]; if (!s) return;
        sheet = document.createElement('div'); sheet.className = 'wl-sheet';
        sheet.innerHTML = '<div class="bx"><div class="hd"><img src="' + esc(avatar(s, i)) + '" onerror="this.onerror=null;this.src=\'' + PH(s.name) + '\'" alt=""><div><b>' + esc(s.name) + '</b><small>ID:' + esc(s.id) + ' · ' + esc(s.phone) + '</small></div></div>' +
            '<div class="bub">Hi, I want to buy diamonds.</div><div class="soon">' + WA.replace('#0d2a1c', '#7ff0c9') + '<span>WhatsApp messaging is coming soon.<br>This is a demo panel — the update is on its way.</span></div>' +
            '<button class="ok" data-act="sclose">OK</button></div>';
        sheet.addEventListener('click', e => { if (e.target === sheet) closeSheetUi(); });
        root.appendChild(sheet);
        requestAnimationFrame(() => sheet && sheet.classList.add('in'));
        try { history.pushState({ moiWlSheet: 1 }, ''); pushed++; } catch(e){}
    }
    function closeSheetUi(){ if (pushed > 1){ try { history.back(); return; } catch(e){} } closeSheet(); }
    function closeSheet(){ if (!sheet) return; const el = sheet; sheet = null; el.classList.remove('in'); setTimeout(() => el.remove(), 220); }

    function open(){
        if (!me()) return;
        if (!root) build();
        setBal();
        root.classList.add('show'); document.documentElement.classList.add('wl-lock');
        try { history.pushState({ moiWl: 1 }, ''); pushed = 1; } catch(e){ pushed = 0; }
    }
    window.MOIWallet = { open, SELLERS };

    function init(){ document.addEventListener('click', e => { if (e.target.closest('.qk[data-k="wallet"]')) open(); }); }
    (window.MOIReady || Promise.resolve()).then(() => { try { init(); } catch(e){ console.error('[Wallet]', e); } });
})();
