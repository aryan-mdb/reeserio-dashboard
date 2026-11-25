/* ---------- prices, offers and the "smart" hints (as on the live Beta page's SPARK panel) ---------- */
const GST=1.05;
const adultAt=t=>BK.prices.filter(p=>p.ct==="Adult"&&mins(p.from)<=t&&t<=mins(p.to));
const pkgs=()=>{const s=slotObj();return s?adultAt(mins(s.from)):[]};
const kidPrice=()=>{const s=slotObj();if(!s)return 0;const t=mins(s.from);const k=BK.prices.find(p=>p.ct==="Child"&&mins(p.from)<=t&&t<=mins(p.to));return k?k.amt:0};
/* regular per-person price at a time: the NON-VEG / VEG buffet, else the struck-out price of any deal running then */
const regAt=(t,ft)=>{const P=adultAt(t),r=P.find(p=>p.dn===ft);return r?r.amt:Math.max(0,...P.filter(p=>p.ft===ft||ft==="NON-VEG").map(p=>p.orig))};
const vegAt=t=>{const P=adultAt(t),v=P.filter(p=>p.dn==="VEG"||/VEG \/ NON-VEG/.test(p.dn)).map(p=>p.amt);return v.length?Math.min(...v):0};
/* every way this party can be billed at the picked time, cheapest first; ineligible ones last with the reason */
function offers(){
  const s=slotObj();if(!s)return [];
  const t=mins(s.from),N=S.adults,K=S.kids,kp=kidPrice(),base=regAt(t,"NON-VEG"),L=[];
  L.push({k:"REG",name:"Regular booking",tag:"Pay as per order",sub:`Non-veg buffet ₹${base.toLocaleString("en-IN")}/person`,pp:base,save:0,ok:true,reg:true});
  for(const q of adultAt(t).filter(p=>p.dn!=="NON-VEG"&&p.dn!=="VEG")){const ok=N>=q.min;
    L.push({k:q.dn,name:q.dn,tag:q.rib,sub:`Buffet deal · ₹${q.amt.toLocaleString("en-IN")}/person${q.min>1?` · min ${q.min}`:""}${/Student/.test(q.dn)?" · student ID at outlet":""}`,pp:q.amt,save:Math.max(0,(base-q.amt)*N),ok,why:ok?"":`Needs ${q.min-N} more guest${q.min-N>1?"s":""}`,student:/Student/.test(q.dn),ft:q.ft,desc:BK.desc[q.dn]})}
  /* CRS agent coupons work only with Regular booking, in the band of the regular price */
  BK.coupons.forEach((c,i)=>{if(base>=c.minP&&base<=c.maxP)L.push({k:"CPN:"+i,name:c.n,tag:"Agent coupon",sub:`₹${c.amt} off/person · with Regular booking`,pp:base-c.amt,save:c.amt*N,ok:true,coupon:true})});
  L.forEach(o=>{o.pre=o.pp*N+kp*K;o.tot=Math.round(o.pre*GST)});
  return L.sort((a,b)=>(b.ok-a.ok)||(a.tot-b.tot)||(a.reg-b.reg));
}
/* the best pick: cheapest eligible, never Student (needs an ID at the outlet) */
const bestOffer=()=>offers().find(o=>o.ok&&!o.student);
const curOffer=()=>offers().find(o=>o.k===S.pkg);
function autoPick(){if(!slotObj()){S.pkg=null;return}const c=curOffer();if(S.manual&&c&&c.ok)return;S.manual=false;const b=bestOffer();S.pkg=b?b.k:"REG"}
/* the shape the booking ticket expects */
const pkObj=()=>{const o=curOffer();return !o?null:o.reg?{dn:"Regular booking",reg:true}:{dn:o.name,amt:o.pp,reg:false}};
/* per-person price this party gets at a slot (best eligible deal or coupon), to quote from the time list */
const from=x=>{const keep=S.slot,keepP=S.pkg;S.slot=x.p+x.from;const b=bestOffer();S.slot=keep;S.pkg=keepP;return b?b.pp:0};
/* price ranges of the day: veg and non-veg per person in each time band, cheapest marked */
function ranges(){
  const bands=[...new Set(BK.prices.filter(p=>p.ct==="Adult").map(p=>p.from+"-"+p.to))].map(r=>{const [a,b]=r.split("-");return {from:a,to:b}})
    .sort((x,y)=>mins(x.from)-mins(y.from)).map(r=>{const t=mins(r.from);return {...r,veg:vegAt(t),nv:regAt(t,"NON-VEG"),meal:t<960?"Lunch":"Dinner",slots:daySlots().filter(s=>mins(s.from)>=mins(r.from)&&mins(s.from)<=mins(r.to))}})
    .filter(r=>r.veg||r.nv);
  const low=Math.min(...bands.map(r=>r.veg||r.nv));bands.forEach(r=>r.cheap=(r.veg||r.nv)===low);
  return bands;
}
const mealHint=meal=>{const R=ranges().filter(r=>r.meal===meal);if(!R.length)return null;const lo=Math.min(...R.map(r=>r.veg||r.nv)),allLow=ranges().every(r=>(r.veg||r.nv)>=lo),r=R.find(x=>(x.veg||x.nv)===lo);return {lo,cheapest:allLow,r}};
