/* game/game-main.js — গেম চালু করা, রাউন্ডের ধাপ (BET → SPIN → RESULT), বেট ধরা, ফল নেওয়া */

/* ══════ STATE ══════ */
let userBets = {0:0,1:0,2:0,3:0,4:0,5:0,6:0,7:0};
let selectedChip = 1;
let todayWin = 0;
let currentRound = 1;      /* স্ক্রিনের নম্বর */
let currentIdx = 0;        /* অনন্য রাউন্ড নম্বর (ডেটার জন্য) */
let currentPhase = 'LOADING';
let lastPhase = 'LOADING';
let lastIdx = -1;
let roundBetsCache = {};
let spinActive = false;
let gameStarted = false;

/* ══════ BACK ══════ */
window.goBack = () => {
  if (window.parent !== window){
    try { window.parent.postMessage({ type: 'GAME_CLOSE' }, '*'); } catch(e){}
  } else {
    if (history.length > 1) history.back();
    else location.href = '../home/index.html';
  }
};

/* ══════ START ══════ */
async function startGame(){
  $('loadingCover').classList.remove('hidden');
  $('loadingText').textContent = 'লোড হচ্ছে...';

  const ok = await GameData.init();
  if (!ok){
    $('loadingText').textContent = 'ভয়েস ক্লাব থেকে খুলুন';
    setTimeout(() => goBack(), 2000);
    return;
  }
  const me = GameData.me;
  $('user-avatar').src = me.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(me.name || 'U');
  showBalance();
  setInterval(() => { if (GameData.syncBalance()) showBalance(); }, 600);

  todayWin = await GameData.myTodayWin();
  $('today-win').textContent = todayWin.toLocaleString();
  renderTopAvatars(await GameData.dailyTop3());
  $('topAvatars').style.cursor = 'pointer';
  $('topAvatars').onclick = openTopModal;

  await applyFiveColors();          /* ৫ গুণের ৪টা হীরা ৪ রঙে */

  $('loadingCover').classList.add('hidden');
  gameStarted = true;
  buildWheel();
  startLoop();
}
function showBalance(){ $('user-balance').textContent = (GameData.me.diamonds || 0).toLocaleString(); }

/* ══════ LOOP ══════ */
function startLoop(){ setInterval(tick, 200); tick(); }

function tick(){
  if (!gameStarted) return;
  const info = getRoundInfo();
  currentRound = info.roundNumber; currentIdx = info.roundIndex;
  $('round-number').textContent = info.roundNumber;
  const secLeft = Math.ceil(info.timeLeft / 1000);
  $('timer-display').textContent = secLeft < 10 ? '0' + secLeft : secLeft;
  if (info.phase !== lastPhase || info.roundIndex !== lastIdx){
    lastPhase = info.phase; lastIdx = info.roundIndex;
    onPhaseChange(info);
  }
}

async function onPhaseChange(info){
  currentPhase = info.phase;
  $('phase-status').textContent = info.phase === 'BETTING' ? 'BET' : (info.phase === 'SPINNING' ? 'SPIN' : 'RESULT');

  if (info.phase === 'BETTING'){
    clearRoundUI();
    spinActive = false;
    renderHistory(GameData.history(info.roundIndex));
    roundBetsCache = await GameData.roundBets(info.roundIndex);
    const mine = roundBetsCache[GameData.me.uid];
    if (mine && mine.bets && info.roundIndex === currentIdx){       /* মাঝপথে ঢুকলে আগের বেট ফিরে আসে */
      Object.keys(mine.bets).forEach(k => { userBets[k] = mine.bets[k]; updateCardBadge(k); });
    }
  }
  if (info.phase === 'SPINNING'){
    if (!spinActive){ spinActive = true; runSpinAnimation(info.roundNumber); }
  }
  if (info.phase === 'RESULT'){
    if (window._resultShownFor !== info.roundIndex){
      window._resultShownFor = info.roundIndex;
      await handleResult(info.roundIndex, info.roundNumber);
    }
  }
}

/* ══════ BET ══════ */
async function handleTap(itemId, evt){
  if (currentPhase !== 'BETTING'){ showToast('⏳ এখন bet করার সময় নয়'); return; }
  if (GameData.me.diamonds < selectedChip){ showToast('❌ যথেষ্ট ডায়মন্ড নেই'); return; }
  const x = evt && (evt.clientX || evt.pageX), y = evt && (evt.clientY || evt.pageY);
  try {
    const r = await GameData.bet(currentIdx, itemId, selectedChip);
    Object.keys(r.bets || {}).forEach(k => { userBets[k] = r.bets[k]; });
    roundBetsCache[GameData.me.uid] = { uid: GameData.me.uid, name: GameData.me.name, photo: GameData.me.photo, bets: Object.assign({}, userBets) };
    showBalance();
    flyDiamond(x, y, itemId);
    pulseCard(itemId);
    updateCardBadge(itemId);
  } catch(e){
    showToast('❌ ' + ((e && e.message) || 'bet হয়নি'));
  }
}

/* ══════ RESULT ══════ */
async function handleResult(roundIdx, roundNumber){
  const winnerIdx = getWinningIndex(roundNumber);
  const item = ITEMS[winnerIdx];
  let myCost = Object.values(userBets).reduce((a, b) => a + b, 0), myReward = 0;
  try {
    const r = await GameData.claim(roundIdx);              /* সার্ভার-সাইডের মতো: বেট দেখে জয় হিসাব করে ডায়মন্ড যোগ করে */
    myCost = r.cost; myReward = r.reward;
    showBalance();
    try { if (window.MOIBroadcast && r.reward > 0) MOIBroadcast.game(r.reward, new URLSearchParams(location.search).get('room') || ''); } catch(e){}     /* বড় জয় হলে সব রুমের উপরে পপআপ */
    if (myReward > 0){
      todayWin += myReward;
      $('today-win').textContent = todayWin.toLocaleString();
    }
  } catch(e){ console.warn('claim', e); myReward = (userBets[winnerIdx] || 0) * item.mult; }

  renderHistory(GameData.history(roundIdx + 1));
  renderTopAvatars(await GameData.dailyTop3());
  showResultModal(roundNumber, winnerIdx, myCost, myReward, item);
}

/* ══════ START ══════ */
setTimeout(() => startGame(), 150);
setTimeout(() => { const lc = $('loadingCover'); if (lc && !lc.classList.contains('hidden')) lc.classList.add('hidden'); }, 8000);
console.log('🎮 Space Wheel loaded (demo)');
