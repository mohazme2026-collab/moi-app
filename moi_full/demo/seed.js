/* demo/seed.js — ডেমোর ডেটা: ৫টা রুম, রুমে বসা মানুষ, শ্রোতা, মুকুট, চ্যাট, ফলো — সব নকল Firebase-এ ঢোকানো
   ⚙️ বদলাতে চাইলে: নিচের ROOMS ও নামের তালিকা বদলান। ছবি আসে randomuser.me (আসল মানুষের ছবি) — ইন্টারনেট লাগবে। */
console.log('[DEMO] seed.js loaded');
(function(){
'use strict';
const M = window.__MOCK; if (!M) return;
const T = ms => new M.Timestamp(ms);
const NOW = Date.now();

/* ───────── মানুষের তালিকা (১২৫ জন) ───────── */
const FEMALE_FIRST = ["আফিয়া", "আয়েশা", "অদিতি", "অনন্যা", "অর্পিতা", "আরিবা", "আরিশা", "আসমা", "ইরা", "ইশরাত", "উমাইরা", "ঐশী", "কেয়া", "খুশি", "জান্নাত", "জারা", "জেরিন", "তানহা", "তানিয়া", "তাসনিম", "দিয়া", "নাবিলা", "নাদিয়া", "নাফিসা", "নুসরাত", "নওরীন", "পায়েল", "প্রিয়া", "প্রজ্ঞা", "ফারিহা", "ফারজানা", "ফারিয়া", "মাহিয়া", "মাহিরা", "মারিয়া", "মিম", "মিশু", "মুনতাহা", "মুনিয়া", "মৌ", "রাইসা", "রাইमा", "রিমি", "রিমা", "রুবাইয়া", "রুবিনা", "রূপা", "লাবণ্য", "লিমা", "সাদিয়া", "সামিয়া", "সায়রা", "সায়মা", "সারা", "সানজিদা", "সানজানা", "সাবা", "সাবরিনা", "সাফা", "সাফিয়া", "সুমাইয়া", "সুরাইয়া", "সুহানা", "স্নিগ্ধা", "স্বর্ণা", "স্বাতী", "হাফসা", "হুমায়রা", "হৃদিতা", "ঐন্দ্রিলা", "অন্তরা", "অভ্রা", "অমৃতা", "আলভীনা", "আলিয়া", "ইফফাত", "ইলমা", "উর্মি", "কনিকা", "কুহু", "চৈতি", "জুঁই", "তৃষা", "দোলা", "দিশা", "নীরা", "পূজা", "বৃষ্টি", "মেঘলা", "মৌসুমী", "রেশমি", "শারমিন", "শীলা", "শ্রেয়া", "সেঁজুতি", "সোহানা", "তুবা", "তুলিকা", "ঊর্মিলা", "নাইমা"];
const MALE_FIRST = ["আরিফ", "সাকিব", "তামিম", "রায়হান", "নাফিস", "ইমরান", "ফাহিম", "সিয়াম", "আদনান", "রিফাত", "মাহির", "আবরার", "আয়ান", "নিহাল", "সাদমান", "তানভীর", "মুশফিক", "রাকিব", "নাবিল", "সাফওয়ান", "আশিক", "মেহেদী", "সোহান", "শাওন", "জুবায়ের", "ফারহান", "ইয়াসিন", "আলভী", "রিদওয়ান", "মাহমুদ", "হাসান", "হোসাইন", "আব্দুল্লাহ", "আহমেদ", "আনাস", "আতিক", "আসিফ", "বাশার", "বিপ্লব", "চয়ন", "দিহান", "ইফতেখার", "এহসান", "ফয়সাল", "গালিব", "হৃদয়", "জাহিদ", "জিসান", "কামরুল", "লাবিব", "মাহফুজ", "মারুফ", "মাসুদ", "মোস্তাফিজ", "নাঈম", "নওশাদ", "ওমর", "পারভেজ", "প্রান্ত", "প্রতীক", "কৌশিক", "সাজিদ", "সামি", "সামিউল", "সানজিদ", "সায়েম", "সোহেল", "সুমন", "তৌহিদ", "উজ্জ্বল", "আকাশ", "অনিক", "অর্ণব", "অয়ন", "বর্ণ", "দুর্জয়", "ঋদ্ধ", "জয়", "নীল", "রুদ্র", "শুভ", "শুভ্র", "সৌরভ", "সৌমিক", "তন্ময়", "তুষার", "উদয়", "বাপ্পী", "নিরব", "রনি", "ইমন", "রাহাত", "রাশেদ", "শরীফ", "সাব্বির", "সাদ", "সাফি", "তাসিন", "ইশতিয়াক", "জাওয়াদ"];
const LAST = [''];
const STYLE = ['{f}','{f}','{f}','{f} 🌸','{f}','{f}_{f}','{f}','{f}♡','{f}','{f} 🎧','{f}','{f} ✨'];
const BN = [];
const COUNTRIES = ['Bangladesh','Bangladesh','Bangladesh','Bangladesh','Bangladesh','Bangladesh','Bangladesh','UAE','Saudi Arabia','Qatar','Malaysia','Singapore','Kuwait','Bangladesh','Bangladesh','Bangladesh','Oman','UK','Bangladesh','Italy'];
const VIPS = [1,1,1,0,1,1,0,1,1,1,0,1,1,1];   /* কার role = vip (মুকুট এখন ভিডিও-সিস্টেমে — user.crown = মুকুটের আইডি, যেমন 'svip1') */
const FRAMES = ['basic','basic','aurora','basic','flame','basic','ocean','royal','basic','galaxy'];
const BIOS = ['Music lover 🎶','Looking for new friends','Chill & vibes ✨','Stay positive','Music is life 🎧','Good vibes only','Be kind 🌿','','',''];

const AVB = (function(){ try { return new URL('../assets/av/', document.currentScript.src).href; } catch(e){ return location.href.split('?')[0].replace(/[^\/]*\/[^\/]*$/, '') + 'assets/av/'; } })();
const SUR_M = ['আহমেদ','হোসেন','ইসলাম','রহমান','চৌধুরী','খান','মিয়া','সরকার','উদ্দিন','আলম','হক','শেখ','মন্ডল','তালুকদার','বিশ্বাস','সিকদার','ভুঁইয়া','প্রামানিক','মোল্লা','দেওয়ান','ফকির','মাহমুদ','কবির','হাসান','আজাদ','সরদার','পাটোয়ারী','বেপারী','মজুমদার','সাহা','দাস','রায়','ঢালী','গাজী','মাতুব্বর','খন্দকার','সৈয়দ','জমাদার','হালদার','মৃধা'];
const SUR_F = ['আক্তার','খাতুন','বেগম','সুলতানা','জাহান','পারভীন','আফরিন','ইয়াসমিন','নূর','রহমান','চৌধুরী','তাবাসসুম','মিম','ইসলাম','হোসেন','শিকদার','সরকার','আহমেদ','নাহার','জান্নাত','কবির','মাহমুদ','হক','আলম','সিদ্দিকা','রানী','দাস','সাহা','রায়','মণ্ডল','ফেরদৌসী','তাসনিম','লিজা','ববি','শারমিন','রুবি','পপি','মৌ','তৃপ্তি','ঝুমুর'];
const N_F = 600, N_M = 400;   /* মোট ১০০০ বট: মেয়ে ৬০০, ছেলে ৪০০ (প্রতিটা নাম আলাদা) */
function mkUser(i0, gender, pass){
    const i = i0 + (pass || 0) * 29;
    const list = gender === 'f' ? FEMALE_FIRST : MALE_FIRST, sur = gender === 'f' ? SUR_F : SUR_M;
    const first = list[i0 % list.length], r = Math.floor(i0 / list.length);
    const name = r === 0 ? STYLE[(i0 * 3 + (gender === 'f' ? 1 : 0)) % STYLE.length].split('{f}').join(first) : first + ' ' + sur[(r * 13 + i0 % list.length) % 40];
    const level = 3 + ((i * 13 + (gender === 'f' ? 5 : 11)) % 58);
    /* ছবি: assets/av (b001..b101 ছেলে, g001..g129 মেয়ে) — নাম ও ছবি সবসময় একই জোড়া */
    const cnt = gender === 'f' ? 129 : 101;
    return { gender, name, photo: AVB + (gender === 'f' ? 'g' : 'b') + ('00' + ((i0 * 7) % cnt + 1)).slice(-3) + '.webp', level };
}
const people = [];
{ let f = 0, m = 0; while (f < N_F || m < N_M){ if (f < N_F) people.push(mkUser(f++, 'f', 0)); if (f < N_F) people.push(mkUser(f++, 'f', 0)); if (m < N_M) people.push(mkUser(m++, 'm', 0)); } }

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
    uid: '582104', moiId: '582104', name: 'MOI Demo', photo: AVB + 'b075.webp', bio: 'ডেমো অ্যাকাউন্ট',
    country: 'UAE', gender: 'Male', birthday: '', voice: '', role: 'user', isGuest: false, badges: [], crown: '', ownedCrowns: [], frame: 'basic',
    diamonds: 50000, level: 12, xp: 2600, giftsSent: 0, giftsReceived: 0, myRoomUid: '', myRoomId: '', distributorId: null,
    isBanned: false, banReason: null, banExpiresAt: null, profileComplete: true, createdAt: T(NOW - 40 * 86400000), lastSeen: T(NOW), lastActiveRoomId: ''
};
USERS[ME.uid] = ME;
Object.keys(USERS).forEach(u => { M.seedDoc('users/' + u, USERS[u]); M.seedDoc('moiIds/' + u, { uid: u }); });

/* ───────── রুম ───────── */
/* seats = কোন সিটে (০–৯) কে বসা, aud = শ্রোতা কতজন (সিটে বসাদের বাইরে) */
const ROOMS = [];
const ROOM_DEFS = [
 ['আড্ডাখানা ☕','Bangladesh','chat','সন্ধ্যার আড্ডা — সবার জন্য খোলা'],
 ['গানের আসর 🎶','Bangladesh','music','পুরনো দিনের গান আর নতুন সুর'],
 ['সুরের মেলা 🎤','Bangladesh','music','মাইকে আসুন, গান শোনান'],
 ['মজার আড্ডা 😄','Bangladesh','chat','হাসি-ঠাট্টা আর গল্প'],
 ['রাতের পাখি 🌙','Bangladesh','chat','রাত জাগা বন্ধুদের ঠিকানা'],
 ['লুডু ক্লাব 🎲','Bangladesh','game','লুডু খেলার সঙ্গী খুঁজুন'],
 ['ফ্রি ফায়ার স্কোয়াড 🔥','Bangladesh','game','ডুও আর স্কোয়াড চাই'],
 ['পাবজি টিম 🎯','Bangladesh','game','রাঙ্ক পুশ করব একসাথে'],
 ['বন্ধুর ঠিকানা 💞','Bangladesh','chat','নতুন বন্ধু বানান'],
 ['মেঘলা দিনের গান ☁️','Bangladesh','music','বৃষ্টির দিনের প্লেলিস্ট'],
 ['কবিতার আসর 📖','Bangladesh','chat','কবিতা পড়া ও শোনা'],
 ['গল্পের ঝুলি 📚','Bangladesh','chat','গল্প বলুন, গল্প শুনুন'],
 ['ঢাকা আড্ডা 🏙️','Bangladesh','chat','ঢাকার বন্ধুদের জমজমাট আড্ডা'],
 ['চট্টগ্রামের পাহাড়ি সুর ⛰️','Bangladesh','music','পাহাড় আর সমুদ্রের গান'],
 ['সিলেটের চা বাগান 🍃','Bangladesh','chat','চায়ের কাপে গল্প'],
 ['খুলনা ক্লাব 🌿','Bangladesh','chat','সুন্দরবনের দেশের মানুষ'],
 ['রাজশাহীর আম 🥭','Bangladesh','chat','মিষ্টি কথা, মিষ্টি আড্ডা'],
 ['বরিশাল বন্ধু 🛶','Bangladesh','chat','নদীর দেশের গল্প'],
 ['রংপুর রঙ্গ 🎭','Bangladesh','chat','হাসি আর গান'],
 ['কুমিল্লা কাফে ☕','Bangladesh','chat','খাদির দেশের আড্ডা'],
 ['প্রবাসী ভাইবোন ✈️','Bangladesh','chat','দূর দেশ থেকে দেশের গল্প'],
 ['দুবাই বাংলা মজলিস 🌃','UAE','chat','প্রবাসীদের সন্ধ্যার আসর'],
 ['সৌদি প্রবাসী 🕌','Saudi Arabia','chat','মরুর দেশে বাংলা আড্ডা'],
 ['মালয়েশিয়া বাংলা 🌴','Malaysia','chat','কুয়ালালামপুরের বাঙালি আড্ডা'],
 ['ক্যারাওকে নাইট 🎤','Bangladesh','music','গানের সাথে গলা মেলান'],
 ['রবীন্দ্রসংগীত 🌸','Bangladesh','music','গুরুদেবের গান'],
 ['নজরুলগীতি 🎻','Bangladesh','music','বিদ্রোহী কবির গান'],
 ['লোকগীতি বাউল 🪕','Bangladesh','music','মাটির গান, প্রাণের সুর'],
 ['আধুনিক বাংলা গান 🎧','Bangladesh','music','নব্বইয়ের গান আর নতুন হিট'],
 ['লো-ফাই চিল 🌙','Bangladesh','music','শান্ত সুরে রাত কাটাই'],
 ['ইসলামিক গজল 🕋','Bangladesh','music','মন ভালো করা গজল'],
 ['বৃষ্টি বিলাস 🌧️','Bangladesh','chat','বৃষ্টি হলেই চলে আসুন'],
 ['কফি ও কথা ☕','Bangladesh','chat','এক কাপ কফি, অনেক কথা'],
 ['ভোরের আলো 🌅','Bangladesh','chat','শুভ সকালের আড্ডা'],
 ['বিকেলের চা 🍵','Bangladesh','chat','চা-নাস্তা আর গল্প'],
 ['মধ্যরাতের মজলিস 🌌','Bangladesh','chat','জেগে থাকা মানুষদের আসর'],
 ['ছাদের আড্ডা 🪁','Bangladesh','chat','খোলা ছাদে খোলা মনে'],
 ['গ্রামের মাঠ 🌾','Bangladesh','chat','গ্রামের স্মৃতি, গ্রামের গল্প'],
 ['নদীর পাড় 🌊','Bangladesh','chat','ভাটিয়ালি গান আর গল্প'],
 ['শিক্ষার্থী আড্ডা 🎓','Bangladesh','chat','পড়াশোনা আর ক্যারিয়ার আলোচনা'],
 ['ক্রিকেট ফ্যান 🏏','Bangladesh','chat','বাংলাদেশ টাইগার্স নিয়ে আলোচনা'],
 ['ফুটবল প্রেমী ⚽','Bangladesh','chat','ম্যাচ নিয়ে জমজমাট তর্ক'],
 ['ইফুটবল ক্লাব 🕹️','Bangladesh','game','ম্যাচ খেলি, রাঙ্ক বাড়াই'],
 ['লুডু কিং 👑','Bangladesh','game','টুর্নামেন্ট চলছে'],
 ['দাবা ও ক্যারম ♟️','Bangladesh','game','ব্লিটজ আর র‍্যাপিড'],
 ['মোবাইল লেজেন্ডস 🛡️','Bangladesh','game','র‍্যাঙ্ক স্কোয়াড খুঁজছি'],
 ['পার্টি নাইট 🎉','Bangladesh','music','নাচ-গানে মাতোয়ারা'],
 ['হাসির আসর 😂','Bangladesh','chat','জোকস আর মজার গল্প'],
 ['ভালোবাসার গান 💕','Bangladesh','music','প্রেমের গান শুনি একসাথে'],
 ['একাকী মন 🍂','Bangladesh','chat','মন খুলে কথা বলুন']
];
/* ৫০টা রুম: প্রতিটায় মোট ৪৫ জন (সিটে বসা + শ্রোতা) */
ROOM_DEFS.forEach((e, k) => {
    const sc = k < 5 ? [10, 6, 2, 8, 4][k] : 2 + ((k * 5 + 3) % 9), seatIdx = [], pool = [0,1,2,3,4,5,6,7,8,9];
    for (let q = 0; q < sc; q++) seatIdx.push(pool.splice((k * 3 + q * 7) % pool.length, 1)[0]);
    seatIdx.sort((a, b) => a - b);
    ROOMS.push({ id: 'S' + (1001 + k), name: e[0], country: e[1], category: e[2], topic: e[3], seatIdx, aud: 45 - sc });
});
const MEMBERS = [5000, 3200, 640, 1500, 1000, 500, 800, 2000, 2500, 3500, 1200, 4000, 750, 1800, 3000, 520, 900, 1100, 2200, 600, 1400, 2800, 550, 1700, 4500];
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
        id: R.id, name: R.name, logo: owner.photo, country: R.country, language: 'bn', category: R.category, topic: R.topic,
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
