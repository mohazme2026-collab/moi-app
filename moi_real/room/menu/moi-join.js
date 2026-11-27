/* room/moi-join.js — Join / Unjoin নিশ্চিতকরণ (আসল প্ল্যাটফর্মের মতো) */
(function(){
'use strict';
window.moiConfirmUnjoin = function(){
    const adm = state.myRole === 'admin';
    moiConfirm('আনজয়েন করতে চান?',
        'আপনি এই রুম থেকে আনজয়েন হবেন।' + (adm ? '<br><b>আপনার অ্যাডমিন পদও চলে যাবে।</b>' : ''),
        'হ্যাঁ, আনজয়েন',
        () => { window._unjoinOk = true; toggleJoinRoom(); });
};
/* অ্যাডমিন আনজয়েন করলে পদ ছেড়ে দেয় */
window.moiAdminSelfLeave = async function(){
    if (!myProfile) return;
    const r = await MOIEco.try('setRoomAdmin', { roomId: ROOM_ID, uid: myProfile.uid, on: false });
    if (!r) return;
    state.admins = (state.admins || []).filter(x => x !== myProfile.uid);
    state.myRole = computeMyRole();
    try { updateRoleFlag(); updateSettingsVisibility(); renderSeats(); renderMembers(); updateJoinButton(); } catch(e){}
};
})();
