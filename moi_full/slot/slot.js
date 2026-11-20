/* slot/slot.js — Teen Patti Slot (৫ রিল × ৩ সারি, ডেমো): ফলাফল economy.js এর H.slotSpin থেকে আসে */
(function(){
'use strict';
var $ = function(id){ return document.getElementById(id); };
var NAMES = ['joker', 'as', 'k', 'q', 'j', 't10', 'n9', 'ah'], CH = 155, N = 10, SPEED = 16, CX = [57, 180, 303, 426, 549];
var BETS = (function(){ var a = [], b; for (b = 100; b <= 1000; b += 100) a.push(b); for (b = 1500; b <= 10000; b += 500) a.push(b); return a; })();
var me, bi = 0, spinning = false, auto = false, reels = [], grid = null, lastGrid = null, snd = true, pingV = 80, tTimer;

function fmt(n){ return Math.round(n).toLocaleString('en-US'); }
function rnd(n){ return Math.floor(Math.random() * n); }
function img(i, cls){ return '<div class="c"><img' + (cls ? ' class="' + cls + '"' : '') + ' src="img/c_' + NAMES[i] + '.webp" alt=""></div>'; }
function toast(m){ var t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tTimer); tTimer = setTimeout(function(){ t.classList.remove('on'); }, 1500); }
var AC;
function beep(f, d, v, type){ if (!snd) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); var o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f; o.type = type || 'sine'; g.gain.value = v || .06; o.connect(g); g.connect(AC.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d); o.stop(AC.currentTime + d); } catch(e){} }
function back(){ try { if (window.parent !== window) window.parent.postMessage({ type: 'GAME_CLOSE' }, '*'); else if (history.length > 1) history.back(); else location.href = '../home/index.html'; } catch(e){} }

function fit(){
  var vw = window.innerWidth, vh = window.innerHeight, k = Math.min(vw / 720, vh / 1280), cv = $('cv');
  cv.style.transform = 'scale(' + k + ')'; cv.style.left = ((vw - 720 * k) / 2) + 'px'; cv.style.top = ((vh - 1280 * k) / 2) + 'px';
}
window.addEventListener('resize', fit);

/* ─── রিল ─── */
function randStrip(){ var a = []; for (var i = 0; i < N; i++) a.push(rnd(8)); return a.concat(a.slice(0, 3)); }
function buildReels(){
  var h = '';
  for (var c = 0; c < 5; c++){
    var col = lastGrid ? lastGrid[c] : [rnd(8), rnd(8), rnd(8)];
    h += '<div class="reel" style="left:' + (CX[c] - 57) + 'px"><div class="strip">' + col.map(function(i){ return img(i); }).join('') + '</div></div>';
  }
  $('reels').innerHTML = h;
  reels = [].slice.call($('reels').querySelectorAll('.strip')).map(function(el){ return { el: el, on: false, t0: 0 }; });
}
function frame(){
  var now = performance.now();
  for (var c = 0; c < 5; c++){ var r = reels[c]; if (r && r.on){ var off = ((now - r.t0) / 1000 * SPEED) % N; r.el.style.transform = 'translateY(' + (-(N - off) * CH) + 'px)'; } }
  requestAnimationFrame(frame);
}
function startReel(c){
  var r = reels[c], a = randStrip(); r.el.innerHTML = a.map(function(i){ return img(i); }).join(''); r.t0 = performance.now(); r.on = true;
}
function stopReel(c){
  var r = reels[c], col = grid[c], f = [rnd(8), rnd(8), rnd(8), rnd(8)];
  r.on = false; r.el.innerHTML = col.concat(f).map(function(i){ return img(i); }).join('');
  r.el.style.transform = 'translateY(0)';
  try { r.el.animate([{ transform: 'translateY(' + (-4 * CH) + 'px)' }, { transform: 'translateY(0)' }], { duration: 420, easing: 'cubic-bezier(.2,1.25,.4,1)' }); } catch(e){}
  beep(260 + c * 40, .12, .07, 'triangle');
}

