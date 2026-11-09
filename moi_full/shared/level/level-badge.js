/* shared/level-badge.js — ইউজার লেভেল ব্যাজ (সব পেজে একই) — window.MOILv
   ▸ লেভেল ১–১০০; প্রতি ১০ লেভেলে রং বদলায় (১–৯, ১০–১৯, ২০–২৯ … ৯০–১০০)
   ▸ ৫০+ এ ঝিলিক, ৮০+ এ মুকুট আরও জমকালো
   ▸ ব্যবহার: MOILv.badge(47, {h:22})  → HTML স্ট্রিং; MOILv.plate(user) → লেভেল + প্রোগ্রেস প্লেট
   ⚙️ আসল ডিজাইন ছবি আসলে: TIER_IMG = { 10:'../assets/ulv/b10.webp', ... } দিলে ওই ছবির ওপর নম্বর বসবে */
(function(){
'use strict';
/* [হালকা, মাঝ, গাঢ়, বর্ডার, গ্লো] */
const TIERS = [
  ['#c9d3dc','#8c9aa8','#4f5d6b','#eef3f7','rgba(160,175,190,.5)'],   /* ১–৯   ইস্পাত */
  ['#9ff0c2','#2fc47a','#0d7a49','#e4fff0','rgba(60,210,130,.55)'],   /* ১০–১৯ সবুজ */
  ['#9fe6f5','#22b3d1','#0b6b88','#e0f9ff','rgba(50,190,225,.55)'],   /* ২০–২৯ আকাশি */
  ['#a9c7ff','#3b7cf0','#1a3fa8','#e5eeff','rgba(70,130,255,.55)'],   /* ৩০–৩৯ নীল */
  ['#d6b8ff','#8a52e6','#4a229c','#f1e6ff','rgba(150,100,255,.6)'],   /* ৪০–৪৯ বেগুনি */
  ['#ffb8e6','#e63fae','#8f1470','#ffe6f6','rgba(240,80,190,.6)'],    /* ৫০–৫৯ গোলাপি */
  ['#ffc2a8','#f2562c','#9c2108','#ffe9e0','rgba(255,100,60,.6)'],    /* ৬০–৬৯ কমলা-লাল */
  ['#ffe49a','#f0b020','#9a6200','#fff6d6','rgba(255,195,50,.65)'],   /* ৭০–৭৯ সোনালি */
  ['#fff1b8','#ffcf33','#c47a00','#fffbe6','rgba(255,210,60,.75)'],   /* ৮০–৮৯ উজ্জ্বল সোনা */
  ['#ffd0e8','#ff5cb8','#a0006a','#fff0f9','rgba(255,120,200,.8)']    /* ৯০–১০০ রাজকীয় */
];
const TIER_IMG = {};   /* পরে ছবি দিলে এখানে */
const tierOf = n => Math.max(0, Math.min(9, Math.floor((Math.max(1, n) ) / 10)));
let uid = 0;
function clampLv(n){ n = Math.floor(Number(n) || 1); return Math.max(1, Math.min(100, n)); }

function badge(n, o){
  n = clampLv(n); o = o || {};
  const t = tierOf(n), c = TIERS[t], h = o.h || 22, id = 'lvg' + (++uid);
  const w = Math.round(h * 1.18), fs = n >= 100 ? 15 : n >= 10 ? 19 : 22;
  const crown = t >= 3 ? `<path d="M19 9l3.500-5 4 4 2.500-5 2.500 5 4-4 3.500 5z" fill="${c[3]}" stroke="${c[2]}" stroke-width=".9" stroke-linejoin="round"/>` : '';
  const wings = t >= 1 ? `<path d="M10 22c-4-1-7-4-9-9 4 0 7 1 9 3z M44 22c4-1 7-4 9-9-4 0-7 1-9 3z" fill="${c[0]}" stroke="${c[2]}" stroke-width=".8"/>` + (t >= 5 ? `<path d="M9 28c-4 0-7-2-8-6 3 0 6 1 8 2z M45 28c4 0 7-2 8-6-3 0-6 1-8 2z" fill="${c[0]}" stroke="${c[2]}" stroke-width=".8"/>` : '') : '';
  return `<span class="moilv t${t}${n >= 50 ? ' shine' : ''}" style="height:${h}px;width:${w}px;--lg:${c[4]}" title="Level ${n}">
  <svg viewBox="0 0 54 50" width="${w}" height="${h}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".5" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient></defs>
  ${wings}${crown}
  <path d="M27 9l14 5.500v13c0 8-6 14-14 17.500C19 41.500 13 35.500 13 27.500v-13z" fill="url(#${id})" stroke="${c[3]}" stroke-width="1.800" stroke-linejoin="round"/>
  <path d="M27 13l10 4v10.500c0 5.500-4 10-10 13-6-3-10-7.500-10-13V17z" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1"/>
  <path d="M17 17l10-3.500 10 3.500-3 5H20z" fill="#fff" opacity=".22"/>
  <text x="27" y="${n >= 10 ? 31.500 : 32}" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-size="${fs}" font-weight="800" fill="#fff" stroke="${c[2]}" stroke-width="2.600" paint-order="stroke" letter-spacing="-.5">${n}</text></svg></span>`;
}

/* ইউজারের লেভেল ও পরের লেভেলের প্রোগ্রেস (Level পেজের সূত্র: লেভেল n = ১০০·n·(n−1) কয়েন) */
function info(u){
  u = u || {};
  const lv = clampLv(u.level), cur = 100 * lv * (lv - 1), nxt = 100 * (lv + 1) * lv;
  const used = Math.max(0, Number(u.giftsSent) || 0, (Number(u.xp) || 0) * 2, cur);
  const pct = lv >= 100 ? 100 : Math.max(0, Math.min(100, Math.round((used - cur) / (nxt - cur) * 100)));
  return { lv, pct, left: lv >= 100 ? 0 : Math.max(0, nxt - used) };
}
function plate(u){
  const i = info(u), t = tierOf(i.lv), c = TIERS[t];
  return `<div class="moilv-plate t${t}" style="--lg:${c[4]};--lc:${c[1]};--ld:${c[2]}">
    ${badge(i.lv, { h: 40 })}
    <div class="mp-t"><b>Level ${i.lv}</b><small>${i.lv >= 100 ? 'সর্বোচ্চ লেভেল' : 'পরের লেভেলে আর ' + i.left.toLocaleString('en') + ' বাকি'}</small>
      <div class="mp-bar"><i style="width:${i.pct}%"></i></div></div></div>`;
}
const css = `.moilv{display:inline-flex;vertical-align:middle;position:relative;flex:0 0 auto;filter:drop-shadow(0 2px 4px var(--lg))}
.moilv svg{display:block;overflow:visible}
.moilv.shine::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 40%,rgba(255,255,255,.75) 50%,transparent 60%) 0 0/260% 100%;mix-blend-mode:overlay;animation:moilvSw 3s linear infinite;border-radius:30%}
@keyframes moilvSw{from{background-position:160% 0}to{background-position:-60% 0}}
.moilv-plate{display:flex;align-items:center;gap:12px;padding:10px 14px 10px 12px;border-radius:18px;color:#fff;background:linear-gradient(135deg,color-mix(in srgb,var(--lc) 38%,#0b1c20),color-mix(in srgb,var(--ld) 55%,#07121a));border:1px solid color-mix(in srgb,var(--lc) 60%,transparent);box-shadow:0 8px 20px -10px var(--lg),inset 0 1px 0 rgba(255,255,255,.18)}
.moilv-plate .mp-t{flex:1;min-width:0}
.moilv-plate b{display:block;font:800 15px Poppins,Arial,sans-serif}
.moilv-plate small{display:block;font-size:11px;opacity:.8;margin-top:1px}
.mp-bar{height:6px;border-radius:3px;background:rgba(0,0,0,.35);margin-top:7px;overflow:hidden}
.mp-bar i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,var(--lc),#fff);box-shadow:0 0 8px var(--lg)}`;
(function(){ try { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); } catch(e){} })();
window.MOILv = { badge, plate, info, tierOf, TIERS };
})();
