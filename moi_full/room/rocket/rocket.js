/* room/rocket/rocket.js — রুম রকেট
   • রুমে মোট ১০০০ 💎 গিফট পূর্ণ হলে রকেট ছাড়ে (শেষ গিফটদাতার ছবিসহ ব্যানার), ১০ সেকেন্ড রুমে থাকে
   • সবাই চাপলে একবার করে 3/5/10 💎 পেতে পারে (কোম্পানির উপহার), সময় শেষে রকেট উড়ে যায়
   • হিসাব সব MOIEco-র rocketState / rocketAdd / rocketClaim-এ (shared/core/economy.js) */
(function(){
    'use strict';
    var S = { prog: 0, target: 1000, launch: null, off: 0 };
    var seen = '', busy = false, flyDone = '', els = {};
    function rid(){ return typeof ROOM_ID !== 'undefined' ? ROOM_ID : ''; }
    function me(){ return typeof myProfile !== 'undefined' ? myProfile : null; }
    function toast(m){ try { (window.toastMsg || function(){})(m); } catch(e){} }
    function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); }
    function nowS(){ return Date.now() + (S.off || 0); }
    function remain(){ return S.launch ? S.launch.t1 - nowS() : 0; }
    function fmt(n){ return Number(n || 0).toLocaleString('en-IN'); }
    function roomPic(){
        var i = document.querySelector('#room-logo-preview img');
        return (i && i.getAttribute('src')) || '';
    }
    function app(){ return document.querySelector('.app-container'); }

    /* ─── বানানো ─── */
    function build(){
        var a = app(); if (!a || els.fab) return;
        var fab = document.createElement('div'); fab.className = 'rk-fab'; fab.id = 'rkFab';
        fab.innerHTML = '<img src="rocket/rocket-s.png" alt=""><span class="rk-fab-n" id="rkFabN"></span><div class="rk-fab-bar"><i id="rkFabBar"></i></div>';
        fab.addEventListener('click', openSheet);
        a.appendChild(fab); els.fab = fab;

        var wrap = document.createElement('div'); wrap.className = 'rk-sheet-wrap'; wrap.id = 'rkSheetWrap';
        wrap.innerHTML =
            '<div class="rk-sheet-bk"></div><div class="rk-sheet">' +
            '<button class="rk-x" type="button" aria-label="close">✕</button>' +
            '<div class="rk-h">🚀 ROOM ROCKET</div>' +
            '<div class="rk-hero" id="rkHero"><img src="rocket/rocket.png" alt=""><div class="rk-count" id="rkHeroCount"></div></div>' +
            '<div class="rk-need" id="rkNeed"></div>' +
            '<div class="rk-barwrap"><div class="rk-bar"><i id="rkBar"></i></div><div class="rk-bar-l"><span id="rkBarL">0 💎</span><span id="rkBarR">1000 💎</span></div></div>' +
            '<div class="rk-rules">রুমে সবার পাঠানো গিফট মিলে <b>১০০০ 💎</b> পূর্ণ হলেই রকেট ছাড়ে।<br>রকেট <b>১০ সেকেন্ড</b> রুমে থাকে — এর মধ্যে চাপলে <b>৩, ৫ বা ১০ 💎</b> উপহার পেতে পারেন (কেউ কিছু নাও পেতে পারেন)।<br>একজন একটা রকেটে একবারই নিতে পারবেন।</div>' +
            (window.__MOCK ? '<button class="rk-demo" id="rkDemo" type="button">ডেমো টেস্ট: +১০০ 💎 যোগ করুন</button>' : '') +
            '</div>';
        a.appendChild(wrap); els.wrap = wrap;
        wrap.querySelector('.rk-sheet-bk').addEventListener('click', closeSheet);
        wrap.querySelector('.rk-x').addEventListener('click', closeSheet);
        els.hero = wrap.querySelector('#rkHero');
        els.hero.addEventListener('click', function(){ if (S.launch && remain() > 0) claim(); });
        var d = wrap.querySelector('#rkDemo');
        if (d) d.addEventListener('click', function(){ add(100, true); });
    }
    function openSheet(){ build(); els.wrap.classList.add('on'); render(); }
    function closeSheet(){ if (els.wrap) els.wrap.classList.remove('on'); }

    /* ─── ব্যানার ─── */
    function banner(by){
        var a = app(); if (!a) return;
        var pic = (by && by.avatar) || roomPic();
        var name = (by && by.name) || 'Room';
        var b = document.createElement('div'); b.className = 'rk-banner';
        b.innerHTML = '<div class="rk-ban-av"><img src="' + esc(pic) + '" alt="" onerror="this.style.visibility=\'hidden\'"></div>' +
            '<div class="rk-ban-t"><b>🚀 ' + esc(name) + '</b><span>রকেট ছেড়েছেন! ১০ সেকেন্ডে ধরুন 🎁</span></div>' +
            '<img class="rk-ban-r" src="rocket/rocket-s.png" alt="">';
        a.appendChild(b); setTimeout(function(){ b.remove(); }, 5000);
    }

    /* ─── ১০ সেকেন্ডের বড় রকেট ─── */
    function showBig(){
        var a = app(); if (!a || els.big) return;
        var d = document.createElement('div'); d.className = 'rk-big'; d.id = 'rkBig';
        d.innerHTML = '<img src="rocket/rocket.png" alt=""><div class="rk-count"></div><div class="rk-tip">চাপুন 🎁</div>';
        d.addEventListener('click', claim);
        a.appendChild(d); els.big = d;
    }
    function hideBig(fly){
        var d = els.big; if (!d) return; els.big = null;
        if (fly){ d.classList.add('fly'); setTimeout(function(){ d.remove(); }, 1300); } else d.remove();
    }
    function popPrize(amount){
        var host = els.big || els.hero; if (!host) return;
        var p = document.createElement('div'); p.className = 'rk-pop' + (amount > 0 ? '' : ' none');
        p.textContent = amount > 0 ? '+' + amount + ' 💎' : 'এবার কিছু নেই 😅';
        host.appendChild(p); setTimeout(function(){ p.remove(); }, 2300);
    }

    /* ─── ক্লেম ─── */
    async function claim(){
        if (busy || !S.launch || remain() <= 0) return;
        if (S.launch.mine != null){ toast('আপনি এই রকেট থেকে নিয়ে ফেলেছেন'); return; }
        busy = true;
        try {
            var r = await MOIEco.call('rocketClaim', { roomId: rid() });
            S.launch.mine = r.amount; popPrize(r.amount);
            var m = me(); if (m && typeof r.balance === 'number'){ m.diamonds = r.balance; try { giftUpdateBalance(); } catch(e){} }
        } catch(e){
            if (e && e.code === 'ALREADY_CLAIMED'){ if (S.launch) S.launch.mine = 0; toast('আপনি এই রকেট থেকে নিয়ে ফেলেছেন'); }
            else if (e && e.code === 'NOT_READY') toast('রকেট চলে গেছে');
            else toast((e && e.userMsg) || 'সমস্যা হয়েছে');
        }
        busy = false; render();
    }

    /* ─── আঁকা ─── */
    function render(){
        var pct = Math.min(100, S.prog / S.target * 100), left = Math.max(0, S.target - S.prog);
        var live = !!(S.launch && remain() > 0), sec = Math.max(0, Math.ceil(remain() / 1000));
        var bar = document.getElementById('rkFabBar'); if (bar) bar.style.width = pct + '%';
        if (els.fab){ els.fab.classList.toggle('live', live); var n = document.getElementById('rkFabN'); if (n) n.textContent = live ? sec : ''; }
        if (els.big){
            els.big.querySelector('.rk-count').textContent = sec;
            els.big.classList.toggle('done', !!(S.launch && S.launch.mine != null));
            els.big.querySelector('.rk-tip').textContent = (S.launch && S.launch.mine != null) ? (S.launch.mine > 0 ? '+' + S.launch.mine + ' 💎 পেয়েছেন' : 'নেওয়া হয়েছে') : 'চাপুন 🎁';
        }
        if (els.wrap){
            document.getElementById('rkBar').style.width = pct + '%';
            document.getElementById('rkBarL').textContent = fmt(S.prog) + ' 💎';
            document.getElementById('rkBarR').textContent = fmt(S.target) + ' 💎';
            els.hero.classList.toggle('live', live);
            document.getElementById('rkHeroCount').innerHTML = live ? sec : Math.floor(pct) + '%<small>PROGRESS</small>';
            document.getElementById('rkNeed').innerHTML = live
                ? '🚀 রকেট চলছে! <b>' + sec + '</b> সেকেন্ডের মধ্যে রকেটে চাপুন'
                : 'রকেট ছাড়তে আর <b>' + fmt(left) + '</b> 💎 বাকি';
        }
    }

    /* ─── সার্ভারের উত্তর প্রয়োগ ─── */
    function apply(r){
        if (!r) return;
        S.prog = r.prog || 0; S.target = r.target || 1000; S.launch = r.launch || null;
        if (typeof r.now === 'number') S.off = r.now - Date.now();
        if (S.launch && remain() > 0){
            if (S.launch.id !== seen){ seen = S.launch.id; banner(S.launch.by); showBig(); }
            else if (!els.big && flyDone !== S.launch.id) showBig();
        } else if (els.big){ flyDone = seen; hideBig(true); }
        render();
    }
    async function refresh(){
        if (document.hidden || !rid()) return;
        try { apply(await MOIEco.call('rocketState', { roomId: rid() })); } catch(e){}
    }
    async function add(amount, loud){
        if (!(amount >= 1) || !rid()) return;
        try { apply(await MOIEco.call('rocketAdd', { roomId: rid(), amount: amount })); }
        catch(e){ if (loud) toast((e && e.userMsg) || 'সমস্যা হয়েছে'); }
    }

    /* প্রতি ২০০ms: কাউন্টডাউন; সময় শেষ হলে উড়ে যায় */
    setInterval(function(){
        if (!S.launch) return;
        if (remain() <= 0 && els.big){ flyDone = seen; hideBig(true); S.launch = null; }
        render();
    }, 200);

    function init(){
        build();
        refresh(); setInterval(refresh, 1500);
        document.addEventListener('visibilitychange', refresh);
    }
    window.MOIRocket = { onGift: function(n){ add(n, false); }, refresh: refresh, add: add };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
