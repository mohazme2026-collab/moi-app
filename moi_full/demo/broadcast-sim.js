/* demo/broadcast-sim.js — ডেমোর বটরা সত্যিকারের কাজ করে: বিভিন্ন রুমে গিফট দেয়, লাকি বক্স ছাড়ে, গেমে জেতে
   → সঙ্গে সঙ্গে সব পেজের উপরে ব্যানার আসে, ট্যাপ করলে ওই রুমে যাওয়া যায়, আর ঢুকে দেখা যায় জিনিসটা সত্যিই আছে:
     • গিফট  : ওই রুমের চ্যাটে বার্তা, সিটের কয়েন বাড়া, গিফট-ইতিহাস
     • লাকি বক্স : ওই রুমে বক্স বসে (টাইমার শেষে Open করা যায়)
     • গেম  : গেমের প্রতি রাউন্ডের রেজাল্টে যে টপ জয়ী (গেমের Win List-এর ১ নম্বর), ঠিক সেই নাম ও সংখ্যা ব্যানারে আসে
   (আসল ডেটাবেস ফেরত আনলে এই ফাইল বাদ — তখন আসল মানুষের ঘটনা থেকেই ব্যানার আসবে)
   ⚙️ কনসোলে নিজে চেক: MOIBots.fire('gift') | MOIBots.fire('lucky') | MOIBots.fire('game') */
