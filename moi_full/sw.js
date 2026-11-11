/* MOI service worker — অ্যাপ হিসেবে ইনস্টলের জন্য।
   ক্যাশ করে না; বরং প্রতিবার সার্ভারকে জিজ্ঞেস করে ফাইল নতুন কিনা (না বদলালে ছোট উত্তর আসে),
   যাতে GitHub Pages-এর পুরনো ক্যাশ থেকে আগের ফাইল না দেখায়। */
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function(e){
    var r = e.request;
    if (r.method !== 'GET') return;
    var u; try { u = new URL(r.url); } catch(x){ return; }
    if (u.origin !== self.location.origin) return;
    e.respondWith(fetch(r, { cache: 'no-cache' }).catch(function(){ return fetch(r); }));
});
