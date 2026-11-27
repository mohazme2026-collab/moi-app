/* ═══ ছবি ডিকোড ব্যাকগ্রাউন্ডে (স্ক্রল/ট্যাপ আটকায় না) ═══ */
(function(){
    try {
        function fix(n){ if (n && n.nodeType === 1){ if (n.tagName === 'IMG' && !n.decoding) n.decoding = 'async'; else if (n.querySelectorAll){ var l = n.querySelectorAll('img'); for (var i = 0; i < l.length; i++) if (!l[i].decoding) l[i].decoding = 'async'; } } }
        new MutationObserver(function(ms){ for (var i = 0; i < ms.length; i++){ var a = ms[i].addedNodes; for (var j = 0; j < a.length; j++) fix(a[j]); } }).observe(document.documentElement, { childList: true, subtree: true });
    } catch(e){}
})();

/* ═══ লোকাল অ্যাভাটার: বাইরের সাইট ছাড়া ছবি (assets/av/b001..b100, g001..g100) ═══
   MOI_AVATAR(seed, gender) → একই seed সবসময় একই ছবি দেয়। gender: 'm'/'f' বা না দিলে seed থেকে। */
(function(){
    var base = '';
    try { base = new URL('../../assets/av/', document.currentScript.src).href; } catch(e){ base = location.href.split('?')[0].replace(/[^\/]*\/[^\/]*$/, '') + 'assets/av/'; }
    function h(str){ var x = 2166136261; str = String(str == null ? '' : str); for (var i = 0; i < str.length; i++){ x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
    window.MOI_AV_BASE = base;
    window.MOI_AVATAR = function(seed, gender){
        var n = h(seed);
        var g = gender ? String(gender).toLowerCase().charAt(0) : (n & 1 ? 'f' : 'm');
        var idx = (Math.floor(n / 2) % (g === 'f' ? 129 : 101)) + 1;
        return base + (g === 'f' ? 'g' : 'b') + ('00' + idx).slice(-3) + '.webp';
    };
})();

/* ═══ সত্যিকারের দেখা উচ্চতা (স্ট্যাটাস বার/নেভ বার বাদ) → --app-h ═══ */
(function(){
    function setH(){ try { document.documentElement.style.setProperty('--app-h', window.innerHeight + 'px'); } catch(e){} }
    setH();
    window.addEventListener('resize', setH);
    window.addEventListener('orientationchange', function(){ setTimeout(setH, 200); });
    window.addEventListener('pageshow', setH);
    setTimeout(setH, 300);
})();

/* ═══ PWA: অ্যাপ হিসেবে ইনস্টল (সব পেজে একবারেই) ═══
   এই ফাইল সব পেজে লোড হয়, তাই এখান থেকেই manifest ও service worker যুক্ত হয়। */
(function(){
    try {
        var src = (document.currentScript && document.currentScript.src) || '';
        var i = src.indexOf('shared/core/firebase-init.js');
        if (i < 0) return;
        var root = src.slice(0, i);
        var h = document.head || document.documentElement;
        function add(tag, attrs){ var e = document.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); h.appendChild(e); }
        if (!document.querySelector('link[rel="manifest"]')){
            add('link', { rel: 'manifest', href: root + 'manifest.json' });
            add('meta', { name: 'theme-color', content: '#120a28' });
            add('meta', { name: 'mobile-web-app-capable', content: 'yes' });
            add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
            add('link', { rel: 'apple-touch-icon', href: root + 'icons/icon-192.png' });
        }
        var NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
        if (NATIVE) { var us = document.createElement('script'); us.src = root + 'shared/core/apk-update.js'; h.appendChild(us); }
        else if ('serviceWorker' in navigator) window.addEventListener('load', function(){ navigator.serviceWorker.register(root + 'sw.js').catch(function(){}); });
    } catch(e){}
})();

/* shared/core/firebase-init.js — আসল Firebase (Auth + Firestore + Realtime Database)
   এই ফাইল শুধু Firebase লাইব্রেরি লোড করে, তারপর moi-firebase.js চালায়। */
console.log('[MOI] firebase-init.js loaded (REAL)');
(function(){
    try {
        var src = (document.currentScript && document.currentScript.src) || '';
        var i = src.indexOf('shared/core/firebase-init.js');
        if (i < 0) return;
        var root = src.slice(0, i), V = '10.14.1', B = 'https://www.gstatic.com/firebasejs/' + V + '/';
        ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-firestore-compat.js', 'firebase-database-compat.js'].forEach(function(f){
            document.write('<script src="' + B + f + '"><\/script>');
        });
        document.write('<script src="' + root + 'shared/core/moi-firebase.js"><\/script>');
    } catch(e){ console.error('[MOI] firebase load failed', e); }
})();

/* ═══ তাৎক্ষণিক ট্যাপ: ৩০০ms ডেলে নেই, ট্যাপে সাথে সাথে চাপার ফিডব্যাক ═══ */
(function(){
    try {
        var st = document.createElement('style');
        st.textContent = 'html,body{touch-action:manipulation;-webkit-tap-highlight-color:transparent}' +
            'button,a,[onclick],[role=button],.tab,.nav-item{touch-action:manipulation;-webkit-user-select:none;user-select:none}' +
            '*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}.seat-skinbox{filter:none!important}.seat-skinbox::after{display:none!important}' +
            'button:active,[onclick]:active,[role=button]:active{transform:scale(.96);opacity:.88;transition:transform .05s,opacity .05s}';
        (document.head || document.documentElement).appendChild(st);
    } catch(e){}
})();
