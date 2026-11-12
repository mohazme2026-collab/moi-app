/* room/pk.js — 1vs1 PK সিস্টেম */

console.log('[ROOM] pk.js loaded');

let _pkTimerInterval = null;
let _pkSelectedBlue = null;
let _pkSelectedRed = null;
let _pkCurrentPick = 'blue';
let _pkSelectedTime = 10;

/* ═══ Setup Panel খোলা/বন্ধ ═══ */
window.openPKSetup = () => {
    if (!isAdminOrOwner()){
        toastMsg('শুধু Owner/Admin PK শুরু করতে পারবে');
        return;
    }
    closeSheet();
    _pkSelectedBlue = null;
    _pkSelectedRed = null;
    _pkCurrentPick = 'blue';
    _pkSelectedTime = 10;

    $('pkBlueSlot').innerHTML = '<i class="fa-solid fa-user" style="color:#555"></i>';
    $('pkBlueSlot').classList.remove('blue-active');
    $('pkBlueName').innerText = 'খালি';
    $('pkBlueUid').innerText = 'UID: ---';

    $('pkRedSlot').innerHTML = '<i class="fa-solid fa-user" style="color:#555"></i>';
    $('pkRedSlot').classList.remove('red-active');
    $('pkRedName').innerText = 'খালি';
    $('pkRedUid').innerText = 'UID: ---';

    $('pkSelectTitle').innerText = 'নীল সদস্য নির্বাচন করুন';
    $('pkSelectTitle').style.color = '#F5D76E';
    $('pkTimeVal').innerHTML = '১০ মিনিট <i class="fa-solid fa-chevron-right"></i>';
    $('pkStartBtn').disabled = true;

    renderPKMembers();
    $('pkSetupPanel').classList.add('active');
};

window.closePKSetup = () => {
    $('pkSetupPanel').classList.remove('active');
    _pkSelectedBlue = null;
    _pkSelectedRed = null;
    _pkCurrentPick = 'blue';
};

/* ═══ সদস্য লিস্ট রেন্ডার ═══ */
function renderPKMembers(){
    const list = $('pkMemberList');
    if (!list) return;
    const members = state.seats
        .filter(s => s && s.uid)
        .map(s => ({ uid: s.uid, name: s.name || 'User', avatar: s.avatar || GUEST_AVATAR }));

    if (!members.length){
        list.innerHTML = `<div style="text-align:center;color:#777;font-size:13px;padding:20px">মাইকে কেউ নেই</div>`;
        return;
    }
    list.innerHTML = members.map(m => `
        <div class="pk-member-item" data-uid="${esc(m.uid)}" onclick="pkSelectMember('${esc(m.uid)}')">
            <img src="${esc(m.avatar)}" onerror="this.src='${GUEST_AVATAR}'">
            <span>${esc(m.name)}</span>
        </div>
    `).join('');
}

/* ═══ সদস্য সিলেক্ট ═══ */
window.pkSelectMember = (uid) => {
    const member = state.seats.find(s => s && s.uid === uid);
    if (!member) return;

    if (_pkCurrentPick === 'blue'){
        if (_pkSelectedRed && _pkSelectedRed.uid === uid){
            toastMsg('❌ এই সদস্য লাল দলে আছে!');
            return;
        }
        _pkSelectedBlue = { uid: member.uid, name: member.name, avatar: member.avatar };
        $('pkBlueSlot').innerHTML = `<img src="${esc(member.avatar)}">`;
        $('pkBlueSlot').classList.add('blue-active');
        $('pkBlueName').innerText = member.name;
        $('pkBlueUid').innerText = 'UID: ' + (member.moiId || member.uid.slice(0, 8));
        document.querySelectorAll('#pkMemberList .pk-member-item').forEach(el => el.classList.remove('selected-blue'));
        const el = document.querySelector(`#pkMemberList .pk-member-item[data-uid="${uid}"]`);
        if (el) el.classList.add('selected-blue');

        if (!_pkSelectedRed){
            _pkCurrentPick = 'red';
            $('pkSelectTitle').innerText = 'লাল সদস্য নির্বাচন করুন';
            $('pkSelectTitle').style.color = '#ff2a74';
        }
    } else {
        if (_pkSelectedBlue && _pkSelectedBlue.uid === uid){
            toastMsg('❌ এই সদস্য নীল দলে আছে!');
            return;
        }
        _pkSelectedRed = { uid: member.uid, name: member.name, avatar: member.avatar };
        $('pkRedSlot').innerHTML = `<img src="${esc(member.avatar)}">`;
        $('pkRedSlot').classList.add('red-active');
        $('pkRedName').innerText = member.name;
        $('pkRedUid').innerText = 'UID: ' + (member.moiId || member.uid.slice(0, 8));
        document.querySelectorAll('#pkMemberList .pk-member-item').forEach(el => el.classList.remove('selected-red'));
        const el = document.querySelector(`#pkMemberList .pk-member-item[data-uid="${uid}"]`);
        if (el) el.classList.add('selected-red');
    }

    if (_pkSelectedBlue && _pkSelectedRed){
        $('pkStartBtn').disabled = false;
        $('pkSelectTitle').innerText = '✅ উভয় সদস্য নির্বাচিত!';
        $('pkSelectTitle').style.color = '#7dffa1';
    }
};

