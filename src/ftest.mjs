import { chromium } from 'playwright-core';
const [, , dir, out] = process.argv;
const b = await chromium.launch({ channel: 'chrome', headless: true });
const errs = [];
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.on('pageerror', e => errs.push(e.message));
await p.goto('file:///' + dir + '/app.html#/leads'); await p.waitForTimeout(400);
const st = () => p.evaluate(() => ({
  info: document.querySelector('.pg .info')?.innerText.replace(/\s+/g, ' ').trim(),
  rows: document.querySelectorAll('tbody tr[data-i]').length,
  toolbarRow: !!document.querySelector('.tb'), chips: document.querySelectorAll('.fchips,[data-fx]').length,
  inHeader: ['#q', '#fbtn', '#exp'].map(s => !!document.querySelector('.ph ' + s)).join(','),
  fbtn: document.querySelector('#fbtn')?.innerText.replace(/\n/g, ' '),
  popupOpen: !!document.querySelector('#dlg[open] #fp')
}));
console.log('start', JSON.stringify(await st()));
await p.click('#fbtn'); await p.waitForTimeout(200);
console.log('popup open?', await p.evaluate(() => !!document.querySelector('#dlg[open] #fp')));
const fields = await p.evaluate(() => [...document.querySelectorAll('#fp .fi > span')].map(s => s.textContent).join(', '));
console.log('fields:', fields);
await p.screenshot({ path: out + '/f-popup.png' });
await p.selectOption('#fp select[data-f="Status"]', 'New'); await p.selectOption('#fp select[data-f="Source"]', 'Reservation Drop');
await p.click('#fpApply'); await p.waitForTimeout(200); console.log('status+source', JSON.stringify(await st()));
await p.screenshot({ path: out + '/f-applied.png' });
await p.click('#fbtn'); await p.waitForTimeout(100);
console.log('kept in popup', await p.evaluate(() => document.querySelector('#fp select[data-f="Status"]').value));
await p.keyboard.press('Escape'); await p.waitForTimeout(100); console.log('escape', JSON.stringify(await st()));
await p.click('#fbtn'); await p.fill('#fp input[data-f="Contact Number"]', '95'); await p.keyboard.press('Enter'); await p.waitForTimeout(150); console.log('contact 95 (Enter)', JSON.stringify(await st()));
await p.fill('#q', 'a'); await p.waitForTimeout(100); await p.type('#q', 'r'); console.log('search keeps focus', await p.evaluate(() => document.activeElement.id + '=' + document.activeElement.value));
await p.fill('#q', '');
await p.click('#fbtn'); await p.click('#fpClear'); await p.waitForTimeout(150); console.log('clear all', JSON.stringify(await st()));
for (const r of ['payment-links', 'coupons', 'advance', 'call-review', 'intl-leads', 'cater', 'instructions', 'offers', 'slots', 'did', 'users', 'quotations', 'tl-review']) {
  await p.evaluate(r => location.hash = '#/' + r, r); await p.waitForTimeout(150);
  await p.click('#fbtn'); await p.waitForTimeout(100);
  const n = await p.evaluate(() => document.querySelectorAll('#fp .fi').length);
  const sel = await p.$('#fp select'); let picked = '';
  if (sel) { picked = await p.evaluate(s => { s.selectedIndex = 1; return s.dataset.f + '=' + s.value; }, sel); }
  await p.click('#fpApply'); await p.waitForTimeout(100);
  const c = await p.evaluate(() => document.querySelector('#fbtn').innerText.replace(/\n/g, ' ') + ' | rows ' + document.querySelectorAll('tbody tr[data-i]').length + ' | o' + (document.documentElement.scrollWidth - innerWidth));
  console.log(r.padEnd(14), n + ' filters', picked, '->', c);
}
await p.evaluate(() => location.hash = '#/leads'); await p.waitForTimeout(150); await p.screenshot({ path: out + '/f-header.png' });
for (const w of [1100, 1920, 2400]) { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(100); console.log('w' + w, 'overflow', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)); await p.screenshot({ path: out + `/f-header-${w}.png` }); }
const m = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); m.on('pageerror', e => errs.push('phone ' + e.message));
await m.goto('file:///' + dir + '/app.html#/leads'); await m.waitForTimeout(300); await m.screenshot({ path: out + '/f-phone.png' }); await m.click('#fbtn'); await m.waitForTimeout(200);
console.log('phone overflow', await m.evaluate(() => document.documentElement.scrollWidth - innerWidth)); await m.screenshot({ path: out + '/f-phone-popup.png' });
console.log('errors', errs); await b.close();
