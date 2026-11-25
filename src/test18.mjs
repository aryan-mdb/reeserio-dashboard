// booking-18 check: live controls drive the deals area, cards pick, Menu / Send open, guest lookup, no overflow.
import { chromium } from 'playwright-core';
const [dir, shots] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome' });
const errs = [], out = {};
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => errs.push(e.message));
await p.goto('file:///' + dir + '/booking-18.html'); await p.waitForTimeout(800);
const best = async () => (await p.locator('#insight').innerText()).replace(/\s+/g, ' ');
out.start = await best();
// pick a different card
await p.locator('#dls .of', { hasText: 'AMOUNT NOT FIXED' }).click(); await p.waitForTimeout(200);
out.pickedBorder = await p.locator('#dls .of', { hasText: 'AMOUNT NOT FIXED' }).evaluate(e => getComputedStyle(e).borderTopColor);
out.estAfterPick = (await p.locator('#est').innerText()).replace(/\s+/g, ' ').slice(0, 120);
// adults +2 -> 4
const plus = p.locator('xpath=//*[normalize-space(text())="Adult"]/following::button[2]').first();
await plus.click(); await plus.click(); await p.waitForTimeout(200);
out.after4 = await best();
out.enabledOffers = await p.$$eval('#dls .of:not(.opacity-50)', e => e.length);
// slot 7 PM
await p.locator('.time-slot', { hasText: '07:00 PM' }).first().click(); await p.waitForTimeout(200);
out.slot = await p.$$eval('.time-slot.selected', e => e.map(x => x.innerText.trim()));
out.after7 = await best();
// Menu of first offer
await p.locator('#dls [data-bmenu]').first().click(); await p.waitForTimeout(300);
out.menuOpen = await p.evaluate(() => [...document.querySelectorAll('dialog')].filter(d => d.open).map(d => d.innerText.slice(0, 60).replace(/\s+/g, ' ')));
await p.keyboard.press('Escape'); await p.waitForTimeout(200);
await p.locator('#dls [data-send]').first().click(); await p.waitForTimeout(300);
out.sendOpen = await p.evaluate(() => [...document.querySelectorAll('dialog')].filter(d => d.open).map(d => d.innerText.slice(0, 60).replace(/\s+/g, ' ')));
await p.keyboard.press('Escape'); await p.waitForTimeout(200);
// guest lookup
await p.locator('#mob').fill('7973968515'); await p.locator('#mob').dispatchEvent('input'); await p.waitForTimeout(1500);
out.card = await p.evaluate(() => document.body.innerText.match(/\d+ past bookings/)?.[0]);
for (const w of [1600, 1366, 390]) { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(150); out['ov' + w] = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); }
await p.setViewportSize({ width: 1440, height: 900 });
const g = await p.locator('#dls').evaluateHandle(e => e.closest('.grid'));
await g.scrollIntoViewIfNeeded(); await g.screenshot({ path: shots + '/b18-deals.png' });
out.errs = errs;
console.log(JSON.stringify(out, null, 1));
await b.close();
