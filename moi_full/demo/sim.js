/* demo/sim.js — রুমকে "জীবন্ত" রাখা: গিফট, চ্যাট, রিঅ্যাকশন, কথা বলা, ঢোকা/বের হওয়া, মাইকে ওঠা-নামা
   এটা শুধু ডেমোর জন্য — আসল অ্যাপে এই ফাইল লাগবে না।
   ⚙️ গতি বদলাতে চাইলে নিচের SPEED বদলান (১ = স্বাভাবিক, ২ = দ্বিগুণ দ্রুত, ০.৫ = ধীর)। */
(function(){
'use strict';
const D = window.DEMO, M = window.__MOCK; if (!D || !M) return;
/* ═══ ⚙️ সেটিংস (এখান থেকে বদলান) ═══
   গিফট: একজন আরেকজনকে ফুল (রোজ) দেবে — এত মিনিটের মধ্যে একটা (এগুলো থেকে এলোমেলো বাছা হবে) */
const GIFT_EVERY_MIN = [20, 30, 60];
/* ইমোজি রিঅ্যাকশন: সিটে বসা একজন — এত মিনিট পরপর একটা (ন্যূনতম, সর্বোচ্চ) */
const EMOJI_EVERY_MIN = [5, 10];
const FIRST_EMOJI_SEC = 20;          /* রুমে ঢোকার কত সেকেন্ড পর প্রথম ইমোজি */
const SHOW_CHAT_TEXT = false;        /* true দিলে সাধারণ মেসেজও আসবে (এখন বন্ধ) */
const SHOW_SPEAKING_RING = false;    /* সব মিউট তাই বন্ধ */
const SHOW_HEARTS = false;           /* ভাসমান ❤ বন্ধ */
const SPEED = Number((new URLSearchParams(location.search)).get('speed')) || 1;
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const every = (fn, min, max, first) => {
    const loop = () => { setTimeout(() => { if (!document.hidden){ try { fn(); } catch(e){ console.warn('[sim]', e); } } loop(); }, rnd(min, max) / SPEED); };
    setTimeout(() => { if (!document.hidden){ try { fn(); } catch(e){ console.warn('[sim]', e); } } loop(); }, (first || min) / SPEED);
};
const LIVE = () => window.MOIFB.LIVE;
const fs = () => window.MOIFB.db;
const rtdb = () => window.MOIFB.rtdb;
const meUid = () => { try { const u = window.MOIFB.auth.currentUser; if (u && u.uid) return u.uid; } catch(e){} return D.ME.uid; };
const U = uid => D.USERS[uid];

/* ═══════════ হোম পেজ: রুমের লোকসংখ্যা ওঠানামা করবে ═══════════ */
function homeSim(){
    const away = {};   /* roomId → [uid] (যারা বের হয়ে গেছে) */
    const spare = D.SPARE.slice();
    every(() => {
        const R = pick(D.ROOMS); const base = LIVE() + '/rooms/' + R.id; const pres = LIVE() + '/roomPresence/' + R.id;
        away[R.id] = away[R.id] || [];
        const present = Object.keys(M.rtGet(pres) || {});
        const canLeave = R.audUids.filter(u => present.includes(u));
        if (away[R.id].length < 4 && canLeave.length > R.aud - 3 && Math.random() < 0.5){
            const u = pick(canLeave); away[R.id].push(u);
            M.rtSet(pres + '/' + u, null); M.rtSet(base + '/listeners/' + u, null);
        } else if (away[R.id].length){
            const u = away[R.id].shift();
            M.rtSet(pres + '/' + u, true); M.rtSet(base + '/listeners/' + u, { name: U(u).name, avatar: U(u).photo, role: 'member', joined: Date.now() });
        } else if (spare.length){
            const u = spare.shift(); R.audUids.push(u);
            M.rtSet(pres + '/' + u, true); M.rtSet(base + '/listeners/' + u, { name: U(u).name, avatar: U(u).photo, role: 'member', joined: Date.now() });
        }
    }, 9000, 16000, 6000);
}

/* ═══════════ রুমের ভিতর ═══════════ */
function roomSim(){
    const ROOM = (typeof ROOM_ID !== 'undefined') ? ROOM_ID : (new URLSearchParams(location.search)).get('room');
    const R = D.ROOM_BY_ID[ROOM]; if (!R) return;
    const base = () => LIVE() + '/rooms/' + ROOM;
    /* আগেভাগে লোড: ফলো সংখ্যা ও "জয়েন" তালিকা — যাতে প্রথমবার ট্যাপেই সঠিক সংখ্যা দেখায় */
    try {
        R.seatUids.concat(R.audUids).concat([meUid()]).forEach(u => { MOISync.watch('moi_follow_' + u + '_followers'); MOISync.watch('moi_follow_' + u + '_following'); });
        setTimeout(() => {
            try { state.joinedUsers = new Set(ls_get(KEY.joined, []) || []); renderListeners(); if (typeof renderMembers === 'function') renderMembers(); if (typeof updateJoinButton === 'function') updateJoinButton(); } catch(e){}
        }, 600);
    } catch(e){}
    const away = [], spare = D.SPARE.slice();
    const seatedNow = () => (state.seats || []).map((s, i) => s && s.uid ? { i, s } : null).filter(Boolean).filter(x => x.s.uid !== meUid());
    const audNow = () => (state.listeners || []).filter(l => l.uid !== meUid() && !(state.seats || []).some(s => s && s.uid === l.uid) && U(l.uid));
    const GIFTS = [['rose', 1, 22], ['kiss', 1, 16], ['present', 5, 12], ['diamond', 5, 12], ['cake', 10, 14], ['treasure', 15, 8], ['diamond_v3', 10, 10], ['diamond_v2', 1, 6]];
    const pickGift = () => { const tot = GIFTS.reduce((a, g) => a + g[2], 0); let r = Math.random() * tot; for (const g of GIFTS){ r -= g[2]; if (r <= 0) return g; } return GIFTS[0]; };
    const nm = id => { try { const g = giftFindById(id); return (g && g.name) || id; } catch(e){ return id; } };
    const act = a => { try { if (typeof showActivity === 'function') showActivity(Object.assign({ ts: Date.now() }, a)); } catch(e){} };
    const say = (uid, text, extra) => {
        const u = U(uid); if (!u) return; const id = 'sim_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        fs().collection('rooms/' + ROOM + '/messages').doc(id).set(Object.assign({ id, type: 'text', uid, senderUid: uid, name: u.name, senderName: u.name, avatar: u.photo, text, ts: Date.now() }, extra || {}));
    };

    /* ১) একজন আরেকজনকে গিফট — আসল গিফট সিস্টেমের মতোই (অ্যানিমেশন + টপ গিফটার + সিটের কয়েন + চ্যাটে বার্তা) */
    function simGift(){
        const seated = seatedNow(); if (!seated.length) return;
        const pool = audNow().map(l => l.uid).concat(seated.map(x => x.s.uid)); if (!pool.length) return;
        const target = pick(seated);
        const sender = pick(pool.filter(u => u !== target.s.uid)); if (!sender) return;
        const gid = 'rose', unit = 1, qty = 1;      /* শুধু রোজ (ফুল) */
        const ts = Date.now(), tu = U(target.s.uid), su = U(sender);
        rtdb().ref(base() + '/liveGifts').push({ senderUid: sender, targetUids: [target.s.uid], giftId: gid, qty, ts });
        rtdb().ref(base() + '/giftStats/' + tu.uid).update({ uid: tu.uid, name: tu.name, avatar: tu.photo });
        rtdb().ref(base() + '/giftStats/' + tu.uid + '/history').push({ amount: unit * qty, ts });
        rtdb().ref(base() + '/seats/' + target.i + '/coins').transaction(v => (v || 0) + unit * qty);
        say(sender, '💎 ' + nm(gid) + ' × ' + qty + ' → ' + tu.name, { type: 'gift', giftMeta: { giftId: gid, qty, targetUids: [tu.uid] } });
        act({ action: 'heart', name: tu.name, uid: tu.uid });
    }
    (function giftLoop(){
        const wait = pick(GIFT_EVERY_MIN) * 60000 + rnd(0, 120) * 1000;
        setTimeout(() => { if (!document.hidden){ try { simGift(); } catch(e){ console.warn('[sim]', e); } } giftLoop(); }, wait / SPEED);
    })();

    /* ২) চ্যাট */
    if (SHOW_CHAT_TEXT) every(() => {
        const who = audNow().map(l => l.uid).concat(seatedNow().map(x => x.s.uid)); if (!who.length) return;
        say(pick(who), pick(D.TEXTS));
    }, 4500, 9000, 2500);

    /* ৩) সিটে বসা মানুষের ইমোজি রিঅ্যাকশন */
    const CODES = ['1f602', '1f60d', '1f62d', '2764_fe0f', '1f525', '1f44f', '1f44d', '2728', '1f389', '1f970'];
    const doEmoji = () => {
        const s = seatedNow(); if (!s.length) return;
        const x = pick(s), code = pick(CODES);
        if (typeof showSeatReaction === 'function') showSeatReaction(x.i, code, (window.EMOJI_BASE || '') + code + '/512.gif');
    };
    (function emojiLoop(first){
        const wait = first ? FIRST_EMOJI_SEC * 1000 : rnd(EMOJI_EVERY_MIN[0] * 60, EMOJI_EVERY_MIN[1] * 60) * 1000;
        setTimeout(() => { if (!document.hidden){ try { doEmoji(); } catch(e){ console.warn('[sim]', e); } } emojiLoop(false); }, wait / SPEED);
    })(true);

    /* ৪) কথা বলার রিং — যাদের মাইক চালু তাদের সিটে মাঝেমধ্যে স্পন্দন */
    if (SHOW_SPEAKING_RING) setInterval(() => {
        if (document.hidden) return;
        const on = seatedNow().filter(x => x.s.mic); const talk = new Set();
        on.slice().sort(() => Math.random() - 0.5).slice(0, on.length > 3 ? 2 : 1).forEach(x => talk.add(x.i));
        document.querySelectorAll('#seatsGrid .seat').forEach(el => {
            const i = +el.dataset.seat; if (talk.has(i)) el.classList.add('speaking'); else el.classList.remove('speaking');
        });
    }, 1600 / SPEED);

    /* ৫) লাইক / হার্ট */
    if (SHOW_HEARTS) every(() => { rtdb().ref(base() + '/likes').transaction(v => (v || 0) + rnd(1, 3)); }, 2500, 5000, 3000);

    /* ৬) শ্রোতা ঢোকা / বের হওয়া */
    every(() => {
        const lbase = base() + '/listeners/', pbase = LIVE() + '/roomPresence/' + ROOM + '/';
        const aud = audNow();
        if (away.length && (aud.length >= R.aud || Math.random() < 0.55)){
            const u = away.shift();
            M.rtSet(lbase + u, { name: U(u).name, avatar: U(u).photo, role: 'member', joined: Date.now() }); M.rtSet(pbase + u, true);
            act({ action: 'join', name: U(u).name });
        } else if (aud.length > R.aud - 3 && Math.random() < 0.6){
            const u = pick(aud).uid; away.push(u);
            M.rtSet(lbase + u, null); M.rtSet(pbase + u, null); M.rtSet(base() + '/joinedUsers/' + u, null);
            act({ action: 'leave', name: U(u).name });
        } else if (spare.length){
            const u = spare.shift(); R.audUids.push(u);
            M.rtSet(lbase + u, { name: U(u).name, avatar: U(u).photo, role: 'member', joined: Date.now() }); M.rtSet(pbase + u, true);
            act({ action: 'join', name: U(u).name });
        }
    }, 90000, 180000, 60000);

    /* ৮) PK — প্রথম ৬টা রুমে ঢুকলেই একটা PK চলতে থাকে; শ্রোতারা দুই পাশকে গিফট দিয়ে সাপোর্ট করে।
          শেষ হলে একটু পরে নতুন জুটি নিয়ে আবার শুরু। (আপনি গিফট দিলে আসল গিফট সিস্টেমেই স্কোর/সাপোর্টার বাড়বে) */
    const PK_ROOMS = D.ROOMS.slice(0, 6).map(r => r.id);       /* কোন কোন রুমে PK চলবে — সংখ্যা বদলাতে 6 বদলান */
    const PK_MIN = 10;                                         /* PK কত মিনিটের */
    const PK_GIFT_SEC = [2.5, 6];                              /* কত সেকেন্ড পরপর একটা গিফট (ন্যূনতম, সর্বোচ্চ) */
    const PK_AMOUNTS = [[10, 30], [50, 25], [100, 20], [199, 12], [520, 8], [1000, 5]];   /* [💎, সম্ভাবনা] */
    if (PK_ROOMS.indexOf(ROOM) >= 0) (function pkSim(){
        const pkPath = () => base() + '/pkState';
        let round = 0, fav = 'blue', favUntil = 0;
        const pickAmt = () => { const tot = PK_AMOUNTS.reduce((a, g) => a + g[1], 0); let r = Math.random() * tot; for (const g of PK_AMOUNTS){ r -= g[1]; if (r <= 0) return g[0]; } return PK_AMOUNTS[0][0]; };
        function giftPk(side, uid, amount){
            const u = U(uid); if (!u) return;
            rtdb().ref(pkPath() + '/' + side + '/score').transaction(v => (v || 0) + amount);
            rtdb().ref(pkPath() + '/' + side + '/supporters/' + uid).transaction(v => ({ uid, name: u.name, avatar: u.photo, amount: ((v && v.amount) || 0) + amount }));
        }
        function simPkGift(){
            const pk = M.rtGet(pkPath()); if (!pk || !pk.blue || !pk.red || pk.expiresAt <= Date.now()) return;
            const skip = new Set([pk.blue.uid, pk.red.uid, meUid()]);
            const pool = audNow().map(l => l.uid).concat(seatedNow().map(x => x.s.uid)).filter(u => !skip.has(u));
            if (!pool.length) return;
            if (Date.now() > favUntil){ fav = Math.random() < 0.5 ? 'blue' : 'red'; favUntil = Date.now() + rnd(25, 70) * 1000; }   /* মাঝেমধ্যে কে এগিয়ে তা বদলায় */
            const side = Math.random() < 0.68 ? fav : (fav === 'blue' ? 'red' : 'blue');
            giftPk(side, pick(pool), pickAmt());
        }
        function startPk(){
            const seated = (state.seats || []).filter(s => s && s.uid && s.uid !== meUid() && U(s.uid));
            if (seated.length < 2) return;
            const a = seated[round % seated.length], b = seated[(round + 1) % seated.length]; round += 2;
            const now = Date.now(), started = now - rnd(60, 240) * 1000;      /* ঢোকার সময় PK কিছুটা এগিয়ে থাকে */
            const side = x => ({ uid: x.uid, name: x.name, avatar: x.avatar, score: 0 });
            rtdb().ref(pkPath()).set({ blue: side(a), red: side(b), timerMin: PK_MIN, startedAt: started, expiresAt: started + PK_MIN * 60000 })
                .then(() => { for (let q = 0; q < rnd(8, 12); q++) simPkGift(); });
        }
        function tick(){
            const pk = M.rtGet(pkPath());
            if (!pk || !pk.blue || !pk.red){ startPk(); return; }
            if (pk.expiresAt <= Date.now()){
                if (Date.now() - pk.expiresAt > 12000) rtdb().ref(pkPath()).set(null);     /* ১২ সেকেন্ড পর মুছে নতুন PK */
                return;
            }
            simPkGift();
        }
        every(tick, PK_GIFT_SEC[0] * 1000, PK_GIFT_SEC[1] * 1000, 1200);
    })();

    /* ৭) মাইকে ওঠা-নামা/মিউট-আনমিউট — বন্ধ: সব আইডি মিউট থাকবে, সিট স্থির */
}

/* ═══════════ কোন পেজে কী চালু ═══════════ */
function boot(){
    if (document.getElementById('seatsGrid')){
        let n = 0;
        const t = setInterval(() => {
            n++;
            if (typeof state !== 'undefined' && state && Array.isArray(state.seats) && typeof joined !== 'undefined' && joined){ clearInterval(t); roomSim(); }
            else if (n > 80) clearInterval(t);
        }, 250);
    } else if (document.getElementById('feed')){
        homeSim();
    }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
