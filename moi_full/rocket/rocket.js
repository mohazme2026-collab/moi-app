/* rocket/rocket.js — Rocket (ক্র্যাশ) গেম (ডেমো): রাউন্ড ও ক্র্যাশ গুণক সময় থেকেই ঠিক হয় (engine.js) */
(function(){
'use strict';
var $ = function(id){ return document.getElementById(id); };
var CANS = [500, 5000, 50000, 500000], CL = ['500', '5k', '50k', '500k'], CC = ['blue', 'yellow', 'green', 'purple'], BOTC = ['blue', 'red', 'green', 'yellow', 'purple'];
var me, USERS = [], cur = null, mine = { amt: 0, esc: 0, reward: 0 }, snd = true, auto = { on: false, val: 2.10 }, pending = 0, SH = 880, Hh = 1121, lastTotal = 0, kbuf = '';
try { var sv = JSON.parse(localStorage.getItem('moi_rk_auto') || 'null'); if (sv && sv.val) auto = sv; lastTotal = Number(localStorage.getItem('moi_rk_last')) || 0; } catch(e){}

function fmt(n){ return Math.round(n).toLocaleString('en-US'); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function rng(seed){ var s = (seed >>> 0) % 2147483647 || 1; return function(){ return (s = s * 48271 % 2147483647) / 2147483647; }; }
function mask(n){ n = String(n || 'User'); return (n.length > 4 ? n.slice(0, 4) : n.slice(0, 3)) + '**'; }
function av(p){ return esc(p || (window.MOI_AVATAR ? MOI_AVATAR('x', 'f') : '')); }
function ease(t){ t = Math.max(0, Math.min(1, t)); return 1 - Math.pow(1 - t, 3); }

/* ─── মাপ ─── */
function fit(){
  var vw = window.innerWidth, vh = window.innerHeight, k = Math.min(vw / 720, vh / 1000), cv = $('cv');
  Hh = vh / k; cv.style.height = Hh + 'px'; cv.style.transform = 'scale(' + k + ')'; cv.style.left = ((vw - 720 * k) / 2) + 'px';
  SH = Hh - 225; $('stage').style.height = SH + 'px';
  $('bSound').style.top = (Hh - 259 - 86) + 'px'; $('newb').style.top = (Hh - 259 - 30) + 'px';
  $('badge').style.top = (SH * .27) + 'px'; $('podium').style.height = '340px';
  if (cur) placeIdle();
}
window.addEventListener('resize', fit);

/* ─── টুল ─── */
var tTimer;
function toast(m){ var t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tTimer); tTimer = setTimeout(function(){ t.classList.remove('on'); }, 1500); }
var AC;
function beep(f, d, v, type){ if (!snd) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); var o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f; o.type = type || 'sine'; g.gain.value = v || .06; o.connect(g); g.connect(AC.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d); o.stop(AC.currentTime + d); } catch(e){} }
function openModal(title, html){ $('mbox').innerHTML = '<div class="ttl">' + title + '</div><div class="x">×</div>' + html; $('modal').classList.add('on'); }
function closeModal(){ $('modal').classList.remove('on'); }
function back(){ try { if (window.parent !== window) window.parent.postMessage({ type: 'GAME_CLOSE' }, '*'); else if (history.length > 1) history.back(); else location.href = '../home/index.html'; } catch(e){} }
function pool(){
  var U = window.DEMO && window.DEMO.USERS ? Object.keys(window.DEMO.USERS).map(function(k){ var u = window.DEMO.USERS[k]; return { uid: u.uid || k, name: u.name, photo: u.photo }; }).filter(function(u){ return u.name; }) : [];
  if (U.length < 20) for (var i = 0; i < 40; i++) U.push({ uid: '9' + (10000 + i), name: 'Player ' + (i + 1), photo: '' });
  return U;
}

