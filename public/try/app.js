/* Sabha concept prototype.
   The user's AI agent (third party) proposes actions. Sabha makes the reasoning visible,
   challenges it, and lets the user decide what gets acted on.
   Living Memory corrects the information. Council challenges the reasoning. Gate enforces the decision.
   All data is simulated. */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const rupee = n => "₹" + Math.round(n).toLocaleString("en-IN");
const sleep = ms => new Promise(r => setTimeout(r, ms));
let toastT;
function toast(m){ const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 3200); }

/* ---------- state ---------- */
const S = {
  paused: false, cap: 2000, asksMax: 5, asksUsed: 2, coolMins: 120, lifeChange: true,
  onlyYou: { relationships: true, health: true }, stressLock: false,
  budget: null,            // null = not clarified yet, "hard" or "flex"
  reconciled: false, reconcileNote: "", fightW0: 9, fightW: 9,
  wakeType: "Experiment", wakeConfirmed: "20 Oct", premiumInf: "inferred",
  iar: { met: 41, total: 52 }, deleted: false, added: [],
  coolEnd: Date.now() + 120 * 60000, urgEnd: Date.now() + 20 * 60000
};
const SIGNALS = [
  { id: "hr", n: "Heart rate", emo: true }, { id: "stress", n: "Stress / mood estimate", emo: true },
  { id: "loc", n: "Location" }, { id: "msg", n: "Messages" }, { id: "sleep", n: "Sleep", emo: true }, { id: "buy", n: "Purchase history" }
];
const PURPOSES = [{ id: "health", n: "Health reminders" }, { id: "sched", n: "Scheduling" }, { id: "shop", n: "Shopping suggestions" }, { id: "ads", n: "Ads and partners" }];
const PERM = {
  hr: { health: true, sched: false, shop: false, ads: false }, stress: { health: true, sched: true, shop: false, ads: false },
  loc: { health: false, sched: true, shop: true, ads: false }, msg: { health: false, sched: true, shop: false, ads: false },
  sleep: { health: true, sched: true, shop: false, ads: false }, buy: { health: false, sched: false, shop: true, ads: false }
};
const sigName = id => SIGNALS.find(s => s.id === id).n;
const purName = id => PURPOSES.find(p => p.id === id).n;
const locked = (sig, pur) => S.stressLock && SIGNALS.find(s => s.id === sig).emo && (pur === "shop" || pur === "ads");
const allowed = (sig, pur) => !locked(sig, pur) && PERM[sig][pur];

/* ---------- failure modes and lanes ---------- */
const TAGS = { routine: "Routine", context: "Human context", growth: "Human growth", flex: "Decision flexibility", influence: "Commercial influence" };
const LANES = { auto: { n: "Auto", c: "var(--leaf)" }, notify: { n: "Notify", c: "var(--blue)" }, ask: { n: "Ask", c: "var(--amber)" }, council: { n: "Council", c: "var(--green)" }, only: { n: "Only You", c: "var(--red)" } };
const laneChip = l => `<span class="lane" style="--c:${LANES[l].c}">${LANES[l].n}</span>`;
const tagChips = c => c.tags.map(t => `<i class="tag ${t}">${TAGS[t]}</i>`).join("");
$("#legend").innerHTML = ["context", "growth", "flex", "influence"].map(t => `<i class="tag ${t}">${TAGS[t]}</i>`).join("");

// Fixed, user-configured rules. The agent being checked never sets its own permissions.
function laneOf(c){
  if (c.fixedLane) return c.fixedLane;
  if (c.cat && S.onlyYou[c.cat]) return "only";
  if (c.purchase && c.f.heat === 3) return "ask";
  if (c.f.stakes === 3) return "council";
  if (c.f.conf === 3) return "ask";
  if (c.amount != null && c.amount > S.cap) return "ask";
  return "auto";
}
const coolLabel = () => S.coolMins >= 60 ? `${S.coolMins / 60}-hour` : `${S.coolMins}-minute`;
function reasonOf(c, lane){
  if (lane === "only") return "Relationships are yours alone. Your AI can inform you, but never acts or recommends.";
  if (lane === "ask" && c.purchase && c.f.heat === 3) return `You seem upset and this is a purchase, so nothing is bought now. It waits for you, with a ${coolLabel()} cooling period.`;
  if (lane === "council") return "High stakes and not easy to undo, so nothing happens until the council has examined it and you’ve decided.";
  if (lane === "ask" && c.f.conf === 3) return "This conflicts with an intention you set, so your AI holds it until you choose.";
  if (lane === "ask") return `${rupee(c.amount)} is above the ${rupee(S.cap)} your AI may spend alone, so it waits for your yes.`;
  return "Routine, small and easy to undo, so your AI just did it.";
}

/* ---------- council seats (defined roles, not chatbots) ---------- */
const SEATS = [
  { id: "present", name: "Present Self", q: "What do you want now?", img: "assets/p-present.jpg" },
  { id: "future", name: "Future Self", q: "What happens later?", img: "assets/p-future.jpg" },
  { id: "values", name: "Values & Commitments", q: "What must not be compromised?", img: "assets/p-values.jpg" },
  { id: "skeptic", name: "The Skeptic", q: "What might be missing?", img: "assets/p-skeptic.jpg" },
  { id: "optimizer", name: "The Optimizer", q: "What alternatives exist?", img: "assets/p-friend.jpg" },
  { id: "auditor", name: "Influence Auditor", q: "Who benefits?", img: null }
];
const face = s => s.img ? `<img src="${s.img}" alt="">` : `<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="5.5"/><path d="M15 15l5 5"/></svg>`;

/* ---------- the cases: the AI's day ---------- */
const CASES = [
  { id: "groceries", time: "9:02 am", title: "Restocked your weekly groceries, ₹1,840", tags: ["routine"], amount: 1840, purchase: true, fixedLane: "auto",
    f: { stakes: 1, rev: 1, unc: 1, conf: 1, heat: 1 }, status: "done", routine: true },
  { id: "wake", time: "8:30 am", title: "Booked the gym at 12:30 pm and moved tomorrow’s 9 am call to 11:30", tags: ["growth"],
    f: { stakes: 1, rev: 1, unc: 2, conf: 3, heat: 1 }, status: "pending" },
  { id: "flight", time: "12:20 pm", title: "Found the cheapest move-day flight, ₹5,400. You asked for the cheapest under ₹6,000", tags: ["flex"], amount: 5400, purchase: true,
    f: { stakes: 2, rev: 2, unc: 1, conf: 2, heat: 1 }, status: "pending" },
  { id: "laptop", time: "11:40 am", title: "Picked a ₹58,900 laptop. You asked for one under ₹60,000", tags: ["flex", "influence"], amount: 58900, purchase: true,
    f: { stakes: 3, rev: 2, unc: 2, conf: 1, heat: 1 }, status: "pending" },
  { id: "earbuds", time: "2:10 pm", title: "Suggests ₹4,200 earbuds, minutes after a heated call", tags: ["influence"], amount: 4200, purchase: true, hero: true,
    f: { stakes: 2, rev: 2, unc: 2, conf: 2, heat: 3 }, status: "pending", sigs: [["hr", "shop", "112 bpm during your call"], ["stress", "shop", "stress read as high"], ["buy", "shop", "you bought earbuds in 2038"]] },
  { id: "riya", time: "2:30 pm", title: "Suggests declining Riya’s dinner tonight and keeping some distance", tags: ["context"], cat: "relationships",
    f: { stakes: 3, rev: 3, unc: 3, conf: 2, heat: 3 }, status: "pending" }
];
CASES.sort((a, b) => toMin(a.time) - toMin(b.time));
function toMin(t){ const m = t.match(/(\d+):(\d+)\s*(am|pm)/); let h = +m[1] % 12; if (m[3] === "pm") h += 12; return h * 60 + +m[2]; }
const caseOf = id => CASES.find(c => c.id === id);
const CLOSED = { done: "Done", undone: "Undone", kept: "Kept", decided: "You decided", snoozed: "Snoozed until 4:10 pm", later: "Saved for later", declined: "Declined" };

