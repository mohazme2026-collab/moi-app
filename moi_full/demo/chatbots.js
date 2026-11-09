/* demo/chatbots.js — ডেমো বন্ধু (বট): মেসেজ করলে কেমন লাগে দেখার জন্য
   • ৩ জন ডেমো বন্ধু (Rafi · Nila · Sumon) আপনার বন্ধু তালিকায় থাকে
   • প্রথমবার চ্যাট খুললে তারা আপনাকে মেসেজ পাঠায় (unread ব্যাজ সহ)
   • আপনি মেসেজ করলে কয়েক সেকেন্ড পরে তারা উত্তর দেয়
   • চ্যাট লিস্টে থাকলে একটু পরে একজন নতুন মেসেজও পাঠায়
   (শুধু ডেমো — পরে আসল Firebase ফেরত আনলে এই ফাইল বাদ দিলেই হবে) */
(function(){
    'use strict';
    const FB = window.MOIFB;
    if (!FB || !FB.DEMO) return;
    /* চ্যাট iframe-এর ভিতরে চালাব না — বাইরের পেজ (Home/Me/Room) বা সরাসরি খোলা চ্যাট পেজই সব সামলায় */
    if (window.top !== window) return;
    const SY = () => window.MOISync;
    const ls_get = (k, fb) => SY().get(k, fb);
    const ls_set = (k, v) => SY().set(k, v);
    const getMe = () => { if (window.me && window.me.uid) return window.me; const p = window.MOIAuth && MOIAuth.profile; return p && p.uid ? p : null; };
    /* কোন বন্ধুর চ্যাট এখন খোলা আছে (নিজের পেজে বা iframe-এ) */
    const openUid = () => {
        if (window.currentChatUid) return window.currentChatUid;
        try { for (const f of document.querySelectorAll('iframe')){ const u = f.contentWindow && f.contentWindow.currentChatUid; if (u) return u; } } catch(e){}
        return null;
    };

    function avatar(name, c1, c2){
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#fff">' + name.charAt(0) + '</text></svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }
    const BOTS = [
        { uid: 'demofriend1', moiId: '100901', name: 'Rafi',  gender: 'Male',   c: ['#ff7a8a', '#8b5cf6'],
          hello: ['আসসালামু আলাইকুম! কেমন আছো? 😊', 'রুমে আসবে? আজ গান হচ্ছে 🎶'],
          nudge: 'ভাই, অনলাইনে আছো? একটা কথা ছিল 👋',
          reply: ['হ্যাঁ, বলো 😊', 'দারুণ! আরও বলো', 'হা হা 😂 ঠিক বলেছো', 'আমি এখন রুমে আছি, চলে আসো 🎧', 'ঠিক আছে 👍'] },
        { uid: 'demofriend2', moiId: '100902', name: 'Nila',  gender: 'Female', c: ['#20e3b2', '#00b4ff'],
          hello: ['হাই! নতুন বন্ধু পেয়ে ভালো লাগলো 💛', 'তোমার প্রোফাইলটা সুন্দর!'],
          nudge: 'কী করছো? আজ রুমে আড্ডা দিবে? 🌙',
          reply: ['ওহ, সত্যি? 😍', 'আমারও তাই মনে হয়!', 'তারপর কী হলো?', 'খুব মজা পেলাম 😄', 'আচ্ছা, পরে কথা হবে 💛'] },
        { uid: 'demofriend3', moiId: '100903', name: 'Sumon', gender: 'Male',   c: ['#f0b429', '#ff6a3d'],
          hello: ['ভাই, গিফট পাঠিয়েছিলে? ধন্যবাদ 🎁', 'কখন অনলাইনে থাকো?'],
          nudge: 'আজকের লাকি বক্স দেখেছো? 🎉',
          reply: ['আরে বাহ! 🔥', 'হ্যাঁ ভাই, অবশ্যই', 'চিন্তা নেই, আমি আছি 😎', 'একটু পরে ফোন করছি 📞', 'ওকে ভাই 🤝'] }
    ];
    const rid = (a, b) => [a, b].sort().join('__');
    const hhmm = ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    function post(me, bot, text, ts){
        const id = 'm_' + ts + '_' + Math.random().toString(36).slice(2, 6), room = rid(me.uid, bot.uid);
        FB.db.collection('chats/' + room + '/messages').doc(id).set({
            id, type: 'text', content: text, senderUid: bot.uid, senderName: bot.name, time: hhmm(ts), ts, delivered: true, createdAt: FB.TS()
        });
        FB.db.collection('chats').doc(room).set({ participants: [me.uid, bot.uid], updatedAt: FB.TS() }, { merge: true });
    }
    function bumpMeta(me, bot, text, ts){
        const metas = ls_get('moi_chat_meta_' + me.uid, {}) || {};
        const m = metas[bot.uid] || {};
        const open = openUid() === bot.uid;
        metas[bot.uid] = Object.assign({}, m, { lastMessage: text, lastTime: ts, lastSender: bot.uid, lastType: 'text', unread: open ? 0 : (m.unread || 0) + 1 });
        ls_set('moi_chat_meta_' + me.uid, metas);
    }
    function botSay(me, bot, text){ const ts = Date.now(); post(me, bot, text, ts); bumpMeta(me, bot, text, ts); }

    function ensureUsers(){
        BOTS.forEach(b => {
            FB.db.collection('users').doc(b.uid).set({
                uid: b.uid, moiId: b.moiId, name: b.name, photo: avatar(b.name, b.c[0], b.c[1]), bio: 'ডেমো বন্ধু', country: 'Bangladesh', gender: b.gender,
                birthday: '', voice: '', role: 'user', isGuest: false, badges: [], crown: '', ownedCrowns: [], frame: 'basic', diamonds: 5000, level: 5, xp: 600,
                giftsSent: 0, giftsReceived: 0, myRoomUid: '', myRoomId: '', distributorId: null, isBanned: false, banReason: null, banExpiresAt: null,
                profileComplete: true, lastSeen: FB.TS()
            }, { merge: true });
            FB.db.collection('moiIds').doc(b.moiId).set({ uid: b.uid });
        });
    }

    function start(me){
        ensureUsers();
        /* বন্ধু তালিকায় ৩ জন যোগ */
        const fr = ls_get('moi_friends_' + me.uid, {}) || {};
        let changed = false;
        BOTS.forEach(b => { if (!fr[b.uid]){ fr[b.uid] = true; changed = true; } });
        if (changed) ls_set('moi_friends_' + me.uid, fr);

        /* প্রথমবার: হ্যালো মেসেজ */
        FB.db.collection('demoBots').doc(me.uid).get().then(snap => {
            if (snap.exists) return;
            const t0 = Date.now(), metas = ls_get('moi_chat_meta_' + me.uid, {}) || {};
            BOTS.forEach((b, bi) => {
                let ts = t0 - (BOTS.length - bi) * 3600e3, last = '';
                b.hello.forEach(text => { ts += 60e3; post(me, b, text, ts); last = text; });
                metas[b.uid] = { lastMessage: last, lastTime: ts, lastSender: b.uid, lastType: 'text', unread: b.hello.length };
            });
            ls_set('moi_chat_meta_' + me.uid, metas);
            FB.db.collection('demoBots').doc(me.uid).set({ done: true });
        });

        /* আপনি মেসেজ করলে উত্তর */
        const handled = {}, counter = {};
        BOTS.forEach(b => { handled[b.uid] = Date.now(); counter[b.uid] = 0; });
        window.addEventListener('moi:sync', e => {
            const k = (e.detail && e.detail.key) || '';
            BOTS.forEach(b => {
                if (k !== 'moi_chat_' + rid(me.uid, b.uid)) return;
                const list = ls_get(k, []) || [];
                const mine = list.filter(m => m && m.senderUid === me.uid && m.ts > handled[b.uid]);
                if (!mine.length) return;
                handled[b.uid] = mine[mine.length - 1].ts;
                const text = b.reply[counter[b.uid]++ % b.reply.length];
                setTimeout(() => botSay(me, b, text), 1300 + Math.random() * 1700);
            });
        });

        /* বাইরে থাকলেও মাঝে মাঝে একজন মেসেজ পাঠায় — যাতে চ্যাট বাটনের লাল সংখ্যা দেখা যায় */
        BOTS.forEach(b => ls_get('moi_chat_' + rid(me.uid, b.uid), []));
        let sentNudges = 0;
        const nudge = () => {
            if (sentNudges >= 6) return;
            const cand = BOTS.filter(b => openUid() !== b.uid);
            if (!cand.length) return;
            const b = cand[Math.floor(Math.random() * cand.length)];
            const line = sentNudges === 0 ? b.nudge : b.reply[Math.floor(Math.random() * b.reply.length)];
            sentNudges++; botSay(me, b, line);
        };
        setTimeout(() => { nudge(); setInterval(nudge, 75000); }, 20000);

        /* ডেমো ইউজার আপনাকে বন্ধুর অনুরোধ পাঠায় — নোটিফিকেশন কেমন আসে দেখার জন্য */
        const DU = window.DEMO && window.DEMO.USERS ? window.DEMO.USERS : null;
        if (DU){
            const mineFr = () => ls_get('moi_friends_' + me.uid, {}) || {};
            const ids = Object.keys(DU).filter(u => u !== me.uid && !/^demofriend/.test(u)).slice(0, 2);
            FB.db.collection('demoBots').doc(me.uid).get().then(snap => {
                const done = (snap.exists && snap.data().reqFrom) || [];
                ids.forEach((u, i) => {
                    if (done.indexOf(u) >= 0 || mineFr()[u]) return;
                    setTimeout(() => {
                        const du = DU[u] || {};
                        FB.db.collection('friendRequests/' + me.uid + '/incoming').doc(u).set({
                            fromUid: u, fromName: du.name || 'User', fromPhoto: du.photo || '', ts: Date.now(), since: FB.TS()
                        });
                        FB.db.collection('demoBots').doc(me.uid).set({ reqFrom: done.concat(ids.slice(0, i + 1)) }, { merge: true });
                    }, i === 0 ? 40000 : 110000);
                });
            });
        }
    }

    (function wait(n){
        const m = getMe();
        if (m && SY()) return start(m);
        if (n > 160) return;
        setTimeout(() => wait(n + 1), 250);
    })(0);
})();
