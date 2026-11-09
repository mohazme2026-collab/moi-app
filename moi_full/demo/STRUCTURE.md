# MOI — ফোল্ডার কাঠামো (এক ফিচার = এক ফোল্ডার)

নিয়ম: একটা বাটন/ফিচারের সব ফাইল (js, css, ছবি) তার নিজের ফোল্ডারেই থাকে।
এক ফোল্ডারের ফাইল অন্য ফোল্ডারে ঢোকে না — তাই একটার আপডেটে আরেকটা ভাঙে না।
ছবির নাম আলাদা রাখা হয়েছে (btn_*, svip_*) — js/css এর নামের সাথে মেলে না।

```
/ (মূল)           index.html  firebase.json  *.rules  .firebaserc  → Firebase এর জন্য এখানেই থাকবে
docs/             README, SETUP, এই ফাইল
functions/        Cloud Functions (লাইভ করার সময়)
demo/             ডেমো ডেটা ও বট (লাইভে এই ফোল্ডার বাদ)
login/            লগইন পেজ

home/             হোম পেজ
  index.html home.js home.css icons.js modal.js
  banner/         উপরের ব্যানার + CP/Rank কার্ড   (banner.js promo.js assets/)
  rank/           CP ও Rank পেজ                   (rank.js rank.css assets/cp/)
  rooms/          রুম কার্ড + লেভেল ব্যাজ          (rooms.js assets/lv/)

me/               আমি পেজ
  index.html me.js me.css
  svip/           SVIP পেজ + প্লেট             (svip-page.js/.css  btn_svip.webp  art/)
  wallet/         Wallet                        (wallet.js/.css  btn_wallet.webp)
  store/ vip/ level/ bag/ control/ visitor/ feedback/   প্রতিটার নিজের পেজ + btn_<নাম>.webp
  profile/        প্রোফাইল দেখা/এডিট/অবদান      (myprofile, edit, contrib, crop, countries, art, sub.css)
  follow/         Following / Followers
  settings/       সেটিংস + ভাষা (i18n)

room/             ভয়েস রুম
  index.html
  core/           রুমের মূল কোড (config data render actions ui main live theme + css)
  gifts/          গিফট + লাকি বক্স
  pk/  music/  bag/
  menu/           মেনু, জয়েন, মেসেজ-বার UI
  social/         বন্ধু, সম্পর্ক, DM, রিপোর্ট
  seats/          সিটের মুকুট দেখানো (seat-crowns.js)

chat/  game/  admin/   আলাদা ফিচার (যেমন ছিল)

shared/           সবার কাজে লাগে এমন জিনিস
  core/           Firebase (mock), auth, sync, economy
  config.js storage.js
  theme/          theme.js theme.css theme-light.css nav.css
  ui/             fallback.js (ছবি লোড না হলে আবার চেষ্টা + ডিফল্ট ছবি)
  features/       features.js/.css (সাধারণ MOI সহায়ক)
  chat-badge/  broadcast/  level/
  svip/           ★ SVIP সুবিধা — সব লেভেলের জন্য
    perks.js      কোন লেভেলে কী কী সুবিধা (এক লাইনে)
    crown.js      মুকুট (প্রোফাইল ছবির চারপাশে)
    entry.js      রুমে ঢোকার এনিমেশন
    chat.js       চ্যাট ব্যানার
    card.js       প্রোফাইল কার্ড (জীবন্ত আর্ট + ছবি)
    levels/level1/  crown.webp entry.webp entry_poster.webp chat_frame.webp chat_crest.webp card_art.webp card_frame.webp
```

## নতুন SVIP লেভেল (যেমন SVIP2) যোগ করতে
1. `shared/svip/levels/level2/` ফোল্ডার বানিয়ে ছবিগুলো রাখুন (crown.webp, entry.webp, entry_poster.webp, chat_frame.webp, chat_crest.webp, card_art.webp)।
2. `shared/svip/crown.js` → CROWNS এ `svip2` লাইন,  `entry.js` → EFFECTS এ `svip2`, `card.js` → STYLES এ `svip2`,  `chat.js` → STYLES এ `svip2` (ছবির পথ `level2/...`)।
3. `shared/svip/perks.js` → `2: { crown:'svip2', entry:'svip2', chat:'svip2', card:'svip2' }`।
4. `me/svip/svip-page.js` → LEVELS এ SVIP2 (প্লেট/এম্ব্লেম) ও Privilege প্যানেলে আইটেম।
নতুন সুবিধা (ফ্রেম, বাবল ইত্যাদি) হলে `shared/svip/` এ একটা নতুন ফাইল + perks.js এ এক কী।

