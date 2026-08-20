/* Qatar Airways Journey — local web edition. Renders everything from QR_DATA. */
const D = window.QR_DATA, T = window.QR_TALLY;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ic = (k, cls = "ic") => `<svg class="${cls}" aria-hidden="true"><use href="#i-${k}"></use></svg>`;
const STAGE_ICONS = ["search","ticket","calendar","identification","airport01","scan","security","passengerCare","rapidBoard","plane","connect","baggageClaim","chat"];
const MACRO_TINT = { dream: "var(--b10)", prepare: "var(--warm-pearl)", fly: "var(--soft-rose)", arrive: "var(--desert-sand)" };
const EV = { FACT: ["fact","官方事实","Official Fact"], OBS: ["obs","研究观察","Observation"], HYP: ["hyp","设计假设","Hypothesis"] };
const evChip = (ev) => ev && EV[ev] ? `<span class="chip ${EV[ev][0]}">${EV[ev][1]}</span>` : "";

/* ---------- hero ---------- */
$("macro-strip").innerHTML = D.macroPhases.map(m => `
  <div class="macro" style="background:${MACRO_TINT[m.id]}">
    <b>${esc(m.zh)}</b><span class="en">${esc(m.en)}</span>
    <span class="st">STAGES ${m.stages.map(n => String(n).padStart(2,"0")).join(" · ")}</span>
  </div>`).join("");

const tallyMax = Math.max(T.FACT, T.OBS, T.HYP);
$("tallies").innerHTML = [
  ["FACT","var(--burgundy)","官方事实","Official facts"],
  ["OBS","var(--grey2)","研究观察","Observations"],
  ["HYP","var(--caution)","设计假设","Hypotheses"]
].map(([k, col, zh, en]) => `
  <div class="tally">
    <div class="num" style="color:${col}">${T[k]}</div>
    <div class="bar" style="background:${col};width:${Math.round(T[k] / tallyMax * 150)}px"></div>
    <div class="lbl"><span class="dot" style="background:${col}"></span>${zh} <span class="en">${en}</span></div>
  </div>`).join("");

