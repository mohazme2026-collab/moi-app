/* shared/cp/cp-ui.js — CP: ডেটা + Invite তালিকা + Accept পপআপ + লেভেল 💎 + CP ভাঙা।
   প্রোফাইল পেজ ও রুমের প্রোফাইল শিট দুই জায়গাতেই এটা ব্যবহার হয়।
   ডেটা: moi_rel_cp = { "uidA|uidB": {a,b,ts,pts} }  (pts = দুজনের জমানো 💎; লেভেল CPBoard.levelOf(pts))
   কাজগুলো সার্ভার-হ্যান্ডলারে (economy.js): relInvite / relAccept / relReject / cpBoost / cpBreak */
(function(){
    'use strict';
    var BREAK_AFTER = 2 * 3600 * 1000;
    var INVITE_COST = 1000;
    var S = function(){ return window.MOISync; };
    var get = function(k, d){ try { var v = S().get(k, d); return v == null ? d : v; } catch(e){ return d; } };
    var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]; }); };
    var meId = function(){ var p = window.MOIAuth && MOIAuth.profile; return p && p.uid ? p.uid : null; };
    function g1(x){ x = String(x || '').toLowerCase(); return x[0] === 'f' ? 'f' : x[0] === 'm' ? 'm' : ''; }
    function user(uid){
        var u = (get('moi_demo_users', {}) || {})[uid] || {}, p = window.MOIAuth && MOIAuth.profile;
        if (p && p.uid === uid) u = Object.assign({}, u, p);
        return { uid: uid, name: u.name || 'User', avatar: u.photo || u.avatar || '', gender: g1(u.gender), moiId: u.moiId || '' };
    }
    function cpOf(uid){ var c = get('moi_rel_cp', {}) || {}; for (var k in c) if (c[k].a === uid || c[k].b === uid){
        if (c[k].brk && c[k].brk <= Date.now()){ if (!cpOf._b){ cpOf._b = 1; MOIEco.try('cpBreakDone', {}).then(function(){ cpOf._b = 0; }); } return null; }
        return c[k]; } return null; }
    function fmt(ms){ var m = Math.max(0, Math.ceil(ms / 60000)), h = Math.floor(m / 60); return (h ? h + ' ঘণ্টা ' : '') + (m % 60) + ' মিনিট'; }
    function days(ts){ var d = Math.floor((Date.now() - ts) / 86400000); return d < 1 ? 'আজ থেকে' : d + ' দিন'; }
    function opp(g){ return g === 'f' ? 'm' : g === 'm' ? 'f' : ''; }

    /* বোর্ডের HTML (অ্যাকশন বাটন সহ, নিজের হলে) */
    function cardHTML(uid){
        var mine = meId() === uid, c = cpOf(uid), me = user(uid), partner = null, lv = 0, prog = null, since = '';
        if (c){
            partner = user(c.a === uid ? c.b : c.a);
            var L = CPBoard.levelOf(c.pts || 0); lv = L.lv; prog = L; since = days(c.ts);
            if (!me.gender) me.gender = opp(partner.gender) || 'f';
            partner.gender = opp(me.gender);
        } else if (!me.gender) me.gender = 'f';
        var h = CPBoard.html({ me: me, partner: partner, level: lv, since: since, mine: mine, prog: prog });
        if (mine && c){
            var bl = c.brk ? c.brk - Date.now() : 0;
            h += '<div class="cpx-act"><button class="br' + (c.brk ? ' on' : '') + '" data-cpx="break">' + (c.brk ? '⏳ ভাঙা চলছে' : 'CP ভাঙুন') + '</button></div>'
               + (c.brk ? '<div class="cpx-note">' + fmt(bl) + ' পর CP ভেঙে যাবে — চাপলে বাতিল করা যাবে</div>' : '');
        }
        return h;
    }
    function mount(host, uid){
        if (!host) return;
        var last = '';
        function paint(){ var h = cardHTML(uid); if (h !== last){ last = h; host.innerHTML = h; } }
        paint(); setInterval(paint, 3000); window.addEventListener('moi:sync', paint);
        host.__cpPaint = paint;
    }

    /* ── শিট ── */
    function sheet(title, body){
        var old = document.getElementById('cpxSheet'); if (old) old.remove();
        var w = document.createElement('div'); w.id = 'cpxSheet'; w.className = 'cpx-wrap';
        w.innerHTML = '<div class="cpx-sheet"><div class="cpx-hd"><span>' + title + '</span><button type="button">✕</button></div><div class="cpx-bd">' + body + '</div></div>';
        w.addEventListener('click', function(e){ if (e.target === w || e.target.closest('.cpx-hd button')) w.remove(); });
        document.body.appendChild(w); return w;
    }
    function toast(m){ var te = document.getElementById('toast'); if (te && typeof toastMsg !== 'function'){ te.textContent = m; te.classList.add('show'); setTimeout(function(){ te.classList.remove('show'); }, 2000); return; } if (typeof toastMsg === 'function') toastMsg(m); else if (typeof window.toast === 'function') window.toast(m); else alert(m); }

    function invite(){
        var m = meId(); if (!m){ toast('লগইন করুন'); return; }
        var me = user(m), taken = {}, pend = {};
        var cps = get('moi_rel_cp', {}) || {}; Object.keys(cps).forEach(function(k){ taken[cps[k].a] = 1; taken[cps[k].b] = 1; });
        (get('moi_relreq', []) || []).forEach(function(r){ if (r.status === 'pending' && r.from === m && r.kind === 'cp') pend[r.to] = 1; });
        var all = get('moi_demo_users', {}) || {};
        var users = Object.keys(all).filter(function(id){ return id !== m; }).map(user).filter(function(u){ return !me.gender || !u.gender || u.gender === opp(me.gender); });
        var w = sheet('❤ Invite CP', '<input class="cpx-q" id="cpxQ" placeholder="নাম বা ID দিয়ে খুঁজুন"><div class="cpx-info">আমন্ত্রণ পাঠাতে ' + INVITE_COST + ' 💎 কাটা হবে। রিজেক্ট করলে ফেরত পাবেন।</div><div id="cpxL"></div>');
        function draw(){
            var q = (w.querySelector('#cpxQ').value || '').toLowerCase(), h = '';
            users.filter(function(u){ return !q || u.name.toLowerCase().indexOf(q) > -1 || String(u.moiId).indexOf(q) > -1; }).slice(0, 60).forEach(function(u){
                h += '<div class="cpx-row"><img src="' + esc(u.avatar) + '" alt="" onerror="this.style.visibility=\'hidden\'"><div class="n">' + esc(u.name) + '<small>ID ' + esc(u.moiId || u.uid) + '</small></div>'
                   + (taken[u.uid] ? '<em>CP আছে</em>' : pend[u.uid] ? '<em>পাঠানো হয়েছে</em>' : '<button data-u="' + esc(u.uid) + '">Invite</button>') + '</div>';
            });
            w.querySelector('#cpxL').innerHTML = h || '<div class="cpx-info" style="text-align:center">কাউকে পাওয়া যায়নি</div>';
        }
        draw(); w.querySelector('#cpxQ').oninput = draw;
        w.querySelector('#cpxL').onclick = function(e){
            var b = e.target.closest('button[data-u]'); if (!b) return;
            var u = user(b.dataset.u);
            if (!window.confirm(u.name + ' কে CP আমন্ত্রণ পাঠাবেন? ' + INVITE_COST + ' 💎 কাটা হবে।')) return;
            MOIEco.try('relInvite', { to: u.uid, kind: 'cp' }).then(function(r){ if (r){ toast('✅ আমন্ত্রণ পাঠানো হয়েছে'); w.remove(); } });
        };
    }
    function boost(){
        var c = cpOf(meId()); if (!c) return;
        var w = sheet('💎 CP Level Up', '<div class="cpx-info">যত 💎 দেবেন, CP-র পয়েন্ট তত বাড়বে। দুজনের গিফটও CP-তে যোগ হয়। প্রথম লেভেলে ২০০ 💎 লাগে, পরের লেভেলে একটু একটু করে বেশি।</div><div class="cpx-chips">' + [200, 500, 1000, 2000, 5000].map(function(a){ return '<button data-a="' + a + '">' + a + ' 💎</button>'; }).join('') + '</div>');
        w.querySelector('.cpx-chips').onclick = function(e){
            var b = e.target.closest('button[data-a]'); if (!b) return;
            MOIEco.try('cpBoost', { amount: +b.dataset.a }).then(function(r){ if (r){ toast('✅ CP পয়েন্ট +' + b.dataset.a); w.remove(); } });
        };
    }
    function brk(){
        var c = cpOf(meId()); if (!c) return;
        if (c.brk){
            var w = sheet('⏳ CP ভাঙা চলছে', '<div class="cpx-info" style="font-size:15px;text-align:center">আর <b>' + fmt(c.brk - Date.now()) + '</b> পর CP ভেঙে যাবে।<br>এর ভিতরে মন বদলালে বাতিল করতে পারবেন।</div><div class="cpx-chips"><button id="cpxKeep" style="flex:1">❤ CP রাখব (বাতিল)</button></div>');
            w.querySelector('#cpxKeep').onclick = function(){ MOIEco.try('cpBreakCancel', {}).then(function(r){ if (r){ toast('CP ভাঙা বাতিল হয়েছে ❤'); w.remove(); } }); };
            return;
        }
        if (!window.confirm('CP ভাঙতে চান? ২ ঘণ্টা পর ভেঙে যাবে, এর ভিতরে বাতিল করতে পারবেন। ভাঙলে লেভেল ও বাচ্চা মুছে যাবে।')) return;
        MOIEco.try('cpBreak', {}).then(function(r){ if (r) toast('২ ঘণ্টার কাউন্টডাউন শুরু হয়েছে'); });
    }
    document.addEventListener('click', function(e){
        var t = e.target.closest && e.target.closest('[data-cpx]'); if (!t) return;
        e.stopPropagation();
        var a = t.getAttribute('data-cpx');
        if (a === 'plus') invite(); else if (a === 'break') brk();
    }, true);

    /* ── ইনকামিং আমন্ত্রণ পপআপ (রুমে moi-rel.js নিজেই করে, তাই শুধু অন্য পেজে) ── */
    var shown = {};
    function poll(){
        if (window.moiCpCard) return;
        var m = meId(); if (!m) return;
        (get('moi_relreq', []) || []).forEach(function(r){
            if (r.kind !== 'cp' || r.to !== m || r.status !== 'pending' || shown[r.id]) return;
            shown[r.id] = 1; var u = user(r.from);
            var c = document.createElement('div'); c.className = 'cpx-pop';
            c.innerHTML = '<img src="' + esc(u.avatar) + '" alt=""><div class="t"><b>' + esc(u.name) + '</b>আপনার সাথে CP (কাপল) হতে চায়</div><button class="x">✕</button><button class="y">Accept</button>';
            c.querySelector('.x').onclick = function(){ c.remove(); MOIEco.try('relReject', { id: r.id }); };
            c.querySelector('.y').onclick = function(){ c.remove(); MOIEco.try('relAccept', { id: r.id }).then(function(x){ if (x) toast('💞 CP হয়েছে'); }); };
            document.body.appendChild(c);
        });
    }
    setInterval(poll, 1500); window.addEventListener('moi:sync', poll);
    window.CPUI = { mount: mount, cardHTML: cardHTML, invite: invite, user: user, cpOf: cpOf };
})();