## নতুন বাটন (Me পেজে) যোগ করতে
`me/<নাম>/` ফোল্ডার বানান → ভিতরে index.html, <নাম>.js, <নাম>.css, btn_<নাম>.webp। `me/index.html` এ বাটন + `me/me.js` এ লিংক এক লাইন।

---

## স্টোর ও ব্যাগ (রিং/ফ্রেম কেনা, পরা, খোলা)

| কাজ | ফাইল |
|---|---|
| জিনিসের তালিকা, কেনা/পরানোর অবস্থা (`MOIStore`) | `shared/store/store-data.js` |
| রিংয়ের ছবি (অ্যানিমেটেড SVG, ব্যাকগ্রাউন্ডহীন) | `shared/store/rings/ring_gold.svg` |
| ডায়মন্ড কাটার হ্যান্ডলার `buyStoreItem` + দাম `C.STORE` | `shared/core/economy.js` |
| প্রোফাইল/সিটে রিং বসানো (`gold1` = আইডি) | `shared/svip/crown.js` (`CROWNS`, `crownOf`) |
| এন্ট্রি এনিমেশনের ছবি + সাউন্ড (`entry_eyes1.webp/.mp3/_poster.webp`) | `shared/store/entries/` |
| রুমে ঢোকার প্লেয়ার (মাঝখান থেকে চলা `pos:'center'`, সাউন্ড) | `shared/svip/entry.js` (`EFFECTS`) |
| Store পেজ (কার্ড, ৭/৩০ দিনের পপ-আপ) | `me/store/` |
| Bag › Frame (ছুঁলে Use / খুলতে আবার চাপ) | `me/bag/` |

**ধারা:** Store › Frame › কার্ড › দিন বেছে Confirm → ডায়মন্ড কাটে, মেয়াদ জমা হয় (`moi_store_<uid>`) → Bag › Frame এ কার্ড আসে → ছুঁয়ে **Use** দিলে প্রোফাইল (Me পেজ), রুমের সিট ও রুমের প্রোফাইল মডালে রিং বসে; আবার চাপলে খুলে যায়। মেয়াদ শেষ হলে নিজে থেকেই খুলে যায়। ব্যাগ থেকে পরা রিং SVIP মুকুটের চেয়ে অগ্রাধিকার পায়, খুলে ফেললে SVIP মুকুট ফিরে আসে।

**নতুন রিং যোগ করতে:** (১) SVG ছবি `shared/store/rings/` এ রাখুন (২) `store-data.js` এর `ITEMS` এ এক লাইন (৩) `crown.js` এর `CROWNS` এ এক লাইন (৪) দাম `economy.js` এর `C.STORE` এ। (৫) লাইভে যাওয়ার সময় `functions/` এও একই দাম ও `buyStoreItem` বসাতে হবে।

**নতুন এন্ট্রি যোগ করতে:** স্বচ্ছ webp + mp3 `shared/store/entries/` এ → `entry.js` এর `EFFECTS` এ এক লাইন (`pos:'center'`, `sound`) → `store-data.js` এর `ITEMS` এ `slot:'entry'` লাইন → দাম `economy.js` এর `C.STORE` এ। ব্যাগ থেকে পরা এন্ট্রি SVIP এন্ট্রির চেয়ে অগ্রাধিকার পায়।

**মেসেজ ব্যানার:** ছবি `shared/store/bubbles/` → `chat.js` এর `STYLES` (`vipban`, ৯-স্লাইস মাপসহ) → `store-data.js` এ `slot:'bubble'` → দাম `economy.js` এ। ব্যাগের Messages Bubble ট্যাবে Use দিলে রুমের চ্যাটে ব্যানার হয়ে দেখায় (SVIP ব্যানারের চেয়ে অগ্রাধিকার)।

**ইমোজি প্যাক (Funny Face Pack):** একবার কিনলে সারাজীবন (দাম `C.STORE.emoji_memes[0]`)। ছবি `shared/store/emojis/m01.webp … m12.webp` — নিজের মিম ছবি একই নামে বদলে দিন, তালিকা `store-data.js` এর `MEMES`। কিনলে রুমের Reactions এর শেষে "Memes" ট্যাব যোগ হয় (`room/core/ui.js` → `emojiCats()`), চাপলে সিটের প্রোফাইলে আগের মতোই ভেসে ওঠে।

**বাকি ট্যাব** (Lucky Box Skin, Room Wallpaper, Special) আপাতত "Coming soon" — ছবি এলে একই নিয়মে যোগ হবে।
