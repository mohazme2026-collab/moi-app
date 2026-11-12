/* room/gifts/lb-ui.js — লাকি বক্সের দেখানো: ফিডের কার্ড, ট্যাপে বড় পপআপ (টাইমার/Open), ফলাফল ফ্রেম, List প্যানেল, ডানের লাকি বক্স প্যানেল।
   ডেটা: luckybox.js-এর getLuckyBoxes(); ডায়মন্ড/ফলাফল সার্ভারে (economy.js openLuckyBox)। */
(function(){
    'use strict';
    var WINDOW = 300000;          /* সময় শেষের পর কতক্ষণ খোলা যাবে (economy.js-এর সাথে এক) */
    var IMG = 'gifts/lb/';
    var GEM = '<svg class="lb-gem" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="lbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9be8ff"/><stop offset="1" stop-color="#1f6bff"/></linearGradient></defs><path d="M6 3h12l4 6-10 12L2 9z" fill="url(#lbg)" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/><path d="M2 9h20M9 3l-2 6 5 12M15 3l2 6-5 12" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1"/></svg>';
    var openId = '', openTimer = null;
    function $(i){ return document.getElementById(i); }
    function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); }
    function boxes(){ try { return typeof getLuckyBoxes === 'function' ? getLuckyBoxes() : []; } catch(e){ return []; } }
    function find(id){ return boxes().filter(function(b){ return b.id === id; })[0]; }
    function me(){ return typeof myProfile !== 'undefined' ? myProfile : null; }
    function av(src){ var f = (typeof GUEST_AVATAR !== 'undefined' ? GUEST_AVATAR : ''); return esc(src || f); }
    function mmss(ms){ ms = Math.max(0, ms); var m = Math.floor(ms / 60000), s = Math.floor(ms % 60000 / 1000); return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
    function full(b){ return b.winners.length >= b.qty; }
    function visible(b, now){
        now = now || Date.now();
        if (now > b.expiresAt + WINDOW) return false;
        if (full(b)){ var last = b.winners.reduce(function(x, w){ return Math.max(x, w.ts || 0); }, b.createdAt || 0); return now - last < 60000; }
        return true;
    }
    /* অবস্থা: timer | ready | mine | opened | taken | ended */
    function status(b, now){
        now = now || Date.now(); var p = me();
        if (p && b.claimedBy.indexOf(p.uid) > -1) return 'opened';
        if (full(b)) return 'taken';
        if (now > b.expiresAt + WINDOW) return 'ended';
        if (p && b.senderUid === p.uid) return now < b.expiresAt ? 'timer' : 'mine';
        return now < b.expiresAt ? 'timer' : 'ready';
    }
    function label(b, st, now){
        if (st === 'timer') return mmss(b.expiresAt - now);
        return { ready: 'OPEN', mine: 'YOURS', opened: 'OPENED', taken: 'TAKEN', ended: 'ENDED' }[st] || '';
    }

    /* ─── ফিডের বেগুনি কার্ড ─── */
    function feedHTML(b){
        var now = Date.now(), st = status(b, now);
        return '<div class="msg-item lbf"><span class="msg-name">' + esc(b.senderName) + '</span>' +
            '<div class="lbf-card" data-lbf="' + esc(b.id) + '" onclick="LB.open(\'' + esc(b.id) + '\')">' +
            '<img src="' + IMG + 'card_feed.png" alt="">' +
            '<div class="lbf-amt">' + GEM + '<b>' + b.pool + '</b></div>' +
            '<div class="lbf-st ' + st + '" data-lbst="' + esc(b.id) + '">' + label(b, st, now) + '</div></div></div>';
    }
    function winHTML(m){
        return '<div class="msg-item lbw"><span class="msg-name">' + esc(m.name) + '</span>' +
            '<div class="lbw-pill">Open <i class="lbw-env"></i> Wins ' + GEM + ' × ' + (m.amt || 0) + '</div></div>';
    }

    /* ─── ট্যাপে বড় পপআপ ─── */
    function closePop(){ var p = $('lbPop'); if (p) p.remove(); openId = ''; clearInterval(openTimer); }
    function paintBtn(b){
        var btn = document.querySelector('#lbPop .lbp-btn'); if (!btn) return;
        var now = Date.now(), st = status(b, now);
        btn.className = 'lbp-btn ' + st;
        btn.textContent = st === 'ready' ? '' : label(b, st, now);
    }
    function open(id){
        var b = find(id); if (!b) return;
        closePop(); openId = id;
        var d = document.createElement('div'); d.id = 'lbPop'; d.className = 'lbp';
        d.innerHTML = '<div class="lbp-card"><img class="lbp-av" src="' + av(b.senderAvatar) + '" alt="">' +
            '<img class="lbp-frame" src="' + IMG + 'frame_open.png" alt="">' +
            '<div class="lbp-name">' + esc(b.senderName) + '</div>' +
            '<div class="lbp-amt">' + b.pool + ' ' + GEM + '</div>' +
            '<div class="lbp-sub">' + b.qty + ' জন · ' + (b.timerMin ? b.timerMin + ' min' : 'No timer') + '</div>' +
            '<div class="lbp-btn"></div></div>';
        d.addEventListener('click', function(e){ if (e.target === d) closePop(); });
        (document.querySelector('.app-container') || document.body).appendChild(d);
        d.querySelector('.lbp-btn').addEventListener('click', function(){
            var bb = find(id); if (bb && status(bb) === 'ready') claim(id);
        });
        paintBtn(b);
        openTimer = setInterval(function(){ var bb = find(id); if (!bb){ closePop(); return; } paintBtn(bb); }, 500);
    }

    /* ─── খোলা (সার্ভার ঠিক করে কত পাবে) ─── */
    async function claim(id){
        var p = me();
        if (!p){ toastMsg('লগইন করুন'); return; }
        if (p.isGuest){ toastMsg('গেস্ট খুলতে পারে না — লগইন করুন'); return; }
        var r = await MOIEco.try('openLuckyBox', { roomId: ROOM_ID, boxId: id });
        if (!r) return;
        var b = find(id) || {};
        closePop();
        if (r.won > 0){
            try { pushMessage({ uid: p.uid, name: p.name, avatar: p.avatar, text: '', type: 'lbwin', amt: r.won, boxId: id }); } catch(e){}
            try { giftUpdateBalance(); } catch(e){}
        }
        result(id, r.won, b);
        try { renderMessageFeed(); } catch(e){}
        refresh();
    }

    /* ─── ফলাফল: পেলে সোনালি + সংখ্যা, না পেলে 😭 ফ্রেম ─── */
    function result(id, won, b){
        var p = me() || {}, win = won > 0;
        var d = document.createElement('div'); d.id = 'lbRes'; d.className = 'lbp lbr';
        d.innerHTML = '<div class="lbp-card lbr-card ' + (win ? 'win' : 'lose') + '"><img class="lbp-av" src="' + av(p.avatar) + '" alt="">' +
            '<img class="lbp-frame" src="' + IMG + (win ? 'frame_list.png' : 'frame_lose.png') + '" alt="">' +
            '<div class="lbp-name">' + esc(p.name || 'You') + '</div>' +
            (win ? '<div class="lbr-amt">+' + won + ' ' + GEM + '</div>' : '') +
            '<div class="lbr-list" role="button"></div>' +
            (win ? new Array(10).join('<i class="lbc"></i>') : '') + '</div>';
        var close = function(){ d.remove(); };
        d.addEventListener('click', function(e){ if (e.target === d) close(); });
        d.querySelector('.lbr-list').addEventListener('click', function(){ close(); list(id); });
        d.querySelectorAll('.lbc').forEach(function(c, i){ c.style.left = (6 + Math.random() * 84) + '%'; c.style.animationDelay = (i * 0.12) + 's'; });
        (document.querySelector('.app-container') || document.body).appendChild(d);
        setTimeout(close, 12000);
    }

    /* ─── List প্যানেল ─── */
    function list(id){
        var b = find(id); if (!b) return;
        var old = $('lbList'); if (old) old.remove();
        var rows = b.winners.length ? b.winners.map(function(w, i){
            return '<div class="lbl-row"><span class="lbl-rk">' + (i + 1) + '</span><img src="' + av(w.avatar) + '" alt=""><span class="lbl-nm">' + esc(w.name || 'User') + '</span><b>+' + w.amount + ' ' + GEM + '</b></div>';
        }).join('') : '<div class="lbl-none">এখনো কেউ পায়নি</div>';
        var d = document.createElement('div'); d.id = 'lbList'; d.className = 'lbl';
        d.innerHTML = '<div class="lbl-sheet"><div class="lbl-head"><img src="' + av(b.senderAvatar) + '" alt=""><div><div class="lbl-t">' + esc(b.senderName) + '</div>' +
            '<div class="lbl-s">' + b.pool + ' ' + GEM + ' · ' + b.winners.length + '/' + b.qty + '</div></div><button class="lbl-x" type="button">✕</button></div>' +
            '<div class="lbl-body">' + rows + '</div></div>';
        d.addEventListener('click', function(e){ if (e.target === d || e.target.classList.contains('lbl-x')) d.remove(); });
        (document.querySelector('.app-container') || document.body).appendChild(d);
    }

    /* ─── ডানের লাকি বক্স প্যানেল (বক্স থাকলে অ্যাড/রকেট ছোট হয়) ─── */
    var sig = '';
    function panelBoxes(){
        var now = Date.now();
        return boxes().filter(function(b){ var st = status(b, now); return visible(b, now) && st !== 'opened' && st !== 'taken' && st !== 'ended'; });
    }
    function refresh(){
        var app = document.querySelector('.app-container'); if (!app) return;
        var now = Date.now(), list = panelBoxes();
        var s = list.map(function(b){ return b.id + ':' + status(b, now); }).join('|');
        var side = $('lbSide');
        app.classList.toggle('lb-on', list.length > 0);
        if (!list.length){ if (side) side.remove(); sig = ''; return; }
        if (!side){ side = document.createElement('div'); side.id = 'lbSide'; side.className = 'lbs'; app.appendChild(side); }
        if (s !== sig){
            sig = s;
            side.innerHTML = list.map(function(b){
                var st = status(b, now);
                return '<div class="lbs-card ' + st + '" onclick="LB.open(\'' + esc(b.id) + '\')"><img class="lbs-av" src="' + av(b.senderAvatar) + '" alt=""><img class="lbs-fr" src="' + IMG + 'frame_open.png" alt="">' +
                    '<div class="lbs-amt">' + b.pool + '</div><div class="lbs-st" data-lbs="' + esc(b.id) + '">' + label(b, st, now) + '</div></div>';
            }).join('');
        } else {
            list.forEach(function(b){
                var e = side.querySelector('[data-lbs="' + b.id + '"]'); if (e) e.textContent = label(b, status(b, now), now);
            });
        }
        /* ফিডের কার্ডের টাইমার */
        document.querySelectorAll('[data-lbst]').forEach(function(el){
            var b = find(el.getAttribute('data-lbst')); if (!b) return;
            var st = status(b, now); el.className = 'lbf-st ' + st; el.textContent = label(b, st, now);
        });
    }
    setInterval(refresh, 1000);
    window.addEventListener('storage', function(e){ if (e.key && e.key.indexOf('moi_luckybox_') === 0) setTimeout(refresh, 50); });

    window.LB = { open: open, list: list, claim: claim, visible: visible, feedHTML: feedHTML, winHTML: winHTML, refresh: refresh, status: status };
})();
