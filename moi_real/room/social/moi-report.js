/* room/moi-report.js — প্রোফাইলের (১) @ বাটন = রুমের কমেন্টে নাম সহ ট্যাগ  (২) ⋯ বাটন = রিপোর্ট সিস্টেম
   রিপোর্ট জমা থাকে ls_get('moi_reports_<ROOM_ID>') তালিকায় — { reporter, target, reason, note, ts } */
(function(){
    var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
    var targetUser = function(){
        var uid = (typeof currentProfileUid !== 'undefined') ? currentProfileUid : null;
        if (!uid) return null;
        var u = (state.listeners || []).find(function(x){ return x.uid === uid; });
        return u || null;
    };
    var isMe = function(uid){ return typeof myProfile !== 'undefined' && myProfile && myProfile.uid === uid; };

    /* ── (১) ট্যাগ ── */
    document.addEventListener('click', function(e){
        var at = e.target.closest && e.target.closest('.profile-at');
        if (!at) return;
        var u = targetUser(); if (!u) return;
        if (isMe(u.uid)){ toastMsg('নিজেকে ট্যাগ করা যায় না'); return; }
        closeUserProfile();
        openMessageInput();
        var inp = document.getElementById('chatInput');
        var tag = '@' + u.name + ' ';
        if (inp.value.indexOf(tag) === -1) inp.value = (inp.value ? inp.value.replace(/\s*$/, ' ') : '') + tag;
        setTimeout(function(){ inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }, 300);
    }, true);

    /* কমেন্টে @নাম রঙিন; আমাকে ট্যাগ করলে সোনালি + টোস্ট */
    var seen = null;
    function decorate(){
        var names = (state.listeners || []).map(function(l){ return l.name; }).filter(Boolean);
        (state.seats || []).forEach(function(s){ if (s && s.name && names.indexOf(s.name) < 0) names.push(s.name); });
        names.sort(function(a, b){ return b.length - a.length; });
        var myName = (typeof myProfile !== 'undefined' && myProfile) ? myProfile.name : null;
        document.querySelectorAll('#messagesList .msg-item:not(.gift-msg)').forEach(function(el){
            var h = el.innerHTML, ch = false;
            names.forEach(function(n){
                var t = '@' + esc(n);
                if (h.indexOf(t) > -1 && h.indexOf('msg-tag') < 0){
                    h = h.split(t).join('<span class="msg-tag' + (n === myName ? ' me' : '') + '">' + t + '</span>'); ch = true;
                }
            });
            if (ch) el.innerHTML = h;
        });
        var msgs = state.messages || [];
        if (seen === null){ seen = {}; msgs.forEach(function(m){ seen[m.id] = 1; }); return; }
        msgs.forEach(function(m){
            if (seen[m.id]) return; seen[m.id] = 1;
            if (m.type !== 'gift' && m.text && myName && m.text.indexOf('@' + myName) > -1 && !isMe(m.senderUid))
                toastMsg('📢 ' + (m.name || 'কেউ') + ' আপনাকে ট্যাগ করেছেন');
        });
    }
    var o = window.renderMessageFeed || (typeof renderMessageFeed === 'function' ? renderMessageFeed : null);
    if (o){
        window.renderMessageFeed = function(){ var r = o.apply(this, arguments); try { decorate(); } catch(e){} return r; };
        try { renderMessageFeed = window.renderMessageFeed; } catch(e){}
    }

    /* ── (২) ⋯ অপশন + রিপোর্ট ── */
    var REASONS = [
        ['fa-comment-slash', 'অশ্লীল / গালাগালি'],
        ['fa-bullhorn', 'স্প্যাম বা বিজ্ঞাপন'],
        ['fa-user-secret', 'ভুয়া / প্রতারণা'],
        ['fa-hand', 'হয়রানি বা বিরক্ত করা'],
        ['fa-ellipsis', 'অন্য কারণ']
    ];
    function openReport(u){
        var pick = -1;
        var h = '<div class="rp-wrap"><div class="rp-who"><img src="' + esc(u.avatar || '') + '"><div>' + esc(u.name) + '<div class="rp-sub" style="margin:2px 0 0">UID: ' + esc(u.moiId || u.uid) + '</div></div></div>'
            + '<p class="rp-sub">কারণ বেছে নিন</p>'
            + REASONS.map(function(r, i){ return '<div class="rp-reason" data-i="' + i + '"><i class="fa-solid ' + r[0] + '"></i>' + r[1] + '<i class="fa-solid fa-circle-check ck"></i></div>'; }).join('')
            + '<textarea class="rp-note" maxlength="300" placeholder="আরও কিছু জানাতে চাইলে লিখুন (ঐচ্ছিক)"></textarea>'
            + '<button class="rp-send" disabled>রিপোর্ট পাঠান</button></div>';
        var w = moiSheet('<i class="fa-solid fa-flag"></i> রিপোর্ট', h);
        var btn = w.querySelector('.rp-send');
        w.querySelectorAll('.rp-reason').forEach(function(el){
            el.onclick = function(){
                w.querySelectorAll('.rp-reason').forEach(function(x){ x.classList.remove('on'); });
                el.classList.add('on'); pick = +el.dataset.i; btn.disabled = false;
            };
        });
        btn.onclick = function(){
            if (pick < 0) return;
            var key = 'moi_reports_' + ROOM_ID, list = ls_get(key, []) || [];
            if (!Array.isArray(list)) list = Object.values(list);
            var me = myProfile ? myProfile.uid : '';
            if (list.some(function(r){ return r.reporter === me && r.target === u.uid && Date.now() - r.ts < 600000; })){
                w.remove(); toastMsg('আপনি একটু আগেই এই আইডি রিপোর্ট করেছেন'); return;
            }
            list.push({ reporter: me, reporterName: myProfile ? myProfile.name : '', target: u.uid, targetName: u.name, reason: REASONS[pick][1], note: w.querySelector('.rp-note').value.trim(), ts: Date.now() });
            ls_set(key, list.slice(-200));
            w.remove(); toastMsg('✅ রিপোর্ট জমা হয়েছে। ধন্যবাদ');
        };
    }
    window.openProfileMoreSheet = function(){
        var u = targetUser(); if (!u) return;
        var me = isMe(u.uid), options = [];
        options.push({ icon: 'fa-copy', label: 'Copy UID', cls: 'cyan', action: function(){
            var t = u.moiId || u.uid; try { navigator.clipboard && navigator.clipboard.writeText(t); } catch(e){}
            toastMsg('✅ UID কপি হয়েছে: ' + t); closeSheet(); } });
        if (!me) options.push({ icon: 'fa-flag', label: 'Report (রিপোর্ট)', danger: true, action: function(){ closeSheet(); openReport(u); } });
        if (!me && isOwner() && canManageUser(u.uid)) options.push({ icon: 'fa-user-minus', label: 'Kick from room', danger: true, action: function(){ closeSheet(); profileKick(); } });
        showSheetOptions('Options', options);
    };
})();
