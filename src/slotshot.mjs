import { chromium } from 'playwright-core';
const [, , dir, out] = process.argv;
const b = await chromium.launch({ channel: 'chrome', headless: true });
const errs = [];
for (const [n, w, h, scheme] of [[11, 1440, 900, 'light'], [11, 1440, 900, 'dark'], [12, 1440, 900, 'light'], [11, 390, 844, 'light']]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme })).newPage();
  p.on('pageerror', e => errs.push(n + ': ' + e.message));
  await p.goto('file:///' + dir + '/booking-' + n + '.html'); await p.waitForTimeout(400);
  await p.click('#slots .st >> nth=2'); await p.waitForTimeout(150);
  const box = await p.locator('#slots').boundingBox();
  const info = await p.evaluate(() => ({ tiles: document.querySelectorAll('#slots .st').length, on: document.querySelector('#slots .st.on .st-t')?.innerText, groups: [...document.querySelectorAll('.sgl')].map(e => e.textContent), lowTag: document.querySelectorAll('#slots .lo').length, note: document.querySelector('#tX').innerText, o: document.documentElement.scrollWidth - innerWidth }));
  console.log(n, w, scheme, JSON.stringify(info));
  await p.screenshot({ path: `${out}/slot-${n}-${w}-${scheme}.png`, clip: { x: 0, y: Math.max(0, box.y - 140), width: w, height: Math.min(h, box.height + 260) } });
}
console.log('errors', errs); await b.close();