/* ═══ সময় Sheet ═══ */
window.openPKTimeSheet = () => {
    $('pkTimeSheet').classList.add('active');
    _updatePKTimeOptions();
};

window.closePKTimeSheet = () => {
    $('pkTimeSheet').classList.remove('active');
};

window.pkSetTime = (mins) => {
    _pkSelectedTime = mins;
    _updatePKTimeOptions();
    $('pkTimeVal').innerHTML = `${mins} মিনিট <i class="fa-solid fa-chevron-right"></i>`;
    closePKTimeSheet();
};

function _updatePKTimeOptions(){
    [5, 10, 15].forEach(m => {
        const el = $('pkOpt' + m);
        if (el) el.classList.toggle('active', m === _pkSelectedTime);
    });
}

/* ═══ PK শুরু ═══ */
window.pkStart = () => {
    if (!_pkSelectedBlue || !_pkSelectedRed){
        toastMsg('❌ উভয় সদস্য নির্বাচন করুন');
        return;
    }

    const blue = _pkSelectedBlue;
    const red = _pkSelectedRed;
    const timer = _pkSelectedTime;

    closePKSetup();

    $('pkSplashBlueImg').src = blue.avatar;
    $('pkSplashRedImg').src = red.avatar;
    $('pkSplash').classList.add('active');

    setTimeout(() => {
        $('pkSplash').classList.remove('active');
        pkLaunch(blue, red, timer);
    }, 2000);
};

function pkLaunch(blue, red, timerMin){
    const now = Date.now();
    state.pk = {
        blue: { uid: blue.uid, name: blue.name, avatar: blue.avatar, score: 0 },
        red: { uid: red.uid, name: red.name, avatar: red.avatar, score: 0 },
        timerMin,
        startedAt: now,
        expiresAt: now + timerMin * 60 * 1000
    };
    ls_set(KEY.pkState, state.pk);

    pkRenderBanner(state.pk);
    pkUpdateTug();
    pkStartTimer();
    toastMsg(`🔥 PK শুরু — ${blue.name} vs ${red.name}`);
    logActivity('react', null, { target: `PK: ${blue.name} vs ${red.name}` });
}

/* ═══ প্যানেল সাজানো (ছবি, নাম, Admin বাটন, জায়গা) ═══ */
let _pkBaseTop = null;
let _pkSupSig = '';

function pkPlace(){
    const banner = $('pkBanner');
    const grid = $('seatsGrid');
    if (!banner || !grid) return;
    const app = document.querySelector('.app-container');
    if (_pkBaseTop === null){
        /* PK চালুর আগের অবস্থায় সিটের সারি যেখান থেকে শুরু হত, প্যানেল ঠিক সেখানে বসবে */
        const active = app.classList.contains('pk-active');
        const bar = document.querySelector('.top-bar');
        _pkBaseTop = active && bar ? (bar.offsetTop + bar.offsetHeight) : grid.offsetTop;
    }
    banner.style.setProperty('--pkTop', _pkBaseTop + 'px');
    app.style.setProperty('--pkH', (banner.offsetHeight + 4) + 'px');
}

function pkRenderBanner(pk){
    const banner = $('pkBanner');
    const app = document.querySelector('.app-container');
    if (!banner || !app) return;

    if (_pkBaseTop === null && !app.classList.contains('pk-active')){
        const grid = $('seatsGrid');
        _pkBaseTop = grid ? grid.offsetTop : 0;
    }

    $('pkBannerBlueImg').src = pk.blue.avatar || GUEST_AVATAR;
    $('pkBannerBlueName').innerText = pk.blue.name || 'User';
    $('pkBannerRedImg').src = pk.red.avatar || GUEST_AVATAR;
    $('pkBannerRedName').innerText = pk.red.name || 'User';

    banner.classList.toggle('pk-admin', !!isAdminOrOwner());
    banner.classList.add('active');
    app.classList.add('pk-active');
    pkPlace();
    setTimeout(pkPlace, 120);
}

