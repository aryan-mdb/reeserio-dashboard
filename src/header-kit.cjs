// Replace the app header on every page with the clean search header:
// ☰ · logo · Live/Testing · big search · 🔔 follow-ups menu · Log Booking · Create Booking · profile chip.
// Keeps the ids the page scripts use: #ham #envLive #envTest #fuN #fuO #userBtn.
const fs = require('fs');
const G = '../ghpages/';
const ICON = {
  ham: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  bell: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 004 0"/></svg>',
  log: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h6"/></svg>',
  plus: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M12 5v14M5 12h14"/></svg>',
  caret: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg>',
};
const CSS = `<style id="hdr2css">
/* one family: every control is 40px tall, 12px radius, 1.5px border; orange only for the primary action */
.app-h.h2{gap:12px;border-bottom:1px solid var(--line);box-shadow:0 4px 16px rgba(16,24,40,.04);padding-top:3px}
.app-h.h2::before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,#ff5a00,#ff7a1f 55%,#ffb46b)}
.h2 .ham{width:40px;height:40px;border-radius:12px;border:1.5px solid var(--line);color:#343a40}
.h2 .ham:hover{border-color:var(--ember);color:var(--ember);background:#fff}
.h2 .logo{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--fg);flex:none}
.h2 .logo .tile{width:40px;height:40px;border-radius:12px;background:linear-gradient(160deg,#ff7a1f,#ff5a00);display:grid;place-items:center;box-shadow:0 4px 10px rgba(255,98,0,.25)}
.h2 .logo .tile img{width:24px;height:26px;object-fit:contain;filter:brightness(0) invert(1)}
.h2 .logo .wm{display:flex;flex-direction:column;line-height:1.1}
.h2 .logo .wm b{font-size:17px;font-weight:800;letter-spacing:-.01em}
.h2 .logo .wm small{font-size:10.5px;font-weight:700;color:var(--faint);letter-spacing:.04em;text-transform:uppercase}
.h2 .env{flex:none;height:40px;display:flex;align-items:center;gap:2px;padding:4px;border:1.5px solid var(--line);border-radius:12px;background:var(--bg)}
.h2 .env button{height:30px;padding:0 11px;border-radius:9px;border:0;font-size:12.5px;font-weight:700;color:var(--muted);background:none;display:flex;align-items:center;gap:6px}
.h2 .env button::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--line-2)}
.h2 .env button.on{background:#fff;color:var(--good);box-shadow:0 1px 3px rgba(16,24,40,.12)}
.h2 .env button.on::before{background:var(--good);box-shadow:0 0 0 3px var(--good-soft)}
.h2 .env button.on.test{color:#b07a12}
.h2 .env button.on.test::before{background:#f0a020;box-shadow:0 0 0 3px rgba(240,160,32,.18)}
.hs{flex:1;max-width:600px;margin:0 auto;position:relative;display:flex;align-items:center}
.hs svg{position:absolute;left:14px;color:var(--faint);pointer-events:none}
.hs input{width:100%;height:40px;border:1.5px solid var(--line);border-radius:12px;background:var(--bg);padding:0 46px 0 42px;font:inherit;font-size:14px;color:var(--fg);transition:all .15s}
.hs input::placeholder{color:var(--faint)}
.hs input:hover{border-color:var(--line-2)}
.hs input:focus{outline:none;background:#fff;border-color:var(--ember);box-shadow:0 0 0 4px var(--ember-glow)}
.hs kbd{position:absolute;right:10px;font:inherit;font-size:11px;font-weight:800;color:var(--faint);border:1px solid var(--line-2);border-radius:6px;padding:1px 7px;background:#fff}
.hr2{display:flex;align-items:center;gap:8px;flex:none}
.h2 .ib,.h2 .hs-ic{position:relative;width:40px;height:40px;border-radius:12px;border:1.5px solid var(--line);background:#fff;display:grid;place-items:center;color:#343a40;cursor:pointer;text-decoration:none}
.h2 .ib:hover,.h2 .hs-ic:hover,.h2 .ib[aria-expanded="true"]{border-color:var(--ember);color:var(--ember)}
.h2 .hs-ic{display:none}
.h2 .bd{position:absolute;top:-7px;right:-9px;min-width:22px;height:18px;padding:0 5px;border-radius:99px;background:var(--red);color:#fff;font-size:10.5px;font-weight:800;display:grid;place-items:center;border:2px solid #fff;line-height:1}
.hdiv{width:1px;height:28px;background:var(--line);margin:0 4px}
.bell{position:relative}
.bm{position:absolute;right:0;top:calc(100% + 8px);width:250px;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 18px 50px rgba(16,24,40,.18);padding:6px;opacity:0;transform:translateY(-6px);pointer-events:none;transition:all .15s;z-index:70}
.bm.open{opacity:1;transform:none;pointer-events:auto}
.bm .h{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);padding:8px 10px 4px}
.bm a{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;border-radius:10px;text-decoration:none;color:#343a40;font-size:14px;font-weight:600}
.bm a:hover{background:var(--bg)}
.bm a b{color:#fff;background:var(--purple);border-radius:99px;padding:1px 9px;font-size:12px}
.bm a.od b{background:var(--red)}
.h2 .lg{height:40px;display:flex;align-items:center;gap:8px;padding:0 14px;border-radius:12px;color:#343a40;background:#fff;text-decoration:none;font-weight:700;font-size:13.5px;border:1.5px solid var(--line)}
.h2 .lg svg{color:var(--ember)}
.h2 .lg:hover{border-color:var(--ember);color:var(--ember)}
.h2 .cb{height:40px;display:flex;align-items:center;gap:8px;padding:0 16px;border-radius:12px;background:linear-gradient(160deg,#ff7a1f,#ff5a00);color:#fff;text-decoration:none;font-weight:800;font-size:13.5px;box-shadow:0 2px 6px rgba(255,98,0,.28);border:0}
.h2 .cb:hover{filter:brightness(.96)}
.uchip{height:40px;display:flex;align-items:center;gap:9px;padding:0 10px 0 4px;border-radius:12px;border:1.5px solid transparent;background:none;cursor:pointer;font:inherit;color:#343a40;text-align:left}
.uchip:hover,.uchip[aria-expanded="true"]{border-color:var(--line);background:#fff}
.uchip .av{width:32px;height:32px;border-radius:10px;background:#1f2328;color:#fff;display:grid;place-items:center;font-weight:800;font-size:12px;flex:none}
.uchip .who2{display:flex;flex-direction:column;line-height:1.15}
.uchip .nm{font-weight:800;font-size:13.5px}
.uchip .rl{font-size:11px;color:var(--muted);font-weight:600}
.uchip svg{color:var(--muted)}
@media (max-width:1280px){.h2 .logo .wm small{display:none}}
@media (max-width:1180px){.h2 .lg span,.uchip .who2{display:none}.h2 .lg{padding:0 11px}}
@media (max-width:979px){.h2 .env{display:none}}
@media (max-width:860px){.hs{display:none}.h2 .hs-ic{display:grid}.hr2{margin-left:auto}.hdiv{display:none}}
@media (max-width:640px){.h2 .logo .tile{display:grid!important}.app-h.h2{gap:6px}.h2 .logo .wm,.h2 .lg,.h2 .cb span{display:none!important}.h2 .cb{padding:0;width:40px;justify-content:center}.uchip{padding:0;border:0}.uchip svg{display:none}.hr2{gap:6px}}
</style>`;
const header = (base, logo) => `<header class="app-h h2">
  <button class="ham" id="ham" type="button" aria-label="Toggle menu" aria-controls="side">${ICON.ham}</button>
  <a class="logo" href="dashboard.html" aria-label="Reeserio dashboard"><span class="tile"><img src="data:image/png;base64,${logo}" alt=""></span><span class="wm"><b>Reeserio</b><small>by Barbeque Nation</small></span></a>
  <div class="env" role="group" aria-label="Environment"><button type="button" class="on" id="envLive">Live</button><button type="button" class="test" id="envTest">Testing</button></div>
  <form class="hs" id="hdrSearch" role="search" data-base="${base}">${ICON.search}<input id="hdrQ" placeholder="Search by mobile or booking ID" autocomplete="off" aria-label="Search booking"><kbd>/</kbd></form>
  <div class="hr2">
    <a class="hs-ic" href="${base}#/home?open=searchBooking" aria-label="Search booking">${ICON.search}</a>
    <div class="bell"><button type="button" class="ib" id="bellBtn" aria-label="Follow-ups" aria-haspopup="menu" aria-expanded="false">${ICON.bell}<span class="bd" id="bellBd"></span></button>
      <div class="bm" id="bellMenu" role="menu"><div class="h">Follow-ups</div><a href="${base}#/followups" role="menuitem"><span>Next follow up</span><b class="num" id="fuN"></b></a><a class="od" href="${base}#/followups" role="menuitem"><span>Overdue follow up</span><b class="num" id="fuO"></b></a></div></div>
    <a class="lg" href="${base}#/home?open=logBooking">${ICON.log}<span>Log Booking</span></a>
    <a class="cb" href="booking-11.html">${ICON.plus}<span>Create Booking</span></a>
    <span class="hdiv" aria-hidden="true"></span>
    <button type="button" class="uchip" id="userBtn" aria-label="Account" aria-haspopup="menu" aria-expanded="false"><span class="av">AR</span><span class="who2"><span class="nm">AryanTest</span><span class="rl">Admin · IB Agent</span></span>${ICON.caret}</button>
  </div>
</header>`;
const KIT = `<div id="hdrKit"><script>
(()=>{const q=s=>document.querySelector(s);
const bb=q("#bellBtn"),bm=q("#bellMenu"),f=q("#hdrSearch"),i=q("#hdrQ");if(!bb)return;
const sync=()=>{const o=q("#fuO").textContent.trim();q("#bellBd").textContent=o;q("#bellBd").style.display=o&&o!=="0"?"":"none"};sync();setTimeout(sync,300);
const set=o=>{bm.classList.toggle("open",o);bb.setAttribute("aria-expanded",o)};
bb.onclick=e=>{e.stopPropagation();set(!bm.classList.contains("open"))};
document.addEventListener("click",e=>{if(!bm.contains(e.target))set(false)});
document.addEventListener("keydown",e=>{if(e.key==="Escape")set(false);if(e.key==="/"&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();i.focus()}});
f.onsubmit=e=>{e.preventDefault();const v=i.value.trim(),h="#/home?open=searchBooking&q="+encodeURIComponent(v)+"&t="+Date.now();
  if(f.dataset.base)location.href=f.dataset.base+h;else location.hash=h;i.blur()};
})();
</script></div>`;

let done = 0;
for (const f of fs.readdirSync(G).filter(f => /\.html$/.test(f))) {
  let t = fs.readFileSync(G + f, 'utf8').replace(/\r\n/g, '\n');
  const logo = (t.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/) || [])[1];
  if (!logo || !/<header class="app-h[^"]*">/.test(t)) { console.log('skip', f); continue; }
  const base = f === 'app.html' ? '' : 'app.html';
  t = t.replace(/<style id="hdr2css">[\s\S]*?<\/style>\n?/, '').replace(/<div id="hdrKit">[\s\S]*?<\/script><\/div>/, '');
  t = t.replace(/<header class="app-h[^"]*">[\s\S]*?<\/header>/, () => CSS + '\n' + header(base, logo));
  const end = t.lastIndexOf('</body>');
  t = end >= 0 ? t.slice(0, end) + KIT + t.slice(end) : t + KIT;
  fs.writeFileSync(G + f, t); done++;
}
console.log('new header on', done, 'pages');
