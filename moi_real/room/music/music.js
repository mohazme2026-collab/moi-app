/* room/music.js — Music Player সিস্টেম */

console.log('[ROOM] music.js loaded');

let _mpAudio = null;
let _mpCurrentFile = null;
let _mpFileList = [];
let _mpCurrentIndex = -1;
let _mpIsPlaying = false;
let _mpIsLooping = false;
let _mpProgressTimer = null;

/* ═══ Music Select Panel খোলা/বন্ধ ═══ */
window.openMusicPanel = () => {
    if (!myProfile){
        toastMsg('লগইন করুন');
        return;
    }
    if (!_mpSeated()){
        toastMsg('🎵 গান চালাতে হলে আগে মাইক সিটে বসুন');
        return;
    }
    closeSheet();
    document.getElementById('musicSelectPanel').classList.add('active');
    renderMusicFileList();
};

window.closeMusicPanel = () => {
    document.getElementById('musicSelectPanel').classList.remove('active');
};

/* ═══ ফাইল লিস্ট রেন্ডার ═══ */
function renderMusicFileList(){
    const list = document.getElementById('musicFileList');
    if (!list) return;

    if (!_mpFileList.length){
        list.innerHTML = `
            <div class="music-empty-msg">
                <i class="fa-solid fa-music"></i>
                এখনো কোনো গান সিলেক্ট করা হয়নি<br>
                <span style="font-size:11px;color:#555;display:block;margin-top:6px">নিচের বাটনে চাপ দিয়ে ফোন থেকে গান বেছে নিন</span>
            </div>
            <button class="music-pick-btn" onclick="pickMusicFiles()">
                <i class="fa-solid fa-folder-open"></i> গান সিলেক্ট করুন
            </button>
        `;
        return;
    }

    list.innerHTML = _mpFileList.map((f, i) => `
        <div class="music-file-item" onclick="playMusicFile(${i})">
            <i class="fa-solid fa-music"></i>
            <div class="mfi-info">
                <div class="mfi-name">${esc(f.name)}</div>
                <div class="mfi-meta">${(f.size / (1024*1024)).toFixed(2)} MB</div>
            </div>
            <i class="fa-solid fa-play" style="color:#a855f7;background:none;width:auto;height:auto;font-size:14px"></i>
        </div>
    `).join('') + `
        <button class="music-pick-btn" onclick="pickMusicFiles()">
            <i class="fa-solid fa-plus"></i> আরো গান যোগ করুন
        </button>
    `;
}

/* ═══ ফাইল পিকার ═══ */
window.pickMusicFiles = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.multiple = true;
    input.onchange = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        files.forEach(f => _mpFileList.push(f));
        renderMusicFileList();
        toastMsg(`✅ ${files.length}টি গান যোগ হয়েছে`);
    };
    input.click();
};

/* ═══ গান প্লে ═══ */
window.playMusicFile = (index) => {
    if (index < 0 || index >= _mpFileList.length) return;
    _mpCurrentIndex = index;
    const file = _mpFileList[index];
    _mpCurrentFile = file;

    if (_mpAudio){
        _mpAudio.pause();
        _mpAudio = null;
    }

    const url = URL.createObjectURL(file);
    _mpAudio = new Audio(url);
    _mpAudio.loop = _mpIsLooping;
    if (window.MPFx) window.MPFx.attach(_mpAudio);

    _mpAudio.onended = () => {
        if (_mpIsLooping) return;
        mpNext();
    };

    _mpAudio.onloadedmetadata = () => {
        _mpIsPlaying = true;
        _mpUpdatePlayBtn();
        _mpStartProgress();
    };

    _mpAudio.onerror = () => {
        toastMsg('❌ গান প্লে করা যাচ্ছে না');
        _mpIsPlaying = false;
        _mpUpdatePlayBtn();
    };

    _mpAudio.play().then(() => {
        _mpIsPlaying = true;
        _mpUpdatePlayBtn();
        _mpStartProgress();
        _mpShowPlayerBar();
        _mpPublish(true);
        closeMusicPanel();
        toastMsg(`🎵 ${file.name} প্লে হচ্ছে`);
    }).catch(() => {
        toastMsg('❌ ব্রাউজার অডিও প্লে ব্লক করেছে');
    });
};

/* ═══ প্লেয়ার বার দেখানো/লুকানো ═══ */
function _mpShowPlayerBar(){
    const bar = document.getElementById('musicPlayerBar');
    if (!bar) return;
    bar.classList.add('active');
    _mpUpdateTrackName();
    _mpUpdateVinylSpin();
}

window.mpClosePlayer = () => {
    if (_mpAudio){
        _mpAudio.pause();
        _mpAudio = null;
    }
    _mpIsPlaying = false;
    _mpPublish(false);
    _mpStopProgress();
    const bar = document.getElementById('musicPlayerBar');
    if (bar) bar.classList.remove('active');
    toastMsg('🔇 মিউজিক প্লেয়ার সরানো হয়েছে');
};

