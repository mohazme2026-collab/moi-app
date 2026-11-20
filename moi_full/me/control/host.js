/* me/control/host.js — Host পেজ: Balance, Targets & Rewards, Sell, Exchange, Records
   ডেটা আসে shared/core/economy.js-এর hostState / hostExchange (টার্গেট ও রেট সেখানে C.HOST-এ) */
(function(){
    'use strict';
    const $ = id => document.getElementById(id);
    const ME = '../index.html';   /* control ফোল্ডার me-এর ভিতরে, তাই এক ধাপ উপরে = Me পেজ */

    let S = { dia: 0, claimed: [], money: 0, rec: [], targets: [], rate: 2, month: 0 };

    const toast = (() => { let t; return m => { const e = $('cToast'); e.textContent = m; e.classList.add('show'); clearTimeout(t); t = setTimeout(() => e.classList.remove('show'), 2000); }; })();
    const SOON = 'শীঘ্রই চালু হবে';
    const fmt = n => (Math.round(n * 100) / 100).toFixed(2);
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    /* ─── ভিউ (Targets / Exchange / Records) — ফোনের ব্যাকেও বন্ধ হয় ─── */
    let open = null;
    function openView(id){
        if (open) return;
        open = id; $(id).classList.add('on'); history.pushState({ v: id }, '');
        if (id === 'vExch'){ $('xMoney').value = ''; calc(); }
    }
    function closeView(fromPop){
        if (!open) return;
        $(open).classList.remove('on'); open = null;
        if (!fromPop) history.back();
    }
    window.addEventListener('popstate', () => closeView(true));
    document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeView()));
    $('cBack').addEventListener('click', () => { if (document.referrer && history.length > 1) history.back(); else location.href = ME; });
    $('goTargets').addEventListener('click', () => openView('vTargets'));

    document.querySelectorAll('.c-act').forEach(b => b.addEventListener('click', () => {
        const a = b.dataset.act;
        if (a === 'sell') location.href = 'transfer.html';
        else if (a === 'exchange') openView('vExch');
        else if (a === 'records') openView('vRec');
        else toast(SOON);
    }));

    /* ─── আঁকা ─── */
    function render(){
        const T = S.targets, n = T.length, done = S.claimed.length;
        let earn = 0; S.claimed.forEach(i => { if (T[i]) earn += T[i].reward; });
        $('wBal').textContent = fmt(S.money);
        $('rowSub').textContent = done + ' / ' + n + ' done';
        $('dDone').textContent = done + '/' + n;
        $('dEarn').textContent = fmt(earn);
        $('dMonth').textContent = S.month ? 'Resets every month · ' + MON[(S.month % 100) - 1] + ' ' + Math.floor(S.month / 100) : '';
        $('tDia').textContent = S.dia; $('tDone').textContent = done + '/' + n; $('tEarn').textContent = fmt(earn);
        $('xBal').textContent = fmt(S.money); $('xRate').textContent = S.rate;

        /* টার্গেট তালিকা: ভরা দাগ, বামে কত পূরণ, ডানে কত বাকি */
        $('targets').innerHTML = T.map((t, i) => {
            const ok = S.dia >= t.need, got = Math.min(S.dia, t.need), left = Math.max(0, t.need - S.dia), pct = Math.min(100, S.dia / t.need * 100);
            return '<div class="c-tg' + (ok ? ' done' : '') + '" style="--d:' + (i * 45) + 'ms">' +
                '<div class="no">' + (ok ? '<i data-ic="check"></i>' : (i + 1)) + '</div>' +
                '<div class="mid"><div class="need"><i data-ic="gem"></i>' + t.need + '<small>diamonds</small></div>' +
                '<div class="bar"><u style="width:' + pct + '%"></u></div>' +
                '<div class="nums"><span>' + got + ' done</span><span>' + (ok ? 'Completed' : left + ' left') + '</span></div></div>' +
                '<div class="rw"><b>' + t.reward + '<i data-ic="ticket"></i></b><span class="st">' + (ok ? 'Done' : 'In progress') + '</span></div></div>';
        }).join('');

        /* রেকর্ড */
        $('recList').innerHTML = S.rec.length ? S.rec.map(r => {
            const d = new Date(r.ts), t = d.getDate() + ' ' + MON[d.getMonth()] + ', ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
            let ic, tt, sub, amt, cls;
            if (r.type === 'sell'){ ic = 'bag'; tt = 'Sold to ' + esc(r.to); sub = 'ID: ' + esc(r.toId); amt = '-' + r.money; cls = 'out'; }
            else if (r.type === 'exchange'){ ic = 'exchange'; tt = 'Bought diamonds'; sub = '+' + r.dia + ' 💎 for ' + r.money + ' money'; amt = '-' + r.money; cls = 'out'; }
            else { ic = 'target'; tt = 'Target ' + r.n + ' completed'; sub = r.need + ' diamonds reached'; amt = '+' + r.money; cls = 'in'; }
            return '<div class="r-it ' + cls + '"><span class="r-ic"><i data-ic="' + ic + '"></i></span><div class="r-m"><b>' + tt + '</b><small>' + sub + '</small><small class="r-t">' + t + '</small></div><div class="r-a">' + amt + '<i data-ic="ticket"></i></div></div>';
        }).join('') : '<div class="r-empty"><i data-ic="records"></i><p>No records yet</p></div>';
        CTL.icons(document);
    }
    let lastErr = '';
    async function load(){
        let r = null;
        try { r = await MOIEco.call('hostState', {}); }
        catch(e){ if (e && e.userMsg && e.userMsg !== lastErr){ lastErr = e.userMsg; toast('Host: ' + e.userMsg); } }
        if (r) S = r;
        render();
    }

    /* ─── Exchange: নিচে টাকা লিখলে উপরে 💎 দেখায় ─── */
    function calc(){
        const m = Math.floor(parseFloat($('xMoney').value) || 0);
        $('xDia').textContent = m > 0 ? m * S.rate : 0;
        $('xOk').classList.toggle('dim', !(m >= 1 && m <= S.money));
    }
    $('xMoney').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9); calc(); });
    $('xMax').addEventListener('click', () => { $('xMoney').value = Math.floor(S.money) || ''; calc(); });
    let busy = false;
    $('xOk').addEventListener('click', async () => {
        const m = Math.floor(parseFloat($('xMoney').value) || 0);
        if (busy) return;
        if (!(m >= 1)){ toast('Enter an amount'); return; }
        if (m > S.money){ toast('Not enough money'); return; }
        busy = true;
        const r = await MOIEco.try('hostExchange', { money: m });
        busy = false;
        if (!r) return;
        toast('+' + r.dia + ' 💎 added to your account');
        await load(); closeView();
    });

    /* গিফট আসলে নিজে থেকে নতুন হিসাব দেখায় (পেজে ফিরলে, অ্যাপে ফিরলে, আর খোলা থাকলে প্রতি ৩ সেকেন্ডে) */
    let loading = false;
    async function refresh(){ if (loading || busy || document.hidden) return; loading = true; try { await load(); } finally { loading = false; } }
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', refresh);
    setInterval(refresh, 3000);

    (window.MOIReady || Promise.resolve()).then(load).catch(load);
    render();
})();
