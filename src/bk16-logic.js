const fresh=()=>({mobile:"",name:"",adults:2,kids:0,outlet:BK.outlet.branch_name,day:0,cdate:null,slot:null,pkg:null,manual:false,info:null});
let S=fresh();

/* Outlet block from the live Outlet Details page (branch-by-branchid, get-active-deals, promotions,
   get-all-nearby-branches): photos, menu pages, facilities, hours, links, online deals, offers, nearest outlets.
   Public outlet info only. This snapshot has it for Atria Mall, Worli; the live page loads it for every outlet. */
const OX=/*OUTX*/null;
const OUT={[OX.name]:OX};
/* Guest history. CUSTH is real data read from the live page (getCustomerByMobileNo_External +
   getBookingHistoryDetails), keyed by the SHA-256 of the mobile so the number isn't in the page source.
   CUST is a made-up sample (98765 43210). On the live app this comes from CRS / LMS for every number. */
const CUSTH=/*CUSTH*/{};
const bk=(id,st,o,ad,ch,w,meal,items,by,src,notes)=>({id,st,o,ad,ch,w,meal,items,by,src,notes,lead:"",occ:""});
const CUST={"9876543210":{name:"Rahul Sharma",tier:"Silver",coins:120,earn:8,toNext:"2 visits to Gold",lastCall:"Pr•••a · 12 Nov 2026, 7:40 PM",total:4,
  bookings:[bk("BN20261102231","Settled","Atria Mall, Worli",4,0,"2 Nov 2026 · 8:00 PM","Dinner","NON-VEG ×4","Pr•••a","Reservation Drop",""),bk("BN20261009118","Settled","Phoenix Marketcity, Kurla",2,0,"9 Oct 2026 · 1:00 PM","Lunch","Couple Deal ×2","Ka•••l","",""),bk("BN20260914402","Cancelled","Atria Mall, Worli",5,1,"14 Sep 2026 · 9:00 PM","Dinner","","Pr•••a","","Guest called to cancel"),bk("BN20260821077","Settled","Korum Mall Thane",3,0,"21 Aug 2026 · 7:30 PM","Dinner","VEG ×1, NON-VEG ×2","Website","","")],
  calls:[["Pr•••a","12 Nov 2026, 7:40 PM","4m 12s","Booking confirmed"],["Ka•••l","1 Nov 2026, 6:05 PM","2m 40s","Asked about deals"]]}};
const cust=()=>S.cdata;
const sha=async s=>{try{const h=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,"0")).join("")}catch{return ""}};
async function lookup(){const m=S.mobile;S.cdata=null;if(!/^\d{10}$/.test(m))return;const h=await sha(m);if(S.mobile!==m)return;S.cdata=CUSTH[h]||CUST[m]||null;
  const c=S.cdata;if(c&&!S.name.trim()){S.name=c.name;$("#nm").value=c.name;toast("Name filled from past bookings")}render()}

$("#outlet").innerHTML=`<option value="">Select outlet</option>`+BK.cities.slice().sort((a,b)=>b.l.length-a.l.length).map(c=>`<optgroup label="${esc(c.c)}">${c.l.map(o=>`<option ${o===S.outlet?"selected":""}>${esc(o)}</option>`).join("")}</optgroup>`).join("");
$("#occ").innerHTML=`<option value="">None</option>`+BK.occasions.filter(o=>o!=="Not mentioned").map(o=>`<option>${esc(o)}</option>`).join("");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
$("#days").innerHTML=DAYS.map((d,i)=>`<button type="button" class="pl" data-i="${i}">${i===0?"Today":i===1?"Tomorrow":d.toLocaleDateString("en-IN",{weekday:"short"})}<small>${d.getDate()} ${d.toLocaleDateString("en-IN",{month:"short"})}</small></button>`).join("")+
  `<label class="pl oth" title="Pick any other date"><span id="othL">Other date</span><small id="othS">calendar</small><input type="date" id="oth" min="${iso(DAYS[0])}" aria-label="Pick another date"></label>`;

