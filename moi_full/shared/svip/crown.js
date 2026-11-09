/* ═══ মুকুট (SVIP রিং) — ব্যাকগ্রাউন্ডহীন অ্যানিমেটেড ছবি ছবির চারপাশে ঘুরে ═══
   আপনার ভিডিও থেকে সবুজ ব্যাকগ্রাউন্ড কেটে অ্যানিমেটেড WebP বানানো (ভিডিও ট্যাগ নয়) — তাই
   ফোনের "প্লে" বাটন/ধূসর বক্স কখনো আসে না, অটোপ্লে ব্লকের ঝামেলাও নেই, সব ফোন ও iPhone-এ চলে।
   ব্যবহার:  MOICrown.attach(hostEl, 'svip1')   • MOICrown.attachUser(hostEl, user)   • MOICrown.detach(hostEl)
   নতুন মুকুট: shared/svip/levels/levelN/ এ crown.webp রেখে নিচের CROWNS এ এক লাইন যোগ করুন।
   scale = মুকুটের মাপ ÷ প্রোফাইল ছবির মাপ (ছোট করতে সংখ্যা কমান) • dx/dy = কেন্দ্র মেলানোর সূক্ষ্ম সরানো (%) */
(function(){
    if (window.MOICrown) return;
    const SRC = (document.currentScript && document.currentScript.src) || '';
    const BASE = SRC.replace(/[^\/]*$/, '') + 'levels/';
    const CROWNS = {
        svip1: { img: 'level1/crown.webp', scale: 1.8, dx: -0.49, dy: 1.07 },
        /* স্টোরের রিং (animated SVG) — ছবি shared/store/rings/ এ; ring-এর মাঝখান ছবির কেন্দ্র থেকে ২.১% নিচে, তাই dy = -2.14 */
        gold1: { img: '../../store/rings/ring_gold.svg', scale: 2.0, dx: 0, dy: -2.14 }
    };
    const CSS = `.cv{position:absolute;left:50%;top:50%;pointer-events:none;z-index:7;transform:translate(-50%,-50%)}
.cv img{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;user-select:none;-webkit-user-drag:none;visibility:hidden}
.cv.on img{visibility:visible}
/* রুমের সিটে: মুকুট নিজের নাম-প্লেট/ডায়মন্ডের উপরে ওঠে না, পাশের সিটের উপরেও না (অন্য CSS ফাইল ঠিক না থাকলেও কাজ করে) */
.seat{z-index:2}
.seat.has-crown{z-index:1}
.seat .seat-meta{position:relative!important;z-index:12!important}
.seat.has-crown .seat-meta{margin-top:9px!important;width:auto!important;max-width:100%!important;padding:2px 7px 3px!important;background:rgba(14,8,30,.78)!important;border-radius:11px!important;box-shadow:0 2px 8px rgba(0,0,0,.45)}
.seat.has-crown .seat-number{text-shadow:0 1px 3px #000}`;
    function css(){
        if (document.getElementById('moiCrownCss')) return;
        const s = document.createElement('style'); s.id = 'moiCrownCss'; s.textContent = CSS;
        (document.head || document.documentElement).appendChild(s);
    }
    function attach(host, id){
        const c = CROWNS[id]; if (!host || !c) return null;
        css();
        const old = host.querySelector(':scope > .cv');
        if (old && old.dataset.id === id) return old;
        if (old) old.remove();
        if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
        const w = Math.round(c.scale * 1000) / 10;
        const el = document.createElement('span'); el.className = 'cv'; el.dataset.id = id; el.setAttribute('aria-hidden', 'true');
        el.style.cssText = 'width:' + w + '%;height:' + w + '%;margin-left:' + (c.dx * w / 100).toFixed(3) + '%;margin-top:' + (c.dy * w / 100).toFixed(3) + '%';
        const im = new Image(); im.alt = ''; im.draggable = false; im.decoding = 'async';
        /* লোড হলে তবেই দেখায় — নেট ধীর হলে/ফেল করলে কিছুই দেখায় না */
        im.onload = () => el.classList.add('on');
        im.onerror = () => { el.classList.remove('on'); };
        im.src = BASE + c.img;
        el.appendChild(im); host.appendChild(el);
        const st = host.closest && host.closest('.seat'); if (st) st.classList.add('has-crown');
        if (im.complete && im.naturalWidth) el.classList.add('on');
        return el;
    }
    function detach(host){ const o = host && host.querySelector(':scope > .cv'); if (o) o.remove(); const st = host && host.closest && host.closest('.seat'); if (st) st.classList.remove('has-crown'); }
    /* ইউজারের কোন মুকুট (নেই হলে null) */
    function crownOf(u){
        if (!u) return null;
        if (window.MOIStore && u.uid){ const r = MOIStore.crownFor(u.uid); if (r && CROWNS[r]) return r; }   /* ব্যাগ থেকে পরানো স্টোর-রিং সবার আগে */
        if (u.crown && CROWNS[u.crown]) return u.crown;
        try {                                  /* SVIP চালু (রিচার্জে অ্যাক্টিভেট করা) থাকলে → svip1; মেয়াদ শেষ হলে নয় */
            const a = JSON.parse(localStorage.getItem('moi_svip_level_' + u.uid) || 'null');
            if (a && (!a.until || a.until > Date.now())) return 'svip1';
        } catch(e){}
        return null;
    }
    function attachUser(host, u){ const id = crownOf(u); if (id) return attach(host, id); detach(host); return null; }
    window.MOICrown = { attach, attachUser, detach, crownOf, CROWNS };
    css();
})();
