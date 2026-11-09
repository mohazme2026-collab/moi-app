/* shared/chat-badge.js — চ্যাট বাটনের উপরে লাল সংখ্যা (Home · Me · Room)
   • মোট সংখ্যা = সব বন্ধুর unread মেসেজ + আসা বন্ধু-অনুরোধ
   • সংখ্যা 0 হলে কিছুই দেখায় না
   • নতুন মেসেজ বা অনুরোধ এলে উপরে ছোট একটা নোটিফিকেশন ভেসে ওঠে (চ্যাট পেজে নয়)
   • নিজে থেকেই বসে: #navChat (Home/Me) আর .md-dm (Room মেসেজ বাটন) */
(function(){
    'use strict';
    if (window.MOIBadge) return;
    const IN_CHAT = /\/chat\//.test(location.pathname);
    let uid = null, primed = false, mounts = [], prevUnread = {}, prevReq = new Set(), tTimer = null;
    const S = () => window.MOISync;

    function myProfile(){ const A = window.MOIAuth; const p = A && A.profile; return p && p.uid ? p : null; }
    const metas = () => (S().get('moi_chat_meta_' + uid, {}) || {});
    const reqs  = () => (S().get('moi_friend_requests_' + uid, {}) || {});
    function total(){
        let n = 0; const m = metas();
        Object.keys(m).forEach(k => { n += Number(m[k] && m[k].unread) || 0; });
        return n + Object.keys(reqs()).length;
    }
    function render(){
        const n = uid ? total() : 0;
        mounts.forEach(el => {
            const b = el.querySelector('.cbadge'); if (!b) return;
            if (n > 0){ b.textContent = n > 99 ? '99+' : String(n); b.hidden = false; } else b.hidden = true;
        });
    }
    function mount(el){
        if (!el) return;
        if (!el.querySelector('.cbadge')){
            const b = document.createElement('b'); b.className = 'cbadge'; b.hidden = true; el.appendChild(b);   /* <b> — নেভ বাটনের `span{display:none}` নিয়ম এড়াতে */
        }
        if (mounts.indexOf(el) < 0) mounts.push(el);
        render();
    }

    /* ─ নোটিফিকেশন (টোস্ট) ─ */
    function userOf(id){ try { const u = (S().get('moi_demo_users', {}) || {})[id]; return u || null; } catch(e){ return null; } }
    function toast(icon, title, text, onTap){
        if (IN_CHAT) return;
        const old = document.querySelector('.cb-toast'); if (old) old.remove();
        const d = document.createElement('div'); d.className = 'cb-toast';
        const ic = document.createElement('div'); ic.className = 'cb-ic';
        if (/^(https?:|data:)/.test(icon || '')){ const im = document.createElement('img'); im.src = icon; ic.appendChild(im); } else ic.textContent = icon || '💬';
        const tx = document.createElement('div'); tx.className = 'cb-tx';
        const b = document.createElement('b'); b.textContent = title; const sp = document.createElement('span'); sp.textContent = text || '';
        tx.appendChild(b); tx.appendChild(sp); d.appendChild(ic); d.appendChild(tx);
        d.onclick = () => { d.remove(); if (onTap) onTap(); };
        document.body.appendChild(d);
        requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('show')));
        clearTimeout(tTimer); tTimer = setTimeout(() => { d.classList.remove('show'); setTimeout(() => d.remove(), 400); }, 4200);
    }
    function openChat(){
        if (/\/home\//.test(location.pathname) && typeof window.openChat === 'function') return window.openChat();
        if (typeof window.openChatSheet === 'function') return window.openChatSheet();
        if (/\/me\//.test(location.pathname)) location.href = '../home/index.html?chat=1';
    }
    function chatOpenWith(k){
        try { return [].some.call(document.querySelectorAll('iframe'), f => f.contentWindow && f.contentWindow.currentChatUid === k); } catch(e){ return false; }
    }

    function update(){
        if (!uid || !S()) return;
        const m = metas();
        Object.keys(m).forEach(k => {
            const n = Number(m[k] && m[k].unread) || 0;
            if (primed && n > (prevUnread[k] || 0) && !chatOpenWith(k)){
                const u = userOf(k);
                toast((u && u.photo) || '💬', (u && u.name) || 'নতুন মেসেজ', (m[k] && m[k].lastMessage) || '', openChat);
            }
            prevUnread[k] = n;
        });
        const rq = Object.keys(reqs());
        if (primed) rq.forEach(k => {
            if (prevReq.has(k)) return;
            const r = reqs()[k] || {}, u = userOf(k);
            toast(r.fromPhoto || (u && u.photo) || '👋', r.fromName || (u && u.name) || 'নতুন অনুরোধ', 'আপনাকে বন্ধুর অনুরোধ পাঠিয়েছে', openChat);
        });
        prevReq = new Set(rq);
        render();
    }

    function init(n){
        const p = myProfile();
        if (!p || !S()){ if (n < 160) setTimeout(() => init(n + 1), 250); return; }
        uid = p.uid;
        mount(document.getElementById('navChat'));
        mount(document.querySelector('.md-dm'));
        update();
        setTimeout(() => { primed = true; update(); }, 3000);
        window.addEventListener('moi:sync', e => {
            const k = (e.detail && e.detail.key) || '';
            if (k === 'moi_chat_meta_' + uid || k === 'moi_friend_requests_' + uid) update();
        });
    }
    window.MOIBadge = { mount, update };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(0)); else init(0);
})();
