/* me/vip/vip.js — VIP পেজ (শুধু VIP১): ওপরে ড্রাগন কার্ড (ছবি+নাম), সুবিধার বক্স, নিচে ডায়মন্ডে কেনা/রিনিউ
   VIP চালু থাকে localStorage 'moi_vip_level_<uid>' = {level, until} (SVIP-র মতোই) — shared/svip/perks.js এটা পড়ে */
(function(){
    'use strict';
    const $ = id => document.getElementById(id);
    const ME = '../index.html';
    const PRICE = 240000, DAYS = 30;                 /* shared/core/economy.js এর C.VIP এর সাথে একই */
    const HG = { w: 1079, h: 351, cx: 166.1, cy: 216, r: 82.8 };   /* কার্ডের গোল ঘর (ছবির পিক্সেলে) */
    let toastT = null;

    function toast(m){ const t = $('vipToast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2000); }
    $('vipBack').addEventListener('click', () => { if (document.referrer && history.length > 1) history.back(); else location.href = ME; });

    const ph = n => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#5a1818"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#fff">' + String(n || 'U').charAt(0).toUpperCase().replace(/[<>&]/g, '') + '</text></svg>');
    function me(){
        const p = window.MOIAuth && MOIAuth.profile; if (p && p.uid) return p;
        try { return JSON.parse(localStorage.getItem('moi_user')) || null; } catch(e){ return null; }
    }
    const rd = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch(e){ return null; } };
    function active(){ const p = me(); if (!p) return null; const a = rd('moi_vip_level_' + p.uid); return a && (!a.until || a.until > Date.now()) ? a : null; }

    function render(){
        const p = me(); if (!p) return;
        const name = p.name || 'User', photo = p.photo || p.avatar || ph(name);
        const a = $('vhAv'); a.onerror = () => { a.onerror = null; a.src = ph(name); }; a.src = photo;
        $('vhNm').textContent = name;
        const ac = active();
        $('vipBuy').textContent = ac ? 'RENEW' : 'BUY';
        $('vipLeft').textContent = ac && ac.until ? 'VIP active · ' + Math.max(1, Math.ceil((ac.until - Date.now()) / 86400000)) + ' days left' : '';
        $('vipCost').textContent = PRICE.toLocaleString('en-US');
        const k = x => (x * 100).toFixed(2) + '%';
        const strip = '<div class="vg-strip"><img class="av" alt="" src="' + photo + '" style="left:' + k((HG.cx - HG.r) / HG.w) + ';top:' + k((HG.cy - HG.r) / HG.h) + ';width:' + k(HG.r * 2 / HG.w) + ';height:' + k(HG.r * 2 / HG.h) + '"><img class="bg" alt="" draggable="false" src="../../shared/svip/levels/vip1/entry_head.webp"></div>';
        $('vipGrid').innerHTML =
            '<div class="vg"><div class="vg-art"><div class="vg-av"><img alt="" src="' + photo + '" draggable="false"></div></div><div class="vg-n">VIP1 Ring</div></div>' +
            '<div class="vg"><div class="vg-art"><div style="width:62%">' + (window.MOICard ? MOICard.preview('vip1') : '') + '</div></div><div class="vg-n">VIP1 Card</div></div>' +
            '<div class="vg wide"><div class="vg-art" style="width:84%;aspect-ratio:auto;padding:16px 0 2px">' + (window.MOIChatFx ? MOIChatFx.preview('vip1', 'অসাধারণ লাগছে 🔥') : '') + '</div><div class="vg-n">VIP1 Comment</div></div>' +
            '<div class="vg wide"><div class="vg-art">' + strip + '</div><div class="vg-n">VIP1 Entry</div></div>';
        if (window.MOICrown) document.querySelectorAll('.vg-av').forEach(h => MOICrown.attach(h, 'vip1'));
    }

    async function buy(){
        const p = me(); if (!p){ return; }
        const btn = $('vipBuy'); btn.disabled = true;
        try {
            if (!window.MOIEco) throw new Error('NO_ECO');
            await MOIEco.call('buyVip', { level: 1 });
            const cur = active(), base = cur && cur.until > Date.now() ? cur.until : Date.now();
            localStorage.setItem('moi_vip_level_' + p.uid, JSON.stringify({ level: 1, until: base + DAYS * 86400000 }));
            toast('VIP1 activated for ' + DAYS + ' days');
            render();
        } catch(e){
            const m = String((e && e.message) || e);
            toast(/INSUFFICIENT/.test(m) ? 'পর্যাপ্ত ডায়মন্ড নেই' : 'এখন কেনা যায়নি, আবার চেষ্টা করুন');
        }
        btn.disabled = false;
    }
    $('vipBuy').addEventListener('click', buy);

    function init(){
        render();
        window.addEventListener('moi:sync', e => { const k = (e.detail && e.detail.key) || ''; if (k === 'moi_demo_users') render(); });
    }
    (window.MOIReady || Promise.resolve()).then(() => { try { init(); } catch(e){ console.error('[VIP]', e); } });
})();
