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
    function levelOf(uid){
        try {
            const a = JSON.parse(localStorage.getItem('moi_svip_level_' + uid) || 'null');
            if (a && (!a.until || a.until > Date.now())) return a.level || 1;
        } catch(e){}
        return 0;
    }
    function perksOf(uid){
        let l = levelOf(uid);
        while (l > 0 && !PERKS[l]) l--;          /* সেই লেভেলের সুবিধা এখনও না থাকলে নিচেরটা */
        return l ? Object.assign({ level: l }, PERKS[l]) : null;
    }
    window.MOIPerks = { PERKS, levelOf, perksOf };
})();
