/* src/activities/appreciation.js  Appreciation Wall (unscored). */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, K = TCL.GameKit, f = K.f;
  TCL.Games.register({
    id: "appreciation", name: "Appreciation Wall", tagline: "End on gratitude.", category: "Reflection",
    description: "Everyone writes a short appreciation for a teammate or the team. The facilitator moderates, then reveals the wall all at once. Never scored.",
    icon: UI.icons.star, contentGame: "appreciation", modes: ["teams", "individual"], needsZoom: "Messages arrive by chat (private to the facilitator when anonymous)",
    defaultSettings: { anonymous: true, focus: "person", perPerson: 1, minLen: 10, maxLen: 200, moderate: true, collectMinutes: 3, scoringEnabled: false, sound: true },
    settingsSchema: [f.toggle("anonymous", "Anonymous messages"), f.select("focus", "Prompt focus", [{ value: "person", label: "Person-focused" }, { value: "team", label: "Team-focused" }]), f.count("perPerson", "Messages per participant", 1, 3), f.number("minLen", "Minimum length (characters)", 0, 100), f.number("maxLen", "Maximum length (characters)", 20, 500), f.toggle("moderate", "Moderate before display"), f.minutes("collectMinutes", "Writing time", 1, 10), f.sound()],
    summary(s, ctx) { return `${s.collectMinutes} min writing + moderation + reveal`; },
    estimateMinutes(s, ctx) { return s.collectMinutes + 1 + Math.max(1.5, ctx.participants * 0.15); },
    validate() { return []; },
    init(ctx) { const s = ctx.settings; const prompt = (ctx.content({ game: "appreciation", count: 1, categories: [s.focus === "team" ? "Team" : "Person"] }).items[0] || {}).text || "Write one sentence of appreciation."; return { prompt, phase: "collect", messages: [], revealed: false, finished: false, draftText: "", draftFrom: "", draftTo: "", contentIds: [] }; },
    actions: {
      startCollect(ctx) { ctx.state.phase = "collect"; ctx.timer.start(ctx.settings.collectMinutes * 60000, "Writing", 30000); },
      add(ctx) { const st = ctx.state, s = ctx.settings; const text = String(st.draftText || "").trim(); if (!text) return; if (text.length < s.minLen) { TCL.emit("ui:toast", { text: `Message is shorter than ${s.minLen} characters.`, kind: "warn" }); return; } if (text.length > s.maxLen) { TCL.emit("ui:toast", { text: `Message is longer than ${s.maxLen} characters; trim it.`, kind: "warn" }); return; } st.messages.push({ id: U.uid("m"), text, from: s.anonymous ? "" : (st.draftFrom || ""), to: st.draftTo || "", status: s.moderate ? "pending" : "approved" }); st.draftText = ""; st.draftTo = ""; },
      approve(ctx, id) { const m = U.byId(ctx.state.messages, id); if (m) m.status = "approved"; },
      reject(ctx, id) { const m = U.byId(ctx.state.messages, id); if (m) m.status = "rejected"; },
      remove(ctx, id) { ctx.state.messages = ctx.state.messages.filter(m => m.id !== id); },
      approveAll(ctx) { ctx.state.messages.forEach(m => { if (m.status === "pending") m.status = "approved"; }); },
      reveal(ctx) { ctx.state.revealed = true; ctx.state.phase = "wall"; ctx.timer.stop(); },
      finish(ctx) { ctx.state.finished = true; },
      reopen(ctx) { ctx.state.finished = false; },
    },
    noUndo: [],
    isComplete: ctx => !!ctx.state.finished,
    exportText(a) { const st = a.state; return `APPRECIATION WALL: ${st.prompt}\n` + (st.messages || []).filter(m => m.status === "approved").map(m => `  "${m.text}"${m.to ? " (to " + m.to + ")" : ""}${m.from ? " · " + m.from : ""}`).join("\n"); },
    summaryView(ctx) { const st = ctx.state; return `<h3>Appreciation wall</h3><div class="stack" style="margin-top:8px">${st.messages.filter(m => m.status === "approved").map(m => `<div class="msg-card approved"><div>${esc(m.text)}${m.to ? ` <span class="gold small">to ${esc(m.to)}</span>` : ""}${m.from ? ` <span class="dim small">· ${esc(m.from)}</span>` : ""}</div></div>`).join("") || '<span class="dim">No messages.</span>'}</div>`; },
    console(ctx) {
      const st = ctx.state, s = ctx.settings;
      if (st.finished) return K.finished(ctx, "Wall complete. Messages are in the session summary.");
      const approved = st.messages.filter(m => m.status === "approved").length, pending = st.messages.filter(m => m.status === "pending").length;
      return `<div class="stage"><div class="row between"><span class="eyebrow gold">Appreciation Wall · ${st.phase}</span><span class="chip">${approved} approved · ${pending} pending</span></div>
        <div class="prompt sm">${esc(st.prompt)}</div><div class="small muted">${s.perPerson} message${s.perPerson > 1 ? "s" : ""} each, ${s.minLen} to ${s.maxLen} characters, ${s.anonymous ? "sent privately to you in chat" : "posted in chat"}. Paste each one below.</div>
        <div class="row" style="margin-top:8px">${UI.ring("round")}<div class="ctl-row"><button class="btn ghost" data-act="startCollect">${UI.icon("clock")} Writing time ${s.collectMinutes} min</button>${s.moderate && pending ? `<button class="btn ghost" data-act="approveAll">${UI.icon("check")} Approve all pending</button>` : ""}<button class="btn green" data-act="reveal" ${approved ? "" : "disabled"}>${UI.icon("screen")} Reveal the wall (${approved})</button><button class="btn subtle" data-act="finish">Finish</button></div></div>
        <div class="grid cols-2" style="margin-top:12px;align-items:start"><div class="stack"><div class="field"><label for="ap-text">Message</label><textarea class="input sm" id="ap-text" rows="3" data-act-input="draftText" maxlength="${s.maxLen}">${esc(st.draftText || "")}</textarea></div><div class="row">${s.anonymous ? "" : `<div class="field"><label for="ap-from">From</label><input class="input sm" id="ap-from" value="${esc(st.draftFrom || "")}" data-act-input="draftFrom" style="width:160px"></div>`}<div class="field"><label for="ap-to">To (optional)</label><input class="input sm" id="ap-to" value="${esc(st.draftTo || "")}" data-act-input="draftTo" style="width:160px" list="ap-people"><datalist id="ap-people">${ctx.participants.map(p => `<option value="${esc(p.displayName || p.name)}">`).join("")}</datalist></div><button class="btn" data-act="add" style="align-self:flex-end">${UI.icon("plus")} Add</button></div></div>
          <div class="stack" style="max-height:340px;overflow:auto">${st.messages.slice().reverse().map(m => `<div class="msg-card ${m.status}"><div>${esc(m.text)}${m.to ? ` <span class="gold small">to ${esc(m.to)}</span>` : ""}${m.from ? ` <span class="dim small">· ${esc(m.from)}</span>` : ""}<div class="tiny dim">${m.status}</div></div><div class="btn-row" style="flex-wrap:nowrap">${m.status !== "approved" ? `<button class="icon-btn" data-act="approve" data-arg="${m.id}" title="Approve" aria-label="Approve">${UI.icons.check}</button>` : ""}${m.status !== "rejected" ? `<button class="icon-btn" data-act="reject" data-arg="${m.id}" title="Reject" aria-label="Reject">${UI.icons.x}</button>` : ""}<button class="icon-btn danger" data-act="remove" data-arg="${m.id}" title="Delete" aria-label="Delete">${UI.icons.trash}</button></div></div>`).join("") || '<div class="dim small">No messages yet.</div>'}</div></div></div>`;
    },
    presentation(ctx) {
      const st = ctx.state, s = ctx.settings;
      if (st.finished) return [{ type: "eyebrow", text: "Appreciation Wall" }, { type: "title", text: "Thank you, team." }];
      if (!st.revealed) return [{ type: "eyebrow", text: "Appreciation Wall" }, { type: "prompt", text: st.prompt }, K.pInstr([`${s.perPerson} message${s.perPerson > 1 ? "s" : ""} each`, `${s.minLen} to ${s.maxLen} characters`, s.anonymous ? "Send it privately to the facilitator in chat" : "Post it in chat", "The wall is revealed all at once"]), K.pTimer()];
      return [{ type: "eyebrow", text: "Appreciation Wall" }, { type: "messages", items: st.messages.filter(m => m.status === "approved").map(m => ({ text: m.text, from: [m.to ? "to " + m.to : "", m.from].filter(Boolean).join(" · ") })) }];
    },
  });
})();
