// Pull the human-readable strings around each price-hint keyword in the live app's code.
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
const files = fs.readdirSync(dir).filter(f => /\.js$/.test(f)).map(f => [f, fs.readFileSync(path.join(dir, f), 'utf8')]);
const keys = process.argv.slice(3);
const skip = /^(div|span|button|label|img|input|small|strong|section|ul|li|p|i|b|a|h\d|ng-|p-|pi|click|class|type|role|aria|tabindex|style|src|alt|title|id|for|name|value|true|false|null|\d+)$/;
for (const k of keys) {
  for (const [f, s] of files) {
    let i = s.indexOf(k); if (i < 0) continue;
    const win = s.slice(Math.max(0, i - 2500), i + 3500);
    const strs = [...win.matchAll(/"([^"\\]{2,160})"|`([^`\\]{2,220})`/g)].map(m => (m[1] || m[2]).trim())
      .filter(x => /[A-Za-z]{3}/.test(x) && / |\$\{|₹|\\u20B9/.test(x) && !/^[a-z-]+( [a-z0-9-:\[\]\/.]+)*$/.test(x) && !skip.test(x));
    console.log(`\n######## ${k}  (${f})`);
    console.log([...new Set(strs)].slice(0, 60).join('\n'));
    break;
  }
}
