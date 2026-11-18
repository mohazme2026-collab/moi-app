/* demo/crowd.js — লাকি বক্স অনুযায়ী রুমে "আসল" ভিড় (শুধু ডেমো — আসল Firebase-এ এই ফাইল লাগবে না)
   ───────────────────────────────────────────────────────────────────────────────
   • যে রুমে লাকি বক্স ছাড়া হয় সেখানে ডেমো ইউজাররা সত্যি ঢোকে (লিসেনার হিসেবে, এন্ট্রি অ্যানিমেশনসহ)।
   • যত বেশি ডায়মন্ড / বেশি বক্স, তত বেশি ইউজার (নিচে TARGET বদলে সংখ্যা ঠিক করা যায়)।
   • কেউ সিটে ওঠে, মিউট থাকে, নামে, বেরিয়ে যায় — সংখ্যাটা সবসময় একরকম না।
   • বক্স ধরে শুধু যারা রুমে আছে (economy.js এর lbBots রুমের লিসেনার লিস্ট থেকে নেয়)।
   • হোম পেজেও চলে: ইউজার বাড়লে/কমলে হোমের রুমের সংখ্যা ও ক্রম বদলায়।
   ⚙️ গতি: ?speed=2 দিলে দ্বিগুণ দ্রুত।  কনসোল: MOICrowd.state(roomId) */
