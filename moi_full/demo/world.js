/* demo/world.js — ডেমোর "জীবন্ত দুনিয়া": বটরা আসল ইউজারের মতো সব ফিচার ব্যবহার করে
   ──────────────────────────────────────────────────────────────────────────────
   ১) প্রোফাইল (একবার বসে): কেউ SVIP, কেউ নরমাল; কেউ স্টোর থেকে রিং/এন্ট্রি/বাবল পরে আছে;
      রুমের জোড়ায় CP (Lv.1 থেকে Lv.50), বন্ধুত্ব; রুমের লেভেল ও ফ্রেম (Use করা)।
   ২) রুমের অবস্থা: ওয়ালপেপার, সিট স্কিন, টপিক, গানের লাইন।
   ৩) চলমান কাজ (যে রুমে আছেন সেখানে): ঢোকা (SVIP/স্টোর এন্ট্রি এনিমেশন সহ), কমেন্ট, ইমোজি,
      ছোট/বড় গিফট, রকেট ছাড়া ও ধরা, লাকি বক্স, সিট বদল, টপিক/ওয়ালপেপার/স্কিন বদল, CP-র গিফট।
   সব গিফট/রকেট/লাকি বক্স আসল হ্যান্ডলারের (MOIEco.asBot) মাধ্যমে — তাই ব্যালেন্স, XP, রুম-লেভেল,
   CP পয়েন্ট সব আসলের মতোই বদলায়। (শুধু ডেমো — আসল Firebase-এ এই ফাইল লাগবে না।)
   ⚙️ গতি: ?speed=2 দিলে দ্বিগুণ দ্রুত, ?speed=0.5 ধীর।  কনসোল: MOIWorld.fire('gift'|'rocket'|'lucky'|'join'|'emoji'|'seat'|'room'|'say') */
