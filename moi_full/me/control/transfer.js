/* me/control/transfer.js — Sell পেজ: সেলার তালিকা (নাম, ID, WhatsApp), টাকা সেল করার পপআপ */
(function(){
    'use strict';
    const $ = id => document.getElementById(id);
    const BACK = 'index.html';

    /* ─── আসল তালিকা পরে এখানে বসবে ───
       DEMO = true থাকলে নিচের নমুনা সারি দেখায় (ডিজাইন দেখার জন্য)। আসল তালিকা বসালে DEMO = false করুন। */
    const DEMO = true;
    let BALANCE = 0;
    const SELLERS = DEMO ? [
        { name: 'Seller One',   id: '1001', country: 'BD', wa: '+880 1XXXXXXXXX' },
        { name: 'Seller Two',   id: '1002', country: 'BD', wa: '+880 1XXXXXXXXX' },
        { name: 'Seller Three', id: '1003', country: 'BD', wa: '+880 1XXXXXXXXX' }
    ] : [];

    const toast = (() => { let t; return m => { const e = $('cToast'); e.textContent = m; e.classList.add('show'); clearTimeout(t); t = setTimeout(() => e.classList.remove('show'), 1800); }; })();
    const SOON = 'শীঘ্রই চালু হবে';
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    const ph = n => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2d6a63"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#fff">' + String(n || 'U').charAt(0).toUpperCase().replace(/[<>&]/g, '') + '</text></svg>');
    const av = o => esc(o.photo || ph(o.name));

    $('cBack').addEventListener('click', () => { if (document.referrer && history.length > 1) history.back(); else location.href = BACK; });
    const fmt = n => (Math.round(n * 100) / 100).toFixed(2);
    async function loadBal(){ const r = await MOIEco.try('hostState', {}, false); if (r) BALANCE = r.money; $('tBal').textContent = fmt(BALANCE); $('pBal').textContent = fmt(BALANCE); }
    (window.MOIReady || Promise.resolve()).then(loadBal).catch(loadBal); loadBal();

    /* সেলার তালিকা */
    function renderSellers(list){
        $('sellerList').innerHTML = list.length ? list.map((s, i) =>
            '<div class="t-seller"><div class="top"><img class="t-av" src="' + av(s) + '" alt=""><div class="t-info"><b><i data-ic="gem"></i>' + esc(s.name) + '</b><small>ID:' + esc(s.id) + '</small></div>' +
            '<div class="t-flag">' + esc(s.country || '') + '<u></u></div></div>' +
            '<div class="t-wa"><i data-ic="whatsapp"></i>' + esc(s.wa) + ' <button type="button" data-copy="' + esc(s.wa) + '" aria-label="Copy"><i data-ic="copy"></i></button></div>' +
            '<div class="t-two"><button class="t-pill t-wab" type="button" data-wa="' + esc(s.wa) + '"><i data-ic="whatsapp"></i>WhatsApp</button>' +
            '<button class="t-pill" type="button" data-s="' + i + '"><i data-ic="transfer"></i>Sell</button></div></div>'
        ).join('') : '<div class="t-empty">List is empty</div>';
        CTL.icons(document);
    }
    renderSellers(SELLERS); CTL.icons(document);

    /* Search: ID দিয়ে খোঁজা */
    $('tSearch').addEventListener('click', () => {
        const q = $('tId').value.trim();
        if (!q) { renderSellers(SELLERS); return; }
        const r = SELLERS.filter(s => String(s.id) === q);
        if (!r.length) toast('No user found');
        renderSellers(r);
    });

    /* পপআপ */
    let CUR = null, busy = false;
    function openPop(o){
        CUR = o; $('pAv').src = av(o); $('pName').textContent = o.name; $('pId').textContent = 'ID:' + o.id; $('pAmt').value = '';
        $('tMask').classList.add('show');
    }
    function closePop(){ $('tMask').classList.remove('show'); }
    $('pCancel').addEventListener('click', closePop);
    $('tMask').addEventListener('click', e => { if (e.target === $('tMask')) closePop(); });
    $('pOk').addEventListener('click', async () => {
        const v = Math.floor(parseFloat($('pAmt').value));
        if (!(v >= 1)) { toast('Enter an amount'); return; }
        if (v > BALANCE) { toast('Not enough balance'); return; }
        if (busy || !CUR) return; busy = true;
        const r = await MOIEco.try('hostSell', { money: v, sellerId: CUR.id, sellerName: CUR.name });
        busy = false;
        if (!r) return;
        closePop(); await loadBal(); toast('Sold ' + v + ' to ' + CUR.name);
    });

    /* বাটনের কাজ (ক্লিক ধরা) */
    document.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.s != null) openPop(SELLERS[+b.dataset.s]);
        else if (b.dataset.wa != null) { const n = b.dataset.wa.replace(/\D/g, ''); if (n.length > 6) window.open('https://wa.me/' + n, '_blank'); else toast('WhatsApp number not set'); }
        else if (b.dataset.copy != null) { try { navigator.clipboard.writeText(b.dataset.copy); toast('Copied'); } catch(_) { toast('Copy failed'); } }
    });
})();
