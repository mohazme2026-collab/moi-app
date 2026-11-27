/* shared/ui/minroom.js — রুম "ছোট করা" হলে সব পেজে ভাসমান রুম-লোগো (টেনে যেখানে খুশি সরানো যায়; চাপলে রুমে ফেরা) */
(function(){
    var KEY = 'moi_minroom', PKEY = 'moi_minroom_pos';
    var base = (function(){ try { var s = document.currentScript.src; return s.slice(0, s.indexOf('/shared/ui/')); } catch(e){ return ''; } })();
    function rd(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } }
    function wr(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
    var host = null;

    function css(){
        if (document.getElementById('moiMinCss')) return;
        var s = document.createElement('style'); s.id = 'moiMinCss';
        s.textContent = '#moiMin{position:fixed;z-index:9990;width:58px;height:58px;touch-action:none;cursor:pointer;-webkit-tap-highlight-color:transparent;filter:drop-shadow(0 6px 14px rgba(0,0,0,.45))}' +
            '#moiMin .mm-in{width:100%;height:100%;border-radius:50%;padding:3px;background:conic-gradient(from 0deg,#ffd36b,#2fd6b0,#ff9ad0,#ffd36b);animation:mmRot 6s linear infinite}' +
            '#moiMin img{width:100%;height:100%;border-radius:50%;object-fit:cover;border:2px solid #101018;display:block;animation:mmRot 6s linear infinite reverse}' +
            '#moiMin .mm-eq{position:absolute;right:-1px;bottom:-1px;width:22px;height:22px;border-radius:50%;background:#16a34a;display:flex;gap:2px;align-items:flex-end;justify-content:center;padding:5px 0;box-sizing:border-box;border:2px solid #fff}' +
            '#moiMin .mm-eq i{display:block;width:2.5px;background:#fff;border-radius:2px;animation:mmEq .9s ease-in-out infinite}' +
            '#moiMin .mm-eq i:nth-child(2){animation-delay:.2s}#moiMin .mm-eq i:nth-child(3){animation-delay:.4s}' +
            '@keyframes mmRot{to{transform:rotate(360deg)}}@keyframes mmEq{0%,100%{height:3px}50%{height:10px}}';
        document.head.appendChild(s);
    }
    function place(x, y){
        var W = window.innerWidth, H = window.innerHeight;
        x = Math.max(6, Math.min(W - 64, x)); y = Math.max(70, Math.min(H - 150, y));
        host.style.left = x + 'px'; host.style.top = y + 'px'; return [x, y];
    }
    function show(){
        var r = rd(KEY); if (!r || !r.id){ hide(); return; }
        css(); if (host) host.remove();
        host = document.createElement('div'); host.id = 'moiMin'; host.setAttribute('aria-label', 'চলমান রুমে ফিরুন');
        var logo = r.logo || (window.roomArt ? roomArt(r.id, r.name) : '');
        host.innerHTML = '<div class="mm-in"><img alt="" src="' + String(logo).replace(/"/g, '&quot;') + '"></div><span class="mm-eq"><i></i><i></i><i></i></span>';
        document.body.appendChild(host);
        var p = rd(PKEY) || [window.innerWidth - 74, window.innerHeight - 230]; place(p[0], p[1]);
        var sx, sy, ox, oy, moved = false, down = false;
        host.addEventListener('pointerdown', function(e){ down = true; moved = false; sx = e.clientX; sy = e.clientY; ox = parseFloat(host.style.left); oy = parseFloat(host.style.top); try { host.setPointerCapture(e.pointerId); } catch(_){} });
        host.addEventListener('pointermove', function(e){ if (!down) return; var dx = e.clientX - sx, dy = e.clientY - sy; if (Math.abs(dx) + Math.abs(dy) > 6) moved = true; if (moved) place(ox + dx, oy + dy); });
        host.addEventListener('pointerup', function(){
            if (!down) return; down = false;
            if (moved){ var W = window.innerWidth, x = parseFloat(host.style.left), y = parseFloat(host.style.top); x = x + 29 < W / 2 ? 8 : W - 66; var q = place(x, y); wr(PKEY, q); }
            else go();
        });
    }
    function hide(){ if (host){ host.remove(); host = null; } }
    function go(){ var r = rd(KEY); if (r && r.id) location.href = base + '/room/index.html?room=' + encodeURIComponent(r.id); }
    window.MOIMin = {
        set: function(r){ wr(KEY, { id: r.id, name: r.name || '', logo: r.logo || '' }); },
        get: function(){ return rd(KEY); },
        clear: function(){ try { localStorage.removeItem(KEY); } catch(e){} hide(); },
        show: show
    };
    if (!/\/room\/index\.html/.test(location.pathname)){
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show); else show();
        window.addEventListener('storage', function(e){ if (e.key === KEY) show(); });
    }
})();
