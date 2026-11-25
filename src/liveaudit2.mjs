// Read-only audit, pass 2. Credentials from env RU / RP only. Opens panels, tabs and popups to read them;
// never clicks Send / Share / Submit / Save / Create Booking / Calculate, and closes popups with Escape.
import { chromium } from 'playwright-core';
import fs from 'fs';
const out = process.argv[2];
const log = [];
const L = (...a) => { const s = a.map(x => typeof x === 'string' ? x : JSON.stringify(x, null, 1)).join(' '); log.push(s); console.log(s.slice(0, 2500)); };
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await (await b.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
await p.goto('https://reeserio.bnhl.in/main/booking', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
if (await p.locator('input[type=password]').count()) {
  await p.locator('input[type=text],input[placeholder*=user i]').first().fill(process.env.RU);
  await p.locator('input[type=password]').first().fill(process.env.RP);
  await p.getByRole('button', { name: /^login$/i }).click(); await p.waitForLoadState('networkidle').catch(() => {});
  await p.waitForTimeout(4000);
  if (!/main\/booking/.test(p.url())) { await p.goto('https://reeserio.bnhl.in/main/booking', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {}); await p.waitForTimeout(4000); }
}
const dialogText = () => p.evaluate(() => [...document.querySelectorAll('p-dialog .p-dialog, .p-dialog, [role=dialog], .p-sidebar, .p-overlaypanel, .p-menu, .p-tieredmenu, .p-panelmenu')].filter(e => e.offsetParent || getComputedStyle(e).position === 'fixed').map(e => e.innerText.trim().replace(/\n{2,}/g, '\n').slice(0, 2500)).filter(Boolean));
const closeAll = async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(500); await p.keyboard.press('Escape'); await p.waitForTimeout(500); };

// 1. side menu (hamburger at the top-left)
await p.mouse.click(24, 32); await p.waitForTimeout(1500);
L('== side menu'); L(await dialogText());
L(await p.evaluate(() => [...document.querySelectorAll('a, .p-menuitem-link, .p-panelmenu-header-link, li')].filter(e => e.getBoundingClientRect().left < 400 && e.offsetParent && e.innerText.trim()).map(e => e.innerText.trim().replace(/\s+/g, ' ')).filter((t, i, a) => t.length < 60 && a.indexOf(t) === i).slice(0, 80)));
await p.screenshot({ path: `${out}/lb-menu.png` });
await closeAll(); await p.mouse.click(1200, 500); await p.waitForTimeout(500);

// 2. header Search and Log Booking popups
for (const nm of ['Search', 'Log Booking']) {
  await p.getByRole('button', { name: new RegExp('^\\s*' + nm + '\\s*$', 'i') }).first().click().catch(e => L(nm, 'click failed', e.message.slice(0, 60)));
  await p.waitForTimeout(2000);
  L('== header popup:', nm); L(await dialogText());
  await p.screenshot({ path: `${out}/lb-${nm.replace(/\W/g, '')}.png` });
  await closeAll();
}

// 3. guest, outlet, an afternoon slot (deals exist then)
await p.locator('input[placeholder*="mobile" i]').first().fill('9999999999'); await p.waitForTimeout(3000);
const adPlus = p.locator('xpath=//*[normalize-space(text())="Adult"]/following::button[2]').first();
for (let i = 0; i < 2; i++) { await adPlus.click().catch(() => {}); await p.waitForTimeout(400); }
await p.getByText('Select branch', { exact: false }).first().click().catch(() => {});
await p.waitForTimeout(800); await p.keyboard.type('Atria', { delay: 60 }); await p.waitForTimeout(1200);
await p.getByText(/Atria Mall/i).first().click().catch(() => {}); await p.waitForTimeout(5000);
await p.getByText(/^Thu$/).first().click().catch(() => {}); await p.waitForTimeout(4000);
await p.getByText(/^\s*03:00 PM\s*$/).first().click().catch(e => L('slot failed', e.message.slice(0, 60))); await p.waitForTimeout(4000);
L('== deals area text'); L(await p.evaluate(() => { const h = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /Estimate summary/.test(e.textContent)); let s = h; for (let k = 0; k < 6 && s; k++) s = s.parentElement; return s ? s.innerText.trim().slice(0, 3000) : 'not found'; }));
await p.getByText(/Regular booking/).first().scrollIntoViewIfNeeded().catch(() => {}); await p.waitForTimeout(600);
await p.screenshot({ path: `${out}/lb-deals.png` });

