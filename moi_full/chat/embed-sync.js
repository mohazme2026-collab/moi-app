/* chat/embed-sync.js — চ্যাট যখন Home-এর ভিতরে (iframe) খোলা থাকে, কারো কথোপকথনে ঢুকলে/বের হলে বাইরের পেজকে জানায়
   যাতে Home নিচের ৩ বাটন লুকিয়ে রাখে (কথোপকথনে) আর লিস্টে ফিরলে আবার দেখায় */
(function(){
    'use strict';
    if (window.parent === window) return;
    let last = null;
    setInterval(() => {
        const open = !!window.currentChatUid;
        if (open === last) return;
        last = open;
        try { window.parent.postMessage({ moiChatConv: open }, '*'); } catch(e){}
    }, 150);
})();
