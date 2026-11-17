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