(function(){
    'use strict';
    if (window.top !== window || !window.MOIBroadcast || !window.DEMO || !window.__MOCK) return;
    const BC = window.MOIBroadcast, D = window.DEMO, M = window.__MOCK;
    const rooms = D.ROOMS || []; if (!rooms.length) return;

    /* ═══ ⚙️ সেটিংস ═══ */
    const EVERY_SEC = [14, 28];                 /* কত সেকেন্ড পরপর একটা ঘটনা (ন্যূনতম, সর্বোচ্চ) */
    const FIRST_SEC = 5;                        /* পেজ খোলার কত সেকেন্ড পর প্রথমটা */
    const PLAN = ['gift', 'lucky', 'gift', 'gift', 'lucky', 'gift'];   /* ক্রম অনুযায়ী: গিফট ও লাকি বক্স পালা করে (লাকি বক্স নিয়মিত আসবে) */
    const GAME_BANNER_MIN = 1000;               /* রাউন্ডের টপ জয়ী এর কম জিতলে ব্যানার নয় (💎) */
    const GAME_BANNER_GAP_SEC = 75;             /* দুই গেম-ব্যানারের মাঝে কমপক্ষে এত সেকেন্ড */
    const LUCKY_TOTALS = [100, 500, 1000, 2000, 5000, 10000];
    const LUCKY_QTY = [5, 10, 20];
    const LUCKY_TIMER_MIN = 1;                  /* লাকি বক্সের টাইমার (১ মিনিট পর Open করা যায়) */
    const SPEED = Number((new URLSearchParams(location.search)).get('botspeed')) || 1;

    /* গিফটের তালিকা — room/gifts.js এর সাথে একই লিংক ও দাম */
    const GIFTS = [
        { id: 'rose', name: 'ফুল', price: 1, url: 'https://raw.githubusercontent.com/farjanaaktar1173-boop/Gift/88185067b0fbcd2f71506e0ae8b30b94427c996f/rose.json', filter: '', w: 26, q: [1, 1, 3, 5, 10] },
        { id: 'kiss', name: 'চুমু', price: 1, url: 'https://raw.githubusercontent.com/farjanaaktar1173-boop/Gift/5e7a3520d96a28bd05cd5249ff24223022019cac/kiss%20heart.json', filter: '', w: 16, q: [1, 5, 10, 20] },
        { id: 'present', name: 'প্রেজেন্ট পটি', price: 5, url: 'https://raw.githubusercontent.com/farjanaaktar1173-boop/Gift/881e25d092b54ef588413c1c89cbd29c95d35dfa/Present%20poop.json', filter: '', w: 14, q: [1, 5, 10] },
        { id: 'diamond', name: 'ডায়মন্ড', price: 5, url: 'https://raw.githubusercontent.com/farjanaaktar1173-boop/Gift/adf7bc4019f616641b0a2b2e391a4ba705d7eabb/gift%20(Diamond).json', filter: '', w: 12, q: [1, 5, 10, 20] },
        { id: 'cake', name: 'কেক', price: 10, url: 'https://raw.githubusercontent.com/farjanaaktar1173-boop/Gift/43f9fccc28fd603902525a0caadbe28e4344f2e0/%230101J_S_07.json', filter: '', w: 14, q: [1, 5, 10, 20] },
        { id: 'treasure', name: 'গোল্ড বক্স', price: 15, url: 'https://raw.githubusercontent.com/farjanaaktar1173-boop/Gift/92930e19f61b4e877ff1829552d75068b3d7bea4/Treasure%20Chest.json', filter: '', w: 10, q: [1, 10, 20, 66] },
        { id: 'diamond_v3', name: 'ডায়মন্ড প্লাটিনাম', price: 10, url: 'https://raw.githubusercontent.com/farjanaaktar1173-boop/Gift/adf7bc4019f616641b0a2b2e391a4ba705d7eabb/gift%20(Diamond).json', filter: 'Pillow|Layer 1|shadow', w: 8, q: [1, 10, 66, 99] }
    ];
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const wpick = list => { const tot = list.reduce((s, x) => s + (x.w || x[1]), 0); let r = Math.random() * tot; for (const x of list){ r -= (x.w || x[1]); if (r <= 0) return x; } return list[0]; };
    const LIVE = () => window.MOIFB.LIVE, fs = () => window.MOIFB.db, rtdb = () => window.MOIFB.rtdb;
    const LOCK = 'moi_bc_bot_last';

    /* একাধিক ট্যাব/পেজ খোলা থাকলে একই সময়ে দুইটা ঘটনা না হয় */
    function canRun(){
        try { const t = +localStorage.getItem(LOCK) || 0; if (Date.now() - t < 5000) return false; localStorage.setItem(LOCK, String(Date.now())); } catch(e){}
        return true;
    }
    const asOf = u => ({ uid: u.uid, name: u.name, photo: u.photo });
    function pickRoom(){
        const cur = BC.currentRoomId();
        const list = rooms.filter(r => r.id !== cur);
        return pick(list.length ? list : rooms);
    }
    function seatsOf(R){
        const v = M.rtGet(LIVE() + '/rooms/' + R.id + '/seats') || {};
        return Object.keys(v).map(i => ({ i: +i, uid: v[i] && v[i].uid })).filter(x => x.uid && D.USERS[x.uid]);
    }

    /* ১) আসল গিফট: লাইভ গিফট + সিটের কয়েন + গিফট-ইতিহাস + চ্যাটে বার্তা, তারপর ব্যানার */
    function fireGift(){
        const R = pickRoom(), seats = seatsOf(R); if (!seats.length) return;
        const target = pick(seats);
        const pool = R.seatUids.concat(R.audUids).filter(u => u !== target.uid && D.USERS[u]); if (!pool.length) return;
        const su = D.USERS[pick(pool)], tu = D.USERS[target.uid];
        const g = wpick(GIFTS), qty = pick(g.q), total = g.price * qty, ts = Date.now();
        const base = LIVE() + '/rooms/' + R.id;
        rtdb().ref(base + '/liveGifts').push({ senderUid: su.uid, targetUids: [tu.uid], giftId: g.id, qty, ts });
        rtdb().ref(base + '/giftStats/' + tu.uid).update({ uid: tu.uid, name: tu.name, avatar: tu.photo });
        rtdb().ref(base + '/giftStats/' + tu.uid + '/history').push({ amount: total, ts });
        rtdb().ref(base + '/seats/' + target.i + '/coins').transaction(v => (v || 0) + total);
        const id = 'bot_g_' + ts + '_' + Math.random().toString(36).slice(2, 6);
        fs().collection('rooms/' + R.id + '/messages').doc(id).set({
            id, type: 'gift', uid: su.uid, senderUid: su.uid, name: su.name, senderName: su.name, avatar: su.photo,
            text: '💎 ' + g.name + ' × ' + qty + ' → ' + tu.name, giftMeta: { giftId: g.id, qty, targetUids: [tu.uid] }, ts
        });
        if (total < BC.CONFIG.MIN_GIFT) return;
        BC.publish({ as: asOf(su), type: 'gift', amount: total, qty, giftId: g.id, giftName: g.name, giftUrl: g.url, giftFilter: g.filter,
            toName: tu.name, toPhoto: tu.photo, toCount: 1, roomId: R.id, roomName: R.name });
    }

    /* ২) আসল লাকি বক্স: রুমের মালিক বট বক্স ছাড়ে (আসল createLuckyBox এর মতোই ফরম্যাট) */
    function fireLucky(){
        const R = pickRoom(), owner = D.USERS[R.ownerUid]; if (!owner) return;
        const total = pick(LUCKY_TOTALS), qty = pick(LUCKY_QTY), tax = Math.floor(total * 0.05), pool = total - tax, now = Date.now();
        const box = { id: 'lb_' + now + '_' + rnd(100, 999), senderUid: owner.uid, senderName: owner.name, senderAvatar: owner.photo || '',
            total, tax, pool, qty, timerMin: LUCKY_TIMER_MIN, startedAt: now, expiresAt: now + LUCKY_TIMER_MIN * 60000, createdAt: now };
        rtdb().ref(LIVE() + '/rooms/' + R.id + '/luckybox/' + box.id).set(box);
        BC.publish({ as: asOf(owner), type: 'lucky', amount: pool, roomId: R.id, roomName: R.name });
    }

    /* ৩) আসল গেম জয়: গেমের নিজের হিসাব হুবহু একই (game-config/game-demo এর মতো) —
          রাউন্ডের রেজাল্টে যে টপ জয়ী, ব্যানারে সেই নাম, সেই 💎 সংখ্যা, আর সে যে রুমে আছে সেই রুম */
    const G = { EPOCH: 1700000000000, ROUND: 30000, BET: 23000, SPIN: 2000, MAX: 1300, MULT: [45, 25, 15, 10, 5, 5, 5, 5], CHIPS: [1, 5, 10, 100] };
    function gWin(roundNumber){
        let seed = (roundNumber * 9301 + 49297) % 233280; const r1 = seed / 233280;
        seed = (seed * 9301 + 49297) % 233280; const r2 = seed / 233280;
        let r = ((r1 + r2) / 2) * 200; const w = [4, 10, 18, 28, 35, 35, 35, 35];
        for (let i = 0; i < w.length; i++){ r -= w[i]; if (r <= 0) return i; }
        return 7;
    }
    function gRng(seed){ let s = (seed >>> 0) % 2147483647 || 1; return () => (s = s * 48271 % 2147483647) / 2147483647; }
    function gBets(roundIdx){
        const U = Object.values(D.USERS || {}).filter(u => u && u.name), P = U.length >= 10 ? U.slice(0, 40) : [];
        if (!P.length) return {};
        const r = gRng(roundIdx * 7919 + 13), out = {}, n = 6 + Math.floor(r() * 5);
        for (let k = 0; k < n; k++){
            const u = P[Math.floor(r() * P.length)], bets = {}, spots = 1 + Math.floor(r() * 3);
            for (let s = 0; s < spots; s++){
                const item = Math.floor(r() * 8), chip = G.CHIPS[Math.floor(r() * 4)];
                bets[item] = (bets[item] || 0) + chip * (1 + Math.floor(r() * 4));
            }
            out[u.uid] = { uid: u.uid, name: u.name, photo: u.photo || '', bets };
        }
        return out;
    }
    function roundTop(roundIdx){
        const roundNumber = (roundIdx % G.MAX) + 1, win = gWin(roundNumber), bets = gBets(roundIdx);
        let top = null;
        Object.values(bets).forEach(u => { const amt = (u.bets[win] || 0); if (amt > 0 && (!top || amt > top.amt)) top = { u, amt }; });
        return top && { u: top.u, amount: top.amt * G.MULT[win], roundNumber };
    }
    function roomOfUser(uid){
        const R = rooms.find(r => r.seatUids.includes(uid) || r.audUids.includes(uid));
        return R || pick(rooms);
    }
    function announceRound(roundIdx, force){
        const top = roundTop(roundIdx); if (!top) return false;
        if (!force && top.amount < GAME_BANNER_MIN) return false;
        const R = roomOfUser(top.u.uid);
        BC.publish({ as: asOf(top.u), type: 'game', amount: top.amount, round: top.roundNumber, roomId: R.id, roomName: R.name });
        return true;
    }
    function gameWatch(){
        setInterval(() => {
            if (document.hidden) return;
            const el = Date.now() - G.EPOCH, idx = Math.floor(el / G.ROUND), into = el % G.ROUND;
            if (into < G.BET + G.SPIN) return;                       /* রেজাল্ট দেখানোর সময় হয়নি */
            let last = 0, lastTs = 0;
            try { last = +localStorage.getItem('moi_bc_game_round') || 0; lastTs = +localStorage.getItem('moi_bc_game_ts') || 0; } catch(e){}
            if (idx <= last) return;                                   /* এই রাউন্ড আগেই দেখা হয়েছে (অন্য ট্যাবেও) */
            try { localStorage.setItem('moi_bc_game_round', String(idx)); } catch(e){}
            if (Date.now() - lastTs < GAME_BANNER_GAP_SEC * 1000 / SPEED) return;
            if (announceRound(idx)){ try { localStorage.setItem('moi_bc_game_ts', String(Date.now())); } catch(e){} }
        }, 1000);
    }

    function fire(kind){
        try {
            if (kind === 'lucky') fireLucky();
            else if (kind === 'game'){            /* চেকের জন্য: সবচেয়ে শেষ হওয়া রাউন্ডের টপ জয়ী */
                const el = Date.now() - G.EPOCH, idx = Math.floor(el / G.ROUND), into = el % G.ROUND;
                announceRound(into >= G.BET + G.SPIN ? idx : idx - 1, true);
            } else fireGift();
        } catch(e){ console.warn('[bots]', e); }
    }
    let planIdx = 0;
    function step(){ const k = PLAN[planIdx++ % PLAN.length]; fire(k); }
    function loop(){
        setTimeout(() => { if (!document.hidden && canRun()) step(); loop(); }, rnd(EVERY_SEC[0], EVERY_SEC[1]) * 1000 / SPEED);
    }
    function start(n){
        if (!window.MOIFB || !MOIFB.rtdb || !(window.MOIAuth && MOIAuth.profile)){ if (n < 80) setTimeout(() => start(n + 1), 250); return; }
        window.MOIBots = { fire, roundTop };
        gameWatch();
        setTimeout(() => { if (!document.hidden && canRun()) step(); loop(); }, FIRST_SEC * 1000 / SPEED);
    }
    start(0);
})();