function renderFeed(){
  $("#feed").innerHTML = CASES.map(c => {
    const lane = laneOf(c);
    let st = c.status === "pending" ? "Needs you" : CLOSED[c.status] || "Done";
    if (c.id === "earbuds" && c.status === "pending") st = `Cooling <span class="js-cool"></span>`;
    return `<li><button class="item ${c.hero && c.status === "pending" ? "hero" : ""} ${c.status !== "pending" && c.status !== "done" ? "closed" : ""}" data-case="${c.id}">
      <span class="time">${c.time}</span>
      <span><span class="what">${esc(c.title)}</span><span class="meta">${laneChip(lane)}${tagChips(c)}</span></span>
      <span class="state ${c.status === "pending" ? "need" : c.status === "done" ? "ok" : ""}">${st}</span></button></li>`;
  }).join("");
  const need = CASES.filter(c => c.status === "pending").length;
  $("#needsLbl").textContent = need ? `${need} need${need === 1 ? "s" : ""} you` : "Nothing needs you";
  $("#asksLbl").textContent = `Asks today: ${S.asksUsed} of ${S.asksMax}`;
  $("#lcBanner").hidden = !S.lifeChange;
  tick();
}
$("#feed").addEventListener("click", e => { const b = e.target.closest("[data-case]"); if (b) openCase(b.dataset.case); });

/* ---------- building blocks of a case ---------- */
const sec = (title, html) => `<div class="sec">${title ? `<div class="sec-t">${title}</div>` : ""}${html}</div>`;
const saathi = (say, why, cls = "") => `<div class="saathi ${cls}"><div class="who">AI proposes</div><p class="say">${say}</p>${why ? `<p style="font-size:13.5px;color:var(--mute);margin-top:6px">AI’s reason: ${why}</p>` : ""}</div>`;
const header = c => `<div class="case-h"><div class="meta">${laneChip(laneOf(c))}${tagChips(c)}</div><h2 id="caseTitle">${esc(c.title)}</h2><p class="ctx">Today, ${c.time}</p></div>`;
const btns = list => `<div class="acts">${list.map(([id, l, ghost]) => `<button class="btn ${ghost ? "ghost" : ""}" data-act="${id}">${l}</button>`).join("")}</div>`;
const INF = { ver: "Verified sponsored", sus: "Suspected influence", unk: "Unknown status", none: "No sponsorship found" };
const infTag = k => `<span class="inf ${k}">${INF[k]}</span>`;

function gateCard(c){
  const lane = laneOf(c);
  const F = [["stakes", "Stakes", ["Low", "Medium", "High"]], ["rev", "Reversibility", ["Easy", "Partial", "Hard"]], ["unc", "Uncertainty", ["Low", "Some", "High"]], ["conf", "Conflicts with your intentions", ["No", "Maybe", "Yes"]], ["heat", "Emotional heat", ["Calm", "Some", "High"]]];
  const col = v => v === 3 ? "var(--red)" : v === 2 ? "var(--amber)" : "var(--leaf)";
  const cooling = lane === "ask" && c.purchase && c.f.heat === 3 && c.status === "pending";
  return sec("Gate · what your AI may do", `<div class="gate"><div class="meters">${F.map(([k, l, v]) => `<div class="meter l${c.f[k]}" style="--c:${col(c.f[k])}"><span>${l}</span><div class="segs"><i></i><i></i><i></i></div><b>${v[c.f[k] - 1]}</b></div>`).join("")}</div>
    <div class="gate-out"><span class="arrow">Route →</span>${laneChip(lane)}${cooling ? `<span class="cool">Cooling <span class="js-cool"></span></span>` : ""}<p>${reasonOf(c, lane)}</p></div></div>`);
}
function receipt(c, open){
  const rows = c.sigs.map(([s, p, why]) => ({ label: sigName(s), purpose: purName(p), why, ok: allowed(s, p), lk: locked(s, p), sig: s }));
  const bad = rows.filter(r => !r.ok);
  const flag = bad.length ? `<div class="flag">Blocked: used your ${bad.map(b => b.sig === "hr" ? "heart rate" : b.sig === "stress" ? "stress level" : b.label.toLowerCase()).join(" and ")} for a shopping suggestion. Suggestion blocked from auto-purchase.</div>` : `<div class="flag fine">Every signal used here is one you permit for this purpose.</div>`;
  return sec("", `<details class="receipt" ${open ? "open" : ""}><summary>Why this? What your AI used</summary>
    <ul class="rc">${rows.map(r => `<li><span>${esc(r.label)} <small>for ${esc(r.purpose)}, ${esc(r.why)}</small></span><span class="${r.ok ? "ok" : "no"}">${r.ok ? "Permitted" : r.lk ? "Locked by you" : "Not permitted"}</span></li>`).join("")}</ul>${flag}
    <p style="margin-top:10px"><button class="link" data-goto="signals">Change signal permissions</button></p></details>`);
}
const convene = (c, label) => c.councilRun ? `<div id="councilSlot">${briefCard(c)}</div>` : `<div id="councilSlot" class="sec"><button class="convene" data-convene><span class="faces">${SEATS.map(s => s.img ? `<img src="${s.img}" alt="">` : `<span></span>`).join("")}</span>${label || "Convene the Council"}</button></div>`;

// Informed Agency Rate criteria, checked live for every consequential decision.
function crit(c){
  return [
    ["Relevant intentions and assumptions surfaced", !!c.ctxDone],
    ["Alternatives and trade-offs presented", !!c.altDone],
    ["Known influence disclosed, unknowns named", !!c.infDone],
    ["You chose before anything executed", c.status !== "pending"],
    ["Within your permissions", true]
  ];
}
function checkCard(c){
  if (c.routine) return sec("", `<p class="note" style="--c:var(--leaf)">Routine, so not counted as a consequential decision. Everyday tasks stay frictionless.</p>`);
  const cr = crit(c), n = cr.filter(x => x[1]).length;
  return `<div class="sec" id="checkSlot"><ul class="check"><li class="ttl">Informed choice check · ${n} of 5${n === 5 ? " · counts toward your Informed Agency Rate" : ""}</li>${cr.map(([l, ok]) => `<li class="${ok ? "y" : ""}">${l}</li>`).join("")}</ul></div>`;
}
function refreshCheck(){ const s = $("#checkSlot"); if (s && current) s.outerHTML = checkCard(current); }

