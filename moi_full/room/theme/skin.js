/* room/theme/skin.js — রুম থিম স্কিন: Skin ট্যাবের দোকান, Use/Unuse, সিটে স্কিন + আলোর ঝলক।
   ডেটা (RTDB): rooms/<id>/skin = {id}   rooms/<id>/skinOwn/<skinId> = মেয়াদের শেষ (ms)
   কেনা/ব্যবহার সার্ভার-হ্যান্ডলারে (economy.js buyRoomSkin / useRoomSkin) — শুধু Owner। */
(function(){
    'use strict';
    var SKINS = [
        { id: 'skin1', name: 'Croc King' },
        { id: 'skin2', name: 'Royal Pair' },
        { id: 'skin3', name: 'Purple Mic' },
        { id: 'skin4', name: 'Blue MOI' }
    ];
    var DIR = 'theme/skins/';
    var cur = '', own = {};
    function $(i){ return document.getElementById(i); }
    function isOwner(){ try { return state.myRole === 'owner'; } catch(e){ return false; } }
    function left(id){ return (own[id] || 0) - Date.now(); }
    function activeId(){ return cur && left(cur) > 0 ? cur : ''; }
    function url(id){ return DIR + id + '.png'; }
    function dur(ms){
        var d = Math.floor(ms / 86400000), h = Math.floor(ms % 86400000 / 3600000), m = Math.floor(ms % 3600000 / 60000);
        return d > 0 ? d + ' দিন ' + h + ' ঘণ্টা' : (h > 0 ? h + ' ঘণ্টা ' + m + ' মিনিট' : Math.max(1, m) + ' মিনিট');
    }
    function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]; }); }

    /* সিটের উপরে বসানোর HTML (theme.js থেকে ডাকা হয়) */
    function seatHTML(idx){
        var id = activeId(); if (!id) return '';
        return '<div class="seat-skinbox" style="--sk:url(' + url(id) + ');--d:' + ((idx % 7) * 0.35).toFixed(2) + 's"><img src="' + url(id) + '" alt=""></div>';
    }

    /* Skin ট্যাব */
    function render(body){
        if (!body) body = $('rtBody'); if (!body) return;
        var owner = isOwner(), now = Date.now(), act = activeId();
        var h = '<div class="sk-note">' + (owner ? 'স্কিন কিনলে রুমের সব সিটে এটা সবাই দেখবে' : 'শুধু রুমের Owner স্কিন কিনতে ও ব্যবহার করতে পারবে') + '</div><div class="sk-grid">';
        SKINS.forEach(function(s){
            var l = left(s.id), has = l > 0, on = act === s.id;
            h += '<div class="sk-card' + (on ? ' on' : '') + '"><div class="sk-img"><img src="' + url(s.id) + '" alt=""></div><div class="sk-name">' + esc(s.name) + '</div>';
            if (has){
                h += '<div class="sk-left">মেয়াদ: ' + dur(l) + '</div>' +
                     '<button class="sk-use' + (on ? ' un' : '') + '" ' + (owner ? '' : 'disabled') + ' onclick="RTSkin.use(\'' + (on ? '' : s.id) + '\')">' + (on ? 'Unuse' : 'Use') + '</button>';
            } else {
                h += '<div class="sk-buy"><button ' + (owner ? '' : 'disabled') + ' onclick="RTSkin.buy(\'' + s.id + '\',7)"><b>৭ দিন</b><span>1000 💎</span></button>' +
                     '<button ' + (owner ? '' : 'disabled') + ' onclick="RTSkin.buy(\'' + s.id + '\',30)"><b>৩০ দিন</b><span>2000 💎</span></button></div>';
            }
            h += '</div>';
        });
        body.innerHTML = h + '</div>';
    }
    function repaint(){
        try { if (typeof renderSeats === 'function') renderSeats(); } catch(e){}
        var b = $('rtBody'); if (b && b.querySelector('.sk-grid')) render(b);
    }
    async function buy(id, days){
        if (!isOwner()){ toastMsg('শুধু Owner পারবে'); return; }
        var sk = SKINS.filter(function(x){ return x.id === id; })[0];
        if (!window.confirm(sk.name + ' — ' + days + ' দিন, ' + (days === 7 ? 1000 : 2000) + ' 💎 দিয়ে কিনবেন?')) return;
        var r = await MOIEco.try('buyRoomSkin', { roomId: ROOM_ID, skinId: id, days: days });
        if (!r) return;
        try { myProfile.diamonds = r.balance; } catch(e){}
        toastMsg('✅ স্কিন কেনা হয়েছে');
    }
    async function use(id){
        if (!isOwner()){ toastMsg('শুধু Owner পারবে'); return; }
        var r = await MOIEco.try('useRoomSkin', { roomId: ROOM_ID, skinId: id });
        if (!r) return;
        toastMsg(id ? '✅ স্কিন চালু হয়েছে' : 'কোম্পানির ডিজাইনে ফিরেছে');
    }

    /* লাইভ শোনা */
    var lastSig = '';
    function sig(){ return activeId() + '|' + JSON.stringify(own); }
    (function boot(){
        var t = setInterval(function(){
            var F = window.MOIFB; if (!F || !F.rtdb || typeof ROOM_ID === 'undefined') return;
            clearInterval(t);
            var base = F.LIVE + '/rooms/' + ROOM_ID;
            F.rtdb.ref(base + '/skin').on('value', function(sn){ var v = sn.val(); cur = v && v.id || ''; if (sig() !== lastSig){ lastSig = sig(); repaint(); } });
            F.rtdb.ref(base + '/skinOwn').on('value', function(sn){ own = sn.val() || {}; if (sig() !== lastSig){ lastSig = sig(); repaint(); } });
            /* মেয়াদ শেষ হলে নিজে নিজে কোম্পানির ডিজাইনে ফেরে */
            setInterval(function(){ if (sig() !== lastSig){ lastSig = sig(); repaint(); } }, 5000);
        }, 400);
    })();
    window.RTSkin = { render: render, seatHTML: seatHTML, active: activeId, buy: buy, use: use };
})();
