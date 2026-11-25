// Assemble bk-body17-src.html: the v17 template + the drawer / send / viewer styles and dialogs and the script
// header from v16 + bk17-logic.js. make17.cjs then adds the ticket popup and the data blocks.
const fs = require('fs');
const v16 = fs.readFileSync('bk-body16-src.html', 'utf8');
let t = fs.readFileSync('bk17-tpl.html', 'utf8');
const cut = (s, a, b, incl) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error('marker ' + a + ' / ' + b); return s.slice(i, incl ? j + b.length : j); };
const reuseCss = cut(v16, '/* side drawer for details', '/*TICKETCSS*/');
const dialogs = cut(v16, '<dialog class="dw"', '<div class="toast" id="toast" role="status"></div>', true);
const head = cut(v16, '<script>', 'const fresh=()=>');
const WA = '<svg class="wai" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>';
let logic = fs.readFileSync('bk17-logic.js', 'utf8')
  .replace('class="pl" data-i=', 'class="dp" data-i=').replace('class="pl oth"', 'class="dp oth"')
  .replace('"#days .pl[data-i]"', '"#days .dp[data-i]"').replace('$(".pl.oth")', '$(".dp.oth")').replace('closest(".pl[data-i]")', 'closest(".dp[data-i]")');
t = t.replace('/*REUSECSS*/', () => reuseCss).replace('<!--REUSEDLG-->', () => dialogs).split('WAICON ').join(WA);
t += head + logic + '/*TICKETJS*/\nrender();$("#mob").focus();\n</script>\n';
fs.writeFileSync('bk-body17-src.html', t);
console.log('bk-body17-src.html', t.length, '| dp class', /class="dp" data-i=/.test(t), '| no .pl left in days', !/"#days \.pl/.test(t));
