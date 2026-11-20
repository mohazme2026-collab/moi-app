/* room/music/music-ui.js — ছোট, টেনে সরানো যায় এমন মিউজিক প্লেয়ার + Settings (সাউন্ড/EQ/ভয়েস কমানো)।
   পুরনো #musicPlayerBar লুকানো থাকে (music.js-এর কোড সেটাই চালায়); এই উইজেট ওর অবস্থা দেখে নিজেকে সাজায়। */
(function(){
    'use strict';
    var KEY = 'moi_music_fx_v1';
    var PRESETS = {
        normal: { vol: 100, bass: 50, mid: 50, treb: 50, voice: 0, loud: 0 },
        bass:   { vol: 100, bass: 85, mid: 45, treb: 50, voice: 0, loud: 1 },
        vocal:  { vol: 100, bass: 40, mid: 80, treb: 60, voice: 0, loud: 0 },
        party:  { vol: 100, bass: 80, mid: 55, treb: 75, voice: 0, loud: 1 },
        clear:  { vol: 100, bass: 40, mid: 60, treb: 70, voice: 0, loud: 0 },
        karaoke:{ vol: 100, bass: 55, mid: 50, treb: 55, voice: 100, loud: 0 }
    };
    var S = (function(){ try { return Object.assign({}, PRESETS.normal, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch(e){ return Object.assign({}, PRESETS.normal); } })();
    function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} }
    function $(i){ return document.getElementById(i); }

    /* ─── সাউন্ড চেইন ─── */
    var ctx = null, chain = null, lastEl = null;
    function db(v){ return (v - 50) / 50 * 12; }   /* 0..100 → -12..+12 dB */
    function applyFx(){
        if (lastEl) try { lastEl.volume = Math.max(0, Math.min(1, S.vol / 100)); } catch(e){}
        if (!chain) return;
        var t = ctx.currentTime;
        chain.bass.gain.setTargetAtTime(db(S.bass), t, .03);
        chain.mid.gain.setTargetAtTime(db(S.mid), t, .03);
        chain.treb.gain.setTargetAtTime(db(S.treb), t, .03);
        var a = S.voice / 100;
        chain.dry.gain.setTargetAtTime(1 - a, t, .03);
        chain.kar.gain.setTargetAtTime(a * 1.3, t, .03);
        chain.low.gain.setTargetAtTime(a, t, .03);
        chain.comp.threshold.setTargetAtTime(S.loud ? -26 : 0, t, .03);
        chain.comp.ratio.setTargetAtTime(S.loud ? 6 : 1, t, .03);
        chain.make.gain.setTargetAtTime(S.loud ? 1.5 : 1, t, .03);
    }
    function attach(el){
        lastEl = el;
        try {
            var AC = window.AudioContext || window.webkitAudioContext; if (!AC) { applyFx(); return; }
            if (!ctx) ctx = new AC();
            if (ctx.state === 'suspended') ctx.resume();
            var src = ctx.createMediaElementSource(el);
            var bass = ctx.createBiquadFilter(); bass.type = 'lowshelf'; bass.frequency.value = 140;
            var mid = ctx.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1500; mid.Q.value = .8;
            var treb = ctx.createBiquadFilter(); treb.type = 'highshelf'; treb.frequency.value = 4200;
            src.connect(bass); bass.connect(mid); mid.connect(treb);
            /* ভয়েস কমানো: বাম−ডান (মাঝের কণ্ঠ কাটে) + নিচের বেস ফিরিয়ে আনা */
            var dry = ctx.createGain(), sp = ctx.createChannelSplitter(2), gl = ctx.createGain(), gr = ctx.createGain(); gr.gain.value = -1;
            var kar = ctx.createGain(), lowf = ctx.createBiquadFilter(); lowf.type = 'lowpass'; lowf.frequency.value = 160;
            var low = ctx.createGain(), mix = ctx.createGain();
            treb.connect(dry); dry.connect(mix);
            treb.connect(sp); sp.connect(gl, 0); sp.connect(gr, 1); gl.connect(kar); gr.connect(kar); kar.connect(mix);
            treb.connect(lowf); lowf.connect(low); low.connect(mix);
            var comp = ctx.createDynamicsCompressor(), make = ctx.createGain();
            mix.connect(comp); comp.connect(make); make.connect(ctx.destination);
            chain = { bass: bass, mid: mid, treb: treb, dry: dry, kar: kar, low: low, comp: comp, make: make };
        } catch(e){ console.warn('[MUSIC FX]', e); chain = null; }
        applyFx();
    }

    /* ─── উইজেট ─── */
    var W = null, pos = null;
    function build(){
        var app = document.querySelector('.app-container'); if (!app || $('mpf')) return;
        W = document.createElement('div'); W.id = 'mpf'; W.className = 'mpf';
        W.innerHTML =
            '<div class="mpf-x" data-a="close">✕</div>' +
            '<div class="mpf-top"><div class="mpf-vinyl" id="mpfVinyl"><i></i></div><div class="mpf-info"><div class="mpf-name" id="mpfName">No song</div><div class="mpf-bar"><b id="mpfFill"></b></div></div></div>' +
            '<div class="mpf-row">' +
              '<button data-a="prev"><i class="fa-solid fa-backward-step"></i></button>' +
              '<button class="pl" data-a="play"><i class="fa-solid fa-play" id="mpfPlay"></i></button>' +
              '<button data-a="next"><i class="fa-solid fa-forward-step"></i></button>' +
              '<button data-a="loop" id="mpfLoop"><i class="fa-solid fa-repeat"></i></button>' +
              '<button data-a="set" id="mpfSet"><i class="fa-solid fa-sliders"></i></button>' +
            '</div>' +
            '<div class="mpf-set" id="mpfPanel"></div>';
        app.appendChild(W);
        W.addEventListener('click', function(e){
            var b = e.target.closest('[data-a]'); if (!b) return;
            var a = b.getAttribute('data-a');
            if (a === 'close') window.mpClosePlayer();
            else if (a === 'prev') window.mpPrev();
            else if (a === 'next') window.mpNext();
            else if (a === 'play') window.mpTogglePlay();
            else if (a === 'loop') window.mpToggleLoop();
            else if (a === 'set') togglePanel();
            setTimeout(sync, 120);
        });
        drag();
    }
    function place(){
        var app = document.querySelector('.app-container'); if (!app || !W) return;
        var r = app.getBoundingClientRect();
        if (!pos) pos = { x: 10, y: Math.round(r.height * 0.42) };
        var w = W.offsetWidth || 150, h = W.offsetHeight || 70;
        pos.x = Math.max(0, Math.min(r.width - w, pos.x)); pos.y = Math.max(0, Math.min(r.height - h, pos.y));
        W.style.left = pos.x + 'px'; W.style.top = pos.y + 'px';
        var p = $('mpfPanel'); if (p){ p.classList.toggle('up', pos.y + h + 330 > r.height && pos.y > 330); var abs = Math.max(6, Math.min(r.width - 256, pos.x + w / 2 - 125)); p.style.left = (abs - pos.x) + 'px'; }
    }
    function drag(){
        var sx, sy, ox, oy, on = false;
        W.addEventListener('pointerdown', function(e){
            if (e.target.closest('button,input,.mpf-set,[data-a]')) return;
            on = true; sx = e.clientX; sy = e.clientY; ox = pos.x; oy = pos.y; try { W.setPointerCapture(e.pointerId); } catch(_){}
            W.classList.add('drag'); e.preventDefault();
        });
        W.addEventListener('pointermove', function(e){ if (!on) return; pos.x = ox + e.clientX - sx; pos.y = oy + e.clientY - sy; place(); });
        function end(){ if (on){ on = false; W.classList.remove('drag'); } }
        W.addEventListener('pointerup', end); W.addEventListener('pointercancel', end);
    }

    /* ─── Settings প্যানেল ─── */
    var ROWS = [
        ['vol', '🔊', 'Volume', 'আওয়াজ'],
        ['bass', '🥁', 'Beat · Drum', 'বিট ও ড্রাম'],
        ['mid', '🎤', 'Voice', 'গানের কথা/ভয়েস'],
        ['treb', '🎸', 'Guitar · Sparkle', 'গিটার ও ঝংকার'],
        ['voice', '🎼', 'Music Only', 'ভয়েস কমান (কারাওকে)']
    ];
    function panelHTML(){
        var h = '<div class="mps-pre">' + [['normal', 'Normal'], ['bass', 'Bass Boost'], ['vocal', 'Vocal'], ['party', 'Party'], ['clear', 'Clear'], ['karaoke', 'Karaoke']].map(function(p){ return '<button data-p="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div>';
        ROWS.forEach(function(r){
            h += '<label class="mps-r"><span class="mps-l"><em>' + r[1] + '</em><b>' + r[2] + '</b><small>' + r[3] + '</small><u data-v="' + r[0] + '">' + S[r[0]] + '</u></span><input type="range" min="0" max="100" value="' + S[r[0]] + '" data-k="' + r[0] + '"></label>';
        });
        h += '<button class="mps-loud' + (S.loud ? ' on' : '') + '" data-loud="1">🔥 Loud Boost ' + (S.loud ? 'ON' : 'OFF') + '</button>';
        return h;
    }
    function paintRange(i){ var v = +i.value; i.style.background = 'linear-gradient(90deg,#ff5fa2 ' + v + '%,rgba(255,255,255,.18) ' + v + '%)'; }
    function togglePanel(){
        var p = $('mpfPanel'); if (!p) return;
        if (p.classList.contains('show')){ p.classList.remove('show'); return; }
        p.innerHTML = panelHTML(); p.classList.add('show'); place();
        p.querySelectorAll('input[type=range]').forEach(paintRange);
        p.addEventListener('input', function(e){
            var k = e.target.getAttribute('data-k'); if (!k) return;
            S[k] = +e.target.value; paintRange(e.target);
            var u = p.querySelector('[data-v="' + k + '"]'); if (u) u.textContent = S[k];
            applyFx(); save();
        });
        p.addEventListener('click', function(e){
            var pr = e.target.getAttribute('data-p'), ld = e.target.getAttribute('data-loud');
            if (pr){ Object.assign(S, PRESETS[pr]); applyFx(); save(); p.innerHTML = panelHTML(); p.querySelectorAll('input[type=range]').forEach(paintRange); }
            else if (ld){ S.loud = S.loud ? 0 : 1; applyFx(); save(); p.innerHTML = panelHTML(); p.querySelectorAll('input[type=range]').forEach(paintRange); }
        });
    }

    /* ─── পুরনো বারের অবস্থা দেখে নিজেকে মেলানো ─── */
    function sync(){
        var bar = $('musicPlayerBar'); if (!bar) return;
        build(); if (!W) return;
        var on = bar.classList.contains('active');
        if (on !== W.classList.contains('show')){ W.classList.toggle('show', on); if (on) place(); if (!on){ var p = $('mpfPanel'); if (p) p.classList.remove('show'); } }
        var nm = $('mpTrackName'), n2 = $('mpfName'); if (nm && n2 && n2.textContent !== nm.textContent) n2.textContent = nm.textContent;
        var ic = $('mpPlayIcon'), i2 = $('mpfPlay'); if (ic && i2) i2.className = ic.className;
        var f = $('mpProgressFill'), f2 = $('mpfFill'); if (f && f2) f2.style.width = f.style.width;
        var v = $('mpVinyl'), v2 = $('mpfVinyl'); if (v && v2) v2.classList.toggle('spin', v.classList.contains('playing'));
        var lp = $('mpLoopBtn'), l2 = $('mpfLoop'); if (lp && l2) l2.classList.toggle('on', !!lp.style.background);
    }
    setInterval(sync, 400);
    window.addEventListener('resize', place);
    window.MPFx = { attach: attach, apply: applyFx };
})();
