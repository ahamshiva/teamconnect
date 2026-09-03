const path = require("path"), pw = require("playwright");
const FILE = "file://" + path.resolve(__dirname, "..", "team-connect.html"), ART = path.resolve(__dirname, "artifacts");
(async () => {
  const browser = await pw.chromium.launch(); const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage(); await page.goto(FILE); await page.waitForSelector("#app");
  await page.evaluate(() => { localStorage.clear(); const s = TCL.Session.create({ name: "Funny and Clever", targetMinutes: 45, participants: TCL.Teams.SAMPLE_ROSTER }); TCL.Teams.build(3); TCL.Session.applyPreset(TCL.Session.preset("preset_clever45")); TCL.persistNow(); });
  const [popup] = await Promise.all([context.waitForEvent("page"), page.evaluate(() => TCL.Presenter.open())]);
  await popup.setViewportSize({ width: 1280, height: 720 }); await popup.waitForSelector(".pres");
  const snap = async (n) => { await page.waitForTimeout(800); await page.screenshot({ path: path.join(ART, "40-" + n + ".png") }); await popup.waitForTimeout(300); await popup.screenshot({ path: path.join(ART, "41-pres-" + n + ".png") }); };
  await page.evaluate(() => { const s = TCL.session(); TCL.Runner.start(s.runSheet[1].id); TCL.go("console"); const ctx = TCL.Runner.ctx(); TCL.Runner.act("vote", JSON.stringify({ id: ctx.targets[0].id, v: true })); TCL.Runner.act("vote", JSON.stringify({ id: ctx.targets[1].id, v: false })); TCL.Runner.act("reveal"); });
  await snap("factfiction");
  await page.evaluate(() => { TCL.Runner.complete(); const s = TCL.session(); TCL.Runner.start(s.runSheet[3].id); let ctx = TCL.Runner.ctx(); TCL.Runner.act("setSub", JSON.stringify({ id: ctx.targets[0].id, text: "A ceremonial hat worn by Victorian train conductors." })); TCL.Runner.act("setSub", JSON.stringify({ id: ctx.targets[1].id, text: "The last biscuit in a shared packet." })); TCL.Runner.act("setSub", JSON.stringify({ id: ctx.targets[2].id, text: "A Filipino dance performed at midnight." })); TCL.Runner.act("show"); });
  await snap("balderdash");
  await page.evaluate(() => { TCL.Runner.complete(); const s = TCL.session(); TCL.Runner.start(s.runSheet[2].id); let ctx = TCL.Runner.ctx(); TCL.Runner.act("setSub", JSON.stringify({ id: ctx.targets[0].id, text: "Because the pigeons unionised." })); TCL.Runner.act("setSub", JSON.stringify({ id: ctx.targets[1].id, text: "Tax reasons." })); TCL.Runner.act("setSub", JSON.stringify({ id: ctx.targets[2].id, text: "It was cheaper than the alternative, which was fire." })); TCL.Runner.act("show"); TCL.Runner.act("setVotes", JSON.stringify({ id: ctx.targets[2].id, n: 7 })); TCL.Runner.act("setVotes", JSON.stringify({ id: ctx.targets[0].id, n: 4 })); TCL.Runner.act("awardFunniest"); });
  await snap("wronganswers");
  await browser.close(); console.log("done");
})();