/* ---------- emotion chart ---------- */
(() => {
  const W = 1160, H = 380, L = 46, R = 20, TOP = 34, STEP = 62;
  const n = D.stages.length;
  const x = (i) => L + i * (W - L - R) / (n - 1);
  const y = (v) => TOP + (2 - v) * STEP;
  const smooth = (pts) => {
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i-1,0)], p1 = pts[i], p2 = pts[i+1], p3 = pts[Math.min(i+2, pts.length-1)];
      d += ` C ${p1.x+(p2.x-p0.x)/6} ${p1.y+(p2.y-p0.y)/6} ${p2.x-(p3.x-p1.x)/6} ${p2.y-(p3.y-p1.y)/6} ${p2.x} ${p2.y}`;
    }
    return d;
  };
  const exp = D.stages.map((s,i) => ({ x: x(i), y: y(s.emotionExpected) }));
  const obs = D.stages.map((s,i) => ({ x: x(i), y: y(s.emotionObserved) }));
  const bands = [[2,"+2 愉悦 Delighted"],[1,"+1 安心 Confident"],[0,"0 平稳 Neutral"],[-1,"-1 不确定 Uncertain"],[-2,"-2 压力 Stressed"]];
  let g = "";
  for (const [v, lbl] of bands) {
    const yy = y(v);
    g += `<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" stroke="${v===0?"#818A8F":"#E8E4E0"}" stroke-width="${v===0?1.1:1}" ${v!==0?'stroke-dasharray="2 5"':""}/>`;
    g += `<text x="${L+4}" y="${yy-6}" font-size="9.5" fill="#818A8F" font-family="Inter,'Noto Sans SC'">${lbl}</text>`;
  }
  let ticks = "", nodes = "";
  D.stages.forEach((s, i) => {
    ticks += `<line x1="${x(i)}" y1="${TOP}" x2="${x(i)}" y2="${y(-2)}" stroke="#EDE9E5" stroke-dasharray="1 6"/>`;
    ticks += `<text x="${x(i)}" y="${y(-2)+22}" font-size="10" fill="#818A8F" text-anchor="middle" font-family="Inter">${s.code}</text>`;
    const kind = s.emotionObserved >= 1.4 ? "#662046" : s.emotionObserved <= -0.8 ? "#9A3B3B" : "#5E6A71";
    const rr = Math.abs(s.emotionObserved) >= 1.4 || s.emotionObserved <= -0.8 ? 7 : 5;
    nodes += `<circle class="emo-node" data-i="${i}" cx="${obs[i].x}" cy="${obs[i].y}" r="${rr}" fill="${kind}" stroke="#fff" stroke-width="2.5" style="cursor:pointer"/>`;
    nodes += `<text x="${obs[i].x}" y="${obs[i].y-13}" font-size="9.5" font-weight="600" fill="${kind}" text-anchor="middle" font-family="Inter">${s.emotionObserved>0?"+":""}${s.emotionObserved}</text>`;
  });
  // 峰谷编辑注解（lupi 式旁注）
  const peak = obs[9], trough = obs[12];
  const notes = `
    <text x="${peak.x}" y="${peak.y-30}" font-size="10.5" fill="#662046" text-anchor="middle" font-family="'Noto Sans SC'">全程峰值 · Qsuite + Starlink</text>
    <text x="${trough.x-8}" y="${trough.y+30}" font-size="10.5" fill="#9A3B3B" text-anchor="end" font-family="'Noto Sans SC'">最深低谷 · 退款与投诉闭环</text>`;
  $("emo-chart").innerHTML = `
    <svg id="emo-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="情绪曲线：期待与观察">
      ${g}${ticks}
      <path d="${smooth(exp)}" fill="none" stroke="#818A8F" stroke-width="2" stroke-dasharray="6 6"/>
      <path d="${smooth(obs)}" fill="none" stroke="#662046" stroke-width="3" stroke-linecap="round"/>
      ${nodes}${notes}
    </svg>`;
  const tip = $("emo-tip");
  document.querySelectorAll(".emo-node").forEach(node => {
    node.addEventListener("mousemove", (e) => {
      const s = D.stages[+node.dataset.i];
      tip.innerHTML = `<b>${esc(s.code)} ${esc(s.zh)}</b> · ${s.emotionObserved>0?"+":""}${s.emotionObserved}<br>${esc(s.emotionNote.zh)}<span class="en"><br>${esc(s.emotionNote.en)}</span>`;
      tip.style.left = Math.min(e.clientX + 14, innerWidth - 260) + "px";
      tip.style.top = (e.clientY + 16) + "px";
      tip.style.opacity = 1;
    });
    node.addEventListener("mouseleave", () => tip.style.opacity = 0);
  });
})();