const dateObj=()=>S.cdate||DAYS[S.day];
const hasData=()=>S.outlet===BK.outlet.branch_name&&S.day===0&&!S.cdate;
/* every slot of the day; today's past slots are dropped, sold-out ones stay visible but can't be picked */
const daySlots=()=>BK.slots.filter(s=>!hasData()||mins(s.from)>=SNAPMIN);
const slotObj=()=>S.slot&&BK.slots.find(s=>s.p+s.from===S.slot);
const pkgs=()=>{const s=slotObj();if(!s)return[];const t=mins(s.from);return BK.prices.filter(p=>p.ct==="Adult"&&mins(p.from)<=t&&t<=mins(p.to))};
const kidPrice=()=>{const s=slotObj();if(!s)return 0;const t=mins(s.from);const k=BK.prices.find(p=>p.ct==="Child"&&mins(p.from)<=t&&t<=mins(p.to));return k?k.amt:0};
const pkObj=()=>S.pkg==="REG"?{dn:"Regular booking",reg:true}:pkgs().find(p=>p.dn===S.pkg);
/* best deal = cheapest non-veg buffet the party qualifies for; Student needs an ID so it is never auto-picked */
const best=()=>pkgs().filter(p=>p.ft==="NON-VEG"&&S.adults>=p.min&&!/Student/.test(p.dn)).sort((a,b)=>a.amt-b.amt)[0];
function autoPick(){if(!slotObj()){S.pkg=null;return}const cur=pkObj();if(S.manual&&cur&&(cur.reg||S.adults>=cur.min))return;S.manual=false;const b=best();S.pkg=b?b.dn:"REG"}
const from=x=>{const t=mins(x.from),L=BK.prices.filter(p=>p.ct==="Adult"&&p.ft==="NON-VEG"&&S.adults>=p.min&&!/Student/.test(p.dn)&&mins(p.from)<=t&&t<=mins(p.to)).map(p=>p.amt);return L.length?Math.min(...L):0};
const mobOk=()=>/^[6-9]\d{9}$/.test(S.mobile);
const fmtMob=()=>"+91 "+S.mobile.replace(/(\d{5})(\d{5})/,"$1 $2");
const dayLabel=()=>dateObj().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});
const nearby=()=>{const c=BK.cities.find(c=>c.l.includes(S.outlet));return c?c.l.filter(o=>o!==S.outlet):[]};

$("#mob").oninput=e=>{e.target.value=e.target.value.replace(/\D/g,"").slice(0,10);S.mobile=e.target.value;
  /* known guest: fill the name from past bookings so the agent doesn't type it */
  if(mobOk()&&!S.name)$("#nm").focus();render();lookup()};
$("#nm").oninput=e=>{S.name=e.target.value;render()};
$$(".cnt").forEach(c=>c.onclick=e=>{const b=e.target.closest("button");if(!b)return;const k=c.dataset.k;S[k]=Math.max(k==="adults"?1:0,Math.min(99,S[k]+ +b.dataset.d));render()});
/* a new outlet or date clears the time, and with it any deal the agent picked by hand */
const resetTime=()=>{S.slot=null;S.manual=false};
$("#outlet").onchange=e=>{S.outlet=e.target.value;resetTime();render()};
$("#days").onclick=e=>{const b=e.target.closest(".pl[data-i]");if(!b)return;S.day=+b.dataset.i;S.cdate=null;$("#oth").value="";resetTime();render()};
$("#oth").onchange=e=>{if(!e.target.value)return;const d=new Date(e.target.value+"T12:00");const i=DAYS.findIndex(x=>iso(x)===e.target.value);if(i>=0){S.day=i;S.cdate=null}else S.cdate=d;resetTime();render()};
$("#slots").onclick=e=>{const b=e.target.closest(".pl");if(!b||b.disabled)return;S.slot=b.dataset.k;render()};
$("#dls").onchange=e=>{S.pkg=e.target.value;S.manual=true;render()};
$("#dls").onclick=e=>{const b=e.target.closest(".inf");if(!b)return;e.preventDefault();S.info=S.info===b.dataset.k?null:b.dataset.k;render()};
$("#exBtn").onclick=()=>{$("#extra").hidden=false;$("#exBtn").hidden=true;$("#occ").focus()};
$("#new").onclick=()=>{S=fresh();$("#mob").value=$("#nm").value=$("#ins").value=$("#oth").value="";$("#occ").value="";$("#outlet").value=S.outlet;$("#extra").hidden=true;$("#exBtn").hidden=false;render();$("#mob").focus()};

