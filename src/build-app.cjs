// Build app.html (all list pages + popups) and wire every page's side menu and header buttons to it.
const fs = require('fs');
const G = '../ghpages/';
const rd = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n'); // git checks out CRLF

// side menu label -> target. '#/x' routes live in app.html.
const MAP = {
  'Dashboard': 'dashboard.html', 'Domestic Booking': 'booking-11.html', 'International Booking': '#/intl-booking', 'Toscano Salt Booking': '#/toscano-booking',
  'Manage Payment Links': '#/payment-links', 'Coupon Issue Request': '#/coupons', 'Reservation View': '#/reservation-view', 'Quotation List': '#/quotations',
  'Reservation Report': '#/reservation-report', 'Advance Collection': '#/advance', 'Agent Call Review': '#/call-review', 'Team Lead Call Review': '#/tl-review',
  'Lead Dashboard': '#/lead-dashboard', 'Domestic View Leads': '#/leads', 'Domestic View Leads New': '#/leads-new', 'International View Leads': '#/intl-leads',
  'Toscano Salt Leads': '#/toscano-leads', 'Add Leads': '#/leads?open=createLead', 'Manage Cater Leads': '#/cater', 'New Catering Leads': '#/cater?open=newCater',
  'Branch Instruction': '#/instructions', 'Offer Matrix': '#/offers', 'Branch Slot Management': '#/slots', 'Search Booking': '#/home?open=searchBooking',
  'Log Booking': '#/home?open=logBooking', 'DID Mapping': '#/did',
  'User Management': '#/users', 'Role &amp; Permission Matrix': '#/roles',
};
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function linkify(html, inApp) {
  const to = h => (h.startsWith('#') && !inApp ? 'app.html' + h : h);
  let hits = 0;
  // Access Control pages live under Admin in the side menu (once)
  if (!html.includes('>User Management</a>')) html = html.replace(/(<a href="[^"]*">Branch Slot Management<\/a>)/, '$1<a href="#">User Management</a><a href="#">Role &amp; Permission Matrix</a>');
  for (const [label, h] of Object.entries(MAP)) {
    // sub-menu links: <a href="...">Label</a>  (also re-link ones already pointing somewhere)
    html = html.replace(new RegExp(`<a href="[^"]*">${reEsc(label)}</a>`, 'g'), () => { hits++; return `<a href="${to(h)}">${label}</a>`; });
    // top-level menu items: <a class="mi[ on]" href="..."><svg…/svg>Label</a>
    html = html.replace(new RegExp(`(<a class="mi[^"]*" href=")[^"]*("[^>]*>(?:<svg(?:(?!</a>)[\\s\\S])*?</svg>)?)${reEsc(label)}</a>` /* never cross into the next link */, 'g'), (m, a, b) => { hits++; return `${a}${to(h)}${b}${label}</a>`; });
  }
  // header buttons
  html = html.replace(/<a class="hbtn purple" href="[^"]*"/, `<a class="hbtn purple" href="${to('#/followups')}"`)
    .replace(/<a class="hbtn red" href="[^"]*"/, `<a class="hbtn red" href="${to('#/followups')}"`)
    .replace(/<a class="hbtn or hide-md" href="[^"]*">Log Booking<\/a>/, `<a class="hbtn or hide-md" href="${to('#/home?open=logBooking')}">Log Booking</a>`)
    .replace(/<a class="hbtn or hide-md" href="[^"]*">(<svg[\s\S]*?<\/svg>)Search<\/a>/, `<a class="hbtn or hide-md" href="${to('#/home?open=searchBooking')}">$1Search</a>`)
    .replace(/<a class="hbtn fill" href="[^"]*"/, '<a class="hbtn fill" href="booking-11.html"');
  return { html, hits };
}

// app.html: shell from dashboard.html, nothing marked active (the router marks it)
const dash = rd(G + 'dashboard-ticket.html'); // shell source (dashboard.html is now the My Day page)
const cut = dash.indexOf('<style>\n/* Dashboard in the booking-ticket language');
if (cut < 0) throw new Error('dashboard body marker not found');
let pre = dash.slice(0, cut).replace('<title>Reeserio Dashboard</title>', '<title>Reeserio</title>').replace(/<a class="mi on" href="[^"]*">/, '<a class="mi" href="dashboard.html">');
if (/class="mi on"/.test(pre)) throw new Error('a menu item is still marked active');
pre = pre.replace(/<div class="crumb">[\s\S]*?<\/div><div class="asof">[\s\S]*?<\/div>/, '<div class="crumb"></div>');
if (!pre.includes('<div class="crumb"></div>')) throw new Error('crumb not replaced');
const D = rd(G + 'index.html').match(/const D=(\{.*?\});\n/s)[1];
const APP = fs.readFileSync('app-data.json', 'utf8');
const body = rd('bk-app.html').replace('/*APP*/null', () => APP).replace('/*DASH*/null', () => D);
const app = linkify(pre + body + '</body></html>', true);
fs.writeFileSync(G + 'app.html', app.html);
fs.writeFileSync('../reeserio-app.html', app.html);
console.log('app.html', app.html.length, 'links', app.hits);

// re-link every other page
for (const f of fs.readdirSync(G).filter(f => /\.html$/.test(f) && f !== 'app.html')) {
  const r = linkify(rd(G + f), false);
  fs.writeFileSync(G + f, r.html);
  if (f === 'dashboard.html') fs.writeFileSync('../reeserio-dashboard-v2.html', r.html);
  console.log(f, 'links', r.hits);
}
