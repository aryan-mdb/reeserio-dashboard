/* ---------- buffet menu per offer ----------
   Read off Atria Mall's printed buffet menu (menu page 1 on the live Outlet Details page, Oct 2026). The veg buffet
   is every veg dish; the non-veg buffet (and every non-veg deal, Regular booking and coupon) is the full veg spread
   plus the non-veg dishes, as the live buffet description says. Other outlets load their menu on the live page. */
const BMENU={outlet:"Atria Mall, Worli",page:0,note:"Items are subject to change as per availability.",sections:[
  ["Starters",["Tandoori Paneer Tikka","Cheesy Broccoli & Mushroom","Hot & Sweet Chilli Pineapple","Tandoori Aloo","Veg Shami Kebab","Cajun Spice Potato","Crispy Corn","Hariyali Grill Veg"],["Achari Chicken Tikka","Chilli Garlic Prawns","Hariyali Fish","Mirch Masala Tangdi","Chicken Seekh Kebab"]],
  ["Main course",["Paneer Lababdar","Veg Biryani","Kadhai Veg","Jeera Aloo","Dal Makhani","Veg Hunan Sauce","Singapurian Noodles","Steam Rice"],["Chicken Biryani","Shikari Murgh","Mutton Burani","Fish in Hot Basil Sauce","Egg Fried Rice"]],
  ["Live counter",["Papadi Chat","Pani Puri","Dahi Puri"],[]],
  ["Soups",["Cream of Tomato Soup"],["Hot & Sour Chicken Soup"]],
  ["Salads",["Russian Salad","Pasta Salad","Kachumber Salad","Corn Pepper Salad","Greek Salad","Veg Garden Salad"],[]],
  ["Accompaniments & dips",["Vegetable Raita","Fry Papad","Roasted Papad","Lemon Wedges","Green Chutney","Garlic Mayo","Mango Mint","Garlic Chutney"],[]],
  ["Western desserts",["Chocolate Brownie","Fruits Cube","Orange Pastry","Chocolate Pastry","Coconut Chocolate Ball","2 varieties of fresh cut fruit","Baked Mahi"],[]],
  ["Indian hot desserts",["Moong Dal Halwa","Gulab Jamun","Balushahi","Kesar Phirnee","Payasam"],[]],
  ["Kulfi & ice-cream",["Malai Pan Mastana","Malai Aam Masti","Chocolate Kulfi","Malai Kesar Shaan","Coconut Kulfi","Strawberry Kulfi","2 varieties of ice-cream"],[]]]};
/* which buffet an offer is: a VEG-only buffet, or non-veg (= the full spread) */
const bufOf=o=>!o?"nv":o.k==="VEG"||o.ft==="VEG"?"veg":"nv";
const bufName=t=>t==="veg"?"Veg buffet":"Non-veg buffet";
const menuFor=t=>BMENU.sections.map(([n,v,nv])=>({n,items:[...v.map(x=>[x,"v"]),...(t==="veg"?[]:nv.map(x=>[x,"n"]))]})).filter(s=>s.items.length);
const menuCount=t=>menuFor(t).reduce((a,s)=>a+s.items.length,0);
const hasMenu=()=>S.outlet===BMENU.outlet;
/* the offer the agent is looking at: an offer key, or VEG / NON-VEG for the plain buffets */
const offerByKey=k=>k==="VEG"||k==="NON-VEG"?{k,name:bufName(k==="VEG"?"veg":"nv"),ft:k}:offers().find(o=>o.k===k);
function openBuffetMenu(key){
  const o=offerByKey(key),t=bufOf(o),M=menuFor(t),nvN=M.reduce((a,s)=>a+s.items.filter(i=>i[1]==="n").length,0);
  if(!hasMenu()){drawer("Buffet menu",S.outlet,[["m",""]],()=>`<p class="note">The buffet menu for ${esc(S.outlet)} loads from CRS on the live page; this preview has Atria Mall, Worli's.</p>`);return}
  drawer(`${bufName(t)} menu`,`${o&&o.k!=="VEG"&&o.k!=="NON-VEG"?esc(o.name)+" · ":""}${S.outlet}`,[["m",""]],()=>`
    <div class="bmh"><span class="bmc"><b>${menuCount(t)}</b> dishes</span>${t==="nv"?`<span class="bmc"><i class="vd n"></i><b>${nvN}</b> non-veg</span><span class="bmc"><i class="vd"></i><b>${menuCount(t)-nvN}</b> veg</span>`:`<span class="bmc"><i class="vd"></i>all veg</span>`}<span class="bmc">Unlimited</span></div>
    ${t==="nv"?`<p class="note" style="margin-top:8px">The non-veg buffet includes the complete veg buffet.</p>`:""}
    ${M.map(s=>`<div class="sec">${esc(s.n)} <small>${s.items.length}</small></div><div class="bml">${s.items.map(([x,k])=>`<span><i class="vd ${k==="n"?"n":""}"></i>${esc(x)}</span>`).join("")}</div>`).join("")}
    <p class="note">${esc(BMENU.note)} Taxes as applicable.</p>
    <div class="dwf"><button class="btn p" type="button" data-send="bmenu" data-arg="${esc(key)}">${WAI}Send this menu</button><button class="btn" type="button" data-lb="menu" data-i="${BMENU.page}">Printed menu</button></div>`);
}
/* the menu in a message: one line per course, so it reads well on a phone */
const menuText=t=>menuFor(t).map(s=>`*${s.n}:* ${s.items.map(i=>i[0]).join(", ")}`).join("\n");
document.addEventListener("click",e=>{const m=e.target.closest("[data-bmenu]");if(m){e.preventDefault();e.stopPropagation();openBuffetMenu(m.dataset.bmenu)}},true);
