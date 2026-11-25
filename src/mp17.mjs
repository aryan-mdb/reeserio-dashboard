// booking-17 / 18: the Menu & price panel — tabs per offer, price card, price by time, food per buffet, send, use
import { chromium } from 'playwright-core';
const [dir, shots] = process.argv.slice(2);
const page = process.env.PAGE || 'booking-17.html';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file:///' + dir + '/' + page); await p.waitForTimeout(1000);
if (page === 'booking-17.html') { const tp = p.locator('.tp:not([disabled])').nth(1); if (await tp.count()) { await tp.click(); await p.waitForTimeout(300); } }
const out = {};
const dwt = async () => (await p.locator('#dwB').innerText()).replace(/\s+/g, ' ');
await p.locator('#dls [data-bmenu]').first().click(); await p.waitForTimeout(400);
out.title = await p.locator('#dwT').innerText(); out.sub = await p.locator('#dwS').innerText();
out.tabs = await p.$$eval('#dwB .tabs button', e => e.map(x => x.innerText + (x.classList.contains('on') ? ' *' : '')));
out.first = (await dwt()).slice(0, 420);
await p.locator('#dw').screenshot({ path: shots + '/mp-1.png' });
for (const lab of ['Veg / Non-Veg', 'Regular booking', 'Black Friday', 'Student']) {
  const t = p.locator('#dwB .tabs button', { hasText: lab }).first();
  if (await t.count()) { await t.click(); await p.waitForTimeout(250); const s = await dwt(); out[lab] = s.slice(0, 300) + ' … dishes: ' + (s.match(/(\d+) dishes/) || [])[1]; }
}
const t2 = p.locator('#dwB .tabs button', { hasText: 'Regular booking' }).first(); if (await t2.count()) { await t2.click(); await p.waitForTimeout(200); await p.locator('#dw').screenshot({ path: shots + '/mp-reg.png' }); }
// pick an offer from inside the panel
const t3 = p.locator('#dwB .tabs button', { hasText: process.env.USE_TAB || 'Student' }).first();
if (await t3.count()) { await t3.click(); await p.waitForTimeout(200); await p.locator('#dwB [data-use]').click(); await p.waitForTimeout(300); out.afterUse = { open: await p.evaluate(() => document.getElementById('dw').open), picked: await p.evaluate(() => (curOffer() || {}).name) }; }
// send menu & price
await p.evaluate(() => { const d = document.getElementById('dw'); if (d.open) d.close(); });
await p.locator('#mob').fill('9123456780'); await p.locator('#mob').dispatchEvent('input'); await p.waitForTimeout(300);
await p.locator('#dls [data-bmenu]').first().click(); await p.waitForTimeout(300);
await p.locator('#dwB [data-send="bmenu"]').click(); await p.waitForTimeout(400);
out.sendTitle = await p.locator('#sdT').innerText().catch(() => '');
out.sendMsg = (await p.evaluate(() => { const d = [...document.querySelectorAll('dialog')].find(x => x.open && x.id !== 'dw'); return d ? d.innerText : ''; })).replace(/\s+/g, ' ').slice(0, 420);
out.overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
out.errs = errs;
console.log(JSON.stringify(out, null, 1));
await b.close();
