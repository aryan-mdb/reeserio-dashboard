// Light / dark mode for every page. Agents pick in the header (sun/moon button); the choice is kept in
// localStorage per browser, and until someone picks, the computer's own setting is followed.
// All pages share the same :root tokens, so dark mode = a second set of tokens. Colours that are written
// straight into the CSS (#fff cards, pale tints, dark text) are rewritten to per-colour variables whose
// light value is the original and whose dark value is computed — so nothing in light mode changes.
// Run after side-kit, before fresh-kit. Safe to re-run.
const fs = require('fs');
const G = '../ghpages/';

const hex6 = h => { h = h.toLowerCase().replace('#', ''); return h.length === 3 ? h.split('').map(c => c + c).join('') : h; };
const rgb = h => [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const lum = h => { const [r, g, b] = rgb(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
function hsl([r, g, b]) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, s, l]; }
function fromHsl([h, s, l]) { if (!s) return [l, l, l].map(v => v * 255); const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map(v => v * 255); }

const CARD = [21, 24, 29]; // dark card #15181d
// pale surface -> dark surface carrying the same tint
const darkSurface = h => { const d = rgb(h).map(v => 255 - v), mx = Math.max(...d); return toHex(CARD.map((c, i) => c + d[i] * .35 + (mx - d[i]) * 1.5)); };
// dark text -> light text, same hue, mirrored lightness
const darkInk = h => { const [H, S, L] = hsl(rgb(h)); return toHex(fromHsl([H, Math.min(S, .85), Math.min(.92, .95 - L * .8)])); };

const DARK = `--bg:#0e1013;--bg-2:#1b1f25;--card:#15181d;--card-2:#1a1e24;--line:#272c34;--line-2:#363c47;
  --fg:#e9ebee;--fg-2:#d3d7dd;--fg-3:#b4bac3;--muted:#9aa2ad;--faint:#7a828d;--ink:#3a414c;--link:#8ab4ff;
  --ember:#ff6a14;--ember-2:#ff9a5a;--ember-soft:rgba(255,106,20,.14);--ember-glow:rgba(255,106,20,.30);
  --purple:#a78bfa;--red:#ff6b78;--good:#3cc285;--good-soft:rgba(60,194,133,.14);--bad:#ff6b78;--bad-soft:rgba(255,107,120,.13);
  --warn:#e5b04a;--warn-soft:rgba(229,176,74,.14);--grid:#232831;--c-other:#5d636e;color-scheme:dark`;
const BASE_LIGHT = `--fg-2:#343a40;--fg-3:#495057;--ink:#212529;--link:#1d4f91`;

const INIT = `<script id="themeInit">(()=>{let t;try{t=localStorage.getItem("rsTheme")}catch(e){}if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t})()</script>`;
const SUN = '<svg class="sun" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';
const MOON = '<svg class="moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg>';
const BTN = `<button type="button" class="ib" id="themeBtn" aria-label="Switch to dark mode" title="Dark mode">${MOON}${SUN}</button>`;
const KIT = `<div id="themeKit"><script>
(()=>{const b=document.getElementById("themeBtn"),root=document.documentElement;
const sync=()=>{const d=root.dataset.theme==="dark";if(b){b.setAttribute("aria-label",d?"Switch to light mode":"Switch to dark mode");b.title=d?"Light mode":"Dark mode";b.setAttribute("aria-pressed",d)}};
const set=t=>{root.dataset.theme=t;try{localStorage.setItem("rsTheme",t)}catch(e){}sync()};
if(b)b.onclick=()=>set(root.dataset.theme==="dark"?"light":"dark");
/* another tab changed it, or the computer switched and nobody picked yet */
addEventListener("storage",e=>{if(e.key==="rsTheme"&&e.newValue){root.dataset.theme=e.newValue;sync()}});
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",e=>{let t;try{t=localStorage.getItem("rsTheme")}catch(x){}if(!t){root.dataset.theme=e.matches?"dark":"light";sync()}});
sync()})();
</script></div>`;

const CSS_FIXED = `
#themeBtn .sun{display:none}
html[data-theme=dark] #themeBtn .sun{display:block}
html[data-theme=dark] #themeBtn .moon{display:none}
#themeBtn{color:var(--fg-2)}
#themeBtn:hover{color:var(--ember)}
html{transition:none}
html[data-theme=dark] body{background:var(--bg);color:var(--fg)}
html[data-theme=dark] img[src*="logo"]:not(.tile img){filter:brightness(1.05)}
html[data-theme=dark] dialog::backdrop{background:rgba(0,0,0,.6)}
html[data-theme=dark] ::-webkit-scrollbar{width:10px;height:10px}
html[data-theme=dark] ::-webkit-scrollbar-thumb{background:#363c47;border-radius:10px;border:2px solid var(--bg)}
html[data-theme=dark] ::-webkit-scrollbar-track{background:var(--bg)}
html[data-theme=dark] input,html[data-theme=dark] select,html[data-theme=dark] textarea{color:var(--fg)}
html[data-theme=dark] ::placeholder{color:var(--faint)}`;

let done = 0;
for (const f of fs.readdirSync(G).filter(f => /\.html$/.test(f))) {
  let t = fs.readFileSync(G + f, 'utf8').replace(/\r\n/g, '\n');
  if (!/--bg:#f6f6f6/.test(t)) { console.log('skip', f); continue; }
  t = t.replace(/<script id="themeInit">[\s\S]*?<\/script>/, '').replace(/<style id="themecss">[\s\S]*?<\/style>\n?/, '')
       .replace(/<div id="themeKit">[\s\S]*?<\/script><\/div>/, '').replace(/<button type="button" class="ib" id="themeBtn"[\s\S]*?<\/button>/, '');

  // 1) pale colours in backgrounds / borders / rings -> --lt-xxxxxx
  const lt = h => { const x = hex6(h); return lum(x) > .82 ? `var(--lt-${x})` : h; };
  t = t.replace(/((?<![-\w])(?:background(?:-color|-image)?|border(?:-[a-z]+)*|outline|box-shadow)\s*:)([^;}"'<>`]*)/gi,
    (m, p, v) => p + v.replace(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b(?!-)/gi, lt).replace(/\bwhite\b/g, 'var(--lt-ffffff)'));
  // 2) dark ink as text colour -> --dt-xxxxxx ; dark "ink" buttons drawn with the text colour -> --ink
  t = t.replace(/((?<![-\w])color\s*:\s*)(#(?:[0-9a-f]{6}|[0-9a-f]{3}))\b(?!-)/gi, (m, p, h) => { const x = hex6(h); return lum(x) < .5 ? `${p}var(--dt-${x})` : m; });
  t = t.replace(/((?:background|border-color)\s*:\s*)var\(--fg\)/g, '$1var(--ink)');

  // 3) tokens for every colour now referenced
  const lts = [...new Set([...t.matchAll(/var\(--lt-([0-9a-f]{6})\)/g)].map(m => m[1]))];
  const dts = [...new Set([...t.matchAll(/var\(--dt-([0-9a-f]{6})\)/g)].map(m => m[1]))];
  const NAMED = { ffffff: 'var(--card)', fafafa: 'var(--card-2)', f6f6f6: 'var(--bg)', efefef: 'var(--bg-2)', '212529': 'var(--fg)', '1f2328': 'var(--fg)', '343a40': 'var(--fg-2)', '495057': 'var(--fg-3)', '6c757d': 'var(--muted)', '1d4f91': 'var(--link)' };
  const light = [...lts, ...dts].map(x => `--${lts.includes(x) ? 'lt' : 'dt'}-${x}:#${x}`);
  const dark = [...lts.map(x => `--lt-${x}:${NAMED[x] || darkSurface(x)}`), ...dts.map(x => `--dt-${x}:${NAMED[x] || darkInk(x)}`)];
  const CSS = `<style id="themecss">
:root{${BASE_LIGHT};${[...new Set(light)].join(';')}}
html[data-theme=dark]{${DARK};${dark.join(';')}}${CSS_FIXED}
</style>`;

  // init script first thing in <head> (no white flash), tokens after the page's own styles
  t = t.replace('<meta charset="utf-8">', '<meta charset="utf-8">' + INIT);
  const last = t.lastIndexOf('</style>', t.indexOf('<body') > 0 ? t.indexOf('<body') : t.length);
  t = t.slice(0, last + 8) + '\n' + CSS + t.slice(last + 8);
  t = t.replace('<div class="bell">', BTN + '<div class="bell">');
  const end = t.lastIndexOf('</body>');
  t = end >= 0 ? t.slice(0, end) + KIT + t.slice(end) : t + KIT;
  fs.writeFileSync(G + f, t); done++;
  if (f === 'app.html') console.log('app.html tokens: lt', lts.length, 'dt', dts.length);
}
console.log('light/dark mode on', done, 'pages');
