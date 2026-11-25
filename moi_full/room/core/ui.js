/* room/ui.js — সব UI কাজ (sheets, modals, gifts, emoji) */

console.log('[ROOM] ui.js loaded');

/* ═══ Sheet options দেখানো ═══ */
function showSheetOptions(title, options){
    $('sheetTitle').textContent = title;
    $('sheetOptions').innerHTML = options.map((o, k) =>
        `<div class="sheet-option ${o.danger?'danger':''} ${o.cls||''}" data-k="${k}">
            <span class="opt-icon"><i class="fa-solid ${o.icon}"></i></span>
            <span class="opt-label">${o.label}</span>
            <i class="fa-solid fa-chevron-right opt-arrow"></i>
        </div>`).join('');
    $('sheetOptions').querySelectorAll('.sheet-option').forEach(el => {
        el.addEventListener('click', () => options[+el.dataset.k].action());
    });
    $('sheetBackdrop').classList.add('active');
    $('seatSheet').classList.add('active');
}

/* ═══ সব sheet বন্ধ ═══ */
window.closeSheet = () => {
    $('sheetBackdrop').classList.remove('active');
    ['seatSheet','msgSheet','chatSheet','emojiSheet','gifterSheet','settingsSheet','gameSheet','luckyBoxSheet'].forEach(id => {
        const el = $(id);
        if (el) el.classList.remove('active','fullscreen');
    });
    if (typeof closeGiftPanel === 'function') closeGiftPanel();      /* গিফট প্যানেলও বন্ধ হবে */
    document.querySelectorAll('.moi-sheet-wrap').forEach(e => e.remove());   /* নতুন মেনু শিটগুলো */
    closePermissionSheet();
    const cf = $('chatFrame');
    if (cf) cf.src = 'about:blank';
    const gf = $('gameFrame');
    if (gf) gf.src = 'about:blank';
};

window.closePermissionSheet = () => {
    $('permissionSheet').classList.remove('active');
    $('sheetBackdrop').classList.remove('active');
};

/* ═══ Modals ═══ */
window.closeModal = (id) => $(id).classList.remove('active');

window.toggleMemberModal = () => {
    const m = $('memberModal');
    m.classList.contains('active') ? closeModal('memberModal') : m.classList.add('active');
};

window.toggleListenersModal = () => {
    const m = $('listenersModal');
    m.classList.contains('active') ? closeModal('listenersModal') : m.classList.add('active');
};

/* ═══ Wallpaper ═══ */
function applyWallpaper(dataUrl){
    const wp = $('roomWallpaper');
    if (!wp) return;
    wp.style.backgroundImage = 'url("' + String(dataUrl).replace(/["\\\n]/g, '') + '")';
    wp.classList.add('has-wallpaper');
}

window.openWallpaperPicker = () => {
    closeSheet();
    setTimeout(() => $('wallpaperInput').click(), 200);
};

window.handleWallpaperSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 4.5 * 1024 * 1024){
        toastMsg('❌ ছবি ৪.৫ MB এর কম হতে হবে');
        event.target.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
        toastMsg('⏳ আপলোড হচ্ছে...');
        const url = await MOIStorage.roomWallpaper(ROOM_ID, ev.target.result);
        if (url.indexOf('data:') === 0){ toastMsg('❌ আপলোড ব্যর্থ হয়েছে'); return; }
        applyWallpaper(url);
        ls_set(KEY.wallpaper, { dataUrl: url, ts: Date.now() });      /* সবার রুমে একসাথে বদলায় */
        toastMsg('✅ Wallpaper পরিবর্তন হয়েছে');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
};

/* ═══ Settings menu ═══ */
window.openSettingsMenu = () => {
    if (typeof myProfile === 'undefined' || !myProfile){ toastMsg('লগইন করুন'); return; }
    closeSheet();
    /* সাধারণ ইউজার শুধু ৪টা বাটন দেখে (Lucky Box, Music, Sound, Bag); বাকিগুলো Owner/Admin-এর */
    $('settingsSheet').classList.toggle('staff', isAdminOrOwner());
    $('sheetBackdrop').classList.add('active');
    $('settingsSheet').classList.add('active');
};

