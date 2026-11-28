/* splash/splash.js — শুরুর পর্দা: ৩ সেকেন্ড দেখিয়ে সঠিক জায়গায় পাঠায়
   লগইন নেই  → লগইন পেজ
   লগইন আছে → বিজ্ঞাপন পর্দা (তীর চাপলে হোম, বোতামে রুম) */
(function(){
    'use strict';
    var MIN = 3000, MAXWAIT = 9000;
    var LOGIN = '../login/index.html', HOME = '../home/index.html', ROOM = '../room/index.html';
    /* বিজ্ঞাপনের লেখা ও রুম — এখানেই বদলাবে। roomId ফাঁকা থাকলে বোতাম সরাসরি হোমে নেবে */
    var AD = { title: 'ডায়মন্ড ও মুকুট অফার', sub: 'বিশেষ সুবিধা পেতে এখনই ঢুকুন', btn: 'রুমে ঢুকুন', roomId: '' };

    var $ = function(id){ return document.getElementById(id); };
    var done = false;
    function go(u){ if (done) return; done = true; location.replace(u); }

    /* তারা ছড়ানো */
    (function(){
        var box = $('stars'), pos = [[12,14],[82,10],[24,30],[70,26],[8,44],[90,40],[50,8],[36,52],[64,56],[18,66],[84,68],[48,74]];
        pos.forEach(function(p, i){
            var s = document.createElement('i');
            s.style.left = p[0] + '%'; s.style.top = p[1] + '%';
            s.style.animationDelay = (i * 0.17) + 's';
            s.style.width = s.style.height = (12 + (i % 4) * 5) + 'px';
            box.appendChild(s);
        });
    })();
    new Image().src = 'ad.webp';   /* বিজ্ঞাপন ছবি আগেই নামিয়ে রাখা */

    var t0 = Date.now(), result = null;   /* result: 'login' | 'ad' */
    function decide(){
        if (result === null) return;
        var wait = Math.max(0, MIN - (Date.now() - t0));
        setTimeout(function(){
            if (result === 'login') return go(LOGIN);
            showAd();
        }, wait);
    }
    function showAd(){
        $('oTitle').textContent = AD.title; $('oSub').textContent = AD.sub; $('oBtn').textContent = AD.btn;
        $('v1').classList.remove('show'); $('v2').classList.add('show');
    }
    $('skip').addEventListener('click', function(){ go(HOME); });
    $('oBtn').addEventListener('click', function(){ go(AD.roomId ? ROOM + '?room=' + encodeURIComponent(AD.roomId) : HOME); });

    /* ফাইরবেস না পেলে বা দেরি হলে লগইন পেজ */
    setTimeout(function(){ if (result === null) go(LOGIN); }, MAXWAIT);
    if (!window.MOIFB || !MOIFB.auth){ result = 'login'; return decide(); }

    var handled = false;
    MOIFB.auth.onAuthStateChanged(function(u){
        if (handled) return; handled = true;
        if (!u){ result = 'login'; return decide(); }
        /* প্রোফাইল অসম্পূর্ণ হলে লগইন পেজেই সেটআপ হবে */
        MOIFB.db.collection('users').doc(u.uid).get().then(function(s){
            var d = s && s.exists ? s.data() : null;
            result = (d && (d.profileComplete || d.role === 'guest')) ? 'ad' : 'login';
            decide();
        }).catch(function(){ result = 'login'; decide(); });
    });
})();