(function(){
'use strict';
if (window.top !== window) return;
const D = window.DEMO, M = window.__MOCK; if (!D || !M) return;
if (/[?&]bots=0/.test(location.search)) return;
const SPEED = Number((new URLSearchParams(location.search)).get('speed')) || 1;

/* ═══ ⚙️ সেটিংস ═══ */
const TARGET = (total, qty) => Math.max(Math.round(Math.sqrt(total) + qty * 0.4), qty + 3);  /* একটা বক্সে কতজন আসবে: ১০০💎≈১২, ১০০০≈৩৬, ১০,০০০≈১০৪, ১ লাখ≈৩২০ */
const TARGET_MAX = 600;                  /* এক রুমে বটের সর্বোচ্চ */
const STAY_MS = [60000, 480000];         /* বক্সের মেয়াদ শেষের পর কেউ কতক্ষণ থাকবে (সর্বনিম্ন, সর্বোচ্চ) */
const SEATED_MAX = 10;                   /* একসাথে সর্বোচ্চ কতজন সিটে */

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const LIVE = () => window.MOIFB.LIVE;
const rtdb = () => window.MOIFB.rtdb;
const U = uid => D.USERS[uid];
const meUid = () => { try { const u = window.MOIFB.auth.currentUser; if (u && u.uid) return u.uid; } catch(e){} return D.ME.uid; };
const obj = v => (v && typeof v === 'object') ? v : {};
const act = a => { try { if (typeof showActivity === 'function') showActivity(Object.assign({ ts: Date.now() }, a)); } catch(e){} };

/* ১০০০ বট সবাই ডেমো রুমে ভাগ করা — তাই অন্য রুমের ভিড়ে থাকা বটও আসতে পারে (শুধু এই রুমে/অন্য ভিড়ে না থাকলেই হলো) */
const POOL = Object.keys(D.USERS);
const mem = {};       /* roomId → { seatWant, seatNext } */

function boxesOf(room){ return Object.values(obj(M.rtGet(LIVE() + '/rooms/' + room + '/luckybox'))).filter(b => b && b.expiresAt); }
function wantOf(room, now){
    let t = 0, latest = 0;
    boxesOf(room).forEach(b => {
        const age = now - b.expiresAt, full = (b.winners ? Object.keys(b.winners).length : 0) >= b.qty;
        const fade = age <= 0 ? 1 : Math.max(0, 1 - age / 480000);
        if (fade > 0){ t += TARGET(b.total || 0, b.qty || 1) * (full && age > 0 ? fade * 0.7 : fade); latest = Math.max(latest, b.expiresAt); }
    });
    return { want: Math.min(TARGET_MAX, Math.round(t)), latest };
}
function planOf(room){ return obj(M.rtGet(LIVE() + '/crowdPlan/' + room)); }
function inAnyPlan(){ const s = new Set(); const all = obj(M.rtGet(LIVE() + '/crowdPlan')); Object.keys(all).forEach(r => Object.keys(obj(all[r])).forEach(u => s.add(u))); return s; }

/* ── ঢোকা (এন্ট্রি অ্যানিমেশনসহ) ── */
function addBots(room, n, latestExpiry){
    const used = inAnyPlan(), me = meUid(), pres = obj(M.rtGet(LIVE() + '/roomPresence/' + room));
    const free = POOL.filter(u => u !== me && !used.has(u) && !pres[u]);
    if (!free.length) return 0;
    const upd = {}, now = Date.now(); let anim = 0, acts = 0;
    for (let i = 0; i < n && free.length; i++){
        const u = free.splice(Math.floor(Math.random() * free.length), 1)[0], us = U(u); if (!us) continue;
        upd['rooms/' + room + '/listeners/' + u] = { name: us.name, avatar: us.photo, role: 'member', joined: now };
        upd['roomPresence/' + room + '/' + u] = true;
        upd['crowdPlan/' + room + '/' + u] = Math.max(latestExpiry, now) + rnd(STAY_MS[0], STAY_MS[1]);
        if (acts < 2){ acts++; act({ action: 'join', name: us.name }); }
        if (anim < 2){
            let fx = null; try { fx = (window.MOIStore && MOIStore.entryFor(u)) || (window.MOIPerks && (MOIPerks.perksOf(u) || {}).entry) || null; } catch(e){}
            if (fx){ anim++; rtdb().ref(LIVE() + '/rooms/' + room + '/entries').push({ uid: u, name: us.name, photo: us.photo, fx, ts: now + anim * 900 }); }
        }
    }
    rtdb().ref(LIVE()).update(upd);
    return Object.keys(upd).length / 3;
}

/* ── বেরিয়ে যাওয়া (সিট থেকেও) ── */
function removeBot(room, u){
    const upd = {};
    upd['rooms/' + room + '/listeners/' + u] = null; upd['roomPresence/' + room + '/' + u] = null;
    upd['rooms/' + room + '/joinedUsers/' + u] = null; upd['crowdPlan/' + room + '/' + u] = null;
    const seats = obj(M.rtGet(LIVE() + '/rooms/' + room + '/seats'));
    Object.keys(seats).forEach(i => { if (seats[i] && seats[i].uid === u) upd['rooms/' + room + '/seats/' + i] = null; });
    rtdb().ref(LIVE()).update(upd);
}
function sweep(){
    const now = Date.now(), all = obj(M.rtGet(LIVE() + '/crowdPlan'));
    Object.keys(all).forEach(room => {
        const plan = obj(all[room]); const gone = Object.keys(plan).filter(u => plan[u] <= now);
        if (!gone.length) return;
        const upd = {}, seats = obj(M.rtGet(LIVE() + '/rooms/' + room + '/seats'));
        gone.forEach(u => {
            upd['rooms/' + room + '/listeners/' + u] = null; upd['roomPresence/' + room + '/' + u] = null; upd['rooms/' + room + '/joinedUsers/' + u] = null; upd['crowdPlan/' + room + '/' + u] = null;
            Object.keys(seats).forEach(i => { if (seats[i] && seats[i].uid === u) upd['rooms/' + room + '/seats/' + i] = null; });
        });
        rtdb().ref(LIVE()).update(upd);
        if (gone.length < 3) gone.forEach(u => act({ action: 'leave', name: (U(u) || {}).name }));
    });
}

/* ── সিটে ওঠা-নামা, মিউট ── */
function seatTick(room, now){
    const plan = planOf(room), bots = Object.keys(plan); if (bots.length < 3) return;
    const m = mem[room] = mem[room] || { seatWant: rnd(2, 5), seatNext: now + rnd(15000, 40000) };
    if (now >= m.seatNext){ m.seatWant = rnd(1, Math.min(SEATED_MAX, Math.max(2, Math.floor(bots.length * 0.6)))); m.seatNext = now + rnd(15000, 50000); }
    const seats = obj(M.rtGet(LIVE() + '/rooms/' + room + '/seats'));
    let total = 12; try { if (typeof ROOM_ID !== 'undefined' && ROOM_ID === room && state && state.seats) total = state.seats.length; } catch(e){}
    const seated = [], empty = [];
    for (let i = 1; i < total; i++){ const s = seats[i]; if (s && s.uid){ if (plan[s.uid]) seated.push({ i, s }); } else if (!(s && s.locked)) empty.push(i); }
    const r = Math.random();
    if (seated.length < m.seatWant && empty.length){
        const aud = bots.filter(u => !seated.some(x => x.s.uid === u) && !Object.keys(seats).some(i => seats[i] && seats[i].uid === u));
        if (!aud.length) return;
        const u = pick(aud), us = U(u), i = pick(empty);
        rtdb().ref(LIVE() + '/rooms/' + room + '/seats/' + i).set({ uid: u, name: us.name, avatar: us.photo, role: 'member', mic: false, locked: false, coins: 0, started: now });
    } else if (seated.length > m.seatWant){
        const x = pick(seated);
        if (r < 0.3) removeBot(room, x.s.uid); else rtdb().ref(LIVE() + '/rooms/' + room + '/seats/' + x.i).remove();
    } else if (seated.length && r < 0.25){
        const x = pick(seated); rtdb().ref(LIVE() + '/rooms/' + room + '/seats/' + x.i + '/mic').set(!x.s.mic && Math.random() < 0.35);   /* মাঝে মাঝে মাইক খোলে/মিউট */
    }
}

/* ── মূল চক্র ── */
function tick(){
    if (document.hidden) return;
    const now = Date.now(), rooms = obj(M.rtGet(LIVE() + '/rooms'));
    Object.keys(rooms).forEach(room => {
        const hasBox = rooms[room] && rooms[room].luckybox;
        const plan = planOf(room), cur = Object.keys(plan).filter(u => (obj(M.rtGet(LIVE() + '/roomPresence/' + room)))[u]).length;
        if (hasBox){
            const w = wantOf(room, now);
            if (cur < w.want){
                const gap = w.want - cur, secs = Math.max(6, (w.latest - now) / 1000 * 0.6);
                const n = Math.max(1, Math.min(15, Math.ceil(gap * 2.5 / secs * (0.6 + Math.random() * 0.8))));
                addBots(room, Math.min(n, gap), w.latest);
            }
        }
        if (cur) seatTick(room, now);
    });
}
setInterval(tick, Math.round(2200 / SPEED));
setInterval(sweep, 4000);
setTimeout(sweep, 1500);

window.MOICrowd = { state(room){ const p = planOf(room), w = wantOf(room, Date.now()); return { bots: Object.keys(p).length, want: w.want }; }, tick, sweep };
})();
