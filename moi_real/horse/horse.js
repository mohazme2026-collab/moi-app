/* horse/horse.js — Horse Race (ডেমো)
   ৬টা ঘোড়া, ৬ লেন | রাউন্ড ৮৪ সেকেন্ড = ১৫ সেকেন্ড বাজি → ১ মিনিট রেস (শেষ ১০ সেকেন্ডে বাজি বন্ধ) → ফল → পপআপ
   গুণ ফিক্সড: ঘোড়া ১=2× ২=4× ৩=6× ৪=8× ৫=10× ৬=12× | যেকোনো ২টা ঘোড়ায় বাজি
   🔒 কোন ঘোড়া জিতবে সেই অংশ (hWinner) shared/core/economy.js এর "Horse Race" অংশের সাথে হুবহু একই রাখতে হবে।
   (রেসের পথ/আগে-পিছে হওয়া শুধু দেখানোর জন্য — হিসাব শুধু বিজয়ী ঘোড়া থেকে) */
(function(){
'use strict';
var $ = function(id){ return document.getElementById(id); };
var HC = { EPOCH: 1700000000000, ROUND: 84000, PRE: 15000, CLOSE: 65000, FIN: 75000, POP: 78500 };
var MULT = [2, 4, 6, 8, 10, 12], WT = [41, 20, 14, 10, 8, 7];
var COL = ['#e63946', '#2f7df6', '#2fbf5b', '#ffd21f', '#9b4dff', '#ff8a1f'];
var CHIPS = [500, 5000, 50000, 500000], CL = ['500', '5K', '50K', '500K'], CIMG = ['chip_500', 'chip_5k', 'chip_50k', 'chip_500k'];
var DM = '<svg class="dm" viewBox="0 0 24 24"><use href="#dmI"/></svg>';
/* ট্র্যাকের মাপ (720×1160 ডিজাইন) */
var TK = { left: 20, top: 268, w: 680, h: 473, lane: [0.1303, 0.2892, 0.4467, 0.6036, 0.7615, 0.9179], start: 0.058, fin: 0.945 };
var HW = 150, HH = 103;
var NOSE0 = TK.left + TK.w * TK.start + 0.55 * HW, NOSE1 = TK.left + TK.w * TK.fin;

/* ─── বিজয়ী (সবার জন্য একই, রাউন্ড নম্বর থেকে) ─── */
function mb(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hWinner(idx){
  var B = 32, b = Math.floor(idx / B), k = idx - b * B, r = mb(b * 9973 + 71), prev = -1, w = 0, i, j;
  for (i = 0; i <= k; i++){
    var x = r(), y = r() * 100, acc = 0, f = 0;
    for (j = 0; j < 6; j++){ acc += WT[j]; if (y < acc){ f = j; break; } }
    w = (prev >= 0 && x < .2) ? prev : f; prev = w;
  }
  return w;
}
function info(){ var el = Date.now() - HC.EPOCH, idx = Math.floor(el / HC.ROUND), into = el % HC.ROUND; return { idx: idx, into: into, open: into < HC.CLOSE }; }
function rng(seed){ var s = (seed >>> 0) % 2147483647 || 1; return function(){ return (s = s * 48271 % 2147483647) / 2147483647; }; }
function fmt(n){ n = Math.round(n); return n.toLocaleString('en-US'); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function sum(a){ return a.reduce(function(x, y){ return x + y; }, 0); }
function dayKey(){ var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function mmss(ms){ var s = Math.max(0, Math.ceil(ms / 1000)); return ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2); }
function nmc(i){ return '<i class="nmc" style="background:' + COL[i] + '">' + (i + 1) + '</i>'; }

/* ─── রেসের পথ (শুধু দেখানোর জন্য; বিজয়ী আগে থেকেই ঠিক) ─── */
var raceCache = {};
function hRace(idx){
  if (raceCache[idx]) return raceCache[idx];
  var w = hWinner(idx), r = mb(idx * 4099 + 555), i, k, n, j; r(); r();
  /* ৫০ সেকেন্ডে (বাজি বন্ধ হওয়ার সময়) বিজয়ী ঘোড়া কত নম্বরে থাকবে — এলোমেলো */
  var RW = [28, 20, 17, 14, 12, 9], q = r() * 100, acc = 0, rw = 0;
  for (j = 0; j < 6; j++){ acc += RW[j]; if (q < acc){ rw = j; break; } }
  var rest = []; for (i = 0; i < 6; i++) if (i !== w) rest.push(i);
  for (i = rest.length - 1; i > 0; i--){ j = Math.floor(r() * (i + 1)); var t0 = rest[i]; rest[i] = rest[j]; rest[j] = t0; }
  var order = []; for (j = 0, k = 0; j < 6; j++) order.push(j === rw ? w : rest[k++]);
  var p50 = [], top = .8 + (r() - .5) * .04;
  for (j = 0; j < 6; j++){ top = j === 0 ? top : top - (.012 + r() * .022); p50[order[j]] = top; }
  var gaps = [.035, .06, .085, .11, .135], g = 0;
  for (i = gaps.length - 1; i > 0; i--){ j = Math.floor(r() * (i + 1)); t0 = gaps[i]; gaps[i] = gaps[j]; gaps[j] = t0; }
  var F = [], E = [], P = [];
  for (i = 0; i < 6; i++){ F[i] = i === w ? 1 : 1 - gaps[g++] - r() * .012; E[i] = 1.03 + r() * .04; }
  for (i = 0; i < 6; i++){
    var kn = []; for (k = 0; k < 6; k++) kn.push(.6 + r() * .8);
    var R = 0, arr = [0], t, seg, u, c, m;
    for (n = 1; n <= 500; n++){ t = (n - .5) * .1; seg = Math.min(4, Math.floor(t / 10)); u = (t - seg * 10) / 10; c = (1 - Math.cos(Math.PI * u)) / 2; m = kn[seg] * (1 - c) + kn[seg + 1] * c; R += m * .1; arr.push(R); }
    for (n = 0; n <= 500; n++) arr[n] = arr[n] / R * p50[i];
    /* শেষ ১০ সেকেন্ড: বিজয়ী পিছন থেকে হঠাৎ স্পিড বাড়ায় */
    var bb = i === w ? (rw >= 2 ? -(.1 + r() * .25) : (r() - .5) * .4) : (r() - .5) * .5;
    for (n = 501; n <= 600; n++){ u = (n - 500) / 100; arr.push(p50[i] + (F[i] - p50[i]) * (u + bb * u * (1 - u))); }
    P.push(arr);
  }
  var o = { w: w, F: F, E: E, P: P }; raceCache[idx] = o;
  var ks = Object.keys(raceCache); if (ks.length > 4) delete raceCache[ks[0]];
  return o;
}
function posAt(o, i, t){
  if (t <= 0) return 0;
  if (t <= 60000){ var f = t / 100, a = Math.floor(f), b = f - a, A = o.P[i]; return A[a] + (A[Math.min(600, a + 1)] - A[a]) * b; }
  var u = Math.min(1, (t - 60000) / 3500), e = 1 - Math.pow(1 - u, 3); return o.F[i] + (o.E[i] - o.F[i]) * e;
}

/* ─── মাপ ফিট (720×1160 ডিজাইন) ─── */
function fit(){
  var vw = window.innerWidth, vh = window.innerHeight, k = Math.min(vw / 720, vh / 1160), cv = $('cv');
  cv.style.transform = 'scale(' + k + ')'; cv.style.left = ((vw - 720 * k) / 2) + 'px'; cv.style.top = Math.max(0, (vh - 1160 * k) * 0.3) + 'px';
}
window.addEventListener('resize', fit); fit();

/* ─── স্টেট ─── */
var me = { uid: '', name: '', photo: '', dia: 0 }, selChip = 0, snd = true, autoOn = false;
var cur = -1, mine = [0, 0, 0, 0, 0, 0], botIdx = 0, sched = [], lastMine = null, pending = 0, st = {}, ph = [0, 0, 0, 0, 0, 0], lastTs = 0, lastRk = 0;
var USERS = [];
var W2 = [30, 22, 17, 13, 10, 8];

function pool(){
  var U = window.DEMO && window.DEMO.USERS ? Object.keys(window.DEMO.USERS).map(function(k){ var u = window.DEMO.USERS[k]; return { uid: u.uid || k, name: u.name, photo: u.photo, level: u.level }; }).filter(function(u){ return u.name; }) : [];
  if (U.length < 20) for (var i = 0; i < 40; i++) U.push({ uid: '9' + (10000 + i), name: 'Player ' + (i + 1), photo: '' });
  return U;
}
/* এই রাউন্ডের বটদের বাজির সময়সূচি (নির্দিষ্ট) */
function makeSched(idx){
  var r = rng(idx * 7919 + 17), P = USERS, n = 18 + Math.floor(r() * 14), out = [];
  for (var i = 0; i < n; i++){
    var u = P[Math.floor(r() * P.length)], q = r() * 100, item = 0, acc = 0, k;
    for (k = 0; k < 6; k++){ acc += W2[k]; if (q < acc){ item = k; break; } }
    var c = r(), ci = c < .5 ? 0 : (c < .82 ? 1 : (c < .96 ? 2 : 3)), times = 1 + Math.floor(r() * (ci === 0 ? 4 : 2));
    out.push({ t: 300 + Math.floor(r() * 62000), u: u, item: item, amt: CHIPS[ci] * times });
  }
  out.sort(function(a, b){ return a.t - b.t; }); return out;
}

/* ─── UI তৈরি ─── */
function laneY(i){ return TK.top + TK.lane[i] * TK.h; }
function cardPos(i){ return { x: 20 + (i % 3) * 231, y: 820 + Math.floor(i / 3) * 96 }; }
function buildUI(){
  var i, h = '', c = '';
  for (i = 0; i < 6; i++){
    h += '<div class="hz" id="hz' + i + '" style="z-index:' + (3 + i) + '"><div class="hs" id="hs' + i + '" style="background-image:url(img/horse' + (i + 1) + '.webp)"></div><div class="tg" style="background:' + COL[i] + '">' + (i + 1) + '</div></div>';
    var p = cardPos(i);
    c += '<div class="cd" id="cd' + i + '" style="left:' + (p.x - 20) + 'px;top:' + (p.y - 820) + 'px;border-color:' + COL[i] + '"><i class="nm" style="background:' + COL[i] + '">' + (i + 1) + '</i><div><small>Horse ' + (i + 1) + '</small><b>' + MULT[i] + '×</b></div><div class="mb" id="mb' + i + '">0</div></div>';
  }
  $('horses').innerHTML = h; $('cards').innerHTML = c;
  var ch = '';
  for (i = 0; i < 4; i++) ch += '<div class="cc c' + i + '" id="ch' + i + '" style="left:' + (i * 174) + 'px"><img src="img/' + CIMG[i] + '.webp" alt="">' + CL[i] + '</div>';
  $('chips').innerHTML = ch; selectChip(0);
  var rk = ''; for (i = 0; i < 6; i++) rk += '<div class="rk"><em>' + (i + 1) + '</em><i id="rk' + i + '"></i></div>';
  $('rkIn').innerHTML = rk;
  for (i = 0; i < 6; i++){ (function(i){ $('cd' + i).addEventListener('pointerdown', function(e){ e.preventDefault(); bet(i, selChip); }); })(i); }
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
}
function selectChip(i){ selChip = i; for (var k = 0; k < 4; k++) $('ch' + k).classList.toggle('sel', k === i); }
function back(){ try { if (window.parent !== window) window.parent.postMessage({ type: 'GAME_CLOSE' }, '*'); else if (history.length > 1) history.back(); else location.href = '../home/index.html'; } catch(e){} }

/* ─── ছোট টুল ─── */
var tTimer;
function toast(m){ var t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tTimer); tTimer = setTimeout(function(){ t.classList.remove('on'); }, 1500); }
var AC;
function beep(f, d, v){ if (!snd) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); var o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f; o.type = 'sine'; g.gain.value = v || .06; o.connect(g); g.connect(AC.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d); o.stop(AC.currentTime + d); } catch(e){} }
function cardCenter(i){ var p = cardPos(i); return { x: p.x + 109, y: p.y + 43 }; }
function chipPos(i){ return { x: 20 + i * 174 + 24, y: 1022 }; }
function flyBot(b){
  var f = $('fly'), c = cardCenter(b.item);
  var el = document.createElement('div'); el.className = 'fc'; el.style.left = (c.x - 100) + 'px'; el.style.top = (c.y - 70) + 'px'; el.style.transform = 'translateY(24px) scale(.8)'; el.style.opacity = '0';
  el.innerHTML = '<img src="' + esc(b.u.photo || (window.MOI_AVATAR ? MOI_AVATAR(b.u.uid, 'f') : '')) + '" alt=""><span>' + esc((b.u.name || '').slice(0, 8)) + ' <b>+' + fmt(b.amt) + '</b></span>';
  f.appendChild(el); requestAnimationFrame(function(){ el.style.opacity = '1'; el.style.transform = 'translateY(-10px) scale(1)'; });
  setTimeout(function(){ el.style.opacity = '0'; }, 1000); setTimeout(function(){ el.remove(); }, 1900);
}
function flyMine(i){
  var c = cardCenter(i), s = chipPos(selChip), f = $('fly'), ch = document.createElement('div'); ch.className = 'fch';
  ch.innerHTML = '<img src="img/' + CIMG[selChip] + '.webp" alt="">'; ch.style.left = (s.x - 17) + 'px'; ch.style.top = s.y + 'px'; f.appendChild(ch);
  requestAnimationFrame(function(){ ch.style.transform = 'translate(' + (c.x - s.x) + 'px,' + (c.y - s.y - 17) + 'px) scale(.85)'; });
  setTimeout(function(){ ch.style.opacity = '0'; }, 520); setTimeout(function(){ ch.remove(); }, 900);
}
function renderMine(){ for (var i = 0; i < 6; i++){ var e = $('mb' + i); e.textContent = fmt(mine[i]); e.style.display = mine[i] > 0 ? 'block' : 'none'; } }
function showBal(){ $('balN').textContent = fmt(me.dia); }
function todayWin(){ try { var t = JSON.parse(localStorage.getItem('moi_horse_today') || '{}'); return t.d === dayKey() ? (t.v || 0) : 0; } catch(e){ return 0; } }
function addToday(v){ try { localStorage.setItem('moi_horse_today', JSON.stringify({ d: dayKey(), v: todayWin() + v })); } catch(e){} $('todayN').textContent = fmt(todayWin()); }

/* ─── বাজি ─── */
function horsesUsed(){ return mine.filter(function(v){ return v > 0; }).length; }
function bet(i, chipIdx, amtOverride, silent){
  var inf = info(); if (!inf.open){ if (!silent) toast('🔒 এখন বাজি বন্ধ'); return false; }
  if (mine[i] === 0 && horsesUsed() >= 2){ if (!silent) toast('সর্বোচ্চ ২টা ঘোড়ায় বাজি ধরা যায়'); beep(180, .2); return false; }
  var amt = amtOverride || CHIPS[chipIdx];
  if (me.dia < amt){ if (!silent) toast('❌ যথেষ্ট ডায়মন্ড নেই'); beep(180, .2); return false; }
  var idx = inf.idx; me.dia -= amt; mine[i] += amt; pending++; showBal(); renderMine(); beep(660, .08); if (!silent) flyMine(i);
  window.MOIEco.call('horseBet', { idx: idx, item: i, chip: amt }).then(function(r){ pending--; if (typeof r.balance === 'number' && pending === 0) me.dia = r.balance; showBal(); })
    .catch(function(err){ pending--; if (idx === cur){ mine[i] -= amt; } me.dia += amt; showBal(); renderMine(); toast('❌ ' + ((err && err.message) || 'বাজি হয়নি')); });
  return true;
}
function repeatBets(silent){
  var inf = info(); if (!inf.open) return;
  if (sum(mine) > 0) return;
  if (!lastMine || !sum(lastMine)){ if (!silent) toast('আগের রাউন্ডে বাজি ছিল না'); return; }
  var tot = sum(lastMine); if (me.dia < tot){ toast('❌ যথেষ্ট ডায়মন্ড নেই'); if (autoOn) toggleAuto(); return; }
  lastMine.forEach(function(v, i){ if (v > 0) bet(i, 0, v, true); });
}
function toggleAuto(){
  autoOn = !autoOn; $('bAuto').classList.toggle('on', autoOn); toast(autoOn ? '🔁 Auto চালু — আগের বাজি নিজে নিজে বসবে' : 'Auto বন্ধ');
  if (autoOn && info().open) repeatBets(false);
}

/* ─── রাউন্ডের ধাপ ─── */
function resetRound(idx){
  cur = idx; $('rn').textContent = (idx % 100000);
  mine = [0, 0, 0, 0, 0, 0]; botIdx = 0; sched = makeSched(idx);
  st = { fin: false, pop: false, o: hRace(idx) }; ph = [0, 0, 0, 0, 0, 0];
  for (var i = 0; i < 6; i++){ $('cd' + i).classList.remove('win', 'dim'); $('hz' + i).classList.remove('w'); }
  $('winTxt').classList.remove('on');
  renderMine(); closeRp();
  if (autoOn) setTimeout(function(){ if (cur === idx) repeatBets(true); }, 500);
}
function finish(o, loud){
  var w = o.w;
  for (var i = 0; i < 6; i++){ $('cd' + i).classList.toggle('win', i === w); $('cd' + i).classList.toggle('dim', i !== w); $('hz' + i).classList.toggle('w', i === w); }
  if (loud){ var t = $('winTxt'); t.textContent = '🏆 Horse ' + (w + 1) + ' Wins! ' + MULT[w] + '×'; t.classList.remove('on'); void t.offsetWidth; t.classList.add('on'); beep(988, .15, .08); setTimeout(function(){ beep(1319, .3, .08); }, 160); }
}
function order(o, t){ var a = [0, 1, 2, 3, 4, 5], p = a.map(function(i){ return posAt(o, i, t); }); a.sort(function(x, y){ return p[y] - p[x]; }); return a; }
function renderRank(o, t){
  var a = order(o, t);
  for (var k = 0; k < 6; k++){ var e = $('rk' + k); e.style.background = COL[a[k]]; e.textContent = a[k] + 1; }
}
function tick(){
  var inf = info(), idx = inf.idx, into = inf.into;
  if (idx !== cur) resetRound(idx);
  var o = st.o;
  /* বট বাজি */
  while (botIdx < sched.length && (sched[botIdx].t <= into || into >= HC.CLOSE)){ var b = sched[botIdx++]; if (inf.open && into - b.t < 1500) flyBot(b); }
  /* টাইমার */
  var tm = $('tm'), txt;
  if (into < HC.PRE){ txt = 'BET ' + mmss(HC.PRE - into); var s = Math.ceil((HC.PRE - into) / 1000); if (s <= 3 && st.lastS !== s){ st.lastS = s; beep(880, .12); } }
  else if (into < HC.FIN) txt = 'RACE ' + mmss(HC.FIN - into);
  else txt = 'FINISH';
  if (tm.textContent !== txt) tm.textContent = txt;
  tm.className = (into >= HC.CLOSE && into < HC.FIN) ? 'closed' : '';
  var clo = $('clo');
  if (inf.open){ clo.textContent = 'Bets close in ' + Math.ceil((HC.CLOSE - into) / 1000) + 's'; clo.className = ''; } else { clo.textContent = '🔒 Bets closed'; clo.className = 'off'; }
  /* ধাপ */
  if (into >= HC.FIN && !st.fin){ st.fin = true; finish(o, into < HC.FIN + 2000); }
  if (into >= HC.POP && !st.pop){ st.pop = true; showResult(idx, into > HC.POP + 1500); }
  /* লাইভ র‍্যাংক */
  var now = Date.now(); if (now - lastRk > 350){ lastRk = now; renderRank(o, Math.min(into - HC.PRE, 75000)); }
  /* ট্রফির সময় = দিন শেষ হতে বাকি */
  var n = new Date(), left = (24 * 3600 - (n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds())); var el = $('tt'); if (el) el.textContent = ('0' + Math.floor(left / 3600)).slice(-2) + ':' + ('0' + Math.floor(left % 3600 / 60)).slice(-2);
}
/* ঘোড়ার দৌড় — প্রতি ফ্রেমে সময় থেকে হিসাব (মাঝপথে ঢুকলেও ঠিক) */
function frame(ts){
  var inf = info(), t = inf.into - HC.PRE, dt = Math.min(.05, (ts - lastTs) / 1000 || .016); lastTs = ts;
  var o = st.o;
  if (o){
    for (var i = 0; i < 6; i++){
      var p = posAt(o, i, t), moving = t > 0 && (t < 60000 || p < o.E[i] - .003), fr = 0;
      if (moving){ var spd = (posAt(o, i, t + 200) - p) / .2 * 60; ph[i] += dt * (5 + 8 * Math.min(2.2, Math.max(0, spd))); fr = Math.floor(ph[i]) % 6; }
      else if (t <= 0){ ph[i] += dt * 1.2; fr = 0; }
      var x = NOSE0 + p * (NOSE1 - NOSE0) - HW * .97, y = laneY(i) - HH / 2 - 7 + (moving ? Math.sin(ph[i] * 1.05) * 2 : 0);
      var el = $('hz' + i); el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      $('hs' + i).style.backgroundPositionX = (-fr * HW) + 'px';
    }
  }
  requestAnimationFrame(frame);
}

/* ─── ফল ─── */
function botBoard(w){
  var sumU = {};
  sched.forEach(function(b){ var k = b.u.uid; sumU[k] = sumU[k] || { u: b.u, bet: 0, win: 0 }; sumU[k].bet += b.amt; if (b.item === w) sumU[k].win += b.amt * MULT[w]; });
  return Object.keys(sumU).map(function(k){ return { name: sumU[k].u.name, photo: sumU[k].u.photo, bet: sumU[k].bet, win: sumU[k].win }; }).filter(function(x){ return x.win > 0; });
}
function showResult(idx, quiet){
  var w = hWinner(idx), myBets = mine.slice(), myCost = sum(myBets), myReward = myBets[w] * MULT[w], board = botBoard(w);
  var done = function(r){
    if (r){ if (typeof r.reward === 'number') myReward = r.reward; if (typeof r.balance === 'number') me.dia = r.balance; }
    showBal();
    if (myCost > 0){
      lastMine = myBets; try { localStorage.setItem('moi_horse_last', JSON.stringify(lastMine)); } catch(e){}
      try { var L = JSON.parse(localStorage.getItem('moi_horse_my') || '[]'); L.unshift({ t: Date.now(), bet: myCost, res: w, rev: myReward - myCost }); localStorage.setItem('moi_horse_my', JSON.stringify(L.slice(0, 40))); } catch(e){}
    }
    if (myReward > 0) addToday(myReward);
    if (quiet) return;
    if (myReward > 0){ beep(880, .15, .08); setTimeout(function(){ beep(1175, .25, .08); }, 150); floatWin(myReward); try { if (window.MOIBroadcast && window.MOIBroadcast.game) MOIBroadcast.game(myReward, new URLSearchParams(location.search).get('room') || ''); } catch(e){} }
    if (myReward > 0) board.push({ name: me.name, photo: me.photo, bet: myCost, win: myReward });
    board.sort(function(a, b){ return b.win - a.win; });
    if (info().idx === idx) showRp(idx, w, myCost, myReward, board.slice(0, 3));
  };
  if (myCost > 0){ window.MOIEco.call('horseClaim', { idx: idx }).then(done).catch(function(){ done(null); }); } else done(null);
}
function floatWin(v){ var f = $('fly'), el = document.createElement('div'); el.className = 'fw'; el.style.left = '0'; el.style.top = '620px'; el.textContent = '+' + fmt(v); f.appendChild(el); requestAnimationFrame(function(){ requestAnimationFrame(function(){ el.style.transform = 'translateY(-300px) scale(1.2)'; el.style.opacity = '0'; }); }); setTimeout(function(){ el.remove(); }, 2300); }

/* ─── রাউন্ড ফলাফল পপআপ ─── */
var rpTimer, rpTick;
function av(p){ return esc(p || (window.MOI_AVATAR ? MOI_AVATAR('x', 'f') : '')); }
function showRp(idx, w, cost, rew, top){
  var h = '<div class="rt">Round ' + (idx % 100000) + '’s Winner ' + nmc(w) + ' <b style="color:#ffd21f">' + MULT[w] + '×</b></div><div class="rc" id="rpc">(5s)</div>' +
    '<div class="rr"><span>This Round Earnings</span><b>' + DM + fmt(rew) + '</b></div><div class="rr"><span>This Round Cost</span><b>' + DM + fmt(cost) + '</b></div>' +
    '<div class="hr">This Round Ranking</div><div class="rk2">';
  if (!top.length) h += '<div class="none">এই রাউন্ডে কেউ জেতেনি</div>';
  top.forEach(function(x){ h += '<div><div class="a"><img src="' + av(x.photo) + '" alt=""></div>' + esc((x.name || '').slice(0, 10)) + '<br><b>' + DM + fmt(x.win) + '</b></div>'; });
  h += '</div>';
  var rp = $('rp'); rp.innerHTML = h; rp.classList.add('on');
  var end = Date.now() + 4800; clearInterval(rpTick); rpTick = setInterval(function(){ var e = $('rpc'); if (e) e.textContent = '(' + Math.max(0, Math.ceil((end - Date.now()) / 1000)) + 's)'; }, 200);
  clearTimeout(rpTimer); rpTimer = setTimeout(closeRp, 4800);
}
function closeRp(){ clearTimeout(rpTimer); clearInterval(rpTick); $('rp').classList.remove('on'); }

/* ─── প্যানেল ─── */
function openModal(title, html){ $('mbox').innerHTML = '<div class="ttl">' + title + '</div><div class="x">×</div>' + html; $('modal').classList.add('on'); }
function closeModal(){ $('modal').classList.remove('on'); }
function showMyBets(){
  var L = []; try { L = JSON.parse(localStorage.getItem('moi_horse_my') || '[]'); } catch(e){}
  var h = L.length ? '<table class="tbl"><tr><th>সময়</th><th>বাজি</th><th>বিজয়ী</th><th>লাভ/ক্ষতি</th></tr>' + L.filter(function(r){ return r.bet > 0; }).slice(0, 14).map(function(r){ var d = new Date(r.t); return '<tr><td>' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + '</td><td>' + fmt(r.bet) + '</td><td>' + nmc(r.res) + '</td><td style="color:' + (r.rev >= 0 ? '#7dff9a' : '#ff8a8a') + '">' + (r.rev >= 0 ? '+' : '') + fmt(r.rev) + '</td></tr>'; }).join('') + '</table>' : '<div class="empty">এখনো কোনো বাজি নেই</div>';
  openModal('My Bets', h);
}
function showHistory(){
  var inf = info(), h = '<div class="hgrid2">';
  for (var k = 1; k <= 45; k++){ var w = hWinner(inf.idx - k); h += '<div>' + nmc(w) + '<small>' + MULT[w] + '×</small></div>'; }
  openModal('Game History', h + '</div>');
}
function showHow(){
  var od = ''; for (var i = 0; i < 6; i++) od += '<span>' + nmc(i) + MULT[i] + '×</span>';
  openModal('Rule', '<div class="how"><p>১. চিপ বেছে যেকোনো <b>২টা</b> ঘোড়ায় বাজি ধরুন। একটা ঘোড়ায় একাধিকবারও ধরা যায়।</p><p>২. শুরুতে ১৫ সেকেন্ড বাজির সময়। তারপর ১ মিনিটের রেস চলে, রেসের মাঝেও বাজি ধরা যায়। শেষ ১০ সেকেন্ডে বাজি <b>বন্ধ</b> হয়ে যায়।</p><p>৩. যে ঘোড়া সবার আগে ফিনিশ লাইন পার হবে সেটাই জয়ী। জিতলে বাজি × গুণ ডায়মন্ড ফেরত পাবেন:</p><div class="od2">' + od + '</div><p>৪. শেষ মুহূর্তে পিছনের ঘোড়াও হঠাৎ স্পিড বাড়িয়ে জিততে পারে। বড় গুণের ঘোড়া কম জেতে, ছোট গুণের ঘোড়া বেশি জেতে।</p><p>৫. <b>Auto</b> চালু থাকলে আগের রাউন্ডে যে যে ঘোড়ায় যত ধরেছিলেন, প্রতি রাউন্ডে নিজে নিজে তাই বসবে।</p><p>৬. <b>Mine ›</b> চাপলে আপনার বাজির হিসাব দেখবেন।</p></div>');
}
function showRank(){
  var n = new Date(), seed = n.getFullYear() * 400 + n.getMonth() * 31 + n.getDate(), r = rng(seed * 31 + 11), seen = {}, L = [];
  for (var t = 0; L.length < 10 && t < 100; t++){ var u = USERS[Math.floor(r() * USERS.length)]; if (seen[u.uid]) continue; seen[u.uid] = 1; L.push({ u: u, p: Math.floor(5e4 + r() * 5e6) }); }
  var render = function(){ L.sort(function(a, b){ return b.p - a.p; });
    openModal('Ranking', '<table class="tbl"><tr><th>#</th><th>ইউজার</th><th>পয়েন্ট</th></tr>' + L.slice(0, 10).map(function(x, i){ return '<tr><td>' + (i + 1) + '</td><td class="l"><img src="' + av(x.u.photo) + '" alt="">' + esc((x.u.name || '').slice(0, 12)) + '</td><td>' + fmt(x.p) + ' ' + DM + '</td></tr>'; }).join('') + '</table>'); };
  try {
    window.MOIFB.rtdb.ref(window.MOIFB.LIVE + '/horse/dailyWins/' + (function(){ var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })()).get().then(function(s){
      var v = s.val() || {}; Object.keys(v).forEach(function(k){ if (v[k] && v[k].amount) L.push({ u: { uid: k, name: v[k].name, photo: v[k].photo }, p: v[k].amount }); }); render();
    }).catch(render);
  } catch(e){ render(); }
}
function readMine(idx){
  try {
    window.MOIFB.rtdb.ref(window.MOIFB.LIVE + '/horse/rounds/R' + idx + '/bets/' + me.uid).get().then(function(s){
      var v = s.val(); if (!v || idx !== cur || pending) return; var b = v.bets || {};
      for (var i = 0; i < 6; i++) mine[i] = Math.max(mine[i], Number(b[i]) || 0); renderMine();
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
    try { lastMine = JSON.parse(localStorage.getItem('moi_horse_last') || 'null'); } catch(e){}
    $('todayN').textContent = fmt(todayWin()); showBal();
    setInterval(function(){ var q = window.MOIAuth && MOIAuth.profile; if (q && !pending && typeof q.diamonds === 'number' && q.diamonds !== me.dia){ me.dia = q.diamonds; showBal(); } }, 600);
    setInterval(tick, 100); tick(); requestAnimationFrame(frame); readMine(cur);
    setTimeout(function(){ $('loading').classList.add('off'); }, 300);
  });
}
start();
setTimeout(function(){ var l = $('loading'); if (l) l.classList.add('off'); }, 8000);
})();
