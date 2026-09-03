/* src/content/quiz.js  Rapid-Fire Quiz bank */
(function () {
  "use strict";
  window.TCL.Content.registerBank("quiz", [
    /* ---------- Science ---------- */
    { text: "Which planet spins clockwise, the opposite way to almost every other planet?", answer: "Venus", options: ["Mars", "Venus", "Jupiter", "Mercury"], correctIndex: 1, category: "Science", difficulty: 2, note: "Uranus also rotates the odd way round but on its side. Venus is the classic answer." },
    { text: "How many hearts does an octopus have?", answer: "Three", options: ["One", "Two", "Three", "Five"], correctIndex: 2, category: "Science", difficulty: 1, note: "Two pump blood to the gills, one to the rest of the body. Its blood is blue." },
    { text: "Which of these is botanically a berry?", answer: "Banana", options: ["Strawberry", "Raspberry", "Banana", "Cherry"], correctIndex: 2, category: "Science", difficulty: 2, note: "Bananas are berries. Strawberries and raspberries are not." },
    { text: "Which planet is known as the Red Planet?", answer: "Mars", options: ["Venus", "Mars", "Mercury", "Saturn"], correctIndex: 1, category: "Science", difficulty: 1 },
    { text: "About how long does sunlight take to reach Earth?", answer: "8 minutes", options: ["8 seconds", "8 hours", "80 minutes", "8 minutes"], correctIndex: 3, category: "Science", difficulty: 2, note: "So you always see the Sun as it was about eight minutes ago." },
    { text: "Which metal is a liquid at room temperature?", answer: "Mercury", options: ["Mercury", "Lead", "Tin", "Zinc"], correctIndex: 0, category: "Science", difficulty: 2 },

    /* ---------- Geography ---------- */
    { text: "Which mountain has the highest peak above sea level?", answer: "Mount Everest", options: ["K2", "Denali", "Kilimanjaro", "Mount Everest"], correctIndex: 3, category: "Geography", difficulty: 1, note: "Measured from its base, Mauna Kea in Hawaii is taller. Everest wins on sea level." },
    { text: "By most measurements, which is the world's longest river?", answer: "Nile", options: ["Amazon", "Yangtze", "Nile", "Mississippi"], correctIndex: 2, category: "Geography", difficulty: 2, note: "Some studies argue for the Amazon, so this one still gets debated." },
    { text: "Which two countries share the longest land border in the world?", answer: "The USA and Canada", options: ["Russia and China", "India and Bangladesh", "Argentina and Chile", "The USA and Canada"], correctIndex: 3, category: "Geography", difficulty: 2 },
    { text: "Which is the largest country in the world by land area?", answer: "Russia", options: ["Canada", "China", "Russia", "Brazil"], correctIndex: 2, category: "Geography", difficulty: 1 },
    { text: "Which country sits across the Tasman Sea from Australia?", answer: "New Zealand", options: ["Fiji", "Indonesia", "New Zealand", "Papua New Guinea"], correctIndex: 2, category: "Geography", difficulty: 1 },
    { text: "Which country has more ancient pyramids than Egypt?", answer: "Sudan", options: ["Sudan", "Libya", "Ethiopia", "Morocco"], correctIndex: 0, category: "Geography", difficulty: 3, note: "The Nubian pyramids of Sudan number in the hundreds. Smaller, steeper, far less famous." },

    /* ---------- Tech ---------- */
    { text: "What does Wi-Fi stand for?", answer: "Nothing, it is just a brand name", options: ["Wireless Fidelity", "Wireless Frequency", "Wide Fidelity", "Nothing, it is just a brand name"], correctIndex: 3, category: "Tech", difficulty: 2, note: "A branding agency made it up because it sounded like Hi-Fi." },
    { text: "Which company owns YouTube?", answer: "Google", options: ["Google", "Meta", "Microsoft", "Amazon"], correctIndex: 0, category: "Tech", difficulty: 1 },
    { text: "In which year was the first iPhone released?", answer: "2007", options: ["2005", "2007", "2009", "2011"], correctIndex: 1, category: "Tech", difficulty: 1 },
    { text: "What did the world's first text message, sent in 1992, say?", answer: "Merry Christmas", options: ["Hello world", "Test message", "Merry Christmas", "Can you hear me"], correctIndex: 2, category: "Tech", difficulty: 2, note: "It was sent from a computer to a phone. The phone could not reply." },
    { text: "What does the http in a web address stand for?", answer: "HyperText Transfer Protocol", options: ["HyperText Transfer Protocol", "High Transfer Text Process", "Hyperlink Transport Protocol", "Home Text Transfer Path"], correctIndex: 0, category: "Tech", difficulty: 2 },
    { text: "What was Google originally called when it started as a research project?", answer: "BackRub", options: ["Searchly", "WebCrawl", "Googol", "BackRub"], correctIndex: 3, category: "Tech", difficulty: 3, note: "Named after how it analysed back links. Renaming it was a good call." },

    /* ---------- Food ---------- */
    { text: "Which food has been found thousands of years old and still edible?", answer: "Honey", options: ["Rice", "Honey", "Dried beans", "Salted pork"], correctIndex: 1, category: "Food", difficulty: 2, note: "Honey found in ancient Egyptian tombs was still good. It does not spoil." },
    { text: "Which spice is the most expensive in the world by weight?", answer: "Saffron", options: ["Vanilla", "Cardamom", "Saffron", "Black pepper"], correctIndex: 2, category: "Food", difficulty: 2, note: "It takes thousands of hand-picked crocus flowers to make one kilogram." },
    { text: "Which fruit carries its seeds on the outside?", answer: "Strawberry", options: ["Blueberry", "Kiwi fruit", "Strawberry", "Fig"], correctIndex: 2, category: "Food", difficulty: 1 },
    { text: "Peanuts are not nuts. What are they?", answer: "Legumes", options: ["Berries", "Grains", "Tubers", "Legumes"], correctIndex: 3, category: "Food", difficulty: 3, note: "Same family as peas and beans, and they grow underground." },
    { text: "Which vegetable is a type of thistle?", answer: "Artichoke", options: ["Artichoke", "Celery", "Leek", "Fennel"], correctIndex: 0, category: "Food", difficulty: 3 },

    /* ---------- Pop Culture ---------- */
    { text: "Which artist painted the Mona Lisa?", answer: "Leonardo da Vinci", options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"], correctIndex: 2, category: "Pop Culture", difficulty: 1 },
    { text: "In the US version of The Office, what is the paper company called?", answer: "Dunder Mifflin", options: ["Dunder Mifflin", "Wernham Hogg", "Sabre", "Initech"], correctIndex: 0, category: "Pop Culture", difficulty: 1 },
    { text: "What is the first game played in Squid Game?", answer: "Red Light, Green Light", options: ["Tug of war", "Red Light, Green Light", "Marbles", "Glass bridge"], correctIndex: 1, category: "Pop Culture", difficulty: 1 },
    { text: "What is the name of Superman's home planet?", answer: "Krypton", options: ["Krypton", "Tamaran", "Vulcan", "Asgard"], correctIndex: 0, category: "Pop Culture", difficulty: 1 },
    { text: "Which nickname belongs to Batman?", answer: "The Caped Crusader", options: ["The Dark Detective", "The Caped Crusader", "The Night Watcher", "The Masked Avenger"], correctIndex: 1, category: "Pop Culture", difficulty: 2 },
    { text: "Who provided the voice of Darth Vader in the original Star Wars films?", answer: "James Earl Jones", options: ["James Earl Jones", "Morgan Freeman", "Samuel L. Jackson", "Idris Elba"], correctIndex: 0, category: "Pop Culture", difficulty: 2, note: "David Prowse wore the suit. The voice was dubbed on later." },

    /* ---------- Sport ---------- */
    { text: "How many players from one cricket team are on the field at a time?", answer: "Eleven", options: ["Nine", "Ten", "Eleven", "Twelve"], correctIndex: 2, category: "Sport", difficulty: 1 },
    { text: "In which sport would you perform a slam dunk?", answer: "Basketball", options: ["Basketball", "Volleyball", "Handball", "Netball"], correctIndex: 0, category: "Sport", difficulty: 1 },
    { text: "Which country won the first FIFA World Cup in 1930?", answer: "Uruguay", options: ["Brazil", "Italy", "Uruguay", "Argentina"], correctIndex: 2, category: "Sport", difficulty: 2, note: "They also hosted it, and beat Argentina in the final." },
    { text: "How many rings are on the Olympic flag?", answer: "Five", options: ["Four", "Five", "Six", "Seven"], correctIndex: 1, category: "Sport", difficulty: 1 },
    { text: "What is the highest possible break in a standard frame of snooker?", answer: "147", options: ["100", "155", "180", "147"], correctIndex: 3, category: "Sport", difficulty: 3, note: "Fifteen reds, fifteen blacks, then all the colours in order." },

    /* ---------- Weird World ---------- */
    { text: "What is Scotland's official national animal?", answer: "Unicorn", options: ["Stag", "Golden eagle", "Highland cow", "Unicorn"], correctIndex: 3, category: "Weird World", difficulty: 2, note: "It has been on the royal coat of arms for centuries." },
    { text: "Norway has given a knighthood to which animal?", answer: "A penguin", options: ["A penguin", "A reindeer", "A horse", "A dog"], correctIndex: 0, category: "Weird World", difficulty: 3, note: "Sir Nils Olav, a king penguin at Edinburgh Zoo, is a colonel-in-chief of the Norwegian King's Guard." },
    { text: "In Switzerland it is against the law to keep only one of which pet?", answer: "Guinea pig", options: ["Cat", "Rabbit", "Guinea pig", "Parrot"], correctIndex: 2, category: "Weird World", difficulty: 3, note: "Swiss law treats social animals as needing company, so they come in pairs." },
    { text: "Durian is banned on Singapore's metro because of what?", answer: "Its strong smell", options: ["Its sharp spikes", "Its high price", "Its sticky juice", "Its strong smell"], correctIndex: 3, category: "Weird World", difficulty: 2, note: "There is a no-durian sign on the trains, and it is the only food singled out." },
    { text: "What is a group of flamingos called?", answer: "A flamboyance", options: ["A flock", "A parade", "A blush", "A flamboyance"], correctIndex: 3, category: "Weird World", difficulty: 3 },

    /* ---------- Words ---------- */
    { text: "What does the phrase burning the midnight oil mean?", answer: "Working late into the night", options: ["Wasting money", "Working late into the night", "Cooking slowly", "Arguing loudly"], correctIndex: 1, category: "Words", difficulty: 1 },
    { text: "Which language has the most native speakers in the world?", answer: "Mandarin Chinese", options: ["English", "Spanish", "Mandarin Chinese", "Hindi"], correctIndex: 2, category: "Words", difficulty: 1, note: "English wins on total speakers. Mandarin wins on native speakers." },
    { text: "What is a palindrome?", answer: "A word that reads the same backwards", options: ["A word with no vowels", "A word borrowed from Latin", "A word that reads the same backwards", "A word with silent letters"], correctIndex: 2, category: "Words", difficulty: 2, note: "Level, radar, kayak. Also the name Anna." },
    { text: "The English word shampoo comes from which language?", answer: "Hindi", options: ["Hindi", "Arabic", "Malay", "Portuguese"], correctIndex: 0, category: "Words", difficulty: 3, note: "From champo, meaning to press or massage." },
    { text: "What is the term for a word like buzz or sizzle that sounds like its meaning?", answer: "Onomatopoeia", options: ["Alliteration", "Metaphor", "Homonym", "Onomatopoeia"], correctIndex: 3, category: "Words", difficulty: 2 },

    /* ---------- Brain Teaser ---------- */
    { text: "A farmer has 17 sheep. All but 9 run away. How many are left?", answer: "Nine", options: ["Eight", "Nine", "Seventeen", "None"], correctIndex: 1, category: "Brain Teaser", difficulty: 2, note: "All but 9 means 9 stayed. Most people say 8 the first time." },
    { text: "You are in a race and you overtake the person in second place. What position are you in?", answer: "Second", options: ["First", "Second", "Third", "Last"], correctIndex: 1, category: "Brain Teaser", difficulty: 2, note: "You took their place, so you are second." },
    { text: "Some months have 31 days. How many months have 28 days?", answer: "All twelve", options: ["One", "Two", "Eleven", "All twelve"], correctIndex: 3, category: "Brain Teaser", difficulty: 2, note: "Every month has at least 28 days." },
    { text: "A bat and ball cost 1.10 dollars. The bat costs 1 dollar more than the ball. What is the ball?", answer: "5 cents", options: ["10 cents", "1 cent", "15 cents", "5 cents"], correctIndex: 3, category: "Brain Teaser", difficulty: 3, note: "Ball 5 cents, bat 1.05 dollars. The gap has to be a full dollar." },

    /* ---------- Australia ---------- */
    { text: "What is the capital city of Australia?", answer: "Canberra", options: ["Sydney", "Melbourne", "Canberra", "Perth"], correctIndex: 2, category: "Australia", difficulty: 1 },
    { text: "Which two animals appear on Australia's coat of arms?", answer: "Kangaroo and emu", options: ["Koala and wombat", "Kangaroo and emu", "Dingo and platypus", "Emu and koala"], correctIndex: 1, category: "Australia", difficulty: 1 },
    { text: "What is a group of kangaroos called?", answer: "A mob", options: ["A herd", "A troop", "A pack", "A mob"], correctIndex: 3, category: "Australia", difficulty: 2 },
    { text: "Australia is wider from east to west than which of these?", answer: "The Moon", options: ["The Moon", "Mars", "Jupiter", "Saturn"], correctIndex: 0, category: "Australia", difficulty: 3, note: "About 4,000 km across, against the Moon's 3,475 km diameter." },
    { text: "Which Australian animal produces cube-shaped droppings?", answer: "Wombat", options: ["Koala", "Wombat", "Echidna", "Quokka"], correctIndex: 1, category: "Australia", difficulty: 2, note: "The cubes stack and do not roll away, which helps them mark territory." },

    /* ---------- India ---------- */
    { text: "Which Indian city is known as the Silicon Valley of India?", answer: "Bengaluru", options: ["Hyderabad", "Bengaluru", "Pune", "Chennai"], correctIndex: 1, category: "India", difficulty: 1 },
    { text: "Gurugram was officially known by what name until 2016?", answer: "Gurgaon", options: ["Gurgaon", "Guru Nagar", "Gurdaspur", "Girigram"], correctIndex: 0, category: "India", difficulty: 2, note: "Plenty of people still say Gurgaon out of habit." },
    { text: "How many languages are listed in the Eighth Schedule of India's Constitution?", answer: "Twenty-two", options: ["Fourteen", "Eighteen", "Twenty-two", "Twenty-eight"], correctIndex: 2, category: "India", difficulty: 3 },
    { text: "The Charminar monument stands in which Indian city?", answer: "Hyderabad", options: ["Hyderabad", "Bhopal", "Lucknow", "Jaipur"], correctIndex: 0, category: "India", difficulty: 1 },
    { text: "Roughly how many people work for Indian Railways?", answer: "More than a million", options: ["About 50,000", "About 200,000", "More than ten million", "More than a million"], correctIndex: 3, category: "India", difficulty: 3, note: "One of the largest employers on the planet." },

    /* ---------- Philippines ---------- */
    { text: "The dessert halo-halo takes its name from a Filipino phrase meaning what?", answer: "Mix-mix", options: ["Cold-cold", "Mix-mix", "Sweet-sweet", "Ice-ice"], correctIndex: 1, category: "Philippines", difficulty: 1, note: "You are meant to stir it all together before the first spoonful." },
    { text: "In the Philippines, what is a jeepney?", answer: "A shared road vehicle used for public transport", options: ["A street food stall", "A shared road vehicle used for public transport", "A folk dance", "A harvest festival"], correctIndex: 1, category: "Philippines", difficulty: 1, note: "Famous for the bright paint jobs. No two look the same." },
    { text: "Which dish, simmered in vinegar, soy sauce and garlic, is widely called the national dish of the Philippines?", answer: "Adobo", options: ["Adobo", "Sinigang", "Lechon", "Pancit"], correctIndex: 0, category: "Philippines", difficulty: 1, note: "Every family insists their version is the correct one." },
    { text: "Roughly how many islands make up the Philippines?", answer: "More than 7,000", options: ["About 700", "About 70", "More than 70,000", "More than 7,000"], correctIndex: 3, category: "Philippines", difficulty: 2, note: "The official count is over 7,600." },
    { text: "In the Philippines, what is a home karaoke machine commonly called?", answer: "Videoke", options: ["Videoke", "Kantahan", "Singbox", "Tugtugan"], correctIndex: 0, category: "Philippines", difficulty: 3, note: "Karaoke plus video. It shows the lyrics and scores your singing." },
    { text: "The Chocolate Hills are found on which Philippine island?", answer: "Bohol", options: ["Cebu", "Bohol", "Palawan", "Samar"], correctIndex: 1, category: "Philippines", difficulty: 2, note: "Over a thousand grassy mounds that turn brown in the dry season." },

    /* ---------- China ---------- */
    { text: "How many official time zones does China use?", answer: "One", options: ["One", "Three", "Five", "Eight"], correctIndex: 0, category: "China", difficulty: 2, note: "The country spans about five time zones geographically, but runs on one clock." },
    { text: "Which animal comes first in the Chinese zodiac cycle?", answer: "Rat", options: ["Dragon", "Ox", "Tiger", "Rat"], correctIndex: 3, category: "China", difficulty: 2, note: "The story says the rat hitched a ride on the ox and jumped off at the finish." },
    { text: "What does the phrase yum cha literally mean?", answer: "Drink tea", options: ["Eat well", "Drink tea", "Small plates", "Morning meal"], correctIndex: 1, category: "China", difficulty: 2, note: "The tea is the point. Dim sum is what comes with it." },
    { text: "Which of these was invented in ancient China?", answer: "Paper", options: ["Paper", "Glass", "Concrete", "The wheel"], correctIndex: 0, category: "China", difficulty: 1 },
    { text: "Can the Great Wall of China be seen from space with the naked eye?", answer: "No, it is far too narrow", options: ["Yes, even from the Moon", "Yes, from low orbit with the naked eye", "No, it is far too narrow", "Only when it snows"], correctIndex: 2, category: "China", difficulty: 2, note: "It is long, but only a few metres wide. Astronauts have confirmed you cannot pick it out unaided." },
    { text: "Which Chinese city's name means above the sea?", answer: "Shanghai", options: ["Beijing", "Shanghai", "Shenzhen", "Tianjin"], correctIndex: 1, category: "China", difficulty: 3 },

    /* ---------- Sydney vs Gurugram ---------- */
    { text: "Which Delhi Metro line runs all the way into Gurugram?", answer: "The Yellow Line", options: ["The Blue Line", "The Yellow Line", "The Red Line", "The Violet Line"], correctIndex: 1, category: "Sydney vs Gurugram", difficulty: 2, note: "It ends at Millennium City Centre Gurugram, the station most people still call HUDA City Centre." },
    { text: "Gurugram is widely known by which nickname?", answer: "Millennium City", options: ["Millennium City", "Garden City", "Pink City", "City of Lakes"], correctIndex: 0, category: "Sydney vs Gurugram", difficulty: 1, note: "It picked up the name as glass towers and corporate offices went up through the 1990s and 2000s." },
    { text: "Gurugram sits in which Indian state?", answer: "Haryana", options: ["Haryana", "Uttar Pradesh", "Punjab", "Rajasthan"], correctIndex: 0, category: "Sydney vs Gurugram", difficulty: 1, note: "It borders Delhi, which is why so many people commute across the state line every morning." },
    { text: "In a Sydney pub, what is a schooner?", answer: "A size of beer glass", options: ["A size of beer glass", "A harbour sailing tour", "A meat pie", "A card game"], correctIndex: 0, category: "Sydney vs Gurugram", difficulty: 2, note: "In New South Wales a schooner is about 425 ml. A middy is the smaller one." },
    { text: "Cyber Hub in Gurugram is best known as what?", answer: "A dining and nightlife complex next to the office towers", options: ["A metro interchange", "A cricket stadium", "A dining and nightlife complex next to the office towers", "A government records office"], correctIndex: 2, category: "Sydney vs Gurugram", difficulty: 2, note: "It sits inside DLF Cyber City and is where half of Gurugram's team lunches happen." },
    { text: "In which year did the Sydney Opera House officially open?", answer: "1973", options: ["1963", "1973", "1983", "1993"], correctIndex: 1, category: "Sydney vs Gurugram", difficulty: 2, note: "It opened in October 1973, about ten years late and massively over budget." },
    { text: "What do the letters DLF stand for, as in Gurugram's DLF Cyber City?", answer: "Delhi Land and Finance", options: ["Delhi Land and Finance", "Delhi Logistics Federation", "District Land Fund", "Delhi Luxury Foundation"], correctIndex: 0, category: "Sydney vs Gurugram", difficulty: 3, note: "The company predates modern Gurugram and built much of it." },
    { text: "The Sydney Harbour Bridge has which well-worn local nickname?", answer: "The Coathanger", options: ["The Coathanger", "The Big Arch", "The Iron Lady", "The Rainbow"], correctIndex: 0, category: "Sydney vs Gurugram", difficulty: 2, note: "Look at the arch side on and you cannot unsee it." },
    { text: "Which airport do people flying into Gurugram normally use?", answer: "Indira Gandhi International Airport", options: ["Kempegowda International Airport", "Indira Gandhi International Airport", "Rajiv Gandhi International Airport", "Chhatrapati Shivaji Maharaj International Airport"], correctIndex: 1, category: "Sydney vs Gurugram", difficulty: 2, note: "Delhi's airport is the closest one, and on a good run it is a short drive from Gurugram." },
    { text: "Bondi is best known as what?", answer: "A beach in Sydney", options: ["A wine region", "A beach in Sydney", "A mountain range", "A rugby stadium"], correctIndex: 1, category: "Sydney vs Gurugram", difficulty: 1, note: "Bondi Beach, and the coastal walk from Bondi to Coogee." },
    { text: "Who designed the Sydney Opera House?", answer: "Jorn Utzon", options: ["Frank Gehry", "Renzo Piano", "Jorn Utzon", "Zaha Hadid"], correctIndex: 2, category: "Sydney vs Gurugram", difficulty: 3, note: "The Danish architect won an open competition and later left the project before it was finished." },
    { text: "Kingfisher is a famous Indian brand of what?", answer: "Beer", options: ["Tea", "Beer", "Motorbikes", "Soap"], correctIndex: 1, category: "Sydney vs Gurugram", difficulty: 1 },
    { text: "In Sydney, visitors can take a guided climb to the top of which structure?", answer: "The Harbour Bridge arch", options: ["The Opera House roof", "The Harbour Bridge arch", "The Sydney Tower spire", "The Anzac Bridge cables"], correctIndex: 1, category: "Sydney vs Gurugram", difficulty: 2, note: "BridgeClimb has been running since 1998. You are harnessed to the structure the whole way." },
    { text: "The MCG, one of the largest cricket grounds in the world, is in which city?", answer: "Melbourne", options: ["Sydney", "Melbourne", "Brisbane", "Adelaide"], correctIndex: 1, category: "Sydney vs Gurugram", difficulty: 2, note: "Melbourne Cricket Ground. Sydney has the SCG, which is a different and smaller ground." },
  ], [
    { key: "text", label: "Question", type: "textarea", required: true },
    { key: "answer", label: "Answer", type: "text", required: true },
    { key: "options", label: "Multiple-choice options (4)", type: "list", required: false },
    { key: "correctIndex", label: "Index of correct option (0-3)", type: "number", required: false },
    { key: "note", label: "Facilitator note", type: "text", required: false },
  ]);
})();
