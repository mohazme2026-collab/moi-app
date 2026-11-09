/* me/follow.js — Following / Followers পেজ (Me পেজের সংখ্যায় টিপলে খোলে)
   • Following ট্যাব : আমি যাদের ফলো করেছি — তারা আমাকেও ফলো করলে "Friends", না করলে "Following"
   • Followers ট্যাব : যারা আমাকে ফলো করেছে — আমিও করলে "Friends", না করলে লাল "Follow back"
   • "..." বাটনে: Unfollow / Block
   ডেটা আগের মতোই: moi_follow_<uid>_following আর moi_follow_<uid>_followers (MOISync দিয়ে) */
(function(){
    'use strict';

    /* ═══ ⚙️ সেটিংস ═══ */
    const DEMO_SEED = true;     /* true = চেক করার জন্য ডেমো ফলো/ফলোয়ার বসবে (একবারই)। আসল ডেটা ফেরালে false দিন */
    const DEMO_FOLLOWING = 14;  /* ডেমোতে আমি কতজনকে ফলো করব */
    const DEMO_FOLLOWERS = 22;  /* ডেমোতে কতজন আমাকে ফলো করবে */
    const DEMO_MUTUAL = 8;      /* এর মধ্যে কতজন দুই দিকেই (Friends) */

    const S = () => window.MOISync;
    const meProfile = () => (window.MOIAuth && MOIAuth.profile && MOIAuth.profile.uid) ? MOIAuth.profile : null;
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const PH = n => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2d6a63"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#fff">' + esc(String(n || 'U').charAt(0).toUpperCase()) + '</text></svg>');
    const key = (uid, t) => 'moi_follow_' + uid + '_' + t;
    const arr = v => Array.isArray(v) ? v.slice() : Object.keys(v || {});
    const getList = (uid, t) => arr(S().get(key(uid, t), []));

    /* ═══ ডেটার কাজ ═══ */
    /* ফলো/আনফলো শুধু আমার নিজের following তালিকায় লিখলেই হয় — সিস্টেম নিজে অন্যজনের followers তালিকায় মিলিয়ে দেয় (sync-routes.js) */
    function follow(me, other){
        const mine = getList(me, 'following'); if (!mine.includes(other)){ mine.push(other); S().set(key(me, 'following'), mine); }
    }
    function unfollow(me, other){
        S().set(key(me, 'following'), getList(me, 'following').filter(x => x !== other));
    }
    const fdb = () => (window.MOIFB && MOIFB.db) || null;
    function block(me, other){
        const k = 'moi_blocked_' + me; let b = S().get(k, {}) || {};
        if (Array.isArray(b)){ if (!b.includes(other)) b.push(other); } else b[other] = true;
        S().set(k, b);
        unfollow(me, other);
        /* যে আমাকে ফলো করত, সেই সম্পর্কও মুছে দেওয়া (সম্ভব হলে) */
        try { const d = fdb(); if (d){ d.collection('follows/' + me + '/followers').doc(other).delete().catch(() => {}); d.collection('follows/' + other + '/following').doc(me).delete().catch(() => {}); } } catch(e){}
    }
    function userInfo(uid){
        let u = null;
        try { u = window.getUser ? getUser(uid) : null; } catch(e){}
        const d = (window.DEMO && DEMO.USERS && DEMO.USERS[uid]) || null;
        u = u || d || {};
        return { uid, name: u.name || (d && d.name) || 'User', photo: u.photo || u.avatar || (d && d.photo) || '', moiId: u.moiId || (d && d.moiId) || String(uid).slice(0, 10) };
    }

    /* ═══ ডেমো ডেটা (চেক করার জন্য) ═══ */
    function seedDemo(){
        const p = meProfile(); if (!DEMO_SEED || !p || !window.DEMO || !S()) return;
        const flag = 'moi_follow_demo_seed_v1_' + p.uid;
        try { if (localStorage.getItem(flag)) return; localStorage.setItem(flag, '1'); } catch(e){}
        const pool = Object.keys(DEMO.USERS || {}).filter(u => u !== p.uid && DEMO.USERS[u] && DEMO.USERS[u].name);
        if (pool.length < 10) return;
        /* এলোমেলো কিন্তু প্রতিবার একই — uid থেকে শুরু বিন্দু */
        let st = 0; for (const c of p.uid) st = (st * 31 + c.charCodeAt(0)) >>> 0;
        const start = st % pool.length, pick = i => pool[(start + i * 7) % pool.length];
        const mutual = [], onlyFollowing = [], onlyFollowers = [];
        for (let i = 0; i < DEMO_MUTUAL; i++) mutual.push(pick(i));
        for (let i = 0; i < DEMO_FOLLOWING - DEMO_MUTUAL; i++) onlyFollowing.push(pick(100 + i));
        for (let i = 0; i < DEMO_FOLLOWERS - DEMO_MUTUAL; i++) onlyFollowers.push(pick(200 + i));
        mutual.concat(onlyFollowing).forEach(u => follow(p.uid, u));          /* আমি ফলো করি */
        const d = fdb(), now = Date.now();
        if (d) mutual.concat(onlyFollowers).forEach((u, i) => {               /* তারা আমাকে ফলো করে (ডেমো ডেটাবেসে সরাসরি) */
            const since = new Date(now - (i + 1) * 3600000);
            d.collection('follows/' + p.uid + '/followers').doc(u).set({ since }).catch(() => {});
            d.collection('follows/' + u + '/following').doc(p.uid).set({ since }).catch(() => {});
        });
    }

    /* ═══ ছবি ও চেহারা ═══ */
    let root = null, tab = 'following', query = '', keep = {}, sheetEl = null, pushed = false, toastT = null;

    function build(){
        root = document.createElement('div'); root.className = 'mf'; root.id = 'mfPage';
        root.innerHTML =
            '<header class="mf-top"><button class="mf-back" aria-label="Back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button><div class="mf-title" id="mfTitle"></div><span class="mf-sp"></span></header>' +
            '<nav class="mf-tabs"><button data-t="following"><span id="mfTF">Following 0</span></button><button data-t="followers"><span id="mfTR">Followers 0</span></button><i class="mf-bar" id="mfBar"></i></nav>' +
            '<div class="mf-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="mfQ" type="text" placeholder="Search" autocomplete="off"><button class="mf-x" id="mfX" aria-label="Clear" hidden>&times;</button></div>' +
            '<div class="mf-list" id="mfList"></div>' +
            '<div class="mf-toast" id="mfToast"></div>';
        document.body.appendChild(root);
        root.querySelector('.mf-back').onclick = close;
        root.querySelectorAll('.mf-tabs button').forEach(b => b.onclick = () => { setTab(b.dataset.t); });
        const q = root.querySelector('#mfQ'), x = root.querySelector('#mfX');
        q.addEventListener('input', () => { query = q.value.trim().toLowerCase(); x.hidden = !q.value; render(); });
        x.onclick = () => { q.value = ''; query = ''; x.hidden = true; render(); q.focus(); };
        root.querySelector('#mfList').addEventListener('click', onListClick);
        window.addEventListener('popstate', () => { if (pushed && root && root.classList.contains('show')){ pushed = false; hide(); } });
        window.addEventListener('moi:sync', e => {
            const k = (e.detail && e.detail.key) || '';
            if (root && root.classList.contains('show') && /^moi_(follow|blocked|demo_users)/.test(k)) render(true);
        });
    }

    function toast(m){
        const t = root.querySelector('#mfToast'); t.textContent = m; t.classList.add('show');
        clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1700);
    }

    function setTab(t){
        tab = t === 'followers' ? 'followers' : 'following';
        keep = {}; query = ''; const q = root.querySelector('#mfQ'); q.value = ''; root.querySelector('#mfX').hidden = true;
        root.querySelector('#mfList').scrollTop = 0;
        render();
    }

    function render(soft){
        const p = meProfile(); if (!p || !root) return;
        const fing = getList(p.uid, 'following'), fers = getList(p.uid, 'followers');
        root.querySelector('#mfTitle').textContent = p.name || 'Me';
        root.querySelector('#mfTF').textContent = 'Following ' + fing.length;
        root.querySelector('#mfTR').textContent = 'Followers ' + fers.length;
        root.querySelectorAll('.mf-tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
        const bar = root.querySelector('#mfBar'), act = root.querySelector('.mf-tabs button.on');
        if (act){ bar.style.width = act.offsetWidth + 'px'; bar.style.transform = 'translateX(' + act.offsetLeft + 'px)'; }

        let ids = tab === 'following' ? fing.slice() : fers.slice();
        if (tab === 'following') Object.keys(keep).forEach(u => { if (!ids.includes(u)) ids.push(u); });   /* এই সেশনে আনফলো করলেও সারিতে থাকে */
        ids = ids.reverse();                                                                                  /* সবচেয়ে নতুন আগে */
        const blocked = S().get('moi_blocked_' + p.uid, {}) || {};
        const bset = Array.isArray(blocked) ? blocked : Object.keys(blocked).filter(k => blocked[k]);
        const rows = ids.filter(u => !bset.includes(u)).map(userInfo).filter(u => !query || u.name.toLowerCase().includes(query) || String(u.moiId).toLowerCase().includes(query));

        const list = root.querySelector('#mfList'), sc = list.scrollTop;
        if (!rows.length){
            list.innerHTML = '<div class="mf-empty">' + (query ? 'কিছু পাওয়া যায়নি' : (tab === 'following' ? 'আপনি এখনো কাউকে ফলো করেননি' : 'এখনো কোনো ফলোয়ার নেই')) + '</div>';
            return;
        }
        const mineSet = new Set(fing), meFollowedBy = new Set(fers);
        list.innerHTML = rows.map(u => {
            const iFollow = mineSet.has(u.uid), followsMe = meFollowedBy.has(u.uid);
            let label, cls;
            if (iFollow && followsMe){ label = 'Friends'; cls = 'gray'; }
            else if (iFollow){ label = 'Following'; cls = 'gray'; }
            else if (followsMe){ label = 'Follow back'; cls = 'red'; }
            else { label = 'Follow'; cls = 'red'; }
            return '<div class="mf-row" data-u="' + esc(u.uid) + '">' +
                '<img class="mf-av" src="' + esc(u.photo || PH(u.name)) + '" onerror="this.onerror=null;this.src=\'' + PH(u.name) + '\'" alt="">' +
                '<div class="mf-tx"><div class="mf-name">' + esc(u.name) + '</div><div class="mf-id">' + esc(u.moiId) + '</div></div>' +
                '<button class="mf-btn ' + cls + '" data-a="main">' + label + '</button>' +
                '<button class="mf-more" data-a="more" aria-label="More"><i></i><i></i><i></i></button></div>';
        }).join('');
        if (soft) list.scrollTop = sc;
    }

    function onListClick(e){
        const btn = e.target.closest('[data-a]'); if (!btn) return;
        const row = btn.closest('.mf-row'), uid = row && row.dataset.u, p = meProfile(); if (!uid || !p) return;
        const u = userInfo(uid), iFollow = getList(p.uid, 'following').includes(uid);
        if (btn.dataset.a === 'more') return moreSheet(u, iFollow);
        if (iFollow) return confirmUnfollow(u);
        follow(p.uid, uid); delete keep[uid]; toast('Following ' + u.name); render(true);
    }

    /* ═══ নিচ থেকে ওঠা ছোট শিট ═══ */
    function sheet(html){
        closeSheet();
        sheetEl = document.createElement('div'); sheetEl.className = 'mf-sheet';
        sheetEl.innerHTML = '<div class="mf-card">' + html + '</div>';
        root.appendChild(sheetEl);
        requestAnimationFrame(() => sheetEl && sheetEl.classList.add('show'));
        sheetEl.addEventListener('click', e => { if (e.target === sheetEl) closeSheet(); });
        return sheetEl;
    }
    function closeSheet(){ if (sheetEl){ const s = sheetEl; sheetEl = null; s.classList.remove('show'); setTimeout(() => s.remove(), 200); } }

    function head(u){ return '<div class="mf-sh"><img src="' + esc(u.photo || PH(u.name)) + '" onerror="this.onerror=null;this.src=\'' + PH(u.name) + '\'" alt=""><b>' + esc(u.name) + '</b><span>' + esc(u.moiId) + '</span></div>'; }

    function confirmUnfollow(u){
        const s = sheet(head(u) + '<p class="mf-q">Unfollow ' + esc(u.name) + '?</p><button class="mf-act danger" data-go="un">Unfollow</button><button class="mf-act" data-go="x">Cancel</button>');
        s.querySelector('[data-go="un"]').onclick = () => { doUnfollow(u); closeSheet(); };
        s.querySelector('[data-go="x"]').onclick = closeSheet;
    }
    function doUnfollow(u){
        const p = meProfile(); if (!p) return;
        keep[u.uid] = 1; unfollow(p.uid, u.uid); toast('Unfollowed ' + u.name); render(true);
    }
    function moreSheet(u, iFollow){
        const s = sheet(head(u) +
            (iFollow ? '<button class="mf-act" data-go="un">Unfollow</button>' : '') +
            '<button class="mf-act danger" data-go="bl">Block</button><button class="mf-act" data-go="x">Cancel</button>');
        const g = k => s.querySelector('[data-go="' + k + '"]');
        if (g('un')) g('un').onclick = () => { closeSheet(); confirmUnfollow(u); };
        g('bl').onclick = () => {
            closeSheet();
            const s2 = sheet(head(u) + '<p class="mf-q">Block ' + esc(u.name) + '? তারা আর আপনার তালিকায় থাকবে না।</p><button class="mf-act danger" data-go="ok">Block</button><button class="mf-act" data-go="x">Cancel</button>');
            s2.querySelector('[data-go="ok"]').onclick = () => { const p = meProfile(); if (p){ block(p.uid, u.uid); toast(u.name + ' ব্লক করা হয়েছে'); render(true); } closeSheet(); };
            s2.querySelector('[data-go="x"]').onclick = closeSheet;
        };
        g('x').onclick = closeSheet;
    }

    /* ═══ খোলা / বন্ধ ═══ */
    function hide(){ closeSheet(); if (root){ root.classList.remove('show'); } document.documentElement.classList.remove('mf-lock'); }
    function close(){ if (pushed){ pushed = false; try { history.back(); } catch(e){} } hide(); }
    function open(which){
        if (!meProfile()) return;
        if (!root) build();
        seedDemo();
        tab = which === 'followers' ? 'followers' : 'following'; keep = {}; query = '';
        root.querySelector('#mfQ').value = ''; root.querySelector('#mfX').hidden = true;
        root.classList.add('show'); document.documentElement.classList.add('mf-lock');
        try { history.pushState({ moiFollow: 1 }, ''); pushed = true; } catch(e){ pushed = false; }
        render();
        requestAnimationFrame(() => render(true));      /* ট্যাবের নিচের দাগ ঠিক মাপে বসাতে */
    }

    window.MOIFollow = { open, close, seedDemo, resetDemo(){ const p = meProfile(); if (p){ try { localStorage.removeItem('moi_follow_demo_seed_v1_' + p.uid); } catch(e){} } } };
    (window.MOIReady || Promise.resolve()).then(() => { try { seedDemo(); } catch(e){ console.warn('[follow] seed', e); } });
})();
