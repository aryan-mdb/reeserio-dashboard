// Build the simple dashboard as dashboard-simple.html. dashboard.html (ticket design) is left as it is so the
// two can be compared. Shell (header, side menu) comes from dashboard-ticket.html, data from index.html.
// Run the kit chain (header-kit, add-profile, side-kit, theme-kit, fresh-kit) afterwards.
const fs = require('fs');
const G = '../ghpages/';
const rd = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const ref = rd(G + 'dashboard-ticket.html');
const cut = ref.indexOf('<style>\n/* Dashboard in the booking-ticket language');
if (cut < 0) throw new Error('ticket body marker not found');
const pre = ref.slice(0, cut).replace(/<title>[^<]*<\/title>/, '<title>Reeserio Dashboard</title>');
const D = rd(G + 'index.html').match(/const D=(\{.*?\});\n/s)[1];
const out = pre + rd('bk-dash-simple.html').replace('/*DASH*/null', () => D) + '</body></html>';
// The simple dashboard is the main dashboard now; dashboard-ticket.html keeps the old design.
fs.writeFileSync(G + 'dashboard-simple.html', out);
fs.writeFileSync(G + 'dashboard.html', out);
console.log('simple dashboard ->', out.length);
