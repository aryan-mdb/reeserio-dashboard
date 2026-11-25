// Builds booking-17/18's BK data from today's live responses (saved read-only by liveapi.mjs into ../api25):
// slots, buffet prices and deals for Atria Mall, Worli, CRS agent coupons, Happiness Cards, promotions, occasions,
// outlets by city. Writes bk25.json. Names, ribbons and amounts are exactly what the live page shows.
const fs = require('fs');
const A = '../api25/';
const J = f => JSON.parse(fs.readFileSync(A + fs.readdirSync(A).find(x => x.endsWith(f)), 'utf8'));
const hm = t => String(t).slice(0, 5);
const strip = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9@]/g, '');

const now = J('ServerDateTime.json').data.serverDateTime;           // 2026-11-25T15:03:37+05:30
const snap = now.slice(0, 16);
const today = now.slice(0, 10);
const branches = J('branches-lite.json').branches;
const atria = branches.find(b => b.branch_name === 'Atria Mall, Worli');
const deals = J('get-active-deals.json');

// a price row is shown on live only with an active deal of that name (the plain buffets and kids always show)
const BASE = new Set(['NON-VEG', 'VEG', 'Kid (6-9 years)']);
const dealFor = n => deals.find(d => norm(d.title) === norm(n) || norm(d.AutoApplyDeal) === norm(n) || (d.campaign_id_selection || []).some(c => norm(c) === norm(n)))
  || (norm(n) === norm('Veg / Non-Veg') ? deals.find(d => /prime time/i.test(d.title)) : null);
const live = d => d && d.start_date.slice(0, 10) <= today && today <= d.end_date.slice(0, 10);
let prices = J('getPrice_internalByDate.json').filter(p => p.active).map(p => {
  const d = BASE.has(p.displayName) ? null : dealFor(p.displayName);
  return { ct: p.customerType, ft: p.foodType, dn: p.displayName, amt: p.totalAmount, orig: p.originalPrice, from: hm(p.slotTimingFrom), to: hm(p.slotTimingTo), min: +p.minQty || 1, rib: d ? d.ribbon_label : '', _ok: BASE.has(p.displayName) || live(d) };
}).filter(p => p._ok);
// two deals of one kind in the same hours (Black Friday 4@2799 and 4@2899): live shows the cheaper one
const fam = p => p.dn.replace(/\(.*\)|\d+@\d+/g, '').trim() + '|' + p.min + '|' + p.from + '|' + p.ct;
const best = {};
for (const p of prices) if (!BASE.has(p.dn)) { const k = fam(p); if (!best[k] || p.amt < best[k].amt) best[k] = p; }
prices = prices.filter(p => BASE.has(p.dn) || best[fam(p)] === p).map(({ _ok, ...p }) => p);

// descriptions: the buffets' own text, and each deal's text from the deal master
const desc = {};
for (const p of J('getPrice_internalByDate.json')) if (BASE.has(p.displayName) && strip(p.buffetDescription).length > 3) desc[p.displayName] = strip(p.buffetDescription);
for (const p of prices) if (!BASE.has(p.dn)) { const d = dealFor(p.dn); if (d && strip(d.description)) desc[p.dn] = strip(d.description); }

const slots = J('getBranchSlotAndRemarksByBranchId.json').map(s => ({ p: s.periodDesc, from: hm(s.slotStart), to: hm(s.slotStop), cap: +s.availableCapacity, two: +s.available2SeatsCapacity, grp: +s.availableGroupBookingCapacity, tot: Math.round(+s.totalCapacity) }));

const dow = new Date(today + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
const offers = JSON.parse(fs.readFileSync(A + fs.readdirSync(A).find(x => /-list\.json$/.test(x)), 'utf8')).data.offers
  .filter(o => !o.isDeleted && o.fromDate <= today && today <= o.toDate && (o.days || []).some(d => d.dayName === dow))
  .filter(o => o.discountAmount !== 85)   // "CRS Coupon 85rs Off" is not offered in the prototype (asked to remove)
  .map(o => ({ n: o.offerName, amt: o.discountAmount, minP: o.minPrice, maxP: o.maxPrice }));

const pr = J('promotions.json');
const cards = (pr.vouchers || []).map(v => ({ n: v.voucher_name, pax: +v.pax_applicable || 0, price: v.price && v.price.number }));
const promos = (pr.promotion || []).map(p => p.promotion_title);
const occasions = J('occasionList.json').filter(o => o.active).map(o => o.occasionDesc);
const byCity = {};
for (const b of branches) (byCity[b.city_name] = byCity[b.city_name] || []).push(b.branch_name);
const cities = Object.entries(byCity).map(([c, l]) => ({ c, l }));

const BK = { snap, outlet: { branch_name: atria.branch_name, address: atria.address, city_name: atria.city_name }, occasions, cities, slots, prices, desc, coupons: offers, cards, promos, dealCount: deals.length };
fs.writeFileSync('bk25.json', JSON.stringify(BK));
console.log('snap', snap, '| slots', slots.length, '| prices', prices.length, '| coupons', offers.length, '| cards', cards.length, '| promos', promos.length, '| deals', deals.length);
console.log([...new Set(prices.map(p => `${p.dn} [${p.rib}]`))].join('\n'));
