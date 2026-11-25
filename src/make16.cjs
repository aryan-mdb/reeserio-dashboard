// bk-body16.html = bk-body16-src.html + the booking-confirmed ticket popup (CSS and JS) and shell script from bk-body15.html
const fs = require('fs');
const v15 = fs.readFileSync('bk-body15.html', 'utf8').replace(/\r\n/g, '\n');
const css = v15.slice(v15.indexOf('/* booking-created ticket popup'), v15.indexOf('\n@media (max-width:640px){\n  .hbtn.fill'));
const js = v15.slice(v15.indexOf('const toast=m=>'), v15.indexOf('render();$("#mob").focus();'));
if (css.length < 1000 || js.length < 1000) throw new Error('splice markers not found');
const out = fs.readFileSync('bk-body16-src.html', 'utf8').replace('/*TICKETCSS*/', () => css).replace('/*TICKETJS*/', () => js).replace('/*OUTX*/null', () => fs.readFileSync('outlet-atria.json', 'utf8'));
fs.writeFileSync('bk-body16.html', out);
console.log('bk-body16.html', out.length);
