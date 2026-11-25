// cheapest-time lines use the band's lowest all-guest price (r.lo), so they match the price shown on the slot
const fs = require('fs');
function patch(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${file}: "${a.slice(0, 50)}" x${n}`); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s); console.log('patched', file);
}
patch('bk17-logic.js', [
  ['const line=r=>`Veg ${inr(r.veg)} · Non-veg ${inr(r.nv)} per person · ${per} ≈ <b>${inr(Math.round(r.veg*S.adults*GST))}</b> (veg, incl. GST)`;',
   'const line=r=>`From ${inr(r.lo)}/person (veg ${inr(r.veg)} · non-veg ${inr(r.nv)}) · ${per} from <b>${inr(Math.round(r.lo*S.adults*GST))}</b> incl. GST`;'],
  ['(${inr(cr.veg)} veg)</b>', '(from ${inr(cr.lo)}/person)</b>'],
]);
patch('bridge18.js', [
  ['`Veg ${inr(co.veg)} · Non-veg ${inr(co.nv)} per person · ${per} ≈ <b>${inr(Math.round(co.veg*N*GST))}</b> (veg, incl. GST)`',
   '`From ${inr(co.lo)}/person (veg ${inr(co.veg)} · non-veg ${inr(co.nv)}) · ${per} from <b>${inr(Math.round(co.lo*N*GST))}</b> incl. GST`'],
]);