/* ─── বট সময়সূচি (প্রতি রাউন্ডে নির্দিষ্ট) ─── */
var schedC = {};
function sched(s){
  if (schedC[s.idx]) return schedC[s.idx];
  var r = rng(s.idx * 7919 + 17), n = 14 + Math.floor(r() * 9), out = [], AM = [500, 500, 1000, 1000, 2000, 5000, 5000, 10000, 15000, 25000, 50000, 100000, 250000], used = {};
  for (var i = 0; i < n; i++){
    var u = USERS[Math.floor(r() * USERS.length)]; if (used[u.uid]) continue; used[u.uid] = 1;
    var amt = AM[Math.floor(Math.pow(r(), 1.3) * AM.length)], e = 0, q = r(), hi = Math.min(s.crash * .97, 9);
    if (s.crash >= 1.2 && q < .64 && hi > 1.12) e = Math.round((1.1 + r() * (hi - 1.1)) * 100) / 100;
    if (e >= s.crash) e = 0;
    out.push({ t: 300 + Math.floor(r() * 10800), u: u, amt: amt, esc: e, c: BOTC[Math.floor(r() * 5)] });
  }
  var keys = Object.keys(schedC); if (keys.length > 6) delete schedC[keys[0]];
  return (schedC[s.idx] = out);
}

/* ─── রাউন্ড শুরু/রিসেট ─── */
function keyOf(s){ return s.idle ? 'i' + s.next : 'r' + s.idx; }
var joined = 0, lastList = 0, boomDone = false, podDone = false, settled = false, tickN = -1;
function placeIdle(){ var rk = $('rk'); rk.src = 'img/rk_stand.webp'; rk.style.width = '112px'; rk.style.left = '304px'; rk.style.top = (SH - 350) + 'px'; }
function newRound(s){
  cur = { s: s, key: keyOf(s), bots: s.idle ? [] : sched(s) };
  joined = 0; boomDone = false; podDone = false; settled = false; tickN = -1;
  mine = { amt: 0, esc: 0, reward: 0 };
  $('fly').innerHTML = ''; $('list').innerHTML = ''; $('boom').className = ''; $('podium').style.display = 'none'; $('join').style.display = 'none'; $('badge').style.display = 'none';
  $('rk').style.display = 'block'; $('rk').style.opacity = 1; placeIdle(); $('bgw').style.transition = 'none'; $('bgw').style.transform = 'translateY(0)';
  $('rn').textContent = s.idle ? '—' : (s.idx % 100000); $('fsum').textContent = '0'; fbarMode('bet');
  if (!s.idle){
    var idx = s.idx;
    try { MOIFB.rtdb.ref(MOIFB.LIVE + '/rocket/rounds/R' + idx + '/bets/' + me.uid).get().then(function(sn){ var v = sn.val(); if (v && cur && cur.s.idx === idx && !pending){ mine.amt = v.amt || 0; mine.esc = v.esc || 0; mine.reward = v.reward || 0; $('fsum').textContent = fmt(mine.amt); } }); } catch(e){}
  }
  renderHist();
}

/* ─── ফুয়েল বার মোড ─── */
var fmode = '';
function fbarMode(m){
  if (fmode === m) return; fmode = m;
  $('f_bet').style.display = m === 'bet' ? 'flex' : 'none';
  $('f_esc').style.cssText = m === 'esc' || m === 'done' ? 'display:flex!important' : '';
  $('f_esc').classList.toggle('done', m === 'done');
  $('f_wait').style.cssText = m === 'wait' ? 'display:flex!important' : '';
}