/* WhatsApp mark on every button that sends to the guest on WhatsApp */
const WAI='<svg class="wai" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>';
/* ---------- side drawer ---------- */
const dw=$("#dw");
function drawer(title,sub,tabs,pick,start){
  $("#dwT").textContent=title;$("#dwS").textContent=sub||"";
  const draw=k=>{$("#dwB").innerHTML=(tabs.length>1?`<div class="tabs" role="tablist">${tabs.map(([key,lab])=>`<button type="button" role="tab" data-t="${key}" class="${key===k?"on":""}" aria-selected="${key===k}">${lab}</button>`).join("")}</div>`:"")+pick(k);
    $$("#dwB .tabs button").forEach(b=>b.onclick=()=>draw(b.dataset.t));$("#dwB").scrollTop=0;dw.scrollTop=0};
  drawer.draw=draw;draw(start||tabs[0][0]);if(!dw.open)dw.showModal();
}
$("#dwX").onclick=()=>dw.close();
dw.addEventListener("click",e=>{if(e.target===dw)dw.close()});
const tone=s=>/not ?confirm/i.test(s)?"o":/settled|arrived|confirm/i.test(s)?"g":/cancel|no.?show/i.test(s)?"r":"o";

function openHistory(){
  const c=cust();
  const pax=x=>`${x.ad} adult${x.ad===1?"":"s"}${x.ch?` + ${x.ch} kid${x.ch===1?"":"s"}`:""}`;
  const cnt=re=>c.bookings.filter(x=>re.test(x.st)).length;
  drawer(c.name,`${fmtMob()} · ${c.total} past booking${c.total===1?"":"s"}`,[["b","Bookings"],["c","Call logs"],["s","Call summary"]],k=>
    k==="b"?(c.total>c.bookings.length?`<p class="note" style="margin-top:0">Latest ${c.bookings.length} of ${c.total}.</p>`:"")+c.bookings.map(x=>`<div class="li"><div class="m"><b>${esc(x.id)}</b><span>${esc(x.o)} · ${x.w}${x.meal?` · ${x.meal}`:""}</span><span>${pax(x)}${x.items?` · ${esc(x.items)}`:""}${x.occ?` · 🎉 ${esc(x.occ)}`:""}</span>${x.by||x.src?`<span>By ${esc(x.by||"—")}${x.src?` · ${esc(x.src)}`:""}${x.lead?` · lead: ${esc(x.lead)}`:""}</span>`:""}${x.notes?`<span>📝 ${esc(x.notes)}</span>`:""}</div><span class="st2 ${tone(x.st)}">${esc(x.st)}</span></div>`).join(""):
    k==="c"?(c.calls.length?c.calls.map(([a,w,d,n])=>`<div class="li"><div class="m"><b>${esc(a)}</b><span>${w} · ${d}</span><span>${esc(n)}</span></div></div>`).join(""):`<p class="note" style="margin-top:0">No call logs for this number in this preview. The live page loads them from call audit.</p>`):
    `<div class="kv2"><span>Bookings</span><b>${c.total} · in the latest ${c.bookings.length}: ${cnt(/settled|arrived/i)} settled, ${cnt(/cancel/i)} cancelled, ${cnt(/not confirmed/i)} not confirmed</b><span>Calls</span><b>${c.calls.length}</b>${c.lastCall?`<span>Last call</span><b>${esc(c.lastCall)}</b>`:""}<span>Tier</span><b>★ ${esc(c.tier)} · ${c.coins} coins · ${esc(c.toNext)}</b><span>Outlets</span><b>${esc([...new Set(c.bookings.map(x=>x.o))].slice(0,5).join(", "))}</b></div>`);
}
/* nearest outlets: by distance when the live block has it, else the rest of the city */
const nearList=()=>{const o=OUT[S.outlet];return o?o.near.map(x=>({n:x.n,sub:`${x.km} km away`})):nearby().map(n=>({n,sub:"Same city"}))};
const nearRows=k=>nearList().slice(0,k).map(x=>`<div class="li"><div class="m"><b>${esc(x.n)}</b><span>${esc(x.sub)}</span></div><button class="lk" type="button" data-go="${esc(x.n)}">Book here</button></div>`).join("")||`<p class="note">No other outlet in this city.</p>`;
const thumbs=(list,kind)=>`<div class="thg ${kind}">${list.map((u,i)=>`<button type="button" class="th" data-lb="${kind}" data-i="${i}" aria-label="Open ${kind} ${i+1}"><img src="${esc(u)}" alt="" loading="lazy"></button>`).join("")}</div>`;
function outletBody(k){
  const o=OUT[S.outlet];
  if(!o)return `<p class="note">Photos, menu, address, phone, hours and facilities for ${esc(S.outlet)} load from CRS on the live page; this preview has them for Atria Mall, Worli.</p><div class="dwf"><button class="btn p" type="button" data-send="outlet">${WAI}Send outlet details</button><button class="btn" type="button" data-send="menu">${WAI}Send menu</button></div><div class="sec">Nearby outlets</div>${nearRows(8)}`;
  if(k==="m")return `<p class="note" style="margin-top:0">${o.menu.length} menu pages · tap one to open it full size.</p>${thumbs(o.menu,"menu")}<div class="dwf"><button class="btn p" type="button" data-send="menu">${WAI}Send menu to guest</button></div>`;
  if(k==="d")return `<p class="note" style="margin-top:0">${o.deals.length} online deals for this outlet on the website &amp; app.</p>`+o.deals.slice(0,S.allDeals?999:12).map(x=>`<div class="li">${x.img?`<img class="dimg" src="${esc(x.img)}" alt="" loading="lazy">`:""}<div class="m"><b>${esc(x.t)}</b> ${x.rib?`<span class="st2 o" style="display:inline">${esc(x.rib)}</span>`:""}<span>${esc(x.d)}</span><span>Min ${x.min} guest${x.min>1?"s":""} · ${esc(x.time)}</span></div></div>`).join("")+(o.deals.length>12&&!S.allDeals?`<div class="dwf"><button class="btn" type="button" data-alldeals="1">Show all ${o.deals.length} deals</button></div>`:"");
  if(k==="n")return nearRows(10);
  return `<img class="hero" src="${esc(o.img)}" alt="${esc(o.name)}">
    <div class="kv2" style="margin-top:14px"><span>Address</span><b>${esc(o.addr)}<br><a href="${esc(o.map)}" target="_blank" rel="noopener">Open in Google Maps ↗</a></b><span>Phone</span><b><a href="tel:${esc(o.phone.replace(/\s/g,""))}">${esc(o.phone)}</a></b><span>Lunch</span><b>${esc(o.hours[0])}</b><span>Dinner</span><b>${esc(o.hours[1])}</b><span>Outlet page</span><b><a href="${esc(o.url)}" target="_blank" rel="noopener">${esc(o.url.replace(/^https?:\/\//,""))} ↗</a></b></div>
    <div class="dwf"><button class="btn p" type="button" data-send="outlet">${WAI}Send outlet details</button><button class="btn" type="button" data-send="menu">${WAI}Send menu</button><button class="btn" type="button" data-send="location">${WAI}Send location</button></div>
    <div class="sec">Facilities</div><div class="feat">${o.feat.map(f=>`<span><img src="${esc(f.img)}" alt="" loading="lazy">${esc(f.n)}</span>`).join("")}</div>
    <div class="sec">Menu <button class="inf" type="button" data-tab="m">see all ${o.menu.length} pages</button></div>${thumbs(o.menu.slice(0,6),"menu")}
    <div class="sec">Photos</div>${thumbs(o.gallery,"photo")}
    ${o.about?`<div class="sec">About this outlet</div><p class="note" style="margin:0;line-height:1.5">${esc(o.about)}…</p>`:""}`;
}
let dwTab=null;
function openOutlet(tab){if(!S.outlet){toast("Select an outlet first");return}S.allDeals=false;
  drawer(S.outlet,OUT[S.outlet]?`${OUT[S.outlet].landmark||""} · ${OUT[S.outlet].menu.length} menu pages · ${OUT[S.outlet].deals.length} online deals`:"Outlet details",OUT[S.outlet]?[["o","Details"],["m","Menu"],["d","Online deals"],["n","Nearby"]]:[["o",""]],outletBody,tab)}