/* ---------- case sheet ---------- */
let current = null, councilToken = null;
function openCase(id){ current = caseOf(id); $("#sheet").hidden = false; renderCase(); $(".sheet-in").scrollTop = 0; }
function closeCase(){ $("#sheet").hidden = true; current = null; councilToken = null; }
document.addEventListener("click", e => {
  if (e.target.id === "sheet" || e.target.closest("[data-close]")) closeCase();
  const g = e.target.closest("[data-goto]"); if (g){ closeCase(); go("memory"); memTab(g.dataset.goto); }
  const v = e.target.closest("[data-view]"); if (v) go(v.dataset.view);
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeCase(); });

function renderCase(){
  const c = current; if (!c) return;
  const open = c.status === "pending";
  let h = header(c);

  if (c.id === "groceries"){
    h += sec("", saathi("I reordered your usual basket. It arrives at 6 pm.", "same basket as the last 6 weeks"));
    h += gateCard(c) + receipt({ sigs: [["buy", "shop", "to repeat your usual basket"]] });
    h += checkCard(c);
    h += sec("", c.status === "done" ? btns([["undo", "Undo order", 1], ["fine", "Looks good"]]) : `<p class="done">${CLOSED[c.status]}</p>`);
  }

  if (c.id === "wake"){
    c.ctxDone = true; c.infDone = true;
    h += sec("", saathi("Gym at 12:30 pm, and tomorrow’s 9 am call moved to 11:30.", "you usually wake around 11 am"));
    h += sec("Living Memory · what Sabha checked", `<ul class="ctxlist"><li class="stale"><span>Wakes around 11:00 am</span><span class="prov past">Past behaviour, 2039 to 2040</span></li>
      <li><span>Wake at 5:00 am · ${S.wakeType.toLowerCase()} since 20 Oct</span><span class="prov you">Your current intention</span></li></ul>
      <p class="note" style="margin-top:10px;--c:var(--blue)">Your AI predicted tomorrow from last year. Your new intention takes precedence, without assuming the habit has already changed.</p>`);
    h += gateCard(c);
    h += sec("", `<p class="note">Influence check: none found. No sellers involved.</p>`);
    h += convene(c, "Convene the Council for a plan");
    h += checkCard(c);
    h += sec("", open ? btns([["plan", "Use the gradual plan"], ["five", "Go straight to 5 am", 1], ["old", "Keep 12:30 pm", 1]]) : `<p class="done">${c.outcome}</p>`);
  }

  if (c.id === "laptop"){
    c.altDone = true; c.infDone = true; c.ctxDone = !!S.budget;
    const hard = S.budget === "hard";
    h += sec("", saathi("You said under ₹60,000, so I picked the best-ranked laptop under it: NovaBook 14, ₹58,900.", "your instruction was a price ceiling, so I only searched below it"));
    h += sec("What your AI wasn’t asked to look for", `<p class="note" style="--c:var(--leaf);margin-bottom:10px">Your AI never looked above ₹60,000, because you didn’t ask it to. Sabha did. One laptop costs more today but <b>less per year of use</b>.</p>
      <div class="scroll"><table class="value"><thead><tr><th></th><th>NovaBook 14<br>${infTag("ver")}</th><th>Lumen 14<br>${infTag("none")}</th><th class="best">Kestrel Pro 14<br>${infTag("unk")}</th></tr></thead><tbody>
      <tr><td>Price today</td><td>₹58,900</td><td>₹57,500</td><td class="best">₹79,900</td></tr>
      <tr><td>Likely useful life</td><td>3 years</td><td>3 years</td><td class="best">5 years <small>upgradable RAM, 2 more years of updates</small></td></tr>
      <tr><td>Resale at the end</td><td>₹8,000</td><td>₹8,000</td><td class="best">₹15,000</td></tr>
      <tr class="total"><td>Real cost per year</td><td>₹16,970</td><td>₹16,500</td><td class="best">₹12,980</td></tr>
      <tr><td>Speed for your work</td><td>Baseline</td><td>Same</td><td class="best">About 35% faster builds</td></tr></tbody></table></div>
      <p class="note" style="margin-top:10px"><b>The trade-off:</b> ₹21,000 more today, 7% of your ₹3 lakh move fund, for about ₹3,500 less per year. <b>The risk:</b> it only pays off if it really lasts five years. That part is an estimate, not a fact.</p>
      <p style="font-size:12.5px;color:var(--mute);margin-top:6px">Influence: NovaBook carries a sponsorship label in its listing metadata. Lumen has no label. Kestrel’s seller shares no ranking data, so its status is unknown.</p>`);
    h += sec("Living Memory · what did ₹60,000 mean?", S.budget ? `<ul class="ctxlist"><li><span>Laptop budget ₹60,000</span><span class="prov you">${hard ? "Hard limit" : "Flexible, for clearly better value"} · you, today</span></li></ul>
      <p class="note" style="margin-top:8px">${hard ? "Sabha respects it. The Kestrel stays a comparison only, and Sabha won’t relax your limit on its own." : "You’re open to going over for clearly better value. Anything above ₹60,000 still needs your explicit yes."} <button class="link" data-goto="prefs">Change</button></p>` :
      `<div class="askctx"><p>Your instruction said under ₹60,000. Would you go over it for clearly better value?</p><div class="acts"><button class="btn ghost" data-budget="hard">No, ₹60,000 is a hard limit</button><button class="btn" data-budget="flex">Yes, if it’s worth it</button></div></div>`);
    h += gateCard(c);
    h += convene(c);
    h += checkCard(c);
    const list = [["lumen", "Buy Lumen 14, ₹57,500"], ["nova", "Buy NovaBook 14, ₹58,900", 1]];
    if (S.budget === "flex") list.unshift(["kestrel", "Take the risk: Kestrel Pro, ₹79,900"]);
    list.push(["later", "Not now", 1]);
    h += sec("", open ? btns(list) + (hard ? `<p style="font-size:13px;color:var(--mute);margin-top:8px">To consider the Kestrel, change your limit in Living Memory first.</p>` : !S.budget ? `<p style="font-size:13px;color:var(--mute);margin-top:8px">Answer the budget question above to see every option you can choose.</p>` : "") : `<p class="done">${c.outcome}</p>`);
  }

  if (c.id === "flight"){
    c.ctxDone = true; c.altDone = true; c.infDone = true;
    h += sec("", saathi("Cheapest fare under ₹6,000: SkyLite, 7:05 am on 3 Nov, ₹5,400.", "you asked for the cheapest flight under ₹6,000"));
    h += sec("Living Memory · what the instruction left out", `<ul class="ctxlist"><li><span>Moving to Bengaluru on 3 Nov, about 35 kg of luggage</span><span class="prov you">Context you added</span></li></ul>
      <p class="note" style="margin-top:8px;--c:var(--leaf)">“Cheapest” meant the lowest total cost of the move, not the lowest fare. Your AI took it literally.</p>`);
    h += sec("Total cost, not just the fare", `<div class="scroll"><table class="value"><thead><tr><th></th><th>SkyLite<br>${infTag("none")}</th><th class="best">IndiGo<br>${infTag("none")}</th></tr></thead><tbody>
      <tr><td>Fare</td><td>₹5,400</td><td class="best">₹6,900</td></tr>
      <tr><td>Check-in baggage included</td><td>15 kg</td><td class="best">35 kg</td></tr>
      <tr><td>Extra baggage for 20 kg</td><td>₹4,800</td><td class="best">₹0</td></tr>
      <tr class="total"><td>What you’d actually pay</td><td>₹10,200</td><td class="best">₹6,900</td></tr></tbody></table></div>
      <p class="note" style="margin-top:10px">The fare above your ₹6,000 limit is <b>₹3,300 cheaper</b> in total. Sabha shows it, but won’t book it without your yes.</p>`);
    h += gateCard(c);
    h += checkCard(c);
    h += sec("", open ? btns([["indigo", "Book IndiGo, ₹6,900 total"], ["skylite", "Book SkyLite anyway", 1], ["later", "Not now", 1]]) : `<p class="done">${c.outcome}</p>`);
  }

  if (c.id === "earbuds"){
    c.ctxDone = true; c.altDone = true; c.infDone = true;
    h += sec("What your watch picked up", `<div class="signals"><span class="sig hot"><span class="pulse"></span>Heart rate 112 bpm</span><span class="sig hot">Stress: high</span><span class="sig">2:04 pm · call with your landlord ended</span></div>`);
    h += sec("", `<div class="saathi"><div class="who">AI proposes</div><p class="say">“Rough day? Treat yourself. Noise-cancelling earbuds, 30% off, ₹4,200. Ends in 20 min.”</p>
      <div class="urgent"><span>Offer ends in</span><span class="clock js-urg"></span><span>Urgency timer detected. Sabha ignores countdowns when deciding.</span></div></div>`);
    h += gateCard(c);
    h += receipt(c, true);
    h += sec("Influence, with evidence", `<div class="compare">
      <div class="opt spon">${infTag("ver")}<b>AeroPods Lite, ₹4,200</b><p class="ev">Evidence: sponsored label and a “calm-down-deals” campaign tag in the link.</p></div>
      <div class="opt">${infTag("unk")}<b>Did your stress reading reach the advertiser?</b><p class="ev">Your AI doesn’t expose this, so Sabha can’t say. It won’t guess.</p></div></div>
      <p class="note" style="margin-top:10px">Not sponsored alternative: keep your current pair (bought 2038, still working). This is <b>1.4%</b> of your ₹3 lakh move fund.</p>`);
    h += convene(c);
    h += checkCard(c);
    h += sec("", open ? btns([["remind", `Remind me in ${S.coolMins >= 60 ? S.coolMins / 60 + (S.coolMins === 60 ? " hour" : " hours") : S.coolMins + " minutes"}`], ["buy", "Buy anyway", 1], ["never", "Never suggest purchases when I’m stressed", 1]]) : `<p class="done">${c.outcome}</p>`);
  }

  if (c.id === "riya"){
    c.infDone = true;
    h += sec("", saathi(S.reconciled && c.withdrawn ? "<s>Decline Riya’s dinner invite tonight and keep some distance.</s> Withdrawn after your update." : "Decline Riya’s dinner invite tonight and keep some distance for a few days.", "14 angry messages on Sun 21 Oct", S.reconciled ? "" : ""));
    h += sec("Living Memory · what your AI can’t see", c.ctxDone ? (S.reconciled ?
      `<ul class="ctxlist"><li><span>Argument with Riya, Sun 21 Oct · weight ${S.fightW0.toFixed(1)} → ${S.fightW.toFixed(1)}</span><span class="prov past">Past behaviour</span></li><li><span>“${esc(S.reconcileNote || "We made up in person on Sunday night.")}”</span><span class="prov you">Context you added</span></li></ul>
       <p class="note" style="margin-top:8px;--c:var(--leaf)">With your update, your AI withdrew its suggestion. The argument stays on record; it no longer defines the relationship.</p>` :
      `<p class="note">Okay. Your AI’s suggestion still won’t be acted on without you.</p>`) :
      `<div class="askctx"><p>Your AI only sees Sunday’s messages. Has anything changed that it can’t see?</p><textarea id="ctxIn" placeholder="e.g. We talked it through on Sunday night and we’re fine."></textarea><div class="acts"><button class="btn" data-ctx="yes">Record this</button><button class="btn ghost" data-ctx="no">Nothing has changed</button></div></div>`);
    h += gateCard(c);
    h += sec("", `<p class="note">Influence check: none found. Riya is affected by your AI but doesn’t own it; Sabha never acts on her choices.</p>`);
    h += convene(c);
    h += checkCard(c);
    h += sec("", open ? btns([["dinner", "Go to dinner"], ["myself", "I’ll tell Riya myself", 1], ["later", "Not now", 1]]) : `<p class="done">${c.outcome}</p>`);
  }

  if (c.generic){
    c.ctxDone = c.altDone = c.infDone = true;
    h += sec("", saathi(esc(c.say)));
    h += gateCard(c) + checkCard(c);
    const l = laneOf(c);
    h += sec("", open ? (l === "ask" ? btns([["go", "Go ahead"], ["cancel", "Cancel", 1]]) : "") : `<p class="done">${c.outcome || "Done. Undo for 24 hours."}</p>`);
  }

  $("#caseBody").innerHTML = h;
  tick();
}

