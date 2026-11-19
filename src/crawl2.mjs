// Read-only crawl: log in, open every side-menu page, record the JSON the app loads and the table headers it shows.
// Only menu links are clicked; no form or action button is touched.
import { chromium } from 'playwright-core';
import fs from 'fs';
const OUT = process.argv[2];
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
let cur = 'login'; const cap = {};
p.on('response', async r => {
  const u = r.url(), ct = r.headers()['content-type'] || '';
  if (!/json/.test(ct) || /\.(js|css|png|svg|woff)/.test(u)) return;
  let body = null; try { body = await r.text(); } catch {}
  (cap[cur] ||= []).push({ u, m: r.request().method(), req: (r.request().postData() || '').slice(0, 800), s: r.status(), body: (body || '').slice(0, 600000) });
});
await p.goto('https://reeserio.bnhl.in/main/booking', { waitUntil: 'domcontentloaded', timeout: 60000 });
const pw = p.locator('input[type=password]'); await pw.first().waitFor({ timeout: 20000 });
await p.getByPlaceholder('Enter User Name').pressSequentially(process.env.RU, { delay: 20 });
await pw.first().pressSequentially(process.env.RP, { delay: 20 });
await p.getByRole('button', { name: 'Login' }).click();
await p.waitForURL(u => !u.toString().includes('/login'), { timeout: 30000 });
await p.waitForTimeout(3000);
const clickText = t => p.evaluate(t => { const root = [...document.querySelectorAll('.p-sidebar')].find(s => s.offsetParent || getComputedStyle(s).visibility !== 'hidden') || document; const els = [...root.querySelectorAll('a,li,span,div,button')].filter(e => e.innerText && e.innerText.trim() === t && e.offsetParent); const e = els.at(-1); if (e) { e.click(); return true } return false }, t);
const openMenu = async () => { const open = await p.evaluate(() => [...document.querySelectorAll('.p-sidebar')].some(s => s.getBoundingClientRect().width > 50 && s.getBoundingClientRect().left >= -5)); if (!open) { await p.locator('i.pi-bars').first().click(); await p.waitForTimeout(800); } };
const ITEMS = [
  [null, 'Domestic Booking', 'Table Booking'], [null, 'International Booking', 'Table Booking'], [null, 'Toscano Salt Booking', 'Table Booking'],
  ['Reservations', 'Manage Payment Links'], ['Reservations', 'Coupon Issue Request'], ['Reservations', 'Reservation View'], ['Reservations', 'Quotation List'],
  ['Reservations', 'Reservation Report'], ['Reservations', 'Advance Collection'], ['Reservations', 'Agent Call Review'], ['Reservations', 'Team Lead Call Review'],
  ['Leads', 'Lead Dashboard'], ['Leads', 'Domestic View Leads'], ['Leads', 'Domestic View Leads New'], ['Leads', 'International View Leads'], ['Leads', 'Toscano Salt Leads'], ['Leads', 'Add Leads'],
  ['ODC', 'Manage Cater Leads'], ['ODC', 'New Catering Leads'], ['Admin', 'Branch Instruction'], ['Admin', 'Offer Matrix'], ['Admin', 'Branch Slot Managment'],
  [null, 'Search Booking'], [null, 'Log Booking'], [null, 'DID Mapping'],
];
const pages = {};
for (const [grp, item, top] of ITEMS) {
  cur = item;
  try {
    await openMenu();
    if (top) await clickText(top); await p.waitForTimeout(300);
    if (grp === 'Leads') { await clickText('Reservations'); await p.waitForTimeout(300); }
    if (grp) await clickText(grp); await p.waitForTimeout(400);
    const ok = await clickText(item);
    await p.waitForTimeout(5000);
    pages[item] = await p.evaluate(() => ({
      url: location.pathname,
      heads: [...document.querySelectorAll('table thead tr')].slice(0, 2).map(tr => [...tr.children].map(th => th.innerText.trim()).filter(Boolean)),
      inputs: [...document.querySelectorAll('input,select,textarea,p-dropdown,p-calendar')].filter(e => e.offsetParent).map(e => e.getAttribute('placeholder') || e.getAttribute('formcontrolname') || e.getAttribute('name') || e.tagName).slice(0, 40),
      buttons: [...document.querySelectorAll('button')].filter(e => e.offsetParent).map(e => e.innerText.trim()).filter(Boolean).slice(0, 30),
      text: (document.querySelector('main, app-root') || document.body).innerText.slice(0, 2500),
    }));
    pages[item].clicked = ok;
    await p.screenshot({ path: `${OUT}/m-${item.replace(/\W+/g, '_')}.png` });
    console.log('ok', item, pages[item].url, (cap[item] || []).length, 'calls');
  } catch (e) { console.log('fail', item, e.message.slice(0, 120)); }
}
fs.writeFileSync(OUT + '/crawl2.json', JSON.stringify({ pages, cap }));
await b.close();
