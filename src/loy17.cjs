const fs = require('fs');
let j = fs.readFileSync('bk17-logic.js', 'utf8');
// chips -> buttons that open the loyalty panel
j = j.replace('<span class="chip t">★ ${esc(c.tier)} · ${c.coins} coins</span>${c.toNext?`<span class="chip">⏳ ${esc(c.toNext)}</span>`:""}',
  '<button type="button" class="chip t" data-loy="1" title="Smile coins and tier">★ ${esc(c.tier)} · ${c.coins} coins</button>${c.toNext?`<button type="button" class="chip" data-loy="1" title="Progress to the next tier">⏳ ${esc(c.toNext)}</button>`:""}');
// the sample guest gets the same fields the live data has
j = j.replace('const CUST={"9876543210":{name:"Rahul Sharma",tier:"Silver",coins:120,earn:8,toNext:"2 visits to Gold",',
  'const CUST={"9876543210":{name:"Rahul Sharma",tier:"Silver",coins:120,earn:8,toNext:"2 visits to Gold",nextTier:"Gold",visits:1,need:2,expiring:"",');
const LOY = fs.readFileSync('loy17-panel.js', 'utf8');
j = j.replace('/* hints: pick the cheapest time,', LOY + '\n/* hints: pick the cheapest time,');
fs.writeFileSync('bk17-logic.js', j);
console.log('chips->buttons', /data-loy="1"/.test(j), '| sample fields', /nextTier:"Gold",visits:1/.test(j), '| panel', /function openLoyalty/.test(j));