$("#oInfo").onclick=()=>openOutlet();
$("#oMenu").onclick=()=>openOutlet(OUT[S.outlet]?"m":undefined);

/* full-size viewer for menu pages and outlet photos, with previous / next */
const lb=$("#lb");let lbList=[],lbI=0;
const lbShow=()=>{$("#lbImg").src=lbList[lbI];$("#lbN").textContent=`${lbI+1} / ${lbList.length}`};
$("#lbP").onclick=()=>{lbI=(lbI-1+lbList.length)%lbList.length;lbShow()};$("#lbN2").onclick=()=>{lbI=(lbI+1)%lbList.length;lbShow()};
$("#lbX").onclick=()=>lb.close();lb.addEventListener("click",e=>{if(e.target===lb)lb.close()});
lb.addEventListener("keydown",e=>{if(e.key==="ArrowLeft")$("#lbP").click();if(e.key==="ArrowRight")$("#lbN2").click()});
$("#avBtn").onclick=()=>{if(!S.outlet){toast("Select an outlet first");return}
  drawer("Check availability",`${S.outlet} · ${dayLabel()}`,[["a","Seats per slot"],["n","Next day"],["b","Nearby outlets"]],k=>
    k==="a"?(hasData()?`<table class="tb2"><tr><th>Slot</th><th class="n">Capacity</th><th class="n">Available</th></tr>${daySlots().map(x=>`<tr><td>${t12(x.from)} – ${t12(x.to)}</td><td class="n">${x.tot}</td><td class="n" style="color:${x.cap?"var(--good)":"var(--red)"};font-weight:700">${x.cap||"Sold out"}</td></tr>`).join("")}</table>`:`<p class="note">Seat counts for this outlet and date load from CRS on the live page; this preview has them for Atria Mall, Worli today.</p>`):
    k==="n"?`<p class="note" style="margin-top:0">Same outlet, ${DAYS[Math.min(5,(S.cdate?0:S.day)+1)].toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"})}.</p><div class="dwf"><button class="btn p" type="button" data-nextday="1">Switch to next day</button></div>`:
    nearRows(10))};
