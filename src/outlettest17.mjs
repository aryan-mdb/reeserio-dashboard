import { chromium } from 'playwright-core';
const [, , dir, out] = process.argv;
const b = await chromium.launch({ channel: 'chrome', headless: true });
const errs = [];
for (const [w, h, scheme] of [[1600, 1000, 'light'], [1600, 1000, 'dark'], [390, 844, 'light']]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme })).newPage();
  p.on('pageerror', e => errs.push(w + scheme + ': ' + e.message));
  await p.goto('file:///' + dir + '/booking-17.html'); await p.waitForTimeout(400);
  const tag = `${w}-${scheme}`;
  const imgs = async () => { await p.waitForTimeout(2500); return p.$$eval('#dw img', im => ({ n: im.length, loaded: im.filter(i => i.complete && i.naturalWidth > 0).length })); };
  await p.click('#oInfo'); console.log(tag, 'details tab:', JSON.stringify(await imgs()), '| tabs', await p.$$eval('#dwB .tabs button', e => e.map(x => x.textContent).join('/')), '| sub', await p.textContent('#dwS'));
  console.log('  phone/map links', await p.$$eval('#dwB a', e => e.map(a => a.textContent.trim()).join(' | ')));
  await p.screenshot({ path: `${out}/o16-${tag}-details.png` });
  await p.click('#dwB [data-tab=m]'); console.log('  menu tab:', JSON.stringify(await imgs()));
  await p.screenshot({ path: `${out}/o16-${tag}-menu.png` });
  await p.click('#dwB [data-lb=menu][data-i="2"]'); await p.waitForTimeout(1500);
  console.log('  viewer:', await p.textContent('#lbN'), 'loaded', await p.$eval('#lbImg', i => i.naturalWidth > 0));
  await p.screenshot({ path: `${out}/o16-${tag}-viewer.png` });
  await p.keyboard.press('ArrowRight'); console.log('  -> next', await p.textContent('#lbN')); await p.click('#lbX');
  await p.click('#dwB .tabs button[data-t=d]'); console.log('  deals rows', await p.$$eval('#dwB .li', e => e.length));
  await p.click('#dwB [data-alldeals]'); console.log('  all deals rows', await p.$$eval('#dwB .li', e => e.length));
  await p.click('#dwB .tabs button[data-t=n]'); console.log('  nearby:', (await p.$$eval('#dwB .li .m', e => e.slice(0, 3).map(x => x.innerText.replace(/\n/g, ' ')))).join(' | '));
  await p.click('#dwX');
  await p.click('#oMenu'); console.log('  View menu opens tab:', await p.$eval('#dwB .tabs .on', e => e.textContent)); await p.click('#dwX');
  await p.fill('#mob', '9876543210'); await p.waitForTimeout(100);
  await p.click('#sendMenu'); await p.waitForTimeout(1500);
  console.log('  send menu:', await p.textContent('#sdTpl .tg'), '| images', await p.$$eval('#waB img', e => e.length), '| msg', (await p.inputValue('#sdM')).replace(/\n/g, ' / '));
  await p.screenshot({ path: `${out}/o16-${tag}-sendmenu.png` }); await p.click('#sdX');
  await p.click('#sendOut'); console.log('  send outlet msg:', (await p.inputValue('#sdM')).replace(/\n/g, ' / ')); await p.click('#sdX');
  await p.click('#ofBtn'); console.log('  offers:', JSON.stringify(await imgs()), (await p.$$eval('#dwB .li .m b', e => e.map(x => x.textContent))).slice(0, 2).join(' | '));
  await p.click('#dwB [data-send=offer] >> nth=3'); console.log('  offer msg:', (await p.inputValue('#sdM')).replace(/\n/g, ' / ')); await p.click('#sdX'); await p.click('#dwX');
  // another outlet: falls back cleanly
  await p.selectOption('#outlet', 'Korum Mall Thane'); await p.click('#oInfo'); console.log('  other outlet:', (await p.textContent('#dwB')).slice(0, 120)); await p.click('#dwX');
  console.log('  overflow', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
}
console.log('errors', errs); await b.close();