/* ─── বাজি ─── */
function bet(amt){
  var now = Date.now(), s = cur && cur.s; if (!s || s.idle || now >= s.flyStart - 250){ toast('⏳ এখন বাজি ধরার সময় নয়'); return; }
  if (me.dia < amt){ toast('💎 ডায়মন্ড কম'); beep(180, .2); return; }
  var idx = s.idx; me.dia -= amt; mine.amt += amt; pending++; showBal(); $('fsum').textContent = fmt(mine.amt); beep(620, .07, .06);
  window.MOIEco.call('rocketBet', { idx: idx, amt: amt }).then(function(r){ pending--; if (typeof r.balance === 'number' && pending === 0) me.dia = r.balance; showBal(); })
    .catch(function(e){ pending--; if (cur && cur.s.idx === idx){ me.dia += amt; mine.amt -= amt; $('fsum').textContent = fmt(mine.amt); } showBal(); toast((e && e.message || '').indexOf('INSUFFICIENT') >= 0 ? '💎 ডায়মন্ড কম' : '⚠️ বাজি হয়নি'); });
}
function showBal(){ $('balN').textContent = fmt(me.dia); }
function doEscape(at){
  var s = cur && cur.s; if (!s || s.idle || mine.amt <= 0 || mine.esc || mine.sending) return;
  var t = Date.now() - s.flyStart, m = Math.min(s.crash, Math.floor(rkMult(t) * 100) / 100); if (t < 0 || Date.now() >= s.crashAt) return;
  mine.sending = true; var idx = s.idx, mm = at || m; mine.esc = mm; mine.reward = Math.floor(mine.amt * mm); beep(900, .12, .08);
  window.MOIEco.call('rocketEscape', at ? { idx: idx, at: at } : { idx: idx }).then(function(r){
    mine.sending = false; if (!cur || cur.s.idx !== idx) return; mine.esc = r.mult; mine.reward = r.reward || mine.reward; if (typeof r.balance === 'number'){ me.dia = r.balance; showBal(); }
    if (mine.reward >= 100000){ try { if (window.MOIBroadcast && MOIBroadcast.game) MOIBroadcast.game(mine.reward, new URLSearchParams(location.search).get('room') || ''); } catch(e){} }
  }).catch(function(){ mine.sending = false; if (cur && cur.s.idx === idx){ mine.esc = 0; mine.reward = 0; mine.lost = true; } toast('💥 রকেট ফেটে গেছে'); });
}
function repeat(){ if (!lastTotal){ toast('আগের কোনো বাজি নেই'); return; } if (mine.amt > 0){ toast('এই রাউন্ডে বাজি ধরা আছে'); return; } bet(lastTotal); }

/* ─── বট রকেট উড়ে আসা ─── */
function flyBot(b){
  var f = $('fly'), el = document.createElement('div'), y0 = SH - 130 - Math.floor(Math.random() * 150), tx = 305 + Math.floor(Math.random() * 40) - 20, ty = SH - 330;
  el.className = 'br'; el.style.left = '0px'; el.style.top = '0px'; el.style.transform = 'translate(-90px,' + y0 + 'px)';
  el.innerHTML = '<img src="img/bot_' + b.c + '.webp" alt=""><span>' + esc(mask(b.u.name)) + ' ' + fmt(b.amt) + '</span>';
  f.appendChild(el); requestAnimationFrame(function(){ requestAnimationFrame(function(){ el.style.transition = 'transform 1.2s cubic-bezier(.3,.6,.3,1),opacity .35s ease 1.0s'; el.style.transform = 'translate(' + tx + 'px,' + ty + 'px)'; el.style.opacity = '0'; }); });
  setTimeout(function(){ el.remove(); }, 1700);
}

