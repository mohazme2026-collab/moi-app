/* ═══ shared/store/store-data.js — স্টোরের জিনিসের তালিকা + কেনা/পরানোর অবস্থা ═══
   কেনা জিনিস ও কোনটা পরা আছে তা থাকে localStorage-এর  moi_store_<uid>  এ:
       { owned: { ring_gold: মেয়াদ-শেষের-সময় }, equip: { frame: 'ring_gold' | null } }
   • মেয়াদ শেষ হলে নিজে থেকেই "কেনা নেই" ধরা হয়, পরানো থাকলেও খুলে যায়
   • নতুন জিনিস: নিচের ITEMS এ এক লাইন + দাম shared/core/economy.js এর C.STORE এ + ছবি shared/store/rings/ এ
   • রিংয়ের ছবি দেখানোর কাজ shared/svip/crown.js এর CROWNS (আইডি = crown) */
(function(){
    if (window.MOIStore) return;
    const SRC = (document.currentScript && document.currentScript.src) || '';
    const BASE = SRC.replace(/[^\/]*$/, '');
    const DAY = 86400000;
    const ITEMS = [
        { id: 'ring_gold', slot: 'frame', tab: 'frame', name: 'Royal Gold Crown', sub: 'Winged ring · lightning', img: 'rings/ring_gold.svg', crown: 'gold1', prices: { 7: 100, 30: 1000 } },
        /* এন্ট্রি এনিমেশন: img = স্টোর/ব্যাগে দেখানো স্থির ছবি; entry = shared/svip/entry.js এর EFFECTS এর আইডি */
        { id: 'entry_eyes1', slot: 'entry', tab: 'entry', name: 'Blue Eyes Slash', sub: 'Room entry · with sound', img: 'entries/entry_eyes1_poster.webp', entry: 'eyes1', prices: { 7: 200, 30: 1200 } },
        /* রুমের মেসেজ ব্যানার: chat = shared/svip/chat.js এর STYLES এর আইডি */
        { id: 'bubble_vip1', slot: 'bubble', tab: 'bubble', name: 'VIP Tiger Banner', sub: 'Room chat message banner', img: 'bubbles/bubble_vip.webp', chat: 'vipban', prices: { 7: 100, 30: 500 } },
        /* ইমোজি প্যাক: একবার কিনলে সারাজীবন (prices[0]); রুমের Reactions-এর শেষ ক্যাটাগরিতে যোগ হয় */
        { id: 'emoji_memes', slot: 'emoji', tab: 'emoji', name: 'Funny Face Pack', sub: '12 meme reactions', img: 'emojis/m01.webp', forever: true, prices: { 0: 1000 } }
    ];
    /* ইমোজি প্যাকের ছবি: shared/store/emojis/<id>.webp — নিজের মিম ছবি দিয়ে একই নামে বদলে দিন */
    const MEMES = ['m01','m02','m03','m04','m05','m06','m07','m08','m09','m10','m11','m12'];
    const key = uid => 'moi_store_' + uid;
    function read(uid){
        try { const v = JSON.parse(localStorage.getItem(key(uid)) || 'null'); if (v && typeof v === 'object') return { owned: v.owned || {}, equip: v.equip || {} }; } catch(e){}
        return { owned: {}, equip: {} };
    }
    function write(uid, st){
        try { localStorage.setItem(key(uid), JSON.stringify(st)); } catch(e){}
        try { window.dispatchEvent(new CustomEvent('moi:store', { detail: { uid } })); } catch(e){}
    }
    const get = id => ITEMS.find(i => i.id === id) || null;
    const img = it => BASE + it.img;
    function until(uid, id){ const t = read(uid).owned[id] || 0; return t > Date.now() ? t : 0; }
    const isOwned = (uid, id) => !!until(uid, id);
    function daysLeft(uid, id){ const t = until(uid, id); return t ? Math.max(1, Math.ceil((t - Date.now()) / DAY)) : 0; }
    function equipped(uid, slot){ const st = read(uid), id = st.equip[slot]; return id && until(uid, id) ? id : null; }
    function crownFor(uid){ const id = uid && equipped(uid, 'frame'); const it = id && get(id); return it ? it.crown : null; }
    function entryFor(uid){ const id = uid && equipped(uid, 'entry'); const it = id && get(id); return it ? it.entry : null; }
    function bubbleFor(uid){ const id = uid && equipped(uid, 'bubble'); const it = id && get(id); return it ? it.chat : null; }
    const memeSrc = id => BASE + 'emojis/' + id + '.webp';
    function setEquip(uid, slot, id){ const st = read(uid); if (id && !until(uid, id)) return false; st.equip[slot] = id || null; write(uid, st); return true; }
    /* কেনা — ডায়মন্ড কাটে (MOIEco.buyStoreItem), তারপর মেয়াদ জমা হয় */
    async function buy(uid, id, days){
        const it = get(id); if (!it || !it.prices[days]) throw new Error('INVALID');
        const r = await MOIEco.call('buyStoreItem', { id, days });
        const st = read(uid), now = Date.now();
        st.owned[id] = r.until || ((st.owned[id] > now ? st.owned[id] : now) + (days || 36500) * DAY);
        write(uid, st);
        return r;
    }
    window.MOIStore = { ITEMS, get, img, read, isOwned, until, daysLeft, equipped, crownFor, entryFor, bubbleFor, MEMES, memeSrc, setEquip, buy };
})();
