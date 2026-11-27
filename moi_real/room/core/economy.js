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
        GIFTS: {kiss: 1, rose: 2, choco: 5, bell: 5, teddy: 10, key: 10, bells: 10, teddyhat: 20, teddyring: 20, ringbox: 20, trophy: 20, chest: 20},
        CHAT_GIFTS: { 10: 10, 50: 50, 100: 100, 500: 500, 1000: 1000 },
        FRAMES: { basic: 0, aurora: 500, flame: 1200, ocean: 2000, royal: 3500, galaxy: 6000 },
        /* Host: মাসের টার্গেট (need = এ মাসে পাওয়া 💎, reward = পূরণ হলে টাকা) ও এক্সচেঞ্জ রেট (১ টাকা = RATE 💎) */
        ROCKET: { TARGET: 1000, DURATION: 10000, RESULT_MS: 8000, KEEP_MS: 40000, WIN_CHANCE: 0.65, CAP_MIN: 5, CAP_MAX: 10, PRIZES: [ { v: 3, w: 50 }, { v: 5, w: 35 }, { v: 10, w: 15 } ] },
        HOST: { RATE: 2, TARGETS: [ { need: 5, reward: 2 }, { need: 20, reward: 8 }, { need: 50, reward: 20 }, { need: 100, reward: 45 }, { need: 150, reward: 100 }, { need: 250, reward: 170 }, { need: 500, reward: 350 }, { need: 1000, reward: 750 }, { need: 2500, reward: 2000 }, { need: 5000, reward: 4500 } ] },
        VIP: { 1: 240000 },   /* VIP কেনার দাম (ডায়মন্ড, ৩০ দিন) — me/vip/vip.js এর সাথে একই রাখুন */
        STORE: { ring_wings_gold: { 7: 1000, 30: 2000 }, ring_wings_violet: { 7: 1000, 30: 2000 }, ring_lion: { 7: 1000, 30: 2000 }, ring_phoenix: { 7: 1000, 30: 2000 }, ring_heart: { 7: 1000, 30: 2000 }, ring_cobra: { 7: 1000, 30: 2000 }, ring_wolf: { 7: 1000, 30: 2000 }, ring_eagle: { 7: 1000, 30: 2000 }, ring_gold: { 7: 1000, 30: 2000 }, entry_eyes1: { 7: 200, 30: 1200 }, bubble_vip1: { 7: 100, 30: 500 }, emoji_memes: { 0: 1000 } },   /* দিন 0 = একবার কিনলে সারাজীবন */   /* স্টোরের জিনিস: আইডি → { দিন: ডায়মন্ড } (shared/store/store-data.js এর সাথে একই রাখুন) */
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
                photo: okUrl(data.photo) || (window.MOI_AVATAR ? MOI_AVATAR(uid) : ''),
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
            if (room.exists) t.update(roomRef, { points: FV.increment(total), xp: FV.increment(total) });   /* xp = রুমের লেভেলের হিসাব (১০০০ 💎 = ১ লেভেল) */   /* রুমের ডক না থাকলেও গিফট আটকাবে না */
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
                /* CP-র দুজনের গিফট CP পয়েন্টে যোগ */
                try { const cc = SS.get('moi_rel_cp', {}) || {}; let ch = false; targetUids.forEach(tu => { const k = uid < tu ? uid + '|' + tu : tu + '|' + uid; if (cc[k]){ cc[k].pts = (cc[k].pts || 0) + unit * qty; ch = true; } }); if (ch) SS.set('moi_rel_cp', cc); } catch(e){}
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
    /* শুধু ডেমো: বট ইউজার আসল হ্যান্ডলার চালায় (গিফট, রকেট, লাকি বক্স…) — তাই হিসাব, XP, রুম-লেভেল সব আসলের মতোই আপডেট হয় */
    H.asBot = async (data) => {
        if (!window.__MOCK) fail('INVALID');
        const bot = String(data.as || ''), fn = String(data.fn || '');
        if (!bot || fn === 'asBot' || !H[fn]) fail('INVALID');
        return H[fn](data.args || {}, bot);
    };
    /* শুধু ডেমো: বক্সের মেয়াদ শেষে রুমে যারা (বট) সত্যি আছে তারাই বক্স ধরে — রুমের লিসেনার লিস্ট থেকে (আসল Firebase-এ এটা চলবে না) */
    H.lbBots = async (data, uid) => {
        if (!window.__MOCK) fail('INVALID');
        const roomId = String(data.roomId || ''), boxId = String(data.boxId || '');
        const ref = FB.rtdb.ref(LIVE + '/rooms/' + roomId + '/luckybox/' + boxId);
        const first = (await ref.get()).val(); if (!first) return { n: 0 };
        const D = window.DEMO || {}, US = D.USERS || {};
        const lis = (await FB.rtdb.ref(LIVE + '/rooms/' + roomId + '/listeners').get()).val() || {};
        const seats = (await FB.rtdb.ref(LIVE + '/rooms/' + roomId + '/seats').get()).val() || {};
        const here = {}; Object.keys(lis).forEach(k => { here[k] = 1; }); Object.keys(seats).forEach(k => { if (seats[k] && seats[k].uid) here[seats[k].uid] = 1; });
        const bots = Object.keys(here).filter(u => US[u] && u !== first.senderUid && u !== uid).sort(() => Math.random() - 0.5);
        let n = 0;
        for (let i = 0; i < bots.length; i++){
            const cur = (await ref.get()).val(); if (!cur) break;
            const w = cur.winners ? Object.values(cur.winners).length : 0;
            if (w >= cur.qty - 1) break;                      /* শেষ ভাগটা আসল ইউজারের জন্য থাকে */
            await new Promise(r => setTimeout(r, 300 + Math.random() * 1100));
            let amount = 0; const bid = bots[i], bu = US[bid];
            await ref.transaction(box => {
                if (!box) return box;
                box.claimedBy = box.claimedBy ? Object.values(box.claimedBy) : [];
                box.winners = box.winners ? Object.values(box.winners) : [];
                if (box.winners.length >= box.qty - 1 || box.claimedBy.includes(bid)) return undefined;
                box.claimedBy.push(bid);
                const given = box.winners.reduce((s, w) => s + w.amount, 0), left = box.pool - given;
                amount = Math.max(1, Math.min(left, Math.floor(box.pool / (box.qty * 2) * (0.5 + Math.random()))));
                box.winners.push({ uid: bid, name: bu.name || 'User', avatar: bu.photo || '', amount, ts: Date.now() });
                return box;
            });
            if (amount > 0){
                try { await db().runTransaction(async t => { const uS = await t.get(userRef(bid)); if (uS.exists) applyDelta(t, bid, uS.data(), { dia: amount, title: 'Lucky box win' }); }); } catch(e){}
                n++;
            }
        }
        return { n };
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
            if (Date.now() < box.expiresAt || Date.now() > box.expiresAt + 300000 || box.claimedBy.includes(uid) || box.winners.length >= box.qty) return undefined;
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

    /* ═══════════ রুম থিম স্কিন (শুধু রুম Owner) ═══════════
       buyRoomSkin: { roomId, skinId, days:7|30 } — ৭ দিন ১০০০ 💎, ৩০ দিন ২০০০ 💎 (মেয়াদ থাকতে কিনলে আগের শেষ থেকে যোগ)
       useRoomSkin: { roomId, skinId } — skinId '' দিলে স্কিন খুলে কোম্পানির ডিজাইনে ফেরে */
    const ROOM_SKINS = ['skin1', 'skin2', 'skin3', 'skin4'], SKIN_PRICE = { 7: 1000, 30: 2000 };
    H.buyRoomSkin = async (data, uid) => {
        const roomId = String(data.roomId || ''), skinId = String(data.skinId || ''), days = Number(data.days);
        if (!ROOM_SKINS.includes(skinId) || !SKIN_PRICE[days]) fail('INVALID');
        const r = await db().collection('rooms').doc(roomId).get(); if (!r.exists) fail('NOT_FOUND');
        if (r.data().ownerUid !== uid) fail('PERMISSION_DENIED');
        const ref = FB.rtdb.ref(LIVE + '/rooms/' + roomId + '/skinOwn/' + skinId);
        const cur = (await ref.get()).val() || 0, now = Date.now();
        const until = Math.max(cur, now) + days * 86400000;
        const price = SKIN_PRICE[days];
        const res = await db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); if (!uS.exists) fail('NOT_FOUND');
            const u = uS.data(); assertActive(u);
            if ((u.diamonds || 0) < price) fail('INSUFFICIENT_DIAMONDS');
            return { balance: applyDelta(t, uid, u, { dia: -price, xp: 10, title: 'Room skin: ' + skinId + ' ' + days + 'd', txType: 'spend' }).diamonds };
        });
        await ref.set(until);
        return { until, balance: res.balance };
    };
    H.useRoomSkin = async (data, uid) => {
        const roomId = String(data.roomId || ''), skinId = String(data.skinId || '');
        const r = await db().collection('rooms').doc(roomId).get(); if (!r.exists) fail('NOT_FOUND');
        if (r.data().ownerUid !== uid) fail('PERMISSION_DENIED');
        const sk = FB.rtdb.ref(LIVE + '/rooms/' + roomId + '/skin');
        if (!skinId){ await sk.set(null); return { skin: '' }; }
        if (!ROOM_SKINS.includes(skinId)) fail('INVALID');
        const until = (await FB.rtdb.ref(LIVE + '/rooms/' + roomId + '/skinOwn/' + skinId).get()).val() || 0;
        if (until < Date.now()) fail('EXPIRED');
        await sk.set({ id: skinId });
        return { skin: skinId };
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


    /* ═══════════ VIP কেনা/রিনিউ: ডায়মন্ড কাটে (মেয়াদ ক্লায়েন্টে বসে) ═══════════ */
    H.buyVip = async (data, uid) => {
        const lv = Number(data.level) || 1, price = C.VIP && C.VIP[lv];
        if (!price) fail('INVALID');
        return db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); if (!uS.exists) fail('NOT_FOUND');
            const u = uS.data(); assertActive(u);
            if ((u.diamonds || 0) < price) fail('INSUFFICIENT_DIAMONDS');
            const balance = applyDelta(t, uid, u, { dia: -price, xp: 10, title: 'VIP' + lv + ' · 30 days', txType: 'spend' }).diamonds;
            return { ok: true, balance, price };
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

    /* ═══════════ ফল-চাকা গেম (game2): ৯ খোপ — তরমুজ ৪, জাম ৪, ৭৭ ১টা ═══════════
       ঘর: 0=তরমুজ x2, 1=৭৭ x8, 2=জাম x2। রাউন্ড ২০ সেকেন্ড: ১০ বাজি + ৫.৫ ঘোরা + ৪.৫ ফল */
    const F = { EPOCH: 1700000000000, ROUND: 20000, BET: 10000, SPIN: 15500, MULT: [2, 8, 2], CHIPS: [500, 5000, 50000, 100000], WEDGE: [0, 2, 0, 2, 1, 0, 2, 0, 2] };
    function fInfo(){
        const el = Date.now() - F.EPOCH, idx = Math.floor(el / F.ROUND), into = el % F.ROUND;
        return { idx, phase: into < F.BET ? 'BETTING' : (into < F.SPIN ? 'SPINNING' : 'RESULT') };
    }
    function fOut(idx){
      function mb(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
      var B = 24, b = Math.floor(idx / B), pos = idx - b * B, r = mb(b * 9301 + 49297), q = r(), n = q < .1 ? 0 : q < .45 ? 1 : q < .9 ? 2 : 3, sl = [];
      while (sl.length < n){ var p = Math.floor(r() * B); if (sl.indexOf(p) < 0) sl.push(p); }
      var h = mb(idx * 2654435 + 12345); h(); h();
      if (sl.indexOf(pos) >= 0){
        var t = h(), o = h();
        if (t < .3) return { wedge: 4, wins: [1], hl: [4], strip: 1 };
        if (t < .85){ var m = o < .5; return { wedge: 4, wins: m ? [0, 1] : [1, 2], hl: m ? [4, 5] : [3, 4], strip: 1 }; }
        return { wedge: 4, wins: [0, 1, 2], hl: [3, 4, 5], strip: 1 };
      }
      var rr = mb(b * 7717 + 31), f = rr() < .5 ? 0 : 2, k = 0, L = [1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 6];
      for (;;){ var len = L[Math.floor(rr() * L.length)]; if (pos < k + len) break; k += len; f = f === 0 ? 2 : 0; }
      var W = f === 0 ? [0, 2, 5, 7] : [1, 3, 6, 8], w = W[Math.floor(h() * 4)];
      return { wedge: w, wins: [f], hl: [w], strip: f };
    }
    
    H.fruitBet = async (data, uid) => {
        const idx = Number(data.idx), item = Number(data.item), chip = Number(data.chip);
        if (!Number.isInteger(item) || item < 0 || item > 2 || !(chip > 0) || chip > 10000000) fail('INVALID');
        const info = fInfo();
        if (info.idx !== idx || info.phase !== 'BETTING') throw new Error('এখন bet করার সময় নয়');
        const u0 = await getUserDoc(uid); assertActive(u0);
        const prev = (await FB.rtdb.ref(LIVE + '/fruit/rounds/R' + idx + '/bets/' + uid).get()).val();
        const pk = Object.keys((prev && prev.bets) || {}).filter(k => (prev.bets[k] || 0) > 0);
        if (pk.length >= 2 && pk.indexOf(String(item)) < 0) throw new Error('সর্বোচ্চ ২টা ঘরে বাজি ধরা যাবে');
        const bal = await db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); const u = uS.data();
            if ((u.diamonds || 0) < chip) fail('INSUFFICIENT_DIAMONDS');
            return applyDelta(t, uid, u, { dia: -chip, title: 'Fruit Wheel bet', txType: 'spend' }).diamonds;
        });
        const bref = FB.rtdb.ref(LIVE + '/fruit/rounds/R' + idx + '/bets/' + uid);
        let mine = null;
        await bref.transaction(v => {
            v = v || { uid, name: u0.name || 'User', photo: u0.photo || '', bets: {} };
            v.bets = v.bets || {}; v.bets[item] = (v.bets[item] || 0) + chip; v.ts = Date.now(); mine = v.bets;
            return v;
        });
        return { ok: true, balance: bal, bets: mine };
    };
    H.fruitClaim = async (data, uid) => {
        const idx = Number(data.idx); if (!Number.isInteger(idx)) fail('INVALID');
        const info = fInfo();
        if (idx > info.idx || (idx === info.idx && info.phase !== 'RESULT')) fail('NOT_READY');
        const o = fOut(idx), wedge = o.wedge, win = o.strip;
        const bsnap = (await FB.rtdb.ref(LIVE + '/fruit/rounds/R' + idx + '/bets/' + uid).get()).val();
        const bets = (bsnap && bsnap.bets) || {};
        const cost = Object.keys(bets).reduce((s, k) => s + (Number(bets[k]) || 0), 0);
        const reward = o.wins.reduce((a, w) => a + (Number(bets[w]) || 0) * F.MULT[w], 0);
        const cl = await FB.rtdb.ref(LIVE + '/fruit/claims/R' + idx + '/' + uid).transaction(v => (v ? undefined : { ts: Date.now(), amount: reward }));
        let balance = ((await userRef(uid).get()).data() || {}).diamonds || 0;
        if (cl.committed && reward > 0){
            const me = await getUserDoc(uid);
            balance = await db().runTransaction(async t => {
                const uS = await t.get(userRef(uid));
                return applyDelta(t, uid, uS.data(), { dia: reward, title: 'Fruit Wheel win', txType: 'reward' }).diamonds;
            });
            await FB.rtdb.ref(LIVE + '/fruit/dailyWins/' + gDay() + '/' + uid).transaction(v => {
                v = v || { amount: 0 }; v.amount = (v.amount || 0) + reward; v.name = me.name || 'User'; v.photo = me.photo || ''; return v;
            });
        }
        return { ok: true, win, wedge, cost, reward: cl.committed ? reward : 0, balance, already: !cl.committed };
    };

    /* ═══════════ গেম: Gedi ═══════════
       বেট ধরলে ডায়মন্ড কাটে, জিতলে যোগ হয় — সব ওয়ালেট হিস্ট্রিতে থাকে। (Space Wheel-এর কিছু ছোঁয়া হয়নি)
       🔒 কোন ঘর জিতবে সেই অংশ gedi/gedi-config.js-এর সাথে হুবহু একই রাখতে হবে। */
    const GD = { EPOCH: 1700000000000, ROUND: 30000, BET: 22000, SPIN: 3000, MULT: [10, 15, 25, 45, 5, 5, 5, 5], CHIPS: [10, 100, 500, 1000] };
    function gdInfo(){
        const el = Date.now() - GD.EPOCH, idx = Math.floor(el / GD.ROUND), into = el % GD.ROUND;
        return { idx, phase: into < GD.BET ? 'BETTING' : (into < GD.BET + GD.SPIN ? 'SPINNING' : 'RESULT') };
    }
    /* ── কোন ঘর জিতবে — রাউন্ড নম্বর (idx) থেকেই ঠিক হয়, সবার জন্য একই ──
       🔒 এই অংশটা gedi/gedi-config.js আর shared/core/economy.js — দুই জায়গায় হুবহু একই রাখতে হবে।
       ফল: { cell: 0..7, special: null } অথবা { cell: -1, special: 'F' (সব ফল) | 'S' (সব মিষ্টি) } */
    function gediRng(seed){ let a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    const GEDI_CACHE = {};
    function gediSuper(s){
      if (GEDI_CACHE[s]) return GEDI_CACHE[s];
      const r = gediRng(Math.imul(s + 7, 2654435761) ^ 0x85ebca6b);
      const sp = r() < 0.8 ? Math.floor(r() * 64) : (r(), -1);          /* ৬৪ রাউন্ডে সর্বোচ্চ ১টা স্পেশাল (খুব কম) */
      const spType = r() < 0.6 ? 'F' : 'S';
      const out = []; let lastSmall = -1, prevMood = -1;
      while (out.length < 64){
        const m = r(); let mood = m < 0.35 ? 0 : (m < 0.75 ? 1 : 2);        /* ০ = ফলের ধারা, ১ = মেশানো, ২ = বড় ঘরের ধারা */
        if (mood !== 1 && mood === prevMood) mood = 1; prevMood = mood;   /* একই ধারা পরপর দুইবার নয় */
        const len = mood === 0 ? 3 + Math.floor(r() * 7) : mood === 1 ? 3 + Math.floor(r() * 4) : 2 + Math.floor(r() * 3);
        const pBig = mood === 0 ? 0.06 : mood === 1 ? 0.34 : 0.78;
        for (let k = 0; k < len && out.length < 64; k++){
          if (out.length === sp){ out.push({ cell: -1, special: spType }); continue; }
          let cell;
          if (r() < pBig){ const x = r() * 60; cell = x < 28 ? 0 : x < 46 ? 1 : x < 56 ? 2 : 3; }   /* ১০ বেশি, ১৫, ২৫, ৪৫ সবচেয়ে কম */
          else { cell = 4 + Math.floor(r() * 4); if (cell === lastSmall && r() < 0.6) cell = 4 + Math.floor(r() * 4); lastSmall = cell; }
          out.push({ cell: cell, special: null });
        }
      }
      GEDI_CACHE[s] = out;
      return out;
    }
    function gediResult(idx){ return gediSuper(Math.floor(idx / 64))[((idx % 64) + 64) % 64]; }
    const gdCells = res => (res.special === 'F' ? [4, 5, 6, 7] : res.special === 'S' ? [0, 1, 2, 3] : [res.cell]);
    const gdWeek = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

    H.gediBet = async (data, uid) => {
        const idx = Number(data.idx), item = Number(data.item), chip = Number(data.chip);
        if (!Number.isInteger(item) || item < 0 || item > 7 || GD.CHIPS.indexOf(chip) < 0) fail('INVALID');
        const info = gdInfo();
        if (info.idx !== idx || info.phase !== 'BETTING') throw new Error('Betting is closed');
        const u0 = await getUserDoc(uid); assertActive(u0);
        const prevG = (await FB.rtdb.ref(LIVE + '/gedi/rounds/R' + idx + '/bets/' + uid).get()).val();
        const pkG = Object.keys((prevG && prevG.bets) || {}).filter(k => (prevG.bets[k] || 0) > 0);
        if (pkG.length >= 6 && pkG.indexOf(String(item)) < 0) throw new Error('সর্বোচ্চ ৬টা ঘরে বাজি ধরা যাবে');
        const bal = await db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); const u = uS.data();
            if ((u.diamonds || 0) < chip) fail('INSUFFICIENT_DIAMONDS');
            return applyDelta(t, uid, u, { dia: -chip, title: 'Gedi bet', txType: 'spend' }).diamonds;
        });
        const bref = FB.rtdb.ref(LIVE + '/gedi/rounds/R' + idx + '/bets/' + uid);
        let mine = null;
        await bref.transaction(v => {
            v = v || { uid, name: u0.name || 'User', photo: u0.photo || '', bets: {} };
            v.bets = v.bets || {}; v.bets[item] = (v.bets[item] || 0) + chip; v.ts = Date.now(); mine = v.bets;
            return v;
        });
        return { ok: true, balance: bal, bets: mine };
    };
    H.gediClaim = async (data, uid) => {
        const idx = Number(data.idx); if (!Number.isInteger(idx)) fail('INVALID');
        const info = gdInfo();
        if (idx > info.idx || (idx === info.idx && info.phase !== 'RESULT')) fail('NOT_READY');
        const res = gediResult(idx), cells = gdCells(res);
        const bsnap = (await FB.rtdb.ref(LIVE + '/gedi/rounds/R' + idx + '/bets/' + uid).get()).val();
        const bets = (bsnap && bsnap.bets) || {};
        const cost = Object.keys(bets).reduce((s, k) => s + (Number(bets[k]) || 0), 0);
        const reward = cells.reduce((s, c) => s + (Number(bets[c]) || 0) * GD.MULT[c], 0);
        const cl = await FB.rtdb.ref(LIVE + '/gedi/claims/R' + idx + '/' + uid).transaction(v => (v ? undefined : { ts: Date.now(), amount: reward }));
        let balance = ((await userRef(uid).get()).data() || {}).diamonds || 0;
        if (cl.committed && reward > 0){
            const me = await getUserDoc(uid);
            balance = await db().runTransaction(async t => {
                const uS = await t.get(userRef(uid));
                return applyDelta(t, uid, uS.data(), { dia: reward, title: 'Gedi win', txType: 'reward' }).diamonds;
            });
            const add = v => { v = v || { amount: 0 }; v.amount = (v.amount || 0) + reward; v.name = me.name || 'User'; v.photo = me.photo || ''; return v; };
            await FB.rtdb.ref(LIVE + '/gedi/dailyWins/' + gDay() + '/' + uid).transaction(add);
            await FB.rtdb.ref(LIVE + '/gedi/weeklyWins/' + gdWeek() + '/' + uid).transaction(add);
        }
        return { ok: true, win: res, cost, reward: cl.committed ? reward : 0, balance, already: !cl.committed };
    };

    /* ═══════════ Rocket engine (rocket/engine.js এর কপি) ═══════════ */
    /* ROCKET ENGINE — 🔒 এই ফাইলের কোড shared/core/economy.js এর "Rocket" অংশে হুবহু একই কপি আছে।
       রাউন্ড: ১৪ সেকেন্ড বাজি → উড়ান (ক্র্যাশ গুণকের উপর নির্ভর) → ৬ সেকেন্ড ফল। ৩০ মিনিটের ব্লকে সময় থেকেই সব ঠিক হয়। */
    var RK = { BLK: 1800000, BET: 14000, RES: 6000, A: 0.035, B: 0.0022 };
    function rkMb(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function rkR2(x){ return Math.round(x * 100) / 100; }
    function rkCrash(k){
      var B = 20, b = Math.floor(k / B), pos = k - b * B, r = rkMb(b * 7919 + 104729), q = r(), n = q < .25 ? 0 : q < .7 ? 1 : q < .95 ? 2 : 3, set = {}, i, p;
      for (i = 0; i < n; i++){ p = Math.floor(r() * B); set[p] = 1; if (r() < .22){ set[p + 1] = 1; if (r() < .4) set[p + 2] = 1; } }
      var h = rkMb(k * 2654435 + 777); h(); h();
      var t = h(), v = h();
      if (set[pos]){
        if (t < .70) return rkR2(10 + v * 10);
        if (t < .92) return rkR2(35 + v * 5);
        return [50, 80, 100][Math.floor(v * 3)];
      }
      if (t < .09) return 1.00;
      if (t < .68) return rkR2(1.01 + v * .99);
      return rkR2(2 + v * 3);
    }
    function rkMult(ms){ var t = Math.max(0, ms) / 1000; return Math.exp(RK.A * t + RK.B * t * t); }
    function rkTime(m){ var L = Math.log(Math.max(1, m)); return (-RK.A + Math.sqrt(RK.A * RK.A + 4 * RK.B * L)) / (2 * RK.B) * 1000; }
    function rkFly(c){ return Math.max(1000, Math.round(rkTime(c))); }
    function rkBlock(bi){
      var bs = bi * RK.BLK, t = bs, k = bi * 1000, out = [];
      for (;;){
        var c = rkCrash(k), fl = rkFly(c), end = t + RK.BET + fl + RK.RES;
        if (end > bs + RK.BLK) break;
        out.push({ idx: k, start: t, flyStart: t + RK.BET, crashAt: t + RK.BET + fl, end: end, crash: c, fl: fl }); t = end; k++;
      }
      return out;
    }
    var rkCache = {};
    function rkBlk(bi){ return rkCache[bi] || (rkCache[bi] = rkBlock(bi)); }
    function rkAt(now){
      var bi = Math.floor(now / RK.BLK), L = rkBlk(bi);
      for (var i = 0; i < L.length; i++) if (now < L[i].end) return L[i];
      return { idle: true, next: (bi + 1) * RK.BLK };
    }
    function rkOf(idx){ var L = rkBlk(Math.floor(idx / 1000)); for (var i = 0; i < L.length; i++) if (L[i].idx === idx) return L[i]; return null; }
    function rkPhase(s, now){ return s.idle ? 'IDLE' : now < s.flyStart ? 'BET' : now < s.crashAt ? 'FLY' : 'RES'; }


    /* ═══════════ গেম: Rocket (ক্র্যাশ) — বাজি ধরলে ডায়মন্ড কাটে; escape করলে বাজি × গুণক ফেরত ═══════════ */
    H.rocketBet = async (data, uid) => {
        const idx = Number(data.idx), amt = Math.floor(Number(data.amt));
        if (!Number.isInteger(idx) || !(amt > 0) || amt > 50000000) fail('INVALID');
        const s = rkOf(idx), now = Date.now();
        if (!s || now >= s.flyStart - 150 || now < s.start - 500) throw new Error('এখন বাজি ধরার সময় নয়');
        const u0 = await getUserDoc(uid); assertActive(u0);
        const bal = await db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); const u = uS.data();
            if ((u.diamonds || 0) < amt) fail('INSUFFICIENT_DIAMONDS');
            return applyDelta(t, uid, u, { dia: -amt, title: 'Rocket bet', txType: 'spend' }).diamonds;
        });
        let total = 0;
        await FB.rtdb.ref(LIVE + '/rocket/rounds/R' + idx + '/bets/' + uid).transaction(v => {
            v = v || { uid, name: u0.name || 'User', photo: u0.photo || '', amt: 0 };
            v.amt = (v.amt || 0) + amt; v.ts = Date.now(); total = v.amt; return v;
        });
        return { ok: true, balance: bal, total };
    };
    H.rocketEscape = async (data, uid) => {
        const idx = Number(data.idx); if (!Number.isInteger(idx)) fail('INVALID');
        const s = rkOf(idx), now = Date.now(); if (!s) fail('INVALID');
        const ref = FB.rtdb.ref(LIVE + '/rocket/rounds/R' + idx + '/bets/' + uid);
        const b = (await ref.get()).val(); if (!b || !(b.amt > 0)) fail('NO_BET');
        if (b.esc) return { ok: true, mult: b.esc, reward: b.reward || 0, already: true, balance: ((await userRef(uid).get()).data() || {}).diamonds || 0 };
        let mult;
        const at = Number(data.at);
        if (at >= 1.01 && at <= 100) {                  /* auto escape: ওই গুণকে পৌঁছালে */
            if (at > s.crash || now < s.flyStart + Math.max(1000, rkTime(at)) - 300) throw new Error('CRASHED');
            mult = rkR2(at);
        } else {
            if (now < s.flyStart + 1000 || now >= s.crashAt) throw new Error('CRASHED');
            mult = Math.min(s.crash, Math.floor(rkMult(now - s.flyStart) * 100) / 100);
        }
        const reward = Math.floor(b.amt * mult);
        const cl = await ref.transaction(v => (v && !v.esc ? Object.assign(v, { esc: mult, reward }) : undefined));
        if (!cl.committed) return { ok: true, mult, reward: 0, already: true };
        const balance = await db().runTransaction(async t => {
            const uS = await t.get(userRef(uid));
            return applyDelta(t, uid, uS.data(), { dia: reward, title: 'Rocket win', txType: 'reward' }).diamonds;
        });
        await FB.rtdb.ref(LIVE + '/rocket/dailyWins/' + gDay() + '/' + uid).transaction(v => {
            v = v || { amount: 0 }; v.amount = (v.amount || 0) + reward; v.name = u0name(b); v.photo = b.photo || ''; return v;
        });
        return { ok: true, mult, reward, balance };
    };
    const u0name = b => (b && b.name) || 'User';


    /* ═══════════ গেম: Ludo Dice ═══════════
       ডাইসে ২–৬ কোন নম্বর পড়বে তাতে বেট; সর্বোচ্চ ২ ঘরে। জিতলে বেট × নম্বর। বেটে ডায়মন্ড কাটে, জয়ে যোগ হয়।
       🔒 কোন নম্বর পড়বে সেই অংশ ludo/ludo-config.js-এর সাথে হুবহু একই রাখতে হবে। */
    const LD = { EPOCH: 1700000000000, BET: 15000, ROUND: 27000, CHIPS: [10, 100, 500, 1000] };
    function ludoRollMs(idx){ let a = (Math.imul(idx + 5, 2654435761) ^ 0x1b873593) >>> 0; a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); const x = ((t ^ (t >>> 14)) >>> 0) / 4294967296; return x < 0.36 ? 3000 : (x < 0.70 ? 5000 : 7000); }
    function ldInfo(){
        const R = LD.ROUND, el = Date.now() - LD.EPOCH, idx = Math.floor(el / R), into = el % R;
        return { idx, phase: into < LD.BET ? 'BETTING' : (into < LD.BET + ludoRollMs(idx) ? 'ROLLING' : 'RESULT') };
    }
    /* ── ডাইসে কোন নম্বর পড়বে (২–৬) — রাউন্ড নম্বর (idx) থেকেই ঠিক হয়, সবার জন্য একই ──
       🔒 এই অংশটা ludo/ludo-config.js আর shared/core/economy.js — দুই জায়গায় হুবহু একই রাখতে হবে। */
    function ludoRng(seed){ let a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    const LUDO_MOODS = [
      { w: [0.44, 0.34, 0.13, 0.06, 0.03], min: 4, span: 6 },   /* ছোট নম্বরের ধারা */
      { w: [0.27, 0.26, 0.22, 0.14, 0.11], min: 3, span: 5 },   /* মেশানো */
      { w: [0.10, 0.15, 0.27, 0.26, 0.22], min: 2, span: 4 }    /* বড় নম্বরের ধারা */
    ];
    const LUDO_CACHE = {};
    function ludoSuper(s){
      if (LUDO_CACHE[s]) return LUDO_CACHE[s];
      const r = ludoRng(Math.imul(s + 11, 2246822519) ^ 0x27d4eb2f);
      const out = []; let prev = -1, prevMood = -1;
      while (out.length < 64){
        const m = r(); let mood = m < 0.30 ? 0 : (m < 0.78 ? 1 : 2);
        if (mood !== 1 && mood === prevMood) mood = 1; prevMood = mood;
        const M = LUDO_MOODS[mood], len = M.min + Math.floor(r() * M.span);
        for (let k = 0; k < len && out.length < 64; k++){
          let v = ludoPick(M.w, r());
          if (v === prev && r() < 0.35) v = ludoPick(M.w, r());     /* একই নম্বর পরপর কম আসে */
          out.push(v); prev = v;
        }
      }
      LUDO_CACHE[s] = out;
      return out;
    }
    function ludoPick(w, x){ let c = 0; for (let i = 0; i < 5; i++){ c += w[i]; if (x < c) return i + 2; } return 6; }
    function ludoResult(idx){ return ludoSuper(Math.floor(idx / 64))[((idx % 64) + 64) % 64]; }

    H.ludoBet = async (data, uid) => {
        const idx = Number(data.idx), num = Number(data.num), chip = Number(data.chip);
        if (!Number.isInteger(num) || num < 2 || num > 6 || LD.CHIPS.indexOf(chip) < 0) fail('INVALID');
        const info = ldInfo();
        if (info.idx !== idx || info.phase !== 'BETTING') throw new Error('Betting is closed');
        const u0 = await getUserDoc(uid); assertActive(u0);
        /* আগে বেট লিখি (সর্বোচ্চ ২ ঘর এখানেই আটকানো হয়), তারপর ডায়মন্ড কাটি; কাটতে না পারলে বেট ফিরিয়ে নিই */
        const bref = FB.rtdb.ref(LIVE + '/ludo/rounds/R' + idx + '/bets/' + uid);
        let mine = null, ok = false;
        await bref.transaction(v => {
            ok = false;
            v = v || { uid, name: u0.name || 'User', photo: u0.photo || '', bets: {} };
            v.bets = v.bets || {};
            const used = Object.keys(v.bets).filter(k => (v.bets[k] || 0) > 0);
            if (used.length >= 2 && used.indexOf(String(num)) < 0) return;          /* ৩য় ঘর — বাতিল */
            v.bets[num] = (v.bets[num] || 0) + chip; v.ts = Date.now(); mine = v.bets; ok = true;
            return v;
        });
        if (!ok) throw new Error('You can bet on 2 numbers only');
        let bal;
        try {
            bal = await db().runTransaction(async t => {
                const uS = await t.get(userRef(uid)); const u = uS.data();
                if ((u.diamonds || 0) < chip) fail('INSUFFICIENT_DIAMONDS');
                return applyDelta(t, uid, u, { dia: -chip, title: 'Ludo Dice bet', txType: 'spend' }).diamonds;
            });
        } catch (e) {
            await bref.transaction(v => { if (!v || !v.bets) return v; v.bets[num] = Math.max(0, (v.bets[num] || 0) - chip); return v; });
            throw e;
        }
        return { ok: true, balance: bal, bets: mine };
    };
    H.ludoClaim = async (data, uid) => {
        const idx = Number(data.idx); if (!Number.isInteger(idx)) fail('INVALID');
        const info = ldInfo();
        if (idx > info.idx || (idx === info.idx && info.phase !== 'RESULT')) fail('NOT_READY');
        const res = ludoResult(idx);
        const bsnap = (await FB.rtdb.ref(LIVE + '/ludo/rounds/R' + idx + '/bets/' + uid).get()).val();
        const bets = (bsnap && bsnap.bets) || {};
        const cost = Object.keys(bets).reduce((s, k) => s + (Number(bets[k]) || 0), 0);
        const reward = (Number(bets[res]) || 0) * res;
        const cl = await FB.rtdb.ref(LIVE + '/ludo/claims/R' + idx + '/' + uid).transaction(v => (v ? undefined : { ts: Date.now(), amount: reward }));
        let balance = ((await userRef(uid).get()).data() || {}).diamonds || 0;
        if (cl.committed && reward > 0){
            const me = await getUserDoc(uid);
            balance = await db().runTransaction(async t => {
                const uS = await t.get(userRef(uid));
                return applyDelta(t, uid, uS.data(), { dia: reward, title: 'Ludo Dice win', txType: 'reward' }).diamonds;
            });
            const add = v => { v = v || { amount: 0 }; v.amount = (v.amount || 0) + reward; v.name = me.name || 'User'; v.photo = me.photo || ''; return v; };
            await FB.rtdb.ref(LIVE + '/ludo/dailyWins/' + gDay() + '/' + uid).transaction(add);
            await FB.rtdb.ref(LIVE + '/ludo/weeklyWins/' + gdWeek() + '/' + uid).transaction(add);
        }
        return { ok: true, win: res, cost, reward: cl.committed ? reward : 0, balance, already: !cl.committed };
    };

    /* ═══════════ Teen Patti Slot (৫ রিল × ৩ সারি) — ফলাফল ইউজার+স্পিন নম্বর থেকে নির্দিষ্ট ═══════════ */
    const SL_BETS = (() => { const a = []; for (let b = 100; b <= 1000; b += 100) a.push(b); for (let b = 1500; b <= 10000; b += 500) a.push(b); return a; })();
    const slH = (a, b) => { let h = (a ^ Math.imul(b + 0x9e3779b9, 0x85ebca6b)) >>> 0; h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0; h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0; return (h ^ (h >>> 15)) >>> 0; };
    const slSeed = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
    const slRng = seed => { let s = (seed >>> 0) % 2147483647 || 1; return () => (s = s * 48271 % 2147483647) / 2147483647; };
    function slMood(us, n) {
        const LEN = [3, 4, 5, 7, 9, 12];
        let pos = 0, seg = 0;
        for (let g = 0; g < 100000; g++) { const l = LEN[slH(us, seg + 31) % LEN.length]; if (pos + l > n) break; pos += l; seg++; }
        return slH(us, seg + 777) / 4294967296;
    }
    function slOut(uid, n) {
        const us = slSeed(String(uid)), m = slMood(us, n), u = slH(us, n * 7 + 3) / 4294967296;
        /* ঠান্ডা: কম জেতা | মাঝারি | গরম: অনেক জেতা, বড়ও বেশি */
        const P = m < .35 ? [.80, .95, .99] : m < .75 ? [.55, .85, .95] : [.20, .65, .87];
        const k = u < P[0] ? 0 : u < P[1] ? 3 : u < P[2] ? 4 : 5;
        const r = slRng(slH(us, n * 13 + 5));
        /* জেতা শুধু মাঝের সারিতে: একই তাস ৩/৪/৫টা থাকলে (পরপর না হলেও) ×৩/×৪/×৫; ওপর-নিচের সারি শুধু সাজানো */
        const cnt = row => { const o = [0, 0, 0, 0, 0, 0, 0, 0]; row.forEach(v => o[v]++); return o; };
        for (let it = 0; it < 800; it++) {
            const card = Math.floor(r() * 8), mid = [];
            let pos = [0, 1, 2, 3, 4];
            for (let i = 4; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = pos[i]; pos[i] = pos[j]; pos[j] = t; }
            const set = {}; pos.slice(0, k).forEach(q => { set[q] = 1; });
            for (let c = 0; c < 5; c++) mid.push(set[c] ? card : Math.floor(r() * 8));
            const C = cnt(mid), mx = Math.max.apply(null, C);
            if (k === 0 ? mx <= 2 : (C[card] === k && C.filter(x => x >= 3).length === 1)) {
                const g = mid.map(v => [Math.floor(r() * 8), v, Math.floor(r() * 8)]);
                return { grid: g, k, card: k ? card : -1 };
            }
        }
        return k ? slOut(uid, n + 1000003) : { grid: [[0, 0, 1], [1, 2, 3], [2, 3, 4], [3, 4, 5], [4, 5, 6]], k: 0, card: -1 };
    }
    H.slotSpin = async (data, uid) => {
        const bet = Math.floor(Number(data.bet));
        if (SL_BETS.indexOf(bet) < 0) fail('INVALID');
        const u0 = await getUserDoc(uid); assertActive(u0);
        await db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); const u = uS.data();
            if ((u.diamonds || 0) < bet) fail('INSUFFICIENT_DIAMONDS');
            return applyDelta(t, uid, u, { dia: -bet, title: 'Slot bet', txType: 'spend' });
        });
        let n = 0;
        await FB.rtdb.ref(LIVE + '/slot/users/' + uid + '/n').transaction(v => { n = (v || 0); return n + 1; });
        const o = slOut(uid, n), win = o.k ? bet * o.k : 0;
        let balance = ((await userRef(uid).get()).data() || {}).diamonds || 0;
        if (win > 0) balance = await db().runTransaction(async t => {
            const uS = await t.get(userRef(uid));
            return applyDelta(t, uid, uS.data(), { dia: win, title: 'Slot win', txType: 'reward' }).diamonds;
        });
        return { ok: true, grid: o.grid, k: o.k, card: o.card, win, bet, balance, n };
    };

    /* ═══════════ গেম: Fruit Jackpot (jackpot/) ═══════════
       ৮ ফল (চেরি x40, তরমুজ x20, কলা/স্ট্রবেরি x10, বাকি x5)। রাউন্ড ৩৪ সেকেন্ড: ২০ বাজি + ৪.৫ আলো ঘোরা + ফল।
       ২০–৫০ রাউন্ড পর পর জ্যাকপট স্লট: x2/x3 = জেতা ফলের গুণ বাড়ে · +1/+2/+3 = বাড়তি ১/২/৩টা ফলও জেতে · JJ = জেতা ফলের গুণ ৫/৭/১০।
       🔒 নিচের jMb…jOut অংশ jackpot/jackpot.js-এর (mb…jOut) সাথে হুবহু একই রাখতে হবে। */
    var JK = { EPOCH: 1700000000000, ROUND: 34000, BET: 20000, SPIN: 4500 };
    var JODDS = [5, 5, 5, 5, 10, 10, 20, 40], JWT = [22, 22, 22, 22, 10, 10, 4, 2], JSYMS = ['x2', 'x3', 'jj', 'p1', 'p2', 'p3'];
    function jMb(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function jHasBonus(idx){ var B = 35, b = Math.floor(idx / B), pos = idx - b * B, off = Math.floor(jMb(b * 7757 + 13)() * 15); return pos === off; }
    function jOut(idx){
      var h = jMb(idx * 2654435 + 90210); h(); h();
      var x = h() * 114, f = 0, acc = 0, i;
      for (i = 0; i < 8; i++){ acc += JWT[i]; if (x < acc){ f = i; break; } }
      var o = { fruit: f, bonus: null, mult: 1, extra: [], reels: ['jj', 'jj', 'jj'], has: false };
      if (!jHasBonus(idx)) return o;
      o.has = true;
      var t = h(), ty = t < .12 ? 'n' : t < .42 ? 'x2' : t < .58 ? 'x3' : t < .72 ? 'p1' : t < .82 ? 'p2' : t < .88 ? 'p3' : 'jj';
      var jm = [5, 7, 10][Math.floor(h() * 3)];
      o.bonus = ty;
      if (ty === 'n'){
        var a = JSYMS[Math.floor(h() * 6)], b = JSYMS[Math.floor(h() * 6)], c = JSYMS[Math.floor(h() * 6)];
        if (a === b && b === c) c = JSYMS[(JSYMS.indexOf(c) + 1) % 6];
        o.reels = [a, b, c];
      } else o.reels = [ty, ty, ty];
      if (ty === 'x2') o.mult = 2; else if (ty === 'x3') o.mult = 3; else if (ty === 'jj') o.mult = jm;
      else if (ty.charAt(0) === 'p'){ var n = Number(ty.charAt(1)); while (o.extra.length < n){ var e = Math.floor(h() * 8); if (e !== f && o.extra.indexOf(e) < 0) o.extra.push(e); } }
      return o;
    }
    function jPopup(o){ return o.has ? 29800 : 25200; }
    function jInfo(){ var el = Date.now() - JK.EPOCH, idx = Math.floor(el / JK.ROUND), into = el % JK.ROUND; return { idx: idx, into: into, phase: into < JK.BET ? 'BET' : 'POST' }; }
    function jWins(o){ return [o.fruit].concat(o.extra); }

    H.jackpotBet = async (data, uid) => {
        const idx = Number(data.idx), item = Number(data.item), chip = Number(data.chip);
        if (!Number.isInteger(idx) || !Number.isInteger(item) || item < 0 || item > 7 || !(chip > 0) || chip > 10000000) fail('INVALID');
        const info = jInfo();
        if (info.idx !== idx || info.phase !== 'BET') throw new Error('এখন bet করার সময় নয়');
        const u0 = await getUserDoc(uid); assertActive(u0);
        const bal = await db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); const u = uS.data();
            if ((u.diamonds || 0) < chip) fail('INSUFFICIENT_DIAMONDS');
            return applyDelta(t, uid, u, { dia: -chip, title: 'Fruit Jackpot bet', txType: 'spend' }).diamonds;
        });
        const bref = FB.rtdb.ref(LIVE + '/jackpot/rounds/R' + idx + '/bets/' + uid);
        let mine = null;
        await bref.transaction(v => {
            v = v || { uid, name: u0.name || 'User', photo: u0.photo || '', bets: {} };
            v.bets = v.bets || {}; v.bets[item] = (v.bets[item] || 0) + chip; v.ts = Date.now(); mine = v.bets;
            return v;
        });
        return { ok: true, balance: bal, bets: mine };
    };
    H.jackpotClaim = async (data, uid) => {
        const idx = Number(data.idx); if (!Number.isInteger(idx)) fail('INVALID');
        const info = jInfo(), o = jOut(idx);
        if (idx > info.idx || (idx === info.idx && info.into < jPopup(o))) fail('NOT_READY');
        const wins = jWins(o);
        const bsnap = (await FB.rtdb.ref(LIVE + '/jackpot/rounds/R' + idx + '/bets/' + uid).get()).val();
        const bets = (bsnap && bsnap.bets) || {};
        const cost = Object.keys(bets).reduce((s, k) => s + (Number(bets[k]) || 0), 0);
        const reward = wins.reduce((a, w) => a + (Number(bets[w]) || 0) * JODDS[w] * (w === o.fruit ? o.mult : 1), 0);
        const cl = await FB.rtdb.ref(LIVE + '/jackpot/claims/R' + idx + '/' + uid).transaction(v => (v ? undefined : { ts: Date.now(), amount: reward }));
        let balance = ((await userRef(uid).get()).data() || {}).diamonds || 0;
        if (cl.committed && reward > 0){
            const me = await getUserDoc(uid);
            balance = await db().runTransaction(async t => {
                const uS = await t.get(userRef(uid));
                return applyDelta(t, uid, uS.data(), { dia: reward, title: 'Fruit Jackpot win', txType: 'reward' }).diamonds;
            });
            await FB.rtdb.ref(LIVE + '/jackpot/dailyWins/' + gDay() + '/' + uid).transaction(v => {
                v = v || { amount: 0 }; v.amount = (v.amount || 0) + reward; v.name = me.name || 'User'; v.photo = me.photo || ''; return v;
            });
        }
        return { ok: true, main: o.fruit, bonus: o.has ? o.bonus : null, cost, reward: cl.committed ? reward : 0, balance, already: !cl.committed };
    };

