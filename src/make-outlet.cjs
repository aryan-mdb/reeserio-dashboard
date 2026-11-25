// Turn the captured live outlet-details responses (shots/la/lo-data.json) into the small, public outlet
// block booking-16 uses: photos, menu pages, facilities, hours, links, online deals, offers and the nearest
// outlets by straight-line distance. No guest data is in here.
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('shots/la/lo-data.json', 'utf8'));
const b = d['v1/branch-by-branchid'];
const plain = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const km = (a1, o1, a2, o2) => { const R = 6371, r = x => x * Math.PI / 180, dA = r(a2 - a1), dO = r(o2 - o1); const h = Math.sin(dA / 2) ** 2 + Math.cos(r(a1)) * Math.cos(r(a2)) * Math.sin(dO / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const lat = +b.latitude, lon = +b.longitude;
const city = d['v1/get-all-nearby-branches'].data.find(c => c.city_name === b.city_name);
const near = (city ? city.branches : []).filter(x => x.branch_name !== b.branch_name && x.latitude && x.longitude)
  .map(x => ({ n: x.branch_name, km: Math.round(km(lat, lon, +x.latitude, +x.longitude) * 10) / 10, addr: x.branch_address, phone: x.branch_phone }))
  .sort((a, z) => a.km - z.km).slice(0, 10);
const seen = new Set();
const deals = d['v1/get-active-deals'].filter(x => (x.applicable_outlets_id || []).includes(String(b.store_code)))
  .filter(x => !seen.has(x.title) && seen.add(x.title))
  .map(x => ({ t: x.title, rib: x.ribbon_label, d: plain(x.description).slice(0, 220), min: +x.min_pax || 1, time: (x.applicable_time || []).map(t => t.from + '–' + t.to).join(', '), img: (x.image_url || [])[0] || '' }));
const out = {
  name: b.branch_name, img: b.branch_image, addr: b.address, landmark: b.landmark, phone: b.branch_phone,
  hours: [b.lunch_time, b.dinner_time], url: b.shorten_url,
  map: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
  feat: b.amenities.map(a => ({ n: a.name, img: a.image })),
  gallery: b.branch_gallery, menu: b.branch_menu_image,
  about: plain(b.branch_description).slice(0, 420),
  tax: { cgst: b.cgst, sgst: b.sgst },
  near, deals,
  promos: d['v1/promotions'].promotion.map(p => ({ t: p.promotion_title, d: plain(p.promotion_description).slice(0, 240), img: p.promotion_image, url: p.promotion_alias })),
};
fs.writeFileSync('outlet-atria.json', JSON.stringify(out));
console.log('outlet-atria.json', JSON.stringify(out).length, 'bytes · menu', out.menu.length, '· gallery', out.gallery.length, '· deals', deals.length, '· near', near.map(n => n.n + ' ' + n.km + 'km').slice(0, 4).join(', '));
