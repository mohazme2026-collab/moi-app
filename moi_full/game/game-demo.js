/* game/game-demo.js — ডেমো: অন্য খেলোয়াড় (বট) আর আজকের লিডারবোর্ড
   আসল ডেটাবেস ফেরত আনলে এই ফাইলের জায়গায় আসল খেলোয়াড়দের ডেটা পড়া হবে।
   একই রাউন্ডে সবসময় একই বট একই বেট ধরে (রিলোড করলেও মিলে যায়)। */
const DemoPlayers = (function(){
  const FALLBACK = ['Rafi','Nila','Sumon','Aisha','Omar','Fatima','Khalid','Layla','Ahmed','Sara'].map((n, i) => ({ uid: 'dp' + i, name: n, photo: '' }));
  function pool(){
    const U = window.DEMO && window.DEMO.USERS ? Object.values(window.DEMO.USERS).filter(u => u && u.name) : [];
    return U.length >= 10 ? U.slice(0, 40) : FALLBACK;
  }
  function rng(seed){ let s = (seed >>> 0) % 2147483647 || 1; return () => (s = s * 48271 % 2147483647) / 2147483647; }
  const CHIPS = [1, 5, 10, 100];
  return {
    /* এই রাউন্ডে বটরা কে কোথায় কত ধরেছে */
    betsForRound(roundIdx){
      const r = rng(roundIdx * 7919 + 13), P = pool(), out = {}, n = 6 + Math.floor(r() * 5);
      for (let k = 0; k < n; k++){
        const u = P[Math.floor(r() * P.length)], bets = {};
        const spots = 1 + Math.floor(r() * 3);
        for (let s = 0; s < spots; s++){
          const item = Math.floor(r() * 8), chip = CHIPS[Math.floor(r() * 4)];
          bets[item] = (bets[item] || 0) + chip * (1 + Math.floor(r() * 4));
        }
        out[u.uid] = { uid: u.uid, name: u.name, photo: u.photo || '', bets };
      }
      return out;
    },
    /* আজকের শীর্ষ ৩ (বটদের জমা) */
    dailyBoard(dateKey){
      let seed = 0; for (const c of dateKey) seed = seed * 31 + c.charCodeAt(0);
      const r = rng(seed), P = pool(), list = [], seen = {};
      for (let tries = 0; list.length < 8 && tries < 60; tries++){
        const u = P[Math.floor(r() * P.length)]; if (seen[u.uid]) continue; seen[u.uid] = 1;
        list.push({ uid: u.uid, name: u.name, photo: u.photo || '', amount: 2000 + Math.floor(r() * 48000) });
      }
      return list;
    }
  };
})();
