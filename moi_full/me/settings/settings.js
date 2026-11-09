/* me/settings.js — সেটিংস পেজ (Me পেজের উপরের গিয়ার বাটনে টিপলে খোলে)
   ভিতরে: Blacklist · Language · Clear Chat History · Clear Cache · Delete Account · About · Privacy Policy
          Account Switching · Sign Out · Theme (থিম বদলানোর প্যানেল — সবার নিচে)
   লেখা অনুবাদ আসে me/i18n.js থেকে (MOII18N.t) */
(function(){
    'use strict';

    /* ═══ ⚙️ সেটিংস (এখান থেকে বদলান) ═══ */
    const APP_NAME = 'MOI';                    /* অ্যাপের নাম — About, ডায়ালগ ও পলিসিতে বসে */
    const APP_VERSION = '1.0.0';               /* অ্যাপের ভার্সন — About পেজে দেখায় */
    const CONTACT_EMAIL = 'support@example.com';   /* ⚠️ প্রাইভেসি পলিসির যোগাযোগের ইমেইল — আপনার আসল ইমেইল বসান */
    const DELETE_WAIT_SEC = 30;                /* অ্যাকাউন্ট ডিলিটের বাটন কত সেকেন্ড পর চালু হবে */

    const T = k => (window.MOII18N ? MOII18N.t(k) : k);
    const S = () => window.MOISync;
    const AUTH_KEY = 'moi_demo_auth_v1';       /* ডেমো লগইনের সেশন (অ্যাকাউন্ট বদলাতে লাগে) */
    const ACC_KEY = 'moi_accounts';            /* এই ফোনে মনে রাখা অ্যাকাউন্টের তালিকা */
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const PH = n => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2d6a63"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#fff">' + esc(String(n || 'U').charAt(0).toUpperCase()) + '</text></svg>');
    const profile = () => (window.MOIAuth && MOIAuth.profile && MOIAuth.profile.uid) ? MOIAuth.profile : null;
    const CHEV = '<svg class="st-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';
    const BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';

    /* ═══ ডেটার কাজ ═══ */
    function userInfo(uid){
        let u = null; try { u = window.getUser ? getUser(uid) : null; } catch(e){}
        const d = (window.DEMO && DEMO.USERS && DEMO.USERS[uid]) || {};
        u = u || d;
        return { uid, name: u.name || d.name || 'User', photo: u.photo || u.avatar || d.photo || '', moiId: u.moiId || d.moiId || String(uid).slice(0, 10) };
    }
    const blockedIds = () => {
        const p = profile(); if (!p) return [];
        const b = S().get('moi_blocked_' + p.uid, {}) || {};
        return Array.isArray(b) ? b.slice() : Object.keys(b).filter(k => b[k]);
    };
    function accounts(){ try { return JSON.parse(localStorage.getItem(ACC_KEY) || '[]') || []; } catch(e){ return []; } }
    function saveAccounts(a){ try { localStorage.setItem(ACC_KEY, JSON.stringify(a)); } catch(e){} }
    /* এখন যে অ্যাকাউন্টে আছি সেটা তালিকায় রাখা (অ্যাকাউন্ট বদলাতে পরে কাজে লাগে) */
    function recordCurrent(){
        const p = profile(); if (!p) return;
        let auth = null; try { auth = localStorage.getItem(AUTH_KEY); } catch(e){}
        const list = accounts().filter(a => a.uid !== p.uid);
        list.unshift({ uid: p.uid, name: p.name || 'User', photo: p.photo || '', moiId: p.moiId || '', auth });
        saveAccounts(list.slice(0, 8));
    }
    const fmtBytes = b => b < 1024 ? '0 K' : (b < 1048576 ? (b / 1024).toFixed(b < 10240 ? 1 : 0) + ' K' : (b / 1048576).toFixed(1) + ' M');
    const CACHE_KEY_RE = /^(moi_cache_|moi_tmp_|moi_img_|moi_lottie_)|_cache$/;
    /* ক্যাশের সাইজ: ব্রাউজার ক্যাশ স্টোরেজ + সেশন ডেটা + অস্থায়ী কী। (ডেমো ডেটাবেস, লগইন ও আপনার সেটিংস এর মধ্যে পড়ে না) */
    async function cacheBytes(){
        let b = 0;
        try { if (window.caches){ for (const n of await caches.keys()){ const c = await caches.open(n); for (const r of await c.keys()){ const res = await c.match(r); if (res){ b += (await res.clone().blob()).size; } } } } } catch(e){}
        try { for (let i = 0; i < sessionStorage.length; i++){ const k = sessionStorage.key(i); b += (k.length + (sessionStorage.getItem(k) || '').length) * 2; } } catch(e){}
        try { Object.keys(localStorage).forEach(k => { if (CACHE_KEY_RE.test(k)) b += (k.length + (localStorage.getItem(k) || '').length) * 2; }); } catch(e){}
        return b;
    }
    async function clearCacheNow(){
        const before = await cacheBytes();
        try { if (window.caches){ for (const n of await caches.keys()) await caches.delete(n); } } catch(e){}
        try { sessionStorage.clear(); } catch(e){}
        try { Object.keys(localStorage).forEach(k => { if (CACHE_KEY_RE.test(k)) localStorage.removeItem(k); }); } catch(e){}
        return before;
    }
    /* চ্যাট হিস্টরি: আমার সব কথোপকথনের মেসেজ মোছে; বন্ধু তালিকা ও ফলো যেমন আছে তেমন থাকে */
    function clearChatNow(){
        const p = profile(); if (!p) return;
        Object.keys(localStorage).forEach(k => {
            if (/^moi_chat_/.test(k) && !/^moi_chat_meta_/.test(k) && k.indexOf(p.uid) >= 0) localStorage.removeItem(k);
        });
        localStorage.removeItem('moi_chat_hidden_' + p.uid);
        const meta = S().get('moi_chat_meta_' + p.uid, {}) || {};
        Object.keys(meta).forEach(k => { if (meta[k] && typeof meta[k] === 'object'){ meta[k].lastMessage = ''; meta[k].lastTime = 0; meta[k].unread = 0; } });
        S().set('moi_chat_meta_' + p.uid, meta);
    }

    /* ═══ পেজের কাঠামো (স্ট্যাক: সেটিংস → ভিতরের পেজ) ═══ */
    let root = null, stack = [], depth = 0, toastT = null, delTimer = null;

    function toast(m){
        if (!root) return; const t = root.querySelector('.st-toast'); t.textContent = m; t.classList.add('show');
        clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800);
    }
    function head(title, right){
        return '<header class="st-top"><button class="st-back" data-act="back" aria-label="Back">' + BACK + '</button><div class="st-title">' + esc(title) + '</div><div class="st-right">' + (right || '') + '</div></header>';
    }
    function newPage(html, cls){
        const el = document.createElement('section'); el.className = 'st-pg ' + (cls || ''); el.innerHTML = html; return el;
    }
    function push(el){
        root.appendChild(el); stack.push(el);
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
        try { history.pushState({ moiSt: stack.length }, ''); depth++; } catch(e){}
    }
    function back(){
        if (depth > 0){ try { history.back(); return; } catch(e){} }
        popTop();
    }
    function popTop(){
        if (stack.length <= 1){ hideRoot(); return; }
        const el = stack.pop(); el.classList.remove('in');
        if (el._leave) el._leave();
        setTimeout(() => el.remove(), 260);
    }
    function hideRoot(){
        while (stack.length > 1){ const el = stack.pop(); if (el._leave) el._leave(); el.remove(); }
        root.classList.remove('show'); document.documentElement.classList.remove('st-lock');
    }

    function build(){
        root = document.createElement('div'); root.className = 'st'; root.id = 'stPage';
        root.innerHTML = '<div class="st-toast"></div><div class="st-modal" hidden></div>';
        document.body.appendChild(root);
        root.addEventListener('click', onClick);
        window.addEventListener('popstate', () => {
            if (!root || !root.classList.contains('show')) return;
            if (depth > 0) depth--;
            popTop();
        });
        window.addEventListener('moi:lang', () => { if (root && root.classList.contains('show')) renderMain(); });
    }

    /* ═══ প্রধান সেটিংস পেজ ═══ */
    function row(act, label, value){
        return '<button class="st-row" data-act="' + act + '"><span class="st-lb">' + esc(label) + '</span><span class="st-val">' + (value ? esc(value) : '') + '</span>' + CHEV + '</button>';
    }
    function themeCards(){
        const cur = window.getTheme ? getTheme() : 'light', TH = window.MOI_THEMES || {};
        const nm = { light: T('themeLight'), black: T('themeBlack'), pink: T('themePink') };
        return Object.keys(TH).map(k => '<button class="st-th' + (k === cur ? ' on' : '') + '" data-act="theme" data-k="' + k + '"><i style="background:' + TH[k].bg + ';border-color:' + (k === 'black' ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.18)') + '"><b style="background:' + TH[k].card + '"></b></i><span>' + esc(nm[k] || TH[k].name) + '</span></button>').join('');
    }
    function renderMain(){
        let main = stack[0];
        if (!main){ main = newPage('', 'main in'); root.insertBefore(main, root.firstChild); stack.push(main); }
        const sc = main.querySelector('.st-scroll') ? main.querySelector('.st-scroll').scrollTop : 0;
        root.setAttribute('dir', MOII18N.isRtl() ? 'rtl' : 'ltr');
        main.innerHTML = head(T('settings')) +
            '<div class="st-scroll"><div class="st-grp">' + row('blacklist', T('blacklist')) + row('language', T('language'), MOII18N.nameOf()) + '</div>' +
            '<div class="st-grp">' + row('clearchat', T('clearChat')) + row('clearcache', T('clearCache'), main._cache || '') + '</div>' +
            '<div class="st-grp">' + row('delete', T('deleteAccount')) + row('about', T('about')) + row('privacy', T('privacy')) + '</div>' +
            '<div class="st-btns"><button class="st-pill" data-act="switch">' + esc(T('switching')) + '</button><button class="st-pill" data-act="signout">' + esc(T('signOut')) + '</button></div>' +
            '<div class="st-theme"><div class="st-thh">' + esc(T('theme')) + '</div><div class="st-thr">' + themeCards() + '</div></div></div>';
        main.querySelector('.st-scroll').scrollTop = sc;
        cacheBytes().then(b => { main._cache = fmtBytes(b); const v = main.querySelector('[data-act="clearcache"] .st-val'); if (v) v.textContent = main._cache; });
    }

    /* ═══ ক্লিক হ্যান্ডলার ═══ */
    function onClick(e){
        const b = e.target.closest('[data-act]'); if (!b || !root.contains(b)) return;
        const a = b.dataset.act;
        if (a === 'back') return back();
        if (a === 'blacklist') return pageBlacklist();
        if (a === 'language') return pageLanguage();
        if (a === 'clearchat') return modal(T('clearChat'), T('confirmClearChat'), () => { clearChatNow(); toast(T('chatCleared')); });
        if (a === 'clearcache') return doClearCache();
        if (a === 'delete') return pageDelete();
        if (a === 'about') return pageAbout();
        if (a === 'privacy') return pagePrivacy();
        if (a === 'switch') return pageSwitch();
        if (a === 'signout') return modal(APP_NAME, T('signOut'), () => { recordCurrent(); MOIAuth.signOut(); });
        if (a === 'theme'){ if (window.setTheme) setTheme(b.dataset.k); root.querySelectorAll('.st-th').forEach(x => x.classList.toggle('on', x === b)); }
    }
    async function doClearCache(){
        await clearCacheNow(); toast(T('cacheCleared'));
        const main = stack[0]; if (main){ main._cache = fmtBytes(await cacheBytes()); const v = main.querySelector('[data-act="clearcache"] .st-val'); if (v) v.textContent = main._cache; }
    }

    /* কেন্দ্রের ছোট ডায়ালগ (Sign Out / Clear / Delete এর নিশ্চিতকরণ) */
    function modal(title, text, onOk){
        const m = root.querySelector('.st-modal'); m.hidden = false;
        m.innerHTML = '<div class="st-dlg"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p><div class="st-dbt"><button class="no" data-m="no">' + esc(T('cancel')) + '</button><button class="ok" data-m="ok">' + esc(T('confirm')) + '</button></div></div>';
        const close = () => { m.hidden = true; m.innerHTML = ''; };
        m.querySelector('[data-m="no"]').onclick = close;
        m.querySelector('[data-m="ok"]').onclick = () => { close(); onOk(); };
        m.onclick = e => { if (e.target === m) close(); };
    }

    /* ═══ Blacklist ═══ */
    function pageBlacklist(){
        const el = newPage('', 'sub'); push(el);
        const draw = () => {
            const ids = blockedIds();
            el.innerHTML = head(T('blacklist')) + '<div class="st-scroll">' + (ids.length ? ids.map(userInfo).map(u =>
                '<div class="st-user" data-u="' + esc(u.uid) + '"><img src="' + esc(u.photo || PH(u.name)) + '" onerror="this.onerror=null;this.src=\'' + PH(u.name) + '\'" alt=""><div class="tx"><b>' + esc(u.name) + '</b><span>' + esc(u.moiId) + '</span></div><button class="st-sm" data-act="unblock">' + esc(T('unblock')) + '</button></div>').join('')
                : '<div class="st-empty">' + esc(T('noBlocked')) + '</div>') + '</div>';
        };
        draw();
        el.addEventListener('click', ev => {
            const b = ev.target.closest('[data-act="unblock"]'); if (!b) return;
            const uid = b.closest('.st-user').dataset.u, p = profile(); if (!p) return;
            const k = 'moi_blocked_' + p.uid; let o = S().get(k, {}) || {};
            if (Array.isArray(o)) o = o.filter(x => x !== uid); else delete o[uid];
            S().set(k, o); toast(T('unblocked')); draw();
        });
        const sync = e => { const k = (e.detail && e.detail.key) || ''; if (/^moi_blocked_/.test(k)) draw(); };
        window.addEventListener('moi:sync', sync); el._leave = () => window.removeEventListener('moi:sync', sync);
    }

    /* ═══ Language ═══ */
    function pageLanguage(){
        let pick = MOII18N.lang;
        const el = newPage('', 'sub'); push(el);
        const draw = () => {
            el.innerHTML = head(T('language'), '<button class="st-save" data-act="savelang">' + esc(T('save')) + '</button>') + '<div class="st-scroll">' +
                MOII18N.LANGS.map(l => '<button class="st-lang" data-l="' + l.code + '"><span>' + esc(l.name) + '</span>' + (l.code === pick ? '<i class="st-ck"><svg viewBox="0 0 24 24" fill="none" stroke="#08331f" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></i>' : '') + '</button>').join('') + '</div>';
        };
        draw();
        el.addEventListener('click', ev => {
            const l = ev.target.closest('[data-l]');
            if (l){ pick = l.dataset.l; draw(); return; }
            if (ev.target.closest('[data-act="savelang"]')){
                MOII18N.set(pick); toast(T('saved'));
                setTimeout(back, 350);
            }
        });
    }

    /* ═══ Delete Account ═══ */
    const DELETE_TEXT = [
        'Account cancellation is permanent and cannot be undone. To protect your account, please read and confirm the agreement below carefully.',
        '1. All account information is deleted permanently, including posts, followers, following, friends, chats and personal data. After deletion you will not be able to log in, and your friends will no longer be able to contact you.',
        '2. Linked sign-in methods (phone number, Google, Facebook) are unlinked. After unlinking, you can register again and bind other ' + APP_NAME + ' accounts.',
        '3. Account assets are deleted permanently, including diamonds, coins, bag items, frames and crowns. There is no refund.',
        '4. Account rights and status are deleted permanently, including room owner or admin status, VIP/SVIP status, titles, rank and custom ID.',
        '5. The account you apply to cancel must be the one you registered and use yourself.',
        '6. You must have the right to cancel this account and must not violate the legitimate rights of any third party. You are responsible for any complaint or dispute that arises from this.',
        '7. Make sure your account is in a safe state and that you have not recently changed sensitive information such as your password or phone number.',
        '8. Make sure your account has no outstanding transactions or disputes, including complaints and reports. If your account is involved in a dispute while we process your request, we have the right to stop the cancellation.',
        '9. Cancelling the account does not remove any responsibility for actions taken before cancellation.',
        '10. After cancellation we stop providing services to you, in line with the User Agreement and Privacy Policy.'
    ];
    function pageDelete(){
        const p = profile(); if (!p) return;
        const el = newPage(head(T('cancelInfo')) + '<div class="st-scroll st-doc"><h2>' + esc(T('cancelInfo')) + '</h2>' +
            '<div class="st-card"><div>ID: ' + esc(p.moiId || p.uid) + '</div><div>' + esc(T('nickname')) + ': ' + esc(p.name || '') + '</div></div>' +
            '<div class="st-card">' + esc(DELETE_TEXT[0]) + '</div>' +
            '<div class="st-card">' + DELETE_TEXT.slice(1).map(x => '<p>' + esc(x) + '</p>').join('') + '</div></div>' +
            '<div class="st-foot"><button class="st-big" id="stDelBtn" disabled></button></div>', 'sub');
        push(el);
        const btn = el.querySelector('#stDelBtn'); let left = DELETE_WAIT_SEC;
        const tick = () => {
            if (left > 0){ btn.disabled = true; btn.textContent = T('riskBtn') + ' ' + left + 's'; left--; }
            else { btn.disabled = false; btn.classList.add('ready'); btn.textContent = T('riskBtn'); clearInterval(delTimer); delTimer = null; }
        };
        clearInterval(delTimer); tick(); delTimer = setInterval(tick, 1000);
        el._leave = () => { clearInterval(delTimer); delTimer = null; };
        btn.onclick = () => { if (btn.disabled) return; modal(APP_NAME, T('confirmDelete'), deleteAccountNow); };
    }
    async function deleteAccountNow(){
        const p = profile(); if (!p) return;
        const uid = p.uid, moiId = p.moiId;
        try {
            const d = window.MOIFB && MOIFB.db;
            if (d){ await d.collection('users').doc(uid).delete(); if (moiId) await d.collection('moiIds').doc(String(moiId)).delete().catch(() => {}); }
        } catch(e){ console.warn('[settings] delete', e); }
        saveAccounts(accounts().filter(a => a.uid !== uid));                       /* অ্যাকাউন্ট তালিকা থেকেও বাদ */
        try { Object.keys(localStorage).forEach(k => { if (k !== AUTH_KEY && k !== ACC_KEY && k !== 'moi_lang' && k !== 'moi_theme' && k !== 'moi_demo_db_v1' && k.indexOf(uid) >= 0) localStorage.removeItem(k); }); } catch(e){}
        try { await MOIAuth.signOut(); } catch(e){ location.href = '../login/index.html'; }
    }

    /* ═══ About ═══ */
    function pageAbout(){
        push(newPage(head(T('about')) + '<div class="st-scroll st-about"><div class="st-logo">' + esc(APP_NAME.charAt(0)) + '</div><h2>' + esc(APP_NAME) + '</h2><p>' + esc(T('version')) + ' ' + esc(APP_VERSION) + '</p></div>', 'sub'));
    }

    /* ═══ Privacy Policy (আপনার আসল পলিসি এলে নিচের লেখা বদলে দিন) ═══ */
    function pagePrivacy(){
        const A = esc(APP_NAME), M = esc(CONTACT_EMAIL);
        push(newPage(head(T('privacy')) + '<div class="st-scroll st-doc st-policy">' +
            '<p>This Privacy Policy explains how ' + A + ' (“we”, “us”, “our”) collects, uses and protects your personal information when you use the ' + A + ' app and related services (the “Platform”). Please read it carefully. If you have any questions, comments or suggestions, contact us at <a href="mailto:' + M + '">' + M + '</a>.</p>' +
            '<p>This Policy provides information about:</p><ol><li>How we collect and use personal information</li><li>How we use cookies and similar technologies</li><li>Analytics information</li><li>How we share your information</li><li>Your rights</li><li>The security of your information</li><li>Children’s privacy</li><li>Changes to this Policy</li><li>Contact us</li></ol>' +
            '<h3>1. How we collect and use personal information</h3><p>When you sign in with a phone number, Google or Facebook, we receive basic details such as your name, profile picture, email or phone number. We also store what you add to your profile (bio, country, gender, birthday), your activity on the Platform (rooms you join, gifts you send, chats, follows) and your in-app balances. We use this information to create and run your account, show your profile to other users, deliver messages and gifts, prevent fraud and abuse, and improve the Platform.</p>' +
            '<h3>2. Cookies and similar technologies</h3><p>We use local storage and similar technologies on your device to keep you signed in, remember your language and theme, and make the Platform load faster.</p>' +
            '<h3>3. Analytics information</h3><p>We may collect technical information such as device type, app version, language and crash reports to understand how the Platform is used and to fix problems.</p>' +
            '<h3>4. How we share your information</h3><p>Your public profile (name, picture, ID, level) is visible to other users. We do not sell your personal information. We may share information with service providers who help us run the Platform, or when required by law or to protect the rights and safety of our users and the Platform.</p>' +
            '<h3>5. Your rights</h3><p>You can view and edit your profile information, clear your chat history and cache, block other users, and delete your account from Settings. You may also contact us to request access to, or correction of, your personal information.</p>' +
            '<h3>6. The security of your information</h3><p>We use reasonable technical and organisational measures to protect your information. However, no method of transmission or storage is completely secure, so we cannot guarantee absolute security.</p>' +
            '<h3>7. Children’s privacy</h3><p>The Platform is not intended for children under the minimum age required by the laws of your country. If you believe a child has provided us with personal information, please contact us so we can remove it.</p>' +
            '<h3>8. Changes to this Policy</h3><p>We may update this Policy from time to time. When we do, we will update the version shown in the app. Continued use of the Platform after changes means you accept the updated Policy.</p>' +
            '<h3>9. Contact us</h3><p>' + A + ' — <a href="mailto:' + M + '">' + M + '</a></p></div>', 'sub'));
    }

    /* ═══ Account Switching ═══ */
    function pageSwitch(){
        recordCurrent();
        const p = profile(), el = newPage('', 'sub'); push(el);
        const draw = () => {
            el.innerHTML = head(T('switching')) + '<div class="st-scroll st-sw"><h2>' + esc(T('switchTitle')) + '</h2>' +
                accounts().map(a => '<button class="st-acc" data-uid="' + esc(a.uid) + '"><img src="' + esc(a.photo || PH(a.name)) + '" onerror="this.onerror=null;this.src=\'' + PH(a.name) + '\'" alt=""><div class="tx"><b>' + esc(a.name) + '</b><span>Id: ' + esc(a.moiId || a.uid) + '</span></div>' + (p && a.uid === p.uid ? '<em>' + esc(T('currentUse')) + ' <i></i></em>' : '') + '</button>').join('') +
                '<button class="st-acc add" data-act="addacc"><span class="plus">+</span><div class="tx"><b>' + esc(T('addAccount')) + '</b></div></button></div>';
        };
        draw();
        el.addEventListener('click', ev => {
            if (ev.target.closest('[data-act="back"]')) return;
            if (ev.target.closest('[data-act="addacc"]')){            /* নতুন অ্যাকাউন্টে ঢুকতে বর্তমানটা রেখে লগইন পেজে যায় */
                recordCurrent(); Promise.resolve(MOIAuth.signOut(true)).finally(() => { location.href = '../login/index.html'; }); return;
            }
            const a = ev.target.closest('.st-acc[data-uid]'); if (!a) return;
            const acc = accounts().find(x => x.uid === a.dataset.uid); if (!acc || (p && acc.uid === p.uid)) return;
            if (acc.auth){                                              /* ডেমো: ওই অ্যাকাউন্টের সেশন ফিরিয়ে হোমে যায় */
                try { localStorage.setItem(AUTH_KEY, acc.auth); localStorage.removeItem('moi_user'); } catch(e){}
                location.href = '../home/index.html';
            } else { MOIAuth.signOut(); }                               /* সেশন নেই → আবার লগইন করতে হবে */
        });
    }

    /* ═══ খোলা ═══ */
    function open(){
        if (!profile()) return;
        if (!root) build();
        recordCurrent();
        stack = stack.slice(0, 1); depth = 0;
        renderMain();
        root.classList.add('show'); document.documentElement.classList.add('st-lock');
        try { history.pushState({ moiSt: 0 }, ''); depth = 1; } catch(e){ depth = 0; }
    }
    window.MOISettings = { open, recordCurrent };
    (window.MOIReady || Promise.resolve()).then(() => { try { recordCurrent(); } catch(e){} });
})();