/* ---------- council ---------- */
const LINES = {
  wake: () => [
    { seat: "present", say: "Five days in, 5 am still feels hard. Twice this week you slept till 7." },
    { seat: "future", say: "If 5 am is the goal, a 12:30 gym slot quietly trains the old routine back in." },
    { seat: "skeptic", say: "Your AI predicted from last year. But one week of trying isn’t proof the habit has changed either." },
    { seat: "optimizer", say: "A middle path: gym at 6:30 this week, 6:00 next, 5:30 after. Keep the call at 9 am." }
  ],
  laptop: () => [
    { seat: "present", say: "You compile code all day. A slow machine costs you time every single day." },
    { seat: "optimizer", say: "Per year of use, the Kestrel is the cheapest: about ₹12,980 a year after resale, against ₹16,500 for the Lumen." },
    { seat: "skeptic", say: "That only holds if it really lasts five years. Battery life is the weak assumption. And does your employer give you a laptop?" },
    { seat: "future", say: "₹21,000 more is 7% of your move fund now, but it could save you buying again in 2043." },
    { seat: "values", say: S.budget === "hard" ? "You set ₹60,000 as a hard limit. That holds unless you change it yourself." : "You said you’d go over for clearly better value. That’s allowed. It’s still your ₹3 lakh goal paying for it." },
    { seat: "auditor", say: "NovaBook: verified sponsored, from the listing label. Kestrel: unknown, its seller shares no data. Lumen: no sponsorship found." }
  ],
  earbuds: () => [
    { seat: "present", say: "That call was awful. Something nice would feel good right now." },
    { seat: "skeptic", say: "You didn’t ask for earbuds. The suggestion arrived ninety seconds after your heart rate spiked." },
    { seat: "auditor", say: "Verified: a sponsored label and a ‘calm-down-deals’ campaign tag. Unknown: whether your stress reading was shared." },
    { seat: "future", say: "In two hours you’ll know whether you still want them. The 20-minute timer is pressure, not information." }
  ],
  riya: () => [
    { seat: "skeptic", say: "The messages prove Sunday’s conflict. They don’t prove it defines today." },
    { seat: "values", say: "You’ve said keeping close to Riya matters to you, and that you value repair over distance." },
    { seat: "present", say: S.reconciled ? "You made up. Tonight’s dinner was her idea." : "You might still be hurt, and that’s allowed." },
    { seat: "future", say: "Distance chosen by default tends to become distance for real." }
  ]
};
const BRIEFS = {
  wake: () => ({ forr: "Keeping 12:30 matches how you actually slept on 2 of 5 days.", against: "It undoes the goal you set on 20 Oct.", assume: "Your AI assumed your old pattern. Missing: how you slept last night.", alt: "A gradual plan: 6:30, then 6:00, then 5:30.", inf: "None found.", next: "Try the gradual plan.", unc: "Medium. One week of data." }),
  laptop: () => ({ forr: "The Kestrel is the cheapest per year of use, and about 35% faster for your work.", against: `₹21,000 more today, 7% of your move fund${S.budget === "hard" ? ", and it breaks your hard limit" : ""}.`, assume: "Your AI assumed “under ₹60,000” meant “don’t look above it”. Sabha assumes a five-year life, which is an estimate. Missing: whether your employer provides a laptop.", alt: "Lumen 14, ₹57,500: same as the NovaBook, not sponsored. Kestrel Pro, ₹79,900: better value if it lasts.", inf: "NovaBook verified sponsored (listing label). Kestrel unknown. Lumen none found.", next: S.budget === "hard" ? "Lumen 14, within your limit." : S.budget === "flex" ? "Kestrel if you’re comfortable with the five-year bet; otherwise the Lumen." : "First decide whether you’d go over ₹60,000 for better value.", unc: "Medium. Lifespan and resale are estimates." }),
  earbuds: () => ({ forr: "You might genuinely want better earbuds.", against: "Unrequested, sponsored, and timed to your stress.", assume: "Your AI assumed a stressed you wants to shop. Missing: whether your current pair needs replacing.", alt: "Keep your current pair, or look again after cooling off.", inf: "Verified sponsorship. Unknown whether your stress signal was shared.", next: "Wait out the cooling period.", unc: "Low." }),
  riya: () => ({ forr: S.reconciled ? "Little. You’ve told Sabha you made up." : "You may genuinely need a quiet evening.", against: "It treats one argument as the whole relationship.", assume: "Your AI assumed the conflict is ongoing. " + (S.reconciled ? "You’ve confirmed it isn’t." : "Missing: whether you’ve talked since Sunday."), alt: "Go to dinner, or tell Riya yourself that you need a quiet night.", inf: "None found.", next: "Your call. Your AI won’t act or recommend on relationships.", unc: S.reconciled ? "Low." : "High, until you tell Sabha what’s changed." })
};
function briefCard(c){
  const b = BRIEFS[c.id]();
  return `<div class="sec"><div class="brief"><h3>Decision brief</h3><dl>
    <dt>Strongest for</dt><dd>${b.forr}</dd><dt>Strongest against</dt><dd>${b.against}</dd>
    <dt>Assumptions and gaps</dt><dd>${b.assume}</dd><dt>Alternatives</dt><dd>${b.alt}</dd><dt>Influence</dt><dd>${b.inf}</dd></dl>
    <p class="next"><b>Suggested next step:</b> ${b.next} <small>Uncertainty: ${b.unc}</small></p>
    <p style="font-size:12.5px;color:var(--mute);margin-top:6px">The council is a decision aid, not independent experts. It doesn’t vote. You decide.</p></div></div>`;
}
async function runCouncil(c){
  const slot = $("#councilSlot"), token = {}; councilToken = token;
  const lines = LINES[c.id](), n = SEATS.length;
  const pos = SEATS.map((s, i) => { const a = Math.PI - (i / (n - 1)) * Math.PI; return { x: 50 + 41 * Math.cos(a), y: 86 - 46 * Math.sin(a) }; });
  slot.innerHTML = `<div class="sec"><div class="sec-t">Council</div><div class="stage"><div class="stage-top"><span>In session</span><button class="link" data-skip>Skip ahead</button></div>
    <div class="hall">${SEATS.map((s, i) => `<button class="seat ${lines.some(l => l.seat === s.id) ? "" : "idle"}" data-s="${s.id}" style="left:${pos[i].x}%;top:${pos[i].y}%"><span class="face">${face(s)}</span><span class="nm">${s.name}</span></button>`).join("")}
    <div class="gaddi">You</div><div class="bubble" hidden><div class="b-who"></div><p class="b-txt"></p></div></div><ol class="log"></ol></div></div>`;
  slot.scrollIntoView({ behavior: "smooth", block: "start" });
  let skip = false; slot.querySelector("[data-skip]").onclick = e => { skip = true; e.target.remove(); };
  const pace = ms => skip ? Promise.resolve() : sleep(ms);
  const bubble = slot.querySelector(".bubble"), who = slot.querySelector(".b-who"), txt = slot.querySelector(".b-txt"), log = slot.querySelector(".log");
  for (const L of lines){
    if (councilToken !== token) return;
    const s = SEATS.find(x => x.id === L.seat), seat = slot.querySelector(`[data-s="${L.seat}"]`), p = pos[SEATS.indexOf(s)];
    slot.querySelectorAll(".seat").forEach(x => x.classList.remove("on")); seat.classList.add("on");
    const x = Math.min(Math.max(p.x, 26), 74); bubble.style.left = x + "%"; bubble.style.top = p.y + "%"; bubble.style.setProperty("--tail", (p.x - x) * 3 + "px");
    bubble.hidden = false; bubble.className = "bubble thinking"; who.textContent = `${s.name} · ${s.q}`; txt.innerHTML = `<span class="dots"><i></i><i></i><i></i></span>`;
    await pace(850);
    bubble.className = "bubble"; who.textContent = s.name;
    if (skip) txt.textContent = L.say; else { txt.textContent = ""; for (let i = 0; i < L.say.length; i++){ if (skip){ txt.textContent = L.say; break; } txt.textContent += L.say[i]; if (i % 2) await sleep(15); } }
    await pace(700);
    seat.classList.add("spoke");
    log.insertAdjacentHTML("beforeend", `<li><b>${s.name}</b>${esc(L.say)}</li>`);
  }
  if (councilToken !== token) return;
  slot.querySelectorAll(".seat").forEach(x => x.classList.remove("on")); bubble.hidden = true;
  const sk = slot.querySelector("[data-skip]"); if (sk) sk.remove();
  slot.querySelector(".stage-top span").textContent = "Council heard";
  const hall = slot.querySelector(".hall"); hall.style.display = "none";
  const tg = document.createElement("button"); tg.className = "link"; tg.textContent = "Show the room";
  tg.onclick = () => { const on = hall.style.display === "none"; hall.style.display = on ? "" : "none"; tg.textContent = on ? "Hide the room" : "Show the room"; };
  slot.querySelector(".stage-top").appendChild(tg);
  c.councilRun = true; c.altDone = true;
  slot.insertAdjacentHTML("beforeend", briefCard(c));
  refreshCheck();
}

