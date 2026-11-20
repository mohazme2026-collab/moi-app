/* ═══ প্রোফাইল কার্ড থিম (SVIP সুবিধা) — প্রোফাইলের ব্যাকগ্রাউন্ডে জীবন্ত আর্ট ═══
   প্রোফাইলের লেআউট আগের মতোই; ইউজারের নিজের ব্যাকগ্রাউন্ড ছবি (কভার) যেমন ছিল তেমনই থাকে।
   আর্টটা কভারের ঠিক নিচ থেকে শুরু হয়ে নিচের পুরো অংশের পিছনে থাকে, স্ক্রল করলে বাকিটা দেখা যায়।
   এনিমেশন: শ্বাস নেওয়ার মতো দোলা · সবুজ আগুনের ঝিকমিক · আলোর ঝলক · ভেসে ওঠা ঝলক-কণা
   নতুন লেভেল: STYLES এ এক এন্ট্রি + shared/svip/levels/levelN/card_art.webp */
(function(){
    const BASE = (function(){ const s = document.currentScript; return s ? s.src.replace(/[^\/]*$/, '') : '../shared/svip/'; })() + 'levels/';
    const STYLES = {
        svip1: { art: 'level1/card_art.webp', ar: 1106 / 1422, bg: ['#020c06', '#06180c'], glow: '90,255,110' }
    };
    function css(){
        if (document.getElementById('moi-card-css')) return;
        const st = document.createElement('style'); st.id = 'moi-card-css';
        st.textContent = `
#userProfileModal.pf-card .pf-sheet{position:relative}
#userProfileModal.pf-card .pf-sheet>*:not(.cdx){z-index:1}
#userProfileModal.pf-card .profile-name,#userProfileModal.pf-card .profile-uid{text-shadow:0 2px 8px #000}
.cdx{position:absolute;left:0;right:0;top:var(--cdx-top,170px);width:100%;overflow:hidden;pointer-events:none;z-index:0;contain:paint;-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 7%,#000 62%,transparent 100%);mask-image:linear-gradient(180deg,transparent 0,#000 7%,#000 62%,transparent 100%)}
.cdx::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.2) 0,rgba(0,0,0,.52) 38%,rgba(0,0,0,.68) 100%)}
.cdx .cdx-glow{position:absolute;inset:0;background:radial-gradient(34% 22% at 8% 38%,rgba(var(--g),.5),transparent 70%),radial-gradient(34% 22% at 92% 38%,rgba(var(--g),.5),transparent 70%),radial-gradient(36% 18% at 50% 24%,rgba(var(--g),.3),transparent 72%);animation:cdxGlow 3.2s ease-in-out infinite}
.cdx .cdx-sway{position:absolute;inset:0;transform-origin:50% 0;animation:cdxSway 5.2s ease-in-out infinite;will-change:transform}
.cdx .cdx-art,.cdx .cdx-fl,.cdx .cdx-gl{position:absolute;inset:0;width:100%;height:100%;display:block;-webkit-user-drag:none}
.cdx .cdx-fl{mix-blend-mode:screen;filter:hue-rotate(-18deg) saturate(1.8) brightness(1.5);opacity:0;animation:cdxFlick 2.1s ease-in-out infinite}
.cdx .cdx-gl{background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,0) 40%,rgba(255,255,255,.75) 50%,rgba(255,255,255,0) 60%,transparent 62%) 0 0/250% 100% no-repeat;-webkit-mask:var(--art) center/100% 100% no-repeat;mask:var(--art) center/100% 100% no-repeat;mix-blend-mode:screen;animation:cdxGlint 3.8s ease-in-out infinite}
.cdx .cdx-sp{position:absolute;width:5px;height:5px;border-radius:50%;background:radial-gradient(circle,#fff,rgba(var(--g),.9) 45%,transparent 70%);opacity:0;animation:cdxSp 3.4s ease-in infinite}
@keyframes cdxSway{0%,100%{transform:scale(1)}50%{transform:scale(1.018) translateY(1px)}}
@keyframes cdxGlow{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes cdxFlick{0%,100%{opacity:0;transform:translateY(0)}30%{opacity:.34;transform:translateY(-1.5px)}60%{opacity:.12;transform:translateY(-.5px)}80%{opacity:.4;transform:translateY(-2px)}}
@keyframes cdxGlint{0%,18%{background-position:130% 0}58%,100%{background-position:-60% 0}}
@keyframes cdxSp{0%{transform:translateY(0) scale(.4);opacity:0}15%{opacity:1}100%{transform:translateY(-80px) scale(1);opacity:0}}
@media (prefers-reduced-motion:reduce){.cdx *{animation:none!important}}
.cdx-prev{position:relative;width:100%;aspect-ratio:1106/820;overflow:hidden;border-radius:8px;background:#06180c}
.cdx-prev .cdx{position:relative;top:0;aspect-ratio:1106/1422}
.cdx-prev .cdx::after{display:none}
.cdx-prev .cdx{-webkit-mask-image:none;mask-image:none}
`;
        document.head.appendChild(st);
    }
    function build(id){
        const s = STYLES[id]; if (!s) return null;
        const url = BASE + s.art;
        const d = document.createElement('div'); d.className = 'cdx'; d.style.aspectRatio = s.ar;
        d.style.setProperty('--g', s.glow); d.style.setProperty('--art', 'url("' + url + '")');
        let sp = '';
        for (let i = 0; i < 14; i++){
            const x = i % 2 ? 3 + Math.random() * 22 : 75 + Math.random() * 22;      /* দুই পাশের আগুনের জায়গায় */
            sp += '<i class="cdx-sp" style="left:' + x.toFixed(1) + '%;top:' + (22 + Math.random() * 30).toFixed(1) + '%;animation-delay:' + (Math.random() * 3.4).toFixed(2) + 's;animation-duration:' + (2.6 + Math.random() * 2).toFixed(1) + 's"></i>';
        }
        d.innerHTML = '<div class="cdx-glow"></div><div class="cdx-sway"><img class="cdx-art" alt="" draggable="false" src="' + url + '"><img class="cdx-fl" alt="" draggable="false" src="' + url + '"><i class="cdx-gl"></i></div>' + sp;
        return d;
    }
    function styleOf(uid, u){
        if (u && u.card && STYLES[u.card]) return u.card;
        const pk = window.MOIPerks && uid ? MOIPerks.perksOf(uid) : null;
        return pk && pk.card && STYLES[pk.card] ? pk.card : null;
    }
    /* রুমের প্রোফাইল মডাল — openUserProfile থেকে ডাকা হয়। SVIP না হলে আগের ডিজাইনই থাকে */
    function apply(uid, photo, u){
        const m = document.getElementById('userProfileModal'); if (!m) return;
        const host = m.querySelector('.pf-sheet') || m;
        const old = m.querySelector('.cdx'); if (old) old.remove();
        const id = styleOf(uid, u);
        m.classList.toggle('pf-card', !!id);
        if (!id) return;
        css();
        const d = build(id); if (!d) return;
        host.insertBefore(d, host.firstChild);
        /* আর্ট শুরু হয় ইউজারের ব্যাকগ্রাউন্ড ছবি (কভার) যেখানে শেষ সেখান থেকে — কভার আগের মতোই থাকে */
        const cov = host.querySelector('.profile-cover');
        const place = () => { if (cov && cov.offsetHeight) d.style.setProperty('--cdx-top', (cov.offsetTop + cov.offsetHeight - 2) + 'px'); };
        place(); requestAnimationFrame(place); setTimeout(place, 250);
        if (window.ResizeObserver && cov){ if (host._cdxRO) host._cdxRO.disconnect(); host._cdxRO = new ResizeObserver(place); host._cdxRO.observe(cov); }
        if (host.scrollTo) host.scrollTo(0, 0);
    }
    function preview(id){ css(); const d = build(id || 'svip1'); if (!d) return ''; const w = document.createElement('div'); w.className = 'cdx-prev'; w.appendChild(d); const o = document.createElement('div'); o.appendChild(w); return o.innerHTML; }
    window.MOICard = { apply, preview, STYLES };
})();
