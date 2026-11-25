import { chromium } from 'playwright-core';
const [, , dir, out] = process.argv;
const b = await chromium.launch({ channel: 'chrome', headless: true });
const errs = [];
for (const [w, h, scheme] of [[1600, 1000, 'light'], [1600, 1000, 'dark'], [390, 844, 'light']]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme })).newPage();
  p.on('pageerror', e => errs.push(w + scheme + ': ' + e.message));
  await p.goto('file:///' + dir + '/booking-16.html'); await p.waitForTimeout(400);
  await p.fill('#mob', '9876543210'); await p.waitForTimeout(300); await p.click('#slots .pl >> nth=2');
  const shot = async (name) => { await p.waitForTimeout(1800); const r = await p.evaluate(() => ({ imgs: [...document.querySelectorAll('#waB img')].map(i => i.naturalWidth > 0), btns: [...document.querySelectorAll('#waB .wa-btn')].map(a => a.textContent.trim() + ' -> ' + a.getAttribute('href').slice(0, 45)), tpl: document.querySelector('#sdTpl').innerText.split('\n')[0], body: document.querySelector('#waB .wa-txt').innerText.slice(0, 70).replace(/\n/g, ' / ') })); console.log(w, scheme, name, JSON.stringify(r)); await p.screenshot({ path: `${out}/wa-${w}-${scheme}-${name}.png` }); };
  await p.click('#sendOut'); await shot('outlet'); await p.click('#sdX');
  await p.click('#sendMenu'); await shot('menu'); await p.click('#sdX');
  await p.click('#oInfo'); await p.click('#dwB [data-send=location]'); await shot('location'); await p.click('#sdX'); await p.click('#dwX');
  await p.click('#ofBtn'); await p.click('#dwB [data-send=offer] >> nth=1'); await shot('offer'); await p.click('#sdX'); await p.click('#dwX');
  await p.click('#hcBtn'); await p.click('#dwB [data-send=card] >> nth=1'); await shot('card');
  await p.click('#sd [data-ch=copy]'); console.log('  copy toast', await p.textContent('#toast'));
  await p.click('#sd [data-ch=WhatsApp]'); console.log('  send toast', await p.textContent('#toast'), '| open', await p.$eval('#sd', d => d.open));
  if (await p.$eval('#dw', d => d.open)) await p.click('#dwX');
  console.log('  overflow', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
}
console.log('errors', errs); await b.close();