const sendBtn=(kind,arg)=>`<button class="lk wa" type="button" data-send="${kind}" data-arg="${esc(arg)}">${WAI}Send</button>`;
/* offers: the live promotions (picture, text, link) for the outlet in the snapshot, else the titles */
const promos=()=>OUT[S.outlet]?OUT[S.outlet].promos:BK.promos.map(t=>({t:t.trim()}));
$("#ofBtn").onclick=()=>drawer("Offers to share",S.outlet||"",[["o",""]],()=>promos().map((p,i)=>`<div class="li">${p.img?`<img class="dimg" src="${esc(p.img)}" alt="" loading="lazy">`:""}<div class="m"><b>${esc(p.t)}</b>${p.d?`<span>${esc(p.d.slice(0,140))}…</span>`:""}${p.url?`<span><a href="${esc(p.url)}" target="_blank" rel="noopener">Open offer page ↗</a></span>`:""}</div>${sendBtn("offer",i)}</div>`).join(""));
$("#hcBtn").onclick=()=>drawer("Happiness Cards","Gift cards, sold separately from this booking",[["h",""]],()=>BK.cards.map((c,i)=>`<div class="li"><div class="m"><b>${esc(c.n)}</b><span>${c.pax?`${c.pax} pax · `:""}${inr(c.price)} all inclusive</span></div>${sendBtn("card",i)}</div>`).join(""));
dw.addEventListener("click",e=>{
  const g=e.target.closest("[data-go]");if(g){S.outlet=g.dataset.go;$("#outlet").value=S.outlet;resetTime();dw.close();render();toast("Outlet changed to "+S.outlet)}
  if(e.target.closest("[data-nextday]")){S.day=Math.min(5,(S.cdate?0:S.day)+1);S.cdate=null;$("#oth").value="";resetTime();dw.close();render()}
  const t=e.target.closest("[data-tab]");if(t)drawer.draw(t.dataset.tab);
  if(e.target.closest("[data-alldeals]")){S.allDeals=true;drawer.draw("d")}
  const l=e.target.closest("[data-lb]");if(l){const o=OUT[S.outlet];lbList=l.dataset.lb==="menu"?o.menu:o.gallery;lbI=+l.dataset.i;lbShow();lb.showModal()}
});

/* ---------- send to guest: the agent sees the exact message first ---------- */
const sd=$("#sd");
/* What the guest gets on WhatsApp, drawn like the chat. Live templates (LMS send_whatsapp_link → Nextel):
   OD = lead_branch_info (outlet photo + button to the outlet page), HC = lead_hc_1 (gift card picture + button
   to the voucher page). Their exact wording lives in Nextel/Meta; the text here is a stand-in. */