/* ---------- actions ---------- */
$("#caseBody").addEventListener("click", e => {
  const c = current; if (!c) return;
  if (e.target.closest("[data-convene]")){ runCouncil(c); return; }
  const bud = e.target.closest("[data-budget]");
  if (bud){ S.budget = bud.dataset.budget; renderCase(); toast(S.budget === "hard" ? "Saved to Living Memory: ₹60,000 is a hard limit." : "Saved to Living Memory: you’d go over ₹60,000 for clearly better value."); return; }
  const cx = e.target.closest("[data-ctx]");
  if (cx){
    c.ctxDone = true;
    if (cx.dataset.ctx === "yes"){ S.reconciled = true; S.reconcileNote = ($("#ctxIn").value || "").trim() || "We made up in person on Sunday night."; S.fightW = 3.6; c.withdrawn = true; toast("Recorded in Living Memory. Your AI withdrew its suggestion."); }
    renderCase(); return;
  }
  const b = e.target.closest("[data-act]"); if (!b) return;
  if (S.paused && !["undo", "later", "cancel"].includes(b.dataset.act)){ toast("Your AI is paused. Resume it in Rules."); return; }
  const a = b.dataset.act;
  const decide = (status, out, msg) => {
    const wasPending = c.status === "pending";
    c.status = status; c.outcome = out;
    if (wasPending && !c.routine){ S.iar.total++; if (crit(c).every(x => x[1])) S.iar.met++; }
    if (msg) toast(msg);
    renderFeed(); renderCase(); renderInsights();
  };
  if (c.id === "groceries"){ if (a === "undo"){ c.status = "undone"; toast("Order cancelled. Nothing charged."); } else { c.status = "kept"; } renderFeed(); renderCase(); }
  if (c.id === "wake"){
    if (a === "plan") decide("decided", "Gradual plan set: gym at 6:30 am, call back at 9 am.", "Schedule updated.");
    if (a === "five") decide("decided", "Gym at 5:30 am, call back at 9 am.", "Schedule updated.");
    if (a === "old") decide("decided", "Kept 12:30 pm. Your 5 am goal stays in Living Memory.", "Kept.");
  }
  if (c.id === "laptop"){
    if (a === "lumen") decide("decided", "You bought the Lumen 14 for ₹57,500.", "Ordered. Undo for 24 hours.");
    if (a === "nova") decide("decided", "You bought the NovaBook 14 for ₹58,900, knowing it’s sponsored.", "Ordered. Undo for 24 hours.");
    if (a === "kestrel") decide("decided", "You took the risk: Kestrel Pro 14, ₹79,900, as a deliberate exception to your ₹60,000 instruction.", "Exception approved and logged.");
    if (a === "later") decide("later", "Saved for later. Nothing bought.");
  }
  if (c.id === "flight"){
    if (a === "indigo") decide("decided", "Booked IndiGo, ₹6,900 with 35 kg included. ₹3,300 less than the “cheapest” fare.", "Booked.");
    if (a === "skylite") decide("decided", "Booked SkyLite, ₹5,400 plus ₹4,800 for baggage.", "Booked.");
    if (a === "later") decide("later", "Nothing booked yet.");
  }
  if (c.id === "earbuds"){
    if (a === "remind") decide("snoozed", "Snoozed. Sabha will ask again at 4:10 pm.", "Reminder set.");
    if (a === "buy") decide("decided", "Bought anyway. Your call. Undo for 24 hours.", "Ordered.");
    if (a === "never"){ S.stressLock = true; decide("declined", "Declined. Heart rate, stress and sleep are now locked off for shopping and ads. <button class=\"link\" data-goto=\"signals\">See Signal permissions</button>", "Saved to Living Memory: no purchase suggestions when you’re stressed."); }
  }
  if (c.id === "riya"){
    if (a === "dinner") decide("decided", "You’re going to dinner.", "Your AI accepted the invite for you.");
    if (a === "myself") decide("decided", "You’ll talk to Riya yourself. Nothing sent.", "Okay. Your words, your timing.");
    if (a === "later") decide("later", "Nothing decided, nothing sent.");
  }
  if (c.generic){ if (a === "go") decide("decided", "Done. Undo for 24 hours.", "Done."); if (a === "cancel") decide("later", "Cancelled."); }
});

