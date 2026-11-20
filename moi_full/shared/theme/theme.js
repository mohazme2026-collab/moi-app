/* shared/theme.js — ব্যাকগ্রাউন্ড থিম (সব পেজে সবার আগে লোড হয়)
   মাত্র ৩টা ব্যাকগ্রাউন্ড: White (ডিফল্ট) · Black · Pink
   বাটন/অ্যাকসেন্ট রঙ (সোনালি-কোরাল) সব থিমে একই থাকে — শুধু ব্যাকগ্রাউন্ড বদলায়। */
(function(){
    const THEMES = {
        light: { name:'White', desc:'সাদা ব্যাকগ্রাউন্ড (ডিফল্ট)', bg:'#f3f4f9', card:'#ffffff', ink:'#14172a', meta:'#f3f4f9' },
        black: { name:'Black', desc:'কালো ব্যাকগ্রাউন্ড',            bg:'#08080b', card:'#18181f', ink:'#f5f5f7', meta:'#08080b' },
        pink:  { name:'Pink',  desc:'গোলাপি ব্যাকগ্রাউন্ড',           bg:'#ffe3ee', card:'#fff8fb', ink:'#3a1226', meta:'#ffe3ee' }
    };
    const LEGACY = { golden:'black', lagoon:'black', orchid:'black', royal:'black' };   /* আগের থিমের নাম */
    function current(){
        try {
            let t = localStorage.getItem('moi_theme');
            if (t && LEGACY[t]) t = LEGACY[t];
            if (t && THEMES[t]) return t;
        } catch(e){}
        return 'light';      /* প্রথমবার যে ঢোকে সে সাদা ব্যাকগ্রাউন্ড দেখবে; পরে Me → Theme থেকে বদলাতে পারবে */
    }
    /* রুম আর লগইন পেজ নিজস্ব গাঢ় ডিজাইনে থাকে — ব্যাকগ্রাউন্ড থিম শুধু Home · Chat · Me পেজে চলে */
    const FIXED = /\/(room|login)\//.test(location.pathname);
    function apply(name){
        document.documentElement.setAttribute('data-theme', FIXED ? 'classic' : name);
        let m = document.querySelector('meta[name="theme-color"]');
        if (!m){ m = document.createElement('meta'); m.name = 'theme-color'; (document.head || document.documentElement).appendChild(m); }
        m.content = FIXED ? '#0f0818' : THEMES[name].meta;
    }
    function set(name){
        if (!THEMES[name]) return;
        try { localStorage.setItem('moi_theme', name); } catch(e){}
        apply(name);
        /* iframe (chat ইত্যাদি) গুলোতেও জানানো */
        document.querySelectorAll('iframe').forEach(f => { try { f.contentWindow.postMessage({ moiTheme: name }, '*'); } catch(e){} });
    }
    apply(current());
    window.MOI_THEMES = THEMES;
    window.getTheme = current;
    window.setTheme = set;
    window.addEventListener('storage', e => { if (e.key === 'moi_theme') apply(current()); });
    window.addEventListener('message', e => { if (e.data && e.data.moiTheme && THEMES[e.data.moiTheme]) apply(e.data.moiTheme); });
})();
