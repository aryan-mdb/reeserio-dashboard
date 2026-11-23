// Screenshot every app route, then lay them out 3x2 per contact sheet so the whole app can be reviewed at a glance.
import { chromium } from 'playwright-core';
import fs from 'fs';
const [, , dir, out, tag = 'sv'] = process.argv;
const routes = ['home', 'leads', 'leads-new', 'lead-dashboard', 'followups', 'advance', 'payment-links', 'coupons', 'quotations', 'call-review', 'tl-review', 'cater', 'instructions', 'offers', 'did', 'slots', 'reservation-view', 'reservation-report', 'intl-leads', 'intl-booking', 'toscano-leads', 'toscano-booking', 'users', 'roles'];
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
const info = [];
for (const r of routes) {
  await p.goto('file:///' + dir + '/app.html#/' + r); await p.waitForTimeout(450);
  const m = await p.evaluate(() => ({ h: document.documentElement.scrollHeight, o: document.documentElement.scrollWidth - innerWidth, title: document.querySelector('h1,.pht h1,.ph h1')?.textContent?.trim(), upper: [...document.querySelectorAll('main *')].filter(e => e.children.length === 0 && e.offsetParent && getComputedStyle(e).textTransform === 'uppercase').length, inputs: document.querySelectorAll('main input,main select').length, buttons: document.querySelectorAll('main button').length }));
  info.push(r + ' ' + JSON.stringify(m));
  await p.screenshot({ path: `${out}/${tag}-${r}.png` });
}
fs.writeFileSync(`${out}/${tag}-info.txt`, info.join('\n'));
console.log(info.join('\n'));
for (let i = 0; i < routes.length; i += 6) {
  const set = routes.slice(i, i + 6);
  const html = `<body style="margin:0;background:#888;display:grid;grid-template-columns:repeat(3,720px);gap:6px;font:14px sans-serif">${set.map(r => `<div><div style="background:#000;color:#fff;padding:2px 6px">${r}</div><img src="file:///${out.replace(/\\/g, '/')}/${tag}-${r}.png" style="width:720px;display:block"></div>`).join('')}</body>`;
  fs.writeFileSync(`${out}/${tag}-sheet.html`, html);
  await p.setViewportSize({ width: 2172, height: 960 });
  await p.goto('file:///' + out.replace(/\\/g, '/') + `/${tag}-sheet.html`); await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/${tag}-sheet${i / 6 + 1}.png`, fullPage: true });
  await p.setViewportSize({ width: 1440, height: 900 });
}
console.log('errors', errs); await b.close();
