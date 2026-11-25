import { chromium } from 'playwright-core';
const [, , dir, out] = process.argv;
const b = await chromium.launch({ channel: 'chrome', headless: true });
const errs = [];
for (const [w, h, scheme] of [[1600, 1000, 'light'], [1600, 1000, 'dark'], [390, 844, 'light']]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme })).newPage();
  p.on('pageerror', e => errs.push(w + scheme + ': ' + e.message));
  await p.goto('file:///' + dir + '/booking-17.html'); await p.waitForTimeout(400);
  const tag = `${w}-${scheme}`, txt = s => p.$eval(s, e => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => '(none)');
  const dwText = async () => (await txt('#dwB')).slice(0, 260);
  // send without mobile -> asks for mobile
  await p.click('#sendOut'); console.log(tag, 'send w/o mobile -> toast:', await txt('#toast'), '| dialog open', await p.$eval('#sd', d => d.open));
  // unknown number
  await p.fill('#mob', '9123456780'); console.log('  unknown guest strip:', await txt('#cust'));
  // sample known guest: name filled
  await p.fill('#mob', ''); await p.fill('#mob', '9876543210'); await p.waitForTimeout(100);
  console.log('  known guest strip:', await txt('#cust'), '| name', await p.inputValue('#nm'));
  await p.click('#hist'); await p.waitForTimeout(150); console.log('  history:', await txt('#dwT'), '|', await dwText());
  await p.click('#dwB .tabs button[data-t=c]'); console.log('  calls:', await dwText());
  await p.click('#dwB .tabs button[data-t=s]'); console.log('  summary:', await dwText());
  await p.screenshot({ path: `${out}/f16-${tag}-hist.png` }); await p.click('#dwX');
  // outlet details + send outlet details + send menu
  await p.click('#oInfo'); await p.waitForTimeout(150); console.log('  outlet:', await dwText());
  await p.screenshot({ path: `${out}/f16-${tag}-outlet.png` });
  await p.click('#dwB [data-send=outlet]'); await p.waitForTimeout(100);
  console.log('  send outlet dialog:', await txt('#sdT'), '|', await txt('#sdTo'), '| msg:', (await p.inputValue('#sdM')).replace(/\n/g, ' / '));
  await p.screenshot({ path: `${out}/f16-${tag}-send.png` });
  await p.click('#sd [data-ch=WhatsApp]'); console.log('  after send:', await txt('#toast'), '| dialog', await p.$eval('#sd', d => d.open));
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  if (await p.$eval('#dw', d => d.open)) await p.click('#dwX');
  await p.click('#sendMenu'); console.log('  send menu msg:', (await p.inputValue('#sdM')).replace(/\n/g, ' / ').slice(0, 160)); await p.click('#sdX');
  // availability drawer
  await p.click('#avBtn'); await p.waitForTimeout(150); console.log('  seats:', await dwText());
  await p.screenshot({ path: `${out}/f16-${tag}-avail.png` });
  await p.click('#dwB .tabs button[data-t=b]'); console.log('  nearby:', (await dwText()).slice(0, 160));
  await p.click('#dwB [data-go] >> nth=0'); await p.waitForTimeout(100); console.log('  outlet now:', await p.inputValue('#outlet'), '| toast', await txt('#toast'));
  await p.selectOption('#outlet', 'Atria Mall, Worli');
  await p.click('#avBtn'); await p.click('#dwB .tabs button[data-t=n]'); await p.click('#dwB [data-nextday]'); await p.waitForTimeout(100);
  console.log('  next day ->', await txt('#days .dp.on'));
  // other date
  await p.fill('#oth', '2026-12-05'); await p.dispatchEvent('#oth', 'change'); await p.waitForTimeout(100);
  console.log('  other date ->', await txt('.dp.oth'), '| read back:', await txt('#rd'));
  await p.click('#days .dp[data-i="0"]');
  console.log('  sold out pills:', await p.$$eval('#slots .tp.so', e => e.map(x => x.innerText.replace(/\s+/g, ' ') + (x.disabled ? ' [disabled]' : ''))), '| dots', await p.$$eval('#slots .tp .dot', e => e.length));
  // deal details + loyalty
  await p.click('#slots .tp:not(.so) >> nth=2'); await p.waitForTimeout(100);
  const inf = await p.$$('#dls .inf[data-k]'); console.log('  deal detail buttons', inf.length);
  if (inf.length) { await inf[0].click(); console.log('  detail text:', (await txt('#dls .ds')).slice(0, 90), '| still picked:', await txt('#dls .of.on .nm')); }
  console.log('  loyalty:', await txt('#est .loy'));
  // offers + happiness card send
  await p.click('#ofBtn'); await p.waitForTimeout(100); console.log('  offers rows', await p.$$eval('#dwB .li', e => e.length));
  await p.click('#dwB [data-send=offer] >> nth=1'); console.log('  offer msg:', (await p.inputValue('#sdM')).replace(/\n/g, ' / ').slice(0, 140)); await p.click('#sdX'); await p.click('#dwX');
  await p.click('#hcBtn'); await p.click('#dwB [data-send=card] >> nth=0'); console.log('  card msg:', (await p.inputValue('#sdM')).replace(/\n/g, ' / ')); await p.click('#sdX'); await p.click('#dwX');
  console.log('  overflow', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), '| create enabled', await p.$eval('#create', e => !e.disabled));
  await p.screenshot({ path: `${out}/f16-${tag}-full.png`, fullPage: true });
}
console.log('errors', errs); await b.close();
