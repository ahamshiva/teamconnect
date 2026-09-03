/* src/content/misc.js  Small banks: Who Said That backup prompts, Common Ground briefs, Time Capsule prompts, Appreciation prompts. */
(function () {
  "use strict";
  const C = window.TCL.Content;
  const S = (text, category, difficulty) => ({ text, category: category || "General", difficulty: difficulty || 1 });
  /* Used when participants have not pre-submitted facts: a quick live prompt so the round still works. */
  C.registerBank("whosaid", [
    S("Backup: the spotlight person tells one surprising fact about themselves live. Teams then guess one detail: where it happened.", "Backup"),
    S("Backup: the spotlight person names a food they could eat every day. Teams guess which cuisine it comes from.", "Backup"),
    S("Backup: the spotlight person describes their first ever job in three words. Teams guess the job.", "Backup"),
    S("Backup: the spotlight person names a place they would move to tomorrow. Teams guess the continent before it is revealed.", "Backup"),
    S("Backup: the spotlight person shares one thing they collected as a child. Teams guess whether they still have it.", "Backup"),
    S("Backup: the spotlight person names a skill they learned in the last year. Teams guess whether it was online or in person.", "Backup"),
  ], [{ key: "text", label: "Backup prompt", type: "textarea", required: true }]);

  C.registerBank("commonground", [
    S("Find three things everyone in your team has in common that are NOT about work. The more unusual the better.", "Standard"),
    S("Find three things everyone in your team has in common, plus one thing that is unique to each person.", "Standard"),
    S("Find a food everyone in your team loves, a place everyone wants to visit, and a skill everyone wishes they had.", "Themed"),
    S("Find something everyone in your team did before the age of ten, and something everyone did in the last month.", "Themed"),
    S("Find three surprising similarities, then agree on a team motto that fits all of you.", "Creative"),
  ], [{ key: "text", label: "Task brief", type: "textarea", required: true }]);

  C.registerBank("capsule", [
    S("Write a message to the team to be opened in one year. Include one prediction, one hope, and one thing you want to remember about now.", "Serious"),
    S("Write three predictions about the team a year from now. Be bold. One of them should be completely ridiculous.", "Humorous"),
    S("Describe a day in this team five years from now as if it were a film trailer.", "Imaginative"),
    S("List three things the team should stop doing, start doing and keep doing, to be read back in six months.", "Serious"),
    S("Write a headline about this team from a newspaper one year in the future.", "Humorous"),
    S("Draft a short letter from your future selves thanking the present team for something you have not done yet.", "Imaginative"),
  ], [{ key: "text", label: "Prompt", type: "textarea", required: true }]);

  C.registerBank("appreciation", [
    S("Write one sentence of appreciation for a teammate: something specific they did that made your work easier or your day better.", "Person"),
    S("Write one thing this team does well that you would miss if it stopped.", "Team"),
    S("Thank someone for a moment when they had your back. Name the moment, not just the person.", "Person"),
    S("Write one word that describes this team and one sentence on why.", "Team"),
  ], [{ key: "text", label: "Prompt", type: "textarea", required: true }]);

  /* Caption This prompts fall back to a text setup when no image is available. */
  C.registerBank("captions", [
    S("The moment the Wi-Fi drops during the most important demo of the quarter.", "Office", 1),
    S("A cat walks across the keyboard right as the CEO asks a question.", "Office", 1),
    S("Someone discovers they were on camera the whole time.", "Office", 1),
    S("The printer prints one page, then decides it has done enough for today.", "Office", 1),
    S("Two colleagues realise they booked the same meeting room.", "Office", 1),
    S("The last biscuit in the office tin has been spotted.", "Office", 1),
  ], [{ key: "text", label: "Caption setup", type: "textarea", required: true }]);
})();
