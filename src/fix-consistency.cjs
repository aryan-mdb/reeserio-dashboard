// One-off source edits for a consistent project: unique class names on the page-ticket header,
// side menu closed by default in the app, booking pages as wide as the rest (2100px) with an aligned breadcrumb.
const fs = require('fs');
const edit = (f, fn) => { const a = fs.readFileSync(f, 'utf8'); const b = fn(a); if (a === b) throw new Error('no change in ' + f); fs.writeFileSync(f, b); };
const must = (t, s) => { if (!t.includes(s)) throw new Error('anchor missing: ' + s.slice(0, 60)); return t; };
edit('bk-app.html', t => {
  t = t.split('<div class="l">').join('<div class="phm">').split('<div class="r">').join('<div class="phs">').split('<b class="r">').join('<b class="neg">');
  t = t.replace(/\.ph \.l(?![\w-])/g, '.ph .phm').replace(/\.ph \.r(?![\w-])/g, '.ph .phs');
  must(t, 'cur=route().key;render();');
  t = t.replace('cur=route().key;render();', 'if(!mq.matches)shell.classList.add("collapsed"); /* same as every other page: menu opens from ☰ */\ncur=route().key;render();');
  if (/class="[lr]"/.test(t) || /\.ph \.[lr](?![\w-])/.test(t)) throw new Error('leftover l/r classes');
  return t;
});
edit('bk-body11.html', t => {
  must(t, 'main.wrap{max-width:1180px;padding-top:18px;padding-bottom:40px}');
  return t.replace('main.wrap{max-width:1180px;padding-top:18px;padding-bottom:40px}',
    'main.wrap,.subbar .wrap{max-width:2100px;padding-left:clamp(20px,2.2vw,48px);padding-right:clamp(20px,2.2vw,48px)}\nmain.wrap{padding-top:18px;padding-bottom:40px}\n.crumb a{color:var(--muted);text-decoration:none}.crumb a:hover{color:var(--ember)}\n@media (min-width:1600px){.tkt{grid-template-columns:minmax(0,1fr) 340px}.tm{padding:24px 32px 20px}.ts{padding:24px 26px}.dl{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}}');
});
edit('variants.cjs', t => t.replace('main.wrap{max-width:1360px}\n', '').replace('main.wrap{max-width:1360px;padding-bottom:110px}', 'main.wrap{padding-bottom:110px}'));
edit('build11.cjs', t => must(t, "const out = prefix + body + '</body></html>';").replace("const out = prefix + body + '</body></html>';",
  `const CR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg>';
const pre2 = prefix.replace(/<div class="crumb">[\s\S]*?<\/div>/, \`<div class="crumb"><a href="dashboard.html">Dashboard</a>\${CR}<span>Table Booking</span>\${CR}<b>Domestic Booking</b></div>\`);
const out = pre2 + body + '</body></html>';`));
console.log('ok');
