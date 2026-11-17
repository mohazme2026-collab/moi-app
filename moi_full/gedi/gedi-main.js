/* gedi/gedi-main.js — গেম চালু করা, রাউন্ডের ধাপ (BET → SPIN → RESULT), বেট ধরা, ফল নেওয়া */

/* ══════ STATE ══════ */
let userBets = {0:0,1:0,2:0,3:0,4:0,5:0,6:0,7:0};
let selectedChip = CHIPS[0];
let todayWin = 0;
let currentRound = 1;      /* স্ক্রিনের নম্বর */
let currentIdx = 0;        /* অনন্য রাউন্ড নম্বর (ডেটার জন্য) */
let currentPhase = 'LOADING';
let lastPhase = 'LOADING';
let lastIdx = -1;
let roundBetsCache = {};
let spinActive = false;
let gameStarted = false;
let cacheIdx = -1;         /* roundBetsCache কোন রাউন্ডের */
let pendingBets = 0;       /* সার্ভারে যাচ্ছে এমন বেট — এ সময় ব্যালেন্স ঝিলিক দেয় না */

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
  const ok = await GameData.init();
  if (!ok){
    $('loadingText').textContent = 'Open from the Voice Club';
    setTimeout(() => goBack(), 2000);
    return;
  }
  showBalance();
  setInterval(() => { if (pendingBets === 0 && GameData.syncBalance()) showBalance(); }, 600);

  todayWin = await GameData.myTodayWin();
  $('today-win').textContent = todayWin.toLocaleString();
  GameData.top('daily', 1).then(renderTopAvatars);

  if (localStorage.getItem('gedi_music_off') === '1') $('btnMusic').style.opacity = '.45';
  buildWheel();
  selectChip(selectedChip);
  gameStarted = true;
  $('loadingCover').classList.add('hidden');
  startLoop();
  pingLoop();
}
function showBalance(){ $('user-balance').textContent = (GameData.me.diamonds || 0).toLocaleString(); }

/* নেট ধীর কিনা দেখানোর ছোট সংখ্যা (ব্রাউজার জানালে) */
function pingLoop(){
  const set = () => { const c = navigator.connection; $('pingTxt').textContent = c && c.rtt ? c.rtt + 'ms' : ''; };
  set(); setInterval(set, 5000);
}

/* ══════ LOOP ══════ */
function startLoop(){ setInterval(tick, 200); tick(); }

function tick(){
  if (!gameStarted) return;
  const info = getRoundInfo();
  currentRound = info.roundNumber; currentIdx = info.roundIndex;
  $('round-number').textContent = info.roundNumber;
  const secLeft = info.phase === 'BETTING' ? Math.ceil(info.timeLeft / 1000) : 0;
  $('timer-display').textContent = secLeft;
  if (info.phase !== lastPhase || info.roundIndex !== lastIdx){
    lastPhase = info.phase; lastIdx = info.roundIndex;
    onPhaseChange(info);
  }
}

async function onPhaseChange(info){
  currentPhase = info.phase;
  $('phase-status').textContent = info.phase === 'BETTING' ? 'Select Time' : (info.phase === 'SPINNING' ? 'Spinning' : 'Result');

  if (info.phase === 'BETTING'){
    clearRoundUI();
    spinActive = false;
    renderHistory(GameData.history(info.roundIndex));
    const idx = info.roundIndex;
    const cache = await GameData.roundBets(idx);
    if (idx !== currentIdx) return;                       /* এর মধ্যে রাউন্ড বদলে গেলে বাদ */
    /* মাঝখানে আমি যা ধরেছি তা হারাতে দেওয়া যাবে না */
    const mineNow = Object.assign({}, userBets);
    roundBetsCache = cache; cacheIdx = idx;
    const mine = roundBetsCache[GameData.me.uid];
    if (mine && mine.bets){                               /* মাঝপথে ঢুকলে আগের বেট ফিরে আসে */
      Object.keys(mine.bets).forEach(k => { userBets[k] = Math.max(userBets[k] || 0, mine.bets[k] || 0); updateCellBadge(k); });
    }
    Object.keys(mineNow).forEach(k => { if (mineNow[k] > (userBets[k] || 0)) userBets[k] = mineNow[k]; updateCellBadge(k); });
    updateHot();
    const hint = $('handHint'); hint.style.display = localStorage.getItem('gedi_seen') ? 'none' : 'block';
  }
  if (info.phase !== 'BETTING' && cacheIdx !== info.roundIndex){     /* মাঝপথে ঢুকলে এই রাউন্ডের বেট এনে নেওয়া */
    const idx = info.roundIndex; cacheIdx = idx;
    const cache = await GameData.roundBets(idx);
    if (idx === currentIdx){
      roundBetsCache = cache;
      const mine = cache[GameData.me.uid];
      if (mine && mine.bets) Object.keys(mine.bets).forEach(k => { userBets[k] = Math.max(userBets[k] || 0, mine.bets[k] || 0); });
    }
  }
  if (info.phase === 'SPINNING'){
    $('handHint').style.display = 'none';
    if (!spinActive){ spinActive = true; runSpinAnimation(gediResult(info.roundIndex), info.msInto - BETTING_DURATION > 500); }
  }
  if (info.phase === 'RESULT'){
    if (window._resultShownFor !== info.roundIndex){
      window._resultShownFor = info.roundIndex;
      await handleResult(info.roundIndex, info.roundNumber);
    }
  }
}