/* ---------- 13 stage cards ---------- */
const bi = (o, cls="item") => `<div class="${cls}">${esc(o.zh)}<span class="en">${esc(o.en)}</span></div>`;
$("stage-rail").innerHTML = D.stages.map((s, i) => `
  <article class="stage-card">
    <div class="scene" style="background-position:${-(32 + i * 364)}px -32px" role="img" aria-label="${esc(s.zh)}场景"></div>
    <div class="head">
      ${ic(STAGE_ICONS[i])}
      <div>
        <div class="code">${s.code} · ${s.macro.toUpperCase()}</div>
        <h3>${esc(s.zh)}</h3>
        <div class="h-en">${esc(s.en)}</div>
      </div>
    </div>
    <div class="moment ${s.moment.kind}">
      <div class="tag">${ic(s.moment.kind === "high" ? "star" : "warningAlt")}${s.moment.kind === "high" ? "关键高光时刻" : "关键脆弱时刻"} · Moment that matters</div>
      ${esc(s.moment.zh)}<span class="en" style="display:block">${esc(s.moment.en)}</span>
    </div>
    <div class="blk"><h4>${ic("checkmarkOutline")}旅客目标 GOALS</h4>${s.goals.map(g => bi(g)).join("")}</div>
    <div class="blk"><h4>${ic("checkmarkOutline")}正向体验 POSITIVE</h4>${s.positives.map(p => `
      <div class="item pos">${esc(p.zh)}<span class="en">${esc(p.en)}</span>
        <span class="meta">${evChip(p.ev)}${p.src ? `<span class="chip plain">${p.src}</span>` : ""}</span>
      </div>`).join("")}</div>
    <div class="blk"><h4>${ic("warning")}痛点 PAIN POINTS</h4>${s.pains.map(p => `
      <div class="item neg">${esc(p.zh)}<span class="en">${esc(p.en)}</span>
        <span class="meta">${evChip(p.ev)}${p.src ? `<span class="chip plain">${p.src}</span>` : ""}</span>
      </div>`).join("")}</div>
    <div class="blk"><h4>${ic("warningAlt")}失败 → 补救 FAILURE → RECOVERY</h4>
      ${bi(s.failure)}
      <div class="item" style="border-color:var(--burgundy)">${esc(s.recovery.zh)}<span class="en">${esc(s.recovery.en)} → ${s.recovery.playbook}</span></div>
    </div>
    <div class="foot">
      ${s.digital.map(d => `<span class="chip plain">${ic("mobile","ic")} ${esc(d.zh)}</span>`).join("")}
      ${s.opportunities.map(o => `<span class="chip ${o.horizon}">${esc(o.zh)}</span>`).join("")}
    </div>
  </article>`).join("");

/* ---------- blueprint grid ---------- */
(() => {
  const lanes = [
    ["actions","旅客行为","Passenger actions",""],
    ["physical","物理触点","Physical touchpoints",""],
    ["digital","数字触点","Digital touchpoints",""],
    ["SEP","互动线","Line of interaction",""],
    ["frontstage","前台服务","Frontstage service","r-front"],
    ["SEP","可见线","Line of visibility",""],
    ["backstage","后台运营","Backstage operations","r-back"],
    ["SEP","内部互动线","Line of internal interaction",""],
    ["systems","系统与数据","Systems & data","r-sys"],
    ["partners","合作方与责任","Partners & ownership",""],
    ["handoffs","服务交接","Handoffs",""],
    ["FAIL","失败场景","Failure scenarios","r-fail"],
    ["REC","服务补救","Service recovery","r-rec"]
  ];
  let html = `<div class="lane-h">阶段<span class="en">Stage</span></div>` +
    D.stages.map(s => `<div class="colhead">${s.code} ${esc(s.zh)}<span class="en">${esc(s.en)}</span></div>`).join("");
  for (const [key, zh, en, cls] of lanes) {
    if (key === "SEP") { html += `<div class="sepline">${zh} · ${en}</div>`; continue; }
    html += `<div class="lane-h ${cls}">${zh}<span class="en">${en}</span></div>`;
    html += D.stages.map(s => {
      let items;
      if (key === "FAIL") items = [s.failure];
      else if (key === "REC") items = [{ zh: s.recovery.zh, en: s.recovery.en + " → " + s.recovery.playbook }];
      else items = s[key] || [];
      return `<div class="cell ${cls}">${items.map(it =>
        `${esc(it.zh)}${it.ev ? " " + evChip(it.ev) : ""}<span class="en">${esc(it.en)}</span>`).join("<hr style='border:none;border-top:1px dashed var(--b10);margin:6px 0'>")}</div>`;
    }).join("");
  }
  $("bp-grid").innerHTML = html;
})();

