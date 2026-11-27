/* me/visitor/visitor.js — Visitors / Viewed পেজ
   ▸ Visitors = যারা আমার প্রোফাইলে টাচ করেছে  (ls_get('moi_visitors_<আমার uid>'))
   ▸ Viewed   = আমি যাদের প্রোফাইলে টাচ করেছি    (ls_get('moi_viewed_<আমার uid>'))
   প্রতিটা সারি: { uid, name, photo, gender, birthday, level, ts }  — লেখার কাজ room/moi-friend.js করে */
(function(){
    'use strict';
    const $ = id => document.getElementById(id);
    const ME = '../index.html';   /* visitor ফোল্ডার me-এর ভিতরে, তাই এক ধাপ উপরে = Me পেজ */

    $('vsBack').addEventListener('click', () => { if (document.referrer && history.length > 1) history.back(); else location.href = ME; });

    let tab = 'visitors';
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    const ph = n => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2d6a63"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#fff">' + String(n || 'U').charAt(0).toUpperCase().replace(/[<>&]/g, '') + '</text></svg>');
    function myUid(){
        const p = window.MOIAuth && MOIAuth.profile; if (p && p.uid) return p.uid;
        try { return (JSON.parse(localStorage.getItem('moi_user')) || {}).uid || ''; } catch(e){ return ''; }
    }
    function tint(n){
        if (n < 10) return '#1fae63'; if (n < 20) return '#17a3b8'; if (n < 30) return '#2a86e8'; if (n < 40) return '#2358d6';
        if (n < 50) return '#3b63d9'; if (n < 60) return '#6a3fd0'; if (n < 70) return '#8a35c9'; if (n < 80) return '#c42a95'; if (n < 90) return '#d62a4a'; return '#e8741c';
    }
    function age(b){
        if (!b) return ''; const d = new Date(b); if (isNaN(d)) return '';
        const n = new Date(); let a = n.getFullYear() - d.getFullYear();
        if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
        return a > 0 && a < 120 ? a : '';
    }
    const dateStr = ts => { const d = new Date(ts || Date.now()); return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

    function rowHTML(x){
        const g = String(x.gender || '').toLowerCase(), a = age(x.birthday), isF = g === 'female' || g === 'f', isM = g === 'male' || g === 'm';
        const chip = (isF || isM) ? '<span class="vs-g ' + (isF ? 'f' : 'm') + (a === '' ? ' nonum' : '') + '"><u>' + (isF ? '♀' : '♂') + '</u>' + (a === '' ? '' : a) + '</span>' : '';
        const lv = Math.max(1, Number(x.level) || 1);
        return '<div class="vs-row"><img class="vs-av" src="' + esc(x.photo || ph(x.name)) + '" alt="" onerror="this.onerror=null;this.src=\'' + ph(x.name) + '\'">' +
               '<div class="vs-info"><div class="vs-name">' + esc(x.name || 'User') + '</div>' +
               '<div class="vs-meta">' + chip + '<span class="vs-lv" style="--bc:' + tint(lv) + '"><i></i><b>' + lv + '</b></span></div>' +
               '<div class="vs-date">' + dateStr(x.ts) + '</div></div></div>';
    }
    function render(){
        const uid = myUid(); let list = [];
        if (uid) { try { list = ls_get((tab === 'visitors' ? 'moi_visitors_' : 'moi_viewed_') + uid, []) || []; } catch(e){ list = []; } }
        list = list.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
        $('vsList').innerHTML = list.map(rowHTML).join('');
        $('vsEmpty').classList.toggle('show', !list.length);
    }

    document.querySelectorAll('.vs-tab').forEach(t => t.addEventListener('click', () => {
        tab = t.dataset.tab;
        document.querySelectorAll('.vs-tab').forEach(x => x.classList.toggle('on', x === t));
        render();
    }));

    function init(){
        render();
        window.addEventListener('moi:sync', e => { const k = (e.detail && e.detail.key) || ''; if (/^moi_(visitors|viewed)_/.test(k)) render(); });
        window.addEventListener('storage', e => { if (e.key && /^moi_(visitors|viewed)_/.test(e.key)) render(); });
        document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
    }
    (window.MOIReady || Promise.resolve()).then(() => { try { init(); } catch(e){ console.error('[Visitor]', e); } });
})();
