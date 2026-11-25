// Read-only: type a mobile number on the live booking page and save the JSON the page itself loads for it
// (customer, booking history, call logs, loyalty). Credentials and the number come from env (RU, RP, MOB).
// Nothing is clicked except the login button; the output stays in the scratchpad.
import { chromium } from 'playwright-core';
import fs from 'fs';
const out = process.argv[2];
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await (await b.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
const got = [];
p.on('response', async r => {
  const u = r.url();
  if (r.request().resourceType() !== 'xhr' && r.request().resourceType() !== 'fetch') return;
  if (!/bnhl\.in/.test(u) || /Login|branches-lite|occasionList|FollowUp\/count|ServerDateTime|GetAuthenticatedUserDetail/i.test(u)) return;
  try { const j = await r.json(); got.push({ url: u.replace(/^https?:\/\/[^/]+/, '').replace(/\d{10}/g, '<MOB>'), method: r.request().method(), body: j }); } catch {}
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
await p.locator('input[placeholder*="mobile" i]').first().fill(process.env.MOB);
await p.waitForTimeout(9000);
// the customer panel as the agent sees it
const panel = await p.evaluate(() => { const r = [...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().left > 1050 && e.children.length === 0 && e.offsetParent).map(e => e.textContent.trim()).filter(Boolean); return r.filter((t, i, a) => a.indexOf(t) === i).slice(0, 80); });
fs.writeFileSync(out + '/lcust.json', JSON.stringify({ panel, calls: got }, null, 1));
console.log('responses', got.length, got.map(g => g.method + ' ' + g.url.slice(0, 90)).join('\n'));
await b.close();
