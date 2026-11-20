import { chromium } from 'playwright-core';
const [, , dir, out] = process.argv;
const b = await chromium.launch({ channel: 'chrome', headless: true });
const errs = [];
for (const [n, w, h] of [[11, 1440, 900], [12, 1440, 900], [13, 1366, 768], [14, 1440, 900], [11, 390, 844]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  p.on('pageerror', e => errs.push(n + ': ' + e.message));
  await p.goto('file:///' + dir + '/booking-' + n + '.html'); await p.waitForTimeout(400);
  await p.fill('#mob', '9876543210'); await p.fill('#nm', 'Rahul Sharma');
  for (let i = 0; i < 2; i++) await p.click('.cnt[data-k=adults] [data-d="1"]');
  await p.click('#slots .st >> nth=1'); await p.selectOption('#occ', 'Birthday'); await p.fill('#ins', 'Window seat');
  await p.click('#create'); await p.waitForTimeout(500);
  const r = await p.evaluate(() => ({ open: document.querySelector('#bt').open, id: document.querySelector('.bid b')?.textContent, total: document.querySelector('.tt2 b')?.textContent, rows: [...document.querySelectorAll('.bg2 div')].map(d => d.innerText.replace(/\n/g, ': ')).join(' | ') }));
  console.log(n, w, JSON.stringify(r));
  await p.screenshot({ path: `${out}/tk-${n}-${w}.png` });
  await p.click('.ba2 [data-a="nb"]'); await p.waitForTimeout(200);
  console.log('   after New booking:', await p.evaluate(() => ({ dlg: document.querySelector('#bt').open, mob: document.querySelector('#mob').value })));
}
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('file:///' + dir + '/app.html#/instructions'); await p.waitForTimeout(400);
console.log('stop booking KPI bg:', await p.evaluate(() => getComputedStyle([...document.querySelectorAll('.kps b')].find(b => b.textContent === '275')).backgroundImage.slice(0, 30)), 'color', await p.evaluate(() => getComputedStyle([...document.querySelectorAll('.kps b')].find(b => b.textContent === '275')).color));
await p.screenshot({ path: `${out}/instr-fixed.png`, clip: { x: 0, y: 60, width: 1440, height: 320 } });
console.log('errors', errs); await b.close();
