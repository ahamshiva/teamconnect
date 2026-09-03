/* src/content/wronganswers.js  Wrong Answers Only: teams compete for the funniest wrong answer, then learn the real one */
(function () {
  "use strict";
  window.TCL.Content.registerBank("wronganswers", [
    /* ---------- Origins ---------- */
    { text: "Why do we say 'bless you' after a sneeze?", answer: "Most likely from the belief that a sneeze could expel the soul or let in evil; Pope Gregory I is often credited with popularising it during a 6th-century plague.", fun: "There is no single proven origin, which is why every family has its own story.", category: "Origins", difficulty: 2 },

    { text: "Why do we shake hands?", answer: "The popular story is that an open right hand showed you carried no weapon. The gesture appears in Greek art from the 5th century BC, usually to seal an agreement.", fun: "Quakers helped spread it as an equal alternative to bowing and hat tipping.", category: "Origins", difficulty: 1 },

    { text: "Why do we blow out candles on a birthday cake?", answer: "Usually traced to German Kinderfeste in the 1700s, where a candle burned all day for a child's birthday. The wish and the group blowing came later as folk custom.", fun: "The 'Happy Birthday' song only became the standard soundtrack in the 20th century.", category: "Origins", difficulty: 2 },

    { text: "Why is a wedding ring worn on the fourth finger?", answer: "From a Roman belief in the vena amoris, a vein supposedly running from that finger straight to the heart. The anatomy is wrong, but the custom outlived the theory.", fun: "Plenty of countries wear it on the right hand instead.", category: "Origins", difficulty: 2 },

    { text: "Why do we say 'hello' when we answer the phone?", answer: "Thomas Edison pushed 'hello' as the standard greeting. Alexander Graham Bell preferred 'ahoy'. Early telephone handbooks printed hello, and it won.", fun: "'Ahoy' survives only as a joke, which feels like a loss.", category: "Origins", difficulty: 2 },

    { text: "Why do people knock on wood for luck?", answer: "Probably from older European folk beliefs about spirits or protective power in trees, but the phrase is only clearly documented from the 1800s, so the trail goes cold.", fun: "Some countries knock on wood, others touch iron, for the same reason.", category: "Origins", difficulty: 3 },

    /* ---------- Language ---------- */
    { text: "What is the plural of octopus?", answer: "Octopuses is standard English; octopodes follows the Greek root; octopi is a mistaken Latin form that stuck.", fun: "All three are in the dictionary, so the argument never ends.", category: "Language", difficulty: 1 },

    { text: "Why is 'colonel' spelled with an l but said with an r?", answer: "English borrowed the French coronel, then scholars 'corrected' the spelling back to the Italian colonnello. The old pronunciation refused to change with it.", fun: "So you are saying the French version and writing the Italian one.", category: "Language", difficulty: 3 },

    { text: "Where does the word 'OK' come from?", answer: "Best evidence points to an 1839 Boston newspaper joke abbreviating 'oll korrect', a deliberate misspelling. A campaign slogan a year later spread it nationally.", fun: "It may be the most widely understood word on Earth.", category: "Language", difficulty: 2 },

    { text: "Why do eleven and twelve break the pattern of the teens?", answer: "They come from Old English endleofan and twelf, roughly 'one left' and 'two left' after counting ten. From thirteen on, English switched to the regular teen pattern.", fun: "German, Dutch and the Nordic languages do the same thing.", category: "Language", difficulty: 3 },

    { text: "Why can 'literally' now mean figuratively?", answer: "It has been used as an intensifier since at least the 1700s, including by Dickens and Twain. Dictionaries record how people use words, they do not grant permission.", fun: "'Really' and 'truly' quietly did exactly the same thing centuries ago.", category: "Language", difficulty: 2 },

    /* ---------- Science ---------- */
    { text: "Why is the sky blue?", answer: "Air molecules scatter short blue wavelengths far more than long red ones, so blue light arrives at your eye from all over the sky.", fun: "Sunsets go red because the light travels through much more air to reach you.", category: "Science", difficulty: 1 },

    { text: "Why do we get goosebumps?", answer: "Tiny muscles at the base of each hair contract and pull it upright. In furrier ancestors that trapped warmth or made them look bigger. In us it does almost nothing.", fun: "It is one of the clearest leftovers of evolution you can watch in real time.", category: "Science", difficulty: 1 },

    { text: "Why does cutting an onion make you cry?", answer: "Cutting ruptures cells and mixes enzymes with sulfur compounds, producing syn-propanethial-S-oxide. It reaches your eye, irritates it, and tears flush it out.", fun: "Chilling the onion slows the reaction, which is why the fridge trick works.", category: "Science", difficulty: 2 },

    { text: "Why can't you tickle yourself?", answer: "The cerebellum predicts the sensation your own hand will produce and dampens the response. Tickling depends on surprise, and you cannot surprise yourself.", fun: "Researchers built a delayed robotic tickling arm, and it worked.", category: "Science", difficulty: 2 },

    { text: "Why is the ocean salty?", answer: "Rain slowly weathers rock on land and rivers carry the dissolved minerals to the sea. Water evaporates and the salts stay behind. Undersea vents add more.", fun: "Rivers are technically salty too, just far too weakly for you to notice.", category: "Science", difficulty: 2 },

    /* ---------- Tech ---------- */
    { text: "What does 'Wi-Fi' stand for?", answer: "Nothing. A branding agency coined it in 1999 because it sounded better than 'IEEE 802.11b Direct Sequence'. 'Wireless Fidelity' was a tagline bolted on afterwards.", fun: "The industry group later dropped the tagline because it meant nothing.", category: "Tech", difficulty: 2 },

    { text: "Why is the keyboard laid out QWERTY?", answer: "Christopher Sholes arranged it in the 1870s to separate common letter pairs so mechanical typebars jammed less, with input from telegraph operators.", fun: "The story that it was designed to slow typists down is a myth.", category: "Tech", difficulty: 1 },

    { text: "Why does an email address use the @ symbol?", answer: "Ray Tomlinson chose it in 1971 because it was already on the keyboard, never appeared in people's names, and in accounting it already meant 'at the rate of'.", fun: "Other languages call it snail, monkey tail, or elephant trunk.", category: "Tech", difficulty: 2 },

    { text: "Why is a software fault called a 'bug'?", answer: "Engineers used 'bug' for unexplained faults from the 1870s onward. The 1947 moth taped into Harvard's Mark II logbook is famous precisely because the joke already existed.", fun: "The logbook entry reads 'first actual case of bug being found'.", category: "Tech", difficulty: 2 },

    { text: "Why do phone keypads count down while calculators count up?", answer: "Bell Labs tested layouts in the 1950s and found 1-2-3 on the top row faster and less error prone for rotary dial users. Calculators kept the older adding machine order.", fun: "Two devices in the same pocket, two opposite layouts, both deliberate.", category: "Tech", difficulty: 3 },

    /* ---------- Food ---------- */
    { text: "Why does coriander taste like soap to some people?", answer: "Variants near the OR6A2 olfactory receptor gene make some people unusually sensitive to the aldehydes in coriander, and those same compounds appear in soap.", fun: "It is genuinely genetic, so the argument at lunch is unwinnable.", category: "Food", difficulty: 2 },

    { text: "Why is a sandwich called a sandwich?", answer: "Named for John Montagu, 4th Earl of Sandwich, who in the 1760s reportedly asked for meat between bread so he could keep working. The story comes from a traveller's account.", fun: "He was working, not gambling, according to his own family.", category: "Food", difficulty: 1 },

    { text: "Why does bread go stale faster in the fridge?", answer: "Staling is starch retrogradation, and it runs fastest just above freezing. A fridge sits right in that range, so bread firms up quicker than it would on the bench.", fun: "The freezer skips past the bad zone, which is why frozen bread keeps well.", category: "Food", difficulty: 3 },

    { text: "Why does pineapple make your mouth tingle?", answer: "Bromelain, a protein digesting enzyme, briefly breaks down proteins on your tongue and lips. It is mild and harmless, and heat destroys it.", fun: "This is why tinned pineapple never tingles.", category: "Food", difficulty: 2 },

    { text: "Why is chocolate wrapped in foil?", answer: "Foil blocks light, air and other smells, and it folds to shape without glue. Cocoa butter absorbs nearby odours easily, so a sealed wrap protects the flavour.", fun: "Chocolate stored next to onions really does taste like onions.", category: "Food", difficulty: 2 },

    /* ---------- Australia ---------- */
    { text: "Why do Australians call flip-flops thongs?", answer: "'Thong' is an old English word for a narrow strip of leather. Australians applied it to the toe strap of the rubber sandal. The underwear sense arrived much later.", fun: "This causes a memorable misunderstanding in almost every global team call.", category: "Australia", difficulty: 1 },

    { text: "Why does Australia have a Big Banana and a Big Merino?", answer: "Roadside 'Big Things' began with the Big Banana at Coffs Harbour in 1964, built to stop highway traffic at a fruit stall. It worked, and copies spread everywhere.", fun: "There are now more than 150 of them scattered around the country.", category: "Australia", difficulty: 2 },

    { text: "Why do Australians shorten every word, like arvo and servo?", answer: "Linguists call these hypocoristics. Australian English uses the -o and -ie endings unusually productively, and researchers have catalogued several thousand of them.", fun: "Even 'Australian' becomes 'Straya', which is peak commitment.", category: "Australia", difficulty: 2 },

    { text: "Why do magpies swoop people in spring?", answer: "A small minority of males defend the nest for roughly six weeks while chicks are vulnerable. They target individuals they judge a threat and can remember faces for years.", fun: "Most magpies never swoop anyone at all.", category: "Australia", difficulty: 2 },

    /* ---------- India ---------- */
    { text: "Why is Gurugram called Gurugram?", answer: "Renamed from Gurgaon in 2016. The name follows the long standing tradition that the area was land granted to Dronacharya, the teacher, or guru, of the Mahabharata.", fun: "'Gram' means village, which is a fair distance from today's skyline.", category: "India", difficulty: 2 },

    { text: "Why do Mumbai dabbawalas almost never lose a lunch box?", answer: "A short code of colours and symbols on each lid encodes origin station, destination building and floor. A relay of carriers reads it, no smartphones required.", fun: "Business schools have studied the error rate for decades.", category: "India", difficulty: 2 },

    { text: "Why does Indian English use the word 'prepone'?", answer: "English had postpone but no clean opposite, so Indian English built one by symmetry. It is useful enough that the Oxford English Dictionary added it in 2010.", fun: "Most people who hear it once start using it immediately.", category: "India", difficulty: 1 },

    { text: "Why does India have only one time zone?", answer: "Indian Standard Time is fixed at UTC plus 5:30, set on a longitude near Mirzapur so the whole country coordinates on one clock, even though sunrise varies by about two hours.", fun: "The half hour offset is why India's clock never matches yours neatly.", category: "India", difficulty: 3 },

    /* ---------- Philippines ---------- */
    { text: "Why do jeepneys look like that?", answer: "Surplus military jeeps left after 1945 were stretched, roofed and fitted with benches to carry passengers. Owners added chrome, paint and ornaments, and it became a craft.", fun: "No two are decorated the same way, by design.", category: "Philippines", difficulty: 2 },

    { text: "Why do Filipinos point with their lips?", answer: "Lip pointing is a common gesture across the Philippines and parts of Southeast Asia. It is faster than lifting a hand and considered gentler than pointing a finger.", fun: "It also works beautifully when both your hands are full.", category: "Philippines", difficulty: 2 },

    { text: "Why is there a whole word for gifts brought home from a trip?", answer: "Pasalubong comes from the root meaning to welcome someone back. Travel was slow and rare, so returning with something for those who waited became an expected courtesy.", fun: "Coming home empty handed is still quietly noticed.", category: "Philippines", difficulty: 2 },

    /* ---------- China ---------- */
    { text: "Why is the number 4 unlucky in Chinese?", answer: "The word for four, si, sounds close to the word for death. Many buildings skip the 4th, 14th and 24th floors. Eight is lucky because it sounds like the word for prosperity.", fun: "Phone numbers and licence plates full of eights sell for real money.", category: "China", difficulty: 1 },

    { text: "Why do people say 'add oil' to encourage someone?", answer: "Jiayou literally means add fuel, borrowed from motor racing imagery, and became a general cheer meaning keep going. The literal English form entered the OED in 2018.", fun: "It is shouted at marathons, exams and deadlines alike.", category: "China", difficulty: 2 },

    { text: "Why are Chinese gift envelopes red?", answer: "Red signals luck and celebration in Chinese custom. The envelope also keeps the amount private, so the gift stays about the good wish rather than the number inside.", fun: "Digital red packets now move billions of transfers each New Year.", category: "China", difficulty: 1 },

    { text: "Why are Chinese dishes served in the middle to share?", answer: "Communal dishes with individual rice bowls keep food hot on the table, spread variety across everyone, and let portions adjust to appetite. Lazy Susans spread this in the 1900s.", fun: "Ordering for the table is a skill, and someone at your table has it.", category: "China", difficulty: 2 },

    /* ---------- Office ---------- */
    { text: "Why are meetings always 30 or 60 minutes long?", answer: "Calendar software defaults to round blocks, and Parkinson's law does the rest: work expands to fill the time allowed. Almost no meeting genuinely needs exactly an hour.", fun: "Teams that switched to 25 and 50 minute defaults report losing nothing.", category: "Office", difficulty: 1 },

    { text: "Why is arguing over trivia called 'bikeshedding'?", answer: "From C. Northcote Parkinson's 1957 example: a committee waves through a nuclear plant in minutes, then debates the staff bicycle shed for hours because everyone understands sheds.", fun: "The harder the topic, the quieter the room.", category: "Office", difficulty: 2 },

    { text: "Why do stand-up meetings involve standing?", answer: "Standing is meant to keep the meeting short by making it mildly uncomfortable. The format comes from military briefings and was adopted by software teams in the 1990s.", fun: "Video call stand-ups quietly removed the one mechanism that made it work.", category: "Office", difficulty: 2 },
  ], [
    { key: "text", label: "Question", type: "textarea", required: true },
    { key: "answer", label: "The real answer", type: "textarea", required: true },
    { key: "fun", label: "One-line fun fact to read after the reveal (optional)", type: "text", required: false },
  ]);
})();
