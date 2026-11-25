// Read-only: save the live BETA booking page ("Try new (Beta)" on the classic page) (reeserio.bnhl.in/main/booking) as static HTML with its CSS,
// after picking Atria Mall, tomorrow and a lunch slot with 2 adults (no guest number, so no guest data).
// Marks the deals + estimate area with id="DEALS_SLOT" so it can be swapped for the new section.
// Credentials from env RU / RP. Clicks: login, outlet dropdown, a date, adult +, a time slot. Nothing else.
import { chromium } from 'playwright-core';
import fs from 'fs';
const out = process.argv[2];
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
// switch this tab to the beta page (a view preference; switched back to old at the end)
await p.getByText('Try new (Beta)').first().click().catch(() => {}); await p.waitForTimeout(5000);
const adPlus = p.locator('xpath=//*[normalize-space(text())="Adult"]/following::button[2]').first();
for (let i = 0; i < 2; i++) { await adPlus.click().catch(() => {}); await p.waitForTimeout(400); }
await p.getByText('Select branch', { exact: false }).first().click().catch(() => {});
await p.waitForTimeout(800); await p.keyboard.type('Atria', { delay: 60 }); await p.waitForTimeout(1500);
await p.getByText(/Atria Mall/i).first().click().catch(e => console.log('outlet', e.message.slice(0, 60)));
await p.waitForTimeout(5000);
// tomorrow: the second date chip
const chips = await p.locator('text=/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/').all();
if (chips[1]) await chips[1].click().catch(() => {});
await p.waitForTimeout(5000);
for (const el of await p.getByText(/^\s*12:30 PM\s*$/).all()) { const bb = await el.boundingBox().catch(() => null); if (bb && bb.width > 40) { await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); break; } }
await p.waitForTimeout(6000);
const info = await p.evaluate(() => {
  // smallest element holding both the deals list and the estimate summary
  const all = [...document.querySelectorAll('div,section')].filter(e => /Booking type & offers/.test(e.innerText || '') && /Regular/.test(e.innerText || ''));
  all.sort((a, z) => a.innerText.length - z.innerText.length);
  const d = all[0]; if (d) d.id = 'DEALS_SLOT';
  // the page's CSS as text (same-origin sheets), with url() made absolute
  let css = '';
  for (const sh of document.styleSheets) { try { const base = sh.href || location.href; for (const r of sh.cssRules) css += r.cssText.replace(/url\((['"]?)(?!data:|https?:)([^'")]+)\1\)/g, (m, q, u) => `url("${new URL(u, base).href}")`) + '\n'; } catch (e) { css += `/* skipped ${sh.href} */\n`; } }
  document.querySelectorAll('script,noscript,link[rel=modulepreload],link[rel=preload]').forEach(e => e.remove());
  document.querySelectorAll('img[src],source[src]').forEach(i => i.setAttribute('src', new URL(i.getAttribute('src'), location.href).href));
  document.querySelectorAll('input').forEach(i => i.setAttribute('value', i.value));
  return { css, html: document.body.outerHTML, deals: d ? d.innerText.slice(0, 300) : null, title: document.title, htmlAttrs: [...document.documentElement.attributes].map(a => `${a.name}="${a.value}"`).join(' ') };
});
fs.writeFileSync(out + '/snap.css', info.css);
fs.writeFileSync(out + '/snap-body.html', info.html);
fs.writeFileSync(out + '/snap-meta.json', JSON.stringify({ deals: info.deals, title: info.title, htmlAttrs: info.htmlAttrs }, null, 1));
await p.screenshot({ path: out + '/snap-live.png', fullPage: true });
console.log('deals slot:', info.deals ? info.deals.replace(/\n/g, ' | ').slice(0, 200) : 'NOT FOUND', '| css', info.css.length, '| html', info.html.length);
const back = p.getByText(/Switch to old/).first(); if (await back.count()) { await back.click().catch(() => {}); await p.waitForTimeout(1500); }
await b.close();
