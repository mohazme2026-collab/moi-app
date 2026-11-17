/* gedi/gedi-config.js — Gedi গেমের স্থির মান: সময়, ঘর, ছবি, জেতার নিয়ম */
const EPOCH = 1700000000000;
const ROUND_DURATION = 30000;     /* একটা রাউন্ড = ৩০ সেকেন্ড, তারপর পরেরটা নিজে নিজে শুরু (আনলিমিটেড) */
const BETTING_DURATION = 22000;   /* ২২ সেকেন্ড বেট */
const SPIN_DURATION = 3000;       /* ৩ সেকেন্ড চাকা ঘোরা — এ সময় বেট বন্ধ */
/* বাকি ৫ সেকেন্ড = রেজাল্ট */
const CHIPS = [10, 100, 500, 1000];
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IMG = n => 'img/' + n + '.webp';

/* ঘরের ক্রম: উপর থেকে ঘড়ির কাঁটার দিকে ০–৭ (৩টা মিষ্টি ডানে/উপরে, ৫ গুণের ফল নিচে/বাঁয়ে) */
const ITEMS = [
  { id: 0, mult: 10, img: IMG('item_donut'),      kind: 'S' },
  { id: 1, mult: 15, img: IMG('item_icecream'),   kind: 'S' },
  { id: 2, mult: 25, img: IMG('item_cupcake'),    kind: 'S' },
  { id: 3, mult: 45, img: IMG('item_cake'),       kind: 'S' },
  { id: 4, mult: 5,  img: IMG('item_watermelon'), kind: 'F' },
  { id: 5, mult: 5,  img: IMG('item_banana'),     kind: 'F' },
  { id: 6, mult: 5,  img: IMG('item_orange'),     kind: 'F' },
  { id: 7, mult: 5,  img: IMG('item_strawberry'), kind: 'F' }
];
/* স্পেশাল: F = সব ফলের ঘর একসাথে জেতে, S = সব মিষ্টির ঘর একসাথে জেতে */
const SPECIAL = {
  F: { cells: [4, 5, 6, 7], img: IMG('item_basket'),  label: 'FRUIT' },
  S: { cells: [0, 1, 2, 3], img: IMG('item_platter'), label: 'SWEET' }
};

/* ══════ রাউন্ডের সময় — সবার জন্য একই ঘড়ি ══════ */
function getRoundInfo(){
  const now = Date.now();
  const elapsed = now - EPOCH;
  const roundIndex = Math.floor(elapsed / ROUND_DURATION);          /* অনন্য রাউন্ড নম্বর */
  const roundNumber = (roundIndex % 99999) + 1;                      /* স্ক্রিনে দেখানো নম্বর */
  const msInto = elapsed % ROUND_DURATION;
  let phase, timeLeft;
  if (msInto < BETTING_DURATION){ phase = 'BETTING'; timeLeft = BETTING_DURATION - msInto; }
  else if (msInto < BETTING_DURATION + SPIN_DURATION){ phase = 'SPINNING'; timeLeft = (BETTING_DURATION + SPIN_DURATION) - msInto; }
  else { phase = 'RESULT'; timeLeft = ROUND_DURATION - msInto; }
  return { roundIndex, roundNumber, phase, timeLeft, msInto };
}

/* ── কোন ঘর জিতবে — রাউন্ড নম্বর (idx) থেকেই ঠিক হয়, সবার জন্য একই ──
   🔒 এই অংশটা gedi/gedi-config.js আর shared/core/economy.js — দুই জায়গায় হুবহু একই রাখতে হবে।
   ফল: { cell: 0..7, special: null } অথবা { cell: -1, special: 'F' (সব ফল) | 'S' (সব মিষ্টি) } */
function gediRng(seed){ let a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const GEDI_CACHE = {};
function gediSuper(s){
  if (GEDI_CACHE[s]) return GEDI_CACHE[s];
  const r = gediRng(Math.imul(s + 7, 2654435761) ^ 0x85ebca6b);
  const sp = r() < 0.8 ? Math.floor(r() * 64) : (r(), -1);          /* ৬৪ রাউন্ডে সর্বোচ্চ ১টা স্পেশাল (খুব কম) */
  const spType = r() < 0.6 ? 'F' : 'S';
  const out = []; let lastSmall = -1, prevMood = -1;
  while (out.length < 64){
    const m = r(); let mood = m < 0.35 ? 0 : (m < 0.75 ? 1 : 2);        /* ০ = ফলের ধারা, ১ = মেশানো, ২ = বড় ঘরের ধারা */
    if (mood !== 1 && mood === prevMood) mood = 1; prevMood = mood;   /* একই ধারা পরপর দুইবার নয় */
    const len = mood === 0 ? 3 + Math.floor(r() * 7) : mood === 1 ? 3 + Math.floor(r() * 4) : 2 + Math.floor(r() * 3);
    const pBig = mood === 0 ? 0.06 : mood === 1 ? 0.34 : 0.78;
    for (let k = 0; k < len && out.length < 64; k++){
      if (out.length === sp){ out.push({ cell: -1, special: spType }); continue; }
      let cell;
      if (r() < pBig){ const x = r() * 60; cell = x < 28 ? 0 : x < 46 ? 1 : x < 56 ? 2 : 3; }   /* ১০ বেশি, ১৫, ২৫, ৪৫ সবচেয়ে কম */
      else { cell = 4 + Math.floor(r() * 4); if (cell === lastSmall && r() < 0.6) cell = 4 + Math.floor(r() * 4); lastSmall = cell; }
      out.push({ cell: cell, special: null });
    }
  }
  GEDI_CACHE[s] = out;
  return out;
}
function gediResult(idx){ return gediSuper(Math.floor(idx / 64))[((idx % 64) + 64) % 64]; }

/* এই ফলে কোন কোন ঘর জেতে */
function gediWinCells(res){ return res.special ? SPECIAL[res.special].cells.slice() : [res.cell]; }
/* কোন বেট-এর (ঘর → পরিমাণ) জন্য কত জেতা যায় */
function gediReward(bets, res){ return gediWinCells(res).reduce((s, c) => s + (Number(bets && bets[c]) || 0) * ITEMS[c].mult, 0); }

function getTodayKey(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
/* সপ্তাহের চাবি = ওই সপ্তাহের সোমবারের তারিখ */
function getWeekKey(){
  const d = new Date(); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
