/* src/content/truths.js  Two Truths and a Lie topic prompts. */
(function () {
  "use strict";
  const T = (text, category) => ({ text, category, difficulty: 1 });
  window.TCL.Content.registerBank("truths", [
    T("A travel story", "Life"), T("Food you secretly dislike", "Food"), T("A celebrity encounter", "Life"), T("Your childhood dream job", "Life"),
    T("A hidden talent", "Skills"), T("School or college mischief", "Life"), T("The strangest thing you have eaten", "Food"), T("A tech disaster you caused", "Work"),
    T("Your first job", "Work"), T("A sports moment", "Life"), T("Something you collect", "Life"), T("A fear you have conquered", "Life"),
    T("A place you have lived", "Life"), T("A language you can say hello in", "Skills"), T("A hobby nobody knows about", "Skills"), T("A concert or festival you attended", "Life"),
    T("An animal you have held", "Life"), T("Your longest journey", "Life"), T("A prize or award you won", "Life"), T("A dish you can cook from memory", "Food"),
    T("A book or film you have seen more than five times", "Life"), T("Something you built or fixed yourself", "Skills"), T("An unusual job you have done", "Work"), T("A team you have played for", "Life"),
  ], [
    { key: "text", label: "Topic prompt", type: "text", required: true },
  ]);
})();
