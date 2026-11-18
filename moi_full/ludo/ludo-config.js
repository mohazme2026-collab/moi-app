/* ludo/ludo-config.js — Ludo Dice গেমের স্থির মান: সময়, নম্বর, জেতার নিয়ম */
const EPOCH = 1700000000000;
const BETTING_DURATION = 15000;   /* ১৫ সেকেন্ড বেট ধরার সময় */
const ROUND_DURATION = 27000;     /* মোট ২৭ সেকেন্ড: ১৫ বেট + (ডাইস ঘোরা ৩/৫/৭ সেকেন্ড, রাউন্ড ভেদে আলাদা) + বাকি সময় রেজাল্ট */
const ROUND_MAX = 5000;           /* স্ক্রিনে রাউন্ড নম্বর ১ থেকে ৫০০০ */
const CHIPS = [10, 100, 500, 1000];
const NUMS = [2, 3, 4, 5, 6];     /* ১ নেই — ঘর আর গুণ = ২ থেকে ৬ */
const MAX_BOXES = 2;              /* একসাথে সর্বোচ্চ ২টা ঘরে বেট */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ── ডাইস কতক্ষণ ঘুরবে: ৩, ৫ বা ৭ সেকেন্ড — রাউন্ড নম্বর (idx) থেকে ঠিক হয়, সবার জন্য একই
   🔒 এই অংশটা ludo/ludo-config.js আর shared/core/economy.js — দুই জায়গায় হুবহু একই রাখতে হবে। */
function ludoRollMs(idx){ let a = (Math.imul(idx + 5, 2654435761) ^ 0x1b873593) >>> 0; a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); const x = ((t ^ (t >>> 14)) >>> 0) / 4294967296; return x < 0.36 ? 3000 : (x < 0.70 ? 5000 : 7000); }

/* ══════ রাউন্ডের সময় — সবার জন্য একই ঘড়ি ══════ */
function getRoundInfo(){
  const now = Date.now();
  const elapsed = now - EPOCH;
  const roundIndex = Math.floor(elapsed / ROUND_DURATION);          /* অনন্য রাউন্ড নম্বর */
  const roundNumber = (roundIndex % ROUND_MAX) + 1;                  /* স্ক্রিনে দেখানো নম্বর */
  const msInto = elapsed % ROUND_DURATION;
  const rollMs = ludoRollMs(roundIndex);
  let phase, timeLeft;
  if (msInto < BETTING_DURATION){ phase = 'BETTING'; timeLeft = BETTING_DURATION - msInto; }
  else if (msInto < BETTING_DURATION + rollMs){ phase = 'ROLLING'; timeLeft = (BETTING_DURATION + rollMs) - msInto; }
  else { phase = 'RESULT'; timeLeft = ROUND_DURATION - msInto; }
  return { roundIndex, roundNumber, phase, timeLeft, msInto, rollMs };
}

/* ── ডাইসে কোন নম্বর পড়বে (২–৬) — রাউন্ড নম্বর (idx) থেকেই ঠিক হয়, সবার জন্য একই ──
   🔒 এই অংশটা ludo/ludo-config.js আর shared/core/economy.js — দুই জায়গায় হুবহু একই রাখতে হবে। */
function ludoRng(seed){ let a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const LUDO_MOODS = [
  { w: [0.44, 0.34, 0.13, 0.06, 0.03], min: 4, span: 6 },   /* ছোট নম্বরের ধারা */
  { w: [0.27, 0.26, 0.22, 0.14, 0.11], min: 3, span: 5 },   /* মেশানো */
  { w: [0.10, 0.15, 0.27, 0.26, 0.22], min: 2, span: 4 }    /* বড় নম্বরের ধারা */
];
const LUDO_CACHE = {};
function ludoSuper(s){
  if (LUDO_CACHE[s]) return LUDO_CACHE[s];
  const r = ludoRng(Math.imul(s + 11, 2246822519) ^ 0x27d4eb2f);
  const out = []; let prev = -1, prevMood = -1;
  while (out.length < 64){
    const m = r(); let mood = m < 0.30 ? 0 : (m < 0.78 ? 1 : 2);
    if (mood !== 1 && mood === prevMood) mood = 1; prevMood = mood;
    const M = LUDO_MOODS[mood], len = M.min + Math.floor(r() * M.span);
    for (let k = 0; k < len && out.length < 64; k++){
      let v = ludoPick(M.w, r());
      if (v === prev && r() < 0.35) v = ludoPick(M.w, r());     /* একই নম্বর পরপর কম আসে */
      out.push(v); prev = v;
    }
  }
  LUDO_CACHE[s] = out;
  return out;
}
function ludoPick(w, x){ let c = 0; for (let i = 0; i < 5; i++){ c += w[i]; if (x < c) return i + 2; } return 6; }
function ludoResult(idx){ return ludoSuper(Math.floor(idx / 64))[((idx % 64) + 64) % 64]; }

/* ডাইসে n পড়লে জয় = ওই ঘরের বেট × n */
function ludoReward(bets, n){ return (Number(bets && bets[n]) || 0) * n; }

function getTodayKey(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
/* সপ্তাহের চাবি = ওই সপ্তাহের সোমবারের তারিখ */
function getWeekKey(){
  const d = new Date(); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
