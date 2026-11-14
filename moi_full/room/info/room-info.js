/* room/info/room-info.js — রুম ইনফো প্যানেল (Info/Member), Settings, অনুমতি, মালিকের Rewards
   ভূমিকা মাত্র ৩টা: মালিক / অ্যাডমিন / ইউজার। অনুমতি রুমের info-তে `perms` নামে সেভ হয়। */
(function(){
'use strict';
var $ = function(id){ return document.getElementById(id); };
var E = function(s){ return (typeof esc === 'function') ? esc(s) : String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };

/* ══════════ অনুমতি ══════════ */
var DEF = { chat:'all', mic:'all', music:'all', clear:'admin', adminCan:{ mute:true, block:true, theme:true, info:false } };
var CH = [['all','সবাই'],['member','শুধু মেম্বার'],['admin','অ্যাডমিন ও মালিক'],['owner','শুধু মালিক']];
function perms(){
    var i = (typeof getRoomInfo === 'function' && getRoomInfo(ROOM_ID)) || {}, p = i.perms || {};
    var a = Object.assign({}, DEF.adminCan, p.adminCan || {});
    return Object.assign({}, DEF, p, { adminCan: a });
}
function save(p){ saveRoomInfo(ROOM_ID, { perms: p }); }
function role(){ return (typeof getMyRole === 'function' && getMyRole()) || 'member'; }
function isMember(){ try { return !!(state.joinedUsers && myProfile && state.joinedUsers.has(myProfile.uid)); } catch(e){ return false; } }
function can(kind){
    var r = role(), lv = perms()[kind];
    if (r === 'owner') return true;
    if (lv === 'all') return true;
    if (lv === 'member') return r === 'admin' || isMember();
    if (lv === 'admin') return r === 'admin';
    return false;
}
function why(kind){
    var lv = perms()[kind];
    var who = lv === 'member' ? 'শুধু মেম্বাররা' : lv === 'admin' ? 'শুধু অ্যাডমিনরা' : 'শুধু মালিক';
    var what = kind === 'chat' ? 'চ্যাটে লিখতে' : kind === 'mic' ? 'মাইকে বসতে' : 'মিউজিক চালাতে';
    return who + ' ' + what + ' পারবে' + (lv === 'member' ? ' — আগে রুমে Join করুন' : '');
}
/* অ্যাডমিনের টগল: owner সবসময় পারে, admin শুধু চালু থাকলে */
function adminOK(k){ var r = role(); return r === 'owner' || (r === 'admin' && perms().adminCan[k]); }
function staff(){ var r = role(); return r === 'owner' || r === 'admin'; }
window.RIPerm = { can: can, why: why, adminOK: adminOK, perms: perms };

/* ══════════ লেভেল / রিওয়ার্ড (ডেমো — র‍্যান্ডম) ══════════ */
function hash(s){ var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function demo(){
    var k = 'ri_demo_' + ROOM_ID, d = null;
    try { d = JSON.parse(localStorage.getItem(k)); } catch(e){}
    if (!d){
        var h = hash(String(ROOM_ID));
        d = { level: 8 + h % 40, flow: 60000 + (h % 900) * 1000, avail: 0, rec: [] };
        d.avail = Math.round(d.flow * 0.04);
        try { localStorage.setItem(k, JSON.stringify(d)); } catch(e){}
    }
    return d;
}
function putDemo(d){ try { localStorage.setItem('ri_demo_' + ROOM_ID, JSON.stringify(d)); } catch(e){} }
function level(){ var i = (getRoomInfo(ROOM_ID) || {}); return typeof i.level === 'number' ? i.level : (window.ROOM_LEVELS && window.ROOM_LEVELS[ROOM_ID]) || demo().level; }
function tier(lv){ return lv >= 50 ? ['#ff5ad6','#ffd36b'] : lv >= 30 ? ['#ffd36b','#ff9a3d'] : lv >= 15 ? ['#cfe4ff','#8ab4ff'] : ['#e6c9a8','#c8935a']; }
var TARGETS = [[400000,36000],[600000,54000],[800000,72000],[1000000,90000],[1400000,126000],[2000000,180000],[3000000,270000],[4000000,360000],[5000000,450000],[6000000,540000],[8000000,720000],[12000000,1080000]];
function fmt(n){ return Number(n).toLocaleString('en-US'); }

/* ══════════ ইনফো প্যানেল ══════════ */
function build(){
    var m = $('memberModal'); if (!m || m.getAttribute('data-ri')) return;
    m.setAttribute('data-ri', '1');
    m.innerHTML =
      '<div class="modal-header"><h3>Room Info</h3><i class="fa-solid fa-xmark close-btn" onclick="closeModal(\'memberModal\')"></i></div>'
    + '<div class="room-modal-top">'
    +   '<div class="room-logo-modal" id="room-logo-modal-container"><span class="cassette-text">HOUR<br>FM</span></div>'
    +   '<div class="room-title-modal" id="room-name-modal-display">Loading…</div>'
    +   '<div class="room-id-modal" id="room-id-modal">ID:---</div>'
    +   '<div class="owner-info-modal" id="owner-info-modal"></div>'
    + '</div>'
    + '<div class="ri-tabs"><button class="on" data-t="info">Info</button><button data-t="mem">Member</button></div>'
    + '<div class="ri-pane" id="riInfo"></div>'
    + '<div class="ri-pane" id="riMem" style="display:none">'
    +   '<div class="search-bar"><i class="fa-solid fa-magnifying-glass"></i><input type="text" id="memberSearch" placeholder="নাম বা ID খুঁজুন" oninput="renderMembers()"><i class="fa-solid fa-xmark" style="font-size:13px;cursor:pointer" onclick="clearSearch()"></i></div>'
    +   '<div class="member-counter" id="memberCounter">0/4000</div>'
    +   '<div class="user-list" id="userList"></div>'
    + '</div>';
    m.querySelectorAll('.ri-tabs button').forEach(function(b){
        b.onclick = function(){
            m.querySelectorAll('.ri-tabs button').forEach(function(x){ x.classList.toggle('on', x === b); });
            $('riInfo').style.display = b.dataset.t === 'info' ? '' : 'none';
            $('riMem').style.display = b.dataset.t === 'mem' ? '' : 'none';
            if (b.dataset.t === 'mem' && typeof renderMembers === 'function') renderMembers();
        };
    });
    $('room-logo-modal-container').onclick = function(){ if (adminOK('info')) openEditRoom(); };
    if (typeof renderBranding === 'function') try { renderBranding(); } catch(e){}
}
function rulesText(){
    var rr = (getRoomInfo(ROOM_ID) || {}).rules;
    return (Array.isArray(rr) && rr.length) ? rr : ['সবার সাথে ভদ্র আচরণ করুন', 'গালিগালাজ ও বিজ্ঞাপন নিষেধ'];
}
function renderInfo(){
    build();
    var el = $('riInfo'); if (!el) return;
    var lv = level(), t = tier(lv), d = demo();
    var next = Math.ceil((d.flow + 1) / 50000) * 50000, pc = Math.max(4, Math.min(100, Math.round(d.flow / next * 100)));
    var canInfo = adminOK('info'), r = role();
    var members = (state.listeners || []).length;
    el.innerHTML =
      '<div class="ri-lv"><div class="ri-crown" style="--c1:' + t[0] + ';--c2:' + t[1] + '"><i class="fa-solid fa-crown"></i></div>'
    +   '<div class="ri-lv-body"><div class="ri-lv-top"><b>Lv.' + lv + '</b><span>এই মাসে ' + fmt(d.flow) + ' / ' + fmt(next) + ' 💎</span></div>'
    +   '<div class="ri-bar"><i style="width:' + pc + '%"></i></div></div></div>'
    + '<div class="ri-card"><div class="ri-h">টপিক' + (canInfo ? '<button class="ri-edit" onclick="editTopic()"><i class="fa-solid fa-pen"></i></button>' : '') + '</div><div class="ri-t">' + E(state.topic || 'কোনো টপিক নেই') + '</div></div>'
    + '<div class="ri-card"><div class="ri-h">নিয়ম' + (canInfo ? '<button class="ri-edit" onclick="RXLive.editRules()"><i class="fa-solid fa-pen"></i></button>' : '') + '</div><div class="ri-t">' + rulesText().slice(0, 4).map(function(x, i){ return (i + 1) + '. ' + E(x); }).join('<br>') + '</div></div>'
    + '<div class="ri-stats"><div><b>' + members + '</b><span>মেম্বার</span></div><div><b>' + E(r === 'owner' ? 'মালিক' : r === 'admin' ? 'অ্যাডমিন' : 'ইউজার') + '</b><span>আপনি</span></div></div>'
    + (staff() ? '<button class="ri-btn" onclick="RoomInfo.settings()"><i class="fa-solid fa-gear"></i> Settings</button>' : '')
    + (r === 'owner' ? '<button class="ri-btn gold" onclick="RoomInfo.rewards()">💎 Rewards <small>মালিকের পুরস্কার</small></button>' : '');
}
function open(){ build(); renderInfo(); }

/* ══════════ নিচের পপআপ (ছোট বিকল্প বাছাই) ══════════ */
function pop(title, html){
    var w = document.createElement('div'); w.className = 'ri-pop';
    w.innerHTML = '<div class="ri-pop-bk"></div><div class="ri-pop-box"><h4>' + title + '</h4>' + html + '</div>';
    w.querySelector('.ri-pop-bk').onclick = function(){ w.remove(); };
    document.querySelector('.app-container').appendChild(w); return w;
}
function choose(label, kind){
    var cur = perms()[kind];
    var w = pop(label, CH.filter(function(c){ return kind !== 'clear' || c[0] === 'admin' || c[0] === 'owner'; }).map(function(c){
        return '<button class="ri-opt' + (c[0] === cur ? ' on' : '') + '" data-v="' + c[0] + '">' + c[1] + '</button>';
    }).join('') + '<button class="ri-opt cancel">বাতিল</button>');
    w.querySelectorAll('.ri-opt').forEach(function(b){
        b.onclick = function(){
            if (b.dataset.v){ var p = perms(); p[kind] = b.dataset.v; save(p); toastMsg('সেভ হয়েছে ✅'); settings(); }
            w.remove();
        };
    });
}

/* ══════════ Settings ══════════ */
function ov(id, title, back){
    var o = $(id); if (!o){ o = document.createElement('div'); o.id = id; o.className = 'ri-ov'; document.querySelector('.app-container').appendChild(o); }
    o.innerHTML = '<div class="ri-ov-head"><button class="ri-back"><i class="fa-solid fa-arrow-left"></i></button><h3>' + title + '</h3><span></span></div><div class="ri-ov-body"></div>';
    o.querySelector('.ri-back').onclick = function(){ o.classList.remove('on'); if (back) back(); };
    o.classList.add('on'); return o.querySelector('.ri-ov-body');
}
function nameOf(v){ return (CH.filter(function(c){ return c[0] === v; })[0] || ['', v])[1]; }
function settings(){
    if (!staff()) return;
    var p = perms(), owner = role() === 'owner', b = ov('riSet', 'Settings');
    var h = '';
    if (adminOK('info')) h += '<div class="ri-g">রুমের তথ্য</div>'
        + '<div class="ri-row" data-a="edit"><span>ছবি ও নাম বদলান</span><i class="fa-solid fa-chevron-right"></i></div>'
        + '<div class="ri-row" data-a="topic"><span>টপিক বদলান</span><i class="fa-solid fa-chevron-right"></i></div>'
        + '<div class="ri-row" data-a="rules"><span>নিয়ম বদলান</span><i class="fa-solid fa-chevron-right"></i></div>';
    if (owner) h += '<div class="ri-g">কে কী করতে পারবে</div>'
        + '<div class="ri-row" data-c="chat"><span>চ্যাটে কে লিখবে</span><em>' + nameOf(p.chat) + '</em></div>'
        + '<div class="ri-row" data-c="mic"><span>মাইকে কে বসবে</span><em>' + nameOf(p.mic) + '</em></div>'
        + '<div class="ri-row" data-c="music"><span>মিউজিক কে চালাবে</span><em>' + nameOf(p.music) + '</em></div>'
        + '<div class="ri-row" data-c="clear"><span>চ্যাট কে মুছতে পারবে</span><em>' + nameOf(p.clear) + '</em></div>';
    h += '<div class="ri-g">সাজসজ্জা</div>';
    if (adminOK('theme')) h += '<div class="ri-row" data-a="theme"><span>থিম ও সিট স্কিন</span><i class="fa-solid fa-chevron-right"></i></div>'
        + '<div class="ri-row" data-a="wall"><span>ওয়ালপেপার</span><i class="fa-solid fa-chevron-right"></i></div>';
    else h += '<div class="ri-note">মালিক আপনাকে এই অনুমতি দেননি</div>';
    h += '<div class="ri-g">মানুষ পরিচালনা</div>';
    if (owner) h += '<div class="ri-row" data-a="admins"><span>অ্যাডমিন নিয়োগ</span><i class="fa-solid fa-chevron-right"></i></div>';
    if (adminOK('block')) h += '<div class="ri-row" data-a="black"><span>ব্লক লিস্ট</span><i class="fa-solid fa-chevron-right"></i></div>';
    if (owner){
        var a = p.adminCan;
        h += '<div class="ri-g">অ্যাডমিন কী কী করতে পারবে</div>'
          + sw('mute', 'ইউজার মিউট ও মাইক থেকে নামানো', a.mute) + sw('block', 'ব্লক ও আনব্লক', a.block)
          + sw('theme', 'থিম ও ওয়ালপেপার', a.theme) + sw('info', 'রুমের নাম, ছবি ও টপিক বদলানো', a.info);
    }
    b.innerHTML = h;
    b.querySelectorAll('[data-c]').forEach(function(r){ r.onclick = function(){ choose(r.querySelector('span').textContent, r.dataset.c); }; });
    b.querySelectorAll('.ri-sw').forEach(function(r){ r.onclick = function(){ var q = perms(); q.adminCan[r.dataset.k] = !q.adminCan[r.dataset.k]; save(q); settings(); }; });
    var go = { edit: function(){ closeModal('memberModal'); openEditRoom(); }, topic: function(){ editTopic(); setTimeout(renderInfo, 300); }, rules: function(){ RXLive.editRules(); },
        theme: function(){ closeModal('memberModal'); openRoomTheme(); }, wall: function(){ closeModal('memberModal'); openWallpaperPicker(); },
        admins: function(){ closeModal('memberModal'); openAdminList(); }, black: function(){ closeModal('memberModal'); openBlacklist(); } };
    b.querySelectorAll('[data-a]').forEach(function(r){ r.onclick = function(){ $('riSet').classList.remove('on'); go[r.dataset.a](); }; });
}
function sw(k, t, on){ return '<div class="ri-row ri-sw" data-k="' + k + '"><span>' + t + '</span><i class="ri-tg' + (on ? ' on' : '') + '"></i></div>'; }

/* ══════════ Rewards (ডেমো — র‍্যান্ডম, আসল হিসাব সার্ভার তৈরির সময়) ══════════ */
function rewards(){
    if (role() !== 'owner') return;
    var d = demo(), b = ov('riRew', 'Room Rewards');
    b.innerHTML =
      '<div class="rw-top"><div class="rw-av">Available (💎)</div><div class="rw-num">' + fmt(d.avail) + '</div>'
    + '<button class="rw-btn" id="rwGet"' + (d.avail ? '' : ' disabled') + '>Receive</button>'
    + '<div class="rw-m">এই মাসে রুমে গিফট: <b>' + fmt(d.flow) + ' 💎</b></div>'
    + '<div class="rw-s">রুমের পুরস্কার মাসের গিফট হিসাবে ধাপে ধাপে জমা হয়</div></div>'
    + '<div class="rw-tab">Cumulative Room Bonus</div>'
    + '<div class="rw-tbl"><div class="rw-r h"><span>গিফট 💎 (মাসে)</span><span>পুরস্কার 💎</span></div>'
    + TARGETS.map(function(t){ return '<div class="rw-r' + (d.flow >= t[0] ? ' ok' : '') + '"><span>' + fmt(t[0]) + '</span><span>' + fmt(t[1]) + '</span></div>'; }).join('')
    + '</div><div class="rw-note">⚠ এটা ডেমো সংখ্যা। আসল হিসাব রুম সার্ভারে যুক্ত হলে চালু হবে।</div>'
    + '<button class="rw-rec" id="rwRec">Record</button>';
    $('rwGet').onclick = function(){
        var x = demo(); if (!x.avail) return;
        x.rec.unshift({ ts: Date.now(), n: x.avail }); x.avail = 0; putDemo(x); toastMsg('💎 পুরস্কার নেওয়া হয়েছে (ডেমো)'); rewards();
    };
    $('rwRec').onclick = function(){
        var x = demo();
        pop('Record', x.rec.length ? x.rec.map(function(r){ return '<div class="ri-rec"><span>' + new Date(r.ts).toLocaleString('bn-BD') + '</span><b>+' + fmt(r.n) + ' 💎</b></div>'; }).join('') : '<div class="ri-empty">কোনো রেকর্ড নেই</div>');
    };
}

/* ══════════ অনুমতি আরোপ (আগের ফাংশনের কাজ অক্ষত, আগে শুধু যাচাই) ══════════ */
function guard(name, kind, fnWhy){
    var o = window[name]; if (typeof o !== 'function' || o.__ri) return;
    var n = function(){
        if (!fnWhy()){ return; }
        return o.apply(this, arguments);
    }; n.__ri = 1; window[name] = n;
}
function wrapAll(){
    guard('sendChatMessage', 'chat', function(){ if (can('chat')) return true; toastMsg('🚫 ' + why('chat')); return false; });
    guard('openMusicPanel', 'music', function(){ if (can('music')) return true; toastMsg('🚫 ' + why('music')); return false; });
    guard('playMusicFile', 'music', function(){ if (can('music')) return true; toastMsg('🚫 ' + why('music')); return false; });
    ['openEditRoom','editTopic'].forEach(function(n){ guard(n, 'info', function(){ if (adminOK('info')) return true; toastMsg('🚫 এই অনুমতি মালিক দেননি'); return false; }); });
    ['openRoomTheme','openWallpaperPicker'].forEach(function(n){ guard(n, 'theme', function(){ if (adminOK('theme')) return true; toastMsg('🚫 এই অনুমতি মালিক দেননি'); return false; }); });
    ['openBlacklist'].forEach(function(n){ guard(n, 'block', function(){ if (adminOK('block')) return true; toastMsg('🚫 এই অনুমতি মালিক দেননি'); return false; }); });
    guard('profileMute', 'mute', function(){ if (adminOK('mute')) return true; toastMsg('🚫 এই অনুমতি মালিক দেননি'); return false; });
    guard('profileKick', 'mute', function(){ if (adminOK('mute')) return true; toastMsg('🚫 এই অনুমতি মালিক দেননি'); return false; });
    if (window.RXLive && !RXLive.__ri){
        var oc = RXLive.clearChat;
        RXLive.clearChat = function(){
            var r = role(), lv = perms().clear;
            if (!(r === 'owner' || (r === 'admin' && lv === 'admin'))){ toastMsg('🚫 শুধু মালিক চ্যাট মুছতে পারবে'); return; }
            return oc.apply(this, arguments);
        }; RXLive.__ri = 1;
    }
}

window.RoomInfo = { open: open, render: renderInfo, settings: settings, rewards: rewards, level: level };
document.addEventListener('DOMContentLoaded', function(){ build(); setTimeout(wrapAll, 0); });
setTimeout(function(){ build(); wrapAll(); }, 1200);
/* মডাল খোলার সময় ইনফো ঝালাই */
var tm = window.toggleMemberModal;
window.toggleMemberModal = function(){ var r = tm.apply(this, arguments); setTimeout(renderInfo, 0); return r; };
document.addEventListener('click', function(e){ if (e.target.closest && e.target.closest('#memberModal')) return; });
})();
