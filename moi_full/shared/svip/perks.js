/* ═══ SVIP সুবিধার তালিকা — নতুন লেভেল (SVIP2, SVIP3…) যোগ করতে শুধু এখানে এক লাইন বাড়ান ═══
   crown  → shared/crown-video.js এর CROWNS এর আইডি
   entry  → shared/entry-fx.js এর EFFECTS এর আইডি
   chat   → shared/svip/chat.js এর STYLES এর আইডি
   card   → shared/svip/card.js এর STYLES এর আইডি (প্রোফাইল কার্ড)
   পরে আরও সুবিধা (frame, bubble, badge…) এখানেই যোগ হবে */
(function(){
    const PERKS = {
        1: { crown: 'svip1', entry: 'svip1', chat: 'svip1', card: 'svip1' }
    };
    /* VIP১ সুবিধা (SVIP না থাকলে এগুলো) */
    const VPERKS = {
        1: { crown: 'vip1', entry: 'vip1', chat: 'vip1', card: 'vip1' }
    };
    function levelOf(uid){
        try {
            const a = JSON.parse(localStorage.getItem('moi_svip_level_' + uid) || 'null');
            if (a && (!a.until || a.until > Date.now())) return a.level || 1;
        } catch(e){}
        return 0;
    }
    function vipLevelOf(uid){
        try {
            const a = JSON.parse(localStorage.getItem('moi_vip_level_' + uid) || 'null');
            if (a && (!a.until || a.until > Date.now())) return a.level || 1;
        } catch(e){}
        return 0;
    }
    /* ব্যাগ থেকে চালু/বন্ধ: moi_perkoff_<uid> = { 'vip.crown': true, 'svip.chat': true … } — বন্ধ থাকলে ওই সুবিধা কোথাও দেখায় না */
    function offMap(uid){ try { return JSON.parse(localStorage.getItem('moi_perkoff_' + uid) || '{}') || {}; } catch(e){ return {}; } }
    function isOff(uid, tier, kind){ return !!offMap(uid)[tier + '.' + kind]; }
    function setOff(uid, tier, kind, off){
        const m = offMap(uid); if (off) m[tier + '.' + kind] = true; else delete m[tier + '.' + kind];
        try { localStorage.setItem('moi_perkoff_' + uid, JSON.stringify(m)); } catch(e){}
        try { window.dispatchEvent(new CustomEvent('moi:perks', { detail: { uid } })); } catch(e){}
    }
    function perksOf(uid){
        const r = rawPerksOf(uid); if (!r) return r;
        const tier = r.vip ? 'vip' : 'svip', m = offMap(uid);
        ['crown', 'entry', 'chat', 'card'].forEach(k => { if (m[tier + '.' + k]) delete r[k]; });
        return r;
    }
    function rawPerksOf(uid){
        let l = levelOf(uid);
        while (l > 0 && !PERKS[l]) l--;          /* সেই লেভেলের সুবিধা এখনও না থাকলে নিচেরটা */
        if (l) return Object.assign({ level: l }, PERKS[l]);
        let v = vipLevelOf(uid);
        while (v > 0 && !VPERKS[v]) v--;
        return v ? Object.assign({ level: v, vip: true }, VPERKS[v]) : null;
    }
    window.MOIPerks = { PERKS, VPERKS, levelOf, vipLevelOf, perksOf, isOff, setOff };
})();
