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
  const nameCard=leaf("No Name"),pastLine=nameCard&&[...nameCard.parentElement.parentElement.querySelectorAll("*")].find(e=>e.children.length===0&&/past bookings/.test(txt(e))),notFound=leaf("Customer Activity Not Found!");
  window.sync=function(){
    const s=slotObj(),c=cust();
    const set=(lab,v)=>{const e=after(lab);if(e&&e!==leaf(lab))e.textContent=v};
    set("Phone:",S.mobile?"+91 "+S.mobile:"+91");set("Customer Name:",S.name.trim());set("Booking Time:",s?t12(s.from).replace(/^(\d):/,"0$1:"):"");set("Pax:",String(S.adults+S.kids));
    set("Booking Date:",iso(dateObj()));
    if(nameCard)nameCard.textContent=c?c.name:(S.name.trim()||"No Name");
    if(pastLine)pastLine.textContent=`${S.mobile?S.mobile+" ":""}· ${c?c.total:0} past bookings`;
    if(notFound)notFound.innerHTML=c?`<span class="n18" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button type="button" class="chip t" data-loy="1">★ ${esc(c.tier)} · ${c.coins} coins</button>${c.toNext?`<button type="button" class="chip" data-loy="1">⏳ ${esc(c.toNext)}</button>`:""}<button type="button" class="lk" onclick="openHistory()">Booking history &amp; calls</button></span>`:"Customer Activity Not Found!";
  };
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
    $("#dls").innerHTML=!s?`<div class="text-sm text-600 p-3">Pick a time to see the offers for it.</div>`:`<div class="flex flex-column gap-2">${O.map(o=>{const on=S.pkg===o.k,best=b&&o.k===b.k;
      const look=on?"border:2px solid rgb(255,75,31) !important;background:rgb(255,244,239) !important":"";
      return `<label class="of border-1 border-round-xl p-3 flex align-items-center gap-3 cursor-pointer border-300 bg-white${o.ok?"":" opacity-50"}" style="${look}"><input type="radio" name="dl" value="${esc(o.k)}" ${on?"checked":""} ${o.ok?"":"disabled"} style="position:absolute;opacity:0;width:0;height:0">${chk(o.ok?on:null)}
        <div class="flex-1 min-w-0"><div class="flex align-items-center gap-2 flex-wrap"><span class="text-base font-semibold text-900">${esc(o.name)}</span>${o.reg?tg("AMOUNT NOT FIXED","bg-gray-100 text-gray-600"):o.tag?tg(esc(o.tag),o.coupon?"bg-blue-50 text-blue-700":"bg-red-50 text-red-600"):""}${o.min>1?tg("MIN "+o.min,"bg-orange-50 text-orange-700"):""}${best?tg("BEST FOR "+N,"bg-green-50 text-green-700"):""}</div>
        <div class="text-sm text-600 mt-1">${o.reg?"Standard menu pricing · pay as per actual order":`Per person${o.min>1?` <span class="ml-1">· Minimum ${o.min} pax</span>`:""}${o.coupon?" · with Regular booking":""}`}${o.ok?"":` · <span class="text-red-600">${o.why}</span>`}${o.desc?` · <button type="button" style="border:0;background:none;padding:0;font:inherit;cursor:pointer" class="inf text-primary" data-k="${esc(o.k)}">${S.info===o.k?"Hide":"Details"}</button>`:""}</div>
        ${o.desc&&S.info===o.k?`<div class="text-xs text-600 mt-1">${esc(o.desc)}</div>`:""}
        ${o.ok?`<div class="text-sm text-700 mt-1">${inr(o.pp)} × ${N}${K?` + ${inr(kp)} × ${K} kid${K===1?"":"s"}`:""} = ${inr(o.pre)} + GST = <b>${inr(o.tot)}</b></div><div class="flex gap-2 mt-2">${btn(`data-bmenu="${esc(o.k)}"`,"📖 Menu")}${btn(`data-send="deal" data-arg="${esc(o.k)}"`,WAI+"Send offer")}</div>`:""}</div>
        <div class="flex flex-column align-items-end flex-shrink-0"><span class="text-lg font-bold text-green-700 white-space-nowrap">${inr(o.pp)}</span>${!o.reg&&reg&&o.pp<reg.pp?`<span class="text-xs text-600 line-through white-space-nowrap">${inr(reg.pp)}</span>`:""}${o.ok&&o.save?`<span class="text-xs font-semibold text-green-700 white-space-nowrap mt-1">save ${inr(Math.round(o.save*GST))}</span>`:""}</div></label>`}).join("")}<div class="text-xs text-600 px-1">Price per person · totals for the whole party incl. 5% GST · final bill may vary · <button type="button" style="border:0;background:none;padding:0;font:inherit;cursor:pointer" class="text-primary" data-prices="1">Buffet prices</button></div></div>`;
    const row=(l,v,c="")=>`<div class="flex justify-content-between align-items-center"><span class="text-600 text-sm">${l}</span><span class="text-900 text-sm font-semibold ${c}">${v}</span></div>`;
    $("#est").innerHTML=`<div class="flex flex-column gap-1 mb-3">${row("Adult guests",N)}${row("Child guests",K)}${cur?row(`${N} × ${esc(cur.reg?"Non-veg buffet":cur.name)}`,inr(cur.pp*N))+(K?row(`${K} × Kid (6–9)`,inr(kp*K)):"")+row("GST 5%",inr(cur.tot-cur.pre))+`<div class="flex justify-content-between align-items-center border-top-1 surface-border pt-2 mt-1"><span class="text-900 font-semibold">${cur.reg?"Estimated bill":"Guest pays"}</span><span class="text-xl font-bold text-900">${inr(cur.tot)}</span></div>`+(cur.save?`<div class="text-sm font-semibold text-green-700">Saves ${inr(Math.round(cur.save*GST))} on the regular price</div>`:cur.reg?`<div class="text-xs text-600">Regular booking: final bill as per order</div>`:""):`<div class="text-xs text-600">Pick a time to see the estimate.</div>`}</div>`;
    const cb=$("#create");cb.style.opacity=cb.disabled?".5":"";cb.style.cursor=cb.disabled?"not-allowed":"pointer";
    tpills.forEach(e=>e.classList.toggle("selected",e.dataset.k18===S.slot));
  }
  const r0=render;window.render=render=function(){r0();liveLook();sync()};
  render();
})();