window.settingsNotReady = (name) => {
    toastMsg(`⚙️ ${name} — শীঘ্রই আসছে`);
};

/* ═══ Gifter leaderboard ═══ */
window.openGifterLeaderboard = () => {
    closeSheet();
    renderGifterBody();
    $('sheetBackdrop').classList.add('active');
    $('gifterSheet').classList.add('active');
};

window.openUserProfileFromGifter = (uid) => {
    closeSheet();
    setTimeout(() => {
        const u = state.listeners.find(x => x.uid === uid);
        if (u) openUserProfile(uid);
        else toastMsg('ইউজার এখন রুমে নেই');
    }, 250);
};

/* ═══ Gift record — gifts.js এইটাকে call করে ═══ */
/* গিফট স্ট্যাট এখন সার্ভার লেখে (Realtime DB giftStats) — ক্লায়েন্টে আর হাতে রেকর্ড হয় না */
function recordGift(){ }

/* ═══════════════════════════════════════════════════════════════
   ⚠️ পুরনো gift system মুছে ফেলা হয়েছে:
   - window.openGiftPicker
   - window.pickGiftTarget
   - openGiftSheet
   - window.sendGiftDemo
   - getSeatCenterPx
   - playGiftAnimation
   
   নতুন gift system এখন gifts.js এ
   ═══════════════════════════════════════════════════════════════ */

/* ═══ Emoji sheet ═══ */
/* স্টোর থেকে কেনা "Funny Face Pack" থাকলে Reactions-এর একদম শেষে Memes ক্যাটাগরি যোগ হয় */
function emojiCats(){
    const c = EMOJI_CATEGORIES.slice();
    try { if (window.MOIStore && myProfile && MOIStore.isOwned(myProfile.uid, 'emoji_memes')) c.push({ label: '😂 Memes', meme: true, items: MOIStore.MEMES }); } catch(e){}
    return c;
}
const isMeme = code => !!(window.MOIStore && MOIStore.MEMES.indexOf(code) >= 0);
function buildEmojiCategories(){
    $('emojiCategories').innerHTML = emojiCats().map((c, i) =>
        `<button class="emoji-cat-chip ${i===0?'active':''}" onclick="switchEmojiCat(${i})">${c.label}</button>`).join('');
}

function renderEmojiGrid(){
    const cat = emojiCats()[activeEmojiCat];
    if (!cat) return;
    $('emojiGrid').innerHTML = cat.items.map(code => {
        if (cat.meme) return `<div class="emoji-grid-item" onclick="sendEmojiReaction('${code}')"><img src="${MOIStore.memeSrc(code)}" alt=""></div>`;
        const src = EMOJI_BASE + code + '/512.webp';
        return `<div class="emoji-grid-item" onclick="sendEmojiReaction('${code}')"><img src="${src}" loading="lazy" alt="" onerror="if(!this.dataset.g){this.dataset.g=1;this.src=this.src.replace(\'512.webp\',\'512.gif\');return}this.parentElement.innerHTML='<div style=\\'font-size:32px;text-align:center\\'>${emojiFallback(code)}</div>'"></div>`;
    }).join('');
}

window.switchEmojiCat = (i) => {
    activeEmojiCat = i;
    document.querySelectorAll('.emoji-cat-chip').forEach((c, k) => c.classList.toggle('active', k === i));
    renderEmojiGrid();
};

window.openEmojiSheet = () => {
    if (!myProfile){
        toastMsg('লগইন করুন');
        return;
    }
    closeSheet();   /* লিসেনারও ইমোজি দিতে পারে — শুধু চ্যাটে দেখায় */
    buildEmojiCategories();
    renderEmojiGrid();
    $('sheetBackdrop').classList.add('active');
    $('emojiSheet').classList.add('active');
};

