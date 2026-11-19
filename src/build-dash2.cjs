// Make the ticket dashboard the main dashboard again (dashboard.html), keep a copy as dashboard-ticket.html,
// and keep the My Day page as dashboard-myday.html. Shell (header, side menu) comes from the current ticket page;
// header-kit.cjs and add-profile.cjs are re-run afterwards to put the header scripts back.
const fs = require('fs');
const G = '../ghpages/';
const rd = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
if (!fs.existsSync(G + 'dashboard-myday.html') && /My Day/.test(rd(G + 'dashboard.html'))) fs.copyFileSync(G + 'dashboard.html', G + 'dashboard-myday.html');
const ref = rd(G + 'dashboard-ticket.html');
const cut = ref.indexOf('<style>\n/* Dashboard in the booking-ticket language');
if (cut < 0) throw new Error('ticket body marker not found');
const pre = ref.slice(0, cut).replace(/<title>[^<]*<\/title>/, '<title>Reeserio Dashboard</title>');
const D = rd(G + 'index.html').match(/const D=(\{.*?\});\n/s)[1];
const LOGO = ref.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/)[1];
const out = pre + rd('bk-dash.html').replace('/*DASH*/null', () => D).split('LOGO_B64').join(LOGO) + '</body></html>';
fs.writeFileSync(G + 'dashboard.html', out);
fs.writeFileSync(G + 'dashboard-ticket.html', out);
console.log('ticket dashboard ->', out.length);
