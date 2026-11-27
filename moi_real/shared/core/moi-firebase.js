/* shared/core/moi-firebase.js — আসল Firebase সংযোগ (প্রজেক্ট moi-app-810b0)
   বাকি সব ফাইল আগের মতোই window.MOIFB ব্যবহার করে। */
(function(){
    'use strict';
    if (!window.firebase) { console.error('[MOI] Firebase SDK লোড হয়নি (ইন্টারনেট?)'); return; }
    var CFG = {
        apiKey: 'AIzaSyDtxLOf-428YB0wD7sMs5IJSNg2HuylJic',
        authDomain: 'moi-app-810b0.firebaseapp.com',
        projectId: 'moi-app-810b0',
        storageBucket: 'moi-app-810b0.firebasestorage.app',
        messagingSenderId: '320183247364',
        appId: '1:320183247364:web:978057743619216ccd0b51',
        databaseURL: 'https://moi-app-810b0-default-rtdb.asia-southeast1.firebasedatabase.app'
    };
    var app = firebase.apps.length ? firebase.app() : firebase.initializeApp(CFG);
    window.MOIFB = {
        app: app,
        auth: firebase.auth(),
        db: firebase.firestore(),
        rtdb: firebase.database(),
        storage: null,
        fn: null,
        TS: function(){ return firebase.firestore.FieldValue.serverTimestamp(); },
        RTS: function(){ return firebase.database.ServerValue.TIMESTAMP; },
        LIVE: 'moi-live',
        DEMO: false
    };
    console.log('[MOI] Firebase connected (REAL)');
})();
