// Read-only walk through the live BETA booking page to see its price hints (lowest price, cheapest time,
// deal comparison, savings). Credentials from env RU / RP; guest number from env MOB (a test number).
// Clicks only: login, "Try new (Beta)", guest +/-, outlet, date, time, the lowest-price toggle, deal radios.
// Never clicks Create / Send / Calculate / Save.
import { chromium } from 'playwright-core';
import fs from 'fs';
const out = process.argv[2];
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await (await b.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
const log = []; const L = (...a) => { const s = a.map(x => typeof x === 'string' ? x : JSON.stringify(x, null, 1)).join(' '); log.push(s); console.log(s.slice(0, 1500)); };
await p.goto('https://reeserio.bnhl.in/main/booking', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
if (await p.locator('input[type=password]').count()) {
  await p.locator('input[type=text],input[placeholder*=user i]').first().fill(process.env.RU);
  await p.locator('input[type=password]').first().fill(process.env.RP);
  await p.getByRole('button', { name: /^login$/i }).click(); await p.waitForLoadState('networkidle').catch(() => {});
  await p.waitForTimeout(4000);
  if (!/main\/booking/.test(p.url())) { await p.goto('https://reeserio.bnhl.in/main/booking', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {}); await p.waitForTimeout(4000); }
}
await p.getByRole('button', { name: /Try new/i }).click().catch(e => L('beta btn', e.message.slice(0, 60))); await p.waitForTimeout(5000);
const text = () => p.evaluate(() => document.querySelector('main, .layout-main, app-root')?.innerText.replace(/\n{2,}/g, '\n').slice(0, 6000) || '');
const shot = async n => { await p.screenshot({ path: `${out}/beta-${n}.png`, fullPage: true }); };
await shot('0-empty');
await p.locator('input[placeholder*="mobile" i]').first().fill(process.env.MOB); await p.waitForTimeout(5000);
// adults: + four times
const adPlus = p.locator('xpath=//*[normalize-space(text())="Adult"]/following::button[2]').first();
for (let i = 0; i < 4; i++) { await adPlus.click().catch(() => {}); await p.waitForTimeout(500); }
await p.locator('p-dropdown, .p-dropdown').filter({ hasText: 'Select branch' }).first().click().catch(e => L('dd', e.message.slice(0, 60)));
await p.waitForTimeout(1200);
const flt = p.locator('.p-dropdown-filter, .p-dropdown-panel input').first();
if (await flt.count()) await flt.fill('Atria'); else await p.keyboard.type('Atria', { delay: 60 });
await p.waitForTimeout(1500);
await p.locator('.p-dropdown-item, li[role=option]').filter({ hasText: /Atria Mall/i }).first().click().catch(e => L('outlet', e.message.slice(0, 60)));
await p.waitForTimeout(6000);
await shot('1-outlet'); L('== after outlet\n' + await text());
// lowest-price toggle
const low = p.locator('text=/lowest|cheapest/i').first(); L('lowest candidates', await p.locator('text=/lowest|cheapest/i').allInnerTexts());
await low.click().catch(e => L('lowest click', e.message.slice(0, 60))); await p.waitForTimeout(2000);
await shot('2-lowest');
L('== popover', await p.evaluate(() => [...document.querySelectorAll('.p-overlaypanel, [role=dialog], .p-dialog, .cdk-overlay-pane, [class*=popover], [class*=lowest]')].filter(e => e.offsetParent || getComputedStyle(e).position === 'fixed').map(e => e.innerText.trim().slice(0, 2500))));
await p.keyboard.press('Escape'); await p.mouse.click(10, 500); await p.waitForTimeout(800);
// a lunch slot (deals) then the page text
L('slot candidates', (await p.locator('text=/\\d{1,2}:\\d{2}\\s*(AM|PM)/i').allInnerTexts()).slice(0, 30));
// the slot pills: click the visible element whose own text is exactly "02:30 PM"
let clicked = null;
for (const el of await p.getByText('02:30 PM', { exact: true }).all()) {
  const bb = await el.boundingBox().catch(() => null);
  if (bb && bb.width > 40 && bb.height > 20) { await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); clicked = bb; break; }
}
L('slot clicked', clicked); await p.waitForTimeout(7000);
await shot('3-slot'); L('== after slot\n' + await text());
const sparkText = () => p.evaluate(() => { const h = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim() === 'SPARK'); let s = h; for (let k = 0; k < 7 && s; k++) { s = s.parentElement; if (s && s.innerText.length > 500) break; } return s ? s.innerText.replace(/\n{2,}/g, '\n').slice(0, 3000) : 'no spark'; });
for (const tab of ['Buffet prices', 'Offers', 'Best offer', 'Nearby outlet']) {
  let ok = false;
  for (const el of await p.getByText(tab, { exact: true }).all()) { const bb = await el.boundingBox().catch(() => null); if (bb && bb.width > 30) { await el.scrollIntoViewIfNeeded().catch(() => {}); await el.click().catch(() => {}); ok = true; break; } }
  await p.waitForTimeout(3000);
  const pop = await p.evaluate(() => [...document.querySelectorAll('.p-overlaypanel, .p-dialog, [role=dialog], .cdk-overlay-pane, [class*=popover], [class*=spark]')].filter(e => (e.offsetParent || getComputedStyle(e).position === 'fixed') && e.innerText.trim().length > 30).map(e => e.innerText.replace(/\n{2,}/g, '\n').slice(0, 3000)));
  L('== SPARK tab: ' + tab + ' (clicked ' + ok + ')\n' + (pop.length ? pop.join('\n-----\n') : await sparkText()));
  await shot('4-spark-' + tab.replace(/\W/g, ''));
}
fs.writeFileSync(out + '/beta-log.txt', log.join('\n'));
await b.close();
