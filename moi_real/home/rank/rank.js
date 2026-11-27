/* home/rank.js — Rank পেজ + CP পেজ (ওভারলে, ডেমো ডাটা) */
(function(){
const GEM = '<svg class="gm" viewBox="0 0 24 24"><defs><linearGradient id="gmg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd6f2"/><stop offset=".5" stop-color="#ff5fb0"/><stop offset="1" stop-color="#a21caf"/></linearGradient></defs><path d="M6 3h12l4 6-10 12L2 9z" fill="url(#gmg)" stroke="#fff" stroke-opacity=".7" stroke-width=".8"/><path d="M2 9h20M9 3l-2 6 5 12M15 3l2 6-5 12" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".7"/></svg>';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const h = s => { let x = 0; s = String(s); for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) >>> 0; return x; };
function fmt(n){ n = Math.round(n); if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'; return String(n); }
function users(){ let u = []; try { u = Object.values(window.DEMO && DEMO.USERS || {}); } catch(e){} return u.filter(x => x && x.name && x.uid !== (window.user && user.uid)); }
function ava(u, cls){ const n = (u.name || '?').trim()[0] || '?'; return `<span class="ra ${cls || ''}">${u.photo ? `<img src="${esc(u.photo)}" alt="" onerror="this.remove()">` : ''}<em>${esc(n)}</em></span>`; }
const PER = { daily: .05, weekly: .35, monthly: 1 };

/* ═══ Rank ডাটা ═══ */
function rankRows(tab, per){
  const k = PER[per];
  let rows;
  if (tab === 'room'){
    let rooms = []; try { rooms = window.allRooms ? allRooms() : []; } catch(e){}
    rows = rooms.map(r => ({ id: r.id, name: r.name, img: r.logo, v: (40000 + (h(r.id) % 900000) + r.listeners * 5000) * k }));
  } else {
    const f = { send: 'giftsSent', receive: 'giftsReceived', recharge: 'diamonds' }[tab];
    rows = users().map(u => ({ id: u.uid, name: u.name, img: u.photo, flag: u.country, v: ((u[f] || 0) * 90 + h(u.uid + tab) % 5000) * k }));
  }
  rows.sort((a, b) => b.v - a.v);
  return rows.slice(0, 30);
}
function avRow(r){ const n = (r.name || '?').trim()[0]; return `<span class="ra">${r.img ? `<img src="${esc(r.img)}" alt="" onerror="this.remove()">` : ''}<em>${esc(n)}</em></span>`; }
function renderRank(st){
  const rows = rankRows(st.tab, st.per), top = rows.slice(0, 3), rest = rows.slice(3);
  const pod = [1, 0, 2].map(i => top[i] ? `<div class="pod p${i + 1}"><div class="frame"><b class="num">${i + 1}</b>${avRow(top[i])}</div><div class="pn">${esc(top[i].name)}</div><div class="pv">${GEM}${fmt(top[i].v)}</div></div>` : '').join('');
  return `<div class="podium">${pod}</div><div class="rlist">${rest.map((r, i) => `<div class="rrow"><span class="rk">${i + 4}</span>${avRow(r)}<span class="rn">${esc(r.name)}</span><span class="rv">${fmt(r.v)}${GEM}</span></div>`).join('') || '<div class="rempty">কেউ নেই</div>'}</div>`;
}

/* ═══ CP ডাটা ═══ */
function cpRows(per){
  const us = users().filter(u => u.photo).sort((a, b) => h(a.uid) - h(b.uid));
  const rows = [], k = PER[per === 'weekly' ? 'weekly' : 'monthly'];
  for (let i = 0; i + 1 < us.length && rows.length < 20; i += 2) rows.push({ a: us[i], b: us[i + 1], d: 5 + h(us[i].uid) % 320, v: (900000 + h(us[i].uid + us[i + 1].uid) % 52000000) * k });
  return rows.sort((a, b) => b.v - a.v);
}
function pair(c){ return `<span class="pair">${ava(c.a)}${ava(c.b)}<i class="dy"><b>${c.d}</b>DAY</i></span>`; }
function nextSunday(){ const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + (7 - d.getDay())); return d.getTime(); }
/* ═══ নতুন CP ডিজাইন (গ্যালাক্সি) — ফ্রেম ছবি: rank/assets/cp/*.webp ═══
   গোলের জায়গা GEO-তে (% এ: [x, y = কেন্দ্র, ব্যাস] ফ্রেমের চওড়া ধরে) */
const GEO = {
  top1:{ ar:'724/514', a:[35.29,48.35,28.04], b:[64.43,48.35,28.04], rib:[49.86,19.65], day:[49.86,60.5] },
  top2:{ ar:'328/316', a:[28.81,44.78,38.11], b:[70.43,44.78,37.96], rib:[48.17,15.82], day:[50,57.5] },
  top3:{ ar:'326/314', a:[28.68,44.75,38.96], b:[70.71,44.75,38.96], rib:[49.39,15.61], day:[49.7,57] },
  row:{ ar:'690/135', a:[17.54,49.63,12.61], b:[37.32,49.63,12.54] },
  me:{ ar:'690/135', a:[17.61,50,12.46], b:[37.32,50,12.46] }
};
function gav(u, g){
  const n = ((u && u.name) || '?').trim()[0] || '?';
  return `<span class="gx-av" style="left:${g[0]}%;top:${g[1]}%;width:${g[2]}%">${u && u.photo ? `<img src="${esc(u.photo)}" alt="" onerror="this.remove()">` : ''}<em>${esc(n)}</em></span>`;
}
function gdayPill(c, G){ return `<i class="gx-day" style="left:${G.day[0]}%;top:${G.day[1]}%"><b>${c.d}</b> DAY</i>`; }
function gcard(k, c, rank){
  const G = GEO[k];
  const card = `<div class="gx-card ${k}" style="aspect-ratio:${G.ar}">${gav(c.a, G.a)}${gav(c.b, G.b)}<img class="gx-fr" src="rank/assets/cp/${k}.webp" alt="" draggable="false"><b class="gx-rib" style="left:${G.rib[0]}%;top:${G.rib[1]}%">TOP ${rank}</b>${gdayPill(c, G)}${k !== 'top1' ? `<div class="gx-in"><div class="gx-nm">${esc(c.a.name)} <s>♥</s> ${esc(c.b.name)}</div><div class="gx-vl">${GEM}${fmt(c.v)}</div></div>` : ''}</div>`;
  if (k !== 'top1') return card;
  return card + `<div class="gx-info"><div class="gx-nm">${esc(c.a.name)} <s>♥</s> ${esc(c.b.name)}</div><div class="gx-vl">${GEM}${fmt(c.v)}</div></div>`;
}
function grow(c, i){
  const G = GEO.row;
  return `<div class="gx-row" style="aspect-ratio:${G.ar};animation-delay:${Math.min(i, 8) * .04}s">${gav(c.a, G.a)}${gav(c.b, G.b)}<img class="gx-fr" src="rank/assets/cp/row.webp" alt="" draggable="false"><span class="gx-rk">${i + 4}</span><div class="gx-rn"><b>${esc(c.a.name)} <s>♥</s> ${esc(c.b.name)}</b><span class="gx-dd"><img src="rank/assets/cp/day.webp" alt="">${c.d} DAY</span></div><div class="gx-sk">${GEM}<b>${fmt(c.v)}</b></div></div>`;
}
/* নিচে আটকে থাকা "আমার অবস্থান" সারি */
function gme(){
  const G = GEO.me, u = window.user || {};
  const me = { name: u.name || 'আমি', photo: u.photo || u.avatar || '' };
  return `<div class="gx-me"><div class="gx-row" style="aspect-ratio:${G.ar}">${gav(me, G.a)}<button class="gx-plus" aria-label="সঙ্গী বাছাই" style="left:${G.b[0]}%;top:${G.b[1]}%;width:${G.b[2]}%">+</button><img class="gx-fr" src="rank/assets/cp/me.webp" alt="" draggable="false"><span class="gx-rk">--</span><div class="gx-rn"><b>${esc(me.name)}</b><span class="gx-dd">--</span></div><div class="gx-sk">${GEM}<b>0</b></div></div></div>`;
}
function renderCp(st){
  const rows = cpRows(st.per);
  const t1 = rows[0], t2 = rows[1], t3 = rows[2], rest = rows.slice(3);
  return `<div class="gx-t1">${t1 ? gcard('top1', t1, 1) : ''}</div>
  <div class="gx-duo">${t2 ? gcard('top2', t2, 2) : '<div></div>'}${t3 ? gcard('top3', t3, 3) : '<div></div>'}</div>
  <div class="gx-list">${rest.map((c, i) => grow(c, i)).join('')}</div>`;
}

/* ═══ ওভারলে ═══ */
let el = null, st = null, tick = null;
function close(fromPop){ if (!el) return; el.classList.remove('show'); clearInterval(tick); const e = el; setTimeout(() => e.remove(), 280); el = null; if (!fromPop && history.state && history.state.moiRank) history.back(); }
function open(kind){
  if (el) return;
  st = { kind, tab: 'room', per: kind === 'cp' ? 'weekly' : 'daily' };
  el = document.createElement('div');
  el.className = 'rk-page ' + kind + (kind === 'cp' ? ' gx' : '');
  document.body.appendChild(el);
  history.pushState({ moiRank: 1 }, '');
  draw(true);
  requestAnimationFrame(() => el && el.classList.add('show'));
  if (kind === 'cp') tick = setInterval(clock, 1000);
}
function draw(first){
  const isCp = st.kind === 'cp';
  const tabs = isCp ? '' : `<div class="rk-tabs">${[['room','রুম'],['send','সেন্ড'],['receive','রিসিভ'],['recharge','রিচার্জ']].map(([k, l]) => `<button data-tab="${k}" class="${st.tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const pers = isCp ? [['weekly','সাপ্তাহিক'],['monthly','মাসিক']] : [['daily','আজ'],['weekly','সপ্তাহ'],['monthly','মাস']];
  el.innerHTML = `<div class="rk-bg"><i class="r1"></i><i class="r2"></i><i class="r3"></i><div class="spark"></div></div>
  <div class="rk-top"><button class="rk-back" data-x aria-label="পেছনে">‹</button>${tabs || '<div class="rk-ttl">CP র‍্যাংকিং</div>'}<span class="rk-sp"></span></div>
  <div class="rk-head"><h1>${isCp ? 'WEEKLY <b>CP</b>' : 'RANK <b>BOARD</b>'}</h1><p>${isCp ? 'ভালোবাসার জুটির সেরা তালিকা' : 'গৌরব · সম্মান · কিংবদন্তি'}</p>${isCp ? '<div class="clock" id="clk"></div>' : ''}</div>
  <div class="rk-seg" data-n="${pers.length}"><i style="--i:${pers.findIndex(p => p[0] === st.per)}"></i>${pers.map(([k, l]) => `<button data-per="${k}" class="${st.per === k ? 'on' : ''}">${l}</button>`).join('')}</div>
  <div class="rk-body" id="rkBody">${isCp ? renderCp(st) : renderRank(st)}</div>${isCp ? gme() : ''}`;
  if (isCp) clock();
  if (!first) el.classList.add('show');
}
function clock(){
  const c = document.getElementById('clk'); if (!c) return;
  let s = Math.max(0, Math.floor((nextSunday() - Date.now()) / 1000));
  const d = Math.floor(s / 86400); s %= 86400; const hh = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60); s %= 60;
  const p = n => String(n).padStart(2, '0');
  c.innerHTML = [[d,'D'],[hh,'H'],[m,'M'],[s,'S']].map(([n, l]) => `<span><b>${p(n)}</b><small>${l}</small></span>`).join('<em>:</em>');
}
document.addEventListener('click', (e) => {
  const g = e.target.closest('#pcards [data-go]');
  if (g){ open(g.dataset.go === 'cp' ? 'cp' : 'rank'); return; }
  if (!el || !el.contains(e.target)) return;
  if (e.target.closest('.gx-plus')){ if (window.toastMsg) toastMsg('সঙ্গী বাছাই — শীঘ্রই আসছে'); return; }
  if (e.target.closest('[data-x]')) return close();
  const t = e.target.closest('[data-tab]'); if (t){ st.tab = t.dataset.tab; draw(); return; }
  const p = e.target.closest('[data-per]'); if (p){ st.per = p.dataset.per; draw(); }
}, true);
window.addEventListener('popstate', () => { if (el) close(true); });
window.MOIRank = { open };
})();
