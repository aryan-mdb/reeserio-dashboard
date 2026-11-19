// The original build sources were lost when the scratchpad was cleared.
// Rebuild from a published page: reuse its <head> + app shell, its embedded data and logo,
// and swap in a new body. Usage: node build11.cjs <body.html> <n>
const fs = require('fs');
const [, , bodyFile, n] = process.argv;
const ref = fs.readFileSync('../ghpages/booking-10.html', 'utf8').replace(/\r\n/g, '\n'); // git checks out CRLF
const cut = ref.indexOf('<style>\n/* Booking v10');
if (cut < 0) throw new Error('reference body marker not found');
const prefix = ref.slice(0, cut).replace('<title>Reeserio Booking 10</title>', `<title>Reeserio Booking ${n}</title>`);
const BK = ref.match(/const BK=(\{.*?\}), FU=/s)[1];
const FU = ref.match(/, FU=(\{.*?\});/)[1];
const LOGO = ref.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/)[1];
JSON.parse(BK); JSON.parse(FU);
const body = fs.readFileSync(bodyFile, 'utf8')
  .replace('/*BOOK*/null', () => BK).replace('/*FU*/null', () => FU)
  .split('LOGO_B64').join(LOGO);
const CR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg>';
const pre2 = prefix.replace(/<div class="crumb">[\s\S]*?<\/div>/, `<div class="crumb"><a href="dashboard.html">Dashboard</a>${CR}<span>Table Booking</span>${CR}<b>Domestic Booking</b></div>`);
const out = pre2 + body + '</body></html>';
fs.writeFileSync(`../ghpages/booking-${n}.html`, out);
fs.writeFileSync(`../reeserio-booking-v${n}.html`, out);
console.log('built', n, out.length);
