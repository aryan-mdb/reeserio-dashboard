import { chromium } from 'playwright-core';
const [, , dir] = process.argv;
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 2560, height: 1200 } });
const p = await ctx.newPage();
for (const f of ['dashboard.html', 'booking-15.html', 'app.html#/leads', 'app.html#/home', 'app.html#/users']) {
  await p.goto('file:///' + dir + '/' + f); await p.waitForTimeout(350);
  console.log(f.padEnd(18), JSON.stringify(await p.evaluate(() => { const m = document.querySelector('main.wrap'); return { max: getComputedStyle(m).maxWidth, w: Math.round(m.getBoundingClientRect().width), o: document.documentElement.scrollWidth - innerWidth, cb: document.querySelector('.hdr .cb, a.cb')?.getAttribute('href'), dom: [...document.querySelectorAll('a')].find(a => /Domestic Booking/.test(a.textContent))?.getAttribute('href') } })));
}
await b.close();
