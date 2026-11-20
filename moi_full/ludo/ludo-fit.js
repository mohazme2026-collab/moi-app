/* ludo/ludo-fit.js — গেম নিজে থেকে স্ক্রিনের মাপে ছোট/বড় হয়ে ঠিকঠাক ফিট করে
   (৮০% শিট, ফুল স্ক্রিন, ছোট বা বড় ফোন — সবখানে পুরো গেম দেখা যায়) */
const DESIGN_H = 690;   /* গেমের স্বাভাবিক উচ্চতা (px) */
const DESIGN_W = 390;   /* গেমের স্বাভাবিক প্রস্থ (px) */

function fitGame(){
  const root = document.getElementById('gameRoot'); if (!root) return;
  const vh = window.innerHeight, vw = window.innerWidth;
  const k = Math.max(0.5, Math.min(1.4, Math.min(vh / DESIGN_H, vw / DESIGN_W)));
  root.style.transform = 'translate(-50%,-50%) scale(' + k + ')';
}
window.addEventListener('resize', fitGame);
window.addEventListener('orientationchange', fitGame);
document.addEventListener('DOMContentLoaded', fitGame);
fitGame();