/* ─── তালিকা (বাঁয়ে) ─── */
function renderList(m, phase, into){
  var rows = [];
  cur.bots.forEach(function(b){ if (phase !== 'BET' || b.t <= into) rows.push({ n: mask(b.u.name), a: b.amt, e: b.esc, me: 0 }); });
  if (mine.amt > 0) rows.push({ n: mask(me.name), a: mine.amt, e: mine.esc, me: 1 });
  rows.sort(function(x, y){ return y.a - x.a; });
  var h = '';
  rows.slice(0, 9).forEach(function(r){
    var out = (phase === 'FLY' || phase === 'RES') && r.e && (phase === 'RES' || m >= r.e), lost = phase === 'RES' && !r.e;
    h += '<div class="' + (r.me ? 'me ' : '') + (out ? 'out ' : '') + (lost ? 'lost' : '') + '"><u>' + esc(r.n) + '</u><b>' + (out ? 'x' + r.e.toFixed(2) : fmt(r.a)) + '</b></div>';
  });
  if (cur.lh !== h){ cur.lh = h; $('list').innerHTML = h; }
}

/* ─── অক্ষ (ডানে) ─── */
function renderAxis(m){
  var hi = Math.max(2, m * 1.12), lo = 1 + (hi - 1) * .2, h = '', ys = Math.min(108, (SH - 200 - 240) / 4);
  for (var i = 0; i < 5; i++){ var v = lo + (hi - lo) * (4 - i) / 4; h += '<i style="top:' + (190 + i * ys) + 'px">' + (hi < 10 ? v.toFixed(1) : Math.round(v)) + 'x</i>'; }
  var key = Math.round(hi * 20); if (cur.ak !== key){ cur.ak = key; $('axis').innerHTML = h; }
}

/* ─── ইতিহাস ─── */
function results(n){
  var now = Date.now(), out = [], bi = Math.floor(now / RK.BLK);
  for (var b = bi; b > bi - 3 && out.length < n; b--){ var L = rkBlk(b); for (var i = L.length - 1; i >= 0 && out.length < n; i--) if (L[i].crashAt <= now) out.push(L[i]); }
  return out;
}
function cls(c){ return c >= 10 ? 'p' : c >= 2 ? 'g' : ''; }
function renderHist(){ var R = results(6); $('hrow').innerHTML = R.map(function(r){ return '<i class="' + cls(r.crash) + '">' + r.crash.toFixed(2) + '</i>'; }).join(''); }

/* ─── মঞ্চ (শেষে) ─── */
function podium(s){
  var E = cur.bots.filter(function(b){ return b.esc > 0; }).map(function(b){ return { n: mask(b.u.name), m: b.esc }; });
  if (mine.esc) E.push({ n: mask(me.name), m: mine.esc });
  E.sort(function(a, b){ return b.m - a.m; }); E = E.slice(0, 3);
  var slots = [{ cx: 190, pod: 'pod2', w: 220, ph: 121, i: 1 }, { cx: 360, pod: 'pod1', w: 230, ph: 144, i: 0 }, { cx: 530, pod: 'pod3', w: 220, ph: 114, i: 2 }], h = '';
  slots.forEach(function(sl){
    var e = E[sl.i], hero = sl.i === 0 && e;
    h += '<img class="pd" src="img/' + sl.pod + '.webp" style="left:' + (sl.cx - sl.w / 2) + 'px;width:' + sl.w + 'px" alt="">';
    h += '<div class="as' + (hero ? ' h' : '') + '" style="left:' + sl.cx + 'px;bottom:' + (90 + sl.ph + 2) + 'px"><div class="gl"></div><img src="img/' + (hero ? 'astro_hero' : 'astro') + '.webp" style="width:' + (hero ? 120 : 100) + 'px" alt=""><b>' + (e ? e.m.toFixed(2) + 'x' : '') + '</b><span>' + (e ? esc(e.n) : 'vacancy') + '</span></div>';
  });
  var p = $('podium'); p.innerHTML = h; p.style.display = 'block'; if (E.length) beep(1040, .2, .06);
}

