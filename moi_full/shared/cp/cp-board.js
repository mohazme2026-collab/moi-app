/* shared/cp/cp-board.js — CP বোর্ড আঁকে (শুধু ছবি/অ্যানিমেশন; ডেটা আনা cp-ui.js-এ)।
   CPBoard.html({ me:{name,avatar,gender}, partner:{...}|null, level, since, mine, prog:{cur,need} }) → HTML স্ট্রিং
   লেভেল: ২০০ 💎 থেকে শুরু, প্রতি লেভেলে ১৫% করে বেশি (CPBoard.cost)। বাচ্চা ১০ লেভেল থেকে। */
(function(){
    'use strict';
    var DIR = (document.currentScript && document.currentScript.src ? document.currentScript.src.replace(/[^\/]*$/, '') : 'shared/cp/');
    var MAXLV = 50;
    var STAGES = [ { lv: 10, k: 'kid1' }, { lv: 20, k: 'kid2' }, { lv: 30, k: 'kid3' }, { lv: 40, k: 'kid4' }, { lv: 50, k: 'kid5' } ];
    /* Lv.(n-1) → Lv.n এ উঠতে কত 💎 */
    function cost(n){ return Math.round(200 * (1 + 0.15 * (n - 1)) / 10) * 10; }
    function levelOf(pts){
        pts = Math.max(0, pts | 0); var lv = 0, used = 0;
        while (lv < MAXLV && pts >= used + cost(lv + 1)){ used += cost(lv + 1); lv++; }
        var need = lv >= MAXLV ? 0 : cost(lv + 1);
        return { lv: lv, cur: pts - used, need: need };
    }
    function img(n, cls, st){ return '<img class="l ' + (cls || '') + '" src="' + DIR + n + '.png" alt="" style="' + (st || '') + '">'; }
    function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]; }); }
    var DEF = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#6b2a5a"/><circle cx="40" cy="30" r="14" fill="#e9b3d6"/><path d="M12 76c4-20 20-24 28-24s24 4 28 24z" fill="#e9b3d6"/></svg>');
    function avatar(x, y, u, ringImg, plus){
        var h = '<div class="av ' + (u ? '' : 'empty') + '"' + (!u && plus ? ' data-cpx="plus"' : '') + ' style="left:' + (x - 4.7) + '%;top:' + (y - 8.35) + '%;width:9.4%">' + (u ? '<img src="' + esc(u.avatar || DEF) + '" alt="" onerror="this.onerror=null;this.src=\'' + DEF + '\'">' : '+') + '</div>';
        h += '<img class="l ring" src="' + DIR + ringImg + '.png" alt="" style="left:' + (x - 5.5) + '%;top:' + (y - 9.3) + '%;width:10.8%">';
        h += '<div class="nm" style="left:' + (x < 50 ? 9.2 : 67.8) + '%;top:92%">' + esc(u ? u.name : 'Invite') + '</div>';
        return h;
    }
    function html(o){
        var lvl = Math.max(0, o.level | 0), has = !!o.partner, mine = !!o.mine;
        /* মেয়ে সবসময় বামে (গোলাপি), ছেলে ডানে (নীল) */
        var g = (o.me && o.me.gender) === 'm' ? 'm' : 'f';
        var L = has ? (g === 'f' ? o.me : o.partner) : (g === 'f' ? o.me : null);
        var R = has ? (g === 'm' ? o.me : o.partner) : (g === 'm' ? o.me : null);
        var h = '<div class="cpb' + (has ? ' has' : '') + '">' + img('frame', 'fr');
        h += '<i class="l rays"></i><i class="l glow gl"></i><i class="l glow gr"></i>';
        h += img('girl', 'girl' + (L ? '' : ' ghost'), 'left:10.5%;top:15.5%;width:18.3%') + img('boy', 'boy' + (R ? '' : ' ghost'), 'left:72%;top:15.5%;width:14.7%');
        h += avatar(24.6, 10.7, L, 'ring_pink', mine && !L) + avatar(75.7, 10.7, R, 'ring_blue', mine && !R);
        h += '<div class="l orbit"><i></i><i></i><i></i><i></i></div>' + img('cp_badge', 'badge', 'left:33.4%;top:1.2%;width:33.2%');
        h += '<div class="l lvp" style="left:30.6%;top:31.5%;width:38.8%;height:16%;--m:url(' + DIR + 'lv_pill.png)">' + img('lv_pill', '', 'position:static;width:100%') + '</div>';
        h += '<div class="lvt' + (has ? '' : ' off') + '" data-lv="' + lvl + '">Lv.' + lvl + '</div>';
        if (has && o.prog){
            var pc = o.prog.need ? Math.min(100, Math.round(o.prog.cur / o.prog.need * 100)) : 100;
            h += '<div class="pg"><b style="width:' + pc + '%"></b><span>' + (o.prog.need ? o.prog.cur + ' / ' + o.prog.need + ' 💎' : 'MAX') + '</span></div>';
        }
        h += '<div class="kp"><div class="ks">';
        STAGES.forEach(function(s, i){
            var open = has && lvl >= s.lv;
            var cur = open && (i === STAGES.length - 1 || lvl < STAGES[i + 1].lv);
            h += '<div class="kc' + (open ? '' : ' lock') + (cur ? ' cur' : '') + '" style="--d:' + (i * .35) + 's">' + (open ? '' : '<span class="lk">🔒</span>') + '<img class="k" src="' + DIR + s.k + '.png" alt=""><span class="pl"><img src="' + DIR + 'pill.png" alt=""><b>Lv.' + s.lv + '</b></span></div>';
        });
        h += '</div></div>';
        if (!has && mine) h += '<div class="inv" data-cpx="plus">' + img('invite', '', 'position:static;width:100%') + '</div>';
        else if (has) h += '<div class="l tog">❤ ' + esc(o.since || 'Together') + '</div>';
        [[17, 30, 0], [83, 28, .8], [34, 64, 1.5], [66, 60, .4], [50, 24, 1.1], [10, 52, 1.9], [90, 50, 2.2], [26, 44, 2.8], [74, 40, 1.3]].forEach(function(p){ h += '<i class="sp" style="left:' + p[0] + '%;top:' + p[1] + '%;--d:' + p[2] + 's"></i>'; });
        [[28, 0], [46, 1.7], [62, 3.3], [74, .9], [38, 2.4]].forEach(function(p, i){ h += '<img class="fh" src="' + DIR + (i % 2 ? 'heart_s3' : 'heart_s1') + '.png" alt="" style="left:' + p[0] + '%;--d:' + p[1] + 's">'; });
        return h + '</div>';
    }
    function render(el, o){ el.innerHTML = html(o); }
    window.CPBoard = { html: html, render: render, cost: cost, levelOf: levelOf, STAGES: STAGES, MAXLV: MAXLV };
})();
