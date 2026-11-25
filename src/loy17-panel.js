/* Smile coins & tier: what the guest has, what they earn, how far the next tier is (live: getCustomerByMobileNo_External
   loyalty_points — tier, earn rate, available points, next tier, visits needed). Coins redeem 1:1 on the bill, as the
   live page's "N smile coins · can redeem ₹N" line reads. "Up to 12%" is from the live Smile Please promotion. */
function openLoyalty(){
  const c=cust();if(!c)return;
  const smile=promos().findIndex(p=>/smile/i.test(p.t)),cur=curOffer();
  const pct=c.need?Math.round(100*c.visits/(c.visits+c.need)):100;
  drawer("Smile coins & tier",`${c.name} · ${fmtMob()}`,[["l",""]],()=>`
    <div class="loyc">
      <div class="lt"><span class="lt-b">★ ${esc(c.tier)}</span><small>current tier</small></div>
      <div class="lc"><b>${c.coins.toLocaleString("en-IN")}</b><small>smile coins · can redeem ${inr(c.coins)}${cur?` on this ${inr(cur.tot)} bill`:""}</small></div>
    </div>
    <div class="lrow"><span>Earns</span><b>${c.earn||8}% of the bill back as smile coins</b></div>
    ${c.nextTier?`<div class="lnext"><div class="lnh"><b>${c.need} visit${c.need===1?"":"s"} to ${esc(c.nextTier)}</b><small>${c.visits} done</small></div><div class="lbar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(4,pct)}%"></i></div><small class="note">${esc(c.tier)} → ${esc(c.nextTier)}: higher tiers earn more cashback, up to 12%.</small></div>`:""}
    ${c.expiring?`<p class="note">⚠️ ${esc(c.expiring)}</p>`:""}
    <div class="sec">How the guest earns</div>
    <ol class="lhow"><li>Dine at any Barbeque Nation outlet.</li><li>Pay through the payment link, the app or the table QR.</li><li>Coins are credited after the visit and can be used on the next bill.</li></ol>
    <div class="sec">Tell the guest</div>
    <p class="note" style="margin-top:0">"You have <b>${c.coins}</b> smile coins${c.nextTier?` and are <b>${c.need} visit${c.need===1?"":"s"}</b> away from ${esc(c.nextTier)}`:""}. This visit earns ${c.earn||8}% back."</p>
    ${smile>=0?`<div class="dwf"><button class="btn p" type="button" data-send="offer" data-arg="${smile}">${WAI}Send Smile coins offer</button></div>`:""}`);
}
document.addEventListener("click",e=>{if(e.target.closest("[data-loy]"))openLoyalty()});