// 4. customer panel tabs + eye icon
for (const t of ['Call Logs', 'Call summary', 'Booking Info']) {
  await p.getByText(new RegExp('^\\s*' + t), { exact: false }).first().click().catch(e => L(t, 'failed', e.message.slice(0, 60)));
  await p.waitForTimeout(2500);
  L('== customer tab:', t); L(await p.evaluate(() => { const r = [...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().left > 1050 && e.children.length === 0 && e.offsetParent).map(e => e.textContent.trim()).filter(Boolean); return r.filter((t, i, a) => a.indexOf(t) === i).slice(0, 60); }));
  await p.screenshot({ path: `${out}/lb-tab-${t.replace(/\W/g, '')}.png` });
}
await p.locator('i.pi-eye').first().click().catch(e => L('eye failed', e.message.slice(0, 60))); await p.waitForTimeout(2500);
L('== booking eye popup'); L(await dialogText()); await p.screenshot({ path: `${out}/lb-eye.png` }); await closeAll();

// 5. Check Availability tabs
await p.getByText(/Check Availability/).first().click().catch(() => {}); await p.waitForTimeout(2500);
for (const t of ['Next Day', 'Near']) {
  await p.getByText(new RegExp('^\\s*' + t + '\\s*$')).first().click().catch(e => L(t, 'failed', e.message.slice(0, 60))); await p.waitForTimeout(3500);
  L('== availability tab:', t); L(await p.evaluate(() => { const h = [...document.querySelectorAll('a,div,span')].find(e => /^Near$/.test(e.textContent.trim())); let s = h; for (let k = 0; k < 5 && s; k++) s = s.parentElement; return s ? s.innerText.trim().slice(0, 2000) : ''; }));
  await p.getByText(new RegExp('^\\s*' + t + '\\s*$')).first().scrollIntoViewIfNeeded().catch(() => {});
  await p.screenshot({ path: `${out}/lb-avail-${t.replace(/\W/g, '')}.png` });
}
await p.getByText(/Check Availability/).first().click().catch(() => {}); await p.waitForTimeout(800);

// 6. Outlet Offers content
await p.getByText(/^Outlet Offers/).first().click().catch(() => {}); await p.waitForTimeout(3000);
L('== outlet offers'); L(await p.evaluate(() => { const h = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /^Outlet Offers$/.test(e.textContent.trim())); let s = h; for (let k = 0; k < 6 && s; k++) s = s.parentElement; return s ? s.innerText.trim().slice(0, 2500) : ''; }));
await p.getByText(/^Outlet Offers/).first().scrollIntoViewIfNeeded().catch(() => {});
await p.screenshot({ path: `${out}/lb-offers.png` });

// 7. outlet details page (info icon): full text
await p.locator('i.pi-info-circle').first().click().catch(e => L('info failed', e.message.slice(0, 60))); await p.waitForTimeout(4000);
L('== outlet details url', p.url());
L(await p.evaluate(() => document.body.innerText.trim().replace(/\n{2,}/g, '\n').slice(0, 3500)));
await p.screenshot({ path: `${out}/lb-outlet-full.png`, fullPage: true });
await p.getByText(/View all menu items/).first().click().catch(e => L('view menu failed', e.message.slice(0, 60))); await p.waitForTimeout(2500);
L('== view all menu'); L(await dialogText()); await p.screenshot({ path: `${out}/lb-menuall.png` }); await closeAll();

// 8. the beta booking page
await p.goto('https://reeserio.bnhl.in/main/booking', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {}); await p.waitForTimeout(3000);
await p.getByRole('button', { name: /Try new/i }).click().catch(e => L('beta failed', e.message.slice(0, 60))); await p.waitForTimeout(5000);
L('== beta url', p.url());
L(await p.evaluate(() => document.body.innerText.trim().replace(/\n{2,}/g, '\n').slice(0, 2500)));
await p.screenshot({ path: `${out}/lb-beta.png`, fullPage: true });
fs.writeFileSync(out + '/lb-log.txt', log.join('\n'));
await b.close();
