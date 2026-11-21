/* shared/core/apk-update.js — শুধু APK-র ভেতরে চলে। নতুন আপডেট আছে কিনা দেখে, বোতাম চাপলে নামিয়ে বসায়। */
(function(){
  var C = window.Capacitor;
  if (!C) return;
  function plug(n){ try { return (C.Plugins && C.Plugins[n]) || C.registerPlugin(n); } catch(e){ return null; } }
  var P = plug('CapacitorUpdater');
  function dbg(t, ms){
    try {
      var d = document.getElementById('moiDbg');
      if (!d){ d = document.createElement('div'); d.id = 'moiDbg'; d.style.cssText = 'position:fixed;left:8px;right:8px;bottom:6px;z-index:2147483647;background:rgba(0,0,0,.75);color:#9f9;font:11px monospace;padding:4px 8px;border-radius:8px;pointer-events:none'; (document.body || document.documentElement).appendChild(d); }
      d.textContent = t; clearTimeout(d._t); d._t = setTimeout(function(){ d.remove(); }, ms || 6000);
    } catch(e){}
  }
  if (!P){ dbg('আপডেট প্লাগইন পাওয়া যায়নি', 8000); return; }
  try { P.notifyAppReady(); } catch(e){}
  window.addEventListener('error', function(e){
    try {
      var d = document.getElementById('moiErr');
      if (!d) { d = document.createElement('div'); d.id = 'moiErr'; d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#900;color:#fff;font:11px monospace;padding:6px;max-height:30vh;overflow:auto'; (document.body||document.documentElement).appendChild(d); }
      d.textContent += (e.message || '') + ' @ ' + String(e.filename||'').split('/').slice(-2).join('/') + ':' + (e.lineno||'') + '\n';
    } catch(x){}
  });
  var BASE = 'https://github.com/mohazme2026-collab/moi-app/releases/download/live/';
  var DONE = false; try { DONE = !!sessionStorage.getItem('moi_upd_chk'); } catch(e){}
  if (DONE) return;

  function banner(v){
    if (document.getElementById('moiUpd')) return;
    var d = document.createElement('div');
    d.id = 'moiUpd';
    d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:14px;z-index:2147483647;background:#2b1a5a;color:#fff;border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:10px;font:600 14px sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.5)';
    d.innerHTML = '<span style="flex:1">নতুন আপডেট এসেছে</span><button id="moiUpdGo" style="background:#ff3d7f;color:#fff;border:0;border-radius:10px;padding:9px 16px;font:700 14px sans-serif">আপডেট</button><button id="moiUpdX" style="background:none;border:0;color:#bbb;font-size:20px;padding:0 4px">×</button>';
    document.body.appendChild(d);
    document.getElementById('moiUpdX').onclick = function(){ d.remove(); };
    document.getElementById('moiUpdGo').onclick = function(){
      var b = this; b.disabled = true; b.textContent = 'নামছে…';
      P.download({ url: BASE + 'bundle.zip', version: v }).then(function(info){
        b.textContent = 'বসছে…';
        return P.set(info);
      }).catch(function(){ b.disabled = false; b.textContent = 'আবার চেষ্টা'; });
    };
  }

  function remote(u){
    var H = plug('CapacitorHttp');
    if (H && H.get) return H.get({ url: u }).then(function(r){ return typeof r.data === 'string' ? JSON.parse(r.data) : r.data; });
    return fetch(u).then(function(r){ return r.json(); });
  }
  function check(){
    Promise.all([
      fetch('/build.json?t=' + Date.now()).then(function(r){ return r.json(); }),
      remote(BASE + 'version.json?t=' + Date.now())
    ]).then(function(a){
      try { sessionStorage.setItem('moi_upd_chk', '1'); } catch(e){}
      var l = a[0] && a[0].v, r = a[1] && a[1].v;
      if (r && l !== r){ banner(r); dbg('আপডেট: ' + l + ' → ' + r, 4000); }
      else dbg('অ্যাপ আপ-টু-ডেট (' + l + ')', 3000);
    }).catch(function(e){ dbg('আপডেট চেক ব্যর্থ: ' + (e && e.message || e), 8000); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(check, 1200); });
  else setTimeout(check, 1200);
})();
