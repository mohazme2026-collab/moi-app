var MOI_EXT=(function(){try{return new URL('../assets/ext/',document.currentScript.src).href}catch(e){return location.href.split('?')[0].replace(/[^\/]*\/[^\/]*$/,'')+'assets/ext/'}})();
/* game/game-config.js — গেমের স্থির মান: সময়, আইটেম, ছবি, জেতার নিয়ম */
const EPOCH = 1700000000000;
const ROUND_DURATION = 30000;
const BETTING_DURATION = 23000;
const SPIN_DURATION = 2000;
const MAX_ROUNDS = 1300;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const IMG_45 = (MOI_EXT+'gift_617cd664.webp');
const IMG_25 = (MOI_EXT+'gift_73d90815.webp');
const IMG_15 = (MOI_EXT+'gift_942f27ea.webp');
const IMG_10 = (MOI_EXT+'gift_99e92b84.webp');
const IMG_X5 = (MOI_EXT+'game_b1764363.webp');
const IMG_5 = IMG_X5;   /* মূল ফাইলে নাম মেলেনি (IMG_5 / IMG_X5) — ঠিক করা হয়েছে */

const ITEMS = [
  {id:0,mult:45,img:IMG_45,label:'45'},
  {id:1,mult:25,img:IMG_25,label:'25'},
  {id:2,mult:15,img:IMG_15,label:'15'},
  {id:3,mult:10,img:IMG_10,label:'10'},
  {id:4,mult:5,img:IMG_5,label:'5'},
  {id:5,mult:5,img:IMG_5,label:'5'},
  {id:6,mult:5,img:IMG_5,label:'5'},
  {id:7,mult:5,img:IMG_5,label:'5'}
];

/* ══════ রাউন্ডের সময় — সবার জন্য একই ঘড়ি ══════ */
function getRoundInfo(){
  const now = Date.now();
  const elapsed = now - EPOCH;
  const roundIndex = Math.floor(elapsed / ROUND_DURATION);       /* লম্বা (অনন্য) রাউন্ড নম্বর */
  const roundNumber = (roundIndex % MAX_ROUNDS) + 1;             /* স্ক্রিনে দেখানো নম্বর */
  const msInto = elapsed % ROUND_DURATION;
  let phase, timeLeft;
  if (msInto < BETTING_DURATION){
    phase = 'BETTING'; timeLeft = BETTING_DURATION - msInto;
  } else if (msInto < BETTING_DURATION + SPIN_DURATION){
    phase = 'SPINNING'; timeLeft = (BETTING_DURATION + SPIN_DURATION) - msInto;
  } else {
    phase = 'RESULT'; timeLeft = ROUND_DURATION - msInto;
  }
  return { roundIndex, roundNumber, phase, timeLeft, msInto };
}

/* কোন ঘরে থামবে — রাউন্ড নম্বর থেকেই ঠিক হয় (🔒 একই ফাংশন economy.js-এও আছে, দুটো একই রাখতে হবে) */
function getWinningIndex(roundNumber){
  let seed = (roundNumber * 9301 + 49297) % 233280;
  const r1 = seed / 233280;
  seed = (seed * 9301 + 49297) % 233280;
  const r2 = seed / 233280;
  const rand = (r1 + r2) / 2;
  const weights = [4, 10, 18, 28, 35, 35, 35, 35];
  let r = rand * 200;
  for (let i = 0; i < weights.length; i++){
    r -= weights[i];
    if (r <= 0) return i;
  }
  return 7;
}

function getTodayKey(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
