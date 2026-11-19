// Build dashboard.html: app shell from booking-11.html (Dashboard made active), data from index.html.
const fs = require('fs');
const rd = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n'); // git checks out CRLF
const ref = rd('../ghpages/booking-11.html');
const cut = ref.indexOf('<style>\n/* Booking v11');
if (cut < 0) throw new Error('booking-11 body marker not found');
let pre = ref.slice(0, cut);
const swap = (a, b) => { if (!pre.includes(a)) throw new Error('anchor missing: ' + a.slice(0, 70)); pre = pre.split(a).join(b); };
swap('<title>Reeserio Booking 11</title>', '<title>Reeserio Dashboard</title>');
swap('<a class="mi" href="index.html">', '<a class="mi on" href="dashboard.html">');
swap('<a href="#" style="color:var(--ember);background:var(--ember-soft);font-weight:600">Domestic Booking</a>', '<a href="booking-11.html">Domestic Booking</a>');
swap('<details open><summary class="mi">', '<details><summary class="mi">');
swap('<a class="hbtn fill" href="#" aria-current="page">', '<a class="hbtn fill" href="booking-11.html">');
const crumbRe = /<div class="crumb">[\s\S]*?<\/div>/;
if (!crumbRe.test(pre)) throw new Error('crumb missing');
pre = pre.replace(crumbRe, '<div class="crumb"><b>Dashboard</b></div><div class="asof"><i></i>Live snapshot</div>');
const D = rd('../ghpages/index.html').match(/const D=(\{.*?\});\n/s)[1];
JSON.parse(D);
const LOGO = ref.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/)[1];
const body = rd('bk-dash.html').replace('/*DASH*/null', () => D).split('LOGO_B64').join(LOGO);
const out = pre + body + '</body></html>';
fs.writeFileSync('../ghpages/dashboard.html', out);
fs.writeFileSync('../reeserio-dashboard-v2.html', out);
console.log('built dashboard', out.length);
