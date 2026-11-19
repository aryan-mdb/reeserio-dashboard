// Read-only: open the live account menu (top-right person icon) and, if it has user / role pages,
// open them and record table headers, buttons and the list API responses. Nothing is submitted.
import { chromium } from 'playwright-core';
import fs from 'fs';
const OUT = process.argv[2];
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const cap = []; let cur = 'login';
p.on('response', async r => { const ct = r.headers()['content-type'] || ''; if (!/json/.test(ct)) return; let body = ''; try { body = await r.text(); } catch {} cap.push({ page: cur, u: r.url(), m: r.request().method(), req: (r.request().postData() || '').slice(0, 600), body: body.slice(0, 900000) }); });
await p.goto('https://reeserio.bnhl.in/main/booking', { waitUntil: 'domcontentloaded', timeout: 60000 });
const pw = p.locator('input[type=password]'); await pw.first().waitFor({ timeout: 20000 });
await p.getByPlaceholder('Enter User Name').pressSequentially(process.env.RU, { delay: 20 });
await pw.first().pressSequentially(process.env.RP, { delay: 20 });
await p.getByRole('button', { name: 'Login' }).click();
await p.waitForURL(u => !u.toString().includes('/login'), { timeout: 30000 }); await p.waitForTimeout(3000);
const openAcct = async () => { await p.mouse.click(1405, 32); await p.waitForTimeout(1200); };
await openAcct();
const menu = await p.evaluate(() => { const vis = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.top > 40 && r.top < 500 && r.left > 1000 && e.children.length === 0 && e.innerText && e.innerText.trim(); }); return [...new Set(vis.map(e => e.innerText.trim()))].slice(0, 40); });
console.log('ACCOUNT MENU:', menu.join(' | '));
await p.screenshot({ path: OUT + '/acct-menu.png' });
const pages = {};
for (const label of menu.filter(t => /user|role|permission|access|setting|admin/i.test(t) && !/logout/i.test(t))) {
  cur = label;
  try {
    await p.keyboard.press('Escape'); await p.waitForTimeout(300); await openAcct();
    await p.evaluate(t => { const e = [...document.querySelectorAll('body *')].filter(e => e.children.length === 0 && e.innerText && e.innerText.trim() === t).at(-1); e && e.click(); }, label);
    await p.waitForTimeout(5000);
    pages[label] = await p.evaluate(() => ({
      url: location.pathname,
      heads: [...document.querySelectorAll('table thead tr')].slice(0, 2).map(tr => [...tr.children].map(th => th.innerText.trim()).filter(Boolean)),
      buttons: [...document.querySelectorAll('button')].filter(e => e.offsetParent).map(e => e.innerText.trim()).filter(Boolean).slice(0, 40),
      text: (document.querySelector('main, app-root') || document.body).innerText.slice(0, 3000),
    }));
    await p.screenshot({ path: `${OUT}/acct-${label.replace(/\W+/g, '_')}.png` });
    console.log('PAGE', label, pages[label].url, JSON.stringify(pages[label].heads).slice(0, 300), '| buttons:', pages[label].buttons.join(',').slice(0, 200));
  } catch (e) { console.log('fail', label, e.message.slice(0, 100)); }
}
fs.writeFileSync(OUT + '/acct.json', JSON.stringify({ menu, pages, cap }));
console.log('APIs:', [...new Set(cap.filter(c => c.page !== 'login').map(c => c.page + ' ' + c.m + ' ' + c.u.replace(/^https:\/\/[^/]+/, '').slice(0, 90)))].join('\n'));
await b.close();
