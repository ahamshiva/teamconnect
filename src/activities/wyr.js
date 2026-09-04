/* src/activities/wyr.js  Would You Rather? */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, K = TCL.GameKit, f = K.f;
  const deck = K.deckActions("wyr", { secondsKey: "seconds", timerLabel: "Vote", onEnter: ctx => { ctx.state.explainers = pickExplainers(ctx); ctx.state.countA = ""; ctx.state.countB = ""; } });
  function pickExplainers(ctx) { const n = ctx.settings.explainers || 0; const out = []; for (let i = 0; i < n; i++) { const p = ctx.rotate("wyr", true); if (p) out.push(p.id); } return out; }
  TCL.Games.register({
    id: "wyr", name: "Would You Rather?", tagline: "Quick dilemmas, everyone votes with Zoom reactions.", category: "Energy",
    description: "A dilemma appears. Everyone answers with a Zoom reaction, in chat, with fingers on camera or out loud. A couple of people explain their choice.",
    icon: UI.icons.star, contentGame: "wyr", flexKey: "count", needsZoom: "Participants vote with reactions or chat",
    defaultSettings: { count: 8, seconds: 30, categories: [], discussion: true, discussionSeconds: 45, explainers: 2, scoringEnabled: false, points: 5, manualCounts: true, selectionMode: "random", exactIds: [], unusedOnly: true, sound: true },
    settingsSchema: [f.count("count", "Number of questions", 1, 40), f.seconds("seconds", "Time to vote", 10, 90), f.categories("wyr"), f.diffMin(), f.diffMax(), f.toggle("discussion", "Discussion after each question"), f.seconds("discussionSeconds", "Discussion time", 15, 180, 15),
      f.count("explainers", "People invited to explain", 0, 5), f.toggle("manualCounts", "Enter vote counts by hand"), f.number("points", "Points when scoring is on (award to the team with the best explanation)", 0, 50), f.unused()].concat(K.common()),
    summary(s) { return `${s.count} questions × ${s.seconds}s vote${s.discussion ? " + " + s.discussionSeconds + "s talk" : ""}`; },
    estimateMinutes(s) { return K.est(s.count, s.seconds + (s.discussion ? s.discussionSeconds : 0), 10); },
    validate(s, ctx) { const sel = ctx.content({ count: s.count, categories: s.categories, difficultyMin: s.difficultyMin, difficultyMax: s.difficultyMax }); return sel.pool < s.count ? [{ level: "warn", message: `Only ${sel.pool} questions match the filters; ${s.count} requested.` }] : []; },
    init(ctx) { const st = K.deckInit(ctx, "wyr", ctx.settings.count); st.explainers = pickExplainers(ctx); st.countA = ""; st.countB = ""; return st; },
    actions: Object.assign({}, deck, {
      discuss(ctx) { ctx.timer.start(ctx.settings.discussionSeconds * 1000, "Discussion", 10000); ctx.state.revealed = true; },
      award(ctx, id) { ctx.score(id, ctx.settings.points, "best explanation", ctx.state.index); },
      setA(ctx, v) { ctx.state.countA = v; }, setB(ctx, v) { ctx.state.countB = v; },
      newExplainers(ctx) { ctx.state.explainers = pickExplainers(ctx); },
    }),
    noUndo: ["setA", "setB"],
    hotkeys: { n: "next", d: "discuss" },
    isComplete: K.deckComplete,
    console(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return K.finished(ctx);
      return `<div class="stage">${K.head(ctx, "Would you rather…")}<div class="prompt">${esc(it.text)}</div>
        <div class="options"><div class="opt"><b>A</b> · ${esc(it.a)}${s.manualCounts ? `<input class="input sm num" style="margin-left:10px" type="number" min="0" placeholder="votes" value="${esc(st.countA)}" data-act-input="countA" aria-label="Votes for A">` : ""}</div><div class="opt"><b>B</b> · ${esc(it.b)}${s.manualCounts ? `<input class="input sm num" style="margin-left:10px" type="number" min="0" placeholder="votes" value="${esc(st.countB)}" data-act-input="countB" aria-label="Votes for B">` : ""}</div></div>
        <div class="row">${UI.ring("round")}${st.explainers.length ? `<div class="turn-banner"><span>Invite to explain:</span><b>${st.explainers.map(id => esc(ctx.name(id))).join(", ")}</b><button class="btn xs ghost" data-act="newExplainers">Others</button></div>` : ""}</div>
        ${s.discussion ? `<div class="ctl-row" style="margin-top:10px"><button class="btn blue" data-act="discuss">${UI.icon("clock")} Start discussion (${s.discussionSeconds}s) <span class="kbd">D</span></button></div>` : ""}
        ${K.awardRow(ctx, "award", s.points, { label: "Best explanation", reason: "best explanation", allowRepeat: false })}
        ${K.nav(ctx, { reveal: false })}</div>`;
    },
    presentation(ctx) {
      const st = ctx.state, it = K.current(st);
      if (st.finished || !it) return [{ type: "eyebrow", text: "Would You Rather?" }, { type: "title", text: "Done. Thanks for voting." }];
      const b = [{ type: "eyebrow", text: `Would you rather · ${st.index + 1} of ${st.items.length}` }, { type: "prompt", text: it.text }, { type: "options", items: ["A · " + it.a, "B · " + it.b] }];
      if (st.countA !== "" || st.countB !== "") b.push({ type: "text", text: `Votes: A ${st.countA || 0} · B ${st.countB || 0}` });
      if (st.revealed && st.explainers.length) b.push(K.pBanner([{ text: "Tell us why:" }, { text: st.explainers.map(id => ctx.name(id)).join(", "), strong: true }]));
      else b.push({ type: "text", text: "Vote with a Zoom reaction: 👍 for A, ❤️ for B. Or type A or B in chat." });
      b.push(K.pTimer());
      return b;
    },
  });
})();
