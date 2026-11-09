/* me/vip/vip.js — VIP পেজ: Back, VIP১–৭ ট্যাব ↔ কার্ড, দাম বদলানো, ইউজারের ছবি/নাম
   (বড় বক্সের ভিতরের সুবিধা এখন ফাঁকা — পরে #items-… ঘরে বসবে) */
(function(){
    'use strict';
    const $ = id => document.getElementById(id);
    const ME = '../index.html';   /* vip ফোল্ডার me-এর ভিতরে, তাই এক ধাপ উপরে = Me পেজ */

    /* প্রতিটা লেভেলের দাম — বদলাতে চাইলে শুধু এখানে বদলাও */
    const PRICE = {
        1: { cost: 240000,   back: 240000 },
        2: { cost: 1000000,  back: 600000 },
        3: { cost: 2000000,  back: 1400000 },
        4: { cost: 4000000,  back: 2800000 },
        5: { cost: 10000000, back: 7000000 },
        6: { cost: 16000000, back: 11200000 },
        7: { cost: 24000000, back: 16800000 }
    };

    const tabs = [...document.querySelectorAll('.vip-tab')];
    const cardsEl = $('vipCards');
    const cards = [...document.querySelectorAll('.vip-card')];
    let cur = 1, toastT = null;

    function toast(m){ const t = $('vipToast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800); }

    /* Back */
    $('vipBack').addEventListener('click', () => { if (document.referrer && history.length > 1) history.back(); else location.href = ME; });

    /* লেভেল বদলালে: ট্যাব, বক্সের ঘর, দাম */
    function setLevel(n){
        cur = n;
        tabs.forEach(t => t.classList.toggle('on', +t.dataset.lv === n));
        document.querySelectorAll('.vip-items').forEach(el => el.classList.toggle('on', el.id === 'items-' + n));
        $('vipCost').textContent = PRICE[n].cost;
        $('vipReturn').textContent = PRICE[n].back;
        const t = tabs[n - 1]; if (t) t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    function goCard(n){ const c = cards[n - 1]; if (c) c.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }

    tabs.forEach(t => t.addEventListener('click', () => { const n = +t.dataset.lv; setLevel(n); goCard(n); }));

    /* কার্ড সরালে ট্যাব বদলায় */
    let st = null;
    cardsEl.addEventListener('scroll', () => {
        clearTimeout(st);
        st = setTimeout(() => {
            const mid = cardsEl.scrollLeft + cardsEl.clientWidth / 2; let best = 1, bd = 1e9;
            cards.forEach((c, i) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd){ bd = d; best = i + 1; } });
            if (best !== cur) setLevel(best);
        }, 80);
    });

    /* ইউজারের ছবি ও নাম */
    const ph = n => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2d6a63"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#fff">' + String(n || 'U').charAt(0).toUpperCase().replace(/[<>&]/g, '') + '</text></svg>');
    function me(){
        const p = window.MOIAuth && MOIAuth.profile; if (p && p.uid) return p;
        try { return JSON.parse(localStorage.getItem('moi_user')) || null; } catch(e){ return null; }
    }
    function renderUser(){
        const p = me(); if (!p) return;
        const name = p.name || 'User', photo = p.photo || ph(name);
        cards.forEach(c => {
            const a = c.querySelector('.vc-av'); if (a.getAttribute('src') !== photo){ a.onerror = () => { a.onerror = null; a.src = ph(name); }; a.src = photo; }
            c.querySelector('.vc-name').textContent = name;
        });
    }

    /* RENEW — এখন শুধু বাটন (কেনার কাজ কীভাবে হবে সেটা পরে বলা হবে) */
    $('vipRenew').addEventListener('click', () => toast('VIP' + cur + ' — শীঘ্রই চালু হবে'));

    function init(){
        setLevel(1); renderUser();
        window.addEventListener('moi:sync', e => { const k = (e.detail && e.detail.key) || ''; if (k === 'moi_demo_users') renderUser(); });
    }
    (window.MOIReady || Promise.resolve()).then(() => { try { init(); } catch(e){ console.error('[VIP]', e); } });
    window.openVipLevel = n => { setLevel(n); goCard(n); };
})();
