/* ludo/ludo-ui.js — দেখার অংশ: ৩ডি ডাইস, ঘর, বেট ইফেক্ট, টোস্ট, পপ-আপ, তালিকা */
const MEDALS = ['img/medal1.webp', 'img/medal2.webp', 'img/medal3.webp'];
const fmtAmt = n => { n = Number(n) || 0; return n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0', '') + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1).replace('.0', '') + 'K' : n.toLocaleString(); };
const avatarOf = (photo, name) => photo || (window.MOI_AVATAR ? MOI_AVATAR(name || 'U') : '');

/* ══════ ডাইসের পিঠ ══════ */
const PIPS = { 1: [[2,2]], 2: [[1,1],[3,3]], 3: [[1,1],[2,2],[3,3]], 4: [[1,1],[3,1],[1,3],[3,3]], 5: [[1,1],[3,1],[2,2],[1,3],[3,3]], 6: [[1,1],[3,1],[1,2],[3,2],[1,3],[3,3]] };
function pipsHTML(n){ return PIPS[n].map(p => `<i style="grid-column:${p[0]};grid-row:${p[1]}"></i>`).join(''); }
/* চ্যাপ্টা এক পিঠ (ঘর, হিস্ট্রি, রেজাল্টে) */
function flatDie(n, size){ return `<div class="fd${n === 1 || n === 4 ? ' red' : ''}${n === 1 ? ' one' : ''}" style="--s:${size}px">${pipsHTML(n)}</div>`; }

/* ৩ডি কিউব: ১ সামনে, ৬ পিছনে, ২ ডানে, ৫ বামে, ৩ উপরে, ৪ নিচে (উল্টো পিঠের যোগফল ৭) */
function buildDie(){
  let h = '';
  for (let n = 1; n <= 6; n++) h += `<div class="fd f f${n}${n === 1 || n === 4 ? ' red' : ''}${n === 1 ? ' one' : ''}">${pipsHTML(n)}</div>`;
  $('die3d').innerHTML = h;
}
/* কোন নম্বর সামনে আনতে কিউব কত ঘুরবে [X°, Y°] */
const DIE_ORI = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] };
const tiltOf = idx => ((idx * 53) % 25) - 12;                    /* থামার পর সামান্য কাত (সবার জন্য একই) */

/* ডাইস থেমে আছে এমন অবস্থায় n দেখানো */
function setDieStatic(n, idx){
  const el = $('die3d'), o = DIE_ORI[n] || DIE_ORI[2];
  el.style.transition = 'none';
  el.style.transform = `rotateZ(${tiltOf(idx)}deg) rotateX(${o[0]}deg) rotateY(${o[1]}deg)`;
  $('dieHop').classList.remove('hop'); $('dieShadow').classList.remove('hop');
}
/* ডাইস গড়িয়ে গড়িয়ে ঘুরে n-এ থামে */
function rollDie(n, idx, ms){
  const el = $('die3d'), o = DIE_ORI[n], hop = $('dieHop'), sh = $('dieShadow'), sec = ((ms || 3800) / 1000);
  const k = 1 + Math.floor(sec / 1.6);                                  /* বেশি সময় = বেশি পাক */
  hop.classList.remove('hop'); sh.classList.remove('hop');
  el.style.transition = 'none'; el.style.transform = 'rotateZ(-70deg) rotateX(0deg) rotateY(0deg)';
  hop.style.animationDuration = sh.style.animationDuration = sec + 's';
  void el.offsetWidth;
  hop.classList.add('hop'); sh.classList.add('hop');
  el.style.transition = 'transform ' + (sec * .95) + 's cubic-bezier(.16,.6,.22,1)';
  el.style.transform = `rotateZ(${tiltOf(idx)}deg) rotateX(${o[0] + 360 * k}deg) rotateY(${o[1] + 360 * (k + 1)}deg)`;
}

/* ══════ ঘর (২–৬) ══════ */
function buildBoxes(){
  let h = '';
  NUMS.forEach((n, i) => {
    h += `<div class="box" id="box-${n}" style="left:${25 + i * 70}px">${flatDie(n, 32)}<div class="mx">x${n}</div><div class="bet" id="bet-${n}">0</div></div>`;
  });
  $('boxes').innerHTML = h;
  NUMS.forEach(n => { $('box-' + n).addEventListener('pointerdown', e => handleTap(n, e)); });
}
function setBox(n, state){ const el = $('box-' + n); if (el) el.className = 'box' + (state ? ' ' + state : ''); }
function paintBetBoxes(){ NUMS.forEach(n => setBox(n, userBets[n] > 0 ? 'sel' : '')); }

function clearRoundUI(){
  userBets = {2:0,3:0,4:0,5:0,6:0};
  NUMS.forEach(n => { setBox(n, ''); $('bet-' + n).style.display = 'none'; });
  clearTimeout(window._rmTimer); $('result-modal').classList.add('hidden');
  $('winPill').classList.add('hidden');
}
function updateBoxBadge(n){
  const b = $('bet-' + n), amt = userBets[n];
  if (amt > 0){ b.style.display = 'flex'; b.textContent = fmtAmt(amt); }
  else b.style.display = 'none';
  if (currentPhase === 'BETTING') setBox(n, amt > 0 ? 'sel' : '');
}

/* ══════ বেট-এর ছোট ইফেক্ট ══════ */
function flyDiamond(sx, sy, n){
  const card = $('box-' + n); if (!card) return;
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

/* ══════ রেজাল্ট ══════ */
function showFinal(n){
  NUMS.forEach(k => setBox(k, k === n ? 'win' : (userBets[k] > 0 ? 'dim' : 'dim')));
}
function showResultModal(roundNumber, n, myCost, myReward){
  $('modal-round').textContent = roundNumber;
  $('modal-die').innerHTML = flatDie(n, 66);
  $('modal-mult').textContent = 'x' + n;
  $('modal-reward').textContent = (myReward || 0).toLocaleString();
  $('modal-cost').textContent = (myCost || 0).toLocaleString();
  renderWinList(n);
  $('result-modal').classList.remove('hidden');
  clearTimeout(window._rmTimer);
  window._rmTimer = setTimeout(() => $('result-modal').classList.add('hidden'), 4300);   /* রেজাল্টের সময় শেষ হওয়ার একটু আগে বন্ধ */
}
/* Win List — এই রাউন্ডে যারা বেশি জিতেছে, সেরা ৩ */
function renderWinList(n){
  const tops = [213, 293, 374], hs = [53, 48, 47];
  const list = Object.values(roundBetsCache).map(u => {
    if (!u || !u.bets) return null;
    const amt = ludoReward(u.bets, n);
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
function showWinPill(amount){
  if (amount > 0){ $('winAmt').textContent = '+' + amount.toLocaleString(); $('winPill').classList.remove('hidden'); }
}
/* শেষ ৮ ফল — নতুনটা সবার বাঁয়ে (NEW) */
function renderHistory(results){
  const c = $('history-container'); const list = results.slice().reverse(); let html = '';
  list.forEach((r, k) => {
    html += `<div class="hc" style="left:${(59 + k * 33.6).toFixed(1)}px">${flatDie(r, 19)}${k === 0 ? '<img class="nw" src="img/tag_new.webp" alt="">' : ''}</div>`;
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
  const off = !(localStorage.getItem('ludo_music_off') === '1');
  try { localStorage.setItem('ludo_music_off', off ? '1' : '0'); } catch(e){}
  $('btnMusic').style.opacity = off ? '.45' : '1';
};
