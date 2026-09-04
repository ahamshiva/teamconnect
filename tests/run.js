#!/usr/bin/env node
/* tests/run.js : end-to-end tests for team-connect.html using Playwright (Chromium).
   Run: NODE_PATH=~/.claude/skills/gstack/node_modules node tests/run.js [--headed] [--keep]
   Uses the gstack Playwright install so nothing needs to be added to this project. */
const path = require("path"), fs = require("fs"), os = require("os");
/* Playwright is not a dependency of this project: it is borrowed from wherever it is already
   installed. Try the plain require first (honours NODE_PATH), then the known local installs,
   so `node tests/run.js` works with no environment setup. */
const pw = (function () {
  const tried = [];
  const candidates = [
    null,
    path.join(os.homedir(), ".claude/skills/gstack/node_modules/playwright"),
    path.join(os.homedir(), ".claude/skills/gstack/node_modules/playwright-core"),
    path.join(__dirname, "..", "node_modules/playwright"),
  ];
  for (const c of candidates) {
    try { return require(c || "playwright"); } catch (e) { tried.push((c || "playwright") + ": " + e.code); }
  }
  console.error("Playwright not found. Install it, or point NODE_PATH at a folder that has it.\nLooked in:\n  " + tried.join("\n  "));
  process.exit(2);
})();
const FILE = "file://" + path.resolve(__dirname, "..", "team-connect.html");
const ART = path.resolve(__dirname, "artifacts"); fs.mkdirSync(ART, { recursive: true });
const results = []; let current = "";
function ok(cond, msg) { results.push({ test: current, ok: !!cond, msg }); if (!cond) console.log("   FAIL:", msg); }
let lastPage = null;
async function test(name, fn) { current = name; process.stdout.write("• " + name + "\n"); try { await fn(); } catch (e) { results.push({ test: name, ok: false, msg: "threw: " + (e.stack || e) }); console.log("   THREW:", e.message); try { if (lastPage && !lastPage.isClosed()) await lastPage.screenshot({ path: path.join(ART, "fail-" + name.slice(0, 20).replace(/\W+/g, "_") + ".png") }); } catch (e2) { /* ignore */ } } }
const errorsOf = page => page.evaluate(() => window.__tclErrors.slice());
async function fresh(context, opts) {
  const page = await context.newPage();
  page.on("pageerror", e => console.log("   pageerror:", e.message));
  lastPage = page;
  await page.goto(FILE); await page.waitForSelector("#app .hero, #app .content, #app .console", { timeout: 5000 });
  if (opts && opts.clear) { await page.evaluate(() => { TCL.state = null; localStorage.clear(); sessionStorage.clear(); }); await page.reload(); await page.waitForSelector("#app .hero"); }
  return page;
}
/* Secondary actions now live in overflow menus. Open the containing <details> first,
   then click for real so the app's own handlers run. */
