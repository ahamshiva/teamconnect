/* src/ui/90-presentation.js  Participant-facing window. Renders only the public payload. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc;
  const P = TCL.PresentationView = {};
  let payload = null, lastStandings = null;

  function block(b, p) {
    switch (b.type) {
      case "eyebrow": return `<div class="eyebrow">${esc(b.text)}</div>`;
      case "title": return `<div class="title">${esc(b.text)}</div>`;
      case "prompt": return `<div class="prompt ${b.cls || ""} ${String(b.text || "").length > 90 ? "long" : ""}">${esc(b.text)}</div>`;
      case "html": return `<div class="text">${b.html}</div>`;
      case "text": return b.text ? `<div class="text">${esc(b.text)}</div>` : "";
      case "answer": return `<div class="answer">${esc(b.text)}</div>`;
      case "mask": return `<div class="mask">${esc(b.text)}</div>`;
      case "options": return `<div class="options">${(b.items || []).map((o, i) => `<div class="opt ${b.correct === i ? "correct" : ""}"><span class="k">${String.fromCharCode(65 + i)}</span><span>${esc(o)}</span></div>`).join("")}</div>`;
      case "banner": return `<div class="banner" style="--tc:${b.color || "var(--gold)"}">${(b.parts || []).map(x => x.strong ? `<b>${esc(x.text)}</b>` : `<span>${esc(x.text)}</span>`).join("")}</div>`;
      case "instructions": return `<ol class="instructions">${(b.items || []).map(x => `<li>${esc(x)}</li>`).join("")}</ol>`;
      case "list": return `<ul class="list">${(b.items || []).map((x, i) => `<li>${b.numbered ? `<span class="n">${i + 1}</span>` : ""}<span>${esc(x)}</span></li>`).join("")}</ul>`;
      case "image": return b.svg ? `<div class="image">${b.svg}</div>` : "";
      case "timer": { const t = p.timers && p.timers[b.name || "round"]; return t ? ring(t) : ""; }
      case "teams": return `<div class="teams">${(p.teams || []).map(t => `<div class="teamcard" style="--tc:${t.color}"><div class="nm">${esc(t.name)}</div><div class="mem">${t.members.map(esc).join(" · ") || "—"}</div></div>`).join("")}</div>`;
      case "messages": return `<div class="msgwall">${(b.items || []).map(m => `<div class="msg">${esc(m.text)}${m.from ? `<div class="from">${esc(m.from)}</div>` : ""}</div>`).join("")}</div>`;
      default: return "";
    }
  }
  function remainingOf(t) {
    if (!t) return 0;
    if (t.status === "running") return Math.max(0, t.remainingMs - (Date.now() - t.sentAt));
    return Math.max(0, t.remainingMs);
  }
  function ring(t) {
    const rem = remainingOf(t);
    const low = t.status !== "idle" && rem <= (t.warnAtMs || 10000);
    const txt = U.fmtMs(rem);
    return `<div class="ring ${low ? "low" : ""} ${t.status}" data-pres-ring="${t.name}" style="--frac:${t.durationMs ? U.clamp(rem / t.durationMs, 0, 1) : 0};--len:${txt.length}"><span class="t">${esc(txt)}</span><span class="lbl">${esc(t.label || t.name)}${t.status === "paused" ? " · paused" : t.status === "done" ? " · time" : ""}</span></div>`;
  }
  function standings(p) {
    if (!p.standings) return "";
    /* Members ride along under each team. The lobby names them, but the question people actually keep
       asking is "which team am I on", and they ask it in the middle of a round, not before it. The
       stage belongs to the prompt and the clock, so the roster lives here instead. */
    /* The participant window is a fixed frame: it does not scroll, so anything too tall collides with
       the footer instead of overflowing. Six teams in large-text mode is exactly that case, and a
       score nobody can read is worse than a roster nobody asked for, so the names yield first. */
    const teamCount = (p.teams || []).length;
    const roomForMembers = teamCount <= 4 || !p.largeText;
    const membersOf = name => {
      if (!roomForMembers) return "";
      const t = (p.teams || []).find(x => x.name === name);
      return t && t.members && t.members.length ? t.members.join(" · ") : "";
    };
    return `<aside class="pres-sb" aria-label="Scores"><h4>Scores</h4>${p.standings.map(r => {
      const mem = membersOf(r.name);
      return `<div class="row ${r.rank === 1 && r.total > 0 ? "leader" : ""}" style="--tc:${r.color}" data-sb="${esc(r.name)}"><div class="top"><span class="nm">${esc(r.name)}</span><span class="pts">${r.total}</span></div>${mem ? `<div class="mem">${esc(mem)}</div>` : ""}</div>`;
    }).join("")}</aside>`;
  }
  P.render = function () {
    const root = document.getElementById("app");
    if (!payload) { root.innerHTML = `<div class="pres"><div class="pres-top"><div class="brand">TEAM CONNECT <span>LIVE</span></div><div class="live paused">Waiting for facilitator</div></div><div class="pres-wait"><h2>Waiting for the facilitator console…</h2><p>Keep this window open. It connects automatically.</p></div></div>`; return; }
    const p = payload;
    const showSb = p.standings && p.screen !== "final" && p.screen !== "holding";
    let stage;
    if (p.screen === "holding") {
      stage = `<div class="pres-stage pres-holding">${p.blocks.map(b => block(b, p)).join("")}<div class="hold-dots"><span></span><span></span><span></span></div></div>`;
    } else if (p.screen === "final" && p.shared) {
      const sh = p.shared;
      stage = `<div class="pres-stage pres-final">${p.blocks.map(b => block(b, p)).join("")}
        <div class="shared-wrap">
          <div class="shared-tiles">
            <div class="tile"><span class="n">${sh.activities}</span><span class="k">activities finished together</span></div>
            <div class="tile"><span class="n">${sh.people}</span><span class="k">people in the room</span></div>
            ${sh.showPoints ? `<div class="tile"><span class="n">${sh.points}</span><span class="k">points earned by the whole team</span></div>` : ""}
          </div>
          ${sh.teams && sh.teams.length ? `<div class="teams">${sh.teams.map(t => `<div class="teamcard" style="--tc:${t.color}"><div class="nm">${esc(t.name)}</div><div class="mem">${sh.showPoints ? t.total + " pts contributed" : "thank you"}</div></div>`).join("")}</div>` : ""}
          <div class="text">No winners today. One team, one score, one very odd hour together.</div>
        </div></div>`;
    } else if (p.screen === "final") {
      const rows = p.standings || [];
      const medals = ["🥇", "🥈", "🥉"];
      const order = [rows[1], rows[0], rows[2]].filter(Boolean);
      stage = `<div class="pres-stage pres-final">${p.blocks.map(b => block(b, p)).join("")}${rows.length && rows.some(r => r.total > 0) ? `<div class="podium">${order.map(r => `<div class="spot p${r.rank}" style="--tc:${r.color}"><div class="medal">${medals[r.rank - 1] || "🏅"}</div><div class="block"><div class="tname">${esc(r.name)}${r.tied ? " (tied)" : ""}</div><div class="tpts">${r.total} pts</div></div></div>`).join("")}</div>` : `<div class="text">Thank you for playing. See you next time.</div>`}</div>`;
    } else {
      stage = `<div class="pres-stage">${p.blocks.map(b => block(b, p)).join("")}</div>`;
    }
    root.innerHTML = `<div class="pres ${p.largeText ? "large" : ""} ${p.rehearsal ? "rehearsing" : ""}" style="--s:${p.largeText ? Math.max(1.22, p.scale || 1) : (p.scale || 1)}">
      ${p.rehearsal ? '<div class="pres-rehearsal">REHEARSAL · practice run · not the live session</div>' : ""}
      <div class="pres-top"><div class="brand">TEAM CONNECT <span>LIVE</span></div><div class="live ${p.paused || p.screen === "holding" ? "paused" : ""}">${p.screen === "holding" ? "Back shortly" : p.paused ? "Paused" : p.screen === "activity" ? esc(p.activityTitle || "Live") : "Live"}</div></div>
      <div class="pres-body ${showSb ? "" : "nosb"}">${stage}${showSb ? standings(p) : ""}</div>
      <div class="pres-foot"><span>${esc(p.sessionName || "")}</span><span>${esc(p.tagline || "")}</span></div></div>`;
    /* score pop */
    if (lastStandings && p.standings) p.standings.forEach(r => { const prev = lastStandings.find(x => x.name === r.name); if (prev && prev.total !== r.total) { const el = root.querySelector(`[data-sb="${CSS.escape(r.name)}"]`); if (el) el.classList.add("pop"); } });
    lastStandings = p.standings ? p.standings.map(r => ({ name: r.name, total: r.total })) : null;
  };
  P.boot = function () {
    document.body.classList.add("presentation-body");
    document.title = "TEAM CONNECT LIVE · Presentation";
    TCL.Presenter.initPresentation(pl => { payload = pl; P.render(); });
    P.render();
    setInterval(() => {
      if (!payload) return;
      document.querySelectorAll("[data-pres-ring]").forEach(el => {
        const t = payload.timers[el.dataset.presRing]; if (!t) return;
        const rem = remainingOf(t);
        el.style.setProperty("--frac", t.durationMs ? U.clamp(rem / t.durationMs, 0, 1) : 0);
        el.classList.toggle("low", t.status !== "idle" && rem <= (t.warnAtMs || 10000));
        const txt = U.fmtMs(rem);
        el.style.setProperty("--len", txt.length);
        el.querySelector(".t").textContent = txt;
      });
    }, 250);
  };
})();
