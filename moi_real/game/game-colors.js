/* game/game-colors.js — ৫ গুণের ৪টা হীরা এখন ৪টা আলাদা রঙের: নীল (আসল) · সাদা · কালো · হলুদ
   (৫ গুণের ঘর ৪টা — সংখ্যা একই, তাই রঙ দেখেই বোঝা যায় কোনটা জিতল)
   একই ছবির শুধু নীল অংশটা বদলানো হয়; সোনালি "x5" লেখা আর সোনালি আভা যেমন ছিল তেমনই থাকে। */
const FIVE_LOOKS = [null, { mode: 'white' }, { mode: 'black' }, { mode: 'hue', hue: 48 }];   /* আইটেম ৪ = আসল নীল; ৫ = সাদা, ৬ = কালো, ৭ = হলুদ */

function rgbToHsl(r, g, b){
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn){
    const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
  }
  return [h, s, l];
}
function hslToRgb(h, s, l){
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0){ const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => { t = (t + 1) % 1; return t < 1/6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2/3 ? p + (q - p) * (2/3 - t) * 6 : p; };
  return [Math.round(f(h + 1/3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1/3) * 255)];
}

/* ছবির নীল অংশ (হিউ ১৬৫°–২৭০°) নতুন রঙে নেওয়া */
function recolorImage(img, look){
  const c = document.createElement('canvas'); c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const id = x.getImageData(0, 0, c.width, c.height), d = id.data;
  for (let i = 0; i < d.length; i += 4){
    if (d[i + 3] === 0) continue;
    const [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
    if (!(h >= 165 && h <= 270 && s > 0.18)) continue;          /* সোনালি অংশ ও সাদা ঝিলিক যেমন আছে তেমন */
    let nh = h, ns = s, nl = l;
    if (look.mode === 'white'){ ns = s * 0.06; nl = l < 0.3 ? l : Math.min(1, l * 1.25 + 0.14); }
    else if (look.mode === 'black'){ ns = s * 0.05; nl = l < 0.3 ? l : 0.12 + l * 0.28; }
    else { nh = look.hue + (h - 215) * 0.15; ns = Math.min(1, s * 1.1); }
    const rgb = hslToRgb(nh, ns, nl);
    d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2];
  }
  x.putImageData(id, 0, 0);
  return c.toDataURL('image/png');
}

function loadImageCors(src){
  return new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

/* গেম শুরুর আগে একবার চলে; ছবি না পেলে (বা ইন্টারনেট না থাকলে) আগের মতোই থাকে */
async function applyFiveColors(){
  try {
    const img = await Promise.race([loadImageCors(IMG_5), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))]);
    [5, 6, 7].forEach((id, k) => { ITEMS[id].img = recolorImage(img, FIVE_LOOKS[k + 1]); });
  } catch(e){ console.warn('রঙ বদল বাদ:', e && e.message); }
}