/* ══════ BET ══════ */
function handleTap(itemId, evt){
  if (currentPhase !== 'BETTING' || getRoundInfo().timeLeft < 400){ showToast('Betting is closed'); return; }
  if (GameData.me.diamonds < selectedChip){ showToast('Not enough diamonds'); return; }
  const chip = selectedChip, idx = currentIdx;
  const x = evt && (evt.clientX || evt.pageX), y = evt && (evt.clientY || evt.pageY);
  try { localStorage.setItem('gedi_seen', '1'); } catch(e){}
  $('handHint').style.display = 'none';

  /* সাথে সাথে স্ক্রিনে দেখানো (লাগ ছাড়া) — সার্ভার ফেরত না দিলে ফিরিয়ে নেওয়া হবে */
  pendingBets++;
  GameData.me.diamonds -= chip; showBalance();
  userBets[itemId] = (userBets[itemId] || 0) + chip;
  updateCellBadge(itemId); flyDiamond(x, y, itemId);
  roundBetsCache[GameData.me.uid] = { uid: GameData.me.uid, name: GameData.me.name, photo: GameData.me.photo, bets: Object.assign({}, userBets) };

  GameData.bet(idx, itemId, chip).then(r => {
    if (idx === currentIdx && r && r.bets) Object.keys(r.bets).forEach(k => { userBets[k] = Math.max(userBets[k] || 0, r.bets[k]); updateCellBadge(k); });
  }).catch(e => {
    if (idx === currentIdx){ userBets[itemId] = Math.max(0, (userBets[itemId] || 0) - chip); updateCellBadge(itemId); }
    GameData.me.diamonds += chip; showBalance();
    showToast((e && (e.userMsg || e.message)) || 'Bet failed');
  }).finally(() => { pendingBets = Math.max(0, pendingBets - 1); if (pendingBets === 0) GameData.syncBalance() && showBalance(); });
}

/* ══════ RESULT ══════ */
async function handleResult(roundIdx, roundNumber){
  const res = gediResult(roundIdx);
  showFinal(res);                                          /* সাথে সাথে বিজয়ী ঘর জ্বলে ওঠে */
  let myCost = Object.values(userBets).reduce((a, b) => a + b, 0), myReward = gediReward(userBets, res);
  renderHistory(GameData.history(roundIdx + 1));
  showResultModal(roundNumber, res, myCost, myReward);     /* আগে দেখাই, ডায়মন্ড নেওয়া পিছনে চলে */
  try {
    const r = await GameData.claim(roundIdx);              /* সার্ভার-সাইডের মতো: বেট দেখে জয় হিসাব করে ডায়মন্ড যোগ করে */
    myCost = r.cost; myReward = r.reward;
    showBalance();
    $('modal-reward').textContent = myReward.toLocaleString(); $('modal-cost').textContent = myCost.toLocaleString();
    try { if (window.MOIBroadcast && r.reward > 0) MOIBroadcast.game(r.reward, new URLSearchParams(location.search).get('room') || ''); } catch(e){}
    if (myReward > 0){ todayWin += myReward; $('today-win').textContent = todayWin.toLocaleString(); }
  } catch(e){ console.warn('claim', e); }
  GameData.top('daily', 1).then(renderTopAvatars);
}

/* ══════ START ══════ */
setTimeout(() => startGame(), 150);
setTimeout(() => { const lc = $('loadingCover'); if (lc && !lc.classList.contains('hidden')) lc.classList.add('hidden'); }, 8000);
console.log('🎮 Gedi loaded');
