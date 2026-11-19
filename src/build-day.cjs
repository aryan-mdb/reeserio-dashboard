// Build the "My Day" dashboard into dashboard.html. The previous ticket dashboard is kept as dashboard-ticket.html.
const fs = require('fs');
const G = '../ghpages/';
const rd = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
if (!fs.existsSync(G + 'dashboard-ticket.html')) fs.copyFileSync(G + 'dashboard.html', G + 'dashboard-ticket.html');
const ref = rd(G + 'dashboard-ticket.html');
const cut = ref.indexOf('<style>\n/* Dashboard in the booking-ticket language');
if (cut < 0) throw new Error('ticket dashboard body marker not found');
const pre = ref.slice(0, cut).replace('<title>Reeserio Dashboard</title>', '<title>Reeserio · My Day</title>');
const D = rd(G + 'index.html').match(/const D=(\{.*?\});\n/s)[1];
const out = pre + rd('bk-day.html').replace('/*DASH*/null', () => D) + '</body></html>';
fs.writeFileSync(G + 'dashboard.html', out);
console.log('dashboard (My Day)', out.length);
