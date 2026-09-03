/* src/app.js  Boot. */
(function () {
  "use strict";
  const TCL = window.TCL;
  function boot() {
    const isPresentation = location.hash === "#presentation";
    if (isPresentation) { TCL.PresentationView.boot(); return; }
    const loaded = TCL.Store.load();
    TCL.state = loaded.data;
    TCL.bootStatus = loaded.status;
    /* Drop sessions that are structurally broken instead of crashing */
    TCL.state.sessions = TCL.state.sessions.filter(s => s && typeof s === "object" && Array.isArray(s.participants) && Array.isArray(s.runSheet) && Array.isArray(s.teams));
    if (TCL.state.currentSessionId && !TCL.session()) TCL.state.currentSessionId = null;
    TCL.state.sessions.forEach(s => { if (!s.timers) s.timers = TCL.Timers.blankSet(); if (!s.undo) s.undo = { stack: [], redo: [] }; if (!Array.isArray(s.log)) s.log = []; if (!Array.isArray(s.scoreEvents)) s.scoreEvents = []; TCL.Teams.refreshNames(s); });
    TCL.Timers.startLoop();
    TCL.Presenter.initFacilitator();
    TCL.restoreRoute();
    /* Landing rules: unfinished session -> home recovery banner, unless the route says console and the session matches */
    const unfinished = TCL.Session.unfinished();
    if (!TCL.session() && TCL.route.screen !== "home" && TCL.route.screen !== "content" && TCL.route.screen !== "settings" && TCL.route.screen !== "wizard") TCL.route = { screen: "home", params: {} };
    if (unfinished.length && !(TCL.session() && TCL.session().status === "live")) TCL.route = { screen: "home", params: {} };
    TCL.UI.render();
    TCL.on("store:error", msg => TCL.UI.toast(msg, "error", 6000));
    window.addEventListener("error", e => { console.error(e.error || e.message); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
