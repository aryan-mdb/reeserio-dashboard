import { chromium } from 'playwright-core';
const [, , file, out, tag = 't'] = process.argv;
const b = await chromium.launch({ channel: 'chrome', headless: true });
const errs = [];
const g = p => p.evaluate(() => ({ pkg: document.querySelector('.dc.on .nm')?.textContent, best: document.querySelector('.dc .best')?.parentElement.querySelector('.nm').textContent, est: document.querySelector('#eT').textContent, save: document.querySelector('#sv').textContent }));
for (const [w, h, name] of [[1440, 900, 'desk'], [1366, 768, 'lap'], [390, 844, 'phone']]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })).newPage();
  p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(name + ': ' + m.text()));
  await p.goto('file:///' + file); await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/${tag}-${name}-0.png`, fullPage: true });
  await p.keyboard.type('9876543210'); await p.keyboard.type('Rahul Sharma');
  await p.click('#slots .st >> nth=1');
  const two = await g(p); const create = await p.evaluate(() => !document.querySelector('#create').disabled);
  for (let i = 0; i < 2; i++) await p.click('.cnt[data-k=adults] [data-d="1"]');
  const four = await g(p);
  for (let i = 0; i < 2; i++) await p.click('.cnt[data-k=adults] [data-d="1"]');
  const six = await g(p);
  await p.click('.dc[data-k="VEG"]');
  const manual = await g(p);
  const o = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log(name, JSON.stringify({ create, two, four, six, manual, o }));
  await p.mouse.move(0, 0); await p.screenshot({ path: `${out}/${tag}-${name}-1.png`, fullPage: true });
}
console.log('errors', errs);
await b.close();