const WA_OD="https://leadmanagement-lms.s3.ap-south-1.amazonaws.com/whatsappimages/Whatsapp+creative.jpg";
const WA_HC="https://leadmanagement-lms.s3.ap-south-1.amazonaws.com/whatsappimages/happy_card.jpg";
function waMsg(kind,arg){
  const o=OUT[S.outlet],s=slotObj(),nm=S.name.trim().split(" ")[0]||"there",web="https://www.barbequenation.com/";
  const when=s?`\n\n🗓️ *Your table:* ${dayLabel()}, ${t12(s.from)} · ${S.adults+S.kids} guest${S.adults+S.kids>1?"s":""}`:"";
  if(kind==="outlet")return {live:"lead_branch_info",img:WA_OD,
    body:`Hi ${nm} 👋\nThank you for choosing *Barbeque Nation, ${S.outlet}*.\n\n📍 ${o?o.addr:S.outlet}${o?`\n📞 ${o.phone}\n🕒 Lunch ${o.hours[0]} · Dinner ${o.hours[1]}`:""}${when}\n\nTap below for the menu, photos and directions.`,
    btns:[["↗","View outlet",o?o.url:web]]};
  if(kind==="menu")return {live:"",reuse:"lead_branch_info",img:o?o.menu[0]:WA_OD,more:o?o.menu.length-1:0,
    body:`Hi ${nm} 👋\nHere is the menu for *Barbeque Nation, ${S.outlet}* — unlimited grills, starters, mains and desserts.${when}\n\nTap below to see all ${o?o.menu.length:""} menu pages.`,
    btns:[["📖","View full menu",o?o.url:web]]};
  if(kind==="location")return {live:"",loc:o||{addr:S.outlet},
    body:`Hi ${nm} 👋\nHere is how to reach *Barbeque Nation, ${S.outlet}*.${when}`,
    btns:[["📍","Get directions",o?o.map:web],...(o?[["📞","Call outlet","tel:"+o.phone.replace(/\s/g,"")]]:[])]};
  if(kind==="offer"){const p=promos()[arg];return {live:"",img:p.img||"",
    body:`Hi ${nm} 👋\n*${p.t}*${p.d?`\n\n${p.d.slice(0,170)}…`:""}`,btns:[["↗","View offer",p.url||web]]}}
  if(kind==="card"){const c=BK.cards[arg];return {live:"lead_hc_1",img:WA_HC,
    body:`Hi ${nm} 👋\nShare the joy of unlimited buffet with a *Barbeque Nation Happiness Card*.\n\n🎁 *${c.n}*${c.pax?` · ${c.pax} guests`:""} · *${inr(c.price)}* all inclusive`,
    btns:[["🛒","Buy gift card",`${web}vouchers?branch_id=…`]]}}
}
/* WhatsApp-style text: *bold*, line breaks */
const waText=t=>esc(t).replace(/\*([^*\n]+)\*/g,"<b>$1</b>");
const waTime=()=>new Date().toLocaleTimeString("en-IN",{hour:"numeric",minute:"2-digit"});
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-send]");if(!b||b.closest("#sd"))return;
  if(!mobOk()){toast("Enter the guest's mobile number first");$("#mob").focus();return}
  if(!S.outlet&&/outlet|menu|location/.test(b.dataset.send)){toast("Select an outlet first");return}
  const k=b.dataset.send,m=waMsg(k,b.dataset.arg);
  $("#sdT").textContent={outlet:"Send outlet details",menu:"Send menu",location:"Send location",offer:"Send offer",card:"Send Happiness Card"}[k];
  $("#waTo").textContent=(S.name.trim()||"Guest")+" · "+fmtMob();
  $("#sdTo").innerHTML=`<span>To</span><b>${esc(S.name.trim()||"Guest")}</b><span>${fmtMob()}</span>`;
  const head=m.loc?`<div class="wa-loc"><span>📍</span><div><b>Barbeque Nation, ${esc(S.outlet)}</b><small>${esc(m.loc.addr)}</small></div></div>`:
    m.img?`<div class="wa-img"><img src="${esc(m.img)}" alt="">${m.more?`<span class="wa-more">+${m.more} pages</span>`:""}</div>`:"";
  $("#waB").innerHTML=`<div class="wa-bub">${head}<div class="wa-txt">${waText(m.body)}</div><div class="wa-ft">Barbeque Nation<span>${waTime()}</span></div></div>`+
    m.btns.map(([i,l,u])=>`<a class="wa-btn" href="${esc(u)}" target="_blank" rel="noopener"><span>${i}</span>${esc(l)}</a>`).join("");
  $("#sdTpl").innerHTML=m.live?`<span class="tg ok">Live template</span><code>${m.live}</code><small>Goes out today from the live page. The wording comes from the approved template in Nextel; only the name and link change.</small>`:
    m.reuse?`<span class="tg nw">Can reuse</span><code>${m.reuse}</code><small>Not on the live page yet. Sending the outlet template works today (its button opens the outlet page with the full menu); a menu-picture template needs Meta approval.</small>`:
    `<span class="tg nw">New template needed</span><small>Not on the live page yet. Needs a template in Nextel, approved by Meta, and a new type in LMS send_whatsapp_link.</small>`;
  $("#sdM").value=m.body.replace(/\*/g,"")+"\n"+m.btns.map(x=>x[1]+": "+x[2]).join("\n");
  sd.showModal();
});
$("#sdX").onclick=()=>sd.close();
sd.addEventListener("click",e=>{if(e.target===sd)sd.close()});
sd.querySelector(".dwf").onclick=e=>{const b=e.target.closest("[data-ch]");if(!b)return;
  if(b.dataset.ch==="copy"){navigator.clipboard?.writeText($("#sdM").value).catch(()=>{});toast("Message copied")}
  else{sd.close();toast(`Preview only: on the live page this goes to ${fmtMob()} on ${b.dataset.ch}. Nothing was sent.`)}};

