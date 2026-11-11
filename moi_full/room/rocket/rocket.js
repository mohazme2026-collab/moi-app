/* room/rocket/rocket.js — রুম রকেট
   • যেকোনো রুমে (যে-ই গিফট করুক) গিফটের 💎 জমে; ১০০০ হলে রকেট ছাড়ে, জমা আবার ০ থেকে শুরু
   • ছাড়লে সব রুমে ব্রডকাস্ট ব্যানার যায় (shared/broadcast), রুমে ১০ সেকেন্ডের বড় রকেট (মাঝে কাউন্টডাউন, নিচে আগুন-ধোঁয়া)
   • ১০ সেকেন্ডে যে চাপে সে শুধু নাম লেখায় — কিছু দেখানো হয় না; সময় শেষে রকেট উড়ে যায় আর ফলাফল দেখায়
   • হিসাব সব MOIEco-র rocketState / rocketAdd / rocketJoin / rocketSettle-এ (shared/core/economy.js) */
(function(){
    'use strict';
    var S = { prog: 0, target: 1000, launch: null, off: 0 };
    var seen = '', joinedId = '', settledId = '', shownId = '', els = {}, lastSec = -1, puffAt = 0;
    function rid(){ return typeof ROOM_ID !== 'undefined' ? ROOM_ID : ''; }
    function me(){ return typeof myProfile !== 'undefined' ? myProfile : null; }
    function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); }
    function nowS(){ return Date.now() + (S.off || 0); }
    function remain(){ return S.launch ? S.launch.t1 - nowS() : 0; }
    function fmt(n){ return Number(n || 0).toLocaleString('en-US'); }
    function app(){ return document.querySelector('.app-container'); }
    function roomPic(){ var i = document.querySelector('#room-logo-preview img'); return (i && i.getAttribute('src')) || ''; }
    var PH = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#4a3a8a"/><circle cx="50" cy="38" r="18" fill="#c9b8ff"/><ellipse cx="50" cy="86" rx="30" ry="24" fill="#c9b8ff"/></svg>');
    function img(src){ return '<img src="' + esc(src || PH) + '" alt="" onerror="this.onerror=null;this.src=\'' + PH + '\'">'; }

    /* ─── ছোট রকেট + প্যানেল বানানো ─── */
    function build(){
        var a = app(); if (!a || els.fab) return;
        var fab = document.createElement('div'); fab.className = 'rk-fab'; fab.id = 'rkFab';
        fab.innerHTML = '<img src="rocket/rocket-s.png" alt=""><div class="rk-fab-bar"><i id="rkFabBar"></i></div>';
        fab.addEventListener('click', openSheet);
        a.appendChild(fab); els.fab = fab;

        var wrap = document.createElement('div'); wrap.className = 'rk-sheet-wrap'; wrap.id = 'rkSheetWrap';
        wrap.innerHTML =
            '<div class="rk-sheet-bk"></div><div class="rk-sheet">' +
            '<button class="rk-x" type="button" aria-label="close">✕</button>' +
            '<div class="rk-hero" id="rkHero"><img src="rocket/rocket.png" alt=""></div>' +
            '<div class="rk-meter"><div class="rk-left"><span id="rkLeft">0</span><span>💎</span></div>' +
            '<div class="rk-bar"><i id="rkBar"></i></div><div class="rk-bar-l"><span id="rkBarL">0</span><span id="rkBarR">1,000</span></div></div>' +
            '</div>';
        a.appendChild(wrap); els.wrap = wrap;
        wrap.querySelector('.rk-sheet-bk').addEventListener('click', closeSheet);
        wrap.querySelector('.rk-x').addEventListener('click', closeSheet);
        /* ডেমো মোডে (গোপন): রকেটের ছবিতে ১ সেকেন্ড চেপে ধরলে +১০০ 💎 যোগ — টেস্টের জন্য */
        if (window.__MOCK){
            var t = null, hero = wrap.querySelector('#rkHero');
            hero.addEventListener('touchstart', function(){ t = setTimeout(function(){ add(100); }, 1000); }, { passive: true });
            ['touchend', 'touchmove', 'touchcancel'].forEach(function(ev){ hero.addEventListener(ev, function(){ clearTimeout(t); }, { passive: true }); });
            hero.addEventListener('mousedown', function(){ t = setTimeout(function(){ add(100); }, 1000); });
            hero.addEventListener('mouseup', function(){ clearTimeout(t); });
        }
    }
    function openSheet(){ build(); els.wrap.classList.add('on'); render(); }
    function closeSheet(){ if (els.wrap) els.wrap.classList.remove('on'); }

    /* ─── ১০ সেকেন্ডের বড় রকেট ─── */
    function showBig(){
        var a = app(); if (!a || els.big) return;
        closeSheet();
        var d = document.createElement('div'); d.className = 'rk-big'; d.id = 'rkBig';
        d.innerHTML = '<div class="rk-fx"><i class="rk-fl l"></i><i class="rk-fl r"></i><i class="rk-fl m"></i><div class="rk-smoke"></div></div>' +
            '<div class="rk-hint">TAP THE ROCKET!</div>' +
            '<div class="rk-body"><img src="rocket/rocket.png" alt=""><div class="rk-count">10</div></div>';
        /* চাপলে শুধু নাম লেখানো — স্ক্রিনে কিছু বদলায় না */
        d.querySelector('.rk-body').addEventListener('click', join);
        a.appendChild(d); els.big = d; lastSec = -1; puffAt = 0;
    }
    function puff(burst){
        if (!els.big) return;
        var sm = els.big.querySelector('.rk-smoke'); if (!sm) return;
        var p = document.createElement('i'); p.className = 'rk-puff';
        var w = 34 + Math.random() * 40, side = (Math.random() < .5 ? -1 : 1);
        p.style.cssText = '--w:' + w.toFixed(0) + 'px;--dx:' + (side * (20 + Math.random() * (burst ? 120 : 70))).toFixed(0) + 'px;--dy:' + (40 + Math.random() * (burst ? 150 : 90)).toFixed(0) +
            'px;--s:' + (2 + Math.random() * 1.8).toFixed(2) + ';--d:' + (1.5 + Math.random() * 1).toFixed(2) + 's;left:' + ((Math.random() - .5) * 46).toFixed(0) + 'px';
        sm.appendChild(p); setTimeout(function(){ p.remove(); }, 2700);
    }
    function flyAway(){
        var d = els.big; if (!d) return; els.big = null;
        d.classList.add('fly');
        var sm = d.querySelector('.rk-smoke'); if (sm) for (var i = 0; i < 16; i++) (function(k){ setTimeout(function(){
            var p = document.createElement('i'); p.className = 'rk-puff'; var side = k % 2 ? 1 : -1;
            p.style.cssText = '--w:' + (50 + Math.random() * 40).toFixed(0) + 'px;--dx:' + (side * (30 + Math.random() * 130)).toFixed(0) + 'px;--dy:' + (30 + Math.random() * 120).toFixed(0) + 'px;--s:3;--d:1.8s;left:' + ((Math.random() - .5) * 60).toFixed(0) + 'px';
            sm.appendChild(p);
        }, k * 50); })(i);
        setTimeout(function(){ d.remove(); }, 2800);
    }
    /* প্রতি ২০০ms: কাউন্টডাউন, কাঁপুনি/আগুন বাড়ানো, ধোঁয়া */
    function tick(){
        if (!S.launch) return;
        var rem = remain();
        if (rem > 0 && els.big){
            var pw = Math.min(1, Math.max(0, 1 - rem / 10000)), sec = Math.ceil(rem / 1000);
            els.big.style.setProperty('--sh', (0.5 + pw * 3.6).toFixed(2));
            els.big.style.setProperty('--f', (0.55 + pw * 1.15).toFixed(2));
            var c = els.big.querySelector('.rk-count');
            if (sec !== lastSec){ lastSec = sec; c.textContent = sec; c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse'); }
            var gap = 190 - pw * 120, t = Date.now(); if (t - puffAt > gap){ puffAt = t; puff(false); if (pw > .6) puff(false); }
        }
        if (rem <= 0){ if (els.big) flyAway(); settle(); }
        render();
    }

    /* ─── চাপা: শুধু নাম লেখানো ─── */
    async function join(){
        if (!S.launch || remain() <= 0 || joinedId === S.launch.id) return;
        joinedId = S.launch.id;
        try { if (navigator.vibrate) navigator.vibrate(15); } catch(e){}
        try { await MOIEco.call('rocketJoin', { roomId: rid() }); } catch(e){ /* গেস্ট বা দেরি — চুপচাপ */ }
    }
    /* ─── সময় শেষ: ফলাফল আনা ─── */
    async function settle(){
        if (!S.launch || settledId === S.launch.id) return;
        settledId = S.launch.id;
        for (var i = 0; i < 6; i++){
            try { apply(await MOIEco.call('rocketSettle', { roomId: rid() })); return; }
            catch(e){ if (e && e.code === 'NOT_READY'){ await new Promise(function(r){ setTimeout(r, 400); }); continue; } return; }
        }
    }

    /* ─── ফলাফল কার্ড ─── */
    function showResult(L){
        var a = app(); if (!a || !L || !L.result) return;
        shownId = L.id;
        var R = L.result, mine = R.mine;
        var h = '<div class="rk-res"><div class="rk-card"><button class="rk-x" type="button">✕</button><div class="rk-rt">🚀 ROCKET RESULT</div>';
        if (mine > 0) h += '<div class="rk-me"><div class="big">+' + mine + ' 💎</div><small>You got it!</small></div>';
        else if (mine === 0) h += '<div class="rk-me"><div class="cry">😭</div><small>Better luck next time</small></div>';
        if (R.winners.length) h += '<div class="rk-list">' + R.winners.map(function(w){
            return '<div class="rk-row"><span class="av">' + img(w.avatar) + '</span><span class="nm">' + esc(w.name) + '</span><span class="am">+' + w.amt + ' 💎</span></div>'; }).join('') + '</div>';
        else h += '<div class="rk-none">No one won this time</div>';
        h += '</div></div>';
        var d = document.createElement('div'); d.innerHTML = h; var el = d.firstChild;
        a.appendChild(el);
        if (mine > 0){ var card = el.querySelector('.rk-card'), cols = ['#ffd45a', '#ff7a3d', '#ff4d8d', '#5ad1ff', '#8aff7a'];
            for (var i = 0; i < 26; i++){ var c = document.createElement('i'); c.className = 'rk-conf';
                c.style.cssText = 'left:' + (Math.random() * 100).toFixed(0) + '%;background:' + cols[i % 5] + ';animation-delay:' + (Math.random() * .8).toFixed(2) + 's'; card.appendChild(c); } }
        var close = function(){ el.remove(); };
        el.querySelector('.rk-x').addEventListener('click', close);
        el.addEventListener('click', function(e){ if (e.target === el) close(); });
        setTimeout(close, 9000);
        if (mine > 0){ try { giftUpdateBalance(); } catch(e){} }
    }

    /* ─── আঁকা (মিটার) ─── */
    function render(){
        var pct = Math.min(100, S.prog / S.target * 100), left = Math.max(0, S.target - S.prog);
        var bar = document.getElementById('rkFabBar'); if (bar) bar.style.width = pct + '%';
        if (els.wrap){
            document.getElementById('rkBar').style.width = pct + '%';
            document.getElementById('rkLeft').textContent = fmt(left);
            document.getElementById('rkBarL').textContent = fmt(S.prog);
            document.getElementById('rkBarR').textContent = fmt(S.target);
            
        }
    }

    /* ─── সার্ভারের উত্তর প্রয়োগ ─── */
    function apply(r){
        if (!r) return;
        S.prog = r.prog || 0; S.target = r.target || 1000; S.launch = r.launch || null;
        if (typeof r.now === 'number') S.off = r.now - Date.now();
        var L = S.launch;
        if (L && remain() > 0 && L.id !== seen){ seen = L.id; showBig(); }
        if (L && L.result && L.id === seen && L.id !== shownId) showResult(L);
        render();
    }
    async function refresh(){
        if (document.hidden || !rid()) return;
        try { apply(await MOIEco.call('rocketState', { roomId: rid() })); } catch(e){}
    }
    /* গিফটের 💎 যোগ; এই গিফটেই ১০০০ পূর্ণ হলে ছাড়ার ব্যানার সব রুমে পাঠানো (ছবি = যে ছাড়ল তার, না থাকলে রুমের) */
    async function add(amount){
        if (!(amount >= 1) || !rid()) return;
        try {
            var r = await MOIEco.call('rocketAdd', { roomId: rid(), amount: amount });
            apply(r);
            if (r && r.launched && window.MOIBroadcast){
                var p = (window.MOIAuth && MOIAuth.profile) || me() || {};
                MOIBroadcast.publish({ type: 'rocket', roomId: rid(), as: { uid: p.uid, name: p.name || 'User', photo: p.photo || p.avatar || roomPic() } });
            }
        } catch(e){ /* গেস্ট বা নেটের সমস্যা — চুপচাপ */ }
    }

    function init(){
        build();
        refresh(); setInterval(refresh, 1500); setInterval(tick, 200);
        document.addEventListener('visibilitychange', refresh);
    }
    window.MOIRocket = { onGift: function(n){ add(n); }, refresh: refresh, add: add };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