/* ─── মূল ফ্রেম ─── */
function frame(){
  requestAnimationFrame(frame);
  var now = Date.now(), s = rkAt(now); if (!cur || cur.key !== keyOf(s)) newRound(s);
  var ph = rkPhase(s, now), rk = $('rk');
  if (ph === 'IDLE'){
    var left = Math.ceil((s.next - now) / 1000); $('cd').style.display = 'block'; $('cdn').textContent = left + 's'; $('cdt').textContent = 'count down'; fbarMode('wait'); $('waitT').textContent = 'wait for next round'; return;
  }
  var into = now - s.start, t = now - s.flyStart, m = 1;
  if (ph === 'BET'){
    var left2 = Math.ceil((s.flyStart - now) / 1000); $('cd').style.display = 'block'; $('cdn').textContent = left2 + 's'; $('cdt').textContent = 'count down'; $('badge').style.display = 'none';
    if (left2 !== tickN){ tickN = left2; if (left2 <= 3 && left2 > 0) beep(520 + (3 - left2) * 120, .1, .05); }
    for (; joined < cur.bots.length; joined++){ var bb = cur.bots[joined]; if (bb.t > into) break; flyBot(bb); }
    $('fsum').textContent = fmt(mine.amt); fbarMode('bet');
    if (now - lastList > 250){ lastList = now; renderList(1, 'BET', into); }
    renderAxis(1);
  } else if (ph === 'FLY'){
    m = Math.min(s.crash, Math.floor(rkMult(t) * 100) / 100); $('cd').style.display = 'none'; $('badge').style.display = 'block'; $('mx').textContent = m.toFixed(2) + 'x';
    $('bgw').style.transform = 'translateY(' + (250 * ease(t / 3500)).toFixed(1) + 'px)';
    var e = ease(t / 1800), idleTop = SH - 350, tgtTop = SH * .50, tgtL = 235, wob = Math.min(1, t / 2000);
    rk.style.width = t > 300 ? '120px' : '112px'; if (t > 300 && rk.dataset.f !== '1'){ rk.src = 'img/rk_fly.webp'; rk.dataset.f = '1'; }
    rk.style.left = (304 + (tgtL - 304) * e + Math.sin(t / 650) * 9 * wob) + 'px'; rk.style.top = (idleTop + (tgtTop - idleTop) * e + Math.cos(t / 520) * 7 * wob) + 'px';
    if (mine.amt > 0 && !mine.esc && !mine.lost){
      fbarMode('esc'); $('escT').textContent = 'ESCAPE'; $('escV').textContent = '💎 ' + fmt(mine.amt * m);
      if (auto.on && auto.val <= m && auto.val <= s.crash) doEscape(auto.val);
    } else if (mine.esc){ fbarMode('done'); $('escT').textContent = 'ESCAPED  x' + Number(mine.esc).toFixed(2); $('escV').textContent = '+ 💎 ' + fmt(mine.reward || mine.amt * mine.esc); }
    else { fbarMode('wait'); $('waitT').textContent = 'wait for next round'; }
    if (now - lastList > 250){ lastList = now; renderList(m, 'FLY', into); }
    renderAxis(m);
  } else {
    m = s.crash; $('cd').style.display = 'none'; $('badge').style.display = 'block'; $('mx').textContent = m.toFixed(2) + 'x'; renderAxis(m);
    var r = now - s.crashAt;
    if (!boomDone){
      boomDone = true; var b2 = $('boom'), rx = parseFloat(rk.style.left) || 300, ry = parseFloat(rk.style.top) || (SH - 350);
      if (s.fl <= 800){ rx = 304; ry = SH - 350; }
      b2.style.left = (rx + 56 - 150) + 'px'; b2.style.top = (ry + 70 - 150) + 'px'; b2.className = 'on'; rk.style.display = 'none'; rk.dataset.f = ''; beep(110, .5, .12, 'sawtooth'); beep(70, .6, .1, 'square');
      renderHist();
    }
    if (!podDone && r > 900){ podDone = true; podium(s); }
    if (!settled){
      settled = true;
      if (mine.amt > 0){
        lastTotal = mine.amt; try { localStorage.setItem('moi_rk_last', String(lastTotal)); } catch(e){}
        setTimeout(function(){ rec({ t: Date.now(), r: s.idx % 100000, bet: mine.amt, m: mine.esc || 0, win: mine.esc ? mine.reward : 0 }); }, 800);
        if (mine.esc){ beep(880, .15, .08); setTimeout(function(){ beep(1175, .25, .08); }, 150); }
      }
    }
    if (mine.amt > 0 && !mine.esc){ fbarMode('wait'); $('waitT').textContent = '💥 Crashed  -' + fmt(mine.amt); }
    else if (mine.esc){ fbarMode('done'); }
    else { fbarMode('wait'); $('waitT').textContent = 'wait for next round'; }
    $('join').style.display = (s.end - now < 2200) ? 'block' : 'none';
    if (now - lastList > 250){ lastList = now; renderList(m, 'RES', into); }
  }
}
function rec(r){ var L = []; try { L = JSON.parse(localStorage.getItem('moi_rk_rec') || '[]'); } catch(e){} L.unshift(r); L = L.slice(0, 30); try { localStorage.setItem('moi_rk_rec', JSON.stringify(L)); } catch(e){} }

