// booking-18 = the live classic booking page (snapshot from livesnap.mjs) with its deals + estimate area replaced
// by booking-17's Price & offers section. booking-17's logic runs against the copy through bridge18.js.
const fs = require('fs');
const { chromium } = require('playwright-core');
const scope = require('./scope-css.cjs');
// `node build18.cjs` = classic page (booking-18.html); `node build18.cjs beta` = the live Beta page (booking-18-beta.html)
const BETA = process.argv[2] === 'beta';
const S = BETA ? '../snapb/' : '../snap/';
// the live CSS, with its fonts and pictures served from ghpages/b18 (the live server blocks other sites' font loads)
const snapCss = fs.readFileSync(S + 'snap.css', 'utf8').replace(/url\("https:\/\/reeserio\.bnhl\.in\/(?:main\/)?media\/([^"?]+)(\?[^"]*)?"\)/g, (m, f) => `url("b18/${f}")`);
const body = fs.readFileSync(S + 'snap-body.html', 'utf8');
const v17 = fs.readFileSync('bk-body17.html', 'utf8');
const LOGO = fs.readFileSync('../ghpages/booking-17.html', 'utf8').match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/)[1];
// booking-17's styles, scoped to the new section and its popups
const css17 = v17.slice(v17.indexOf('<style>') + 7, v17.indexOf('</style>'));
const tokens = `:is(.n18,.n18d){--bg:#f6f6f6;--bg-2:#efefef;--card:#fff;--card-2:#fafafa;--line:#e7e7eb;--line-2:#d9d9df;--fg:#212529;--fg-2:#343a40;--muted:#6c757d;--faint:#9aa0a6;--ember:#ff6200;--ember-soft:rgba(255,98,0,.08);--ember-glow:rgba(255,98,0,.18);--red:#dc3545;--good:#198754;--good-soft:rgba(25,135,84,.10);--bad-soft:rgba(220,53,69,.08);--link:#1d4f91;color:var(--fg)}
.n18{grid-column:1/-1;width:100%;box-sizing:border-box;background:#fff;border:2px solid var(--ember);border-radius:12px;overflow:hidden;font-size:14px}
.n18 .n18h{display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--ember-soft)}
.n18 .n18h b{font-size:18px}.n18 .n18h small{color:var(--muted);font-size:13px}
.n18 .n18h .nw{margin-left:auto;font-size:11px;font-weight:800;color:#fff;background:var(--ember);border-radius:99px;padding:2px 9px}
.n18 .n18g{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(260px,1fr);gap:14px;padding:14px 16px}
.n18 #insight{padding:0;margin-bottom:10px}.n18 #dls{padding:0}
.n18 .n18e{border:1px solid var(--line);border-radius:10px;padding:14px;align-self:start}
.n18 .n18e h3{margin:0 0 8px;font-size:16px}.n18 .n18e .est{margin:0}.n18 .n18e .go{width:100%;margin:12px 0 0}
@media (max-width:900px){.n18 .n18g{grid-template-columns:1fr}}
.n18d dialog{font-size:14px}`;
const scoped = tokens + '\n' + scope(css17, '.n18,.n18d');
// popups (drawer, send preview, picture viewer, booking ticket, toast) from booking-17
const a = v17.indexOf('<dialog class="dw"'), z = v17.indexOf('<div class="toast" id="toast" role="status"></div>') + '<div class="toast" id="toast" role="status"></div>'.length;
const dialogs = v17.slice(a, z).replace('</main>', '').replace(/<\/div><\/div>\s*(?=<div class="toast")/, '').split('LOGO_B64').join(LOGO);
// booking-17's script: missing elements answer with a harmless stand-in; dates count from the live snapshot day
let js = v17.slice(v17.lastIndexOf('<script>') + 8, v17.lastIndexOf('</script>')).split('LOGO_B64').join(LOGO);
const stub = `const _st={};const _mk=()=>{const t={value:"",textContent:"",innerHTML:"",hidden:false,disabled:false,title:"",dataset:{},style:{},onclick:null,oninput:null,onchange:null};return new Proxy(t,{get:(o,k)=>k==="classList"?{toggle(){},add(){},remove(){},contains(){return false}}:k==="querySelector"?()=>_mk():k==="querySelectorAll"?()=>[]:k==="closest"?()=>null:k in o?o[k]:typeof k==="string"&&/^(focus|blur|click|setAttribute|removeAttribute|addEventListener|scrollIntoView|showModal|close|select)$/.test(k)?()=>{}:undefined,set:(o,k,v)=>{o[k]=v;return true}})};
const $=s=>document.querySelector(s)||(_st[s]||(_st[s]=_mk())), $$=s=>[...document.querySelectorAll(s)];`;
js = js.replace(/const \$=s=>document\.querySelector\(s\), \$\$=s=>\[\.\.\.document\.querySelectorAll\(s\)\];/, () => stub);
if (!js.includes('const _st={}')) throw new Error('stub not placed');
// the snapshot data booking-11…17 use (build11.cjs takes it from booking-10), counted from the live copy's day
const ref = fs.readFileSync('../ghpages/booking-10.html', 'utf8').replace(/\r\n/g, '\n');
// today's live data (make-bk25.cjs from liveapi.mjs's read-only capture)
const BK = fs.readFileSync('bk25.json', 'utf8');
const FU = ref.match(/, FU=(\{.*?\});/)[1];
js = js.replace('/*BOOK*/null', () => BK).replace('/*FU*/null', () => FU);
if (js.includes('/*BOOK*/null')) throw new Error('data not placed');
const bridge = fs.readFileSync('bridge18.js', 'utf8');
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"></head>${body}</html>`, { waitUntil: 'domcontentloaded' });
  const html = await p.evaluate(({ dialogs, BETA }) => {
    const d = document.getElementById('DEALS_SLOT'); if (!d) throw new Error('no DEALS_SLOT');
    // the page switch, as on live: classic "Try new (Beta)" <-> beta "Switch to old"
    const sw = (t, href) => { const l = [...document.querySelectorAll('body *')].find(e => e.children.length === 0 && e.textContent.trim() === t) || [...document.querySelectorAll('button,a')].find(e => e.textContent.trim().endsWith(t)); const btn = l && (l.closest('button,a') || l); if (!btn) throw new Error('no ' + t); btn.setAttribute('onclick', `location.href='${href}'`); btn.style.cursor = 'pointer'; };
    if (BETA) {
      sw('Switch to old', 'booking-18.html');
      /* beta: keep the step header of "Booking type & offers"; the deal cards and the CRS coupon block (its only
         coupon, 85rs off, is not offered) give way to the new list; the estimate keeps its title and chips */
      const list = d.querySelector('.flex.flex-column.gap-2'), hdr = list && list.querySelector(':scope > .step-header');
      if (!hdr) throw new Error('beta deals list not found');
      [...list.children].forEach(c => { if (c !== hdr) c.remove(); });
      hdr.insertAdjacentHTML('afterend', '<div id="insight"></div><div id="dls"></div>');
      const card = d.parentElement.querySelector('.est-card');
      if (!card) throw new Error('beta estimate card not found');
      card.querySelectorAll('.r-empty,.calc-hint').forEach(e => e.remove());
      const cbtn = card.querySelector('.calc-btn');
      cbtn.insertAdjacentHTML('beforebegin', '<div id="est"></div>');
      cbtn.id = 'create'; cbtn.type = 'button'; cbtn.disabled = true; cbtn.innerHTML = '<i class="pi pi-check-circle"></i> Create booking';
      d.removeAttribute('id');
    } else {
    sw('Try new (Beta)', 'booking-18-beta.html');
    /* keep the live deals area as it is (grid, Exclusive Offers, estimate card); only its deal cards and the
       estimate lines are swapped for booking-17's, drawn in the same live markup by bridge18.js */
    const list = d.querySelector('.col-12.lg\\:col-7 .flex.flex-column.gap-2');
    const excl = list && list.querySelector(':scope > .w-full');
    if (!list || !excl) throw new Error('live deals list not found');
    [...list.children].forEach(c => { if (c !== excl) c.remove(); });
    list.insertAdjacentHTML('afterbegin', '<div id="insight"></div><div id="dls"></div>');
    const card = d.querySelector('.col-12.lg\\:col-5 .surface-card');
    if (!card) throw new Error('live estimate card not found');
    const cbtn = [...card.querySelectorAll('button')].find(x => /Calculate Estimate/.test(x.textContent));
    [...card.children].slice(1).forEach(c => { if (c !== cbtn) c.remove(); });
    cbtn.insertAdjacentHTML('beforebegin', '<div id="est"></div>');
    cbtn.id = 'create'; cbtn.type = 'button'; cbtn.disabled = true; cbtn.textContent = 'Create booking';
    d.removeAttribute('id');
    }
    // give the live inputs the ids booking-17's logic listens on
    const byPh = ph => document.querySelector(`input[placeholder="${ph}"]`);
    const set = (el, id) => { if (el) el.id = id; };
    set(byPh('Enter guest mobile number'), 'mob'); set(byPh('Enter guest name'), 'nm'); set(byPh('Enter Instruction'), 'ins');
    const m = document.getElementById('mob'); if (m) { m.setAttribute('maxlength', '10'); m.setAttribute('inputmode', 'numeric'); }
    const w = document.createElement('div'); w.className = 'n18d'; w.innerHTML = dialogs; document.body.appendChild(w);
    return document.body.outerHTML;
  }, { dialogs, BETA });
  await b.close();
  const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>Reeserio Booking 18${BETA ? ' Beta' : ''}</title>
<style>${snapCss}</style>
<style id="n18css">${scoped}</style>
</head>
${html.replace('</body>', () => `<script>${js}</script>\n<script>${bridge}</script>\n</body>`)}
</html>`;
  const outName = BETA ? 'booking-18-beta.html' : 'booking-18.html';
  fs.writeFileSync('../ghpages/' + outName, page);
  console.log(outName, page.length);
})();
