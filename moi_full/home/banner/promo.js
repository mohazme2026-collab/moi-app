/* home/promo.js — হোমের CP / Rank কার্ড (আর্ট ছবি + ফ্রেমের ভেতরে ঘুরে ঘুরে বদলানো বট প্রোফাইল)
   ⚙️ আর্ট বদলাতে: assets/cp-card.webp ও assets/rank-card.webp বদলান। গোলের জায়গা নিচের CARDS-এ (% এ: x, y = কেন্দ্র, d = ব্যাস, কার্ডের চওড়া ধরে)।
   ⚙️ উপরের বড় ব্যানার: ছবি assets/ban1-3.webp (পরে অ্যাডমিন প্যানেল থেকে SLIDES ভরা হবে)। লুকাতে SHOW_BANNER = false। আসল ছবি দিতে SLIDES-এ { img:'banner/assets/ban1.webp' } দিন। */
(function(){
const SHOW_BANNER = true;
const SLIDES = [
  { img:'banner/assets/ban1.webp', full:'banner/assets/ban1-full.webp' },
  { img:'banner/assets/ban2.webp', full:'banner/assets/ban2-full.webp' },
  { img:'banner/assets/ban3.webp', full:'banner/assets/ban3-full.webp' }
];
const CARDS = {
  cp:   { go:'cp',   img:'banner/assets/cp-card.webp',   ar:824/709, slots:[ {x:25.7,y:69.7,d:27.6}, {x:66.6,y:69.8,d:27.6} ] },
  rank: { go:'rank', img:'banner/assets/rank-card.webp', ar:929/799, slots:[ {x:17.7,y:72.2,d:22.6}, {x:49.7,y:69.2,d:26.2}, {x:82.2,y:72.2,d:22.6} ] }   /* বাঁ = Top2, মাঝ = Top1, ডান = Top3 */
};
function slideHTML(s, i){ if (s.img) return `<div class="ps" data-vi="${i}" style="background:url('${s.img}') center/cover"></div>`; return `<div class="ps" style="--a:${s.a};--b:${s.b}"><i class="o1"></i><i class="o2"></i><span class="pe">${s.ic}</span><div class="pt"><b>${s.t}</b><small>${s.s}</small></div></div>`; }

function pool(){
  let u = []; try { u = Object.values(window.DEMO && DEMO.USERS || {}); } catch(e){}
  u = u.filter(x => x && x.name && x.photo && x.uid !== (window.user && user.uid)).sort((a, b) => (b.diamonds || 0) - (a.diamonds || 0));
  return u.slice(0, 16);
}
const initial = u => ((u.name || '?').trim()[0] || '?');
function faceHTML(u){ return `<img src="${u.photo}" alt="" onerror="this.remove()"><em>${initial(u)}</em>`; }

function cardHTML(k, c){
  return `<button class="pc2 ${k}" data-go="${c.go}" style="aspect-ratio:${c.ar}" aria-label="${k === 'cp' ? 'CP' : 'Rank'}">
    ${c.slots.map((s, i) => `<span class="slot" data-k="${k}" data-i="${i}" style="left:${s.x}%;top:${s.y}%;width:${s.d}%;"><b class="f a"></b><b class="f b"></b></span>`).join('')}
    <img class="art" src="${c.img}" alt="" draggable="false"></button>`;
}
function init(){
  const box = document.getElementById('promo'); if (!box) return;
  box.innerHTML = (SHOW_BANNER ? `<div class="pslides" id="pslides">${SLIDES.map(slideHTML).join('')}</div><div class="pdots" id="pdots">${SLIDES.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : '') +
    `<div class="pcards" id="pcards">${cardHTML('cp', CARDS.cp)}${cardHTML('rank', CARDS.rank)}<div class="pc2 spare" aria-hidden="true"></div></div>`;
  if (SHOW_BANNER){
    const sl = document.getElementById('pslides'), dots = document.getElementById('pdots').children;
    let i = 0, hold = 0;
    sl.addEventListener('scroll', () => { const k = Math.round(sl.scrollLeft / sl.clientWidth); [...dots].forEach((d, j) => d.classList.toggle('on', j === k)); i = k; });
    ['touchstart','pointerdown'].forEach(e => sl.addEventListener(e, () => { hold = Date.now() + 6000; }, { passive:true }));
    setInterval(() => { if (Date.now() > hold && !document.hidden && !document.getElementById('v-home').hidden){ i = (i + 1) % SLIDES.length; sl.scrollTo({ left: i * sl.clientWidth, behavior:'smooth' }); } }, 3000);

    /* ═══ ছবিতে ট্যাপ → ফুল স্ক্রিনে দেখা; ‹ ব্যাক (বা ফোনের ব্যাক) চাপলে হোমে ফেরত ═══ */
    if (!document.getElementById('pvStyle')){
      const st = document.createElement('style'); st.id = 'pvStyle';
      st.textContent = '.pv{position:fixed;inset:0;z-index:3000;background:#000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .22s}.pv.show{opacity:1}.pv img{max-width:100%;max-height:100%;object-fit:contain;-webkit-user-drag:none}.pv .pv-back{position:absolute;left:12px;top:calc(12px + env(safe-area-inset-top,0px));width:42px;height:42px;border-radius:50%;border:0;background:rgba(255,255,255,.18);backdrop-filter:blur(6px);color:#fff;font-size:30px;line-height:40px;padding:0 0 3px;cursor:pointer}.ps[data-vi]{cursor:zoom-in}';
      document.head.appendChild(st);
    }
    let pv = null;
    function closeViewer(fromPop){
      if (!pv) return; const e = pv; pv = null; e.classList.remove('show'); setTimeout(() => e.remove(), 230);
      hold = Date.now() + 6000;
      if (!fromPop && history.state && history.state.moiBanner) history.back();
    }
    function openViewer(k){
      if (pv) return; const s = SLIDES[k]; if (!s || !s.img) return;
      pv = document.createElement('div'); pv.className = 'pv';
      pv.innerHTML = `<img src="${s.full || s.img}" alt="" draggable="false"><button class="pv-back" aria-label="পেছনে">‹</button>`;
      document.body.appendChild(pv);
      history.pushState({ moiBanner: 1 }, '');
      requestAnimationFrame(() => pv && pv.classList.add('show'));
      pv.addEventListener('click', (e) => { if (e.target.tagName !== 'IMG') closeViewer(); });
    }
    sl.addEventListener('click', (e) => { const t = e.target.closest('[data-vi]'); if (t) openViewer(+t.dataset.vi); });
    window.addEventListener('popstate', () => { if (pv) closeViewer(true); });
  }
  const P = pool(); if (!P.length) return;
  let tick = 0;
  /* প্রতিটা গোলে আলাদা ইউজার; প্রতিবার একে একে (stagger) বদলায় */
  const slots = [...box.querySelectorAll('.slot')];
  function setSlot(el, u){
    const cur = el.querySelector('.f.on'), nxt = el.querySelector('.f:not(.on)');
    nxt.innerHTML = faceHTML(u); nxt.classList.add('on'); if (cur) cur.classList.remove('on');
  }
  const idx = (n, t) => (n * 5 + t * (n % 3 + 1) + n) % P.length;
  slots.forEach((el, n) => setSlot(el, P[idx(n, 0)]));
  setInterval(() => {
    if (document.hidden || document.getElementById('v-home').hidden) return;
    tick++;
    slots.forEach((el, n) => setTimeout(() => setSlot(el, P[idx(n, tick)]), n * 350));
  }, 3500);
}
(window.MOIReady || Promise.resolve()).then(() => setTimeout(init, 0));
})();
