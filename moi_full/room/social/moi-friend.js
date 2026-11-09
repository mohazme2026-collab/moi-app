/* room/moi-friend.js — (১) প্রোফাইল ৮০% শিট + বাড়তি তথ্য  (২) পাশের সিটে ফ্রেন্ডশিপ হাত
   ফ্রেন্ডশিপ ডেটা: ls_get('moi_friend_<ROOM_ID>') = { "uidA|uidB": মোট ডায়মন্ড }  (uid গুলো বর্ণানুক্রমে)
   লেভেল = ১ + মোট÷১০০ । দুই দিকের গিফট যোগ হয় । */
(function(){
    var FKEY = function(){ return 'moi_friend_' + (typeof ROOM_ID !== 'undefined' ? ROOM_ID : 'demo'); };
    var pairKey = function(a,b){ return a < b ? a + '|' + b : b + '|' + a; };
    var data = function(){ try { return ls_get(FKEY(), {}) || {}; } catch(e){ return {}; } };
    var level = function(t){ return 1 + Math.floor(t / 100); };
    var tier = function(l){ return l >= 100 ? 5 : l >= 50 ? 4 : l >= 25 ? 3 : l >= 10 ? 2 : 1; };
    var TIER_NAME = ['', 'নতুন বন্ধু', 'ভালো বন্ধু', 'ঘনিষ্ঠ বন্ধু', 'সোনার বন্ধুত্ব', 'রাজকীয় বন্ধুত্ব'];
    var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
    var who = function(uid){
        var s = (state.seats || []).find(function(x){ return x && x.uid === uid; });
        var l = (state.listeners || []).find(function(x){ return x.uid === uid; });
        var u = getUser(uid) || {};
        return { name: (s && s.name) || (l && l.name) || u.name || 'User', avatar: (s && s.avatar) || (l && l.avatar) || u.photo || u.avatar || '' };
    };
    window.moiFriendData = data;

    var HAND_SVG = '<svg viewBox="4.5 6 55 31" aria-hidden="true"><defs><linearGradient id="mfA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9b186"/><stop offset="1" stop-color="#c4865a"/></linearGradient><linearGradient id="mfB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbd9b6"/><stop offset="1" stop-color="#e6ac80"/></linearGradient></defs><g class="sh" stroke-linejoin="round" stroke-linecap="round"><path d="M10 14 L29 12 Q37 11.5 41.5 16 L45.5 21.5 Q47 24.5 44 25.8 L36 28 L10 29 Z" fill="url(#mfA)" stroke="#8a5232" stroke-width=".9"/><path d="M54 14 L38 12.5 Q30.5 12.5 26.5 16.5 L23 20.5 Q21.5 22.8 23.5 24.2 L26 25.6 Q25.2 27.8 27.6 29 Q27 31.6 30 32.2 Q30.6 35 33.8 34.2 Q36.5 33.4 39.5 31.5 L54 29.5 Z" fill="url(#mfB)" stroke="#8a5232" stroke-width=".9"/><path d="M40 12.6 Q37 8.2 31.6 9.2 Q28.2 10 29 13.2 Q34 12.6 38 15.2 Z" fill="#fde3c4" stroke="#8a5232" stroke-width=".9"/><path d="M26 25.6 Q30 25.4 33 27 M27.6 29 Q31.4 28.8 35 30.4 M30 32.2 Q34 32 37.4 33" fill="none" stroke="#8a5232" stroke-width=".8"/><path d="M41 15.2 L50 15.8 M30.5 11.3 Q33.5 10.6 36.5 11.6" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.2"/><path d="M12 27.5 L34 26.5" fill="none" stroke="#7a4426" stroke-opacity=".25" stroke-width="1.2"/><rect x="5.5" y="11" width="6.6" height="22" rx="2.4" fill="var(--fc1)" stroke="var(--fd)" stroke-width=".9"/><path d="M7.6 13.5 V30.5" stroke="#fff" stroke-opacity=".55" stroke-width="1.3" fill="none"/><rect x="51.9" y="11" width="6.6" height="22" rx="2.4" fill="var(--fc1)" stroke="var(--fd)" stroke-width=".9"/><path d="M54 13.5 V30.5" stroke="#fff" stroke-opacity=".55" stroke-width=".9" fill="none"/></g></svg>';

    /* ── ফ্রেন্ডশিপ শিট ── */
    window.openFriendship = function(a, b){
        var t = data()[pairKey(a, b)] || 0, lv = level(t), tr = tier(lv), A = who(a), B = who(b);
        var pct = t % 100;
        var h = '<div class="fs-wrap t' + tr + '">'
            + '<div class="fs-pair"><div class="u"><img src="' + esc(A.avatar) + '"><div>' + esc(A.name) + '</div></div>'
            + '<div class="fs-link">' + HAND_SVG + '</div>'
            + '<div class="u"><img src="' + esc(B.avatar) + '"><div>' + esc(B.name) + '</div></div></div>'
            + '<div class="fs-lv">Friendship Lv.' + lv + '</div><div class="fs-tier">' + TIER_NAME[tr] + '</div>'
            + '<div class="fs-dia">💎 ' + t.toLocaleString() + '</div>'
            + '<div class="fs-bar"><i style="width:' + pct + '%"></i></div>'
            + '<div class="fs-next">পরের লেভেলে যেতে আরও ' + (100 - pct) + ' 💎 লাগবে · ১০০ 💎 = ১ লেভেল</div></div>';
        moiSheet('<i class="fa-solid fa-handshake-angle"></i> ফ্রেন্ডশিপ', h);
    };

    /* ── হাত বসানো ── */
    function layer(){
        var grid = document.getElementById('seatsGrid');
        if (!grid) return null;
        var host = grid.parentElement;
        if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
        var L = document.getElementById('moiHands');
        if (!L){ L = document.createElement('div'); L.id = 'moiHands'; }
        if (L.parentElement !== host) host.appendChild(L);
        return L;
    }
    function place(){
        var L = layer(); if (!L) return;
        var host = L.parentElement, hr = host.getBoundingClientRect(), d = data(), out = '';
        var els = {};
        document.querySelectorAll('#seatsGrid .seat[data-seat]').forEach(function(e){ els[+e.dataset.seat] = e; });
        Object.keys(els).forEach(function(k){
            var i = +k, A = els[i], B = els[i + 1];
            if (!B || !A.dataset.uid || !B.dataset.uid) return;
            var av = A.querySelector('.seat-avatar'), bv = B.querySelector('.seat-avatar');
            if (!av || !bv) return;
            var ra = av.getBoundingClientRect(), rb = bv.getBoundingClientRect();
            if (Math.abs(ra.top - rb.top) > 8 || rb.left < ra.left) return;        /* শুধু একই সারি */
            if (window.moiIsCp && moiIsCp(A.dataset.uid, B.dataset.uid)) return;
            var t = d[pairKey(A.dataset.uid, B.dataset.uid)] || 0; if (t <= 0) return;
            var lv = level(t);
            var gap = rb.left - ra.right;
            var w = Math.max(18, Math.min(26, Math.round(gap + 2))), hh = Math.round(w * 0.58);
            var x = (ra.right + rb.left) / 2 - hr.left, y = ra.top + ra.height / 2 - hr.top;
            out += '<div class="fhand t' + tier(lv) + '" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + hh + 'px" data-a="' + esc(A.dataset.uid) + '" data-b="' + esc(B.dataset.uid) + '">' + HAND_SVG + '</div>';
        });
        if (L.__h !== out){ L.__h = out; L.innerHTML = out; }
    }
    document.addEventListener('click', function(e){
        var h = e.target.closest && e.target.closest('.fhand');
        if (h){ e.stopPropagation(); openFriendship(h.dataset.a, h.dataset.b); }
    }, true);
    ['renderSeats'].forEach(function(n){
        var o = window[n]; if (typeof o !== 'function') return;
        window[n] = function(){ var r = o.apply(this, arguments); setTimeout(place, 0); return r; };
    });
    window.addEventListener('resize', place);
    window.addEventListener('moi:sync', place);
    window.addEventListener('storage', place);
    setInterval(place, 1000);
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(place, 300); });

    /* ── প্রোফাইল শিট ── */
    function wrapProfile(){
        var m = document.getElementById('userProfileModal');
        if (!m || m.querySelector('.pf-sheet')) return;
        var bk = document.createElement('div'); bk.className = 'pf-backdrop'; bk.onclick = function(){ closeUserProfile(); };
        var sh = document.createElement('div'); sh.className = 'pf-sheet';
        var grab = document.createElement('div'); grab.className = 'pf-grab';
        sh.appendChild(grab);
        while (m.firstChild) sh.appendChild(m.firstChild);
        /* বাড়তি তথ্যের জায়গা — অ্যাকশন বাটনের পর, নিচের বারের আগে */
        var more = document.createElement('div'); more.id = 'pfMore';
        var bar = sh.querySelector('#profileBottomBar'); sh.insertBefore(more, bar);
        m.appendChild(bk); m.appendChild(sh);
        /* নিচে টেনে বন্ধ */
        var y0 = null;
        sh.addEventListener('touchstart', function(e){ y0 = sh.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
        sh.addEventListener('touchmove', function(e){
            if (y0 == null) return;
            var dy = e.touches[0].clientY - y0;
            if (dy > 0 && sh.scrollTop <= 0){ sh.style.transform = 'translateY(' + dy + 'px)'; sh.style.transition = 'none'; }
        }, { passive: true });
        sh.addEventListener('touchend', function(e){
            if (y0 == null) return;
            var dy = (e.changedTouches[0].clientY - y0); sh.style.transition = 'transform .2s'; sh.style.transform = '';
            y0 = null; if (dy > 110) closeUserProfile();
        });
    }
    function fill(uid){
        var box = document.getElementById('pfMore'); if (!box) return;
        var u = getUser(uid) || {}, s = (state.seats || []).find(function(x){ return x && x.uid === uid; });
        var l = (state.listeners || []).find(function(x){ return x.uid === uid; }) || {};
        var gs = {}; try { gs = ls_get(KEY.giftStats, {}) || {}; } catch(e){}
        var sent = ((gs[uid] || {}).history || []).reduce(function(a, h){ return a + (h.amount || 0); }, 0);
        var got = (s && s.coins) || 0;
        var role = getRoleOf(uid), RL = { owner: 'মালিক', admin: 'অ্যাডমিন', member: 'সদস্য' };
        var since = l.joined ? new Date(l.joined).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : '—';
        var d = data(), fr = [];
        Object.keys(d).forEach(function(k){ var p = k.split('|'); if (p.indexOf(uid) > -1 && d[k] > 0) fr.push({ o: p[0] === uid ? p[1] : p[0], t: d[k] }); });
        fr.sort(function(a, b){ return b.t - a.t; });
        var frH = fr.length ? fr.map(function(f){ var w = who(f.o), lv = level(f.t);
            return '<div class="pf-fr" onclick="openFriendship(\'' + esc(uid) + '\',\'' + esc(f.o) + '\')"><img src="' + esc(w.avatar) + '"><span class="n">' + esc(w.name) + '</span><span class="lv" style="--fc1:' + ['', '#ff5fa2', '#1ea1ff', '#8b5cf6', '#f0a500', '#e11d74'][tier(lv)] + '">Lv.' + lv + '</span></div>'; }).join('')
            : '<div class="pf-empty">এখনো কোনো ফ্রেন্ডশিপ নেই</div>';
        box.innerHTML = '<div class="pf-hint"><i class="fa-solid fa-chevron-up"></i>উপরে টানুন — আরও তথ্য</div>'
            + '<div class="pf-more">'
            + '<div class="pf-stats"><div class="pf-stat"><b>' + (u.level || 1) + '</b><span>লেভেল</span></div><div class="pf-stat"><b>' + sent.toLocaleString() + '</b><span>💎 পাঠিয়েছেন</span></div><div class="pf-stat"><b>' + got.toLocaleString() + '</b><span>💎 পেয়েছেন</span></div></div>'
            + '<div class="pf-card"><h5><i class="fa-solid fa-circle-info"></i> পরিচিতি</h5>'
            + '<div class="pf-row"><span>ভূমিকা</span><b>' + RL[role] + '</b></div>'
            + '<div class="pf-row"><span>দেশ</span><b>' + esc(u.country || 'বাংলাদেশ') + '</b></div>'
            + '<div class="pf-row"><span>রুমে এসেছেন</span><b>' + since + '</b></div>'
            + '<div class="pf-row"><span>সিট</span><b>' + (s ? (state.seats.indexOf(s) + 1) + ' নম্বর' : 'মাইকে নেই') + '</b></div>'
            + '<div class="pf-row"><span>বায়ো</span><b>' + esc(u.bio || '—') + '</b></div></div>'
            + '<div class="pf-card"><h5><i class="fa-solid fa-handshake-angle"></i> ফ্রেন্ডশিপ (' + fr.length + ')</h5>' + frH + '</div>'
            + '<div class="pf-card"><h5><i class="fa-solid fa-gift"></i> গিফট সারাংশ</h5>'
            + '<div class="pf-row"><span>এই রুমে পাঠানো</span><b>💎 ' + sent.toLocaleString() + '</b></div>'
            + '<div class="pf-row"><span>এই রুমে পাওয়া</span><b>💎 ' + got.toLocaleString() + '</b></div></div>'
            + '</div>';
    }
    /* ── Visitors / Viewed: কেউ কারও প্রোফাইলে টাচ করলে দুই দিকেই জমা হয় ──
       ▸ যার প্রোফাইলে টাচ করলাম তার 'moi_visitors_<তার uid>' তালিকায় আমি যোগ হই
       ▸ আমার 'moi_viewed_<আমার uid>' তালিকায় সে যোগ হয় (একই ব্যক্তি আবার টাচ করলে নতুন সময় সহ উপরে উঠে আসে) */
    function moiVisitRecord(uid){
        try {
            if (!uid || typeof myProfile === 'undefined' || !myProfile || !myProfile.uid || uid === myProfile.uid) return;
            var now = Date.now();
            var pack = function(id, fbName, fbPhoto){
                var u = getUser(id) || {};
                return { uid: id, name: u.name || fbName || 'User', photo: u.photo || u.avatar || fbPhoto || '', gender: u.gender || '', birthday: u.birthday || '', level: u.level || 1, ts: now };
            };
            var l = (state.listeners || []).find(function(x){ return x.uid === uid; }) || {};
            var add = function(key, row){
                var arr = ls_get(key, []) || [];
                arr = arr.filter(function(x){ return x && x.uid !== row.uid; });
                arr.unshift(row);
                ls_set(key, arr.slice(0, 100));
            };
            add('moi_visitors_' + uid, pack(myProfile.uid, myProfile.name, myProfile.avatar));
            add('moi_viewed_' + myProfile.uid, pack(uid, l.name, l.avatar));
        } catch(e){ console.warn('[visit]', e); }
    }
    window.moiVisitRecord = moiVisitRecord;

    var o = window.openUserProfile;
    if (typeof o === 'function'){
        window.openUserProfile = function(uid){
            wrapProfile();
            moiVisitRecord(uid);
            var r = o.apply(this, arguments);
            try { (window.moiRelFill || fill)(uid); var sh = document.querySelector('#userProfileModal .pf-sheet'); if (sh) sh.scrollTop = 0; } catch(e){ console.warn(e); }
            return r;
        };
    }
    document.addEventListener('DOMContentLoaded', wrapProfile);
})();
