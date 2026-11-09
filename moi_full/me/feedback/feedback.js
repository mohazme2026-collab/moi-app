/* me/feedback/feedback.js — Feedback পেজ
   পাঠানো ফিডব্যাক জমা হয়: ls_set('moi_support_<uid>', [ { msg, type, rating, contact, name, ts, uid } … ])
   (Help পেজের পুরনো মেসেজও এই একই তালিকায় আছে) */
(function(){
    'use strict';
    const $ = id => document.getElementById(id);
    const ME = '../index.html';   /* feedback ফোল্ডার me-এর ভিতরে, তাই এক ধাপ উপরে = Me পেজ */
    const MIN = 10;               /* কমপক্ষে কত অক্ষর লিখতে হবে */
    const TYPES = { suggestion: ['💡', 'Suggestion'], bug: ['🐞', 'Bug'], payment: ['💳', 'Payment'], account: ['👤', 'Account'], report: ['🚩', 'Report'], other: ['💬', 'Other'] };
    const FACES = ['', '😞', '🙁', '😐', '🙂', '😍'];

    let type = 'suggestion', rating = 0, toastT = null;
    const toast = m => { const t = $('fbToast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2000); };
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    function who(){
        const p = window.MOIAuth && MOIAuth.profile; if (p && p.uid) return p;
        try { return JSON.parse(localStorage.getItem('moi_user')) || {}; } catch(e){ return {}; }
    }
    const key = () => 'moi_support_' + (who().uid || 'guest');

    $('fbBack').addEventListener('click', () => { if (document.referrer && history.length > 1) history.back(); else location.href = ME; });

    /* ধরন বাছাই */
    document.querySelectorAll('.fb-chip').forEach(c => c.addEventListener('click', () => {
        type = c.dataset.t; document.querySelectorAll('.fb-chip').forEach(x => x.classList.toggle('on', x === c));
    }));
    /* অভিজ্ঞতা (আবার চাপলে বাদ) */
    document.querySelectorAll('.fb-face').forEach(f => f.addEventListener('click', () => {
        const r = +f.dataset.r; rating = rating === r ? 0 : r;
        document.querySelectorAll('.fb-face').forEach(x => x.classList.toggle('on', +x.dataset.r === rating));
    }));
    /* লেখা */
    const msg = $('fbMsg');
    function check(){ $('fbCnt').textContent = msg.value.length; $('fbSubmit').disabled = msg.value.trim().length < MIN; }
    msg.addEventListener('input', check);

    $('fbCopy').addEventListener('click', () => {
        try { navigator.clipboard.writeText('support@moi.app'); toast('কপি হয়েছে'); } catch(e){ toast('কপি করা যায়নি'); }
    });

    /* পাঠানো */
    $('fbSubmit').addEventListener('click', () => {
        const text = msg.value.trim();
        if (text.length < MIN){ toast('আরও একটু বিস্তারিত লিখুন'); return; }
        const u = who();
        const list = ls_get(key(), []) || [];
        list.push({ msg: text.slice(0, 500), type, rating, contact: $('fbContact').value.trim().slice(0, 60), name: u.name || '', moiId: u.moiId || '', ts: Date.now(), uid: u.uid || 'guest' });
        ls_set(key(), list.slice(-50));
        msg.value = ''; $('fbContact').value = ''; rating = 0;
        document.querySelectorAll('.fb-face').forEach(x => x.classList.remove('on'));
        check(); renderHist(); toast('ফিডব্যাক পাঠানো হয়েছে, ধন্যবাদ!');
        $('fbHistH').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    /* আমার পাঠানো ফিডব্যাক */
    function renderHist(){
        let list = []; try { list = ls_get(key(), []) || []; } catch(e){}
        list = list.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
        $('fbHistH').style.display = list.length ? '' : 'none';
        $('fbHist').innerHTML = list.map(x => {
            const t = TYPES[x.type] || ['💬', 'Message'], d = new Date(x.ts || Date.now());
            const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            return '<div class="fb-item"><div class="row"><span class="tag">' + t[0] + ' ' + t[1] + '</span><span>' + ds + '</span>' + (x.rating ? '<span class="face">' + FACES[x.rating] + '</span>' : '') + '</div><p>' + esc(x.msg) + '</p></div>';
        }).join('');
    }

    function init(){ check(); renderHist(); window.addEventListener('moi:sync', e => { const k = (e.detail && e.detail.key) || ''; if (/^moi_support_/.test(k)) renderHist(); }); }
    (window.MOIReady || Promise.resolve()).then(() => { try { init(); } catch(e){ console.error('[Feedback]', e); } });
})();
