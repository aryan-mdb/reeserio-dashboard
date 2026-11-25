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
  };
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
  function liveLook(){
    const s=slotObj(),O=offers(),b=bestOffer(),cur=curOffer(),reg=O.find(o=>o.reg),N=S.adults,K=S.kids,kp=kidPrice();
    const per=`${N} adult${N===1?"":"s"}${K?` + ${K} kid${K===1?"":"s"}`:""}`;
    const ins=$("#insight");
    if(!s){const R=ranges(),cr=R.find(r=>r.cheapOpen)||R.find(r=>r.cheap);
      ins.innerHTML=cr?strip(`<b>CHEAPEST TIME: ${t12(cr.from)} - ${t12(cr.to)} @${cr.veg}/-</b> · ${per} ≈ ${inr(Math.round(cr.veg*N*GST))} incl. GST${cr.open&&cr.open[0]?` · <button type="button" style="border:0;background:none;padding:0;font:inherit;cursor:pointer" class="text-primary font-semibold" data-pick="${cr.open[0].p+cr.open[0].from}">Pick ${t12(cr.open[0].from)}</button>`:""}`):""}
    else ins.innerHTML=b&&reg?strip(`<b>BEST FOR ${per.toUpperCase()}: ${esc(b.name)}</b> · Guest pays <b>${inr(b.tot)}</b>${b.save?` · saves <b>${inr(Math.round(b.save*GST))}</b>`:""} incl. 5% GST${cur&&cur.k!==b.k?` · <button type="button" style="border:0;background:none;padding:0;font:inherit;cursor:pointer" class="text-primary font-semibold" data-use="${esc(b.k)}">Use best offer</button>`:""}`,"text-green-700 bg-green-50"):"";
    $("#dls").innerHTML=!s?`<div class="text-sm text-600 p-3">Pick a time to see the offers for it.</div>`:`<div class="flex flex-column gap-2">${[...O.filter(o=>!o.reg),...O.filter(o=>o.reg)].map(o=>{const on=S.pkg===o.k,best=b&&o.k===b.k;
      const look=on?"border:2px solid rgb(255,75,31) !important;background:rgb(255,244,239) !important":"";
      return `<label class="of border-1 border-round-xl p-3 flex align-items-center gap-3 cursor-pointer border-300 bg-white${o.ok?"":" opacity-50"}" style="${look}"><input type="radio" name="dl" value="${esc(o.k)}" ${on?"checked":""} ${o.ok?"":"disabled"} style="position:absolute;opacity:0;width:0;height:0">${chk(o.ok?on:null)}
        <div class="flex-1 min-w-0"><div class="flex align-items-center gap-2 flex-wrap"><span class="text-base font-semibold text-900">${esc(o.name)}</span>${o.reg?tg("AMOUNT NOT FIXED","bg-gray-100 text-gray-600"):o.tag?tg(esc(o.tag),o.coupon?"bg-blue-50 text-blue-700":"bg-red-50 text-red-600"):""}${o.min>1?tg("MIN "+o.min,"bg-orange-50 text-orange-700"):""}${best?tg("BEST FOR "+N,"bg-green-50 text-green-700"):""}</div>
        <div class="text-sm text-600 mt-1">${o.reg?"Standard menu pricing · pay as per actual order":`Per person${o.min>1?` <span class="ml-1">· Minimum ${o.min} pax</span>`:""}${o.coupon?" · with Regular booking":""}`}${o.ok?"":` · <span class="text-red-600">${o.why}</span>`}${o.desc?` · <button type="button" style="border:0;background:none;padding:0;font:inherit;cursor:pointer" class="inf text-primary" data-k="${esc(o.k)}">${S.info===o.k?"Hide":"Details"}</button>`:""}</div>
        ${o.desc&&S.info===o.k?`<div class="text-xs text-600 mt-1">${esc(o.desc)}</div>`:""}
        ${o.ok&&!o.reg?`<div class="text-sm text-700 mt-1">${inr(o.pp)} × ${N}${K?` + ${inr(kp)} × ${K} kid${K===1?"":"s"}`:""} = ${inr(o.pre)} + GST = <b>${inr(o.tot)}</b></div><div class="flex gap-2 mt-2">${btn(`data-bmenu="${esc(o.k)}"`,"📖 Menu")}${btn(`data-send="deal" data-arg="${esc(o.k)}"`,WAI+"Send offer")}</div>`:""}</div>
        ${o.reg?"":`<div class="flex flex-column align-items-end flex-shrink-0"><span class="text-lg font-bold text-green-700 white-space-nowrap">${inr(o.pp)}</span>${!o.reg&&reg&&o.pp<reg.pp?`<span class="text-xs text-600 line-through white-space-nowrap">${inr(reg.pp)}</span>`:""}${o.ok&&o.save?`<span class="text-xs font-semibold text-green-700 white-space-nowrap mt-1">save ${inr(Math.round(o.save*GST))}</span>`:""}</div>`}</label>`}).join("")}<div class="text-xs text-600 px-1">Price per person · totals for the whole party incl. 5% GST · final bill may vary · <button type="button" style="border:0;background:none;padding:0;font:inherit;cursor:pointer" class="text-primary" data-prices="1">Buffet prices</button></div></div>`;
    const row=(l,v,c="")=>`<div class="flex justify-content-between align-items-center"><span class="text-600 text-sm">${l}</span><span class="text-900 text-sm font-semibold ${c}">${v}</span></div>`;
    $("#est").innerHTML=`<div class="flex flex-column gap-1 mb-3">${row("Adult guests",N)}${row("Child guests",K)}${cur&&cur.reg?`<div class="text-xs text-600 mt-1">Regular booking · amount not fixed: the guest orders from the menu and pays as per actual order</div>`:cur?row(`${N} × ${esc(cur.reg?"Non-veg buffet":cur.name)}`,inr(cur.pp*N))+(K?row(`${K} × Kid (6–9)`,inr(kp*K)):"")+row("GST 5%",inr(cur.tot-cur.pre))+`<div class="flex justify-content-between align-items-center border-top-1 surface-border pt-2 mt-1"><span class="text-900 font-semibold">${cur.reg?"Estimated bill":"Guest pays"}</span><span class="text-xl font-bold text-900">${inr(cur.tot)}</span></div>`+(cur.save?`<div class="text-sm font-semibold text-green-700">Saves ${inr(Math.round(cur.save*GST))} on the regular price</div>`:cur.reg?`<div class="text-xs text-600">Regular booking: final bill as per order</div>`:""):`<div class="text-xs text-600">Pick a time to see the estimate.</div>`}</div>`;
    const c=cust(),eh=$("#est").previousElementSibling;if(eh){let tb=eh.querySelector(".t18");if(!tb){tb=document.createElement("span");tb.className="t18 flex align-items-center gap-1 bg-yellow-100 text-yellow-800 border-round-xl px-2 py-1 text-xs font-medium";eh.appendChild(tb)}tb.innerHTML=c?`<i class="pi pi-star-fill text-xs"></i> ${esc(c.tier.toUpperCase())} tier `:"";tb.style.display=c?"":"none"}
    if(c)$("#est").insertAdjacentHTML("beforeend",`<div class="flex align-items-center gap-2 my-2"><div class="flex-1 border-top-1 border-yellow-300"></div><span class="text-xs text-900 font-medium white-space-nowrap"><span class="text-yellow-700"> - </span> And there's more, for next time </span><div class="flex-1 border-top-1 border-yellow-300"></div></div><div class="bg-yellow-50 border-1 border-yellow-300 border-round-lg p-3 mb-3 cursor-pointer" data-loy="1"><div class="flex align-items-start justify-content-between gap-2"><div class="flex-1"><div class="flex align-items-center gap-2 flex-wrap"><span class="text-yellow-900 font-semibold text-sm"> Cashback for next visit </span><span class="bg-yellow-100 text-yellow-800 border-round-xl px-2 py-1 text-xs font-medium"> ★ ${esc(c.tier.toUpperCase())} tier benefit </span></div><div class="text-yellow-800 text-xs line-height-2 mt-1"> ${c.earn||8}% back as smile coins · payment link, app or table QR · credited after the visit </div></div><span class="text-yellow-900 font-semibold white-space-nowrap"> ${c.coins} coins </span></div></div>`);
    const cb=$("#create");cb.style.opacity=cb.disabled?".5":"";cb.style.cursor=cb.disabled?"not-allowed":"pointer";
    tpills.forEach(e=>e.classList.toggle("selected",e.dataset.k18===S.slot));
  }
  const r0=render;window.render=render=function(){r0();liveLook();sync()};
  render();
})();
