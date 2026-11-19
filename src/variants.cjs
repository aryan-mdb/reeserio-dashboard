// Generate designs 12–14 from design 11: same fields, data and best-deal logic, different layout/look.
const fs = require('fs');
const src = fs.readFileSync('bk-body11.html', 'utf8').replace(/\r\n/g, '\n');
const must = (t, a) => { if (!t.includes(a)) throw new Error('anchor missing: ' + a.slice(0, 60)); };
const addCss = (t, css) => { must(t, '</style>'); return t.replace('</style>', css + '\n</style>'); };

/* ---------- 12: vertical ticket on the left (sticky), offers on the right ---------- */
let v12 = src;
must(v12, '<section class="tkt">'); must(v12, '<p class="foot">');
v12 = v12.replace('<section class="tkt">', '<div class="v12">\n<section class="tkt">').replace('<p class="foot">', '</div>\n<p class="foot">');
v12 = addCss(v12, `/* v12: tall ticket left, offers right */
main.wrap{max-width:1360px}
.v12{display:grid;grid-template-columns:430px minmax(0,1fr);gap:24px;align-items:start}
.v12 .tkt{grid-template-columns:1fr;position:sticky;top:calc(var(--hdr) + 56px)}
.v12 .tm{border-radius:20px 20px 0 0;padding:18px 22px 14px;
  -webkit-mask:radial-gradient(circle 13px at 0 100%,#0000 98%,#000) bottom left/51% 100% no-repeat,radial-gradient(circle 13px at 100% 100%,#0000 98%,#000) bottom right/51% 100% no-repeat;
          mask:radial-gradient(circle 13px at 0 100%,#0000 98%,#000) bottom left/51% 100% no-repeat,radial-gradient(circle 13px at 100% 100%,#0000 98%,#000) bottom right/51% 100% no-repeat}
.v12 .ts{border-radius:0 0 20px 20px;border-left:0;border-top:2.5px dashed rgba(255,255,255,.6);padding:16px 22px 18px;display:grid;grid-template-columns:1fr auto;column-gap:14px;align-items:end;
  -webkit-mask:radial-gradient(circle 13px at 0 0,#0000 98%,#000) top left/51% 100% no-repeat,radial-gradient(circle 13px at 100% 0,#0000 98%,#000) top right/51% 100% no-repeat;
          mask:radial-gradient(circle 13px at 0 0,#0000 98%,#000) top left/51% 100% no-repeat,radial-gradient(circle 13px at 100% 0,#0000 98%,#000) top right/51% 100% no-repeat}
.v12 .ts>*{grid-column:1/-1}
.v12 .ts .dt{font-size:24px;margin-top:4px}
.v12 .ts .of{margin-top:8px}
.v12 .ts .tot{grid-column:1;padding-top:10px}
.v12 .ts .tot b{font-size:28px}
.v12 .ts .go{grid-column:2;grid-row:auto;align-self:end;margin:0;padding:0 22px;height:50px}
.v12 .ts .need{grid-column:1/-1}
.v12 .tr.a{grid-template-columns:1fr 1fr}
.v12 .tr.b,.v12 .tr.d{grid-template-columns:1fr}
.v12 .ob{margin-top:0}
.v12 .two{grid-template-columns:1fr}
.v12 .dl{grid-template-columns:repeat(auto-fill,minmax(190px,1fr))}
@media (max-width:1100px){.v12{grid-template-columns:1fr}.v12 .tkt{position:static}}
@media (max-width:640px){.v12 .ts{grid-template-columns:1fr}.v12 .ts .go{grid-column:1/-1;margin-top:10px}}`);
v12 = v12.replace('/* Booking v11:', '/* Booking v12 (from v11):');

