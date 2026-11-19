// GitHub Pages lets browsers keep a page for 10 minutes, so people kept seeing old versions.
// Every page gets a build stamp; on load it fetches its own URL with no-store and, if the server
// has a newer stamp, opens that URL with ?v=<stamp> (a URL the browser has not cached). One try per
// stamp per tab, so it can never loop. Also adds the logo as favicon (the missing favicon was a 404).
const fs = require('fs');
const G = '../ghpages/';
const STAMP = String(Date.now());
let done = 0;
for (const f of fs.readdirSync(G).filter(f => /\.html$/.test(f))) {
  let t = fs.readFileSync(G + f, 'utf8').replace(/\r\n/g, '\n');
  t = t.replace(/<!--fresh-->[\s\S]*?<!--\/fresh-->/, '');
  const logo = (t.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/) || [])[1];
  const kit = `<!--fresh--><meta name="build" content="${STAMP}">${logo ? `<link rel="icon" type="image/png" href="data:image/png;base64,${logo}">` : ''}<script>
(function(){var B="${STAMP}";if(location.protocol==="file:"||!window.fetch)return;
fetch(location.pathname+"?fresh="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.text():""}).then(function(t){
  var m=t.match(/<meta name="build" content="(\\d+)">/);if(!m||m[1]===B||+m[1]<+B)return;
  try{var k="reeserioFresh"+m[1];if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,"1")}catch(e){return}
  location.replace(location.pathname+"?v="+m[1]+location.hash);
}).catch(function(){});})();
</script><!--/fresh-->`;
  const at = t.indexOf('</head>');
  if (at < 0) { console.log('skip (no head)', f); continue; }
  t = t.slice(0, at) + kit + t.slice(at);
  fs.writeFileSync(G + f, t); done++;
}
console.log('fresh-kit on', done, 'pages, build', STAMP);
