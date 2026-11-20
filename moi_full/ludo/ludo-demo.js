/* ludo/ludo-demo.js — বট: অন্য খেলোয়াড় + দৈনিক/সাপ্তাহিক লিডারবোর্ড
   একই রাউন্ডে সবসময় একই বট একই বেট ধরে (রিলোড করলেও মিলে যায়)। */
const DemoPlayers = (function(){
  const FALLBACK = ['Rafi','Nila','Sumon','Aisha','Omar','Fatima','Khalid','Layla','Ahmed','Sara'].map((n, i) => ({ uid: 'dp' + i, name: n, photo: '' }));
  function pool(){
    const U = window.DEMO && window.DEMO.USERS ? Object.values(window.DEMO.USERS).filter(u => u && u.name) : [];
    return U.length >= 10 ? U.slice(0, 40) : FALLBACK;
  }
  function rng(seed){ let s = (seed >>> 0) % 2147483647 || 1; return () => (s = s * 48271 % 2147483647) / 2147483647; }
  function seedOf(str){ let seed = 0; for (const c of str) seed = (seed * 31 + c.charCodeAt(0)) >>> 0; return seed; }
  function board(key, lo, span, count){
    const r = rng(seedOf(key)), P = pool(), list = [], seen = {};
    for (let tries = 0; list.length < count && tries < 120; tries++){
      const u = P[Math.floor(r() * P.length)]; if (seen[u.uid]) continue; seen[u.uid] = 1;
      list.push({ uid: u.uid, name: u.name, photo: u.photo || '', amount: lo + Math.floor(r() * span) });
    }
    return list;
  }
  return {
    /* এই রাউন্ডে বটরা কে কোন ঘরে (২–৬) কত ধরেছে — প্রতি বটের সর্বোচ্চ ২ ঘর */
    betsForRound(roundIdx){
      const r = rng(roundIdx * 7919 + 29), P = pool(), out = {}, n = 7 + Math.floor(r() * 5);
      for (let k = 0; k < n; k++){
        const u = P[Math.floor(r() * P.length)]; if (out[u.uid]) continue;
        const bets = {}, spots = 1 + Math.floor(r() * 2);
        for (let s = 0; s < spots; s++){
          const num = 2 + Math.floor(r() * 5), cr = r(), chip = cr < 0.4 ? CHIPS[0] : cr < 0.72 ? CHIPS[1] : cr < 0.92 ? CHIPS[2] : CHIPS[3];
          bets[num] = (bets[num] || 0) + chip * (1 + Math.floor(r() * 3));
        }
        out[u.uid] = { uid: u.uid, name: u.name, photo: u.photo || '', bets };
      }
      return out;
    },
    dailyBoard(dateKey){ return board('d' + dateKey, 40000, 900000, 12); },
    weeklyBoard(weekKey){ return board('w' + weekKey, 400000, 6000000, 12); }
  };
})();
