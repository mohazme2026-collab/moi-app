/* shared/core/apk-update.js — শুধু APK-র ভেতরে চলে। নতুন আপডেট থাকলে স্ক্রিনের মাঝখানে কার্ড দেখায়,
   "আপডেট" চাপলে নতুন ফাইল নামিয়ে নিজে বসিয়ে অ্যাপ নতুন করে খোলে। */
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
  /* আপডেটের কার্ড শুধু হোম পেজে দেখাবে — স্প্ল্যাশ ও লগইন পেজে নয় */
  if (!/\/home\//.test(location.pathname)) return;
  var BASE = 'https://github.com/mohazme2026-collab/moi-app/releases/download/live/';
  var DONE = false; try { DONE = !!sessionStorage.getItem('moi_upd_chk'); } catch(e){}
  if (DONE) return;

  function css(){
    if (document.getElementById('moiUpdCss')) return;
    var s = document.createElement('style'); s.id = 'moiUpdCss';
    s.textContent =
      '#moiUpd{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(8,4,24,.62);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);animation:muF .22s ease-out}' +
      '#moiUpd .mu{width:min(84vw,330px);background:linear-gradient(180deg,#3a1f78,#1d1040);border:1.5px solid rgba(255,214,120,.55);border-radius:22px;padding:26px 22px 20px;text-align:center;color:#fff;font-family:Poppins,"Hind Siliguri",system-ui,sans-serif;box-shadow:0 18px 60px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.05) inset;animation:muP .28s cubic-bezier(.2,1.2,.4,1)}' +
      '#moiUpd .mi{width:62px;height:62px;margin:0 auto 14px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffe9a8,#f5a524);display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 6px 22px rgba(245,165,36,.5)}' +
      '#moiUpd h3{margin:0 0 6px;font-size:19px;font-weight:700}' +
      '#moiUpd p{margin:0 0 18px;font-size:13.5px;line-height:1.5;opacity:.78}' +
      '#moiUpd .mb{height:8px;border-radius:6px;background:rgba(255,255,255,.14);overflow:hidden;margin:0 0 18px;display:none}' +
      '#moiUpd .mb i{display:block;height:100%;width:0;border-radius:6px;background:linear-gradient(90deg,#ff7ab0,#ffc65a);transition:width .25s}' +
      '#moiUpd .btns{display:flex;gap:10px}' +
      '#moiUpd button{flex:1;border:0;border-radius:14px;padding:13px 10px;font:700 15px inherit;font-family:inherit;color:#fff}' +
      '#moiUpd .go{background:linear-gradient(180deg,#ff6aa6,#ff2f7e);box-shadow:0 6px 18px rgba(255,47,126,.45)}' +
      '#moiUpd .no{background:rgba(255,255,255,.12)}' +
      '#moiUpd button:disabled{opacity:.6}' +
      '@keyframes muF{from{opacity:0}to{opacity:1}}@keyframes muP{from{transform:scale(.88);opacity:0}to{transform:scale(1);opacity:1}}';
    (document.head || document.documentElement).appendChild(s);
  }

  function banner(v){
    if (document.getElementById('moiUpd')) return;
    css();
    var d = document.createElement('div'); d.id = 'moiUpd';
    d.innerHTML = '<div class="mu"><div class="mi">⬇️</div><h3>নতুন আপডেট এসেছে</h3>' +
      '<p id="muT">নতুন ফিচার ও উন্নতি পেতে এখনই আপডেট করুন। কয়েক সেকেন্ড লাগবে।</p>' +
      '<div class="mb" id="muB"><i id="muI"></i></div>' +
      '<div class="btns"><button class="no" id="moiUpdX">পরে</button><button class="go" id="moiUpdGo">আপডেট করুন</button></div></div>';
    document.body.appendChild(d);
    var go = document.getElementById('moiUpdGo'), no = document.getElementById('moiUpdX'), t = document.getElementById('muT'),
        bar = document.getElementById('muB'), fill = document.getElementById('muI');
    no.onclick = function(){ d.remove(); };
    go.onclick = function(){
      go.disabled = true; no.style.display = 'none'; go.textContent = 'নামছে…'; bar.style.display = 'block'; fill.style.width = '4%';
      t.textContent = 'আপডেট নামছে, অ্যাপ বন্ধ করবেন না…';
      var fail = function(m){
        go.disabled = false; no.style.display = ''; no.textContent = 'APK নামান'; no.onclick = function(){ try { window.open(BASE + 'MOI.apk', '_system'); } catch(x){ location.href = BASE + 'MOI.apk'; } }; go.textContent = 'আবার চেষ্টা'; bar.style.display = 'none';
        t.textContent = 'আপডেট হয়নি, ইন্টারনেট দেখে আবার চেষ্টা করুন।'; dbg('আপডেট ব্যর্থ: ' + m, 12000);
      };
      var guard = setTimeout(function(){ fail('সময় শেষ (২ মিনিট)'); }, 120000);
      try { P.addListener('download', function(e){ var pc = e && e.percent != null ? e.percent : 0; fill.style.width = Math.max(4, Math.min(100, pc)) + '%'; go.textContent = 'নামছে ' + pc + '%'; }); } catch(x){}
      try { P.addListener('downloadFailed', function(e){ clearTimeout(guard); var m = ''; try { m = JSON.stringify(e); } catch(x){} fail('নামানো যায়নি ' + m); }); } catch(x){}
      P.download({ url: BASE + 'bundle.zip', version: v }).then(function(info){
        clearTimeout(guard);
        fill.style.width = '100%'; go.textContent = 'বসছে…'; t.textContent = 'প্রায় শেষ…';
        return P.set({ id: info.id });
      }).catch(function(e){ clearTimeout(guard); fail(e && (e.message || e.code) || String(e)); });
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
      if (r && l !== r) banner(r);
    }).catch(function(e){ dbg('আপডেট চেক ব্যর্থ: ' + (e && e.message || e), 8000); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(check, 1200); });
  else setTimeout(check, 1200);
})();