/* ─── প্যানেল ─── */
function showRec(){
  var L = []; try { L = JSON.parse(localStorage.getItem('moi_rk_rec') || '[]'); } catch(e){}
  var h = L.length ? '<table><tr><th>Round</th><th>Bet</th><th>x</th><th>Win/Lose</th></tr>' + L.map(function(r){ var d = r.win - r.bet; return '<tr><td>' + r.r + '</td><td>' + fmt(r.bet) + '</td><td>' + (r.m ? Number(r.m).toFixed(2) + 'x' : '—') + '</td><td class="' + (d >= 0 ? 'up' : 'dn') + '">' + (d >= 0 ? '+' : '') + fmt(d) + '</td></tr>'; }).join('') + '</table>' : '<p style="text-align:center">এখনো কোনো বাজি নেই</p>';
  openModal('My Records', h);
}
function showAll(){ var R = results(40); openModal('History', '<div class="gr">' + R.map(function(r){ return '<i class="' + cls(r.crash) + '">' + r.crash.toFixed(2) + '</i>'; }).join('') + '</div>'); }
function showHelp(){ openModal('How to play', '<p>১. ১৪ সেকেন্ডের countdown এ নিচের ফুয়েল ক্যানে ট্যাপ করে বাজি (ফুয়েল) ধরুন। ৫০০ / 5k / 50k / 500k — যতবার ট্যাপ ততো বাজি বাড়বে।</p><p>২. রকেট উড়তে শুরু করলে গুণক (x) বাড়তে থাকে। যেকোনো সময় রকেট ফেটে যেতে পারে!</p><p>৩. ফাটার আগে <b>ESCAPE</b> চাপলে ওই মুহূর্তের গুণক × বাজি ডায়মন্ড পাবেন। না চাপলে বা ফাটার পরে চাপলে বাজি হারাবেন।</p><p>৪. <b>auto esc</b>: গুণকের ঘর ট্যাপ করে সংখ্যা লিখুন (যেমন 2.10) — রকেট ওই গুণকে পৌঁছালে নিজে নিজে escape হবে।</p><p>৫. <b>AUTO SPEND</b> চাপলে আগের রাউন্ডের বাজি আবার ধরা হয়।</p><p>৬. কেউ আগে নেমে গেলে নাম আর গুণক (x) তালিকায় দেখায়। সেরা ৩ জন মঞ্চে ওঠে।</p>'); }
function showRank(){
  var n = new Date(), seed = n.getFullYear() * 400 + n.getMonth() * 31 + n.getDate(), r = rng(seed * 31 + 7), seen = {}, L = [];
  for (var t = 0; L.length < 10 && t < 100; t++){ var u = USERS[Math.floor(r() * USERS.length)]; if (seen[u.uid]) continue; seen[u.uid] = 1; L.push({ u: u, p: Math.floor(5e4 + r() * 5e6) }); }
  L.sort(function(a, b){ return b.p - a.p; });
  openModal('Ranking', '<table><tr><th>#</th><th>ইউজার</th><th>Win</th></tr>' + L.map(function(x, i){ return '<tr><td>' + (i + 1) + '</td><td><img src="' + av(x.u.photo) + '" alt="">' + esc((x.u.name || '').slice(0, 12)) + '</td><td>💎 ' + fmt(x.p) + '</td></tr>'; }).join('') + '</table>');
}
function showPlayers(){
  var s = cur && cur.s; if (!s || s.idle){ toast('এখন রাউন্ড চলছে না'); return; }
  var into = Date.now() - s.start, rows = cur.bots.filter(function(b){ return b.t <= into; }).map(function(b){ return { n: b.u.name, p: b.u.photo, a: b.amt }; });
  if (mine.amt) rows.push({ n: me.name, p: me.photo, a: mine.amt });
  rows.sort(function(a, b){ return b.a - a.a; });
  openModal('Players (' + rows.length + ')', '<table><tr><th>#</th><th>ইউজার</th><th>Bet</th></tr>' + rows.slice(0, 40).map(function(x, i){ return '<tr><td>' + (i + 1) + '</td><td><img src="' + av(x.p) + '" alt="">' + esc(String(x.n || '').slice(0, 12)) + '</td><td>💎 ' + fmt(x.a) + '</td></tr>'; }).join('') + '</table>');
}

