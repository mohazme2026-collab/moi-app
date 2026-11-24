/* home/active.js — "এখন সক্রিয়": নিচের ডানের ছোট বাটন + চাপলে শিট
   ওপরে = আমি যাদের ফলো করি তারা কোন রুমে সক্রিয়; নিচে = সুপারিশকৃত অচেনা সক্রিয় ইউজার। নাম/ঢুকুন চাপলে ওই রুমে যায়। */
(function(){
    'use strict';
    const S = () => window.MOISync;
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const PH = n => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2d6a63"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#fff">' + esc(String(n || 'U').charAt(0).toUpperCase()) + '</text></svg>');
    const me = () => (window.MOIAuth && MOIAuth.profile && MOIAuth.profile.uid) ? MOIAuth.profile : null;
    const fkey = u => 'moi_follow_' + u + '_following';
    const hash = s => { let h = 0; s = String(s); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
    let host = null, back = null, sheet = null, data = null;

    function followingOf(u){ try { const v = S().get(fkey(u), []); return Array.isArray(v) ? v : Object.keys(v || {}); } catch(e){ return []; } }
    function userInfo(uid){
        let u = null; try { u = typeof getUser === 'function' ? getUser(uid) : null; } catch(e){}
        if (!u && window.DEMO && DEMO.USERS) u = DEMO.USERS[uid];
        return u ? { uid, name: u.name || 'User', photo: u.photo || u.avatar || '' } : null;
    }
    /* কে কোন রুমে আছে */
    function compute(){
        const p = me(); if (!p || typeof allRooms !== 'function') return null;
        const rooms = allRooms(), where = {};
        rooms.forEach(r => (r.uids || []).forEach(u => { if (u !== p.uid && !where[u]) where[u] = r; }));
        /* ডেমো: আসল উপস্থিতি কম থাকলে কয়েকজনকে এলোমেলো রুমে সক্রিয় দেখাই */
        let pool = []; try { pool = Object.keys((typeof getAllUsers === 'function' ? getAllUsers() : {}) || {}); } catch(e){}
        if (Object.keys(where).length < 6 && rooms.length){
            pool.filter(u => u !== p.uid).slice(0, 14).forEach(u => { if (!where[u]) where[u] = rooms[hash(u) % rooms.length]; });
        }
        const fol = followingOf(p.uid), act = [], sug = [];
        Object.keys(where).forEach(u => { const i = userInfo(u); if (!i) return; i.room = where[u]; (fol.indexOf(u) > -1 ? act : sug).push(i); });
        return { act, sug: sug.slice(0, 12), fol };
    }
    function css(){
        if (document.getElementById('actCss')) return;
        const s = document.createElement('style'); s.id = 'actCss';
        s.textContent = '#actPill{position:fixed;right:10px;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:30;background:rgba(20,20,28,.92);color:#fff;border:0;border-radius:20px;padding:3px 9px 3px 3px;display:flex;align-items:center;gap:6px;font:700 11px inherit;font-family:inherit;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.35);cursor:pointer}' +
            '#actPill .st{display:flex}#actPill .st img{width:22px;height:22px;border-radius:50%;object-fit:cover;border:2px solid #14141c;margin-left:-7px;background:#2d6a63}#actPill .st img:first-child{margin-left:0}' +
            '#actPill .dot{width:6px;height:6px;border-radius:50%;background:#2fd674;box-shadow:0 0 8px #2fd674}' +
            '#actBack{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:70;opacity:0;pointer-events:none;transition:opacity .2s}#actBack.on{opacity:1;pointer-events:auto}' +
            '#actSheet{position:fixed;left:0;right:0;bottom:0;max-height:72vh;z-index:71;background:#fff;color:#14141c;border-radius:26px 26px 0 0;padding:10px 16px calc(16px + env(safe-area-inset-bottom,0px));box-shadow:0 -10px 40px rgba(0,0,0,.3);overflow-y:auto;transform:translateY(105%);transition:transform .25s cubic-bezier(.2,.8,.2,1);max-width:480px;margin:0 auto}#actSheet.on{transform:none}' +
            '#actSheet .gr{width:44px;height:5px;border-radius:3px;background:#ddd;margin:0 auto 12px}#actSheet h3{margin:6px 0 8px;font-size:20px;font-weight:800}' +
            '#actSheet .sub{font-size:15px;font-weight:800;margin:14px 0 4px;color:#555}' +
            '.ar{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid #f0f0f0;cursor:pointer}' +
            '.ar .av{position:relative;width:50px;height:50px;flex:none}.ar .av img{width:100%;height:100%;border-radius:50%;object-fit:cover;background:#2d6a63}.ar .av b{position:absolute;right:0;bottom:0;width:13px;height:13px;border-radius:50%;background:#2fd674;border:2px solid #fff}' +
            '.ar .t{flex:1;min-width:0}.ar .n{font-weight:800;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ar .rm{font-size:12px;color:#7a7a8c;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
            '.ar .bt{padding:9px 16px;border-radius:20px;font-weight:800;font-size:13px;border:0;font-family:inherit;cursor:pointer}.ar .go{background:linear-gradient(180deg,#ffcf5a,#f0a21c);color:#3a2500}.ar .fl{background:#e6f2ff;color:#1573d0}.ar .fl.done{background:#eee;color:#888}' +
            '.aem{color:#b0b0bd;text-align:center;padding:14px 0;font-size:14px}';
        document.head.appendChild(s);
    }
    function rowHTML(i, kind){
        return '<div class="ar" data-rid="' + esc(i.room.id) + '" data-uid="' + esc(i.uid) + '"><div class="av"><img src="' + esc(i.photo || PH(i.name)) + '" alt="" onerror="this.onerror=null;this.src=\'' + PH(i.name) + '\'"><b></b></div><div class="t"><div class="n">' + esc(i.name) + '</div><div class="rm">● ' + (kind === 'act' ? 'রুমে আছে: ' : '') + esc(i.room.name) + '</div></div>' +
            (kind === 'act' ? '<button class="bt go">ঢুকুন</button>' : '<button class="bt fl" data-fl="' + esc(i.uid) + '">+ ফলো</button>') + '</div>';
    }
    function fillSheet(){
        data = compute() || { act: [], sug: [] };
        sheet.innerHTML = '<div class="gr"></div><h3>সক্রিয় ফলোইং</h3>' + (data.act.length ? data.act.map(i => rowHTML(i, 'act')).join('') : '<div class="aem">এখন কেউ সক্রিয় নেই</div>') +
            '<div class="sub">সুপারিশকৃত</div>' + (data.sug.length ? data.sug.map(i => rowHTML(i, 'sug')).join('') : '<div class="aem">কেউ নেই</div>');
    }
    function openSheet(){ fillSheet(); back.classList.add('on'); sheet.classList.add('on'); }
    function closeSheet(){ back.classList.remove('on'); sheet.classList.remove('on'); }
    function build(){
        css();
        host = document.createElement('button'); host.id = 'actPill'; host.hidden = true; host.setAttribute('aria-label', 'সক্রিয় ইউজার');
        back = document.createElement('div'); back.id = 'actBack'; sheet = document.createElement('div'); sheet.id = 'actSheet';
        document.body.appendChild(host); document.body.appendChild(back); document.body.appendChild(sheet);
        host.onclick = openSheet; back.onclick = closeSheet;
        sheet.addEventListener('click', e => {
            const f = e.target.closest('[data-fl]');
            if (f){ e.stopPropagation(); const p = me(); if (!p) return; const L = followingOf(p.uid); if (L.indexOf(f.dataset.fl) < 0){ L.push(f.dataset.fl); S().set(fkey(p.uid), L); } f.textContent = 'ফলো করছেন'; f.classList.add('done'); return; }
            const r = e.target.closest('.ar'); if (r && r.dataset.rid){ closeSheet(); if (typeof enterRoom === 'function') enterRoom(r.dataset.rid); }
        });
    }
    function refreshPill(){
        const d = compute(); if (!d){ host.hidden = true; return; }
        const list = d.act.length ? d.act : d.sug, n = list.length;
        if (!n){ host.hidden = true; return; }
        host.innerHTML = '<span class="st">' + list.slice(0, 2).map(i => '<img src="' + esc(i.photo || PH(i.name)) + '" alt="" onerror="this.onerror=null;this.src=\'' + PH(i.name) + '\'">').join('') + '</span><span class="dot"></span>সক্রিয় ' + n;
        host.hidden = false;
    }
    function init(n){
        if (!me() || typeof allRooms !== 'function'){ if (n < 80) setTimeout(() => init(n + 1), 400); return; }
        build(); refreshPill(); setInterval(refreshPill, 20000);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(0)); else init(0);
})();
