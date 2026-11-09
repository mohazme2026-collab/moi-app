/* me/contrib.js — Contribution: কে আমাকে সবচেয়ে বেশি ডায়মন্ড গিফট দিয়েছে (১ম–৩য় মঞ্চে, বাকিরা তালিকায়) */
(function(){
    'use strict';
    const $ = id => document.getElementById(id);
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const ph = n => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#6b3d0c"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#fff">' + String(n || 'U').charAt(0).toUpperCase() + '</text></svg>');
    const fmt = n => { n = Number(n) || 0; return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n); };
    const img = (u, cls) => '<img class="' + cls + '" src="' + esc(u.photo || ph(u.name)) + '" alt="" onerror="this.onerror=null;this.src=\'' + ph(u.name) + '\'">';
    const D = MeArt.diamond;

    function pod(u, rank){
        return '<div class="pod p' + rank + '"><div class="wrap">' + img(u, 'av') + MeArt.rankFrame(rank) + '</div>' +
            '<div class="nm">' + esc(u.name || 'User') + '</div><div class="amt">' + D(20) + fmt(u.amount) + '</div>' + MeArt.medals(u.uid) + '</div>';
    }
    async function load(){
        const p = window.MOIAuth && MOIAuth.profile; if (!p) return;
        let list = [];
        try {
            const s = await MOIFB.rtdb.ref(MOIFB.LIVE + '/supporters/' + p.uid).get(), v = s.val() || {};
            list = Object.keys(v).map(k => Object.assign({ uid: k }, v[k])).sort((a, b) => (b.amount || 0) - (a.amount || 0));
        } catch(e){}
        if (!list.length){ $('stage').innerHTML = ''; $('rows').innerHTML = '<div class="empty">এখনও কেউ আপনাকে গিফট দেয়নি</div>'; return; }
        let st = '';
        const sp = [[14, 20], [86, 14], [28, 62], [74, 48], [48, 8], [8, 52], [92, 66]];
        sp.forEach((x, i) => { st += '<i class="sp" style="left:' + x[0] + '%;top:' + x[1] + '%;animation-delay:' + (i * .3) + 's">✦</i>'; });
        if (list[1]) st += pod(list[1], 2);
        if (list[2]) st += pod(list[2], 3);
        st += pod(list[0], 1);
        $('stage').innerHTML = st;
        $('rows').innerHTML = list.slice(3).map((u, i) =>
            '<div class="rw"><span class="rk">' + (i + 4) + '</span><span class="ph">' + img(u, '') + '</span><div class="tx"><b>' + esc(u.name || 'User') + '</b>' + MeArt.medals(u.uid) + '</div><span class="am">' + D(20) + fmt(u.amount) + '</span></div>').join('');
    }
    $('bBack').onclick = () => { if (history.length > 1) history.back(); else location.href = 'myprofile.html'; };
    (window.MOIReady || Promise.resolve()).then(() => { load(); setInterval(load, 8000); });
})();
