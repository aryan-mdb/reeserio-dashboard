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
  const r0=render;window.render=render=function(){r0();sync()};
  render();
})();
