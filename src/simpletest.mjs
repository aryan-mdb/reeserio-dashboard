import { chromium } from 'playwright-core';
const [, , dir, out] = process.argv;
const b = await chromium.launch({ channel: 'chrome', headless: true });
const errs = [];
const state = p => p.evaluate(() => ({ cur: document.querySelector('.step.cur')?.dataset.s, steps: [...document.querySelectorAll('.step')].map(s => s.className.replace('step ', '') + ':' + s.querySelector('.sum').innerText.replace(/\s+/g, ' ').trim()), o: document.documentElement.scrollWidth - innerWidth }));
for (const [w, h, scheme] of [[1440, 900, 'light'], [1440, 900, 'dark'], [390, 844, 'light']]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme })).newPage();
  p.on('pageerror', e => errs.push(w + scheme + ': ' + e.message));
  await p.goto('file:///' + dir + '/booking-15.html'); await p.waitForTimeout(400);
  const tag = `${w}-${scheme}`;
  await p.screenshot({ path: `${out}/s15-${tag}-1.png` });
  console.log(tag, 'start', JSON.stringify(await state(p)), 'next disabled', await p.$eval('[data-next="1"]', e => e.disabled));
  await p.fill('#mob', '5876543210'); console.log('  bad mobile msg:', await p.textContent('#mobErr'));
  await p.fill('#mob', '9876543210'); console.log('  focus after mobile:', await p.evaluate(() => document.activeElement.id));
  await p.fill('#nm', 'Rahul Sharma'); await p.click('.cnt[data-k=adults] [data-d="1"]'); await p.click('.cnt[data-k=adults] [data-d="1"]');
  await p.press('#nm', 'Enter'); await p.waitForTimeout(100);
  console.log('  after Enter', JSON.stringify(await state(p)), 'focus', await p.evaluate(() => document.activeElement.id));
  await p.click('#days .dy >> nth=1'); await p.screenshot({ path: `${out}/s15-${tag}-2.png` });
  await p.click('[data-next="2"]'); await p.waitForTimeout(100);
  await p.screenshot({ path: `${out}/s15-${tag}-3.png` });
  console.log('  step3 times', await p.$$eval('#slots .tm', e => e.length), JSON.stringify(await state(p)));
  await p.click('#slots .tm >> nth=2'); await p.waitForTimeout(100);
  console.log('  step4', JSON.stringify(await state(p)), 'deal:', (await p.textContent('#deal')).trim(), 'total', await p.textContent('#eT'));
  await p.click('#deal .lnk'); await p.waitForTimeout(80);
  await p.screenshot({ path: `${out}/s15-${tag}-4.png`, fullPage: true });
  console.log('  deals listed', await p.$$eval('#dls label', e => e.length));
  // edit step 1 then Next jumps straight back to confirm
  await p.click('.step[data-s="1"] .edit'); await p.fill('#nm', 'Rahul S'); await p.click('[data-next="1"]'); await p.waitForTimeout(80);
  console.log('  after edit guest ->', (await state(p)).cur);
  // change date -> time cleared -> step 3 opens
  await p.click('.step[data-s="2"] .edit'); await p.click('#days .dy >> nth=2'); await p.click('[data-next="2"]'); await p.waitForTimeout(80);
  console.log('  after date change ->', (await state(p)).cur);
  await p.click('#slots .tm >> nth=0'); await p.selectOption('#occ', 'Birthday'); await p.fill('#ins', 'Window seat');
  await p.click('#create'); await p.waitForTimeout(500);
  console.log('  ticket', await p.evaluate(() => ({ open: document.querySelector('#bt').open, total: document.querySelector('.tt2 b')?.textContent, rows: [...document.querySelectorAll('.bg2 div')].map(d => d.innerText.replace(/\n/g, ': ')).join(' | ') })));
  await p.click('.ba2 [data-a="nb"]'); await p.waitForTimeout(150);
  console.log('  new booking ->', JSON.stringify(await state(p)));
  await p.click('#ofBtn'); await p.waitForTimeout(100); console.log('  offers open', await p.$eval('#of', d => d.open), await p.$$eval('#ofb li', e => e.length));
  await p.screenshot({ path: `${out}/s15-${tag}-of.png` });
}
console.log('errors', errs); await b.close();
