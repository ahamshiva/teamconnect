/* src/presets.js  Built-in presets. */
(function () {
  "use strict";
  const TCL = window.TCL;
  const Presets = TCL.Presets = {};
  Presets.builtIn = function () {
    return [
      { id: "preset_full60", builtIn: true, name: "Full Team Connect — 60 Minutes", description: "Warm-up, connection, creativity, quiz, reflection and appreciation.", targetMinutes: 60, runSheet: [
        { kind: "custom", title: "Welcome and Zoom reaction warm-up", settings: { minutes: 5, message: "Welcome! Wave on camera, then send one emoji reaction that matches your week.", instructions: "Cameras on if you can\nUse Zoom reactions to answer quick polls\nQuestions go in chat" } },
        { kind: "game", gameId: "whosaid", settings: { count: 8, seconds: 30, storySeconds: 30 } },
        { kind: "game", gameId: "commonground", settings: { breakoutMinutes: 5, presentSeconds: 45 } },
        { kind: "game", gameId: "draw", settings: { rounds: 3, seconds: 90, previewSeconds: 10 } },
        { kind: "game", gameId: "quiz", settings: { count: 8, seconds: 30 } },
        { kind: "game", gameId: "capsule", settings: { breakoutMinutes: 5, presentSeconds: 45 } },
        { kind: "game", gameId: "appreciation", settings: { collectMinutes: 3 } },
      ] },
      { id: "preset_quick30", builtIn: true, name: "Quick Connect — 30 Minutes", description: "A fast, warm half hour: one bonding game, one energy game, one laugh.", targetMinutes: 30, runSheet: [
        { kind: "custom", title: "Welcome", settings: { minutes: 2, message: "Welcome! Quick wave on camera and we begin." } },
        { kind: "game", gameId: "wyr", settings: { count: 5, discussion: true } },
        { kind: "game", gameId: "fivesec", settings: { count: 8 } },
        { kind: "game", gameId: "gibberish", settings: { count: 6 } },
      ] },
      { id: "preset_champ60", builtIn: true, name: "High-Energy Championship — 60 Minutes", description: "Competitive and loud: quiz, gibberish, charades, five-second and a podium.", targetMinutes: 60, runSheet: [
        { kind: "custom", title: "Welcome and team battle cries", settings: { minutes: 4, message: "Each team: pick a captain and a battle cry. You will need it." } },
        { kind: "game", gameId: "quiz", settings: { count: 10, speedBonus: true } },
        { kind: "game", gameId: "gibberish", settings: { count: 8 } },
        { kind: "game", gameId: "charades", settings: { turns: 6 } },
        { kind: "game", gameId: "fivesec", settings: { count: 12 } },
        { kind: "game", gameId: "rankit", settings: { count: 2 } },
      ] },
      { id: "preset_bond60", builtIn: true, name: "Genuine Team Bonding — 60 Minutes", description: "Slower and deeper: stories, common ground, a mission and appreciation.", targetMinutes: 60, runSheet: [
        { kind: "custom", title: "Welcome and check-in", settings: { minutes: 5, message: "One word for how you arrive today. Type it in chat." } },
        { kind: "game", gameId: "twotruths", settings: { count: 6 } },
        { kind: "game", gameId: "commonground", settings: { breakoutMinutes: 7 } },
        { kind: "game", gameId: "mission", settings: { count: 1 } },
        { kind: "game", gameId: "capsule", settings: { breakoutMinutes: 6 } },
        { kind: "game", gameId: "appreciation", settings: { collectMinutes: 4 } },
      ] },
      { id: "preset_clever45", builtIn: true, name: "Funny and Clever — 45 Minutes", description: "Laugh at the reveal, learn something weird: facts, fake definitions, wrong answers and gibberish.", targetMinutes: 45, runSheet: [
        { kind: "custom", title: "Welcome and one-word check-in", settings: { minutes: 3, message: "One word for how you arrive today. Type it in chat." } },
        { kind: "game", gameId: "factfiction", settings: { count: 8 } },
        { kind: "game", gameId: "wronganswers", settings: { count: 3 } },
        { kind: "game", gameId: "balderdash", settings: { count: 3 } },
        { kind: "game", gameId: "gibberish", settings: { count: 6 } },
      ] },
      { id: "preset_blank", builtIn: true, name: "Blank Custom Session", description: "Start with an empty run sheet.", targetMinutes: 60, runSheet: [] },
    ];
  };
})();
