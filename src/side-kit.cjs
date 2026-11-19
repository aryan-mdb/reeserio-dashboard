// Side menu in the same look as the header: rounded rows, icon tiles, orange-gradient tile for the
// active page, a thin rail for sub-menus. On desktop the "closed" menu becomes a 76px icon rail
// instead of disappearing. The phone drawer gets the header's logo tile.
const fs = require('fs');
const G = '../ghpages/';
const CSS = `<style id="side2css">
.side{background:#fff;border-right:1px solid var(--line);padding:14px 12px 24px}
.side nav{gap:2px}
.side .slab{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);padding:4px 10px 8px}
.side .mi{border:0;border-radius:12px;padding:6px 10px 6px 6px;min-height:46px;gap:12px;font-weight:600;font-size:14px;color:#343a40;margin:0;transition:background .12s,color .12s}
.side .mi svg.i{width:34px;height:34px;padding:8px;border-radius:10px;background:var(--bg);color:#495057;box-sizing:border-box;transition:background .12s,color .12s}
.side .mi:hover{background:var(--bg);color:var(--fg)}
.side .mi:hover svg.i{background:#fff;color:var(--ember);box-shadow:0 1px 3px rgba(16,24,40,.08)}
.side .mi .chev{color:var(--faint)}
.side details[open]>summary.mi{color:var(--fg);font-weight:700}
.side details[open]>summary.mi svg.i{background:#fff;color:var(--ember);box-shadow:0 0 0 1.5px var(--line) inset}
.side .mi.on,.side .mi.on2{background:var(--ember-soft);color:var(--ember);font-weight:800;border-radius:12px;margin:0}
.side .mi.on svg.i,.side .mi.on2 svg.i{background:linear-gradient(160deg,#ff7a1f,#ff5a00);color:#fff;box-shadow:0 4px 10px rgba(255,98,0,.25)}
.side .sub{border:0;margin:2px 0 8px 22px;padding:2px 0 2px 14px;border-left:2px solid var(--line);gap:1px}
.side .sub a,.side .sub summary{position:relative;padding:8px 10px;border-radius:10px;font-size:13.5px;color:#495057}
.side .sub a:hover,.side .sub summary:hover{background:var(--bg);color:var(--fg)}
.side .sub a.on2{background:var(--ember-soft);color:var(--ember);font-weight:700}
.side .sub a.on2::before{content:"";position:absolute;left:-16px;top:9px;bottom:9px;width:3px;border-radius:3px;background:var(--ember)}
.side .sub .sub{margin:2px 0 4px 8px}
.side-h{padding:6px 2px 14px;margin-bottom:6px;border-bottom:1px dashed var(--line)}
.side-h .logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:17px}
.side-h .tile{display:grid!important;width:38px;height:38px;border-radius:12px;background:linear-gradient(160deg,#ff7a1f,#ff5a00);display:grid;place-items:center}
.side-h .tile img{width:22px;height:24px;object-fit:contain;filter:brightness(0) invert(1)}
.side-h button{width:36px;height:36px;border-radius:10px;border:1.5px solid var(--line);color:#343a40}
/* desktop: closed menu = icon rail */
@media (min-width:980px){
  .shell.collapsed{grid-template-columns:76px minmax(0,1fr)}
  .shell.collapsed .side{visibility:visible;padding:14px 10px 24px;border-right:1px solid var(--line);overflow:visible}
  .shell.collapsed .side .slab{font-size:0;padding:4px 0 8px;text-align:center}
  .shell.collapsed .side .slab::after{content:"";display:block;width:24px;height:2px;margin:0 auto;border-radius:2px;background:var(--line)}
  .shell.collapsed .side .mi{justify-content:center;padding:5px;font-size:0;gap:0;min-height:46px}
  .shell.collapsed .side .mi .chev,.shell.collapsed .side .sub{display:none}
  .shell.collapsed .side .mi svg.i{width:38px;height:38px;padding:9px}
  .shell.collapsed .side details:has(.on2)>summary.mi svg.i{background:linear-gradient(160deg,#ff7a1f,#ff5a00);color:#fff}
}
</style>`;
const KIT = `<div id="sideKit"><script>
(()=>{const side=document.getElementById("side"),shell=document.getElementById("shell");if(!side)return;
/* active page: booking pages mark it with an inline style; dashboard with .on — normalise to .on2 */
side.querySelectorAll('a[style*="ember"]').forEach(a=>{a.removeAttribute("style");a.classList.add("on2")});
const here=location.pathname.split("/").pop()||"index.html";
side.querySelectorAll("a[href]").forEach(a=>{const h=a.getAttribute("href");if(h&&!h.includes("#")&&h===here)a.classList.add("on2")});
side.querySelectorAll(".on2").forEach(a=>{let d=a.closest("details");while(d){d.open=true;d=d.parentElement.closest("details")}});
/* tooltips for the icon rail */
side.querySelectorAll(".mi").forEach(m=>{if(!m.title)m.title=m.textContent.trim()});
/* in the rail, opening a group opens the full menu */
side.addEventListener("click",e=>{const s=e.target.closest("summary.mi");if(s&&shell.classList.contains("collapsed")&&innerWidth>979){shell.classList.remove("collapsed")}});
})();
</script></div>`;
let done = 0;
for (const f of fs.readdirSync(G).filter(f => /\.html$/.test(f))) {
  let t = fs.readFileSync(G + f, 'utf8').replace(/\r\n/g, '\n');
  if (!/<aside class="side" id="side"/.test(t)) { console.log('skip', f); continue; }
  t = t.replace(/<style id="side2css">[\s\S]*?<\/style>\n?/, '').replace(/<div id="sideKit">[\s\S]*?<\/script><\/div>/, '');
  t = t.replace('<aside class="side" id="side"', CSS + '\n<aside class="side" id="side"');
  // phone drawer logo: same tile as the header
  t = t.replace(/<div class="side-h"><div class="logo"><img src="data:image\/png;base64,([A-Za-z0-9+/=]+)" alt="">Reeserio<\/div>/, '<div class="side-h"><div class="logo"><span class="tile"><img src="data:image/png;base64,$1" alt=""></span>Reeserio</div>');
  if (!t.includes('<div class="slab">')) t = t.replace(/(<aside class="side" id="side"[\s\S]*?<nav>)/, '$1\n      <div class="slab">Menu</div>');
  const end = t.lastIndexOf('</body>');
  t = end >= 0 ? t.slice(0, end) + KIT + t.slice(end) : t + KIT;
  fs.writeFileSync(G + f, t); done++;
}
console.log('side menu restyled on', done, 'pages');
