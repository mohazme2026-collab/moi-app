/* ludo/ludo-main.js — গেম চালু করা, রাউন্ডের ধাপ (BET → ROLL → RESULT), বেট ধরা, ফল নেওয়া */

/* ══════ STATE ══════ */
let userBets = {2:0,3:0,4:0,5:0,6:0};
let selectedChip = CHIPS[0];
let todayWin = 0;
let currentIdx = 0;        /* অনন্য রাউন্ড নম্বর (ডেটার জন্য) */
let currentPhase = 'LOADING';
let lastPhase = 'LOADING';
let lastIdx = -1;
let roundBetsCache = {};
let cacheIdx = -1;         /* roundBetsCache কোন রাউন্ডের */
let rollStarted = false;
let gameStarted = false;
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

  if (localStorage.getItem('ludo_music_off') === '1') $('btnMusic').style.opacity = '.45';
  buildDie(); buildBoxes();
  selectChip(selectedChip);
  gameStarted = true;
  $('loadingCover').classList.add('hidden');
  setInterval(tick, 200); tick();
}
function showBalance(){ $('user-balance').textContent = (GameData.me.diamonds || 0).toLocaleString(); }

/* ══════ LOOP ══════ */
function tick(){
  if (!gameStarted) return;
  const info = getRoundInfo();
  currentIdx = info.roundIndex;
  $('round-number').textContent = info.roundNumber;
  $('timer-display').textContent = info.phase === 'BETTING' ? Math.ceil(info.timeLeft / 1000) : 0;
  if (info.phase === 'BETTING'){                                       /* মাঝখানে বড় কাউন্টডাউন */
    const sec = Math.max(1, Math.ceil(info.timeLeft / 1000));
    $('cdNum').textContent = sec; $('cdBig').classList.toggle('low', sec <= 5);
    $('cdRing').style.strokeDashoffset = String(326.7 * (1 - info.timeLeft / BETTING_DURATION));
  }
  if (info.phase !== lastPhase || info.roundIndex !== lastIdx){
    lastPhase = info.phase; lastIdx = info.roundIndex;
    onPhaseChange(info);
  }
}

async function onPhaseChange(info){
  currentPhase = info.phase;
  $('phase-status').textContent = info.phase === 'BETTING' ? 'Select Time' : (info.phase === 'ROLLING' ? 'Rolling' : 'Result');

  if (info.phase === 'BETTING'){
    clearRoundUI();
    rollStarted = false;
    $('cdBig').style.display = 'block'; $('diceStage').style.visibility = 'hidden';   /* বেটের সময় ডাইসের জায়গায় কাউন্টডাউন */
    renderHistory(GameData.history(info.roundIndex));
    const idx = info.roundIndex;
    const cache = await GameData.roundBets(idx);
    if (idx !== currentIdx) return;                       /* এর মধ্যে রাউন্ড বদলে গেলে বাদ */
    const mineNow = Object.assign({}, userBets);          /* মাঝখানে আমি যা ধরেছি তা হারাতে দেওয়া যাবে না */
    roundBetsCache = cache; cacheIdx = idx;
    const mine = roundBetsCache[GameData.me.uid];
    if (mine && mine.bets){                               /* মাঝপথে ঢুকলে আগের বেট ফিরে আসে */
      Object.keys(mine.bets).forEach(k => { userBets[k] = Math.max(userBets[k] || 0, mine.bets[k] || 0); updateBoxBadge(k); });
    }
    Object.keys(mineNow).forEach(k => { if (mineNow[k] > (userBets[k] || 0)) userBets[k] = mineNow[k]; updateBoxBadge(k); });
  }
  if (info.phase !== 'BETTING' && cacheIdx !== info.roundIndex){     /* মাঝপথে ঢুকলে এই রাউন্ডের বেট এনে নেওয়া */
    const idx = info.roundIndex; cacheIdx = idx;
    const cache = await GameData.roundBets(idx);
    if (idx === currentIdx){
      roundBetsCache = cache;
      const mine = cache[GameData.me.uid];
      if (mine && mine.bets) Object.keys(mine.bets).forEach(k => { userBets[k] = Math.max(userBets[k] || 0, mine.bets[k] || 0); updateBoxBadge(k); });
    }
  }
  if (info.phase !== 'BETTING'){ $('cdBig').style.display = 'none'; $('diceStage').style.visibility = 'visible'; }
  if (info.phase === 'ROLLING'){
    if (!rollStarted){
      rollStarted = true;
      const n = ludoResult(info.roundIndex);
      if (info.msInto - BETTING_DURATION > 600) setDieStatic(n, info.roundIndex);    /* দেরিতে ঢুকলে সরাসরি ফল */
      else rollDie(n, info.roundIndex, info.rollMs);
    }
  }
  if (info.phase === 'RESULT'){
    if (!rollStarted){ rollStarted = true; setDieStatic(ludoResult(info.roundIndex), info.roundIndex); }   /* রেজাল্টের সময় ঢুকলে ডাইসে ফল */
    if (window._resultShownFor !== info.roundIndex){
      window._resultShownFor = info.roundIndex;
      await handleResult(info.roundIndex, info.roundNumber);
    }
  }
}

