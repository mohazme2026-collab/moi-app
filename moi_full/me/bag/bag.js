/* me/bag/bag.js — Bag (My Decoration) পেজ: Back বাটন + ট্যাব বদলানো + খালি হলে "List is empty"
   (প্রতিটা ট্যাবে কেনা জিনিস এখন নেই — পরে #list-… ঘরে বসবে; ঘরে কিছু বসালে "List is empty" নিজে সরে যাবে) */
(function(){
    'use strict';
    const $ = id => document.getElementById(id);
    const ME = '../index.html';   /* bag ফোল্ডার me-এর ভিতরে, তাই এক ধাপ উপরে = Me পেজ */

    $('bgBack').addEventListener('click', () => { if (document.referrer && history.length > 1) history.back(); else location.href = ME; });

    const tabs = [...document.querySelectorAll('.bg-tab')];
    const empty = $('bgEmpty');

    /* চালু ট্যাবের ঘরে কিছু না থাকলে খালি-অবস্থা দেখানো */
    function refreshEmpty(){
        const on = document.querySelector('.bg-pane.on');
        empty.classList.toggle('show', !on || !on.children.length);
    }
    function openTab(name){
        tabs.forEach(t => t.classList.toggle('on', t.dataset.tab === name));
        document.querySelectorAll('.bg-pane').forEach(p => p.classList.toggle('on', p.id === 'list-' + name));
        const t = tabs.find(x => x.dataset.tab === name); if (t) t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        refreshEmpty();
    }
    tabs.forEach(t => t.addEventListener('click', () => openTab(t.dataset.tab)));

    /* ঘরে জিনিস যোগ/বাদ হলে নিজে থেকেই আপডেট */
    new MutationObserver(refreshEmpty).observe($('bgPanes'), { childList: true, subtree: true });
    refreshEmpty();
    window.openBagTab = openTab;

    /* ═══ Frame ট্যাব: স্টোর থেকে কেনা রিং — ছুঁলে নিচে "Use" শিট আসে; Use দিলে প্রোফাইলে বসে, আবার চাপলে খুলে যায় ═══ */
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const ph = n => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2d6a63"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#fff">' + String(n || 'U').charAt(0).toUpperCase() + '</text></svg>');
    const me = () => { const p = window.MOIAuth && MOIAuth.profile; return p && p.uid ? p : null; };
    let tt; function toast(m){ const t = $('bgToast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2400); }
    const pv = (it, p) => it.slot === 'bubble'
        ? '<div class="bi-pv ban"><img class="bi-poster" alt="" src="' + esc(MOIStore.img(it)) + '"></div>'
        : it.slot === 'entry'
        ? '<div class="bi-pv ent"><img class="bi-poster" alt="" src="' + esc(MOIStore.img(it)) + '"></div>'
        : '<div class="bi-pv"><span class="bi-av"><img alt="" src="' + esc(p.photo || ph(p.name)) + '"></span><img class="bi-ring" alt="" src="' + esc(MOIStore.img(it)) + '"></div>';
    const left = (p, it) => { const d = MOIStore.daysLeft(p.uid, it.id); return d + (d === 1 ? ' day' : ' days') + ' left'; };
    const WHERE = { frame: 'your profile', entry: 'when you enter a room', bubble: 'in room chat' };

    function renderSlot(slot){
        const p = me(), pane = $('list-' + slot); if (!p || !window.MOIStore) return;
        const mine = MOIStore.ITEMS.filter(i => i.slot === slot && MOIStore.isOwned(p.uid, i.id));
        const on = MOIStore.equipped(p.uid, slot);
        pane.innerHTML = mine.length ? '<div class="bi-grid">' + mine.map(it =>
            '<button type="button" class="bi' + (on === it.id ? ' worn' : '') + '" data-id="' + it.id + '">' + pv(it, p) +
            '<b>' + esc(it.name) + '</b><small>' + left(p, it) + '</small>' + (on === it.id ? '<i class="bi-tag">In use</i>' : '') + '</button>').join('') + '</div>' : '';
    }
    const renderFrames = () => { renderSlot('frame'); renderSlot('entry'); renderSlot('bubble'); };

    function openSheet(id){
        const p = me(), it = MOIStore.get(id); if (!p || !it) return;
        const slot = it.slot;
        const back = document.createElement('div'); back.className = 'bs-back';
        back.innerHTML = '<div class="bs" role="dialog"><div class="bs-grab"></div>' + pv(it, p) + (slot === 'entry' ? '<button type="button" class="bs-play">▶ Preview</button>' : '') + '<b class="bs-nm">' + esc(it.name) + '</b><small class="bs-sub" id="bsSub"></small><button type="button" class="bs-btn" id="bsBtn"></button></div>';
        document.body.appendChild(back);
        const btn = back.querySelector('#bsBtn');
        const upd = () => {
            const worn = MOIStore.equipped(p.uid, slot) === it.id;
            btn.className = 'bs-btn ' + (worn ? 'worn' : 'use'); btn.textContent = worn ? '✓ In use — tap to remove' : 'Use';
            back.querySelector('#bsSub').textContent = left(p, it) + (worn ? ' · active ' + (slot === 'entry' ? 'on room entry' : slot === 'bubble' ? 'in room chat' : 'on your profile') : '');
        };
        const close = () => { back.classList.remove('on'); setTimeout(() => back.remove(), 200); };
        btn.addEventListener('click', () => {
            const worn = MOIStore.equipped(p.uid, slot) === it.id;
            MOIStore.setEquip(p.uid, slot, worn ? null : it.id);
            toast(worn ? 'Removed' : 'Now active ' + WHERE[slot]);
            upd(); renderFrames();
        });
        const pl = back.querySelector('.bs-play');
        if (pl) pl.addEventListener('click', () => { if (window.MOIEntry && it.entry){ close(); MOIEntry.test(p, it.entry); } });
        back.addEventListener('click', e => { if (e.target === back) close(); });
        upd(); requestAnimationFrame(() => back.classList.add('on'));
    }
    ['frame', 'entry', 'bubble'].forEach(k => $('list-' + k).addEventListener('click', e => { const b = e.target.closest('.bi'); if (b) openSheet(b.dataset.id); }));
    window.addEventListener('moi:store', renderFrames);
    (window.MOIReady || Promise.resolve()).then(() => { try { renderFrames(); } catch(e){ console.error('[Bag]', e); } });
})();
