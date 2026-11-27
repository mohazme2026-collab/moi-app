/* room/music/botmusic.js — মিউজিক-রুমে বট গায়ক গান চালায় (ডেমো)
   • গান আসে assets/music/song1.mp3, song2.mp3 … থেকে (না থাকলে কিছুই হয় না)
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
    st.textContent = (uid ? '.seat[data-uid="' + uid + '"]{position:relative}.seat[data-uid="' + uid + '"]::after{content:"🎵";position:absolute;right:-4px;top:-6px;z-index:30;font-size:14px;background:#ff3d7f;border-radius:50%;width:24px;height:24px;display:grid;place-items:center;box-shadow:0 0 10px #ff3d7f;animation:bmPulse 1s infinite alternate;pointer-events:none}.seat[data-uid="' + uid + '"] .seat-avatar{box-shadow:0 0 0 3px #ff3d7f,0 0 16px #ff3d7f!important}' : '') +
        '@keyframes bmPulse{to{transform:scale(1.2)}}' +
        '#botMusicChip{position:fixed;top:64px;right:8px;z-index:99999;display:flex;align-items:center;gap:6px;max-width:160px;padding:5px 12px 5px 6px;border-radius:20px;background:rgba(255,61,127,.92);border:1px solid #fff;color:#fff;font:700 12px Figtree,sans-serif;pointer-events:none;box-shadow:0 2px 12px rgba(0,0,0,.5)}' +
        '#botMusicChip i{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#fff;font-style:normal;animation:bmSpin 3s linear infinite}@keyframes bmSpin{to{transform:rotate(360deg)}}#botMusicChip span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}';
}
/* গায়ক = রুমের মাইকে বসা একজন বট (সিট বদলালে/নেমে গেলে অন্য বসা বট) */
function pickSinger(){
    try {
        var seats = (window.state && state.seats) || [], me = window.myProfile && myProfile.uid, cands = [];
        seats.forEach(function(s){ if (s && s.uid && s.uid !== me) cands.push(s.uid); });
        if (!cands.length) return;
        if (cands.indexOf(singer) < 0) singer = cands[hash(ROOM) % cands.length];
        css(singer);
    } catch(e){}
}
function start(songs, who){
    var n = songs.length, dur = 200000;               /* গানের দৈর্ঘ্য জানার আগে ধরে নেওয়া */
    var order = hash(ROOM) % n, t = Date.now() - EPOCH - hash(ROOM) % 90000;
    var idx = (order + Math.floor(t / dur)) % n; cur = songs[idx];
    audio = new Audio(BASE + cur.file); audio.preload = 'auto'; audio.loop = false;
    audio.addEventListener('loadedmetadata', function(){ var d = audio.duration * 1000; if (d > 1000){ try { audio.currentTime = ((Date.now() - EPOCH + hash(ROOM)) % d) / 1000; } catch(e){} } });
    audio.addEventListener('ended', function(){ idx = (idx + 1) % n; cur = songs[idx]; audio.src = BASE + cur.file; audio.currentTime = 0; setLabel(); audio.play().catch(function(){}); });
    audio.addEventListener('error', function(){ chip && chip.remove(); });
    chip = document.createElement('div'); chip.id = 'botMusicChip'; document.body.appendChild(chip); setLabel(); css(''); pickSinger(); setInterval(pickSinger, 2500);
    var go = function(){ audio.play().catch(function(){}); };
    go(); ['pointerdown', 'keydown', 'touchstart'].forEach(function(e){ window.addEventListener(e, function f(){ if (audio.paused) go(); window.removeEventListener(e, f, true); }, true); });
    document.addEventListener('visibilitychange', function(){ if (document.hidden) audio.pause(); else go(); });
}
function setLabel(){ if (chip) chip.innerHTML = '<i>🎵</i><span>' + (cur.title || '') + '</span>'; }
/* গান খোঁজা: assets/music/ এ song1.mp3, song2.mp3, song3.mp3 … ক্রমানুসারে (যেখানে থামে সেখানেই শেষ) */
function findSongs(){
    var list = [];
    function next(n){
        if (n > 60) return Promise.resolve(list);
        return fetch(BASE + 'song' + n + '.mp3', { method: 'HEAD' }).then(function(r){
            if (!r.ok) return list;
            list.push({ file: 'song' + n + '.mp3', title: 'গান ' + n });
            return next(n + 1);
        }).catch(function(){ return list; });
    }
    return next(1);
}
function boot(){
    findSongs().then(function(songs){
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
