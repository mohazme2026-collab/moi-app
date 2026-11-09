/* room/moi-menu.js — Room Menu-র নতুন বাটনগুলো: Administrator, Blacklist, Sound + ছোট সাহায্যকারী
   (আগের ফাইল ছোঁয়নি — শুধু window.* ফাংশন যোগ করে) */
(function(){
'use strict';

/* ── সাধারণ নিচ থেকে ওঠা শিট (নতুন মেনু শিটগুলো এটাই ব্যবহার করে) ── */
window.moiSheet = function(title, html, opts){
    closeSheet();
    const w = document.createElement('div');
    w.className = 'moi-sheet-wrap';
    w.innerHTML = '<div class="moi-sheet-bk"></div><div class="moi-sheet' + (opts && opts.tall ? ' tall' : '') + '">'
        + '<div class="moi-sheet-head"><h3>' + title + '</h3><button class="moi-sheet-x" aria-label="বন্ধ"><i class="fa-solid fa-xmark"></i></button></div>'
        + '<div class="moi-sheet-body">' + html + '</div></div>';
    w.querySelector('.moi-sheet-bk').onclick = () => w.remove();
    w.querySelector('.moi-sheet-x').onclick = () => w.remove();
    document.querySelector('.app-container').appendChild(w);
    return w;
};
window.moiConfirm = function(title, msg, okText, onYes){
    const w = document.createElement('div');
    w.className = 'moi-confirm-wrap';
    w.innerHTML = '<div class="moi-confirm"><h4>' + title + '</h4><p>' + msg + '</p><div class="moi-confirm-btns"><button class="no">না</button><button class="yes">' + okText + '</button></div></div>';
    w.querySelector('.no').onclick = () => w.remove();
    w.querySelector('.yes').onclick = () => { w.remove(); onYes && onYes(); };
    document.querySelector('.app-container').appendChild(w);
};
const nm = uid => {
    const l = (state.listeners || []).find(x => x.uid === uid);
    const u = (typeof getUser === 'function') ? getUser(uid) : null;
    return { name: (l && l.name) || (u && u.name) || 'User', avatar: (l && l.avatar) || (u && (u.photo || u.avatar)) || GUEST_AVATAR, moiId: (u && u.moiId) || '' };
};
const row = (uid, extra, btns) => {
    const n = nm(uid);
    return '<div class="moi-row"><img src="' + esc(n.avatar) + '" onerror="this.src=GUEST_AVATAR"><div class="moi-row-info"><b>' + esc(n.name) + extra + '</b><small>ID: ' + esc(n.moiId || uid) + '</small></div>' + btns + '</div>';
};

/* ══════════ Administrator ══════════ */
window.openAdminList = function(){
    const owner = state.owner && state.owner.uid;
    const admins = (state.admins || []).filter(u => u !== owner);
    let h = '';
    if (owner) h += row(owner, ' <span class="moi-tag own">Owner</span>', '<button class="moi-mini" onclick="moiSeeProfile(\'' + esc(owner) + '\')">প্রোফাইল</button>');
    if (!admins.length) h += '<div class="moi-empty">এই রুমে এখনো কোনো অ্যাডমিন নেই।<br><small>জয়েন করা ইউজারের নামে চেপে অ্যাডমিন বানান।</small></div>';
    admins.forEach(uid => {
        h += row(uid, ' <span class="moi-tag adm">Admin</span>',
            '<button class="moi-mini" onclick="moiSeeProfile(\'' + esc(uid) + '\')">প্রোফাইল</button>'
            + (isOwner() ? '<button class="moi-mini red" onclick="moiRemoveAdmin(\'' + esc(uid) + '\')">নামান</button>' : ''));
    });
    moiSheet('<i class="fa-solid fa-user-tie"></i> অ্যাডমিন (' + admins.length + ')', h);
};
window.moiSeeProfile = function(uid){ document.querySelectorAll('.moi-sheet-wrap').forEach(e => e.remove()); setTimeout(() => { try { openUserProfile(uid); } catch(e){ toastMsg('প্রোফাইল খোলা যায়নি'); } }, 120); };
window.moiRemoveAdmin = async function(uid){
    if (!isOwner()){ toastMsg('শুধু Owner অ্যাডমিন নামাতে পারে'); return; }
    const n = nm(uid);
    moiConfirm('অ্যাডমিন নামাবেন?', esc(n.name) + ' আর অ্যাডমিন থাকবে না।', 'হ্যাঁ, নামান', async () => {
        const r = await MOIEco.try('setRoomAdmin', { roomId: ROOM_ID, uid, on: false });
        if (!r) return;
        state.admins = (state.admins || []).filter(x => x !== uid);
        const t = (state.listeners || []).find(x => x.uid === uid); if (t) t.role = 'member';
        try { renderListeners(); renderMembers(); renderSeats(); } catch(e){}
        toastMsg('⭐ ' + n.name + ' এখন User');
        openAdminList();
    });
};

/* ══════════ Blacklist (কিক করা ইউজার) ══════════ */
window.openBlacklist = function(){
    const list = ((getRoomInfo(ROOM_ID) || {}).bannedUsers || []).filter(Boolean);
    let h = '';
    if (!list.length) h = '<div class="moi-empty">কাউকে কিক করা হয়নি।<br><small>যাকে কিক করা হয় সে এখানে আসে।</small></div>';
    list.forEach(uid => { h += row(uid, '', '<button class="moi-mini green" onclick="moiUnblock(\'' + esc(uid) + '\')">আনব্লক</button>'); });
    moiSheet('<i class="fa-solid fa-user-slash"></i> ব্লক লিস্ট (' + list.length + ')', h);
};
window.moiUnblock = function(uid){
    if (!isAdminOrOwner()){ toastMsg('শুধু Owner/Admin আনব্লক করতে পারে'); return; }
    const left = ((getRoomInfo(ROOM_ID) || {}).bannedUsers || []).filter(x => x !== uid);
    saveRoomInfo(ROOM_ID, { bannedUsers: left });
    toastMsg('✅ আনব্লক হয়েছে — এখন আবার রুমে ঢুকতে পারবে');
    openBlacklist();
};

/* ══════════ Sound (রুমের সব শব্দ আমার ফোনে বন্ধ/চালু) ══════════ */
const SKEY = 'moi_room_sound_off';
let off = false;
try { off = localStorage.getItem(SKEY) === '1'; } catch(e){}
function applyMedia(el){ try { el.muted = off ? true : !!el._moiWantMuted; } catch(e){} }
const _play = HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play = function(){ applyMedia(this); return _play.apply(this, arguments); };
const _setM = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'muted');
function paintSound(){
    document.querySelectorAll('audio,video').forEach(applyMedia);
    const b = document.getElementById('roomMutedBadge'); if (b) b.classList.toggle('show', off);
    const ic = document.getElementById('menuSoundIcon'), lb = document.getElementById('menuSoundLabel'), it = document.getElementById('menuSoundItem');
    if (ic) ic.className = 'fa-solid ' + (off ? 'fa-volume-xmark' : 'fa-volume-high');
    if (lb) lb.textContent = off ? 'Sound Off' : 'Sound';
    if (it) it.classList.toggle('active-feature', off);
}
window.moiToggleSound = function(){
    off = !off;
    try { localStorage.setItem(SKEY, off ? '1' : '0'); } catch(e){}
    paintSound();
    toastMsg(off ? '🔇 রুমের সব শব্দ আপনার জন্য বন্ধ' : '🔊 রুমের শব্দ চালু');
};
window.moiIsSoundOff = () => off;
new MutationObserver(() => document.querySelectorAll('audio,video').forEach(applyMedia)).observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('DOMContentLoaded', paintSound);
setTimeout(paintSound, 300);

/* ══════════ Lucky Box — কিবোর্ডে লেখা অ্যামাউন্ট ══════════ */
window.luckyCustomInput = function(){
    const c = document.getElementById('luckyCustom');
    if (c && c.value !== '') document.querySelectorAll('#luckyDiamonds .lucky-chip').forEach(x => x.classList.remove('active'));
};
})();
