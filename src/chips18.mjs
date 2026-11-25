// booking-18-beta: the live quick chips under the time slots open the right panels
import { chromium } from 'playwright-core';
const [dir, shots] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file:///' + dir + '/booking-18-beta.html'); await p.waitForTimeout(800);
const r = {};
for (const t of ['Buffet prices', 'Offers', 'Nearby outlet']) {
  await p.locator('app-spark-shortcuts button', { hasText: t }).first().click(); await p.waitForTimeout(300);
  r[t] = await p.evaluate(() => [...document.querySelectorAll('dialog')].filter(d => d.open).map(d => d.innerText.slice(0, 40).replace(/\s+/g, ' ')));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
}
const g = p.locator('#dls').locator('xpath=ancestor::div[contains(@class,"grid")][1]');
await g.scrollIntoViewIfNeeded(); await g.screenshot({ path: shots + '/b18b-deals.png' });
r.errs = errs;
console.log(JSON.stringify(r, null, 1));
await b.close();
