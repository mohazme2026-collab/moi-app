/* me/svip-page.js — SVIP Privilege পেজ + SVIP List (ট্রফি আইকন)
   খোলে: Me পেজের SVIP কার্ডে (Enter) টিপলে → MOISvip.open()
   ───────── সেটিংস (দরকার হলে এখানেই বদলান) ───────── */
(function(){
    'use strict';
    const DEMO_RECHARGE = 3500;      /* ডেমোতে প্রথমবার যে পরিমাণ রিচার্জ ধরা হবে। আসল হলে 0 করে দিন */
    const VALID_DAYS = 90;              /* SVIP কতদিন চলবে */
    const LEVELS = [                    /* need = এই লেভেল চালু করতে কত ডায়মন্ড রিচার্জ লাগবে (পরে আরও লেভেল এখানে যোগ হবে) */
        { n: 1, need: 10000, c1: '#b46bff', c2: '#4a1a8a', bg: '#1a0b33', tt: ['#fff3b0', '#f2b92e'] }
    ];
    const EMB = n => 'svip/art/svip_emb' + n + '.webp', PLATE = 'svip/art/svip_plate.webp';
    
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fmt = n => Math.round(Number(n) || 0).toLocaleString('en-US');
    const short = n => (n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : fmt(n));
    const PH = n => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#4a3a2a"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#f3d27a">' + esc((n || 'U').charAt(0)) + '</text></svg>');
    const GEM = '<svg class="sv-gem" viewBox="0 0 512 512" aria-hidden="true"><path fill="url(#svGemG)" d="M116.7 33.8c4.5-6.1 11.7-9.8 19.3-9.8h240c7.6 0 14.8 3.6 19.3 9.8l112 152c6.8 9.2 6.1 21.9-1.5 30.4l-232 256c-4.5 5-11 7.9-17.8 7.9s-13.2-2.9-17.8-7.9l-232-256c-7.7-8.5-8.3-21.2-1.5-30.4zm38.5 39.8c-3.3 2.5-4.2 7-2.1 10.5l57.4 95.7L63.3 192c-4.1.3-7.3 3.8-7.3 8s3.2 7.6 7.3 8l192 16h1.3l192-16c4.1-.3 7.3-3.8 7.3-8s-3.2-7.6-7.3-8l-147.2-12.3 57.4-95.6c2.1-3.5 1.2-8.1-2.1-10.5s-7.9-2-10.7 1l-90 97.6-90.1-97.6c-2.8-3-7.4-3.4-10.7-1"/></svg>';
    const BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
    const TROPHY = '<svg viewBox="0 0 48 48"><defs><linearGradient id="svTr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".5" stop-color="#f2b92e"/><stop offset="1" stop-color="#a86a06"/></linearGradient></defs><path fill="url(#svTr)" d="M14 6h20v9c0 7-4 12-10 13-6-1-10-6-10-13zM14 9H8c0 6 2 10 7 11l-1-3c-2-1-3-3-3-5h3zm20 0h6c0 6-2 10-7 11l1-3c2-1 3-3 3-5h-3zM21 28h6v6h5v3H16v-3h5z"/><rect x="14" y="38" width="20" height="4" rx="1.5" fill="url(#svTr)"/></svg>';
    const CROWN = c => '<svg class="sv-crown" viewBox="0 0 40 28"><path d="M3 24l-1-17 9 8 9-13 9 13 9-8-1 17z" fill="' + c + '" stroke="rgba(0,0,0,.35)" stroke-width="1"/><circle cx="20" cy="4" r="2.4" fill="#fff"/></svg>';

    /* ═══ ডেটা: রিচার্জ, লেভেল, ব্যাজ লুকানো ═══ */
    const prof = () => { const p = window.MOIAuth && MOIAuth.profile; return p && p.uid ? p : null; };
    const K = { rc: u => 'moi_svip_points_' + u, lv: u => 'moi_svip_level_' + u, hide: u => 'moi_svip_hide_' + u };
    const rd = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch(e){ return d; } };
    const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };

    function points(){
        const p = prof(); if (!p) return 0;
        let v = rd(K.rc(p.uid), null);
        if (v == null){ v = DEMO_RECHARGE; wr(K.rc(p.uid), v); }
        return Number(v) || 0;
    }
    function addPoints(n){ const p = prof(); if (!p) return; wr(K.rc(p.uid), points() + (Number(n) || 0)); }
    function active(){                       /* এখন যে SVIP চালু আছে: {level, until} বা null */
        const p = prof(); if (!p) return null;
        const a = rd(K.lv(p.uid), null);
        if (a && a.until && a.until < Date.now()){ try { localStorage.removeItem(K.lv(p.uid)); } catch(e){} return null; }
        return a;
    }
    const isHidden = uid => { const p = uid || (prof() && prof().uid); return !!rd(K.hide(p), false); };

    /* ═══ ছোট SVIP পিল (লিস্টে নামের নিচে) ═══ */
    function pillLevel(pts){ let n = 0; LEVELS.forEach(L => { if (pts >= L.need) n = L.n; }); return n || 1; }
    const pill = n => '<span class="sv-pill l' + n + '">SVIP' + n + '</span>';

    /* ═══ মূল পেজ ═══ */
    let root = null, idx = 0, pushed = 0, listEl = null, helpEl = null, tT = null;
    const $ = s => root.querySelector(s);
    function toast(m){ const t = $('.sv-toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tT); tT = setTimeout(() => t.classList.remove('show'), 1900); }

    function cardHtml(L){
        const pts = points(), a = active();
        const pc = Math.max(0, Math.min(100, (pts / L.need) * 100));
        const left = Math.max(0, L.need - pts), isCur = a && a.level === L.n;
        return '<div class="sv-slide" data-n="' + L.n + '"><div class="sv-plate"><img class="pl-bg" src="' + PLATE + '" alt="" draggable="false">' +
            '<i class="pl-glint"></i><img class="pl-emb" src="' + EMB(L.n) + '" alt="SVIP' + L.n + '" draggable="false">' +
            '<div class="pl-info"><div class="pl-rc">Recharged: ' + fmt(pts) + ' ' + GEM + '</div>' +
            '<div class="pl-row"><div class="pl-bar"><i style="width:' + pc.toFixed(1) + '%"></i></div><span class="pl-n">SVIP' + L.n + '</span>' +
            '<span class="pl-left">' + fmt(left) + '</span>' + GEM + '<button class="pl-act' + (isCur ? ' on' : '') + '" data-act="activate" data-n="' + L.n + '">' + (isCur ? 'Activated' : 'Activate') + '</button></div></div></div></div>';
    }
    function slidesHtml(){
        return LEVELS.map(cardHtml).join('') + '<div class="sv-slide" data-n="2"><div class="sv-plate tuned"><img class="pl-bg" src="' + PLATE + '" alt="" draggable="false"><div class="pl-st">Stay Tuned</div></div></div>';
    }
    function lineHtml(){
        return LEVELS.map(L => '<button class="sv-nd" data-act="goto" data-i="' + (L.n - 1) + '"><em>' + short(L.need) + '</em><i></i><b>SVIP' + L.n + '</b></button>').join('');
    }
    function setIndex(i, fromScroll){
        idx = i;
        root.querySelectorAll('.sv-nd').forEach((b, k) => b.classList.toggle('on', k === i));
        if (!fromScroll) scrollTo(i, true);
    }
    function scrollTo(i, smooth){
        const tr = $('.sv-track'), s = tr.children[i]; if (!s) return;
        tr.scrollTo({ left: s.offsetLeft - (tr.clientWidth - s.clientWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
    }
    function refreshCards(){
        const tr = $('.sv-track'), keep = tr.scrollLeft; tr.innerHTML = slidesHtml(); tr.scrollLeft = keep;
        const p = prof(); $('.sv-hide input').checked = p ? isHidden(p.uid) : false;
        syncMe(); renderPriv();
    }
    /* ═══ সুবিধার প্যানেল — প্রতিটা আইটেম: ছবি + নাম + কী করলে পাবে ═══ */
    function renderPriv(){
        const g = $('.sv-grid'); if (!g) return;
        const p = prof(), a = active(), ok = !!a && a.level >= 1 || points() >= LEVELS[0].need;
        const av = (p && (p.photo || p.avatar)) || window.FALLBACK_IMG || '';
        const items = [
            { n: 'SVIP1 Ring', s: ok ? 'Unlocked' : 'Recharge ' + fmt(LEVELS[0].need) + ' ' + GEM, ring: true },
            { n: 'SVIP1 Entry', s: ok ? 'Unlocked' : 'Recharge ' + fmt(LEVELS[0].need) + ' ' + GEM, entry: '../shared/svip/levels/level1/entry_poster.webp' },
            { n: 'SVIP1 Chat', s: ok ? 'Unlocked' : 'Recharge ' + fmt(LEVELS[0].need) + ' ' + GEM, chat: true },
            { n: 'SVIP1 Card', s: ok ? 'Unlocked' : 'Recharge ' + fmt(LEVELS[0].need) + ' ' + GEM, card: true }
        ];
        g.innerHTML = items.map(it =>
            '<div class="sv-it' + (ok ? ' ok' : '') + '"><div class="sv-it-art">' +
            (it.card && window.MOICard ? '<div style="width:100%">' + MOICard.preview('svip1') + '</div>' : it.chat && window.MOIChatFx ? '<div style="width:100%;padding:0 4px">' + MOIChatFx.preview('svip1', 'Hello') + '</div>' : it.entry ? '<img class="sv-it-fx" src="' + it.entry + '" alt="" draggable="false" style="width:100%;height:100%;object-fit:contain">'
                      : '<div class="sv-it-av"><img src="' + av + '" alt="" draggable="false"></div>') + '</div>' +
            '<div class="sv-it-n">' + it.n + '</div><div class="sv-it-s">' + it.s + '</div></div>').join('');
        if (window.MOICrown) g.querySelectorAll('.sv-it-av').forEach(h => MOICrown.attach(h, 'svip1'));
    }
    function syncMe(){                       /* Me পেজের কার্ডে লেভেলের নাম */
        const t = document.querySelector('.svip-t'), a = active();
        if (t) t.textContent = 'SVIP' + (a ? a.level : 1);
    }

    function activate(n){
        const L = LEVELS[n - 1], pts = points(), a = active();
        if (a && a.level === n){ toast('SVIP' + n + ' is already active'); return; }
        if (pts < L.need){ toast('Recharge ' + fmt(L.need - pts) + ' more to activate SVIP' + n); return; }
        const p = prof(); if (!p) return;
        wr(K.rc(p.uid), 0);                                  /* আপগ্রেড হলে পয়েন্ট শূন্য হয় (নিয়মে লেখা) */
        wr(K.lv(p.uid), { level: n, until: Date.now() + VALID_DAYS * 86400000 });
        refreshCards(); toast('SVIP' + n + ' activated for ' + VALID_DAYS + ' days');
    }

    function build(){
        root = document.createElement('div'); root.className = 'sv'; root.id = 'svipPage';
        root.innerHTML =
            '<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="svGemG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#9be8ff"/><stop offset=".7" stop-color="#36b4ff"/><stop offset="1" stop-color="#1a6fe0"/></linearGradient></defs></svg>' +
            '<div class="sv-fx"></div>' +
            '<header class="sv-top"><button class="sv-back" data-act="back" aria-label="Back">' + BACK + '</button>' +
            '<div class="sv-title">SVIP Privilege<button class="sv-q" data-act="help" aria-label="Info">?</button></div>' +
            '<button class="sv-trophy" data-act="list" aria-label="SVIP List">' + TROPHY + '</button></header>' +
            '<div class="sv-body"><div class="sv-track"></div>' +
            '<div class="sv-line">' + lineHtml() + '</div>' +
            '<div class="sv-panel"><div class="sv-rib"><span>SVIP Privilege</span></div><div class="sv-grid"></div></div></div>' +
            '<label class="sv-hide"><svg viewBox="0 0 32 20"><path d="M2 4c5 8 23 8 28 0M6 11l-3 5M12 14l-1 5M20 14l1 5M26 11l3 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg><span>Hide SVIP Badge in Room</span><input type="checkbox"><i></i></label>' +
            '<div class="sv-toast"></div>';
        document.body.appendChild(root);
        root.addEventListener('click', onClick);
        let st = 0;
        $('.sv-track').addEventListener('scroll', () => {
            clearTimeout(st); st = setTimeout(() => {
                const tr = $('.sv-track'), c = tr.scrollLeft + tr.clientWidth / 2; let best = 0, bd = 1e9;
                [].forEach.call(tr.children, (s, i) => { const d = Math.abs(s.offsetLeft + s.clientWidth / 2 - c); if (d < bd){ bd = d; best = i; } });
                if (best !== idx) setIndex(best, true);
            }, 70);
        });
        $('.sv-hide input').addEventListener('change', e => { const p = prof(); if (p) wr(K.hide(p.uid), e.target.checked); toast(e.target.checked ? 'SVIP badge hidden in rooms' : 'SVIP badge visible in rooms'); });
        window.addEventListener('popstate', () => {
            if (!root || !root.classList.contains('show')) return;
            if (pushed > 0) pushed--;
            if (helpEl){ closeHelp(); return; }
            if (listEl){ closeList(); return; }
            hide();
        });
    }
    function onClick(e){
        const b = e.target.closest('[data-act]'); if (!b) return;
        const a = b.dataset.act;
        if (a === 'back') close();
        else if (a === 'goto'){ setIndex(+b.dataset.i); }
        else if (a === 'activate') activate(+b.dataset.n);
        else if (a === 'help') openHelp();
        else if (a === 'list') openList();
        else if (a === 'listback') { if (pushed > 1) { try { history.back(); return; } catch(x){} } closeList(); }
    }
    function hide(){ if (!root) return; root.classList.remove('show'); document.documentElement.classList.remove('sv-lock'); closeHelp(); if (listEl){ listEl.remove(); listEl = null; } }
    function close(){ if (pushed > 0){ try { history.back(); return; } catch(e){} } hide(); }

    function openHelp(){
        if (helpEl) return;
        helpEl = document.createElement('div'); helpEl.className = 'sv-help';
        helpEl.innerHTML = '<div class="sv-hb"><p><b>1、SVIP Points</b><br>Charge 1 diamond to get 1 point</p>' +
            '<p><b>2、SVIP upgrade</b><br>SVIP points will be upgraded immediately after reaching a new level. After upgrading, the points will be cleared. SVIP is valid for ' + VALID_DAYS + ' days.</p>' +
            '<p><b>3、SVIP downgrade</b><br>After SVIP expires, the experience points between the current level and the previous level will be deducted, and the remaining total experience will determine the new SVIP level.</p></div>';
        helpEl.addEventListener('click', e => { if (e.target === helpEl) closeHelpUi(); });
        root.appendChild(helpEl);
        try { history.pushState({ moiSvipHelp: 1 }, ''); pushed++; } catch(e){}
    }
    function closeHelpUi(){ if (pushed > 1){ try { history.back(); return; } catch(e){} } closeHelp(); }
    function closeHelp(){ if (helpEl){ helpEl.remove(); helpEl = null; } }

    /* ═══ SVIP List (ট্রফি) ═══ */
    function ranking(){
        const p = prof(), rows = [], U = (window.DEMO && DEMO.USERS) || {};
        const uids = Object.keys(U).filter(u => U[u] && U[u].name && (!p || u !== p.uid));
        uids.forEach((u, i) => {
            const h = ((i * 2654435761) >>> 0) % 1000;                          /* সবসময় একই সংখ্যা */
            const v = Math.round(3.3e6 * Math.pow(0.86, i) * (0.9 + h / 5000));
            rows.push({ uid: u, name: U[u].name, photo: U[u].photo, pts: v });
        });
        const mine = { uid: p ? p.uid : '', name: p ? p.name : 'You', photo: p ? p.photo : '', pts: points(), me: true };
        rows.push(mine);
        rows.sort((a, b) => b.pts - a.pts);
        rows.forEach((r, i) => { r.rank = i + 1; });
        return { rows: rows.slice(0, 50), mine, all: rows };
    }
    const av = r => '<img src="' + esc(r.photo || PH(r.name)) + '" onerror="this.onerror=null;this.src=\'' + PH(r.name) + '\'" alt="">';
    function openList(){
        if (listEl) return;
        const R = ranking(), top = R.rows.slice(0, 3), rest = R.rows.slice(3);
        const slot = (r, k, crown) => r ? '<div class="sv-pd p' + k + '"><div class="sv-pa">' + CROWN(crown) + av(r) + '</div>' + pill(pillLevel(r.pts)) + '<b class="sv-pn2">' + esc(r.name) + '</b><span class="sv-pv2">' + fmt(r.pts) + ' ' + GEM + '</span></div>' : '';
        const idxMine = R.all.indexOf(R.mine), above = idxMine > 0 ? R.all[idxMine - 1] : null;
        listEl = document.createElement('section'); listEl.className = 'sv-list';
        listEl.innerHTML = '<div class="sv-fx"></div><header class="sv-top"><button class="sv-back" data-act="listback" aria-label="Back">' + BACK + '</button><div class="sv-title">SVIPList</div><span class="sv-sp"></span></header>' +
            '<div class="sv-ls"><div class="sv-podium"><i class="sv-tri"></i>' + slot(top[1], 2, '#cfe3ff') + slot(top[0], 1, '#ffd34a') + slot(top[2], 3, '#ff9a5c') +
            '<span class="sv-n n2">2</span><span class="sv-n n1">1</span><span class="sv-n n3">3</span></div>' +
            '<div class="sv-rows">' + rest.map(r => '<div class="sv-row' + (r.me ? ' me' : '') + '"><span class="rk">' + r.rank + '</span><span class="ra">' + av(r) + '</span><div class="rt"><b>' + esc(r.name) + '</b>' + pill(pillLevel(r.pts)) + '</div><span class="rv">' + fmt(r.pts) + ' ' + GEM + '</span></div>').join('') + '</div></div>' +
            '<div class="sv-mine"><span class="rk">' + (R.mine.rank <= 50 ? R.mine.rank : '-') + '</span><span class="ra">' + av(R.mine) + '</span><b class="mn">' + esc(R.mine.name) + '</b>' +
            '<div class="mv"><span>' + fmt(R.mine.pts) + ' ' + GEM + '</span><em>To previous place: ' + (above ? fmt(above.pts - R.mine.pts) : 0) + '</em></div></div>';
        root.appendChild(listEl);
        requestAnimationFrame(() => requestAnimationFrame(() => listEl && listEl.classList.add('in')));
        try { history.pushState({ moiSvipList: 1 }, ''); pushed++; } catch(e){}
    }
    function closeList(){
        if (!listEl) return; const el = listEl; listEl = null; el.classList.remove('in'); setTimeout(() => el.remove(), 260);
    }

    function open(){
        if (!prof()) return;
        if (!root) build();
        refreshCards();
        root.classList.add('show'); document.documentElement.classList.add('sv-lock');
        setIndex((active() ? active().level : 1) - 1);
        requestAnimationFrame(() => scrollTo(idx, false));
        try { history.pushState({ moiSvip: 1 }, ''); pushed = 1; } catch(e){ pushed = 0; }
    }

    window.MOISvip = { open, addPoints, points, active, isHidden, pill, LEVELS };

    function init(){
        syncMe();
        document.addEventListener('click', e => { if (e.target.closest('.svip')) open(); });
    }
    (window.MOIReady || Promise.resolve()).then(() => { try { init(); } catch(e){ console.error('[SVIP]', e); } });
})();