/* ─── escape কীবোর্ড ─── */
function kpShow(){ kbuf = ''; $('kin').textContent = 'Enter an escape point:'; $('kin').classList.remove('v'); $('kp').classList.add('on'); }
function kpKey(k){
  if (k === 'del') kbuf = kbuf.slice(0, -1);
  else if (k === 'max') kbuf = '100.00'; else if (k === 'min') kbuf = '1.01';
  else if (k === 'ok'){
    var v = parseFloat(kbuf);
    if (!(v >= 1.01 && v <= 100)){ toast('1.01 থেকে 100.00 এর মধ্যে লিখুন'); return; }
    auto.val = Math.round(v * 100) / 100; auto.on = true; saveAuto(); $('kp').classList.remove('on'); return;
  } else if (k === '.'){ if (kbuf.indexOf('.') < 0) kbuf += kbuf ? '.' : '0.'; }
  else if (kbuf.length < 6){ if (kbuf.indexOf('.') >= 0 && kbuf.split('.')[1].length >= 2) return; kbuf += k; }
  $('kin').textContent = kbuf || 'Enter an escape point:'; $('kin').classList.toggle('v', !!kbuf);
}
function saveAuto(){ $('av2').textContent = auto.val.toFixed(2) + 'x'; $('tg').classList.toggle('on', auto.on); try { localStorage.setItem('moi_rk_auto', JSON.stringify(auto)); } catch(e){} }

