  // time: Lunch / Dinner, each with its price hint (Cheapest ₹… · when / From ₹…); slot = time + seat dot + party price
  const per=`${S.adults} adult${S.adults===1?"":"s"}${S.kids?` + ${S.kids} kid${S.kids===1?"":"s"}`:""}`;
  if(!S.outlet){$("#slots").innerHTML=`<p class="note">Select an outlet to see times.</p>`;$("#tX").innerHTML="";$("#tN").textContent=""}
  else{
    const L=daySlots(),R=ranges(),cheapR=R.filter(r=>r.cheap);
    const inCheap=x=>cheapR.some(r=>mins(x.from)>=mins(r.from)&&mins(x.from)<=mins(r.to));
    const G=[["Lunch","☀️",L.filter(x=>mins(x.from)<960)],["Dinner","🌙",L.filter(x=>mins(x.from)>=960)]].filter(g=>g[2].length);
    const pill=x=>{const k=x.p+x.from,live=hasData(),sold=live&&x.cap<=0,r=x.cap/x.tot,cls=!live?"":sold?"":r>.4?"s-ok":r>.15?"s-fill":"s-low",few=live&&!sold&&x.cap<=10,pr=sold?0:from(x),ch=!sold&&inCheap(x);
      return `<button type="button" class="tp ${cls} ${sold?"so":""} ${ch?"ch":""} ${S.slot===k?"on":""}" data-k="${k}" aria-pressed="${S.slot===k}" ${sold?"disabled":""} title="${live?(sold?"Sold out":x.cap+" of "+x.tot+" seats left"):""}${ch?" · cheapest time":""}"><b>${live&&!sold?`<i class="dot"></i>`:""}${t12(x.from)}</b><small class="${few?"few":""}">${sold?"Sold out":few?`${x.cap} seats left`:pr?inr(pr):"&nbsp;"}</small></button>`};
    const head=([n,ic])=>{const h=mealHint(n);return `<div class="mh"><span class="mn">${ic} ${n}</span>${h?`<button type="button" class="hint ${h.cheapest?"lo":""}" data-prices="1">${h.cheapest?`⚡ Cheapest ${inr(h.lo)}/person · ${t12(h.r.from)}–${t12(h.r.to)}`:`From ${inr(h.lo)}/person`}</button>`:""}</div>`};
    $("#slots").innerHTML=L.length?G.map(g=>`<div class="tg2">${head(g)}<div class="tps">${g[2].map(pill).join("")}</div></div>`).join(""):`<p class="note">No open times on this day. Pick another date.</p>`;
    $("#tN").textContent=L.length?`price per person for ${per}`:"";
    $("#tX").innerHTML=L.length&&!hasData()?`<p class="note">Seat counts in this preview are for Atria Mall, Worli today; the live page loads them for every outlet and date.</p>`:"";
  }

  // smart panel: a hint first (cheapest time before a slot is picked, best offer after), then every offer ranked
  const O=offers(),b=bestOffer(),cur=curOffer(),reg=O.find(o=>o.reg);
  if(!S.outlet)$("#insight").innerHTML=`<div class="ins mute"><span>💡</span><div>Pick an outlet and a time. The cheapest time and the best offer for this party show up here.</div></div>`;
  else if(!s){const cr=ranges().find(r=>r.cheap),first=cr&&cr.slots.find(x=>!(hasData()&&x.cap<=0));
    $("#insight").innerHTML=cr?`<div class="ins"><span>⚡</span><div><b>Cheapest time today: ${t12(cr.from)} – ${t12(cr.to)}</b><small>Veg ${inr(cr.veg)} · Non-veg ${inr(cr.nv)} per person, before GST · ${per} ≈ <b>${inr(Math.round(cr.veg*S.adults*GST))}</b> (veg) incl. GST</small>${first?`<button type="button" class="lk" data-pick="${first.p+first.from}">Pick ${t12(first.from)}</button>`:`<small>No open slot left in that band today.</small>`}</div></div>`:"";}
  else $("#insight").innerHTML=b&&reg?`<div class="ins ok"><span>✨</span><div><b>Best for ${per}: ${esc(b.name)}</b><small>Guest pays <b>${inr(b.tot)}</b>${b.save?` · saves <b class="sv">${inr(Math.round(b.save*GST))}</b> on ${inr(reg.tot)}`:""} · incl. 5% GST</small>${cur&&cur.k!==b.k?`<button type="button" class="lk" data-use="${esc(b.k)}">Use best offer</button>`:""}</div></div>`:"";
  $("#dS").textContent=s?`${t12(s.from)} · ${per}`:"";
  $("#dls").innerHTML=!s?`<div class="emp">Pick a time to see the offers for it.</div>`:`<div class="ofl">${O.map(o=>{const on=S.pkg===o.k;
    return `<label class="of ${on?"on":""} ${o.ok?"":"off"}"><input type="radio" name="dl" value="${esc(o.k)}" ${on?"checked":""} ${o.ok?"":"disabled"}><span class="bd"><span class="nm">${esc(o.name)}${b&&o.k===b.k?`<span class="tag best">Best</span>`:o.tag?`<span class="tag ${o.coupon?"cp":""}">${esc(o.tag)}</span>`:""}</span><span class="dsub ${o.ok?"":"x"}">${o.ok?esc(o.sub):o.why}${o.desc?` · <button type="button" class="inf" data-k="${esc(o.k)}">${S.info===o.k?"Hide":"Details"}</button>`:""}</span>${o.desc&&S.info===o.k?`<span class="ds">${esc(o.desc)}</span>`:""}</span><span class="pr"><b>${inr(o.tot)}</b>${o.save&&o.ok?`<small class="sv">save ${inr(Math.round(o.save*GST))}</small>`:o.reg?`<small>est.</small>`:""}</span></label>`}).join("")}</div><p class="fine">Totals for the whole party incl. 5% GST · final bill may vary · <button type="button" class="inf" data-prices="1">Buffet prices</button></p>`;

  // the booking read back, gaps in grey
  const miss=t=>`<span class="miss">${t}</span>`;
  $("#rd").innerHTML=`${nm?`<b>${esc(nm)}</b>`:miss("Guest name")} · ${mobOk()?fmtMob():miss("mobile")} · ${per}<br>${S.outlet?`<b>${esc(S.outlet)}</b>`:miss("Outlet")} · ${dayLabel()} · ${s?`<b>${t12(s.from)}</b>`:miss("pick a time")}`;
  // estimate: per person × guests, kids, GST, total, saving
  const kp=kidPrice();
  $("#est").innerHTML=!cur?`<div class="er"><span>Estimate</span><span class="miss">after a time is picked</span></div>`:
    `<div class="er"><span>${S.adults} × ${esc(cur.reg?"Non-veg":cur.name)}</span><span>${inr(cur.pp*S.adults)}</span></div>${S.kids?`<div class="er"><span>${S.kids} × Kid (6–9)</span><span>${inr(kp*S.kids)}</span></div>`:""}<div class="er"><span>GST 5%</span><span>${inr(cur.tot-cur.pre)}</span></div><div class="et"><span>${cur.reg?"Estimated bill":"Guest pays"}</span><b id="eT">${inr(cur.tot)}</b></div>${cur.save?`<div class="es">Saves ${inr(Math.round(cur.save*GST))} on the regular price</div>`:cur.reg?`<div class="es mute">Regular booking: final bill as per order</div>`:""}`+
    (c?`<div class="loy">★ ${esc(c.tier)} · ${c.coins} coins · next visit ${c.earn||8}% back as smile coins</div>`:"");
  $("#create").disabled=!(mobOk()&&nm&&S.adults>0&&S.outlet&&s&&p);
}

