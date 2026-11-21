/* ═══ হালকা রিং/অ্যানিমেশন প্লেয়ার (প্যাকড-আলফা MP4) ═══
   ফরম্যাট: ভিডিওর উপরের অর্ধেকে রিংয়ের রং, নিচের অর্ধেকে একই ছবির সাদা-কালো মাস্ক (সাদা = দেখা যাবে, কালো = স্বচ্ছ)।
   একই রিং যতজনের থাকুক — ভিডিও একটাই চলে, একবারই জোড়া লাগে (GPU), প্রতিটি রিং শুধু কপি নেয়। তাই সিট বাড়লেও লেগ বাড়ে না।
   ব্যবহার: const cv = MOIRingVid.mount(hostEl, 'url/ring.mp4', onFirstFrame)   • MOIRingVid.unmount(cv)
   ফোন লুকানো/অ্যাপ ব্যাকগ্রাউন্ডে গেলে নিজে থেমে যায়; কোনো রিং না থাকলে ভিডিও বন্ধ থাকে। */
(function(){
    if (window.MOIRingVid) return;
    const FPS = 20, STEP = 1000 / FPS;
    const pool = {};
    let raf = 0, last = 0;

    function mkGL(W){
        const c = document.createElement('canvas'); c.width = c.height = W;
        const gl = c.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
        if (!gl) return null;
        const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
        const vs = sh(gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 u;void main(){u=vec2(p.x*.5+.5,1.-(p.y*.5+.5));gl_Position=vec4(p,0.,1.);}');
        const fs = sh(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec2 u;uniform sampler2D t;void main(){vec3 c=texture2D(t,vec2(u.x,u.y*.5)).rgb;float a=texture2D(t,vec2(u.x,.5+u.y*.5)).r;gl_FragColor=vec4(min(c,vec3(a)),a);}');
        if (!vs || !fs) return null;
        const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
        if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
        gl.useProgram(pr);
        const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        const tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.viewport(0, 0, W, W);
        return { c: c, render: function(v){
            gl.bindTexture(gl.TEXTURE_2D, tx);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
            gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        } };
    }
    /* WebGL না চললে (পুরনো ফোন) — ধীর কিন্তু কাজ চলে */
    function mk2D(W){
        const out = document.createElement('canvas'); out.width = out.height = W;
        const o = out.getContext('2d'), sc = document.createElement('canvas'); sc.width = W; sc.height = W * 2;
        const s = sc.getContext('2d', { willReadFrequently: true });
        return { c: out, render: function(v){
            s.drawImage(v, 0, 0, W, W * 2);
            const d = s.getImageData(0, 0, W, W * 2).data, im = o.createImageData(W, W), q = im.data, n = W * W * 4;
            for (let i = 0; i < n; i += 4){
                const a = d[n + i];
                q[i + 3] = a;
                if (a){ const k = 255 / a; q[i] = Math.min(255, d[i] * k); q[i + 1] = Math.min(255, d[i + 1] * k); q[i + 2] = Math.min(255, d[i + 2] * k); }
            }
            o.putImageData(im, 0, 0);
        } };
    }
    function src(url){
        if (pool[url]) return pool[url];
        const v = document.createElement('video');
        v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
        v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.setAttribute('webkit-playsinline', '');
        v.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none;z-index:-1';
        v.src = url;
        (document.body || document.documentElement).appendChild(v);
        const S = pool[url] = { v: v, cvs: new Set(), r: null, W: 320, playing: false };
        return S;
    }
    function play(S){ if (S.playing) return; S.playing = true; const p = S.v.play(); if (p && p.catch) p.catch(function(){ S.playing = false; }); }
    function pause(S){ if (!S.playing) return; S.playing = false; try { S.v.pause(); } catch(e){} }

    function tick(t){
        raf = requestAnimationFrame(tick);
        if (t - last < STEP) return; last = t;
        let any = false;
        for (const u in pool){
            const S = pool[u];
            S.cvs.forEach(function(c){ if (!c.isConnected) S.cvs.delete(c); });
            if (!S.cvs.size){ pause(S); continue; }
            any = true; play(S);
            if (S.v.readyState < 2 || !S.v.videoWidth) continue;
            if (!S.r){ S.W = Math.min(320, S.v.videoWidth); S.r = mkGL(S.W) || mk2D(S.W); }
            try { S.r.render(S.v); } catch(e){ S.r = mk2D(S.W); continue; }
            S.cvs.forEach(function(c){
                if (c.width !== S.W){ c.width = c.height = S.W; }
                const x = c.getContext('2d'); x.clearRect(0, 0, S.W, S.W); x.drawImage(S.r.c, 0, 0);
                if (c._first){ const f = c._first; c._first = null; f(); }
            });
        }
        if (!any){ cancelAnimationFrame(raf); raf = 0; }
    }
    function go(){ if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(tick); } }
    document.addEventListener('visibilitychange', function(){
        if (document.hidden){ if (raf){ cancelAnimationFrame(raf); raf = 0; } for (const u in pool) pause(pool[u]); }
        else go();
    });
    function mount(host, url, onFirst){
        if (!host) return null;
        const S = src(url), c = document.createElement('canvas');
        c.width = c.height = S.W; c._first = onFirst || null; c.setAttribute('aria-hidden', 'true');
        host.appendChild(c); S.cvs.add(c); go();
        return c;
    }
    function unmount(c){ if (!c) return; for (const u in pool) pool[u].cvs.delete(c); if (c.parentNode) c.parentNode.removeChild(c); }
    window.MOIRingVid = { mount: mount, unmount: unmount };
})();