/* ══════ BET ══════ */
function handleTap(n, evt){
  if (currentPhase !== 'BETTING' || getRoundInfo().timeLeft < 400){ showToast('Betting is closed'); return; }
  const used = NUMS.filter(k => userBets[k] > 0).length;
  if (!(userBets[n] > 0) && used >= MAX_BOXES){ showToast('You can bet on 2 numbers only'); return; }
  if (GameData.me.diamonds < selectedChip){ showToast('Not enough diamonds'); return; }
  const chip = selectedChip, idx = currentIdx;
  const x = evt && (evt.clientX || evt.pageX), y = evt && (evt.clientY || evt.pageY);

  /* সাথে সাথে স্ক্রিনে দেখানো (লাগ ছাড়া) — সার্ভার ফেরত না দিলে ফিরিয়ে নেওয়া হবে */
  pendingBets++;
  GameData.me.diamonds -= chip; showBalance();
  userBets[n] = (userBets[n] || 0) + chip;
  updateBoxBadge(n); flyDiamond(x, y, n);
  roundBetsCache[GameData.me.uid] = { uid: GameData.me.uid, name: GameData.me.name, photo: GameData.me.photo, bets: Object.assign({}, userBets) };

  GameData.bet(idx, n, chip).then(r => {
    if (idx === currentIdx && r && r.bets) Object.keys(r.bets).forEach(k => { userBets[k] = Math.max(userBets[k] || 0, r.bets[k]); updateBoxBadge(k); });
  }).catch(e => {
    if (idx === currentIdx){ userBets[n] = Math.max(0, (userBets[n] || 0) - chip); updateBoxBadge(n); }
    GameData.me.diamonds += chip; showBalance();
    showToast((e && (e.userMsg || e.message)) || 'Bet failed');
  }).finally(() => { pendingBets = Math.max(0, pendingBets - 1); if (pendingBets === 0 && GameData.syncBalance()) showBalance(); });
}

/* ══════ RESULT ══════ */
async function handleResult(roundIdx, roundNumber){
  const n = ludoResult(roundIdx);
  setDieStatic(n, roundIdx);                               /* ডাইস ঠিক ওই নম্বরে থেমে আছে — নিশ্চিত করা */
  showFinal(n);                                            /* জেতা ঘর জ্বলে ওঠে */
  let myCost = Object.values(userBets).reduce((a, b) => a + b, 0), myReward = ludoReward(userBets, n);
  renderHistory(GameData.history(roundIdx + 1));
  showResultModal(roundNumber, n, myCost, myReward);       /* আগে দেখাই, ডায়মন্ড নেওয়া পিছনে চলে */
  if (myReward > 0) showWinPill(myReward);
  try {
    const r = await GameData.claim(roundIdx);              /* সার্ভার-সাইডের মতো: বেট দেখে জয় হিসাব করে ডায়মন্ড যোগ করে */
    myCost = r.cost; myReward = r.reward;
    showBalance();
    $('modal-reward').textContent = myReward.toLocaleString(); $('modal-cost').textContent = myCost.toLocaleString();
    if (myReward > 0) showWinPill(myReward);
    try { if (window.MOIBroadcast && r.reward > 0) MOIBroadcast.game(r.reward, new URLSearchParams(location.search).get('room') || ''); } catch(e){}
    if (myReward > 0){ todayWin += myReward; $('today-win').textContent = todayWin.toLocaleString(); }
  } catch(e){ console.warn('claim', e); }
  GameData.top('daily', 1).then(renderTopAvatars);
}

/* ══════ START ══════ */
setTimeout(() => startGame(), 150);
setTimeout(() => { const lc = $('loadingCover'); if (lc && !lc.classList.contains('hidden')) lc.classList.add('hidden'); }, 8000);
console.log('🎲 Ludo Dice loaded');