/* hints: pick the cheapest time, switch to the best offer, open the day's buffet prices */
document.addEventListener("click",e=>{
  const pk=e.target.closest("[data-pick]");if(pk){S.slot=pk.dataset.pick;render();return}
  const us=e.target.closest("[data-use]");if(us){S.pkg=us.dataset.use;S.manual=true;render();return}
  const pr=e.target.closest("[data-prices]");if(pr){e.preventDefault();openPrices()}
});
function openPrices(){
  const s=slotObj(),kp=kidPrice(),N=S.adults;
  drawer("Buffet prices",`${S.outlet} · ${dayLabel()}`,s?[["s",t12(s.from)],["d","Whole day"]]:[["d",""]],k=>{
    if(k==="s"){const t=mins(s.from),rows=[["Veg",vegAt(t)],["Non-veg",regAt(t,"NON-VEG")],...adultAt(t).filter(p=>/Student/.test(p.dn)).map(p=>[p.dn,p.amt])].filter(r=>r[1]);
      return `<table class="tb2"><tr><th>Buffet</th><th class="n">Per person</th><th class="n">With GST</th><th class="n">For ${N}</th></tr>${rows.map(([n,v])=>`<tr><td>${esc(n)}</td><td class="n">${inr(v)}</td><td class="n">${inr(Math.round(v*GST))}</td><td class="n"><b>${inr(Math.round(v*N*GST))}</b></td></tr>`).join("")}${kp?`<tr><td>Kid (6–9)</td><td class="n">${inr(kp)}</td><td class="n">${inr(Math.round(kp*GST))}</td><td class="n">—</td></tr>`:""}</table><p class="note">Deals and coupons are in the offers list. Final bill may vary.</p>`}
    const R=ranges(),cr=R.find(r=>r.cheap);
    return (cr?`<div class="ins"><span>⚡</span><div><b>Cheapest time: ${t12(cr.from)} – ${t12(cr.to)}</b><small>${cr.meal} · Veg ${inr(cr.veg)} · Non-veg ${inr(cr.nv)} per person, before GST · ${N} adults (veg) ${inr(cr.veg*N)} · ${inr(Math.round(cr.veg*N*GST))} incl. GST</small></div></div>`:"")+
      ["Lunch","Dinner"].map(m=>{const X=R.filter(r=>r.meal===m);return X.length?`<div class="sec">${m}</div>`+X.map(r=>`<div class="li"><div class="m"><b>${t12(r.from)} – ${t12(r.to)} ${r.cheap?`<span class="st2 g" style="display:inline">Cheapest</span>`:""}</b><span>${r.slots.length?`Slots: ${r.slots.map(x=>t12(x.from)).join(", ")}`:"No open slots"}</span></div><div class="pr2"><span>Veg <b>${inr(r.veg)}</b></span><span>Non-veg <b>${inr(r.nv)}</b></span></div></div>`).join(""):""}).join("");
  });
}
