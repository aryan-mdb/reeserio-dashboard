// Wire the buffet menu and per-offer sending into bk17-logic.js.
const fs = require('fs');
let j = fs.readFileSync('bk17-logic.js', 'utf8');
const rep = (a, b, label) => { if (!j.includes(a)) throw new Error('not found: ' + label); j = j.replace(a, b); };
// offers carry their buffet type and minimum party
rep('L.push({k:"REG",name:"Regular booking",', 'L.push({k:"REG",ft:"NON-VEG",min:1,name:"Regular booking",', 'reg');
rep('L.push({k:q.dn,name:q.dn,', 'L.push({k:q.dn,min:q.min,name:q.dn,', 'deal');
rep('L.push({k:"CPN:"+i,name:c.n,', 'L.push({k:"CPN:"+i,ft:"NON-VEG",min:1,name:c.n,', 'coupon');
// titles of the new sends
rep('$("#sdT").textContent={outlet:"Send outlet details",', '$("#sdT").textContent={deal:"Send offer",bmenu:"Send buffet menu",outlet:"Send outlet details",', 'titles');
// each offer row: the sum, its buffet menu, and a WhatsApp send with the full details
rep('${o.desc&&S.info===o.k?`<span class="ds">${esc(o.desc)}</span>`:""}</span><span class="pr">',
  '${o.desc&&S.info===o.k?`<span class="ds">${esc(o.desc)}</span>`:""}${o.ok?`<span class="calc">${inr(o.pp)} × ${S.adults} adult${S.adults===1?"":"s"}${S.kids?` + ${inr(kidPrice())} × ${S.kids} kid${S.kids===1?"":"s"}`:""} = ${inr(o.pre)} + GST</span><span class="oa"><button type="button" class="ob" data-bmenu="${esc(o.k)}">📖 ${bufOf(o)==="veg"?"Veg":"Non-veg"} menu</button><button type="button" class="ob" data-send="deal" data-arg="${esc(o.k)}">${WAI}Send offer</button></span>`:""}</span><span class="pr">', 'row');
// buffet prices table: a menu link on the veg and non-veg rows
rep('${rows.map(([n,v])=>`<tr><td>${esc(n)}</td>', '${rows.map(([n,v])=>`<tr><td>${esc(n)}${n==="Veg"||n==="Non-veg"?` <button type="button" class="inf" data-bmenu="${n==="Veg"?"VEG":"NON-VEG"}">menu</button>`:""}</td>', 'prices');
// the buffet menu block goes in before the hint handlers; a Send inside an offer row must not pick the row
rep('/* hints: pick the cheapest time,', fs.readFileSync('bmenu17.js', 'utf8') + '\ndocument.addEventListener("click",e=>{if(e.target.closest(".of [data-send]"))e.preventDefault()},true);\n/* hints: pick the cheapest time,', 'inject');
fs.writeFileSync('bk17-logic.js', j);
console.log('patched');
