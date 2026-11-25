// Prefix every rule of a stylesheet with a scope so it can sit next to another site's CSS without leaking.
// Dark-theme rules are dropped (the live page has no dark mode); @media is scoped inside; @keyframes kept.
function splitTop(s, ch) { const out = []; let d = 0, cur = ''; for (const c of s) { if (c === '(' || c === '[') d++; if (c === ')' || c === ']') d--; if (c === ch && d === 0) { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out; }
function scope(css, sc) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let out = '', i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i); if (open < 0) break;
    const pre = css.slice(i, open).trim();
    let d = 1, j = open + 1; while (j < css.length && d) { if (css[j] === '{') d++; else if (css[j] === '}') d--; j++; }
    const body = css.slice(open + 1, j - 1);
    if (/^@media/.test(pre)) out += `${pre}{${scope(body, sc)}}\n`;
    else if (/^@(keyframes|font-face|-webkit-keyframes)/.test(pre)) out += `${pre}{${body}}\n`;
    else if (/^@/.test(pre)) { /* skip other at-rules */ }
    else {
      const sels = splitTop(pre, ',').map(s => s.trim()).filter(s => s && !/html\[data-theme/.test(s) && !/^(:root|html|body|main\.wrap|\.subbar)/.test(s));
      if (sels.length) out += sels.map(s => `:is(${sc}) ${s}`).join(',') + `{${body}}\n`;
    }
    i = j;
  }
  return out;
}
module.exports = scope;