/* ═══ ট্র্যাক নাম আপডেট ═══ */
function _mpUpdateTrackName(){
    const el = document.getElementById('mpTrackName');
    if (!el || !_mpCurrentFile) return;
    el.innerText = _mpCurrentFile.name.replace(/\.[^.]+$/, '');
}

/* ═══ ভিনাইল ঘোরানো ═══ */
function _mpUpdateVinylSpin(){
    const v = document.getElementById('mpVinyl');
    if (!v) return;
    v.classList.toggle('playing', _mpIsPlaying);
}

/* ═══ প্লে/পজ ═══ */
window.mpTogglePlay = () => {
    if (!_mpAudio) return;
    if (_mpIsPlaying){
        _mpAudio.pause();
        _mpIsPlaying = false;
    } else {
        _mpAudio.play().then(() => {
            _mpIsPlaying = true;
            _mpUpdatePlayBtn();
            _mpUpdateVinylSpin();
        });
        return;
    }
    _mpUpdatePlayBtn();
    _mpUpdateVinylSpin();
};

function _mpUpdatePlayBtn(){
    const btn = document.getElementById('mpPlayIcon');
    if (btn) btn.className = _mpIsPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
}

/* ═══ আগের/পরের গান ═══ */
window.mpPrev = () => {
    if (!_mpFileList.length) return;
    let idx = _mpCurrentIndex - 1;
    if (idx < 0) idx = _mpFileList.length - 1;
    playMusicFile(idx);
};

window.mpNext = () => {
    if (!_mpFileList.length) return;
    let idx = _mpCurrentIndex + 1;
    if (idx >= _mpFileList.length) idx = 0;
    playMusicFile(idx);
};

/* ═══ ভলিউম ═══ */
window.mpToggleVolume = () => {
    if (!_mpAudio) return;
    _mpAudio.muted = !_mpAudio.muted;
    const icon = document.getElementById('mpVolIcon');
    if (icon) icon.className = _mpAudio.muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
    toastMsg(_mpAudio.muted ? '🔇 ভলিউম বন্ধ' : '🔊 ভলিউম চালু');
};

/* ═══ লুপ ═══ */
window.mpToggleLoop = () => {
    _mpIsLooping = !_mpIsLooping;
    if (_mpAudio) _mpAudio.loop = _mpIsLooping;
    const btn = document.getElementById('mpLoopBtn');
    if (btn) btn.style.background = _mpIsLooping ? 'linear-gradient(135deg,#ff8c42,#ff5577)' : '';
    toastMsg(_mpIsLooping ? '🔁 লুপ চালু' : '➡️ লুপ বন্ধ');
};

/* ═══ প্রোগ্রেস বার ═══ */
function _mpStartProgress(){
    _mpStopProgress();
    _mpProgressTimer = setInterval(() => {
        if (!_mpAudio || !_mpAudio.duration) return;
        const pct = (_mpAudio.currentTime / _mpAudio.duration) * 100;
        const fill = document.getElementById('mpProgressFill');
        if (fill) fill.style.width = pct + '%';
    }, 500);
}

function _mpStopProgress(){
    if (_mpProgressTimer){
        clearInterval(_mpProgressTimer);
        _mpProgressTimer = null;
    }
    const fill = document.getElementById('mpProgressFill');
    if (fill) fill.style.width = '0%';
}

window.renderMusicFileList = renderMusicFileList;

/* ═══ সিটে বসা + কে গান চালাচ্ছে (সবার সিটে উজ্জ্বল রিং ও 🎵) ═══ */
function _mpSeated(){
    try { return !!(myProfile && state.seats.some(s => s && s.uid === myProfile.uid)); } catch(e){ return false; }
}
function _mpRef(){ const F = window.MOIFB; return F && F.rtdb ? F.rtdb.ref(F.LIVE + '/rooms/' + ROOM_ID + '/music') : null; }
function _mpPublish(on){
    const r = _mpRef(); if (!r || !myProfile) return;
    try {
        if (on){ r.set({ uid: myProfile.uid, name: myProfile.name || 'User', ts: Date.now() }); try { r.onDisconnect().remove(); } catch(e){} }
        else r.once('value').then(sn => { const v = sn.val(); if (v && v.uid === myProfile.uid) r.remove(); });
    } catch(e){}
}
let _mpPlayer = null;
function _mpPaint(){
    document.querySelectorAll('.seat.music-on').forEach(el => el.classList.remove('music-on'));
    if (!_mpPlayer) return;
    const el = document.querySelector('.seat[data-uid="' + _mpPlayer.uid + '"]');
    if (el) el.classList.add('music-on');
}
(function(){
    const t = setInterval(() => {
        const r = _mpRef(); if (!r || typeof ROOM_ID === 'undefined') return;
        clearInterval(t);
        r.on('value', sn => { _mpPlayer = sn.val() || null; _mpPaint(); });
        setInterval(_mpPaint, 700);
        /* সিট ছেড়ে দিলে নিজের গান বন্ধ */
        setInterval(() => { if (_mpAudio && !_mpSeated()) mpClosePlayer(); }, 1500);
    }, 400);
    window.addEventListener('pagehide', () => _mpPublish(false));
})();