function render(){
  autoPick();
  const s=slotObj(),p=pkObj(),nm=S.name.trim(),c=cust();
  $$(".cnt").forEach(c=>c.querySelector("output").textContent=S[c.dataset.k]);
  $("#mobErr").textContent=S.mobile.length===10&&!mobOk()?"Mobile number should start with 6, 7, 8 or 9":"";
  $$("#days .pl[data-i]").forEach((b,i)=>{const on=!S.cdate&&i===S.day;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)});
  $(".pl.oth").classList.toggle("on",!!S.cdate);$("#othL").textContent=S.cdate?S.cdate.toLocaleDateString("en-IN",{weekday:"short"}):"Other date";$("#othS").textContent=S.cdate?S.cdate.toLocaleDateString("en-IN",{day:"numeric",month:"short"}):"calendar";

  // guest strip
  $("#cust").innerHTML=!mobOk()?"":c?`<div class="cu"><span class="av">${esc(c.name[0])}</span><div class="who"><b>${esc(c.name)}</b> <span>· ${c.total} past booking${c.total===1?"":"s"}${c.bookings[0]?` · last: ${esc(c.bookings[0].o)}, ${esc(c.bookings[0].w.split(" · ")[0])}`:""}</span></div><span class="chip t">★ ${esc(c.tier)} · ${c.coins} coins</span>${c.toNext?`<span class="chip">⏳ ${esc(c.toNext)}</span>`:""}<button class="lk" type="button" id="hist">Booking history &amp; calls</button></div>`:
    `<div class="cu new"><span class="av">+</span><div class="who">New guest · no past bookings for this number</div></div>`;
  if($("#hist"))$("#hist").onclick=openHistory;
  ["#sendOut","#sendMenu"].forEach(id=>$(id).title=mobOk()?"":"Enter the guest's mobile number first");

  // time: slot status dot (seats left), price per person for this party; sold out stays visible, can't be picked
  if(!S.outlet){$("#slots").innerHTML=`<p class="note">Select an outlet to see times.</p>`;$("#tX").innerHTML="";$("#tN").textContent=""}
  else{
    const L=daySlots(),G=[["Lunch",L.filter(x=>mins(x.from)<960)],["Dinner",L.filter(x=>mins(x.from)>=960)]].filter(g=>g[1].length);
    const pill=x=>{const k=x.p+x.from,live=hasData(),sold=live&&x.cap<=0,r=x.cap/x.tot,cls=!live?"":sold?"":r>.4?"s-ok":r>.15?"s-fill":"s-low",few=live&&!sold&&x.cap<=10,pr=from(x);
      return `<button type="button" class="pl ${cls} ${sold?"so":""} ${S.slot===k?"on":""}" data-k="${k}" aria-pressed="${S.slot===k}" ${sold?"disabled":""} title="${live?(sold?"Sold out":x.cap+" of "+x.tot+" seats left"):""}">${live&&!sold?`<span class="dot"></span>`:""}${t12(x.from)}<small class="${few?"few":""}">${sold?"Sold out":few?`Only ${x.cap} seats`:pr?inr(pr):"&nbsp;"}</small></button>`};
    $("#slots").innerHTML=L.length?G.map(([n,xs])=>`<div class="tg"><b>${n}</b><div class="pills">${xs.map(pill).join("")}</div></div>`).join(""):`<p class="note">No open times on this day. Pick another date.</p>`;
    $("#tN").textContent=L.length?`· price per person for ${S.adults} adult${S.adults===1?"":"s"}`:"";
    /* same hint as the live page: the cheapest buffet of the day and when it runs */
    const low=BK.prices.filter(q=>q.ct==="Adult").reduce((a,b)=>b.amt<a.amt?b:a);
    $("#tX").innerHTML=(L.length?`<div class="lowp">Lowest price: <b>${inr(low.amt)}</b> per person between ${t12(low.from)} and ${t12(low.to)}${low.min>1?` (for ${low.min}+ adults)`:""}</div>`:"")+(L.length&&!hasData()?`<p class="note">Seat counts in this preview are for Atria Mall, Worli today; the live page loads them for every outlet and date.</p>`:"");
  }

  // deals, as on the live page: one radio row each, Regular booking last; "Details" opens the deal's description
  $("#dS").textContent=s?`for ${t12(s.from)} · best price picked for ${S.adults} adult${S.adults===1?"":"s"}`:"";
  $("#dls").innerHTML=!s?`<div class="emp">Pick a time to see the deals for it.</div>`:`<div class="dls">${pkgs().map(q=>{const off=S.adults<q.min,on=S.pkg===q.dn,d=BK.desc[q.dn];
      return `<label class="dr ${on?"on":""} ${off?"off":""}"><input type="radio" name="dl" value="${esc(q.dn)}" ${on?"checked":""} ${off?"disabled":""}><span class="bd"><span class="nm"><span class="veg ${q.ft==="VEG"?"":"nv"}"></span>${esc(q.dn)}${q.rib?`<span class="tag deal">${esc(q.rib)}</span>`:""}</span><span class="dsub ${off?"x":""}">${off?`Needs ${q.min}+ adults`:`Per person · minimum ${q.min} pax${/Student/.test(q.dn)?" · student ID at outlet":""}`}${d?` · <button type="button" class="inf" data-k="${esc(q.dn)}">${S.info===q.dn?"Hide details":"Details"}</button>`:""}</span>${d&&S.info===q.dn?`<span class="ds">${esc(d)}</span>`:""}</span><span class="pr"><b>${inr(q.amt)}</b>${q.orig>q.amt?`<s>${inr(q.orig)}</s>`:""}</span></label>`}).join("")}
    <label class="dr ${S.pkg==="REG"?"on":""}"><input type="radio" name="dl" value="REG" ${S.pkg==="REG"?"checked":""}><span class="bd"><span class="nm">Regular booking<span class="tag">Amount not fixed</span></span><span class="dsub">Standard menu pricing · pay as per actual order</span></span></label></div>`;

  // the booking read back, gaps in grey
  const miss=t=>`<span class="miss">${t}</span>`;
  $("#rd").innerHTML=`${nm?`<b>${esc(nm)}</b>`:miss("Guest name")} · ${mobOk()?fmtMob():miss("mobile")} · ${S.adults} adult${S.adults===1?"":"s"}${S.kids?` + ${S.kids} kid${S.kids===1?"":"s"}`:""}<br>${S.outlet?`<b>${esc(S.outlet)}</b>`:miss("Outlet")} · ${dayLabel()} · ${s?`<b>${t12(s.from)}</b>`:miss("pick a time")}`;
  const tot=p&&!p.reg?p.amt*S.adults+kidPrice()*S.kids:0;
  const fixed=p&&!p.reg,row=(k,n,rate)=>`<div class="r"><span>${k}</span><span>${n}${fixed?` × ${inr(rate)} = ${inr(n*rate)}`:""}</span></div>`;
  $("#est").innerHTML=`<h3>Estimate summary <small>${!p?"shows once you pick a time":"updates by itself"}</small></h3>`+
    row("Adult guests",S.adults,fixed?p.amt:0)+row("Child guests (6–9)",S.kids,kidPrice())+
    `<div class="t"><span>${fixed?"Estimated bill":"Bill"}</span><b id="eT">${!p?"—":p.reg?"As per order":inr(tot)}</b></div>`+
    (c?`<div class="loy">★ ${c.tier} tier · ${c.coins} coins now. Cashback next visit: ${c.earn||8}% back as smile coins (payment link, app or table QR), credited after the visit.</div>`:"");
  $("#create").disabled=!(mobOk()&&nm&&S.adults>0&&S.outlet&&s&&p);
}

$("#ofN").textContent=BK.promos.length;$("#hcN").textContent=BK.cards.length;
