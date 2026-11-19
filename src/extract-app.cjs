// Turn the read-only crawl into one compact, privacy-masked dataset for the public prototype.
// Customer phone numbers, emails and surnames are masked; payment links and recordings are dropped.
const fs = require('fs');
const a = require('./live/crawl2.json'), b = require('./live/crawl3.json');
const cap = { ...a.cap, ...b.cap }, pages = { ...a.pages, ...b.pages };
const rowsOf = j => { if (Array.isArray(j)) return j; if (!j || typeof j !== 'object') return null; for (const k of ['data', 'result', 'rows', 'items', 'list', 'offers', 'branchInstructions', 'leads', 'records']) if (j[k]) { const r = rowsOf(j[k]); if (r) return r; } for (const v of Object.values(j)) if (Array.isArray(v) && v.length && typeof v[0] === 'object') return v; return null; };
// pages.json (crawl4) holds pages 1..5 of each list; use them when present, de-duplicated, page-1 total kept.
const P5 = fs.existsSync('./live/pages.json') ? require('./live/pages.json') : { api: {}, odcText: [] };
const get = (page, re) => {
  const c = (cap[page] || []).filter(c => re.test(c.u)).pop();
  const raw = c ? JSON.parse(c.body) : null;
  // only the page's own list API has extra pages (same patterns as crawl4.mjs); other calls on that page keep their single response
  const LIST = { 'Manage Payment Links': 'payment-link-list', 'Coupon Issue Request': 'issue-coupon-list', 'Quotation List': 'QuotationMaster', 'Advance Collection': 'AdvanceCollection', 'Agent Call Review': 'AgentQuality\\/calls', 'Team Lead Call Review': 'team-leaders', 'Domestic View Leads': 'fetch-leads-data', 'International View Leads': 'FetchKnowlarityCalls', 'Offer Matrix': 'OfferMaster' };
  const isList = LIST[page] && re.source.replace(/\\\//g, '/').includes(LIST[page].replace(/\\\//g, '/'));
  const multi = (isList ? P5.api[page] || [] : []).map(t => { try { return rowsOf(JSON.parse(t)) || []; } catch { return []; } });
  if (!multi.length) return { rows: raw ? rowsOf(raw) || [] : [], raw };
  const seen = new Set(), rows = [];
  for (const r of multi.flat()) { const k = JSON.stringify(r); if (!seen.has(k)) { seen.add(k); rows.push(r); } }
  return { rows, raw: raw || JSON.parse(P5.api[page][0]) };
};
const totalOf = raw => { const s = JSON.stringify(raw || {}); const m = s.match(/"(?:totalRows|totalRecords|total_count|totalCount|recordsTotal|total)":\s*"?(\d+)/); return m ? +m[1] : null; };

const phone = v => { const d = String(v ?? '').replace(/\D/g, ''); return d.length >= 8 ? d.slice(0, 2) + 'X'.repeat(d.length - 5) + d.slice(-3) : (v ?? ''); };
const email = v => { const s = String(v ?? ''); const i = s.indexOf('@'); return i > 0 ? s[0] + '***' + s.slice(i) : s; };
const name = v => { const p = String(v ?? '').trim().split(/\s+/).filter(Boolean); if (!p.length) return ''; const f = p[0][0].toUpperCase() + p[0].slice(1).toLowerCase(); return p.length > 1 ? `${f} ${p.at(-1)[0].toUpperCase()}.` : f; };
const scrub = v => String(v ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\d[\d\s-]{6,}\d/g, m => phone(m)).replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, m => email(m)).replace(/\s+/g, ' ').trim();
const dt = v => v ? String(v).replace('T', ' ').slice(0, 16) : '';

const out = {};
{ const { rows, raw } = get('Manage Payment Links', /payment-link-list/);
  out.paylinks = { total: totalOf(raw), rows: rows.map(r => ({ booking: r.booking_id, customer: name(r.customer_name), email: email(r.email), mobile: phone(r.contact_number), amount: +r.amount || 0, status: r.status, comment: scrub(r.comment), linkId: r.payment_link_id ? String(r.payment_link_id).slice(0, 6) + '…' : '', by: r.issued_by, created: dt(r.created_date), updated: dt(r.updated_date) })) };
  out.couponOptions = get('Manage Payment Links', /coupon-options/).rows.map(r => ({ id: r.VoucherHeadId, name: r.RuleName, value: r.ValuePerCover, minCovers: r.MinCoversInBill })); }
{ const { rows, raw } = get('Coupon Issue Request', /issue-coupon-list/);
  out.coupons = { total: totalOf(raw), rows: rows.map(r => ({ booking: r.lead_booking_id, guest: name(r.lead_name), coupon: r.coupon_name, contact: phone(r.lead_contact), type: r.coupon_type || '', value: +r.coupon_value || 0, reqAt: dt(r.coupon_request_datetime || r.created_datetime), reqBy: r.request_user_name || '', apprBy: r.approved_user_name || '', apprAt: dt(r.coupon_issue_datetime), pay: r.payment_status || '', status: typeof r.coupon_status === 'object' && r.coupon_status ? r.coupon_status.text : (r.coupon_status || ''), outlet: r.lead_outlet, city: r.lead_city, pax: r.lead_num_of_pax, din: [r.lead_din_date, r.lead_din_time].filter(Boolean).join(' ') })) }; }
{ const { rows, raw } = get('Quotation List', /QuotationMaster/);
  out.quotes = { total: totalOf(raw), rows: rows.map(r => ({ lead: r.leadID, email: email(r.toEmail), title: scrub(r.emailTitle), qtitle: scrub(r.quotationTitle), by: r.createdBy, at: dt(r.created_at), body: scrub(r.emailBody).slice(0, 900) })) }; }
{ const { rows, raw } = get('Advance Collection', /AdvanceCollection\/list/);
  out.advance = { total: totalOf(raw), rows: rows.map(r => ({ booking: r.booking_Id, channel: r.source_Channel, source: r.source_Name, brand: r.brand, branch: r.branch_Name, guest: name(r.guest_Name), mobile: phone(r.guest_Mobile), pax: r.pax, resAt: dt(r.reservation_Datetime), createdAt: dt(r.booking_Created_At), agent: r.booking_Agent_Name, status: r.collection_Status, amount: +r.advance_Amount || 0, pay: r.payment_Status || '', resend: r.resend_Count || 0 })) }; }
{ const { rows, raw } = get('Agent Call Review', /AgentQuality\/calls/);
  out.calls = { total: totalOf(raw), rows: rows.map(r => ({ id: r.id, agent: r.agentName, guest: phone(r.guestPhone), at: dt(r.callAt), dur: r.callDuration, outcome: r.outcome, withGuest: r.callsWithGuest, bad: r.badCallsWithGuest, summary: scrub(r.callSummary).slice(0, 400), remarks: scrub(r.agentRemarks).slice(0, 200), repeat: r.repeat, rating: r.rating, status: r.reviewStatus })) }; }
{ const { rows, raw } = get('Team Lead Call Review', /team-leaders/);
  out.tls = { total: totalOf(raw), rows: rows.map(r => ({ name: r.teamLeaderName, agents: r.agentCount ?? r.totalAgents, calls: r.totalCalls, bad: r.badCalls, badPct: r.badCallPercent, ack: r.acknowledgedCalls, rating: r.avgAgentRating, tDone: r.trainingDone, tPend: r.trainingPending, improved: r.improvedAgents, trained: r.trainedAgents })) }; }
{ const { rows, raw } = get('Domestic View Leads', /fetch-leads-data/);
  out.leads = { total: totalOf(raw), rows: rows.map(r => ({ id: r.lead_id, booking: r.booking_id, customer: name(r.lead_name), source: r.source_name, stype: r.lead_source_type, contact: phone(r.lead_contact), slot: dt(r.slot_date_time), outlet: r.outlet_name, pax: r.lead_num_of_pax, agent: r.agent_name, status: r.lead_status_name, city: r.lead_city, created: dt(r.created_at), priority: r.priority })) };
  out.leadSources = get('Domestic View Leads New', /counts-lms/).rows.map(r => ({ name: r.sourceName, count: r.totalCount }));
  out.dropdown = get('Domestic View Leads', /dropdown-data/).rows.map(r => r.name).slice(0, 45); }
{ const { rows, raw } = get('International View Leads', /FetchKnowlarityCalls/);
  out.intl = { total: totalOf(raw), rows: rows.map(r => ({ caller: phone(r.callerNumber), at: dt(r.call_date_time), outlet: r.storeName, status: r.agentStatus, dur: r.callDurationSec, category: r.callCategory, crs: r.crS_Actionable, crsRemark: scrub(r.crS_Actionable_Remark).slice(0, 160), bstatus: r.crsBookingStatus, bremark: scrub(r.crsBookingRemark).slice(0, 160), by: r.crsBookingStatusByUserName, booking: r.bookingid, times: r.noof_times_called, ai: scrub(r.aiTranscript).slice(0, 500) })) }; }
{ const t = [...new Set((P5.odcText.length ? P5.odcText : [pages['Manage Cater Leads'].text]).join('\n').split('\n').filter(l => /^BNAT_\d+\t/.test(l)))];
  out.odc = { rows: t.map(l => { const c = l.split('\t'); return { id: c[0], event: c[1].slice(0, 10), query: c[2].slice(0, 16), guest: name(c[3]), contact: phone(c[4]), pax: +c[5] || c[5], status: c[6], assigned: c[7], ack: c[8], loc: c[9] }; }), pages: 247 }; }
{ const { rows } = get('Branch Instruction', /BranchInstruction\/export/);
  out.instr = rows.map(r => ({ branch: r.branch_name, day: r.day_name, session: r.session_name, type: r.instruction_type, date: r.instruction_applicable_date ? String(r.instruction_applicable_date).slice(0, 10) : '', text: scrub(r.instruction_remarks).slice(0, 240) })); }
{ const { rows, raw } = get('Offer Matrix', /OfferMaster\/list/);
  out.offers = { total: totalOf(raw), rows: rows.map(r => ({ vh: r.voucherHeadId, name: r.offerName, type: r.offerType, from: String(r.fromDate || '').slice(0, 10), to: String(r.toDate || '').slice(0, 10), time: [r.fromTime, r.toTime].map(x => String(x || '').slice(0, 5)).join('–'), last: String(r.lastEntryTime || '').slice(0, 5), price: `${r.minPrice}–${r.maxPrice}`, pax: `${r.minPax}–${r.maxPax}`, gap: r.bookingGap, thr: r.thresHold, disc: r.discountAmount, desc: scrub(r.description), filter: r.outletFilterType, prio: r.priority, days: (r.days || []).map(d => d.dayName.slice(0, 3)).join(' '), outlets: (r.outlets || []).length })) }; }
{ const { rows } = get('Branch Slot Managment', /SlotDefinitionMaster/);
  out.slots = rows.map(r => ({ branch: r.branch, day: r.weekDay, times: String(r.slotTimes || '').split(/[,|]/).map(s => s.trim()).filter(Boolean), from: String(r.fromDate || '').slice(0, 10), to: String(r.toDate || '').slice(0, 10), createdAt: dt(r.createdAt), by: r.createdBy, updatedAt: dt(r.updatedAt), updBy: r.updatedBy || '' })); }
{ out.did = get('DID Mapping', /DID\/getlist/).rows.map(r => ({ name: r.didName, number: r.didNumber, flow: r.flowType, proc: r.processName }));
  out.didProc = get('DID Mapping', /did-process-list/).rows.map(r => r.processName); }
out.intlBranches = get('International Booking', /InterNationalBranchList/).rows.map(r => r.branchName);
out.toscano = get('Toscano Salt Booking', /FetchToscanoSalt/).rows.map(r => ({ name: r.branchName, city: r.city, liquor: r.liquor }));
// Access Control & Administration (users, roles, permission matrix). Staff phone/email masked;
// login IDs masked too, since a public list of real login IDs would help password guessing.
if (fs.existsSync('./live/acct.json') && fs.existsSync('./live/admin.json')) {
  const acct = require('./live/acct.json'), adm = require('./live/admin.json');
  const body = re => JSON.parse(acct.cap.filter(c => re.test(c.u)).pop().body);
  const roleJ = body(/RoleMaster\/list/).data;
  const roleRows = rowsOf(roleJ) || [];
  out.roles = roleRows.map(r => ({ id: r.roleID, name: r.roleName, code: r.roleCode, desc: r.description, users: r.userCount, active: r.active }));
  const roleName = Object.fromEntries(out.roles.map(r => [r.id, r.name]));
  const U = rowsOf(body(/User\/GetAllUsers/)) || [];
  const byId = Object.fromEntries(U.map(u => [u.userID, u.userName]));
  const loginMask = v => { const s = String(v || ''); return s.length > 2 ? s.slice(0, 2) + '•'.repeat(Math.min(6, s.length - 2)) : s; };
  // user names are the login IDs for almost everyone, so they are masked as well (first 2 + last letter)
  const nameMask = v => { const s = String(v || '').trim(); if (!s) return ''; return s.length <= 3 ? s[0] + '••' : s.slice(0, 2) + '•'.repeat(Math.min(4, s.length - 3)) + s.slice(-1); };
  for (const u of U) { u._n = nameMask(u.userName); }
  for (const k of Object.keys(byId)) byId[k] = nameMask(byId[k]);
  out.users = U.map(u => ({ id: u.userID, name: u._n, login: loginMask(u.loginID), role: roleName[u.roleID] || String(u.roleID ?? ''), roleId: u.roleID, type: u.agentType || '', email: email(u.emailID), phone: phone(u.mobileNo),
    tl: u.teamLeadID ? byId[u.teamLeadID] || '' : '', qa: nameMask(u.qaName), onRoll: !!u.isOnRoll, active: !!u.active, status: u.active ? 'Active' : 'Deactive',
    twoFA: u.isRequiredTwoFactorEnabled ? 'Yes' : 'No', pub: u.isPublicAccess ? 'Yes' : 'No', wa: !!u.whatsAppLogin, last: dt(u.lastLogin), created: dt(u.createdOn) }));
  out.perms = {};
  for (const [id, t] of Object.entries(adm.perms || {})) {
    const arr = rowsOf(JSON.parse(t)) || []; const seen = new Set();
    out.perms[id] = arr.filter(m => !seen.has(m.moduleId) && seen.add(m.moduleId)).sort((a, b) => a.sortOrder - b.sortOrder)
      .map(m => ({ id: m.moduleId, n: m.moduleName, g: m.groupName, ops: ['View', 'Edit', 'Add', 'Delete', 'Export', 'Import'].map(o => [!!m['moduleCan' + o], !!m['can' + o]]) }));
  }
  out.addUserFields = adm.addUser ? adm.addUser.labels : [];
}
out.crawledAt = new Date().toISOString();
fs.writeFileSync('app-data.json', JSON.stringify(out));
for (const [k, v] of Object.entries(out)) console.log(k, Array.isArray(v) ? v.length : v && v.rows ? `rows ${v.rows.length} total ${v.total}` : typeof v);
console.log('sample', JSON.stringify(out.paylinks.rows[0]), JSON.stringify(out.coupons.rows[0]).slice(0, 400), JSON.stringify(out.calls.rows[0]).slice(0, 300));
