/* src/content/fivesec.js  Five-Second Frenzy prompts: "Name 3 ..." */
(function () {
  "use strict";
  const P = (text, category, difficulty) => ({ text, category, difficulty: difficulty || 2 });
  window.TCL.Content.registerBank("fivesec", [
    P("Name 3 pizza toppings", "Food", 1), P("Name 3 Indian street foods", "Food", 2), P("Name 3 Filipino dishes", "Food", 2), P("Name 3 ice cream flavours", "Food", 1),
    P("Name 3 things at an Aussie barbecue", "Food", 2), P("Name 3 kinds of noodles", "Food", 2), P("Name 3 chai ingredients", "Food", 2), P("Name 3 round foods", "Food", 1),
    P("Name 3 dim sum dishes", "Food", 2), P("Name 3 things you put on toast", "Food", 1), P("Name 3 fruits that are yellow", "Food", 1), P("Name 3 breakfast cereals", "Food", 1),
    P("Name 3 excuses for missing standup", "Office", 2), P("Name 3 things you say while on mute", "Office", 2), P("Name 3 reasons the build failed", "Office", 2), P("Name 3 keyboard shortcuts", "Office", 1),
    P("Name 3 things in a meeting invite", "Office", 1), P("Name 3 things IT support asks first", "Office", 2), P("Name 3 things you should not say to your boss", "Office", 3), P("Name 3 apps you open every day", "Office", 1),
    P("Name 3 ways to annoy people on a video call", "Office", 2), P("Name 3 things slower than office WiFi", "Office", 2), P("Name 3 things heavier than a Monday mood", "Office", 3), P("Name 3 unwritten rules of the office kitchen", "Office", 3),
    P("Name 3 polite ways to decline a 5pm Friday meeting", "Office", 3), P("Name 3 things people say to end a call", "Office", 1), P("Name 3 items on every desk", "Office", 1), P("Name 3 things in a spreadsheet", "Office", 2),
    P("Name 3 Bollywood movies", "Pop Culture", 1), P("Name 3 superheroes", "Pop Culture", 1), P("Name 3 Netflix shows", "Pop Culture", 1), P("Name 3 cricket players", "Pop Culture", 2),
    P("Name 3 songs everyone knows", "Pop Culture", 2), P("Name 3 famous Michaels", "Pop Culture", 2), P("Name 3 board games", "Pop Culture", 1), P("Name 3 video games", "Pop Culture", 1),
    P("Name 3 famous moustaches", "Pop Culture", 3), P("Name 3 Pixar films", "Pop Culture", 2), P("Name 3 boy bands", "Pop Culture", 2), P("Name 3 cartoon dogs", "Pop Culture", 2),
    P("Name 3 countries starting with I", "World", 2), P("Name 3 Australian animals", "World", 1), P("Name 3 cities in India", "World", 1), P("Name 3 things to see in Sydney", "World", 2),
    P("Name 3 airlines", "World", 1), P("Name 3 festivals", "World", 1), P("Name 3 languages spoken in this team", "World", 2), P("Name 3 car brands", "World", 1),
    P("Name 3 islands", "World", 2), P("Name 3 currencies", "World", 2), P("Name 3 things you pack for a beach trip", "World", 1), P("Name 3 capital cities in Asia", "World", 2),
    P("Name 3 things you'd grab in a fire", "Chaos", 2), P("Name 3 uses for a paperclip", "Chaos", 2), P("Name 3 things under your bed", "Chaos", 1), P("Name 3 excuses for being late", "Chaos", 1),
    P("Name 3 things in your wallet", "Chaos", 1), P("Name 3 things you plug in", "Chaos", 1), P("Name 3 animals with horns", "Chaos", 2), P("Name 3 things that are yellow", "Chaos", 1),
    P("Name 3 sports played with a ball", "Chaos", 1), P("Name 3 jobs you wanted as a kid", "Chaos", 1), P("Name 3 things in a first-aid kit", "Chaos", 2), P("Name 3 kinds of tea", "Chaos", 1),
    P("Name 3 things you do on a Sunday", "Chaos", 1), P("Name 3 wedding gifts", "Chaos", 2), P("Name 3 things you whisper", "Chaos", 3), P("Name 3 password rules", "Chaos", 2),
    P("Name 3 excuses that never work", "Chaos", 2), P("Name 3 things a cat would say in a standup", "Chaos", 3), P("Name 3 things you should never microwave", "Chaos", 2), P("Name 3 uses for leftover cold chai", "Chaos", 3),
    P("Name 3 reasons people clap when a plane lands", "Chaos", 3), P("Name 3 sounds a dial-up modem makes", "Chaos", 3), P("Name 3 things people say to their plants", "Chaos", 2), P("Name 3 things grandmas always say", "Family", 2),
    P("Name 3 things you'd buy if you won the lottery", "Dreams", 1), P("Name 3 things you'd do if the internet died forever", "Dreams", 2), P("Name 3 places you'd teleport to right now", "Dreams", 1),
    P("Name 3 things you pretend to understand", "Confessions", 2), P("Name 3 songs you sing in the shower", "Confessions", 2), P("Name 3 things you hide when guests visit", "Confessions", 2), P("Name 3 lies on every resume", "Confessions", 3),
    P("Name 3 things that smell like childhood", "Confessions", 3), P("Name 3 things you always forget to buy", "Confessions", 1),
  ], [
    { key: "text", label: "Prompt", type: "text", required: true },
  ]);
})();
