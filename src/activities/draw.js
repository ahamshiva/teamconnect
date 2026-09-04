/* src/activities/draw.js  Draw and Describe. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, K = TCL.GameKit, f = K.f;
  function roles(ctx, roundIdx) {
    const s = ctx.settings;
    if (s.roleSelection === "manual") return { describer: ctx.state.manualDescriber || null, artist: ctx.state.manualArtist || null, team: ctx.state.manualTeam || null };
    const teams = ctx.targets;
    const t = teams[roundIdx % teams.length];
    const members = t.memberIds.filter(id => ctx.participants.some(p => p.id === id));
    if (members.length < 2) { const others = ctx.participants.map(p => p.id); return { team: t, describer: members[0] || others[0] || null, artist: others.find(id => id !== (members[0] || others[0])) || null }; }
    const k = Math.floor(roundIdx / teams.length);
    return { team: t, describer: members[(k * 2) % members.length], artist: members[(k * 2 + 1) % members.length] };
  }
  TCL.Games.register({
    id: "draw", name: "Draw and Describe", tagline: "One describes, one draws, everyone laughs.", category: "Creative",
    description: "A describer sees a hidden picture and describes it while a teammate draws it on paper held to the camera, or in any drawing app shared to Zoom. The rest of the team can help or guess.",
    icon: UI.icons.edit, contentGame: "images", flexKey: "rounds", modes: ["teams", "individual"], needsZoom: "Artist holds paper to the camera, or shares a drawing app (Zoom Whiteboard only if your admin allows it)",
    defaultSettings: { rounds: 3, seconds: 90, previewSeconds: 10, categories: [], difficultyMin: 1, difficultyMax: 3, order: "progressive", allowQuestions: true, allowNames: false, roleSelection: "auto", whoSees: "team", medium: "paper", scoringMode: "facilitator", points: 10, unusedOnly: true, scoringEnabled: true, sound: true },
    settingsSchema: [f.count("rounds", "Number of rounds", 1, 12), f.seconds("seconds", "Time per round", 30, 240, 15), f.seconds("previewSeconds", "Image preview time", 5, 30), f.categories("images"), f.diffMin(), f.diffMax(), f.order(),
      f.toggle("allowQuestions", "Artist may ask questions"), f.toggle("allowNames", "Describer may name the objects"), f.select("roleSelection", "Roles", [{ value: "auto", label: "Automatic, rotating through each team" }, { value: "manual", label: "Facilitator picks each round" }]),
      f.select("whoSees", "Who sees the image", [{ value: "team", label: "Everyone except the artist (shown on the presentation for the preview time)" }, { value: "describer", label: "Describer only (image stays on this console; send the reference description by private chat)" }]),
      f.select("medium", "Drawing medium", [{ value: "paper", label: "Paper held to camera (works everywhere)" }, { value: "app", label: "Artist shares any drawing app (Paint, Preview, Freeform, Excalidraw)" }, { value: "whiteboard", label: "Zoom Whiteboard (only if your admin allows it)" }]), f.select("scoringMode", "Scoring", [{ value: "facilitator", label: "Facilitator scores" }, { value: "vote", label: "Team voting (enter votes)" }, { value: "none", label: "No scoring" }]), f.number("points", "Points for a recognisable drawing", 0, 50), f.unused()].concat(K.common()),
    summary(s) { return `${s.rounds} rounds × (${s.previewSeconds}s preview + ${s.seconds}s drawing)`; },
    estimateMinutes(s) { return K.est(s.rounds, s.previewSeconds + s.seconds, 45); },
    validate(s, ctx) { const out = []; const sel = ctx.content({ count: s.rounds, categories: s.categories, difficultyMin: s.difficultyMin, difficultyMax: s.difficultyMax }); const draws = sel.pool; if (draws < s.rounds) out.push({ level: "warn", message: `Only ${draws} images match; ${s.rounds} rounds requested.` }); if (ctx.participants.length < 2) out.push({ level: "error", message: "Draw and Describe needs at least 2 people." }); return out; },
    init(ctx) {
      const st = K.deckInit(ctx, "images", ctx.settings.rounds, { });
      st.items = st.items.filter(i => Array.isArray(i.use) ? i.use.includes("draw") : true);
      if (st.items.length < ctx.settings.rounds) { const more = ctx.content({ game: "images", count: ctx.settings.rounds - st.items.length, excludeIds: st.contentIds }).items.filter(i => (i.use || ["draw"]).includes("draw")); st.items.push(...more.map(U.clone)); st.contentIds.push(...more.map(i => i.id)); }
      st.phase = "setup"; st.votes = {};
      return st;
    },
    actions: Object.assign({}, K.deckActions("images", { secondsKey: "seconds", timerLabel: "Drawing", onEnter: ctx => { ctx.state.phase = "setup"; ctx.state.revealed = false; } }), {
      preview(ctx) { ctx.state.phase = "preview"; ctx.state.revealed = ctx.settings.whoSees === "team"; ctx.timer.start(ctx.settings.previewSeconds * 1000, "Preview", 3000); },
      draw(ctx) { ctx.state.phase = "draw"; ctx.state.revealed = false; ctx.timer.start(ctx.settings.seconds * 1000, "Drawing", 15000); },
      judge(ctx) { ctx.state.phase = "judge"; ctx.state.revealed = true; ctx.timer.pause(); },
      restartRound(ctx) { ctx.state.phase = "setup"; ctx.state.revealed = false; ctx.timer.stop(); },
      compromised(ctx) { const it = K.freshItem(ctx, "images"); if (it) { ctx.state.items[ctx.state.index] = it; ctx.state.phase = "setup"; ctx.state.revealed = false; ctx.timer.stop(); ctx.log("Image marked compromised and replaced"); } else TCL.emit("ui:toast", { text: "No unused image available to swap in.", kind: "warn" }); },
      award(ctx, id) { ctx.score(id, ctx.settings.points, "drawing", ctx.state.index); },
      awardVotes(ctx, arg) { const a = K.arg(arg); const n = Number(a.n) || 0; if (n) ctx.score(a.id, n, "votes", ctx.state.index); },
      setRole(ctx, arg) { const a = K.arg(arg); ctx.state[a.key] = a.value; },
    }),
    noUndo: ["setRole"],
    hotkeys: { n: "next", p: "preview", d: "draw", j: "judge" },
    onTimerDone(ctx) { if (ctx.state.phase === "preview") this.actions.draw(ctx); else if (ctx.state.phase === "draw") { ctx.state.phase = "judge"; ctx.state.revealed = ctx.settings.whoSees === "team"; } },
    isComplete: K.deckComplete,
    privateNote(ctx) { const it = K.current(ctx.state); return it ? esc(it.title) : ""; },
    console(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return K.finished(ctx, "All rounds drawn.");
      const r = roles(ctx, st.index);
      const manual = s.roleSelection === "manual";
      const sel = (key, val) => `<select class="input sm" data-role-key="${key}" style="width:180px"><option value="">Choose…</option>${ctx.participants.map(p => `<option value="${p.id}" ${val === p.id ? "selected" : ""}>${esc(p.displayName || p.name)}</option>`).join("")}</select>`;
      return `<div class="stage">${K.head(ctx, `Draw and Describe · ${st.phase}`, `<span class="chip">${K.stars(it.difficulty)} · ${it.elements || "?"} elements</span>`)}
        <div class="row" style="gap:14px;align-items:flex-start"><div class="svg-frame sm">${it.svg}</div><div class="stack" style="flex:1">
          <div class="private"><span class="eyebrow">Private · reference description</span><div class="small" style="margin-top:4px">${esc(it.describe || it.title)}</div>${s.whoSees === "describer" ? K.copyBox("dd-desc", it.describe || it.title, "Send to the describer by private Zoom chat") : ""}</div>
          ${manual ? `<div class="row" style="gap:8px"><span class="small muted">Team</span><select class="input sm" data-role-key="manualTeam" style="width:160px"><option value="">Choose…</option>${ctx.targets.map(t => `<option value="${t.id}" ${st.manualTeam === t.id ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select><span class="small muted">Describer</span>${sel("manualDescriber", st.manualDescriber)}<span class="small muted">Artist</span>${sel("manualArtist", st.manualArtist)}</div>` :
          K.banner([{ text: "Team:" }, { text: r.team ? r.team.name : "—", strong: true }, { text: "· describer" }, { text: ctx.name(r.describer), strong: true }, { text: "· artist" }, { text: ctx.name(r.artist), strong: true }], r.team && r.team.color)}
          <div class="small muted">${s.allowQuestions ? "Artist may ask questions." : "No questions from the artist."} ${s.allowNames ? "Object names allowed." : "No naming the objects: shapes, positions and colours only."} ${({ whiteboard: "Artist shares Zoom Whiteboard.", app: "Artist shares their screen with a drawing app open." })[s.medium] || "Artist draws on paper and holds it to the camera."} ${s.whoSees === "team" ? "The image shows on the presentation during the preview; the ARTIST looks away." : "Only this console shows the image."}</div></div></div>
        <div class="row" style="margin-top:10px">${UI.ring("round")}<div class="ctl-row">
          <button class="btn ${st.phase === "setup" ? "" : "ghost"}" data-act="preview">${UI.icon("eye")} Preview ${s.previewSeconds}s <span class="kbd">P</span></button>
          <button class="btn ${st.phase === "preview" ? "" : "ghost"}" data-act="draw">${UI.icon("play")} Draw ${s.seconds}s <span class="kbd">D</span></button>
          <button class="btn ${st.phase === "draw" ? "green" : "ghost"}" data-act="judge">${UI.icon("check")} Time, judge <span class="kbd">J</span></button>
          <button class="btn subtle" data-act="restartRound">↺ Restart round</button><button class="btn subtle" data-act="compromised">${UI.icon("flag")} Image seen, replace</button></div></div>
        ${st.phase === "judge" ? (s.scoringMode === "facilitator" ? K.awardRow(ctx, "award", s.points, { label: "Recognisable drawing? Award the team", reason: "drawing" }) : s.scoringMode === "vote" ? `<div class="row" style="margin-top:10px;gap:8px">${ctx.targets.map(t => `<span class="chip" style="--tc:${t.color}">${esc(t.name)} <input class="input sm num" type="number" min="0" value="" placeholder="votes" data-vote-team="${t.id}" aria-label="Votes for ${esc(t.name)}"><button class="btn xs" data-vote-award="${t.id}">Award</button></span>`).join("")}</div>` : "") : ""}
        ${K.nav(ctx, { timer: false, reveal: false, extra: `<span class="dim small">Paper fallback: draw on paper, hold it to the camera, facilitator judges.</span>` })}</div>`;
    },
    presentation(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return [{ type: "eyebrow", text: "Draw and Describe" }, { type: "title", text: "Gallery closed. Thank you, artists." }];
      const r = roles(ctx, st.index);
      const b = [{ type: "eyebrow", text: `Draw and Describe · round ${st.index + 1} of ${st.items.length}` }];
      b.push(K.pBanner([{ text: "Describer:" }, { text: ctx.name(r.describer), strong: true }, { text: "· Artist:" }, { text: ctx.name(r.artist), strong: true }], r.team && r.team.color));
      if (st.phase === "setup") b.push({ type: "title", text: "Get ready" }, { type: "text", text: `${ctx.name(r.artist)}: ${({ whiteboard: "open the Zoom Whiteboard", app: "share your screen with a drawing app open" })[s.medium] || "grab paper and a thick pen"}. ${s.whoSees === "team" ? "When the preview starts, look away from the screen." : ""}` });
      if (st.phase === "preview") { if (s.whoSees === "team") b.push({ type: "text", text: `${ctx.name(r.artist)}: LOOK AWAY. Everyone else, memorise this.` }, { type: "image", svg: it.svg }); else b.push({ type: "title", text: "Describer, check your private chat" }, { type: "text", text: "The image goes to the describer only." }); }
      if (st.phase === "draw") b.push({ type: "title", text: "Draw!" }, { type: "text", text: `${s.allowNames ? "" : "No object names. "}${s.allowQuestions ? "Artist may ask questions." : "Artist may not ask questions."}` });
      if (st.phase === "judge") b.push({ type: "title", text: "Pens down. Here is the original." }, { type: "image", svg: it.svg });
      b.push(K.pTimer());
      return b;
    },
  });
  document.addEventListener("change", e => { const el = e.target; if (el.dataset.roleKey) TCL.Runner.act("setRole", JSON.stringify({ key: el.dataset.roleKey, value: el.value })); });
  document.addEventListener("click", e => { const b = e.target.closest("[data-vote-award]"); if (!b) return; const inp = document.querySelector(`[data-vote-team="${b.dataset.voteAward}"]`); TCL.Runner.act("awardVotes", JSON.stringify({ id: b.dataset.voteAward, n: inp ? inp.value : 0 })); });
})();