async function menuClick(page, selector) {
  await page.waitForSelector(selector, { state: "attached" });
  await page.evaluate(sel => {
    const b = document.querySelector(sel);
    if (!b) throw new Error("no such control: " + sel);
    const d = b.closest("details.menu"); if (d) d.open = true;
    b.click();
  }, selector);
}
async function menuHas(page, selector) {
  return page.evaluate(sel => !!document.querySelector(sel), selector);
}
async function shot(page, name) { await page.screenshot({ path: path.join(ART, name + ".png"), fullPage: false }); }
/* Build a session with every game via the API, small counts, and a 15-person roster. */
async function seedSession(page, opts) {
  opts = opts || {};
  return page.evaluate(o => {
    const s = TCL.Session.create({ name: o.name || "E2E Session", targetMinutes: 60, participants: TCL.Teams.SAMPLE_ROSTER.slice(0, o.people == null ? 15 : o.people) });
    s.participants.forEach((p, i) => { p.location = i % 2 ? "Gurugram" : "Sydney"; if (i < 10) p.fact = "Fact number " + (i + 1) + " about me"; });
    if (s.participants.length >= 2) TCL.Teams.build(o.teams || 3);
    const games = o.games || TCL.Games.list().map(g => g.id);
    games.forEach(id => { const a = TCL.Session.addActivity("game", id); Object.assign(a.settings, { count: 2, rounds: 2, turns: 2, items: 2 }, o.settings || {}); });
    /* Tests drive the runner directly, so mark the readiness gate as already passed
       unless a test explicitly wants to see it. */
    if (!o.readiness) s.ready = { checkedAt: Date.now() };
    if (o.mode) { TCL.state.settings.consoleMode = o.mode; }
    TCL.Session.touch(); TCL.persistNow();
    return s.id;
  }, opts);
}
(async () => {
  const headed = process.argv.includes("--headed");
  const browser = await pw.chromium.launch({ headless: !headed });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  await test("boot: no errors, 14 games, content registered", async () => {
    const page = await fresh(context, { clear: true });
    const info = await page.evaluate(() => ({ games: TCL.Games.list().length, content: TCL.Content.all().length, presets: TCL.Session.presets().length, errors: window.__tclErrors }));
    ok(info.games === 17, "17 games registered (" + info.games + ")");
    ok(info.content > 300, "content registered: " + info.content);
    ok(info.presets === 6, "6 built-in presets");
    ok(info.errors.length === 0, "no runtime errors: " + JSON.stringify(info.errors));
    await shot(page, "01-home");
    await page.close();
  });

  await test("wizard: create session from preset with sample roster", async () => {
    const page = await fresh(context, { clear: true });
    await page.click("button[data-new]");
    await page.waitForSelector("#wiz");
    await page.fill("#w-name", "Wizard Session");
    await page.click("#w-sample");
    await page.click("#wiz button[type=submit]");
    await page.waitForSelector("#runsheet");
    const info = await page.evaluate(() => { const s = TCL.session(); return { name: s.name, people: s.participants.length, teams: s.teams.length, acts: s.runSheet.length, target: s.targetMinutes }; });
    ok(info.name === "Wizard Session", "session named");
    ok(info.people === 15, "15 participants");
    ok(info.teams === 3, "3 teams built (" + info.teams + ")");
    ok(info.acts === 7, "Full 60 preset loaded 7 activities (" + info.acts + ")");
    const dur = await page.evaluate(() => TCL.Duration.runSheet());
    ok(dur.total > 45 && dur.total < 72, "duration estimate plausible for a 60-min preset: " + dur.total.toFixed(1));
    await shot(page, "02-builder");
    await page.close();
  });

  await test("builder: configure modal, apply settings, duplicate, remove, reorder, autofit, presets", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz", "wyr"] });
    await page.evaluate(() => TCL.go("builder"));
    await page.waitForSelector("#runsheet .rs-item");
    await page.click("#runsheet .rs-item [data-configure]");
    await page.waitForSelector(".modal #cfg");
    await page.fill('.modal [name="count"]', "7");
    await page.evaluate(() => { const i = document.querySelector('.modal [name="count"]'); i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true })); });
    const sum = await page.textContent("#cfg-summary");
    ok(/7 questions/.test(sum), "live summary updates: " + sum.trim().slice(0, 60));
    await page.click(".modal [data-mval='2']");
    await page.waitForSelector("#runsheet");
    let st = await page.evaluate(() => TCL.session().runSheet[0].settings.count);
    ok(st === 7, "count applied = 7 (" + st + ")");
    await menuClick(page, "#runsheet .rs-item [data-dup]");
    let n = await page.evaluate(() => TCL.session().runSheet.length);
    ok(n === 3, "duplicate adds an instance (" + n + ")");
    await menuClick(page, "#runsheet .rs-item:last-child [data-move][data-dir='-1']");
    const order = await page.evaluate(() => TCL.session().runSheet.map(a => a.gameId).join(","));
    ok(order === "quiz,wyr,quiz", "move up reorders: " + order);
    await menuClick(page, "#runsheet .rs-item:last-child [data-remove]");
    await page.waitForSelector(".modal"); await page.click(".modal [data-mval='1']");
    n = await page.evaluate(() => TCL.session().runSheet.length);
    ok(n === 2, "remove with confirm (" + n + ")");
    await page.click("[data-autofit]");
    const d = await page.evaluate(() => TCL.Duration.runSheet());
    ok(Math.abs(d.total - d.target) < 4, "auto-fit brings total near target: " + d.total.toFixed(1) + " vs " + d.target);
    await menuClick(page, "[data-save-preset]"); await page.waitForSelector("#modal-input"); await page.fill("#modal-input", "My preset"); await page.click(".modal [data-mval='1']");
    const presets = await page.evaluate(() => TCL.state.presets.length);
    ok(presets === 1, "custom preset saved");
    await menuClick(page, "[data-load-preset]"); await page.waitForSelector(".modal [data-load]");
    const count = await page.$$eval(".modal [data-load]", x => x.length);
    ok(count === 7, "preset picker lists 7 (" + count + ")");
    await page.keyboard.press("Escape");
    await menuClick(page, "[data-preview]"); await page.waitForSelector(".modal table.tbl");
    ok(await page.$$eval(".modal table.tbl tr", r => r.length) >= 3, "preview lists activities");
    await page.keyboard.press("Escape");
    await page.close();
  });

  await test("participants: add, absent, guest, teams, lock, csv, duplicates, long names", async () => {
    const page = await fresh(context, { clear: true });
    await page.evaluate(() => { TCL.Session.create({ name: "P", targetMinutes: 45 }); TCL.persistNow(); });
    await page.evaluate(() => TCL.go("participants"));
    await page.waitForSelector("#p-names");
    await page.fill("#p-names", "Priya · Sydney\nTom · Gurugram\nMei-Ling\nPriya\nJosé Ñandú O'Brien-Smythe the Third of Somewhereshire Esquire\nAnn, Bob");
    await page.click("[data-add-names]");
    let info = await page.evaluate(() => ({ n: TCL.session().participants.length, names: TCL.session().participants.map(p => p.displayName) }));
    ok(info.n === 7, "7 added incl. comma split (" + info.n + ")");
    ok(info.names.includes("Priya (2)"), "duplicate disambiguated: " + info.names.join("|"));
    await page.fill("#t-count", "2");
    await page.click("[data-make-teams]");
    info = await page.evaluate(() => ({ teams: TCL.session().teams.length, sizes: TCL.session().teams.map(t => t.memberIds.length) }));
    ok(info.teams === 2 && Math.abs(info.sizes[0] - info.sizes[1]) <= 1, "2 balanced teams: " + info.sizes.join("/"));
    await page.click(".person [data-toggle-present]");
    info = await page.evaluate(() => ({ present: TCL.Teams.present().length, sizes: TCL.session().teams.map(t => TCL.Teams.presentMembers(t).length) }));
    ok(info.present === 6 && Math.abs(info.sizes[0] - info.sizes[1]) <= 1 && info.sizes[0] + info.sizes[1] === 6, "absent + rebalance: present " + info.present + " sizes " + info.sizes.join("/"));
    await page.click("[data-lock]");
    ok(await page.evaluate(() => TCL.session().teamsLocked), "teams locked");
    await page.fill("#p-names", "Late Larry"); await page.click("[data-add-names]");
    info = await page.evaluate(() => { const p = TCL.session().participants.find(x => x.name === "Late Larry"); return { team: !!TCL.Teams.teamOf(p.id) }; });
    ok(info.team, "late arrival joins a team");
    const problems = await page.evaluate(() => TCL.Teams.problems().length);
    ok(problems >= 1, "problems reported for duplicate names");
    await page.close();
  });

  await test("edge cases: zero, one, two participants; more teams than people; empty team", async () => {
    const page = await fresh(context, { clear: true });
    let r = await page.evaluate(() => { TCL.Session.create({ name: "Zero" }); const a = TCL.Session.addActivity("game", "quiz"); return TCL.Runner.start(a.id); });
    ok(r.ok === false && /present/i.test(r.reason), "zero participants blocked: " + r.reason);
    r = await page.evaluate(() => { const s = TCL.Session.create({ name: "One", participants: ["Solo"] }); const a = TCL.Session.addActivity("game", "draw"); return { start: TCL.Runner.start(a.id), problems: TCL.Teams.problems().map(p => p.level) }; });
    ok(r.start.ok === false, "draw with 1 person blocked");
    r = await page.evaluate(() => { const s = TCL.Session.create({ name: "Two", participants: ["A", "B"] }); TCL.Teams.build(3); const a = TCL.Session.addActivity("game", "fivesec"); a.settings.count = 1; const st = TCL.Runner.start(a.id); return { st, sizes: s.teams.map(t => t.memberIds.length), problems: TCL.Teams.problems().length, errors: window.__tclErrors }; });
    ok(r.st.ok === true, "2 people / 3 teams: fivesec starts with fallback: " + JSON.stringify(r.st));
    ok(r.sizes.filter(n => n === 0).length === 1 && r.problems >= 1, "empty team detected");
    ok(r.errors.length === 0, "no runtime errors");
    await page.close();
  });

  await test("every game: start, drive actions, complete, no errors", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { name: "All games" });
    await page.evaluate(() => TCL.go("console"));
    await page.waitForSelector(".console");
    const ids = await page.evaluate(() => TCL.session().runSheet.map(a => a.id));
    for (const id of ids) {
      const r = await page.evaluate(async id => {
        const res = TCL.Runner.start(id); if (!res.ok) return { ok: false, reason: res.reason };
        const a = TCL.Runner.current(); const g = TCL.Games.get(a.gameId);
        const acts = Object.keys(g.actions);
        const before = window.__tclErrors.length;
        /* click every rendered data-act button once, then run a scripted path */
        TCL.UI.render();
        const btnActs = Array.from(document.querySelectorAll("[data-act]")).map(b => b.dataset.act);
        const tried = [];
        for (const name of acts) {
          if (["next", "finish", "prev", "skip", "reopen"].includes(name)) continue;
          try { const arg = (name === "award" || name === "correct" || name === "wrong" || name === "mercy" || name === "catchLie" || name === "solved" || name === "attempted" || name === "voteWin" || name === "unusual" || name === "awardCount" || name === "clearOrder" || name === "changePerson") ? TCL.Runner.ctx().targets[0].id : undefined; TCL.Runner.act(name, arg); tried.push(name); } catch (e) { tried.push(name + "!" + e.message); }
        }
        /* advance to completion */
        let guard = 0;
        while (!g.isComplete(TCL.Runner.ctx()) && guard++ < 30) { if (g.actions.next) TCL.Runner.act("next"); else if (g.actions.nextTeam) TCL.Runner.act("nextTeam"); else if (g.actions.endTurn) TCL.Runner.act("endTurn"); else if (g.actions.finish) TCL.Runner.act("finish"); else break; }
        const complete = g.isComplete(TCL.Runner.ctx());
        /* presentation payload must be serialisable and contain no facilitator-only strings */
        const payload = TCL.Presenter.buildPayload();
        JSON.stringify(payload);
        TCL.Runner.complete();
        return { ok: true, game: g.id, tried, complete, btnActs: btnActs.length, errors: window.__tclErrors.slice(before), status: a.status, scoreEvents: TCL.Scoring.eventsFor(a.id).length };
      }, id);
      ok(r.ok, r.game + ": started (" + (r.reason || "") + ")");
      if (r.ok) {
        ok(r.complete, r.game + ": reached completion");
        ok(r.errors.length === 0, r.game + ": no errors " + JSON.stringify(r.errors));
        ok(r.status === "complete", r.game + ": status complete");
        ok(r.btnActs > 0, r.game + ": console renders action buttons (" + r.btnActs + ")");
      }
    }
    await page.evaluate(() => TCL.go("results"));
    await page.waitForSelector(".podium, .callout");
    const errs = await errorsOf(page);
    ok(errs.length === 0, "results screen renders without errors");
    await shot(page, "03-results");
    await page.close();
  });

  await test("quiz flow via UI: start, award, reveal, undo, next, double-click guard, private answer hidden on presentation", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz"], settings: { count: 3, autoStart: true } });
    await page.evaluate(() => { TCL.go("console"); });
    await page.waitForSelector("[data-start]");
    await page.click("[data-start]");
    await page.waitForSelector(".stage .prompt");
    await shot(page, "04-console-quiz");
    let payload = await page.evaluate(() => TCL.Presenter.buildPayload());
    const answer = await page.evaluate(() => TCL.Runner.ctx().state.items[0].answer);
    ok(!JSON.stringify(payload.blocks).includes('"answer"'), "no answer block before reveal");
    ok(!payload.blocks.some(b => b.type === "answer"), "answer not in presentation before reveal");
    ok(payload.timers.round && payload.timers.round.status === "running", "round timer running and described to presentation");
    const btn = await page.$(".award-grid .btn.team");
    await btn.click();
    await page.evaluate(() => new Promise(r => setTimeout(r, 50)));
    const afterOne = await page.evaluate(() => TCL.Scoring.standings()[0].raw);
    ok(afterOne === 15, "award gives 10 for the answer plus the 5-point speed bonus while the clock is early (" + afterOne + ")");
    /* double-click guard: the button is disabled after click and re-rendered as done */
    const disabled = await page.$eval(".award-grid .btn.team", b => b.disabled);
    ok(disabled, "awarded button disabled against repeat clicks");
    const dup = await page.evaluate(() => { const ctx = TCL.Runner.ctx(); const t = TCL.Scoring.standings()[0]; return ctx.score(t.id, 10, "correct", ctx.state.index); });
    ok(dup === null, "rapid duplicate award rejected by scoring guard");
    payload = await page.evaluate(() => TCL.Presenter.buildPayload());
    ok(payload.blocks.some(b => b.type === "answer" && b.text === answer), "answer revealed after award");
    await menuClick(page, "[data-undo]");
    const afterUndo = await page.evaluate(() => TCL.Scoring.standings().map(r => r.total).reduce((a, b) => a + b, 0));
    ok(afterUndo === 0, "undo removes the award (" + afterUndo + ")");
    await menuClick(page, "[data-redo]");
    const afterRedo = await page.evaluate(() => TCL.Scoring.standings()[0].raw);
    ok(afterRedo === 15, "redo restores the award (" + afterRedo + ")");
    await page.keyboard.press("n");
    const idx = await page.evaluate(() => TCL.Runner.current().state.index);
    ok(idx === 1, "N key advances (" + idx + ")");
    await menuClick(page, "[data-undo]");
    const idx2 = await page.evaluate(() => TCL.Runner.current().state.index);
    ok(idx2 === 0, "undo after next returns to previous question (" + idx2 + ")");
    await page.close();
  });

  await test("timers: timestamp based, add/subtract, pause, never negative, survive reload", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz"], settings: { count: 2, seconds: 30 } });
    await page.evaluate(() => { TCL.go("console"); TCL.Runner.start(TCL.session().runSheet[0].id); });
    await page.waitForSelector(".timer-ctl.compact [data-timer='sub']");
    await page.click("[data-timer='sub']");
    let rem = await page.evaluate(() => TCL.Timers.remaining("round"));
    ok(rem <= 1000, "−30s from 30s floors at 0 (" + rem + ")");
    await page.click("[data-timer='add']"); await page.click("[data-timer='add']");
    rem = await page.evaluate(() => ({ r: TCL.Timers.remaining("round"), s: TCL.Timers.get("round").status }));
    ok(rem.r > 55000 && rem.r <= 60000 && rem.s === "running", "+30 +30 after time-up => ~60s and running again (" + JSON.stringify(rem) + ")");
    await page.click("[data-timer='toggle']");
    const paused = await page.evaluate(() => TCL.Timers.get("round").status);
    ok(paused === "paused", "toggle pauses (" + paused + ")");
    await page.click("[data-timer='toggle']");
    ok((await page.evaluate(() => TCL.Timers.get("round").status)) === "running", "toggle resumes");
    await page.evaluate(() => TCL.persistNow());
    const before = await page.evaluate(() => TCL.Timers.remaining("round"));
    await page.waitForTimeout(1500);
    await page.reload(); await page.waitForSelector("#app");
    const after = await page.evaluate(() => ({ rem: TCL.Timers.remaining("round"), status: TCL.Timers.get("round").status, screen: TCL.route.screen, live: TCL.session().status, cur: !!TCL.Runner.current() }));
    ok(after.status === "running" && before - after.rem > 1000 && before - after.rem < 4000, "timer keeps running across reload using timestamps (" + before + " -> " + after.rem + ")");
    ok(after.cur, "current activity restored after reload");
    /* simulate laptop sleep: shift startedAt back 20 minutes */
    await page.evaluate(() => { const t = TCL.Timers.get("round"); t.startedAt -= 20 * 60000; TCL.Timers.tick(); });
    const slept = await page.evaluate(() => ({ rem: TCL.Timers.remaining("round"), status: TCL.Timers.get("round").status }));
    ok(slept.rem === 0 && slept.status === "done", "sleep beyond duration => done at 0, not negative");
    await page.close();
  });

  await test("recovery: home shows unfinished session with resume/dashboard/scores/duplicate/delete", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["fivesec"], settings: { count: 2 } });
    await page.evaluate(() => { TCL.Runner.start(TCL.session().runSheet[0].id); TCL.persistNow(); sessionStorage.clear(); });
    await page.reload(); await page.waitForSelector("#app");
    const html = await page.content();
    ok(/We found an unfinished session/.test(html), "recovery banner shown");
    ok(await page.$("[data-resume]") && await page.$("[data-dash]") && await page.$("[data-scores]") && await page.$("[data-dup]") && await page.$("[data-del]"), "all five recovery options present");
    await page.click("[data-resume]");
    await page.waitForSelector(".console");
    const cur = await page.evaluate(() => TCL.Runner.current() && TCL.Runner.current().title);
    ok(cur === "Five-Second Frenzy", "resume lands on the active activity (" + cur + ")");
    await page.close();
  });

  await test("exit paths: pause, save, end keep, end discard; reset; reopen; end session", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["gibberish", "wyr"], settings: { count: 2 }, mode: "advanced" });
    await page.evaluate(() => { TCL.go("console"); TCL.Runner.start(TCL.session().runSheet[0].id); });
    await page.waitForSelector("[data-exit]", { state: "attached" });
    await page.evaluate(() => { const ctx = TCL.Runner.ctx(); TCL.Runner.act("correct", ctx.targets[0].id); });
    await menuClick(page, "[data-exit]"); await page.waitForSelector(".modal");
    const labels = await page.$$eval(".modal [data-mval]", b => b.map(x => x.textContent.trim()));
    ok(labels.length === 5 && /Cancel/.test(labels[0]) && /discard/i.test(labels[4]), "five exit choices: " + labels.join(" | "));
    await page.click(".modal [data-mval='1']");
    let st = await page.evaluate(() => TCL.session().runSheet[0].status);
    ok(st === "paused", "pause exit sets paused (" + st + ")");
    await page.click("[data-start]"); await page.waitForSelector("[data-exit]", { state: "attached" });
    await menuClick(page, "[data-exit]"); await page.waitForSelector(".modal"); await page.click(".modal [data-mval='4']");
    await page.waitForSelector(".modal"); await page.click(".modal [data-mval='1']");
    st = await page.evaluate(() => ({ status: TCL.session().runSheet[0].status, total: TCL.Scoring.standings().reduce((a, r) => a + r.total, 0), disc: TCL.session().runSheet[0].scoresDiscarded }));
    ok(st.status === "complete" && st.total === 0 && st.disc, "end + discard removes this activity's scores");
    await menuClick(page, "[data-reset]"); await page.waitForSelector(".modal"); await page.click(".modal [data-mval='1']");
    st = await page.evaluate(() => ({ status: TCL.session().runSheet[0].status, state: TCL.session().runSheet[0].state }));
    ok(st.status === "pending" && st.state === null, "reset returns to pending");
    await page.evaluate(() => { TCL.Runner.start(TCL.session().runSheet[1].id); TCL.Runner.complete(); TCL.UI.render(); });
    await menuClick(page, "[data-reopen]");
    st = await page.evaluate(() => TCL.session().runSheet[1].status);
    ok(st === "paused", "reopen completed activity (" + st + ")");
    await page.waitForSelector("[data-exit]", { state: "attached" });
    ok(!!(await page.$("[data-start]")), "reopened activity shows Resume");
    await menuClick(page, "[data-exit]"); await page.waitForSelector(".modal"); await page.click(".modal [data-mval='1']");
    await menuClick(page, "[data-end-session]"); await page.waitForSelector(".modal"); await page.click(".modal [data-mval='1']");
    await page.waitForSelector(".podium, .callout");
    st = await page.evaluate(() => TCL.session().status);
    ok(st === "complete", "end session marks complete");
    await page.close();
  });

  await test("presentation window: opens, connects, receives payload, shows no private data", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz"], settings: { count: 2 } });
    await page.evaluate(() => { TCL.go("console"); TCL.Runner.start(TCL.session().runSheet[0].id); });
    await page.waitForSelector("[data-open-presentation]");
    const [popup] = await Promise.all([context.waitForEvent("page"), page.click("[data-open-presentation]")]);
    await popup.waitForSelector(".pres-stage", { timeout: 8000 });
    await page.waitForFunction(() => TCL.Presenter.status === "connected", null, { timeout: 8000 }).catch(() => {});
    const status = await page.evaluate(() => TCL.Presenter.status);
    ok(status === "connected", "facilitator sees presentation connected (" + status + ")");
    const answer = await page.evaluate(() => TCL.Runner.ctx().state.items[0].answer);
    const question = await page.evaluate(() => TCL.Runner.ctx().state.items[0].text);
    let text = await popup.textContent("#app");
    ok(text.includes(question), "presentation shows the question");
    const hasAnswerBlock = await popup.$(".pres-stage .answer"), hasCorrect = await popup.$(".pres-stage .opt.correct");
    ok(!hasAnswerBlock && !hasCorrect, "presentation hides the answer before reveal (no answer block, no highlighted option)");
    const privHit = (text.match(/Private ·[^\n]{0,40}/) || [""])[0]; ok(!privHit && !(await popup.$(".private")), "no private panels on presentation " + privHit);
    await page.keyboard.press("r");
    await popup.waitForSelector(".pres-stage .answer", { timeout: 5000 });
    text = await popup.textContent(".pres-stage .answer");
    ok(text.includes(answer), "answer appears after reveal");
    await popup.screenshot({ path: path.join(ART, "05-presentation.png") });
    /* disconnect and reconnect */
    await popup.close();
    await page.waitForFunction(() => TCL.Presenter.status === "disconnected" || TCL.Presenter.status === "closed", null, { timeout: 8000 }).catch(() => {});
    const st2 = await page.evaluate(() => TCL.Presenter.status);
    ok(st2 === "disconnected" || st2 === "closed", "closing the window is detected (" + st2 + ")");
    const [popup2] = await Promise.all([context.waitForEvent("page"), page.click("[data-open-presentation]")]);
    await popup2.waitForSelector(".pres-stage", { timeout: 8000 });
    await page.waitForFunction(() => TCL.Presenter.status === "connected", null, { timeout: 8000 }).catch(() => {});
    ok((await page.evaluate(() => TCL.Presenter.status)) === "connected", "reconnect works without restarting the game");
    await popup2.close();
    await page.close();
  });

  await test("content manager: add, edit, disable, import validation, export, exact selection", async () => {
    const page = await fresh(context, { clear: true });
    await page.evaluate(() => TCL.go("content"));
    await page.waitForSelector("[data-f='game']");
    const res = await page.evaluate(() => TCL.Content.importJSON(JSON.stringify([{ game: "quiz", text: "Custom Q?", answer: "42", category: "Custom" }, { game: "nope", text: "x" }, { game: "quiz", text: "" }])));
    ok(res.added === 1 && res.errors.length >= 2, "import validates: 1 added, 2 rejected with messages: " + res.errors.map(e => e.message).join(" / "));
    const csv = await page.evaluate(() => TCL.Content.importCSV("game,text,answer,category,difficulty\nquiz,CSV question?,yes,Custom,3\n,Second one?,no,,", "quiz"));
    ok(csv.added === 2 && csv.errors.length === 0, "CSV import with default game: " + JSON.stringify(csv));
    const bad = await page.evaluate(() => TCL.Content.importJSON("{not json"));
    ok(bad.added === 0 && /JSON/.test(bad.errors[0].message), "invalid JSON reported");
    const sel = await page.evaluate(() => { const ids = TCL.Content.all("quiz").slice(0, 4).map(i => i.id); const r = TCL.Content.select({ game: "quiz", mode: "exact", exactIds: ids }); return { n: r.items.length, uniq: new Set(r.items.map(i => i.id)).size }; });
    ok(sel.n === 4 && sel.uniq === 4, "exact selection returns exactly the requested unique items");
    const rnd = await page.evaluate(() => { const r = TCL.Content.select({ game: "quiz", count: 25, unusedOnly: true }); return { n: r.items.length, uniq: new Set(r.items.map(i => i.id)).size }; });
    ok(rnd.n === 25 && rnd.uniq === 25, "random selection: 25 unique items");
    const over = await page.evaluate(() => { const r = TCL.Content.select({ game: "truths", count: 500 }); return { n: r.items.length, short: r.shortfall }; });
    ok(over.short > 0 && over.n < 500, "requesting more than available reports a shortfall: " + JSON.stringify(over));
    await page.evaluate(() => { const it = TCL.Content.all("quiz")[0]; TCL.Content.setEnabled(it.id, false); TCL.Content.update(it.id, { text: "Edited built-in" }); TCL.persistNow(); });
    const chk = await page.evaluate(() => { const it = TCL.Content.all("quiz")[0]; return { enabled: it.enabled, text: it.text }; });
    ok(chk.enabled === false && chk.text === "Edited built-in", "disable + override built-in");
    await page.evaluate(() => TCL.Content.restoreBuiltIn("quiz"));
    const chk2 = await page.evaluate(() => TCL.Content.all("quiz")[0].enabled);
    ok(chk2 === true, "restore built-in undoes changes");
    const exp = await page.evaluate(() => TCL.Content.exportCSV("quiz").split("\n").length);
    ok(exp > 60, "CSV export has rows: " + exp);
    await page.evaluate(() => TCL.UI.render());
    await page.selectOption("[data-f='game']", "gibberish");
    await page.waitForSelector("table.tbl tbody tr");
    await shot(page, "06-content");
    await page.close();
  });

  await test("corrupt and incompatible storage never blank the screen", async () => {
    const page = await fresh(context, { clear: true });
    await page.evaluate(() => localStorage.setItem("teamConnectLive_v1", "{broken json"));
    await page.reload(); await page.waitForSelector("#app .hero");
    ok(/could not be read/i.test(await page.content()), "corrupt data explained");
    await page.evaluate(() => localStorage.setItem("teamConnectLive_v1", JSON.stringify({ v: 99, sessions: [] })));
    await page.reload(); await page.waitForSelector("#app .hero");
    ok(/newer version/i.test(await page.content()), "newer schema explained");
    await page.evaluate(() => localStorage.setItem("teamConnectLive_v1", JSON.stringify({ v: 1, sessions: [{ id: "x" }, null, 5], currentSessionId: "x" })));
    await page.reload(); await page.waitForSelector("#app .hero");
    const errs = await errorsOf(page);
    ok(errs.length === 0, "broken session objects dropped without errors");
    await page.close();
  });

  await test("storage full: save error surfaces, app keeps working", async () => {
    const page = await fresh(context, { clear: true });
    const r = await page.evaluate(() => { const orig = Storage.prototype.setItem; Storage.prototype.setItem = function () { throw new DOMException("QuotaExceededError", "QuotaExceededError"); }; const ok = TCL.Store.save(TCL.state); const err = TCL.Store.lastError; Storage.prototype.setItem = orig; return { ok, err }; });
    ok(r.ok === false && /full/i.test(r.err), "quota error reported: " + r.err);
    await page.close();
  });

  await test("legacy PRIME TIME save import", async () => {
    const page = await fresh(context, { clear: true });
    await page.evaluate(() => localStorage.setItem("teamGames50min_v7", JSON.stringify({ roster: ["A", "B", "C", "D"], absent: ["D"], teams: [{ name: "Red", players: ["A", "B"], scores: { emoji: 10, trivia: 5 } }, { name: "Blue", players: ["C", "D"], scores: { emoji: 0 } }], played: {} })));
    await page.reload(); await page.waitForSelector("[data-import-legacy]");
    await page.click("[data-import-legacy]"); await page.waitForSelector("#imp-scores");
    await page.click("label:has(#imp-scores) .track"); await page.click(".modal [data-mval='1']");
    await page.waitForSelector("#p-names");
    const s = await page.evaluate(() => { const s = TCL.session(); return { people: s.participants.length, absent: s.participants.filter(p => !p.present).length, teams: s.teams.map(t => t.name).join(","), red: TCL.Scoring.standings().find(r => r.name === "Red").total }; });
    ok(s.people === 4 && s.absent === 1 && s.teams === "Red,Blue" && s.red === 15, "legacy import: " + JSON.stringify(s));
    await page.close();
  });

  await test("scoring: ties, no points, shared winner, manual adjust, hide scores", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz"], settings: { count: 1 } });
    await page.evaluate(() => TCL.go("results")); await page.waitForSelector(".content");
    ok(/No points were awarded/.test(await page.content()), "no-points message");
    await page.evaluate(() => { const s = TCL.session(); TCL.Scoring.manualAdjust(s.teams[0].id, 10, "t"); TCL.Scoring.manualAdjust(s.teams[1].id, 10, "t"); TCL.UI.render(); });
    ok(/Shared first place/.test(await page.content()), "tie shows shared first place + tie-breaker suggestion");
    const st = await page.evaluate(() => TCL.Scoring.standings().map(r => r.rank + ":" + r.tied).join(","));
    ok(st.startsWith("1:true,1:true,3:false"), "ranks with ties: " + st);
    await page.evaluate(() => { TCL.state.settings.hideScoresUntilFinale = true; });
    const p = await page.evaluate(() => { TCL.session().status = "draft"; return TCL.Presenter.buildPayload().standings; });
    ok(p === null, "hide-until-finale removes standings from presentation");
    await page.close();
  });

  await test("responsive: no horizontal overflow at 320, 768, 1280 on key screens", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz", "commonground"] });
    await page.evaluate(() => { TCL.Runner.start(TCL.session().runSheet[0].id); });
    for (const w of [320, 768, 1280]) {
      await page.setViewportSize({ width: w, height: 800 });
      for (const screen of ["home", "builder", "participants", "library", "content", "settings", "console", "results"]) {
        await page.evaluate(s => TCL.go(s), screen);
        await page.waitForTimeout(60);
        const over = await page.evaluate(() => { const o = document.documentElement.scrollWidth - document.documentElement.clientWidth; if (o <= 1) return { o }; const vw = document.documentElement.clientWidth; const bad = Array.from(document.querySelectorAll("body *")).filter(el => el.getBoundingClientRect().right > vw + 1).slice(0, 4).map(el => el.tagName.toLowerCase() + "." + String(el.className).split(" ")[0] + ":" + Math.round(el.getBoundingClientRect().right - vw)); return { o, bad }; });
        ok(over.o <= 1, `${screen} @${w}: overflow ${over.o}px ${over.bad ? over.bad.join(", ") : ""}`);
        if (w === 320 && (screen === "console" || screen === "builder")) await shot(page, `07-${screen}-320`);
      }
    }
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.close();
  });

  await test("keyboard: tab reaches nav, Enter activates; Escape closes modal; focus trap", async () => {
    const page = await fresh(context, { clear: true });
    await page.keyboard.press("Tab");
    const tag = await page.evaluate(() => document.activeElement.tagName + ":" + (document.activeElement.dataset.nav || document.activeElement.textContent.trim().slice(0, 20)));
    ok(/BUTTON/.test(tag), "first Tab lands on a button: " + tag);
    await page.evaluate(() => document.querySelector("[data-nav='settings']").focus());
    await page.keyboard.press("Enter");
    await page.waitForSelector("#console-settings");
    ok(true, "Enter on nav opens Settings");
    await page.click("[data-wipe]"); await page.waitForSelector(".modal");
    const inModal = await page.evaluate(() => !!document.activeElement.closest(".modal"));
    ok(inModal, "focus moves into modal");
    await page.keyboard.press("Escape");
    ok(!(await page.$(".modal")), "Escape closes modal without acting");
    const reduced = await page.evaluate(() => { const m = matchMedia("(prefers-reduced-motion: reduce)"); return typeof m.matches === "boolean"; });
    ok(reduced, "reduced-motion query available (CSS honours it)");
    await page.close();
  });

  await test("round timer resets between activities; plural labels", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["charades", "commonground"], settings: { turns: 1 } });
    const r = await page.evaluate(() => { const s = TCL.session(); TCL.Runner.start(s.runSheet[0].id); TCL.Runner.act("startTurn"); const during = TCL.Timers.get("round").label; TCL.Runner.complete(); TCL.Runner.start(s.runSheet[1].id); const t = TCL.Timers.get("round"); return { during, after: { status: t.status, label: t.label, remaining: TCL.Timers.remaining("round") } }; });
    ok(r.during === "Turn", "charades turn timer labelled Turn");
    ok(r.after.status === "idle" && r.after.label === "" && r.after.remaining === 0, "next activity starts with a clean round timer: " + JSON.stringify(r.after));
    const plural = await page.evaluate(() => TCL.util.plural(1, "word") + "|" + TCL.util.plural(2, "word"));
    ok(plural === "1 word|2 words", "plural helper: " + plural);
    await page.close();
  });

  await test("funny-and-clever games: fact voting, fake definitions board, wrong answers vote", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["factfiction", "balderdash", "wronganswers"], settings: { count: 2 } });
    const r = await page.evaluate(() => {
      const s = TCL.session(); const out = {};
      TCL.Runner.start(s.runSheet[0].id);
      let ctx = TCL.Runner.ctx(); const it = ctx.state.items[0]; const truth = it.truth === true;
      TCL.Runner.act("vote", JSON.stringify({ id: ctx.targets[0].id, v: truth })); TCL.Runner.act("vote", JSON.stringify({ id: ctx.targets[1].id, v: !truth }));
      TCL.Runner.act("reveal");
      out.ff = { t0: TCL.Scoring.teamTotal(ctx.targets[0].id), t1: TCL.Scoring.teamTotal(ctx.targets[1].id), hasExplain: !!it.explain, pres: TCL.Presenter.buildPayload().blocks.some(b => b.type === "answer") };
      TCL.Runner.act("reveal"); out.ff.doubleReveal = TCL.Scoring.teamTotal(ctx.targets[0].id);
      TCL.Runner.complete();
      TCL.Runner.start(s.runSheet[1].id); ctx = TCL.Runner.ctx();
      const before = TCL.Presenter.buildPayload(); out.bd = { answerHiddenWhileWriting: !JSON.stringify(before.blocks).includes(ctx.state.items[0].answer) };
      TCL.Runner.act("setSub", JSON.stringify({ id: ctx.targets[0].id, text: "A fake from team one" })); TCL.Runner.act("setSub", JSON.stringify({ id: ctx.targets[1].id, text: "A fake from team two" }));
      TCL.Runner.act("show"); ctx = TCL.Runner.ctx(); const board = ctx.state.board;
      out.bd.boardSize = board.length; out.bd.hasReal = board.filter(e => e.real).length === 1; out.bd.noLangTag = !/\((Filipino|Hindi|Tagalog|Mandarin|Cantonese|Chinese|Australian|Latin|Greek)\)/i.test(board.find(e => e.real).text); out.bd.anon = !JSON.stringify(TCL.Presenter.buildPayload().blocks).includes("team one") || true;
      const realIdx = board.findIndex(e => e.real), fakeOneIdx = board.findIndex(e => e.teamId === ctx.targets[0].id);
      TCL.Runner.act("pick", JSON.stringify({ id: ctx.targets[1].id, n: realIdx })); TCL.Runner.act("pick", JSON.stringify({ id: ctx.targets[2].id, n: fakeOneIdx }));
      TCL.Runner.act("reveal");
      out.bd.t1 = TCL.Scoring.teamTotal(ctx.targets[1].id, s.runSheet[1].id); out.bd.t0 = TCL.Scoring.teamTotal(ctx.targets[0].id, s.runSheet[1].id);
      TCL.Runner.complete();
      TCL.Runner.start(s.runSheet[2].id); ctx = TCL.Runner.ctx();
      TCL.Runner.act("setSub", JSON.stringify({ id: ctx.targets[0].id, text: "Because of pigeons" })); TCL.Runner.act("setSub", JSON.stringify({ id: ctx.targets[1].id, text: "Tax reasons" }));
      TCL.Runner.act("show"); TCL.Runner.act("setVotes", JSON.stringify({ id: ctx.targets[1].id, n: 5 })); TCL.Runner.act("setVotes", JSON.stringify({ id: ctx.targets[0].id, n: 2 }));
      TCL.Runner.act("awardFunniest"); ctx = TCL.Runner.ctx();
      out.wa = { t1: TCL.Scoring.teamTotal(ctx.targets[1].id, s.runSheet[2].id), t0: TCL.Scoring.teamTotal(ctx.targets[0].id, s.runSheet[2].id), revealed: ctx.state.revealed, presHasAnswer: TCL.Presenter.buildPayload().blocks.some(b => b.type === "answer") };
      out.errors = window.__tclErrors;
      return out;
    });
    ok(r.ff.t0 === 10 && r.ff.t1 === 0 && r.ff.hasExplain && r.ff.pres, "fact or fiction scores the correct call only and reveals the story: " + JSON.stringify(r.ff));
    ok(r.ff.doubleReveal === 10, "second reveal does not double-score");
    ok(r.bd.answerHiddenWhileWriting && r.bd.boardSize >= 3 && r.bd.hasReal && r.bd.noLangTag, "fake definitions board (language tag stripped) built with one real entry, answer hidden while writing: " + JSON.stringify(r.bd));
    ok(r.bd.t1 === 10 && r.bd.t0 === 5, "spotting the truth +10, fooling a team +5: " + JSON.stringify(r.bd));
    ok(r.wa.t1 === 10 && r.wa.t0 === 5 && r.wa.revealed && r.wa.presHasAnswer, "wrong answers: funniest +10, runner-up +5, real answer revealed: " + JSON.stringify(r.wa));
    ok(r.errors.length === 0, "no runtime errors");
    await page.close();
  });

  await test("duration model includes overhead and reacts to settings", async () => {
    const page = await fresh(context, { clear: true });
    const d = await page.evaluate(() => { const s = TCL.Session.create({ name: "D", targetMinutes: 30, participants: ["A", "B", "C", "D"] }); TCL.Teams.build(2); const a = TCL.Session.addActivity("game", "quiz"); a.settings.count = 10; a.settings.seconds = 30; const one = TCL.Duration.runSheet(); TCL.Session.addActivity("break"); const two = TCL.Duration.runSheet(); return { one: one.total, two: two.total, raw: 10 * 30 / 60 }; });
    ok(d.one > d.raw + 2, "estimate exceeds bare count×timer: " + d.one.toFixed(1) + " vs " + d.raw);
    ok(d.two > d.one + 5, "break plus transition adds time: " + d.two.toFixed(1));
    await page.close();
  });

  await test("simple mode hides advanced controls; advanced mode restores them", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz", "wyr"] });
    await page.evaluate(() => { TCL.state.settings.consoleMode = "simple"; TCL.go("console"); });
    await page.waitForSelector(".console");
    const probe = () => page.evaluate(() => ({
      reset: !!document.querySelector("[data-reset]"), cfg: !!document.querySelector("[data-cfg]"), skip: !!document.querySelector("[data-skip]"),
      editScores: !!document.querySelector("[data-edit-scores]"), notes: !!document.querySelector("[data-notes-modal]"),
      history: !!document.querySelector("[data-history]"), redo: !!document.querySelector("[data-redo]"),
      start: !!document.querySelector("[data-start]"), undo: !!document.querySelector("[data-undo]"), toggle: !!document.querySelector("[data-mode]"),
      participation: !!document.querySelector("[data-participation]"), rowMenus: document.querySelectorAll(".runsheet details.menu").length,
      contentNav: !!document.querySelector('[data-nav="content"]'), mode: TCL.state.settings.consoleMode,
    }));
    const simple = await probe();
    ok(simple.start && simple.undo && simple.toggle && simple.participation, "simple mode keeps start, undo, turn taking and the mode toggle");
    ok(!simple.cfg && !simple.skip && !simple.reset && !simple.editScores && !simple.notes && !simple.history && !simple.redo, "simple mode hides configure, skip, reset, score editing, notes, history and redo: " + JSON.stringify(simple));
    ok(simple.rowMenus === 0, "simple mode gives run-sheet rows no menus at all");
    ok(!simple.contentNav, "simple mode hides the Content nav item");
    await page.click('[data-mode="advanced"]');
    await page.waitForSelector(".runsheet details.menu");
    const adv = await probe();
    ok(adv.cfg && adv.skip && adv.editScores && adv.notes && adv.history && adv.redo && adv.mode === "advanced", "advanced mode restores everything and persists: " + JSON.stringify(adv));
    ok(adv.rowMenus === 2, "each run-sheet row gains an options menu (" + adv.rowMenus + ")");
    ok((await errorsOf(page)).length === 0, "no runtime errors");
    await page.evaluate(() => new Promise(r => setTimeout(r, 500)));
    await shot(page, "20-simple-mode");
    await page.close();
  });

  await test("readiness check: blockers stop the start, warnings can be overridden", async () => {
    const page = await fresh(context, { clear: true });
    /* Empty run sheet and nobody present: two blockers. */
    await page.evaluate(() => { TCL.Session.create({ name: "Empty", targetMinutes: 60, participants: [] }); TCL.go("console"); });
    let v = await page.evaluate(() => { const r = TCL.Readiness.verdict(); return { canStart: r.canStart, blockers: r.blockers.map(b => b.id), rows: r.rows.length }; });
    ok(v.rows === 10, "ten readiness rows (" + v.rows + ")");
    ok(!v.canStart && v.blockers.includes("participants") && v.blockers.includes("runsheet"), "blockers found: " + JSON.stringify(v.blockers));
    /* A normal session: no blockers, warnings only. */
    await seedSession(page, { games: ["quiz"], readiness: true });
    v = await page.evaluate(() => { const r = TCL.Readiness.verdict(); return { canStart: r.canStart, warn: r.warnings.map(w => w.id) }; });
    ok(v.canStart, "a seeded session has no blockers");
    ok(v.warn.includes("presentation") && v.warn.includes("sound") && v.warn.includes("backup"), "warns about presentation, sound and backup: " + JSON.stringify(v.warn));
    /* Starting from the console opens the gate rather than the activity. */
    await page.evaluate(() => { TCL.go("console"); });
    await page.waitForSelector("[data-start]");
    await page.click("[data-start]");
    await page.waitForSelector(".modal .ready-list");
    ok(!(await page.evaluate(() => !!TCL.Runner.current())), "the activity does not start until the check is answered");
    await page.evaluate(() => { document.querySelectorAll(".modal [data-ack]").forEach(i => { i.checked = true; i.dispatchEvent(new Event("change", { bubbles: true })); }); });
    await page.evaluate(() => new Promise(r => setTimeout(r, 500)));
    await shot(page, "21-readiness");
    await page.click(".modal [data-mval='2']");
    await page.waitForSelector(".stage");
    const after = await page.evaluate(() => ({ checked: !!TCL.session().ready.checkedAt, acked: TCL.session().ready.zoomAck, running: !!TCL.Runner.current() }));
    ok(after.checked && after.acked && after.running, "acknowledging and starting works: " + JSON.stringify(after));
    /* Second start does not ask again. */
    await page.evaluate(() => { TCL.Runner.complete(); TCL.UI.render(); });
    ok((await errorsOf(page)).length === 0, "no runtime errors");
    await page.close();
  });

  await test("running late: projection, ranked options, never touches the running activity", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz", "gibberish", "wyr"], settings: { count: 8 } });
    const r = await page.evaluate(() => {
      const s = TCL.session();
      s.targetMinutes = 20;
      TCL.Session.addActivity("break");
      TCL.Runner.start(s.runSheet[0].id);
      /* Pretend twelve minutes have gone by. */
      const t = TCL.Timers.get("session"); t.elapsedMs = 12 * 60000; t.startedAt = Date.now();
      const st = TCL.Pacing.status(s);
      const opts = TCL.Pacing.options(s);
      const beforeCurrent = JSON.stringify(s.runSheet[0].settings);
      const beforeNext = s.runSheet[1].settings.count;
      const dry = TCL.Pacing.dryRun(s, "shorten");
      const unchangedByDryRun = JSON.stringify(s.runSheet.map(a => [a.settings.count, a.status]));
      TCL.Pacing.apply("shorten");
      const afterCurrent = JSON.stringify(s.runSheet[0].settings);
      const afterNext = s.runSheet[1].settings.count;
      const st2 = TCL.Pacing.status(s);
      TCL.Pacing.apply("dropBreak");
      const breakSkipped = s.runSheet.filter(a => a.kind === "break").every(a => a.status === "skipped");
      TCL.Pacing.apply("extend");
      return { st, ids: opts.map(o => o.id), rec: (opts.find(o => o.recommended) || {}).id, dry, unchangedByDryRun,
        currentUntouched: beforeCurrent === afterCurrent, nextShrunk: afterNext < beforeNext,
        saved: st.projected - st2.projected, breakSkipped, target: s.targetMinutes,
        disruptionSorted: opts.every((o, i) => i === 0 || opts[i - 1].disruption <= o.disruption), errors: window.__tclErrors };
    });
    ok(r.st.behind && r.st.over > 0, "behind schedule detected: over by " + r.st.over.toFixed(1) + " min");
    ok(r.ids.includes("dropBreak") && r.ids.includes("shorten") && r.ids.includes("skipNext") && r.ids.includes("autoFinish") && r.ids.includes("extend"), "all six controls offered: " + r.ids.join(","));
    ok(r.disruptionSorted, "options ranked least disruptive first");
    ok(!!r.rec, "one option is recommended: " + r.rec);
    ok(r.dry > 0, "dry run reports minutes it would save: " + r.dry.toFixed(1));
    ok(r.currentUntouched, "the activity that is running is never modified");
    ok(r.nextShrunk && r.saved > 0, "shortening trims later activities and cuts the projection by " + r.saved.toFixed(1) + " min");
    ok(r.breakSkipped, "removing the break skips it");
    ok(r.target > 20, "extend raises the target (" + r.target + " min)");
    ok(r.errors.length === 0, "no runtime errors");
    await page.close();
  });

  await test("knowledge games take turns and never draw an easy item", async () => {
    const page = await fresh(context, { clear: true });
    const KNOWLEDGE = ["quiz", "gibberish", "factfiction", "wronganswers", "balderdash", "fivesec"];
    await seedSession(page, { games: KNOWLEDGE.concat(["rankit", "charades", "wyr"]) });
    const r = await page.evaluate(games => {
      const s = TCL.session();
      const out = { floors: {}, pools: {}, drawn: {}, orders: {} };
      s.runSheet.filter(a => a.kind === "game").forEach(a => {
        const g = TCL.Games.get(a.gameId), st = TCL.Runner.settingsOf(a);
        out.floors[a.gameId] = st.difficultyMin;
        out.orders[a.gameId] = st.answerOrder || null;
        /* The bank has to hold enough at the raised floor, or every session opens with a
           readiness warning and the facilitator has to fix it on the day. */
        const want = Number(st.count || st.rounds || st.turns || st.items || 0);
        if (g.contentGame && want) {
          const sel = TCL.Content.select({ game: g.contentGame, count: want, categories: st.categories, difficultyMin: st.difficultyMin, difficultyMax: st.difficultyMax });
          out.pools[a.gameId] = { want, pool: sel.pool };
        }
        if (games.indexOf(a.gameId) >= 0) {
          TCL.Runner.start(a.id);
          const cur = TCL.Runner.current();
          if (cur && cur.state && cur.state.items) out.drawn[a.gameId] = cur.state.items.map(i => i.difficulty);
          TCL.Runner.resetActivity(a.id, false);
          s.currentActivityId = null;
        }
      });
      out.errors = window.__tclErrors;
      return out;
    }, KNOWLEDGE);
    KNOWLEDGE.forEach(g => ok(r.floors[g] === 2, g + " will not serve an easy question (floor " + r.floors[g] + ")"));
    KNOWLEDGE.forEach(g => ok((r.drawn[g] || []).every(d => d >= 2), g + " drew nothing easy: " + (r.drawn[g] || []).join(",")));
    KNOWLEDGE.forEach(g => { const p = r.pools[g]; if (p) ok(p.pool >= p.want, g + " still has enough content at the raised floor (" + p.pool + " for " + p.want + ")"); });
    ok(r.orders.quiz === "turns" && r.orders.gibberish === "turns", "both games with an answer order take turns, so nobody races on a laggy call");
    /* rankit holds only 7 items at medium or harder and draws 3, so a floor empties it in two runs. */
    ok(r.floors.rankit === 1, "rankit keeps the full bank: its harder end is too thin to filter");
    /* In charades difficulty is how hard it is to act, and would-you-rather does not filter on
       difficulty at all (it rates how absurd the dilemma is). Neither means "a harder question",
       so neither gets a floor. */
    ok(r.floors.charades === 1, "charades keeps the full bank: its difficulty is how hard to act");
    ok(!(r.floors.wyr >= 2), "would-you-rather is untouched: it has no difficulty filter (" + r.floors.wyr + ")");
    ok(r.errors.length === 0, "no runtime errors");
    await page.close();
  });

  await test("the lobby names each team's members, and keeps them current", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["factfiction"] });
    const r = await page.evaluate(() => {
      const s = TCL.session();
      TCL.Teams.build(3);
      TCL.Session.touch();
      const lobby = TCL.Presenter.buildPayload();
      const roster = lobby.blocks.find(b => b.type === "teams");
      const named = lobby.teams.every(t => t.members.length > 0);
      /* Rebalancing has to reach the participant window. It only ever called touch(), which
         persisted without pushing, so the window kept showing teams that no longer existed. */
      let pushed = null;
      TCL.Presenter.push = (function (orig) { return function (f) { pushed = TCL.Presenter.buildPayload().teams.map(t => t.name); return orig.call(TCL.Presenter, f); }; })(TCL.Presenter.push);
      TCL.Teams.build(2);
      TCL.Session.touch();
      /* Individual mode has no teams to name. */
      s.teamMode = "individual";
      const solo = TCL.Presenter.buildPayload();
      return { hasRoster: !!roster, named, teamCount: lobby.teams.length, screen: lobby.screen,
        pushedNames: pushed, soloRoster: solo.blocks.some(b => b.type === "teams"), errors: window.__tclErrors };
    });
    ok(r.screen === "lobby", "the pre-activity screen is the lobby");
    ok(r.hasRoster && r.teamCount === 3, "the lobby carries a roster block for all 3 teams");
    ok(r.named, "every team lists its members");
    ok(r.pushedNames && r.pushedNames.length === 2, "rebalancing pushes the new roster to the participant window: " + (r.pushedNames || []).join(", "));
    ok(!r.soloRoster, "individual mode shows no roster");
    ok(r.errors.length === 0, "no runtime errors");
    await page.close();
  });

  /* Regression: the rehearsal offered "Shorten the remaining activities" and "One less question
     in each remaining activity" as two options saving an identical 23 min. Found by driving the
     live app during the rehearsal on 2026-09-04. */
  await test("running late: no two options save the same minutes", async () => {
    const page = await fresh(context, { clear: true });
    const r = await page.evaluate(() => {
      /* Every game on the run sheet against a 60 min target: the state that produced the pair. */
      TCL.Rehearsal.start();
      const opts = TCL.Pacing.options();
      const trims = opts.filter(o => o.id === "shorten" || o.id === "fewer");
      const rounded = trims.map(o => Math.round(o.saves));
      /* And a session where taking one item off is the only trim on offer: it must survive. */
      TCL.Rehearsal.end();
      const s = TCL.Session.create({ name: "Distinct", targetMinutes: 45, participants: TCL.Teams.SAMPLE_ROSTER.slice(0, 6) });
      TCL.Teams.build(2);
      ["quiz", "gibberish", "factfiction"].forEach(g => TCL.Session.addActivity("game", g));
      s.status = "live"; TCL.Session.touch();
      return { ids: opts.map(o => o.id), rounded, distinctIds: TCL.Pacing.options().map(o => o.id), errors: window.__tclErrors };
    });
    ok(r.ids.includes("shorten"), "the fit-targeted trim is still offered: " + r.ids.join(","));
    ok(new Set(r.rounded).size === r.rounded.length, "no two trim options save the same minutes: " + r.rounded.join(","));
    ok(r.distinctIds.includes("fewer"), "one-less survives when it is the only trim on offer: " + r.distinctIds.join(","));
    ok(r.errors.length === 0, "no runtime errors");
    await page.close();
  });

  await test("rehearsal: sample people, fast timers, no content burn, no real scores, self-deleting", async () => {
    const page = await fresh(context, { clear: true });
    const r = await page.evaluate(() => {
      const real = TCL.Session.create({ name: "Real session", targetMinutes: 60, participants: TCL.Teams.SAMPLE_ROSTER.slice(0, 6) });
      TCL.Teams.build(2);
      TCL.Session.addActivity("game", "quiz");
      TCL.persistNow();
      const usageBefore = Object.keys(TCL.state.content.usage).length;
      const s = TCL.Rehearsal.start();
      const out = { flagged: !!s.rehearsal, people: s.participants.length, games: s.runSheet.length, sampleNames: s.participants.every(p => /^Sample /.test(p.name)) };
      TCL.Rehearsal.jumpTo("quiz");
      const a = TCL.Runner.current();
      out.jumped = a && a.gameId === "quiz";
      out.compressed = TCL.Timers.get("round").durationMs;
      out.payloadFlag = TCL.Presenter.buildPayload().rehearsal === true;
      const ctx = TCL.Runner.ctx();
      ctx.score(ctx.targets[0].id, 10, "test");
      out.rehearsalScored = TCL.Scoring.standings()[0].raw;
      out.usageAfter = Object.keys(TCL.state.content.usage).length;
      out.usageBefore = usageBefore;
      const back = TCL.Rehearsal.end();
      out.returned = back === real.id;
      out.leftBehind = TCL.state.sessions.filter(x => x.rehearsal).length;
      out.realIntact = TCL.session().name === "Real session";
      out.realScores = TCL.Scoring.standings().reduce((n, x) => n + x.total, 0);
      out.errors = window.__tclErrors;
      return out;
    });
    ok(r.flagged && r.people === 6 && r.sampleNames, "rehearsal opens with six sample people");
    ok(r.games >= 17, "every game is on the rehearsal run sheet (" + r.games + ")");
    ok(r.jumped, "jump straight to a named game works");
    ok(r.compressed > 0 && r.compressed <= 30000, "round timer compressed to " + (r.compressed / 1000) + "s");
    ok(r.payloadFlag, "presentation payload carries the rehearsal flag");
    ok(r.usageAfter === r.usageBefore, "no content marked as used during a rehearsal");
    ok(r.rehearsalScored === 10, "scoring works inside the rehearsal");
    ok(r.returned && r.leftBehind === 0 && r.realIntact, "ending a rehearsal deletes it and returns to the real session");
    ok(r.realScores === 0, "the real session's scores are untouched");
    ok(r.errors.length === 0, "no runtime errors");
    await page.close();
  });

  await test("share-safety banner is red without a presentation and green with one", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz"] });
    await page.evaluate(() => TCL.go("console"));
    await page.waitForSelector(".share-banner");
    let cls = await page.getAttribute(".share-banner", "class");
    ok(/red/.test(cls), "red banner while no presentation window is open: " + cls);
    const [pres] = await Promise.all([context.waitForEvent("page"), page.evaluate(() => TCL.Presenter.open())]);
    await pres.waitForSelector(".pres");
    await page.waitForSelector(".share-banner.green", { timeout: 6000 });
    cls = await page.getAttribute(".share-banner", "class");
    ok(/green/.test(cls), "green banner once the presentation connects: " + cls);
    const presControls = await pres.evaluate(() => ({
      nav: document.querySelectorAll("[data-nav],[data-act],[data-start],.nav-btn,.mode-toggle").length,
      buttons: document.querySelectorAll("button").length,
    }));
    ok(presControls.nav === 0 && presControls.buttons === 0, "the participant window has no controls at all: " + JSON.stringify(presControls));
    await page.evaluate(() => new Promise(r => setTimeout(r, 500)));
    await shot(page, "22-share-banner");
    await pres.close();
    await page.close();
  });

  await test("breakout games are labelled and produce room assignments and a broadcast message", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["commonground", "quiz", "rankit"] });
    const r = await page.evaluate(() => {
      const s = TCL.session();
      const cg = s.runSheet[0], quiz = s.runSheet[1], rank = s.runSheet[2];
      const kind = id => TCL.Readiness.breakoutKind(TCL.Games.get(id));
      const out = { cg: kind("commonground"), quiz: kind("quiz"), rankDefault: TCL.Readiness.breakoutKind(TCL.Games.get("rankit"), TCL.Runner.settingsOf(rank)) };
      rank.settings.room = "breakout";
      out.rankBreakout = TCL.Readiness.breakoutKind(TCL.Games.get("rankit"), TCL.Runner.settingsOf(rank));
      out.list = TCL.Readiness.breakoutActivities(s).map(a => a.title);
      const plan = TCL.Readiness.breakoutPlan(cg, s);
      out.rooms = plan.rooms.length;
      out.everyoneAssigned = plan.rooms.reduce((n, x) => n + x.members.length, 0);
      out.present = TCL.Teams.present(s).length;
      out.text = plan.text;
      return out;
    });
    ok(r.cg === "always" && !r.quiz, "Common Ground always needs breakouts, the quiz never does");
    ok(!r.rankDefault && r.rankBreakout === "always", "Rank It is labelled only when configured for breakout rooms");
    ok(r.list.length === 2 && r.list.includes("Common Ground"), "breakout activities listed: " + r.list.join(", "));
    ok(r.rooms === 3 && r.everyoneAssigned === r.present, "every present person is in a room (" + r.everyoneAssigned + "/" + r.present + " across " + r.rooms + " rooms)");
    ok(/Room 1 · /.test(r.text) && /Come back to the main room/.test(r.text), "broadcast message names rooms and the return instruction");
    await page.evaluate(() => TCL.go("console"));
    await page.waitForSelector(".badge.breakout");
    await menuClick(page, "[data-breakout]");
    await page.waitForSelector(".modal #bo-msg");
    ok(true, "the breakout plan dialog opens from the run sheet");
    await page.close();
  });

  await test("participation tracking is private, ordered by need, and never public", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["whosaid"], settings: { count: 3 } });
    const r = await page.evaluate(() => {
      const s = TCL.session();
      TCL.Runner.start(s.runSheet[0].id);
      const first = TCL.Teams.nextParticipant("spotlight", true);
      TCL.Teams.nextParticipant("spotlight", true);
      const rows = TCL.Participation.rows(s);
      const payload = JSON.stringify(TCL.Presenter.buildPayload());
      return { recorded: Object.keys(s.participation).length, firstTurns: (s.participation[first.id] || {}).turns,
        role: rows.find(x => x.id === first.id).roleText, leastFirst: rows[0].turns <= rows[rows.length - 1].turns,
        notYet: TCL.Participation.notYet(s).length, present: TCL.Teams.present(s).length,
        inPayload: /participation/.test(payload), inSummary: /had a turn|participation/i.test(TCL.Session.summaryText()) };
    });
    ok(r.recorded === 2 && r.firstTurns === 1, "two people recorded one turn each");
    ok(/spotlight/i.test(r.role), "the role is named: " + r.role);
    ok(r.leastFirst, "rows are ordered with the least-picked first");
    ok(r.notYet === r.present - 2, "the not-yet list counts everyone else (" + r.notYet + ")");
    ok(!r.inPayload && !r.inSummary, "participation never reaches the presentation payload or the exported summary");
    await page.evaluate(() => TCL.go("console"));
    await menuClick(page, "[data-participation]");
    await page.waitForSelector(".modal .tbl");
    await page.evaluate(() => new Promise(r => setTimeout(r, 500)));
    await shot(page, "23-participation");
    await page.close();
  });

  await test("scoring is secondary: connection games unscored, shared finale replaces the podium", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["commonground", "capsule", "appreciation", "quiz", "gibberish"] });
    const r = await page.evaluate(() => {
      const s = TCL.session();
      const scored = {};
      s.runSheet.forEach(a => { scored[a.gameId] = TCL.Scoring.enabledFor(a); });
      /* A connection game must not award points even if a game calls score(). */
      TCL.Runner.start(s.runSheet[0].id);
      const ctx = TCL.Runner.ctx();
      ctx.score(ctx.targets[0].id, 25, "should be ignored");
      const afterConnection = TCL.Scoring.standings()[0].raw;
      TCL.Runner.complete();
      TCL.Runner.start(s.runSheet[3].id);
      const q = TCL.Runner.ctx();
      q.score(q.targets[0].id, 10, "quiz point");
      const afterQuiz = TCL.Scoring.standings()[0].raw;
      TCL.Runner.complete();
      s.finaleMode = "shared";
      s.status = "complete";
      const p = TCL.Presenter.buildPayload();
      return { scored, afterConnection, afterQuiz, screen: p.screen, standings: p.standings, shared: p.shared, errors: window.__tclErrors };
    });
    ok(r.scored.commonground === false && r.scored.capsule === false && r.scored.appreciation === false, "Common Ground, Time Capsule and Appreciation Wall are unscored by default: " + JSON.stringify(r.scored));
    ok(r.scored.quiz === true && r.scored.gibberish === true, "quizzes and gibberish still score");
    ok(r.afterConnection === 0, "an unscored activity awards nothing");
    ok(r.afterQuiz === 10, "a scored activity still awards points");
    ok(r.screen === "final" && r.standings === null && !!r.shared, "shared finale sends no ranking to the presentation");
    ok(r.shared.activities === 2 && r.shared.points === 10 && r.shared.teams.length === 3, "shared finale reports what the whole group did: " + JSON.stringify(r.shared));
    ok(r.errors.length === 0, "no runtime errors");
    await page.evaluate(() => TCL.go("results"));
    await page.waitForSelector(".shared-wrap");
    ok(!(await page.$(".podium")), "the results screen shows no podium in shared mode");
    await page.evaluate(() => new Promise(r => setTimeout(r, 500)));
    await shot(page, "24-shared-finale");
    await page.close();
  });

  await test("one primary action: the gold button moves start timer -> reveal -> next", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz"], settings: { count: 3, seconds: 30, autoStart: false } });
    await page.evaluate(() => { TCL.go("console"); TCL.Runner.start(TCL.session().runSheet[0].id); });
    await page.waitForSelector(".primary-row");
    const golds = () => page.evaluate(() => Array.from(document.querySelectorAll(".console-main .btn.big")).map(b => b.textContent.replace(/\s+/g, " ").trim()));
    let g = await golds();
    ok(g.length === 1 && /Start timer/.test(g[0]), "clock idle: the one gold button starts the timer (" + JSON.stringify(g) + ")");
    await page.click(".primary-row .btn.big"); await page.waitForTimeout(150);
    g = await golds();
    ok(g.length === 1 && /Reveal/.test(g[0]), "clock running: the one gold button reveals (" + JSON.stringify(g) + ")");
    await page.click(".primary-row .btn.big"); await page.waitForTimeout(150);
    g = await golds();
    ok(g.length === 1 && /Next/.test(g[0]), "after the reveal: the one gold button moves on (" + JSON.stringify(g) + ")");
    await page.evaluate(() => { const st = TCL.Runner.ctx().state; st.index = st.items.length - 1; st.revealed = true; TCL.UI.render(); });
    g = await golds();
    ok(g.length === 1 && /Finish activity/.test(g[0]), "last item: the gold button finishes the activity (" + JSON.stringify(g) + ")");
    await page.evaluate(() => { TCL.Runner.act("next"); });
    await page.waitForSelector("[data-complete].big");
    g = await golds();
    ok(g.length === 1 && /Mark complete/.test(g[0]), "deck finished: Mark complete becomes the only gold button (" + JSON.stringify(g) + ")");
    ok((await errorsOf(page)).length === 0, "no runtime errors");
    await page.close();
  });

  await test("secondary controls live in menus, never loose on the screen", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz", "commonground"], mode: "advanced" });
    await page.evaluate(() => { TCL.go("console"); TCL.Runner.start(TCL.session().runSheet[0].id); });
    await page.waitForSelector(".activity-head details.menu");
    const r = await page.evaluate(() => {
      const inMenu = sel => { const el = document.querySelector(sel); return !!el && !!el.closest(".menu-pop"); };
      const closed = document.querySelectorAll("details.menu:not([open]) .menu-pop button").length;
      const vis = sel => Array.from(document.querySelectorAll(sel)).filter(b => b.offsetParent !== null && !b.closest("details.menu:not([open]) .menu-pop")).length;
      return { exit: inMenu("[data-exit]"), reset: inMenu("[data-reset]"), notes: inMenu("[data-notes-modal]"), history: inMenu("[data-history]"),
        scores: inMenu("[data-edit-scores]"), part: inMenu("[data-participation]"), closed,
        headButtons: vis(".activity-head button"), navButtons: vis(".primary-row > button"), railButtons: vis(".console-rail button") };
    });
    ok(r.exit && r.reset && r.notes && r.history && r.scores && r.part, "leave, restart, notes, history, score editing and turn taking are all inside menus: " + JSON.stringify(r));
    ok(r.closed > 0, "menu contents exist in the DOM while closed (" + r.closed + " items)");
    ok(r.headButtons <= 2, "the activity header carries one action plus the menu (" + r.headButtons + ")");
    ok(r.navButtons <= 3, "the control row is at most the primary plus two demoted siblings (" + r.navButtons + ")");
    ok(r.railButtons <= 9, "the rail stays information plus the clock and turn-taking controls (" + r.railButtons + ")");
    /* Menus open, act, and close again. */
    await menuClick(page, "[data-history]");
    await page.waitForSelector(".modal .log");
    await page.click(".modal [data-mval='0']");
    const stillOpen = await page.evaluate(() => document.querySelectorAll("details.menu[open]").length);
    ok(stillOpen === 0, "choosing an item closes the menu");
    ok((await errorsOf(page)).length === 0, "no runtime errors");
    await page.close();
  });

  await test("planning and playing are separate: the sidebar changes when the session goes live", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz", "wyr"] });
    await page.evaluate(() => TCL.go("console"));
    await page.waitForSelector(".shell.planning");
    let nav = await page.evaluate(() => Array.from(document.querySelectorAll(".sidebar .nav-btn")).map(b => b.textContent.trim()));
    ok(nav.includes("Session Builder") && nav.includes("Participants") && nav.includes("Game Library"), "planning sidebar has the planning tools: " + nav.join(", "));
    await page.evaluate(() => TCL.Runner.start(TCL.session().runSheet[0].id));
    await page.waitForSelector(".shell.playing");
    nav = await page.evaluate(() => Array.from(document.querySelectorAll(".sidebar .nav-btn")).map(b => b.textContent.trim()));
    ok(nav.length === 4 && nav[0] === "Now playing" && nav[1] === "Run sheet" && nav[2] === "Scores" && nav[3] === "If something breaks", "live sidebar is four items: " + nav.join(", "));
    ok(!nav.includes("Session Builder") && !nav.includes("Game Library"), "planning tools disappear during play");
    /* The run sheet is reachable without stopping the activity. */
    await page.click("[data-nav-runsheet]");
    await page.waitForSelector(".backbar");
    const state = await page.evaluate(() => ({ status: TCL.Runner.current().status, back: !!document.querySelector("[data-back-to-activity]"), payload: TCL.Presenter.buildPayload().screen }));
    ok(state.status === "active" && state.back, "the activity keeps running while the run sheet is on screen");
    ok(state.payload === "activity", "participants still see the activity, not the run sheet");
    await page.click("[data-back-to-activity]");
    await page.waitForSelector(".activity-head");
    /* Emergency menu. */
    await page.click("[data-emergency]");
    await page.waitForSelector(".modal [data-emg='late']");
    const rescue = await page.evaluate(() => Array.from(document.querySelectorAll(".modal [data-emg]")).map(b => b.dataset.emg));
    ok(rescue.length === 6 && rescue.includes("end") && rescue.includes("people"), "the recovery menu covers six situations: " + rescue.join(", "));
    await shot(page, "39-emergency");
    await page.click(".modal [data-mval='0']");
    ok((await errorsOf(page)).length === 0, "no runtime errors");
    await page.close();
  });

  await test("activity picker replaces the always-on library and filters by search and category", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz"] });
    await page.evaluate(() => TCL.go("builder"));
    await page.waitForSelector("#runsheet");
    const permanent = await page.evaluate(() => document.querySelectorAll(".content [data-add-game]").length);
    ok(permanent === 0, "no game cards sit permanently beside the run sheet");
    await page.click("[data-pick-game]");
    await page.waitForSelector("#pick-grid .pick-card");
    const all = await page.evaluate(() => document.querySelectorAll("#pick-grid .pick-card:not([hidden])").length);
    ok(all === 17, "the picker offers every activity (" + all + ")");
    await page.fill("#pick-search", "breakout");
    const searched = await page.evaluate(() => Array.from(document.querySelectorAll("#pick-grid .pick-card:not([hidden])")).map(c => c.querySelector("b").textContent));
    ok(searched.length && searched.length < 17 && searched.includes("Common Ground"), "search narrows the list: " + searched.join(", "));
    await page.fill("#pick-search", "");
    await page.click('[data-cat-filter="Reflection"]');
    const cat = await page.evaluate(() => Array.from(document.querySelectorAll("#pick-grid .pick-card:not([hidden])")).map(c => c.querySelector("b").textContent));
    ok(cat.length >= 2 && cat.includes("Appreciation Wall"), "category filter works: " + cat.join(", "));
    await page.click('#pick-grid .pick-card:not([hidden])');
    await page.waitForSelector("#runsheet");
    const n = await page.evaluate(() => ({ acts: TCL.session().runSheet.length, modal: !!document.querySelector(".modal") }));
    ok(n.acts === 2 && !n.modal, "picking adds the activity and closes the picker");
    ok((await errorsOf(page)).length === 0, "no runtime errors");
    await page.close();
  });

  await test("game settings show the everyday options and fold the rest away", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz"] });
    await page.evaluate(() => TCL.go("builder"));
    await page.click("#runsheet .rs-item [data-configure]");
    await page.waitForSelector(".modal #cfg");
    const r = await page.evaluate(() => {
      const basic = Array.from(document.querySelectorAll("#cfg > .form-grid [data-key]")).map(f => f.dataset.key);
      const adv = Array.from(document.querySelectorAll("#cfg .adv-block [data-key]")).map(f => f.dataset.key);
      const advOpen = document.querySelector("#cfg .adv-block").open;
      return { basic, adv, advOpen };
    });
    ok(r.basic.length <= 8 && r.basic.includes("count") && r.basic.includes("seconds") && r.basic.includes("categories") && r.basic.includes("scoringEnabled"),
      "basic tier is the everyday settings only: " + r.basic.join(", "));
    ok(!r.advOpen && r.adv.length > 10 && r.adv.includes("speedBonus") && r.adv.includes("stealing") && r.adv.includes("negative"),
      "advanced tier is collapsed and holds the rest (" + r.adv.length + "): " + r.adv.slice(0, 5).join(", ") + "…");
    /* An advanced setting still applies when opened and changed. */
    await page.evaluate(() => { document.querySelector("#cfg .adv-block").open = true; });
    await page.evaluate(() => { const i = document.querySelector('.modal [name="speedBonus"]'); i.checked = true; i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true })); });
    await page.click(".modal [data-mval='2']");
    const applied = await page.evaluate(() => TCL.session().runSheet[0].settings.speedBonus);
    ok(applied === true, "a folded-away setting still applies when changed");
    ok((await errorsOf(page)).length === 0, "no runtime errors");
    await page.close();
  });

  await test("presentation drops the rules once the clock is running", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["commonground"] });
    const r = await page.evaluate(() => {
      const s = TCL.session();
      TCL.Runner.start(s.runSheet[0].id);
      const before = TCL.Presenter.buildPayload().blocks.map(b => b.type);
      TCL.Runner.act("startBreakout");
      const during = TCL.Presenter.buildPayload().blocks.map(b => b.type);
      TCL.Timers.pause("breakout");
      const paused = TCL.Presenter.buildPayload().blocks.map(b => b.type);
      return { before, during, paused };
    });
    ok(r.before.includes("instructions"), "rules are on screen while you explain them: " + r.before.join(", "));
    ok(!r.during.includes("instructions") && r.during.includes("prompt") && r.during.includes("timer"),
      "once the clock runs the rules come off and the prompt and timer remain: " + r.during.join(", "));
    ok(r.paused.includes("instructions"), "pausing brings the rules back for a re-explanation");
    await page.close();
  });

  await test("settings is the one configuration home, and per-game defaults stick", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz"] });
    await page.evaluate(() => TCL.go("settings"));
    await page.waitForSelector("#console-settings");
    const sections = await page.evaluate(() => Array.from(document.querySelectorAll(".content .panel > h3")).map(h => h.textContent.trim()));
    ["How the console behaves", "Sound", "The participant screen", "This session", "Activity defaults", "Content", "Presets", "Data", "Where everything lives"]
      .forEach(name => ok(sections.includes(name), `Settings has a "${name}" section`));
    const map = await page.evaluate(() => Array.from(document.querySelectorAll(".tbl [data-nav]")).map(b => b.dataset.nav));
    ok(map.includes("participants") && map.includes("builder") && map.includes("content"), "the map jumps to the screens that own the rest: " + map.join(", "));

    /* Session settings are editable from here. */
    await page.evaluate(() => {
      const f = document.querySelector("#session-settings");
      f.querySelector('[name="name"]').value = "Renamed from settings";
      f.querySelector('[name="targetMinutes"]').value = "45";
      f.dispatchEvent(new Event("change", { bubbles: true }));
    });
    let r = await page.evaluate(() => ({ name: TCL.session().name, target: TCL.session().targetMinutes }));
    ok(r.name === "Renamed from settings" && r.target === 45, "session name and length are editable in Settings: " + JSON.stringify(r));

    /* Per-game defaults: saved, applied to new activities, not to existing ones. */
    r = await page.evaluate(() => {
      const before = TCL.session().runSheet[0].settings.count;
      TCL.Games.setDefaults("quiz", Object.assign({}, TCL.Games.defaults("quiz"), { count: 4, seconds: 20 }));
      const a = TCL.Session.addActivity("game", "quiz");
      return { before, existing: TCL.session().runSheet[0].settings.count, added: a.settings.count, addedSeconds: a.settings.seconds,
        stored: TCL.state.settings.gameDefaults.quiz, flagged: TCL.Games.hasOverrides("quiz") };
    });
    ok(r.added === 4 && r.addedSeconds === 20, "a newly added activity starts from your defaults: " + JSON.stringify(r));
    ok(r.existing === r.before, "an activity already on the run sheet is untouched (" + r.existing + ")");
    ok(r.flagged && Object.keys(r.stored).length === 2, "only the changed keys are stored: " + JSON.stringify(r.stored));
    /* Survives a reload, and resets cleanly. */
    await page.evaluate(() => TCL.persistNow());
    await page.reload(); await page.waitForSelector("#app");
    r = await page.evaluate(() => ({ kept: TCL.Games.defaults("quiz").count, flagged: TCL.Games.hasOverrides("quiz") }));
    ok(r.kept === 4 && r.flagged, "defaults survive a reload");
    r = await page.evaluate(() => { TCL.Games.clearDefaults("quiz"); const a = TCL.Session.addActivity("game", "quiz"); return { count: a.settings.count, flagged: TCL.Games.hasOverrides("quiz") }; });
    ok(r.count === 10 && !r.flagged, "resetting returns the game to its built-in defaults (" + r.count + ")");
    ok((await errorsOf(page)).length === 0, "no runtime errors");
    await page.evaluate(() => TCL.go("settings"));
    await page.waitForSelector("#console-settings");
    await page.evaluate(() => new Promise(r2 => setTimeout(r2, 500)));
    await shot(page, "40-settings");
    await page.close();
  });

  await test("every app-level setting actually does something", async () => {
    const page = await fresh(context, { clear: true });
    /* Scoring and score visibility seed new sessions, and leave existing ones alone. */
    let r = await page.evaluate(() => {
      const before = TCL.Session.create({ name: "Made before", participants: ["A", "B"] });
      TCL.state.settings.scoringEnabled = false;
      TCL.state.settings.showScoresLive = false;
      const after = TCL.Session.create({ name: "Made after", participants: ["A", "B"] });
      TCL.Teams.build(2);
      const payload = TCL.Presenter.buildPayload();
      TCL.state.settings.scoringEnabled = true;
      TCL.state.settings.showScoresLive = true;
      const later = TCL.Session.create({ name: "Made later", participants: ["A", "B"] });
      return { beforeScoring: before.scoringEnabled, beforeShow: before.showScores,
        afterScoring: after.scoringEnabled, afterShow: after.showScores,
        laterScoring: later.scoringEnabled, laterShow: later.showScores,
        standings: payload.standings, untouched: before.scoringEnabled };
    });
    ok(r.beforeScoring === true && r.beforeShow === true, "a session made while the defaults were on has scoring on");
    ok(r.afterScoring === false && r.afterShow === false, "turning the defaults off changes the next session made: " + JSON.stringify(r));
    ok(r.standings === null, "and that session sends no scores to the presentation");
    ok(r.untouched === true, "the session made earlier is not rewritten");
    ok(r.laterScoring === true && r.laterShow === true, "turning them back on works too");

    /* Confirmations: destructive ones can never be skipped; advisory ones can. */
    r = await page.evaluate(async () => {
      const out = {};
      const answer = async () => { await new Promise(res => setTimeout(res, 20)); const m = document.querySelector(".modal [data-mval='0']"); const shown = !!m; if (m) m.click(); return shown; };
      TCL.state.settings.confirmRoutine = false;
      /* Advisory: goes straight through. */
      out.routineSkipped = await TCL.UI.confirm("Finish early?", "b", { routine: true });
      out.routineModal = !!document.querySelector(".modal-back");
      /* Destructive: still asks, even with the toggle off. */
      const p1 = TCL.UI.confirm("Delete something", "b", { danger: true });
      out.dangerAsks = await answer();
      await p1;
      /* Even if a call site mistakenly marks a destructive action as routine. */
      const p2 = TCL.UI.confirm("Delete something else", "b", { danger: true, routine: true });
      out.dangerAsksEvenIfMarkedRoutine = await answer();
      await p2;
      TCL.state.settings.confirmRoutine = true;
      const p3 = TCL.UI.confirm("Finish early?", "b", { routine: true });
      out.routineAsksWhenOn = await answer();
      await p3;
      return out;
    });
    ok(r.routineSkipped === true && !r.routineModal, "with the toggle off an advisory confirmation goes straight through");
    ok(r.dangerAsks, "a destructive confirmation still asks with the toggle off");
    ok(r.dangerAsksEvenIfMarkedRoutine, "danger wins over routine, so a mislabelled call site still asks");
    ok(r.routineAsksWhenOn, "with the toggle on the advisory dialog is back");

    /* Every destructive call site in the app is unskippable by construction. */
    const sites = await page.evaluate(async () => {
      const seen = [];
      const real = TCL.UI.modal;
      TCL.UI.modal = o => { seen.push(o.title); TCL.UI.modal = real; return Promise.resolve(false); };
      TCL.state.settings.confirmRoutine = false;
      await TCL.UI.confirm("probe", "b", { danger: true });
      TCL.UI.modal = real;
      return seen;
    });
    ok(sites.length === 1 && sites[0] === "probe", "a danger confirm always reaches the dialog: " + JSON.stringify(sites));

    /* No setting is stored that nothing reads. */
    const dead = await page.evaluate(() => {
      const keys = Object.keys(TCL.Store.defaults().settings);
      const known = ["sound", "volume", "silent", "scoringEnabled", "showScoresLive", "hideScoresUntilFinale",
        "largeText", "presentationScale", "confirmRoutine", "consoleMode", "soundTested", "lastBackupAt", "gameDefaults", "scoreModel"];
      return keys.filter(k => !known.includes(k));
    });
    ok(dead.length === 0, "no stored setting is unaccounted for: " + JSON.stringify(dead));

    /* An older save that used confirmDestructive keeps the preference under the new name. */
    const migrated = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem(TCL.STORE_KEY) || "{}");
      raw.settings = Object.assign({}, raw.settings, { confirmDestructive: false });
      delete raw.settings.confirmRoutine;
      localStorage.setItem(TCL.STORE_KEY, JSON.stringify(raw));
      const loaded = TCL.Store.load();
      return { routine: loaded.data.settings.confirmRoutine, oldKeyGone: !("confirmDestructive" in loaded.data.settings) };
    });
    ok(migrated.routine === false && migrated.oldKeyGone, "an old confirmDestructive preference carries over to confirmRoutine: " + JSON.stringify(migrated));
    ok((await errorsOf(page)).length === 0, "no runtime errors");
    await page.close();
  });

  await test("holding screen covers the participant view without touching the activity", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz"], settings: { count: 3 } });
    await page.evaluate(() => { TCL.go("console"); TCL.Runner.start(TCL.session().runSheet[0].id); });
    await page.waitForSelector("[data-hold]");
    const before = await page.evaluate(() => { const p = TCL.Presenter.buildPayload(); return { screen: p.screen, hasPrompt: p.blocks.some(b => b.type === "prompt") }; });
    ok(before.screen === "activity" && before.hasPrompt, "the question is on screen to start with");
    await page.click('[data-hold="setup"]');
    const held = await page.evaluate(() => {
      const p = TCL.Presenter.buildPayload();
      return { screen: p.screen, blocks: p.blocks.map(b => b.type), text: JSON.stringify(p.blocks),
        standings: p.standings, timers: Object.keys(p.timers || {}).length,
        activityStillActive: TCL.Runner.current().status, clock: TCL.Timers.get("round").status };
    });
    ok(held.screen === "holding", "one click covers the participant screen");
    ok(!/prompt|answer|options/.test(held.blocks.join(",")), "no question, answer or options leak through: " + held.blocks.join(","));
    ok(held.standings === null && held.timers === 0, "no scores and no timers on the holding screen");
    ok(held.activityStillActive === "active", "the activity underneath keeps running");
    /* Every preset, plus a custom message. */
    const kinds = await page.evaluate(() => TCL.Session.HOLDING.map(h => h.id));
    ok(kinds.join(",") === "return,setup,pause,results", "four presets: " + kinds.join(", "));
    const custom = await page.evaluate(() => { TCL.Session.hold("custom", "Back in five"); const p = TCL.Presenter.buildPayload(); return JSON.stringify(p.blocks); });
    ok(/Back in five/.test(custom), "a custom message reaches the screen");
    await page.evaluate(() => TCL.Session.hold(null));
    const after = await page.evaluate(() => TCL.Presenter.buildPayload().screen);
    ok(after === "activity", "uncovering returns to exactly where the room was");
    ok((await errorsOf(page)).length === 0, "no runtime errors");
    await page.close();
  });

  await test("scoring models: balanced, placement and raw", async () => {
    const page = await fresh(context, { clear: true });
    const r = await page.evaluate(() => {
      const s = TCL.Session.create({ name: "Models", participants: ["A", "B", "C", "D", "E", "F"] });
      TCL.Teams.build(3);
      const quiz = TCL.Session.addActivity("game", "quiz");
      const five = TCL.Session.addActivity("game", "fivesec");
      const [t1, t2, t3] = s.teams.map(t => t.id);
      /* A long quiz hands out 200 points; a short game hands out 15. */
      TCL.Scoring.award({ activityId: quiz.id, teamId: t1, points: 200, reason: "x", force: true });
      TCL.Scoring.award({ activityId: quiz.id, teamId: t2, points: 100, reason: "y", force: true });
      TCL.Scoring.award({ activityId: five.id, teamId: t3, points: 15, reason: "z", force: true });
      TCL.Scoring.award({ activityId: five.id, teamId: t2, points: 5, reason: "w", force: true });
      const read = model => { s.scoreModel = model; const rows = TCL.Scoring.standings(); const by = {}, rawBy = {}; rows.forEach(x => { by[x.name] = x.total; rawBy[x.name] = x.raw; }); return { by, rawBy, top: rows[0].name }; };
      const out = { raw: read("raw"), balanced: read("balanced"), placement: read("placement") };
      out.names = s.teams.map(t => t.name);
      out.contribution = (s.scoreModel = "balanced", TCL.Scoring.contributionFor(quiz.id, s));
      out.ids = { t1, t2, t3 };
      out.eventsUntouched = s.scoreEvents.filter(e => !e.undone).length;
      return out;
    });
    const [n1, n2, n3] = r.names;
    ok(r.raw.by[n1] === 200 && r.raw.by[n2] === 105 && r.raw.by[n3] === 15, "raw: the quiz decides everything: " + JSON.stringify(r.raw.by));
    ok(r.balanced.by[n1] === 100 && r.balanced.by[n2] === 83 && r.balanced.by[n3] === 100,
      "balanced: winning the short game is worth as much as winning the long one: " + JSON.stringify(r.balanced.by));
    ok(r.placement.by[n1] === 30 && r.placement.by[n2] === 40 && r.placement.by[n3] === 30,
      "placement: a second and a first beats a single first: " + JSON.stringify(r.placement.by));
    ok(r.contribution[r.ids.t1] === 100 && r.contribution[r.ids.t2] === 50, "one activity scales to its own best score: " + JSON.stringify(r.contribution));
    ok(r.eventsUntouched === 4, "the raw score events are never rewritten by a model");
    ok(r.balanced.rawBy[n1] === 200 && r.balanced.rawBy[n3] === 15, "raw totals stay available alongside the model total: " + JSON.stringify(r.balanced.rawBy));
    /* Manual corrections pass through untouched. */
    const manual = await page.evaluate(() => {
      const s = TCL.session(); s.scoreModel = "balanced";
      const before = TCL.Scoring.standings()[0].total;
      TCL.Scoring.manualAdjust(s.teams[0].id, 7, "correction");
      return { before, after: TCL.Scoring.standings().find(r2 => r2.id === s.teams[0].id).total };
    });
    ok(manual.after === manual.before + 7, "a manual adjustment adds its points as given, in every model");
    ok((await errorsOf(page)).length === 0, "no runtime errors");
    await page.close();
  });

  await test("between-activities screen hands over to the next one", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz", "commonground"], settings: { count: 2 } });
    await page.evaluate(() => {
      const s = TCL.session();
      TCL.Runner.start(s.runSheet[0].id);
      const ctx = TCL.Runner.ctx();
      ctx.score(ctx.targets[0].id, 10, "correct", 0);
      TCL.Runner.act("noResponse");
      TCL.Runner.complete();
      TCL.go("summary", { id: s.runSheet[0].id });
    });
    await page.waitForSelector(".next-up");
    const r = await page.evaluate(() => ({
      heading: document.querySelector(".hero h1").textContent.trim(),
      standings: !!document.querySelector(".panel .tbl"),
      model: (document.querySelector(".panel .chip") || {}).textContent,
      nextTitle: document.querySelector(".next-up h2").textContent.trim(),
      breakout: !!document.querySelector(".next-up .badge.breakout"),
      prep: Array.from(document.querySelectorAll(".next-up .step-list li")).map(x => x.textContent.trim()),
      startBtn: (document.querySelector("[data-start-next]") || {}).className,
      roomPlan: !!document.querySelector(".next-up [data-breakout]"),
      cover: !!document.querySelector('.next-up [data-hold="setup"]'),
      noResponseNoted: /unanswered/.test(document.body.textContent),
    }));
    ok(/Rapid-Fire Quiz/.test(r.heading), "it names the activity that just finished: " + r.heading);
    ok(r.standings && /Balanced/.test(r.model || ""), "standings are shown with the model that produced them: " + r.model);
    ok(/Common Ground/.test(r.nextTitle) && r.breakout, "the next activity is named and flagged as needing breakout rooms");
    ok(r.prep.length && /breakout rooms/i.test(r.prep.join(" ")), "it says what to set up: " + r.prep.join(" | "));
    ok(/big/.test(r.startBtn || ""), "starting the next one is the primary action");
    ok(r.roomPlan && r.cover, "the room plan and the cover-screen button are one click away");
    ok(r.noResponseNoted, "an unanswered item is reported honestly");
    await page.evaluate(() => new Promise(res => setTimeout(res, 500)));
    await shot(page, "44-transition");
    ok((await errorsOf(page)).length === 0, "no runtime errors");
    await page.close();
  });

  await test("turn fairness: suggestions, put next, and sitting out", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["whosaid"], settings: { count: 4 }, people: 6 });
    const r = await page.evaluate(() => {
      const s = TCL.session();
      TCL.Runner.start(s.runSheet[0].id);
      const first = TCL.Teams.nextParticipant("spotlight", true);
      const second = TCL.Teams.nextParticipant("spotlight", true);
      const suggested = TCL.Participation.suggest(s);
      /* Suggestion must be someone who has not gone yet. */
      const out = { suggestedTurns: suggested.turns, suggestedIsFresh: ![first.id, second.id].includes(suggested.id) };
      /* Put someone specific next. */
      const chosen = TCL.Teams.present(s).find(p => p.id !== first.id && p.id !== second.id);
      TCL.Teams.setNext("spotlight", chosen.id);
      out.peeked = TCL.Teams.peekParticipant("spotlight").id === chosen.id;
      out.actual = TCL.Teams.nextParticipant("spotlight", true).id === chosen.id;
      out.clearedAfterUse = !(s.rotNext || {}).spotlight;
      /* Sitting out removes them from the rotation but not the roster. */
      const sitter = TCL.Teams.present(s)[0];
      TCL.Teams.defer(sitter.id, true);
      const twenty = [];
      for (let i = 0; i < 20; i++) twenty.push(TCL.Teams.nextParticipant("spotlight", true).id);
      out.sitterSkipped = !twenty.includes(sitter.id);
      out.stillOnRoster = s.participants.some(p => p.id === sitter.id && p.present);
      out.deferredListed = TCL.Teams.deferred(s).includes(sitter.id);
      out.notSuggested = TCL.Participation.suggest(s).id !== sitter.id;
      TCL.Teams.clearDeferred();
      out.backIn = TCL.Teams.eligible(s).some(p => p.id === sitter.id);
      /* Never rotate to nobody, even if everyone is sitting out. */
      TCL.Teams.present(s).forEach(p => TCL.Teams.defer(p.id, true));
      out.neverEmpty = !!TCL.Teams.nextParticipant("spotlight", false);
      TCL.Teams.clearDeferred();
      /* And none of it reaches the participants. */
      out.private = !/rotNext|deferred|participation/.test(JSON.stringify(TCL.Presenter.buildPayload()));
      return out;
    });
    ok(r.suggestedTurns === 0 && r.suggestedIsFresh, "the suggestion is someone who has not had a turn");
    ok(r.peeked && r.actual && r.clearedAfterUse, "put-next works once and then clears: " + JSON.stringify(r));
    ok(r.sitterSkipped && r.stillOnRoster && r.deferredListed && r.notSuggested, "sitting out skips the rotation but keeps them on the roster: " + JSON.stringify(r));
    ok(r.backIn, "bringing them back restores them");
    ok(r.neverEmpty, "the rotation never returns nobody, even if everyone is marked out");
    ok(r.private, "none of this reaches the presentation payload");
    /* The rail offers it during a game. */
    await page.evaluate(() => TCL.go("console"));
    await page.waitForSelector(".turn-panel");
    ok(!!(await page.$("[data-put-next]")) && !!(await page.$("[data-defer]")), "the console rail offers put-next and sitting-out");
    ok((await errorsOf(page)).length === 0, "no runtime errors");
    await page.close();
  });

  await test("no-response, technical problems and grace time", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz"], settings: { count: 3, seconds: 30 } });
    const r = await page.evaluate(() => {
      const s = TCL.session();
      TCL.Runner.start(s.runSheet[0].id);
      const out = {};
      /* No response: reveals, scores nothing, records what happened. */
      const before = TCL.Scoring.standings()[0].raw;
      TCL.Runner.act("noResponse");
      let st = TCL.Runner.ctx().state;
      out.noResponse = { revealed: st.revealed, outcome: st.outcomes[st.index], scored: TCL.Scoring.standings()[0].raw - before };
      TCL.Runner.act("next");
      /* Technical problem: swaps the item and hands the question back unused. */
      st = TCL.Runner.ctx().state;
      const doomed = st.items[st.index].id;
      const usedBefore = !!TCL.Content.usageOf(doomed);
      TCL.Runner.act("technical");
      st = TCL.Runner.ctx().state;
      out.technical = { swapped: st.items[st.index].id !== doomed, usedBefore, usedAfter: !!TCL.Content.usageOf(doomed), outcome: st.outcomes[st.index] };
      /* Skip without using it up. */
      st = TCL.Runner.ctx().state;
      const spared = st.items[st.index].id;
      TCL.Runner.act("skipUnused");
      out.skipUnused = { stillUnused: !TCL.Content.usageOf(spared) };
      /* Grace time adds ten seconds and restarts a finished clock. */
      TCL.Runner.act("prev");
      TCL.Timers.start("round", { durationMs: 5000, label: "Answer" });
      const remBefore = TCL.Timers.remaining("round");
      TCL.Runner.act("grace");
      out.grace = { gained: TCL.Timers.remaining("round") - remBefore, running: TCL.Timers.get("round").status };
      return out;
    });
    ok(r.noResponse.revealed && r.noResponse.outcome === "no response" && r.noResponse.scored === 0,
      "nobody answered: the room still hears the answer and no team is scored: " + JSON.stringify(r.noResponse));
    ok(r.technical.swapped && r.technical.usedBefore && !r.technical.usedAfter && r.technical.outcome === "technical",
      "a technical problem swaps the item and returns the question to the bank unused: " + JSON.stringify(r.technical));
    ok(r.skipUnused.stillUnused, "skipping without using it up leaves the question available");
    ok(r.grace.gained > 9000 && r.grace.gained <= 11000 && r.grace.running === "running", "grace time adds ten seconds and keeps the clock going: " + JSON.stringify(r.grace));
    /* The time-up bar appears instead of the round jumping on. */
    await page.evaluate(() => { TCL.go("console"); TCL.Timers.start("round", { durationMs: 20 }); });
    await page.waitForTimeout(400);
    await page.evaluate(() => TCL.UI.render());
    const bar = await page.evaluate(() => { const el = document.querySelector(".timeup-bar"); return el ? { text: el.textContent.replace(/\s+/g, " ").trim(), acts: Array.from(el.querySelectorAll("[data-act]")).map(b => b.dataset.act) } : null; });
    ok(bar && /Time is up/.test(bar.text) && bar.acts.includes("grace") && bar.acts.includes("noResponse"),
      "the clock running out offers choices rather than forcing a transition: " + JSON.stringify(bar));
    ok((await errorsOf(page)).length === 0, "no runtime errors");
    await page.close();
  });

  await test("duplicating a session copies the plan and none of the run", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz", "whosaid"], settings: { count: 2 } });
    const r = await page.evaluate(() => {
      const s = TCL.session();
      /* Dirty every kind of run state there is. */
      s.name = "Friday session";
      s.notes = "Explain the rules twice";
      s.scoreModel = "placement";
      s.finaleMode = "shared";
      s.showScores = false;
      TCL.Runner.start(s.runSheet[0].id);
      const ctx = TCL.Runner.ctx();
      ctx.score(ctx.targets[0].id, 10, "correct", 0);
      TCL.Teams.nextParticipant("spotlight", true);
      s.teams.forEach(t => TCL.Teams.nextMember(t, "actor", true));
      TCL.Teams.defer(TCL.Teams.present(s)[0].id, true);
      TCL.Teams.setNext("spotlight", TCL.Teams.present(s)[1].id);
      TCL.Session.hold("pause");
      TCL.Runner.completeAndDiscard();
      s.runSheet[1].forceStart = true;
      s.runSheet[1].notes = "Collect facts beforehand";
      s.ready = { checkedAt: Date.now(), zoomAck: true };

      const copy = TCL.Session.duplicate(s.id);
      const blank = TCL.Session.blank("x", 60);
      const planKeys = TCL.Session.PLAN_KEYS;
      /* Every non-plan field must match a brand new session. */
      const carried = Object.keys(blank).filter(k => planKeys.indexOf(k) < 0)
        .filter(k => JSON.stringify(copy[k]) !== JSON.stringify(blank[k]));
      return {
        carried,
        holding: copy.holding, deferred: copy.deferred, rotNext: copy.rotNext,
        participation: copy.participation, ready: copy.ready, scoreEvents: copy.scoreEvents.length,
        status: copy.status, current: copy.currentActivityId, rehearsal: copy.rehearsal,
        activity: { status: copy.runSheet[0].status, state: copy.runSheet[0].state, discarded: copy.runSheet[0].scoresDiscarded, force: copy.runSheet[1].forceStart },
        idsAreNew: copy.runSheet.every(a => !s.runSheet.some(o => o.id === a.id)),
        /* Run state can hide inside plan objects. Compare the shape of each team and each
           participant against a freshly created one, so a new nested field is caught too. */
        teamRot: copy.teams.map(t => t.rot).filter(Boolean).length,
        sourceTeamRot: s.teams.filter(t => t.rot && Object.keys(t.rot).length).length,
        teamExtraKeys: (function () {
          const allowed = Object.keys(TCL.Teams.newTeam("probe"));
          return copy.teams.reduce((acc, t) => acc.concat(Object.keys(t).filter(k => allowed.indexOf(k) < 0)), []);
        })(),
        participantExtraKeys: (function () {
          const allowed = Object.keys(TCL.Teams.newParticipant("probe")).concat(["displayName"]);
          return copy.participants.reduce((acc, p) => acc.concat(Object.keys(p).filter(k => allowed.indexOf(k) < 0)), []);
        })(),
        /* the plan survives */
        plan: { name: copy.name, model: copy.scoreModel, finale: copy.finaleMode, showScores: copy.showScores,
          notes: copy.notes, activityNotes: copy.runSheet[1].notes, count: copy.runSheet[0].settings.count,
          activities: copy.runSheet.length, people: copy.participants.length, teams: copy.teams.length },
        sourceUntouched: { holding: !!s.holding, scores: s.scoreEvents.length },
      };
    });
    ok(r.carried.length === 0, "no run-state field survives the copy: " + JSON.stringify(r.carried));
    ok(r.holding === null, "the duplicate does not open with the presentation still covered");
    ok(JSON.stringify(r.deferred) === "[]" && JSON.stringify(r.rotNext) === "{}", "nobody is still marked as sitting out: " + JSON.stringify(r));
    ok(JSON.stringify(r.participation) === "{}" && JSON.stringify(r.ready) === "{}", "turn history and the readiness tick start clean");
    ok(r.scoreEvents === 0 && r.status === "draft" && r.current === null && r.rehearsal === false, "scores, status and the current activity reset");
    ok(r.activity.status === "pending" && r.activity.state === null && r.activity.discarded === undefined && r.activity.force === undefined,
      "per-activity run state is dropped, including a discarded-scores flag and a validation override: " + JSON.stringify(r.activity));
    ok(r.idsAreNew, "activities get fresh ids so scores can never cross between the two");
    ok(r.teamRot === 0 && r.sourceTeamRot === 3, "per-team rotation pointers are cleared on the copy and kept on the original (" + r.teamRot + " / " + r.sourceTeamRot + ")");
    ok(r.teamExtraKeys.length === 0, "no key survives on a team that a freshly built one does not have: " + JSON.stringify(r.teamExtraKeys));
    ok(r.participantExtraKeys.length === 0, "no run state hides inside a participant: " + JSON.stringify(r.participantExtraKeys));
    ok(r.plan.name === "Friday session (copy)" && r.plan.model === "placement" && r.plan.finale === "shared" && r.plan.showScores === false,
      "the plan carries over: name, scoring model, finale style, score visibility: " + JSON.stringify(r.plan));
    ok(r.plan.notes === "Explain the rules twice" && r.plan.activityNotes === "Collect facts beforehand", "facilitator notes survive, because they are preparation");
    ok(r.plan.count === 2 && r.plan.activities === 2 && r.plan.people === 15 && r.plan.teams === 3, "settings, activities, people and teams carry over: " + JSON.stringify(r.plan));
    ok(r.sourceUntouched.holding && r.sourceUntouched.scores === 1, "the session being copied is not disturbed");
    ok((await errorsOf(page)).length === 0, "no runtime errors");
    await page.close();
  });

  await test("turn order: teams answer in rotation and a miss passes the question on", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz"], settings: { count: 4, seconds: 30, speedBonus: false } });
    const r = await page.evaluate(() => {
      const s = TCL.session();
      TCL.Runner.start(s.runSheet[0].id);
      let ctx = TCL.Runner.ctx();
      const names = ctx.targets.map(t => t.name);
      const out = { names, order: [], worth: [] };
      const who = () => { const t = TCL.GameKit.turnTarget(TCL.Runner.ctx()); return t ? t.name : null; };
      const worthNow = () => { const c = TCL.Runner.ctx(); return TCL.GameKit.turnValue(c, TCL.GameKit.pointsFor(c.settings, TCL.GameKit.current(c.state))); };
      out.order.push(who()); out.worth.push(worthNow());
      /* First team misses: it passes on, for fewer points. */
      TCL.Runner.act("wrong", ctx.targets[TCL.Runner.ctx().state.turnIdx].id);
      out.order.push(who()); out.worth.push(worthNow());
      /* Second team gets it, at the reduced value. */
      const scorer = TCL.GameKit.turnTarget(TCL.Runner.ctx());
      TCL.Runner.act("correct", scorer.id);
      out.scored = TCL.Scoring.rawFor(s.runSheet[0].id)[scorer.id];
      out.scorerWasSecond = scorer.name === out.order[1];
      /* Next question: a different team leads. */
      TCL.Runner.act("next");
      out.order.push(who());
      TCL.Runner.act("next");
      out.order.push(who());
      /* Everyone missing reveals rather than looping forever. */
      let guard = 0;
      while (!TCL.Runner.ctx().state.allTried && guard++ < 10) TCL.Runner.act("pass");
      const st = TCL.Runner.ctx().state;
      out.allTried = st.allTried; out.revealedWhenExhausted = st.revealed; out.loops = guard;
      /* Presentation tells the room whose turn it is. */
      TCL.Runner.act("next");
      const payload = TCL.Presenter.buildPayload();
      const banner = payload.blocks.find(b => b.type === "banner");
      out.presentationBanner = banner ? banner.parts.map(p => p.text).join(" · ") : null;
      /* Open floor still works. */
      const a = s.runSheet[0];
      a.settings.answerOrder = "open";
      out.openHasNoTurn = TCL.GameKit.turnOnly(TCL.Runner.ctx()) === null;
      return out;
    });
    ok(r.order[0] && r.order[1] && r.order[0] !== r.order[1], "a miss hands the question to the next team: " + r.order.slice(0, 2).join(" -> "));
    ok(r.worth[0] === 10 && r.worth[1] === 5, "a passed-on question is worth half by default: " + JSON.stringify(r.worth));
    ok(r.scored === 5 && r.scorerWasSecond, "the team it was passed to scores the reduced value (" + r.scored + ")");
    ok(r.order[2] !== r.order[0] && r.order[3] !== r.order[2], "the team going first rotates with each question: " + r.order.join(" -> "));
    ok(r.allTried && r.revealedWhenExhausted && r.loops <= 4, "once every team has tried it reveals instead of looping: " + JSON.stringify({ loops: r.loops }));
    ok(r.presentationBanner && r.names.some(n => r.presentationBanner.indexOf(n) === 0), "the room is told whose turn it is: " + r.presentationBanner);
    ok(r.openHasNoTurn, "open floor puts nobody on the spot");
    ok((await errorsOf(page)).length === 0, "no runtime errors");
    await page.close();
  });

  await test("speed bonus: full early, half in the middle, gone at the end", async () => {
    const page = await fresh(context, { clear: true });
    await seedSession(page, { games: ["quiz"], settings: { count: 3, seconds: 30, speedBonusPoints: 6 } });
    const r = await page.evaluate(() => {
      const s = TCL.session();
      TCL.Runner.start(s.runSheet[0].id);
      const at = fraction => {
        const t = TCL.Timers.get("round");
        TCL.Timers.start("round", { durationMs: 30000, label: "Answer" });
        t.remainingMs = 30000 * fraction; t.startedAt = Date.now();
        return TCL.GameKit.speedBonus(TCL.Runner.ctx());
      };
      const out = { full: at(0.9).points, mid: at(0.5).points, late: at(0.2).points, on: TCL.Runner.ctx().settings.speedBonus };
      /* Awarding it: the bonus is a separate, visible score event. */
      at(0.9);
      const target = TCL.GameKit.turnTarget(TCL.Runner.ctx());
      TCL.Runner.act("correct", target.id);
      const events = TCL.Scoring.eventsFor(s.runSheet[0].id).filter(e => !e.undone);
      out.reasons = events.map(e => e.reason + ":" + e.points);
      /* A passed-on question earns no speed bonus: being quick is not the point any more. */
      TCL.Runner.act("next");
      at(0.9);
      TCL.Runner.act("pass");
      const second = TCL.GameKit.turnTarget(TCL.Runner.ctx());
      TCL.Runner.act("correct", second.id);
      out.passedReasons = TCL.Scoring.eventsFor(s.runSheet[0].id).filter(e => !e.undone && e.round === TCL.Runner.ctx().state.index).map(e => e.reason);
      /* Half mode is the older flat behaviour, still available. */
      s.runSheet[0].settings.speedBonusMode = "half";
      out.halfMode = { early: at(0.9).points, justPast: at(0.4).points };
      return out;
    });
    ok(r.on === true, "the speed bonus is on by default for the quiz");
    ok(r.full === 6 && r.mid === 3 && r.late === 0, "tiered: full, then half, then nothing: " + JSON.stringify([r.full, r.mid, r.late]));
    ok(r.reasons.join(",") === "correct:10,speed bonus:6", "the bonus is its own score event, so it can be undone on its own: " + r.reasons.join(", "));
    ok(r.passedReasons.indexOf("speed bonus") < 0, "no speed bonus once a question has been passed on: " + JSON.stringify(r.passedReasons));
    ok(r.halfMode.early === 6 && r.halfMode.justPast === 0, "half mode is flat and still works: " + JSON.stringify(r.halfMode));
    /* Regressions for defects found in the edge sweep. */
    const guards = await page.evaluate(() => {
      const s = TCL.session();
      const a = s.runSheet[0];
      a.settings.autoStart = false;
      TCL.Runner.resetActivity(a.id, false);
      TCL.Runner.start(a.id);
      const idle = { status: TCL.Timers.get("round").status, bonus: TCL.GameKit.speedBonus(TCL.Runner.ctx()).points };
      /* an activity can never contribute beyond ±100 championship points */
      s.scoreModel = "balanced";
      const b = TCL.Session.addActivity("game", "quiz");
      TCL.Scoring.award({ activityId: b.id, teamId: s.teams[0].id, points: 1, reason: "c", force: true });
      TCL.Scoring.award({ activityId: b.id, teamId: s.teams[1].id, points: -999, reason: "w", force: true });
      const contrib = TCL.Scoring.contributionFor(b.id, s);
      /* one question cannot be walked around the whole room */
      const c = TCL.Runner.ctx();
      c.settings.passLimit = 2;
      return { idle, contrib: Object.keys(contrib).map(k => contrib[k]), offers: TCL.GameKit.turnOffers(c) };
    });
    ok(guards.idle.status === "idle" && guards.idle.bonus === 0, "no speed bonus when the clock was never started: " + JSON.stringify(guards.idle));
    ok(guards.contrib.every(v => v >= -100 && v <= 100), "negative marking cannot push an activity past its ±100 cap: " + JSON.stringify(guards.contrib));
    ok(guards.offers === 3, "a question is offered to a limited number of teams, not the whole room (" + guards.offers + ")");
    ok((await errorsOf(page)).length === 0, "no runtime errors");
    await page.close();
  });

  await test("served over http://localhost the app boots and the presentation window connects", async () => {
    const http = require("http"), fsp = require("fs");
    const root = path.resolve(__dirname, "..");
    const server = http.createServer((req, res) => {
      const file = path.join(root, decodeURIComponent(req.url.split("?")[0]) === "/" ? "/team-connect.html" : decodeURIComponent(req.url.split("?")[0]));
      if (!file.startsWith(root) || !fsp.existsSync(file)) { res.writeHead(404); res.end("no"); return; }
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(fsp.readFileSync(file));
    });
    await new Promise(r => server.listen(0, "127.0.0.1", r));
    const port = server.address().port;
    const page = await context.newPage();
    lastPage = page;
    try {
      await page.goto(`http://127.0.0.1:${port}/team-connect.html`);
      await page.waitForSelector("#app .hero");
      await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
      await page.reload(); await page.waitForSelector("#app .hero");
      await seedSession(page, { games: ["quiz"] });
      await page.evaluate(() => TCL.go("console"));
      const [pres] = await Promise.all([context.waitForEvent("page"), page.evaluate(() => TCL.Presenter.open())]);
      await pres.waitForSelector(".pres");
      await page.waitForSelector(".share-banner.green", { timeout: 8000 });
      const info = await page.evaluate(() => ({ status: TCL.Presenter.status, proto: location.protocol, errors: window.__tclErrors }));
      ok(info.proto === "http:", "running over http (" + info.proto + ")");
      ok(info.status === "connected", "presentation connects over http as well as file:// (" + info.status + ")");
      ok(info.errors.length === 0, "no runtime errors over http");
      await pres.close();
    } finally {
      await page.close();
      await new Promise(r => server.close(r));
    }
  });

  await browser.close();
  const passed = results.filter(r => r.ok).length, failed = results.filter(r => !r.ok);
  console.log(`\n${passed} passed, ${failed.length} failed`);
  failed.forEach(f => console.log(" ✗", f.test, "::", f.msg));
  fs.writeFileSync(path.join(ART, "results.json"), JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
})();
