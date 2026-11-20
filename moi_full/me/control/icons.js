/* me/control/icons.js — আইকনগুলো (<i data-ic="নাম"></i> লিখলেই বসে যায়) */
(function(){
    'use strict';
    const S = (p, cls) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"' + (cls ? ' class="' + cls + '"' : '') + '>' + p + '</svg>';
    const ICONS = {
        /* রঙিন আইকন */
        ticket: '<svg viewBox="0 0 28 24"><defs><linearGradient id="icTk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd24a"/><stop offset="1" stop-color="#e5820a"/></linearGradient></defs><g transform="rotate(-12 14 12)"><path d="M3 6.5a2 2 0 012-2h18a2 2 0 012 2v3a2.5 2.5 0 000 5v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2.5 2.5 0 000-5z" fill="url(#icTk)" stroke="#fff3c4" stroke-width="1"/><path d="M9.5 5v14" stroke="#b56a00" stroke-width="1" stroke-dasharray="1.8 1.6"/><path d="M13 9.5h8M13 12h8M13 14.5h5" stroke="#8a4b00" stroke-width="1.3" stroke-linecap="round"/></g></svg>',
        coin: '<svg viewBox="0 0 24 24"><defs><radialGradient id="icCn" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff3b0"/><stop offset=".55" stop-color="#f6c445"/><stop offset="1" stop-color="#c27d0c"/></radialGradient></defs><circle cx="12" cy="12" r="10" fill="url(#icCn)" stroke="#ffe9a0" stroke-width="1.2"/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#b9780b" stroke-width="1.2"/></svg>',
        gem: '<svg viewBox="0 0 24 24"><defs><linearGradient id="icGm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fe8ff"/><stop offset="1" stop-color="#2d7bf0"/></linearGradient></defs><path d="M6 4h12l4 5-10 11L2 9z" fill="url(#icGm)" stroke="#d8f6ff" stroke-width="1"/><path d="M2 9h20M9 4l-2 5 5 11M15 4l2 5-5 11" fill="none" stroke="#e6faff" stroke-width=".8" opacity=".8"/></svg>',
        /* রঙিন অ্যাকশন আইকন (সাদা লাইন + রঙের পটে বসে) */
        whatsapp: '<svg viewBox="0 0 24 24"><defs><linearGradient id="icWa" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5df08a"/><stop offset="1" stop-color="#12a84a"/></linearGradient></defs><circle cx="12" cy="12" r="11" fill="url(#icWa)"/><path d="M12 5.2a6.8 6.8 0 00-5.8 10.3L5.2 18.8l3.4-1A6.8 6.8 0 1012 5.2z" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M9.6 9.3c0 2.5 2.2 4.7 4.7 4.7l.8-1.1-1.5-.8-.8.6a3.4 3.4 0 01-1.7-1.7l.6-.8-.8-1.5z" fill="#fff"/></svg>',
        check: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#27c36d"/><path d="M7 12.4l3.4 3.3L17 8.8" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        close: S('<path d="M6 6l12 12M18 6L6 18"/>'),
        arrowdown: S('<path d="M12 4v15M6 13l6 6 6-6"/>'),
        plus: S('<path d="M12 5v14M5 12h14"/>'),
        minus: S('<path d="M5 12h14"/>'),
        crown: '<svg viewBox="0 0 24 24"><defs><linearGradient id="icCr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#e59a0c"/></linearGradient></defs><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="url(#icCr)" stroke="#fff3c4" stroke-width="1" stroke-linejoin="round"/></svg>',
        /* লাইনের আইকন */
        bag: S('<path d="M9 3.5l1.6 3M15 3.5l-1.6 3M8 6.6h8"/><path d="M8 6.6C5 9.2 3.6 12 3.6 15a5.4 5.4 0 005.4 5.4h6A5.4 5.4 0 0020.4 15c0-3-1.4-5.8-4.4-8.4"/><path d="M12 11v7.2M14.3 12.6c-.5-.9-1.3-1.3-2.3-1.3-1.3 0-2.2.7-2.2 1.7 0 2.3 4.5 1.3 4.5 3.7 0 1-1 1.7-2.3 1.7-1 0-1.9-.5-2.3-1.4"/>'),
        withdraw: S('<circle cx="15.5" cy="6" r="3.2"/><path d="M15.5 4.6v2.8M14.5 5.3h2M14.5 6.7h2"/><path d="M3 13.5h3.2v7H3zM6.2 14.6l3.6-1.5 4.2.6c1.6.2 1.9 2 .5 2.5l-3.4.8M6.2 18.6l5.6 1.7 7.4-2.4c1.1-.4 1.7-1.6.7-2.4"/>'),
        exchange: S('<path d="M4 8.5h14.5L15.2 5.2M20 15.5H5.5l3.3 3.3"/><circle cx="7" cy="8.5" r="0"/>'),
        records: S('<rect x="5" y="4.5" width="14" height="16.5" rx="3"/><path d="M9 4.5V3.4h6v1.1M9 11h6M9 15h4"/>'),
        target: S('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.2"/>'),
        chev: S('<path d="M9 5l7 7-7 7"/>', 'ch'),
        back: S('<path d="M15 5l-7 7 7 7"/>'),
        copy: S('<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M5 15.5V6.5A2.5 2.5 0 017.5 4h9"/>'),
        transfer: S('<circle cx="12" cy="12" r="8.8"/><path d="M7 10.2h9.4l-2.6-2.6M17 13.8H7.6l2.6 2.6"/>')
    };
    window.CTL = window.CTL || {};
    CTL.icons = root => (root || document).querySelectorAll('[data-ic]').forEach(el => { if (!el.dataset.done){ el.innerHTML = ICONS[el.dataset.ic] || ''; el.dataset.done = '1'; } });
    CTL.ICONS = ICONS;
    /* আইকনের রঙ/মাপ ঠিক রাখতে: বাটনের ভিতরের <i> কে svg-র মতো ধরা */
})();
