import { chromium } from 'playwright-core';
const [, , dir, out, mob] = process.argv;
const b = await chromium.launch({ channel: 'chrome', headless: true });
const errs = [];
for (const [w, h] of [[1600, 1000], [390, 844]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  p.on('pageerror', e => errs.push(w + ': ' + e.message));
  await p.goto('file:///' + dir + '/booking-16.html'); await p.waitForTimeout(400);
  await p.fill('#mob', mob); await p.waitForTimeout(400);
  const t = s => p.$eval(s, e => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => '(none)');
  console.log(w, 'strip:', await t('#cust'), '| name:', await p.inputValue('#nm'), '| toast:', await t('#toast'));
  await p.click('#hist'); await p.waitForTimeout(150);
  console.log('  title:', await t('#dwT'), '|', await t('#dwS'));
  console.log('  rows:', await p.$$eval('#dwB .li', e => e.length), '| first:', (await p.$$eval('#dwB .li', e => e.slice(0, 2).map(x => x.innerText.replace(/\s+/g, ' ')))).join(' || '));
  console.log('  status colours:', JSON.stringify(await p.$$eval('#dwB .st2', e => [...new Set(e.map(x => x.textContent + ':' + x.className.replace('st2 ', '')))])));
  await p.screenshot({ path: `${out}/c16-${w}-hist.png` });
  await p.click('#dwB .tabs button[data-t=c]'); console.log('  calls:', await t('#dwB .note'));
  await p.click('#dwB .tabs button[data-t=s]'); console.log('  summary:', await t('#dwB .kv2'));
  await p.click('#dwX');
  await p.click('#slots .pl >> nth=1'); console.log('  loyalty:', await t('#est .loy'));
  // a different number clears it; the sample still works
  await p.fill('#mob', '9123456780'); await p.waitForTimeout(300); console.log('  other number:', await t('#cust'));
  await p.fill('#nm', ''); await p.fill('#mob', '9876543210'); await p.waitForTimeout(300); console.log('  sample:', (await t('#cust')).slice(0, 80));
  console.log('  overflow', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), '| number in page source:', await p.evaluate(m => document.documentElement.outerHTML.split(m).length - 1, mob));
}
console.log('errors', errs); await b.close();
