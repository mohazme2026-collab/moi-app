/* me/edit.js — প্রোফাইল এডিট: ছবি (Camera/Gallery → কাটা), Photo Wall (৮টা), নাম, জন্মদিন, লিঙ্গ, দেশ, Bio */
(function(){
    'use strict';
    const $ = id => document.getElementById(id);
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const ph = n => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1d6b66"/><text x="50" y="66" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#fff">' + String(n || 'U').charAt(0).toUpperCase() + '</text></svg>');
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    let toastT = null, orig = null, d = null, photoTarget = 'avatar';
    function toast(m){ const t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1900); }
    const prof = () => { const p = window.MOIAuth && MOIAuth.profile; return p && p.uid ? p : null; };
    const norm = g => { g = String(g || '').toLowerCase(); return g === 'male' ? 'Male' : g === 'female' ? 'Female' : g ? 'Privacy' : ''; };

    function isDirty(){ return orig && JSON.stringify(d) !== JSON.stringify(orig); }
    function refresh(){
        $('avImg').src = d.photo || ph(d.name); $('avImg').onerror = function(){ this.onerror = null; this.src = ph(d.name); };
        $('wallN').textContent = d.photoWall.length;
        $('wall').innerHTML = d.photoWall.map((s, i) => '<div class="wt"><img src="' + esc(s) + '" alt=""><span class="x" data-i="' + i + '">×</span></div>').join('') + (d.photoWall.length < 8 ? '<div class="tile-add" id="wAdd">+</div>' : '');
        const v = (id, t) => { const el = $(id); el.textContent = t || ''; el.classList.toggle('has', !!t); };
        if (document.activeElement !== $('nameIn')) $('nameIn').value = d.name;
        v('vBirth', d.birthday || ''); if (!d.birthday) $('vBirth').textContent = '—';
        v('vGender', d.gender || ''); if (!d.gender) $('vGender').textContent = '—';
        const c = countryByName(d.country);
        $('vCountry').innerHTML = c ? esc(c[0]) + ' <span class="pill">' + flagOf(c[1]) + ' ' + c[1] + '</span>' : (d.country ? esc(d.country) : '—'); $('vCountry').classList.toggle('has', !!d.country);
        v('vBio', d.bio || ''); if (!d.bio){ $('vBio').textContent = 'Introduce yourself to friends'; $('vBio').classList.remove('has'); }
        $('bSave').disabled = !isDirty();
        const add = $('wAdd'); if (add) add.onclick = () => askPhoto('wall');
        document.querySelectorAll('.wt .x').forEach(x => x.onclick = () => { d.photoWall.splice(+x.dataset.i, 1); refresh(); });
    }

    /* ── ছবি: Camera / Gallery / Cancel → কাটা ── */
    function sheet(el, on){ $('bd').classList.toggle('on', on); el.classList.toggle('on', on); }
    function askPhoto(target){ photoTarget = target; sheet($('shPhoto'), true); }
    function closeAll(){ ['shPhoto', 'shBirth', 'gdGender'].forEach(i => $(i).classList.remove('on')); $('bd').classList.remove('on'); }
    async function picked(file){
        closeAll(); if (!file) return;
        const out = await MoiCrop.open(file, { out: photoTarget === 'avatar' ? 512 : 800 });
        if (!out) return;
        if (photoTarget === 'avatar') d.photo = out; else if (d.photoWall.length < 8) d.photoWall.push(out);
        refresh();
    }

    /* ── জন্মদিন চাকা ── */
    const ITEM = 44; let bm = 8, bd = 1, by = 2000;
    const dim = (m, y) => new Date(y, m + 1, 0).getDate();
    function fill(col, items, sel){ col.innerHTML = '<div class="sp"></div>' + items.map(t => '<div>' + t + '</div>').join('') + '<div class="sp"></div>'; col.scrollTop = sel * ITEM; }
    function readCol(col, n){ return Math.max(0, Math.min(n - 1, Math.round(col.scrollTop / ITEM))); }
    function buildBirth(){
        const yMax = new Date().getFullYear(), years = []; for (let y = 1950; y <= yMax; y++) years.push(y);
        const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(d.birthday || ''); by = m ? +m[1] : 2000; bm = m ? +m[2] - 1 : 0; bd = m ? +m[3] : 1;
        fill($('wM'), MONTHS, bm); fillDays(); fill($('wY'), years, by - 1950);
        let t1, t2, t3;
        $('wM').onscroll = () => { clearTimeout(t1); t1 = setTimeout(() => { bm = readCol($('wM'), 12); fillDays(true); }, 90); };
        $('wD').onscroll = () => { clearTimeout(t2); t2 = setTimeout(() => { bd = readCol($('wD'), dim(bm, by)) + 1; }, 90); };
        $('wY').onscroll = () => { clearTimeout(t3); t3 = setTimeout(() => { by = 1950 + readCol($('wY'), years.length); fillDays(true); }, 90); };
    }
    function fillDays(keep){
        const n = dim(bm, by), days = []; for (let i = 1; i <= n; i++) days.push(i);
        if (bd > n) bd = n; fill($('wD'), days, bd - 1);
    }
    function openBirth(){ buildBirth(); sheet($('shBirth'), true); setTimeout(() => { $('wM').scrollTop = bm * ITEM; $('wD').scrollTop = (bd - 1) * ITEM; $('wY').scrollTop = (by - 1950) * ITEM; }, 60); }

    /* ── দেশ (পূর্ণ পেজ) ── */
    function countryRows(q){
        const row = c => '<div class="cl-row" data-n="' + esc(c[0]) + '"><span>' + esc(c[0]) + '</span><span class="pill">' + flagOf(c[1]) + ' ' + c[1] + '</span></div>';
        q = (q || '').toLowerCase();
        if (q) return '<h3>ALL</h3>' + COUNTRIES.filter(c => c[0].toLowerCase().includes(q) || c[1].toLowerCase() === q).map(row).join('');
        return '<h3>Hot Country</h3>' + HOT_COUNTRIES.map(n => countryByName(n)).filter(Boolean).map(row).join('') + '<h3>ALL</h3>' + COUNTRIES.map(row).join('');
    }
    function showCountries(q){ $('cList').innerHTML = countryRows(q); }
    function openCountry(){ $('cQ').value = ''; $('cX').hidden = true; showCountries(''); $('pgCountry').classList.add('on'); }

    /* ── Bio (পূর্ণ পেজ) ── */
    function openBio(){ $('bioIn').value = d.bio || ''; $('bioN').textContent = ($('bioIn').value || '').length; $('pgBio').classList.add('on'); setTimeout(() => $('bioIn').focus(), 300); }

    /* ── সেভ ── */
    function save(){
        const p = prof(); if (!p || !isDirty()) return;
        d.name = (d.name || '').trim() || p.name;
        const patch = { name: d.name, birthday: d.birthday, gender: d.gender, country: d.country, bio: d.bio, photo: d.photo, photoWall: d.photoWall };
        try { saveUser(p.uid, patch); const cur = getCurrentUser && getCurrentUser(); if (cur && setCurrentUser) setCurrentUser(Object.assign({}, cur, { name: d.name, photo: d.photo })); } catch(e){ console.error(e); toast('সেভ হয়নি'); return; }
        toast('সেভ হয়েছে ✓'); orig = JSON.parse(JSON.stringify(d)); $('bSave').disabled = true;
        setTimeout(() => { location.href = 'myprofile.html'; }, 700);
    }
    function back(){ if (isDirty() && !confirm('সেভ না করে বের হবেন?')) return; location.href = 'myprofile.html'; }

    function init(){
        const p = prof(); if (!p) return;
        d = { name: p.name || '', birthday: p.birthday || '', gender: norm(p.gender), country: p.country || '', bio: p.bio || '', photo: p.photo || '', photoWall: Array.isArray(p.photoWall) ? p.photoWall.slice(0, 8) : [] };
        orig = JSON.parse(JSON.stringify(d)); refresh();
        $('avBtn').onclick = () => askPhoto('avatar');
        $('pCam').onclick = () => $('fCam').click(); $('pGal').onclick = () => $('fGal').click(); $('pCancel').onclick = closeAll; $('bd').onclick = closeAll;
        ['fGal', 'fCam'].forEach(id => $(id).addEventListener('change', e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; picked(f); }));
        $('nameIn').addEventListener('input', () => { d.name = $('nameIn').value; $('bSave').disabled = !isDirty(); });
        $('fName').onclick = () => $('nameIn').focus();
        $('fBirth').onclick = openBirth;
        $('bDone').onclick = () => { d.birthday = by + '-' + (bm + 1) + '-' + bd; closeAll(); refresh(); };
        $('fGender').onclick = () => { document.querySelectorAll('#gdGender button').forEach(b => b.classList.toggle('sel', b.dataset.g === d.gender)); $('bd').classList.add('on'); $('gdGender').classList.add('on'); };
        document.querySelectorAll('#gdGender button').forEach(b => b.onclick = () => { d.gender = b.dataset.g; closeAll(); refresh(); });
        $('fCountry').onclick = openCountry;
        $('cBack').onclick = () => $('pgCountry').classList.remove('on');
        $('cQ').addEventListener('input', () => { $('cX').hidden = !$('cQ').value; showCountries($('cQ').value.trim()); });
        $('cX').onclick = () => { $('cQ').value = ''; $('cX').hidden = true; showCountries(''); };
        $('cList').addEventListener('click', e => { const r = e.target.closest('.cl-row'); if (!r) return; d.country = r.dataset.n; $('pgCountry').classList.remove('on'); refresh(); });
        $('fBio').onclick = openBio;
        $('bioIn').addEventListener('input', () => { $('bioN').textContent = $('bioIn').value.length; });
        $('bioBack').onclick = () => $('pgBio').classList.remove('on');
        $('bioSave').onclick = () => { d.bio = $('bioIn').value.trim(); $('pgBio').classList.remove('on'); refresh(); };
        $('bSave').onclick = save; $('bBack').onclick = back;
    }
    (window.MOIReady || Promise.resolve()).then(() => { try { init(); } catch(e){ console.error('[edit]', e); } });
})();
