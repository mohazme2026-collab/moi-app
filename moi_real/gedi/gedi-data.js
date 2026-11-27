/* gedi/gedi-data.js — ডেটার কাজ: ইউজার, ব্যালেন্স, বেট, জয়, ইতিহাস, র‍্যাংকিং
   (প্রজেক্টের নিজস্ব ইকোনমি সিস্টেম ব্যবহার করে — ডায়মন্ড আসল ব্যালেন্স থেকে কাটে/যোগ হয়) */
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

  async bet(roundIdx, item, chip){
    const r = await MOIEco.call('gediBet', { idx: roundIdx, item, chip });
    this.me.diamonds = r.balance;
    return r;
  },
  async claim(roundIdx){
    const r = await MOIEco.call('gediClaim', { idx: roundIdx });
    this.me.diamonds = r.balance;
    return r;
  },

  async myTodayWin(){
    try {
      const s = await MOIFB.rtdb.ref(MOIFB.LIVE + '/gedi/dailyWins/' + getTodayKey() + '/' + this.me.uid).get();
      const v = s.val(); return (v && v.amount) || 0;
    } catch(e){ return 0; }
  },

  /* বট + আসল খেলোয়াড় মিলিয়ে বোর্ড (kind: 'daily' | 'weekly') */
  async top(kind, n){
    const weekly = kind === 'weekly', key = weekly ? getWeekKey() : getTodayKey();
    let list = weekly ? DemoPlayers.weeklyBoard(key) : DemoPlayers.dailyBoard(key);
    try {
      const s = await MOIFB.rtdb.ref(MOIFB.LIVE + '/gedi/' + (weekly ? 'weeklyWins/' : 'dailyWins/') + key).get();
      const v = s.val() || {};
      Object.keys(v).forEach(uid => { list = list.filter(x => x.uid !== uid); list.push({ uid, name: v[uid].name, photo: v[uid].photo, amount: v[uid].amount || 0 }); });
    } catch(e){}
    return list.sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, n || 10);
  },

  /* শেষ ৮ রাউন্ডের ফল (পুরনো → নতুন) — রাউন্ড নম্বর থেকেই বের হয় */
  history(roundIdx){
    const out = [];
    for (let i = 8; i >= 1; i--) out.push(gediResult(Math.max(0, roundIdx - i)));
    return out;
  },

  /* এই রাউন্ডে সবার বেট (বট + আমার) — "Win List" আর HOT ঘরের জন্য */
  async roundBets(roundIdx){
    const all = DemoPlayers.betsForRound(roundIdx);
    try {
      const s = await MOIFB.rtdb.ref(MOIFB.LIVE + '/gedi/rounds/R' + roundIdx + '/bets/' + this.me.uid).get();
      const v = s.val(); if (v && v.bets) all[this.me.uid] = { uid: this.me.uid, name: this.me.name, photo: this.me.photo, bets: v.bets };
    } catch(e){}
    return all;
  }
};
