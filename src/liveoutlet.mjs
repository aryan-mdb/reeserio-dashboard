// Read-only: open the live Outlet Details page for Atria Mall, Worli (id 6) and save the JSON its own API
// calls return (outlet info, menu and gallery images, nearby branches, deals, offers). Credentials from env.
import { chromium } from 'playwright-core';
import fs from 'fs';
const out = process.argv[2];
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await (await b.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
const got = {};
p.on('response', async r => {
  const u = r.url();
  if (!/captain\.bnhl\.in\/reeserio_api\/api\/(v1\/(branch-by-branchid|get-all-nearby-branches|get-active-deals|promotions|branches-lite)|OfferMaster|branch\/getBranchSlotAndRemarksByBranchId)/i.test(u)) return;
  try { const j = await r.json(); const k = u.replace(/^.*\/api\//, '').replace(/[?].*/, ''); got[k] = j; console.log('captured', k, JSON.stringify(j).length); } catch {}
});
await p.goto('https://reeserio.bnhl.in/main/booking', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
if (await p.locator('input[type=password]').count()) {
  await p.locator('input[type=text],input[placeholder*=user i]').first().fill(process.env.RU);
  await p.locator('input[type=password]').first().fill(process.env.RP);
  await p.getByRole('button', { name: /^login$/i }).click(); await p.waitForLoadState('networkidle').catch(() => {});
  await p.waitForTimeout(4000);
}
await p.goto('https://reeserio.bnhl.in/main/outlet-details?id=6', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(6000);
// images the page actually shows
const imgs = await p.evaluate(() => [...document.querySelectorAll('img')].map(i => ({ src: i.currentSrc || i.src, alt: i.alt, w: i.naturalWidth, h: i.naturalHeight, sec: (i.closest('[class]')?.parentElement?.parentElement?.innerText || '').split('\n')[0].slice(0, 40) })).filter(i => /^https?:/.test(i.src)));
got.__images = imgs;
await p.screenshot({ path: out + '/lo-full.png', fullPage: true });
fs.writeFileSync(out + '/lo-data.json', JSON.stringify(got, null, 1));
console.log('images', imgs.length, 'keys', Object.keys(got));
await b.close();
