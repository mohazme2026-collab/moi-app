/* game/game-ui.js — দেখার অংশ: চাকা, বেট-এর ছোট অ্যানিমেশন, টোস্ট, রেজাল্ট মডাল, তালিকা
   (ডিজাইন ও অ্যানিমেশন আগের মতোই, শুধু ফাইল ভাগ করা হয়েছে) */

/* ══════ WHEEL ══════ */
function buildWheel(){
  const stage = $('wheelStage');
  ITEMS.forEach((item, idx) => {
    const angle = idx * 45;
    const el = document.createElement('div');
    el.className = 'wheel-item';
    el.style.setProperty('--angle', angle + 'deg');
    el.dataset.itemId = idx;
    const hasImg = !!item.img;
    const imgTag = hasImg ? `<img src="${item.img}" onerror="this.parentElement.innerHTML='${item.mult}';">` : item.mult;
    el.innerHTML = `
      <div class="wheel-item-card ${hasImg ? 'has-img' : ''}" id="card-${idx}">
        <div class="note-img">${imgTag}</div>
        <span class="mult-pill">x${item.mult}</span>
        <div id="coin-${idx}" class="diamond-badge" style="display:none;">0</div>
      </div>
    `;
    el.addEventListener('click', (e) => handleTap(idx, e));
    stage.appendChild(el);
  });
}

function clearRoundUI(){
  userBets = {0:0,1:0,2:0,3:0,4:0,5:0,6:0,7:0};
  ITEMS.forEach((_, i) => {
    const badge = $('coin-' + i);
    if (badge){ badge.style.display = 'none'; badge.textContent = '0'; }
    const el = document.querySelector(`.wheel-item[data-item-id="${i}"]`);
    if (el) el.classList.remove('has-user-bet', 'spinning-active');
  });
  $('result-modal').classList.add('hidden');
}

/* ══════ বেট-এর ছোট ইফেক্ট ══════ */
function flyDiamond(sx, sy, itemId){
  const card = $('card-' + itemId);
  if (!card) return;
  const r = card.getBoundingClientRect();
  const dx = r.left + r.width/2 - sx;
  const dy = r.top + r.height/2 - sy;
  const c = document.createElement('div');
  c.className = 'diamond-fly';
  c.textContent = '💎';
  c.style.left = sx + 'px';
  c.style.top = sy + 'px';
  c.style.setProperty('--dx', dx + 'px');
  c.style.setProperty('--dy', dy + 'px');
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 600);
}

function pulseCard(id){
  const el = document.querySelector(`.wheel-item[data-item-id="${id}"]`);
  if (!el) return;
  el.classList.add('tapped');
  setTimeout(() => el.classList.remove('tapped'), 220);
}

function updateCardBadge(id){
  const badge = $('coin-' + id);
  const el = document.querySelector(`.wheel-item[data-item-id="${id}"]`);
  const amt = userBets[id];
  if (amt > 0){
    badge.style.display = 'flex';
    badge.textContent = '💎' + amt;
    el.classList.add('has-user-bet');
  } else {
    badge.style.display = 'none';
    el.classList.remove('has-user-bet');
  }
}

window.selectChip = (amt) => {
  selectedChip = amt;
  document.querySelectorAll('.chip-button').forEach(b => b.classList.remove('selected'));
  const sel = document.querySelector(`.chip-button[data-chip="${amt}"]`);
  if (sel) sel.classList.add('selected');
};

function showToast(msg){
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1900);
}

/* ══════ SPIN ══════ */
function runSpinAnimation(roundNumber){
  const winningIndex = getWinningIndex(roundNumber);
  const totalSteps = 40 + winningIndex;
  let step = 0;
  let speed = 45;

  function go(){
    document.querySelectorAll('.wheel-item').forEach(el => el.classList.remove('spinning-active'));
    const idx = step % 8;
    const el = document.querySelectorAll('.wheel-item')[idx];
    if (el) el.classList.add('spinning-active');
    step++;
    if (step <= totalSteps){
      if (totalSteps - step < 10) speed += 35;
      else if (totalSteps - step < 18) speed += 15;
      setTimeout(go, speed);
    }
  }
  go();
}

/* ══════ RESULT মডাল ══════ */
function showResultModal(roundNumber, winnerIdx, myCost, myReward, item){
  $('modal-round').textContent = roundNumber;
  const iconEl = $('modal-item-icon');
  if (item.img){
    iconEl.innerHTML = `<img src="${item.img}" style="width:100%;height:100%;object-fit:cover;background:#fff;border-radius:6px;">`;
  } else {
    iconEl.textContent = item.mult;
  }
  $('modal-item-multiplier').textContent = 'x' + item.mult;
  $('modal-reward').textContent = '💎 ' + myReward.toLocaleString();
  $('modal-cost').textContent = '💎 ' + myCost.toLocaleString();
  renderWinList(winnerIdx);
  $('result-modal').classList.remove('hidden');

  let cd = 5;
  $('modal-countdown').textContent = `(${cd})`;
  clearInterval(window._cdIv);
  window._cdIv = setInterval(() => {
    cd--;
    if (cd >= 0) $('modal-countdown').textContent = `(${cd})`;
    else { clearInterval(window._cdIv); $('result-modal').classList.add('hidden'); }
  }, 1000);
}

