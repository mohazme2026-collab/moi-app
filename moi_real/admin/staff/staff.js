/* admin/staff/staff.js — সেলার / অফিশিয়াল / ওনার প্যানেল (টেস্ট ভার্সন)
   খোলে: staff/index.html?r=seller|official|owner   • প্রতিটি বাটন/পেজে বাংলায় "এটা কী ও কীভাবে হয়" লেখা আছে (.inf ও .hint) */
(function(){
'use strict';
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const R = (new URLSearchParams(location.search).get('r')) || 'seller';
const NEED = { seller: 'distributor', official: 'superadmin', owner: 'developer' };
const LABEL = { seller: 'সেলার', official: 'অফিশিয়াল', owner: 'MOI ওনার' };
const FB = () => window.MOIFB;
const ls = { g: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch(e){ return d; } }, s: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} } };
const GEM = '../../shared/staff/gem.png', BD = r => '../../shared/staff/badge_' + r + '.webp';
let me = null, stack = [], tt;
document.body.classList.add('r-' + R);

function toast(m){ const t = $('toast'); t.textContent = m; t.className = 'toast show'; clearTimeout(tt); tt = setTimeout(() => t.className = 'toast', 2800); }
async function call(n, d){ try { return await MOIEco.call(n, d); } catch(e){ toast('❌ ' + (e.userMsg || e.message || 'ব্যর্থ')); return null; } }
const inf = t => '<div class="inf">ℹ️ ' + t + '</div>';
const hint = t => '<span class="hint">' + t + '</span>';
const n0 = v => Number(v || 0).toLocaleString();
const fmt = ts => { const d = new Date(ts); return d.toLocaleDateString('bn-BD') + ' ' + d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }); };
async function audit(action, text){ try { await FB().db.collection('staffLog').add({ uid: me.uid, name: me.name, role: R, action, text, ts: Date.now() }); } catch(e){} }
async function refreshMe(){ try { const s = await FB().db.collection('users').doc(me.uid).get(); if (s.exists) Object.assign(me, s.data(), { uid: me.uid }); } catch(e){} }
function sheet(html){ const s = $('sheet'); s.innerHTML = '<div>' + html + '</div>'; s.classList.add('on'); s.onclick = e => { if (e.target === s) s.classList.remove('on'); }; }
function userCard(u){
    return '<div class="user"><img src="' + esc(u.photo || '') + '" onerror="this.style.visibility=\'hidden\'" alt=""><div><b>' + esc(u.name || 'User') + '</b><span>ID ' + esc(u.moiId || '') + '</span><br>' +
        '<span class="chip">💎 ' + n0(u.diamonds) + '</span><span class="chip">' + esc(u.role) + '</span>' + (u.isBanned ? '<span class="chip red">BANNED</span>' : '') + '</div></div>';
}
/* ইউজার খোঁজার বক্স: ID লিখে খুঁজলে নিচে তথ্য আসে */
function searchBox(el, onFound, ph){
    el.innerHTML = '<label>ইউজারের ID (৬ সংখ্যা)</label><div class="row"><input id="sq" inputmode="numeric" placeholder="' + (ph || 'যেমন 123456') + '"><button class="btn sm" id="sgo">খুঁজুন</button></div>' +
        hint('ইউজারের MOI ID লিখে "খুঁজুন" চাপলে নাম, ID ও ডায়মন্ড নিচে দেখা যাবে। ভুল ID হলে "খুঁজে পাওয়া যায়নি" আসবে।') + '<div id="sres"></div>';
    $('sgo').onclick = async () => {
        const r = await call('lookupUser', { target: $('sq').value.trim() }); if (!r) return;
        $('sres').innerHTML = '<div class="card" style="margin:0">' + userCard(r) + '</div>'; onFound(r);
    };
}

