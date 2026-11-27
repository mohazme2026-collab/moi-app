/* room/bag.js — ব্যাগ: এন্ট্রি অ্যানিমেশন, নেম, প্রোফাইল ফ্রেম (মুকুট পরে ভিডিও-মুকুট সিস্টেম থেকে আসবে)
   নতুন ট্যাব যোগ করতে BAG_TABS-এ এক লাইন + নিচে তার render ফাংশন। */
(function(){
'use strict';
const BAG_TABS = [
    { id:'entry', label:'এন্ট্রি অ্যানিমেশন', icon:'fa-wand-magic-sparkles' },
    { id:'name',  label:'নেম',            icon:'fa-signature' },
    { id:'frame', label:'প্রোফাইল ফ্রেম',    icon:'fa-circle-user' }
];
let tab = 'entry', sel = null, onSeat = false;
const M = () => window.MOI || {};
const meu = () => (M().me && M().me()) || {};
const myPhoto = () => (myProfile && myProfile.avatar) || GUEST_AVATAR;

window.openBag = function(){
    tab = 'entry'; sel = null; onSeat = false;
    const w = moiSheet('<i class="fa-solid fa-bag-shopping"></i> আমার ব্যাগ', '<div id="bagRoot"></div>', { tall:true });
    w.classList.add('bag');
    const close = () => { moiBagClean(); };
    w.querySelector('.moi-sheet-x').addEventListener('click', close);
    w.querySelector('.moi-sheet-bk').addEventListener('click', close);
    draw();
};
window.moiBagClean = function(){
    onSeat = false;
};

function draw(){
    const root = document.getElementById('bagRoot'); if (!root) return;
    root.innerHTML = '<div class="bag-tabs">' + BAG_TABS.map(t =>
        '<button class="' + (t.id === tab ? 'on' : '') + '" onclick="moiBagTab(\'' + t.id + '\')"><i class="fa-solid ' + t.icon + '"></i><span>' + t.label + '</span></button>').join('') + '</div>'
        + '<div class="bag-pane" id="bagPane"></div>';
    ({ entry: soonPane, name: soonPane, frame: framePane })[tab]();
}
window.moiBagTab = function(t){ tab = t; sel = null; if (onSeat){ onSeat = false; try { renderSeats(); } catch(e){} } draw(); };

/* ── প্রোফাইল ফ্রেম (আগে থেকে থাকা ফ্রেম লিস্ট) ── */
function framePane(){
    const pane = document.getElementById('bagPane');
    const F = M().FRAMES || [];
    pane.innerHTML = '<div class="bag-grid">' + F.map(f =>
        '<div class="bag-item"><div class="bag-thumb"><div class="mx-ring ' + f.cls + '"><img src="' + esc(myPhoto()) + '" onerror="this.src=GUEST_AVATAR"></div></div><b>' + esc(f.name) + '</b><em>' + (f.price ? '💎 ' + f.price : 'ফ্রি') + '</em></div>').join('') + '</div>'
        + '<p class="bag-note">ফ্রেম কিনতে ও পরতে: Me → Store। এখানে শুধু দেখা যাচ্ছে।</p>';
}

/* ── যে ট্যাবের কাজ বাকি ── */
function soonPane(){
    const t = BAG_TABS.find(x => x.id === tab);
    document.getElementById('bagPane').innerHTML = '<div class="moi-empty"><i class="fa-solid ' + t.icon + '" style="font-size:34px;color:var(--c3);margin-bottom:10px"></i><br><b>' + t.label + '</b><br><small>এখানে ' + t.label + ' থাকবে — কাজ চলছে, শীঘ্রই আসছে।</small></div>';
}
})();
