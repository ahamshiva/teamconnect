/* src/content/balderdash.js  Fake Definitions (Balderdash style): teams invent definitions for an obscure word, vote for the real one */
(function () {
  "use strict";
  window.TCL.Content.registerBank("balderdash", [
    /* ---------- Australia ---------- */
    { text: "Arvo", answer: "The afternoon (Australian slang).", decoys: ["A small esky used for carrying bait.", "The gap between two surf breaks."], hint: "You hear it every day after lunch", category: "Australia", difficulty: 1 },

    { text: "Servo", answer: "A petrol station, especially one with a shop attached (Australian slang).", decoys: ["A junior member of a surf lifesaving club.", "A shortcut between two suburban streets."], hint: "You stop here on a road trip", category: "Australia", difficulty: 1 },

    { text: "Maccas", answer: "McDonald's. The nickname is so standard that the chain has used it on Australian store signs.", decoys: ["A tray of mixed sandwiches ordered for a meeting.", "The last bus of the night in Sydney."], hint: "Golden arches", category: "Australia", difficulty: 1 },

    { text: "Bogan", answer: "Australian slang for someone with rough or unfashionable tastes, very often used affectionately or about oneself.", decoys: ["A wide brimmed hat worn by farm workers.", "A dry creek bed that floods after heavy rain."], hint: "Say it with a grin", category: "Australia", difficulty: 1 },

    { text: "Dunny", answer: "A toilet, originally an outdoor one in the backyard (Australian slang).", decoys: ["A small shed for storing garden tools.", "A round of drinks bought for a whole table."], hint: "Down the back of the yard", category: "Australia", difficulty: 2 },

    { text: "The Coathanger", answer: "The Sydney Harbour Bridge. The steel arch looks like a coathanger from the side, and the nickname has stuck since the 1930s.", decoys: ["The curved escalator in Sydney's oldest department store.", "A hairpin bend on the Great Ocean Road."], hint: "Look at its shape from the harbour", category: "Australia", difficulty: 2 },

    { text: "Drop bear", answer: "A completely fictional predatory koala from Australian folklore, invented to tease visitors. It does not exist.", decoys: ["A young koala that has left its mother's pouch.", "A eucalyptus branch that falls without warning."], hint: "Do not believe a word of it", category: "Australia", difficulty: 2 },

    /* ---------- India ---------- */
    { text: "Jugaad", answer: "A frugal, improvised fix or clever workaround (Hindi).", decoys: ["A festival sweet made from jaggery.", "A traditional Rajasthani folk dance."], hint: "Everyday word in Gurugram offices", category: "India", difficulty: 1 },

    { text: "Prepone", answer: "Indian English for moving an event to an earlier time. It is the missing opposite of postpone, and is now in the Oxford English Dictionary.", decoys: ["To brief a team before a client call.", "To pay an invoice ahead of its due date."], hint: "Think about postpone", category: "India", difficulty: 1 },

    { text: "Do the needful", answer: "Indian English for 'please do whatever is required'. Common in older British official writing, still alive in Indian offices.", decoys: ["To sign off on a budget without reading it.", "To hand a task back to the person who raised it."], hint: "Sign-off line in a lot of emails", category: "India", difficulty: 1 },

    { text: "Out of station", answer: "Indian English for being away from your home town or city, travelling (Indian English, from British railway usage).", decoys: ["Working from a client site rather than the office.", "Being off the roster for a shift."], hint: "An out of office reply", category: "India", difficulty: 1 },

    { text: "Timepass", answer: "Indian English for an activity done just to fill time, with no real purpose (Indian English).", decoys: ["An extra ticket bought for a friend at the cinema.", "The break between two innings of a cricket match."], hint: "What you do while waiting", category: "India", difficulty: 2 },

    { text: "Chai-pani", answer: "Literally 'tea and water' (Hindi). A small sum given as a tip or to cover minor expenses.", decoys: ["The mid morning tea break in an Indian office.", "A light snack served before a meal."], hint: "It is about a small amount of money", category: "India", difficulty: 2 },

    { text: "Dabbawala", answer: "A member of the Mumbai network that collects home cooked lunch boxes and delivers them to office workers (Hindi and Marathi).", decoys: ["A street vendor who sells packaged snacks on trains.", "A clerk who stamps and files office paperwork."], hint: "Lunch, on time, every day", category: "India", difficulty: 2 },

    /* ---------- Philippines ---------- */
    { text: "Kilig", answer: "The giddy, butterflies-in-the-stomach feeling of romantic excitement (Filipino).", decoys: ["A small fishing boat used in Palawan.", "A type of woven rice basket."], hint: "Ask the Filipino teammates", category: "Philippines", difficulty: 2 },

    { text: "Jeepney", answer: "A shared public minibus in the Philippines, decorated brightly and originally built from surplus military jeeps (Filipino).", decoys: ["A roadside stall selling grilled skewers.", "A shortcut route through a Manila neighbourhood."], hint: "You ride in one", category: "Philippines", difficulty: 1 },

    { text: "Tita", answer: "Aunt (Filipino), also used warmly or jokingly for any older woman family friend.", decoys: ["A small serving of rice given to a guest.", "A charm worn on a bracelet for luck."], hint: "Family word, used far beyond family", category: "Philippines", difficulty: 1 },

    { text: "Bahala na", answer: "'Come what may' (Filipino). Going ahead and leaving the outcome to fate, said with a mix of courage and shrug.", decoys: ["'See you later', said when leaving a group.", "'Help yourself', said when offering food."], hint: "Said right before you jump in", category: "Philippines", difficulty: 2 },

    { text: "Pasalubong", answer: "A gift or souvenir brought home for others after a trip (Filipino). The root word means to welcome someone back.", decoys: ["A farewell party held before a long journey.", "A shared meal on the eve of a holiday."], hint: "What is in the suitcase", category: "Philippines", difficulty: 2 },

    { text: "Gigil", answer: "The overwhelming urge to squeeze or clench at something unbearably cute (Filipino).", decoys: ["The last piece of food nobody wants to take.", "A nervous laugh during an awkward silence."], hint: "Puppies and babies cause it", category: "Philippines", difficulty: 3 },

    { text: "Tampo", answer: "Withdrawing warmth and going quiet to show you are hurt, rather than saying so directly (Filipino).", decoys: ["A friendly nickname given by workmates.", "The first rain of the wet season."], hint: "It is a way of sulking", category: "Philippines", difficulty: 3 },

    /* ---------- China ---------- */
    { text: "Jiayou", answer: "Literally 'add oil' or 'add fuel' (Mandarin). A shout of encouragement meaning keep going, you can do it.", decoys: ["A toast made at the start of a shared meal.", "A tip added to a delivery order."], hint: "You yell it at someone running a race", category: "China", difficulty: 1 },

    { text: "Hongbao", answer: "A red envelope holding a gift of money, given at New Year, weddings and celebrations (Mandarin).", decoys: ["A red paper lantern hung outside a shop.", "A handwritten note of thanks after a banquet."], hint: "Red, and there is money inside", category: "China", difficulty: 1 },

    { text: "Guanxi", answer: "Personal networks of relationships and mutual obligation that help things get done (Mandarin).", decoys: ["A formal written contract between two firms.", "The seating order at a business dinner."], hint: "It is all about who you know", category: "China", difficulty: 2 },

    { text: "Mianzi", answer: "'Face': social standing, dignity and reputation, which can be given, saved or lost (Mandarin).", decoys: ["The front page of a company brochure.", "A mask worn in traditional opera."], hint: "You can lose it or save it", category: "China", difficulty: 2 },

    { text: "Tuhao", answer: "Someone newly rich with loud, flashy taste (Mandarin). Now used lightly and often jokingly online.", decoys: ["A local speciality dish from a small town.", "A weekend market selling farm produce."], hint: "Gold phone case energy", category: "China", difficulty: 2 },

    { text: "Chabuduo", answer: "'Near enough', literally 'differs not much' (Mandarin). The attitude of calling something close enough and moving on.", decoys: ["A polite refusal of a second helping.", "The pause before answering a difficult question."], hint: "A quality control mindset, sort of", category: "China", difficulty: 3 },

    { text: "Renao", answer: "The warm, noisy, crowded buzz of a lively gathering, treated as a good thing (Mandarin).", decoys: ["The quiet hour just before a market opens.", "A queue that moves faster than expected."], hint: "A busy restaurant has it", category: "China", difficulty: 3 },

    /* ---------- English ---------- */
    { text: "Petrichor", answer: "The earthy smell that rises when rain falls on dry ground. The word was coined by two scientists in 1964.", decoys: ["A thin layer of oil floating on a puddle.", "The mineral crust left on a kettle element."], hint: "You know the smell", category: "English", difficulty: 2 },

    { text: "Defenestration", answer: "The act of throwing someone or something out of a window.", decoys: ["The removal of a window to widen a doorway.", "The act of stripping a room of its furniture."], hint: "Look at the middle of the word", category: "English", difficulty: 2 },

    { text: "Mondegreen", answer: "A misheard word or lyric that makes its own strange sense. Coined in 1954 from 'laid him on the green' heard as 'Lady Mondegreen'.", decoys: ["A colour that looks different under artificial light.", "A patch of grass kept for public use in a village."], hint: "Everyone has sung one at full volume", category: "English", difficulty: 2 },

    { text: "Sonder", answer: "The realisation that every stranger you pass has a life as full and complicated as your own. A modern coinage from the Dictionary of Obscure Sorrows.", decoys: ["A short walk taken to clear your head.", "The moment you forget why you entered a room."], hint: "A crowded train platform feeling", category: "English", difficulty: 3 },

    { text: "Ultracrepidarian", answer: "A person who gives confident opinions on things well beyond their knowledge.", decoys: ["Someone who reads only the last chapter of a book.", "A person who arrives early to every appointment."], hint: "Every comment section has one", category: "English", difficulty: 3 },

    { text: "Nudiustertian", answer: "Of or relating to the day before yesterday. A seventeenth century word that never quite caught on.", decoys: ["Relating to a night without any moonlight.", "Describing a meal eaten standing up."], hint: "It is about time, not clothing", category: "English", difficulty: 3 },

    { text: "Snollygoster", answer: "A shrewd and unprincipled person who acts purely out of self interest. Nineteenth century American slang.", decoys: ["A large, clumsy person who breaks things.", "A traveller who arrives without warning and stays."], hint: "Not a compliment", category: "English", difficulty: 3 },

    /* ---------- Office ---------- */
    { text: "OKR", answer: "Objectives and Key Results: a goal setting method pairing one ambitious objective with a few measurable results.", decoys: ["Operational Key Risk, a rating on a risk register.", "Onboarding Knowledge Review, a check after training."], hint: "Quarterly planning", category: "Office", difficulty: 1 },

    { text: "MVP", answer: "Minimum Viable Product: the smallest version you can ship that still tests whether the idea works.", decoys: ["Managed Vendor Portal, a supplier login system.", "Master Version Plan, the release schedule for a product."], hint: "Not the sporting one", category: "Office", difficulty: 1 },

    { text: "WIP", answer: "Work In Progress: work that has been started but is not finished. Teams cap it to stop everything being half done.", decoys: ["Weekly Improvement Plan, a short performance document.", "Workforce Integration Programme, a post merger process."], hint: "Three little letters on a board column", category: "Office", difficulty: 1 },

    { text: "Boil the ocean", answer: "Corporate jargon for attempting something so broad in scope that it cannot possibly be finished.", decoys: ["To run a workshop until every idea is exhausted.", "To escalate an issue to every level at once."], hint: "Someone says it to shrink a project", category: "Office", difficulty: 1 },

    { text: "RACI", answer: "Responsible, Accountable, Consulted, Informed: a grid clarifying who does the work, who owns it, who is asked and who is told.", decoys: ["Risk, Assumption, Constraint, Issue, a planning log.", "Review, Approve, Commit, Implement, a change process."], hint: "It is a four column grid", category: "Office", difficulty: 2 },

    { text: "Bikeshedding", answer: "Spending far more time on a trivial detail than on the hard decision, because everyone has an opinion on the trivial thing.", decoys: ["Storing a project's paperwork in a shared drive nobody opens.", "Splitting a big task into pieces too small to track."], hint: "Named after a very small building", category: "Office", difficulty: 2 },

    { text: "Swim lane", answer: "A band across a process diagram showing which team or role owns each step, so handovers are visible.", decoys: ["A time block reserved in a calendar for focused work.", "A narrow section of a backlog assigned to one person."], hint: "Look at a process diagram", category: "Office", difficulty: 2 },

    /* ---------- Science ---------- */
    { text: "Borborygmus", answer: "The rumbling noise made by gas and fluid moving through your intestines.", decoys: ["The ringing you hear after a very loud noise.", "The involuntary twitch of an eyelid when tired."], hint: "Everyone hears it in quiet meetings", category: "Science", difficulty: 2 },

    { text: "Philtrum", answer: "The vertical groove running from the base of your nose to the middle of your upper lip.", decoys: ["The small flap of skin at the inner corner of the eye.", "The soft hollow at the base of the throat."], hint: "Touch your own face", category: "Science", difficulty: 2 },

    { text: "Glabella", answer: "The smooth patch of forehead between your eyebrows, just above the nose.", decoys: ["The curved bone at the top of the eye socket.", "The soft spot on a newborn baby's skull."], hint: "Between the eyebrows", category: "Science", difficulty: 2 },

    { text: "Lunule", answer: "The pale crescent shaped area at the base of a fingernail.", decoys: ["The tiny bone at the base of the thumb.", "The white ring around the pupil of an older eye."], hint: "The name means little moon", category: "Science", difficulty: 2 },

    { text: "Horripilation", answer: "The bristling of body hair, better known as goosebumps.", decoys: ["The sudden sweat that follows a fright.", "The prickling sensation of a limb waking up."], hint: "Cold air or a good song causes it", category: "Science", difficulty: 3 },

    { text: "Syzygy", answer: "The alignment of three celestial bodies in a straight line, such as the Sun, Earth and Moon during an eclipse.", decoys: ["The wobble in a planet's orbit caused by a nearby moon.", "The point where two galaxies begin to merge."], hint: "Look up during an eclipse", category: "Science", difficulty: 3 },
  ], [
    { key: "text", label: "Word or acronym", type: "text", required: true },
    { key: "answer", label: "Real definition", type: "textarea", required: true },
    { key: "decoys", label: "Backup fake definitions (used if teams submit too few)", type: "list", required: false },
    { key: "hint", label: "Facilitator hint (optional)", type: "text", required: false },
  ]);
})();
