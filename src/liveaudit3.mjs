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
await p.screenshot({ path: `${out}/lc-deals.png` });

// 5. Check Availability tabs
await p.getByText(/Check Availability/).first().click().catch(() => {}); await p.waitForTimeout(2500);
for (const t of ['Next Day', 'Near']) {
  await p.locator('a', { hasText: new RegExp('^\\s*' + t + '\\s*$') }).first().click({ timeout: 8000 }).catch(e => L(t, 'failed', e.message.slice(0, 60))); await p.waitForTimeout(3500);
  L('== availability tab:', t); L(await p.evaluate(() => { const h = [...document.querySelectorAll('a')].find(e => /^Availablity$/.test(e.textContent.trim())); let s = h; for (let k = 0; k < 6 && s; k++) { s = s.parentElement; if (s && s.innerText.length > 300) break; } return s ? s.innerText.trim().slice(0, 2500) : ''; }));
  await p.getByText(new RegExp('^\\s*' + t + '\\s*$')).first().scrollIntoViewIfNeeded().catch(() => {});
  await p.screenshot({ path: `${out}/lc-avail-${t.replace(/\W/g, '')}.png` });
}
await p.getByText(/Check Availability/).first().click().catch(() => {}); await p.waitForTimeout(800);

// 6. Outlet Offers content
await p.getByText(/^Outlet Offers/).first().click().catch(() => {}); await p.waitForTimeout(3000);
L('== outlet offers'); L(await p.evaluate(() => { const h = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /^Outlet Offers$/.test(e.textContent.trim())); let s = h; for (let k = 0; k < 6 && s; k++) s = s.parentElement; return s ? s.innerText.trim().slice(0, 2500) : ''; }));
await p.getByText(/^Outlet Offers/).first().scrollIntoViewIfNeeded().catch(() => {});
await p.screenshot({ path: `${out}/lc-offers.png` });

// 7. outlet details page (info icon): full text
await p.locator('i.pi-info-circle').first().click().catch(e => L('info failed', e.message.slice(0, 60))); await p.waitForTimeout(4000);
L('== outlet details url', p.url());
L(await p.evaluate(() => { const t = document.body.innerText.trim().replace(/\n{2,}/g, '\n'); const i = t.indexOf('Outlet Details'); return i < 0 ? 'no outlet details' : t.slice(i, i + 6000); }));
await p.screenshot({ path: `${out}/lc-outlet-full.png`, fullPage: true });
await p.getByText(/View all menu items/).first().click().catch(e => L('view menu failed', e.message.slice(0, 60))); await p.waitForTimeout(2500);
L('== view all menu'); L(await dialogText()); await p.screenshot({ path: `${out}/lc-menuall.png` }); await closeAll();

fs.writeFileSync(out + '/lc-log.txt', log.join('\n'));
await b.close();
