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
        svip1: { vid: '../../store/rings/svip1_dragon.mp4', scale: 1.516, dx: -0.02, dy: -6.12 },
        /* স্টোরের রিং (animated SVG) — ছবি shared/store/rings/ এ; ring-এর মাঝখান ছবির কেন্দ্র থেকে ২.১% নিচে, তাই dy = -2.14 */
        wg1: { vid: '../../store/rings/wings_gold.mp4', scale: 1.48, dx: 0.06, dy: -8.3 },
        wv1: { vid: '../../store/rings/wings_violet.mp4', scale: 1.533, dx: -0.0, dy: -7.94 },
        lion1: { vid: '../../store/rings/lion_amethyst.mp4', scale: 1.522, dx: 0.05, dy: -4.85 },
        phx1: { vid: '../../store/rings/phoenix_frost.mp4', scale: 1.548, dx: -0.04, dy: -7.54 },
        heart1: { vid: '../../store/rings/heart_rose.mp4', scale: 1.379, dx: -0.02, dy: -2.32 },
        cobra1: { vid: '../../store/rings/cobra_jade.mp4', scale: 1.391, dx: -0.02, dy: -1.19 },
        wolf1: { vid: '../../store/rings/wolf_ice.mp4', scale: 1.484, dx: -0.04, dy: -2.24 },
        eagle1: { vid: '../../store/rings/eagle_lava.mp4', scale: 1.455, dx: -0.06, dy: -3.38 },
        vip1: { vid: '../../store/rings/vip1_ring.mp4', scale: 1.384, ar: 1.3403, dx: -0.12, dy: -12.93 },
        /* স্টাফ রিং (সেলার/অফিশিয়াল/ওনার) — স্থির ছবি + ঝিকমিক লেখা */
        st_seller: { img: 'staff/ring_seller.webp', staff: 1, scale: 1.58, dx: 0, dy: 1.5, txt: 'SELLER', ty: 25.5, tw: 30 },
        st_official: { img: 'staff/ring_official.webp', staff: 1, scale: 1.53, dx: 0, dy: -1.5, txt: 'OFFICIAL', ty: 79, tw: 42 },
        st_owner: { img: 'staff/ring_owner.webp', staff: 1, scale: 1.58, dx: 0, dy: 0.5, txt: 'MOI OWNER', ty: 81, tw: 40 },
        gold1: { vid: '../../store/rings/ring_gold.mp4', scale: 2.15, dx: 0.7, dy: -4.0 }
    };
    const CSS = `.cv{position:absolute;left:50%;top:50%;pointer-events:none;z-index:7;transform:translate(-50%,-50%)}
.cv img{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;user-select:none;-webkit-user-drag:none;visibility:hidden}
.cv.on img{visibility:visible}
.cv canvas{display:block;width:100%;height:100%;pointer-events:none;visibility:hidden}
.cv.on canvas{visibility:visible}
/* রুমের সিটে: মুকুট নিজের নাম-প্লেট/ডায়মন্ডের উপরে ওঠে না, পাশের সিটের উপরেও না (অন্য CSS ফাইল ঠিক না থাকলেও কাজ করে) */
.cv .cvt{position:absolute;left:50%;transform:translate(-50%,-50%);font:900 5.2cqw/1 Poppins,Arial,sans-serif;letter-spacing:.08em;white-space:nowrap;background:linear-gradient(100deg,#b8860b 0,#ffe27a 30%,#fff 50%,#ffe27a 70%,#b8860b 100%) 0 0/250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 1px 1px #000) drop-shadow(0 0 3px rgba(255,200,60,.7));animation:cvtShine 2.6s linear infinite}
.cv .cvt.pill{padding:.5em 1.1em;background-color:#0b3a22;border-radius:99px}
.cv.stf{container-type:inline-size}
.cv .cvs{position:absolute;width:6%;height:6%;background:radial-gradient(circle,#fff 0,rgba(255,230,120,.9) 35%,transparent 70%);clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);opacity:0;animation:cvsTw 2.4s ease-in-out infinite}
@keyframes cvtShine{to{background-position:-250% 0}}
@keyframes cvsTw{0%,100%{opacity:0;transform:scale(.3) rotate(0)}50%{opacity:1;transform:scale(1) rotate(45deg)}}
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
    /* হালকা মোড: true হলে মুকুট/রিং আঁকা হয় না (ভারী ছবি নামে না)। হালকা MP4 মুকুট এলে false করা হবে */
    const LITE = true;
    function attach(host, id){
        const c = CROWNS[id]; if (!host || !c || (LITE && !c.vid && !c.staff)) return null;
        css();
        const old = host.querySelector(':scope > .cv');
        if (old && old.dataset.id === id) return old;
        if (old) old.remove();
        if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
        const w = Math.round(c.scale * 1000) / 10;
        const el = document.createElement('span'); el.className = 'cv'; el.dataset.id = id; el.setAttribute('aria-hidden', 'true');
        el.style.cssText = 'width:' + w + '%;height:' + (w * (c.ar || 1)).toFixed(2) + '%;margin-left:' + (c.dx * w / 100).toFixed(3) + '%;margin-top:' + (c.dy * w / 100).toFixed(3) + '%';
        if (c.vid){                              /* হালকা প্যাকড-আলফা MP4 রিং — ভিডিও একটাই চলে */
            const st0 = host.closest && host.closest('.seat'); if (st0) st0.classList.add('has-crown');
            host.appendChild(el);
            const go = () => window.MOIRingVid && MOIRingVid.mount(el, BASE + c.vid, () => el.classList.add('on'));
            if (window.MOIRingVid) go();
            else { const s = document.createElement('script'); s.src = BASE + '../ringvid.js'; s.onload = go; (document.head || document.documentElement).appendChild(s); }
            return el;
        }
        const im = new Image(); im.alt = ''; im.draggable = false; im.decoding = 'async';
        /* লোড হলে তবেই দেখায় — নেট ধীর হলে/ফেল করলে কিছুই দেখায় না */
        im.onload = () => el.classList.add('on');
        im.onerror = () => { el.classList.remove('on'); };
        im.src = BASE + c.img;
        el.appendChild(im); host.appendChild(el);
        if (c.staff){
            el.classList.add('stf');
            const sp = [[14,22],[86,24],[8,60],[92,62],[30,92],[70,94],[50,8]].map((q, i) => '<i class="cvs" style="left:' + q[0] + '%;top:' + q[1] + '%;animation-delay:' + (i * .37).toFixed(2) + 's"></i>').join('');
            el.insertAdjacentHTML('beforeend', sp + '<b class="cvt' + (id === 'st_seller' ? ' pill' : '') + '" style="top:' + c.ty + '%;font-size:' + (c.tw / (c.txt.length * .62)).toFixed(1) + 'cqw">' + c.txt + '</b>');
        }
        const st = host.closest && host.closest('.seat'); if (st) st.classList.add('has-crown');
        if (im.complete && im.naturalWidth) el.classList.add('on');
        return el;
    }
    function detach(host){ const o = host && host.querySelector(':scope > .cv'); if (o) o.remove(); const st = host && host.closest && host.closest('.seat'); if (st) st.classList.remove('has-crown'); }
    /* ইউজারের কোন মুকুট (নেই হলে null) */
    /* স্টাফ রোল: developer→owner · superadmin→official · distributor→seller (নিজের আইডি বা নিবন্ধিত তালিকা থেকে) */
    const SROLE = { developer: 'owner', superadmin: 'official', distributor: 'seller' };
    function staffRole(u){
        if (!u) return null;
        if (SROLE[u.role]) return SROLE[u.role];
        try { const me = window.MOIAuth && MOIAuth.profile; if (me && u.uid && me.uid === u.uid && SROLE[me.role]) return SROLE[me.role];
              const reg = JSON.parse(localStorage.getItem('moi_staff_reg') || '{}'); return u.uid && SROLE[reg[u.uid]] ? SROLE[reg[u.uid]] : null; } catch(e){ return null; }
    }
    window.MOIStaffRole = staffRole;
    const BADGE_BASE = SRC.replace(/[^\/]*$/, '') + '../staff/';
    /* নামের পাশে/প্রোফাইলের নিচে বসার ব্যাজ (স্টাফ না হলে খালি) */
    window.MOIStaffBadge = function(u, h){ const r = staffRole(u); return r ? '<img class="stfbdg" alt="' + r + '" src="' + BADGE_BASE + 'badge_' + r + '.webp" style="height:' + (h || 20) + 'px;width:auto;vertical-align:middle;margin-left:5px;display:inline-block">' : ''; };
    function crownOf(u){
        if (!u) return null;
        const sr = staffRole(u); if (sr) return 'st_' + sr;
        if (window.MOIStore && u.uid){ const r = MOIStore.crownFor(u.uid); if (r && CROWNS[r]) return r; }   /* ব্যাগ থেকে পরানো স্টোর-রিং সবার আগে */
        if (u.crown && CROWNS[u.crown]) return u.crown;
        if (window.MOIPerks && u.uid){ const pk = MOIPerks.perksOf(u.uid); return pk && pk.crown && CROWNS[pk.crown] ? pk.crown : null; }   /* SVIP/VIP মুকুট — ব্যাগে বন্ধ থাকলে নয় */
        return null;
    }
    function attachUser(host, u){ const id = crownOf(u); if (id) return attach(host, id); detach(host); return null; }
    window.MOICrown = { attach, attachUser, detach, crownOf, CROWNS };
    css();
})();
