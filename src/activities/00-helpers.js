/* src/activities/00-helpers.js  Shared building blocks for game plugins (schema fields, deck engine, console widgets). */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI;
  const K = TCL.GameKit = {};

  /* Settings can arrive from an imported preset, a restored backup or hand-edited storage,
     none of which go through the settings form's coercion. A NaN from one of those does not
     throw: it makes every comparison false, so a limit silently stops applying and a points
     calculation silently becomes zero. Every numeric setting is read through this. */
  K.num = U.num;

  /* ---------- schema field factories ---------- */
  K.f = {
    count: (key, label, min, max, help) => ({ key, label, type: "range", min, max, step: 1, help }),
    seconds: (key, label, min, max, step) => ({ key, label, type: "range", min, max, step: step || 5, unit: "s" }),
    minutes: (key, label, min, max) => ({ key, label, type: "range", min, max, step: 1, unit: "min" }),
    number: (key, label, min, max, help) => ({ key, label, type: "number", min, max, help }),
    toggle: (key, label, help) => ({ key, label, type: "toggle", help }),
    select: (key, label, options, help) => ({ key, label, type: "select", options, help }),
    text: (key, label, help) => ({ key, label, type: "text", help }),
    textarea: (key, label, help) => ({ key, label, type: "textarea", help }),
    categories: game => ({ key: "categories", label: "Categories", type: "checks", options: () => TCL.Content.categories(game).map(c => ({ value: c, label: c })) }),
    diffMin: () => ({ key: "difficultyMin", label: "Minimum difficulty", type: "select", options: [{ value: 1, label: "★ Easy" }, { value: 2, label: "★★ Medium" }, { value: 3, label: "★★★ Hard" }] }),
    diffMax: () => ({ key: "difficultyMax", label: "Maximum difficulty", type: "select", options: [{ value: 1, label: "★ Easy" }, { value: 2, label: "★★ Medium" }, { value: 3, label: "★★★ Hard" }] }),
    order: () => ({ key: "order", label: "Order", type: "select", options: [{ value: "random", label: "Random" }, { value: "progressive", label: "Progressive (easy to hard)" }] }),
    unused: () => ({ key: "unusedOnly", label: "Prefer previously unused items", type: "toggle", help: "Tops up with used items if there are not enough fresh ones." }),
    mode: () => ({ key: "mode", label: "Play mode", type: "select", options: [{ value: "teams", label: "Teams" }, { value: "individual", label: "Individual" }] }),
    scoring: () => ({ key: "scoringEnabled", label: "Scoring for this activity", type: "toggle" }),
    answerOrder: () => ({ key: "answerOrder", label: "Who answers", type: "select", basic: true, options: [{ value: "turns", label: "Teams take turns, and a miss passes it on" }, { value: "open", label: "Open floor: anyone shouts, first correct scores" }], help: "Turns removes the \"who was first\" argument over Zoom and gives every team the same number of first goes." }),
    passPercent: () => ({ key: "passPercent", label: "Points when a question is passed on", type: "range", min: 0, max: 100, step: 10, unit: "%", showIf: v => v.answerOrder === "turns" }),
    passLimit: () => ({ key: "passLimit", label: "How many times one question may be passed on", type: "range", min: 0, max: 5, step: 1, showIf: v => v.answerOrder === "turns", help: "After this it is revealed, so a single question cannot go round the whole room." }),
    speedBonusMode: () => ({ key: "speedBonusMode", label: "Speed bonus shape", type: "select", options: [{ value: "tiered", label: "Full early, half in the middle, none at the end" }, { value: "half", label: "Full for the first half of the clock, then none" }], showIf: v => !!v.speedBonus }),
    reveal: () => ({ key: "autoReveal", label: "Reveal automatically when the timer ends", type: "toggle", help: "Off (the default) means time running out offers you the choice: give them ten more seconds, reveal, or record that nobody answered." }),
    sound: () => ({ key: "sound", label: "Sound cues", type: "toggle" }),
  };
  K.common = () => [K.f.scoring(), K.f.sound()];

  /* ---------- content deck ---------- */
  /* Select content for an activity and freeze copies into state (later edits to the bank do not change a running game). */
  K.deckInit = function (ctx, contentGame, count, extra) {
    const s = ctx.settings;
    const sel = ctx.content(Object.assign({ game: contentGame, count, categories: s.categories, difficultyMin: s.difficultyMin, difficultyMax: s.difficultyMax, unusedOnly: s.unusedOnly,
      order: s.order, mode: s.selectionMode === "exact" ? "exact" : "random", exactIds: s.exactIds }, extra || {}));
    return { items: sel.items.map(it => U.clone(it)), contentIds: sel.items.map(it => it.id), shortfall: sel.shortfall, index: 0, revealed: false, finished: false, results: {}, skipped: [], replaced: 0 };
  };
  K.current = st => st.items[st.index] || null;
  K.freshItem = function (ctx, contentGame) {
    const st = ctx.state;
    const sel = ctx.content({ game: contentGame, count: 1, categories: ctx.settings.categories, difficultyMin: ctx.settings.difficultyMin, difficultyMax: ctx.settings.difficultyMax, unusedOnly: true, excludeIds: st.contentIds });
    if (!sel.items.length) return null;
    const it = U.clone(sel.items[0]);
    st.contentIds.push(it.id);
    TCL.Content.markUsed([it.id]);
    return it;
  };
  /* Standard deck actions. Games may override any of them. */
  K.deckActions = function (contentGame, opts) {
    opts = opts || {};
    const onEnter = ctx => { if (opts.onEnter) opts.onEnter(ctx); };
    return {
      next(ctx) {
        const st = ctx.state;
        if (st.index >= st.items.length - 1) { st.finished = true; ctx.timer.stop(); return; }
        st.index += 1; st.revealed = false; st.round = (st.round || 0) + 1; onEnter(ctx);
      },
      /* The room is enjoying it and the facilitator wants another. The configured count is a plan,
         not a cage: pull one more item that matches this activity's own filters and carry on. It
         never repeats inside the activity, because freshItem excludes what has already been drawn. */
      more(ctx) {
        const st = ctx.state;
        const it = K.freshItem(ctx, contentGame);
        if (!it) { TCL.emit("ui:toast", { text: "Nothing unused left that matches this activity's categories and difficulty.", kind: "warn" }); return; }
        st.items.push(it);
        st.index = st.items.length - 1;
        st.finished = false;
        st.revealed = false;
        st.round = (st.round || 0) + 1;
        onEnter(ctx);
      },
      prev(ctx) { const st = ctx.state; if (st.index > 0) { st.index -= 1; st.revealed = false; st.finished = false; onEnter(ctx); } },
      skip(ctx) { const st = ctx.state; st.skipped.push(st.index); ctx.log("Skipped item " + (st.index + 1)); this.next(ctx); },
      /* Nobody answered. Reveals so the room still learns the answer, scores nothing,
         and records it so the round summary can say what happened. */
      noResponse(ctx) {
        const st = ctx.state;
        st.outcomes = st.outcomes || {};
        st.outcomes[st.index] = "no response";
        st.revealed = true;
        ctx.timer.pause();
        ctx.log("No response on item " + (st.index + 1));
      },
      /* A Zoom problem, not a wrong answer. Swaps in a fresh item and hands this one back
         to the bank unused, so nobody is disadvantaged and the question is not burned. */
      technical(ctx) {
        const st = ctx.state, cur = K.current(st);
        st.outcomes = st.outcomes || {};
        st.outcomes[st.index] = "technical";
        if (cur && cur.id) TCL.Content.markUnused([cur.id]);
        const it = K.freshItem(ctx, contentGame);
        if (it) { st.items[st.index] = it; st.replaced += 1; st.revealed = false; onEnter(ctx); ctx.log("Technical problem: item swapped, original returned unused"); }
        else { st.revealed = false; ctx.log("Technical problem: no replacement available, item returned unused"); }
      },
      /* Move on without consuming the question. */
      skipUnused(ctx) {
        const st = ctx.state, cur = K.current(st);
        if (cur && cur.id) TCL.Content.markUnused([cur.id]);
        st.skipped.push(st.index);
        ctx.log("Skipped item " + (st.index + 1) + " without using it up");
        this.next(ctx);
      },
      replace(ctx) { const st = ctx.state; const it = K.freshItem(ctx, contentGame); if (!it) { TCL.emit("ui:toast", { text: "No unused replacement available.", kind: "warn" }); return; } st.items[st.index] = it; st.replaced += 1; st.revealed = false; onEnter(ctx); },
      reveal(ctx) { ctx.state.revealed = true; ctx.timer.pause(); },
      hide(ctx) { ctx.state.revealed = false; },
      startTimer(ctx) { const ms = K.num(ctx.settings[opts.secondsKey || "seconds"], 30, 1, 3600) * 1000; ctx.timer.start(ms, opts.timerLabel || "Round", Math.min(10000, ms / 3)); },
      /* Zoom latency and mute fumbles are not the team's fault. */
      grace(ctx) { ctx.timer.adjust(10000); if (!ctx.timer.running()) ctx.timer.resume(); ctx.log("Added 10 seconds"); },
      finish(ctx) { ctx.state.finished = true; ctx.timer.stop(); },
      reopen(ctx) { ctx.state.finished = false; },
    };
  };
  K.deckComplete = ctx => !!(ctx.state && ctx.state.finished);
  K.deckProgress = ctx => { const st = ctx.state; return `<span class="chip mono">${st.finished ? "Finished" : `Item ${st.index + 1} of ${st.items.length}`}</span>${st.shortfall ? `<span class="chip warn"><span class="dot"></span>${st.shortfall} fewer than requested</span>` : ""}`; };

  /* ---------- console widgets ---------- */
  K.head = (ctx, eyebrow, extra) => `<div class="row between" style="margin-bottom:6px"><span class="eyebrow gold">${esc(eyebrow)}</span><div class="row">${K.deckProgress(ctx)}${extra || ""}</div></div>`;
  /* One control row with exactly one primary action, which moves with the round:
     start the clock, then reveal, then next. Everything else lives in the menu so the
     facilitator never has to choose between six equal-looking buttons while talking. */
  K.nav = function (ctx, opts) {
    opts = opts || {};
    const st = ctx.state;
    const hasTimer = opts.timer !== false;
    const canReveal = opts.reveal !== false;
    const last = st.index >= st.items.length - 1;
    const nextLabel = last ? "Finish activity" : "Next";
    /* Which single button is gold right now. */
    let stage = "next";
    if (!st.finished) {
      if (canReveal && !st.revealed && hasTimer && ctx.timer.idle()) stage = "timer";
      else if (canReveal && !st.revealed) stage = "reveal";
      else if (!canReveal && hasTimer && ctx.timer.idle()) stage = "timer";
    }
    const B = {
      timer: `<button class="btn big" data-act="startTimer">${UI.icon("clock")} Start timer</button>`,
      timerGhost: `<button class="btn ghost" data-act="startTimer" title="Start or restart the round timer">${UI.icon("clock")} ${ctx.timer.idle() ? "Start timer" : "Restart timer"}</button>`,
      reveal: `<button class="btn big" data-act="reveal">${UI.icon("eye")} Reveal <span class="kbd">R</span></button>`,
      revealGhost: `<button class="btn ghost" data-act="reveal">${UI.icon("eye")} Reveal <span class="kbd">R</span></button>`,
      hide: `<button class="btn ghost" data-act="hide">${UI.icon("eye")} Hide answer</button>`,
      next: `<button class="btn big" data-act="next">${nextLabel} ${UI.icon("next")} <span class="kbd">N</span></button>`,
      nextGhost: `<button class="btn ghost" data-act="next">${nextLabel} ${UI.icon("next")} <span class="kbd">N</span></button>`,
      reopen: `<button class="btn ghost" data-act="reopen">Reopen last item</button>`,
      more: `<button class="btn ghost" data-act="more">${UI.icon("plus")} Keep going</button>`,
    };
    let main = "";
    if (st.finished) main = B.more + B.reopen;
    else if (stage === "timer") main = B.timer + (canReveal ? B.revealGhost : "") + B.nextGhost;
    else if (stage === "reveal") main = B.reveal + B.nextGhost;
    else main = B.next + (canReveal && st.revealed ? B.hide : "");
    const menu = UI.menu([
      stage !== "timer" && hasTimer ? { label: ctx.timer.idle() ? "Start the timer" : "Restart the timer", icon: "clock", attr: 'data-act="startTimer"' } : null,
      hasTimer && !ctx.timer.idle() ? { label: "Give them 10 more seconds", icon: "clock", attr: 'data-act="grace"' } : null,
      { label: "Previous item", icon: "prev", attr: 'data-act="prev"' + (st.index === 0 ? " disabled" : "") },
      { label: "Keep going: add one more", icon: "plus", attr: 'data-act="more"' },
      st.finished ? null : { sep: true },
      st.finished ? null : { label: "Nobody answered", icon: "x", attr: 'data-act="noResponse"' },
      st.finished ? null : { label: "Technical problem: swap it, keep the question", icon: "shuffle", attr: 'data-act="technical"' },
      st.finished ? null : { label: "Skip without using it up", icon: "skip", attr: 'data-act="skipUnused"' },
      st.finished ? null : { label: "Skip and count it as used", icon: "skip", attr: 'data-act="skip"' },
      st.finished ? null : { label: "Swap for an unused item", icon: "shuffle", attr: 'data-act="replace"' },
    ], { title: "Other controls for this item" });
    /* The clock running out is not a decision. Say so, and offer the four ways out
       rather than jumping the round on for a team that was talking on mute. */
    const timeUp = hasTimer && ctx.timer.done() && !st.revealed && !st.finished
      ? `<div class="timeup-bar">${UI.icon("clock")}<div><b>Time is up.</b> You can still award it, give them a moment, reveal, or record that nobody answered.</div>
          <div class="btn-row"><button class="btn sm ghost" data-act="grace">+10s</button><button class="btn sm ghost" data-act="noResponse">Nobody answered</button></div></div>`
      : "";
    return `${timeUp}<div class="ctl-row primary-row" style="margin-top:14px">${main}${menu}${opts.extra || ""}</div>`;
  };
  K.finished = (ctx, text) => `<div class="stage"><span class="eyebrow gold">Finished</span><div class="prompt">${esc(text || "That is the last one.")}</div><p class="muted">If the room is enjoying it, keep going: that adds one more and the activity carries on. Otherwise mark it complete (top right) for the round summary.</p><div class="ctl-row" style="margin-top:14px"><button class="btn ghost" data-act="more">${UI.icon("plus")} Keep going</button><button class="btn ghost" data-act="reopen">Reopen last item</button></div></div>`;
  K.awardRow = function (ctx, action, points, opts) {
    opts = opts || {};
    if (!ctx.scoringEnabled) return `<div class="dim small" style="margin-top:8px">Scoring is off for this activity.</div>`;
    const round = opts.round != null ? opts.round : ctx.state.index;
    return `<div style="margin-top:10px"><div class="eyebrow" style="margin-bottom:6px">${esc(opts.label || "Award points")}</div>${UI.awardButtons(ctx.targets, action, points, { exclude: opts.exclude, allowRepeat: opts.allowRepeat, done: id => ctx.scored(id, opts.reason || action, round) })}</div>`;
  };
  K.banner = (parts, color) => `<div class="turn-banner" style="--tc:${color || "var(--gold)"}">${parts.map(p => p.strong ? `<b>${esc(p.text)}</b>` : `<span>${esc(p.text)}</span>`).join("")}</div>`;
  K.arg = a => { if (a == null) return a; try { return JSON.parse(a); } catch (e) { return a; } };
  /* ---------- speed bonus ----------
     Tiered rather than flat: the full bonus early, half of it in the middle, nothing in the
     last third. The facilitator and the room can both see what is still on offer, which is
     the point of a speed bonus. */
  K.speedBonus = function (ctx) {
    const s = ctx.settings;
    const bonusPoints = K.num(s.speedBonusPoints, 0, 0, 1000);
    if (!s.speedBonus || bonusPoints <= 0) return { points: 0, tier: "off", ms: 0, nextAt: 0 };
    /* Take the length from the clock that is actually running rather than from a settings
       key guessed by name, so this is right for any game whatever its timer setting. */
    const t = TCL.Timers.get(ctx.timer.name) || {};
    const total = t.durationMs || 0;
    const rem = ctx.timer.remaining();
    /* No clock, no speed to reward. Awarding a "quick answer" bonus when nothing was timed
       hands out free points, which is what happens with autoStart off. */
    if (!total || ctx.timer.idle()) return { points: 0, tier: "none", ms: 0, nextAt: 0 };
    if (s.speedBonusMode === "half") {
      const on = rem > total / 2;
      return { points: on ? bonusPoints : 0, tier: on ? "full" : "none", ms: rem, nextAt: Math.max(0, rem - total / 2) };
    }
    if (rem > total * (2 / 3)) return { points: bonusPoints, tier: "full", ms: rem, nextAt: rem - total * (2 / 3) };
    if (rem > total / 3) return { points: Math.max(1, Math.round(bonusPoints / 2)), tier: "half", ms: rem, nextAt: rem - total / 3 };
    return { points: 0, tier: "none", ms: rem, nextAt: 0 };
  };
  /* Award it alongside the main points. Only the team answering first time gets it:
     a bonus for being quick makes no sense once a question has been passed on. */
  K.awardSpeedBonus = function (ctx, targetId, round) {
    const b = K.speedBonus(ctx);
    if (b.points > 0) ctx.score(targetId, b.points, "speed bonus", round);
    return b.points;
  };
  K.speedChip = function (ctx) {
    const b = K.speedBonus(ctx);
    if (b.tier === "off") return "";
    /* Once a question has been passed on the bonus is gone, so stop advertising it. */
    if (ctx.state && ctx.state.passed) return "";
    if (b.tier === "none") return '<span class="chip">speed bonus gone</span>';
    return `<span class="chip ok"><span class="dot"></span>+${b.points} speed bonus${b.nextAt > 900 ? ` for ${Math.ceil(b.nextAt / 1000)}s` : ""}</span>`;
  };

  /* ---------- turn order ----------
     Teams answer in rotation instead of everyone shouting at once. Over Zoom this removes
     the "who was first" argument entirely, and it guarantees every team gets first go at a
     fair share of the questions. A team that misses passes it on, worth less. */
  K.turnsOn = s => s.answerOrder === "turns";
  /* How many teams get offered one question before it is simply revealed. Without a cap,
     individual mode would walk a single question around fifteen people. */
  K.turnOffers = function (ctx) {
    const lim = K.num(ctx.settings.passLimit, 2, 0, 20);
    return Math.max(1, Math.min(ctx.targets.length, lim + 1));
  };
  K.turnStart = function (ctx) {
    const st = ctx.state;
    if (!K.turnsOn(ctx.settings)) return;
    st.tried = [];
    st.passed = false;
    st.allTried = false;
    /* The team going first rotates with each item, so nobody always leads. */
    st.turnIdx = ctx.targets.length ? (st.index + (st.firstTurn || 0)) % ctx.targets.length : 0;
  };
  K.turnTarget = function (ctx) {
    const st = ctx.state;
    if (!K.turnsOn(ctx.settings) || !ctx.targets.length) return null;
    return ctx.targets[(st.turnIdx || 0) % ctx.targets.length] || null;
  };
  /* Hand the question to the next team that has not tried it yet. */
  K.turnPass = function (ctx) {
    const st = ctx.state;
    if (!K.turnsOn(ctx.settings) || !ctx.targets.length) return null;
    const cur = K.turnTarget(ctx);
    st.tried = st.tried || [];
    if (cur && st.tried.indexOf(cur.id) < 0) st.tried.push(cur.id);
    st.passed = true;
    if (st.tried.length >= K.turnOffers(ctx)) { st.allTried = true; return null; }
    for (let i = 1; i <= ctx.targets.length; i++) {
      const cand = ctx.targets[(st.turnIdx + i) % ctx.targets.length];
      if (st.tried.indexOf(cand.id) < 0) { st.turnIdx = (st.turnIdx + i) % ctx.targets.length; return cand; }
    }
    st.allTried = true;
    return null;
  };
  /* What a correct answer is worth right now: full for the team it was asked to, a
     percentage of that once it has been passed on. */
  K.turnValue = function (ctx, base) {
    if (!K.turnsOn(ctx.settings) || !ctx.state.passed) return base;
    const pct = K.num(ctx.settings.passPercent, 50, 0, 100);
    return Math.max(1, Math.round(K.num(base, 0, 0) * pct / 100));
  };
  K.turnBanner = function (ctx, worth) {
    const st = ctx.state;
    if (!K.turnsOn(ctx.settings)) return "";
    if (st.allTried) return `<div class="turn-order" style="--tc:var(--amber)"><b>${st.tried && st.tried.length >= ctx.targets.length ? "Everyone has had a go." : "Passed on enough."}</b><span>Reveal the answer and move on.</span></div>`;
    const t = K.turnTarget(ctx);
    if (!t) return "";
    return `<div class="turn-order" style="--tc:${t.color}"><b>${esc(t.name)}</b><span>${st.passed ? `passed to them, worth ${worth}` : `to answer, worth ${worth}`}</span>${st.tried && st.tried.length ? `<span class="dim">already tried: ${st.tried.map(id => esc((ctx.targets.find(x => x.id === id) || {}).name || "")).join(", ")}</span>` : ""}</div>`;
  };
  /* The room needs to know whose turn it is, or everyone shouts anyway. */
  K.turnPresentation = function (ctx, worth) {
    const st = ctx.state;
    if (!K.turnsOn(ctx.settings)) return null;
    if (st.allTried) return { type: "banner", parts: [{ text: "Everyone has had a go", strong: true }], color: "var(--amber)" };
    const t = K.turnTarget(ctx);
    if (!t) return null;
    return { type: "banner", color: t.color, parts: [{ text: t.name, strong: true }, { text: st.passed ? `it is passed to you · ${worth} points` : `your question · ${worth} points` }] };
  };
  /* The one team that may answer right now, or null when anyone may. */
  K.turnOnly = ctx => (K.turnsOn(ctx.settings) && !ctx.state.allTried ? K.turnTarget(ctx) : null);

  K.stars = d => "★".repeat(d || 2);
  K.pointsFor = (settings, item) => settings.pointsByDifficulty ? ({ 1: settings.pointsEasy || 10, 2: settings.pointsMedium || 15, 3: settings.pointsHard || 20 })[item.difficulty || 2] : (settings.points || 10);
  /* Presentation helpers */
  K.pBanner = (parts, color) => ({ type: "banner", parts, color });
  K.pTimer = name => ({ type: "timer", name: name || "round" });
  K.pInstr = items => ({ type: "instructions", items });
  K.presHead = (ctx, eyebrow) => [{ type: "eyebrow", text: eyebrow }];
  /* Copyable text block for Zoom chat */
  K.copyBox = (id, text, label) => `<div class="field" style="margin-top:10px"><label for="${id}">${esc(label || "Copy into Zoom chat")}</label><textarea class="input sm mono" id="${id}" rows="4" readonly>${esc(text)}</textarea><div class="btn-row"><button type="button" class="btn sm ghost" data-copy-target="${id}">${UI.icon("copy")} Copy</button></div></div>`;
  document.addEventListener("click", async e => { const b = e.target.closest("[data-copy-target]"); if (!b) return; const ta = document.getElementById(b.dataset.copyTarget); const ok = await U.copyText(ta.value); UI.toast(ok ? "Copied" : "Clipboard unavailable; select the text and copy manually", ok ? "ok" : "warn"); if (!ok) { ta.focus(); ta.select(); } });
  /* Team roster text for messages */
  K.rosterText = ctx => ctx.targets.map(t => `${t.name}: ${t.memberIds.map(id => ctx.name(id)).join(", ")}`).join("\n");
  /* Estimation: per-item cost with realistic overhead */
  K.est = (count, perItemSec, overheadSec) => Math.max(1, (count * (perItemSec + (overheadSec || 12))) / 60 + 1.5);
  /* Choose spotlight participants list (all present, rotation) */
  K.spotlightOrder = (ctx, count) => { const list = U.shuffle(ctx.participants.map(p => p.id)); return list.slice(0, Math.min(count, list.length)); };
})();
