/* room/moi-rel.js — Relationship: CP (কাপল) + Special ফ্রেন্ডশিপ + Supporters, প্রোফাইলের নিচে;
   সিটে CP-র হার্ট; ইনভাইট / নোটিফিকেশন / একসেপ্ট।
   ডেটা (সব ls_get/ls_set দিয়ে):
     moi_rel_cp  = { "uidA|uidB": {a,b,ts} }            moi_rel_fr = { "uidA|uidB": {a,b,type,ts} }
     moi_relreq  = [ {id,from,to,kind,cost,status,ts} ]  moi_supp_<ROOM_ID> = { পাওয়া_uid: { দেওয়া_uid: মোট💎 } }
   ইনভাইট/একসেপ্ট/রিজেক্ট MOIEco 'relInvite' / 'relAccept' / 'relReject' দিয়ে (আসল প্রজেক্টে এগুলো সার্ভারে লাগবে) */
(function(){
    var COST = { cp: 1000, friend: 300, sister: 300, brother: 300 };     /* শুধু দেখানোর জন্য; আসল হিসাব সার্ভারে */
    var KIND_LABEL = { cp: 'CP', friend: 'Friend', sister: 'Sister', brother: 'Brother' };
    var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
    var get = function(k, d){ try { var v = ls_get(k, d); return v == null ? d : v; } catch(e){ return d; } };
    var pk = function(a, b){ return a < b ? a + '|' + b : b + '|' + a; };
    var me = function(){ return (typeof myProfile !== 'undefined' && myProfile) ? myProfile.uid : null; };
    var who = function(uid){
        var s = (state.seats || []).find(function(x){ return x && x.uid === uid; });
        var l = (state.listeners || []).find(function(x){ return x.uid === uid; });
        var u = (typeof getUser === 'function' ? getUser(uid) : null) || {};
        return { uid: uid, name: (s && s.name) || (l && l.name) || u.name || 'User', avatar: (s && s.avatar) || (l && l.avatar) || u.photo || u.avatar || '' };
    };
    var cps = function(){ return get('moi_rel_cp', {}); };
    var frs = function(){ return get('moi_rel_fr', {}); };
    var cpOf = function(uid){ var c = cps(); for (var k in c) if (c[k].a === uid || c[k].b === uid) return c[k]; return null; };
    var frOf = function(uid){ var f = frs(), o = []; for (var k in f) if (f[k].a === uid || f[k].b === uid) o.push(f[k]); return o.sort(function(x, y){ return x.ts - y.ts; }); };
    var pairTotal = function(a, b){ return ((window.moiFriendData ? moiFriendData() : {})[pk(a, b)]) || 0; };
    var cpLevel = function(c){ return 1 + Math.floor(pairTotal(c.a, c.b) / 500); };
    /* বন্ডের লেভেল (Friend/Sister/Brother): জমানো 💎 (pts) + রুমে একে অপরকে দেওয়া গিফট; ১–৫ */
    var FR_STEPS = [0, 10000, 25000, 50000, 100000];
    var frPts = function(f){ return (f.pts || 0) + pairTotal(f.a, f.b); };
    var frLevel = function(f){ var p = frPts(f), l = 1; for (var i = 1; i < 5; i++) if (p >= FR_STEPS[i]) l = i + 1; return l; };
    var frFind = function(a, b){ var f = frs()[pk(a, b)]; return f || null; };
    window.moiRelOf = function(a, b){ return !!frFind(a, b) || !!cps()[pk(a, b)]; };
    var IMG = (function(){ var s = document.currentScript; return s && s.src ? s.src.replace(/[^\/]*$/, '') + 'rel/' : 'social/rel/'; })();
    /* সিটের মাঝের চিহ্ন + শিটের বড় ছবি */
    var SEATIMG = { friend: 'friend_', sister: 'sister_', brother: 'brother_' }, BIGIMG = { friend: 'boat_', sister: 'sbig_', brother: 'bbig_' };
    var KTITLE = { friend: 'Friend ship', sister: 'Sister ship', brother: 'Brother ship' };
    var KDESC = { friend: 'বন্ধু · ফ্রি', sister: 'বোনের বন্ধন', brother: 'ভাইয়ের বন্ধন', cp: 'কাপল (খালি CP-ঘর থাকলে)' };
    /* CP-র বাচ্চা: লেভেল ১০ থেকে নবজাতক; ২০/৩০/৪০/৫০-এ বড় হয়; ৪০-এ ছোট মেয়ে-বাচ্চা জন্মায় */
    var kids = function(lv){ return lv < 10 ? [] : lv < 20 ? ['girl_1'] : lv < 30 ? ['boy_1'] : lv < 40 ? ['boy_2'] : lv < 50 ? ['boy_3', 'girl_2'] : ['boy_4', 'girl_3']; };
    var tier = function(l){ return l >= 20 ? 4 : l >= 10 ? 3 : l >= 5 ? 2 : 1; };
    var days = function(ts){ return Math.max(0, Math.floor((Date.now() - ts) / 86400000)); };
    var dstr = function(ts){ var d = new Date(ts); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
    window.moiIsCp = function(a, b){ return !!cps()[pk(a, b)]; };

    var HEART = '<svg viewBox="0 0 100 90"><defs><linearGradient id="cph" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--ca,#ff8fb4)"/><stop offset="1" stop-color="var(--cb,#c2185b)"/></linearGradient></defs>'
        + '<path d="M50 86C10 56 0 31 14 15 27 3 44 10 50 24 56 10 73 3 86 15 100 31 90 56 50 86Z" fill="url(#cph)" stroke="#fff" stroke-opacity=".8" stroke-width="2"/>'
        + '<path d="M22 20C28 13 38 14 43 21" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none" stroke-linecap="round"/></svg>';
    var WINGS = '<svg class="cp-wing l" viewBox="0 0 40 30"><path d="M40 20C28 22 12 18 2 4 14 4 26 8 40 12Z M36 24C26 28 14 26 8 20 18 20 28 20 36 22Z" fill="#fff" fill-opacity=".9"/></svg>'
        + '<svg class="cp-wing r" viewBox="0 0 40 30"><path d="M0 20C12 22 28 18 38 4 26 4 14 8 0 12Z M4 24C14 28 26 26 32 20 22 20 12 20 4 22Z" fill="#fff" fill-opacity=".9"/></svg>';

    function avFrame(u, empty, plus){
        if (plus) return '<div class="cp-av plus" data-act="cp-plus"><i class="fa-solid fa-plus"></i></div>';
        if (empty) return '<div class="cp-av empty"></div>';
        return '<div class="cp-av"><img src="' + esc(u.avatar) + '"></div><div class="cp-nm">' + esc(u.name) + '</div>';
    }
    /* কাপল কার্ড — প্রোফাইল ও সিটের হার্ট-শিট দুই জায়গাতেই */
    function cpCard(owner, cp, mine){
        if (window.CPUI && window.CPBoard) return CPUI.cardHTML(owner);
        var A = who(owner), t = '', lv = 0;
        if (cp){ lv = cpLevel(cp); t = ' t' + tier(lv); }
        var B = cp ? who(cp.a === owner ? cp.b : cp.a) : null;
        var right = cp ? '<div class="cp-side">' + avFrame(B) + '</div>'
            : '<div class="cp-side">' + (mine ? avFrame(null, false, true) : avFrame(null, true)) + '</div>';
        return '<div class="cp-card' + t + '">'
            + '<div class="cp-side">' + avFrame(A) + '</div>'
            + '<div class="cp-mid"><div class="cp-heart">' + WINGS + HEART + (cp ? '<b>' + days(cp.ts) + '<small>Days</small></b>' : '') + '</div>'
            + '<div class="cp-lv">Lv.' + lv + '</div></div>' + right
            + '<div class="cp-foot">' + (cp ? 'Issuance Time: ' + dstr(cp.ts) : (mine ? 'Invite CP' : 'এখনো CP নেই')) + '</div></div>';
    }
    window.moiCpCard = cpCard;

    function spSlot(owner, f, mine, i){
        if (!f) return '<div class="sp-slot empty"' + (mine ? ' data-act="fr-plus"' : '') + '>' + (mine ? '<i class="fa-solid fa-plus"></i>' : '') + '</div>';
        var o = who(f.a === owner ? f.b : f.a), lv = frLevel(f);
        return '<div class="sp-slot ' + f.type + '" data-a="' + esc(f.a) + '" data-b="' + esc(f.b) + '"><span class="sp-rib">' + KIND_LABEL[f.type] + '</span>'
            + '<img src="' + esc(o.avatar) + '"><div class="sp-nm">' + esc(o.name) + '</div><div class="sp-lv">Lv' + lv + '</div></div>';
    }
    function supporters(uid){
        var m = get('moi_supp_' + ROOM_ID, {})[uid] || {}, arr = Object.keys(m).map(function(k){ return { uid: k, amt: m[k] }; }).sort(function(a, b){ return b.amt - a.amt; }).slice(0, 3);
        var h = '';
        for (var i = 0; i < 3; i++){
            var s = arr[i];
            h += '<div class="sup t' + (i + 1) + '"><span class="sup-top">Top' + (i + 1) + '</span>' + (s ? '<div class="sup-av"><img src="' + esc(who(s.uid).avatar) + '"></div><div class="sup-nm">' + esc(who(s.uid).name) + '</div>' : '<div class="sup-av none"></div><div class="sup-nm">—</div>') + '</div>';
        }
        return h;
    }

    /* ── প্রোফাইলের Relationship অংশ ── */
    window.moiRelFill = function(uid){
        var box = document.getElementById('pfMore'); if (!box) return;
        var mine = me() === uid, cp = cpOf(uid), list = frOf(uid), sl = '';
        for (var i = 0; i < 6; i++) sl += spSlot(uid, list[i], mine, i);
        box.dataset.uid = uid;
        box.innerHTML = '<div class="rel-sec"><h5><span>CP</span></h5>' + cpCard(uid, cp, mine && !cp) + '</div>'
            + '<div class="rel-sec"><h5><span>Special</span></h5><div class="sp-grid">' + sl + '</div></div>'
            + '<div class="rel-sec"><h5><span>Supporters</span></h5><div class="sup-row">' + supporters(uid) + '</div></div>';
    };
    document.addEventListener('click', function(e){
        var t = e.target.closest && e.target.closest('[data-act],.sp-slot[data-a],.cp-card .cp-heart');
        if (!t) return;
        var box = document.getElementById('pfMore');
        if (t.dataset.act === 'cp-plus'){ e.stopPropagation(); openInvite('cp'); }
        else if (t.dataset.act === 'fr-plus'){ e.stopPropagation(); openInvite('friend'); }
        else if (t.classList.contains('sp-slot') && t.dataset.a && typeof openFriendship === 'function'){ openFriendship(t.dataset.a, t.dataset.b); }
    }, true);

    /* ── ইনভাইট লিস্ট (Following + Followers) ── */
    function openInvite(kind){
        var m = me(); if (!m){ toastMsg('লগইন করুন'); return; }
        var ids = {}; (get('moi_follow_' + m + '_following', []) || []).concat(get('moi_follow_' + m + '_followers', []) || []).forEach(function(x){ ids[x] = 1; });
        delete ids[m];
        var taken = {}; frOf(m).forEach(function(f){ taken[f.a === m ? f.b : f.a] = 1; });
        var sentTo = {}; get('moi_relreq', []).forEach(function(r){ if (r.status === 'pending' && r.from === m) sentTo[r.to + '|' + r.kind] = 1; });
        var users = Object.keys(ids).map(who);
        var isCp = kind === 'cp';
        var chips = isCp ? '' : '<div class="iv-chips">' + ['friend', 'sister', 'brother'].map(function(k){ return '<span class="iv-chip' + (k === kind ? ' on' : '') + '" data-k="' + k + '">' + KIND_LABEL[k] + '</span>'; }).join('') + '</div>';
        var w = moiSheet(isCp ? '<i class="fa-solid fa-heart"></i> Invite CP' : '<i class="fa-solid fa-handshake-angle"></i> Invite Friend',
            '<div class="iv-wrap">' + chips + '<div class="iv-search"><i class="fa-solid fa-magnifying-glass"></i><input placeholder="Search" id="ivQ"></div><div class="iv-cost">💎 <b id="ivCost">' + COST[kind] + '</b> কাটা হবে (আপনার ব্যালেন্স থেকে)</div><div id="ivList"></div></div>', { tall: true });
        function draw(){
            var q = (w.querySelector('#ivQ').value || '').toLowerCase(), h = '';
            users.filter(function(u){ return !q || u.name.toLowerCase().indexOf(q) > -1; }).forEach(function(u){
                var blocked = !isCp && taken[u.uid] ? 'আগে থেকেই' : (isCp && cpOf(u.uid) ? 'CP আছে' : '');
                var pend = sentTo[u.uid + '|' + kind];
                h += '<div class="iv-row"><img src="' + esc(u.avatar) + '"><span>' + esc(u.name) + '</span>'
                    + (blocked ? '<em>' + blocked + '</em>' : pend ? '<em>পাঠানো হয়েছে</em>' : '<button data-u="' + esc(u.uid) + '">Invite</button>') + '</div>';
            });
            w.querySelector('#ivList').innerHTML = h || '<div class="pf-empty">কেউ নেই — আগে কাউকে ফলো করুন</div>';
        }
        draw();
        w.querySelector('#ivQ').oninput = draw;
        w.querySelectorAll('.iv-chip').forEach(function(c){ c.onclick = function(){ w.remove(); openInvite(c.dataset.k); }; });
        w.querySelector('#ivList').onclick = function(e){
            var b = e.target.closest('button[data-u]'); if (!b) return;
            var u = who(b.dataset.u);
            moiConfirm(isCp ? 'CP রিকোয়েস্ট' : KIND_LABEL[kind] + ' রিকোয়েস্ট', esc(u.name) + ' কে পাঠাতে ' + COST[kind] + ' 💎 কাটা হবে। রিজেক্ট করলে ফেরত পাবেন।', 'পাঠান', function(){
                MOIEco.try('relInvite', { to: u.uid, kind: kind }).then(function(r){
                    if (r){ toastMsg('✅ রিকোয়েস্ট পাঠানো হয়েছে'); w.remove(); }
                });
            });
        };
    }

    /* ── ইনকামিং রিকোয়েস্ট (নোটিফিকেশন কার্ড) + ফলাফল ── */
    var shown = {}, notified = {};
    function burst(){
        var d = document.createElement('div'); d.className = 'rel-burst';
        for (var i = 0; i < 16; i++) d.innerHTML += '<i style="left:' + (5 + Math.random() * 90) + '%;animation-delay:' + (Math.random() * .6) + 's;font-size:' + (16 + Math.random() * 22) + 'px">' + (i % 3 ? '❤️' : '💖') + '</i>';
        document.querySelector('.app-container').appendChild(d); setTimeout(function(){ d.remove(); }, 2600);
    }
    function poll(){
        var m = me(); if (!m) return;
        get('moi_relreq', []).forEach(function(r){
            if (r.to === m && r.status === 'pending' && !shown[r.id]){
                shown[r.id] = 1; var u = who(r.from);
                var c = document.createElement('div'); c.className = 'rq-pop';
                c.innerHTML = '<img src="' + esc(u.avatar) + '"><div class="rq-t"><b>' + esc(u.name) + '</b><span>আপনার সাথে ' + (r.kind === 'cp' ? 'CP (কাপল)' : KIND_LABEL[r.kind] + ' ফ্রেন্ডশিপ') + ' করতে চায়</span></div><button class="no">✕</button><button class="yes">Accept</button>';
                c.querySelector('.no').onclick = function(){ c.remove(); MOIEco.try('relReject', { id: r.id }); };
                c.querySelector('.yes').onclick = function(){ c.remove(); MOIEco.try('relAccept', { id: r.id }).then(function(x){ if (x){ burst(); toastMsg('💞 সম্পর্ক তৈরি হয়েছে'); } }); };
                document.querySelector('.app-container').appendChild(c);
            }
            if (r.from === m && r.status !== 'pending' && !notified[r.id]){
                notified[r.id] = 1;
                if (!r.doneAt || Date.now() - r.doneAt > 20000) return;
                var o = who(r.to);
                if (r.status === 'accepted'){ burst(); toastMsg('💞 ' + o.name + ' ' + (r.kind === 'cp' ? 'CP' : KIND_LABEL[r.kind]) + ' একসেপ্ট করেছে'); }
                else toastMsg(o.name + ' রিজেক্ট করেছে — ' + r.cost + ' 💎 ফেরত');
            }
        });
    }
    setInterval(poll, 1500);
    window.addEventListener('moi:sync', poll);

    /* ── সিটে CP: হার্ট + রিং ── */
    function layer(){
        var grid = document.getElementById('seatsGrid'); if (!grid) return null;
        var host = grid.parentElement, L = document.getElementById('moiHearts');
        if (!L){ L = document.createElement('div'); L.id = 'moiHearts'; }
        if (L.parentElement !== host) host.appendChild(L);
        return L;
    }
    function placeHearts(){
        var L = layer(); if (!L) return;
        var hr = L.parentElement.getBoundingClientRect(), els = {}, out = '', used = {};
        document.querySelectorAll('#seatsGrid .seat-avatar.cp-ring').forEach(function(e){ e.classList.remove('cp-ring', 'cp-t1', 'cp-t2', 'cp-t3', 'cp-t4'); });
        document.querySelectorAll('#seatsGrid .seat[data-seat]').forEach(function(e){ els[+e.dataset.seat] = e; });
        var C = cps();
        Object.keys(els).forEach(function(k){
            var i = +k, A = els[i], B = els[i + 1];
            if (!B || !A.dataset.uid || !B.dataset.uid) return;
            var c = C[pk(A.dataset.uid, B.dataset.uid)]; if (!c) return;
            var av = A.querySelector('.seat-avatar'), bv = B.querySelector('.seat-avatar'); if (!av || !bv) return;
            var ra = av.getBoundingClientRect(), rb = bv.getBoundingClientRect();
            if (Math.abs(ra.top - rb.top) > 8 || rb.left < ra.left) return;
            var cl = window.CPBoard ? CPBoard.levelOf(c.pts || 0).lv : cpLevel(c), t = tier(cl); av.classList.add('cp-ring', 'cp-t' + t); bv.classList.add('cp-ring', 'cp-t' + t);
            var x = (ra.right + rb.left) / 2 - hr.left, y = ra.top + ra.height * .42 - hr.top, ks = kids(cl);
            var kh = ks.map(function(n, j){ return '<img class="sk k' + (j ? 'b' : 'a') + '" src="' + IMG + n + '.webp" alt="">'; }).join('');
            out += '<div class="seat-heart t' + t + (ks.length ? ' hk' + ks.length : '') + '" style="left:' + x + 'px;top:' + y + 'px" data-a="' + esc(c.a) + '">' + HEART + kh + '</div>';
            used[i] = 1;
        });
        /* Friend / Sister / Brother: পাশাপাশি দুজনের মাঝে লেভেলের চিহ্ন */
        var F = frs();
        Object.keys(els).forEach(function(k){
            var i = +k, A = els[i], B = els[i + 1];
            if (!B || !A.dataset.uid || !B.dataset.uid) return;
            var f = F[pk(A.dataset.uid, B.dataset.uid)]; if (!f || !SEATIMG[f.type]) return;
            var av = A.querySelector('.seat-avatar'), bv = B.querySelector('.seat-avatar'); if (!av || !bv) return;
            var ra = av.getBoundingClientRect(), rb = bv.getBoundingClientRect();
            if (Math.abs(ra.top - rb.top) > 8 || rb.left < ra.left) return;
            var lv = frLevel(f), w = Math.max(26, Math.min(30, Math.round(rb.left - ra.right + 8)));
            var x = (ra.right + rb.left) / 2 - hr.left, y = ra.top + ra.height * .5 - hr.top;
            out += '<div class="seat-link l' + lv + '" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px" data-a="' + esc(f.a) + '" data-b="' + esc(f.b) + '"><img src="' + IMG + SEATIMG[f.type] + lv + '.webp" alt=""></div>';
        });
        if (L.__h !== out){ L.__h = out; L.innerHTML = out; }
    }
    document.addEventListener('click', function(e){
        var h = e.target.closest && e.target.closest('.seat-heart'); if (!h) return;
        e.stopPropagation();
        var c = cpOf(h.dataset.a); if (!c) return;
        moiSheet('<i class="fa-solid fa-heart"></i> CP', '<div class="cp-sheet">' + cpCard(c.a, c, false) + '</div>');
    }, true);
    var o = window.renderSeats;
    if (typeof o === 'function') window.renderSeats = function(){ var r = o.apply(this, arguments); setTimeout(placeHearts, 0); return r; };
    window.addEventListener('resize', placeHearts); window.addEventListener('moi:sync', placeHearts);
    setInterval(placeHearts, 1000);

    /* ── বন্ডের শিট: সিটের চিহ্নে ট্যাপ করলে (Friend / Sister / Brother) ── */
    function bondSheet(a, b){
        var f = frFind(a, b); if (!f) return;
        var lv = frLevel(f), pts = frPts(f), A = who(f.a), B = who(f.b), k = f.type;
        var lo = FR_STEPS[lv - 1], hi = lv >= 5 ? null : FR_STEPS[lv], pc = hi ? Math.min(100, Math.round((pts - lo) / (hi - lo) * 100)) : 100;
        var h = '<div class="bd-wrap bd-' + k + '"><div class="bd-pair"><div class="u"><img src="' + esc(A.avatar) + '"><span>' + esc(A.name) + '</span></div>'
            + '<img class="bd-ic" src="' + IMG + SEATIMG[k] + lv + '.webp" alt=""><div class="u"><img src="' + esc(B.avatar) + '"><span>' + esc(B.name) + '</span></div></div>'
            + '<div class="bd-t">' + KTITLE[k] + ' · Lv' + lv + '</div>'
            + '<div class="bd-bar"><i style="width:' + pc + '%"></i></div>'
            + '<div class="bd-n">' + pts.toLocaleString() + ' / ' + (hi ? hi.toLocaleString() : 'MAX') + ' 💎</div>'
            + '<img class="bd-big" src="' + IMG + BIGIMG[k] + lv + '.webp" alt="">'
            + '<div class="bd-lvs">' + [1, 2, 3, 4, 5].map(function(n){ return '<span class="' + (n === lv ? 'on' : n < lv ? 'done' : '') + '"><img src="' + IMG + SEATIMG[k] + n + '.webp" alt=""><b>Lv' + n + '</b></span>'; }).join('') + '</div>'
            + (lv < 5 && (me() === f.a || me() === f.b) ? '<div class="bd-boost"><span>💎 লেভেল বাড়ান:</span>' + [1000, 10000, 50000].map(function(x){ return '<button data-a="' + x + '">' + x.toLocaleString() + '</button>'; }).join('') + '</div>' : '')
            + '</div>';
        var w = moiSheet('<i class="fa-solid fa-handshake-angle"></i> ' + KTITLE[k], h);
        var bb = w.querySelector('.bd-boost');
        if (bb) bb.onclick = function(e){
            var x = e.target.closest('button[data-a]'); if (!x) return;
            MOIEco.try('relBoost', { to: f.a === me() ? f.b : f.a, amount: +x.dataset.a }).then(function(r){ if (r){ w.remove(); bondSheet(a, b); } });
        };
    }
    var oFs = window.openFriendship;
    window.openFriendship = function(a, b){ if (frFind(a, b)) return bondSheet(a, b); if (oFs) return oFs.apply(this, arguments); };
    document.addEventListener('click', function(e){
        var t = e.target.closest && e.target.closest('.seat-link'); if (!t) return;
        e.stopPropagation(); bondSheet(t.dataset.a, t.dataset.b);
    }, true);

    /* ── প্রোফাইলে লাল বাটন → সম্পর্কের ধরন → সরাসরি আমন্ত্রণ ── */
    function pickKind(uid){
        var m = me(); if (!m || m === uid){ return; }
        var U = who(uid), has = !!frFind(m, uid), cpTaken = !!cpOf(m) || !!cpOf(uid);
        var pend = {}; get('moi_relreq', []).forEach(function(r){ if (r.status === 'pending' && r.from === m && r.to === uid) pend[r.kind] = 1; });
        var full = frOf(m).length >= 6, sel = null;
        var rows = ['friend', 'sister', 'brother', 'cp'].map(function(k){
            var why = pend[k] ? 'পাঠানো হয়েছে' : k === 'cp' ? (cpTaken ? 'CP-ঘর খালি নেই' : '') : has ? 'আগেই সম্পর্ক আছে' : full ? 'আপনার ৬টা ঘর পূর্ণ' : '';
            var ic = k === 'cp' ? '<span class="pk-cp">💖</span>' : '<img src="' + IMG + SEATIMG[k] + '3.webp" alt="">';
            return '<div class="pk-row' + (why ? ' off' : '') + '" data-k="' + k + '">' + ic + '<div><b>' + (k === 'cp' ? 'CP' : k === 'friend' ? 'Friendship' : k === 'sister' ? 'Sistership' : 'Brothership') + '</b><small>' + (why || KDESC[k]) + '</small></div><em>💎 ' + COST[k] + '</em></div>';
        }).join('');
        var w = moiSheet(esc(U.name) + '-কে পাঠান', '<div class="pk-wrap">' + rows + '<button class="pk-go" disabled>আমন্ত্রণ পাঠান</button></div>');
        var go = w.querySelector('.pk-go');
        w.querySelector('.pk-wrap').onclick = function(e){
            var r = e.target.closest('.pk-row'); if (!r || r.classList.contains('off')) return;
            w.querySelectorAll('.pk-row').forEach(function(x){ x.classList.remove('on'); }); r.classList.add('on'); sel = r.dataset.k; go.disabled = false;
        };
        go.onclick = function(){
            if (!sel) return;
            MOIEco.try('relInvite', { to: uid, kind: sel }).then(function(r){ if (r){ toastMsg('✅ আমন্ত্রণ পাঠানো হয়েছে'); w.remove(); } });
        };
    }
    var oFill = window.moiRelFill;
    window.moiRelFill = function(uid){
        oFill(uid);
        var box = document.getElementById('pfMore'), m = me(); if (!box || !m || m === uid) return;
        var b = document.createElement('button'); b.className = 'rel-send'; b.type = 'button';
        b.innerHTML = '<i class="fa-solid fa-heart"></i> সম্পর্ক পাঠান';
        b.onclick = function(e){ e.stopPropagation(); pickKind(uid); };
        box.insertBefore(b, box.firstChild);
    };
})();