/* ---------- transfer flows ---------- */
(() => {
  const arrow = `<span class="farrow">${ic("arrowRight")}</span>`;
  const FLOWS = [
    ["顺畅路径","Happy path","var(--burgundy)",[
      ["落地多哈 · 行李直挂","Land DOH — bags checked through (official)","good"],
      ["转机安检 · 无需过边检","Transfer security, no immigration (official)","good"],
      ["跟随 Transfer 指引前往登机口","Follow transfer signage to gate","normal"],
      ["登机口于起飞前 20 分钟关闭","Gate closes 20 min before departure (official)","info"]]],
    ["紧张衔接","Tight connection","var(--friction)",[
      ["上一段延误 · 衔接告急","Inbound delay puts connection at risk","risk"],
      ["衔接监控识别临界旅客（假设）","Connection monitor flags at-risk pax (hypothesis)","risk"],
      ["误接 → 转机柜台 / 保护改签","Misconnect → transfer desk, protective rebooking","risk"],
      ["长时滞留升级住宿与餐食","Long strandings escalate to hotel & meals","normal"],
      ["新行程推送至 App","New itinerary pushed to the app","good"]]],
    ["长转机 / 停留","Long layover / stopover","var(--deep-plum)",[
      ["8–24 小时且无更早衔接：免费过境住宿（≥72h 申请）","8–24h, no earlier flight: free transit stay (official)","good"],
      ["过境签 5–96 小时","Transit visa for 5–96h stays (official)","info"],
      ["Stopover：4★ 自 $14 / 5★ 自 $24，1–4 晚","Stopover from $14 (4★) / $24 (5★), official","good"],
      ["Discover Qatar / 酒店 / 旅游局共同履约","With Discover Qatar, hotels, Qatar Tourism","info"]]]
  ];
  $("flows").innerHTML = FLOWS.map(([zh, en, col, nodes]) => `
    <div class="flow">
      <div class="lanehead"><b style="color:${col}">${zh}</b><span class="en">${en}</span></div>
      ${nodes.map((nd, i) => (i ? arrow : "") + `<div class="fnode ${nd[2]}">${esc(nd[0])}<span class="en">${esc(nd[1])}</span></div>`).join("")}
    </div>`).join("");
})();

/* ---------- key moments ---------- */
$("moments-grid").innerHTML = D.keyMoments.map(m => {
  const st = D.stages[m.stage - 1];
  return `<div class="card mcard ${m.kind}">
    <div class="topline">${ic(STAGE_ICONS[m.stage - 1])}<span class="chip" style="background:var(--white);color:${m.kind==="high"?"var(--burgundy)":"var(--friction)"}">${st.code} ${esc(st.zh)}</span></div>
    <h3>${esc(m.zh)}</h3><div class="h-en">${esc(m.en)}</div>
    <div class="why"><b>为何重要 · WHY IT MATTERS</b>${esc(m.why_zh)}<span class="en" style="display:block">${esc(m.why_en)}</span></div>
  </div>`;
}).join("");

/* ---------- recovery playbooks ---------- */
const RP_FIELDS = [["trigger","触发","Trigger"],["need","旅客需要","Passenger need"],["response","即时响应","Immediate response"],["ownership","责任归属","Ownership"],["channel","沟通渠道","Channel"],["promise","补救承诺","Recovery promise"],["escalation","升级路径","Escalation"],["visibility","状态可见","Status visibility"]];
$("recovery-grid").innerHTML = D.recoveryPlaybooks.map(rp => {
  const st = D.stages[rp.stage - 1];
  const metric = D.metrics.find(m => m.id === rp.metric);
  return `<details class="card">
    <summary>${ic("renew")}<div style="flex:1">
      <div class="code" style="font-family:var(--en);font-size:10px;color:var(--grey1);letter-spacing:.1em">${rp.id.toUpperCase()} · 阶段 ${st.code}</div>
      <h3>${esc(rp.zh)}</h3><div class="h-en">${esc(rp.en)}</div>
      <div style="font-size:12px;margin-top:6px;color:var(--grey2)">${esc(rp.trigger.zh)} → <span style="color:var(--burgundy)">${esc(rp.promise.zh)}</span></div>
    </div></summary>
    <div class="rp-body">
      ${RP_FIELDS.map(([k, zh, en]) => `<div class="rp-field"><b>${zh} · ${en.toUpperCase()}</b>${esc(rp[k].zh)}<span class="en">${esc(rp[k].en)}</span></div>`).join("")}
      <div class="rp-field"><b>成功指标 · SUCCESS METRIC</b>${metric ? esc(metric.zh) + " " : ""}<span class="en">${metric ? esc(metric.en) : esc(rp.metric)}</span></div>
    </div>
  </details>`;
}).join("");

