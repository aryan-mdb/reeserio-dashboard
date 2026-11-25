// Buffet menu per offer, the per-offer sum, sending an offer / a buffet menu on WhatsApp.
import { chromium } from 'playwright-core';
const [, , dir, out] = process.argv;
const b = await chromium.launch({ channel: 'chrome', headless: true });
const errs = [];
for (const [w, h, scheme] of [[1440, 900, 'light'], [1440, 900, 'dark'], [390, 844, 'light']]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme })).newPage();
  p.on('pageerror', e => errs.push(w + scheme + ': ' + e.message));
  await p.goto('file:///' + dir + '/booking-17.html'); await p.waitForTimeout(400);
  await p.fill('#mob', '9876543210'); await p.waitForTimeout(300);
  await p.click('#days .dp[data-i="1"]'); for (let i = 0; i < 2; i++) await p.click('.cnt[data-k=adults] [data-d="1"]');
  await p.click('.cnt[data-k=kids] [data-d="1"]'); await p.click('[data-pick]'); await p.waitForTimeout(200);
  const tag = `${w}-${scheme}`, txt = s => p.$eval(s, e => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => '(none)');
  console.log(tag, 'rows:', JSON.stringify(await p.$$eval('#dls .of', r => r.slice(0, 3).map(x => x.querySelector('.nm').innerText.replace(/\s+/g, ' ') + ' || ' + (x.querySelector('.calc')?.innerText || '-')))));
  const picked = await txt('#dls .of.on .nm');
  // Non-veg menu button on the 2nd row must not change the picked offer
  await p.click('#dls .of >> nth=1 >> [data-bmenu]'); await p.waitForTimeout(200);
  console.log('  menu:', await txt('#dwT'), '|', (await txt('#dwB .bmh')), '| sections', await p.$$eval('#dwB .bml', e => e.length), '| picked still', (await txt('#dls .of.on .nm')) === picked);
  await p.screenshot({ path: `${out}/m17-${tag}-menu.png` });
  await p.click('#dwB [data-send=bmenu]'); await p.waitForTimeout(800);
  console.log('  send menu:', await txt('#sdT'), '|', (await p.$eval('#waB .wa-txt', e => e.innerText)).replace(/\n/g, ' / ').slice(0, 220));
  await p.click('#sdX'); await p.click('#dwX');
  // Send offer on the picked row: full details
  await p.click('#dls .of.on [data-send=deal]'); await p.waitForTimeout(900);
  console.log('  send offer:', await txt('#sdT'), '|', (await p.$eval('#waB .wa-txt', e => e.innerText)).replace(/\n/g, ' / ').slice(0, 420), '| tpl', await txt('#sdTpl .tg'), '| picked still', (await txt('#dls .of.on .nm')) === picked);
  await p.screenshot({ path: `${out}/m17-${tag}-offer.png` }); await p.click('#sdX');
  // the outlet's Send menu now sends the picked offer's buffet menu
  await p.click('#sendMenu'); await p.waitForTimeout(500);
  console.log('  outlet Send menu:', (await p.$eval('#waB .wa-txt', e => e.innerText)).replace(/\n/g, ' / ').slice(0, 140)); await p.click('#sdX');
  // veg menu from the buffet prices panel
  await p.click('[data-prices] >> nth=0'); await p.click('#dwB [data-bmenu="VEG"]'); await p.waitForTimeout(200);
  console.log('  veg menu:', await txt('#dwT'), '|', await txt('#dwB .bmh'), '| non-veg items shown', await p.$$eval('#dwB .vd.n', e => e.length)); await p.click('#dwX');
  console.log('  overflow', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
}
console.log('errors', errs); await b.close();
