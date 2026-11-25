// booking-17 "real" pass: live names for labels, no made-up guest, Regular booking without an amount (as on live),
// today's live data (bk25.json) for booking-17 and booking-18. Each replacement must match exactly once.
const fs = require('fs');
function patch(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) {
    const n = s.split(a).length - 1;
    if (n !== 1) throw new Error(`${file}: "${a.slice(0, 60)}" found ${n} times`);
    s = s.replace(a, () => b);
  }
  fs.writeFileSync(file, s);
  console.log('patched', file, pairs.length);
}
// labels as the live booking page names them
patch('bk17-tpl.html', [
  ['for="mob">Mobile number</label>', 'for="mob">Mobile Number</label>'],
  ['for="nm">Guest name</label>', 'for="nm">Name</label>'],
  ['placeholder="10-digit mobile"', 'placeholder="Enter guest mobile number"'],
  ['placeholder="Full name"', 'placeholder="Enter guest name"'],
  ['<span class="lbl">Adults</span>', '<span class="lbl">Adult</span>'],
  ['<span class="lbl">Kids 6–9</span>', '<span class="lbl">Kids 6-9 yrs</span>'],
  ['<h2>Outlet &amp; date</h2>', '<h2>Outlet, Date and Time</h2>'],
  ['ⓘ Outlet info</button>', 'ⓘ Outlet Details</button>'],
  ['WAICON Send outlet</button>', 'WAICON Send Outlet Details</button>'],
  ['🎁 Offers <b class="cn" id="ofN">', '🎁 Outlet Offers <b class="cn" id="ofN">'],
  ['💳 Cards <b class="cn" id="hcN">', '💳 Happiness Card <b class="cn" id="hcN">'],
  ['<h2>Time</h2>', '<h2>Time Slots</h2>'],
  ['🪑 Seats, next day &amp; nearby</button>', '🪑 Check Availability</button>'],
  ['+ Occasion or note for outlet</button>', '+ Select Occasion · Instruction to outlet</button>'],
  ['Preview built from the live booking page for Atria Mall, Worli, 18 Nov 2026, 3:50 PM IST. Guest history: one test number read from the live page, plus a made-up sample (98765 43210). Nothing is saved or sent.',
   'Prices, deals, coupons, slots and Happiness Cards from the live booking page for Atria Mall, Worli, 25 Nov 2026, 3:03 PM IST. Guest history: the test number read from the live page. Nothing is saved or sent.'],
]);
let L = fs.readFileSync('bk17-logic.js', 'utf8');
// the made-up guest goes; only the guest read from the live page is known
const a = L.indexOf('const CUST={"9876543210"'), z = L.indexOf('const cust=()=>S.cdata;');
if (a < 0 || z < a) throw new Error('CUST block not found');
L = L.slice(0, a) + 'const CUST={};\n' + L.slice(z);
fs.writeFileSync('bk17-logic.js', L);
patch('bk17-logic.js', [
  ['   CUST is a made-up sample (98765 43210). On the live app this comes from CRS / LMS for every number. */', '   On the live app this comes from CRS / LMS for every number. */'],
  // Regular booking: the guest orders from the menu, so there is no fixed amount (live: AMOUNT NOT FIXED)
  ['name:"Regular booking",tag:"Pay as per order",sub:`Non-veg buffet ₹${base.toLocaleString("en-IN")}/person`', 'name:"Regular booking",tag:"AMOUNT NOT FIXED",sub:"Standard menu pricing · pay as per actual order"'],
  // a price tie puts a deal before Regular (reg was compared as undefined - true = NaN)
  ['return L.sort((a,b)=>(b.ok-a.ok)||(a.tot-b.tot)||(a.reg-b.reg));', 'return L.sort((a,b)=>(b.ok-a.ok)||(a.tot-b.tot)||(!!a.reg-!!b.reg));'],
  // list order as live: deals first, Regular booking last
  ['$("#dls").innerHTML=!s?`<div class="emp">Pick a time to see the offers for it.</div>`:`<div class="ofl">${O.map(o=>{', '$("#dls").innerHTML=!s?`<div class="emp">Pick a time to see the offers for it.</div>`:`<div class="ofl">${[...O.filter(o=>!o.reg),...O.filter(o=>o.reg)].map(o=>{'],
  ['${o.ok?`<span class="calc">', '${o.ok&&!o.reg?`<span class="calc">'],
  ['<span class="pr"><b>${inr(o.tot)}</b>${o.save&&o.ok?`<small class="sv">save ${inr(Math.round(o.save*GST))}</small>`:o.reg?`<small>est.</small>`:""}</span>', '${o.reg?"":`<span class="pr"><b>${inr(o.tot)}</b>${o.save&&o.ok?`<small class="sv">save ${inr(Math.round(o.save*GST))}</small>`:""}</span>`}'],
  ['`<div class="er"><span>${S.adults} × ${esc(cur.reg?"Non-veg":cur.name)}</span>', '(cur.reg?`<div class="er"><span>Regular booking</span><span>Amount not fixed</span></div><div class="es mute">The guest orders from the menu and pays as per actual order</div>`:`<div class="er"><span>${S.adults} × ${esc(cur.name)}</span>'],
  ['${cur.save?`<div class="es">Saves ${inr(Math.round(cur.save*GST))} on the regular price</div>`:cur.reg?`<div class="es mute">Regular booking: final bill as per order</div>`:""}`+', '${cur.save?`<div class="es">Saves ${inr(Math.round(cur.save*GST))} on the regular price</div>`:""}`)+'],
]);
// today's live data for both builds
patch('build11.cjs', [["const BK = ref.match(/const BK=(\\{.*?\\}), FU=/s)[1];", "// BKFILE: booking data rebuilt from today's live responses (make-bk25.cjs); else the copy inside booking-10\nconst BK = process.env.BKFILE ? fs.readFileSync(process.env.BKFILE, 'utf8') : ref.match(/const BK=(\\{.*?\\}), FU=/s)[1];"]]);
patch('build18.cjs', [["const BK = ref.match(/const BK=(\\{.*?\\}), FU=/s)[1].replace('\"snap\":\"2026-11-18T15:50\"', '\"snap\":\"2026-11-25T10:00\"');", "// today's live data (make-bk25.cjs from liveapi.mjs's read-only capture)\nconst BK = fs.readFileSync('bk25.json', 'utf8');"],
  ["if (js.includes('/*BOOK*/null') || !BK.includes('2026-11-25T10:00')) throw new Error('data not placed');", "if (js.includes('/*BOOK*/null')) throw new Error('data not placed');"]]);