window.sendEmojiReaction = (code) => {
    if (!myProfile) return;
    const idx = state.seats.findIndex(s => s && s.uid === myProfile.uid);
    const src = isMeme(code) ? MOIStore.memeSrc(code) : EMOJI_BASE + code + '/512.webp';
    closeSheet();
    /* চ্যাটে সবসময় দেখায় (নাম + প্রোফাইল + ইমোজি) */
    pushMessage({ uid: myProfile.uid, name: myProfile.name || 'User', avatar: myProfile.avatar, text: '', img: src, type: 'emoji' });
    /* সিটে বসা থাকলে সিটের উপরেও ভেসে ওঠে — চ্যাট রি-রেন্ডারের পরে, যাতে মুছে না যায় */
    if (idx !== -1){
        setTimeout(() => showSeatReaction(idx, code, src), 60);
        logActivity('react', idx);
    }
};

/* ═══════════════════════════════════════════════════════════════
   ⬇️⬇️⬇️ Room Profile Edit / Exit Menu / Chat / Game ⬇️⬇️⬇️
   ═══════════════════════════════════════════════════════════════ */

/* ═══ Edit Room Profile ═══ */
let _cropperInstance = null;

window.openEditRoom = () => {
    if (!isOwner()){
        toastMsg('শুধু Owner রুম এডিট করতে পারবে');
        return;
    }
    closeModal('memberModal');

    $('roomNameInput').value = state.roomName || '';
    $('roomIdInput').value = state.roomId || ROOM_ID;

    const preview = $('room-logo-edit-preview');
    if (state.roomLogo){
        preview.innerHTML = `<img src="${state.roomLogo}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
        const parts = esc(state.roomName || 'HOUR FM').split(/\s+/).slice(0, 2).join('<br>');
        preview.innerHTML = `<span class="cassette-text">${parts}</span>`;
    }

    $('editRoomModal').classList.add('active');
};

window.previewRoomImage = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        $('cropImage').src = ev.target.result;
        $('cropModal').classList.add('active');

        setTimeout(() => {
            if (_cropperInstance){
                _cropperInstance.destroy();
                _cropperInstance = null;
            }
            _cropperInstance = new Cropper($('cropImage'), {
                aspectRatio: 1,
                viewMode: 1,
                background: false,
                autoCropArea: 0.85
            });
        }, 150);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
};

window.cancelCrop = () => {
    $('cropModal').classList.remove('active');
    if (_cropperInstance){
        _cropperInstance.destroy();
        _cropperInstance = null;
    }
};

window.applyCrop = () => {
    if (!_cropperInstance) return;
    const canvas = _cropperInstance.getCroppedCanvas({ width: 300, height: 300 });
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    const preview = $('room-logo-edit-preview');
    preview.innerHTML = `<img src="${dataUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    preview.dataset.newLogo = dataUrl;

    $('cropModal').classList.remove('active');
    _cropperInstance.destroy();
    _cropperInstance = null;
};

window.saveRoomProfile = async () => {
    if (!isOwner()) return;

    const newName = ($('roomNameInput').value || '').trim().slice(0, 30);
    if (newName.length < 2){
        toastMsg('রুমের নাম কমপক্ষে ২ অক্ষর');
        return;
    }

    const preview = $('room-logo-edit-preview');
    let newLogo = preview.dataset.newLogo || state.roomLogo;
    if (newLogo && String(newLogo).indexOf('data:') === 0){
        toastMsg('⏳ লোগো আপলোড হচ্ছে...');
        newLogo = await MOIStorage.roomLogo(ROOM_ID, newLogo);
        if (String(newLogo).indexOf('data:') === 0){ toastMsg('❌ লোগো আপলোড ব্যর্থ'); return; }
    }

    state.roomName = newName;
    if (newLogo) state.roomLogo = newLogo;
    saveRoomInfo(ROOM_ID, newLogo ? { name: newName, logo: newLogo } : { name: newName });

    renderBranding();
    closeModal('editRoomModal');
    toastMsg('✅ রুম প্রোফাইল আপডেট হয়েছে');
};

/* ═══ বের হওয়ার প্যানেল: ছোট করুন / ছেড়ে যান + অনলাইন রুম ═══ */
(function(){
    const ge = (id) => document.getElementById(id);
    const esc2 = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    function build(){
        if (ge('xpPanel')) return;
        const w = document.createElement('div');
        w.innerHTML =
            '<div class="xp-back" id="xpBack"></div>' +
            '<div class="xp-panel" id="xpPanel">' +
                '<div class="xp-acts">' +
                    '<button class="xp-act" id="xpMin"><span class="ci"><i class="fa-solid fa-down-left-and-up-right-to-center"></i></span>ছোট করুন</button>' +
                    '<button class="xp-act off" id="xpOff"><span class="ci"><i class="fa-solid fa-power-off"></i></span>ছেড়ে যান</button>' +
                '</div>' +
                '<div class="xp-sec"><i></i>অনলাইন রুম</div>' +
                '<div class="xp-list" id="xpList"></div>' +
            '</div>' +
            '<div class="xp-dlg" id="xpDlg"><div class="xp-box"><div class="t">রুম ছেড়ে যাবেন?</div><div class="s">ছেড়ে গেলে আপনি রুম থেকে বের হয়ে হোম পেজে যাবেন।</div><div class="r"><button class="no" id="xpNo">না</button><button class="yes" id="xpYes">ছেড়ে যান</button></div></div></div>';
        while (w.firstChild) document.body.appendChild(w.firstChild);
        ge('xpBack').onclick = closePanel;
        ge('xpMin').onclick = () => { closePanel(); window.keepRoom(); };
        ge('xpOff').onclick = () => { ge('xpDlg').classList.add('show'); };
        ge('xpNo').onclick = () => ge('xpDlg').classList.remove('show');
        ge('xpYes').onclick = () => { ge('xpDlg').classList.remove('show'); closePanel(); window.exitRoom(true); };
        ge('xpList').addEventListener('click', (e) => {
            const c = e.target.closest('[data-rid]'); if (!c) return;
            const id = c.dataset.rid; if (id === ROOM_ID){ closePanel(); return; }
            leaveSilently(); location.href = 'index.html?room=' + encodeURIComponent(id);
        });
    }
    function rooms(){
        let all = {}; try { all = ls_get('moi_demo_rooms', {}) || {}; } catch(e){}
        const cnt = (id) => { try { return (window.MOISync && MOISync.roomCount) ? MOISync.roomCount(id) : 0; } catch(e){ return 0; } };
        return Object.keys(all).map(id => all[id]).filter(r => r && r.name && r.id !== ROOM_ID)
            .map(r => ({ id: r.id, name: r.name, logo: r.logo || '', owner: (r.owner && r.owner.name) || r.ownerName || '', n: cnt(r.id) }))
            .sort((a, b) => b.n - a.n).slice(0, 24);
    }
    function fill(){
        const L = rooms();
        ge('xpList').innerHTML = L.length ? L.map(r => {
            const im = r.logo || (window.roomArt ? roomArt(r.id, r.name) : '');
            return '<button class="xp-card" data-rid="' + esc2(r.id) + '"><div class="im"><img src="' + esc2(im) + '" alt=""><span class="ct"><i class="fa-solid fa-user" style="font-size:9px"></i>' + r.n + '</span></div><div class="nm">' + esc2(r.name) + '</div><div class="ow">' + esc2(r.owner || '—') + '</div></button>';
        }).join('') : '<div class="xp-empty">এখন কোনো অনলাইন রুম নেই</div>';
    }
    let _xpW = false;
    /* এন্ট্রি/গিফট/কমেন্ট ইত্যাদির অ্যানিমেশন শুধু মেইন রুম পেজে (সিট দেখা যাচ্ছে) — প্রোফাইল/লিস্ট/সেটিংস পেজ খোলা থাকলে নয় */
    window.roomAnimOK = function(){
        try {
            if (document.hidden) return false;
            if (document.querySelector('.modal-overlay.active, .ri-ov.on, .bottom-sheet.active, #xpPanel.show')) return false;
            if (!document.querySelector('.seat')) return false;
        } catch(e){}
        return true;
    };
    function openPanel(){ build(); fill();
        try { if (window.MOISync && MOISync.watch){ MOISync.watch('moi_room_counts'); MOISync.watch('moi_demo_rooms'); } } catch(e){}
        if (!_xpW){ _xpW = true; window.addEventListener('moi:sync', (e) => { const k = (e.detail && e.detail.key) || ''; if ((k === 'moi_room_counts' || k === 'moi_demo_rooms') && window.xpIsOpen && xpIsOpen()) fill(); }); } ge('xpBack').classList.add('show'); ge('xpPanel').classList.add('show'); }
    function closePanel(){ const b = ge('xpBack'), p = ge('xpPanel'); if (b) b.classList.remove('show'); if (p) p.classList.remove('show'); }
    window.toggleExitMenu = (event) => {
        if (event) event.stopPropagation();
        const p = ge('xpPanel'); (p && p.classList.contains('show')) ? closePanel() : openPanel();
    };
    window.xpIsOpen = () => { const p = ge('xpPanel'); return !!(p && p.classList.contains('show')); };
    window.xpClose = closePanel;
    function leaveSilently(){ try { if (window.MOIMin) MOIMin.clear(); } catch(e){} if (typeof presenceLeave === 'function') presenceLeave(); }
    /* ছোট করা: রুমে থেকেই হোম পেজে যাওয়া — উপস্থিতি থাকে, ভাসমান লোগো দেখা যায় */
    window.keepRoom = () => {
        try { MOIMin.set({ id: ROOM_ID, name: state.roomName, logo: state.roomLogo || '' }); } catch(e){}
        location.href = '../home/index.html';
    };
    window.exitRoom = (confirmed) => {
        if (confirmed !== true){ build(); ge('xpDlg').classList.add('show'); return; }
        leaveSilently();
        location.href = '../home/index.html';
    };

    /* ফোনের ব্যাক বাটন: অ্যাপ বন্ধ না করে রুম ছোট করবে (প্যানেল খোলা থাকলে আগে প্যানেল বন্ধ) */
    try {
        history.pushState({ moiRoom: 1 }, '');
        window.addEventListener('popstate', () => {
            if (window.xpIsOpen && xpIsOpen()){ xpClose(); history.pushState({ moiRoom: 1 }, ''); return; }
            window.keepRoom();
        });
    } catch(e){}
    /* এই রুমে ফিরলে ভাসমান লোগো বন্ধ; অন্য রুমে ঢুকলে আগের রুম থেকে বের */
    try {
        const m = window.MOIMin && MOIMin.get();
        if (m && m.id !== ROOM_ID){
            const FB = window.MOIFB, u = window.myProfile && myProfile.uid;
            if (FB && u){ FB.rtdb.ref(FB.LIVE + '/roomPresence/' + m.id + '/' + u).remove(); FB.rtdb.ref(FB.LIVE + '/rooms/' + m.id + '/listeners/' + u).remove(); }
        }
        if (window.MOIMin) MOIMin.clear();
    } catch(e){}
})();

/* ═══ Chat sheet (iframe) ═══ */
window.openChatSheet = (uid, name) => {
    closeSheet();

    const frame = $('chatFrame');
    const loading = $('chatLoading');

    let url = '../chat/index.html';
    if (uid){
        const u = new URL(url, location.href);
        u.searchParams.set('targetUid', uid);
        if (name) u.searchParams.set('targetName', name);
        url = u.toString();
    }

    loading.classList.remove('hidden');
    frame.src = url;
    frame.onload = () => loading.classList.add('hidden');

    $('sheetBackdrop').classList.add('active');
    $('chatSheet').classList.add('active');
    if (uid) $('chatSheet').classList.add('fullscreen');      /* কারো চ্যাটে সরাসরি → ফুল স্ক্রিন; লিস্ট → ৮০% */
};

/* ═══ Game sheet (iframe) ═══ */
window.openGameSheet = () => {
    closeSheet();
    /* নাম আর ছবি: shared/gameicons/<key>.webp */
    const GAMES = [
        { g: 'game', n: 'Diamond Orbit' }, { g: 'game2', n: 'Spin 77' }, { g: 'gedi', n: 'Gedi Food' },
        { g: 'rocket', n: 'Rocket Go' }, { g: 'ludo', n: 'Ludo Spin' }, { g: 'slot', n: 'Joker Win' },
        { g: 'jackpot', n: 'Jackpot Fruit', isNew: true },
        { g: 'horse', n: 'Horse Racing', isNew: true }
    ];
    const KEY = 'moi_games_played';
    const played = () => { try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
    const tile = x => '<div data-g="' + x.g + '" style="position:relative;text-align:center;cursor:pointer">'
        + '<img src="../shared/gameicons/' + x.g + '.webp" alt="" style="width:100%;aspect-ratio:1;border-radius:22%;object-fit:cover;display:block;box-shadow:0 3px 10px rgba(0,0,0,.45)">'
        + (x.isNew ? '<span style="position:absolute;top:-4px;right:-4px;background:linear-gradient(#ff5a3c,#e0143c);color:#fff;font:800 9px sans-serif;padding:2px 6px;border-radius:8px;border:1px solid #fff4">NEW</span>' : '')
        + '<div style="color:#fff;font:600 12px/15px sans-serif;margin-top:6px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + x.n + '</div></div>';
    const sec = (ico, title, list) => list.length ? '<div style="display:flex;align-items:center;gap:8px;color:#fff;font:700 16px sans-serif;margin:14px 2px 10px"><span style="font-size:20px">' + ico + '</span>' + title + '</div>'
        + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px 10px">' + list.map(tile).join('') + '</div>' : '';
    let pk = document.getElementById('gamePicker');
    if (!pk) {
        pk = document.createElement('div'); pk.id = 'gamePicker';
        pk.style.cssText = 'position:fixed;inset:0;z-index:2147483050;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center';
        document.body.appendChild(pk);
        pk.addEventListener('click', e => {
            const c = e.target.closest('[data-g]');
            if (c) {
                try { const a = played().filter(k => k !== c.dataset.g); a.unshift(c.dataset.g); localStorage.setItem(KEY, JSON.stringify(a.slice(0, 8))); } catch (er) {}
                pk.style.display = 'none'; openGame(c.dataset.g);
            } else if (e.target === pk) pk.style.display = 'none';
        });
    }
    const pl = played().map(k => GAMES.find(x => x.g === k)).filter(Boolean).slice(0, 4);
    pk.innerHTML = '<div style="width:100%;max-width:520px;max-height:82vh;overflow-y:auto;background:linear-gradient(#1c1236,#0e0a20);border-radius:22px 22px 0 0;padding:10px 16px 28px;box-shadow:0 -8px 30px rgba(0,0,0,.5)">'
        + '<div style="width:44px;height:4px;border-radius:3px;background:#fff4;margin:0 auto 6px"></div>'
        + '<div style="color:#fff;font:700 17px sans-serif;text-align:center">🎮 Games</div>'
        + sec('🎮', 'Played', pl) + sec('🔥', 'New', GAMES.filter(x => x.isNew)) + sec('⭐', 'All Games', GAMES)
        + '</div>';
    pk.style.display = 'flex';
};
function openGame(g) {
    const frame = $('gameFrame');
    const loading = $('gameLoading');
    const gameUrl = '../' + g + '/index.html?room=' + encodeURIComponent(ROOM_ID);
    loading.classList.remove('hidden');
    frame.src = gameUrl;
    frame.onload = () => loading.classList.add('hidden');
    $('sheetBackdrop').classList.add('active');
    $('gameSheet').classList.add('active');
    $('gameSheet').classList.add('fullscreen');
}

/* গেমের ভিতরের ← বাটন গেম বন্ধ করে রুমে ফেরায় */
window.addEventListener('message', e => {
    if (e.data && e.data.type === 'GAME_CLOSE') { closeSheet(); $('gameFrame').src = 'about:blank'; }
});

/* ═══ Fullscreen toggle ═══ */
window.toggleIframeFullscreen = (sheetId) => {
    const el = $(sheetId);
    if (!el) return;
    el.classList.toggle('fullscreen');
};

/* ═══ Exports ═══ */
window.buildEmojiCategories = buildEmojiCategories;
window.renderEmojiGrid = renderEmojiGrid;
window.recordGift = recordGift;