ডেমো মোড (Firebase ছাড়া) — কী করতে হবে
=========================================
এই ফোল্ডারের ৯টা ফাইল আপনার আসল প্রজেক্টের একই জায়গার ফাইলের উপর replace করুন:

  shared/core/firebase-init.js     ← মূল ফাইল (নকল Firebase, localStorage-এ চলে)
  login/index.html
  home/index.html
  chat/index.html
  me/index.html
  room/index.html
  admin/developer/index.html
  admin/superadmin/index.html
  admin/distributor/index.html     ← এই ৮টায় শুধু Firebase-এর ৬টা <script> লাইন মুছেছে, আর কিছু বদলায়নি

আর কোনো ফাইল ছোঁয়ার দরকার নেই — sync.js, economy.js, auth.js সব যেমন ছিল তেমনই থাকবে।
ডিজাইন/রঙ কিছুই বদলায়নি।

কীভাবে লগইন করবেন
-------------------
• Google বাটন : একটা ইমেইল/নাম লিখতে বলবে (একই লিখলে একই অ্যাকাউন্ট)
    dev@moi.test   → developer (অ্যাডমিন প্যানেল)
    super@moi.test → superadmin
    dist@moi.test  → distributor
• Guest বাটন    : গেস্ট অ্যাকাউন্ট
• Phone         : যেকোনো নম্বর + যেকোনো ৬ সংখ্যার কোড (যেমন 123456)

শুরুতে যা আছে
-------------
• নতুন ইউজার ১০,০০০ ডায়মন্ড পায়, স্টাফ ১০,০০,০০০ (গেস্ট ০)
• ৩টা ডেমো রুম আর ৩টা ডেমো ইউজার (Rafi, Nila, Sumon)
  → বদলাতে firebase-init.js এর উপরের DEMO অবজেক্ট দেখুন

ডেটা কোথায় থাকে
-----------------
শুধু ওই ব্রাউজারের localStorage-এ। আলাদা ব্রাউজার/ডিভাইসে ডেটা মিলবে না।
একই ব্রাউজারের দুই ট্যাবে দুইজন আলাদা ইউজারের মতো টেস্ট করা যাবে না
(লগইন সেশন শেয়ার হয়) — তাই আলাদা ইউজার টেস্ট করতে আলাদা ব্রাউজার/প্রোফাইল ব্যবহার করুন।

সব ডেমো ডেটা মুছে নতুন করে শুরু: ব্রাউজার কনসোলে  MOIDemo.reset()

পরে Firebase ফেরত আনতে
-----------------------
১) আপনার আসল firebase-init.js ফাইলটা shared/core/ এ ফেরত বসান
২) ৮টা HTML-এ gstatic-এর ৬টা <script> লাইন ফেরত দিন (আসল zip থেকে)