/* ─── বাজি ─── */
function showBal(){ $('balN').textContent = fmt(me.dia); }
function showBet(){ $('costN').textContent = fmt(BETS[bi]); $('bMinus').classList.toggle('dis', spinning || bi === 0); $('bPlus').classList.toggle('dis', spinning || bi === BETS.length - 1); }
function chg(d){ if (spinning) return; var n = bi + d; if (n < 0 || n >= BETS.length) return; bi = n; showBet(); beep(520 + bi * 12, .06, .05); }

/* ─── স্পিন ─── */
function spin(){
  if (spinning) return;
  var bet = BETS[bi]; if (me.dia < bet){ toast('💎 ডায়মন্ড কম'); beep(180, .2); auto = false; $('bBolt').classList.remove('on'); return; }
  spinning = true; grid = null; $('bSpin').classList.add('dis'); showBet(); $('winN').textContent = '0'; $('winp').classList.remove('on');
  me.dia -= bet; showBal(); beep(400, .1, .06);
  var t0 = performance.now(), res = null, fail = false, waiters = [];
  for (var c = 0; c < 5; c++) startReel(c);
  window.MOIEco.call('slotSpin', { bet: bet }).then(function(r){ res = r; grid = r.grid; waiters.splice(0).forEach(function(f){ f(); }); })
    .catch(function(e){ fail = true; waiters.splice(0).forEach(function(f){ f(); }); });
  function whenReady(f){ if (res || fail) f(); else waiters.push(f); }
  function done(){
    if (fail || !res){
      for (var c = 0; c < 5; c++) reels[c].on = false;
      me.dia += bet; showBal(); spinning = false; $('bSpin').classList.remove('dis'); showBet(); auto = false; $('bBolt').classList.remove('on');
      toast('⚠️ স্পিন হয়নি'); return;
    }
    lastGrid = res.grid; finish(res, bet);
  }
  [0, 1, 2, 3, 4].forEach(function(c){
    var at = (c + 1) * 2000 - (performance.now() - t0);
    setTimeout(function(){ whenReady(function(){ if (fail){ if (c === 4) done(); return; } stopReel(c); if (c === 4) setTimeout(done, 450); }); }, Math.max(0, at));
  });
}
function finish(r, bet){
  var win = r.win || 0;
  if (r.k){
    var cols = $('reels').querySelectorAll('.reel');
    for (var c = 0; c < 5; c++){ var im = cols[c].querySelectorAll('.c img'); for (var j = 1; j < 2; j++) if (r.grid[c][1] === r.card) im[1].classList.add('w'); }
    beep(660, .15, .08); setTimeout(function(){ beep(880, .15, .08); }, 150); setTimeout(function(){ beep(1100, .25, .08); }, 300);
    $('winp').classList.add('on'); countUp(win);
    setTimeout(function(){ me.dia = r.balance; showBal(); popup(r, win); }, 1300);
    if (win >= 100000){ try { if (window.MOIBroadcast && MOIBroadcast.game) MOIBroadcast.game(win, new URLSearchParams(location.search).get('room') || ''); } catch(e){} }
  } else { me.dia = r.balance; showBal(); end(); }
}
function end(){
  [].forEach.call($('reels').querySelectorAll('img.w'), function(i){ i.classList.remove('w'); });
  $('winp').classList.remove('on'); spinning = false; $('bSpin').classList.remove('dis'); showBet();
  if (auto) setTimeout(function(){ if (auto && !spinning) spin(); }, 900);
}
function countUp(v){
  var t0 = performance.now(), D = 1100;
  (function s(){ var p = Math.min(1, (performance.now() - t0) / D); $('winN').textContent = fmt(v * p); if (p < 1) requestAnimationFrame(s); })();
}
function popup(r, win){
  var h = ''; for (var i = 0; i < r.k; i++) h += '<img src="img/c_' + NAMES[r.card] + '.webp" alt="">';
  $('pcards').innerHTML = h; $('pv').textContent = fmt(win); $('pop').classList.add('on');
  var closed = false; function cl(){ if (closed) return; closed = true; $('pop').classList.remove('on'); end(); }
  $('pop').onclick = cl; setTimeout(cl, 2800);
}

