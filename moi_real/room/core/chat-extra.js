/* room/core/chat-extra.js — চ্যাটে গ্যালারি ছবি, নিজের মেসেজ ডিলিট (টিপে ধরে), Owner/Admin-এর যেকোনো মেসেজ ডিলিট + Clear History */
(function(){
    'use strict';
    var $ = function(i){ return document.getElementById(i); };
    function canDel(m){
        if (!m || typeof myProfile === 'undefined' || !myProfile) return false;
        if (m.senderUid && m.senderUid === myProfile.uid) return true;
        return typeof isAdminOrOwner === 'function' && isAdminOrOwner();
    }
    function save(){ try { ls_set(KEY.messages, state.messages); } catch(e){} renderMessageFeed(); }

    /* ── ছবি: ছোট করে (সর্বোচ্চ ৫৬০px, JPEG) পাঠানো ── */
    function shrink(file, cb){
        var r = new FileReader();
        r.onload = function(){
            var im = new Image();
            im.onload = function(){
                var M = 560, k = Math.min(1, M / Math.max(im.width, im.height)), c = document.createElement('canvas');
                c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
                c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
                cb(c.toDataURL('image/jpeg', 0.72));
            };
            im.onerror = function(){ toastMsg('ছবিটা পড়া যায়নি'); };
            im.src = r.result;
        };
        r.readAsDataURL(file);
    }
    function bindInput(){
        var inp = $('chatImgInput'); if (!inp || inp._b) return; inp._b = 1;
        inp.addEventListener('change', function(e){
            var f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
            if (!/^image\//.test(f.type)){ toastMsg('শুধু ছবি পাঠানো যাবে'); return; }
            shrink(f, function(data){
                pushMessage({ uid: myProfile && myProfile.uid, name: (myProfile && myProfile.name) || 'User', avatar: myProfile && myProfile.avatar, text: '📷', img: data, type: 'image' });
                closeSheet();
            });
        });
    }

    /* ── ছবি বড় করে দেখা ── */
    window.chatViewImg = function(src){
        var d = document.createElement('div'); d.className = 'cx-view';
        d.innerHTML = '<img src="' + src.replace(/"/g, '&quot;') + '" alt="">';
        d.addEventListener('click', function(){ d.remove(); });
        document.body.appendChild(d);
    };

    /* ── টিপে ধরে ডিলিট ── */
    function askDelete(mid){
        var m = (state.messages || []).find(function(x){ return x && x.id === mid; });
        if (!canDel(m)) return;
        var old = document.querySelector('.cx-del'); if (old) old.remove();
        var d = document.createElement('div'); d.className = 'cx-del';
        d.innerHTML = '<div class="cx-del-box"><div class="cx-del-t">মেসেজটি ডিলিট করবেন?</div><div class="cx-del-r"><button class="no" type="button">Cancel</button><button class="yes" type="button"><i class="fa-solid fa-trash"></i> Delete</button></div></div>';
        document.body.appendChild(d);
        d.querySelector('.no').onclick = function(){ d.remove(); };
        d.addEventListener('click', function(e){ if (e.target === d) d.remove(); });
        d.querySelector('.yes').onclick = function(){
            d.remove();
            state.messages = state.messages.filter(function(x){ return x.id !== mid; });
            try { if (window.MOISync) MOISync.deleteMessage('room', ROOM_ID, mid); } catch(e){}
            save();
        };
    }
    function bindPress(){
        var list = $('messagesList'); if (!list || list._p) return; list._p = 1;
        var t = null, sx = 0, sy = 0, fired = false;
        function start(e){
            var w = e.target.closest && e.target.closest('.mw'); if (!w) return;
            var p = e.touches ? e.touches[0] : e; sx = p.clientX; sy = p.clientY; fired = false;
            clearTimeout(t); t = setTimeout(function(){ fired = true; try { navigator.vibrate && navigator.vibrate(18); } catch(x){} askDelete(w.getAttribute('data-mid')); }, 550);
        }
        function move(e){ var p = e.touches ? e.touches[0] : e; if (Math.abs(p.clientX - sx) > 8 || Math.abs(p.clientY - sy) > 8) clearTimeout(t); }
        function end(){ clearTimeout(t); }
        list.addEventListener('touchstart', start, { passive: true });
        list.addEventListener('touchmove', move, { passive: true });
        list.addEventListener('touchend', end); list.addEventListener('touchcancel', end);
        list.addEventListener('mousedown', start); list.addEventListener('mousemove', move); list.addEventListener('mouseup', end); list.addEventListener('mouseleave', end);
        list.addEventListener('contextmenu', function(e){ if (e.target.closest && e.target.closest('.mw')) e.preventDefault(); });
        list.addEventListener('click', function(e){ if (fired){ e.stopPropagation(); e.preventDefault(); fired = false; } }, true);   /* ধরে রাখার পরের ক্লিকে ছবি খুলবে না */
    }

    /* ── Clear History (শুধু Owner/Admin-এর বাটন) ── */
    window.chatClearHistory = function(){
        if (!(typeof isAdminOrOwner === 'function' && isAdminOrOwner())) return;
        var old = document.querySelector('.cx-del'); if (old) old.remove();
        var d = document.createElement('div'); d.className = 'cx-del';
        d.innerHTML = '<div class="cx-del-box"><div class="cx-del-t">রুমের সব মেসেজ মুছে ফেলবেন?</div><div class="cx-del-r"><button class="no" type="button">Cancel</button><button class="yes" type="button"><i class="fa-solid fa-broom"></i> Clear</button></div></div>';
        document.body.appendChild(d);
        d.querySelector('.no').onclick = function(){ d.remove(); };
        d.addEventListener('click', function(e){ if (e.target === d) d.remove(); });
        d.querySelector('.yes').onclick = function(){
            d.remove();
            (state.messages || []).forEach(function(m){ try { if (m && m.id && window.MOISync) MOISync.deleteMessage('room', ROOM_ID, m.id); } catch(e){} });
            state.messages = []; save();
        };
    };
    function showClear(){
        var b = $('chatClearBtn'); if (b) b.style.display = (typeof isAdminOrOwner === 'function' && typeof myProfile !== 'undefined' && myProfile && isAdminOrOwner()) ? '' : 'none';
    }
    function init(){ bindInput(); bindPress(); showClear(); }
    setInterval(init, 1500); init();
})();