/* ═════════ সেলার ═════════ */
const SELLER = {
    home(){
        return inf('এটা সেলার প্যানেল। এখান থেকে আপনার ডায়মন্ড ব্যালেন্স থেকে ইউজারকে রিচার্জ পাঠান। প্রতিটি বাটনের নিচে লেখা আছে সেটা কী করে।') +
        '<div class="wal"><img src="' + GEM + '" alt=""><div><span>আপনার ডায়মন্ড ব্যালেন্স</span><b id="bal">' + n0(me.diamonds) + '</b></div></div>' +
        '<div class="grid">' +
        tile('send', '📲', 'রিচার্জ পাঠান', 'ইউজারের ID দিয়ে খুঁজে ডায়মন্ড পাঠান। ৫ সেকেন্ড বাটন চেপে ধরে রাখলে তবেই যায়।') +
        tile('hist', '🧾', 'হিস্ট্রি', 'কাকে, কোন ID-তে, কখন পাঠিয়েছেন। ৭ ও ৩০ দিনের মোট হিসাব।') +
        tile('mine', '🛍️', 'আমার সেলার তথ্য', 'রিচার্জ লিস্টে আপনার নাম, WhatsApp নম্বর ও অবস্থা (চালু/বন্ধ)।') + '</div>';
    },
    send(el){
        let target = null, amt = '';
        el.innerHTML = inf('এখানে ইউজারকে রিচার্জ পাঠান। ধাপ: ১) ID লিখে খুঁজুন ২) পরিমাণ লিখুন ৩) নিচের সবুজ বাটন ৫ সেকেন্ড চেপে ধরে রাখুন। আপনার ব্যালেন্স কমবে, ইউজারের বাড়বে, আর এটা "রিচার্জ" হিসেবে গণ্য হবে (SVIP পয়েন্ট যোগ হয়)।') +
            '<div class="wal"><img src="' + GEM + '" alt=""><div><span>আপনার ব্যালেন্স</span><b id="bal">' + n0(me.diamonds) + '</b></div></div><div id="sb"></div>' +
            '<label>পাঠানোর পরিমাণ (ডায়মন্ড)</label><div class="disp" id="disp">0</div>' +
            hint('নিচের নম্বর প্যাড দিয়ে লিখুন। "⌫" একটা সংখ্যা মোছে, "C" সব মোছে। ব্যালেন্সের বেশি পাঠানো যাবে না।') +
            '<div class="chips">' + [100, 500, 1000, 5000].map(v => '<button data-v="' + v + '">' + v + '</button>').join('') + '</div>' +
            '<div class="pad">' + [1,2,3,4,5,6,7,8,9,'C',0,'⌫'].map(k => '<button data-k="' + k + '">' + k + '</button>').join('') + '</div>' +
            '<button class="hold" id="hold"><i></i><span id="ht">৫ সেকেন্ড চেপে ধরে পাঠান</span></button>' +
            hint('ভুলে যাতে না যায় তাই বাটনটা ৫ সেকেন্ড চেপে ধরে রাখতে হয়। মাঝপথে ছেড়ে দিলে কিছুই পাঠানো হয় না।');
        searchBox($('sb'), r => { target = r; });
        const upd = () => { $('disp').textContent = n0(amt || 0); };
        el.querySelectorAll('.pad button').forEach(b => b.onclick = () => { const k = b.dataset.k; if (k === 'C') amt = ''; else if (k === '⌫') amt = amt.slice(0, -1); else if (amt.length < 8) amt = (amt + k).replace(/^0+/, ''); upd(); });
        el.querySelectorAll('.chips button').forEach(b => b.onclick = () => { amt = b.dataset.v; upd(); });
        const hb = $('hold'); let timer = 0;
        const stop = () => { clearTimeout(timer); hb.classList.remove('go'); $('ht').textContent = '৫ সেকেন্ড চেপে ধরে পাঠান'; };
        hb.addEventListener('contextmenu', e => e.preventDefault());
        hb.addEventListener('pointerdown', () => {
            if (!target) return toast('আগে ইউজারের ID খুঁজুন');
            const a = parseInt(amt, 10); if (!(a > 0)) return toast('পরিমাণ লিখুন');
            if (isSuspended()) return toast('আপনার সেলার অ্যাকাউন্ট বন্ধ আছে');
            hb.classList.add('go'); $('ht').textContent = 'ধরে রাখুন…';
            timer = setTimeout(async () => {
                hb.classList.remove('go'); $('ht').textContent = 'পাঠানো হচ্ছে…';
                const r = await call('distributorTransfer', { target: target.uid, amount: a, method: 'seller_panel' });
                $('ht').textContent = '৫ সেকেন্ড চেপে ধরে পাঠান';
                if (!r) return;
                /* রিচার্জ হিসেবে গণ্য: SVIP পয়েন্ট বাড়ে */
                const pk = 'moi_svip_points_' + target.uid; ls.s(pk, (Number(ls.g(pk, 0)) || 0) + a);
                /* ইউজারের ইনবক্সে নোটিফিকেশন (সেলারের নাম, লোগো, পরিমাণ) */
                const ik = 'moi_inbox_sys_' + target.uid, L = ls.g(ik, []);
                L.unshift({ id: 'rc' + Date.now(), title: 'রিচার্জ সফল', body: me.name + ' থেকে ' + n0(a) + ' ডায়মন্ড রিচার্জ পেয়েছেন', img: '../shared/staff/badge_seller.webp', from: me.name, amt: a, ts: Date.now(), seen: false }); ls.s(ik, L.slice(0, 60));
                const hk = 'moi_staff_hist_' + me.uid, H = ls.g(hk, []); H.unshift({ ts: Date.now(), name: target.name, id: target.moiId, amt: a }); ls.s(hk, H.slice(0, 500));
                await audit('recharge', a + ' → ' + target.moiId);
                await refreshMe(); $('bal').textContent = n0(me.diamonds); amt = ''; upd();
                toast('✅ ' + target.name + ' কে ' + n0(a) + ' 💎 রিচার্জ পাঠানো হয়েছে');
            }, 5000);
        });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => hb.addEventListener(e, stop));
    },
    hist(el){
        const H = ls.g('moi_staff_hist_' + me.uid, []), now = Date.now();
        const sum = d => H.filter(x => now - x.ts < d * 864e5).reduce((a, x) => a + x.amt, 0);
        el.innerHTML = inf('এখানে আপনার পাঠানো সব রিচার্জের তালিকা আছে — কাকে, কোন ID-তে, কখন। উপরে গত ৭ ও ৩০ দিনে মোট কত ডায়মন্ড পাঠিয়েছেন তা দেখা যায়।') +
            '<div class="two"><div class="card"><span class="mut">গত ৭ দিন</span><h3>' + n0(sum(7)) + ' 💎</h3></div><div class="card"><span class="mut">গত ৩০ দিন</span><h3>' + n0(sum(30)) + ' 💎</h3></div></div>' +
            '<div class="card list">' + (H.map(x => '<div><span>' + esc(x.name) + '<br><span class="mut">ID ' + esc(x.id) + ' • ' + fmt(x.ts) + '</span></span><b>' + n0(x.amt) + ' 💎</b></div>').join('') || '<span class="mut">এখনো কিছু পাঠাননি</span>') + '</div>';
    },
    mine(el){
        const s = sellerReg().find(x => x.uid === me.uid);
        el.innerHTML = inf('ইউজাররা "ডায়মন্ড কিনুন" তালিকায় যে তথ্য দেখে সেটাই এখানে। এই তথ্য বদলাতে হলে অফিশিয়ালকে জানান, তিনি বদলে দেবেন।') +
            '<div class="card">' + (s ? '<b>' + esc(s.name) + '</b><br><span class="mut">ID ' + esc(s.id) + '</span><br>WhatsApp: ' + esc(s.phone) + '<br>লিংক: ' + esc(s.link || '—') + '<br><span class="chip' + (s.status === 'off' ? ' red' : '') + '">' + (s.status === 'off' ? 'বন্ধ (সাসপেন্ড)' : 'চালু') + '</span>' : '<span class="mut">আপনি এখনো রিচার্জ লিস্টে নেই। অফিশিয়ালকে WhatsApp নম্বর ও লিংক দিন, তিনি যোগ করবেন।</span>') + '</div>';
    }
};
const sellerReg = () => ls.g('moi_staff_sellers', []);
const isSuspended = () => { const s = sellerReg().find(x => x.uid === me.uid); return !!(s && s.status === 'off'); };

