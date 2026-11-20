/* ═══ চ্যাট ব্যানার (SVIP সুবিধা) — কমেন্ট ব্যানারের ভিতরেই থাকে, কমেন্ট বড় হলে ব্যানারও বড় হয় ═══
   নতুন লেভেল: STYLES এ এক এন্ট্রি + shared/svip/levels/levelN/chat_frame.webp (৯-স্লাইস ফ্রেম) + chat_crest.webp (মাথার লোগো) */
(function(){
    const BASE = (function(){ const s = document.currentScript; return s ? s.src.replace(/[^\/]*$/, '') : '../shared/'; })() + 'levels/';
    const STYLES = {
        svip1: { frame: 'level1/chat_frame.webp', crest: 'level1/chat_crest.webp' },
        /* স্টোরের ব্যানার (শুধু ফ্রেম, মাথার লোগো ছবির ভেতরেই): slice = ছবির কোণার মাপ, bw = পর্দায় দেখানোর মাপ */
        vipban: { frame: '../../store/bubbles/bubble_vip.webp', slice: '150 215 108 215', bw: '39px 56px 28px 56px', pad: '1px 2px 6px', min: '282px', color: '#150a45', shadow: '0 1px 0 rgba(255,255,255,.6)', nameGap: '4px' }
    };
    function css(){
        if (document.getElementById('moi-chatfx-css')) return;
        let t = '';
        Object.keys(STYLES).forEach(id => {
            const s = STYLES[id];
            t += `.cfx.cfx-${id} .cfx-b{border-image:url("${BASE + s.frame}") ${s.slice || '60 125 60 125'} fill/${s.bw || '10px 20px 10px 20px'} stretch;border-width:${s.bw || '10px 20px 10px 20px'}}\n`;
            if (s.crest) t += `.cfx.cfx-${id} .cfx-b::before{background-image:url("${BASE + s.crest}")}\n`;
            else t += `.cfx.cfx-${id} .cfx-b::before{display:none}\n`;
            if (s.pad) t += `.cfx.cfx-${id} .cfx-b{padding:${s.pad}}\n`;
            if (s.min) t += `.cfx.cfx-${id} .cfx-b{min-width:${s.min}}\n`;
            if (s.color) t += `.cfx.cfx-${id} .cfx-b{color:${s.color};text-shadow:${s.shadow || 'none'}}\n.cfx.cfx-${id} .cfx-b .msg-tag{color:#4b2bb5}\n`;
            if (s.nameGap) t += `.cfx.cfx-${id} .msg-name{margin-bottom:${s.nameGap}}\n`;
        });
        t += `
.msg-item.cfx{display:flex;align-items:flex-start;gap:7px;padding:3px 0 5px}
.cfx .cfx-av{flex:0 0 auto;width:30px;height:30px;border-radius:50%;object-fit:cover;border:1.5px solid #ffcf5a;box-shadow:0 0 8px rgba(255,170,40,.5);background:#2a1a40}
.cfx .cfx-col{min-width:0;display:flex;flex-direction:column;align-items:flex-start;max-width:calc(100% - 38px)}
.cfx .msg-name{margin:0 0 7px;font-weight:700}
.cfx .msg-name::after{content:''}
.cfx .cfx-b{position:relative;box-sizing:border-box;max-width:100%;border-style:solid;border-color:transparent;border-width:10px 20px 10px 20px;padding:5px 4px 6px;min-width:64px;color:#fff;font-size:12.5px;font-weight:700;line-height:1.45;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;text-shadow:0 0 3px #1c0a4d,0 1px 2px #1c0a4d,0 0 8px rgba(28,10,77,.9)}
.cfx .cfx-b::before{content:'';position:absolute;left:50%;top:-22px;width:58px;height:15px;transform:translateX(-50%);background-size:contain;background-repeat:no-repeat;background-position:center;pointer-events:none}
.cfx .cfx-b .msg-tag{color:#ffe08a}
`;
        const st = document.createElement('style'); st.id = 'moi-chatfx-css'; st.textContent = t; document.head.appendChild(st);
    }
    function esc(t){ return String(t == null ? '' : t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
    function styleOf(uid, m){
        if (m && m.chatFx && STYLES[m.chatFx]) return m.chatFx;
        const sb = window.MOIStore && uid ? MOIStore.bubbleFor(uid) : null;   /* ব্যাগ থেকে পরা স্টোর-ব্যানার আগে */
        if (sb && STYLES[sb]) return sb;
        const pk = window.MOIPerks && uid ? MOIPerks.perksOf(uid) : null;
        return pk && pk.chat && STYLES[pk.chat] ? pk.chat : null;
    }
    /* পাঠানোর সময় মেসেজে স্টাইল লিখে দিন — সবার স্ক্রিনে একই দেখাবে */
    function tag(uid){ const sb = window.MOIStore && uid ? MOIStore.bubbleFor(uid) : null; if (sb) return sb; const pk = window.MOIPerks && uid ? MOIPerks.perksOf(uid) : null; return pk && pk.chat ? pk.chat : null; }
    /* ফিডের এক লাইন — SVIP না হলে null (সাধারণ লাইন চলবে) */
    function row(m){
        if (!m || m.type === 'gift') return null;
        const uid = m.senderUid || m.uid, id = styleOf(uid, m); if (!id) return null;
        css();
        let av = m.avatar || m.photo || '';
        try { if (typeof getUser === 'function'){ const u = getUser(uid); if (u && (u.photo || u.avatar)) av = u.photo || u.avatar; } } catch(e){}
        if (!av) av = window.FALLBACK_IMG || '';
        return '<div class="msg-item cfx cfx-' + id + '"><img class="cfx-av" src="' + esc(av) + '" alt="" draggable="false"><div class="cfx-col"><span class="msg-name">' + esc(m.name) + '</span><div class="cfx-b">' + esc(m.text) + '</div></div></div>';
    }
    function preview(id, text){ css(); id = id || 'svip1'; return '<div class="cfx cfx-' + id + '" style="display:block;width:100%"><div class="cfx-col" style="max-width:100%;align-items:center"><div class="cfx-b" style="margin-top:12px">' + esc(text || 'Hello') + '</div></div></div>'; }
    window.MOIChatFx = { row, tag, preview, STYLES };
})();
