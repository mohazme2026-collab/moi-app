/* demo/profile-demo.js — ডেমো: Supporters / Contribution দেখার জন্য নমুনা মানুষ (বট)
   প্রথমবার ১৮ জন বট বসে — যারা আপনাকে ডায়মন্ড গিফট দিয়েছে (সবচেয়ে বেশি → কম)।
   আসল ডেটাবেস ফেরত আনলে এই ফাইল বাদ — তখন আসল গিফট থেকেই তালিকা তৈরি হবে। */
(function(){
    'use strict';
    if (!window.MOIFB || !MOIFB.DEMO || !window.DEMO || !DEMO.USERS) return;
    const AMOUNTS = [1700000, 639400, 405200, 169800, 145300, 112000, 85000, 79200, 26100, 26000, 22300, 20000, 19800, 15000, 8100, 8100, 5100, 4400];
    function go(n){
        const p = window.MOIAuth && MOIAuth.profile;
        if (!p || !p.uid){ if (n < 80) setTimeout(() => go(n + 1), 250); return; }
        const ref = MOIFB.rtdb.ref(MOIFB.LIVE + '/supporters/' + p.uid);
        ref.get().then(s => {
            if (s.exists()) return;
            const pool = Object.keys(DEMO.USERS).filter(u => u !== p.uid && DEMO.USERS[u] && DEMO.USERS[u].name);
            if (pool.length < AMOUNTS.length) return;
            let st = 0; for (const ch of p.uid) st = (st * 31 + ch.charCodeAt(0)) >>> 0;
            const map = {};
            AMOUNTS.forEach((amt, i) => { const u = pool[(st + i * 11) % pool.length], d = DEMO.USERS[u]; map[u] = { name: d.name, photo: d.photo || '', amount: amt }; });
            ref.set(map);
        }).catch(() => {});
    }
    go(0);
})();
