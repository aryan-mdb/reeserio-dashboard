// Read-only: log in, open each list page, capture its list API request (with headers),
// then replay that same request for pages 2..5 to get up to 50 rows per list. Nothing is submitted.
import { chromium } from 'playwright-core';
import fs from 'fs';
const OUT = process.argv[2];
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const TARGET = {
  'Manage Payment Links': /payment-link-list/, 'Coupon Issue Request': /issue-coupon-list/, 'Quotation List': /QuotationMaster\/list/,
  'Advance Collection': /AdvanceCollection\/list/, 'Agent Call Review': /AgentQuality\/calls/, 'Team Lead Call Review': /AgentQuality\/team-leaders/,
  'Domestic View Leads': /fetch-leads-data/, 'International View Leads': /FetchKnowlarityCallsForCRSList/, 'Offer Matrix': /OfferMaster\/list/,
};
const reqs = {};
p.on('request', r => { for (const [k, re] of Object.entries(TARGET)) if (re.test(r.url()) && !reqs[k]) reqs[k] = { url: r.url(), method: r.method(), headers: r.headers(), body: r.postData() || '' }; });
await p.goto('https://reeserio.bnhl.in/main/booking', { waitUntil: 'domcontentloaded', timeout: 60000 });
const pw = p.locator('input[type=password]'); await pw.first().waitFor({ timeout: 20000 });
await p.getByPlaceholder('Enter User Name').pressSequentially(process.env.RU, { delay: 20 });
await pw.first().pressSequentially(process.env.RP, { delay: 20 });
await p.getByRole('button', { name: 'Login' }).click();
await p.waitForURL(u => !u.toString().includes('/login'), { timeout: 30000 });
await p.waitForTimeout(3000);
const clickText = t => p.evaluate(t => { const root = [...document.querySelectorAll('.p-sidebar')].find(s => s.offsetParent || getComputedStyle(s).visibility !== 'hidden') || document; const els = [...root.querySelectorAll('a,li,span,div,button')].filter(e => e.innerText && e.innerText.trim() === t && e.offsetParent); const e = els.at(-1); if (e) { e.click(); return true } return false }, t);
const openMenu = async () => { const open = await p.evaluate(() => [...document.querySelectorAll('.p-sidebar')].some(s => s.getBoundingClientRect().width > 50 && s.getBoundingClientRect().left >= -5)); if (!open) { await p.locator('i.pi-bars').first().click(); await p.waitForTimeout(800); } };
const setPage = (body, n) => { try { const j = JSON.parse(body); if ('page' in j) { j.page = n; return JSON.stringify(j); } if ('pageNo' in j) { j.pageNo = n; return JSON.stringify(j); } } catch {} return body.replace(/(^|&)page=\d+/, `$1page=${n}`); };
const ITEMS = [['Reservations', 'Manage Payment Links'], ['Reservations', 'Coupon Issue Request'], ['Reservations', 'Quotation List'], ['Reservations', 'Advance Collection'], ['Reservations', 'Agent Call Review'], ['Reservations', 'Team Lead Call Review'], ['Leads', 'Domestic View Leads'], ['Leads', 'International View Leads'], ['Admin', 'Offer Matrix'], ['ODC', 'Manage Cater Leads']];
const out = { api: {}, odcText: [] };
for (const [grp, item] of ITEMS) {
  try {
    await p.keyboard.press('Escape'); await p.waitForTimeout(400); await openMenu();
    if (grp === 'Leads') { await clickText('Reservations'); await p.waitForTimeout(300); }
    await clickText(grp); await p.waitForTimeout(400); await clickText(item); await p.waitForTimeout(5000);
    if (item === 'Manage Cater Leads') {
      for (let n = 1; n <= 5; n++) {
        if (n > 1) { await p.evaluate(n => { const x = [...document.querySelectorAll('.p-paginator-page, .p-paginator-pages button')].find(e => e.innerText.trim() === String(n)); x && x.click(); }, n); await p.waitForTimeout(2500); }
        out.odcText.push(await p.evaluate(() => (document.querySelector('main, app-root') || document.body).innerText));
      }
      console.log('odc pages', out.odcText.length); continue;
    }
    const R = reqs[item]; if (!R) { console.log('no request captured for', item); continue; }
    const bodies = [];
    for (let n = 1; n <= 5; n++) {
      const res = await p.evaluate(async ({ R, body }) => { const h = {}; for (const k of ['authorization', 'content-type', 'accept']) if (R.headers[k]) h[k] = R.headers[k]; const r = await fetch(R.url, { method: R.method, headers: h, body: R.method === 'GET' ? undefined : body }); return r.text(); }, { R, body: setPage(R.body, n) });
      bodies.push(res.slice(0, 600000));
    }
    out.api[item] = bodies; console.log('ok', item, bodies.map(x => x.length).join(','));
  } catch (e) { console.log('fail', item, e.message.slice(0, 100)); }
}
fs.writeFileSync(OUT + '/pages.json', JSON.stringify(out));
await b.close();
