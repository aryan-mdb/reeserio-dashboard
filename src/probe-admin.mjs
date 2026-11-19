// Read-only: Administrator page details. Opens the "Add New User" form only to read its fields (Escape, no submit),
// reads action-icon titles without clicking them, opens the Role & Permission Matrix tab, and GETs each role's permissions.
import { chromium } from 'playwright-core';
import fs from 'fs';
const OUT = process.argv[2];
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
let permReq = null;
p.on('request', r => { if (/Permission\/roles\//.test(r.url()) && !permReq) permReq = { url: r.url(), headers: r.headers() }; });
await p.goto('https://reeserio.bnhl.in/main/booking', { waitUntil: 'domcontentloaded', timeout: 60000 });
const pw = p.locator('input[type=password]'); await pw.first().waitFor({ timeout: 20000 });
await p.getByPlaceholder('Enter User Name').pressSequentially(process.env.RU, { delay: 20 });
await pw.first().pressSequentially(process.env.RP, { delay: 20 });
await p.getByRole('button', { name: 'Login' }).click();
await p.waitForURL(u => !u.toString().includes('/login'), { timeout: 30000 }); await p.waitForTimeout(2500);
await p.goto('https://reeserio.bnhl.in/main/administrator', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(5000);
const out = {};
out.actionTitles = await p.evaluate(() => [...new Set([...document.querySelectorAll('table tbody tr:first-child td:last-child *, table tbody tr:nth-child(2) td:last-child *')].map(e => [e.getAttribute('title'), e.getAttribute('ptooltip'), e.getAttribute('aria-label'), e.className && String(e.className)].filter(Boolean).join(' / ')).filter(Boolean))]);
// Add New User form: open, read labels/placeholders/options, close with Escape (no submit)
await p.getByRole('button', { name: 'Add New User' }).click(); await p.waitForTimeout(1500);
out.addUser = await p.evaluate(() => { const d = [...document.querySelectorAll('.p-dialog, [role=dialog]')].find(x => x.offsetParent) || document; return { title: (d.querySelector('.p-dialog-title, h1, h2, h3, h4') || {}).innerText, labels: [...d.querySelectorAll('label')].map(l => l.innerText.trim()).filter(Boolean), placeholders: [...d.querySelectorAll('input,textarea')].map(i => i.placeholder || i.type).filter(Boolean), buttons: [...d.querySelectorAll('button')].map(x => x.innerText.trim()).filter(Boolean), text: d.innerText.slice(0, 1500) }; });
await p.screenshot({ path: OUT + '/adm-adduser.png' });
await p.keyboard.press('Escape'); await p.waitForTimeout(600);
const cancel = p.getByRole('button', { name: /cancel|close/i }); if (await cancel.count()) await cancel.first().click().catch(() => {});
await p.waitForTimeout(600);
// Role & Permission Matrix tab
await p.getByText('Role & Permission Matrix').first().click(); await p.waitForTimeout(3000);
out.matrix = await p.evaluate(() => ({ text: (document.querySelector('main, app-root') || document.body).innerText.slice(0, 2500), heads: [...document.querySelectorAll('table thead tr')].map(tr => [...tr.children].map(th => th.innerText.trim())), buttons: [...document.querySelectorAll('button')].filter(e => e.offsetParent).map(e => e.innerText.trim()).filter(Boolean) }));
await p.screenshot({ path: OUT + '/adm-matrix.png', fullPage: true });
// permissions for each role (GET, same request the page makes)
out.perms = {};
if (permReq) for (const id of [1, 2, 3]) {
  const url = permReq.url.replace(/roles\/\d+/, 'roles/' + id);
  out.perms[id] = await p.evaluate(async ({ url, auth }) => (await fetch(url, { headers: auth ? { authorization: auth } : {} })).text(), { url, auth: permReq.headers.authorization });
}
fs.writeFileSync(OUT + '/admin.json', JSON.stringify(out));
console.log('actions:', out.actionTitles.join(' | ').slice(0, 300));
console.log('ADD USER:', out.addUser.title, '| labels:', out.addUser.labels.join(', '), '| buttons:', out.addUser.buttons.join(', '));
console.log('MATRIX heads:', JSON.stringify(out.matrix.heads).slice(0, 300), '| buttons:', out.matrix.buttons.join(',').slice(0, 200));
console.log('MATRIX text:', out.matrix.text.slice(0, 900).replace(/\n+/g, ' | '));
console.log('perm sizes:', Object.entries(out.perms).map(([k, v]) => k + ':' + v.length).join(' '));
await b.close();
