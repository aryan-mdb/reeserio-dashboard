// Turn the captured live customer responses (shots/la/lcust.json) into the guest-history block booking-16
// shows. Keyed by the SHA-256 of the mobile number, so the number itself is not in the published page.
// Usage: MOB=<10 digits> node make-cust.cjs
const fs = require('fs'), crypto = require('crypto');
const mob = process.env.MOB; if (!/^\d{10}$/.test(mob || '')) throw new Error('set MOB');
const d = JSON.parse(fs.readFileSync('shots/la/lcust.json', 'utf8'));
const pick = re => (d.calls.find(c => re.test(c.url)) || {}).body;
const c = pick(/getCustomerByMobileNo/), h = pick(/getBookingHistoryDetails/);
const lp = c.loyalty_points || {}, tier = lp.current_tier || {};
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const when = s => { const m = String(s || '').match(/(\d{4})-(\d\d)-(\d\d)[ T](\d\d):(\d\d)/); if (!m) return ''; let H = +m[4]; const ap = H >= 12 ? 'PM' : 'AM'; H = H % 12 || 12; return `${+m[3]} ${MON[m[2] - 1]} ${m[1]} · ${H}:${m[5]} ${ap}`; };
const title = s => String(s || '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase());
const bookings = (h.list || []).map(x => ({
  id: x.bookingId, st: title(x.bookingStatus), o: x.branchName, ad: x.adultPax, ch: x.childPax,
  w: when(x.reservationDateTime), meal: x.slot?.periodId?.periodName || '',
  items: (x.bookingDetailsList || []).filter(i => i.pax > 0 && i.name).map(i => `${i.name} ×${i.pax}`).join(', '),
  occ: x.occasionDesc && x.occasionDesc !== 'Not mentioned' ? x.occasionDesc : '',
  notes: x.notes || '', by: x.lead_acquire_by || (x.externalUserId || '').replace(/-Reeserio$/, '') || x.createdBy || '',
  src: x.source || '', lead: x.lead_status || '', made: when(x.createdDate),
}));
const block = {
  name: c.customerName, since: c.companyName || '', tier: title(tier.tier_name || 'Silver'), coins: (lp.data || {}).available_points || 0,
  earn: Math.round(+tier.earn_rate || 0), toNext: tier.next_tier_message || '', total: +h.total_elements || bookings.length,
  lastCall: '', bookings, calls: [],
};
const key = crypto.createHash('sha256').update(mob).digest('hex');
fs.writeFileSync('cust-hashed.json', JSON.stringify({ [key]: block }));
console.log('cust-hashed.json', key.slice(0, 12) + '…', block.name, '·', block.total, 'bookings ·', block.tier, block.coins, 'coins ·', block.toNext);
console.log(bookings.slice(0, 3));