window.addEventListener('resize', () => { if (state.pk) pkPlace(); });

/* ═══ টাইমার ═══ */
function pkStartTimer(){
    if (_pkTimerInterval) clearInterval(_pkTimerInterval);
    pkUpdateTimerText();
    _pkTimerInterval = setInterval(() => {
        if (!state.pk){
            clearInterval(_pkTimerInterval);
            _pkTimerInterval = null;
            return;
        }
        if (Date.now() >= state.pk.expiresAt){
            clearInterval(_pkTimerInterval);
            _pkTimerInterval = null;
            pkEnd(false);
            return;
        }
        pkUpdateTimerText();
        pkUpdateTug();
    }, 1000);
}

function pkUpdateTimerText(){
    if (!state.pk) return;
    const left = Math.max(0, state.pk.expiresAt - Date.now());
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    const el = $('pkTimerText');
    if (el) el.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
}

/* ═══ মিটার (নীল ↔ লাল) + সাপোর্টার ═══ */
function pkUpdateTug(){
    if (!state.pk) return;
    const bs = state.pk.blue.score || 0;
    const rs = state.pk.red.score || 0;
    const total = bs + rs;
    let bp = total > 0 ? (bs / total) * 100 : 50;
    bp = Math.max(6, Math.min(94, bp));

    const blueBar = $('pkTugBlue');
    const redBar = $('pkTugRed');
    const whiteLine = $('pkWhiteLine');
    if (blueBar) blueBar.style.width = bp + '%';
    if (redBar) redBar.style.width = (100 - bp) + '%';
    if (whiteLine) whiteLine.style.left = bp + '%';

    const sb = $('pkScoreBlue'), sr = $('pkScoreRed');
    if (sb) sb.innerText = bs.toLocaleString();
    if (sr) sr.innerText = rs.toLocaleString();

    pkRenderSupporters();
}

/* যে দলকে যারা বেশি গিফট দিয়েছে তাদের সেরা ৪ জন — বেশি দেওয়া জন মাঝের দিকে */
function pkTopSupporters(team){
    const map = (team && team.supporters) || {};
    return Object.keys(map)
        .map(k => map[k])
        .filter(x => x && x.uid)
        .sort((a, b) => (b.amount || 0) - (a.amount || 0))
        .slice(0, 4);
}

function pkRenderSupporters(){
    if (!state.pk) return;
    const blue = pkTopSupporters(state.pk.blue);
    const red = pkTopSupporters(state.pk.red);
    const sig = JSON.stringify([blue.map(x => [x.uid, x.avatar]), red.map(x => [x.uid, x.avatar])]);
    if (sig === _pkSupSig) return;

    const prevUids = new Set((_pkSupSig ? JSON.parse(_pkSupSig).flat().map(x => x[0]) : []));
    _pkSupSig = sig;

    const slot = (x) => {
        if (!x) return '<div class="sl e"></div>';
        const pop = prevUids.has(x.uid) ? '' : ' pop';
        return `<div class="sl${pop}" onclick="pkOpenProfile('${esc(x.uid)}')"><img src="${esc(x.avatar || GUEST_AVATAR)}" onerror="this.src='${GUEST_AVATAR}'"></div>`;
    };
    const pad = (arr) => { const a = arr.slice(); while (a.length < 4) a.push(null); return a; };

    /* নীল পাশে ডান দিক (মাঝের কাছে) = ১ নম্বর; লাল পাশে বাম দিক (মাঝের কাছে) = ১ নম্বর */
    const blueRow = pad(blue).reverse();
    const redRow = pad(red);

    const b = $('pkSupBlue'), r = $('pkSupRed');
    if (b) b.innerHTML = blueRow.map(slot).join('');
    if (r) r.innerHTML = redRow.map(slot).join('');
}

/* ═══ প্রোফাইলে টাচ করলে প্রোফাইল প্যানেল খুলবে ═══ */
window.pkOpenProfile = (who) => {
    if (!state.pk) return;
    const uid = (who === 'blue') ? state.pk.blue.uid : (who === 'red') ? state.pk.red.uid : who;
    if (!uid) return;
    const inRoom = (state.listeners || []).some(x => x && x.uid === uid);
    if (!inRoom){
        toastMsg('এই ইউজার এখন রুমে নেই');
        return;
    }
    try { openUserProfile(uid); } catch(e){ toastMsg('প্রোফাইল খোলা যায়নি'); }
};

/* ═══ সময় বাড়ানো (শুধু Owner/Admin) ═══ */
window.pkOpenExtend = () => {
    if (!state.pk) return;
    if (!isAdminOrOwner()){
        toastMsg('শুধু Owner/Admin সময় বাড়াতে পারবে');
        return;
    }
    $('pkExtendSheet').classList.add('active');
};

