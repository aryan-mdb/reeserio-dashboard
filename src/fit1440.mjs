// How booking-16 fits at common desktop widths: rows used by the date pills, the outlet buttons and the time
// pills, the two column widths, and screenshots (page, offers drawer, WhatsApp preview).
import { chromium } from 'playwright-core';
const [, , dir, out] = process.argv;
const b = await chromium.launch({ channel: 'chrome', headless: true });
const errs = [];
for (const [w, h] of [[1440, 900], [1366, 768], [1536, 864], [1920, 1080]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  p.on('pageerror', e => errs.push(w + ': ' + e.message));
  await p.goto('file:///' + dir + '/booking-16.html'); await p.waitForTimeout(400);
  await p.fill('#mob', '9876543210'); await p.waitForTimeout(300); await p.click('#slots .pl >> nth=2'); await p.waitForTimeout(200);
  const rows = s => p.$$eval(s, e => new Set(e.map(x => Math.round(x.getBoundingClientRect().top))).size);
  const r = { left: await p.$eval('.lay>.card', e => Math.round(e.getBoundingClientRect().width)), right: await p.$eval('.dside', e => Math.round(e.getBoundingClientRect().width)),
    dateRows: await rows('#days .pl'), actRows: await rows('.acts .lk'), timeRows: await rows('#slots .pl'), guestRows: await rows('.g1>div'),
    createVisible: await p.$eval('#create', e => e.getBoundingClientRect().bottom <= innerHeight), o: await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) };
  console.log(w, JSON.stringify(r));
  await p.screenshot({ path: `${out}/fit-${w}.png` });
  if (w === 1440) {
    await p.click('#ofBtn'); await p.waitForTimeout(1200); await p.screenshot({ path: `${out}/fit-${w}-offers.png` });
    console.log('  drawer send buttons with WA icon', await p.$$eval('#dwB [data-send] .wai', e => e.length), '/', await p.$$eval('#dwB [data-send]', e => e.length));
    await p.click('#dwB [data-send=offer] >> nth=0'); await p.waitForTimeout(1200); await p.screenshot({ path: `${out}/fit-${w}-wa.png` });
    console.log('  dialog WA icon', await p.$$eval('#sd [data-ch=WhatsApp] .wai', e => e.length)); await p.click('#sdX'); await p.click('#dwX');
    await p.click('#oInfo'); console.log('  outlet panel WA icons', await p.$$eval('#dwB [data-send] .wai', e => e.length), '/', await p.$$eval('#dwB [data-send]', e => e.length)); await p.click('#dwX');
  }
}
console.log('errors', errs); await b.close();
