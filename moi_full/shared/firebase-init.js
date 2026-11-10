/* ═══ সত্যিকারের দেখা উচ্চতা (স্ট্যাটাস বার/নেভ বার বাদ) → --app-h ═══ */
(function(){
    function setH(){ try { document.documentElement.style.setProperty('--app-h', window.innerHeight + 'px'); } catch(e){} }
    setH();
    window.addEventListener('resize', setH);
    window.addEventListener('orientationchange', function(){ setTimeout(setH, 200); });
    window.addEventListener('pageshow', setH);
    setTimeout(setH, 300);
})();

/* ═══ PWA: অ্যাপ হিসেবে ইনস্টল (সব পেজে একবারেই) ═══
   এই ফাইল সব পেজে লোড হয়, তাই এখান থেকেই manifest ও service worker যুক্ত হয়। */
(function(){
    try {
        var src = (document.currentScript && document.currentScript.src) || '';
        var i = src.indexOf('shared/core/firebase-init.js');
        if (i < 0) return;
        var root = src.slice(0, i);
        var h = document.head || document.documentElement;
        function add(tag, attrs){ var e = document.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); h.appendChild(e); }
        if (!document.querySelector('link[rel="manifest"]')){
            add('link', { rel: 'manifest', href: root + 'manifest.json' });
            add('meta', { name: 'theme-color', content: '#120a28' });
            add('meta', { name: 'mobile-web-app-capable', content: 'yes' });
            add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
            add('link', { rel: 'apple-touch-icon', href: root + 'icons/icon-192.png' });
        }
        if ('serviceWorker' in navigator) window.addEventListener('load', function(){ navigator.serviceWorker.register(root + 'sw.js').catch(function(){}); });
    } catch(e){}
})();

/* shared/core/firebase-init.js — ডেমো মোড (Firebase ছাড়া)
   ─────────────────────────────────────────────────────────────
   এই ফাইলটা আসল Firebase-এর জায়গায় বসে। ব্রাউজারের localStorage-এ একটা ছোট
   "নকল Firebase" (Firestore + Realtime DB + Auth) চালায়, তাই বাকি সব ফাইল
   (login, home, room, chat, me, admin, sync.js, economy.js, auth.js …) একটুও না বদলে
   আগের মতোই চলে। কোনো ডেটা ইন্টারনেটে/Firebase-এ যায় না।

   🔁 পরে Firebase ফেরত আনতে: শুধু এই ফাইলটা আপনার আসল firebase-init.js দিয়ে বদলে দিন
      (আর HTML-এ gstatic-এর ৬টা <script> লাইন ফেরত দিন)।

   ⚙️ ডেমো সেটিং — নিচের DEMO অবজেক্টে বদলানো যায়।
   🧹 সব ডেমো ডেটা মুছে নতুন করে শুরু: ব্রাউজার কনসোলে  MOIDemo.reset()  */
console.log('[MOI] firebase-init.js loaded (DEMO MODE — no Firebase)');

