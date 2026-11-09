/* shared/broadcast-core.js — সব রুমের উপরে দেখানো পপআপের ডেটা
   কেউ বড় গিফট দিলে, লাকি বক্স ছাড়লে বা গেমে বড় জিতলে এখান থেকে সবার জন্য "ঘোষণা" যায়।
   (ডেমোতে ডেটা রিয়েলটাইম ডেটাবেসের  moi-live/broadcast  পথে থাকে) */
(function(){
    'use strict';
    if (window.MOIBroadcast) return;

    /* ⚙️ কখন পপআপ যাবে — এখানে বদলানো যায় */
    const CONFIG = {
        MIN_GIFT: 1,            /* এর কম দামের গিফটে পপআপ নয় (💎) — ১ মানে সব আসল গিফট দেখাবে, বেশি স্প্যাম লাগলে বাড়ান */
        MIN_GAME: 100,          /* গেমে এর কম জিতলে পপআপ নয় (💎) */
        RED_GAME: 1000000,      /* এর বেশি জিতলে লাল রঙের বিশেষ পপআপ */
        KEEP_MS: 120000         /* পুরনো ঘোষণা এত সময় পরে মুছে যায় */
    };

    const FB = () => window.MOIFB;
    const path = () => FB().LIVE + '/broadcast';
    const prof = () => (window.MOIAuth && MOIAuth.profile) || null;

    function currentRoomId(){
        try { if (/\/room\//.test(location.pathname) && window.ROOM_ID) return String(window.ROOM_ID); } catch(e){}
        return '';
    }
    async function roomNameOf(id){
        if (!id) return '';
        try {
            if (window.state && state.roomName && id === currentRoomId()) return state.roomName;
            const s = await FB().db.collection('rooms').doc(id).get();
            return (s.exists && s.data().name) || ('Room ' + id);
        } catch(e){ return 'Room ' + id; }
    }

    /* ঘোষণা পাঠানো — ev: { type:'gift'|'lucky'|'game', amount, qty, icon, roomId, as:{uid,name,photo} } */
    async function publish(ev){
        if (!FB() || !FB().rtdb) return false;
        const p = ev.as || prof(); if (!p || !p.uid) return false;
        const roomId = ev.roomId || currentRoomId();
        const rec = {
            type: ev.type, uid: p.uid, name: p.name || 'User', photo: p.photo || '',
            roomId: roomId, roomName: ev.roomName || await roomNameOf(roomId),
            amount: Math.round(Number(ev.amount) || 0), qty: Number(ev.qty) || 1, icon: ev.icon || '',
            ts: Date.now()
        };
        /* গিফটের ছবি (Lottie লিংক), গিফটের নাম ও যে পেয়েছে তার তথ্য — শুধু থাকলেই বসে */
        ['giftId', 'giftName', 'giftUrl', 'giftFilter', 'toName', 'toPhoto'].forEach(k => { if (ev[k]) rec[k] = String(ev[k]); });
        if (ev.toCount) rec.toCount = Number(ev.toCount) || 1;
        if (ev.round) rec.round = Number(ev.round) || 0;
        try { await FB().rtdb.ref(path()).push(rec); } catch(e){ return false; }
        prune();
        return true;
    }
    let lastPrune = 0;
    function prune(){
        const now = Date.now(); if (now - lastPrune < 30000) return; lastPrune = now;
        FB().rtdb.ref(path()).get().then(s => {
            const v = s.val() || {};
            Object.keys(v).forEach(k => { if (now - (v[k].ts || 0) > CONFIG.KEEP_MS) FB().rtdb.ref(path() + '/' + k).remove(); });
        }).catch(() => {});
    }

    /* ঘোষণা শোনা — নতুন কিছু এলে cb(key, ev) */
    function subscribe(cb){
        const seen = {};
        FB().rtdb.ref(path()).orderByChild('ts').startAt(Date.now() - 1500).on('child_added', snap => {
            if (seen[snap.key]) return; seen[snap.key] = 1;
            const v = snap.val(); if (v && v.type) cb(snap.key, v);
        });
    }

    function goRoom(id){ location.href = new URL('../room/index.html?room=' + encodeURIComponent(id), location.href).href; }

    /* ─ সহজ ফাংশন: যেখানে ঘটনা ঘটে সেখান থেকে ডাকা হয় ─ */
    function gift(g, targets, qty, total){
        if (total < CONFIG.MIN_GIFT) return;
        targets = targets || [];
        const t0 = targets[0] || {};
        publish({
            type: 'gift', amount: total, qty: qty,
            giftId: g && g.id, giftName: g && g.name, giftUrl: g && g.url,
            giftFilter: ((g && g.filter) || []).join('|'),
            toName: t0.name || '', toPhoto: t0.avatar || t0.photo || '', toCount: targets.length || 1
        });
    }
    function lucky(box){ publish({ type: 'lucky', amount: (box && (box.pool || box.total)) || 0 }); }
    function game(reward, roomId){ if (reward >= CONFIG.MIN_GAME) publish({ type: 'game', amount: reward, roomId: roomId }); }

    /* চেক করার জন্য: কনসোলে MOIBroadcast.test('gift' | 'lucky' | 'game' | 'bigwin') */
    function test(kind){
        const rid = currentRoomId() || ((window.DEMO && DEMO.ROOMS && DEMO.ROOMS[2] && DEMO.ROOMS[2].id) || '');
        const map = { gift: { type: 'gift', amount: 1000, qty: 10, icon: '🎁' }, lucky: { type: 'lucky', amount: 8000 },
                      game: { type: 'game', amount: 105000 }, bigwin: { type: 'game', amount: 1950000 } };
        return publish(Object.assign({ roomId: rid }, map[kind] || map.gift));
    }

    window.MOIBroadcast = { CONFIG, publish, subscribe, goRoom, currentRoomId, roomNameOf, gift, lucky, game, test };
})();