/* ─── UI তৈরি ─── */
function buildUI(){
  var h = '', cx = [120, 212, 302, 395];
  CANS.forEach(function(v, i){ h += '<div class="can" id="cn' + i + '" style="left:' + (cx[i] - 31) + 'px"><img src="img/can_' + CC[i] + '.webp" alt=""><i>' + CL[i] + '</i></div>'; });
  $('cans').innerHTML = h;
  CANS.forEach(function(v, i){ $('cn' + i).addEventListener('pointerdown', function(e){ e.preventDefault(); bet(v); }); });
  var K = ['1', '2', '3', 'ok', '4', '5', '6', '7', '8', '9', 'max', '.', '0', 'del', 'min'], kh = '';
  K.forEach(function(k){ if (k === 'ok') kh += '<b class="ok" data-k="ok">OK</b>'; else kh += '<b class="' + (k === 'max' || k === 'min' ? 'fn' : '') + '" data-k="' + k + '">' + (k === 'del' ? '⌫' : k) + '</b>'; });
  $('kg').innerHTML = kh;
  $('kg').addEventListener('pointerdown', function(e){ var b = e.target.closest('[data-k]'); if (b) kpKey(b.dataset.k); });
  $('kp').addEventListener('pointerdown', function(e){ if (e.target === $('kp') || e.target.className === 'kx') $('kp').classList.remove('on'); });
  $('f_esc').addEventListener('pointerdown', function(e){ e.preventDefault(); if (mine.amt > 0 && !mine.esc) doEscape(0); });
  $('auto').addEventListener('pointerdown', repeat);
  $('tg').addEventListener('pointerdown', function(){ if (auto.on){ auto.on = false; saveAuto(); } else kpShow(); });
  $('av2').addEventListener('pointerdown', kpShow);
  $('bBack').addEventListener('pointerdown', back);
  $('bSound').addEventListener('pointerdown', function(){ snd = !snd; $('bSound').style.opacity = snd ? 1 : .45; toast(snd ? '🔊 সাউন্ড চালু' : '🔇 সাউন্ড বন্ধ'); });
  $('bRec').addEventListener('pointerdown', showRec); $('bHelp').addEventListener('pointerdown', showHelp); $('trophy').addEventListener('pointerdown', showRank);
  $('hall').addEventListener('pointerdown', showAll); $('fplus').addEventListener('pointerdown', showPlayers); $('balP').addEventListener('pointerdown', function(){ toast('💎 ডেমো ডায়মন্ড'); });
  $('modal').addEventListener('pointerdown', function(e){ if (e.target === $('modal') || e.target.className === 'x') closeModal(); });
  saveAuto();
}
var pingV = 80;
function pingTick(){
  var t0 = performance.now(), el = $('ping'), ok = false;
  function fin(){ if (!ok || pingV > 900) pingV = Math.max(25, Math.min(180, pingV + Math.round((Math.random() - .5) * 24))); if (el) el.textContent = pingV + 'ms'; }
  try { fetch('../sw.js?p=' + Date.now(), { method: 'HEAD', cache: 'no-store' }).then(function(){ ok = true; pingV = Math.round(performance.now() - t0); }).catch(function(){}).then(fin); } catch(e){ fin(); }
}
function trophyTick(){ var n = new Date(), left = 24 * 3600 - (n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds()); $('tt').textContent = ('0' + Math.floor(left / 3600)).slice(-2) + ':' + ('0' + Math.floor(left % 3600 / 60)).slice(-2); }

/* ─── চালু ─── */
function start(){
  Promise.resolve(window.MOIReady).then(function(){
    var p = window.MOIAuth && MOIAuth.profile; if (!p || !p.uid){ $('loading').innerHTML = '<div style="color:#fff;font:800 28px system-ui">ভয়েস ক্লাব থেকে খুলুন</div>'; setTimeout(back, 1800); return; }
    me = { uid: p.uid, name: p.name || 'User', photo: p.photo || '', dia: p.diamonds || 0 };
    USERS = pool(); buildUI(); fit(); pingTick(); setInterval(pingTick, 3000); trophyTick(); setInterval(trophyTick, 30000); showBal();
    setInterval(function(){ var q = window.MOIAuth && MOIAuth.profile; if (q && !pending && typeof q.diamonds === 'number' && q.diamonds !== me.dia){ me.dia = q.diamonds; showBal(); } }, 600);
    requestAnimationFrame(frame);
    setTimeout(function(){ $('loading').classList.add('off'); }, 300);
  });
}
fit(); start();
setTimeout(function(){ var l = $('loading'); if (l) l.classList.add('off'); }, 8000);
window.__rk = { get cur(){ return cur; }, get mine(){ return mine; }, bet: bet, doEscape: doEscape };
})();
