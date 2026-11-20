/* me/store/store.js — Store পেজ: Back, ট্যাব, জিনিসের কার্ড, কেনার পপ-আপ (৭ দিন / ৩০ দিন)
   জিনিসের তালিকা ও দাম: shared/store/store-data.js  (ডায়মন্ড কাটার কাজ: shared/core/economy.js → buyStoreItem)
   কেনা জিনিস যায় Me › Bag › (Frame ট্যাব)-এ; সেখান থেকে "Use" দিলে প্রোফাইলে বসে। */
(function(){
    'use strict';
    const $ = id => document.getElementById(id);
    const ME = '../index.html', BAG = '../bag/index.html';
    const fmt = n => Number(n || 0).toLocaleString('en-US');
    const GEM = '<i class="gem"></i>';
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const ph = n => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2d6a63"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#fff">' + String(n || 'U').charAt(0).toUpperCase() + '</text></svg>');
    const me = () => { const p = window.MOIAuth && MOIAuth.profile; return p && p.uid ? p : null; };
    const dia = () => { const p = me(); return p ? Number(p.diamonds) || 0 : 0; };

    /* Back → Me পেজ */
    $('stBack').addEventListener('click', () => {
        if (document.referrer && history.length > 1) history.back(); else location.href = ME;
    });

    /* ট্যাব বদলানো */
    const tabs = [...document.querySelectorAll('.st-tab')];
    function openTab(name){
        tabs.forEach(t => t.classList.toggle('on', t.dataset.tab === name));
        document.querySelectorAll('.st-pane').forEach(p => p.classList.toggle('on', p.id === 'pane-' + name));
        const on = tabs.find(t => t.dataset.tab === name);
        if (on) on.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    tabs.forEach(t => t.addEventListener('click', () => openTab(t.dataset.tab)));
    window.openStoreTab = openTab;

    let tt;
    function toast(m){ const t = $('stToast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600); }

    function setBal(){ $('stBalN').textContent = fmt(dia()); }

    /* ─── কার্ড ─── */
    const poster = it => '<img class="sc-poster" alt="" src="' + esc(MOIStore.img(it)) + '">';
    function preview(it, p){
        if (it.slot === 'entry') return '<div class="sc-pv ent">' + poster(it) + '<button type="button" class="pv-play" aria-label="Preview">▶</button></div>';
        if (it.slot === 'bubble') return '<div class="sc-pv ban">' + poster(it) + '</div>';
        if (it.slot === 'emoji') return '<div class="sc-pv emo">' + MOIStore.MEMES.map(m => '<img alt="" src="' + esc(MOIStore.memeSrc(m)) + '">').join('') + '</div>';
        return '<div class="sc-pv"><span class="sc-av"><img alt="" src="' + esc(p.photo || ph(p.name)) + '"></span><img class="sc-ring" alt="" src="' + esc(MOIStore.img(it)) + '"></div>'; }
    function card(it, p){
        const days = MOIStore.daysLeft(p.uid, it.id), ds = Object.keys(it.prices).map(Number).sort((a, b) => a - b);
        const priceTxt = d => d ? '<em>/ ' + d + ' days</em>' : '<em>one-time</em>';
        const where = { frame: 'Bag › Frame', entry: 'Bag › Entry', bubble: 'Bag › Messages Bubble', emoji: 'the room Reactions list' }[it.slot];
        return '<div class="sc" data-id="' + it.id + '">' + preview(it, p) +
            '<b class="sc-nm">' + esc(it.name) + '</b><small>' + esc(it.sub || '') + '</small>' +
            (days
                ? '<div class="sc-pr"></div><div class="sc-own">✓ Purchased<small>' + (it.forever ? 'yours forever' : days + (days === 1 ? ' day' : ' days') + ' left') + ' · find it in ' + where + '</small></div>'
                : '<div class="sc-pr">' + ds.map(d => '<span>' + GEM + fmt(it.prices[d]) + priceTxt(d) + '</span>').join('') + '</div><button class="sc-buy" type="button">Buy</button>') +
            '</div>';
    }
    function render(){
        const p = me(); if (!p) return;
        ['frame', 'entry', 'bubble', 'emoji'].forEach(tab => {
            const items = MOIStore.ITEMS.filter(i => i.tab === tab);
            $('pane-' + tab).innerHTML = '<div class="sc-grid">' + items.map(i => card(i, p)).join('') + '</div>';
        });
        ['luckybox', 'wallpaper', 'special'].forEach(k => {
            const el = $('pane-' + k); if (el && !el.children.length) el.innerHTML = '<div class="st-soon">Coming soon</div>';
        });
        setBal();
    }

    /* ─── কেনার পপ-আপ ─── */
    let sel = 7, busy = false;
    function openBuy(id){
        const p = me(), it = MOIStore.get(id); if (!p || !it) return;
        const ds = Object.keys(it.prices).map(Number).sort((a, b) => a - b); sel = ds[0];
        const back = document.createElement('div'); back.className = 'sm-back'; back.id = 'smBack';
        back.innerHTML = '<div class="sm" role="dialog" aria-modal="true">' +
            '<div class="sm-h">' + (it.slot === 'entry' ? '<div class="sm-pv ent">' + poster(it) + '</div>' : it.slot === 'bubble' ? '<div class="sm-pv ban">' + poster(it) + '</div>' : it.slot === 'emoji' ? '<div class="sm-pv emo">' + MOIStore.MEMES.slice(0, 6).map(m => '<img alt="" src="' + esc(MOIStore.memeSrc(m)) + '">').join('') + '</div>' : '<div class="sm-pv"><span class="sc-av"><img alt="" src="' + esc(p.photo || ph(p.name)) + '"></span><img class="sc-ring" alt="" src="' + esc(MOIStore.img(it)) + '"></div>') + '<div class="sm-t"><b>' + esc(it.name) + '</b><span>' + esc(it.sub || '') + '</span></div></div>' +
            '<div class="sm-q">' + (it.forever ? 'Buy this pack? You keep it forever.' : 'For how many days do you want to buy?') + '</div>' +
            '<div class="sm-opts">' + ds.map(d => '<button type="button" class="sm-opt" data-d="' + d + '"><i class="rd"></i><b>' + (d ? d + ' Days' : 'Forever') + '</b><span class="pr">' + GEM + fmt(it.prices[d]) + '</span></button>').join('') + '</div>' +
            '<div class="sm-have">Your balance ' + GEM + '<b id="smHave">' + fmt(dia()) + '</b></div>' +
            '<div class="sm-btns"><button type="button" class="sm-no">Cancel</button><button type="button" class="sm-ok" id="smOk"></button></div></div>';
        document.body.appendChild(back);
        const upd = () => {
            back.querySelectorAll('.sm-opt').forEach(b => b.classList.toggle('on', +b.dataset.d === sel));
            $('smOk').innerHTML = 'Confirm ' + GEM + fmt(it.prices[sel]);
        };
        const close = () => { if (busy) return; back.classList.remove('on'); setTimeout(() => back.remove(), 180); };
        back.querySelectorAll('.sm-opt').forEach(b => b.addEventListener('click', () => { sel = +b.dataset.d; upd(); }));
        back.querySelector('.sm-no').addEventListener('click', close);
        back.addEventListener('click', e => { if (e.target === back) close(); });
        $('smOk').addEventListener('click', async () => {
            if (busy) return; busy = true; const ok = $('smOk'); ok.disabled = true;
            try {
                await MOIStore.buy(p.uid, it.id, sel);
                busy = false; close();
                toast(it.slot === 'emoji' ? 'Purchased! Open Reactions in a room — Memes is the last tab' : 'Purchased! Find it in your Bag and tap Use');
                render();
            } catch(e){
                busy = false; ok.disabled = false;
                toast(e && e.userMsg ? e.userMsg : 'Purchase failed');
            }
        });
        upd(); requestAnimationFrame(() => back.classList.add('on'));
    }

    ['frame', 'entry', 'bubble', 'emoji'].forEach(tab => $('pane-' + tab).addEventListener('click', e => {
        const c = e.target.closest('.sc'); if (!c) return;
        const p = me(), id = c.dataset.id; if (!p) return;
        if (e.target.closest('.pv-play')){ const it = MOIStore.get(id); if (window.MOIEntry && it && it.entry) MOIEntry.test(p, it.entry); return; }
        if (MOIStore.isOwned(p.uid, id)){ toast('Already purchased — find it in Bag › Frame'); return; }
        openBuy(id);
    }));

    window.addEventListener('moi:diamonds', setBal);
    window.addEventListener('moi:store', render);
    (window.MOIReady || Promise.resolve()).then(() => { try { render(); } catch(e){ console.error('[Store]', e); } });
})();