/* ---------- 13: coupon-style deals, gift-card Happiness Cards, dark stub ---------- */
let v13 = src;
const dealTpl = '<span class="mt ${off?"x":""}">${off?`Needs ${q.min}+ adults`:q.min>1?`Min ${q.min} pax`:/Student/.test(q.dn)?"Student ID at outlet":"Any party size"}</span></button>`';
must(v13, dealTpl);
v13 = v13.replace(dealTpl, '<span class="mt ${off?"x":""}">${off?`Needs ${q.min}+ adults`:q.min>1?`Min ${q.min} pax`:/Student/.test(q.dn)?"Student ID at outlet":"Any party size"}</span><span class="ap">${off?"Not eligible":S.pkg===q.dn?"✓ Applied":"Apply"}</span></button>`');
const regTpl = '<span class="mt">Standard menu pricing</span></button></div>`';
must(v13, regTpl);
v13 = v13.replace(regTpl, '<span class="mt">Standard menu pricing</span><span class="ap">${S.pkg==="REG"?"✓ Applied":"Apply"}</span></button></div>`');
const cardTpl = '$("#cards").innerHTML=BK.cards.map(c=>`<div class="hcc"><small>${esc(c.n)}${c.pax?` · ${c.pax} pax`:""}</small><b>${inr(c.price)}</b></div>`).join("");';
must(v13, cardTpl);
v13 = v13.replace(cardTpl, '$("#cards").innerHTML=BK.cards.map((c,i)=>`<div class="hcc g${i%3}"><span class="chip"></span><small>Happiness ${esc(c.n)}</small><b>${inr(c.price)}</b><em>${c.pax?`Treat for ${c.pax}`:"Any value"}</em></div>`).join("");');
const promoTpl = '$("#promos").innerHTML=BK.promos.map((p,i)=>`<div class="pr2"><i>${PI[i]||"%"}</i><span>${esc(p.trim())}</span></div>`).join("");';
must(v13, promoTpl);
v13 = v13.replace(promoTpl, '$("#promos").innerHTML=BK.promos.map((p,i)=>`<div class="cp"><i>${PI[i]||"%"}</i><span>${esc(p.trim())}</span><b>OFFER ${i+1}</b></div>`).join("");');
v13 = addCss(v13, `/* v13: coupons */
.ts{background:linear-gradient(165deg,#2a2f36,#16191d);border-left-color:rgba(255,255,255,.25)}
.ts .k{color:#ff8a3d;opacity:1}
.ts .of{background:rgba(255,138,61,.16);color:#ffd2b5}
.ts .save{background:#ff6200;color:#fff}
.ts .go{background:var(--ember)}
.ts .go:disabled{background:rgba(255,255,255,.12);color:rgba(255,255,255,.45)}
.dc{border:2px dashed #ffc29a;border-radius:14px;background:#fffaf6;padding:14px 18px 0;
  -webkit-mask:radial-gradient(circle 10px at 0 62%,#0000 98%,#000) left/51% 100% no-repeat,radial-gradient(circle 10px at 100% 62%,#0000 98%,#000) right/51% 100% no-repeat;
          mask:radial-gradient(circle 10px at 0 62%,#0000 98%,#000) left/51% 100% no-repeat,radial-gradient(circle 10px at 100% 62%,#0000 98%,#000) right/51% 100% no-repeat}
.dc:hover:not(:disabled){transform:none;box-shadow:none;border-color:var(--ember)}
.dc.on{border-style:solid;border-color:var(--ember);background:#fff1e6;box-shadow:none}
.dc .ck{display:none!important}
.dc.on .best{right:12px}
.dc .ap{margin:10px -18px 0;padding:9px 18px;border-top:2px dashed #ffc29a;font-size:12.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ember);text-align:center}
.dc.on .ap{background:var(--ember);color:#fff;border-top-style:solid;border-top-color:var(--ember)}
.dc:disabled .ap{color:var(--faint)}
.pc{background:none;border:0;padding:0;display:grid;gap:10px}
.cp{display:flex;align-items:center;gap:12px;background:#fff;border:1.5px dashed var(--line-2);border-radius:12px;padding:10px 14px;font-size:13.5px;line-height:1.35}
.cp i{font-style:normal;font-size:20px;flex:none}
.cp span{flex:1}
.cp b{font-size:10.5px;letter-spacing:.08em;color:var(--ember);writing-mode:vertical-rl;transform:rotate(180deg);border-left:1.5px dashed var(--line-2);padding-left:10px;flex:none}
.hc{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.hcc{position:relative;border:0;border-radius:14px;padding:46px 14px 14px;color:#fff;min-height:96px;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden;box-shadow:0 6px 14px rgba(0,0,0,.12)}
.hcc.g0{background:linear-gradient(135deg,#ff7a1f,#d9480f)}
.hcc.g1{background:linear-gradient(135deg,#2a2f36,#4a5160)}
.hcc.g2{background:linear-gradient(135deg,#b8860b,#e0a526)}
.hcc::after{content:"";position:absolute;right:-30px;top:-30px;width:110px;height:110px;border-radius:50%;background:rgba(255,255,255,.12)}
.hcc .chip{position:absolute;top:14px;left:14px;width:28px;height:20px;border-radius:5px;background:linear-gradient(135deg,#ffe8a3,#d4a83a)}
.hcc small{color:rgba(255,255,255,.85);font-size:11.5px}
.hcc b{font-size:20px}
.hcc em{font-style:normal;font-size:11px;opacity:.85}
@media (max-width:640px){.hc{grid-template-columns:1fr 1fr}}`);
v13 = v13.replace('/* Booking v11:', '/* Booking v13 (from v11):');

