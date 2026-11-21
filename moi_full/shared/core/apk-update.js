/* shared/core/apk-update.js — শুধু APK-র ভেতরে চলে। নতুন আপডেট আছে কিনা দেখে, বোতাম চাপলে নামিয়ে বসায়। */
(function(){
  var C = window.Capacitor, P = C && C.Plugins && C.Plugins.CapacitorUpdater;
  if (!P) return;
  try { P.notifyAppReady(); } catch(e){}
  var BASE = 'https://github.com/mohazme2026-collab/moi-app/releases/download/live/';
  try { if (sessionStorage.getItem('moi_upd_chk')) return; sessionStorage.setItem('moi_upd_chk', '1'); } catch(e){}

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

  function check(){
    Promise.all([
      fetch('/build.json?t=' + Date.now()).then(function(r){ return r.json(); }),
      fetch(BASE + 'version.json?t=' + Date.now()).then(function(r){ return r.json(); })
    ]).then(function(a){
      if (a[1] && a[1].v && (!a[0] || a[0].v !== a[1].v)) banner(a[1].v);
    }).catch(function(){});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(check, 3000); });
  else setTimeout(check, 3000);
})();