/* ═══════════ গেম: Horse Race (horse/) ═══════════
       ৬ ঘোড়া, গুণ ফিক্সড: ১=2× ২=4× ৩=6× ৪=8× ৫=10× ৬=12× | রাউন্ড ৮৪ সেকেন্ড: ১৫ বাজি + ৬০ রেস (শেষ ১০ সেকেন্ডে বাজি বন্ধ) + ফল
       যেকোনো ২টা ঘোড়ায় বাজি | শুধু বিজয়ী ঘোড়ার ওপর বাজি জেতে (বাজি × গুণ)।
       🔒 নিচের hWinner অংশ horse/horse.js-এর hWinner এর সাথে হুবহু একই রাখতে হবে। */
    var HK = { EPOCH: 1700000000000, ROUND: 84000, PRE: 15000, CLOSE: 65000, FIN: 75000 };
    var HMULT = [2, 4, 6, 8, 10, 12], HWT = [41, 20, 14, 10, 8, 7];
    function hMb(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function hWinner(idx){
      var B = 32, b = Math.floor(idx / B), k = idx - b * B, r = hMb(b * 9973 + 71), prev = -1, w = 0, i, j;
      for (i = 0; i <= k; i++){
        var x = r(), y = r() * 100, acc = 0, f = 0;
        for (j = 0; j < 6; j++){ acc += HWT[j]; if (y < acc){ f = j; break; } }
        w = (prev >= 0 && x < .2) ? prev : f; prev = w;
      }
      return w;
    }
    function hInfo(){ var el = Date.now() - HK.EPOCH, idx = Math.floor(el / HK.ROUND), into = el % HK.ROUND; return { idx: idx, into: into }; }

    H.horseBet = async (data, uid) => {
        const idx = Number(data.idx), item = Number(data.item), chip = Number(data.chip);
        if (!Number.isInteger(idx) || !Number.isInteger(item) || item < 0 || item > 5 || !(chip > 0) || chip > 10000000) fail('INVALID');
        const info = hInfo();
        if (info.idx !== idx || info.into >= HK.CLOSE) throw new Error('এখন বাজি ধরার সময় নয়');
        const u0 = await getUserDoc(uid); assertActive(u0);
        const bal = await db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); const u = uS.data();
            if ((u.diamonds || 0) < chip) fail('INSUFFICIENT_DIAMONDS');
            return applyDelta(t, uid, u, { dia: -chip, title: 'Horse Race bet', txType: 'spend' }).diamonds;
        });
        const bref = FB.rtdb.ref(LIVE + '/horse/rounds/R' + idx + '/bets/' + uid);
        let mine = null, tooMany = false;
        await bref.transaction(v => {
            mine = null; tooMany = false;
            v = v || { uid, name: u0.name || 'User', photo: u0.photo || '', bets: {} };
            v.bets = v.bets || {};
            if (v.bets[item] === undefined && Object.keys(v.bets).length >= 2){ tooMany = true; return; }
            v.bets[item] = (v.bets[item] || 0) + chip; v.ts = Date.now(); mine = v.bets;
            return v;
        });
        if (tooMany || !mine){
            await db().runTransaction(async t => {
                const uS = await t.get(userRef(uid));
                return applyDelta(t, uid, uS.data(), { dia: chip, title: 'Horse Race refund', txType: 'reward' }).diamonds;
            });
            throw new Error('সর্বোচ্চ ২টা ঘোড়ায় বাজি ধরা যায়');
        }
        return { ok: true, balance: bal, bets: mine };
    };
    H.horseClaim = async (data, uid) => {
        const idx = Number(data.idx); if (!Number.isInteger(idx)) fail('INVALID');
        const info = hInfo();
        if (idx > info.idx || (idx === info.idx && info.into < HK.FIN)) fail('NOT_READY');
        const w = hWinner(idx);
        const bsnap = (await FB.rtdb.ref(LIVE + '/horse/rounds/R' + idx + '/bets/' + uid).get()).val();
        const bets = (bsnap && bsnap.bets) || {};
        const cost = Object.keys(bets).reduce((s, k) => s + (Number(bets[k]) || 0), 0);
        const reward = (Number(bets[w]) || 0) * HMULT[w];
        const cl = await FB.rtdb.ref(LIVE + '/horse/claims/R' + idx + '/' + uid).transaction(v => (v ? undefined : { ts: Date.now(), amount: reward }));
        let balance = ((await userRef(uid).get()).data() || {}).diamonds || 0;
        if (cl.committed && reward > 0){
            const me = await getUserDoc(uid);
            balance = await db().runTransaction(async t => {
                const uS = await t.get(userRef(uid));
                return applyDelta(t, uid, uS.data(), { dia: reward, title: 'Horse Race win', txType: 'reward' }).diamonds;
            });
            await FB.rtdb.ref(LIVE + '/horse/dailyWins/' + gDay() + '/' + uid).transaction(v => {
                v = v || { amount: 0 }; v.amount = (v.amount || 0) + reward; v.name = me.name || 'User'; v.photo = me.photo || ''; return v;
            });
        }
        return { ok: true, winner: w, cost, reward: cl.committed ? reward : 0, balance, already: !cl.committed };
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

    /* Friend/Sister/Brother বন্ডের লেভেল 💎 */
    H.relBoost = async (data, uid) => {
        const amount = Math.floor(Number(data.amount)), to = String(data.to || '');
        if (!(amount >= 100 && amount <= 100000)) fail('INVALID');
        const frs = relGet('moi_rel_fr', {}), rec = frs[pairKey(uid, to)]; if (!rec) throw new Error('এই বন্ড নেই');
        const me = await getUserDoc(uid); assertActive(me);
        const bal = await db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); const u = uS.data();
            if ((u.diamonds || 0) < amount) fail('INSUFFICIENT_DIAMONDS');
            return applyDelta(t, uid, u, { dia: -amount, title: 'Bond level up', txType: 'spend' }).diamonds;
        });
        rec.pts = (rec.pts || 0) + amount; relSet('moi_rel_fr', frs);
        return { ok: true, pts: rec.pts, balance: bal };
    };

    /* ═══════════ CP: লেভেলের 💎 জমানো ও CP ভাঙা ═══════════ */
    const cpFind = uid => { const c = relGet('moi_rel_cp', {}); for (const k in c) if (c[k].a === uid || c[k].b === uid) return { key: k, c, rec: c[k] }; return null; };
    H.cpBoost = async (data, uid) => {
        const amount = Math.floor(Number(data.amount));
        if (!(amount >= 10 && amount <= 100000)) fail('INVALID');
        const f = cpFind(uid); if (!f) throw new Error('আপনার CP নেই');
        const me = await getUserDoc(uid); assertActive(me);
        const bal = await db().runTransaction(async t => {
            const uS = await t.get(userRef(uid)); const u = uS.data();
            if ((u.diamonds || 0) < amount) fail('INSUFFICIENT_DIAMONDS');
            return applyDelta(t, uid, u, { dia: -amount, title: 'CP level up', txType: 'spend' }).diamonds;
        });
        f.rec.pts = (f.rec.pts || 0) + amount; relSet('moi_rel_cp', f.c);
        return { ok: true, pts: f.rec.pts, balance: bal };
    };
    /* CP ভাঙা: চাপলে ২ ঘণ্টার কাউন্টডাউন শুরু; সময়ের ভিতরে বাতিল করা যায়; শেষ হলে CP মুছে যায় */
    H.cpBreak = async (data, uid) => {
        const f = cpFind(uid); if (!f) throw new Error('আপনার CP নেই');
        if (!f.rec.brk) { f.rec.brk = Date.now() + 2 * 3600 * 1000; relSet('moi_rel_cp', f.c); }
        return { ok: true, brk: f.rec.brk };
    };
    H.cpBreakCancel = async (data, uid) => {
        const f = cpFind(uid); if (!f) throw new Error('আপনার CP নেই');
        delete f.rec.brk; relSet('moi_rel_cp', f.c);
        return { ok: true };
    };
    H.cpBreakDone = async (data, uid) => {
        const f = cpFind(uid); if (!f) return { ok: true };
        if (f.rec.brk && f.rec.brk <= Date.now()) { delete f.c[f.key]; relSet('moi_rel_cp', f.c); }
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