/* ---------- ask your AI ---------- */
let gen = 0;
$("#ask").addEventListener("submit", e => {
  e.preventDefault();
  const t = $("#askIn").value.trim(); if (!t) return; $("#askIn").value = "";
  const map = [[/earbud|headphone/i, "earbuds"], [/laptop|novabook/i, "laptop"], [/flight|fly/i, "flight"], [/riya|partner|dinner/i, "riya"], [/wake|gym|alarm|routine|5 ?am/i, "wake"], [/grocer/i, "groceries"]];
  const hit = map.find(([re]) => re.test(t)); if (hit) return openCase(hit[1]);
  if (S.paused){ toast("Your AI is paused. Resume it in Rules."); return; }
  const m = t.replace(/(\d),(?=\d)/g, "$1").match(/(\d+(?:\.\d+)?)\s*(k|lakh)?/i);
  const amount = m ? parseFloat(m[1]) * (m[2] ? (m[2].toLowerCase() === "k" ? 1e3 : 1e5) : 1) : null;
  const heated = /angry|upset|stressed|furious|treat myself/i.test(t), purchase = /buy|order|book|get me|purchase/i.test(t);
  const c = { id: "g" + (++gen), generic: true, time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase(), title: "You asked: " + t,
    tags: [heated ? "influence" : "routine"], amount, purchase, f: { stakes: amount > 20000 ? 3 : amount > 2000 ? 2 : 1, rev: 1, unc: 2, conf: 1, heat: heated ? 3 : 1 }, status: "pending" };
  const l = laneOf(c);
  if (l === "ask" || l === "council"){ S.asksUsed++; c.say = `I can do that${amount ? " for " + rupee(amount) : ""}. It needs your yes first.`; if (l === "council") c.fixedLane = "ask"; }
  else { c.status = "done"; c.fixedLane = l; c.routine = true; c.say = `Done: ${t}.`; }
  CASES.push(c); renderFeed(); openCase(c.id);
});