/* ═════════ অফিশিয়াল ═════════ */
const OFFICIAL = {
    home(){
        return inf('এটা অফিশিয়াল প্যানেল। ইউজার/সেলারকে ডায়মন্ড দেওয়া, সেলার সামলানো, রিপোর্ট দেখা, ব্যান করা — সব এখান থেকে। যে বাটনে কী হয় তা বাটনের নিচে লেখা আছে।') +
        '<div class="grid">' +
        tile('give', '🎁', 'ডায়মন্ড দিন', 'ইউজার বা সেলারকে ডায়মন্ড দিন। এটা রিচার্জ গণ্য হয় না।') +
        tile('sellers', '🛍️', 'সেলার লিস্ট', 'সেলার যোগ, WhatsApp নম্বর, সাসপেন্ড বা বাদ দেওয়া।') +
        tile('reports', '🚩', 'রিপোর্ট', 'ইউজার ও রুমের বিরুদ্ধে অভিযোগ দেখে ব্যবস্থা নিন।') +
        tile('ban', '⛔', 'ইউজার ব্যান', 'ID দিয়ে ইউজার ব্যান বা আনব্যান করুন।') +
        tile('roomban', '🏠', 'রুম বন্ধ', 'রুমের ID দিয়ে রুম বন্ধ করুন বা আবার চালু করুন।') +
        tile('notice', '📢', 'নোটিফিকেশন পোস্ট', 'সবার "সিস্টেম নোটিফিকেশন"-এ একটা খবর পাঠান।') +
        tile('uinfo', '🔎', 'ইউজার তথ্য / VIP', 'ইউজারের পূর্ণ তথ্য দেখুন, VIP দিন বা সরান।') +
        tile('hist', '🧾', 'আমার হিস্ট্রি', 'আপনি এ পর্যন্ত যা যা করেছেন তার তালিকা।') +
        tile('stats', '📊', 'পরিসংখ্যান', 'মোট ইউজার, ব্যান, সেলার ইত্যাদির সংখ্যা।') +
        tile('log', '📜', 'অডিট লগ', 'সব স্টাফের কাজের রেকর্ড (কে, কী, কখন)।') +
        tile('soon1', '🖼️', 'ব্যানার / ইভেন্ট', 'হোমের ব্যানার বসানো — পরের ধাপে আসবে।', 1) +
        tile('soon2', '💬', 'সাপোর্ট মেসেজ', 'ইউজারদের সমস্যার মেসেজ — আসল ব্যাকএন্ড লাগবে, পরে আসবে।', 1) + '</div>';
    },
    soon1(el){ el.innerHTML = inf('এখানে হোমের ব্যানার ও ইভেন্ট বসানো যাবে। এখনো বানানো হয়নি — আসল সার্ভার এলে যোগ হবে।'); },
    soon2(el){ el.innerHTML = inf('ইউজাররা সাপোর্টে যে মেসেজ পাঠাবে তা এখানে আসবে। আসল ব্যাকএন্ড ছাড়া হবে না, তাই পরে।'); },
    give(el){
        let target = null;
        el.innerHTML = inf('ইউজার বা সেলারকে সরাসরি ডায়মন্ড দিন। এটা রিচার্জ গণ্য হয় না (SVIP পয়েন্ট বাড়ে না)। ওনারের ঠিক করা "একবারে" ও "দিনে" সীমার বেশি দেওয়া যায় না।') +
            '<div id="lim" class="hint"></div><div id="sb"></div><label>ডায়মন্ডের পরিমাণ</label><input id="ga" type="number" inputmode="numeric" placeholder="যেমন 500">' + hint('যত ডায়মন্ড দিতে চান লিখুন। সীমা পার হলে লাল বার্তা আসবে।') +
            '<label>নোট (ঐচ্ছিক)</label><input id="gn" placeholder="কেন দিচ্ছেন">' + hint('এটা শুধু রেকর্ডে থাকে, ইউজার দেখে না।') +
            '<button class="btn w" id="gg">🎁 ডায়মন্ড দিন</button>';
        call('getStaffLimits', {}).then(L => { if (L) $('lim').textContent = 'আপনার সীমা: একবারে ' + n0(L.perSend) + ' • দিনে ' + n0(L.perDay) + (me.role === 'developer' ? ' (ওনারের সীমা নেই)' : ''); });
        searchBox($('sb'), r => { target = r; });
        $('gg').onclick = async () => {
            if (!target) return toast('আগে ইউজার খুঁজুন'); const a = parseInt($('ga').value, 10); if (!(a > 0)) return toast('পরিমাণ লিখুন');
            if (!confirm(target.name + ' কে ' + n0(a) + ' 💎 দেবেন?')) return;
            const r = await call('officialGive', { target: target.uid, amount: a, note: $('gn').value }); if (!r) return;
            await audit('give', a + ' → ' + target.moiId); toast('✅ দেওয়া হয়েছে'); $('sres').innerHTML = ''; $('ga').value = '';
        };
    },
    sellers(el){
        const L = sellerReg();
        el.innerHTML = inf('এখানে সব সেলার আছে। সেলার হতে চাইলে সে আপনাকে ID, WhatsApp নম্বর ও লিংক দেবে — আপনি নিচের ফর্মে বসিয়ে দিলে সে সেলার হয়ে যাবে ও "ডায়মন্ড কিনুন" তালিকায় দেখা যাবে।') +
            '<div class="card list">' + (L.map((s, i) => '<div style="flex-wrap:wrap"><span><b>' + esc(s.name) + '</b> <span class="chip' + (s.status === 'off' ? ' red' : '') + '">' + (s.status === 'off' ? 'বন্ধ' : 'চালু') + '</span><br><span class="mut">ID ' + esc(s.id) + ' • WA ' + esc(s.phone) + '</span></span><span class="row sm" style="gap:6px"><button class="btn ghost sm" data-w="' + i + '">WhatsApp</button><button class="btn ghost sm" data-t="' + i + '">' + (s.status === 'off' ? 'চালু' : 'বন্ধ') + '</button><button class="btn bad sm" data-d="' + i + '">বাদ</button></span></div>').join('') || '<span class="mut">কোনো সেলার নেই</span>') + '</div>' +
            hint('WhatsApp = নম্বরে WhatsApp খোলে। বন্ধ = সাময়িক সাসপেন্ড (লিস্ট থেকে লুকায়, পাঠাতে পারে না)। বাদ = সেলার পদ চলে যায়, আবার সাধারণ ইউজার।') +
            '<div class="card"><h3>নতুন সেলার যোগ</h3><div id="sb"></div><label>WhatsApp নম্বর</label><input id="rw" placeholder="+8801XXXXXXXXX">' + hint('দেশের কোডসহ নম্বর। ইউজাররা এতে সরাসরি WhatsApp করবে।') +
            '<label>WhatsApp লিংক (ঐচ্ছিক)</label><input id="rl" placeholder="https://wa.me/...">' + hint('থাকলে এই লিংকই খুলবে, না থাকলে নম্বর থেকে লিংক হবে।') +
            '<button class="btn w" id="rg" style="margin-top:10px">➕ সেলার বানান</button></div>';
        let target = null; searchBox($('sb'), r => { target = r; }, 'সেলারের ID');
        el.querySelectorAll('[data-w]').forEach(b => b.onclick = () => openWA(L[+b.dataset.w]));
        el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { const s = L[+b.dataset.t]; s.status = s.status === 'off' ? 'on' : 'off'; ls.s('moi_staff_sellers', L); audit('seller_toggle', s.id + ' ' + s.status); toast('✅ বদলেছে'); go('sellers', 1); });
        el.querySelectorAll('[data-d]').forEach(b => b.onclick = async () => { const s = L[+b.dataset.d]; if (!confirm(s.name + ' কে সেলার থেকে বাদ দেবেন?')) return; if (await call('removeSeller', { target: s.uid })){ L.splice(+b.dataset.d, 1); ls.s('moi_staff_sellers', L); setReg(s.uid, null); audit('seller_remove', s.id); toast('✅ বাদ দেওয়া হয়েছে'); go('sellers', 1); } });
        $('rg').onclick = async () => {
            if (!target) return toast('আগে ইউজার খুঁজুন'); const ph = $('rw').value.trim(); if (!ph) return toast('WhatsApp নম্বর দিন');
            const r = await call('registerSeller', { target: target.uid }); if (!r) return;
            const L2 = sellerReg().filter(x => x.uid !== r.uid); L2.push({ uid: r.uid, id: r.moiId, name: r.name, photo: r.photo, phone: ph, link: $('rl').value.trim(), status: 'on' }); ls.s('moi_staff_sellers', L2); setReg(r.uid, 'distributor');
            await audit('seller_add', r.moiId); toast('✅ সেলার হয়েছে'); go('sellers', 1);
        };
    },
    reports(el){
        let tab = 'id';
        const draw = async () => {
            el.innerHTML = inf('ইউজাররা যাদের/যে রুমকে রিপোর্ট করেছে এখানে আসে। ট্যাব: "ID" = ইউজারের বিরুদ্ধে, "রুম" = রুমের বিরুদ্ধে, "ব্যান লিস্ট" = এখন যারা ব্যান। প্রতিটির নিচে ব্যবস্থার বাটন আছে।') +
                '<div class="tabs"><button data-t="id" class="' + (tab === 'id' ? 'on' : '') + '">ID</button><button data-t="room" class="' + (tab === 'room' ? 'on' : '') + '">রুম</button><button data-t="bans" class="' + (tab === 'bans' ? 'on' : '') + '">ব্যান লিস্ট</button></div><div id="rb" class="card list">লোড হচ্ছে…</div>' +
                '';
            el.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
            const box = $('rb');
            try {
                if (tab === 'bans'){
                    const s = await FB().db.collection('users').where('isBanned', '==', true).get(), rows = [];
                    s.forEach(d => { const u = d.data(); rows.push('<div><span>' + esc(u.name) + '<br><span class="mut">ID ' + esc(u.moiId) + ' • ' + esc(u.banReason || '') + '</span></span><button class="btn ghost sm" data-u="' + d.id + '">আনব্যান</button></div>'); });
                    box.innerHTML = rows.join('') || '<span class="mut">কেউ ব্যান নেই</span>';
                    box.querySelectorAll('[data-u]').forEach(b => b.onclick = async () => { if (await call('unbanUser', { target: b.dataset.u })){ audit('unban', b.dataset.u); toast('✅ আনব্যান'); draw(); } });
                } else {
                    const s = await FB().db.collection('reports').get(), rows = [];
                    s.forEach(d => { const r = d.data(); if ((r.type || 'id') !== tab || r.status === 'done') return;
                        rows.push('<div style="flex-wrap:wrap"><span><b>' + esc(tab === 'room' ? 'রুম ' + (r.roomId || '') : 'ID ' + (r.targetId || r.targetUid)) + '</b><br><span class="mut">' + esc(r.reason || '') + '</span></span><span style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px">' +
                            '<button class="btn ghost sm" data-a="ign" data-i="' + d.id + '">উপেক্ষা</button><button class="btn ghost sm" data-a="warn" data-i="' + d.id + '">সতর্ক</button>' +
                            (tab === 'room' ? '<button class="btn bad sm" data-a="close" data-i="' + d.id + '">রুম বন্ধ</button>' : '<button class="btn bad sm" data-a="b7" data-i="' + d.id + '">৭ দিন ব্যান</button><button class="btn bad sm" data-a="bp" data-i="' + d.id + '">স্থায়ী ব্যান</button>') + '</span></div>'); });
                    box.innerHTML = rows.join('') || '<span class="mut">কোনো রিপোর্ট নেই</span>';
                    box.querySelectorAll('[data-a]').forEach(b => b.onclick = async () => {
                        const id = b.dataset.i, a = b.dataset.a, ds = await FB().db.collection('reports').doc(id).get(), r = ds.data(); let ok = true;
                        if (a === 'warn'){ ok = !!(r.targetUid && await call('notifyUser', { target: r.targetUid, text: 'আপনার বিরুদ্ধে অভিযোগ এসেছে। নিয়ম মেনে চলুন।' })); if (!ok) ok = true; }
                        if (a === 'b7') ok = !!(await call('banUser', { target: r.targetUid, hours: 168, reason: r.reason }));
                        if (a === 'bp') ok = !!(await call('banUser', { target: r.targetUid, hours: 0, reason: r.reason }));
                        if (a === 'close'){ try { await FB().db.collection('rooms').doc(r.roomId).set({ closed: true, closedReason: r.reason }, { merge: true }); } catch(e){ ok = false; toast('রুম পাওয়া যায়নি'); } }
                        if (ok){ await FB().db.collection('reports').doc(id).set({ status: 'done', action: a }, { merge: true }); audit('report_' + a, id); toast('✅ ব্যবস্থা নেওয়া হয়েছে'); draw(); }
                    });
                }
            } catch(e){ box.innerHTML = '<span class="mut">পড়া যায়নি</span>'; }
        };
        draw();
    },
    ban(el){
        let t = null;
        el.innerHTML = inf('ইউজারকে ব্যান করুন বা ব্যান তুলে নিন। ব্যান হলে সে অ্যাপে কিছু করতে পারবে না। সময় "০" দিলে স্থায়ী ব্যান। কারণ লিখে রাখলে পরে দেখা যাবে।') +
            '<div id="sb"></div><div id="bx" style="display:none"><label>ব্যানের সময় (ঘণ্টা)</label><input id="bh" type="number" value="24">' + hint('২৪ = ১ দিন, ১৬৮ = ৭ দিন, ০ = চিরতরে।') + '<label>কারণ</label><input id="br" placeholder="কেন ব্যান">' +
            '<div class="two" style="margin-top:10px"><button class="btn bad" id="bb">ব্যান করুন</button><button class="btn ghost" id="bu">আনব্যান</button></div></div>';
        searchBox($('sb'), r => { t = r; $('bx').style.display = 'block'; });
        $('bb').onclick = async () => { if (!confirm('ব্যান করবেন?')) return; if (await call('banUser', { target: t.uid, hours: +$('bh').value || 0, reason: $('br').value })){ audit('ban', t.moiId + ' ' + $('bh').value + 'h'); toast('✅ ব্যান হয়েছে'); $('sgo').click(); } };
        $('bu').onclick = async () => { if (await call('unbanUser', { target: t.uid })){ audit('unban', t.moiId); toast('✅ আনব্যান'); $('sgo').click(); } };
    },
    roomban(el){
        el.innerHTML = inf('রুম বন্ধ করলে ওই রুম আর খোলা যায় না। রুমের নম্বর/ID লিখে "খুঁজুন" চাপুন, তারপর "বন্ধ" বা "আবার চালু" বাটন। (ডেমোতে রুমে চিহ্ন বসে, আসল সার্ভারে রুম পুরো বন্ধ হবে।)') +
            '<label>রুমের ID</label><div class="row"><input id="ri" placeholder="রুমের ID"><button class="btn sm" id="rf">খুঁজুন</button></div>' + hint('রুমের ভিতরে রুম-ইনফোতে ID কপি বাটন আছে।') + '<div id="rr"></div>';
        $('rf').onclick = async () => {
            const id = $('ri').value.trim(); if (!id) return; let s = null;
            try { s = await FB().db.collection('rooms').doc(id).get(); if (!s.exists){ const q = await FB().db.collection('rooms').where('roomId', '==', id).get(); q.forEach(d => { if (!s || !s.exists) s = d; }); } } catch(e){}
            if (!s || !s.exists) return toast('রুম পাওয়া যায়নি'); const r = s.data();
            $('rr').innerHTML = '<div class="card"><b>' + esc(r.name || r.title || 'রুম') + '</b><br><span class="mut">ID ' + esc(s.id) + '</span> ' + (r.closed ? '<span class="chip red">বন্ধ</span>' : '<span class="chip">চালু</span>') + '<div class="two" style="margin-top:10px"><button class="btn bad" id="rc">রুম বন্ধ</button><button class="btn ghost" id="ro">আবার চালু</button></div></div>';
            $('rc').onclick = async () => { await FB().db.collection('rooms').doc(s.id).set({ closed: true }, { merge: true }); audit('room_close', s.id); toast('✅ বন্ধ করা হয়েছে'); };
            $('ro').onclick = async () => { await FB().db.collection('rooms').doc(s.id).set({ closed: false }, { merge: true }); audit('room_open', s.id); toast('✅ চালু করা হয়েছে'); };
        };
    },
    notice(el){
        el.innerHTML = inf('এখানে লিখলে সবার ইনবক্সের "সিস্টেম নোটিফিকেশন" পেজে খবরটা দেখা যাবে। নতুন ফিচার, ইভেন্ট বা সতর্কতা জানাতে ব্যবহার করুন।') +
            '<label>শিরোনাম</label><input id="nt">' + hint('ছোট ও পরিষ্কার শিরোনাম।') + '<label>বার্তা</label><textarea id="nb" rows="4"></textarea>' + hint('বিস্তারিত লিখুন।') + '<button class="btn w" id="ns">📢 পোস্ট করুন</button>';
        $('ns').onclick = () => { const t = $('nt').value.trim(), b = $('nb').value.trim(); if (!t) return toast('শিরোনাম দিন'); const L = ls.g('moi_staff_notices', []); L.unshift({ id: 'sn' + Date.now(), title: t, body: b, ts: Date.now() }); ls.s('moi_staff_notices', L.slice(0, 50)); audit('notice', t); toast('✅ পোস্ট হয়েছে'); $('nt').value = $('nb').value = ''; };
    },
    uinfo(el){
        el.innerHTML = inf('ইউজারের ID দিয়ে তার সব তথ্য দেখুন: নাম, ডায়মন্ড, লেভেল, রোল, ব্যাজ। এখান থেকে VIP দিতে বা সরাতেও পারবেন।') + '<div id="sb"></div><div id="ux"></div>';
        searchBox($('sb'), r => {
            $('ux').innerHTML = '<div class="card"><span class="chip">লেভেল ' + r.level + '</span><span class="chip">দেশ ' + esc(r.country || '—') + '</span><span class="chip">ব্যাজ ' + esc((r.badges || []).join(', ') || '—') + '</span>' + hint('VIP দিলে ইউজারের রোল VIP হয়; সরালে সাধারণ ইউজার।') + '<div class="two"><button class="btn" id="vo">VIP দিন</button><button class="btn ghost" id="vf">VIP সরান</button></div></div>';
            $('vo').onclick = async () => { if (await call('setRole', { target: r.uid, role: 'vip' })){ audit('vip_on', r.moiId); toast('✅ VIP দেওয়া হয়েছে'); } };
            $('vf').onclick = async () => { if (await call('setRole', { target: r.uid, role: 'user' })){ audit('vip_off', r.moiId); toast('✅ VIP সরানো হয়েছে'); } };
        });
    },
    async hist(el){
        el.innerHTML = inf('আপনি যা যা করেছেন (ডায়মন্ড দেওয়া, ব্যান, সেলার যোগ ইত্যাদি) তার তালিকা — কখন, কী।') + '<div class="card list" id="hl">লোড হচ্ছে…</div>';
        const L = await logs(); $('hl').innerHTML = L.filter(x => x.uid === me.uid).map(x => '<div><span>' + esc(x.action) + '<br><span class="mut">' + esc(x.text) + '</span></span><span class="mut">' + fmt(x.ts) + '</span></div>').join('') || '<span class="mut">কিছু নেই</span>';
    },
    async log(el){
        el.innerHTML = inf('সব স্টাফ (সেলার, অফিশিয়াল, ওনার) যা করেছেন তার সম্পূর্ণ রেকর্ড। কিছু ভুল হলে কে করেছে এখান থেকে ধরা যায়।') + '<div class="card list" id="hl">লোড হচ্ছে…</div>';
        const L = await logs(); $('hl').innerHTML = L.map(x => '<div><span>' + esc(x.name) + ' <span class="chip">' + esc(x.role) + '</span><br><span class="mut">' + esc(x.action) + ' • ' + esc(x.text) + '</span></span><span class="mut">' + fmt(x.ts) + '</span></div>').join('') || '<span class="mut">কিছু নেই</span>';
    },
    async stats(el){
        el.innerHTML = inf('অ্যাপের মোটামুটি হিসাব: কতজন ইউজার, কতজন ব্যান, কতজন সেলার/অফিশিয়াল।') + '<div class="card list" id="st">লোড হচ্ছে…</div>';
        try {
            const s = await FB().db.collection('users').limit(1000).get(); let tot = 0, ban = 0, dia = 0; const by = {};
            s.forEach(d => { const u = d.data(); tot++; if (u.isBanned) ban++; dia += u.diamonds || 0; by[u.role] = (by[u.role] || 0) + 1; });
            $('st').innerHTML = '<div><span>মোট ইউজার</span><b>' + n0(tot) + '</b></div><div><span>ব্যান</span><b>' + ban + '</b></div><div><span>সেলার</span><b>' + (by.distributor || 0) + '</b></div><div><span>অফিশিয়াল</span><b>' + (by.superadmin || 0) + '</b></div><div><span>VIP</span><b>' + (by.vip || 0) + '</b></div>' + (R === 'owner' ? '<div><span>সব ইউজারের মোট ডায়মন্ড</span><b>' + n0(dia) + '</b></div>' : '');
        } catch(e){ $('st').textContent = 'পড়া যায়নি'; }
    }
};
async function logs(){ try { const s = await FB().db.collection('staffLog').get(), a = []; s.forEach(d => a.push(d.data())); return a.sort((x, y) => y.ts - x.ts).slice(0, 150); } catch(e){ return []; } }
function setReg(uid, role){ const g = ls.g('moi_staff_reg', {}); if (role) g[uid] = role; else delete g[uid]; ls.s('moi_staff_reg', g); }
function openWA(s){ const d = String(s.phone || '').replace(/\D/g, ''); const u = (s.link && /^https:\/\//.test(s.link)) ? s.link : (d ? 'https://wa.me/' + d : ''); if (u) window.open(u, '_blank'); else toast('নম্বর নেই'); }

/* ═════════ ওনার ═════════ */
const OWNER = {
    home(){
        return inf('আপনি MOI ওনার — সব ক্ষমতা আপনার। উপরের তিন ব্যাজে চাপলে সেই প্যানেল খোলে। নিচের বাটনগুলো শুধু ওনারের (অফিশিয়াল/সেলার এগুলো দেখে না)।') +
        '<div class="grid" style="grid-template-columns:repeat(3,1fr)">' +
        '<button class="tile" data-open="owner" style="align-items:center;text-align:center;min-height:auto"><img src="' + BD('owner') + '" height="46" alt=""><b>ওনার</b></button>' +
        '<button class="tile" data-open="official" style="align-items:center;text-align:center;min-height:auto"><img src="' + BD('official') + '" height="46" alt=""><b>অফিশিয়াল</b></button>' +
        '<button class="tile" data-open="seller" style="align-items:center;text-align:center;min-height:auto"><img src="' + BD('seller') + '" height="46" alt=""><b>সেলার</b></button></div>' +
        hint('ওনার = নিচের বাটন; অফিশিয়াল = অফিশিয়াল প্যানেল; সেলার = সেলার প্যানেল খোলে। আপনি তিনটাই ব্যবহার করতে পারেন।') +
        '<div class="grid">' +
        tile('appoint', '🛡️', 'অফিশিয়াল নিয়োগ', 'কাউকে অফিশিয়াল বানান বা পদ থেকে সরান।') +
        tile('limits', '⚖️', 'অফিশিয়ালের সীমা', 'অফিশিয়াল একবারে ও দিনে সর্বোচ্চ কত ডায়মন্ড দিতে পারবে।') +
        tile('mint', '💎', 'ডায়মন্ড তৈরি', 'নতুন ডায়মন্ড বানিয়ে কাউকে দিন (বা কেটে নিন)। শুধু ওনার পারে।') +
        tile('gifts', '🎀', 'গিফটের দাম', 'গিফটের তালিকা ও দাম দেখুন।') +
        tile('rate', '💱', 'ডায়মন্ড রেট', '১ ডায়মন্ডের টাকার দাম ঠিক করুন।') +
        tile('app', '⚙️', 'অ্যাপ সেটিংস', 'মেইনটেনেন্স মোড ও ঘোষণা।') +
        tile('off', '🎁', 'অফিশিয়াল প্যানেলের কাজ', 'ডায়মন্ড দেওয়া, রিপোর্ট, ব্যান — অফিশিয়ালের সব কাজ।', 0, 'official') +
        tile('stats', '📊', 'পুরো অ্যাপের পরিসংখ্যান', 'ইউজার, ব্যান, মোট ডায়মন্ড।') +
        tile('log', '📜', 'সব অডিট লগ', 'সবার কাজের রেকর্ড।') + '</div>';
    },
    off(el){ location.href = '?r=official'; },
    appoint(el){
        let t = null;
        el.innerHTML = inf('কাউকে অফিশিয়াল বানাতে ID দিয়ে খুঁজে "অফিশিয়াল বানান" চাপুন — সে অফিশিয়াল প্যানেল, রিং, ব্যাজ ও কার্ড পাবে। "সরান" চাপলে সাধারণ ইউজার হয়ে যাবে।') + '<div id="sb"></div><div id="ab" style="display:none" class="two"><button class="btn" id="a1">অফিশিয়াল বানান</button><button class="btn bad" id="a0">সরান</button></div>' +
            '<div class="card"><h3>বর্তমান অফিশিয়াল</h3><div class="list" id="ol">লোড হচ্ছে…</div></div>';
        searchBox($('sb'), r => { t = r; $('ab').style.display = 'grid'; });
        const done = async on => { const r = await call('appointOfficial', { target: t.uid, on }); if (r){ setReg(r.uid, on ? 'superadmin' : null); audit(on ? 'official_add' : 'official_remove', r.moiId); toast('✅ হয়েছে'); go('appoint', 1); } };
        $('a1').onclick = () => done(true); $('a0').onclick = () => done(false);
        FB().db.collection('users').where('role', '==', 'superadmin').get().then(s => { const rows = []; s.forEach(d => { const u = d.data(); rows.push('<div><span>' + esc(u.name) + '</span><span class="mut">ID ' + esc(u.moiId) + '</span></div>'); }); $('ol').innerHTML = rows.join('') || '<span class="mut">কেউ নেই</span>'; }).catch(() => { $('ol').textContent = '—'; });
    },
    limits(el){
        el.innerHTML = inf('অফিশিয়াল যেন ইচ্ছামতো ডায়মন্ড না দেয় তাই সীমা বেঁধে দিন। "একবারে" = এক দফায় সর্বোচ্চ। "দিনে" = সারা দিনে মোট সর্বোচ্চ। ওনারের (আপনার) কোনো সীমা নেই।') +
            '<label>একবারে সর্বোচ্চ</label><input id="l1" type="number">' + hint('এর বেশি একবারে দিলে সিস্টেম আটকে দেয়।') + '<label>দিনে সর্বোচ্চ</label><input id="l2" type="number">' + hint('আজকের মোট এর বেশি হলে আর দেওয়া যায় না; পরদিন নতুন করে শুরু।') + '<button class="btn w" id="ls">সেভ করুন</button>';
        call('getStaffLimits', {}).then(L => { if (L){ $('l1').value = L.perSend; $('l2').value = L.perDay; } });
        $('ls').onclick = async () => { if (await call('setStaffLimits', { perSend: +$('l1').value, perDay: +$('l2').value })){ audit('limits', $('l1').value + '/' + $('l2').value); toast('✅ সেভ হয়েছে'); } };
    },
    mint(el){
        let t = null;
        el.innerHTML = inf('এটাই একমাত্র জায়গা যেখানে নতুন ডায়মন্ড তৈরি হয়। ID খুঁজে পরিমাণ দিন। ঋণাত্মক (-) দিলে কেটে নেওয়া হবে। সব লেনদেন লগে থাকে। (ডেমোর ডায়মন্ড, আসল টাকা নয়)') + '<div id="sb"></div><label>পরিমাণ</label><input id="ma" type="number" placeholder="1000">' + hint('যেমন 1000 = যোগ, -500 = কাটা।') + '<label>নোট</label><input id="mn" placeholder="যেমন: সেলারের স্টক">' + hint('রেকর্ডের জন্য, কেন দিলেন।') + '<button class="btn w" id="mg">💎 নিশ্চিত করুন</button>';
        searchBox($('sb'), r => { t = r; });
        $('mg').onclick = async () => { if (!t) return toast('আগে ইউজার খুঁজুন'); const a = parseInt($('ma').value, 10); if (!a) return toast('পরিমাণ দিন'); if (!confirm(a + ' 💎 — নিশ্চিত?')) return; const r = await call('adminAddDiamonds', { target: t.uid, amount: a, note: $('mn').value }); if (r){ audit('mint', a + ' → ' + t.moiId); toast('✅ নতুন ব্যালেন্স ' + n0(r.balance)); } };
    },
    gifts(el){
        const G = (window.MOIEco && MOIEco.GIFTS) || { kiss: 1, rose: 2, choco: 5, bell: 5, teddy: 10, key: 10, bells: 10, teddyhat: 20, teddyring: 20, ringbox: 20, trophy: 20, chest: 20 };
        el.innerHTML = inf('অ্যাপের গিফটের তালিকা ও দাম। এখন দাম বদলাতে হলে কোডের তালিকা বদলাতে হয় (আমাকে বলুন)। আসল সার্ভারে এখান থেকেই বদলানো যাবে।') + '<div class="card list">' + Object.keys(G).map(k => '<div><span><img src="../../room/gifts/img/' + k + '.webp" height="34" style="vertical-align:middle" alt=""> ' + k + '</span><b>' + G[k] + ' 💎</b></div>').join('') + '</div>';
    },
    rate(el){
        const v = ls.g('moi_staff_rate', { bdt: 1 });
        el.innerHTML = inf('১ ডায়মন্ডের দাম কত টাকা তা এখানে লিখে রাখুন। এটা এখন শুধু রেকর্ড; আসল পেমেন্ট চালু হলে এই রেটে হিসাব হবে।') + '<label>১ ডায়মন্ড = কত টাকা</label><input id="rt" type="number" step="0.01" value="' + v.bdt + '">' + hint('যেমন 1.2 মানে ১ ডায়মন্ড ১.২ টাকা।') + '<button class="btn w" id="rs">সেভ</button>';
        $('rs').onclick = () => { ls.s('moi_staff_rate', { bdt: +$('rt').value || 1 }); audit('rate', $('rt').value); toast('✅ সেভ হয়েছে'); };
    },
    app(el){
        const v = ls.g('moi_staff_app', { maint: false, ann: '' });
        el.innerHTML = inf('পুরো অ্যাপের সেটিংস। "মেইনটেনেন্স মোড" চালু করলে (আসল সার্ভারে) ইউজাররা ঢুকতে পারবে না — আপডেটের সময় লাগে। এখন শুধু সেভ হয়, কাজ করবে আসল ব্যাকএন্ডে।') +
            '<label><input type="checkbox" id="mm" ' + (v.maint ? 'checked' : '') + ' style="width:auto"> মেইনটেনেন্স মোড চালু</label>' + hint('চালু করলে অ্যাপ সাময়িক বন্ধ দেখাবে।') + '<label>সবার জন্য ঘোষণা</label><textarea id="an" rows="3">' + esc(v.ann) + '</textarea>' + hint('হোমে সবাইকে দেখানোর ছোট ঘোষণা।') + '<button class="btn w" id="as">সেভ</button>';
        $('as').onclick = () => { ls.s('moi_staff_app', { maint: $('mm').checked, ann: $('an').value }); audit('app', 'maint=' + $('mm').checked); toast('✅ সেভ হয়েছে'); };
    },
    stats: OFFICIAL.stats, log: OFFICIAL.log
};
/* ওনার "সেলার/অফিশিয়াল" ট্যাপে ব্যাজ-ট্যাব */
const PAGES = { seller: SELLER, official: OFFICIAL, owner: OWNER };
function tile(k, ic, t, d, soon, to){ return '<button class="tile' + (soon ? ' soon' : '') + '" data-go="' + k + '"' + (to ? ' data-to="' + to + '"' : '') + '><span class="ic">' + ic + '</span><b>' + t + '</b><span>' + d + '</span></button>'; }
const TITLES = { send: 'রিচার্জ পাঠান', hist: 'হিস্ট্রি', mine: 'আমার সেলার তথ্য', give: 'ডায়মন্ড দিন', sellers: 'সেলার লিস্ট', reports: 'রিপোর্ট', ban: 'ইউজার ব্যান', roomban: 'রুম বন্ধ', notice: 'নোটিফিকেশন পোস্ট', uinfo: 'ইউজার তথ্য / VIP', stats: 'পরিসংখ্যান', log: 'অডিট লগ', soon1: 'ব্যানার / ইভেন্ট', soon2: 'সাপোর্ট মেসেজ', appoint: 'অফিশিয়াল নিয়োগ', limits: 'অফিশিয়ালের সীমা', mint: 'ডায়মন্ড তৈরি', gifts: 'গিফটের দাম', rate: 'ডায়মন্ড রেট', app: 'অ্যাপ সেটিংস' };

function go(k, replace){
    if (replace) stack.pop();
    stack.push(k);
    const P = PAGES[R], pg = $('pg');
    $('ttl').textContent = k === 'home' ? LABEL[R] + ' প্যানেল' : (TITLES[k] || k);
    if (k === 'home'){ pg.innerHTML = P.home(); }
    else { pg.innerHTML = ''; const f = P[k]; if (f){ const r = f(pg); if (typeof r === 'string') pg.innerHTML = r; } }
    pg.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { if (b.dataset.to) location.href = '?r=' + b.dataset.to; else go(b.dataset.go); });
    pg.querySelectorAll('[data-open]').forEach(b => b.onclick = () => { if (b.dataset.open === R) toast('এটাই ওনার প্যানেল'); else location.href = '?r=' + b.dataset.open; });
    window.scrollTo(0, 0);
}
function back(){ if (stack.length > 1){ stack.pop(); const k = stack.pop(); go(k); } else location.href = '../../me/index.html'; }

function header(){
    const av = me.photo || '';
    $('me').innerHTML = '<div class="av"><img class="ph" src="' + esc(av) + '" alt=""></div><div><b>' + esc(me.name) + '</b>' + (window.MOIStaffBadge ? MOIStaffBadge({ uid: me.uid, role: me.role }, 22) : '') + '<small>' + LABEL[R] + '</small><span class="idl" id="idl">ID ' + esc(me.moiId || '') + '</span></div>';
    if (window.MOICrown) MOICrown.attachUser($('me').querySelector('.av'), { uid: me.uid, role: me.role });
    if (R === 'owner') $('idl').onclick = () => sheet('<h3>আপনার ৩ ব্যাজ</h3><div><img class="b" src="' + BD('owner') + '"><img class="b" src="' + BD('official') + '"><img class="b" src="' + BD('seller') + '"></div><p class="mut">অন্য ইউজার আপনার প্রোফাইলে শুধু এই ব্যাজ দেখবে — প্যানেল দেখবে না। প্যানেল শুধু আপনি খুলতে পারেন।</p>');
}

(window.MOIReady || Promise.resolve()).then(async () => {
    me = window.MOIAuth && MOIAuth.profile;
    if (!me && window.MOIAuth){ MOIAuth.require(); return; }
    if (me.role !== NEED[R] && me.role !== 'developer'){ document.body.innerHTML = '<div class="card" style="margin-top:60px;text-align:center"><h3>⛔ প্রবেশাধিকার নেই</h3><p class="mut">এই প্যানেল শুধু ' + LABEL[R] + 'দের জন্য।</p><a class="btn" href="../../me/index.html" style="text-decoration:none;display:inline-block">ফিরুন</a></div>'; return; }
    setReg(me.uid, me.role);
    $('bk').onclick = back; header(); go('home');
    window.addEventListener('popstate', () => {});
});
})();
