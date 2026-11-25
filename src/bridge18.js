/* booking-18: the live classic page is a static copy. This ties its guest, adult/kid, date and time controls,
   its summary strip, customer card and accordions to the new Price & offers section (booking-17's logic). */
(function(){
  const txt=e=>(e.innerText||e.textContent||"").replace(/\s+/g," ").trim();
  const leaf=(t,root=document)=>[...root.querySelectorAll("body *")].find(e=>e.children.length===0&&txt(e)===t&&!e.closest(".n18,.n18d"));
  const live=e=>e&&!e.closest(".n18,.n18d");
  /* the classes that make a chip look picked = classes on the picked one that the others lack */
  const onCls=(list,isOn)=>{const a=list.find(isOn),o=list.find(x=>!isOn(x));if(!a||!o)return [];return [...a.classList].filter(c=>!o.classList.contains(c))};
  const setOn=(list,el,cls,st)=>list.forEach(x=>{cls.forEach(c=>x.classList.toggle(c,x===el));if(st){x.style.background=x===el?"#ff6200":"";x.style.color=x===el?"#fff":"";x.style.borderColor=x===el?"#ff6200":""}});

  // adults / kids counters
  for(const [label,key] of [["Adult","adults"],["Kids 6-9 yrs","kids"]]){
    const l=leaf(label);if(!l)continue;let box=l.parentElement;while(box&&!box.querySelector("input"))box=box.parentElement;if(!box)continue;
    const inp=box.querySelector("input"),bt=[...box.querySelectorAll("button")];if(bt.length<2)continue;
    S[key]=+inp.value||S[key];
    bt[0].addEventListener("click",()=>{S[key]=Math.max(key==="adults"?1:0,S[key]-1);inp.value=S[key];render()});
    bt[bt.length-1].addEventListener("click",()=>{S[key]=Math.min(99,S[key]+1);inp.value=S[key];render()});
    inp.removeAttribute("disabled");
  }
  // date chips: "Wed 25", "Thu 26", …  (index = days from today)
  const dchips=[...document.querySelectorAll(".calendar-tab")].filter(live);
  const dOn=["calendar-tab--active"];
  const dIdx=dchips.findIndex(e=>dOn.some(c=>e.classList.contains(c)));if(dIdx>=0)S.day=dIdx;
  dchips.forEach((e,i)=>{e.style.cursor="pointer";e.addEventListener("click",ev=>{ev.preventDefault();S.day=i;S.cdate=null;S.manual=false;setOn(dchips,e,dOn,!dOn.length);sync();render()})});
  // time slots: "12:30 PM" pills; times the snapshot has no slot for borrow the slot they fall in
  const tpills=[...document.querySelectorAll(".time-slot")].filter(e=>live(e)&&/^\d{1,2}:\d{2} (AM|PM)$/.test(txt(e)));
  const to24=s=>{let [h,m]=s.split(/[: ]/);h=+h;const pm=/PM/.test(s);if(pm&&h<12)h+=12;if(!pm&&h===12)h=0;return String(h).padStart(2,"0")+":"+m};
  const keyFor=t=>{const m=mins(t);let s=BK.slots.find(x=>x.from===t);if(!s){const c=BK.slots.find(x=>mins(x.from)<=m&&m<mins(x.to))||BK.slots.slice().reverse().find(x=>mins(x.from)<=m);s={p:m<960?"Lunch":"Dinner",from:t,to:t,cap:c?c.cap:0,tot:c?c.tot:0};BK.slots.push(s);BK.slots.sort((a,b)=>mins(a.from)-mins(b.from))}return s.p+s.from};
  const tOn=["selected"];
  tpills.forEach(e=>{const k=keyFor(to24(txt(e)));e.dataset.k18=k;e.style.cursor="pointer";if(tOn.some(c=>e.classList.contains(c)))S.slot=k;
    e.addEventListener("click",ev=>{ev.preventDefault();S.slot=k;S.manual=false;setOn(tpills,e,tOn,!tOn.length);sync();render()})});
  // the (i) next to the outlet, and the three accordions, open booking-17's panels
  const info=document.querySelector(".pi-info-circle");if(info){info.style.cursor="pointer";info.addEventListener("click",e=>{e.preventDefault();openOutlet()})}
  /* a heading whose own text is the label (it may also hold a count badge) */
  const head=t=>[...document.querySelectorAll("body *")].find(e=>live(e)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()===t));
  for(const [t,id] of [["Check Availability","#avBtn"],["Outlet Offers","#ofBtn"],["Happiness Card","#hcBtn"]]){const l=head(t);if(!l)continue;let h=l;for(let k=0;k<4&&h.parentElement&&!/Open/.test(txt(h));k++)h=h.parentElement;h.style.cursor="pointer";h.addEventListener("click",e=>{e.preventDefault();const f=$(id).onclick;f&&f()})}
  // the summary strip and the customer card follow what is typed and picked
  const after=lab=>{const l=leaf(lab);return l&&(l.nextElementSibling||l.parentElement.querySelector("b,strong,span:last-child"))};
  let nameCard,pastLine;const findCard=()=>{nameCard=leaf("No Name");pastLine=nameCard&&[...nameCard.parentElement.parentElement.querySelectorAll("*")].find(e=>e.children.length===0&&/past bookings/.test(txt(e)))};findCard();
  window.sync=function(){
    const s=slotObj(),c=cust();
    const set=(lab,v)=>{const e=after(lab);if(e&&e!==leaf(lab))e.textContent=v};
    set("Phone:",S.mobile?"+91 "+S.mobile:"+91");set("Customer Name:",S.name.trim());set("Booking Time:",s?t12(s.from).replace(/^(\d):/,"0$1:"):"");set("Pax:",String(S.adults+S.kids));
    set("Booking Date:",iso(dateObj()));
    if(nameCard)nameCard.textContent=c?c.name:(S.name.trim()||"No Name");
    if(pastLine)pastLine.textContent=`${S.mobile?S.mobile+" ":""}· ${c?c.total:0} past bookings`;
    // a known guest: the right column turns into the live page's guest card + Booking Info / Call Logs / Call summary
    if(rcol){const key=c?"c:"+S.mobile:"none";if(rcol.dataset.k18!==key){rcol.dataset.k18=key;rcol.innerHTML=c?guestCol(c):rcol0;if(!c)findCard()}}
    if(sendOut)sendOut.style.display=mobOk()?"":"none";
    if(BETA)betaSync(s,c);
  };
  /* ---------- the live Beta page (booking-18-beta): step bar, estimate chips, review bar, guest profile ---------- */
  const BETA=!!document.querySelector("app-customer-profile");
  // Angular scopes component CSS with an _ngcontent-* attribute; markup made here copies it so the live styles apply
  const ngOf=el=>{const a=el&&[...el.attributes].find(a=>a.name.startsWith("_ngcontent"));return a&&a.name};
  const stamp=(root,name)=>{if(name)root.querySelectorAll("*").forEach(e=>e.setAttribute(name,""))};
  const cpBox=document.querySelector("app-customer-profile .cp"),cp0=cpBox?cpBox.innerHTML:"",cpNg=ngOf(cpBox);
  const DOW=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const parseW=w=>{const m=(w||"").match(/^(\d{1,2}) (\w{3}) (\d{4}) · (\d{1,2}):(\d{2}) (AM|PM)$/);if(!m)return null;let h=+m[4]%12+(m[6]==="PM"?12:0);return {d:new Date(+m[3],MON.indexOf(m[2]),+m[1],h,+m[5]),dd:m[1].padStart(2,"0"),mon:m[2],yy:m[3].slice(2),t:`${m[4].padStart(2,"0")}:${m[5]} ${m[6]}`}};
  function betaProfile(c){
    const ini=(c.name||"?").split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();
    const bk=(c.bookings||[]).map(x=>{const w=parseW(x.w),u=parseW(x.made),bad=/not|cancel|no.?show/i.test(x.st||"");
      return `<div class="cp-booking"><div class="cp-date"><span class="d">${w?w.dd:""}</span><span class="m">${w?w.mon+" "+w.yy:""}</span></div><div class="cp-b-main"><div class="cp-b-top"><span class="cp-b-outlet" title="${esc(x.o)}">${esc(x.o)}</span><span class="cp-status" data-tone="${bad?"bad":"good"}">${esc(x.st)}</span></div><div class="cp-b-meta"><span><i class="pi pi-clock"></i>${w?DOW[w.d.getDay()]+", "+w.t:""}</span><span><i class="pi pi-users"></i>${(+x.ad||0)+(+x.ch||0)} guests</span><span class="cp-b-id">#${esc(x.id)}</span></div><div class="cp-b-foot"> Updated ${u?u.dd+" "+u.mon+", "+u.t:esc(x.made||"")}${x.by?`  · by ${esc(x.by)}`:""} </div></div><button type="button" title="Booking details" class="cp-eye" data-hist="1"><i class="pi pi-arrow-right"></i></button></div>`}).join("");
    return `<section class="cp-card cp-hero"><div class="cp-id"><span class="cp-avatar">${esc(ini)} </span><div class="cp-who"><span class="cp-name">${esc(c.name)}</span><span class="cp-phone"><i class="pi pi-phone"></i>${esc(S.mobile)} </span></div><button type="button" title="View smile coin history" class="cp-tier" data-tier="${esc((c.tier||"").toUpperCase())}" data-loy="1"> ★ ${esc(c.tier)} </button></div><div class="cp-stats"><div class="cp-stat"><span class="cp-stat-num">${c.total}</span><span class="cp-stat-label">Bookings</span></div><div class="cp-stat coins" data-loy="1" style="cursor:pointer"><span class="cp-stat-num">${c.coins}</span><span class="cp-stat-label">Smile coins</span></div></div>${c.toNext?`<div class="cp-strip" data-loy="1" style="cursor:pointer"><i class="pi pi-arrow-up-right"></i><span>${esc(c.toNext)}</span></div>`:""}</section>`+
      `<section class="cp-card cp-history"><nav class="cp-tabs"><button type="button" class="active"> Bookings <span class="cp-count">${c.total}</span></button><button type="button" data-hist="1"> Call logs </button><button type="button" data-hist="2"><i class="pi pi-headphones"></i> Recordings </button></nav><div class="cp-list">${bk||`<div class="cp-b-foot" style="padding:12px">No bookings yet.</div>`}${c.total>(c.bookings||[]).length?`<button type="button" class="cp-more" data-hist="1"> Show more bookings </button>`:""}</div></section>`;
  }
  function betaSync(s,c){
    const per=`${S.adults} adult${S.adults===1?"":"s"}${S.kids?`, ${S.kids} kid${S.kids===1?"":"s"}`:""}`,cur=curOffer(),nm=S.name.trim();
    // guest profile
    if(cpBox){const key=c?"c:"+S.mobile:"none";if(cpBox.dataset.k18!==key){cpBox.dataset.k18=key;cpBox.innerHTML=c?betaProfile(c):cp0;if(c)stamp(cpBox,cpNg)}}
    // estimate chips: adults, kids, time
    const eg=document.querySelector(".est-guests");if(eg){const n=ngOf(eg);eg.innerHTML=`<span class="est-chip"><i class="pi pi-user"></i> ${S.adults} adult${S.adults===1?"":"s"} </span><span class="est-chip"><i class="pi pi-face-smile"></i> ${S.kids} kid${S.kids===1?"":"s"} </span>${s?`<span class="est-chip"><i class="pi pi-clock"></i> ${t12(s.from).replace(/^(\d):/,"0$1:")} </span>`:""}`;stamp(eg,n)}
    const sp=document.querySelector(".slot-picked");if(sp)sp.innerHTML=s?`<i class="pi pi-check-circle"></i> ${t12(s.from).replace(/^(\d):/,"0$1:")} selected `:"";
    // step bar + review bar: Guest, Outlet & time, Booking type
    const d=dateObj(),dl=`${DOW[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`;
    const done=[mobOk()&&!!nm&&S.adults>0,!!(S.outlet&&s),!!cur];
    const vals=[[nm,mobOk()?S.mobile:"",per].filter(Boolean).join(" · "),`${S.outlet||"Outlet"} · ${dl}${s?" "+t12(s.from).replace(/^(\d):/,"0$1:"):""}`,cur?cur.name:"Buffet deal or regular"];
    const steps=[...document.querySelectorAll(".journey-step")],seps=[...document.querySelectorAll(".journey-sep")],first=done.indexOf(false);
    steps.forEach((st,i)=>{const ic=st.querySelector(".journey-icon"),v=st.querySelector(".journey-value");if(i<3){st.classList.toggle("done",done[i]);if(v){v.textContent=vals[i];v.title=vals[i]}if(ic)ic.innerHTML=done[i]?`<i class="pi pi-check" ${ngOf(ic)||""}></i>`:` ${i+1} `}st.classList.toggle("active",i===(first<0?3:first))});
    seps.forEach((x,i)=>x.classList.toggle("done",!!done[i]));
    const n=done.filter(Boolean).length,names=["Guest","Outlet & time","Booking type"];
    const pr=document.querySelector(".journey-progress");if(pr)pr.textContent=` ${n}/3 done `;
    const sub=document.querySelector(".rv-bar-sub");if(sub)sub.textContent=first<0?" 3/3 done · ready to create ":` ${n}/3 done · next: ${names[first]} `;
    document.querySelectorAll(".rv-dots i").forEach((x,i)=>x.classList.toggle("on",!!done[i]));
    const cta=document.querySelector(".rv-bar-cta");if(cta)cta.disabled=$("#create").disabled;
  }
  if(BETA){
    const cta=document.querySelector(".rv-bar-cta");if(cta)cta.addEventListener("click",()=>{const c=$("#create");if(!c.disabled)c.click()});
    document.querySelectorAll(".meal-price").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();openPrices()}));
    const qc={"Buffet prices":()=>openPrices(),"Offers":()=>$("#ofBtn").onclick&&$("#ofBtn").onclick(),"Best offer":()=>$("#insight").scrollIntoView({behavior:"smooth",block:"center"}),"Nearby outlet":()=>$("#avBtn").onclick&&$("#avBtn").onclick()};
    document.querySelectorAll("button").forEach(b=>{const f=qc[txt(b)];if(f&&!b.closest("#dls,#insight,.n18d")){b.style.cursor="pointer";b.addEventListener("click",e=>{e.preventDefault();f()})}});
    const jr=document.querySelector(".journey-reset");if(jr)jr.addEventListener("click",()=>location.reload());
  }
  /* live markup (captured read-only from reeserio.bnhl.in with the test guest), filled from the guest's data */
  const rcol=nameCard&&nameCard.closest("section,.surface-card")&&nameCard.closest("section,.surface-card").parentElement,rcol0=rcol?rcol.innerHTML:"";
  const stCls=st=>/confirm|complete|seat/i.test(st)&&!/not/i.test(st)?"text-green-700":"text-red-400";
  const when=(w,sep=" | ")=>{const m=(w||"").match(/^(\d{1,2})( .*?) · (\d{1,2}):(\d{2}) (AM|PM)$/);return m?`${m[1].padStart(2,"0")}${m[2]}${sep}${m[3].padStart(2,"0")}:${m[4]} ${m[5]}`:esc(w||"")};
  function guestCol(c){
    const bk=(c.bookings||[]).map(x=>`<div class="flex gap-3 border-1 border-round border-gray-300 py-2 mb-2 px-2"><div class="flex-1"><div class="flex justify-content-between"><div><span class="font-bold text-700">${esc(x.id)}</span></div><div class="flex gap-2 text-500"><span class="bg-green-50 text-green-700 text-xs font-bold uppercase px-3 py-1 border-round-2xl"><span class="${stCls(x.st)}"> ${esc((x.st||"").toUpperCase().replace(/\s+/g,"_"))} </span></span><span title="Details"><i class="pi pi-eye text-blue-300 cursor-pointer" data-hist="1"></i></span></div></div><div><span class="block text-sm font-semibold text-500 mr-3"> ${esc(x.o)} <span class="text-700">- ${(+x.ad||0)+(+x.ch||0)} Guest</span></span><span class="block text-sm font-semibold text-700 ml-auto"> ${when(x.w)} </span></div><div class="border-top-1 surface-border my-2"></div><div class="flex mt-2"><span class="text-sm text-500 font-semibold"> Updated - ${when(x.made," ")}${x.by?` <span class="text-orange-400 font-bold text-sm"> By - ${esc(x.by)} </span>`:""}</span></div></div></div>`).join("")||`<div class="text-sm text-500 p-2">No bookings yet.</div>`;
    const tab=(t,i,extra)=>`<li role="presentation" class="${i===0?"p-highlight":""}"><a role="tab" class="p-tabview-nav-link" data-hist="${i}" style="cursor:pointer;display:flex;align-items:center;user-select:none;text-decoration:none;color:#495057;font-weight:600"><header class="flex justify-content-between"><span class="flex"> ${t} ${extra}</span></header></a></li>`;
    const dot=`<span class="ml-3" style="position:relative;top:-6px"><span class="p-badge p-component p-badge-danger p-badge-dot"></span></span>`;
    return `<section class="surface-card border-round-xl p-3 mb-3 shadow-1"><div class="flex align-items-center gap-3"><div class="flex align-items-center justify-content-center flex-shrink-0 border-circle bg-gray-100 text-700 w-3rem h-3rem text-xl"> 👤 </div><div class="flex-1 min-w-0"><div class="text-lg font-semibold text-900 text-overflow-ellipsis overflow-hidden white-space-nowrap"> ${esc(c.name)} </div><div class="text-sm text-500 mt-1"> ${esc(S.mobile)} · ${c.total} past bookings </div></div><span class="flex-shrink-0 border-round-xl px-2 py-1 text-sm font-semibold white-space-nowrap cursor-pointer bg-gray-100 text-gray-700" data-loy="1"> ★ ${esc(c.tier)} · ${c.coins} coins </span></div>${c.toNext?`<div class="flex align-items-center gap-2 mt-3 p-2 md:p-3 bg-yellow-50 text-yellow-800 border-round-lg cursor-pointer" data-loy="1"><span class="text-base flex-shrink-0"> ⏳ </span><span class="flex-1 text-sm"><b>${esc(c.toNext)}</b></span></div>`:""}</section>`+
      `<section class="surface-card border-round-xl p-3 mb-3 shadow-1"><div class="custom-booking-tabs p-tabview p-component p-tabview-scrollable"><div class="p-tabview-nav-container"><div class="p-tabview-nav-content"><ul role="tablist" class="p-tabview-nav" style="display:flex;list-style:none;margin:0">${tab("Booking Info",0,`<span class="tab-count bg-gray-600 ml-1"> ${c.total} </span>`)}${tab("Call Logs",1,dot)}${tab("Call summary",2,dot)}</ul></div></div><div class="p-tabview-panels"><div role="tabpanel" class="p-tabview-panel" style="max-height:340px;overflow:auto">${bk}</div></div></div></section>`;
  }
  // the eye and the Call Logs / Call summary tabs open booking-17's history drawer (bookings, calls, summary)
  document.addEventListener("click",e=>{if(e.target.closest("[data-hist]")){e.preventDefault();openHistory()}});
  // "Send Outlet Details" at the end of the strip, as on live once a number is typed
  let sendOut=null;{const pax=leaf("Pax:");const row=pax&&pax.parentElement&&pax.parentElement.parentElement;
    if(row){sendOut=document.createElement("div");sendOut.className="flex gap-1";sendOut.style.display="none";sendOut.innerHTML=`<span class="font-semibold text-primary cursor-pointer" data-send="outlet">Send Outlet Details </span>`;row.appendChild(sendOut)}}
  /* booking-17 draws its own look; redraw the same numbers in the live page's deal-card markup (PrimeFlex classes
     from the live CSS) so the section looks like the live one. Same data-* hooks, so Menu / Send / Use still work. */
  const chk=on=>`<span class="offer-radio" style="pointer-events:none;flex-shrink:0"><div class="p-checkbox p-component${on===null?" p-checkbox-disabled":""}"><div class="p-checkbox-box${on?" p-highlight":""}${on===null?" p-disabled":""}">${on?`<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7.2l2.6 2.6L11 4.4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`:""}</div></div></span>`;
  const tg=(t,c)=>`<span class="${c} px-2 py-1 border-round-md text-xs font-semibold">${t}</span>`;
  const btn=(attrs,html)=>`<button type="button" ${attrs} class="border-1 border-primary text-primary bg-white border-round-md px-2 py-1 text-xs font-semibold cursor-pointer inline-flex align-items-center gap-1">${html}</button>`;
  const strip=(html,c="text-blue-500 bg-blue-50")=>`<div class="${c} text-center py-2 px-3 border-round-sm text-sm">${html}</div>`;
  // the agent coupon "CRS Coupon 85rs Off" is not offered on this page
  if(typeof BK!=="undefined"&&BK.coupons)BK.coupons=BK.coupons.filter(c=>c.amt!==85);
  /* on a price tie a deal goes before Regular booking (booking-17's sort compares reg as undefined - true = NaN, so a
     tie kept Regular first and it became "best", though Regular has no fixed amount) */
  const of0=offers;offers=function(){return of0().sort((a,z)=>(z.ok-a.ok)||(a.tot-z.tot)||(!!a.reg-!!z.reg))};
  function liveLook(){
    const s=slotObj(),O=offers(),b=bestOffer(),cur=curOffer(),reg=O.find(o=>o.reg),N=S.adults,K=S.kids,kp=kidPrice();
    const per=`${N} adult${N===1?"":"s"}${K?` + ${K} kid${K===1?"":"s"}`:""}`;
    const ins=$("#insight");
    /* booking-17's hint box: "Price & offers <time · party>" then the cheapest time (before a slot) or the best offer */
    const box=(ic,title,line,act,bg,fg)=>`${BETA?"":`<div class="flex align-items-center gap-2 mb-2"><span class="text-xl font-bold text-900">Price &amp; offers</span><span class="text-sm text-600">${s?t12(s.from)+" · ":""}${per}</span></div>`}<div class="flex gap-3 align-items-start border-round-xl p-3" style="background:${bg}"><span class="text-xl" style="line-height:1.2">${ic}</span><div class="flex-1"><div class="font-bold text-base" style="color:${fg}">${title}</div><div class="text-sm text-700 mt-1">${line}</div>${act}</div></div>`;
    if(!s){const R=ranges(),cr=R.find(r=>r.cheap),co=R.find(r=>r.cheapOpen)||cr,dl=S.cdate||S.day?"on "+dayLabel():"today";
      ins.innerHTML=co?box("⚡",`Cheapest time ${dl}: ${t12(co.from)} – ${t12(co.to)}`,`From ${inr(co.lo)}/person (veg ${inr(co.veg)} · non-veg ${inr(co.nv)}) · ${per} from <b>${inr(Math.round(co.lo*N*GST))}</b> incl. GST`,co.open&&co.open[0]?`<button type="button" style="border:0;background:none;padding:0;font:inherit;cursor:pointer;margin-top:4px" class="text-primary font-semibold text-sm" data-pick="${co.open[0].p+co.open[0].from}">Pick ${t12(co.open[0].from)}</button>`:"","#fff7ed","#9a3412"):""}
    else ins.innerHTML=b&&reg?box("✨",`Best for ${per}: ${esc(b.name)}`,`Guest pays <b>${inr(b.tot)}</b>${b.save?` · saves <b class="text-green-700">${inr(Math.round(b.save*GST))}</b> on ${inr(reg.tot)}`:""} · incl. 5% GST`,cur&&cur.k!==b.k?`<button type="button" style="border:0;background:none;padding:0;font:inherit;cursor:pointer;margin-top:4px" class="text-primary font-semibold text-sm" data-use="${esc(b.k)}">Use best offer</button>`:"","#ecfdf3","#14532d"):"";
    $("#dls").innerHTML=!s?`<div class="text-sm text-600 p-3">Pick a time to see the offers for it.</div>`:`<div class="flex flex-column gap-2">${[...O.filter(o=>!o.reg),...O.filter(o=>o.reg)].map(o=>{const on=S.pkg===o.k,best=b&&o.k===b.k;
      const look=on?"border:2px solid rgb(255,75,31) !important;background:rgb(255,244,239) !important":"";
      /* two slim lines: name, tags and price; then the sum with Save, Menu and Send on the right */
      const sum=o.ok&&!o.reg?`${inr(o.pp)} × ${N}${K?` + ${inr(kp)} × ${K}`:""} + GST = <b class="text-900">${inr(o.tot)}</b>`:"";
      const sub=o.reg?"Standard menu pricing · pay as per actual order":[o.min>1?`Min ${o.min} pax`:"",o.coupon?"with Regular booking":"",sum,o.ok?"":`<span class="text-red-600">${o.why}</span>`].filter(Boolean).join(" · ")+(o.desc?` · <button type="button" style="border:0;background:none;padding:0;font:inherit;cursor:pointer" class="inf text-primary" data-k="${esc(o.k)}">${S.info===o.k?"Hide":"Details"}</button>`:"");
      return `<label class="of border-1 border-round-xl py-2 px-3 flex align-items-center gap-3 cursor-pointer border-300 bg-white${o.ok?"":" opacity-50"}" style="${look}"><input type="radio" name="dl" value="${esc(o.k)}" ${on?"checked":""} ${o.ok?"":"disabled"} style="position:absolute;opacity:0;width:0;height:0">${chk(o.ok?on:null)}
        <div class="flex-1 min-w-0"><div class="flex align-items-center gap-2 flex-wrap"><span class="text-base font-semibold text-900">${esc(o.name)}</span>${o.reg?tg("AMOUNT NOT FIXED","bg-gray-100 text-gray-600"):o.tag?tg(esc(o.tag),o.coupon?"bg-blue-50 text-blue-700":"bg-red-50 text-red-600"):""}${o.min>1?tg("MIN "+o.min,"bg-orange-50 text-orange-700"):""}${best?tg("BEST FOR "+N,"bg-green-50 text-green-700"):""}${o.reg?"":`<span class="ml-auto flex align-items-baseline gap-2 white-space-nowrap">${reg&&o.pp<reg.pp?`<span class="text-xs text-600 line-through">${inr(reg.pp)}</span>`:""}<span class="text-lg font-bold text-green-700">${inr(o.pp)}</span></span>`}</div>
        <div class="flex align-items-center gap-2 flex-wrap mt-1"><span class="text-sm text-600">${sub}</span>${o.ok&&!o.reg?`<span class="ml-auto flex align-items-center gap-2">${o.save?`<span class="bg-green-50 text-green-700 border-round-xl px-2 py-1 text-xs font-semibold white-space-nowrap">Save ${inr(Math.round(o.save*GST))}</span>`:""}${btn(`data-bmenu="${esc(o.k)}"`,"📖 Menu")}${btn(`data-send="deal" data-arg="${esc(o.k)}"`,WAI+"Send")}</span>`:""}</div>
        ${o.desc&&S.info===o.k?`<div class="text-xs text-600 mt-1">${esc(o.desc)}</div>`:""}</div></label>`}).join("")}<div class="text-xs text-600 px-1">Price per person · totals for the whole party incl. 5% GST · final bill may vary · <button type="button" style="border:0;background:none;padding:0;font:inherit;cursor:pointer" class="text-primary" data-prices="1">Buffet prices</button></div></div>`;
    const row=(l,v,c="")=>`<div class="flex justify-content-between align-items-center"><span class="text-600 text-sm">${l}</span><span class="text-900 text-sm font-semibold ${c}">${v}</span></div>`;
    $("#est").innerHTML=`<div class="flex flex-column gap-1 mb-3">${BETA?"":row("Adult guests",N)+row("Child guests",K)}${cur&&cur.reg?`<div class="text-xs text-600 mt-1">Regular booking · amount not fixed: the guest orders from the menu and pays as per actual order</div>`:cur?row(`${N} × ${esc(cur.reg?"Non-veg buffet":cur.name)}`,inr(cur.pp*N))+(K?row(`${K} × Kid (6–9)`,inr(kp*K)):"")+row("GST 5%",inr(cur.tot-cur.pre))+`<div class="flex justify-content-between align-items-center border-top-1 surface-border pt-2 mt-1"><span class="text-900 font-semibold">${cur.reg?"Estimated bill":"Guest pays"}</span><span class="text-xl font-bold text-900">${inr(cur.tot)}</span></div>`+(cur.save?`<div class="text-sm font-semibold text-green-700">Saves ${inr(Math.round(cur.save*GST))} on the regular price</div>`:cur.reg?`<div class="text-xs text-600">Regular booking: final bill as per order</div>`:""):`<div class="text-xs text-600">Pick a time to see the estimate.</div>`}</div>`;
    const c=cust(),eh=$("#est").previousElementSibling;if(eh&&!BETA){let tb=eh.querySelector(".t18");if(!tb){tb=document.createElement("span");tb.className="t18 flex align-items-center gap-1 bg-yellow-100 text-yellow-800 border-round-xl px-2 py-1 text-xs font-medium";eh.appendChild(tb)}tb.innerHTML=c?`<i class="pi pi-star-fill text-xs"></i> ${esc(c.tier.toUpperCase())} tier `:"";if(!c)tb.remove()}
    if(c)$("#est").insertAdjacentHTML("beforeend",`<div class="flex align-items-center gap-2 my-2"><div class="flex-1 border-top-1 border-yellow-300"></div><span class="text-xs text-900 font-medium white-space-nowrap"><span class="text-yellow-700"> - </span> And there's more, for next time </span><div class="flex-1 border-top-1 border-yellow-300"></div></div><div class="bg-yellow-50 border-1 border-yellow-300 border-round-lg p-3 mb-3 cursor-pointer" data-loy="1"><div class="flex align-items-start justify-content-between gap-2"><div class="flex-1"><div class="flex align-items-center gap-2 flex-wrap"><span class="text-yellow-900 font-semibold text-sm"> Cashback for next visit </span><span class="bg-yellow-100 text-yellow-800 border-round-xl px-2 py-1 text-xs font-medium"> ★ ${esc(c.tier.toUpperCase())} tier benefit </span></div><div class="text-yellow-800 text-xs line-height-2 mt-1"> ${c.earn||8}% back as smile coins · payment link, app or table QR · credited after the visit </div></div><span class="text-yellow-900 font-semibold white-space-nowrap"> ${c.coins} coins </span></div></div>`);
    const cb=$("#create");cb.style.opacity=cb.disabled?".5":"";cb.style.cursor=cb.disabled?"not-allowed":"pointer";
    tpills.forEach(e=>e.classList.toggle("selected",e.dataset.k18===S.slot));
  }
  const r0=render;window.render=render=function(){r0();liveLook();sync()};
  render();
})();
