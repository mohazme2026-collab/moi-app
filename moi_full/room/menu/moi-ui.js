/* room/moi-ui.js — নিচের বাটন বারের লজিক: মাইকে বসলে ইমোজি ও মিউট বাটন দেখানো।
   নতুন বাটন যোগ করতে: index.html-এর #moiDock-এ একটা <button class="md-btn"> বসান, রঙ moi-ui.css-এ। */
(function(){
    function seated(){
        try { return !!(typeof myProfile !== 'undefined' && myProfile && typeof state !== 'undefined' && state.seats.some(s => s && s.uid === myProfile.uid)); }
        catch(e){ return false; }
    }
    function sync(){ document.body.classList.toggle('moi-on-mic', seated()); }

    /* সিট বা মাইক বদলালেই আবার মিলিয়ে নেয় — আগের ফাংশনের কাজ অক্ষত থাকে */
    ['renderSeats','updateMicButton'].forEach(function(n){
        var orig = window[n];
        if (typeof orig !== 'function') return;
        window[n] = function(){ var r = orig.apply(this, arguments); sync(); return r; };
    });
    document.addEventListener('DOMContentLoaded', sync);
    setInterval(sync, 1500);   /* সার্ভার থেকে সিট বদলালে ধরার জন্য */
    sync();
})();

/* ── PK বার টপ-গিফটার লাইনের ঠিক নিচে ভাসে, তাই লাইনটা কখনো নড়ে না ── */
(function(){
    function placePk(){
        var pk = document.getElementById('pkBanner'), row = document.querySelector('.top-gifters-row');
        if (!pk || !row) return;
        pk.style.top = (row.offsetTop + row.offsetHeight - 2) + 'px';
    }
    setInterval(placePk, 500); window.addEventListener('resize', placePk); placePk();
})();

/* ── গিফট প্যানেলের বাইরে চাপলে বন্ধ ── */
document.addEventListener('click', function(e){
    var p = document.getElementById('giftPanel');
    if (!p || !p.classList.contains('open')) return;
    if (p.contains(e.target) || e.target.closest('.md-gift') || e.target.closest('.gift-combo-resend')) return;
    if (typeof closeGiftPanel === 'function') closeGiftPanel();
}, true);
