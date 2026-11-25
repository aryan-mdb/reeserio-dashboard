// Simple look for every page (run last, after fresh-kit; re-runnable).
// - pages up to 2200px wide
// - page headers flat: no orange ticket stub, one orange action button (totals are in the pager already)
// - no tiny UPPERCASE letter-spaced labels: sentence case at a readable size
// - solid hairlines instead of dashed ones, "Open" tags on module cards become a plain chevron
// - menus and "Create Booking" open the simple booking page (booking-16) and the simple dashboard
const fs = require('fs');
const G = '../ghpages/';
const CSS = `<style id="simplecss">
/* simple look (simple-kit.cjs) */
main.wrap,.subbar .wrap{max-width:2200px!important}
.ds{max-width:none!important}
/* readable labels */
main th,main small,main label,main span,main em,main b,main div,main p,main a,main h2,main h3{text-transform:none!important;letter-spacing:normal!important}
.t th{font-size:12.5px!important;font-weight:700!important;color:var(--muted)!important}
.t td{border-bottom-style:solid!important}
.kps div small{font-size:12.5px!important;font-weight:600!important;color:var(--muted)!important}
.fi>span{font-size:13px!important;font-weight:700!important;color:var(--fg-2)!important}
.hgrp{font-size:14px!important;font-weight:800!important;color:var(--fg-2)!important}
.pg{border-top-style:solid!important}
/* flat page header */
.ph{filter:none!important;margin-bottom:14px!important}
.ph .phm{background:none!important;-webkit-mask:none!important;mask:none!important;border-radius:0!important;padding:4px 0!important}
.ph h1{font-size:21px!important}
.ph p{font-size:13.5px!important}
.ph .kps{border-left:1px solid var(--line)!important}
.ph .phs{background:none!important;color:var(--fg)!important;border:0!important;-webkit-mask:none!important;mask:none!important;border-radius:0!important;padding:0 0 0 14px!important;display:flex!important;align-items:center}
.ph .phs small,.ph .phs b{display:none!important}
.ph .phs button,.ph .phs a{background:var(--ember)!important;color:#fff!important;height:40px!important;border-radius:11px!important;padding:0 18px!important}
.ph .phs button:hover,.ph .phs a:hover{filter:brightness(.95)}
@media (max-width:1100px){.ph .kps{border-left:0!important;border-top:1px solid var(--line)!important}}
@media (max-width:860px){.ph .phs{padding:8px 0 0!important}.ph .phs button,.ph .phs a{width:100%}}
/* module cards: no "Open" tag */
.hc em{font-size:0!important}
.hc em::after{content:"›";font-size:20px;font-weight:600;color:var(--faint)}
.hc:hover{transform:none!important;border-color:var(--ember)!important}
.hc i{background:var(--bg-2)!important}
</style>`;
// The booking page every link opens: booking-17 (calm one-screen page with the live price hints).
// Older designs stay reachable by their own URL; links between booking pages themselves are left alone.
const BOOK = 'booking-17.html';
let k = 0, links = 0;
for (const f of fs.readdirSync(G).filter(f => /\.html$/.test(f))) {
  let t = fs.readFileSync(G + f, 'utf8').replace(/\r\n/g, '\n');
  const before = t;
  t = t.replace(/href="booking-(11|15|16)\.html"/g, () => { links++; return `href="${BOOK}"`; });
  if (f !== 'index.html' && /--bg:#f6f6f6/.test(t)) {
    t = t.replace(/<style id="simplecss">[\s\S]*?<\/style>\n?/, '');
    t = t.replace(/<\/body>/, CSS + '\n</body>');
    k++;
  }
  if (t !== before) fs.writeFileSync(G + f, t);
}
console.log('simple look on', k, 'pages;', links, 'booking links ->', BOOK);
