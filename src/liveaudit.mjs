// Read-only audit of the live booking page. Credentials from env RU / RP only.
// Only clicks: login, the side menu toggle, section "Open" toggles, the outlet info icon, date/time/outlet pickers
// and +/- counters. Never clicks Create Booking, Send, Share, Submit, Save, Confirm or anything inside a popup.
import { chromium } from 'playwright-core';
import fs from 'fs';
const out = process.argv[2];
const log = [];
const L = (...a) => { const s = a.map(x => typeof x === 'string' ? x : JSON.stringify(x, null, 1)).join(' '); log.push(s); console.log(s.slice(0, 3000)); };
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();
const reqs = []; p.on('request', r => { if (/api|crs|lms/i.test(r.url()) && r.resourceType() !== 'image') reqs.push(r.method() + ' ' + r.url().replace(/[?].*/, '')); });
await p.goto('https://reeserio.bnhl.in/main/booking', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
if (await p.locator('input[type=password]').count()) {
  await p.locator('input[type=text],input[placeholder*=user i]').first().fill(process.env.RU);
  await p.locator('input[type=password]').first().fill(process.env.RP);
  await p.getByRole('button', { name: /^login$/i }).click(); await p.waitForLoadState('networkidle').catch(() => {});
  await p.waitForTimeout(4000);
  if (!/main\/booking/.test(p.url())) { await p.goto('https://reeserio.bnhl.in/main/booking', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {}); await p.waitForTimeout(4000); }
}
L('url', p.url());

const inventory = (tag) => p.evaluate((tag) => {
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const name = e => (e.innerText || e.value || e.getAttribute('aria-label') || e.title || e.getAttribute('mattooltip') || e.getAttribute('ng-reflect-message') || e.placeholder || [...e.querySelectorAll('mat-icon,i,svg title')].map(i => i.textContent || i.className).join(' ') || e.className).toString().trim().replace(/\s+/g, ' ').slice(0, 80);
  const els = [...document.querySelectorAll('button,a,[role=button],[role=tab],[role=menuitem],mat-icon,input,select,textarea,mat-select,[tabindex="0"],.cursor-pointer,[class*=click]')].filter(vis);
  const seen = new Set();
  return els.map(e => `${e.tagName.toLowerCase()}${e.type ? '[' + e.type + ']' : ''} "${name(e)}"`).filter(x => !seen.has(x) && seen.add(x)).slice(0, 250);
}, tag);
const texts = () => p.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,label,.card-title,strong,b,th,mat-panel-title,.title,[class*=title],[class*=heading]')].filter(e => e.offsetParent).map(e => e.innerText.trim().replace(/\s+/g, ' ')).filter(t => t && t.length < 90).filter((t, i, a) => a.indexOf(t) === i).slice(0, 300));
// screenshot the whole scrollable page in viewport-high slices
async function shots(tag) {
  const sc = await p.evaluateHandle(() => { const c = [...document.querySelectorAll('*')].filter(e => e.scrollHeight > e.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)).sort((a, b) => b.scrollHeight - a.scrollHeight)[0]; return c || document.scrollingElement; });
  const H = await sc.evaluate(e => e.scrollHeight), V = await sc.evaluate(e => e.clientHeight);
  let i = 0; for (let y = 0; y < H && i < 8; y += V - 120, i++) { await sc.evaluate((e, y) => e.scrollTo(0, y), y); await p.waitForTimeout(400); await p.screenshot({ path: `${out}/la-${tag}-${i}.png` }); }
  await sc.evaluate(e => e.scrollTo(0, 0));
  L(tag, 'scroll height', H, 'slices', i);
}

L('== header + page, empty');
L(await inventory()); await shots('empty');

// side menu
const ham = p.locator('button:has(mat-icon:text("menu")), .hamburger, [class*=menu-toggle], header button').first();
await ham.click().catch(e => L('menu toggle failed', e.message.slice(0, 80))); await p.waitForTimeout(1200);
L('== side menu'); L(await p.evaluate(() => [...document.querySelectorAll('mat-sidenav a, mat-sidenav button, nav a, .sidebar a, aside a, [class*=sidenav] a, [class*=sidebar] a, mat-list-item, .mat-list-item')].filter(e => e.offsetParent).map(e => e.innerText.trim().replace(/\s+/g, ' ')).filter(Boolean).filter((t, i, a) => a.indexOf(t) === i)));
await p.screenshot({ path: `${out}/la-menu.png` });
await p.keyboard.press('Escape'); await ham.click().catch(() => {}); await p.waitForTimeout(800);

// guest + outlet + date + time
await p.locator('input[placeholder*="mobile" i]').first().fill('9999999999').catch(() => {});
await p.waitForTimeout(2500);
const adPlus = p.locator('xpath=//*[normalize-space(text())="Adult"]/following::button[2]').first();
for (let i = 0; i < 2; i++) { await adPlus.click().catch(() => {}); await p.waitForTimeout(400); }
await p.getByText('Select branch', { exact: false }).first().click().catch(() => {});
await p.waitForTimeout(800); await p.keyboard.type('Atria', { delay: 60 }); await p.waitForTimeout(1200);
await p.getByText(/Atria Mall/i).first().click().catch(e => L('outlet pick failed', e.message.slice(0, 80)));
await p.waitForTimeout(5000);
await p.getByText(/^Wed$|^Thu$/).first().click().catch(() => {}); await p.waitForTimeout(4000);
await p.locator('text=/\\d{1,2}:\\d{2}\\s*(PM|AM)/i').nth(6).click().catch(e => L('slot pick failed', e.message.slice(0, 80)));
await p.waitForTimeout(4000);
L('== after outlet + time'); L(await texts()); L(await inventory()); await shots('filled');

// open every collapsed section ("Open" toggles), one at a time, capturing its content
const opens = await p.getByText(/^\s*Open\s*$/).count();
L('open toggles', opens);
for (let i = 0; i < opens; i++) {
  const t = p.getByText(/^\s*Open\s*$/).nth(0);
  const sec = await t.evaluate(e => { let s = e; for (let k = 0; k < 6 && s; k++) { s = s.parentElement; if (s && s.innerText.length > 40) break; } return s ? s.innerText.split('\n')[0] : ''; }).catch(() => '');
  await t.click().catch(() => {}); await p.waitForTimeout(3000);
  L('== opened section:', sec);
}
L('== after opening sections'); L(await texts()); L(await inventory()); await shots('open');

// outlet info icon (the (i) next to the outlet)
const info = p.locator('xpath=//*[contains(normalize-space(.),"Select Outlet") and not(*)]/following::button[1] | //mat-icon[normalize-space(text())="info"] | //*[contains(@class,"info")]').first();
await info.click().catch(e => L('info click failed', e.message.slice(0, 80))); await p.waitForTimeout(3000);
L('== outlet info popup'); L(await p.evaluate(() => [...document.querySelectorAll('mat-dialog-container, .modal.show, .modal-content, [role=dialog], .cdk-overlay-pane')].filter(e => e.offsetParent).map(e => e.innerText.trim().replace(/\n{2,}/g, '\n').slice(0, 2500))));
L(await inventory());
await p.screenshot({ path: `${out}/la-info.png` });
await p.keyboard.press('Escape'); await p.waitForTimeout(800);

L('== API calls seen'); L([...new Set(reqs)]);
fs.writeFileSync(out + '/la-log.txt', log.join('\n'));
await b.close();
