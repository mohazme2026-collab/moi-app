/* me/crop.js — ছবি কাটার পেজ: উপরে ← · ঘোরানো · উল্টানো · CROP; ছবি টেনে সরানো, দুই আঙুলে/স্লাইডারে বড়-ছোট
   MoiCrop.open(file, { out: 512 }) → কাটা ছবির dataURL (বা বাতিল হলে null) */
(function(){
    'use strict';
    const css = `.cr{position:fixed;inset:0;z-index:12000;background:#000;display:flex;flex-direction:column;color:#fff;font-family:Poppins,system-ui,sans-serif;touch-action:none}
.cr-top{display:flex;align-items:center;gap:6px;height:56px;padding:calc(env(safe-area-inset-top,0px)) 10px 0;box-sizing:content-box;background:#1c1c1e}
.cr-top button{height:44px;min-width:44px;display:grid;place-items:center;border:0;background:none;color:#fff;cursor:pointer;font:600 16px Poppins,system-ui,sans-serif;border-radius:10px;padding:0 10px}
.cr-top button:active{background:rgba(255,255,255,.12)}.cr-top svg{width:26px;height:26px}.cr-sp{flex:1}
.cr-stage{position:relative;flex:1;overflow:hidden}
.cr-img{position:absolute;left:50%;top:50%;transform-origin:center;user-select:none;-webkit-user-drag:none;max-width:none;will-change:transform}
.cr-frame{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);box-shadow:0 0 0 200vmax rgba(0,0,0,.62);border:1.5px solid rgba(255,255,255,.9);pointer-events:none}
.cr-frame::before,.cr-frame::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 33%,rgba(255,255,255,.45) 33% calc(33% + 1px),transparent calc(33% + 1px) 66%,rgba(255,255,255,.45) 66% calc(66% + 1px),transparent calc(66% + 1px))}
.cr-frame::after{background:linear-gradient(0deg,transparent 33%,rgba(255,255,255,.45) 33% calc(33% + 1px),transparent calc(33% + 1px) 66%,rgba(255,255,255,.45) 66% calc(66% + 1px),transparent calc(66% + 1px))}
.cr-zoom{padding:12px 24px calc(14px + env(safe-area-inset-bottom,0px));background:#1c1c1e;display:flex;align-items:center;gap:12px}
.cr-zoom input{flex:1;accent-color:#5fe3b0}`;
    function open(file, opts){
        opts = opts || {}; const OUT = opts.out || 512;
        return new Promise(resolve => {
            const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
            const el = document.createElement('div'); el.className = 'cr';
            const ic = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
            el.innerHTML = '<div class="cr-top"><button id="crBack" aria-label="Back">' + ic('<path d="M19 12H5M12 19l-7-7 7-7"/>') + '</button><span class="cr-sp"></span><button id="crRot" aria-label="Rotate">' + ic('<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/>') + '</button><button id="crFlip" aria-label="Flip">' + ic('<path d="M12 3v18"/><path d="M8 7L3 12l5 5z"/><path d="M16 7l5 5-5 5z" fill="currentColor"/>') + '</button><button id="crOk">CROP</button></div>' +
                '<div class="cr-stage" id="crStage"><img class="cr-img" id="crImg" alt=""><div class="cr-frame" id="crFrame"></div></div>' +
                '<div class="cr-zoom"><span>−</span><input type="range" id="crZ" min="1" max="4" step="0.01" value="1"><span>+</span></div>';
            document.body.appendChild(el);
            const $ = id => el.querySelector('#' + id), img = $('crImg'), frame = $('crFrame'), stage = $('crStage'), zr = $('crZ');
            let side = 300, W = 1, H = 1, rot = 0, flip = 1, zoom = 1, tx = 0, ty = 0, base = 1;
            const url = URL.createObjectURL(file);
            function layout(){
                const r = stage.getBoundingClientRect(); side = Math.max(120, Math.min(r.width - 24, r.height - 24, 380));
                frame.style.width = frame.style.height = side + 'px'; base = Math.max(side / W, side / H); apply();
            }
            function clamp(){
                const sw = (rot % 180 === 0 ? W : H) * base * zoom, sh = (rot % 180 === 0 ? H : W) * base * zoom;
                const ex = Math.max(0, (sw - side) / 2), ey = Math.max(0, (sh - side) / 2);
                tx = Math.max(-ex, Math.min(ex, tx)); ty = Math.max(-ey, Math.min(ey, ty));
            }
            function apply(){
                clamp();
                img.style.width = W + 'px'; img.style.height = H + 'px'; img.style.marginLeft = (-W / 2) + 'px'; img.style.marginTop = (-H / 2) + 'px';
                img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) rotate(' + rot + 'deg) scale(' + (flip * base * zoom) + ',' + (base * zoom) + ')';
            }
            img.onload = () => { W = img.naturalWidth || 1; H = img.naturalHeight || 1; layout(); };
            img.src = url;
            window.addEventListener('resize', layout);
            /* টানা + দুই আঙুলে জুম */
            const pts = new Map(); let lastD = 0;
            stage.addEventListener('pointerdown', e => { stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); lastD = 0; });
            stage.addEventListener('pointermove', e => {
                if (!pts.has(e.pointerId)) return;
                const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
                if (pts.size === 1){ tx += e.clientX - prev[0]; ty += e.clientY - prev[1]; apply(); }
                else if (pts.size === 2){
                    const a = [...pts.values()], d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]);
                    if (lastD){ zoom = Math.max(1, Math.min(4, zoom * d / lastD)); zr.value = zoom; apply(); } lastD = d;
                }
            });
            const up = e => { pts.delete(e.pointerId); lastD = 0; };
            stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
            stage.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.max(1, Math.min(4, zoom * (e.deltaY < 0 ? 1.06 : .94))); zr.value = zoom; apply(); }, { passive: false });
            zr.oninput = () => { zoom = +zr.value; apply(); };
            $('crRot').onclick = () => { rot = (rot + 90) % 360; layout(); };
            $('crFlip').onclick = () => { flip = -flip; apply(); };
            function done(v){ window.removeEventListener('resize', layout); URL.revokeObjectURL(url); el.remove(); st.remove(); resolve(v); }
            $('crBack').onclick = () => done(null);
            $('crOk').onclick = () => {
                const c = document.createElement('canvas'); c.width = c.height = OUT; const x = c.getContext('2d');
                x.fillStyle = '#000'; x.fillRect(0, 0, OUT, OUT);
                x.translate(OUT / 2, OUT / 2); x.scale(OUT / side, OUT / side); x.translate(tx, ty); x.rotate(rot * Math.PI / 180); x.scale(flip * base * zoom, base * zoom);
                x.drawImage(img, -W / 2, -H / 2);
                done(c.toDataURL('image/jpeg', 0.85));
            };
        });
    }
    window.MoiCrop = { open };
})();
