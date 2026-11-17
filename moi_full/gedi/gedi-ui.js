/* gedi/gedi-ui.js — দেখার অংশ: চাকা, ঘরের রঙ বদল, বেট ইফেক্ট, টোস্ট, পপ-আপ, তালিকা */
const HX = 195, HY = 256, RAD = 131, CS = 82;     /* চাকার কেন্দ্র, ব্যাসার্ধ, ঘরের মাপ */
const MEDALS = ['img/medal1.webp', 'img/medal2.webp', 'img/medal3.webp'];
const fmtAmt = n => { n = Number(n) || 0; return n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0', '') + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1).replace('.0', '') + 'K' : n.toLocaleString(); };
const avatarOf = (photo, name) => photo || (window.MOI_AVATAR ? MOI_AVATAR(name || 'U') : '');

/* ══════ চাকা বানানো ══════ */
function buildWheel(){
  const stage = $('wheelStage'); let html = '';
  for (let i = 0; i < 8; i++){
    const a = i * 45;
    html += `<div class="spoke" style="left:${HX}px;top:${HY - 8}px;transform:rotate(${a - 90}deg)"></div>`;
  }
  ITEMS.forEach((it, i) => {
    const rad = i * 45 * Math.PI / 180;
    const x = HX + RAD * Math.sin(rad) - CS / 2, y = HY - RAD * Math.cos(rad) - CS / 2;
    html += `<div class="cell" id="cell-${i}" data-i="${i}" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px">
      <img class="ic" src="${it.img}" alt=""><div class="lb">with ${it.mult} times</div>
      <div class="bet" id="bet-${i}">0</div>
      <div class="hot" id="hot-${i}"><img src="img/tag_hot.webp" alt=""><span>HOT</span></div></div>`;
  });
  stage.innerHTML = html;
  ITEMS.forEach((_, i) => { $('cell-' + i).addEventListener('pointerdown', e => handleTap(i, e)); });
}

/* ঘরের অবস্থা: '' (সাধারণ) | sel (আমার বেট আছে) | dim (ধূসর) | win (বিজয়ী) */
function setCell(i, state){ const el = $('cell-' + i); if (el) el.className = 'cell' + (state ? ' ' + state : ''); }
function paintBetCells(){ ITEMS.forEach((_, i) => setCell(i, userBets[i] > 0 ? 'sel' : '')); }
function setPods(kind){ $('podF').classList.toggle('on', kind === 'F'); $('podS').classList.toggle('on', kind === 'S'); }

function clearRoundUI(){
  userBets = {0:0,1:0,2:0,3:0,4:0,5:0,6:0,7:0};
  ITEMS.forEach((_, i) => { setCell(i, ''); $('bet-' + i).style.display = 'none'; $('hot-' + i).style.display = 'none'; });
  setPods(null);
  clearTimeout(window._rmTimer); $('result-modal').classList.add('hidden');
}

function updateCellBadge(i){
  const b = $('bet-' + i), amt = userBets[i];
  if (amt > 0){ b.style.display = 'flex'; b.textContent = fmtAmt(amt); }
  else b.style.display = 'none';
  if (currentPhase === 'BETTING') setCell(i, amt > 0 ? 'sel' : '');
}

/* সবচেয়ে বেশি বেট পড়া ঘরে HOT */
function updateHot(){
  const tot = [0,0,0,0,0,0,0,0];
  Object.values(roundBetsCache).forEach(u => { if (u && u.bets) Object.keys(u.bets).forEach(k => { tot[k] += Number(u.bets[k]) || 0; }); });
  let best = -1, mx = 0; tot.forEach((v, i) => { if (v > mx){ mx = v; best = i; } });
  ITEMS.forEach((_, i) => { $('hot-' + i).style.display = i === best ? 'block' : 'none'; });
}

/* ══════ বেট-এর ছোট ইফেক্ট ══════ */
function flyDiamond(sx, sy, itemId){
  const card = $('cell-' + itemId); if (!card) return;
  const r = card.getBoundingClientRect();
  const c = document.createElement('div');
  c.className = 'diamond-fly'; c.textContent = '💎';
  c.style.left = sx + 'px'; c.style.top = sy + 'px';
  c.style.setProperty('--dx', (r.left + r.width / 2 - sx) + 'px');
  c.style.setProperty('--dy', (r.top + r.height / 2 - sy) + 'px');
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 520);
}

window.selectChip = (amt) => {
  selectedChip = amt;
  document.querySelectorAll('.chip').forEach(b => b.classList.toggle('selected', Number(b.dataset.chip) === amt));
};

function showToast(msg){
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  $('gameRoot').appendChild(t);
  setTimeout(() => t.remove(), 1900);
}

/* ══════ SPIN — আলো ঘরে ঘরে ঘুরে বিজয়ীতে থামে ══════ */
function runSpinAnimation(res, startedLate){
  /* সবাইকে ধূসর করা; আমার বেট-এর ঘর আগের মতোই থাকে */
  ITEMS.forEach((_, i) => setCell(i, userBets[i] > 0 ? 'sel' : 'dim'));
  if (startedLate) return;
  const target = res.special ? (res.special === 'F' ? 4 : 0) : res.cell;
  const N = 16 + target, gaps = []; let sum = 0;
  for (let k = 0; k < N; k++){ const g = 40 + Math.pow(k / N, 2.2) * 170; gaps.push(g); sum += g; }
  const f = 2700 / sum; let step = 0, prev = -1;
  clearTimeout(window._spinT);
  (function go(){
    if (prev >= 0) setCell(prev, userBets[prev] > 0 ? 'sel' : 'dim');
    const idx = step % 8; setCell(idx, 'win'); prev = idx; step++;
    if (step <= N) window._spinT = setTimeout(go, gaps[step - 1] * f);
  })();
}

