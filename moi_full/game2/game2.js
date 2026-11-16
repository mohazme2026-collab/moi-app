/* game2/game2.js — ফল-চাকা গেম (ডেমো): রাউন্ড ২০ সেকেন্ড = ১০ বাজি → ঘোরা → ফল
   ঘর: 0 তরমুজ x2 · 1 ৭৭ x8 · 2 জাম x2 | চাকা ৯ খোপ (তরমুজ ৪, জাম ৪, ৭৭ ১)
   বট বাজি: প্রতি রাউন্ডে নির্দিষ্ট (রিলোড করলেও একই), বটের আসল নাম/ছবি/ID সহ */
(function(){
'use strict';
var $ = function(id){ return document.getElementById(id); };
var MULT = [2, 8, 2], CHIPS = [500, 5000, 50000, 100000], CL = ['500', '5K', '50K', '100K'];
var F = { EPOCH: 1700000000000, ROUND: 20000, BET: 10000, SPIN: 15500, WEDGE: [0, 2, 0, 2, 1, 0, 2, 0, 2] };
var ITEMIMG = ['img/melonhalf.webp', 'img/s77.webp', 'img/plum_s.webp'];
var DM = '<svg class="dm" viewBox="0 0 24 24"><use href="#dmI"/></svg>';

function info(){ var el = Date.now() - F.EPOCH, idx = Math.floor(el / F.ROUND), into = el % F.ROUND; return { idx: idx, into: into, phase: into < F.BET ? 'BET' : (into < F.SPIN ? 'SPIN' : 'RES') }; }
function fOut(idx){
  function mb(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var B = 24, b = Math.floor(idx / B), pos = idx - b * B, r = mb(b * 9301 + 49297), q = r(), n = q < .1 ? 0 : q < .45 ? 1 : q < .9 ? 2 : 3, sl = [];
  while (sl.length < n){ var p = Math.floor(r() * B); if (sl.indexOf(p) < 0) sl.push(p); }
  var h = mb(idx * 2654435 + 12345); h(); h();
  if (sl.indexOf(pos) >= 0){
    var t = h(), o = h();
    if (t < .3) return { wedge: 4, wins: [1], hl: [4], strip: 1 };
    if (t < .85){ var m = o < .5; return { wedge: 4, wins: m ? [0, 1] : [1, 2], hl: m ? [4, 5] : [3, 4], strip: 1 }; }
    return { wedge: 4, wins: [0, 1, 2], hl: [3, 4, 5], strip: 1 };
  }
  var rr = mb(b * 7717 + 31), f = rr() < .5 ? 0 : 2, k = 0, L = [1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 6];
  for (;;){ var len = L[Math.floor(rr() * L.length)]; if (pos < k + len) break; k += len; f = f === 0 ? 2 : 0; }
  var W = f === 0 ? [0, 2, 5, 7] : [1, 3, 6, 8], w = W[Math.floor(h() * 4)];
  return { wedge: w, wins: [f], hl: [w], strip: f };
}
function wedgeOf(idx){ return fOut(idx).wedge; }
function restAng(idx){ return (360 - 40 * wedgeOf(idx)) % 360; }
function rng(seed){ var s = (seed >>> 0) % 2147483647 || 1; return function(){ return (s = s * 48271 % 2147483647) / 2147483647; }; }
function fmt(n){ n = Math.round(n); return n.toLocaleString('en-US'); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

/* ─── মাপ ফিট (720×1126 ডিজাইন) ─── */
function fit(){
  var vw = window.innerWidth, vh = window.innerHeight, k = Math.min(vw / 720, vh / 1126), cv = $('cv');
  cv.style.transform = 'scale(' + k + ')'; cv.style.left = ((vw - 720 * k) / 2) + 'px'; cv.style.top = Math.max(0, (vh - 1126 * k) * 0.3) + 'px';
}
window.addEventListener('resize', fit); fit();

/* ─── চাকা আঁকা ─── */
function buildDisc(){
  var R = 216, sv = '<svg viewBox="-216 -216 432 432"><defs>' +
    '<radialGradient id="gL" cx="0" cy="0" r="216" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#34a8ff"/><stop offset=".5" stop-color="#0091fe"/><stop offset="1" stop-color="#0066cc"/></radialGradient>' +
    '<radialGradient id="gD" cx="0" cy="0" r="216" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2a7ee0"/><stop offset=".5" stop-color="#0466c7"/><stop offset="1" stop-color="#044aa6"/></radialGradient>' +
    '<radialGradient id="gP" cx="0" cy="0" r="216" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff8af8"/><stop offset=".5" stop-color="#ff54f4"/><stop offset="1" stop-color="#d62db8"/></radialGradient>' +
    '<radialGradient id="gO" cx="0" cy="0" r="216" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffe27a"/><stop offset=".6" stop-color="#ffa21a"/><stop offset="1" stop-color="#ff7a00"/></radialGradient></defs>';
  function P(a){ var r = a * Math.PI / 180; return [(R * Math.sin(r)).toFixed(2), (-R * Math.cos(r)).toFixed(2)]; }
  for (var k = 0; k < 9; k++){
    var a1 = P(40 * k - 20), a2 = P(40 * k + 20), L = k < 4 ? k % 2 === 0 : k % 2 === 1;
    var fill = k === 4 ? 'gP' : (L ? 'gL' : 'gD'), d = 'M0 0 L' + a1[0] + ' ' + a1[1] + ' A216 216 0 0 1 ' + a2[0] + ' ' + a2[1] + ' Z';
    sv += '<path d="' + d + '" fill="url(#' + fill + ')" stroke="rgba(255,255,255,.22)" stroke-width="2"/>';
  }
  for (k = 0; k < 9; k++){
    a1 = P(40 * k - 20); a2 = P(40 * k + 20);
    sv += '<path class="hl" id="hl' + k + '" d="M0 0 L' + a1[0] + ' ' + a1[1] + ' A216 216 0 0 1 ' + a2[0] + ' ' + a2[1] + ' Z" fill="url(#gO)" opacity="0" style="transition:opacity .25s"/>';
  }
  sv += '</svg>'; var html = sv;
  var SZ = { 0: [86, 80], 1: [112, 70], 2: [66, 76] };
  for (k = 0; k < 9; k++){
    var it = F.WEDGE[k], a = 40 * k, rr = it === 1 ? 138 : 146, w = SZ[it][0], h = SZ[it][1], r = a * Math.PI / 180;
    var x = 216 + rr * Math.sin(r) - w / 2, y = 216 - rr * Math.cos(r) - h / 2, tilt = it === 1 ? 0 : (k % 2 ? 14 : -12);
    html += '<img src="' + (it === 2 ? 'img/plum_s.webp' : it === 0 ? 'img/melonhalf.webp' : 'img/s77.webp') + '" style="left:' + x.toFixed(1) + 'px;top:' + y.toFixed(1) + 'px;width:' + w + 'px;height:' + h + 'px;object-fit:contain;transform:rotate(' + (a + tilt) + 'deg);filter:drop-shadow(0 3px 3px #0007)" alt="">';
  }
  $('disc').innerHTML = html;
}
function setDisc(a){ $('disc').style.transform = 'rotate(' + a + 'deg)'; }

/* ─── স্টেট ─── */
var me = { uid: '', name: '', photo: '', dia: 0 }, selChip = 0, snd = true;
var cur = -1, curPhase = '', mine = [0, 0, 0], others = [0, 0, 0], botShown = [0, 0, 0], botIdx = 0, sched = [], lastMine = null, resultDone = -1, claimed = {}, pending = 0;
var USERS = [];

function pool(){
  var U = window.DEMO && window.DEMO.USERS ? Object.keys(window.DEMO.USERS).map(function(k){ var u = window.DEMO.USERS[k]; return { uid: u.uid || k, name: u.name, photo: u.photo, level: u.level }; }).filter(function(u){ return u.name; }) : [];
  if (U.length < 20) for (var i = 0; i < 40; i++) U.push({ uid: '9' + (10000 + i), name: 'Player ' + (i + 1), photo: '' });
  return U;
}
/* এই রাউন্ডের বটদের বাজির সময়সূচি (নির্দিষ্ট) */
function makeSched(idx){
  var r = rng(idx * 7919 + 17), P = USERS, n = 16 + Math.floor(r() * 10), out = [];
  for (var i = 0; i < n; i++){
    var u = P[Math.floor(r() * P.length)], q = r(), item = q < .4 ? 0 : (q < .6 ? 1 : 2), c = r(), ci = c < .5 ? 0 : (c < .82 ? 1 : (c < .96 ? 2 : 3));
    var times = 1 + Math.floor(r() * (ci === 0 ? 4 : 2));
    out.push({ t: 400 + Math.floor(r() * 8800), u: u, item: item, amt: CHIPS[ci] * times });
  }
  out.sort(function(a, b){ return a.t - b.t; }); return out;
}

/* ─── UI তৈরি ─── */
function buildUI(){
  var bx = '', X = [10, 246, 482];
  [0, 1, 2].forEach(function(i){
    bx += '<div class="box" id="bx' + i + '" style="left:' + X[i] + 'px"><div class="top" id="tt' + i + '">0</div><div class="body"></div>' +
      '<div class="hex"><img src="' + ITEMIMG[i] + '" alt=""></div><div class="mult">x' + MULT[i] + '</div><div class="mine">' + DM + '<span id="mn' + i + '">0</span></div></div>';
  });
  $('boxes').innerHTML = bx;
  var ch = '', cx = [0, 102, 198, 298], src = ['chip500', 'chip5k_b', 'chip5k_p', 'chip100k'];
  CHIPS.forEach(function(v, i){ ch += '<div class="chip' + (i === 2 ? ' rl' : '') + '" id="ch' + i + '" style="left:' + (cx[i] - 4) + 'px"><img src="img/' + src[i] + '.webp" alt=""><i>' + CL[i] + '</i></div>'; });
  $('chips').innerHTML = ch; selectChip(0);
  /* বক্সে ট্যাপ = বাজি; pointerdown এ সাথে সাথে */
  [0, 1, 2].forEach(function(i){ $('bx' + i).addEventListener('pointerdown', function(e){ e.preventDefault(); bet(i, selChip, e); }); });
  CHIPS.forEach(function(v, i){ $('ch' + i).addEventListener('pointerdown', function(){ selectChip(i); }); });
  $('repeat').addEventListener('pointerdown', repeatBets);
  $('bBack').addEventListener('pointerdown', back);
  $('bSound').addEventListener('pointerdown', function(){ snd = !snd; $('bSound').style.opacity = snd ? 1 : .45; toast(snd ? '🔊 সাউন্ড চালু' : '🔇 সাউন্ড বন্ধ'); });
  $('bMy').addEventListener('pointerdown', showMyBets);
  $('bHelp').addEventListener('pointerdown', showHow);
  $('bHist').addEventListener('pointerdown', showHistory);
  $('trophy').addEventListener('pointerdown', showRank);
  $('modal').addEventListener('pointerdown', function(e){ if (e.target === $('modal') || e.target.className === 'x') closeModal(); });
  buildDisc();
  $('trophy').insertAdjacentHTML('beforeend', '<i id="tt">00:00</i>');
}
function selectChip(i){ selChip = i; CHIPS.forEach(function(v, k){ $('ch' + k).classList.toggle('sel', k === i); }); }
function back(){ try { if (window.parent !== window) window.parent.postMessage({ type: 'GAME_CLOSE' }, '*'); else if (history.length > 1) history.back(); else location.href = '../home/index.html'; } catch(e){} }

/* ─── ছোট টুল ─── */
var tTimer;
function toast(m){ var t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tTimer); tTimer = setTimeout(function(){ t.classList.remove('on'); }, 1400); }
var AC;
function beep(f, d, v){ if (!snd) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); var o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f; o.type = 'sine'; g.gain.value = v || .06; o.connect(g); g.connect(AC.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d); o.stop(AC.currentTime + d); } catch(e){} }
function boxCenter(i){ return { x: [10, 246, 482][i] + 114, y: 804 + 90 }; }
function flyBot(b){
  var f = $('fly'), c = boxCenter(b.item), side = (b.u.uid.charCodeAt(b.u.uid.length - 1) % 2) ? 1 : -1, y0 = 790 + (Math.random() * 40 | 0);
  var el = document.createElement('div'); el.className = 'fc'; el.style.left = (c.x - 110) + 'px'; el.style.top = (c.y - 60) + 'px'; el.style.transform = 'translateY(24px) scale(.8)'; el.style.opacity = '0';
  el.innerHTML = '<img src="' + esc(b.u.photo || (window.MOI_AVATAR ? MOI_AVATAR(b.u.uid, 'f') : '')) + '" alt=""><span>' + esc((b.u.name || '').slice(0, 9)) + ' <b>+' + fmt(b.amt) + '</b></span>';
  f.appendChild(el); requestAnimationFrame(function(){ el.style.opacity = '1'; el.style.transform = 'translateY(-30px) scale(1)'; });
  setTimeout(function(){ el.style.opacity = '0'; }, 900); setTimeout(function(){ el.remove(); }, 1800);
  /* চিপ উড়ে ঘরে */
  for (var k = 0; k < 3; k++){
    var ch = document.createElement('div'); ch.className = 'fch'; var cs = ['chip500', 'chip5k_b', 'chip5k_p', 'chip100k']; ch.innerHTML = '<img src="img/' + cs[CHIPS.indexOf(b.amt) >= 0 ? CHIPS.indexOf(b.amt) : 0] + '.webp" alt="">';
    ch.style.left = (side > 0 ? 700 : -30) + 'px'; ch.style.top = (900 + k * 12) + 'px'; f.appendChild(ch);
    (function(ch, k){ setTimeout(function(){ ch.style.transform = 'translate(' + (c.x + (k - 1) * 22 - (side > 0 ? 700 : -30)) + 'px,' + (c.y - 900 - k * 12 + 10) + 'px) scale(.8)'; }, 30 + k * 90); setTimeout(function(){ ch.style.opacity = '0'; }, 650 + k * 90); setTimeout(function(){ ch.remove(); }, 1500); })(ch, k);
  }
}
function flyMine(i, amt, e){
  var c = boxCenter(i), f = $('fly'), ch = document.createElement('div'), cs = ['chip500', 'chip5k_b', 'chip5k_p', 'chip100k'];
  ch.className = 'fch'; ch.innerHTML = '<img src="img/' + cs[selChip] + '.webp" alt="">'; var sx = 330 + selChip * 100, sy = 1050;
  ch.style.left = sx + 'px'; ch.style.top = sy + 'px'; f.appendChild(ch);
  requestAnimationFrame(function(){ ch.style.transform = 'translate(' + (c.x - sx - 10) + 'px,' + (c.y - sy - 10) + 'px) scale(.85)'; });
  setTimeout(function(){ ch.style.opacity = '0'; }, 520); setTimeout(function(){ ch.remove(); }, 900);
}
function renderTotals(){
  for (var i = 0; i < 3; i++){ $('tt' + i).textContent = fmt(botShown[i] + others[i] + mine[i]); $('mn' + i).textContent = fmt(mine[i]); }
}
function showBal(){ $('balN').textContent = fmt(me.dia); }

/* ─── বাজি ─── */
function bet(i, chipIdx, e, amtOverride){
  var inf = info(); if (inf.phase !== 'BET'){ toast('⏳ এখন বাজি ধরার সময় নয়'); return; }
  var amt = amtOverride || CHIPS[chipIdx];
  if (!mine[i] && mine.filter(function(v){ return v > 0; }).length >= 2){ toast('⚠️ সর্বোচ্চ ২টা ঘরে বাজি ধরা যাবে'); beep(180, .2); return; }
  if (me.dia < amt){ toast('❌ যথেষ্ট ডায়মন্ড নেই'); beep(180, .2); return; }
  var idx = inf.idx; me.dia -= amt; mine[i] += amt; pending++; showBal(); renderTotals(); beep(660, .08); flyMine(i, amt, e);
  window.MOIEco.call('fruitBet', { idx: idx, item: i, chip: amt }).then(function(r){ pending--; if (typeof r.balance === 'number' && pending === 0) me.dia = r.balance; showBal(); })
    .catch(function(err){ pending--; if (idx === cur){ mine[i] -= amt; } me.dia += amt; showBal(); renderTotals(); toast('❌ ' + ((err && err.message) || 'বাজি হয়নি')); });
}
function repeatBets(){
  var inf = info(); if (inf.phase !== 'BET'){ toast('⏳ এখন বাজি ধরার সময় নয়'); return; }
  if (!lastMine || lastMine.every(function(v){ return !v; })){ toast('আগের রাউন্ডে বাজি ছিল না'); return; }
  var tot = lastMine.reduce(function(a, b){ return a + b; }, 0); if (me.dia < tot){ toast('❌ যথেষ্ট ডায়মন্ড নেই'); return; }
  lastMine.forEach(function(v, i){ if (v > 0) bet(i, 0, null, v); });
}

/* ─── ফলের ইতিহাস ─── */
function resultItem(idx){ return fOut(idx).strip; }
function renderStrip(idx, animate){
  var h = ''; for (var k = 1; k <= 9; k++){ h += '<img class="' + (animate && k === 1 ? 'n' : '') + '" src="' + ITEMIMG[resultItem(idx - k)] + '" alt="">'; }
  $('stripIn').innerHTML = h;
}

/* ─── রাউন্ডের ধাপ ─── */
function tick(){
  var inf = info(), idx = inf.idx;
  if (idx !== cur){
    cur = idx; $('rn').textContent = (idx % 100000);
    mine = [0, 0, 0]; others = [0, 0, 0]; botShown = [0, 0, 0]; botIdx = 0; sched = makeSched(idx); curPhase = '';
    for (var i = 0; i < 3; i++){ $('bx' + i).classList.remove('win', 'dim'); }
    for (var k = 0; k < 9; k++){ var h = $('hl' + k); if (h) h.setAttribute('opacity', 0); }
    renderStrip(idx, true); readOthers(idx); renderTotals();
  }
  /* বট বাজি — সময় অনুযায়ী */
  if (inf.phase === 'BET'){
    while (botIdx < sched.length && sched[botIdx].t <= inf.into){
      var b = sched[botIdx++]; botShown[b.item] += b.amt; if (inf.into - b.t < 1500) flyBot(b);
    }
    renderTotals();
  } else {
    while (botIdx < sched.length){ var b2 = sched[botIdx++]; botShown[b2.item] += b2.amt; } renderTotals();
  }
  /* হাব সংখ্যা */
  var hn = $('hubNum');
  if (inf.phase === 'BET'){ var s = Math.floor((F.BET - inf.into) / 1000); if (hn.textContent != s){ hn.textContent = s; if (s <= 3 && s >= 0) beep(880, .12); } } else { hn.textContent = inf.phase === 'SPIN' ? '•' : '★'; }
  if (inf.phase !== curPhase){ curPhase = inf.phase; onPhase(inf); }
  /* ট্রফির সময় = দিন শেষ হতে বাকি */
  var n = new Date(), left = (24 * 3600 - (n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds())); var el = $('tt'); if (el) el.textContent = ('0' + Math.floor(left / 3600)).slice(-2) + ':' + ('0' + Math.floor(left % 3600 / 60)).slice(-2);
}
function onPhase(inf){
  if (inf.phase === 'RES' && resultDone !== inf.idx){ resultDone = inf.idx; showResult(inf.idx); }
  if (inf.phase === 'BET'){ $('hubNum').textContent = '9'; }
}
function readOthers(idx){
  try {
    window.MOIFB.rtdb.ref(window.MOIFB.LIVE + '/fruit/rounds/R' + idx + '/bets').get().then(function(s){
      if (idx !== cur) return; var v = s.val() || {}, o = [0, 0, 0];
      Object.keys(v).forEach(function(u){ if (u === me.uid) return; var b = v[u].bets || {}; for (var i = 0; i < 3; i++) o[i] += Number(b[i]) || 0; });
      others = o; renderTotals();
    });
  } catch(e){}
}
/* চাকা ঘোরা — প্রতি ফ্রেমে সময় থেকে কোণ (মাঝপথে ঢুকলেও ঠিক) */
function frame(){
  var inf = info(), ang;
  if (inf.phase === 'BET') ang = restAng(inf.idx - 1);
  else if (inf.phase === 'SPIN'){
    var a0 = restAng(inf.idx - 1), a1 = a0 + 360 * 5 + ((restAng(inf.idx) - a0 + 720) % 360), p = Math.min(1, (inf.into - F.BET) / (F.SPIN - F.BET)), e = 1 - Math.pow(1 - p, 4);
    ang = a0 + (a1 - a0) * e;
    if (!frame.t || Date.now() - frame.t > 150){ frame.t = Date.now(); if (p < .97) beep(300 + 400 * (1 - e), .03, .025); }
  } else ang = restAng(inf.idx);
  setDisc(ang); requestAnimationFrame(frame);
}

/* ─── ফল ─── */
function showResult(idx){
  var o = fOut(idx), item = o.strip, wins3 = o.wins;
  o.hl.forEach(function(w){ var hl = $('hl' + w); if (hl) hl.setAttribute('opacity', .9); });
  for (var i = 0; i < 3; i++) $('bx' + i).classList.add(wins3.indexOf(i) >= 0 ? 'win' : 'dim');
  /* বটদের জয় */
  var sum = {}; sched.forEach(function(b){ if (wins3.indexOf(b.item) >= 0){ var k = b.u.uid; sum[k] = sum[k] || { u: b.u, bet: 0 }; sum[k].bet += b.amt; } });
  var wins = Object.keys(sum).map(function(k){ return { name: sum[k].u.name, photo: sum[k].u.photo, bet: sum[k].bet, win: sum[k].bet * MULT[wins3[0] === 1 && wins3.length > 1 ? 1 : wins3[0]] }; });
  var myBetSum = mine[0] + mine[1] + mine[2], myBets = mine.slice(), myReward = 0;
  var done = function(r){
    if (r){ myReward = r.reward; if (typeof r.balance === 'number') me.dia = r.balance; showBal(); }
    var rec = { t: Date.now(), bet: myBetSum, res: item, rev: myReward - myBetSum }; try { var L = JSON.parse(localStorage.getItem('moi_fruit_my') || '[]'); L.unshift(rec); localStorage.setItem('moi_fruit_my', JSON.stringify(L.slice(0, 40))); } catch(e){}
    if (myBetSum > 0) lastMine = myBets;
    if (myReward > 0){ beep(880, .15, .08); setTimeout(function(){ beep(1175, .25, .08); }, 150); floatWin(myReward); try { if (window.MOIBroadcast && window.MOIBroadcast.game) MOIBroadcast.game(myReward, new URLSearchParams(location.search).get('room') || ''); } catch(e){} }
    if (myReward > 0) wins.push({ name: me.name, photo: me.photo, bet: wins3.reduce(function(a, w){ return a + myBets[w]; }, 0), win: myReward, me: true });
    wins.sort(function(a, b){ return b.win - a.win; });
    setTimeout(function(){ if (info().idx === idx) showGoodLuck(wins.slice(0, 3), myBetSum, myReward); }, 1300);
  };
  if (myBetSum > 0){ window.MOIEco.call('fruitClaim', { idx: idx }).then(done).catch(function(){ myReward = wins3.reduce(function(a, w){ return a + mine[w] * MULT[w]; }, 0); done(null); }); } else done(null);
}
function floatWin(v){ var f = $('fly'), el = document.createElement('div'); el.className = 'fw'; el.style.left = '250px'; el.style.top = '930px'; el.textContent = '+' + fmt(v); f.appendChild(el); requestAnimationFrame(function(){ el.style.transform = 'translateY(-160px) scale(1.25)'; el.style.opacity = '0'; }); setTimeout(function(){ el.remove(); }, 1500); }

/* ─── প্যানেল ─── */
function openModal(title, html){ $('mbox').innerHTML = '<div class="ttl">' + title + '</div><div class="x">×</div>' + html; $('modal').classList.add('on'); }
function closeModal(){ $('modal').classList.remove('on'); }
function av(p){ return esc(p || (window.MOI_AVATAR ? MOI_AVATAR('x', 'f') : '')); }
function showGoodLuck(w, bet, rew){
  var h = '<div style="text-align:center;font:700 20px \'Figtree\',system-ui;opacity:.9">অভিনন্দন বিজয়ীদের!</div><div class="win3">';
  if (!w.length) h += '<div class="empty">এই রাউন্ডে কেউ জেতেনি</div>';
  w.forEach(function(x, i){ h += '<div class="c' + (i + 1) + '"><div class="a"><img src="' + av(x.photo) + '" alt=""></div>' + esc((x.name || '').slice(0, 10)) + '<br>বাজি: <b>' + fmt(x.bet) + '</b><br>জয়: <b>' + fmt(x.win) + '</b></div>'; });
  h += '</div><div class="mine-row"><img src="' + av(me.photo) + '" alt=""><div>' + esc(me.name) + '</div><span>বাজি: ' + fmt(bet) + '<br>জয়: <b style="color:#ffd21f">' + fmt(rew) + '</b></span></div>';
  openModal('Good Luck', h); clearTimeout(showGoodLuck.t); showGoodLuck.t = setTimeout(function(){ if ($('mbox').querySelector('.ttl') && $('mbox').querySelector('.ttl').textContent === 'Good Luck') closeModal(); }, 4200);
}
function showMyBets(){
  var L = []; try { L = JSON.parse(localStorage.getItem('moi_fruit_my') || '[]'); } catch(e){}
  var h = L.length ? '<table class="tbl"><tr><th>সময়</th><th>বাজি</th><th>ফল</th><th>লাভ/ক্ষতি</th></tr>' + L.filter(function(r){ return r.bet > 0; }).slice(0, 14).map(function(r){ var d = new Date(r.t); return '<tr><td>' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + '</td><td>' + fmt(r.bet) + '</td><td><img src="' + ITEMIMG[r.res] + '" style="height:32px" alt=""></td><td style="color:' + (r.rev >= 0 ? '#7dff9a' : '#ff8a8a') + '">' + (r.rev >= 0 ? '+' : '') + fmt(r.rev) + '</td></tr>'; }).join('') + '</table>' : '<div class="empty">এখনো কোনো বাজি নেই</div>';
  openModal('My Bets', h);
}
function showHistory(){
  var inf = info(), h = '<div class="hgrid">'; for (var k = 1; k <= 45; k++) h += '<div><img src="' + ITEMIMG[resultItem(inf.idx - k)] + '" alt=""></div>'; h += '</div>';
  openModal('Game History', h);
}
function showHow(){
  openModal('How to play', '<div class="how"><p>১. তরমুজ, জাম বা ৭৭ — যেকোনো ২টা ঘরে বাজি ধরুন (বাজি ধরার সময় ১০ সেকেন্ড)।</p><p>২. নিচ থেকে চিপ বেছে ঘরে ট্যাপ করলেই বাজি হবে। বাজির ডায়মন্ড সাথে সাথে কেটে যাবে।</p><p>৩. চাকা থামলে ওপরের ফিতা (V) যে ফলের ওপর থাকবে সেটাই জয়ী।</p><p>৪. জিতলে বাজি × গুণক ডায়মন্ড ফেরত পাবেন: তরমুজ x২, জাম x২, ৭৭ x৮।</p><p>৫. "Repeat" চাপলে আগের রাউন্ডের বাজি আবার ধরা হয়। ইতিহাসে আগের ফল দেখুন।</p></div>');
}
function showRank(){
  var n = new Date(), seed = n.getFullYear() * 400 + n.getMonth() * 31 + n.getDate(), r = rng(seed * 31 + 7), seen = {}, L = [];
  for (var t = 0; L.length < 10 && t < 100; t++){ var u = USERS[Math.floor(r() * USERS.length)]; if (seen[u.uid]) continue; seen[u.uid] = 1; L.push({ u: u, p: Math.floor(5e4 + r() * 5e6) }); }
  L.sort(function(a, b){ return b.p - a.p; });
  var h = '<table class="tbl"><tr><th>#</th><th>ইউজার</th><th>পয়েন্ট</th></tr>' + L.map(function(x, i){ return '<tr><td>' + (i + 1) + '</td><td class="l"><img src="' + av(x.u.photo) + '" alt="">' + esc((x.u.name || '').slice(0, 12)) + '</td><td>' + fmt(x.p) + ' ' + DM + '</td></tr>'; }).join('') + '</table>';
  openModal('Ranking', h);
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
    $('av').src = me.photo || (window.MOI_AVATAR ? MOI_AVATAR(me.name, 'm') : ''); $('mname').textContent = me.name; showBal();
    setInterval(function(){ var q = window.MOIAuth && MOIAuth.profile; if (q && !pending && typeof q.diamonds === 'number' && q.diamonds !== me.dia){ me.dia = q.diamonds; showBal(); } }, 600);
    setInterval(tick, 100); tick(); requestAnimationFrame(frame);
    setInterval(function(){ if (info().phase === 'BET') readOthers(cur); }, 2000);
    setTimeout(function(){ $('loading').classList.add('off'); }, 300);
  });
}
start();
setTimeout(function(){ var l = $('loading'); if (l) l.classList.add('off'); }, 8000);
})();
