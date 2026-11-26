/* chat/inbox.js — মেসেজ পেজের ৪টা সাব-পেজ */
(function(){
    var cur = null;
    function K(n){ return 'moi_' + n + '_' + (window.me ? window.me.uid : ''); }
    function seed(){
        if (!window.me || ls_get(K('msgseed'), 0)) return;
        var us = Object.values(allUsers || {}).filter(function(u){ return u && u.uid && u.uid !== window.me.uid && u.name; }).slice(0, 3);
        ls_set(K('inbox_feed'), us.map(function(u, i){ return { uid: u.uid, name: u.name, photo: u.photo || u.avatar || GUEST_AVATAR, text: 'আপনার ফিডে লাইক দিয়েছে', ts: Date.now() - (i + 1) * 3600e3, seen: false }; }));
        ls_set(K('inbox_sys'), (ls_get(K('inbox_sys'), []) || []).concat([{ id: 'd1', title: 'ডেইলি লগইন', body: 'ডেইলি লগইন পুরস্কার +৪০ কয়েন', ts: Date.now() - 600e3, seen: false }]));
        ls_set(K('inbox_notices'), [{ id: 'n1', title: 'MOI-তে স্বাগতম!', body: 'নতুন ফিচার ও ইভেন্টের খবর এখানে পাবেন।', go: 'GO>', ts: Date.now() - 86400e3, seen: false }]);
        ls_set(K('msgseed'), 1);
    }
    function cnt(arr){ return (arr || []).filter(function(x){ return !x.seen; }).length; }
    window.updateInboxBadges = function(){
        if (!window.me) return;
        var m = { feed: cnt(ls_get(K('inbox_feed'), [])), friends: Object.keys(myRequests || {}).length, assistant: cnt(ls_get(K('inbox_sys'), [])), notices: cnt(ls_get(K('inbox_notices'), [])) };
        Object.keys(m).forEach(function(k){ var e = document.getElementById('bd_' + k); if (!e) return; e.textContent = m[k] > 99 ? '99+' : m[k]; e.classList.toggle('show', m[k] > 0); });
    };
    function dt(ts){ var d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    function empty(t){ return '<div class="empty"><div class="big">📭</div>' + t + '</div>'; }
    function render(){
        var body = document.getElementById('subBody'), act = document.getElementById('subAct'), h = '';
        act.textContent = '';
        if (cur === 'feed'){
            var L = ls_get(K('inbox_feed'), []);
            h = L.length ? L.map(function(x){ return '<div class="sp-row"><img class="av" src="' + esc(x.photo) + '"><div class="t"><div class="n">' + esc(x.name) + '</div><div class="m">❤️ ' + esc(x.text) + '</div></div><div class="r">' + esc(timeAgo(x.ts)) + '</div></div>'; }).join('') : empty('এখনো কোনো লাইক নেই');
        } else if (cur === 'friends'){
            var P = Object.values(myRequests || {}), H = Object.values(ls_get('moi_fr_hist_' + window.me.uid, {}) || {});
            act.textContent = (P.length || H.length) ? 'ক্লিয়ার' : '';
            h = P.map(function(r){ return '<div class="sp-row"><img class="av" src="' + esc(r.fromPhoto || GUEST_AVATAR) + '"><div class="t"><div class="n">' + esc(r.fromName || 'User') + '</div><div class="m">আপনাকে বন্ধু হতে চায়</div></div><button class="sp-btn no" onclick="frDecline(\'' + esc(r.fromUid) + '\')">বাতিল</button><button class="sp-btn ok" onclick="acceptRequest(\'' + esc(r.fromUid) + '\');renderSub()">রাজি</button></div>'; }).join('') +
                H.map(function(r){ return '<div class="sp-row"><img class="av" src="' + esc(r.fromPhoto || GUEST_AVATAR) + '"><div class="t"><div class="n">' + esc(r.fromName) + '</div><div class="m">আপনাকে বন্ধু হতে চেয়েছিল</div></div><span class="sp-done">রাজি হয়েছেন</span></div>'; }).join('');
            if (!h) h = empty('কোনো ফ্রেন্ড রিকোয়েস্ট নেই');
        } else if (cur === 'assistant'){
            var S = ls_get(K('inbox_sys'), []), last = '';
            h = S.length ? S.map(function(x){ var d = dt(x.ts), hd = d !== last ? '<div class="sp-date">' + d + '</div>' : ''; last = d; return hd + '<div class="sp-card"><div class="h">' + (x.img ? '<img src="' + esc(x.img) + '" style="height:26px;vertical-align:middle;margin-right:6px">' : '') + esc(x.title) + (x.amt ? ' <b style="color:#2fe08a">+' + Number(x.amt).toLocaleString() + ' 💎</b>' : '') + '</div><div class="b">' + esc(x.body) + '</div></div>'; }).join('') : empty('কোনো মেসেজ নেই');
        } else {
            var N = (ls_get('moi_staff_notices', []) || []).concat(ls_get(K('inbox_notices'), []));
            h = N.length ? N.map(function(x){ return '<div class="sp-post"><div class="poster">🎉</div><div class="pb"><div class="h">' + esc(x.title) + '</div><div class="b">' + esc(x.body) + '</div><span class="go" onclick="toast(\'শীঘ্রই আসছে\')">' + esc(x.go || 'GO>') + '</span></div></div>'; }).join('') : empty('কোনো নোটিফিকেশন নেই');
        }
        body.innerHTML = h;
    }
    window.renderSub = function(){ if (window.loadFriendsData) loadFriendsData(); render(); window.updateInboxBadges(); };
    window.openSub = function(t){
        cur = t; seed();
        var T = { feed: 'ফিড মেসেজ', friends: 'ফ্রেন্ড রিকোয়েস্ট', assistant: 'সিস্টেম অ্যাসিস্ট্যান্ট', notices: 'সিস্টেম নোটিফিকেশন' };
        document.getElementById('subTitle').textContent = T[t];
        document.getElementById('mainScreen').classList.remove('show');
        document.getElementById('subScreen').classList.add('show');
        render();
        var map = { feed: 'inbox_feed', assistant: 'inbox_sys', notices: 'inbox_notices' };
        if (map[t]){ var l = ls_get(K(map[t]), []); l.forEach(function(x){ x.seen = true; }); ls_set(K(map[t]), l); }
        window.updateInboxBadges();
    };
    window.closeSub = function(){
        document.getElementById('subScreen').classList.remove('show');
        document.getElementById('mainScreen').classList.add('show'); cur = null; window.updateInboxBadges();
    };
    window.frDecline = function(uid){
        delete myRequests[uid]; saveFriendsData(); var t = ls_get('moi_sent_requests_' + uid, {}) || {}; delete t[window.me.uid]; ls_set('moi_sent_requests_' + uid, t); renderSub();
    };
    document.addEventListener('click', function(e){
        if (e.target && e.target.id === 'subAct' && cur === 'friends' && e.target.textContent){
            Object.keys(myRequests || {}).forEach(function(u){ delete myRequests[u]; });
            saveFriendsData(); ls_set('moi_fr_hist_' + window.me.uid, {}); renderSub();
        }
    });
    window.addEventListener('load', function(){ setTimeout(function(){ seed(); window.updateInboxBadges(); }, 700); });
})();