(function(){
    'use strict';

    const DEMO = {
        startDiamonds: 10000,          /* নতুন (গেস্ট ছাড়া) ইউজার শুরুতে এত ডায়মন্ড পায় */
        staffDiamonds: 1000000,        /* স্টাফ অ্যাকাউন্ট */
        guestDiamonds: 0,
        /* গুগল ডেমো লগইনে এই ইমেইল দিলে ওই রোল পাবেন (অ্যাডমিন প্যানেল টেস্টের জন্য) */
        staffEmails: { 'dev@moi.test': 'developer', 'super@moi.test': 'superadmin', 'dist@moi.test': 'distributor' },
        phoneAnyCode: true,            /* ফোন OTP-তে যেকোনো ৬ সংখ্যা চলবে */
        seed: false                    /* ডেমো ডেটা আসে demo/seed.js থেকে (৫০টা রুম) */
    };

    const DB_KEY = 'moi_demo_db_v1', AUTH_KEY = 'moi_demo_auth_v1';
    const LIVE = 'moi-live';

    /* ═══════════════ ছোট হেল্পার ═══════════════ */
    const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
    const cloneJ = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
    const segs = p => String(p || '').split('/').filter(Boolean);
    const joinP = (...a) => a.map(x => String(x).replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/');
    const hashStr = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
    const rndStr = n => { const c = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let s = ''; for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)]; return s; };
    const later = fn => setTimeout(fn, 0);

    /* Firestore Timestamp-এর মতো অবজেক্ট (পড়ার সময়) */
    class Ts {
        constructor(ms){ this._ms = ms; }
        toMillis(){ return this._ms; }
        toDate(){ return new Date(this._ms); }
        get seconds(){ return Math.floor(this._ms / 1000); }
        get nanoseconds(){ return (this._ms % 1000) * 1e6; }
    }
    /* FieldValue চিহ্ন (লেখার সময়) */
    class Sentinel { constructor(kind, arg){ this.kind = kind; this.arg = arg; } }
    const FieldValue = {
        serverTimestamp: () => new Sentinel('ts'),
        increment: n => new Sentinel('inc', Number(n) || 0),
        arrayUnion: (...a) => new Sentinel('union', a),
        arrayRemove: (...a) => new Sentinel('remove', a),
        delete: () => new Sentinel('del')
    };
    const TSV = { '.sv': 'timestamp' };      /* Realtime DB ServerValue.TIMESTAMP */

    /* ═══════════════ ডেটাবেস (মেমোরি + localStorage) ═══════════════ */
    let DB = { fs: {}, rt: {} };
    let lastRaw = null;
    const colIndex = new Map();               /* collectionPath → Set(docId) */
    let seeding = false;

    function rebuildIndex(){
        colIndex.clear();
        Object.keys(DB.fs).forEach(p => indexAdd(p));
    }
    function indexAdd(path){
        const i = path.lastIndexOf('/'); if (i < 0) return;
        const col = path.slice(0, i), id = path.slice(i + 1);
        if (!colIndex.has(col)) colIndex.set(col, new Set());
        colIndex.get(col).add(id);
    }
    function indexDel(path){
        const i = path.lastIndexOf('/'); if (i < 0) return;
        const s = colIndex.get(path.slice(0, i)); if (s) s.delete(path.slice(i + 1));
    }
    function loadDB(){
        let fresh = true;
        try {
            const raw = localStorage.getItem(DB_KEY); lastRaw = raw;
            if (raw){ const d = JSON.parse(raw); if (d && d.fs && d.rt !== undefined){ DB = d; fresh = false; } }
        } catch(e){}
        if (fresh){ DB = { fs: {}, rt: {} }; if (DEMO.seed) seedData(); persist(true); }
        rebuildIndex();
    }
    let dirty = false, pTimer = null;
    function doPersist(){
        if (pTimer){ clearTimeout(pTimer); pTimer = null; }
        dirty = false;
        try { const raw = JSON.stringify(DB); localStorage.setItem(DB_KEY, raw); lastRaw = raw; }
        catch(e){ console.warn('[demo-db] সেভ করা যায়নি (জায়গা ভরে গেছে?)', e && e.message); }
    }
    /* সাধারণ লেখা সঙ্গে সঙ্গে সেভ হয় (এক সাথে খোলা একাধিক পেজ/ট্যাব যেন একে অপরের ডেটা না মোছে)।
       শুধু শুরুর বড় সিড লেখার সময় একটু পরপর একবার সেভ — ফোনে স্মুথ থাকে */
    let bulkUntil = 0;
    function persist(now){
        dirty = true;
        if (now || Date.now() >= bulkUntil){ doPersist(); return; }
        if (!pTimer) pTimer = setTimeout(doPersist, 250);
    }
    window.addEventListener('pagehide', () => { if (dirty) doPersist(); });
    window.addEventListener('beforeunload', () => { if (dirty) doPersist(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && dirty) doPersist(); });
    /* অন্য ট্যাব কিছু লিখলে আগে সেটা তুলে নেওয়া */
    function syncFromStorage(){
        if (dirty) return false;          /* আমার মেমোরির ডেটাই নতুন — এখনও সেভ হয়নি */
        try {
            const raw = localStorage.getItem(DB_KEY);
            if (raw !== lastRaw){
                lastRaw = raw;
                if (raw){ const d = JSON.parse(raw); if (d && d.fs){ DB = d; rebuildIndex(); return true; } }
                else { DB = { fs: {}, rt: {} }; rebuildIndex(); return true; }
            }
        } catch(e){}
        return false;
    }

    /* ═══════════════ লিসেনার ইঞ্জিন ═══════════════ */
    const listeners = new Set();
    let flushing = false;
    function emitAll(){
        if (flushing) return; flushing = true;
        later(() => {
            flushing = false;
            [...listeners].forEach(l => { try { if (listeners.has(l)) l.check(); } catch(e){ console.warn('[demo-db] listener', e); } });
        });
    }
    function committed(){ persist(); emitAll(); }

    /* ═══════════════ FIRESTORE ═══════════════ */
    const encVal = v => (v instanceof Date ? { __t: v.getTime() } : v instanceof Ts ? { __t: v.toMillis() } : v);

    function applyValue(prev, v, deep){
        if (v === undefined) return undefined;
        if (v instanceof Sentinel){
            switch (v.kind){
                case 'ts': return { __t: Date.now() };
                case 'inc': return (typeof prev === 'number' ? prev : 0) + v.arg;
                case 'union': { const a = Array.isArray(prev) ? prev.slice() : []; v.arg.forEach(x => { if (!a.some(y => JSON.stringify(y) === JSON.stringify(x))) a.push(cloneJ(x)); }); return a; }
                case 'remove': { const a = Array.isArray(prev) ? prev : []; return a.filter(y => !v.arg.some(x => JSON.stringify(y) === JSON.stringify(x))); }
                case 'del': return undefined;
            }
        }
        if (v instanceof Date || v instanceof Ts) return encVal(v);
        if (Array.isArray(v)) return v.map(x => applyValue(undefined, x, false)).filter(x => x !== undefined);
        if (isObj(v) && v.__t === undefined){
            if (deep){
                const base = isObj(prev) ? cloneJ(prev) : {};
                Object.keys(v).forEach(k => { const r = applyValue(base[k], v[k], true); if (r === undefined) delete base[k]; else base[k] = r; });
                return base;
            }
            const o = {};
            Object.keys(v).forEach(k => { const r = applyValue(undefined, v[k], false); if (r !== undefined) o[k] = r; });
            return o;
        }
        return v;
    }
    function fsSet(path, data, opts){
        const existing = DB.fs[path];
        let doc;
        if (opts && opts.merge && existing){
            doc = cloneJ(existing);
            Object.keys(data || {}).forEach(k => { const r = applyValue(doc[k], data[k], true); if (r === undefined) delete doc[k]; else doc[k] = r; });
        } else {
            doc = {};
            Object.keys(data || {}).forEach(k => { const r = applyValue(undefined, data[k], false); if (r !== undefined) doc[k] = r; });
        }
        if (!existing && !seeding && /^users\/[A-Za-z0-9]+$/.test(path)) demoOnUserCreate(doc);
        DB.fs[path] = doc;
        if (!existing) indexAdd(path);
    }
    function fsUpdate(path, data){
        const existing = DB.fs[path];
        if (!existing){ const e = new Error('No document to update: ' + path); e.code = 'not-found'; throw e; }
        const doc = cloneJ(existing);
        Object.keys(data || {}).forEach(k => {
            if (k.indexOf('.') > 0){
                const parts = k.split('.'); let o = doc;
                for (let i = 0; i < parts.length - 1; i++){ if (!isObj(o[parts[i]])) o[parts[i]] = {}; o = o[parts[i]]; }
                const last = parts[parts.length - 1], r = applyValue(o[last], data[k], false);
                if (r === undefined) delete o[last]; else o[last] = r;
            } else {
                const r = applyValue(doc[k], data[k], false);
                if (r === undefined) delete doc[k]; else doc[k] = r;
            }
        });
        DB.fs[path] = doc;
    }
    function fsDelete(path){ if (path in DB.fs){ delete DB.fs[path]; indexDel(path); } }

    const reviveDeep = v => {
        if (Array.isArray(v)) return v.map(reviveDeep);
        if (isObj(v)){
            if (typeof v.__t === 'number' && Object.keys(v).length === 1) return new Ts(v.__t);
            const o = {}; Object.keys(v).forEach(k => { o[k] = reviveDeep(v[k]); }); return o;
        }
        return v;
    };
    const sortKey = x => (isObj(x) && typeof x.__t === 'number') ? x.__t : x;
    const getField = (doc, f) => f.split('.').reduce((o, k) => (o == null ? undefined : o[k]), doc);

    class DocSnap {
        constructor(path, raw){ this._path = path; this._raw = raw; this.id = path.split('/').pop(); this.exists = raw !== undefined; this.ref = new DocRef(path); }
        data(){ return this._raw === undefined ? undefined : reviveDeep(cloneJ(this._raw)); }
        get(f){ const d = this.data(); return d ? getField(d, f) : undefined; }
    }
    class QuerySnap {
        constructor(rows){ this.docs = rows.map(r => new DocSnap(r[0], r[1])); this.size = this.docs.length; this.empty = !this.size; }
        forEach(cb){ this.docs.forEach(cb); }
        docChanges(){ return []; }
    }
    class DocRef {
        constructor(path){ this.path = path; this.id = path.split('/').pop(); this.parent = { path: path.slice(0, path.lastIndexOf('/')), id: path.split('/').slice(-2, -1)[0] }; this.firestore = fsDb; }
        collection(name){ return new Query(joinP(this.path, name)); }
        get(){ syncFromStorage(); return Promise.resolve(new DocSnap(this.path, DB.fs[this.path])); }
        set(data, opts){ syncFromStorage(); try { fsSet(this.path, data, opts); } catch(e){ return Promise.reject(e); } committed(); return Promise.resolve(); }
        update(data){ syncFromStorage(); try { fsUpdate(this.path, data); } catch(e){ return Promise.reject(e); } committed(); return Promise.resolve(); }
        delete(){ syncFromStorage(); fsDelete(this.path); committed(); return Promise.resolve(); }
        onSnapshot(cb, errCb){
            let last = null, first = true;
            const this_path = this.path;
            const l = { check(){
                const raw = DB.fs[this_path];
                const sig = raw === undefined ? '∅' : JSON.stringify(raw);
                if (!first && sig === last) return;
                first = false; last = sig;
                cb(new DocSnap(this_path, raw));
            } };
            listeners.add(l); later(() => { if (listeners.has(l)) l.check(); });
            return () => listeners.delete(l);
        }
    }
    class Query {
        constructor(path, st){ this.path = path; this.id = path.split('/').pop(); this._st = st || { where: [], order: null, limit: null }; this.firestore = fsDb; }
        _with(patch){ return new Query(this.path, Object.assign({}, this._st, patch)); }
        where(f, op, v){ return this._with({ where: this._st.where.concat([[f, op, v]]) }); }
        orderBy(f, dir){ return this._with({ order: [f, dir === 'desc' ? 'desc' : 'asc'] }); }
        limit(n){ return this._with({ limit: n }); }
        /* কালেকশন-মাত্র কাজ */
        doc(id){ return new DocRef(joinP(this.path, id || rndStr(20))); }
        add(data){ const ref = this.doc(); return ref.set(data).then(() => ref); }
        _run(){
            const ids = colIndex.get(this.path); let rows = [];
            if (ids) ids.forEach(id => { const p = this.path + '/' + id; if (DB.fs[p] !== undefined) rows.push([p, DB.fs[p]]); });
            this._st.where.forEach(([f, op, v]) => {
                rows = rows.filter(([, d]) => {
                    const x = sortKey(getField(d, f)), y = sortKey(v);
                    switch (op){
                        case '==': return JSON.stringify(x) === JSON.stringify(y);
                        case '!=': return JSON.stringify(x) !== JSON.stringify(y);
                        case '<': return x < y; case '<=': return x <= y; case '>': return x > y; case '>=': return x >= y;
                        case 'in': return Array.isArray(y) && y.some(z => JSON.stringify(z) === JSON.stringify(x));
                        case 'array-contains': return Array.isArray(x) && x.some(z => JSON.stringify(z) === JSON.stringify(y));
                        case 'array-contains-any': return Array.isArray(x) && Array.isArray(y) && x.some(z => y.some(w => JSON.stringify(z) === JSON.stringify(w)));
                        default: return true;
                    }
                });
            });
            if (this._st.order){
                const [f, dir] = this._st.order;
                rows = rows.filter(([, d]) => getField(d, f) !== undefined);
                rows.sort((a, b) => { const x = sortKey(getField(a[1], f)), y = sortKey(getField(b[1], f)); const c = x < y ? -1 : x > y ? 1 : 0; return dir === 'desc' ? -c : c; });
            } else rows.sort((a, b) => (a[0] < b[0] ? -1 : 1));
            if (this._st.limit) rows = rows.slice(0, this._st.limit);
            return rows;
        }
        get(){ syncFromStorage(); return Promise.resolve(new QuerySnap(this._run())); }
        onSnapshot(cb, errCb){
            let last = null, first = true;
            const self = this;
            const l = { check(){
                const rows = self._run(); const sig = JSON.stringify(rows);
                if (!first && sig === last) return;
                first = false; last = sig;
                cb(new QuerySnap(rows));
            } };
            listeners.add(l); later(() => { if (listeners.has(l)) l.check(); });
            return () => listeners.delete(l);
        }
    }

    /* ট্রানজেকশন — একটার পর একটা চলে, কিছু ভুল হলে কিছুই লেখা হয় না */
    let txChain = Promise.resolve();
    async function runTx(fn){
        syncFromStorage();
        const writes = [];
        const t = {
            get: ref => Promise.resolve(new DocSnap(ref.path, DB.fs[ref.path])),
            set(ref, data, opts){ writes.push(['set', ref.path, data, opts]); return t; },
            update(ref, data){ writes.push(['update', ref.path, data]); return t; },
            delete(ref){ writes.push(['delete', ref.path]); return t; }
        };
        const res = await fn(t);
        syncFromStorage();
        const touched = [...new Set(writes.map(w => w[1]))];
        const backup = {}; touched.forEach(p => { backup[p] = DB.fs[p] === undefined ? undefined : cloneJ(DB.fs[p]); });
        try {
            writes.forEach(w => { if (w[0] === 'set') fsSet(w[1], w[2], w[3]); else if (w[0] === 'update') fsUpdate(w[1], w[2]); else fsDelete(w[1]); });
        } catch(e){
            touched.forEach(p => { if (backup[p] === undefined) fsDelete(p); else { const had = DB.fs[p] !== undefined; DB.fs[p] = backup[p]; if (!had) indexAdd(p); } });
            throw e;
        }
        committed();
        return res;
    }
    const fsDb = {
        collection: path => new Query(joinP(path)),
        doc: path => new DocRef(joinP(path)),
        runTransaction(fn){ const p = txChain.then(() => runTx(fn)); txChain = p.catch(() => {}); return p; },
        settings(){}, enablePersistence(){ return Promise.resolve(); }
    };

    /* ═══════════════ REALTIME DATABASE ═══════════════ */
    const rtGet = path => { let n = DB.rt; for (const s of segs(path)){ if (!isObj(n) || !(s in n)) return undefined; n = n[s]; } return n; };
    function rtClean(v){
        if (v === null || v === undefined) return undefined;
        if (v && v['.sv'] === 'timestamp') return Date.now();
        if (Array.isArray(v)){ const o = {}; v.forEach((x, i) => { const r = rtClean(x); if (r !== undefined) o[i] = r; }); return Object.keys(o).length ? o : undefined; }
        if (isObj(v)){ const o = {}; Object.keys(v).forEach(k => { const r = rtClean(v[k]); if (r !== undefined) o[k] = r; }); return Object.keys(o).length ? o : undefined; }
        return v;
    }
    function rtSet(path, val){
        const s = segs(path); const v = rtClean(val);
        if (!s.length){ DB.rt = isObj(v) ? v : {}; return; }
        const chain = [DB.rt]; let n = DB.rt;
        for (let i = 0; i < s.length - 1; i++){
            if (!isObj(n[s[i]])){ if (v === undefined) return; n[s[i]] = {}; }
            n = n[s[i]]; chain.push(n);
        }
        const last = s[s.length - 1];
        if (v === undefined) delete n[last]; else n[last] = v;
        for (let i = chain.length - 1; i > 0; i--){ if (Object.keys(chain[i]).length === 0) delete chain[i - 1][s[i - 1]]; else break; }
    }
    /* Firebase-এর মতো: ০,১,২… চাবি হলে অ্যারে হিসেবে ফেরত */
    function toVal(n){
        if (n === undefined) return null;
        if (!isObj(n)) return n;
        const keys = Object.keys(n); if (!keys.length) return null;
        if (keys.every(k => /^\d+$/.test(k))){
            const max = Math.max.apply(null, keys.map(Number));
            if (max < keys.length * 2){ const a = []; for (let i = 0; i <= max; i++) a.push(n[i] === undefined ? null : toVal(n[i])); return a; }
        }
        const o = {}; keys.forEach(k => { o[k] = toVal(n[k]); }); return o;
    }
    const keyCmp = (a, b) => { const na = /^-?\d+$/.test(a), nb = /^-?\d+$/.test(b); if (na && nb) return Number(a) - Number(b); if (na) return -1; if (nb) return 1; return a < b ? -1 : a > b ? 1 : 0; };
    let lastPush = 0, pushRand = [];
    function pushId(){
        const C = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
        let now = Date.now(); const dup = now === lastPush; lastPush = now;
        const ts = []; for (let i = 7; i >= 0; i--){ ts[i] = C.charAt(now % 64); now = Math.floor(now / 64); }
        let id = ts.join('');
        if (!dup){ pushRand = []; for (let i = 0; i < 12; i++) pushRand[i] = Math.floor(Math.random() * 64); }
        else { let i; for (i = 11; i >= 0 && pushRand[i] === 63; i--) pushRand[i] = 0; if (i >= 0) pushRand[i]++; }
        for (let i = 0; i < 12; i++) id += C.charAt(pushRand[i]);
        return id;
    }

    class RtSnap {
        constructor(path, node, q){ this._path = path; this._node = node; this.key = segs(path).pop() || null; this.ref = new RtRef(path); this._q = q; }
        val(){ return cloneJ(toVal(this._node)); }
        exists(){ return this._node !== undefined && toVal(this._node) !== null; }
        child(p){ return new RtSnap(joinP(this._path, p), (() => { let n = this._node; for (const s of segs(p)){ if (!isObj(n) || !(s in n)) return undefined; n = n[s]; } return n; })()); }
        hasChildren(){ return isObj(this._node) && Object.keys(this._node).length > 0; }
        numChildren(){ return isObj(this._node) ? Object.keys(this._node).length : 0; }
        forEach(cb){
            if (!isObj(this._node)) return false;
            const keys = this._order || Object.keys(this._node).sort(keyCmp);
            for (const k of keys){ if (cb(new RtSnap(joinP(this._path, k), this._node[k])) === true) return true; }
            return false;
        }
        toJSON(){ return this.val(); }
    }
    /* কুয়েরি (orderByChild + startAt/endAt/equalTo + limit) প্রয়োগ → [[key, node], …] */
    function rtChildren(path, q){
        const node = rtGet(path); if (!isObj(node)) return [];
        let rows = Object.keys(node).map(k => [k, node[k]]);
        if (q && q.order){
            const val = r => q.order === 'key' ? r[0] : q.order === 'value' ? r[1] : getField(isObj(r[1]) ? r[1] : {}, q.child);
            rows = rows.filter(r => {
                const v = val(r);
                if (q.equal !== undefined) return v === q.equal;
                if (q.start !== undefined && !(v !== undefined && v >= q.start)) return false;
                if (q.end !== undefined && !(v !== undefined && v <= q.end)) return false;
                return true;
            });
            rows.sort((a, b) => { const x = val(a), y = val(b); if (x === y) return keyCmp(a[0], b[0]); if (x === undefined) return -1; if (y === undefined) return 1; return x < y ? -1 : 1; });
        } else rows.sort((a, b) => keyCmp(a[0], b[0]));
        if (q && q.limitLast) rows = rows.slice(-q.limitLast);
        if (q && q.limitFirst) rows = rows.slice(0, q.limitFirst);
        return rows;
    }
    function qSnap(path, q){
        if (!q || (!q.order && !q.limitLast && !q.limitFirst)) return new RtSnap(path, rtGet(path));
        const rows = rtChildren(path, q); const o = {}; rows.forEach(r => { o[r[0]] = r[1]; });
        const s = new RtSnap(path, rows.length ? o : undefined); s._order = rows.map(r => r[0]); return s;
    }

    const disconnectOps = new Map();
    class RtRef {
        constructor(path, q){ this.path = joinP(path); this.key = segs(path).pop() || null; this._q = q || null; this.database = rtDb; }
        get parent(){ const s = segs(this.path); s.pop(); return new RtRef(s.join('/')); }
        get root(){ return new RtRef(''); }
        toString(){ return this.path; }
        child(p){ return new RtRef(joinP(this.path, p)); }
        _qq(patch){ return new RtRef(this.path, Object.assign({}, this._q || {}, patch)); }
        orderByChild(c){ return this._qq({ order: 'child', child: c }); }
        orderByKey(){ return this._qq({ order: 'key' }); }
        orderByValue(){ return this._qq({ order: 'value' }); }
        startAt(v){ return this._qq({ start: v }); } endAt(v){ return this._qq({ end: v }); } equalTo(v){ return this._qq({ equal: v }); }
        limitToLast(n){ return this._qq({ limitLast: n }); } limitToFirst(n){ return this._qq({ limitFirst: n }); }
        set(v){ syncFromStorage(); rtSet(this.path, v); committed(); return Promise.resolve(); }
        update(vals){
            syncFromStorage();
            Object.keys(vals || {}).forEach(k => rtSet(joinP(this.path, k), vals[k]));
            committed(); return Promise.resolve();
        }
        remove(){ return this.set(null); }
        push(v){
            const key = pushId(); const plain = new RtRef(joinP(this.path, key));
            const p = (v === undefined ? Promise.resolve() : plain.set(v)).then(() => plain);
            const th = Object.create(plain); th.then = p.then.bind(p); th.catch = p.catch.bind(p);
            return th;
        }
        get(){ syncFromStorage(); return Promise.resolve(qSnap(this.path, this._q)); }
        once(type){ return this.get(); }
        transaction(fn){
            syncFromStorage();
            const cur = toVal(rtGet(this.path));
            const res = fn(cloneJ(cur));
            if (res === undefined) return Promise.resolve({ committed: false, snapshot: new RtSnap(this.path, rtGet(this.path)) });
            rtSet(this.path, res); committed();
            return Promise.resolve({ committed: true, snapshot: new RtSnap(this.path, rtGet(this.path)) });
        }
        onDisconnect(){
            const path = this.path;
            const add = (type, val) => { disconnectOps.set(path, { type, val }); return Promise.resolve(); };
            return { remove: () => add('remove'), set: v => add('set', v), update: v => add('update', v), cancel: () => { disconnectOps.delete(path); return Promise.resolve(); } };
        }
        on(type, cb, errCb){
            const path = this.path, q = this._q;
            if (path === '.info/connected'){
                const l = { _ref: path, _type: type, _cb: cb, check(){} };
                listeners.add(l); later(() => { if (listeners.has(l)) cb({ val: () => true, exists: () => true }); }); return cb;
            }
            const l = { _ref: path, _type: type, _cb: cb, _first: true, _sig: null, _kids: new Map(),
                check(){
                    if (type === 'value'){
                        const s = qSnap(path, q); const sig = JSON.stringify(s._node === undefined ? null : s._node) + (s._order ? s._order.join() : '');
                        if (!this._first && sig === this._sig) return;
                        this._first = false; this._sig = sig; cb(s);
                    } else {
                        const rows = rtChildren(path, q); const now = new Map(rows.map(r => [r[0], JSON.stringify(r[1])]));
                        if (type === 'child_added'){
                            rows.forEach(r => { if (!this._kids.has(r[0])) cb(new RtSnap(joinP(path, r[0]), r[1])); });
                        } else if (type === 'child_changed'){
                            if (!this._first) rows.forEach(r => { if (this._kids.has(r[0]) && this._kids.get(r[0]) !== now.get(r[0])) cb(new RtSnap(joinP(path, r[0]), r[1])); });
                        } else if (type === 'child_removed'){
                            this._kids.forEach((sg, k) => { if (!now.has(k)) cb(new RtSnap(joinP(path, k), undefined)); });
                        }
                        this._first = false; this._kids = now;
                    }
                } };
            listeners.add(l); later(() => { if (listeners.has(l)) l.check(); });
            return cb;
        }
        off(type, cb){
            [...listeners].forEach(l => { if (l._ref === this.path && (!type || l._type === type) && (!cb || l._cb === cb)) listeners.delete(l); });
        }
    }
    const rtDb = { ref: p => new RtRef(p || ''), goOffline(){}, goOnline(){} };

    function runDisconnectOps(){
        if (!disconnectOps.size) return;
        try {
            syncFromStorage();
            disconnectOps.forEach((op, path) => {
                if (op.type === 'remove') rtSet(path, null);
                else if (op.type === 'set') rtSet(path, op.val);
                else if (op.type === 'update') Object.keys(op.val || {}).forEach(k => rtSet(joinP(path, k), op.val[k]));
            });
            disconnectOps.clear(); persist(true);
        } catch(e){}
    }
    window.addEventListener('pagehide', runDisconnectOps);
    window.addEventListener('beforeunload', runDisconnectOps);

    /* ═══════════════ AUTH ═══════════════ */
    const authSubs = new Set();
    let curUser = null;
    try { curUser = JSON.parse(localStorage.getItem(AUTH_KEY)) || null; } catch(e){}

    function toast(msg){
        try {
            const d = document.createElement('div');
            d.textContent = msg;
            d.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:rgba(20,20,30,.92);color:#fff;padding:11px 16px;border-radius:12px;font:600 13px/1.4 system-ui,sans-serif;z-index:2147483647;max-width:88vw;text-align:center;box-shadow:0 6px 24px rgba(0,0,0,.35)';
            document.body.appendChild(d); setTimeout(() => d.remove(), 6500);
        } catch(e){}
    }
    function setUser(u, silent){
        curUser = u;
        try { if (u) localStorage.setItem(AUTH_KEY, JSON.stringify(u)); else localStorage.removeItem(AUTH_KEY); } catch(e){}
        if (!silent) [...authSubs].forEach(cb => { try { cb(curUser); } catch(e){ console.warn(e); } });
    }
    window.addEventListener('storage', e => {
        if (e.key === AUTH_KEY){
            let u = null; try { u = JSON.parse(e.newValue) || null; } catch(x){}
            const same = (u && u.uid) === (curUser && curUser.uid);
            if (!same) setUser(u, false);
        } else if (e.key === DB_KEY){
            if (syncFromStorage()) emitAll();
        }
    });
    const mkUser = o => Object.assign({ uid: '', isAnonymous: false, displayName: '', photoURL: '', phoneNumber: '', email: '', providerData: [] }, o);
    const auth = {
        get currentUser(){ return curUser; },
        onAuthStateChanged(cb){ authSubs.add(cb); later(() => { if (authSubs.has(cb)) cb(curUser); }); return () => authSubs.delete(cb); },
        async signInAnonymously(){ let uid = null; try { uid = localStorage.getItem('moi_demo_guest_uid'); } catch(e){} if (!uid){ uid = 'gu' + rndStr(10); try { localStorage.setItem('moi_demo_guest_uid', uid); } catch(e){} } setUser(mkUser({ uid, isAnonymous: true })); return { user: curUser }; },
        async signInWithPopup(prov){
            const isFb = prov instanceof FacebookAuthProvider;
            let v = window.prompt('ডেমো ' + (isFb ? 'ফেসবুক' : 'গুগল') + ' লগইন\nএকটা ইমেইল বা নাম লিখুন (একই লিখলে একই অ্যাকাউন্টে ঢুকবেন)।\nস্টাফ টেস্ট: dev@moi.test · super@moi.test · dist@moi.test', 'demo@moi.test');
            if (v === null){ const e = new Error('closed'); e.code = 'auth/popup-closed-by-user'; throw e; }
            v = String(v).trim() || 'demo@moi.test';
            const email = v.indexOf('@') > 0 ? v.toLowerCase() : v.toLowerCase().replace(/\s+/g, '') + '@moi.test';
            const nm = email.split('@')[0]; const name = nm.charAt(0).toUpperCase() + nm.slice(1);
            setUser(mkUser({ uid: (isFb ? 'fb' : 'gl') + hashStr(email), displayName: name, email, providerData: [{ providerId: isFb ? 'facebook.com' : 'google.com' }] }));
            return { user: curUser };
        },
        async signInWithRedirect(p){ return this.signInWithPopup(p); },
        async signInWithPhoneNumber(num){
            if (!/^\+\d{8,15}$/.test(String(num || '').replace(/\s/g, ''))){ const e = new Error('invalid'); e.code = 'auth/invalid-phone-number'; throw e; }
            toast('ডেমো মোড: যেকোনো ৬ সংখ্যার কোড দিন (যেমন 123456)');
            return { confirm: async code => {
                if (!/^\d{6}$/.test(String(code || ''))){ const e = new Error('bad code'); e.code = 'auth/invalid-verification-code'; throw e; }
                setUser(mkUser({ uid: 'ph' + hashStr(num), phoneNumber: num, providerData: [{ providerId: 'phone' }] })); return { user: curUser };
            } };
        },
        async signOut(){ setUser(null); }
    };

    /* ═══════════════ নতুন ইউজার তৈরির সময় ডেমো সুবিধা (ডায়মন্ড + স্টাফ রোল) ═══════════════ */
    function demoOnUserCreate(doc){
        if (!doc || !doc.uid) return;
        const email = curUser && curUser.uid === doc.uid ? (curUser.email || '') : '';
        const staffRole = DEMO.staffEmails[email];
        if (staffRole){
            doc.role = staffRole; doc.isGuest = false; doc.diamonds = DEMO.staffDiamonds;
            DB.rt[LIVE] = DB.rt[LIVE] || {}; DB.rt[LIVE].staff = DB.rt[LIVE].staff || {};
            if (staffRole === 'developer' || staffRole === 'superadmin') DB.rt[LIVE].staff[doc.uid] = staffRole;
        } else {
            doc.diamonds = (doc.role === 'guest' || doc.isGuest) ? DEMO.guestDiamonds : DEMO.startDiamonds;
        }
    }

    /* ═══════════════ ডেমো সিড ডেটা (শুধু প্রথমবার) ═══════════════ */
    function avatar(name, c1, c2){
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#fff">' + name.charAt(0).toUpperCase() + '</text></svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }
    function seedData(){
        const now = Date.now();
        const bots = [
            { uid: 'demobot1', moiId: '100001', name: 'Rafi', c: ['#ff7a8a', '#8b5cf6'], room: ['100001', 'Rafi\'s Lounge'] },
            { uid: 'demobot2', moiId: '100002', name: 'Nila', c: ['#20e3b2', '#00b4ff'], room: ['100002', 'Night Talk'] },
            { uid: 'demobot3', moiId: '100003', name: 'Sumon', c: ['#f0b429', '#ff6a3d'], room: ['100003', 'Music Club'] }
        ];
        bots.forEach((b, i) => {
            const photo = avatar(b.name, b.c[0], b.c[1]);
            DB.fs['users/' + b.uid] = {
                uid: b.uid, moiId: b.moiId, name: b.name, photo, bio: 'Demo user', country: 'Bangladesh', gender: '', birthday: '', voice: '',
                role: 'user', isGuest: false, badges: [], crown: '', ownedCrowns: [], frame: 'basic',
                diamonds: 5000, level: 1, xp: 0, giftsSent: 0, giftsReceived: 0,
                myRoomUid: b.room[0], myRoomId: b.room[0], distributorId: null,
                isBanned: false, banReason: null, banExpiresAt: null, profileComplete: true,
                createdAt: { __t: now - 86400000 }, lastSeen: { __t: now - i * 60000 }, lastActiveRoomId: ''
            };
            DB.fs['moiIds/' + b.moiId] = { uid: b.uid };
            DB.fs['rooms/' + b.room[0]] = {
                id: b.room[0], name: b.room[1], logo: '', wallpaper: '', country: 'Bangladesh', language: 'bn',
                ownerUid: b.uid, ownerName: b.name, ownerAvatar: photo, owner: { uid: b.uid, name: b.name, avatar: photo },
                admins: [], isLive: true, micSeatCount: 10, topic: '🎧FM 📻➡️SP ✨🎤Room 🎵', tags: [], category: 'chat',
                level: 1, points: 0, pkActive: false, pkId: null, rules: [], createdAt: { __t: now - 80000000 }, updatedAt: { __t: now }
            };
            DB.rt[LIVE] = DB.rt[LIVE] || {}; DB.rt[LIVE].roomMeta = DB.rt[LIVE].roomMeta || {};
            DB.rt[LIVE].roomMeta[b.room[0]] = { owner: b.uid };
        });
        DB.fs['meta/counters'] = { moiId: 100010 };
    }

    /* ═══════════════ firebase গ্লোবাল (পুরনো কোডের জন্য) + MOIFB ═══════════════ */
    class GoogleAuthProvider {}
    class FacebookAuthProvider {}
    class RecaptchaVerifier { constructor(){ } clear(){ } render(){ return Promise.resolve(0); } }
    const fsFn = () => fsDb; fsFn.FieldValue = FieldValue; fsFn.Timestamp = Ts;
    const dbFn = () => rtDb; dbFn.ServerValue = { TIMESTAMP: TSV };
    const authFn = () => auth; authFn.GoogleAuthProvider = GoogleAuthProvider; authFn.FacebookAuthProvider = FacebookAuthProvider; authFn.RecaptchaVerifier = RecaptchaVerifier;
    window.firebase = {
        apps: [{}], app: () => ({}), initializeApp: () => ({}),
        firestore: fsFn, database: dbFn, auth: authFn
    };

    loadDB();

    window.MOIFB = {
        app: {},
        auth,
        db: fsDb,
        rtdb: rtDb,
        storage: null,               /* ডেমোতে ছবি সরাসরি dataURL হিসেবে থাকে */
        fn: null,
        TS: () => FieldValue.serverTimestamp(),
        RTS: () => TSV,
        LIVE: LIVE,
        DEMO: true
    };


    /* ═══════════════ demo/seed.js ও demo/sim.js এর জন্য ছোট অ্যাডাপ্টার ═══════════════
       seed.js : ৫০টা রুম + ~২০০ ইউজার (ডকুমেন্ট শুধু প্রথমবার লেখা হয়, লাইভ সিট/শ্রোতা প্রতিবার নতুন)
       sim.js  : রুম জীবন্ত রাখে (গিফট, লোক ঢোকা-বের হওয়া ইত্যাদি) */
    let seedMode = null, seedAt = 0;
    const bulk = () => { if (Date.now() - seedAt < 3000) bulkUntil = Date.now() + 400; };
    function seedBegin(){
        if (seedMode !== null) return;
        seedMode = !DB.fs['meta/seed50'];
        seedAt = Date.now();
        if (!seedMode) return;
        /* আগের ছোট ডেমো (৩ বট) থাকলে সরিয়ে দেওয়া */
        ['demobot1', 'demobot2', 'demobot3'].forEach(u => fsDelete('users/' + u));
        ['100001', '100002', '100003'].forEach(id => {
            const r = DB.fs['rooms/' + id]; if (r && /^demobot/.test(r.ownerUid || '')) fsDelete('rooms/' + id);
            const m = DB.fs['moiIds/' + id]; if (m && /^demobot/.test(m.uid || '')) fsDelete('moiIds/' + id);
            if (DB.rt[LIVE] && DB.rt[LIVE].roomMeta && DB.rt[LIVE].roomMeta[id] && /^demobot/.test(DB.rt[LIVE].roomMeta[id].owner || '')) rtSet(LIVE + '/roomMeta/' + id, null);
        });
        DB.fs['meta/seed50'] = { v: 1 }; indexAdd('meta/seed50');
        if (!DB.fs['meta/counters']){ DB.fs['meta/counters'] = { moiId: 100010 }; indexAdd('meta/counters'); }
    }
    window.__MOCK = {
        Timestamp: Ts,
        seedDoc(path, data){
            seedBegin(); if (!seedMode) return;
            seeding = true; try { fsSet(path, data); } finally { seeding = false; }
            bulk(); persist();
        },
        rtSet(path, val){ seedBegin(); rtSet(path, val); bulk(); persist(); emitAll(); },
        rtGet(path){ return cloneJ(rtGet(path)); },
        demoSignIn(){ /* আসল লগইন পেজ থেকেই ঢুকতে হবে */ }
    };

    window.MOIDemo = {
        config: DEMO,
        reset(){ try { localStorage.removeItem(DB_KEY); localStorage.removeItem(AUTH_KEY); localStorage.removeItem('moi_user'); localStorage.removeItem('moi_demo_guest_uid'); } catch(e){} location.reload(); },
        dump(){ return cloneJ(DB); }
    };
})();
