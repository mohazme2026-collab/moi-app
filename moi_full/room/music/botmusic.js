/* room/music/botmusic.js — মিউজিক-রুমে বট গায়ক গান চালায় (ডেমো)
   • গান আসে assets/music/songs.json থেকে (খালি থাকলে কিছুই হয় না)
   • শ্রোতা শুধু 🎵 লোগো (ওপরে ডানে) দেখে — থামানো/বদলানোর কন্ট্রোল নেই
   • বট গায়কের সিটে 🎵 চিহ্ন; রুমে ঢুকলে গান মাঝখান থেকে (সবার জন্য একই সময়ে) চলে */
(function(){
'use strict';
if (!window.DEMO && !window.__MOCK) return;
var ROOM = (new URLSearchParams(location.search)).get('room'); if (!ROOM) return;
var BASE = (function(){ try { return new URL('../../assets/music/', document.currentScript.src).href; } catch(e){ return '../../assets/music/'; } })();
var EPOCH = 1700000000000, audio = null, chip = null, singer = '', cur = null;
function hash(s){ var x = 2166136261; s = String(s); for (var i = 0; i < s.length; i++){ x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
function css(uid){
    var st = document.getElementById('botMusicCss'); if (!st){ st = document.createElement('style'); st.id = 'botMusicCss'; document.head.appendChild(st); }
    st.textContent = '.seat[data-uid="' + uid + '"] .seat-avatar::after{content:"🎵";position:absolute;right:-2px;bottom:-2px;z-index:9;font-size:13px;background:#ff3d7f;border-radius:50%;width:20px;height:20px;display:grid;place-items:center;box-shadow:0 0 8px #ff3d7f;animation:bmPulse 1s infinite alternate}@keyframes bmPulse{to{transform:scale(1.18)}}' +
        '#botMusicChip{position:fixed;top:92px;right:8px;z-index:60;display:flex;align-items:center;gap:6px;max-width:150px;padding:4px 10px 4px 6px;border-radius:20px;background:rgba(20,10,40,.78);border:1px solid rgba(255,120,190,.6);color:#fff;font:700 11px Figtree,sans-serif;pointer-events:none}' +
        '#botMusicChip i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#ff3d7f,#ff9a3d);font-style:normal;animation:bmSpin 3s linear infinite}@keyframes bmSpin{to{transform:rotate(360deg)}}#botMusicChip span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}';
}
function start(songs, who){
    var n = songs.length, dur = 200000;               /* গানের দৈর্ঘ্য জানার আগে ধরে নেওয়া */
    var order = hash(ROOM) % n, t = Date.now() - EPOCH - hash(ROOM) % 90000;
    var idx = (order + Math.floor(t / dur)) % n; cur = songs[idx];
    audio = new Audio(BASE + cur.file); audio.preload = 'auto'; audio.loop = false;
    audio.addEventListener('loadedmetadata', function(){ var d = audio.duration * 1000; if (d > 1000){ try { audio.currentTime = ((Date.now() - EPOCH + hash(ROOM)) % d) / 1000; } catch(e){} } });
    audio.addEventListener('ended', function(){ idx = (idx + 1) % n; cur = songs[idx]; audio.src = BASE + cur.file; audio.currentTime = 0; setLabel(); audio.play().catch(function(){}); });
    audio.addEventListener('error', function(){ chip && chip.remove(); });
    chip = document.createElement('div'); chip.id = 'botMusicChip'; document.body.appendChild(chip); setLabel(); css(singer = who);
    var go = function(){ audio.play().catch(function(){}); };
    go(); ['pointerdown', 'keydown', 'touchstart'].forEach(function(e){ window.addEventListener(e, function f(){ if (audio.paused) go(); window.removeEventListener(e, f, true); }, true); });
    document.addEventListener('visibilitychange', function(){ if (document.hidden) audio.pause(); else go(); });
}
function setLabel(){ if (chip) chip.innerHTML = '<i>🎵</i><span>' + (cur.title || '') + '</span>'; }
function boot(){
    fetch(BASE + 'songs.json').then(function(r){ return r.json(); }).then(function(songs){
        if (!songs || !songs.length) return;
        var db = window.db || (window.MOIFB && window.MOIFB.db); if (!db) return;
        db.collection('rooms').doc(ROOM).get().then(function(d){
            var r = d && d.exists ? d.data() : null; if (!r || r.category !== 'music') return;
            start(songs, r.ownerUid);
        });
    }).catch(function(){});
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