/* ---------- 14: full-width ticket, three offer columns, sticky checkout bar ---------- */
let v14 = src;
v14 = addCss(v14, `/* v14: compact */
main.wrap{max-width:1360px;padding-bottom:110px}
.tkt{grid-template-columns:1fr}
.tm{border-radius:20px;-webkit-mask:none;mask:none}
.tr.a{grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto auto minmax(0,1.3fr)}
.ts{position:fixed;left:0;right:0;bottom:0;z-index:20;border-radius:0;-webkit-mask:none;mask:none;border:0;padding:12px max(24px,env(safe-area-inset-right,0px)) calc(12px + env(safe-area-inset-bottom,0px)) max(24px,env(safe-area-inset-left,0px));
  display:grid;grid-template-columns:auto auto minmax(0,1fr) auto auto;grid-template-areas:"k dt of tot go" "o dd px tot go";column-gap:22px;row-gap:0;align-items:center;box-shadow:0 -8px 24px rgba(255,98,0,.25)}
.ts .k{grid-area:k}.ts .o{grid-area:o;font-size:13.5px}
.ts .dt{grid-area:dt;margin:0;font-size:24px}.ts .dd{grid-area:dd;font-size:12.5px}
.ts .px{grid-area:px;margin:0;font-size:12.5px}.ts .of{grid-area:of;margin:0;padding:4px 10px;justify-self:start}
.ts .tot{grid-area:tot;margin:0;padding:0;text-align:right}
.ts .tot b{font-size:28px}
.ts .go{grid-area:go;margin:0;padding:0 26px}
.ts .need{position:absolute;right:max(24px,env(safe-area-inset-right,0px));top:-24px;background:#1f2328;border-radius:8px 8px 0 0;padding:4px 10px;margin:0;min-height:0}
.ts .need:empty{display:none}
.ob{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr) minmax(0,.85fr);gap:20px;align-items:start}
.two{display:contents}
.dl{grid-template-columns:repeat(2,minmax(0,1fr))}
.hc{grid-template-columns:1fr 1fr}
@media (max-width:1180px){.ob{grid-template-columns:1fr 1fr}.ob>div:first-child{grid-column:1/-1}.dl{grid-template-columns:repeat(auto-fill,minmax(190px,1fr))}.tr.a{grid-template-columns:1fr 1fr auto auto}.tr.a .f:nth-child(5){grid-column:1/-1}}
@media (max-width:860px){.ts{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"dt go" "tot go";row-gap:2px}.ts .k,.ts .o,.ts .dd,.ts .px,.ts .of{display:none}.ts .tot{text-align:left}.ob{grid-template-columns:1fr}}`);
// v14 puts occasion next to guests in row 1 to save a whole row
const occRow = v14.match(/    <div class="tr d">[\s\S]*?\n    <\/div>\n/);
if (!occRow) throw new Error('occasion row missing');
const occField = occRow[0].match(/<div class="f"><label for="occ">[\s\S]*?<\/select><\/div>/)[0];
const insField = occRow[0].match(/<div class="f"><label for="ins">[\s\S]*?autocomplete="off"><\/div>/)[0];
v14 = v14.replace(occRow[0], `    <div class="tr d">\n      ${insField}\n    </div>\n`);
must(v14, '<div class="f"><span class="l">Kids 6–9</span>');
v14 = v14.replace(/(<div class="f"><span class="l">Kids 6–9<\/span>[\s\S]*?<\/div><\/div>)/, `$1\n      ${occField}`);
v14 = v14.replace('.tr.d{grid-template-columns:minmax(0,.9fr) minmax(0,1.5fr)}', '.tr.d{grid-template-columns:1fr}');
v14 = v14.replace('/* Booking v11:', '/* Booking v14 (from v11):');

fs.writeFileSync('bk-body12.html', v12);
fs.writeFileSync('bk-body13.html', v13);
fs.writeFileSync('bk-body14.html', v14);
console.log('ok', v12.length, v13.length, v14.length);
