/* shared/core/economy.js — ডায়মন্ড, গিফট, রোল, কেনাকাটা ইত্যাদি সব কাজ এখন অ্যাপের ভিতরেই চলে
   (Cloud Functions / Blaze প্ল্যান লাগে না)। আগের মতোই MOIEco.call('নাম', ডেটা) দিয়ে ডাকা হয়।
   🔒 LOCK-LATER: অ্যাপ শেষ হলে এই কাজগুলো আবার সার্ভারে (Functions) নিয়ে গিয়ে রুলস কড়া করা হবে। */
console.log('[MOI] economy.js loaded (client mode)');

(function(){
    'use strict';
    const FB = window.MOIFB;
    const LIVE = FB && FB.LIVE;
    const FV = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue : null;

    /* ═══ দাম ও সংখ্যার ছক (functions/catalog.js এর সাথে এক) ═══ */
    const C = {
        GIFTS: { diamond: 5, diamond_v2: 1, diamond_v3: 10, cake: 10, rose: 1, kiss: 1, present: 5, treasure: 15, poop: 2 },
        CHAT_GIFTS: { 10: 10, 50: 50, 100: 100, 500: 500, 1000: 1000 },
        FRAMES: { basic: 0, aurora: 500, flame: 1200, ocean: 2000, royal: 3500, galaxy: 6000 },
        /* Host: মাসের টার্গেট (need = এ মাসে পাওয়া 💎, reward = পূরণ হলে টাকা) ও এক্সচেঞ্জ রেট (১ টাকা = RATE 💎) */
        ROCKET: { TARGET: 1000, DURATION: 10000, RESULT_MS: 8000, KEEP_MS: 40000, WIN_CHANCE: 0.65, CAP_MIN: 5, CAP_MAX: 10, PRIZES: [ { v: 3, w: 50 }, { v: 5, w: 35 }, { v: 10, w: 15 } ] },
        HOST: { RATE: 2, TARGETS: [ { need: 5, reward: 2 }, { need: 20, reward: 8 }, { need: 50, reward: 20 }, { need: 100, reward: 45 }, { need: 150, reward: 100 }, { need: 250, reward: 170 }, { need: 500, reward: 350 }, { need: 1000, reward: 750 }, { need: 2500, reward: 2000 }, { need: 5000, reward: 4500 } ] },
        STORE: { ring_gold: { 7: 100, 30: 1000 }, entry_eyes1: { 7: 200, 30: 1200 }, bubble_vip1: { 7: 100, 30: 500 }, emoji_memes: { 0: 1000 } },   /* দিন 0 = একবার কিনলে সারাজীবন */   /* স্টোরের জিনিস: আইডি → { দিন: ডায়মন্ড } (shared/store/store-data.js এর সাথে একই রাখুন) */
        BADGES: ['official_host', 'top_gifter', 'verified', 'early_bird', 'moderator'],
        CHECKIN: [20, 30, 40, 60, 80, 100, 250],
        SPIN: { segs: [10, 50, 5, 100, 20, 500, 15, 25], weights: { 5: 30, 10: 24, 15: 15, 20: 12, 25: 9, 50: 6, 100: 3, 500: 1 }, cost: 30 },
        INVITE_BONUS: 200, BAG_DAILY: 25, LUCKY_TAX: 0.05,
        MISSIONS: { login: { dia: 20, xp: 10 }, name: { dia: 30, xp: 15 }, details: { dia: 50, xp: 20 }, friend: { dia: 40, xp: 20 }, follow: { dia: 30, xp: 15 }, rich: { dia: 25, xp: 10 } },
        RANK: { developer: 100, superadmin: 90, distributor: 60, admin: 50, vip: 40, user: 10, guest: 0 }
    };
    C.ROLES = Object.keys(C.RANK);
    const levelFromXp = xp => Math.max(1, Math.floor((1 + Math.sqrt(1 + 0.08 * xp)) / 2));
    const dayKey = ms => new Date((ms === undefined ? Date.now() : ms) + 360 * 60000).toISOString().slice(0, 10);   /* ঢাকা সময় */

    /* ═══ বার্তা ═══ */
    const MSG = {
        INSUFFICIENT_DIAMONDS: 'পর্যাপ্ত ডায়মন্ড নেই',
        INSUFFICIENT_MONEY: 'পর্যাপ্ত টাকা নেই',
        ALREADY_CLAIMED: 'আজ নেওয়া হয়ে গেছে',
        GUEST_NOT_ALLOWED: 'গেস্ট এই কাজ করতে পারে না — লগইন করুন',
        PERMISSION_DENIED: 'আপনার এই কাজের অনুমতি নেই',
        NOT_FOUND: 'খুঁজে পাওয়া যায়নি',
        BANNED: 'এই অ্যাকাউন্ট নিষিদ্ধ',
        INVALID: 'ভুল অনুরোধ',
        ALREADY_OWNED: 'এটি আগেই আপনার কাছে আছে',
        NOT_READY: 'এখনও শর্ত পূরণ হয়নি',
        SELF: 'নিজের সাথে এটা করা যাবে না',
        UNAUTHENTICATED: 'আগে লগইন করুন'
    };
    function friendly(e){
        const raw = (e && (e.message || e.code)) || 'ERROR';
        const key = Object.keys(MSG).find(k => String(raw).toUpperCase().indexOf(k) >= 0
            || String((e && e.code) || '').toUpperCase().replace(/[-/]/g, '_').indexOf(k) >= 0);
        const err = new Error(key ? MSG[key] : (/[^\x00-\x7F]/.test(String(raw)) ? String(raw) : 'সমস্যা: ' + raw));
        err.code = key || 'ERROR'; err.userMsg = err.message; return err;
    }
    const fail = (code) => { throw new Error(code); };

    /* ═══ হেল্পার ═══ */
    const db = () => FB.db;
    const uidNow = () => { const u = FB.auth.currentUser; if (!u) fail('UNAUTHENTICATED'); return u.uid; };
    const userRef = uid => db().collection('users').doc(uid);
    const stRef = (uid, name) => db().collection('userState/' + uid + '/items').doc(name);
    const stVal = s => (s.exists && s.data().v) || null;
    const rank = role => C.RANK[role] || 0;
    const isStaff = role => rank(role) >= C.RANK.superadmin;
    const rnd = () => Math.random().toString(36).slice(2, 6);
    const cleanName = s => String(s || '').replace(/[<>]/g, '').trim().slice(0, 24);
    const okUrl = s => /^https:\/\/[^\s]{4,400}$/.test(String(s || '')) ? String(s) : '';

    async function getUserDoc(uid){
        const s = await userRef(uid).get();
        if (!s.exists) fail('NOT_FOUND');
        return s.data();
    }
    function assertActive(u, opt){
        const banned = u.isBanned && (!u.banExpiresAt || (u.banExpiresAt.toMillis ? u.banExpiresAt.toMillis() : +u.banExpiresAt) > Date.now());
        if (banned) fail('BANNED');
        if (!(opt && opt.allowGuest) && (u.role === 'guest' || u.isGuest)) fail('GUEST_NOT_ALLOWED');
    }
    function addTx(t, o){
        const ref = db().collection('transactions').doc();
        t.set(ref, Object.assign({
            type: 'spend', title: '', fromUid: '', toUid: '', amount: 0, priceBDT: 0, commission: 0,
            paymentMethod: '', paymentRef: '', status: 'completed', note: null, createdAt: FV.serverTimestamp()
        }, o, { participants: [o.fromUid, o.toUid].filter(x => x && x !== 'system') }));
    }
    /* ডায়মন্ড/XP বদল একসাথে (লেভেল-আপ বোনাস সহ) */
    function applyDelta(t, uid, user, o){
        const dia = o.dia || 0, xp = o.xp || 0;
        const newXp = (user.xp || 0) + xp;
        const oldLv = user.level || levelFromXp(user.xp || 0);
        const newLv = Math.max(oldLv, levelFromXp(newXp));
        let bonus = 0;
        for (let L = oldLv + 1; L <= newLv; L++) bonus += L * 25;
        const total = dia + bonus;
        const upd = Object.assign({}, o.extra || {});
        if (xp) upd.xp = newXp;
        if (newLv !== oldLv) upd.level = newLv;
        if (total) upd.diamonds = FV.increment(total);
        if (Object.keys(upd).length) t.update(userRef(uid), upd);
        if (dia) addTx(t, { type: o.txType || 'reward', title: o.title || '', fromUid: dia < 0 ? uid : 'system', toUid: dia < 0 ? 'system' : uid, amount: Math.abs(dia) });
        if (bonus) addTx(t, { type: 'reward', title: 'Level ' + newLv + ' bonus', fromUid: 'system', toUid: uid, amount: bonus });
        return { level: newLv, xp: newXp, bonus, diamonds: (user.diamonds || 0) + total };
    }
    async function notify(uid, n){
        try { await FB.rtdb.ref(LIVE + '/notifications/' + uid).push(Object.assign({ read: false, ts: Date.now() }, n)); } catch(e){}
    }
    async function findUser(idOrUid){
        const k = String(idOrUid || '').trim(); if (!k) fail('INVALID');
        if (/^\d{6,}$/.test(k)){
            const m = await db().collection('moiIds').doc(k).get();
            if (m.exists) return m.data().uid;
        }
        const s = await userRef(k).get();
        if (s.exists) return k;
        fail('NOT_FOUND');
    }
    async function mirrorStaff(uid, role){
        const ref = FB.rtdb.ref(LIVE + '/staff/' + uid);
        if (C.RANK[role] >= C.RANK.superadmin) await ref.set(role); else await ref.remove();
    }

    const H = {};

    /* ═══════════ প্রোফাইল তৈরি (লগইনের পর) ═══════════ */
    H.ensureProfile = async (data, uid) => {
        const isGuest = !!FB.auth.currentUser.isAnonymous;
        return db().runTransaction(async t => {
            const ref = userRef(uid);
            const snap = await t.get(ref);
            if (snap.exists) return { created: false };
            const cRef = db().collection('meta').doc('counters');
            const c = await t.get(cRef);
            const next = ((c.exists && c.data().moiId) || 100000) + 1 + Math.floor(Math.random() * 7);
            const moiId = String(next);
            t.set(cRef, { moiId: next }, { merge: true });
            t.set(db().collection('moiIds').doc(moiId), { uid });
            const name = cleanName(data.name) || (isGuest ? 'Guest ' : 'User ') + moiId.slice(-4);
            t.set(ref, {
                uid, moiId, name,
                photo: okUrl(data.photo) || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + encodeURIComponent(uid),
                bio: '', country: '', gender: '', birthday: '', voice: '',
                role: isGuest ? 'guest' : 'user', isGuest,
                badges: [], crown: '', ownedCrowns: [], frame: 'basic',
                diamonds: 0, level: 1, xp: 0, giftsSent: 0, giftsReceived: 0,
                myRoomUid: '', myRoomId: '', distributorId: null,
                isBanned: false, banReason: null, banExpiresAt: null,
                profileComplete: false,
                createdAt: FV.serverTimestamp(), lastSeen: FV.serverTimestamp(), lastActiveRoomId: ''
            });
            return { created: true, moiId };
        });
    };

    /* ═══════════ গিফট ═══════════ */
    async function liveEffects(roomId, sender, targets, gift, qty, unit){
        const base = LIVE + '/rooms/' + roomId;
        const ts = Date.now();
        try {
            await FB.rtdb.ref(base + '/liveGifts').push({ senderUid: sender.uid, targetUids: targets.map(x => x.uid), giftId: gift, qty, ts });
            for (const tg of targets){
                const amount = unit * qty;
                await FB.rtdb.ref(base + '/giftStats/' + tg.uid).update({ uid: tg.uid, name: tg.name || 'User', avatar: tg.photo || '' });
                await FB.rtdb.ref(base + '/giftStats/' + tg.uid + '/history').push({ amount, ts });
            }
            const seats = (await FB.rtdb.ref(base + '/seats').get()).val() || {};
            for (const tg of targets){
                const idx = Object.keys(seats).find(i => seats[i] && seats[i].uid === tg.uid);
                if (idx !== undefined) await FB.rtdb.ref(base + '/seats/' + idx + '/coins').transaction(v => (v || 0) + unit * qty);
            }
            const pk = (await FB.rtdb.ref(base + '/pkState').get()).val();
            if (pk && pk.expiresAt > ts && pk.blue && pk.red){
                for (const tg of targets){
                    const side = pk.blue.uid === tg.uid ? 'blue' : (pk.red.uid === tg.uid ? 'red' : '');
                    if (!side) continue;
                    const amt = unit * qty;
                    await FB.rtdb.ref(base + '/pkState/' + side + '/score').transaction(v => (v || 0) + amt);
                    /* এই PK-তে কে কোন দলকে কত 💎 গিফট দিল — সেরা ৪ জন প্যানেলের নিচে দেখায় */
                    await FB.rtdb.ref(base + '/pkState/' + side + '/supporters/' + sender.uid).transaction(v => ({
                        uid: sender.uid, name: sender.name || 'User', avatar: sender.avatar || '',
                        amount: ((v && v.amount) || 0) + amt
                    }));
                }
            }
        } catch(e){ console.warn('liveEffects', e.message); }
    }
    H.sendGift = async (data, uid) => {
        const roomId = String(data.roomId || ''), giftId = String(data.giftId || '');
        const qty = Math.floor(Number(data.qty));
        const targetUids = [...new Set((data.targets || []).map(String))].slice(0, 10);
        const unit = C.GIFTS[giftId];
        if (!roomId || unit === undefined || !(qty >= 1 && qty <= 9999) || !targetUids.length) fail('INVALID');
        const total = unit * qty * targetUids.length;
        const roomRef = db().collection('rooms').doc(roomId);
        const res = await db().runTransaction(async t => {
            const sSnap = await t.get(userRef(uid));
            const room = await t.get(roomRef);
            const tSnaps = await Promise.all(targetUids.map(x => t.get(userRef(x))));
            /* Host টার্গেটের হিসাব — গিফটের একই লেনদেনে (সব রিড আগে, তারপর লেখা) */
            const hSnaps = await Promise.all(targetUids.map(x => t.get(stRef(x, 'host'))));
            if (!sSnap.exists) fail('NOT_FOUND');
            const s = sSnap.data(); assertActive(s);
            if (tSnaps.some(x => !x.exists)) fail('NOT_FOUND');
            if ((s.diamonds || 0) < total) fail('INSUFFICIENT_DIAMONDS');
            const r = applyDelta(t, uid, s, { dia: -total, xp: Math.floor(total / 2), extra: { giftsSent: FV.increment(total) }, title: 'Gift: ' + giftId + ' ×' + qty, txType: 'gift' });
            tSnaps.forEach(x => t.update(x.ref, { giftsReceived: FV.increment(unit * qty) }));
            if (room.exists) t.update(roomRef, { points: FV.increment(total) });   /* রুমের ডক না থাকলেও গিফট আটকাবে না */
            targetUids.forEach((tu, i) => {
                const hv = hostNorm(hSnaps[i].exists && hSnaps[i].data().v);
                hv.dia += unit * qty;
                C.HOST.TARGETS.forEach((tg, k) => {
                    if (hv.dia >= tg.need && hv.claimed.indexOf(k) < 0){ hv.claimed.push(k); hv.money += tg.reward; hostRec(hv, { type: 'target', n: k + 1, need: tg.need, money: tg.reward }); }
                });
                t.set(stRef(tu, 'host'), { v: hv });
            });
            targetUids.forEach((tu, i) => t.set(db().collection('gifts').doc(), {
                senderUid: uid, senderName: s.name, targetUid: tu, targetName: tSnaps[i].data().name || '', roomId,
                giftId, giftName: giftId, qty, unitPrice: unit, totalAmount: unit * qty, isCrown: false, crownId: null, type: 'gift', createdAt: FV.serverTimestamp()
            }));
            return { sender: s, targets: tSnaps.map(x => x.data()), balance: r.diamonds };
        });
        await liveEffects(roomId, { uid, name: res.sender.name, avatar: res.sender.photo || '' }, res.targets, giftId, qty, unit);
        /* প্রোফাইলের Supporters / Contribution — যে যত 💎 গিফট দিল, প্রাপকের তালিকায় যোগ হয় */
        try {
            const sp = res.sender || {};
            await Promise.all(targetUids.map(tu => FB.rtdb.ref(LIVE + '/supporters/' + tu + '/' + uid).transaction(v => {
                v = v || { amount: 0 }; v.amount = (v.amount || 0) + unit * qty; v.name = sp.name || 'User'; v.photo = sp.photo || ''; return v;
            })));
        } catch(e){}
        /* ফ্রেন্ডশিপ (দুই দিকের মোট 💎) আর Supporters (কে কাকে কত দিয়েছে) — রুমের নতুন ফিচারের জন্য */
        try {
            const SS = window.MOISync;
            if (SS){
                const fk = 'moi_friend_' + roomId, sk = 'moi_supp_' + roomId;
                const fd = SS.get(fk, {}) || {}, sd = SS.get(sk, {}) || {};
                targetUids.forEach(tu => {
                    const pk = uid < tu ? uid + '|' + tu : tu + '|' + uid;
                    fd[pk] = (fd[pk] || 0) + unit * qty;
                    sd[tu] = sd[tu] || {}; sd[tu][uid] = (sd[tu][uid] || 0) + unit * qty;
                });
                SS.set(fk, fd); SS.set(sk, sd);
            }
        } catch(e){}
        const names = res.targets.length === 1 ? res.targets[0].name : res.targets.length + ' জন';
        const id = 'g_' + Date.now() + '_' + rnd();
        await roomRef.collection('messages').doc(id).set({
            id, type: 'gift', uid, senderUid: uid, name: res.sender.name, senderName: res.sender.name, avatar: res.sender.photo || '',
            text: '💎 ' + (data.giftName || giftId) + ' × ' + qty + ' → ' + names, giftMeta: { giftId, qty, targetUids }, ts: Date.now(), createdAt: FV.serverTimestamp()
        }).catch(() => {});
        return { ok: true, total, balance: res.balance };
    };
    H.sendChatGift = async (data, uid) => {
        const to = String(data.toUid || ''), amount = Math.floor(Number(data.amount));
        if (!to || to === uid) fail('SELF');
        if (!C.CHAT_GIFTS[amount]) fail('INVALID');
        const r = await db().runTransaction(async t => {
            const sSnap = await t.get(userRef(uid)), tSnap = await t.get(userRef(to));
            if (!sSnap.exists || !tSnap.exists) fail('NOT_FOUND');
            const s = sSnap.data(); assertActive(s);
            if ((s.diamonds || 0) < amount) fail('INSUFFICIENT_DIAMONDS');
            const rr = applyDelta(t, uid, s, { dia: -amount, xp: Math.floor(amount / 5), extra: { giftsSent: FV.increment(amount) }, title: 'Chat gift to ' + (tSnap.data().name || ''), txType: 'gift' });
            t.update(tSnap.ref, { giftsReceived: FV.increment(amount) });
            t.set(db().collection('gifts').doc(), { senderUid: uid, senderName: s.name, targetUid: to, targetName: tSnap.data().name || '', roomId: '', giftId: 'chat_' + amount, giftName: 'Chat gift', qty: 1, unitPrice: amount, totalAmount: amount, isCrown: false, crownId: null, type: 'gift', createdAt: FV.serverTimestamp() });
            return { ok: true, balance: rr.diamonds, toName: tSnap.data().name || '' };
        });
        await hostCredit(to, amount);
        await notify(to, { icon: '🎁', title: 'আপনি একটি উপহার পেয়েছেন', text: amount + ' 💎 মূল্যের উপহার' });
        const chatId = [uid, to].sort().join('__'), id = 'g_' + Date.now() + '_' + rnd();
        await db().collection('chats').doc(chatId).set({ participants: chatId.split('__'), updatedAt: FV.serverTimestamp() }, { merge: true });
        await db().collection('chats/' + chatId + '/messages').doc(id).set({ id, type: 'gift', content: '🎁 ' + amount + ' 💎', amount, senderUid: uid, senderName: '', time: '', ts: Date.now(), delivered: true, createdAt: FV.serverTimestamp() });
        return r;
    };

    /* ═══════════ Check-in, Spin, মিশন, ব্যাগ, ইনভাইট ═══════════ */
    H.claimCheckin = async (data, uid) => db().runTransaction(async t => {
        const uS = await t.get(userRef(uid)); if (!uS.exists) fail('NOT_FOUND');
        const u = uS.data(); assertActive(u);
        const cS = await t.get(stRef(uid, 'checkin'));
        const cur = stVal(cS) || { last: '', streak: 0 };
        const today = dayKey(), yest = dayKey(Date.now() - 86400000);
        if (cur.last === today) fail('ALREADY_CLAIMED');
        const streak = (cur.last === yest ? cur.streak : 0) + 1;
        const reward = C.CHECKIN[(streak - 1) % 7];
        t.set(stRef(uid, 'checkin'), { v: { last: today, streak } });
        const r = applyDelta(t, uid, u, { dia: reward, xp: 20, title: 'Daily check-in' });
        return { reward, streak, balance: r.diamonds };
    });
    function pickPrize(){
        const { weights, segs } = C.SPIN;
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        for (const v of segs){ r -= weights[v]; if (r <= 0) return v; }
        return 10;
    }
    H.doSpin = async (data, uid) => db().runTransaction(async t => {
        const uS = await t.get(userRef(uid)); if (!uS.exists) fail('NOT_FOUND');
        const u = uS.data(); assertActive(u);
        const sS = await t.get(stRef(uid, 'spin'));
        const today = dayKey();
        const free = (stVal(sS) || {}).last !== today;
        if (!free && (u.diamonds || 0) < C.SPIN.cost) fail('INSUFFICIENT_DIAMONDS');
        const prize = pickPrize();
        if (free) t.set(stRef(uid, 'spin'), { v: { last: today } });
        const r = applyDelta(t, uid, u, { dia: prize - (free ? 0 : C.SPIN.cost), xp: 5, title: free ? 'Lucky Spin (free)' : 'Lucky Spin' });
        return { prize, free, balance: r.diamonds };
    });
    async function missionOk(id, uid, u){
        const cnt = async p => (await db().collection(p).limit(1).get()).size;
        switch (id){
            case 'login': return true;
            case 'name': return !!(u.bio && u.bio.trim());
            case 'details': return !!(u.gender && u.birthday && u.country);
            case 'friend': return (await cnt('friends/' + uid + '/list')) > 0;
            case 'follow': return (await cnt('follows/' + uid + '/following')) > 0;
            case 'rich': return (u.diamonds || 0) >= 1000;
            default: return false;
        }
    }
    H.claimMission = async (data, uid) => {
        const id = String(data.id || ''), m = C.MISSIONS[id];
        if (!m) fail('INVALID');
        const name = 'missions_' + dayKey();
        const pre = await userRef(uid).get(); if (!pre.exists) fail('NOT_FOUND');
        if (!(await missionOk(id, uid, pre.data()))) fail('NOT_READY');
        return db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); const u = uS.data(); assertActive(u);
            const mS = await t.get(stRef(uid, name));
            const done = stVal(mS) || {};
            if (done[id]) fail('ALREADY_CLAIMED');
            done[id] = true;
            t.set(stRef(uid, name), { v: done });
            const r = applyDelta(t, uid, u, { dia: m.dia, xp: m.xp, title: 'Mission: ' + id });
            return { dia: m.dia, balance: r.diamonds };
        });
    };
    H.claimBagDaily = async (data, uid) => db().runTransaction(async t => {
        const uS = await t.get(userRef(uid)); const u = uS.data(); assertActive(u);
        const bS = await t.get(stRef(uid, 'bag_daily'));
        const today = dayKey();
        if ((stVal(bS) || {}).last === today) fail('ALREADY_CLAIMED');
        t.set(stRef(uid, 'bag_daily'), { v: { last: today } });
        const r = applyDelta(t, uid, u, { dia: C.BAG_DAILY, title: 'Daily bag reward' });
        return { dia: C.BAG_DAILY, balance: r.diamonds };
    });
    H.redeemInvite = async (data, uid) => {
        const code = String(data.code || '').replace(/\D/g, '');
        if (code.length < 4) fail('INVALID');
        const idSnap = await db().collection('moiIds').doc(code).get();
        if (!idSnap.exists) fail('NOT_FOUND');
        const ownerUid = idSnap.data().uid;
        if (ownerUid === uid) fail('SELF');
        return db().runTransaction(async t => {
            const mS = await t.get(userRef(uid)), oS = await t.get(userRef(ownerUid));
            const rS = await t.get(stRef(uid, 'redeemed')), iS = await t.get(stRef(ownerUid, 'invited'));
            if (!mS.exists || !oS.exists) fail('NOT_FOUND');
            const me = mS.data(); assertActive(me);
            if (stVal(rS)) fail('ALREADY_CLAIMED');
            t.set(stRef(uid, 'redeemed'), { v: oS.data().name || 'User' });
            const inv = stVal(iS) || []; inv.push(uid);
            t.set(stRef(ownerUid, 'invited'), { v: inv.slice(-200) });
            const r = applyDelta(t, uid, me, { dia: C.INVITE_BONUS, xp: 10, title: 'Invite bonus' });
            applyDelta(t, ownerUid, oS.data(), { dia: C.INVITE_BONUS, xp: 10, title: 'Invite bonus (friend joined)' });
            return { bonus: C.INVITE_BONUS, owner: oS.data().name || 'User', balance: r.diamonds };
        });
    };

    /* ═══════════ লাকি বক্স ═══════════ */
    async function isRoomStaff(roomId, uid){
        const r = await db().collection('rooms').doc(roomId).get();
        if (!r.exists) return false;
        const d = r.data();
        return d.ownerUid === uid || (d.admins || []).includes(uid);
    }
    H.createLuckyBox = async (data, uid) => {
        const roomId = String(data.roomId || ''), total = Math.floor(Number(data.total)), qty = Math.floor(Number(data.qty)), timer = Math.floor(Number(data.timerMin));
        if (!roomId || !(total >= 10 && total <= 1000000) || !(qty >= 1 && qty <= 100) || ![0, 1, 3, 5, 10].includes(timer)) fail('INVALID');
        const tax = Math.floor(total * C.LUCKY_TAX), pool = total - tax;
        const box = await db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); const u = uS.data(); assertActive(u);
            if ((u.diamonds || 0) < total) fail('INSUFFICIENT_DIAMONDS');
            applyDelta(t, uid, u, { dia: -total, title: 'Lucky box', txType: 'spend' });
            return { id: 'lb_' + Date.now() + '_' + rnd(), senderUid: uid, senderName: u.name, senderAvatar: u.photo || '', total, tax, pool, qty, timerMin: timer, startedAt: Date.now(), expiresAt: Date.now() + timer * 60000, createdAt: Date.now() };
        });
        await FB.rtdb.ref(LIVE + '/rooms/' + roomId + '/luckybox/' + box.id).set(box);
        return { ok: true, box };
    };
    H.openLuckyBox = async (data, uid) => {
        const roomId = String(data.roomId || ''), boxId = String(data.boxId || '');
        if (!roomId || !boxId) fail('INVALID');
        const u0 = await userRef(uid).get(); if (!u0.exists) fail('NOT_FOUND'); assertActive(u0.data());
        const ref = FB.rtdb.ref(LIVE + '/rooms/' + roomId + '/luckybox/' + boxId);
        let won = 0;
        const tr = await ref.transaction(box => {
            if (!box) return box;
            box.claimedBy = box.claimedBy ? Object.values(box.claimedBy) : [];
            box.winners = box.winners ? Object.values(box.winners) : [];
            if (Date.now() < box.expiresAt || Date.now() > box.expiresAt + 120000 || box.claimedBy.includes(uid) || box.winners.length >= box.qty || box.senderUid === uid) return undefined;
            box.claimedBy.push(uid);
            const given = box.winners.reduce((s, w) => s + w.amount, 0), left = box.pool - given;
            const slotsLeft = box.qty - box.winners.length;
            let amount = 0;
            if (Math.random() < 0.65 || slotsLeft === 1){
                const min = Math.max(1, Math.floor(box.pool / (box.qty * 3))), max = Math.max(min + 1, Math.floor(box.pool / 2));
                amount = Math.min(left, Math.floor(Math.random() * (max - min + 1)) + min);
                if (slotsLeft === 1) amount = left;
            }
            won = amount;
            if (amount > 0) box.winners.push({ uid, name: '', avatar: '', amount, ts: Date.now() });
            return box;
        });
        if (!tr.committed || !tr.snapshot.val()) fail('NOT_READY');
        if (won > 0){
            await db().runTransaction(async t => {
                const uS = await t.get(userRef(uid));
                applyDelta(t, uid, uS.data(), { dia: won, title: 'Lucky box win' });
            });
            const meDoc = (await userRef(uid).get()).data();
            const snap = (await ref.get()).val() || {};
            const wm = snap.winners || {};
            const key = Object.keys(wm).find(k => wm[k] && wm[k].uid === uid);
            if (key !== undefined) await ref.child('winners').child(key).update({ name: meDoc.name || 'User', avatar: meDoc.photo || '' });
        }
        return { won };
    };

    /* ═══════════ রোল, ব্যান, ডায়মন্ড, ব্যাজ, মুকুট (Developer / Seller) ═══════════ */
    H.setRole = async (data, uid) => {
        const target = await findUser(data.target), role = String(data.role || '');
        if (!C.ROLES.includes(role) || role === 'developer' || role === 'guest') fail('INVALID');
        const me = await getUserDoc(uid); assertActive(me);
        const myRole = me.role;
        if (myRole !== 'developer' && myRole !== 'superadmin') fail('PERMISSION_DENIED');
        const tu = await getUserDoc(target);
        if (tu.role === 'developer') fail('PERMISSION_DENIED');
        if (myRole === 'superadmin'){
            if (!['admin', 'vip', 'user'].includes(role) || rank(tu.role) >= C.RANK.superadmin || tu.role === 'distributor') fail('PERMISSION_DENIED');
        }
        if (tu.isGuest && role !== 'user') fail('GUEST_NOT_ALLOWED');
        await userRef(target).update({ role, isGuest: false });
        await mirrorStaff(target, role);
        await notify(target, { icon: '🛡️', title: 'আপনার রোল বদলেছে', text: 'নতুন রোল: ' + role });
        return { ok: true, role };
    };
    H.banUser = async (data, uid) => {
        const target = await findUser(data.target), hours = Math.max(0, Math.floor(Number(data.hours) || 0));
        const me = await getUserDoc(uid); assertActive(me);
        if (!['developer', 'superadmin'].includes(me.role)) fail('PERMISSION_DENIED');
        const tu = await getUserDoc(target);
        if (target === uid || tu.role === 'developer' || (me.role === 'superadmin' && rank(tu.role) >= C.RANK.superadmin)) fail('PERMISSION_DENIED');
        await userRef(target).update({ isBanned: true, banReason: String(data.reason || '').slice(0, 200), banExpiresAt: hours ? new Date(Date.now() + hours * 3600000) : null });
        return { ok: true };
    };
    H.unbanUser = async (data, uid) => {
        const target = await findUser(data.target);
        const me = await getUserDoc(uid); assertActive(me);
        if (!['developer', 'superadmin'].includes(me.role)) fail('PERMISSION_DENIED');
        await userRef(target).update({ isBanned: false, banReason: null, banExpiresAt: null });
        return { ok: true };
    };
    H.adminAddDiamonds = async (data, uid) => {
        const target = await findUser(data.target), amount = Math.floor(Number(data.amount));
        if (!(Math.abs(amount) >= 1 && Math.abs(amount) <= 100000000)) fail('INVALID');
        const me = await getUserDoc(uid); assertActive(me);
        if (me.role !== 'developer') fail('PERMISSION_DENIED');
        return db().runTransaction(async t => {
            const tS = await t.get(userRef(target)); if (!tS.exists) fail('NOT_FOUND');
            const bal = tS.data().diamonds || 0;
            if (amount < 0 && bal + amount < 0) fail('INSUFFICIENT_DIAMONDS');
            t.update(tS.ref, { diamonds: FV.increment(amount) });
            addTx(t, { type: amount > 0 ? 'reward' : 'refund', title: String(data.note || 'Admin adjustment').slice(0, 80), fromUid: amount > 0 ? 'system' : target, toUid: amount > 0 ? target : 'system', amount: Math.abs(amount), note: 'by ' + uid });
            return { ok: true, balance: bal + amount };
        });
    };
    /* সেলার বিক্রি: সেলারের নিজের ডায়মন্ড কমে, ক্রেতার বাড়ে (Developer এর কমে না) */
    H.distributorTransfer = async (data, uid) => {
        const target = await findUser(data.target), amount = Math.floor(Number(data.amount));
        if (!(amount >= 1 && amount <= 10000000) || target === uid) fail('INVALID');
        const me = await getUserDoc(uid); assertActive(me);
        if (!['developer', 'distributor'].includes(me.role)) fail('PERMISSION_DENIED');
        const priceBDT = Math.max(0, Math.floor(Number(data.priceBDT) || 0));
        const r = await db().runTransaction(async t => {
            const mS = await t.get(userRef(uid)), tS = await t.get(userRef(target));
            if (!tS.exists) fail('NOT_FOUND');
            const buyer = tS.data(); assertActive(buyer);
            if (me.role === 'distributor' && (mS.data().diamonds || 0) < amount) fail('INSUFFICIENT_DIAMONDS');
            if (me.role === 'distributor') t.update(mS.ref, { diamonds: FV.increment(-amount) });
            t.update(tS.ref, { diamonds: FV.increment(amount) });
            addTx(t, { type: 'sell', title: 'Diamond purchase', fromUid: uid, toUid: target, amount, priceBDT, paymentMethod: String(data.method || 'cash').slice(0, 20), paymentRef: String(data.ref || '').slice(0, 60) });
            return { ok: true, toName: buyer.name };
        });
        await notify(target, { icon: '💎', title: 'ডায়মন্ড যোগ হয়েছে', text: amount + ' 💎 পেয়েছেন' });
        return r;
    };
    H.grantBadge = async (data, uid) => {
        const target = await findUser(data.target), badge = String(data.badge || ''), on = data.on !== false;
        if (!C.BADGES.includes(badge)) fail('INVALID');
        const me = await getUserDoc(uid); if (me.role !== 'developer') fail('PERMISSION_DENIED');
        await userRef(target).update({ badges: on ? FV.arrayUnion(badge) : FV.arrayRemove(badge) });
        return { ok: true };
    };
    H.lookupUser = async (data, uid) => {
        const me = await getUserDoc(uid);
        if (rank(me.role) < C.RANK.distributor) fail('PERMISSION_DENIED');
        const target = await findUser(data.target);
        const u = await getUserDoc(target);
        return { uid: target, name: u.name, photo: u.photo, moiId: u.moiId, role: u.role, diamonds: u.diamonds || 0, level: u.level || 1, isBanned: !!u.isBanned, badges: u.badges || [], ownedCrowns: u.ownedCrowns || [], country: u.country || '' };
    };

    /* ═══════════ রুম ═══════════ */
    H.createRoom = async (data, uid) => {
        const name = String(data.name || '').replace(/[<>]/g, '').trim().slice(0, 30);
        if (name.length < 2) fail('INVALID');
        const me = await getUserDoc(uid); assertActive(me);
        if (me.myRoomUid) fail('ALREADY_OWNED');
        let id = '';
        for (let i = 0; i < 30; i++){
            const c = String(Math.floor(100000 + Math.random() * 900000));
            if (!(await db().collection('rooms').doc(c).get()).exists){ id = c; break; }
        }
        if (!id) fail('ERROR');
        const logo = /^https:\/\//.test(String(data.logo || '')) ? String(data.logo) : '';
        await db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); if (uS.data().myRoomUid) fail('ALREADY_OWNED');
            t.set(db().collection('rooms').doc(id), {
                id, name, logo, wallpaper: '', country: String(data.country || 'Unknown').slice(0, 30), language: 'bn',
                ownerUid: uid, ownerName: me.name, ownerAvatar: me.photo || '', owner: { uid, name: me.name, avatar: me.photo || '' },
                admins: [], isLive: true, micSeatCount: 10, topic: '🎧FM 📻➡️SP ✨🎤Room 🎵', tags: [], category: 'chat',
                level: 1, points: 0, pkActive: false, pkId: null, rules: [], createdAt: FV.serverTimestamp(), updatedAt: FV.serverTimestamp()
            });
            t.update(userRef(uid), { myRoomUid: id, myRoomId: id });
        });
        await FB.rtdb.ref(LIVE + '/roomMeta/' + id).set({ owner: uid });
        return { ok: true, id };
    };
    H.deleteRoom = async (data, uid) => {
        const id = String(data.id || ''); const r = await db().collection('rooms').doc(id).get();
        if (!r.exists) fail('NOT_FOUND');
        const me = await getUserDoc(uid);
        if (r.data().ownerUid !== uid && !isStaff(me.role)) fail('PERMISSION_DENIED');
        await db().collection('rooms').doc(id).delete();
        await userRef(r.data().ownerUid).update({ myRoomUid: '', myRoomId: '' }).catch(() => {});
        await FB.rtdb.ref(LIVE + '/rooms/' + id).remove(); await FB.rtdb.ref(LIVE + '/roomMeta/' + id).remove();
        return { ok: true };
    };
    H.setRoomAdmin = async (data, uid) => {
        const id = String(data.roomId || ''), target = String(data.uid || ''), on = data.on !== false;
        const rRef = db().collection('rooms').doc(id); const r = await rRef.get();
        if (!r.exists || !target) fail('NOT_FOUND');
        const me = await getUserDoc(uid); assertActive(me);
        if (r.data().ownerUid !== uid && !isStaff(me.role)) fail('PERMISSION_DENIED');
        if (target === r.data().ownerUid) fail('SELF');
        await rRef.update({ admins: on ? FV.arrayUnion(target) : FV.arrayRemove(target) });
        await FB.rtdb.ref(LIVE + '/roomMeta/' + id + '/admins/' + target).set(on ? true : null);
        return { ok: true };
    };

    /* ═══════════ স্টোর: ফ্রেম ও মুকুট ═══════════ */
    H.buyFrame = async (data, uid) => {
        const id = String(data.id || ''), price = C.FRAMES[id];
        if (price === undefined) fail('INVALID');
        return db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); if (!uS.exists) fail('NOT_FOUND');
            const u = uS.data(); assertActive(u);
            const fS = await t.get(stRef(uid, 'frames'));
            const fs = (fS.exists && fS.data().v) || { owned: ['basic'], equipped: 'basic' };
            let bought = false;
            if (!fs.owned.includes(id)){
                if ((u.diamonds || 0) < price) fail('INSUFFICIENT_DIAMONDS');
                fs.owned.push(id); bought = true;
            }
            fs.equipped = id;
            t.set(stRef(uid, 'frames'), { v: fs });
            let balance = u.diamonds || 0;
            if (bought) balance = applyDelta(t, uid, u, { dia: -price, xp: 10, extra: { frame: id }, title: 'Store: ' + id + ' frame', txType: 'spend' }).diamonds;
            else t.update(userRef(uid), { frame: id });
            return { bought, balance, state: fs };
        });
    };



    /* ═══════════ স্টোর: রিং/এন্ট্রি ইত্যাদি (দিন ধরে কেনা) ═══════════
       data = { id, days } — ডায়মন্ড কাটে, মেয়াদ বাড়ে (মেয়াদ থাকতে আবার কিনলে আগের শেষ থেকে যোগ হয়) */
    H.buyStoreItem = async (data, uid) => {
        const id = String(data.id || ''), days = Number(data.days), price = C.STORE[id] && C.STORE[id][days];
        if (price === undefined) fail('INVALID');
        return db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); if (!uS.exists) fail('NOT_FOUND');
            const u = uS.data(); assertActive(u);
            const sS = await t.get(stRef(uid, 'store'));
            const st = (sS.exists && sS.data().v) || { owned: {} };
            if ((u.diamonds || 0) < price) fail('INSUFFICIENT_DIAMONDS');
            const now = Date.now(), cur = st.owned[id] > now ? st.owned[id] : now;
            st.owned[id] = cur + (days || 36500) * 86400000;
            t.set(stRef(uid, 'store'), { v: st });
            const balance = applyDelta(t, uid, u, { dia: -price, xp: 5, title: 'Store: ' + id + ' · ' + days + ' days', txType: 'spend' }).diamonds;
            return { ok: true, balance, until: st.owned[id], price };
        });
    };


    /* ═══════════ Host: মাসের টার্গেট, টাকা, এক্সচেঞ্জ, সেল, রেকর্ড ═══════════
       userState/<uid>/items/host = { v:{ month, dia, claimed:[টার্গেট নম্বর], money, rec:[…] } }
       dia = এ মাসে গিফটে পাওয়া 💎 (মাস বদলালে 0 থেকে শুরু), money = জমা টাকা (মাস বদলালেও থাকে) */
    const monthKey = () => { const d = new Date(); return d.getUTCFullYear() * 100 + d.getUTCMonth() + 1; };
    const hostNorm = v => { v = v || {}; const m = monthKey(); if (v.month !== m){ v.month = m; v.dia = 0; v.claimed = []; } v.dia = v.dia || 0; v.claimed = v.claimed || []; v.money = v.money || 0; v.rec = v.rec || []; return v; };
    const hostRec = (v, r) => { v.rec.unshift(Object.assign({ ts: Date.now() }, r)); if (v.rec.length > 100) v.rec.length = 100; };
    /* গিফটে 💎 পেলে প্রাপকের টার্গেট এগোয়; নতুন পূরণ হওয়া টার্গেটের টাকা জমা হয় */
    async function hostCredit(uid, amount){
        amount = Math.floor(Number(amount)); if (!uid || !(amount > 0)) return;
        for (let tryN = 0; tryN < 3; tryN++) try {
            await db().runTransaction(async t => {
                const sS = await t.get(stRef(uid, 'host'));
                const v = hostNorm(sS.exists && sS.data().v);
                v.dia += amount;
                C.HOST.TARGETS.forEach((tg, i) => {
                    if (v.dia >= tg.need && v.claimed.indexOf(i) < 0){ v.claimed.push(i); v.money += tg.reward; hostRec(v, { type: 'target', n: i + 1, need: tg.need, money: tg.reward }); }
                });
                t.set(stRef(uid, 'host'), { v });
            });
            return;
        } catch(e){ console.warn('hostCredit', tryN, e.message); await new Promise(r => setTimeout(r, 150)); }
    }
    H.hostState = async (data, uid) => {
        const sS = await stRef(uid, 'host').get();
        const v = hostNorm(sS.exists && sS.data().v);
        return { month: v.month, dia: v.dia, claimed: v.claimed, money: v.money, rec: v.rec, targets: C.HOST.TARGETS, rate: C.HOST.RATE };
    };
    /* টাকা ভাঙিয়ে 💎 কেনা (১ টাকা = RATE 💎) */
    H.hostExchange = async (data, uid) => {
        const money = Math.floor(Number(data.money));
        if (!(money >= 1) || money > 1000000) fail('INVALID');
        return db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); if (!uS.exists) fail('NOT_FOUND');
            const u = uS.data(); assertActive(u);
            const sS = await t.get(stRef(uid, 'host'));
            const v = hostNorm(sS.exists && sS.data().v);
            if (v.money < money) fail('INSUFFICIENT_MONEY');
            const dia = money * C.HOST.RATE;
            v.money -= money; hostRec(v, { type: 'exchange', money, dia });
            t.set(stRef(uid, 'host'), { v });
            const balance = applyDelta(t, uid, u, { dia, title: 'Exchange: ' + money + ' money', txType: 'reward' }).diamonds;
            return { ok: true, money: v.money, dia, balance };
        });
    };
    /* সেলারকে টাকা সেল করা (টাকা কাটে, রেকর্ড থাকে; সেলার পায় এই টাকার নগদ লেনদেন বাইরে হয়) */
    H.hostSell = async (data, uid) => {
        const money = Math.floor(Number(data.money)), sid = String(data.sellerId || '').slice(0, 40), name = cleanName(data.sellerName);
        if (!(money >= 1) || money > 1000000 || !sid) fail('INVALID');
        return db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); if (!uS.exists) fail('NOT_FOUND');
            assertActive(uS.data());
            const sS = await t.get(stRef(uid, 'host'));
            const v = hostNorm(sS.exists && sS.data().v);
            if (v.money < money) fail('INSUFFICIENT_MONEY');
            v.money -= money; hostRec(v, { type: 'sell', money, to: name || sid, toId: sid });
            t.set(stRef(uid, 'host'), { v });
            return { ok: true, money: v.money };
        });
    };

    /* ═══════════ রুম রকেট ═══════════
       ১) যেকোনো রুমে (যে-ই গিফট করুক) গিফটের 💎 জমে; মোট C.ROCKET.TARGET হলে রকেট ছাড়ে, জমা আবার ০ থেকে শুরু (বাড়তি থাকলে সেটুকু রাখে)।
       ২) রকেট ১০ সেকেন্ড রুমে থাকে। এর মধ্যে যে চাপে সে শুধু নাম লেখায় (rocketJoin) — তখন কিছু দেখানো হয় না।
       ৩) সময় শেষ হলে rocketSettle: যারা নাম লিখিয়েছে তাদের মধ্যে থেকে ৫–১০ জন (প্রতি রকেটে আলাদা) 3/5/10 💎 পায়, বাকিরা কিছু পায় না। ফলাফল সবাই দেখে।
       ডেটা: rockets/<roomId> = { v:{ prog, launch:{ id,t0,t1,cap,by,joined:{uid:{name,avatar}},result:{winners:[{uid,name,avatar,amt}]} } } }
       লাইভে এই চারটা হ্যান্ডলার functions/-এও লাগবে; rocketAdd-এর কাজ sendGift-এর ভিতরেই করা ভালো, আর rocketSettle শুধু সার্ভারই চালাবে (জালিয়াতি ঠেকাতে)। */
    const rkRef = roomId => db().collection('rockets').doc(roomId);
    const rkId = d => { const r = String((d && d.roomId) || '').slice(0, 60); if (!r) fail('INVALID'); return r; };
    function rkNorm(doc, now){
        const v = Object.assign({ prog: 0, launch: null }, (doc && doc.v) || {});
        if (v.launch && now > v.launch.t1 + C.ROCKET.KEEP_MS) v.launch = null;
        return v;
    }
    function rkOut(v, uid){
        const L = v.launch; let launch = null;
        if (L){
            const joined = !!(L.joined && L.joined[uid]);
            let result = null;
            if (L.result){
                const mine = (L.result.winners.find(w => w.uid === uid) || {}).amt;
                result = { winners: L.result.winners.map(w => ({ name: w.name, avatar: w.avatar, amt: w.amt })), mine: mine != null ? mine : (joined ? 0 : null) };
            }
            launch = { id: L.id, t0: L.t0, t1: L.t1, by: L.by, joined, result };
        }
        return { prog: v.prog, target: C.ROCKET.TARGET, now: Date.now(), launch };
    }
    H.rocketState = async (data, uid) => {
        const s = await rkRef(rkId(data)).get();
        return rkOut(rkNorm(s.exists && s.data(), Date.now()), uid);
    };
    H.rocketAdd = async (data, uid) => {
        const roomId = rkId(data), amount = Math.floor(Number(data.amount));
        if (!(amount >= 1) || amount > 10000000) fail('INVALID');
        return db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); if (!uS.exists) fail('NOT_FOUND');
            const u = uS.data(); assertActive(u);
            const s = await t.get(rkRef(roomId)); const now = Date.now();
            const v = rkNorm(s.exists && s.data(), now), R = C.ROCKET;
            const busy = v.launch && now <= v.launch.t1 + R.RESULT_MS;
            let launched = false;
            v.prog += amount;
            if (v.prog >= R.TARGET){
                if (!busy){
                    v.launch = { id: now.toString(36) + rnd(), t0: now, t1: now + R.DURATION, joined: {},
                        cap: R.CAP_MIN + Math.floor(Math.random() * (R.CAP_MAX - R.CAP_MIN + 1)),
                        by: { uid, name: cleanName(u.name || u.displayName || 'User'), avatar: String(u.avatar || u.photo || '').slice(0, 400) } };
                    v.prog = v.prog % R.TARGET; launched = true;
                } else v.prog = R.TARGET - 1;
            }
            t.set(rkRef(roomId), { v });
            return Object.assign(rkOut(v, uid), { launched });
        });
    };
    H.rocketJoin = async (data, uid) => {
        const roomId = rkId(data);
        return db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); if (!uS.exists) fail('NOT_FOUND');
            const u = uS.data(); assertActive(u);
            const s = await t.get(rkRef(roomId)); const now = Date.now();
            const v = rkNorm(s.exists && s.data(), now), L = v.launch;
            if (!L || now > L.t1) fail('NOT_READY');
            L.joined = L.joined || {};
            if (!L.joined[uid]){
                L.joined[uid] = { name: cleanName(u.name || u.displayName || 'User'), avatar: String(u.avatar || u.photo || '').slice(0, 400) };
                t.set(rkRef(roomId), { v });
            }
            return { ok: true };
        });
    };
    H.rocketSettle = async (data, uid) => {
        const roomId = rkId(data);
        return db().runTransaction(async t => {
            const s = await t.get(rkRef(roomId)); const now = Date.now();
            const v = rkNorm(s.exists && s.data(), now), L = v.launch, R = C.ROCKET;
            if (!L || now < L.t1) fail('NOT_READY');
            if (L.result) return rkOut(v, uid);
            /* যারা নাম লিখিয়েছে তাদের এলোমেলো করে সাজিয়ে প্রতিজনের জেতার সুযোগ; মোট জেতা সর্বোচ্চ L.cap জন */
            const ids = Object.keys(L.joined || {});
            for (let i = ids.length - 1; i > 0; i--){ const k = Math.floor(Math.random() * (i + 1)); [ids[i], ids[k]] = [ids[k], ids[i]]; }
            const total = R.PRIZES.reduce((a, b) => a + b.w, 0), win = [];
            for (const id of ids){
                if (win.length >= (L.cap || R.CAP_MAX)) break;
                if (Math.random() >= R.WIN_CHANCE) continue;
                let r = Math.random() * total, amt = R.PRIZES[0].v;
                for (const p of R.PRIZES){ if ((r -= p.w) < 0){ amt = p.v; break; } }
                win.push({ uid: id, name: L.joined[id].name, avatar: L.joined[id].avatar, amt });
            }
            const snaps = []; for (const w of win) snaps.push(await t.get(userRef(w.uid)));   /* সব পড়া আগে, লেখা পরে */
            win.forEach((w, i) => { if (snaps[i].exists) applyDelta(t, w.uid, snaps[i].data(), { dia: w.amt, title: 'Room rocket gift', txType: 'reward' }); });
            L.result = { winners: win, at: now };
            t.set(rkRef(roomId), { v });
            return rkOut(v, uid);
        });
    };

    /* ═══════════ গেম: Space Wheel ═══════════
       বেট ধরলে ডায়মন্ড কাটে, জিতলে যোগ হয় — সব ওয়ালেট হিস্ট্রিতে থাকে।
       কোন ঘরে থামবে সেটা এখানেই রাউন্ড নম্বর থেকে ঠিক হয় (🔒 game/game-config.js-এর getWinningIndex-এর সাথে একই রাখতে হবে) */
    const G = { EPOCH: 1700000000000, ROUND: 30000, BET: 23000, MAX: 1300, MULT: [45, 25, 15, 10, 5, 5, 5, 5], CHIPS: [1, 5, 10, 100], W: [4, 10, 18, 28, 35, 35, 35, 35] };
    function gInfo(){
        const el = Date.now() - G.EPOCH, idx = Math.floor(el / G.ROUND), into = el % G.ROUND;
        return { idx, num: (idx % G.MAX) + 1, phase: into < G.BET ? 'BETTING' : (into < G.BET + 2000 ? 'SPINNING' : 'RESULT') };
    }
    function gWin(num){
        let seed = (num * 9301 + 49297) % 233280; const r1 = seed / 233280;
        seed = (seed * 9301 + 49297) % 233280; const r2 = seed / 233280;
        let r = ((r1 + r2) / 2) * 200;
        for (let i = 0; i < G.W.length; i++){ r -= G.W[i]; if (r <= 0) return i; }
        return 7;
    }
    const gDay = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

    H.gameBet = async (data, uid) => {
        const idx = Number(data.idx), item = Number(data.item), chip = Number(data.chip);
        if (!Number.isInteger(item) || item < 0 || item > 7 || G.CHIPS.indexOf(chip) < 0) fail('INVALID');
        const info = gInfo();
        if (info.idx !== idx || info.phase !== 'BETTING') throw new Error('এখন bet করার সময় নয়');
        const u0 = await getUserDoc(uid); assertActive(u0);
        const bal = await db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); const u = uS.data();
            if ((u.diamonds || 0) < chip) fail('INSUFFICIENT_DIAMONDS');
            return applyDelta(t, uid, u, { dia: -chip, title: 'Space Wheel bet', txType: 'spend' }).diamonds;
        });
        const bref = FB.rtdb.ref(LIVE + '/game/rounds/R' + idx + '/bets/' + uid);
        let mine = null;
        await bref.transaction(v => {
            v = v || { uid, name: u0.name || 'User', photo: u0.photo || '', bets: {} };
            v.bets = v.bets || {}; v.bets[item] = (v.bets[item] || 0) + chip; v.ts = Date.now(); mine = v.bets;
            return v;
        });
        return { ok: true, balance: bal, bets: mine };
    };
    H.gameClaim = async (data, uid) => {
        const idx = Number(data.idx); if (!Number.isInteger(idx)) fail('INVALID');
        const info = gInfo();
        if (idx > info.idx || (idx === info.idx && info.phase !== 'RESULT')) fail('NOT_READY');
        const win = gWin((idx % G.MAX) + 1);
        const bsnap = (await FB.rtdb.ref(LIVE + '/game/rounds/R' + idx + '/bets/' + uid).get()).val();
        const bets = (bsnap && bsnap.bets) || {};
        const arr = Array.isArray(bets) ? bets : Object.keys(bets).map(k => bets[k]);
        const cost = Object.keys(bets).reduce((s, k) => s + (Number(bets[k]) || 0), 0);
        const reward = (Number(bets[win]) || 0) * G.MULT[win];
        const cl = await FB.rtdb.ref(LIVE + '/game/claims/R' + idx + '/' + uid).transaction(v => (v ? undefined : { ts: Date.now(), amount: reward }));
        let balance = ((await userRef(uid).get()).data() || {}).diamonds || 0;
        if (cl.committed && reward > 0){
            const me = await getUserDoc(uid);
            balance = await db().runTransaction(async t => {
                const uS = await t.get(userRef(uid));
                return applyDelta(t, uid, uS.data(), { dia: reward, title: 'Space Wheel win', txType: 'reward' }).diamonds;
            });
            await FB.rtdb.ref(LIVE + '/game/dailyWins/' + gDay() + '/' + uid).transaction(v => {
                v = v || { amount: 0 }; v.amount = (v.amount || 0) + reward; v.name = me.name || 'User'; v.photo = me.photo || ''; return v;
            });
        }
        return { ok: true, win, cost, reward: cl.committed ? reward : 0, balance, already: !cl.committed };
    };

    /* ═══════════ রিলেশনশিপ: CP / ফ্রেন্ড / সিস্টার / ব্রাদার (রুমের moi-rel.js) ═══════════
       ডেটা (লোকাল): moi_rel_cp, moi_rel_fr, moi_relreq  — 🔒 LOCK-LATER: পরে সার্ভারে নেওয়া হবে */
    const REL_COST = { cp: 1000, friend: 300, sister: 300, brother: 300 };
    const SY = () => window.MOISync;
    const relGet = (k, fb) => (SY() && SY().get(k, fb)) || fb;
    const relSet = (k, v) => { if (SY()) SY().set(k, v); };
    const pairKey = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
    function acceptCore(reqId){
        const reqs = relGet('moi_relreq', []); const r = reqs.find(x => x.id === reqId);
        if (!r || r.status !== 'pending') fail('NOT_FOUND');
        const key = pairKey(r.from, r.to);
        if (r.kind === 'cp'){ const c = relGet('moi_rel_cp', {}); c[key] = { a: r.from, b: r.to, ts: Date.now() }; relSet('moi_rel_cp', c); }
        else { const f = relGet('moi_rel_fr', {}); f[key] = { a: r.from, b: r.to, type: r.kind, ts: Date.now() }; relSet('moi_rel_fr', f); }
        r.status = 'accepted'; r.doneAt = Date.now(); relSet('moi_relreq', reqs);
        return r;
    }
    H.relInvite = async (data, uid) => {
        const kind = String(data.kind || ''), to = String(data.to || ''), cost = REL_COST[kind];
        if (!cost || !to) fail('INVALID');
        if (to === uid) fail('SELF');
        const cps = relGet('moi_rel_cp', {}), frs = relGet('moi_rel_fr', {});
        if (kind === 'cp'){
            for (const k in cps){
                if (cps[k].a === uid || cps[k].b === uid) throw new Error('আপনার আগেই CP আছে');
                if (cps[k].a === to || cps[k].b === to) throw new Error('সে আগেই CP-তে আছে');
            }
        } else {
            let n = 0;
            for (const f in frs){
                if (frs[f].a === uid || frs[f].b === uid) n++;
                if ((frs[f].a === uid && frs[f].b === to) || (frs[f].b === uid && frs[f].a === to)) throw new Error('আগেই সম্পর্ক আছে');
            }
            if (n >= 6) throw new Error('আপনার ৬টা ঘর পূর্ণ');
        }
        const reqs = relGet('moi_relreq', []);
        if (reqs.some(r => r.status === 'pending' && r.from === uid && r.to === to && r.kind === kind)) throw new Error('আগেই রিকোয়েস্ট পাঠানো আছে');
        const me = await getUserDoc(uid); assertActive(me);
        await findUser(to);
        const bal = await db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); const u = uS.data();
            if ((u.diamonds || 0) < cost) fail('INSUFFICIENT_DIAMONDS');
            return applyDelta(t, uid, u, { dia: -cost, title: 'Relationship: ' + kind, txType: 'spend' }).diamonds;
        });
        const req = { id: 'rq_' + Date.now() + '_' + rnd(), from: uid, to, kind, cost, status: 'pending', ts: Date.now() };
        reqs.push(req); relSet('moi_relreq', reqs);
        await notify(to, { icon: '💞', title: 'সম্পর্কের অনুরোধ', text: (me.name || 'কেউ') + ' আপনাকে ' + kind.toUpperCase() + ' রিকোয়েস্ট পাঠিয়েছে' });
        /* ডেমো: ডেমো ইউজার ৪ সেকেন্ড পরে নিজে থেকে একসেপ্ট করে */
        if (window.DEMO && window.DEMO.USERS && window.DEMO.USERS[to]) setTimeout(() => { try { acceptCore(req.id); } catch(e){} }, 4000);
        return { ok: true, req, balance: bal };
    };
    H.relAccept = async (data, uid) => {
        const r = relGet('moi_relreq', []).find(x => x.id === String(data.id || ''));
        if (!r || r.status !== 'pending') fail('NOT_FOUND');
        if (r.to !== uid) fail('PERMISSION_DENIED');
        acceptCore(r.id);
        return { ok: true };
    };
    H.relReject = async (data, uid) => {
        const reqs = relGet('moi_relreq', []); const r = reqs.find(x => x.id === String(data.id || ''));
        if (!r || r.status !== 'pending') fail('NOT_FOUND');
        if (r.to !== uid && r.from !== uid) fail('PERMISSION_DENIED');
        r.status = 'rejected'; r.doneAt = Date.now(); relSet('moi_relreq', reqs);
        /* রিজেক্ট হলে পাঠানো ডায়মন্ড ফেরত */
        await db().runTransaction(async t => {
            const fS = await t.get(userRef(r.from)); if (!fS.exists) return;
            applyDelta(t, r.from, fS.data(), { dia: r.cost, title: 'Refund: relationship', txType: 'reward' });
        });
        return { ok: true };
    };

    /* ═══════════ আগের মতোই MOIEco.call / MOIEco.try ═══════════ */
    const MOIEco = {
        async call(name, data){
            if (!FB || !FB.db) throw friendly({ message: 'Firebase চালু নেই' });
            const fn = H[name]; if (!fn) throw friendly({ message: 'INVALID' });
            try { return await fn(data || {}, uidNow()); }
            catch(e){ console.warn('[eco]', name, e); throw friendly(e); }
        },
        async try(name, data, failToast){
            try { return await this.call(name, data); }
            catch(e){ if (failToast !== false){ (window.MOI && MOI.toast ? MOI.toast(e.userMsg, '⚠️') : (window.toastMsg && toastMsg(e.userMsg))); } return null; }
        }
    };
    window.MOIEco = MOIEco;
})();
