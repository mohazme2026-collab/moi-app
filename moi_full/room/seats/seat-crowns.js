/* room/lottie.js — রুমে ভিডিও-মুকুট: যার মুকুট আছে তার সিট ও প্রোফাইলের ছবির চারপাশে স্বচ্ছ ভিডিও ঘোরে।
   মুকুটের আসল কোড shared/svip/crown.js এ (ছবি: shared/svip/levels/levelN/crown.webp). পুরোনো Lottie মুকুট পুরোপুরি বাদ। */

console.log('[ROOM] lottie.js loaded');

/* true হলে মুকুট কারও না থাকলেও দেখার জন্য প্রথম বসা ছবিতে নমুনা দেখায় — আসল ব্যবহারে false করুন */
const CROWN_SAMPLE = true;

function refreshAllRings(){
    if (!window.MOICrown) return;
    const seats = [...document.querySelectorAll('.seat')];
    let any = false;
    seats.forEach(seatEl => {
        const av = seatEl.querySelector('.seat-avatar'); if (!av) return;
        const uid = seatEl.dataset.uid;
        if (!uid){ MOICrown.detach(av); seatEl.classList.remove('has-crown'); return; }
        const ok = !!MOICrown.attachUser(av, getUser(uid));
        if (ok) any = true; else MOICrown.detach(av);
        seatEl.classList.toggle('has-crown', ok);
    });
    if (CROWN_SAMPLE && !any){
        const first = seats.find(x => x.dataset.uid);
        if (first){ MOICrown.attach(first.querySelector('.seat-avatar'), 'svip1'); first.classList.add('has-crown'); }
    }
    /* প্রোফাইল মডাল */
    const profModal = $('userProfileModal');
    if (profModal && profModal.classList.contains('active') && typeof currentProfileUid !== 'undefined' && currentProfileUid){
        const wrap = document.querySelector('.profile-avatar-wrap');
        if (wrap) MOICrown.attachUser(wrap, getUser(currentProfileUid));
    }
}
window.refreshAllRings = refreshAllRings;