/* ══════ রেজাল্ট দেখানো ══════ */
function showFinal(res){
  const wins = gediWinCells(res);
  ITEMS.forEach((_, i) => setCell(i, wins.indexOf(i) >= 0 ? 'win' : 'dim'));
  setPods(res.special || null);
}

function showResultModal(roundNumber, res, myCost, myReward){
  clearTimeout(window._spinT);
  $('modal-round').textContent = roundNumber;
  if (res.special){ $('modal-item-icon').src = SPECIAL[res.special].img; $('modal-mult').textContent = SPECIAL[res.special].label; }
  else { $('modal-item-icon').src = ITEMS[res.cell].img; $('modal-mult').textContent = 'x' + ITEMS[res.cell].mult; }
  $('modal-reward').textContent = (myReward || 0).toLocaleString();
  $('modal-cost').textContent = (myCost || 0).toLocaleString();
  renderWinList(res);
  $('result-modal').classList.remove('hidden');
  clearTimeout(window._rmTimer);
  window._rmTimer = setTimeout(() => $('result-modal').classList.add('hidden'), 4300);   /* রেজাল্টের সময় শেষ হওয়ার একটু আগে বন্ধ */
}

/* Win List — এই রাউন্ডে যারা বেশি জিতেছে, সেরা ৩ */
function renderWinList(res){
  const tops = [213, 293, 374], hs = [53, 48, 47];
  const list = Object.values(roundBetsCache).map(u => {
    if (!u || !u.bets) return null;
    const amt = gediReward(u.bets, res);
    return amt > 0 ? { name: u.name || 'User', photo: u.photo || '', amt } : null;
  }).filter(Boolean).sort((a, b) => b.amt - a.amt).slice(0, 3);
  if (!list.length){
    $('win-list').innerHTML = `<div class="wl empty" style="top:${tops[0]}px;height:${hs[0]}px">No winners this round</div>`;
    return;
  }
  $('win-list').innerHTML = list.map((u, i) => `<div class="wl" style="top:${tops[i]}px;height:${hs[i]}px">
    <img class="md" src="${MEDALS[i]}" alt=""><img class="pf" src="${esc(avatarOf(u.photo, u.name))}" alt="">
    <span class="nm">${esc(u.name)}</span><span class="am">💎 ${u.amt.toLocaleString()}</span></div>`).join('');
}

/* শেষ ৮ ফল — নতুনটা সবার বাঁয়ে (NEW) */
function renderHistory(results){
  const c = $('history-container'); const list = results.slice().reverse(); let html = '';
  list.forEach((r, k) => {
    const src = r.special ? SPECIAL[r.special].img : ITEMS[r.cell].img;
    html += `<div class="hc" style="left:${(59 + k * 33.6).toFixed(1)}px"><img src="${src}" alt="">${k === 0 ? '<img class="nw" src="img/tag_new.webp" alt="">' : ''}</div>`;
  });
  c.innerHTML = html;
}

/* নিচের বারে আজকের সেরা জন */
function renderTopAvatars(list){
  const c = $('topAvatars'); const u = list && list[0];
  if (!u){ c.innerHTML = ''; return; }
  c.innerHTML = `<img class="av" src="${esc(avatarOf(u.photo, u.name))}" alt=""><div class="nm">${esc(u.name || 'User')}</div><div class="am">💎 ${(u.amount || 0).toLocaleString()}</div>`;
}

/* ══════ র‍্যাংকিং ও রুল পপ-আপ ══════ */
let rankKind = 'daily';
window.openRank = () => { $('rank-modal').classList.remove('hidden'); switchRank(rankKind); };
window.closeRank = () => $('rank-modal').classList.add('hidden');
window.switchRank = async (kind) => {
  rankKind = kind;
  document.querySelectorAll('#rank-tabs button').forEach(b => b.classList.toggle('on', b.dataset.k === kind));
  const box = $('rank-list'); box.innerHTML = '<div class="rk empty">Loading...</div>';
  const list = await GameData.top(kind, 20);
  if (kind !== rankKind) return;
  box.innerHTML = list.length ? list.map((u, i) => `<div class="rk${u.uid === GameData.me.uid ? ' me' : ''}">
    <div class="no">${i < 3 ? `<img src="${MEDALS[i]}" alt="">` : i + 1}</div><img class="pf" src="${esc(avatarOf(u.photo, u.name))}" alt="">
    <span class="nm">${esc(u.name || 'User')}</span><span class="am">💎 ${(u.amount || 0).toLocaleString()}</span></div>`).join('')
    : '<div class="rk empty">Nobody has won yet</div>';
};
window.openRule = () => $('rule-modal').classList.remove('hidden');
window.closeRule = () => $('rule-modal').classList.add('hidden');
window.toggleMusic = () => {
  const off = !(localStorage.getItem('gedi_music_off') === '1');
  try { localStorage.setItem('gedi_music_off', off ? '1' : '0'); } catch(e){}
  $('btnMusic').style.opacity = off ? '.45' : '1';
};
