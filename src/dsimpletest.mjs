import { chromium } from 'playwright-core';
const [, , dir, out] = process.argv;
const b = await chromium.launch({ channel: 'chrome', headless: true });
const errs = [];
for (const [w, h, scheme] of [[1440, 900, 'light'], [1440, 900, 'dark'], [1920, 1080, 'light'], [1024, 768, 'light'], [390, 844, 'light']]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme })).newPage();
  p.on('pageerror', e => errs.push(w + scheme + ': ' + e.message));
  await p.goto('file:///' + dir + '/dashboard-simple.html'); await p.waitForTimeout(500);
  const r = await p.evaluate(() => ({
    theme: document.documentElement.dataset.theme, h: document.documentElement.scrollHeight, o: document.documentElement.scrollWidth - innerWidth,
    kpis: [...document.querySelectorAll('.k')].map(k => k.innerText.replace(/\s+/g, ' ')),
    mods: document.querySelectorAll('#go a').length, bars: document.querySelectorAll('#chart rect').length,
    agents: [...document.querySelectorAll('#ag .n')].map(e => e.textContent),
    bright: [...document.querySelectorAll('body *')].filter(e => { if (!e.offsetParent) return false; const c = getComputedStyle(e).backgroundColor.match(/\d+(\.\d+)?/g); if (!c) return false; const [r, g, bl, a = 1] = c.map(Number); const q = e.getBoundingClientRect(); return document.documentElement.dataset.theme === 'dark' && a > .5 && r + g + bl > 600 && q.width * q.height > 400; }).map(e => e.tagName + '.' + e.className).slice(0, 5),
    barFill: getComputedStyle(document.querySelector('#chart .ot')).fill,
  }));
  console.log(w, scheme, JSON.stringify(r));
  await p.screenshot({ path: `${out}/ds-${w}-${scheme}.png`, fullPage: true });
}
console.log('errors', errs); await b.close();