function renderWinList(winnerIdx){
  const list = Object.values(roundBetsCache)
    .map(u => {
      if (!u || !u.bets) return null;
      const amt = u.bets[winnerIdx] || 0;
      if (amt <= 0) return null;
      return { uid: u.uid, name: u.name || 'User', photo: u.photo || '', amt: amt * ((ITEMS[winnerIdx] && ITEMS[winnerIdx].mult) || 1) };   /* বেট × গুণ = আসল জেতা ডায়মন্ড */
    })
    .filter(Boolean)
    .sort((a,b) => b.amt - a.amt)
    .slice(0, 3);

  if (list.length === 0){
    $('win-list').innerHTML = '<div style="color:#a78bfa;font-size:11px;font-style:italic;text-align:center;padding:8px">এই রাউন্ডে কেউ bet করেনি</div>';
    return;
  }
  const medals = ['🥇','🥈','🥉'];
  $('win-list').innerHTML = list.map((u, i) => `
    <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(60,20,100,.4);padding:8px;border-radius:12px;border:1px solid rgba(168,85,247,.3);margin-bottom:6px">
      <div style="display:flex;align-items:center;gap:8px">
        <span>${medals[i] || ''}</span>
        <img src="${u.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name)}" style="width:28px;height:28px;border-radius:50%;border:1px solid #facc15;object-fit:cover">
        <span style="color:#fff;font-weight:700;font-size:12px">${esc(u.name)}</span>
      </div>
      <span style="color:#67e8f9;font-weight:900;font-size:12px">💎 ${u.amt.toLocaleString()}</span>
    </div>
  `).join('');
}

function renderHistory(indices){
  const c = $('history-container');
  c.innerHTML = '';
  indices.forEach((id, idx) => {
    const item = ITEMS[id];
    if (!item) return;
    const imgTag = item.img ? `<img src="${item.img}" style="width:100%;height:100%;object-fit:cover">` : item.mult;
    const el = document.createElement('div');
    const isNew = idx === indices.length - 1;
    el.style.cssText = `width:28px;height:28px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:8px;font-weight:900;color:#fde047;background:rgba(60,20,100,.8);border:1px solid rgba(168,85,247,.5)${isNew ? ';background:linear-gradient(135deg,#facc15,#d97706);color:#1a0800;border:2px solid #a855f7;box-shadow:0 0 10px #facc15' : ''}`;
    el.innerHTML = imgTag;
    c.appendChild(el);
  });
}

function renderTopAvatars(list){
  const c = $('topAvatars');
  if (!list.length){
    c.innerHTML = '<div style="width:36px;height:36px;border-radius:16px;background:linear-gradient(135deg,#f59e0b,#b45309);display:flex;align-items:center;justify-content:center;border:1px solid #fcd34d"><i class="fa-solid fa-trophy" style="color:#fef3c7;font-size:12px"></i></div>';
    return;
  }
  const medals = ['🥇','🥈','🥉'];
  const sizes = ['40px','32px','32px'];
  const borders = ['#facc15','#cbd5e1','#d97706'];
  c.innerHTML = list.map((u, i) => `
    <div style="position:relative">
      <span style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);font-size:12px">${medals[i]}</span>
      <img src="${u.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name||'')}" style="width:${sizes[i]};height:${sizes[i]};border-radius:50%;border:2px solid ${borders[i]};object-fit:cover">
      <span style="position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:2px;font-size:8px;font-weight:800;color:#fde047;white-space:nowrap">💎${fmtAmt(u.amount)}</span>
    </div>
  `).join('') + '<div style="width:36px;height:36px;border-radius:16px;background:linear-gradient(135deg,#f59e0b,#b45309);display:flex;align-items:center;justify-content:center;border:1px solid #fcd34d"><i class="fa-solid fa-trophy" style="color:#fef3c7;font-size:12px"></i></div>';
}

/* ══════ আজকের শীর্ষ জেতা — উপরের ৩ জনের ছবি বা 🏆-এ টিপলে পুরো তালিকা ══════ */
function fmtAmt(n){ n = Number(n) || 0; return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n); }

async function openTopModal(){
  const list = await GameData.dailyTop(10);
  let m = $('top-modal');
  if (!m){
    m = document.createElement('div'); m.id = 'top-modal';
    m.style.cssText = 'position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px';
    m.onclick = e => { if (e.target === m) m.style.display = 'none'; };
    document.body.appendChild(m);
  }
  const medals = ['🥇','🥈','🥉'];
  m.innerHTML = `<div class="modal-card" style="width:100%;max-width:340px;max-height:80vh;overflow:auto;border-radius:24px;padding:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(168,85,247,.3);padding-bottom:8px;margin-bottom:10px">
      <span style="color:#facc15;font-weight:900;font-size:13px;letter-spacing:.06em">🏆 আজকের শীর্ষ জেতা</span>
      <span onclick="$('top-modal').style.display='none'" style="color:#c4b5fd;font-weight:900;font-size:18px;padding:0 6px;cursor:pointer">✕</span>
    </div>` + (list.length ? list.map((u, i) => `
    <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(60,20,100,.4);padding:8px;border-radius:12px;border:1px solid rgba(168,85,247,.3);margin-bottom:6px">
      <div style="display:flex;align-items:center;gap:8px;min-width:0">
        <span style="width:22px;text-align:center;color:#c4b5fd;font-weight:800;font-size:12px">${medals[i] || (i + 1)}</span>
        <img src="${u.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name || '')}" style="width:28px;height:28px;border-radius:50%;border:1px solid #facc15;object-fit:cover">
        <span style="color:#fff;font-weight:700;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(u.name || 'User')}</span>
      </div>
      <span style="color:#67e8f9;font-weight:900;font-size:12px;white-space:nowrap">💎 ${(u.amount || 0).toLocaleString()}</span>
    </div>`).join('') : '<div style="color:#a78bfa;font-size:11px;font-style:italic;text-align:center;padding:12px">আজ এখনও কেউ জেতেনি</div>') + '</div>';
  m.style.display = 'flex';
}