window.closePKExtend = () => {
    $('pkExtendSheet').classList.remove('active');
};

window.pkExtend = (mins) => {
    closePKExtend();
    if (!state.pk || !isAdminOrOwner()) return;
    const raw = ls_get(KEY.pkState);
    if (!raw || !raw.blue || !raw.red) return;
    /* কপি করে বদলাই, নইলে সার্ভারে বদলটা ধরা পড়ে না */
    const cur = JSON.parse(JSON.stringify(raw));
    cur.expiresAt = (cur.expiresAt || Date.now()) + mins * 60 * 1000;
    cur.timerMin = (cur.timerMin || 0) + mins;
    ls_set(KEY.pkState, cur);
    state.pk = cur;
    pkUpdateTimerText();
    toastMsg(`⏱ +${mins} মিনিট বাড়ানো হয়েছে`);
};

/* ═══ PK শেষ ═══ */
function pkFinish(pk){
    if (_pkTimerInterval){ clearInterval(_pkTimerInterval); _pkTimerInterval = null; }
    const banner = $('pkBanner');
    if (banner) banner.classList.remove('active', 'pk-admin');
    const app = document.querySelector('.app-container');
    if (app) app.classList.remove('pk-active');
    const sheet = $('pkExtendSheet');
    if (sheet) sheet.classList.remove('active');
    _pkBaseTop = null;
    _pkSupSig = '';
    if ($('pkSupBlue')) $('pkSupBlue').innerHTML = '';
    if ($('pkSupRed')) $('pkSupRed').innerHTML = '';
    if (pk) pkShowResult(pk);
}

window.pkEnd = (isManual) => {
    if (!state.pk) return;
    const pk = state.pk;
    state.pk = null;
    if (isAdminOrOwner()) ls_set(KEY.pkState, null);
    pkFinish(pk);
};

/* ═══ জয়-হার স্ক্রিন — ৫ সেকেন্ড দেখিয়ে নিজে বন্ধ ═══ */
let _pkResultTimer = null;
function pkShowResult(pk){
    const box = $('pkResultBox');
    const wrap = $('pkResult');
    if (!box || !wrap) return;
    const bs = pk.blue.score || 0, rs = pk.red.score || 0;
    const draw = bs === rs;
    const bCls = draw ? 'draw' : (bs > rs ? 'win' : 'lose');
    const rCls = draw ? 'draw' : (rs > bs ? 'win' : 'lose');
    const tagOf = (c) => c === 'win' ? 'WINNER' : c === 'lose' ? 'LOSER' : 'DRAW';
    const side = (t, cls) => `
        <div class="pkr-side ${cls}">
            ${cls === 'win' ? '<i class="fa-solid fa-crown crown"></i>' : ''}
            <img src="${esc(t.avatar || GUEST_AVATAR)}" onerror="this.src='${GUEST_AVATAR}'">
            <div class="nm">${esc(t.name || 'User')}</div>
            <div class="tag">${tagOf(cls)}</div>
        </div>`;
    box.innerHTML = side(pk.blue, bCls) + '<div class="pkr-vs">VS</div>' + side(pk.red, rCls);
    wrap.classList.add('active');
    if (_pkResultTimer) clearTimeout(_pkResultTimer);
    _pkResultTimer = setTimeout(() => {
        wrap.classList.remove('active');
        _pkResultTimer = null;
    }, 5000);
}

/* ═══ গিফট hook — স্কোর ও সাপোর্টার সার্ভার (sendGift) Realtime DB-তে বাড়ায়; ক্লায়েন্টে আর হাতে বাড়ানো হয় না ═══ */
window.pkHandleGift = () => {};

/* ═══ Realtime DB থেকে PK অবস্থা সিঙ্ক (সবার স্ক্রিনে একই) ═══ */
function pkRestoreFromStorage(){
    const saved = ls_get(KEY.pkState);
    const valid = saved && saved.blue && saved.red;
    if (!valid || Date.now() >= saved.expiresAt){
        if (state.pk){
            const pk = valid ? saved : state.pk;
            state.pk = null;
            pkFinish(pk);
        }
        return;
    }
    const fresh = !state.pk;
    state.pk = saved;
    pkRenderBanner(saved);
    pkUpdateTimerText();
    pkUpdateTug();
    if (fresh || !_pkTimerInterval) pkStartTimer();
}

window.renderPKMembers = renderPKMembers;
window.pkUpdateTug = pkUpdateTug;
window.pkRestoreFromStorage = pkRestoreFromStorage;
