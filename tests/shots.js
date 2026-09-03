/* tests/shots.js : visual QA captures (not assertions). Run like tests/run.js. */
const path = require("path"), pw = require("playwright");
const FILE = "file://" + path.resolve(__dirname, "..", "team-connect.html"), ART = path.resolve(__dirname, "artifacts");
(async () => {
  const browser = await pw.chromium.launch(); const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage(); await page.goto(FILE); await page.waitForSelector("#app");
  await page.evaluate(() => { localStorage.clear(); });
  await page.evaluate(() => {
    const s = TCL.Session.create({ name: "Friday Team Connect", targetMinutes: 60, participants: TCL.Teams.SAMPLE_ROSTER });
    s.participants.forEach((p, i) => { p.location = i % 2 ? "Gurugram" : "Sydney"; p.fact = ["I once met a penguin in Norway", "I can juggle three mangoes", "I have never seen snow", "I speak four languages badly", "I was on TV as a child", "I ran a marathon on a dare", "I collect airline sick bags", "I have a black belt", "I sang at a wedding in Manila", "I once fixed a server with a hairdryer"][i] || ""; });
    TCL.Teams.build(3);
    ["whosaid", "draw", "charades", "commonground", "rankit", "mission", "appreciation"].forEach(id => { const a = TCL.Session.addActivity("game", id); a.settings.count = 3; a.settings.rounds = 2; a.settings.turns = 2; });
    TCL.Session.touch(); TCL.persistNow();
  });
  const snap = async (name, ms) => { await page.waitForTimeout(ms || 700); await page.screenshot({ path: path.join(ART, name + ".png") }); };
  await page.evaluate(() => TCL.go("participants")); await snap("10-participants");
  await page.evaluate(() => TCL.go("library")); await snap("11-library");
  await page.evaluate(() => { TCL.go("builder"); TCL.UI.configureActivity(TCL.session().runSheet[1].id); }); await snap("12-configure-draw");
  await page.keyboard.press("Escape");
  const [popup] = await Promise.all([context.waitForEvent("page"), page.evaluate(() => TCL.Presenter.open())]);
  await popup.setViewportSize({ width: 1280, height: 720 }); await popup.waitForSelector(".pres");
  const acts = await page.evaluate(() => TCL.session().runSheet.map(a => a.id));
  const drive = { whosaid: [], draw: ["preview"], charades: ["startTurn", "correct"], commonground: ["startBreakout"], rankit: [], mission: ["start", "nextClue", "nextClue"], appreciation: [] };
  for (const id of acts) {
    const gid = await page.evaluate(id => { TCL.Runner.start(id); TCL.go("console"); const g = TCL.Runner.current().gameId; return g; }, id);
    for (const act of drive[gid] || []) await page.evaluate(a => TCL.Runner.act(a), act);
    if (gid === "appreciation") await page.evaluate(() => { const st = TCL.Runner.current().state; ["Thanks Priya for the late-night deploy save.", "This team laughs at my jokes. Mostly.", "Grateful for the patience during onboarding."].forEach(t => { st.draftText = t; TCL.Runner.act("add"); }); TCL.Runner.act("approveAll"); TCL.Runner.act("reveal"); });
    await snap("20-console-" + gid, 900);
    await popup.waitForTimeout(400); await popup.screenshot({ path: path.join(ART, "21-pres-" + gid + ".png") });
    await page.evaluate(() => TCL.Runner.complete());
  }
  await page.evaluate(() => { const s = TCL.session(); TCL.Scoring.manualAdjust(s.teams[0].id, 45, "demo"); TCL.Scoring.manualAdjust(s.teams[1].id, 30, "demo"); TCL.Scoring.manualAdjust(s.teams[2].id, 30, "demo"); TCL.go("results", { present: true }); });
  await snap("30-results", 1200);
  await popup.waitForTimeout(500); await popup.screenshot({ path: path.join(ART, "31-pres-final.png") });
  await page.evaluate(() => { TCL.go("home"); }); await snap("32-home-sessions");
  await browser.close();
  console.log("shots done");
})();
