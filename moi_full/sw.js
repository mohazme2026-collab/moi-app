/* MOI service worker — শুধু "অ্যাপ হিসেবে ইনস্টল" চালু করার জন্য।
   কিছুই ক্যাশ করে না, তাই নতুন ফাইল পুশ করলেই সঙ্গে সঙ্গে নতুন কোড চলে। */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