(function(){
'use strict';
if (window.top !== window) return;
const D = window.DEMO, M = window.__MOCK; if (!D || !M) return;
const SPEED = Number((new URLSearchParams(location.search)).get('speed')) || 1;
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const LIVE = () => window.MOIFB.LIVE;
const rtdb = () => window.MOIFB.rtdb;
const fs = () => window.MOIFB.db;
const U = uid => D.USERS[uid];
const LS = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };
const SY = () => window.MOISync;
const FAR = Date.now() + 3650 * 86400000;
const meUid = () => { try { const u = window.MOIFB.auth.currentUser; if (u && u.uid) return u.uid; } catch(e){} return D.ME.uid; };
const asBot = (bot, fn, args) => (window.MOIEco ? MOIEco.call('asBot', { as: bot, fn, args }) : Promise.reject(new Error('no eco')));

/* ════════════ ১) প্রোফাইল ও রুমের স্থায়ী অবস্থা ════════════ */
const CP_LEVELS = [1, 2, 4, 7, 10, 13, 18, 24, 32, 41, 50];
const cpCost = n => Math.round(200 * (1 + 0.15 * (n - 1)) / 10) * 10;
const cpPts = lv => { let s = 0; for (let k = 1; k <= lv; k++) s += cpCost(k); return s + 40; };
const ROOM_LEVELS = [8, 20, 31, 44, 12, 26, 52, 37, 60, 15, 70, 23, 34, 46, 5, 58];
const TIERS = [20, 30, 40, 50, 60, 70];
const tierOf = lv => { let t = 0; TIERS.forEach(x => { if (lv >= x) t = x; }); return t; };
const WALL = [['#1b1464', '#c471ed'], ['#0f2027', '#2c5364'], ['#42275a', '#734b6d'], ['#141e30', '#243b55'], ['#3a1c71', '#ffaf7b'], ['#093028', '#237a57']];
const wallUrl = (c) => 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="360" height="740"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient><radialGradient id="r" cx=".5" cy=".2" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="360" height="740" fill="url(#g)"/><rect width="360" height="740" fill="url(#r)"/></svg>');

function seedProfiles(){
    const ids = Object.keys(D.USERS).filter(u => u !== D.ME.uid);
    ids.forEach((uid, i) => {
        /* SVIP: প্রায় ১৫% */
        if (i % 7 === 3 && !LS('moi_svip_level_' + uid)) LS('moi_svip_level_' + uid, { level: 1, until: 0 });
        /* স্টোর: রিং / এন্ট্রি / বাবল / ইমোজি প্যাক — আলাদা আলাদা মিশ্রণ */
        if (!LS('moi_store_' + uid) && i % 3 !== 2){
            const st = { owned: {}, equip: {} }, k = i % 6;
            if (k === 0 || k === 3){ st.owned.ring_gold = FAR; st.equip.frame = 'ring_gold'; }
            if (k === 1 || k === 3){ st.owned.entry_eyes1 = FAR; st.equip.entry = 'entry_eyes1'; }
            if (k === 2 || k === 4){ st.owned.bubble_vip1 = FAR; st.equip.bubble = 'bubble_vip1'; }
            if (k === 5){ st.owned.emoji_memes = FAR; st.owned.ring_gold = FAR; /* কেনা আছে কিন্তু পরেনি */ }
            if (i % 5 === 0) st.owned.emoji_memes = FAR;
            LS('moi_store_' + uid, st);
        }
    });
}

function seedRelations(){
    const S = SY(); if (!S) return;
    const cps = S.get('moi_rel_cp', {}) || {}, frs = S.get('moi_rel_fr', {}) || {};
    if (Object.keys(cps).some(k => cps[k] && cps[k].bot)) return;      /* আগেই বসানো */
    let n = 0;
    D.ROOMS.forEach((R, ri) => {
        const people = R.seatUids.concat(R.audUids).map(U).filter(Boolean);
        const f = people.filter(p => p.gender === 'Female'), m = people.filter(p => p.gender === 'Male');
        const pairs = Math.min(2, f.length, m.length);
        for (let q = 0; q < pairs; q++){
            const a = f[q].uid, b = m[q].uid, key = a < b ? a + '|' + b : b + '|' + a;
            const lv = CP_LEVELS[(ri * 2 + q) % CP_LEVELS.length];
            cps[key] = { a: key.split('|')[0], b: key.split('|')[1], ts: Date.now() - (3 + ((ri * 5 + q * 11) % 90)) * 86400000, pts: cpPts(lv), bot: 1 };
            n++;
        }
        /* বন্ধুত্ব / ভাই-বোন */
        const x = people[(ri * 3 + 5) % people.length], y = people[(ri * 3 + 9) % people.length];
        if (x && y && x.uid !== y.uid){
            const k = x.uid < y.uid ? x.uid + '|' + y.uid : y.uid + '|' + x.uid;
            frs[k] = { a: k.split('|')[0], b: k.split('|')[1], type: pick(['friend', 'friend', 'sister', 'brother']), ts: Date.now() - rnd(2, 60) * 86400000, bot: 1 };
        }
    });
    S.set('moi_rel_cp', cps); S.set('moi_rel_fr', frs);
}

/* বটদের সম্পর্ক — পাশাপাশি সিটে, সব লেভেল দেখার জন্য (শুধু ডেমো; একবারই বসে) */
function seedRelLevels(){
    const S = SY(); if (!S || S.get('moi_relseed_v4', 0)) return;
    const cps = S.get('moi_rel_cp', {}) || {}, frs = S.get('moi_rel_fr', {}) || {};
    Object.keys(cps).forEach(k => { if (cps[k] && cps[k].bot) delete cps[k]; });
    Object.keys(frs).forEach(k => { if (frs[k] && frs[k].bot) delete frs[k]; });
    const STEP = [0, 10000, 25000, 50000, 100000], KIND = ['friend', 'sister', 'brother', 'friend'], CPL = [8, 10, 20, 30, 40, 50];
    D.ROOMS.forEach((R, ri) => {
        const s = R.seatUids || [], ix = R.seatIdx || [], pairs = [];
        for (let k = 0; k + 1 < s.length && pairs.length < 5; k++) if (ix[k + 1] === ix[k] + 1 && ix[k] % 4 !== 3){ pairs.push([s[k], s[k + 1]]); k++; }
        pairs.forEach((pr, q) => {
            const a = pr[0], b = pr[1], key = a < b ? a + '|' + b : b + '|' + a, ts = Date.now() - (4 + ri * 3 + q * 7) * 86400000;
            if (q === 1 || (q === 3 && pairs.length > 3)) cps[key] = { a: key.split('|')[0], b: key.split('|')[1], ts, pts: cpPts(CPL[(ri + q) % CPL.length]), bot: 1 };
            else frs[key] = { a: key.split('|')[0], b: key.split('|')[1], type: KIND[(q + ri) % 3], ts, pts: STEP[(ri + q) % 5] + 300 + ri * 90, bot: 1 };
        });
    });
    S.set('moi_rel_cp', cps); S.set('moi_rel_fr', frs); S.set('moi_relseed_v4', 1);
}

async function seedRooms(){
    /* রুমের লেভেল (xp) ও Use-করা ফ্রেম — Firestore-এর রুম ডকে বসে, তাই হোম ও রুম দুই পেজেই একই দেখা যায় */
    for (let ri = 0; ri < D.ROOMS.length; ri++){
        const R = D.ROOMS[ri];
        try {
            const ref = fs().collection('rooms').doc(R.id), d = await ref.get();
            if (!d.exists || typeof d.data().xp === 'number') continue;
            const lv = ROOM_LEVELS[ri % ROOM_LEVELS.length], t = tierOf(lv);
            await ref.set({ xp: lv * 1000 + rnd(50, 900), frameUse: t && ri % 4 !== 3 ? t : 0 }, { merge: true });
        } catch(e){ console.warn('[world] rooms', e); }
    }
}

function seedRoomLive(){
    D.ROOMS.forEach((R, ri) => {
        const base = LIVE() + '/rooms/' + R.id;
        if (ri % 3 !== 1) M.rtSet(base + '/wallpaper', { dataUrl: wallUrl(WALL[ri % WALL.length]), ts: Date.now() - 86400000 });
        if (ri % 4 !== 3){
            const id = 'skin' + (1 + (ri % 4));
            M.rtSet(base + '/skin', { id });
            const own = {}; own[id] = FAR; M.rtSet(base + '/skinOwn', own);
        }
    });
}

/* ════════════ ২) রুমের ভিতরের চলমান কাজ ════════════ */
const GIFTS = {
    small: [['rose', 1, 1, 5], ['kiss', 1, 1, 5], ['diamond_v2', 1, 1, 10], ['present', 5, 1, 4]],
    mid:   [['cake', 10, 3, 12], ['diamond', 5, 10, 20], ['present', 5, 10, 25], ['diamond_v3', 10, 5, 10]],
    big:   [['treasure', 15, 30, 99], ['diamond_v3', 10, 60, 150], ['cake', 10, 50, 120]]
};
const CODES = ['1f602', '1f60d', '1f62d', '2764_fe0f', '1f525', '1f44f', '1f44d', '2728', '1f389', '1f970', '1f60e', '1f64f'];
const SONGS = ['Tum Hi Ho', 'Kun Faya Kun', 'Shape of You', 'Pasoori', 'Closer', 'Bondhu Tui', 'Perfect', 'Kalank', 'Despacito', 'Ei Mon Tomake'];
const TOPICS = ['Late night chill 🎶', 'গান ও আড্ডা 🌸', 'Weekend vibes ✨', 'নতুন বন্ধু খুঁজছি 🤝', 'Music & Talks 🎧', 'Good vibes only 💫', 'রাতের আড্ডা 🌙', 'Karaoke time 🎤'];
const MORE_TEXT = ['Hi everyone 👋', 'কেমন আছো সবাই?', 'Nice room ✨', 'গানটা দারুণ 🔥', 'Welcome 🤗', 'Salam all', 'Love this vibe ❤', 'কে কে জেগে আছো? 😄', 'Who is from UAE? 🇦🇪', 'ধন্যবাদ সবাইকে 🌹', 'Good night all 🌙', 'Mashallah 😍', 'হা হা হা 😂', 'Great energy!', 'Hello from Malaysia 🇲🇾'];

function roomWorld(){
    if (/[?&]bots=0/.test(location.search)) return;   /* ?bots=0 → বট বন্ধ */
    const ROOM = (typeof ROOM_ID !== 'undefined') ? ROOM_ID : (new URLSearchParams(location.search)).get('room');
    const R = D.ROOM_BY_ID[ROOM]; if (!R) return;
    const base = () => LIVE() + '/rooms/' + ROOM;
    const ME = meUid();
    const seats = () => state.seats || [];
    const seated = () => seats().map((s, i) => s && s.uid ? { i, s } : null).filter(Boolean).filter(x => x.s.uid !== ME && U(x.s.uid));
    const aud = () => (state.listeners || []).filter(l => l.uid !== ME && U(l.uid) && !seats().some(s => s && s.uid === l.uid));
    const crowd = () => seated().map(x => x.s.uid).concat(aud().map(l => l.uid));
    const away = [], spare = D.SPARE.slice();
    const ensureCash = async uid => {
        try {
            const d = await fs().collection('users').doc(uid).get(); const v = d.exists ? (d.data().diamonds || 0) : 0;
            if (v < 6000) await fs().collection('users').doc(uid).set({ diamonds: 20000 + rnd(0, 40000) }, { merge: true });
        } catch(e){}
    };
    const say = (uid, text, extra) => {
        const u = U(uid); if (!u) return; const id = 'w_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        return fs().collection('rooms/' + ROOM + '/messages').doc(id).set(Object.assign({ id, type: 'text', uid, senderUid: uid, name: u.name, senderName: u.name, avatar: u.photo, text, ts: Date.now() }, extra || {}));
    };
    const act = a => { try { if (typeof showActivity === 'function') showActivity(Object.assign({ ts: Date.now() }, a)); } catch(e){} };
    const gname = id => { try { const g = giftFindById(id); return (g && g.name) || id; } catch(e){ return id; } };
    const every = (fn, min, max, first) => {
        const loop = () => setTimeout(() => { if (!document.hidden){ try { fn(); } catch(e){ console.warn('[world]', e); } } loop(); }, rnd(min, max) * 1000 / SPEED);
        setTimeout(() => { if (!document.hidden){ try { fn(); } catch(e){ console.warn('[world]', e); } } loop(); }, (first || min) * 1000 / SPEED);
    };

    /* — ঢোকা: SVIP / স্টোর এন্ট্রি থাকলে এনিমেশন সহ — */
    function join(){
        let u = away.length && Math.random() < 0.6 ? away.shift() : (spare.length ? spare.shift() : null);
        /* ঢোকার অর্ধেক সময় SVIP/স্টোর এন্ট্রিওয়ালা বট — গাড়ি/এন্ট্রি এনিমেশন নিয়মিত দেখা যাবে */
        if (Math.random() < 0.5){ const cr = crowd(), vip = Object.keys(D.USERS).filter(x => x !== ME && !cr.includes(x) && LS('moi_svip_level_' + x)); if (vip.length) u = pick(vip); }
        if (!u) { const g = D.SPARE.concat(Object.keys(D.USERS)).filter(x => x !== ME && !crowd().includes(x)); u = pick(g); }
        if (!U(u)) return;
        const us = U(u);
        M.rtSet(base() + '/listeners/' + u, { name: us.name, avatar: us.photo, role: 'member', joined: Date.now() });
        M.rtSet(LIVE() + '/roomPresence/' + ROOM + '/' + u, true);
        act({ action: 'join', name: us.name });
        let fx = null;
        try { fx = (window.MOIStore && MOIStore.entryFor(u)) || (window.MOIPerks && (MOIPerks.perksOf(u) || {}).entry) || null; } catch(e){}
        if (fx) rtdb().ref(base() + '/entries').push({ uid: u, name: us.name, photo: us.photo, fx, ts: Date.now() });
    }
    function leave(){
        const a = aud(); if (a.length < Math.max(4, R.aud - 4)) return;
        const u = pick(a).uid; away.push(u);
        M.rtSet(base() + '/listeners/' + u, null); M.rtSet(LIVE() + '/roomPresence/' + ROOM + '/' + u, null); M.rtSet(base() + '/joinedUsers/' + u, null);
    }
    /* — কমেন্ট — */
    function chat(){ const c = crowd(); if (!c.length) return; say(pick(c), pick(D.TEXTS.concat(MORE_TEXT))); }
    /* — ইমোজি: সিটে বসা হলে সিটের উপরে + কমেন্টে; শ্রোতা হলে শুধু কমেন্টে — */
    function emoji(){
        const c = crowd(); if (!c.length) return;
        const uid = pick(c), code = pick(CODES), src = (window.EMOJI_BASE || '') + code + '/512.webp';
        const at = seated().find(x => x.s.uid === uid);
        say(uid, '', { type: 'emoji', img: src });
        if (at && typeof showSeatReaction === 'function') setTimeout(() => showSeatReaction(at.i, code, src), 60);
    }
    /* — গিফট: ছোট / মাঝারি / বড়; আসল sendGift দিয়ে (ব্যালেন্স কাটে, XP/রুম-লেভেল বাড়ে, অ্যানিমেশন চলে) — */
    async function gift(kind){
        const st = seated(); if (!st.length) return;
        const target = pick(st).s.uid, pool = crowd().filter(u => u !== target); if (!pool.length) return;
        const sender = pick(pool);
        const r = Math.random(); kind = kind || (r < 0.55 ? 'small' : r < 0.9 ? 'mid' : 'big');
        const g = pick(GIFTS[kind]), qty = rnd(g[2], g[3]);
        await ensureCash(sender);
        try {
            await asBot(sender, 'sendGift', { roomId: ROOM, giftId: g[0], qty, targets: [target] });
            say(sender, '💎 ' + gname(g[0]) + ' × ' + qty + ' → ' + U(target).name, { type: 'gift', giftMeta: { giftId: g[0], qty, targetUids: [target] } });
            act({ action: 'heart', name: U(target).name, uid: target });
        } catch(e){ console.warn('[world] gift', e); }
    }
    /* — CP জোড়ার একে অপরকে গিফট (CP পয়েন্ট বাড়ে) — */
    async function cpGift(){
        const S = SY(); const cps = (S && S.get('moi_rel_cp', {})) || {}; const here = new Set(crowd());
        const k = Object.keys(cps).find(x => cps[x].bot && here.has(cps[x].a) && here.has(cps[x].b) && Math.random() < 0.6);
        if (!k) return gift('mid');
        const c = cps[k], from = Math.random() < 0.5 ? c.a : c.b, to = from === c.a ? c.b : c.a, g = pick(GIFTS.mid), qty = rnd(g[2], g[3]);
        await ensureCash(from);
        try { await asBot(from, 'sendGift', { roomId: ROOM, giftId: g[0], qty, targets: [to] }); say(from, '💎 ' + gname(g[0]) + ' × ' + qty + ' → ' + U(to).name + ' ❤', { type: 'gift', giftMeta: { giftId: g[0], qty, targetUids: [to] } }); } catch(e){}
    }
    /* — রকেট: গিফটের 💎 জমে ছাড়ে, বাকিরা ধরে — */
    async function rocket(){
        const c = crowd(); if (!c.length) return;
        const who = pick(c); await ensureCash(who);
        try {
            const r = await asBot(who, 'rocketAdd', { roomId: ROOM, amount: rnd(300, 1100) });
            if (r && r.launched){
                const n = rnd(3, 6), others = c.filter(u => u !== who).sort(() => Math.random() - 0.5).slice(0, n);
                others.forEach(u => setTimeout(() => { asBot(u, 'rocketJoin', { roomId: ROOM }).catch(() => {}); }, rnd(800, 8000)));
                asBot(who, 'rocketJoin', { roomId: ROOM }).catch(() => {});
            }
        } catch(e){ console.warn('[world] rocket', e); }
    }
    /* — লাকি বক্স: আসল createLuckyBox, মেয়াদ শেষে বটরা খোলে — */
    async function lucky(){
        const c = crowd(); if (!c.length) return;
        const who = pick(c); await ensureCash(who);
        try {
            const total = pick([200, 300, 500, 800, 1000]), qty = pick([5, 8, 10]), timerMin = pick([1, 3]);
            const r = await asBot(who, 'createLuckyBox', { roomId: ROOM, total, qty, timerMin });
            if (r && r.box) setTimeout(() => asBot(who, 'lbBots', { roomId: ROOM, boxId: r.box.id }).catch(() => {}), Math.max(0, r.box.expiresAt - Date.now()) + 4000);
        } catch(e){ console.warn('[world] lucky', e); }
    }
    /* — সিট বদল: কেউ নামে, কেউ ওঠে, কেউ সিট বদলায় — */
    function seat(){
        const all = seats(), empty = all.map((s, i) => (!s || !s.uid) && !(s && s.locked) ? i : -1).filter(i => i >= 0);
        const st = seated(), r = Math.random();
        if (r < 0.45 && aud().length && empty.length){
            const u = pick(aud()), i = pick(empty), us = U(u.uid);
            M.rtSet(base() + '/seats/' + i, { uid: u.uid, name: us.name, avatar: us.photo, role: 'member', mic: false, locked: false, coins: 0, started: Date.now() });
            act({ action: 'join', name: us.name });
        } else if (r < 0.75 && st.length > 3){
            const x = pick(st.filter(y => y.s.role !== 'owner')); if (!x) return;
            M.rtSet(base() + '/seats/' + x.i, null);
        } else if (st.length && empty.length){
            const x = pick(st.filter(y => y.s.role !== 'owner')); if (!x) return;
            const i = pick(empty); M.rtSet(base() + '/seats/' + x.i, null); M.rtSet(base() + '/seats/' + i, Object.assign({}, x.s, { started: Date.now() }));
        }
    }
    /* — রুম সাজানো: টপিক / ওয়ালপেপার / স্কিন / গান — */
    function room(){
        const st = seated(), adm = st.find(x => x.s.role === 'owner') || pick(st); if (!adm) return;
        const r = Math.random(), who = adm.s.uid;
        if (r < 0.3){ const t = pick(TOPICS); M.rtSet(base() + '/topic', t); say(who, '📝 টপিক বদলানো হলো: ' + t); }
        else if (r < 0.55){ M.rtSet(base() + '/wallpaper', { dataUrl: (location.href.replace(/\/room\/.*$/, '/assets/wp/w') + ('0' + rnd(1, 12)).slice(-2) + '.webp'), ts: Date.now() }); say(who, '🖼 ওয়ালপেপার বদলানো হলো'); }
        else if (r < 0.75){ const id = 'skin' + rnd(1, 4); M.rtSet(base() + '/skin', { id }); const own = {}; own[id] = FAR; rtdb().ref(base() + '/skinOwn/' + id).set(FAR); say(who, '🎨 সিট স্কিন বদলানো হলো'); }
        else { const s = pick(SONGS); M.rtSet(base() + '/musicState', { title: s, by: U(who).name, ts: Date.now(), playing: true }); say(who, '🎵 এখন চলছে: ' + s); }
    }

    /* সময়সূচি (সেকেন্ড) — ঢোকার একটু পরেই কাজ শুরু, যাতে সঙ্গে সঙ্গে জীবন্ত লাগে */
    every(join, 12, 30, 8);
    every(leave, 70, 150, 90);
    every(chat, 7, 18, 5);
    every(emoji, 22, 55, 18);
    every(() => gift(), 14, 40, 10);
    every(cpGift, 60, 130, 50);
    every(rocket, 70, 150, 40);
    every(lucky, 170, 330, 75);
    every(seat, 55, 120, 35);
    every(room, 150, 300, 100);

    window.MOIWorld = { fire(k){ ({ gift, rocket, lucky, join, emoji, seat, room, say: chat, cp: cpGift })[k](); } };
}

/* ════════════ চালু ════════════ */
function boot(){
    const go = () => { try { seedProfiles(); seedRelations(); seedRelLevels(); seedRooms(); } catch(e){ console.warn('[world] seed', e); } try { seedRoomLive(); } catch(e){} };
    let n = 0; const t = setInterval(() => { n++; if (SY() && window.MOIFB && SY().get){ clearInterval(t); go(); } else if (n > 60) clearInterval(t); }, 150);
    if (document.getElementById('seatsGrid')){
        let k = 0;
        const t2 = setInterval(() => {
            k++;
            if (typeof state !== 'undefined' && state && Array.isArray(state.seats) && typeof joined !== 'undefined' && joined && window.MOIEco){ clearInterval(t2); roomWorld(); }
            else if (k > 100) clearInterval(t2);
        }, 250);
    }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
