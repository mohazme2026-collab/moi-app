/* game/game-data.js — ডেটার কাজ: ইউজার, ব্যালেন্স, বেট, জয়, ইতিহাস
   (ডেমো: প্রজেক্টের নিজস্ব ইকোনমি সিস্টেম ব্যবহার করে — ডায়মন্ড আসল ব্যালেন্স থেকে কাটে/যোগ হয়) */
const GameData = {
  me: { uid: '', name: '', photo: '', diamonds: 0 },

  async init(){
    await (window.MOIReady || Promise.resolve());
    const p = window.MOIAuth && MOIAuth.profile;
    if (!p || !p.uid) return false;
    this.me = { uid: p.uid, name: p.name || 'User', photo: p.photo || '', diamonds: p.diamonds || 0 };
    return true;
  },

  /* স্ক্রিনের ব্যালেন্স সবসময় আসল প্রোফাইল থেকে */
  syncBalance(){
    const p = window.MOIAuth && MOIAuth.profile;
    if (p && typeof p.diamonds === 'number' && p.diamonds !== this.me.diamonds){ this.me.diamonds = p.diamonds; return true; }
    return false;
  },

  /* বেট ধরা — সফল হলে নতুন ব্যালেন্স ফেরত */
  async bet(roundIdx, item, chip){
    const r = await MOIEco.call('gameBet', { idx: roundIdx, item, chip });
    this.me.diamonds = r.balance;
    return r;
  },

  /* জয় নেওয়া — { win, cost, reward, balance } */
  async claim(roundIdx){
    const r = await MOIEco.call('gameClaim', { idx: roundIdx });
    this.me.diamonds = r.balance;
    return r;
  },

  /* আজ আমি কত জিতেছি */
  async myTodayWin(){
    try {
      const s = await MOIFB.rtdb.ref(MOIFB.LIVE + '/game/dailyWins/' + getTodayKey() + '/' + this.me.uid).get();
      const v = s.val(); return (v && v.amount) || 0;
    } catch(e){ return 0; }
  },

  /* আজকের শীর্ষ n জন = বট + আসল খেলোয়াড় */
  async dailyTop3(){ return this.dailyTop(3); },
  async dailyTop(n){
    const key = getTodayKey(); let list = DemoPlayers.dailyBoard(key);
    try {
      const s = await MOIFB.rtdb.ref(MOIFB.LIVE + '/game/dailyWins/' + key).get();
      const v = s.val() || {};
      Object.keys(v).forEach(uid => { list = list.filter(x => x.uid !== uid); list.push({ uid, name: v[uid].name, photo: v[uid].photo, amount: v[uid].amount || 0 }); });
    } catch(e){}
    return list.sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, n || 3);
  },

  /* শেষ ৮ রাউন্ডের ফল — রাউন্ড নম্বর থেকেই বের হয় */
  history(roundIdx){
    const out = [];
    for (let i = 8; i >= 1; i--) out.push(getWinningIndex(((roundIdx - i) % MAX_ROUNDS + MAX_ROUNDS) % MAX_ROUNDS + 1));
    return out;
  },

  /* এই রাউন্ডে সবার বেট (বট + আমার) — "Win List" এর জন্য */
  async roundBets(roundIdx){
    const all = DemoPlayers.betsForRound(roundIdx);
    try {
      const s = await MOIFB.rtdb.ref(MOIFB.LIVE + '/game/rounds/R' + roundIdx + '/bets/' + this.me.uid).get();
      const v = s.val(); if (v && v.bets) all[this.me.uid] = { uid: this.me.uid, name: this.me.name, photo: this.me.photo, bets: v.bets };
    } catch(e){}
    return all;
  }
};
