// Add a working profile menu (header person icon) to every page: My Profile, Change Password,
// Two-factor, Logout. Uses the logged-in user's non-personal details only (no mobile, no email).
const fs = require('fs');
const G = '../ghpages/';
const a = require('./live/crawl2.json');
const c = (a.cap.login || []).find(c => /GetAuthenticatedUserDetail/.test(c.u));
const d = (j => j.data || j)(JSON.parse(c.body));
const U = {
  name: d.userName, login: d.loginID, role: d.roleID === 1 ? 'Admin' : 'User', agentType: d.agentType,
  lastLogin: String(d.lastLogin || '').replace('T', ' ').slice(0, 16), pwdExpiry: String(d.passwordExpiryDate || '').slice(0, 10),
  since: String(d.createdOn || '').slice(0, 10), twoFA: !!d.twoFactorEnabled, onRoll: !!d.isOnRoll,
  mods: (d.modulePermissions || []).map(m => ({ n: m.moduleName, g: m.groupName, v: !!m.moduleCanView, a: !!m.moduleCanAdd, e: !!m.moduleCanEdit })),
};
const KIT = `<div id="profileKit">
<style>
.user{border:0;cursor:pointer;font:inherit}
.user:hover,.user[aria-expanded="true"]{background:var(--ember-soft);color:var(--ember)}
.pm{position:fixed;z-index:70;top:calc(var(--hdr) - 4px);right:max(16px,env(safe-area-inset-right,0px));width:280px;background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 18px 50px rgba(16,24,40,.18);overflow:hidden;opacity:0;transform:translateY(-6px);pointer-events:none;transition:all .15s}
.pm.open{opacity:1;transform:none;pointer-events:auto}
.pm .who{display:flex;align-items:center;gap:12px;padding:16px;background:linear-gradient(160deg,#ff7a1f,#ff5a00);color:#fff}
.pm .av{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.22);display:grid;place-items:center;font-weight:800;font-size:16px;flex:none}
.pm .who b{display:block;font-size:15px}.pm .who small{display:block;font-size:12px;opacity:.9}
.pm .it{display:flex;align-items:center;gap:10px;width:100%;border:0;background:#fff;padding:12px 16px;font:inherit;font-size:14px;color:#343a40;cursor:pointer;text-align:left;border-top:1px dashed var(--line)}
.pm .it:hover{background:var(--ember-soft);color:var(--ember)}
.pm .it i{font-style:normal;width:20px;text-align:center}
.pm .it em{margin-left:auto;white-space:nowrap;font-style:normal;font-size:11px;font-weight:800;padding:2px 8px;border-radius:99px;background:var(--bg-2);color:var(--muted)}
.pm .it.out{color:var(--red)}
dialog.pd{border:0;border-radius:18px;padding:0;width:min(560px,94vw);max-height:90vh;box-shadow:0 24px 70px rgba(0,0,0,.28)}
dialog.pd::backdrop{background:rgba(20,22,26,.45)}
.pd .h{display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px dashed var(--line-2);position:sticky;top:0;background:#fff}
.pd .h b{font-size:17px}.pd .h button{margin-left:auto;border:0;background:var(--bg-2);width:34px;height:34px;border-radius:10px;cursor:pointer;font-size:18px}
.pd .b{padding:18px 20px}
.pd .kv{display:grid;grid-template-columns:1fr 1fr;gap:0 20px}
.pd .kv div{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px dashed var(--line);font-size:13.5px}
.pd .kv span{color:var(--muted)}
.pd h4{margin:18px 0 8px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
.pd .mods{display:flex;flex-wrap:wrap;gap:6px}
.pd .mods span{font-size:12px;font-weight:700;padding:4px 9px;border-radius:8px;background:var(--good-soft);color:#1f7a4d}
.pd .mods span.ro{background:var(--bg-2);color:var(--muted)}
.pd .f{display:flex;flex-direction:column;gap:5px;margin-bottom:12px}
.pd .f label{font-size:12.5px;font-weight:700;color:#495057}
.pd .f input{height:44px;border:1.5px solid var(--line-2);border-radius:11px;padding:0 12px;font:inherit;font-size:14px}
.pd .f input:focus{outline:none;border-color:var(--ember);box-shadow:0 0 0 3px var(--ember-glow)}
.pd .rules{font-size:12px;color:var(--muted);margin:-4px 0 6px}
.pd .ft{display:flex;justify-content:flex-end;gap:10px;padding:14px 20px;border-top:1px solid var(--line)}
.pd .ft .e{margin-right:auto;align-self:center;font-size:12.5px;color:var(--red);font-weight:600}
.pd .ft button{height:44px;border-radius:12px;padding:0 20px;font:inherit;font-weight:800;font-size:14px;cursor:pointer}
.pd .ft .c{border:1.5px solid var(--line-2);background:#fff}.pd .ft .s{border:0;background:var(--ember);color:#fff}
.pd .ft .s.red{background:var(--red)}
.ptoast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,20px);background:#1f2328;color:#fff;padding:12px 18px;border-radius:12px;font-size:14px;opacity:0;pointer-events:none;transition:all .25s;z-index:200}
.ptoast.show{opacity:1;transform:translate(-50%,0)}
@media (max-width:640px){.user{display:grid!important}.pm{left:12px;right:12px;width:auto}.pd .kv{grid-template-columns:1fr}}
</style>
<div class="pm" id="pm" role="menu"></div><dialog class="pd" id="pd"></dialog><div class="ptoast" id="ptoast" role="status"></div>
<script>
(()=>{const U=${JSON.stringify(U)};
const q=s=>document.querySelector(s),e=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const btn=q("#userBtn"),pm=q("#pm"),pd=q("#pd");if(!btn)return;
const toast=m=>{const t=q("#ptoast");t.textContent=m;t.classList.add("show");clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove("show"),2600)};
pm.innerHTML=\`<div class="who"><span class="av">\${e(U.name.slice(0,2).toUpperCase())}</span><span><b>\${e(U.name)}</b><small>\${e(U.agentType||U.role)} · \${e(U.role)}</small></span></div>
<button class="it" data-x="profile" role="menuitem"><i>👤</i>My Profile</button>
<a class="it" href="app.html#/users" role="menuitem" style="text-decoration:none"><i>🛡️</i>Administrator<em>Users &amp; roles</em></a>
<button class="it" data-x="pwd" role="menuitem"><i>🔑</i>Change Password<em>exp \${e(new Date(U.pwdExpiry).toLocaleDateString("en-IN",{day:"numeric",month:"short"}))}</em></button>
<button class="it" data-x="2fa" role="menuitem"><i>🛡️</i>Two-factor authentication<em>\${U.twoFA?"On":"Off"}</em></button>
<button class="it out" data-x="out" role="menuitem"><i>⏻</i>Logout</button>\`;
const setOpen=o=>{pm.classList.toggle("open",o);btn.setAttribute("aria-expanded",o)};
btn.onclick=ev=>{ev.stopPropagation();setOpen(!pm.classList.contains("open"))};
document.addEventListener("click",ev=>{if(!pm.contains(ev.target))setOpen(false)});
document.addEventListener("keydown",ev=>{if(ev.key==="Escape")setOpen(false)});
const dlg=(title,body,foot)=>{pd.innerHTML=\`<div class="h"><b>\${title}</b><button type="button" aria-label="Close">×</button></div><div class="b">\${body}</div><div class="ft">\${foot||'<button class="c" type="button">Close</button>'}</div>\`;pd.querySelector(".h button").onclick=()=>pd.close();pd.querySelector(".ft .c")&&(pd.querySelector(".ft .c").onclick=()=>pd.close());pd.showModal()};
pm.onclick=ev=>{const b=ev.target.closest("[data-x]");if(!b)return;setOpen(false);const x=b.dataset.x;
 if(x==="profile"){const groups=[...new Set(U.mods.map(m=>m.g))];
  dlg("My Profile",\`<div class="kv"><div><span>User name</span><b>\${e(U.name)}</b></div><div><span>Login ID</span><b>\${e(U.login)}</b></div><div><span>Role</span><b>\${e(U.role)}</b></div><div><span>Agent type</span><b>\${e(U.agentType)}</b></div><div><span>Last login</span><b>\${e(U.lastLogin)}</b></div><div><span>Password expires</span><b>\${e(U.pwdExpiry)}</b></div><div><span>User since</span><b>\${e(U.since)}</b></div><div><span>Two-factor</span><b>\${U.twoFA?"On":"Off"}</b></div></div>
  <h4>Module access (\${U.mods.length})</h4>\${groups.map(g=>\`<div style="margin-bottom:10px"><div style="font-size:12px;font-weight:700;color:#495057;margin-bottom:5px">\${e(g)}</div><div class="mods">\${U.mods.filter(m=>m.g===g).map(m=>\`<span class="\${m.a||m.e?"":"ro"}" title="\${m.v?"View":""}\${m.a?" · Add":""}\${m.e?" · Edit":""}">\${e(m.n)}</span>\`).join("")}</div></div>\`).join("")}<p style="font-size:12px;color:var(--muted);margin:8px 0 0">Green: can add or edit. Grey: view only.</p>\`)}
 if(x==="pwd"){dlg("Change Password",\`<div class="f"><label>Current password</label><input type="password" autocomplete="current-password"></div><div class="f"><label>New password</label><input type="password" autocomplete="new-password"></div><p class="rules">At least 8 characters with a number and a symbol.</p><div class="f"><label>Confirm new password</label><input type="password" autocomplete="new-password"></div>\`,'<span class="e"></span><button class="c" type="button">Cancel</button><button class="s" type="button">Update password</button>');
  pd.querySelector(".s").onclick=()=>{const [c,n,r]=[...pd.querySelectorAll("input")].map(i=>i.value);const er=pd.querySelector(".e");
   if(!c||!n||!r){er.textContent="Fill all three fields";return}if(n.length<8||!/\\d/.test(n)||!/[^\\w]/.test(n)){er.textContent="New password is too weak";return}if(n!==r){er.textContent="Passwords don't match";return}
   pd.close();toast("Change Password: preview only, nothing was changed.")}}
 if(x==="2fa"){dlg("Two-factor authentication",\`<p style="margin:0 0 10px;font-size:14px;color:#343a40">Two-factor authentication is <b>\${U.twoFA?"on":"off"}</b> for \${e(U.name)}.</p><p style="margin:0;font-size:13px;color:var(--muted)">When it is on, login asks for a one-time code after the password.</p>\`,'<button class="c" type="button">Close</button><button class="s" type="button">'+(U.twoFA?"Turn off":"Turn on")+'</button>');pd.querySelector(".s").onclick=()=>{pd.close();toast("Two-factor: preview only, nothing was changed.")}}
 if(x==="out"){dlg("Logout",\`<p style="margin:0;font-size:14px;color:#343a40">Log out of Reeserio on this device?</p>\`,'<button class="c" type="button">Cancel</button><button class="s red" type="button">Logout</button>');pd.querySelector(".s").onclick=()=>{pd.close();toast("Logout: preview only.")}}
};})();
</script></div>`;

let done = 0;
for (const f of fs.readdirSync(G).filter(f => /\.html$/.test(f))) {
  let t = fs.readFileSync(G + f, 'utf8').replace(/\r\n/g, '\n');
  t = t.replace(/<div id="profileKit">[\s\S]*?<\/script><\/div>/, ''); // idempotent
  const before = t;
  t = t.replace(/<span class="user" aria-label="Account">(<svg[\s\S]*?<\/svg>)<\/span>/, '<button type="button" class="user" id="userBtn" aria-label="Account" aria-haspopup="menu" aria-expanded="false">$1</button>');
  if (t === before && !t.includes('id="userBtn"')) { console.log('skip (no user icon)', f); continue; }
  const end = t.lastIndexOf('</body>');
  t = end >= 0 ? t.slice(0, end) + KIT + t.slice(end) : t + KIT;
  fs.writeFileSync(G + f, t); done++;
  if (f === 'app.html') fs.writeFileSync('../reeserio-app.html', t);
  if (f === 'dashboard.html') fs.writeFileSync('../reeserio-dashboard-v2.html', t);
}
console.log('profile menu added to', done, 'pages; modules', U.mods.length);
