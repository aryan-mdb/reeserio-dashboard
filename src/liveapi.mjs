// Read-only: record the JSON the live classic booking page loads for Atria Mall, Worli (today, then a lunch and a
// dinner slot), so booking-17's data can be rebuilt from today's live data. Credentials from env RU / RP.
// Clicks: login, outlet dropdown, a time slot. No guest number, nothing saved or sent.
import { chromium } from 'playwright-core';
import fs from 'fs';
const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
let n = 0;
const index = [];
p.on('response', async r => {
  const u = r.url(); const ct = r.headers()['content-type'] || '';
  // never keep login / user / token traffic (holds the password and the session token)
  if (/\/(Auth|User|Token|Login)\b/i.test(u)) return;
  if (/\.(js|css|png|jpg|svg|woff2?)(\?|$)/.test(u)) return;
  let body; try { body = await r.text(); } catch { return; }
  const req = r.request(); const name = String(++n).padStart(3, '0') + '-' + u.split('?')[0].split('/').filter(Boolean).slice(-1)[0].replace(/[^\w.-]/g, '_').slice(0, 60) + '.json';
  fs.writeFileSync(out + '/' + name, body);
  index.push({ name, method: req.method(), url: u.replace(/([?&](token|key|auth)[^=]*=)[^&]+/gi, '$1***'), post: (req.postData() || '').slice(0, 400), size: body.length });
});
await p.goto('https://reeserio.bnhl.in/main/booking', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
if (await p.locator('input[type=password]').count()) {
  await p.locator('input[type=text],input[placeholder*=user i]').first().fill(process.env.RU);
  await p.locator('input[type=password]').first().fill(process.env.RP);
  await p.getByRole('button', { name: /^login$/i }).click(); await p.waitForLoadState('networkidle').catch(() => {});
  await p.waitForTimeout(4000);
  if (!/main\/booking/.test(p.url())) { await p.goto('https://reeserio.bnhl.in/main/booking', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {}); await p.waitForTimeout(4000); }
}
await p.getByText('Select branch', { exact: false }).first().click().catch(() => {});
await p.waitForTimeout(800); await p.keyboard.type('Atria', { delay: 60 }); await p.waitForTimeout(1500);
await p.getByText(/Atria Mall/i).first().click().catch(() => {});
await p.waitForTimeout(7000);
for (const t of ['07:00 PM']) {
  for (const el of await p.getByText(new RegExp('^\\s*' + t + '\\s*$')).all()) { const bb = await el.boundingBox().catch(() => null); if (bb && bb.width > 40) { await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); break; } }
  await p.waitForTimeout(6000);
}
fs.writeFileSync(out + '/_index.json', JSON.stringify(index, null, 1));
console.log('saved', index.length, 'responses');
console.log(index.map(i => `${i.name}  ${i.method}  ${i.size}  ${i.url.slice(0, 110)}  ${i.post.slice(0, 120)}`).join('\n'));
await b.close();