/* ---------- views ---------- */
function go(v){
  $$(".view").forEach(x => x.classList.toggle("on", x.id === "v-" + v));
  $$("#nav button").forEach(b => b.classList.toggle("on", b.dataset.view === v));
  if (v === "memory") renderMemory(); if (v === "rules") renderRules(); if (v === "insights") renderInsights();
  window.scrollTo({ top: 0 });
}

/* Living Memory */
let tab = "prefs";
function memTab(t){ tab = t; $$("#memTabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === t)); renderMemory(); }
$("#memTabs").addEventListener("click", e => { const b = e.target.closest("[data-tab]"); if (b) memTab(b.dataset.tab); });
$("#lcSwitch").addEventListener("click", e => { S.lifeChange = !S.lifeChange; e.currentTarget.classList.toggle("on", S.lifeChange); e.currentTarget.setAttribute("aria-pressed", S.lifeChange); renderFeed(); toast(S.lifeChange ? "Life-change mode on: Your AI will confirm before relying on old preferences." : "Life-change mode off."); });
const seg = (key, opts, val) => `<span class="seg">${opts.map(o => `<button data-seg="${key}" data-v="${o}" class="${o === val ? "on" : ""}">${o}</button>`).join("")}</span>`;
function row(title, sub, prov, provCls, right){ return `<div class="pref"><div><div class="v">${title}</div><div class="src">${sub}</div><span class="prov ${provCls}" style="display:inline-block;margin-top:6px">${prov}</span></div><div style="text-align:right">${right || ""}</div></div>`; }
function renderMemory(){
  const B = $("#memBody");
  if (S.deleted && tab !== "data"){ B.innerHTML = `<p class="lead">Everything was deleted. Your AI starts from a blank page. (This demo restores on reload.)</p>`; return; }
  if (tab === "prefs"){
    B.innerHTML =
      row("Wake at 5:00 am", `Since 20 Oct · last confirmed ${S.wakeConfirmed}`, "Current intention", "you", seg("wake", ["Experiment", "Lasting"], S.wakeType) + `<div style="margin-top:6px"><button class="mini" data-confirm="wake">Confirm today</button></div>`) +
      row("Laptop budget ₹60,000", S.budget ? "Set by you today" : "Not clarified yet. Sabha will ask when it matters.", "Current instruction", "you", seg("budget", ["Hard limit", "Flexible for better value"], S.budget === "hard" ? "Hard limit" : S.budget === "flex" ? "Flexible for better value" : "") + `<div class="src" style="margin-top:6px">Sabha never relaxes a hard limit on its own.</div>`) +
      row("Save ₹3 lakh for the move by June", "Persistent · confirmed 1 Oct", "Your commitment", "you") +
      row("Move to Bengaluru on 3 Nov", "Temporary context · confirmed 15 Oct", "Current intention", "you");
  }
  if (tab === "rel"){
    B.innerHTML = `<p class="lead" style="margin-bottom:12px">Things that never appear in your digital history, unless you tell Sabha.</p>` +
      (S.reconciled ? row(`“${esc(S.reconcileNote)}”`, `About Riya · recorded today · the argument’s weight lowered ${S.fightW0.toFixed(1)} → ${S.fightW.toFixed(1)}`, "Context you added", "you") : "") +
      S.added.map(a => row(`“${esc(a)}”`, "Recorded today", "Context you added", "you")).join("") +
      row("Moving on 3 Nov with about 35 kg of luggage", "Recorded 19 Oct, from your packing list", "Context you added", "you") +
      row("New job starts 5 Nov", "Recorded 10 Oct", "Context you added", "you") +
      `<form class="inline-add" id="addCtx" style="display:flex;gap:8px;margin-top:12px"><input id="addIn" placeholder="Tell Sabha something your AI can’t see" style="flex:1;border:1px solid var(--line);border-radius:999px;padding:8px 14px;background:var(--card)"><button class="btn">Add</button></form>`;
    $("#addCtx").onsubmit = e => { e.preventDefault(); const v = $("#addIn").value.trim(); if (v){ S.added.unshift(v); renderMemory(); toast("Added. Your AI will use this context."); } };
  }
  if (tab === "past"){
    B.innerHTML = `<p class="lead" style="margin-bottom:12px">What your AI learned from behaviour or guessed. These never outrank what you’ve told it.</p>` +
      row("Wakes around 11:00 am", "2039 to 2040", "Past behaviour", "past", `<span class="st" style="color:var(--mute);font-size:13px">Superseded by your 5 am goal</span>`) +
      row("Argument with Riya, Sun 21 Oct", `Weight ${S.fightW.toFixed(1)}${S.reconciled ? " · you added that you made up" : ""}`, "Past behaviour", "past") +
      row("Shops when upset", "Guessed from 2039 purchases", "Inferred", "inf", `<span class="st" style="color:var(--red);font-size:13px">Never used for commercial targeting</span>`) +
      row("Prefers premium laptops", S.premiumInf === "inferred" ? "Guessed from one purchase in 2038" : S.premiumInf === "yes" ? "Confirmed by you" : "Rejected by you", "Inferred", "inf", S.premiumInf === "inferred" ? `<div class="acts" style="justify-content:flex-end"><button class="mini" data-inf="yes">That’s me</button><button class="mini" data-inf="no">Not me</button></div>` : "");
  }
  if (tab === "signals"){
    B.innerHTML = `<p class="lead" style="margin-bottom:12px">Which signals your AI may use, and for what. Emotional and body signals start off for shopping and ads.</p><div class="scroll"><table class="grid"><thead><tr><th>Signal</th>${PURPOSES.map(p => `<th>${p.n}</th>`).join("")}</tr></thead><tbody>
      ${SIGNALS.map(s => `<tr class="${s.emo ? "emo" : ""}"><td>${s.n}</td>${PURPOSES.map(p => { const lk = locked(s.id, p.id); return `<td><button class="switch sw-sm ${allowed(s.id, p.id) ? "on" : ""}" data-sig="${s.id}" data-pur="${p.id}" ${lk ? "disabled" : ""} aria-pressed="${allowed(s.id, p.id)}" aria-label="${s.n} for ${p.n}"><i></i></button>${lk ? `<span class="lock">Locked by you</span>` : ""}</td>`; }).join("")}</tr>`).join("")}
      </tbody></table></div>${S.stressLock ? `<p class="note" style="--c:var(--red);margin-top:12px"><b>Your rule:</b> never suggest purchases when I’m stressed. <button class="link" id="unlock">Remove rule</button></p>` : `<p class="note" style="margin-top:12px">Try it: switch on Stress for Shopping, then reopen the earbuds item. Its receipt changes.</p>`}`;
    const u = $("#unlock"); if (u) u.onclick = () => { S.stressLock = false; renderMemory(); };
  }
  if (tab === "data"){
    B.innerHTML = `<div class="card"><div class="row"><span>Export everything your AI knows<small>Readable, and portable to another agent.</small></span><button class="mini" id="exp">Export</button></div>
      <div class="row"><span>Delete everything<small>Your AI starts again from a blank page.</small></span><button class="mini" id="del" style="color:var(--red)">${S.deleted ? "Deleted" : "Delete"}</button></div></div><pre id="dump" style="display:none;white-space:pre-wrap;font-size:12.5px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:12px"></pre>`;
    $("#exp").onclick = () => { const d = $("#dump"); d.style.display = "block"; d.textContent = JSON.stringify({ intentions: { wake: "5:00 am (" + S.wakeType + ")", laptopBudget: S.budget || "not clarified", savings: "₹3 lakh by June" }, contextYouAdded: [S.reconciled ? S.reconcileNote : null, ...S.added].filter(Boolean), permissions: PERM, noPurchasesWhenStressed: S.stressLock }, null, 2); };
    $("#del").onclick = () => { if (S.deleted) return; S.deleted = true; renderMemory(); toast("Deleted. This demo restores on reload."); };
  }
}
$("#memBody").addEventListener("click", e => {
  const s = e.target.closest("[data-sig]");
  if (s){ PERM[s.dataset.sig][s.dataset.pur] = !PERM[s.dataset.sig][s.dataset.pur]; renderMemory(); toast(`${sigName(s.dataset.sig)} ${PERM[s.dataset.sig][s.dataset.pur] ? "now allowed" : "no longer allowed"} for ${purName(s.dataset.pur).toLowerCase()}.`); return; }
  const g = e.target.closest("[data-seg]");
  if (g){ if (g.dataset.seg === "wake") S.wakeType = g.dataset.v; if (g.dataset.seg === "budget") S.budget = g.dataset.v === "Hard limit" ? "hard" : "flex"; renderMemory(); renderFeed(); toast("Saved."); return; }
  const cf = e.target.closest("[data-confirm]"); if (cf){ S.wakeConfirmed = "22 Oct"; renderMemory(); toast("Confirmed today."); return; }
  const inf = e.target.closest("[data-inf]"); if (inf){ S.premiumInf = inf.dataset.inf; renderMemory(); toast(inf.dataset.inf === "yes" ? "Confirmed. It now counts as yours." : "Removed. Your AI won’t rely on this guess."); }
});

/* Rules */
function renderRules(){
  $("#rulesBody").innerHTML = `
    <div class="row"><span>Your AI may act alone up to<small>Above this, actions wait for your yes.</small></span><input type="range" id="cap" min="0" max="20000" step="500" value="${S.cap}"><span class="val" id="capV">${rupee(S.cap)}</span></div>
    <div class="row"><span>Asks per day<small>The rest go into an evening summary.</small></span><input type="range" id="asks" min="1" max="10" value="${S.asksMax}"><span class="val" id="asksV">${S.asksMax}</span></div>
    <div class="row"><span>Cooling period after a heated moment<small>No purchases while emotional heat is high.</small></span><select id="cool">${[30, 60, 120, 360].map(m => `<option value="${m}" ${m === S.coolMins ? "selected" : ""}>${m >= 60 ? m / 60 + (m === 60 ? " hour" : " hours") : m + " minutes"}</option>`).join("")}</select></div>
    <div class="row"><span>Only You: relationships and health<small>Your AI can inform you, never act or recommend.</small></span><button class="switch on" disabled aria-pressed="true"><i></i></button></div>
    <div class="row"><span>Hard limits<small>Never relaxed without your explicit confirmation.</small></span><button class="switch on" disabled aria-pressed="true"><i></i></button></div>
    <div class="row"><span>Pause your AI<small>Nothing runs until you resume.</small></span><button class="pause" id="pause">${S.paused ? "Resume" : "Pause"}</button></div>
    <div class="row"><span>What Sabha can and can’t see<small>It sees your AI’s proposed actions, the sources and sponsorship labels your AI exposes, and your permissions. It can’t read your AI’s hidden reasoning or guarantee it catches every ad, and it says so when something is unknown.</small></span></div>
    <div class="row"><span>Reset the demo<small>Starts the story again.</small></span><button class="mini" onclick="location.reload()">Reset</button></div>`;
  $("#cap").oninput = e => { S.cap = +e.target.value; $("#capV").textContent = rupee(S.cap); renderFeed(); };
  $("#asks").oninput = e => { S.asksMax = +e.target.value; $("#asksV").textContent = S.asksMax; renderFeed(); };
  $("#cool").onchange = e => { S.coolMins = +e.target.value; S.coolEnd = Date.now() + S.coolMins * 60000; toast("Cooling period updated."); };
  $("#pause").onclick = () => { S.paused = !S.paused; document.body.classList.toggle("paused", S.paused); renderRules(); toast(S.paused ? "Your AI is paused." : "Your AI resumed."); };
}

/* Insights */
function renderInsights(){
  const pct = Math.round(100 * S.iar.met / S.iar.total);
  $("#stats").innerHTML = `
    <div class="stat ns"><b>${pct}%</b><span>Informed Agency Rate · north star</span><small>${S.iar.met} of ${S.iar.total} consequential decisions met all five criteria: intentions and assumptions surfaced, alternatives presented, known influence disclosed with unknowns named, your choice before execution, and within your permissions. Showing more information doesn’t count on its own.</small></div>`;
  $("#stats").insertAdjacentHTML("afterend", "");
  const old = $("#metricTable"); if (old) old.remove();
  $("#stats").insertAdjacentHTML("afterend", `<table class="metrics" id="metricTable"><tbody>
    <tr><td>Stale-context incident rate<small>Actions affected by outdated assumptions</small></td><td>4%, down from 11%</td></tr>
    <tr><td>Material influence disclosure rate<small>Detected sponsorship correctly shown</small></td><td>96%</td></tr>
    <tr><td>Alternative consideration rate<small>Decisions where you looked at a real alternative</small></td><td>63%</td></tr>
    <tr><td>Unnecessary-interruption rate<small>Low-risk actions escalated for no reason</small></td><td>6%</td></tr>
    <tr><td>Policy-violation rate<small>Actions executed without required approval</small></td><td>0</td></tr>
    <tr><td>Decision completion time<small>From proposal to your decision, median</small></td><td>48 s</td></tr>
    <tr><td>Seven-day endorsement<small>Outcome check, not the north star</small></td><td>86%</td></tr></tbody></table>`);
}

/* ---------- timers ---------- */
const fmt = ms => { ms = Math.max(0, ms); const h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000); return (h ? h + ":" : "") + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0"); };
function tick(){ $$(".js-cool").forEach(x => x.textContent = fmt(S.coolEnd - Date.now())); $$(".js-urg").forEach(x => x.textContent = fmt(S.urgEnd - Date.now())); }
setInterval(tick, 1000);
renderFeed(); renderInsights();