/* ---------- opportunities ---------- */
(() => {
  const buckets = { now: [], next: [], later: [] };
  for (const s of D.stages) for (const o of s.opportunities) buckets[o.horizon].push({ ...o, s });
  const defs = [["now","现在就做","Now","var(--burgundy)"],["next","下一步","Next","var(--deep-plum)"],["later","长线布局","Later","var(--grey2)"]];
  $("opp-cols").innerHTML = defs.map(([k, zh, en, col]) => `
    <div class="opp-col">
      <h3 style="color:${col}">${zh}</h3><span class="cnt">${en} · ${buckets[k].length} ITEMS</span>
      ${buckets[k].map(o => `<div class="opp ${k}"><span class="st">${o.s.code} ${esc(o.s.zh)}</span>${esc(o.zh)}<span class="en">${esc(o.en)}</span></div>`).join("")}
    </div>`).join("");
})();

/* ---------- metrics ---------- */
$("metrics-grid").innerHTML = D.metrics.map(m => `
  <div class="stat"><div class="v">—</div><b>${esc(m.zh)}</b><span class="en">${esc(m.en)}</span><div class="def">${esc(m.def_zh)} <span class="en">${esc(m.def_en)}</span></div></div>`).join("");

/* ---------- personas ---------- */
$("personas-grid").innerHTML = D.personas.map(p => `
  <div class="card pcard">
    <div class="av">${ic("user")}</div>
    <h3>${esc(p.zh)}</h3><div class="h-en">${esc(p.en)}</div>
    <div class="quote">“${esc(p.quote_zh)}”</div>
    <div class="q-en">${esc(p.quote_en)}</div>
    <div class="needs">${p.needs.map(n => `<span>· ${esc(n.zh)} <span class="en">${esc(n.en)}</span></span>`).join("")}</div>
    <div class="stg">KEY STAGES ${p.stages.map(n => String(n).padStart(2,"0")).join(" · ")}</div>
  </div>`).join("");

/* ---------- sources ---------- */
$("src-tally").innerHTML = `
  <span class="chip fact">官方事实 ${T.FACT}</span>
  <span class="chip obs">研究观察 ${T.OBS}</span>
  <span class="chip hyp">设计假设 ${T.HYP}</span>`;
const srcList = (rows) => rows.map(s => `<div class="src-item"><span class="id">${s.id}</span><span>${esc(s.title)}<span class="u">${esc(s.url)}</span></span></div>`).join("");
$("src-cols").innerHTML = `
  <div class="card"><h3>官方来源</h3><div class="h-en">Official — treated as OFFICIAL_PUBLIC_FACT</div>${srcList(D.sources.filter(s => s.type === "FACT"))}</div>
  <div class="card"><h3>独立来源</h3><div class="h-en">Independent — RESEARCH_OBSERVATION only</div>${srcList(D.sources.filter(s => s.type === "OBS"))}</div>
  <div class="card asm"><h3 style="color:var(--caution)">设计假设登记</h3><div class="h-en">Assumption register — needs client confirmation</div>
    ${D.assumptions.map((a, i) => `<div class="src-item"><span class="id">A${String(i+1).padStart(2,"0")}</span><span>${esc(a.zh)}<span class="u">${esc(a.en)}</span></span></div>`).join("")}
  </div>`;

/* ---------- nav scrollspy ---------- */
(() => {
  const links = [...document.querySelectorAll("#nav-links a")];
  const map = new Map(links.map(a => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) {
      links.forEach(a => a.classList.remove("on"));
      map.get(e.target.id)?.classList.add("on");
    }
  }, { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll("section[id]").forEach(s => io.observe(s));
})();
