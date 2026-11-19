/* MOI service worker — ক্যাশ করে অ্যাপ দ্রুত খোলায়।
   • ছবি/ফন্ট/অ্যানিমেশন/অডিও (বদলায় না): ক্যাশ থেকে সাথে সাথে।
   • HTML/JS/CSS: ক্যাশ থেকে সাথে সাথে দেখায় + পেছনে নতুন কপি এনে রাখে (পরের বার নতুন)।
   • নতুন আপডেট দিলে নিচের BUILD বদলে দিলে পুরনো ক্যাশ পুরো মুছে যায়, প্রথম খোলাতেই নতুন ফাইল আসে। */
var BUILD = 'moi-2026-11-19-a';
var CODE = BUILD + '-code', STATIC = BUILD + '-static';
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
    e.waitUntil(caches.keys().then(function(ks){
        return Promise.all(ks.filter(function(k){ return k !== CODE && k !== STATIC; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); }));
});
var STATIC_RE = /\.(png|jpe?g|webp|gif|svg|ico|woff2?|ttf|json|mp3|ogg|wav|m4a|mp4|webm)$/i;
function putSafe(cache, req, res){ try { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); } catch(x){} return res; }
self.addEventListener('fetch', function(e){
    var r = e.request;
    if (r.method !== 'GET') return;
    var u; try { u = new URL(r.url); } catch(x){ return; }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return;
    var same = u.origin === self.location.origin;
    if (!same) {
        /* বাইরের ছবি/ইমোজি (gstatic ইত্যাদি) — একবার এলে ক্যাশে থাকে */
        if (/(gstatic\.com|randomuser\.me|dicebear\.com|ui-avatars\.com|picsum\.photos)/.test(u.hostname) && (r.destination === 'image' || STATIC_RE.test(u.pathname))) {
            e.respondWith(caches.open(STATIC).then(function(c){
                return c.match(r).then(function(hit){
                    return hit || fetch(r).then(function(res){ return putSafe(c, r, res); });
                });
            }));
        }
        return;
    }
    if (u.pathname.indexOf('/sw.js') > -1) return;
    var isStatic = STATIC_RE.test(u.pathname) && u.pathname.indexOf('/database.rules') < 0;
    if (isStatic) {
        e.respondWith(caches.open(STATIC).then(function(c){
            return c.match(r).then(function(hit){
                return hit || fetch(r).then(function(res){ return putSafe(c, r, res); });
            });
        }));
        return;
    }
    /* HTML / JS / CSS — ক্যাশ আগে, পেছনে আপডেট */
    e.respondWith(caches.open(CODE).then(function(c){
        return c.match(r, { ignoreSearch: false }).then(function(hit){
            var net = fetch(r, { cache: 'no-cache' }).then(function(res){ return putSafe(c, r, res); }).catch(function(){ return hit; });
            return hit || net;
        });
    }));
});
