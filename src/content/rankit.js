/* src/content/rankit.js  Rank It Together scenarios */
(function () {
  "use strict";
  window.TCL.Content.registerBank("rankit", [
    /* ---------- Objective: there is a correct order ---------- */
    { text: "Rank these planets by distance from the Sun, closest first", items: ["Mars", "Mercury", "Jupiter", "Earth", "Venus"], answer: ["Mercury", "Venus", "Earth", "Mars", "Jupiter"], mode: "objective", category: "Science", difficulty: 1, note: "Going outwards from the Sun: Mercury, Venus, Earth, Mars, Jupiter. Saturn, Uranus and Neptune come after these five." },

    { text: "Rank these oceans by area, largest first", items: ["Indian Ocean", "Arctic Ocean", "Pacific Ocean", "Southern Ocean", "Atlantic Ocean"], answer: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Southern Ocean", "Arctic Ocean"], mode: "objective", category: "Geography", difficulty: 2, note: "Rough areas in million square kilometres: Pacific 165, Atlantic 85, Indian 70, Southern 20, Arctic 14. The Pacific alone is bigger than all the land on Earth." },

    { text: "Rank these mountains by height above sea level, tallest first", items: ["Denali", "K2", "Mont Blanc", "Mount Everest", "Kangchenjunga"], answer: ["Mount Everest", "K2", "Kangchenjunga", "Denali", "Mont Blanc"], mode: "objective", category: "Geography", difficulty: 2, note: "Heights in metres: Everest 8849, K2 8611, Kangchenjunga 8586, Denali 6190, Mont Blanc 4808. The top three are all in Asia and within 300 metres of each other." },

    { text: "Rank these countries by total land area, largest first", items: ["Australia", "China", "Russia", "India", "Canada"], answer: ["Russia", "Canada", "China", "Australia", "India"], mode: "objective", category: "Geography", difficulty: 2, note: "Rough areas in million square kilometres: Russia 17.1, Canada 10.0, China 9.6, Australia 7.7, India 3.3. Russia is bigger than the other four put together." },

    { text: "Rank these by top recorded speed, fastest first", items: ["Cheetah", "Giant tortoise", "Peregrine falcon", "Racehorse", "Sprinting human"], answer: ["Peregrine falcon", "Cheetah", "Racehorse", "Sprinting human", "Giant tortoise"], mode: "objective", category: "Science", difficulty: 1, note: "Rough top speeds in km/h: peregrine falcon about 390 in a dive, cheetah about 110, racehorse about 70, fastest human about 45, giant tortoise under 1. The falcon only hits that speed diving, not in level flight." },

    { text: "Rank these inventions by the year they arrived, earliest first", items: ["Television", "Printing press", "World Wide Web", "Telephone", "Handheld mobile phone"], answer: ["Printing press", "Telephone", "Television", "Handheld mobile phone", "World Wide Web"], mode: "objective", category: "History", difficulty: 2, note: "Printing press about 1440, telephone 1876, television 1927, first handheld mobile call 1973, World Wide Web proposed 1989. Note the gap: over 400 years between the first two, then everything else in about a century." },

    { text: "Rank these units of time from shortest to longest", items: ["Hour", "Millisecond", "Week", "Minute", "Second", "Day"], answer: ["Millisecond", "Second", "Minute", "Hour", "Day", "Week"], mode: "objective", category: "Science", difficulty: 1, note: "A millisecond is a thousandth of a second. After that each step is 60, 60, 24, then 7. Good warm up round, almost everyone gets it." },

    { text: "Put the steps of making a cup of chai in order", items: ["Pour in the milk", "Strain into cups", "Boil water with the tea leaves", "Simmer until the colour is right", "Add ginger and cardamom"], answer: ["Boil water with the tea leaves", "Add ginger and cardamom", "Pour in the milk", "Simmer until the colour is right", "Strain into cups"], mode: "objective", category: "Food", difficulty: 1, note: "Water and leaves first, spices while it boils, then milk, then a simmer, then strain. Plenty of families add the milk earlier or later, so if someone argues for their household order, let them make the case. That argument is usually the best part of the round." },

    { text: "Rank these tournaments by when they were first held, earliest first", items: ["First Cricket World Cup", "First Rugby World Cup", "First modern Olympic Games", "First FIFA World Cup"], answer: ["First modern Olympic Games", "First FIFA World Cup", "First Cricket World Cup", "First Rugby World Cup"], mode: "objective", category: "History", difficulty: 3, note: "Modern Olympics 1896, FIFA World Cup 1930, Cricket World Cup 1975, Rugby World Cup 1987. Most teams get the Olympics right and then argue about the last two." },

    /* ---------- Opinion: no correct order, the debate is the point ---------- */
    { text: "Rank these pizza toppings from most to least essential", items: ["Cheese", "Mushroom", "Pineapple", "Chilli", "Olives"], answer: null, mode: "opinion", category: "Food", difficulty: 1 },

    { text: "Rank these video call habits from most to least annoying", items: ["Eating a full meal on camera", "Talking for a minute while muted", "Typing loudly through the whole call", "Joining five minutes late every time", "Asking a very long question at the end"], answer: null, mode: "opinion", category: "Office", difficulty: 1 },

    { text: "Rank these superpowers by how useful they would be on a Monday morning", items: ["Refilling your coffee by thinking about it", "Always reading the room correctly", "Pausing time for ten minutes", "Clearing your inbox in one blink", "Never forgetting a name"], answer: null, mode: "opinion", category: "Fun", difficulty: 2 },

    { text: "Rank these office snacks from most to least essential", items: ["Biscuits", "Fresh fruit", "Chips", "Chocolate", "Roasted nuts"], answer: null, mode: "opinion", category: "Office", difficulty: 1 },

    { text: "Rank these ways to spend a free Sunday, best first", items: ["A long sleep in", "Cooking something slow", "Getting out into nature", "Catching up with family", "Doing absolutely nothing"], answer: null, mode: "opinion", category: "Fun", difficulty: 1 },

    { text: "Rank these desk drawer items by how much you would miss them", items: ["A spare charging cable", "A pen that actually works", "An emergency snack", "Headphones", "Sticky notes", "Hand cream"], answer: null, mode: "opinion", category: "Office", difficulty: 2 },

    { text: "Rank these comfort foods after a very long day, best first", items: ["A bowl of hot noodles", "Rice and dal", "A toasted cheese sandwich", "Dumplings", "Ice cream straight from the tub"], answer: null, mode: "opinion", category: "Food", difficulty: 1 },
  ], [
    { key: "text", label: "Scenario", type: "textarea", required: true },
    { key: "items", label: "Items to rank", type: "list", required: true },
    { key: "answer", label: "Correct order (objective only)", type: "list", required: false },
    { key: "mode", label: "Mode: objective or opinion", type: "text", required: true },
    { key: "note", label: "Facilitator note", type: "text", required: false },
  ]);
})();
