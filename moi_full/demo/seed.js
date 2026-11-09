/* demo/seed.js — ডেমোর ডেটা: ৫টা রুম, রুমে বসা মানুষ, শ্রোতা, মুকুট, চ্যাট, ফলো — সব নকল Firebase-এ ঢোকানো
   ⚙️ বদলাতে চাইলে: নিচের ROOMS ও নামের তালিকা বদলান। ছবি আসে randomuser.me (আসল মানুষের ছবি) — ইন্টারনেট লাগবে। */
console.log('[DEMO] seed.js loaded');
(function(){
'use strict';
const M = window.__MOCK; if (!M) return;
const T = ms => new M.Timestamp(ms);
const NOW = Date.now();

/* ───────── মানুষের তালিকা (১২৫ জন) ───────── */
const FEMALE_FIRST = ['Aisha','Fatima','Layla','Noor','Maryam','Sara','Hana','Yasmin','Zainab','Amira','Lina','Dina','Rania','Salma','Huda','Reem','Jana','Leen','Emma','Olivia','Sophia','Mia','Chloe','Emily','Grace','Hannah','Lily','Ella','Anna','Julia','Siti','Aina','Farah','Dayana','Elif','Zeynep','Camila','Valentina','Sofia','Isabella','Yuki','Mina','Sakura','Anya','Katya','Lucia','Marta','Nora','Jasmine','Chloé','Amber','Zoe','Ivy','Maya','Leyla','Selin','Carla','Elena','Rosa','Alina'];
const MALE_FIRST = ['Omar','Ahmed','Khalid','Yusuf','Hamza','Ali','Ibrahim','Zayed','Faisal','Tariq','Sami','Karim','Bilal','Hassan','Rashid','Adam','Daniel','Ryan','Liam','Noah','Lucas','Ethan','Jack','Leo','Mateo','Rizal','Hafiz','Amir','Emre','Burak','Mehmet','Carlos','Diego','Javier','Marco','Luca','Matteo','Hiroshi','Kenji','Min-jun','Dmitri','Ivan','Oliver','Henry','Jacob','Samuel','Nathan','Tom','Ben','Max','Felix','Jonas','Pierre','Hugo','Andre','Rafael','Joshua','Aaron','Sultan','Majed'];
const LAST = ['Al Mansoori','Hassan','Al Farsi','Smith','Brown','Tan','Lim','Rossi','Silva','Müller','Garcia','Lopez','Kim','Sato','Ivanov','Jones','Taylor','Wilson','Dubois','Yilmaz'];
const STYLE = ['{f} {l}','{f}','{f} 🌸','{f}_{l}','{f} ❤','{f} {l}','{f} ✨','{f}♡','{f} {l}','{f} 🎧'];
const BN = ['ليلى','عمر','نور','سارة','خالد','هند','يوسف','مريم','فيصل','ريم','حمزة','لينا','سلطان','دانة'];
const COUNTRIES = ['UAE','Saudi Arabia','Qatar','Kuwait','Malaysia','Singapore','UK','USA','Canada','Australia','Turkey','Egypt','Italy','Germany','France','Spain','Japan','South Korea','Philippines','Brazil'];
const VIPS = [1,1,1,0,1,1,0,1,1,1,0,1,1,1];   /* কার role = vip (মুকুট এখন ভিডিও-সিস্টেমে — user.crown = মুকুটের আইডি, যেমন 'svip1') */
const FRAMES = ['basic','basic','aurora','basic','flame','basic','ocean','royal','basic','galaxy'];
const BIOS = ['Music lover 🎶','Looking for new friends','Chill & vibes ✨','Stay positive','Music is life 🎧','Good vibes only','Be kind 🌿','','',''];

function mkUser(i0, gender, pass){
    const i = i0 + (pass || 0) * 29;
    const list = gender === 'f' ? FEMALE_FIRST : MALE_FIRST;
    const first = list[i % list.length], last = LAST[(i * 7 + (gender === 'f' ? 3 : 5)) % LAST.length];
    let name = STYLE[(i * 3 + (gender === 'f' ? 1 : 0)) % STYLE.length].replace('{f}', first).replace('{l}', last);
    if (i % 11 === 4) name = BN[(i + (gender === 'f' ? 1 : 3)) % BN.length];
    const idx = i0;                                           /* randomuser পোর্ট্রেটের নম্বর (০–৯৮) */
    const level = 3 + ((i * 13 + (gender === 'f' ? 5 : 11)) % 58);
    return { gender, name, photo: 'https://randomuser.me/api/portraits/' + (gender === 'f' ? 'women' : 'men') + '/' + idx + '.jpg', level };
}
const people = [];
for (let pass = 0; pass < 2; pass++){
    for (let i = 0; i < 99; i++){ people.push(mkUser(i, 'f', pass)); people.push(mkUser(i, 'm', pass)); }
}

/* ইউনিক ৬-সংখ্যার UID (= MOI ID) */
let seq = 0;
const USERS = {};
const ORDER = [];
people.forEach((p, i) => {
    let uid = String(240000 + ((i * 7919 + 1301) % 700000) + i);     /* দেখতে এলোমেলো, কিন্তু প্রতিবার একই */
    while (USERS[uid]) uid = String(Number(uid) + 1);
    const vip = VIPS[i % VIPS.length];
    const xp = Math.round((Math.pow(2 * p.level - 1, 2) - 1) / 0.08);
    USERS[uid] = {
        uid, moiId: uid, name: p.name, photo: p.photo, bio: BIOS[i % BIOS.length],
        country: COUNTRIES[i % COUNTRIES.length], gender: p.gender === 'f' ? 'Female' : 'Male', birthday: '', voice: '',
        role: vip ? 'vip' : 'user', isGuest: false, badges: i % 9 === 0 ? ['verified'] : (i % 13 === 0 ? ['top_gifter'] : []),
        crown: '', ownedCrowns: [],
        frame: FRAMES[i % FRAMES.length],
        diamonds: 800 + ((i * 7331) % 90000), level: p.level, xp,
        giftsSent: (i * 311) % 40000, giftsReceived: (i * 197) % 30000,
        myRoomUid: '', myRoomId: '', distributorId: null, isBanned: false, banReason: null, banExpiresAt: null,
        profileComplete: true, createdAt: T(NOW - (20 + (i * 3) % 300) * 86400000), lastSeen: T(NOW - ((i * 37) % 55) * 60000), lastActiveRoomId: ''
    };
    ORDER.push(uid);
});

/* ───────── আপনি (ডেমো ভিউয়ার) ───────── */
const ME = {
    uid: '582104', moiId: '582104', name: 'MOI Demo', photo: 'https://randomuser.me/api/portraits/men/75.jpg', bio: 'ডেমো অ্যাকাউন্ট',
    country: 'UAE', gender: 'Male', birthday: '', voice: '', role: 'user', isGuest: false, badges: [], crown: '', ownedCrowns: [], frame: 'basic',
    diamonds: 50000, level: 12, xp: 2600, giftsSent: 0, giftsReceived: 0, myRoomUid: '', myRoomId: '', distributorId: null,
    isBanned: false, banReason: null, banExpiresAt: null, profileComplete: true, createdAt: T(NOW - 40 * 86400000), lastSeen: T(NOW), lastActiveRoomId: ''
};
USERS[ME.uid] = ME;
Object.keys(USERS).forEach(u => { M.seedDoc('users/' + u, USERS[u]); M.seedDoc('moiIds/' + u, { uid: u }); });

/* ───────── রুম ───────── */
/* seats = কোন সিটে (০–৯) কে বসা, aud = শ্রোতা কতজন (সিটে বসাদের বাইরে) */
const ROOMS = [
    { id: 'S1001', name: 'Dubai Nights 🌃',     country: 'UAE',          category: 'music', topic: 'Late night chill & music 🎶',          seatIdx: [0, 1, 2, 3, 4, 5],             aud: 20 },
    { id: 'S1002', name: 'Majlis Riyadh ☕',     country: 'Saudi Arabia', category: 'chat',  topic: 'Evening talks — everyone is welcome',   seatIdx: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], aud: 30 },
    { id: 'S1003', name: 'Ludo Club 🎲',         country: 'Malaysia',     category: 'game',  topic: 'Find a Ludo partner',                   seatIdx: [0, 3],                         aud: 6 },
    { id: 'S1004', name: 'Arena Pro ⚔️',        country: 'UK',           category: 'game',  topic: 'Squad up & rank push 🔥',               seatIdx: [0, 1, 2, 3, 4, 5, 6, 7],       aud: 22 },
    { id: 'S1005', name: 'Doha FM Vibes 📻',     country: 'Qatar',        category: 'music', topic: 'Lo-fi, Arabic & pop hits',              seatIdx: [0, 1, 4, 6],                   aud: 12 }
];
/* বাকি ৪৫টা: [নাম, দেশ, ধরন, টপিক] — বাংলাদেশ/ভারত/পাকিস্তান ইচ্ছে করেই নেই (ওগুলো আসল ইউজারদের রুমের জন্য) */
const EXTRA = [
 ['Istanbul Café ☕','Turkey','chat','Coffee, tea & good talks'],['Cairo Nights 🌙','Egypt','chat','Late night stories'],['Berlin Beats 🎧','Germany','music','Electronic & house'],['Paris Lounge 🥐','France','chat','Bonjour, friends'],
 ['Rome Aperitivo 🍷','Italy','chat','Evening chat'],['Madrid Fiesta 🎉','Spain','music','Latin hits all night'],['Tokyo Lo-fi 🗼','Japan','music','Lo-fi study beats'],['Seoul Karaoke 🎤','South Korea','music','Sing along with us'],
 ['Toronto Hangout 🍁','Canada','chat','Chill with new friends'],['New York Talks 🗽','USA','chat','City that never sleeps'],['Sydney Chill 🏖️','Australia','chat','Easy going chat'],['Kuala Lumpur Vibes 🌃','Malaysia','chat','Good vibes only'],
 ['Singapore Social 🦁','Singapore','chat','Meet people from everywhere'],['Manila Friends 🌴','Philippines','chat','Kumusta, everyone!'],['Bangkok Nights 🌆','Thailand','music','Chill music & talks'],['Jakarta Mix 🎶','Indonesia','music','Pop & chill'],
 ['Kuwait Majlis 🌙','Kuwait','chat','Relaxed evening majlis'],['Abu Dhabi Beats 🎵','UAE','music','Top hits tonight'],['Jeddah Talk 🌊','Saudi Arabia','chat','Sea breeze & conversations'],['Mexico Fiesta 🌮','Mexico','music','Latin party'],
 ['Rio Carnival 🥁','Brazil','music','Samba & more'],['Moscow Winter ❄️','Russia','chat','Warm talks, cold weather'],['Hanoi Café 🍜','Vietnam','chat','Coffee & chat'],['Shanghai Skyline 🏙️','China','chat','Night view talks'],
 ['PUBG Squad 🎯','USA','game','Find your squad'],['eFootball Club ⚽','Spain','game','Weekend matches'],['Mobile Legends 🛡️','Indonesia','game','MLBB ranked squad'],['Free Fire Squad 🔥','Brazil','game','Duo & squad wanted'],
 ['Ludo King 👑','UAE','game','Ludo tournament'],['Ludo Night 🌙','Turkey','game','Late night Ludo'],['COD Warzone 🎮','Canada','game','Drop in, squad up'],['Chess Masters ♟️','Russia','game','Blitz & rapid'],
 ['Valorant Lobby 🕹️','Germany','game','Ranked grind'],['Karaoke Night 🎤','Philippines','music','Mic is open'],['Acoustic Café 🎸','Australia','music','Acoustic sessions'],['Pop Hits 🎧','USA','music','Top charts'],
 ['Retro 80s 📼','UK','music','Classic hits'],['Latin Beats 💃','Spain','music','Salsa & reggaeton'],['K-Pop Zone 💜','South Korea','music','K-pop all day'],['Arabic Tarab 🎻','Egypt','music','Classic Arabic songs'],
 ['Sunset Lounge 🌅','UAE','chat','Golden hour chat'],['Weekend Party 🎉','Italy','music','Party mood on'],['Book Club 📚','UK','chat','Talk books & stories'],['Travel Stories ✈️','France','chat','Share your trips'],
 ['Gulf Chill 🌴','Qatar','chat','Easygoing majlis']
];
const MEMBERS = [5000, 3200, 640, 1500, 1000, 500, 800, 2000, 2500, 3500, 1200, 4000, 750, 1800, 3000, 520, 900, 1100, 2200, 600, 1400, 2800, 550, 1700, 4500];
EXTRA.forEach((e, k) => {
    const sc = 2 + ((k * 5 + 3) % 9), seatIdx = [], pool = [0,1,2,3,4,5,6,7,8,9];
    for (let q = 0; q < sc; q++) seatIdx.push(pool.splice((k * 3 + q * 7) % pool.length, 1)[0]);
    seatIdx.sort((a, b) => a - b);
    ROOMS.push({ id: 'S' + (1006 + k), name: e[0], country: e[1], category: e[2], topic: e[3], seatIdx, aud: 3 + ((k * 11 + 7) % 36) });
});
/* জয়েনিং সংখ্যা (রুমে যে নাম্বার দেখায়) — ৫০০ / ১০০০ / ৫০০০ ইত্যাদি। বদলাতে চাইলে MEMBERS তালিকা বদলান */
ROOMS.forEach((R, i) => { R.members = MEMBERS[i % MEMBERS.length] + (i >= MEMBERS.length ? 100 : 0); R.muted = R.seatIdx.slice(); });

const ROOM_BY_ID = {};
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const TEXTS = ['আসসালামু আলাইকুম সবাইকে 🌸','কেমন আছেন সবাই?','দারুণ গান! 😍','Welcome new friends 🤗','ভাই আরেকটা গান ধরেন 🎤','Nice voice ❤️','কে কে নতুন এসেছেন?','হাই সবাই 👋','😂😂😂','মাইকে আসুন না একটু','অসাধারণ লাগছে 🔥','আজকের দিনটা সুন্দর ☀️','Thanks for the vibes ✨','সবাইকে ভালোবাসা ❤','এই গানটা আমার প্রিয় 🎶','Hello from Dubai 🇦🇪','কিভাবে মাইকে উঠব?','👏👏👏','রুমটা খুব সুন্দর','Good night everyone 🌙'];

let cursor = 0;
ROOMS.forEach((R, ri) => {
    const takeFrom = n => { const a = []; for (let q = 0; q < n; q++) a.push(ORDER[(cursor + q) % ORDER.length]); cursor += n; return a; };
    const seated = takeFrom(R.seatIdx.length);
    const audience = takeFrom(R.aud);
    const owner = USERS[seated[0]];
    R.seatUids = seated; R.audUids = audience; R.ownerUid = owner.uid;
    const admins = seated.slice(1, 3);
    ROOM_BY_ID[R.id] = R;
    R.offset = Math.max(0, R.members - (seated.length + audience.length));

    M.seedDoc('rooms/' + R.id, {
        id: R.id, name: R.name, logo: (ri % 2 === 0 ? owner.photo : 'https://picsum.photos/seed/moi-' + R.id + '/300/300'), country: R.country, language: 'bn', category: R.category, topic: R.topic,
        owner: { uid: owner.uid, name: owner.name, avatar: owner.photo }, ownerUid: owner.uid, ownerName: owner.name, ownerAvatar: owner.photo,
        admins, level: 3 + ri, points: 20000 + ri * 15000, micSeatCount: 10, isLive: true,
        createdAt: T(NOW - (ri === 2 ? 2 : 30 + ri * 9) * 86400000), rules: [], mutedUsers: [], bannedUsers: []
    });
    M.seedDoc('users/' + owner.uid, Object.assign({}, USERS[owner.uid], { myRoomUid: R.id, myRoomId: R.id }));

    const base = 'moi-live/rooms/' + R.id;
    /* সিট */
    for (let s = 0; s < 10; s++){
        const k = R.seatIdx.indexOf(s);
        if (k < 0) continue;
        const u = USERS[seated[k]];
        M.rtSet(base + '/seats/' + s, { uid: u.uid, name: u.name, avatar: u.photo, role: k === 0 ? 'owner' : (admins.includes(u.uid) ? 'admin' : 'member'),
            mic: false, locked: false, coins: rnd(150, 9000), started: NOW - rnd(3, 90) * 60000 });
    }
    /* শ্রোতা (সিটে বসা ও শ্রোতা — সবাই রুমে উপস্থিত) */
    seated.concat(audience).forEach((uid, j) => {
        const u = USERS[uid];
        M.rtSet(base + '/listeners/' + uid, { name: u.name, avatar: u.photo, role: uid === R.ownerUid ? 'owner' : (admins.includes(uid) ? 'admin' : 'member'), joined: NOW - (j + 1) * rnd(20, 80) * 1000 });
        M.rtSet('moi-live/roomPresence/' + R.id + '/' + uid, true);
        if ((j % 5) < 3) M.rtSet(base + '/joinedUsers/' + uid, true);
    });
    M.rtSet(base + '/likes', rnd(180, 2600));
    /* টপ গিফটার প্যানেলের জন্য কিছু ইতিহাস */
    seated.forEach(uid => {
        const u = USERS[uid]; const h = {};
        for (let q = 0; q < rnd(3, 10); q++) h['-Mseed' + uid + q] = { amount: [1, 5, 10, 15, 50][rnd(0, 4)] * rnd(1, 4), ts: NOW - rnd(5, 1300) * 60000 };
        M.rtSet(base + '/giftStats/' + uid, { uid, name: u.name, avatar: u.photo, history: h });
    });
    /* গত ২ ঘণ্টায় কয়েকটা রোজ গিফট (শুধু গিফটের বার্তা — কোনো সাধারণ মেসেজ নেই) */
    const speakers = seated.concat(audience);
    const nGift = 3 + (ri % 3);
    for (let m = 0; m < nGift; m++){
        const u = USERS[speakers[(m * 5 + ri * 3) % speakers.length]]; const tg = USERS[seated[(m + 1 + ri) % seated.length]];
        const id = 'seed_' + R.id + '_' + m; const ts = NOW - (nGift - m) * rnd(18, 40) * 60000;
        M.seedDoc('rooms/' + R.id + '/messages/' + id, { id, type: 'gift', uid: u.uid, senderUid: u.uid, name: u.name, senderName: u.name, avatar: u.photo, text: ' 💎 ফুল × 1 → ' + tg.name, ts });
    }
});

/* ───────── ফলো / ফলোয়ার (প্রোফাইলে সংখ্যা দেখানোর জন্য) ───────── */
const ids = Object.keys(USERS);
ids.forEach((uid, i) => {
    if (uid === ME.uid) return;
    const n = 3 + ((i * 17) % 22);
    for (let k = 1; k <= n; k++){
        const f = ids[(i + k * 3) % ids.length]; if (f === uid) continue;
        M.seedDoc('follows/' + uid + '/followers/' + f, { since: T(NOW - k * 3600000) });
        M.seedDoc('follows/' + f + '/following/' + uid, { since: T(NOW - k * 3600000) });
    }
});

/* ───────── ডেমো ইউজার অটো লগইন ───────── */
M.demoSignIn({ uid: ME.uid, isAnonymous: false, displayName: ME.name, photoURL: ME.photo, phoneNumber: '' });

const shown = (id, n) => n + ((ROOM_BY_ID[id] && ROOM_BY_ID[id].offset) || 0);
window.DEMO = { shown, ROOMS, ROOM_BY_ID, USERS, ME, TEXTS, SPARE: ORDER.slice(0, 12).reverse() };
})();
