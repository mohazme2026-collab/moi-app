/* room/moi-dm.js — রুমের ভিতর মেসেজিং
   • নিচের 💬✉ মেসেজ বাটন → চ্যাট ৮০% স্ক্রিনে খোলে (voice চলতে থাকে)
   • অন্যের প্রোফাইলের "Message" বাটন:
       বন্ধু না হলে  → "Add Friend" (অনুরোধ যায়) → "Requested" → অ্যাকসেপ্ট হলে "Message"
       সে অনুরোধ পাঠালে → "Accept"
       বন্ধু হলে      → সরাসরি তার চ্যাটে, ফুল স্ক্রিনে
   • ডেমো: ডেমো ইউজার কয়েক সেকেন্ড পরে নিজে অনুরোধ একসেপ্ট করে */
(function(){
    'use strict';
    const S = () => window.MOISync;
    const myUid = () => (window.MOIAuth && MOIAuth.profile && MOIAuth.profile.uid) || '';
    const say = m => { try { (window.toastMsg || console.log)(m); } catch(e){} };
    const curUid = () => (typeof currentProfileUid !== 'undefined' ? currentProfileUid : '');
    const nameOf = uid => { try { const u = state.listeners.find(x => x.uid === uid); return u ? u.name : 'User'; } catch(e){ return 'User'; } };
    const get = k => Object.assign({}, S().get(k, {}) || {});

    function stateOf(uid){
        const me = myUid(); if (!me) return 'none';
        if (get('moi_friends_' + me)[uid]) return 'friend';
        if (get('moi_friend_requests_' + me)[uid]) return 'incoming';
        if (get('moi_sent_requests_' + me)[uid]) return 'sent';
        return 'none';
    }
    const LOOK = {
        friend:   ['fa-comment-dots', 'Message',   1],
        none:     ['fa-user-plus',    'Add Friend', 1],
        sent:     ['fa-clock',        'Requested',  .6],
        incoming: ['fa-check',        'Accept',     1]
    };
    function paint(uid){
        const btn = document.querySelector('.profile-btn.chat-btn'); if (!btn || !uid) return;
        const l = LOOK[stateOf(uid)];
        btn.innerHTML = '<i class="fa-solid ' + l[0] + '"></i><span>' + l[1] + '</span>';
        btn.style.opacity = l[2];
    }
    window.moiProfileDM = uid => paint(uid);

    function sendRequest(uid){
        const me = myUid(), p = MOIAuth.profile;
        if (!me || !uid || uid === me) return;
        if (MOIAuth.isGuest){ say('গেস্ট বন্ধু যোগ করতে পারে না — লগইন করুন'); return; }
        const sent = get('moi_sent_requests_' + me); sent[uid] = true; S().set('moi_sent_requests_' + me, sent);
        const theirs = get('moi_friend_requests_' + uid);
        theirs[me] = { fromUid: me, fromName: p.name || 'User', fromPhoto: p.photo || '', ts: Date.now() };
        S().set('moi_friend_requests_' + uid, theirs);
        say('✅ বন্ধুর অনুরোধ পাঠানো হয়েছে');
        paint(uid);
        /* ডেমো ইউজার কয়েক সেকেন্ড পরে নিজে একসেপ্ট করে */
        if (window.DEMO && (DEMO.USERS && DEMO.USERS[uid] || /^demofriend/.test(uid))){
            setTimeout(() => botAccept(uid), 3500 + Math.random() * 2500);
        }
    }
    function botAccept(uid){
        const me = myUid(); if (!me) return;
        const fr = get('moi_friends_' + me); fr[uid] = true; S().set('moi_friends_' + me, fr);
        const sent = get('moi_sent_requests_' + me); delete sent[uid]; S().set('moi_sent_requests_' + me, sent);
        const theirs = get('moi_friend_requests_' + uid); delete theirs[me]; S().set('moi_friend_requests_' + uid, theirs);
        say('🎉 ' + nameOf(uid) + ' আপনার অনুরোধ গ্রহণ করেছে');
        if (curUid() === uid) paint(uid);
    }
    function acceptFrom(uid){
        const me = myUid(); if (!me) return;
        const fr = get('moi_friends_' + me); fr[uid] = true; S().set('moi_friends_' + me, fr);
        const inc = get('moi_friend_requests_' + me); delete inc[uid]; S().set('moi_friend_requests_' + me, inc);
        say('🎉 আপনারা এখন বন্ধু');
        paint(uid);
    }

    /* প্রোফাইলের Message বাটন */
    window.profileChatNow = () => {
        const uid = curUid(); if (!uid) return;
        const st = stateOf(uid);
        if (st === 'friend'){
            const name = nameOf(uid);
            if (typeof closeUserProfile === 'function') closeUserProfile();
            setTimeout(() => openChatSheet(uid, name), 200);       /* বন্ধু → তার চ্যাটে, ফুল স্ক্রিনে */
        } else if (st === 'incoming') acceptFrom(uid);
        else if (st === 'sent') say('⏳ অনুরোধ পাঠানো হয়েছে — অপেক্ষা করুন');
        else sendRequest(uid);
    };

    /* বন্ধুত্ব/অনুরোধ বদলালে প্রোফাইলের বাটন নিজে আপডেট */
    window.addEventListener('moi:sync', e => {
        const k = (e.detail && e.detail.key) || '', me = myUid();
        if (me && (k === 'moi_friends_' + me || k === 'moi_sent_requests_' + me || k === 'moi_friend_requests_' + me)) paint(curUid());
    });
})();
