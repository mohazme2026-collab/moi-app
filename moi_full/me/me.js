/* me/me.js — Me পেজ: প্রোফাইল দেখানো, বন্ধু/ফলো সংখ্যা, ID কপি, নিচের বাটন বার
   (বাটনগুলো এখন শুধু দেখতে — প্রতিটার ভিতরে কী আসবে সেটা পরে বসবে) */
(function(){
    'use strict';
    const $ = id => document.getElementById(id);
    const S = () => window.MOISync;
    const cnt = v => (Array.isArray(v) ? v.length : Object.keys(v || {}).length);
    let toastT = null;

    function toast(m){
        const t = $('meToast'); t.textContent = m; t.classList.add('show');
        clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800);
    }
    const ph = n => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2d6a63"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#fff">' + String(n || 'U').charAt(0).toUpperCase() + '</text></svg>');

    function profile(){ const p = window.MOIAuth && MOIAuth.profile; return p && p.uid ? p : null; }

    function render(){
        const p = profile(); if (!p) return;
        const av = $('meAvatar'); av.src = p.photo || ph(p.name); av.onerror = () => { av.onerror = null; av.src = ph(p.name); };
        if (window.MOICrown){ const mv = document.querySelector('.me-av'); MOICrown.attachUser(mv, p); mv.classList.toggle('has-ring', !!mv.querySelector(':scope > .cv')); }   /* ব্যাগ থেকে পরা স্টোর-রিং বা SVIP মুকুট */
        $('meName').textContent = p.name || 'User';
        $('meId').textContent = p.moiId || '——';
        const uid = p.uid;
        $('numFollowing').textContent = cnt(S().get('moi_follow_' + uid + '_following', {}));
        $('numFollowers').textContent = cnt(S().get('moi_follow_' + uid + '_followers', {}));
        /* লাল ডট: না-পড়া মেসেজ বা বন্ধুর অনুরোধ থাকলে */
        const metas = S().get('moi_chat_meta_' + uid, {}) || {}; let n = cnt(S().get('moi_friend_requests_' + uid, {}));
        Object.keys(metas).forEach(k => { n += Number(metas[k] && metas[k].unread) || 0; });
        $('meDot').hidden = n <= 0;
    }

    function copyId(){
        const id = ($('meId').textContent || '').trim(); if (!id || id === '——') return;
        const done = () => toast('ID কপি হয়েছে');
        try { navigator.clipboard.writeText(id).then(done, fallback); } catch(e){ fallback(); }
        function fallback(){ const t = document.createElement('textarea'); t.value = id; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch(e){} t.remove(); done(); }
    }

    function nav(){
        const U = window.URLS || { home: '../home/index.html' };
        $('navRoom') && $('navRoom').addEventListener('click', () => { location.href = U.home; });
        $('navChat') && $('navChat').addEventListener('click', () => { location.href = U.home + (U.home.indexOf('?') < 0 ? '?chat=1' : '&chat=1'); });
        $('navMe') && $('navMe').addEventListener('click', () => $('navMe').classList.add('on'));
    }

    function init(){
        try { nav(); } catch(e){ console.warn('nav', e); }      /* নিচের বাটন আগে — render এ ভুল হলেও কাজ করবে */
        try { render(); } catch(e){ console.warn('render', e); }
        $('btnCopy').addEventListener('click', copyId);
        /* প্রোফাইল ছবিতে টিপলে ফুল স্ক্রিন প্রোফাইল পেজ খোলে */
        const av = document.querySelector('.me-av'); if (av){ av.style.cursor = 'pointer'; av.addEventListener('click', () => { location.href = 'profile/myprofile.html'; }); }
        /* Following / Followers সংখ্যায় টিপলে সেই তালিকার পেজ খোলে (me/follow.js) */
        document.querySelectorAll('.me-stat').forEach(b => b.addEventListener('click', () => { if (window.MOIFollow) MOIFollow.open(b.dataset.k); }));
        /* নিচের বাটনগুলো → নিজের নিজের পেজ */
        const go = (sel, url) => { const b = document.querySelector(sel); if (b) b.addEventListener('click', () => { location.href = url; }); };
        go('.qk[data-k="store"]', 'store/index.html');
        go('.qk[data-k="vip"]', 'vip/index.html');
        go('.row[data-k="level"]', 'level/index.html');
        go('.row[data-k="bag"]', 'bag/index.html');
        go('.row[data-k="control"]', 'control/index.html');
        go('.row[data-k="visitor"]', 'visitor/index.html');
        go('.row[data-k="feedback"]', 'feedback/index.html');
        /* সেটিংস আইকন: পরে নিজের পেজ বসবে — আপাতত থিম (ব্যাকগ্রাউন্ড রঙ) বদলানোর বক্স খোলে */
        $('btnGear').addEventListener('click', () => { if (window.MOISettings) MOISettings.open(); else if (window.MOI && MOI.openTheme) MOI.openTheme(); });
        /* বাকি সব বাটন আপাতত শুধু দেখতে (টিপলে ছোট অ্যানিমেশন হয়) */
        window.addEventListener('moi:sync', e => {
            const k = (e.detail && e.detail.key) || '';
            if (/^moi_(friends|follow|chat_meta|friend_requests)_/.test(k) || k === 'moi_demo_users') render();
        });
        setInterval(render, 4000);
    }

    /* MOIReady দেরি করলেও ৪ সেকেন্ড পর বাটনগুলো চালু হবেই */
    let _started = false; const start = () => { if (_started) return; _started = true; try { init(); } catch(e){ console.error('[Me]', e); } };
    (window.MOIReady || Promise.resolve()).then(start, start); setTimeout(start, 4000);
})();
