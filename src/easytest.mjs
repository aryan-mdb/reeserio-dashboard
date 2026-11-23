import { chromium } from 'playwright-core';
const [, , dir, out] = process.argv;
const b = await chromium.launch({ channel: 'chrome', headless: true });
const errs = [];
for (const [w, h, scheme] of [[1440, 900, 'light'], [1440, 900, 'dark'], [2560, 1300, 'light'], [390, 844, 'light']]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme })).newPage();
  p.on('pageerror', e => errs.push(w + scheme + ': ' + e.message));
  await p.goto('file:///' + dir + '/booking-16.html'); await p.waitForTimeout(400);
  const tag = `${w}-${scheme}`;
  const st = () => p.evaluate(() => ({ sum: document.querySelector('#sum').innerText.replace(/\s+/g, ' '), deal: document.querySelector('#deal select')?.selectedOptions[0]?.textContent, tot: document.querySelector('#eT').textContent, can: !document.querySelector('#create').disabled, o: document.documentElement.scrollWidth - innerWidth }));
  console.log(tag, 'start', JSON.stringify(await st()), 'focus', await p.evaluate(() => document.activeElement.id));
  await p.screenshot({ path: `${out}/e16-${tag}-0.png` });
  await p.fill('#mob', '9876543210'); console.log('  focus after mobile:', await p.evaluate(() => document.activeElement.id));
  await p.fill('#nm', 'Rahul Sharma'); await p.click('.cnt[data-k=adults] [data-d="1"]'); await p.click('.cnt[data-k=adults] [data-d="1"]');
  console.log('  no time yet', JSON.stringify(await st()));
  await p.click('#slots .pl >> nth=2'); await p.waitForTimeout(80);
  console.log('  with time', JSON.stringify(await st()), 'focus', await p.evaluate(() => document.activeElement.id));
  await p.screenshot({ path: `${out}/e16-${tag}-1.png`, fullPage: true });
  await p.selectOption('#deal select', 'REG'); console.log('  regular', JSON.stringify(await st()));
  await p.click('#days .pl >> nth=1'); console.log('  date change clears time', JSON.stringify(await st()));
  await p.click('#slots .pl >> nth=0'); await p.click('#exBtn'); await p.selectOption('#occ', 'Birthday'); await p.fill('#ins', 'Window seat');
  await p.click('#create'); await p.waitForTimeout(500);
  console.log('  ticket', await p.evaluate(() => ({ open: document.querySelector('#bt').open, total: document.querySelector('.tt2 b')?.textContent, rows: [...document.querySelectorAll('.bg2 div')].map(d => d.innerText.replace(/\n/g, ': ')).join(' | ') })));
  await p.click('.ba2 [data-a="nb"]'); await p.waitForTimeout(150);
  console.log('  after new', JSON.stringify(await st()), 'extra hidden', await p.$eval('#extra', e => e.hidden));
}
console.log('errors', errs); await b.close();
