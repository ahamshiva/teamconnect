/* src/content/charades.js  Reverse Charades words. */
(function () {
  "use strict";
  const W = (text, category, difficulty) => ({ text, category, difficulty: difficulty || 2 });
  window.TCL.Content.registerBank("charades", [
    W("Making chai", "Actions", 1), W("Brushing teeth", "Actions", 1), W("Bowling", "Actions", 1), W("Taking a selfie", "Actions", 1),
    W("Parallel parking", "Actions", 2), W("Losing your keys", "Actions", 2), W("Walking a dog", "Actions", 1), W("Doing yoga", "Actions", 1),
    W("Juggling", "Actions", 1), W("Ironing a shirt", "Actions", 2), W("Fishing", "Actions", 1), W("Milking a cow", "Actions", 2),
    W("Changing a flat tyre", "Actions", 2), W("Blowing out birthday candles", "Actions", 1), W("Building a sandcastle", "Actions", 2), W("Assembling flat-pack furniture", "Actions", 3),
    W("Video call frozen", "Office Life", 2), W("Printer jam", "Office Life", 2), W("Monday standup", "Office Life", 2), W("Pretending to take notes", "Office Life", 2),
    W("Reply-all disaster", "Office Life", 3), W("Coffee machine broken", "Office Life", 2), W("Falling asleep in a meeting", "Office Life", 1),
    W("IT asking 'did you restart it?'", "Office Life", 3), W("Deadline panic", "Office Life", 2), W("Forgot to unmute", "Office Life", 1), W("Laptop battery dying", "Office Life", 2),
    W("Hunting for a meeting room", "Office Life", 2), W("Spilling coffee on the keyboard", "Office Life", 1),
    W("Kangaroo", "Animals", 1), W("Penguin", "Animals", 1), W("Elephant", "Animals", 1), W("Peacock", "Animals", 2),
    W("Monkey", "Animals", 1), W("Snake", "Animals", 1), W("Chicken", "Animals", 1), W("Sloth", "Animals", 2),
    W("Octopus", "Animals", 2), W("T-Rex", "Animals", 1), W("Koala", "Animals", 2), W("Giraffe", "Animals", 1), W("Crab", "Animals", 2),
    W("Eating spicy food", "Food", 1), W("Making a sandwich", "Food", 1), W("Burnt toast", "Food", 2), W("Eating noodles", "Food", 1),
    W("Peeling onions and crying", "Food", 1), W("Popcorn popping", "Food", 2), W("Rolling dumplings", "Food", 2), W("Flipping a dosa", "Food", 2), W("Eating a whole durian", "Food", 3),
    W("Harry Potter", "Movies & TV", 2), W("Baahubali", "Movies & TV", 2), W("Mr. Bean", "Movies & TV", 1), W("James Bond", "Movies & TV", 1),
    W("Titanic (the pose)", "Movies & TV", 1), W("Slow-motion action scene", "Movies & TV", 2), W("Zombie", "Movies & TV", 1), W("Superman", "Movies & TV", 1),
    W("Kung Fu Panda", "Movies & TV", 2), W("Frozen (Let It Go)", "Movies & TV", 2), W("Squid Game red light green light", "Movies & TV", 2),
    W("Tai chi in the park", "World", 2), W("Dragon dance", "World", 2), W("Playing mahjong", "World", 3), W("Panda eating bamboo", "World", 1),
    W("Videoke marathon", "World", 2), W("Jeepney driver", "World", 3), W("Basketball buzzer-beater", "World", 2), W("Making dumplings", "World", 2),
    W("Bollywood dance number", "World", 1), W("Surfing at Bondi", "World", 2), W("Cricket umpire signalling six", "World", 2), W("Haggling at a market", "World", 3),
    W("Air guitar concert", "Random", 1), W("Traffic jam", "Random", 2), W("Airport security check", "Random", 2), W("Umbrella turning inside out", "Random", 2),
    W("Stepping on Lego", "Random", 1), W("Phone battery at 1%", "Random", 2), W("Mosquito at night", "Random", 1), W("Waiting for the lift", "Random", 2),
    W("Haircut gone wrong", "Random", 2), W("First day at the gym", "Random", 2), W("Karaoke night", "Random", 1), W("Cricket umpire", "Random", 2),
    W("Sneezing in a quiet room", "Random", 1), W("Trying to fold a fitted sheet", "Random", 3), W("Walking into a glass door", "Random", 2), W("Untangling headphones", "Random", 2),
  ], [
    { key: "text", label: "Word or phrase", type: "text", required: true },
  ]);
})();
