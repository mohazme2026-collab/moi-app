/* room/ads/room-ads.js — রুমের ডানদিকে অফিসিয়াল অ্যাডের ছোট বক্স। প্রতিটা বক্সে ছবি নিজে নিজে বদলায়।
   অ্যাডের তালিকা: localStorage 'moi_room_ads_v1' (পরে অ্যাডমিন থেকে বসবে); না থাকলে নিচের নমুনা দেখায়।
   বক্সের ফরম্যাট: [ [slide, slide…], [slide…] ]  — slide = { img:'ছবির লিংক', link:'ক্লিকে যাবে', e:'😀', l:'লেখা', g:'#রং1,#রং2' } */
(function(){
    'use strict';
    var KEY = 'moi_room_ads_v1', EVERY = 4000;
    var DEMO = [
        [{ e:'🎮', l:'GAME', g:'#7c3aed,#ec4899' }, { e:'🎲', l:'LUDO', g:'#0ea5e9,#22c55e' }, { e:'🏆', l:'EVENT', g:'#f59e0b,#ef4444' }],
        [{ e:'📱', l:'APP', g:'#14b8a6,#3b82f6' }, { e:'🎁', l:'OFFER', g:'#ec4899,#f97316' }, { e:'⭐', l:'NEW', g:'#8b5cf6,#06b6d4' }]
    ];
    function load(){
        try { var v = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(v) && v.length) return v; } catch(e){}
        return DEMO;
    }
    function build(){
        var app = document.querySelector('.app-container');
        if (!app || document.getElementById('roomAds')) return;
        var wrap = document.createElement('div'); wrap.className = 'room-ads'; wrap.id = 'roomAds';
        load().slice(0, 3).forEach(function(slides, bi){
            if (!Array.isArray(slides) || !slides.length) return;
            var box = document.createElement('div'); box.className = 'ra-box';
            box.innerHTML = '<span class="ra-tag">AD</span>' + slides.map(function(s, i){
                var inner = s.img ? '<img src="' + String(s.img).replace(/"/g, '') + '" alt="">'
                    : '<em>' + (s.e || '✨') + '</em><b>' + (s.l || '') + '</b>';
                var bg = s.img ? '' : ' style="background:linear-gradient(145deg,' + (s.g || '#7c3aed,#ec4899') + ')"';
                return '<div class="ra-slide' + (i === 0 ? ' on' : '') + '"' + bg + '>' + inner + '</div>';
            }).join('');
            var cur = 0;
            if (slides.length > 1) setTimeout(function(){
                setInterval(function(){
                    var els = box.querySelectorAll('.ra-slide');
                    els[cur].classList.remove('on'); cur = (cur + 1) % els.length; els[cur].classList.add('on');
                }, EVERY);
            }, bi * 1500);
            box.addEventListener('click', function(){
                var s = slides[cur]; if (s && s.link) window.open(s.link, '_blank', 'noopener');
            });
            wrap.appendChild(box);
        });
        app.appendChild(wrap);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
