import { chromium } from 'playwright-core';
const [, , dir, out, only] = process.argv;
const b = await chromium.launch({ channel: 'chrome', headless: true });
const errs = [];
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
const shot = async (name) => p.screenshot({ path: `${out}/dk-${name}.png` });
// first visit: follows the computer (light), button flips to dark and is remembered
await p.goto('file:///' + dir + '/app.html#/leads'); await p.waitForTimeout(400);
console.log('default', await p.evaluate(() => document.documentElement.dataset.theme));
await p.click('#themeBtn'); await p.waitForTimeout(150);
console.log('after click', await p.evaluate(() => [document.documentElement.dataset.theme, localStorage.getItem('rsTheme'), getComputedStyle(document.body).backgroundColor, document.querySelector('#themeBtn').getAttribute('aria-label')].join(' | ')));
// white-ish boxes left in dark mode = something not converted
const bright = () => p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => { if (!e.offsetParent && getComputedStyle(e).position !== 'fixed') return false; const c = getComputedStyle(e).backgroundColor.match(/\d+(\.\d+)?/g); if (!c) return false; const [r, g, bl, a = 1] = c.map(Number); const r2 = e.getBoundingClientRect(); return a > .5 && r + g + bl > 600 && r2.width * r2.height > 400; }).slice(0, 8).map(e => e.tagName.toLowerCase() + '.' + [...e.classList].join('.') + '#' + e.id));
const pages = only ? [only] : ['app.html#/leads', 'app.html#/home', 'app.html#/users', 'app.html#/roles', 'app.html#/lead-dashboard', 'app.html#/payment-links', 'app.html#/advance', 'dashboard.html', 'booking-11.html', 'booking-12.html', 'booking-13.html', 'booking-14.html', 'booking.html', 'index.html'];
for (const u of pages) {
  await p.goto('file:///' + dir + '/' + u); await p.waitForTimeout(350);
  const th = await p.evaluate(() => document.documentElement.dataset.theme);
  console.log(u.padEnd(26), th, 'bright:', JSON.stringify(await bright()));
  await shot(u.replace(/[#/.]+/g, '_'));
}
await p.goto('file:///' + dir + '/app.html#/leads'); await p.waitForTimeout(300); await p.click('#fbtn'); await p.waitForTimeout(150); await shot('popup');
await p.keyboard.press('Escape');
await p.evaluate(() => location.hash = '#/payment-links'); await p.waitForTimeout(300); await p.click('.phs [data-form]').catch(() => {}); await p.waitForTimeout(150); await shot('form'); await p.keyboard.press('Escape');
await p.click('#userBtn').catch(() => {}); await p.waitForTimeout(150); await shot('profile'); await p.keyboard.press('Escape');
await p.goto('file:///' + dir + '/dashboard.html'); await p.waitForTimeout(300); console.log('dash i:', await p.evaluate(() => [...document.querySelectorAll('i')].filter(e => { const c = getComputedStyle(e).backgroundColor.match(/\d+/g); return c && +c[0] + +c[1] + +c[2] > 600 && (c[3] ?? 1) > .5 }).map(e => e.parentElement.className + ' > ' + e.outerHTML.slice(0, 80))));
await p.goto('file:///' + dir + '/app.html#/leads'); await p.waitForTimeout(300); await p.click('#themeBtn'); await p.waitForTimeout(100);
console.log('back to light', await p.evaluate(() => document.documentElement.dataset.theme + ' ' + getComputedStyle(document.body).backgroundColor));
// computer in dark mode, nobody picked yet -> dark
const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' }); const m = await c2.newPage(); m.on('pageerror', e => errs.push('phone ' + e.message));
await m.goto('file:///' + dir + '/app.html#/leads'); await m.waitForTimeout(300);
console.log('phone, system dark', await m.evaluate(() => document.documentElement.dataset.theme + ' overflow ' + (document.documentElement.scrollWidth - innerWidth) + ' btn ' + !!document.querySelector('#themeBtn')?.offsetParent));
await m.screenshot({ path: out + '/dk-phone.png' });
await m.goto('file:///' + dir + '/booking-11.html'); await m.waitForTimeout(300); await m.screenshot({ path: out + '/dk-phone-booking.png' });
console.log('errors', errs); await b.close();
