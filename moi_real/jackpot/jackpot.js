/* jackpot/jackpot.js — Fruit Jackpot (ডেমো)
   ৩×৩ ঘর: ৮টা ফল + মাঝে কাউন্টডাউন | রাউন্ড ৩৪ সেকেন্ড = ২০ বাজি → ৪.৫ ঘোরা → (বোনাস স্লট) → ফল
   🔒 ফল/বোনাস কী হবে সেই অংশ (jOut, jHasBonus) shared/core/economy.js এর "Fruit Jackpot" অংশের সাথে হুবহু একই রাখতে হবে। */
(function(){
'use strict';
var $ = function(id){ return document.getElementById(id); };
var J = { EPOCH: 1700000000000, ROUND: 34000, BET: 20000, SPIN: 4500 };
var ODDS = [5, 5, 5, 5, 10, 10, 20, 40], WT = [22, 22, 22, 22, 10, 10, 4, 2];
var CHIPS = [500, 5000, 50000, 500000], CL = ['500', '5K', '50K', '500K'], CIMG = ['chip_500', 'chip_5k', 'chip_50k', 'chip_500k'];
var FIMG = ['lemon', 'raspberry', 'kiwi', 'plum', 'strawberry', 'banana', 'melon', 'cherry'];
var POS = [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0], [1, 0]];      /* ঘড়ির কাঁটা ঘুরে: ঘর → (সারি, কলাম) */
var SYMS = ['x2', 'x3', 'jj', 'p1', 'p2', 'p3'];
var DM = '<svg class="dm" viewBox="0 0 24 24"><use href="#dmI"/></svg>';
var CELL = 124;

/* ─── ফলাফল (সবার জন্য একই, রাউন্ড নম্বর থেকে) ─── */
function mb(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function jHasBonus(idx){ var B = 35, b = Math.floor(idx / B), pos = idx - b * B, off = Math.floor(mb(b * 7757 + 13)() * 15); return pos === off; }
function jOut(idx){
  var h = mb(idx * 2654435 + 90210); h(); h();
  var x = h() * 114, f = 0, acc = 0, i;
  for (i = 0; i < 8; i++){ acc += WT[i]; if (x < acc){ f = i; break; } }
  var o = { fruit: f, bonus: null, mult: 1, extra: [], reels: ['jj', 'jj', 'jj'], has: false };
  if (!jHasBonus(idx)) return o;
  o.has = true;
  var t = h(), ty = t < .12 ? 'n' : t < .42 ? 'x2' : t < .58 ? 'x3' : t < .72 ? 'p1' : t < .82 ? 'p2' : t < .88 ? 'p3' : 'jj';
  var jm = [5, 7, 10][Math.floor(h() * 3)];
  o.bonus = ty;
  if (ty === 'n'){
    var a = SYMS[Math.floor(h() * 6)], b = SYMS[Math.floor(h() * 6)], c = SYMS[Math.floor(h() * 6)];
    if (a === b && b === c) c = SYMS[(SYMS.indexOf(c) + 1) % 6];
    o.reels = [a, b, c];
  } else o.reels = [ty, ty, ty];
  if (ty === 'x2') o.mult = 2; else if (ty === 'x3') o.mult = 3; else if (ty === 'jj') o.mult = jm;
  else if (ty.charAt(0) === 'p'){ var n = Number(ty.charAt(1)); while (o.extra.length < n){ var e = Math.floor(h() * 8); if (e !== f && o.extra.indexOf(e) < 0) o.extra.push(e); } }
  return o;
}
function timeline(o){ return o.has ? { reel: 24500, stops: [26900, 27700, 28500], reveal: 28600, popup: 29800 } : { popup: 25200 }; }
function info(){ var el = Date.now() - J.EPOCH, idx = Math.floor(el / J.ROUND), into = el % J.ROUND; return { idx: idx, into: into, phase: into < J.BET ? 'BET' : (into < J.BET + J.SPIN ? 'SPIN' : 'POST') }; }
function rng(seed){ var s = (seed >>> 0) % 2147483647 || 1; return function(){ return (s = s * 48271 % 2147483647) / 2147483647; }; }
function fmt(n){ n = Math.round(n); return n.toLocaleString('en-US'); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function sum(a){ return a.reduce(function(x, y){ return x + y; }, 0); }
function dayKey(){ var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

/* ─── মাপ ফিট (720×1160 ডিজাইন) ─── */
function fit(){
  var vw = window.innerWidth, vh = window.innerHeight, k = Math.min(vw / 720, vh / 1160), cv = $('cv');
  cv.style.transform = 'scale(' + k + ')'; cv.style.left = ((vw - 720 * k) / 2) + 'px'; cv.style.top = Math.max(0, (vh - 1160 * k) * 0.3) + 'px';
}
window.addEventListener('resize', fit); fit();

/* ─── স্টেট ─── */
var me = { uid: '', name: '', photo: '', dia: 0 }, selChip = 0, snd = true, autoOn = false;
var cur = -1, mine = [0, 0, 0, 0, 0, 0, 0, 0], botShown = [0, 0, 0, 0, 0, 0, 0, 0], botIdx = 0, sched = [], lastMine = null, claimed = {}, pending = 0, st = {}, hlNow = -1, lastHlSound = -1;
var USERS = [];

function pool(){
  var U = window.DEMO && window.DEMO.USERS ? Object.keys(window.DEMO.USERS).map(function(k){ var u = window.DEMO.USERS[k]; return { uid: u.uid || k, name: u.name, photo: u.photo, level: u.level }; }).filter(function(u){ return u.name; }) : [];
  if (U.length < 20) for (var i = 0; i < 40; i++) U.push({ uid: '9' + (10000 + i), name: 'Player ' + (i + 1), photo: '' });
  return U;
}
/* এই রাউন্ডের বটদের বাজির সময়সূচি (নির্দিষ্ট) */
function makeSched(idx){
  var r = rng(idx * 7919 + 17), P = USERS, n = 16 + Math.floor(r() * 12), out = [];
  for (var i = 0; i < n; i++){
    var u = P[Math.floor(r() * P.length)], q = r() * 114, item = 0, acc = 0, k;
    for (k = 0; k < 8; k++){ acc += WT[k]; if (q < acc){ item = k; break; } }
    var c = r(), ci = c < .5 ? 0 : (c < .82 ? 1 : (c < .96 ? 2 : 3)), times = 1 + Math.floor(r() * (ci === 0 ? 4 : 2));
    out.push({ t: 400 + Math.floor(r() * 18000), u: u, item: item, amt: CHIPS[ci] * times });
  }
  out.sort(function(a, b){ return a.t - b.t; }); return out;
}

/* ─── UI তৈরি ─── */
function buildUI(){
  var g = '';
  for (var i = 0; i < 8; i++){
    g += '<div class="tile ' + (ODDS[i] === 5 ? 't5' : 'tp') + '" id="tl' + i + '" style="left:' + (POS[i][1] * 158) + 'px;top:' + (POS[i][0] * 158) + 'px"><div class="mb" id="mb' + i + '">0</div><img src="img/' + FIMG[i] + '.webp" alt=""><div class="lb" id="lb' + i + '">' + ODDS[i] + ' times</div></div>';
  }
  $('grid').innerHTML = g;
  var ch = '';
  for (i = 0; i < 4; i++){
    ch += '<div class="cc c' + i + '" id="ch' + i + '" style="left:' + Math.round(360 + (i - 1.5) * 152 - 70) + 'px"><div class="pill"><img src="img/' + CIMG[i] + '.webp" alt="">' + CL[i] + '</div><img class="btn" id="cb' + i + '" src="img/btn_blue.webp" alt=""></div>';
  }
  $('chips').innerHTML = ch; selectChip(0);
  for (i = 0; i < 8; i++){ (function(i){ $('tl' + i).addEventListener('pointerdown', function(e){ e.preventDefault(); bet(i, selChip); }); })(i); }
  for (i = 0; i < 4; i++){ (function(i){ $('ch' + i).addEventListener('pointerdown', function(){ selectChip(i); }); })(i); }
  $('bBack').addEventListener('pointerdown', back);
  $('bSound').addEventListener('pointerdown', function(){ snd = !snd; $('bSound').style.opacity = snd ? 1 : .45; toast(snd ? '🔊 সাউন্ড চালু' : '🔇 সাউন্ড বন্ধ'); });
  $('bHelp').addEventListener('pointerdown', showHow);
  $('bHist').addEventListener('pointerdown', showHistory);
  $('bMine').addEventListener('pointerdown', showMyBets);
  $('bAuto').addEventListener('pointerdown', toggleAuto);
  $('trophy').addEventListener('pointerdown', showRank);
  $('rp').addEventListener('pointerdown', closeRp);
  $('modal').addEventListener('pointerdown', function(e){ if (e.target === $('modal') || e.target.className === 'x') closeModal(); });
  $('trophy').insertAdjacentHTML('beforeend', '<i id="tt">00:00</i>');
  setReelsRest();
}
function selectChip(i){ selChip = i; for (var k = 0; k < 4; k++){ $('ch' + k).classList.toggle('sel', k === i); $('cb' + k).src = 'img/' + (k === i ? 'btn_red' : 'btn_blue') + '.webp'; } }
function back(){ try { if (window.parent !== window) window.parent.postMessage({ type: 'GAME_CLOSE' }, '*'); else if (history.length > 1) history.back(); else location.href = '../home/index.html'; } catch(e){} }

/* ─── ছোট টুল ─── */
var tTimer;
function toast(m){ var t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tTimer); tTimer = setTimeout(function(){ t.classList.remove('on'); }, 1400); }
var AC;
function beep(f, d, v){ if (!snd) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); var o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f; o.type = 'sine'; g.gain.value = v || .06; o.connect(g); g.connect(AC.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d); o.stop(AC.currentTime + d); } catch(e){} }
function tileCenter(i){ return { x: 128 + POS[i][1] * 158 + 75, y: 374 + POS[i][0] * 158 + 75 }; }
function chipPos(i){ return { x: Math.round(360 + (i - 1.5) * 152), y: 966 }; }
function flyBot(b){
  var f = $('fly'), c = tileCenter(b.item), side = (b.u.uid.charCodeAt(b.u.uid.length - 1) % 2) ? 1 : -1;
  var el = document.createElement('div'); el.className = 'fc'; el.style.left = (c.x - 100) + 'px'; el.style.top = (c.y - 20) + 'px'; el.style.transform = 'translateY(24px) scale(.8)'; el.style.opacity = '0';
  el.innerHTML = '<img src="' + esc(b.u.photo || (window.MOI_AVATAR ? MOI_AVATAR(b.u.uid, 'f') : '')) + '" alt=""><span>' + esc((b.u.name || '').slice(0, 8)) + ' <b>+' + fmt(b.amt) + '</b></span>';
  f.appendChild(el); requestAnimationFrame(function(){ el.style.opacity = '1'; el.style.transform = 'translateY(-26px) scale(1)'; });
  setTimeout(function(){ el.style.opacity = '0'; }, 900); setTimeout(function(){ el.remove(); }, 1800);
  var ci = CHIPS.indexOf(b.amt) >= 0 ? CHIPS.indexOf(b.amt) : 0, sx = side > 0 ? 700 : -30;
  for (var k = 0; k < 2; k++){
    var ch = document.createElement('div'); ch.className = 'fch'; ch.innerHTML = '<img src="img/' + CIMG[ci] + '.webp" alt="">'; ch.style.left = sx + 'px'; ch.style.top = (930 + k * 14) + 'px'; f.appendChild(ch);
    (function(ch, k){ setTimeout(function(){ ch.style.transform = 'translate(' + (c.x + (k - .5) * 24 - sx) + 'px,' + (c.y - 930 - k * 14) + 'px) scale(.8)'; }, 30 + k * 90); setTimeout(function(){ ch.style.opacity = '0'; }, 650 + k * 90); setTimeout(function(){ ch.remove(); }, 1500); })(ch, k);
  }
}
function flyMine(i){
  var c = tileCenter(i), s = chipPos(selChip), f = $('fly'), ch = document.createElement('div'); ch.className = 'fch';
  ch.innerHTML = '<img src="img/' + CIMG[selChip] + '.webp" alt="">'; ch.style.left = (s.x - 17) + 'px'; ch.style.top = s.y + 'px'; f.appendChild(ch);
  requestAnimationFrame(function(){ ch.style.transform = 'translate(' + (c.x - s.x) + 'px,' + (c.y - s.y - 17) + 'px) scale(.85)'; });
  setTimeout(function(){ ch.style.opacity = '0'; }, 520); setTimeout(function(){ ch.remove(); }, 900);
}
function renderMine(){ for (var i = 0; i < 8; i++){ var e = $('mb' + i); e.textContent = fmt(mine[i]); e.style.display = mine[i] > 0 ? 'block' : 'none'; } }
function showBal(){ $('balN').textContent = fmt(me.dia); }
function todayWin(){ try { var t = JSON.parse(localStorage.getItem('moi_jackpot_today') || '{}'); return t.d === dayKey() ? (t.v || 0) : 0; } catch(e){ return 0; } }
function addToday(v){ try { localStorage.setItem('moi_jackpot_today', JSON.stringify({ d: dayKey(), v: todayWin() + v })); } catch(e){} $('todayN').textContent = fmt(todayWin()); }

/* ─── বাজি ─── */
function bet(i, chipIdx, amtOverride, silent){
  var inf = info(); if (inf.phase !== 'BET'){ if (!silent) toast('⏳ এখন বাজি ধরার সময় নয়'); return false; }
  var amt = amtOverride || CHIPS[chipIdx];
  if (me.dia < amt){ if (!silent) toast('❌ যথেষ্ট ডায়মন্ড নেই'); beep(180, .2); return false; }
  var idx = inf.idx; me.dia -= amt; mine[i] += amt; pending++; showBal(); renderMine(); beep(660, .08); if (!silent) flyMine(i);
  window.MOIEco.call('jackpotBet', { idx: idx, item: i, chip: amt }).then(function(r){ pending--; if (typeof r.balance === 'number' && pending === 0) me.dia = r.balance; showBal(); })
    .catch(function(err){ pending--; if (idx === cur){ mine[i] -= amt; } me.dia += amt; showBal(); renderMine(); toast('❌ ' + ((err && err.message) || 'বাজি হয়নি')); });
  return true;
}
function repeatBets(silent){
  var inf = info(); if (inf.phase !== 'BET') return;
  if (sum(mine) > 0) return;
  if (!lastMine || !sum(lastMine)){ if (!silent) toast('আগের রাউন্ডে বাজি ছিল না'); return; }
  var tot = sum(lastMine); if (me.dia < tot){ toast('❌ যথেষ্ট ডায়মন্ড নেই'); if (autoOn) toggleAuto(); return; }
  lastMine.forEach(function(v, i){ if (v > 0) bet(i, 0, v, true); });
}
function toggleAuto(){
  autoOn = !autoOn; $('bAuto').classList.toggle('on', autoOn); toast(autoOn ? '🔁 Auto চালু — আগের বাজি নিজে নিজে বসবে' : 'Auto বন্ধ');
  if (autoOn && info().phase === 'BET') repeatBets(false);
}

/* ─── ফলাফলের ফিতা ─── */
function symImg(ty){ return ty && ty !== 'n' ? 'img/sym_' + ty + '.webp' : ''; }
function renderStrip(idx, animate){
  var h = '';
  for (var k = 1; k <= 8; k++){ var o = jOut(idx - k); h += '<div class="re' + (animate && k === 1 ? ' n' : '') + '"><img class="f" src="img/' + FIMG[o.fruit] + '.webp" alt="">' + (o.has && o.bonus !== 'n' ? '<img class="s" src="' + symImg(o.bonus) + '" alt="">' : '') + '</div>'; }
  $('stripIn').innerHTML = h;
  $('newb').style.display = 'block';
}

/* ─── রিল ─── */
function cell(ty){ return '<div><img src="img/sym_' + ty + '.webp" alt=""></div>'; }
function setReelsRest(){ for (var i = 0; i < 3; i++){ var rs = $('rw' + i).firstChild; rs.style.transition = 'none'; rs.style.transform = 'translateY(0)'; rs.innerHTML = cell('jj'); } }
function setReelsFinal(o){ for (var i = 0; i < 3; i++){ var rs = $('rw' + i).firstChild; rs.style.transition = 'none'; rs.style.transform = 'translateY(0)'; rs.innerHTML = cell(o.reels[i]); } }
function spinReel(i, fin, dur){
  var rs = $('rw' + i).firstChild, h = '', n = 16, r = rng(cur * 31 + i * 7 + 5);
  for (var k = 0; k < n - 1; k++) h += cell(SYMS[Math.floor(r() * 6)]);
  h += cell(fin); rs.style.transition = 'none'; rs.style.transform = 'translateY(0)'; rs.innerHTML = h; void rs.offsetHeight;
  rs.style.transition = 'transform ' + dur + 'ms cubic-bezier(.2,.75,.25,1)'; rs.style.transform = 'translateY(' + (-(n - 1) * CELL) + 'px)';
}
function bonusText(o){
  if (o.bonus === 'n') return 'No Bonus';
  if (o.bonus === 'jj') return 'JACKPOT ×' + o.mult;
  if (o.bonus === 'x2' || o.bonus === 'x3') return 'BONUS ×' + o.mult;
  return '+' + o.extra.length + ' FRUIT' + (o.extra.length > 1 ? 'S' : '');
}

/* ─── রাউন্ডের ধাপ ─── */
function resetRound(idx){
  cur = idx; $('rn').textContent = (idx % 100000);
  mine = [0, 0, 0, 0, 0, 0, 0, 0]; botShown = [0, 0, 0, 0, 0, 0, 0, 0]; botIdx = 0; sched = makeSched(idx);
  st = { chase: false, reel: false, rev: false, pop: false, o: jOut(idx) }; st.t = timeline(st.o);
  for (var i = 0; i < 8; i++){ $('tl' + i).classList.remove('win', 'dim', 'hl'); $('lb' + i).textContent = ODDS[i] + ' times'; $('lb' + i).classList.remove('up'); }
  $('center').classList.remove('res'); hlNow = -1;
  setReelsRest(); renderStrip(idx, false); renderMine(); closeRp();
  if (autoOn) setTimeout(function(){ if (cur === idx) repeatBets(true); }, 500);
}
function markWinners(o, withExtra){
  var wins = [o.fruit].concat(withExtra ? o.extra : []);
  for (var i = 0; i < 8; i++){ var t = $('tl' + i); t.classList.remove('hl'); t.classList.toggle('win', wins.indexOf(i) >= 0); t.classList.toggle('dim', wins.indexOf(i) < 0); }
}
function finalizeChase(o){
  $('cfruit').src = 'img/' + FIMG[o.fruit] + '.webp'; $('center').classList.add('res'); markWinners(o, false); beep(988, .12, .07);
}
function reveal(o){
  markWinners(o, true);
  if (o.mult > 1){ var lb = $('lb' + o.fruit); lb.textContent = (ODDS[o.fruit] * o.mult) + ' times'; lb.classList.add('up'); }
  o.extra.forEach(function(e){ var lb = $('lb' + e); lb.classList.add('up'); });
  var bt = $('bonusTxt'); bt.textContent = bonusText(o); bt.classList.remove('on'); void bt.offsetWidth; bt.classList.add('on');
  beep(o.bonus === 'n' ? 300 : 1175, .3, .08);
}
function startReels(o, into){
  var t = st.t, i, rem;
  for (i = 0; i < 3; i++){ rem = t.stops[i] - into; if (rem > 150) spinReel(i, o.reels[i], rem); else { var rs = $('rw' + i).firstChild; rs.style.transition = 'none'; rs.style.transform = 'translateY(0)'; rs.innerHTML = cell(o.reels[i]); } }
}
function tick(){
  var inf = info(), idx = inf.idx, into = inf.into;
  if (idx !== cur) resetRound(idx);
  var o = st.o, t = st.t;
  /* বট বাজি */
  while (botIdx < sched.length && (sched[botIdx].t <= into || inf.phase !== 'BET')){ var b = sched[botIdx++]; botShown[b.item] += b.amt; if (inf.phase === 'BET' && into - b.t < 1500) flyBot(b); }
  /* মাঝের সংখ্যা */
  if (inf.phase === 'BET'){ var s = Math.floor((J.BET - into) / 1000), txt = ('0' + s).slice(-2), cn = $('cnum'); if (cn.textContent !== txt){ cn.textContent = txt; if (s <= 3 && s >= 0) beep(880, .12); } cn.className = s <= 3 ? 'red' : ''; }
  else if (!st.chase){ $('cnum').textContent = '00'; $('cnum').className = 'red'; }
  /* ধাপ */
  if (into >= J.BET + J.SPIN && !st.chase){ st.chase = true; finalizeChase(o); }
  if (o.has && into >= t.reel && !st.reel){ st.reel = true; startReels(o, into); }
  if (o.has && into >= t.reveal && !st.rev){ st.rev = true; if (into < t.reveal + 1200) reveal(o); else { setReelsFinal(o); markWinners(o, true); if (o.mult > 1) $('lb' + o.fruit).textContent = (ODDS[o.fruit] * o.mult) + ' times'; } }
  if (into >= t.popup && !st.pop){ st.pop = true; showResult(idx, into > t.popup + 1500); }
  /* জ্যাকপট সংখ্যা */
  $('jp').textContent = fmt(2000000 + Math.floor((Date.now() - J.EPOCH) / 1000 % 400000 * 7));
  /* ট্রফির সময় = দিন শেষ হতে বাকি */
  var n = new Date(), left = (24 * 3600 - (n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds())); var el = $('tt'); if (el) el.textContent = ('0' + Math.floor(left / 3600)).slice(-2) + ':' + ('0' + Math.floor(left % 3600 / 60)).slice(-2);
}
/* আলো ঘোরা — প্রতি ফ্রেমে সময় থেকে হিসাব (মাঝপথে ঢুকলেও ঠিক) */
function frame(){
  var inf = info(), pos = -1;
  if (st.o){
    if (inf.phase === 'BET') pos = ((Math.floor(inf.into / 700) * 3 + inf.idx) % 8 + 8) % 8;
    else if (inf.phase === 'SPIN'){
      var a0 = jOut(inf.idx - 1).fruit, a1 = st.o.fruit, total = 24 + ((a1 - a0 + 8) % 8), p = Math.min(1, (inf.into - J.BET) / J.SPIN), e = 1 - Math.pow(1 - p, 3);
      pos = ((Math.floor(a0 + total * e + 1e-6)) % 8 + 8) % 8; if (p >= 1) pos = a1;
    }
    if (pos !== hlNow){
      if (hlNow >= 0) $('tl' + hlNow).classList.remove('hl');
      if (pos >= 0) $('tl' + pos).classList.add('hl');
      hlNow = pos; if (inf.phase === 'SPIN' && pos !== lastHlSound){ lastHlSound = pos; beep(500 + pos * 40, .04, .03); }
    }
  }
  requestAnimationFrame(frame);
}

/* ─── ফল ─── */
function botBoard(o){
  var wins = [o.fruit].concat(o.extra), sumU = {};
  sched.forEach(function(b){ var k = b.u.uid; sumU[k] = sumU[k] || { u: b.u, bet: 0, win: 0 }; sumU[k].bet += b.amt; if (wins.indexOf(b.item) >= 0) sumU[k].win += b.amt * ODDS[b.item] * (b.item === o.fruit ? o.mult : 1); });
  return Object.keys(sumU).map(function(k){ return { name: sumU[k].u.name, photo: sumU[k].u.photo, bet: sumU[k].bet, win: sumU[k].win }; }).filter(function(x){ return x.win > 0; });
}
function showResult(idx, quiet){
  var o = jOut(idx), wins = [o.fruit].concat(o.extra), myBets = mine.slice(), myCost = sum(myBets), myReward = 0, board = botBoard(o);
  wins.forEach(function(w){ myReward += myBets[w] * ODDS[w] * (w === o.fruit ? o.mult : 1); });
  var done = function(r){
    if (r){ if (typeof r.reward === 'number') myReward = r.reward; if (typeof r.balance === 'number') me.dia = r.balance; }
    showBal();
    if (myCost > 0){
      lastMine = myBets; try { localStorage.setItem('moi_jackpot_last', JSON.stringify(lastMine)); } catch(e){}
      try { var L = JSON.parse(localStorage.getItem('moi_jackpot_my') || '[]'); L.unshift({ t: Date.now(), bet: myCost, res: o.fruit, bonus: o.has ? o.bonus : null, rev: myReward - myCost }); localStorage.setItem('moi_jackpot_my', JSON.stringify(L.slice(0, 40))); } catch(e){}
    }
    if (myReward > 0) addToday(myReward);
    if (quiet) return;
    renderStrip(idx + 1, true);
    if (myReward > 0){ beep(880, .15, .08); setTimeout(function(){ beep(1175, .25, .08); }, 150); floatWin(myReward); try { if (window.MOIBroadcast && window.MOIBroadcast.game) MOIBroadcast.game(myReward, new URLSearchParams(location.search).get('room') || ''); } catch(e){} }
    if (myReward > 0) board.push({ name: me.name, photo: me.photo, bet: myCost, win: myReward });
    board.sort(function(a, b){ return b.win - a.win; });
    if (info().idx === idx) showRp(idx, o, myCost, myReward, board.slice(0, 3));
  };
  if (myCost > 0){ window.MOIEco.call('jackpotClaim', { idx: idx }).then(done).catch(function(){ done(null); }); } else done(null);
}
function floatWin(v){ var f = $('fly'), el = document.createElement('div'); el.className = 'fw'; el.style.left = '0'; el.style.top = '620px'; el.textContent = '+' + fmt(v); f.appendChild(el); requestAnimationFrame(function(){ requestAnimationFrame(function(){ el.style.transform = 'translateY(-300px) scale(1.2)'; el.style.opacity = '0'; }); }); setTimeout(function(){ el.remove(); }, 2300); }

/* ─── রাউন্ড ফলাফল পপআপ ─── */
var rpTimer, rpTick;
function av(p){ return esc(p || (window.MOI_AVATAR ? MOI_AVATAR('x', 'f') : '')); }
function showRp(idx, o, cost, rew, top){
  var h = '<div class="rt">Round ' + (idx % 100000) + '’s Result <img src="img/' + FIMG[o.fruit] + '.webp" alt="">' + (o.has && o.bonus !== 'n' ? '<img src="' + symImg(o.bonus) + '" alt="">' : '') + '</div><div class="rc" id="rpc">(5s)</div>' +
    '<div class="rr"><span>This Round Earnings</span><b>' + DM + fmt(rew) + '</b></div><div class="rr"><span>This Round Cost</span><b>' + DM + fmt(cost) + '</b></div>' +
    '<div class="hr">This Round Ranking</div><div class="rk">';
  if (!top.length) h += '<div class="none">এই রাউন্ডে কেউ জেতেনি</div>';
  top.forEach(function(x){ h += '<div><div class="a"><img src="' + av(x.photo) + '" alt=""></div>' + esc((x.name || '').slice(0, 10)) + '<br><b>' + DM + fmt(x.win) + '</b></div>'; });
  h += '</div>';
  var rp = $('rp'); rp.innerHTML = h; rp.classList.add('on');
  var end = Date.now() + 4300; clearInterval(rpTick); rpTick = setInterval(function(){ var e = $('rpc'); if (e) e.textContent = '(' + Math.max(0, Math.ceil((end - Date.now()) / 1000)) + 's)'; }, 200);
  clearTimeout(rpTimer); rpTimer = setTimeout(closeRp, 4300);
}
function closeRp(){ clearTimeout(rpTimer); clearInterval(rpTick); $('rp').classList.remove('on'); }

/* ─── প্যানেল ─── */
function openModal(title, html){ $('mbox').innerHTML = '<div class="ttl">' + title + '</div><div class="x">×</div>' + html; $('modal').classList.add('on'); }
function closeModal(){ $('modal').classList.remove('on'); }
function showMyBets(){
  var L = []; try { L = JSON.parse(localStorage.getItem('moi_jackpot_my') || '[]'); } catch(e){}
  var h = L.length ? '<table class="tbl"><tr><th>সময়</th><th>বাজি</th><th>ফল</th><th>লাভ/ক্ষতি</th></tr>' + L.filter(function(r){ return r.bet > 0; }).slice(0, 14).map(function(r){ var d = new Date(r.t); return '<tr><td>' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + '</td><td>' + fmt(r.bet) + '</td><td><img class="fi" src="img/' + FIMG[r.res] + '.webp" alt="">' + (r.bonus && r.bonus !== 'n' ? '<img class="fi" style="height:26px" src="' + symImg(r.bonus) + '" alt="">' : '') + '</td><td style="color:' + (r.rev >= 0 ? '#7dff9a' : '#ff8a8a') + '">' + (r.rev >= 0 ? '+' : '') + fmt(r.rev) + '</td></tr>'; }).join('') + '</table>' : '<div class="empty">এখনো কোনো বাজি নেই</div>';
  openModal('My Bets', h);
}
function showHistory(){
  var inf = info(), h = '<div class="hgrid">';
  for (var k = 1; k <= 45; k++){ var o = jOut(inf.idx - k); h += '<div><img class="f" src="img/' + FIMG[o.fruit] + '.webp" alt="">' + (o.has && o.bonus !== 'n' ? '<img class="s" src="' + symImg(o.bonus) + '" alt="">' : '') + '</div>'; }
  openModal('Game History', h + '</div>');
}
function showHow(){
  var od = ''; for (var i = 0; i < 8; i++) od += '<span><img src="img/' + FIMG[i] + '.webp" alt="">' + ODDS[i] + 'x</span>';
  openModal('Rule', '<div class="how"><p>১. চিপ বেছে যেকোনো ফলে ট্যাপ করুন। ঘড়ি শেষ হওয়ার আগেই বাজি ধরতে হবে।</p><p>২. আলো ঘুরে যে ফলে থামবে সেটাই জয়ী। জিতলে বাজি × অডস ডায়মন্ড ফেরত পাবেন:</p><div class="od">' + od + '</div><p>৩. কিছু রাউন্ডের পর স্লট মেশিন চালু হয়। বোনাস হতে পারে: <b>×2</b>, <b>×3</b> (জেতা ফলের অডস গুণ হয়), <b>+1/+2/+3</b> (আরও ১/২/৩টা ফলও জেতে), অথবা <b>JJ জ্যাকপট</b> (জেতা ফলের অডস ৫, ৭ বা ১০ গুণ)। বোনাস নাও আসতে পারে।</p><p>৪. <b>Auto</b> চালু থাকলে আগের রাউন্ডে যে যে ফলে যত ধরেছিলেন, প্রতি রাউন্ডে নিজে নিজে তাই বসবে।</p><p>৫. <b>Mine ›</b> চাপলে আপনার বাজির হিসাব দেখবেন।</p></div>');
}
function showRank(){
  var n = new Date(), seed = n.getFullYear() * 400 + n.getMonth() * 31 + n.getDate(), r = rng(seed * 31 + 7), seen = {}, L = [];
  for (var t = 0; L.length < 10 && t < 100; t++){ var u = USERS[Math.floor(r() * USERS.length)]; if (seen[u.uid]) continue; seen[u.uid] = 1; L.push({ u: u, p: Math.floor(5e4 + r() * 5e6) }); }
  var render = function(){ L.sort(function(a, b){ return b.p - a.p; });
    openModal('Ranking', '<table class="tbl"><tr><th>#</th><th>ইউজার</th><th>পয়েন্ট</th></tr>' + L.slice(0, 10).map(function(x, i){ return '<tr><td>' + (i + 1) + '</td><td class="l"><img src="' + av(x.u.photo) + '" alt="">' + esc((x.u.name || '').slice(0, 12)) + '</td><td>' + fmt(x.p) + ' ' + DM + '</td></tr>'; }).join('') + '</table>'); };
  try {
    window.MOIFB.rtdb.ref(window.MOIFB.LIVE + '/jackpot/dailyWins/' + (function(){ var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })()).get().then(function(s){
      var v = s.val() || {}; Object.keys(v).forEach(function(k){ if (v[k] && v[k].amount) L.push({ u: { uid: k, name: v[k].name, photo: v[k].photo }, p: v[k].amount }); }); render();
    }).catch(render);
  } catch(e){ render(); }
}
function readMine(idx){
  try {
    window.MOIFB.rtdb.ref(window.MOIFB.LIVE + '/jackpot/rounds/R' + idx + '/bets/' + me.uid).get().then(function(s){
      var v = s.val(); if (!v || idx !== cur || pending) return; var b = v.bets || {};
      for (var i = 0; i < 8; i++) mine[i] = Math.max(mine[i], Number(b[i]) || 0); renderMine();
    });
  } catch(e){}
}

/* ─── চালু ─── */
var pingV = 60;
function pingTick(){
  var t0 = performance.now(), el = $('ping'), ok = false;
  try { fetch('../sw.js?p=' + Date.now(), { method: 'HEAD', cache: 'no-store' }).then(function(){ ok = true; pingV = Math.round(performance.now() - t0); }).catch(function(){}).then(function(){
    if (!ok || pingV > 900) pingV = Math.max(25, Math.min(180, pingV + Math.round((Math.random() - .5) * 24)));
    if (el) el.textContent = pingV + 'ms'; }); } catch(e){ pingV = Math.max(25, Math.min(180, pingV + Math.round((Math.random() - .5) * 24))); if (el) el.textContent = pingV + 'ms'; }
}
function start(){
  Promise.resolve(window.MOIReady).then(function(){
    var p = window.MOIAuth && MOIAuth.profile; if (!p || !p.uid){ $('loading').innerHTML = '<div style="color:#fff;font:800 28px system-ui">ভয়েস ক্লাব থেকে খুলুন</div>'; setTimeout(back, 1800); return; }
    me = { uid: p.uid, name: p.name || 'User', photo: p.photo || '', dia: p.diamonds || 0 };
    USERS = pool(); buildUI(); pingTick(); setInterval(pingTick, 3000);
    try { lastMine = JSON.parse(localStorage.getItem('moi_jackpot_last') || 'null'); } catch(e){}
    $('todayN').textContent = fmt(todayWin()); showBal();
    setInterval(function(){ var q = window.MOIAuth && MOIAuth.profile; if (q && !pending && typeof q.diamonds === 'number' && q.diamonds !== me.dia){ me.dia = q.diamonds; showBal(); } }, 600);
    setInterval(tick, 100); tick(); requestAnimationFrame(frame); readMine(cur);
    setTimeout(function(){ $('loading').classList.add('off'); }, 300);
  });
}
start();
setTimeout(function(){ var l = $('loading'); if (l) l.classList.add('off'); }, 8000);
})();
