#!/usr/bin/env node
/* tests/edge.js : adversarial edge-case sweep. Where run.js proves the happy paths and the
   documented behaviour, this one tries to break things: empty and hostile input, extreme
   settings, every game at its limits, and anything that could leak an answer to the room. */
const path = require("path"), fs = require("fs"), os = require("os");
const pw = (function () {
  const cands = [null, path.join(os.homedir(), ".claude/skills/gstack/node_modules/playwright"), path.join(__dirname, "..", "node_modules/playwright")];
  for (const c of cands) { try { return require(c || "playwright"); } catch (e) { /* next */ } }
  console.error("Playwright not found."); process.exit(2);
})();
const FILE = "file://" + path.resolve(__dirname, "..", "team-connect.html");
const results = []; let current = "";
function ok(cond, msg) { results.push({ test: current, ok: !!cond, msg }); if (!cond) console.log("   FAIL:", msg); }
async function section(name, fn) { current = name; process.stdout.write("• " + name + "\n"); try { await fn(); } catch (e) { results.push({ test: name, ok: false, msg: "threw: " + (e.stack || e) }); console.log("   THREW:", e.message); } }

(async () => {
  const browser = await pw.chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", e => pageErrors.push(e.message));
  await page.goto(FILE);
  await page.evaluate(() => { TCL.state = null; localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await page.waitForSelector("#app .hero");
  const run = fn => page.evaluate(fn);
  const reset = () => page.evaluate(() => { TCL.state.sessions = []; TCL.state.currentSessionId = null; TCL.persistNow(); });

  await section("hostile text: names and content are escaped everywhere", async () => {
    const r = await run(() => {
      const evil = '<img src=x onerror="window.__pwned=1">';
      const s = TCL.Session.create({ name: evil, participants: [evil, "Ok Person", "Third", "Fourth"] });
      TCL.Teams.build(2);
      TCL.Teams.rename(s.teams[0].id, evil);
      TCL.Content.add({ game: "quiz", text: evil, answer: evil, options: [evil, "b", "c", "d"], correctIndex: 0, category: "Test" });
      const a = TCL.Session.addActivity("game", "quiz");
      a.settings.count = 1; a.settings.selectionMode = "random";
      TCL.Runner.start(a.id);
      TCL.go("console");
      TCL.UI.render();
      const html = document.getElementById("app").innerHTML;
      return { pwned: !!window.__pwned, rawTagInDom: html.indexOf('<img src=x') >= 0, escapedPresent: html.indexOf("&lt;img") >= 0, imgs: document.querySelectorAll("#app img").length };
    });
    ok(!r.pwned, "no script executes from a hostile participant, team or session name");
    ok(!r.rawTagInDom && r.escapedPresent, "the tag is escaped in the DOM rather than parsed: " + JSON.stringify(r));
    ok(r.imgs === 0, "no injected element is created (" + r.imgs + ")");
    const p = await run(() => JSON.stringify(TCL.Presenter.buildPayload()));
    ok(p.indexOf("onerror") >= 0, "the payload carries the text as data (escaping happens at render)");
    await reset();
  });

  await section("empty and tiny rooms", async () => {
    const r = await run(() => {
      const out = {};
      const s = TCL.Session.create({ name: "Empty", participants: [] });
      out.noPeople = { present: TCL.Teams.present(s).length, standings: TCL.Scoring.standings().length, ready: TCL.Readiness.verdict().canStart };
      TCL.Teams.build(3);
      out.teamsWithNobody = s.teams.every(t => t.memberIds.length === 0);
      TCL.Teams.add(["Solo"]);
      TCL.Teams.build(3);
      out.oneperson = { teams: s.teams.length, sizes: s.teams.map(t => TCL.Teams.presentMembers(t, s).length) };
      const a = TCL.Session.addActivity("game", "quiz");
      /* One person in three teams: two teams are empty, which readiness treats as a blocker. */
      out.soloBlockedByReadiness = { canStart: TCL.Readiness.verdict().canStart, why: TCL.Readiness.check(s).filter(x => x.level === "blocker").map(x => x.id) };
      /* everyone absent */
      s.participants.forEach(p2 => { p2.present = false; });
      out.allAbsent = { present: TCL.Teams.present(s).length, eligible: TCL.Teams.eligible(s).length, rotate: TCL.Teams.nextParticipant("k", true),
        validateErrors: TCL.Runner.validate(a).filter(x => x.level === "error").length, canStart: TCL.Readiness.verdict().canStart };
      out.durationOk = typeof TCL.Duration.runSheet(s).total === "number";
      return out;
    });
    ok(r.noPeople.present === 0 && r.noPeople.standings === 0 && !r.noPeople.ready, "an empty session reports no people and refuses to start");
    ok(r.oneperson.teams === 3, "asking for three teams with one person still builds three");
    ok(!r.soloBlockedByReadiness.canStart && r.soloBlockedByReadiness.why.indexOf("teams") >= 0,
      "one person spread over three teams is stopped by the readiness check, which is the gate that matters: " + JSON.stringify(r.soloBlockedByReadiness));
    ok(r.allAbsent.present === 0 && r.allAbsent.rotate === null, "with everyone absent the rotation returns nobody rather than throwing");
    ok(r.allAbsent.validateErrors > 0 && !r.allAbsent.canStart, "with nobody present an activity reports a hard error and the session cannot start: " + JSON.stringify(r.allAbsent));
    ok(r.durationOk, "the duration model survives an empty room");
    await reset();
  });

  await section("extreme settings on every game", async () => {
    const r = await run(() => {
      const s = TCL.Session.create({ name: "Extremes", participants: TCL.Teams.SAMPLE_ROSTER.slice(0, 6) });
      TCL.Teams.build(2);
      const bad = [];
      TCL.Games.list().forEach(g => {
        ["min", "max"].forEach(which => {
          const a = TCL.Session.addActivity("game", g.id);
          (g.settingsSchema || []).forEach(f => {
            if (f.type === "range" || f.type === "number") { const v = which === "min" ? f.min : f.max; if (v != null) a.settings[f.key] = v; }
          });
          try {
            const est = TCL.Duration.activity(a, s);
            if (!isFinite(est) || est < 0) bad.push(g.id + "/" + which + ": estimate " + est);
            const r2 = TCL.Runner.start(a.id);
            if (r2.ok) {
              const ctx = TCL.Runner.ctx(a);
              JSON.stringify(g.presentation(ctx));
              g.console(ctx);
              g.isComplete(ctx);
              TCL.Runner.completeAndDiscard();
            }
          } catch (e) { bad.push(g.id + "/" + which + ": " + e.message); }
          TCL.Session.removeActivity(a.id);
        });
      });
      return { bad, errors: window.__tclErrors.slice() };
    });
    ok(r.bad.length === 0, "every game renders and runs at both ends of every numeric setting: " + JSON.stringify(r.bad).slice(0, 400));
    await reset();
  });

  await section("content starvation", async () => {
    const r = await run(() => {
      const s = TCL.Session.create({ name: "Starved", participants: ["A", "B", "C", "D"] });
      TCL.Teams.build(2);
      const a = TCL.Session.addActivity("game", "quiz");
      a.settings.count = 40;
      a.settings.categories = ["NoSuchCategoryAtAll"];
      const out = {};
      out.validation = TCL.Runner.validate(a).map(x => x.level);
      out.readiness = TCL.Readiness.check(s).find(x => x.id === "content").level;
      const started = TCL.Runner.start(a.id);
      out.started = started.ok;
      if (started.ok) {
        const st = TCL.Runner.ctx().state;
        out.items = st.items.length;
        out.shortfall = st.shortfall;
        out.rendersEmpty = typeof TCL.Games.get("quiz").console(TCL.Runner.ctx()) === "string";
        out.presentationOk = Array.isArray(TCL.Presenter.buildPayload().blocks);
      }
      return out;
    });
    ok(r.readiness === "warn", "readiness warns when the filters starve an activity (" + r.readiness + ")");
    ok(r.rendersEmpty !== false && r.presentationOk !== false, "an activity with no matching content still renders both screens: " + JSON.stringify(r));
    await reset();
  });

  await section("scoring models under stress", async () => {
    const r = await run(() => {
      const s = TCL.Session.create({ name: "Stress", participants: ["A", "B", "C", "D", "E", "F"] });
      TCL.Teams.build(3);
      const a1 = TCL.Session.addActivity("game", "quiz");
      const [x, y, z] = s.teams.map(t => t.id);
      const out = {};
      /* everyone on zero */
      s.scoreModel = "balanced";
      out.allZero = TCL.Scoring.standings().map(r2 => r2.total);
      /* a perfect tie */
      [x, y, z].forEach(id => TCL.Scoring.award({ activityId: a1.id, teamId: id, points: 10, reason: "c", force: true }));
      out.tie = { totals: TCL.Scoring.standings().map(r2 => r2.total), ranks: TCL.Scoring.standings().map(r2 => r2.rank), tied: TCL.Scoring.standings().every(r2 => r2.tied) };
      /* negative-only activity */
      const a2 = TCL.Session.addActivity("game", "quiz");
      [x, y].forEach(id => TCL.Scoring.award({ activityId: a2.id, teamId: id, points: -5, reason: "w", force: true }));
      out.negativeOnly = TCL.Scoring.contributionFor(a2.id, s);
      /* bounded in both directions */
      const a3 = TCL.Session.addActivity("game", "quiz");
      TCL.Scoring.award({ activityId: a3.id, teamId: x, points: 1, reason: "c", force: true });
      TCL.Scoring.award({ activityId: a3.id, teamId: y, points: -999, reason: "w", force: true });
      const c3 = TCL.Scoring.contributionFor(a3.id, s);
      out.bounded = Object.keys(c3).every(k => c3[k] >= -100 && c3[k] <= 100);
      out.boundedValues = c3;
      /* placement with a tie and with negatives */
      s.scoreModel = "placement";
      out.placementTie = TCL.Scoring.contributionFor(a1.id, s);
      out.placementNegative = TCL.Scoring.contributionFor(a2.id, s);
      /* switching model never rewrites events */
      out.events = s.scoreEvents.length;
      ["raw", "balanced", "placement"].forEach(m => { s.scoreModel = m; TCL.Scoring.standings(); });
      out.eventsAfter = s.scoreEvents.length;
      return out;
    });
    ok(r.allZero.every(v => v === 0), "nobody scoring leaves everyone on zero rather than dividing by it");
    ok(r.tie.totals.every(v => v === 100) && r.tie.ranks.every(v => v === 1) && r.tie.tied, "a three-way tie ranks everyone first: " + JSON.stringify(r.tie));
    ok(Object.keys(r.negativeOnly).length === 0, "an activity where everyone lost points contributes nothing rather than nonsense: " + JSON.stringify(r.negativeOnly));
    ok(r.bounded, "no activity can contribute beyond ±100 championship points: " + JSON.stringify(r.boundedValues));
    ok(Object.values(r.placementTie).every(v => v === 30), "placement gives tied teams the same award: " + JSON.stringify(r.placementTie));
    ok(Object.keys(r.placementNegative).length === 0, "placement ignores an activity nobody won");
    ok(r.events === r.eventsAfter, "switching models never touches the score events");
    await reset();
  });

  await section("turn order edge cases", async () => {
    const r = await run(() => {
      const out = {};
      /* one team only */
      const s = TCL.Session.create({ name: "Turns", participants: ["A", "B"] });
      TCL.Teams.build(1);
      const a = TCL.Session.addActivity("game", "quiz");
      a.settings.count = 2;
      TCL.Runner.start(a.id);
      out.singleTeamTarget = !!TCL.GameKit.turnTarget(TCL.Runner.ctx());
      TCL.Runner.act("pass");
      out.singleTeamExhausts = TCL.Runner.ctx().state.allTried;
      out.singleTeamRevealed = TCL.Runner.ctx().state.revealed;
      TCL.Runner.act("next");
      out.recoversNextItem = !TCL.Runner.ctx().state.allTried && !!TCL.GameKit.turnTarget(TCL.Runner.ctx());
      /* passPercent extremes */
      const c = TCL.Runner.ctx();
      c.settings.passPercent = 0; c.state.passed = true;
      out.zeroPercent = TCL.GameKit.turnValue(c, 10);
      c.settings.passPercent = 100;
      out.hundredPercent = TCL.GameKit.turnValue(c, 10);
      c.settings.passPercent = 50;
      out.roundsUp = TCL.GameKit.turnValue(c, 1);
      /* switching mid-activity does not throw */
      c.settings.answerOrder = "open";
      out.openMidway = TCL.GameKit.turnOnly(c) === null && typeof TCL.Games.get("quiz").console(TCL.Runner.ctx()) === "string";
      return out;
    });
    ok(r.singleTeamTarget && r.singleTeamExhausts && r.singleTeamRevealed, "with one team a pass exhausts the question and reveals: " + JSON.stringify(r));
    ok(r.recoversNextItem, "the next question puts someone back on the spot");
    ok(r.zeroPercent === 1 && r.hundredPercent === 10, "pass value honours 0% and 100% without dropping below one point: " + JSON.stringify(r));
    ok(r.roundsUp >= 1, "a one-point question passed on is still worth at least one point");
    ok(r.openMidway, "switching to open floor mid-activity renders fine");
    await reset();
  });

  await section("timers and clocks", async () => {
    const r = await run(() => {
      const s = TCL.Session.create({ name: "Clocks", participants: ["A", "B", "C", "D"] });
      TCL.Teams.build(2);
      const a = TCL.Session.addActivity("game", "quiz");
      TCL.Runner.start(a.id);
      const out = {};
      TCL.Timers.start("round", { durationMs: 5000 });
      for (let i = 0; i < 30; i++) TCL.Timers.adjust("round", -30000);
      out.floor = TCL.Timers.remaining("round");
      TCL.Timers.adjust("round", 30000);
      out.recovers = TCL.Timers.remaining("round") > 0;
      TCL.Timers.start("round", { durationMs: 0 });
      out.zeroDuration = { rem: TCL.Timers.remaining("round"), frac: TCL.Timers.fraction("round") };
      out.speedWithZero = TCL.GameKit.speedBonus(TCL.Runner.ctx()).points;
      TCL.Timers.start("round", { durationMs: 9e12 });
      out.hugeFinite = isFinite(TCL.Timers.remaining("round"));
      return out;
    });
    ok(r.floor === 0, "a clock cannot be pushed below zero (" + r.floor + ")");
    ok(r.recovers, "adding time after zero starts it again");
    ok(r.zeroDuration.rem === 0 && isFinite(r.zeroDuration.frac), "a zero-length clock does not divide by zero: " + JSON.stringify(r.zeroDuration));
    ok(r.speedWithZero === 0, "no speed bonus from a zero-length clock");
    ok(r.hugeFinite, "an absurd duration stays finite");
    await reset();
  });

  await section("presentation never leaks", async () => {
    const r = await run(() => {
      const s = TCL.Session.create({ name: "Leak", participants: TCL.Teams.SAMPLE_ROSTER.slice(0, 6) });
      TCL.Teams.build(2);
      s.participants.forEach((p, i) => { p.fact = "Secret fact " + i; });
      const leaks = [];
      TCL.Games.list().forEach(g => {
        const a = TCL.Session.addActivity("game", g.id);
        Object.assign(a.settings, { count: 2, rounds: 2, turns: 2, items: 2 });
        const started = TCL.Runner.start(a.id);
        if (started.ok) {
          const ctx = TCL.Runner.ctx(a);
          const st = ctx.state;
          const payload = JSON.stringify(TCL.Presenter.buildPayload());
          /* A multiple-choice question shows every option including the right one: that is the
             game. What must not travel before the reveal is which one is correct. Compare
             against the payload with the options stripped out. */
          const blocks = TCL.Presenter.buildPayload().blocks || [];
          const optionText = blocks.filter(b => b.type === "options").map(b => JSON.stringify(b.items)).join("");
          const withoutOptions = JSON.stringify(blocks.filter(b => b.type !== "options"));
          const highlightSent = blocks.some(b => b.type === "options" && b.correct >= 0);
          (st.items || []).forEach(it => {
            if (st.revealed) return;
            const secret = it.answer || it.truth || it.solution;
            if (typeof secret === "string" && secret.length > 3 && withoutOptions.indexOf(secret) >= 0) leaks.push(g.id + " answer");
            if (highlightSent) leaks.push(g.id + " highlights the correct option before the reveal");
            if (typeof secret === "string" && optionText && optionText.indexOf(secret) < 0 && withoutOptions.indexOf(secret) >= 0) leaks.push(g.id + " answer outside options");
          });
          if (a.notes && payload.indexOf(a.notes) >= 0) leaks.push(g.id + " notes");
          TCL.Runner.completeAndDiscard();
        }
        TCL.Session.removeActivity(a.id);
      });
      /* open-answer format has no options to hide behind: the answer must be absent entirely */
      const oa = TCL.Session.addActivity("game", "quiz");
      oa.settings.count = 1; oa.settings.format = "open";
      TCL.Runner.start(oa.id);
      const oaItem = TCL.Runner.ctx().state.items[0];
      const beforeReveal = JSON.stringify(TCL.Presenter.buildPayload()).indexOf(oaItem.answer) >= 0;
      TCL.Runner.act("reveal");
      const afterReveal = JSON.stringify(TCL.Presenter.buildPayload()).indexOf(oaItem.answer) >= 0;
      TCL.Runner.completeAndDiscard();
      TCL.Session.removeActivity(oa.id);
      if (beforeReveal) leaks.push("open-answer quiz leaks before the reveal");
      if (!afterReveal) leaks.push("open-answer quiz never shows the answer");

      /* facilitator notes and turn tracking never travel */
      s.notes = "PRIVATE NOTE";
      TCL.Teams.defer(s.participants[0].id, true);
      const p2 = JSON.stringify(TCL.Presenter.buildPayload());
      return { leaks, notes: p2.indexOf("PRIVATE NOTE") >= 0, deferred: p2.indexOf("deferred") >= 0, participation: p2.indexOf("participation") >= 0 };
    });
    ok(r.leaks.length === 0, "no game sends an unrevealed answer to the participant screen: " + JSON.stringify(r.leaks));
    ok(!r.notes, "facilitator notes never travel to the participant screen");
    ok(!r.deferred && !r.participation, "who is sitting out and who has had a turn stay private");
    await reset();
  });

  await section("storage limits and corruption", async () => {
    const r = await run(() => {
      const out = {};
      const good = JSON.parse(JSON.stringify(TCL.state));
      /* corrupt */
      localStorage.setItem(TCL.STORE_KEY, "{not json");
      out.corrupt = TCL.Store.load().status;
      /* newer schema */
      localStorage.setItem(TCL.STORE_KEY, JSON.stringify({ v: 999, sessions: [] }));
      out.newer = TCL.Store.load().status;
      /* a session that is structurally wrong */
      localStorage.setItem(TCL.STORE_KEY, JSON.stringify({ v: TCL.SCHEMA_VERSION, sessions: [{ id: "x" }, null, 5], settings: {} }));
      const loaded = TCL.Store.load();
      out.brokenSessionsSurvive = Array.isArray(loaded.data.sessions);
      /* settings of the wrong type */
      localStorage.setItem(TCL.STORE_KEY, JSON.stringify({ v: TCL.SCHEMA_VERSION, settings: { volume: "loud", gameDefaults: "nope", consoleMode: 7 }, sessions: [] }));
      const l2 = TCL.Store.load();
      out.badSettings = { gameDefaults: typeof l2.data.settings.gameDefaults, kept: l2.data.settings.volume };
      localStorage.setItem(TCL.STORE_KEY, JSON.stringify(good));
      return out;
    });
    ok(r.corrupt === "corrupt" && r.newer === "newer", "corrupt and future saves are recognised rather than crashing: " + JSON.stringify(r));
    ok(r.brokenSessionsSurvive, "a save containing junk sessions still loads");
    ok(r.badSettings.gameDefaults === "object", "a settings value of the wrong type is replaced with a usable one: " + JSON.stringify(r.badSettings));
  });

  await section("holding screen and finale edges", async () => {
    const r = await run(() => {
      const s = TCL.Session.create({ name: "Hold", participants: ["A", "B", "C", "D"] });
      TCL.Teams.build(2);
      const out = {};
      TCL.Session.hold("custom", "");
      out.emptyCustom = TCL.Presenter.buildPayload().blocks.map(b => b.text).join("|");
      TCL.Session.hold("nonsense-kind");
      out.unknownKind = TCL.Presenter.buildPayload().screen;
      TCL.Session.hold(null);
      /* finale with no activities at all */
      s.status = "complete"; s.finaleMode = "shared";
      const p = TCL.Presenter.buildPayload();
      out.emptyFinale = { screen: p.screen, activities: p.shared && p.shared.activities, points: p.shared && p.shared.points };
      out.podiumWithNoScores = (s.finaleMode = "podium", TCL.Presenter.buildPayload().standings.every(x => x.total === 0));
      return out;
    });
    ok(r.emptyCustom.trim().length > 0, "an empty custom message still shows something rather than a blank screen: " + JSON.stringify(r.emptyCustom));
    ok(r.unknownKind === "holding", "an unknown holding kind still covers the screen");
    ok(r.emptyFinale.screen === "final" && r.emptyFinale.activities === 0 && r.emptyFinale.points === 0, "a finale with nothing played reports zeroes rather than blanks: " + JSON.stringify(r.emptyFinale));
    ok(r.podiumWithNoScores, "a podium with no points shows everyone on zero");
    await reset();
  });

  await section("duplicate and rehearsal interactions", async () => {
    const r = await run(() => {
      const out = {};
      const s = TCL.Session.create({ name: "Base", participants: ["A", "B", "C", "D"] });
      TCL.Teams.build(2);
      TCL.Session.addActivity("game", "quiz");
      /* duplicate a duplicate */
      const d1 = TCL.Session.duplicate(s.id);
      const d2 = TCL.Session.duplicate(d1.id);
      out.chain = { n1: d1.name, n2: d2.name, distinctIds: new Set([s.id, d1.id, d2.id]).size };
      /* a rehearsal must not be duplicable into a real session by accident */
      const reh = TCL.Rehearsal.start();
      const rd = TCL.Session.duplicate(reh.id);
      out.duplicateOfRehearsal = rd.rehearsal;
      TCL.Session.remove(rd.id);
      TCL.Rehearsal.end();
      out.rehearsalGone = TCL.state.sessions.filter(x => x.rehearsal).length;
      return out;
    });
    ok(r.chain.distinctIds === 3 && /\(copy\) \(copy\)/.test(r.chain.n2), "a copy of a copy is its own session: " + JSON.stringify(r.chain));
    ok(r.duplicateOfRehearsal === false, "duplicating a rehearsal produces a real session, not another rehearsal");
    ok(r.rehearsalGone === 0, "ending a rehearsal leaves none behind");
    await reset();
  });

  await section("malformed settings from an imported preset fail closed", async () => {
    const r = await run(() => {
      const s = TCL.Session.create({ name: "Junk", participants: TCL.Teams.SAMPLE_ROSTER.slice(0, 15) });
      s.teamMode = "individual";
      const out = {};
      /* Exactly what a hand-edited or third-party preset JSON can carry: settings that never
         passed through the form's coercion. */
      const junk = { passLimit: "two", passPercent: "fifty", seconds: "quick", count: null, speedBonusPoints: {}, minutes: [] };
      const a = TCL.Session.addActivity("game", "quiz");
      Object.assign(a.settings, junk);
      TCL.Runner.start(a.id);
      const ctx = TCL.Runner.ctx();
      out.offers = TCL.GameKit.turnOffers(ctx);
      ctx.state.passed = true;
      out.passValue = TCL.GameKit.turnValue(ctx, 10);
      /* The quiz pays by difficulty, so what a passed question is actually worth depends on the
         item drawn. Capture it rather than assuming a flat ten. */
      out.worth = TCL.GameKit.pointsFor(ctx.settings, TCL.GameKit.current(ctx.state));
      out.bonus = TCL.GameKit.speedBonus(ctx).points;
      let n = 0; while (!TCL.Runner.ctx().state.allTried && n < 40) { TCL.Runner.act("pass"); n++; }
      out.passes = n;
      TCL.Runner.act("correct", TCL.Runner.ctx().targets[0].id);
      out.awarded = TCL.Scoring.eventsFor(a.id).filter(e => !e.undone).map(e => e.points);
      TCL.Runner.completeAndDiscard();
      /* Five-second reads its own seconds; a junk value must not poison the run sheet total. */
      const f = TCL.Session.addActivity("game", "fivesec");
      Object.assign(f.settings, junk);
      out.fivesecEstimate = TCL.Duration.activity(f, s);
      out.runSheetTotal = TCL.Duration.runSheet(s).total;
      /* A custom activity with junk minutes still gets a usable clock. */
      const cust = TCL.Session.addActivity("custom");
      cust.settings.minutes = "ages";
      TCL.Runner.start(cust.id);
      out.customClock = TCL.Timers.get("round").durationMs;
      /* Auto-fit must still work with a corrupted flexible setting. */
      out.autoFit = TCL.Duration.autoFit(s).changed !== undefined;
      out.totalStillFinite = isFinite(TCL.Duration.runSheet(s).total);
      return out;
    });
    ok(r.offers === 3 && !Number.isNaN(r.offers), 'a passLimit of "two" falls back to the default cap rather than removing it: ' + r.offers);
    ok(r.passes === r.offers && r.passes < 15, "so a question is exhausted after the capped number of offers rather than going round all fifteen (" + r.passes + " of 15)");
    ok(r.passValue === 5, 'a passPercent of "fifty" falls back to 50%, not to NaN: ' + r.passValue);
    ok(r.awarded.length === 1 && r.awarded[0] === Math.round(r.worth / 2) && r.awarded[0] > 0, "a correct answer still scores rather than silently awarding zero: " + JSON.stringify(r.awarded) + " (half of " + r.worth + ")");
    ok(isFinite(r.bonus) && r.bonus === 5, "a nonsense speed-bonus value falls back to the game's own default rather than NaN (" + r.bonus + ")");
    ok(isFinite(r.fivesecEstimate) && r.fivesecEstimate > 0, "a junk seconds value does not make an estimate NaN: " + r.fivesecEstimate);
    ok(isFinite(r.runSheetTotal) && r.totalStillFinite, "one corrupted activity cannot make the whole run-sheet estimate NaN: " + r.runSheetTotal);
    ok(r.customClock >= 60000, "a custom activity with junk minutes still gets a real clock (" + r.customClock + "ms)");
    ok(r.autoFit, "auto-fit runs against a corrupted setting instead of throwing");
    await reset();
  });

  await section("every numeric setting of every game survives junk", async () => {
    const r = await run(() => {
      const JUNK = ["abc", {}, [], null, undefined, "", NaN, "12abc"];
      const bad = [];
      const hasNaN = v => { try { return /NaN|Infinity/.test(typeof v === "string" ? v : JSON.stringify(v)); } catch (e) { return false; } };
      TCL.Games.list().forEach(g => {
        (g.settingsSchema || []).filter(f => f.type === "range" || f.type === "number").forEach(f => {
          JUNK.forEach((junk, ji) => {
            const s = TCL.Session.create({ name: "S", participants: TCL.Teams.SAMPLE_ROSTER.slice(0, 6) });
            TCL.Teams.build(2);
            const a = TCL.Session.addActivity("game", g.id);
            a.settings[f.key] = junk;
            const tag = g.id + "." + f.key + "[#" + ji + "]";
            try {
              const est = TCL.Duration.activity(a, s);
              if (!isFinite(est) || est < 0) bad.push(tag + " estimate=" + est);
              if (!isFinite(TCL.Duration.runSheet(s).total)) bad.push(tag + " run-sheet total NaN");
              if (TCL.Runner.start(a.id).ok) {
                const ctx = TCL.Runner.ctx(a);
                if (hasNaN(g.console(ctx))) bad.push(tag + " console shows NaN");
                if (hasNaN(g.presentation(ctx))) bad.push(tag + " presentation has NaN");
                Object.keys(g.actions).forEach(act => { try { TCL.Runner.act(act); } catch (e) { bad.push(tag + " action " + act + ": " + e.message); } });
                ["round", "breakout", "break"].forEach(n => { const t = TCL.Timers.get(n); if (t && t.status !== "idle" && !isFinite(t.durationMs)) bad.push(tag + " timer " + n + " NaN"); });
                if (hasNaN(TCL.Presenter.buildPayload())) bad.push(tag + " payload NaN");
                if (TCL.Scoring.standings().some(x => !isFinite(x.total) || !isFinite(x.raw))) bad.push(tag + " standings NaN");
              }
            } catch (e) { bad.push(tag + " threw: " + e.message); }
            TCL.Session.remove(s.id);
          });
        });
      });
      return { bad: bad.slice(0, 20), count: bad.length, fields: TCL.Games.list().reduce((n, g) => n + (g.settingsSchema || []).filter(f => f.type === "range" || f.type === "number").length, 0) };
    });
    ok(r.count === 0, "every numeric setting of every game, fed eight kinds of junk, still estimates, renders, runs and scores: " + r.count + " failures " + JSON.stringify(r.bad));
    ok(r.fields > 80, "the sweep actually covers the settings (" + r.fields + " numeric fields × 8 junk values)");
    await reset();
  });

  await section("the participant window is a fixed frame at 720p", async () => {
    const r = await run(() => {
      const s = TCL.Session.create({ name: "Fit", participants: TCL.Teams.SAMPLE_ROSTER.slice(0, 9) });
      TCL.Teams.build(3);
      const a = TCL.Session.addActivity("game", "quiz");
      TCL.Runner.start(a.id);
      TCL.Timers.start("round", { durationMs: 3661000 });
      return { len: TCL.Presenter.buildPayload().timers.round ? 1 : 0 };
    });
    ok(r.len === 1, "a timer is described to the participant window");
    /* The ring's digits must sit inside its hole for both mm:ss and h:mm:ss. */
    const rings = await page.evaluate(() => {
      TCL.go("console"); TCL.UI.render();
      const out = [];
      document.querySelectorAll(".ring").forEach(el => {
        const t = el.querySelector(".t");
        const rb = el.getBoundingClientRect(), tb = t.getBoundingClientRect();
        const hole = rb.width * parseFloat(getComputedStyle(el).getPropertyValue("--hole") || ".7");
        out.push({ text: t.textContent, fits: tb.width <= hole, over: Math.round(tb.width - hole) });
      });
      return out;
    });
    ok(rings.length > 0 && rings.every(x => x.fits), "the countdown digits fit inside the ring: " + JSON.stringify(rings));
    await reset();
  });

  await section("no runtime errors across the whole sweep", async () => {
    const errs = await run(() => window.__tclErrors.slice());
    ok(errs.length === 0, "no window errors: " + JSON.stringify(errs).slice(0, 300));
    ok(pageErrors.length === 0, "no uncaught page errors: " + JSON.stringify(pageErrors).slice(0, 300));
  });

  await browser.close();
  const passed = results.filter(r => r.ok).length, failed = results.filter(r => !r.ok);
  console.log(`\n${passed} passed, ${failed.length} failed`);
  failed.forEach(f => console.log(" ✗", f.test, "::", f.msg));
  fs.writeFileSync(path.join(__dirname, "artifacts", "edge-results.json"), JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
})();
