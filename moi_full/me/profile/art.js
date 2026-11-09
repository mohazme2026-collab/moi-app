/* me/art.js — ছোট ছোট ছবির কোড (SVG): ডায়মন্ড আইকন, লেভেল ব্যাজ, মেডেল, র‍্যাংক ফ্রেম
   প্রোফাইল পেজ আর Contribution পেজ দুটোই এখান থেকে নেয় */
(function(){
    'use strict';
    let uid = 0; const nid = p => p + (++uid);

    /* ডায়মন্ড আইকন (কয়েনের জায়গায়) */
    function diamond(size){
        const a = nid('dg');
        return '<svg width="' + (size || 18) + '" height="' + (size || 18) + '" viewBox="0 0 24 24" style="flex:0 0 auto;vertical-align:middle"><defs><linearGradient id="' + a + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9fbff"/><stop offset=".4" stop-color="#5fd0ff"/><stop offset="1" stop-color="#1877e0"/></linearGradient></defs>' +
            '<path d="M12 2.5l8.5 6.5L12 21.5 3.5 9z" fill="url(#' + a + ')" stroke="#d9f5ff" stroke-width="1" stroke-linejoin="round"/><path d="M3.5 9h17M8.5 9L12 2.500 15.500 9 12 21.500z" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".8" stroke-linejoin="round"/></svg>';
    }

    /* লেভেল ব্যাজ (ঢাল + ডানা + সংখ্যা) */
    const LV = { blue: ['#bfe6ff', '#4aa7ff', '#1b55c8'], gold: ['#fff1b0', '#f1c243', '#a8680a'], purple: ['#e6c9ff', '#a35cff', '#5a21b8'] };
    function levelBadge(n, kind){
        const c = LV[kind] || LV.blue, a = nid('lv');
        return '<svg class="lvb" viewBox="0 0 60 56" aria-hidden="true"><defs><linearGradient id="' + a + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".5" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></linearGradient></defs>' +
            '<path d="M30 8C22 8 12 9 2 3c1 12 6 19 14 22-6 0-10-1-13-3 3 9 11 14 22 14z" fill="#e8f6ff" opacity=".9"/><path d="M30 8c8 0 18 1 28-5-1 12-6 19-14 22 6 0 10-1 13-3-3 9-11 14-22 14z" fill="#e8f6ff" opacity=".9"/>' +
            '<path d="M30 4l17 7v17c0 10-7 18-17 22C20 46 13 38 13 28V11z" fill="url(#' + a + ')" stroke="#fff6cf" stroke-width="2" stroke-linejoin="round"/>' +
            '<path d="M30 9l12 5v13c0 7-5 13-12 16-7-3-12-9-12-16V14z" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>' +
            '<text x="30" y="33" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-size="17" font-weight="800" fill="#fff" stroke="#0a2a66" stroke-width="2.4" paint-order="stroke">' + n + '</text></svg>';
    }

    /* ছোট মেডেল (ইউজারের পাশে ৩–৫টা) — ইউজার আইডি থেকে একই রকম রঙ আসে */
    const MC = [['#ffe9a0', '#f3b21f', '#9a5a05'], ['#e5c8ff', '#a65bff', '#5a20b5'], ['#c8f1ff', '#42b6ff', '#1457c4'], ['#ffd1c8', '#ff6a4d', '#a3200f'], ['#d3ffd9', '#3fd170', '#0b7a34'], ['#ffd6f0', '#ff5cb3', '#9f1569']];
    function hash(s){ let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
    function medal(i){
        const c = MC[i % MC.length], a = nid('md'), sym = ['★', '♛', '✦', '❖', '♥', '✪'][i % 6];
        return '<svg class="mdl" viewBox="0 0 28 28" aria-hidden="true"><defs><radialGradient id="' + a + '" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".55" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></radialGradient></defs>' +
            '<path d="M14 1.5l10 4.5v9.500c0 5.500-4.200 9.500-10 11.500C8.200 25 4 21 4 15.500V6z" fill="url(#' + a + ')" stroke="#fff4c4" stroke-width="1.2" stroke-linejoin="round"/><text x="14" y="17" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" stroke="#00000066" stroke-width=".6">' + sym + '</text></svg>';
    }
    function medals(seed, n){
        const h = hash(seed), k = n || (3 + (h % 3)); let out = '';
        for (let i = 0; i < k; i++) out += medal(((h >>> (i * 3)) + i) >>> 0);
        return '<span class="mdls">' + out + '</span>';
    }

    /* র‍্যাংক ফ্রেম (১ম = সোনালি, ২য় = নীল-বেগুনি, ৩য় = তামা-গোলাপি) */
    const RK = {
        1: { rim: ['#fff3b8', '#f2c744', '#8a5606'], wing: ['#fff7d6', '#f4cf63', '#b9780f'], crown: ['#ff7a8a', '#d3263d', '#7d0f1f'], glow: '#ffd54a' },
        2: { rim: ['#e8ecff', '#8f8cff', '#4a3fb8'], wing: ['#f1f3ff', '#aeb4ff', '#5a63d6'], crown: ['#c9a2ff', '#7e4de0', '#3d1a96'], glow: '#9aa2ff' },
        3: { rim: ['#ffe2cf', '#e58a5a', '#8a3a15'], wing: ['#fff0e6', '#f2b08c', '#b9602f'], crown: ['#ffb27a', '#e0662a', '#8a3010'], glow: '#ffa36b' }
    };
    function feather(ang, L, W, id){
        return '<g transform="translate(56 112) rotate(' + ang + ')"><path d="M0 0C' + (-L * .35) + ' ' + (-W) + ' ' + (-L * .8) + ' ' + (-W * .9) + ' ' + (-L) + ' 0C' + (-L * .75) + ' ' + (W * .4) + ' ' + (-L * .35) + ' ' + (W * .5) + ' 0 ' + (W * .35) + 'Z" fill="url(#' + id + ')" stroke="#ffffff66" stroke-width=".6"/></g>';
    }
    function rankFrame(rank){
        const c = RK[rank] || RK[1], w = nid('wg'), r = nid('rm'), cr = nid('cw'), gl = nid('gl');
        const specs = [[-8, 74, 15], [-24, 70, 14], [-40, 64, 13], [-56, 54, 12], [-72, 42, 10]];
        let L = '', R = '';
        specs.forEach(s => { L += feather(s[0] - 90 + 90, s[1], s[2], w); R += feather(s[0] - 90 + 90, s[1], s[2], w); });
        return '<svg class="rkf" viewBox="0 0 200 200" style="overflow:visible" aria-hidden="true"><defs>' +
            '<linearGradient id="' + w + '" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="' + c.wing[0] + '"/><stop offset=".55" stop-color="' + c.wing[1] + '"/><stop offset="1" stop-color="' + c.wing[2] + '"/></linearGradient>' +
            '<linearGradient id="' + r + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c.rim[0] + '"/><stop offset=".5" stop-color="' + c.rim[1] + '"/><stop offset="1" stop-color="' + c.rim[2] + '"/></linearGradient>' +
            '<linearGradient id="' + cr + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c.crown[0] + '"/><stop offset=".6" stop-color="' + c.crown[1] + '"/><stop offset="1" stop-color="' + c.crown[2] + '"/></linearGradient>' +
            '<radialGradient id="' + gl + '" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="' + c.glow + '" stop-opacity=".55"/><stop offset="1" stop-color="' + c.glow + '" stop-opacity="0"/></radialGradient></defs>' +
            '<circle cx="100" cy="106" r="98" fill="url(#' + gl + ')"/>' +
            '<g>' + L + '</g><g transform="translate(200 0) scale(-1 1)">' + R + '</g>' +
            '<circle cx="100" cy="112" r="50" fill="none" stroke="url(#' + r + ')" stroke-width="9"/><circle cx="100" cy="112" r="44" fill="none" stroke="#3a2200" stroke-opacity=".55" stroke-width="2"/>' +
            '<path d="M74 62 L77 38 L88 50 L100 30 L112 50 L123 38 L126 62 Z" fill="url(#' + cr + ')" stroke="' + c.rim[2] + '" stroke-width="1.5" stroke-linejoin="round"/><rect x="74" y="60" width="52" height="8" rx="3" fill="url(#' + r + ')" stroke="' + c.rim[2] + '" stroke-width="1"/>' +
            '<circle cx="77" cy="36" r="3.4" fill="#fff" opacity=".9"/><circle cx="100" cy="28" r="3.8" fill="#fff" opacity=".95"/><circle cx="123" cy="36" r="3.4" fill="#fff" opacity=".9"/>' +
            '<path d="M82 160 L100 172 L118 160 L118 178 L100 190 L82 178 Z" fill="url(#' + r + ')" stroke="' + c.rim[2] + '" stroke-width="1.5" stroke-linejoin="round"/>' +
            '<text x="100" y="180" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-size="22" font-weight="800" fill="#fff" stroke="' + c.rim[2] + '" stroke-width="3" paint-order="stroke">' + rank + '</text></svg>';
    }

    window.MeArt = { diamond, levelBadge, medals, rankFrame, hash };
})();
