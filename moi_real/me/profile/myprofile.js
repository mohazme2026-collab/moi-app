/* me/myprofile.js — প্রোফাইল পেজ: নিজের তথ্য, ফলো সংখ্যা, CP/Special ঘর, Supporters */
(function(){
    'use strict';
    const $ = id => document.getElementById(id);
    const S = () => window.MOISync;
    const cnt = v => (Array.isArray(v) ? v.length : Object.keys(v || {}).length);
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const ph = n => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1d6b66"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#fff">' + String(n || 'U').charAt(0).toUpperCase() + '</text></svg>');
    let toastT = null;
    function toast(m){ const t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800); }
    const prof = () => { const p = window.MOIAuth && MOIAuth.profile; return p && p.uid ? p : null; };
    const users = () => S().get('moi_demo_users', {}) || {};
    function userOf(id){ const u = users()[id]; if (!u && S().wantUser) S().wantUser(id); return u || {}; }

    function age(b){
        const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(b || ''); if (!m) return null;
        const d = new Date(), a = d.getFullYear() - (+m[1]) - ((d.getMonth() + 1 < +m[2] || (d.getMonth() + 1 === +m[2] && d.getDate() < +m[3])) ? 1 : 0);
        return a >= 0 && a < 120 ? a : null;
    }
    const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

    function render(){
        const p = prof(); if (!p) return;
        const avatar = p.photo || ph(p.name), wall = (Array.isArray(p.photoWall) ? p.photoWall : []).filter(Boolean);
        $('pfAv').src = avatar; $('pfAv').onerror = function(){ this.onerror = null; this.src = ph(p.name); };
        const slides = wall.length ? wall : [avatar];
        $('cvTrack').innerHTML = slides.map(s => '<div class="cv-slide" style="background-image:url(\'' + String(s).replace(/'/g, '%27') + '\')"></div>').join('');
        $('cvDots').innerHTML = slides.length > 1 ? slides.map((_, i) => '<i class="' + (i ? '' : 'on') + '"></i>').join('') : '';
        $('pfName').textContent = p.name || 'User';
        /* লিঙ্গ + বয়স */
        const g = (p.gender || '').toLowerCase(), a = age(p.birthday);
        const sym = g === 'female' ? '<span class="g f">♀</span>' : g === 'male' ? '<span class="g">♂</span>' : '<span class="g p">⚥</span>';
        $('pfG').innerHTML = sym + (a != null ? a : '');
        const c = countryByName(p.country);
        $('pfCtry').innerHTML = c ? '<span class="fl">' + flagOf(c[1]) + '</span>' + c[1] : (p.country ? esc(p.country) : '');
        $('pfId').textContent = p.moiId || '——';
        /* লেভেল ব্যাজ: ধনী-লেভেল (ডায়মন্ড খরচ) আর চার্ম-লেভেল (গিফট পাওয়া) */
        const lv1 = Math.max(1, Number(p.level) || 1), lv2 = 1 + Math.floor(Math.sqrt((Number(p.giftsReceived) || 0) / 20));
        /* UID-র পাশে লেভেল ব্যাজ + নিচে একটাই লেভেল প্লেট (আগের দুই ব্যাজের জায়গায়) */
        $('pfLv').innerHTML = MOILv.badge(lv1, { h: 30 });
        $('lvRow').innerHTML = MOILv.plate(p);
        /* ফলো */
        $('nFollowing').textContent = cnt(S().get('moi_follow_' + p.uid + '_following', {}));
        $('nFollower').textContent = cnt(S().get('moi_follow_' + p.uid + '_followers', {}));
        /* Today's visitors: Visitor পেজ যে তালিকা ('moi_visitors_<uid>') বানায়, তার থেকে আজকের জন */
        { const vs = (window.ls_get ? ls_get('moi_visitors_' + p.uid, []) : S().get('moi_visitors_' + p.uid, [])) || [], t0 = new Date(); t0.setHours(0, 0, 0, 0);
          $('visN').textContent = (Array.isArray(vs) ? vs : []).filter(v => v && Number(v.ts) >= t0.getTime()).length; }
        relations(p, avatar);
    }

    /* CP ও Special ঘর (রুমের সম্পর্ক ব্যবস্থা থেকে) */
    function relations(p, avatar){
        if (window.CPUI && !$('cpHost').__m){ $('cpHost').__m = 1; CPUI.mount($('cpHost'), p.uid); }
        const frs = S().get('moi_rel_fr', {}) || {}, mine = [];
        Object.keys(frs).forEach(k => { const r = frs[k]; if (r && (r.a === p.uid || r.b === p.uid)) mine.push({ uid: r.a === p.uid ? r.b : r.a, type: r.type }); });
        let h = '';
        for (let i = 0; i < 6; i++){
            const m = mine[i];
            if (m){ const u = userOf(m.uid); h += '<div class="slot"><img src="' + esc(u.photo || ph(u.name)) + '" alt=""><span>' + esc(u.name || '') + '<br>' + esc(m.type || '') + '</span></div>'; }
            else h += '<button class="slot" data-plus="1">+</button>';
        }
        $('slots').innerHTML = h;
        document.querySelectorAll('.slot[data-plus]').forEach(b => b.onclick = () => toast('রুমে কারো প্রোফাইল থেকে বন্ধুত্বের অনুরোধ পাঠান'));
    }

    /* Supporters — যারা আমাকে সবচেয়ে বেশি গিফট দিয়েছে */
    async function supporters(){
        const p = prof(); if (!p) return;
        let list = [];
        try {
            const s = await MOIFB.rtdb.ref(MOIFB.LIVE + '/supporters/' + p.uid).get(), v = s.val() || {};
            list = Object.keys(v).map(k => Object.assign({ uid: k }, v[k])).sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, 3);
        } catch(e){}
        $('tiles').innerHTML = [1, 2, 3].map(i => { const u = list[i - 1];
            return '<div class="tile t' + i + (u ? '' : ' empty') + '"><b>Top' + i + '</b><img src="' + esc(u ? (u.photo || ph(u.name)) : ph('?')) + '" alt="" onerror="this.onerror=null;this.src=\'' + ph(u && u.name) + '\'"></div>';
        }).join('');
    }

    function copyId(){
        const id = ($('pfId').textContent || '').trim(); if (!id || id === '——') return;
        const done = () => toast('ID কপি হয়েছে');
        try { navigator.clipboard.writeText(id).then(done, fb); } catch(e){ fb(); }
        function fb(){ const t = document.createElement('textarea'); t.value = id; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch(e){} t.remove(); done(); }
    }

    function init(){
        render(); supporters();
        [1200, 2600, 4500].forEach(t => setTimeout(() => { render(); supporters(); }, t));     /* ডেমো ডেটা বসার পরে আবার */
        $('cvTrack').addEventListener('scroll', () => {
            const t = $('cvTrack'), i = Math.round(t.scrollLeft / t.clientWidth);
            [].forEach.call($('cvDots').children, (d, k) => d.classList.toggle('on', k === i));
        });
        $('bBack').onclick = () => { if (document.referrer && /\/me\//.test(document.referrer) && history.length > 1) history.back(); else location.href = '../index.html'; };
        $('bEdit').onclick = () => { location.href = 'edit.html'; };
        $('bAll').onclick = () => { location.href = 'contrib.html'; };
        $('bCopy').onclick = copyId;
        $('bMsg').onclick = () => { location.href = '../../home/index.html?chat=1'; };
        $('bRoom').onclick = () => {
            const p = prof(), rid = p && (p.myRoomId || p.myRoomUid);
            if (rid) location.href = '../../room/index.html?room=' + encodeURIComponent(rid); else toast('আপনার এখনও কোনো রুম নেই — হোম থেকে "নতুন রুম" বানান');
        };
        /* Following / Follower-এ টিপলে ফলো তালিকার পেজ (me/follow.js) */
        document.querySelectorAll('.fst').forEach(b => b.onclick = () => { if (window.MOIFollow) MOIFollow.open(b.dataset.k === 'follower' ? 'followers' : 'following'); });
        window.addEventListener('moi:sync', e => {
            const k = (e.detail && e.detail.key) || '';
            if (/^moi_(follow|rel_|visitors)/.test(k) || k === 'moi_demo_users') render();
        });
        setInterval(() => { render(); supporters(); }, 6000);
    }
    (window.MOIReady || Promise.resolve()).then(() => { try { init(); } catch(e){ console.error('[profile]', e); } });
})();