/* ─── সাহায্য ─── */
function help(){
  var h = '<div class="ttl">Teen Patti Slot</div><div class="x">×</div>'
    + '<div>শুধু <b>মাঝের সারিতে</b> একই তাস যতগুলো পড়বে (পরপর না হলেও):</div>'
    + '<div class="rw"><b>×3</b> ৩টা একই তাস</div><div class="rw"><b>×4</b> ৪টা একই তাস</div><div class="rw"><b>×5</b> ৫টা একই তাস</div>'
    + '<div>সব তাসের দাম সমান। জিত = বাজি × গুণক।</div><div class="cg">' + NAMES.map(function(n){ return '<img src="img/c_' + n + '.webp" alt="">'; }).join('') + '</div>';
  $('mbox').innerHTML = h; $('modal').classList.add('on');
}

/* ─── অন্যান্য ─── */
function pingTick(){
  var t0 = performance.now(), el = $('ping'), ok = false;
  function fin(){ if (!ok || pingV > 900) pingV = Math.max(25, Math.min(180, pingV + Math.round((Math.random() - .5) * 24))); if (el) el.textContent = pingV + 'ms'; }
  try { fetch('../sw.js?p=' + Date.now(), { method: 'HEAD', cache: 'no-store' }).then(function(){ ok = true; pingV = Math.round(performance.now() - t0); }).catch(function(){}).then(fin); } catch(e){ fin(); }
}
function trophyTick(){ var n = new Date(), left = 24 * 3600 - (n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds()); $('tt').textContent = ('0' + Math.floor(left / 3600)).slice(-2) + ':' + ('0' + Math.floor(left % 3600 / 60)).slice(-2); }
function lights(){
  var h = '', pts = [], i, x, y;
  for (x = 50; x <= 670; x += 52){ pts.push([x, 384]); pts.push([x, 882]); }
  for (y = 420; y <= 860; y += 52){ pts.push([30, y]); pts.push([690, y]); }
  for (i = 0; i < 26; i++){ var a = i / 26 * Math.PI * 2; pts.push([360 + Math.cos(a) * 352, 1105 + Math.sin(a) * 74]); }
  pts.forEach(function(p, k){ h += '<i style="left:' + p[0] + 'px;top:' + p[1] + 'px;animation-delay:' + ((k * 0.37) % 1.6).toFixed(2) + 's;animation-duration:' + (1.2 + (k % 5) * .25).toFixed(2) + 's"></i>'; });
  $('lights').innerHTML = h;
}
function bind(){
  $('bSpin').addEventListener('click', spin);
  $('bMinus').addEventListener('click', function(){ chg(-1); });
  $('bPlus').addEventListener('click', function(){ chg(1); });
  $('bBolt').addEventListener('click', function(){ auto = !auto; $('bBolt').classList.toggle('on', auto); toast(auto ? '⚡ অটো স্পিন চালু' : 'অটো স্পিন বন্ধ'); if (auto && !spinning) spin(); });
  $('bX').addEventListener('click', back); $('bList').addEventListener('click', help);
  $('modal').addEventListener('click', function(e){ if (e.target === $('modal') || e.target.className === 'x') $('modal').classList.remove('on'); });
}
function start(){
  Promise.resolve(window.MOIReady).then(function(){
    var p = window.MOIAuth && MOIAuth.profile; if (!p || !p.uid){ $('loading').innerHTML = '<div style="color:#fff;font:800 28px system-ui">ভয়েস ক্লাব থেকে খুলুন</div>'; setTimeout(back, 1800); return; }
    me = { uid: p.uid, dia: p.diamonds || 0 };
    buildReels(); lights(); bind(); showBal(); showBet(); pingTick(); setInterval(pingTick, 3000); trophyTick(); setInterval(trophyTick, 30000);
    setInterval(function(){ var q = window.MOIAuth && MOIAuth.profile; if (q && !spinning && typeof q.diamonds === 'number' && q.diamonds !== me.dia){ me.dia = q.diamonds; showBal(); } }, 600);
    requestAnimationFrame(frame);
    setTimeout(function(){ $('loading').classList.add('off'); }, 300);
  });
}
fit(); start();
setTimeout(function(){ var l = $('loading'); if (l) l.classList.add('off'); }, 8000);
window.__sl = { spin: spin, get dia(){ return me && me.dia; } };
})();
