/* room/theme.js — Room Theme (সিট লেআউট) */

console.log('[ROOM] theme.js loaded');

(function(){
'use strict';

/* ═══ লেআউট ডেফিনিশন ═══ */
var RT_LAYOUTS = {
    'basic-12': {
        title:'Basic 12 mic seat', category:'Basic',
        rows: [{ count:4, mult:1.0 }, { count:4, mult:1.0 }, { count:4, mult:1.0 }]
    },
    'basic-6': {
        title:'Basic 6 mic seat', category:'Basic',
        rows: [{ count:1, mult:1.45 }, { count:5, mult:1.0 }]
    },
    'basic-11': {
        title:'Basic 11 mic seat', category:'Basic',
        rows: [{ count:1, mult:1.35 }, { count:5, mult:1.0 }, { count:5, mult:1.0 }]
    },
    'basic-20': {
        title:'Basic 20 mic seat', category:'Basic',
        rows: [{ count:5, mult:1.0 }, { count:5, mult:1.0 }, { count:5, mult:1.0 }, { count:5, mult:1.0 }]
    },
    'special-11': {
        title:'Special 11 mic seat', category:'Special',
        rows: [
            { count:1, mult:1.1, align:'left' },
            { count:2, mult:1.6 },
            { count:4, mult:1.0 },
            { count:4, mult:1.0 }
        ]
    }
};

var _rtCurrent = 'basic-12';
var _rtTab = 'quantity';
var _rtPending = null;
var _origRenderSeats = null;

/* ═══ Storage থেকে লোড ═══ */
function rtLoad(){
    try {
        var saved = (typeof ls_get === 'function') ? ls_get(KEY.roomLayout) : null;
        if (saved === 'basic-10') saved = 'basic-12';   /* আগের ১০ সিট এখন ১২ সিট */
        if (saved && RT_LAYOUTS[saved]) _rtCurrent = saved;
        if (typeof state !== 'undefined') state.roomLayout = _rtCurrent;
    } catch(e){ console.warn('[THEME] load', e); }
}

/* ═══ সিট রেন্ডার (overridden) ═══ */
function rtTotalSeats(layout){ var n = 0; layout.rows.forEach(function(r){ n += r.count; }); return n; }
function rtRenderSeats(){
    var grid = document.getElementById('seatsGrid');
    if (!grid) return;
    if (typeof destroyAllRings === 'function') destroyAllRings();

    var layout = RT_LAYOUTS[_rtCurrent] || RT_LAYOUTS['basic-12'];
    /* সিটের তালিকা লেআউটের সংখ্যার সমান রাখা */
    if (typeof state !== 'undefined' && state.seats){
        var need = rtTotalSeats(layout);
        while (state.seats.length < need) state.seats.push(null);
    }
    grid.removeAttribute('style');
    grid.className = 'seats-grid';
    grid.style.display = 'flex';
    grid.style.flexDirection = 'column';
    grid.style.alignItems = 'center';
    grid.style.padding = '14px 6px 4px';   /* উপরে মুকুট/রিঙের জায়গা */
    grid.style.marginTop = '2px';
    grid.innerHTML = '';

    /* ── মাপ: পর্দার চওড়া ও উচ্চতা দেখে নিজে নিজে ঠিক হয় ──
       চওড়ায় প্রতি সিটের ঘরের ~৬২% নেওয়া হয়, যাতে মুকুট/রিং পাশের সিটের উপর না পড়ে।
       উচ্চতায় নিচে চ্যাটের (টপিক + ৩-৪ মেসেজ) আর বাটন বারের জায়গা আগে রেখে বাকিটা সিটকে দেওয়া হয়। */
    var W = grid.clientWidth || 380;
    var app = document.querySelector('.app-container');
    var appH = app ? app.clientHeight : window.innerHeight;
    var dock = document.getElementById('moiDock');
    var dockH = dock ? dock.offsetHeight : 80;
    var H = appH - grid.offsetTop - dockH - 150 - 10;
    H = Math.max(180, Math.min(H, 360));

    var numRows = layout.rows.length, padX = 8, totalMult = 0, sizeByW = 999;
    layout.rows.forEach(function(r){
        totalMult += r.mult;
        sizeByW = Math.min(sizeByW, (W - padX * 2) / r.count / r.mult * 0.62);
    });
    var minGap = 8;
    var META = 42;   /* সিটের নিচে নাম + ডায়মন্ডের জায়গা (px) */
    var sizeByH = (H - minGap * (numRows - 1) - META * numRows) / totalMult;
    var baseSize = Math.max(26, Math.min(sizeByW, sizeByH, 56));
    var gap = numRows > 1 ? Math.max(minGap, Math.min(18, (H - totalMult * baseSize - META * numRows) / (numRows - 1))) : 0;
    grid.style.gap = gap + 'px';

    var idx = 0;
    layout.rows.forEach(function(row){
        var rowDiv = document.createElement('div');
        rowDiv.style.display = 'flex';
        rowDiv.style.justifyContent = row.align === 'left' ? 'flex-start' : 'space-around';
        rowDiv.style.alignItems = 'flex-start';
        rowDiv.style.width = '100%';
        rowDiv.style.gap = '4px';
        if (row.align === 'left') rowDiv.style.paddingLeft = '6px';

        var seatSize = baseSize * row.mult;
        for (var i = 0; i < row.count; i++){
            rowDiv.appendChild(rtBuildSeat(idx, seatSize));
            idx++;
        }
        grid.appendChild(rowDiv);
    });

    if (typeof updateRoomPoints === 'function') updateRoomPoints();
    setTimeout(function(){
        if (typeof refreshAllRings === 'function') refreshAllRings();
    }, 0);
}

/* ═══ একটা সিট বানানো ═══ */
function rtBuildSeat(idx, sizePx){
    var seats = (typeof state !== 'undefined' && state.seats) ? state.seats : [];
    var s = seats[idx];
    var cls = 'seat-avatar';
    var contentHTML = '', lockHTML = '', muteHTML = '', roleBadge = '', badge = '';

    if (s && s.locked && !s.uid){
        cls += ' locked';
        lockHTML = '<div class="seat-lock-overlay"><i class="fa-solid fa-lock"></i></div>';
    } else if (s && s.uid){
        cls += ' occupied';
        if (typeof myProfile !== 'undefined' && myProfile && s.uid === myProfile.uid) cls += ' is-me';
        var r = s.role || (typeof getRoleOf === 'function' ? getRoleOf(s.uid) : 'member');
        if (r === 'owner'){
            cls += ' is-owner';
            roleBadge = '<span class="role-badge-seat owner"><i class="fa-solid fa-crown"></i></span>';
        } else if (r === 'admin'){
            cls += ' is-admin';
            roleBadge = '<span class="role-badge-seat admin"><i class="fa-solid fa-shield-halved"></i></span>';
        }
        contentHTML = '<div class="seat-content"><img src="' + (s.avatar || GUEST_AVATAR) + '" alt=""></div>';
        if (!s.mic) muteHTML = '<div class="seat-mute-overlay"><i class="fa-solid fa-microphone-slash"></i></div>';
        if (s.locked) lockHTML = '<div class="seat-lock-overlay"><i class="fa-solid fa-lock"></i></div>';
        else badge = '<span class="mic-badge ' + (s.mic ? 'on' : 'off') + '"><i class="fa-solid fa-microphone' + (s.mic ? '' : '-slash') + '"></i></span>';
    }

    var label = (s && s.name) ? (typeof esc === 'function' ? esc(s.name) : s.name) : (s && s.locked ? 'Locked' : (idx + 1));
    var coins = (s && s.coins) ? s.coins : 0;

    var div = document.createElement('div');
    div.className = 'seat';
    div.dataset.seat = idx;
    div.dataset.uid = (s && s.uid) ? s.uid : '';
    div.style.width = sizePx + 'px';
    div.style.maxWidth = sizePx + 'px';
    div.style.flexShrink = '0';
    div.innerHTML = ''
        + '<div class="' + cls + '" onclick="openSeatSheet(' + idx + ')" style="width:' + sizePx + 'px;height:' + sizePx + 'px;max-width:' + sizePx + 'px;aspect-ratio:1/1;border-radius:50%">'
        +   '<div class="seat-bg moi-seat-art" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21"/></svg><em>MOI</em></div>'
        +   contentHTML + muteHTML + lockHTML
        +   '<div class="seat-reaction-layer" id="reactLayer' + idx + '"></div>'
        +   roleBadge + badge
        + '</div>'
        + '<div class="seat-meta">'
        +   '<div class="seat-number ' + (s && s.name ? 'taken' : '') + '" style="font-size:' + Math.max(8, sizePx * 0.22) + 'px"><span class="sn-name">' + label + '</span>' + ((s && s.uid && typeof roleIconHTML === 'function') ? roleIconHTML(((typeof myProfile !== 'undefined' && myProfile && s.uid === myProfile.uid) ? (state.myRole || 'member') : getRoleOf(s.uid)), 9) : '') + '</div>'
        +   '<div class="seat-coins" style="font-size:' + Math.max(7, sizePx * 0.18) + 'px"><i class="fa-solid fa-gem"></i> ' + coins.toLocaleString('en-IN') + '</div>'
        + '</div>';
    return div;
}

/* ═══ Room Theme Panel খোলা/বন্ধ ═══ */
window.openRoomTheme = function(){
    if (typeof isAdminOrOwner === 'function' && !isAdminOrOwner()){
        if (typeof toastMsg === 'function') toastMsg('শুধু Owner/Admin পারবে');
        return;
    }
    if (typeof closeSheet === 'function') closeSheet();
    var p = document.getElementById('rtPanel');
    if (p) p.classList.add('active');
    rtRenderBody();
};

window.closeRoomTheme = function(){
    var p = document.getElementById('rtPanel');
    if (p) p.classList.remove('active');
};

window.rtSwitchTab = function(tab){
    _rtTab = tab;
    var tabs = document.querySelectorAll('.rt-tab');
    for (var i = 0; i < tabs.length; i++){
        var isQ = (tab === 'quantity');
        tabs[i].classList.toggle('active', (i === 0 && isQ) || (i === 1 && !isQ));
    }
    rtRenderBody();
};

/* ═══ Panel body ═══ */
function rtRenderBody(){
    var body = document.getElementById('rtBody');
    if (!body) return;

    if (_rtTab === 'skin'){
        body.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#7a6a8f;font-size:13px">'
            + '<i class="fa-solid fa-palette" style="font-size:36px;opacity:.4;margin-bottom:14px;display:block"></i>'
            + 'Skin অপশন শীঘ্রই আসছে...</div>';
        return;
    }

    var cats = { 'Basic': [], 'Special': [] };
    Object.keys(RT_LAYOUTS).forEach(function(key){
        var l = RT_LAYOUTS[key];
        cats[l.category].push({ key: key, title: l.title, rows: l.rows, category: l.category });
    });

    var html = '';
    ['Basic', 'Special'].forEach(function(catName){
        if (!cats[catName].length) return;
        html += '<div class="rt-section-lbl">' + catName + '</div><div class="rt-grid">';
        cats[catName].forEach(function(item){
            var selected = _rtCurrent === item.key;
            html += '<div class="rt-card ' + (selected ? 'selected' : '') + '" onclick="rtSelectLayout(\'' + item.key + '\')">'
                + '<div class="check-mark"><i class="fa-solid fa-check"></i></div>'
                + '<div class="card-title">' + item.title + '</div>'
                + '<div class="rt-card-preview" id="rtPrev-' + item.key + '"></div>'
                + '</div>';
        });
        html += '</div>';
    });
    body.innerHTML = html;

    requestAnimationFrame(function(){
        Object.keys(RT_LAYOUTS).forEach(function(key){
            var l = RT_LAYOUTS[key];
            var prev = document.getElementById('rtPrev-' + key);
            if (!prev) return;
            var w = prev.clientWidth, h = prev.clientHeight;
            var numRows = l.rows.length;
            var maxCount = 1;
            l.rows.forEach(function(r){ if (r.count > maxCount) maxCount = r.count; });
            var totalMult = 0;
            l.rows.forEach(function(r){ totalMult += r.mult; });
            var sizeByW = (w - 6) / maxCount * 0.75;
            var sizeByH = (h - 6) / (1.4 * totalMult);
            var baseSize = Math.min(sizeByW, sizeByH, 14);

            l.rows.forEach(function(row, r){
                var rowH = h / numRows;
                var y = rowH * (r + 0.5);
                var sz = baseSize * row.mult;
                var totalSeats = row.count;
                var spacing = w / (totalSeats + 1);
                var startOffset = row.align === 'left' ? 6 : 0;
                for (var i = 0; i < totalSeats; i++){
                    var x = row.align === 'left' ? startOffset + spacing * (i + 0.4) : spacing * (i + 1);
                    var dot = document.createElement('div');
                    dot.className = 'rt-prev-dot';
                    dot.style.left = x + 'px';
                    dot.style.top = y + 'px';
                    dot.style.width = sz + 'px';
                    dot.style.height = sz + 'px';
                    prev.appendChild(dot);
                }
            });
        });
    });
}

/* ═══ লেআউট সিলেক্ট ═══ */
window.rtSelectLayout = function(key){
    if (key === _rtCurrent){
        if (typeof toastMsg === 'function') toastMsg('✅ এই লেআউটটি ইতিমধ্যে সিলেক্ট করা আছে');
        return;
    }
    _rtPending = key;
    var p = document.getElementById('rtConfirmPopup');
    if (p) p.classList.add('active');
};

window.rtCloseConfirm = function(){
    _rtPending = null;
    var p = document.getElementById('rtConfirmPopup');
    if (p) p.classList.remove('active');
};

window.rtConfirmChange = function(){
    if (_rtPending){
        _rtCurrent = _rtPending;
        if (typeof state !== 'undefined') state.roomLayout = _rtCurrent;
        if (typeof ls_set === 'function') ls_set(KEY.roomLayout, _rtCurrent);
        rtRenderSeats();
        rtRenderBody();
        if (typeof toastMsg === 'function') toastMsg('✅ ' + RT_LAYOUTS[_rtPending].title + ' প্রয়োগ করা হয়েছে');
    }
    _rtPending = null;
    var p = document.getElementById('rtConfirmPopup');
    if (p) p.classList.remove('active');
};

/* ═══ renderSeats override ═══ */
if (typeof window.renderSeats === 'function'){
    _origRenderSeats = window.renderSeats;
}
window.renderSeats = function(){
    try {
        rtRenderSeats();
    } catch(e){
        console.warn('[THEME] rtRenderSeats failed, fallback:', e);
        if (_origRenderSeats) _origRenderSeats.apply(this, arguments);
    }
};
console.log('[THEME] renderSeats overridden successfully');

rtLoad();

/* ═══ গিফট hook ═══ */
(function(){
    var _origSendGift = window.sendGiftDemo;
    if (typeof _origSendGift === 'function'){
        window.sendGiftDemo = function(emoji, name, price, targetUid, targetName){
            _origSendGift.apply(this, arguments);
            try {
                if (typeof window.pkHandleGift === 'function'){
                    window.pkHandleGift(targetUid, price);
                }
            } catch(e){ console.warn('[THEME] pk hook:', e); }
        };
    }
})();

/* ═══ Resize এ re-render ═══ */
window.addEventListener('resize', function(){
    if (typeof myProfile !== 'undefined' && myProfile) rtRenderSeats();
});

})();