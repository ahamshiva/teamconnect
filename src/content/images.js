/* src/content/images.js  Built-in SVG scenes for Draw and Describe / Caption This */
(function () {
  "use strict";

  window.TCL.Content.registerBank("images", [

    /* ---------------- DRAW: difficulty 1 (3 to 4 elements) ---------------- */

    {
      title: "House with a sun and a tree",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="A house with a red roof, a sun in the top left, a round tree on the right and a path to the door"><rect width="400" height="300" fill="#eaf4fb"/><rect y="220" width="400" height="80" fill="#86c06a"/><circle cx="58" cy="54" r="30" fill="#f7c948"/><rect x="150" y="150" width="112" height="80" fill="#f3e6d0" stroke="#33383d" stroke-width="3"/><polygon points="138,150 206,104 274,150" fill="#d1483b" stroke="#33383d" stroke-width="3"/><rect x="308" y="180" width="16" height="50" fill="#8a5a2b" stroke="#33383d" stroke-width="2"/><circle cx="316" cy="158" r="42" fill="#3f9c52" stroke="#33383d" stroke-width="3"/><rect x="190" y="186" width="32" height="44" fill="#8a5a2b" stroke="#33383d" stroke-width="3"/><polygon points="192,300 224,300 220,230 198,230" fill="#cbb894" stroke="#33383d" stroke-width="2"/><rect x="160" y="164" width="24" height="22" fill="#9fd3f0" stroke="#33383d" stroke-width="2"/><rect x="228" y="164" width="24" height="22" fill="#9fd3f0" stroke="#33383d" stroke-width="2"/></svg>',
      use: ["draw"],
      elements: 4,
      category: "Scenes",
      difficulty: 1,
      describe: "A house with a red triangular roof sits in the centre, with a brown door and two square windows. A yellow sun is top left, a round green tree stands on the right, and a pale path runs from the door to the bottom of the picture."
    },

    {
      title: "Sailing boat under a cloud",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="A sailing boat with two sails floating on blue waves under a white cloud"><rect width="400" height="300" fill="#dff1fb"/><rect y="188" width="400" height="112" fill="#4aa3d9"/><rect x="104" y="52" width="96" height="30" rx="15" fill="#ffffff"/><circle cx="120" cy="58" r="24" fill="#ffffff"/><circle cx="152" cy="46" r="30" fill="#ffffff"/><circle cx="186" cy="58" r="22" fill="#ffffff"/><line x1="205" y1="48" x2="205" y2="184" stroke="#33383d" stroke-width="5"/><polygon points="200,58 200,176 132,176" fill="#f7f7f2" stroke="#33383d" stroke-width="3"/><polygon points="212,84 212,176 266,176" fill="#e8564a" stroke="#33383d" stroke-width="3"/><polygon points="118,180 292,180 266,214 144,214" fill="#c8863a" stroke="#33383d" stroke-width="3"/><path d="M0 240 q25 -16 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" fill="none" stroke="#ffffff" stroke-width="4"/><path d="M0 272 q25 -16 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" fill="none" stroke="#ffffff" stroke-width="4"/></svg>',
      use: ["draw"],
      elements: 4,
      category: "Scenes",
      difficulty: 1,
      describe: "A brown boat sits in the centre on blue water. One tall mast rises from it with a big white triangular sail on the left and a smaller red sail on the right. A fluffy white cloud floats top left, and two wavy white lines cross the water below the boat."
    },

    {
      title: "Snowman with a hat and scarf",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="A three ball snowman wearing a black hat and a red scarf with two stick arms"><rect width="400" height="300" fill="#eaf2fa"/><rect y="238" width="400" height="62" fill="#ffffff"/><circle cx="200" cy="234" r="54" fill="#ffffff" stroke="#33383d" stroke-width="3"/><circle cx="200" cy="162" r="40" fill="#ffffff" stroke="#33383d" stroke-width="3"/><circle cx="200" cy="104" r="29" fill="#ffffff" stroke="#33383d" stroke-width="3"/><line x1="160" y1="160" x2="108" y2="128" stroke="#8a5a2b" stroke-width="6"/><line x1="240" y1="160" x2="292" y2="128" stroke="#8a5a2b" stroke-width="6"/><rect x="166" y="72" width="68" height="12" fill="#33383d"/><rect x="180" y="38" width="40" height="34" fill="#33383d"/><rect x="170" y="128" width="60" height="14" fill="#d1483b"/><rect x="214" y="136" width="14" height="42" fill="#d1483b"/><circle cx="190" cy="100" r="4" fill="#33383d"/><circle cx="210" cy="100" r="4" fill="#33383d"/><polygon points="200,108 224,114 200,118" fill="#e8873a"/><circle cx="200" cy="150" r="5" fill="#33383d"/><circle cx="200" cy="172" r="5" fill="#33383d"/></svg>',
      use: ["draw"],
      elements: 4,
      category: "Scenes",
      difficulty: 1,
      describe: "Three white circles stacked in the centre make a snowman, biggest at the bottom. A black top hat sits on the head, a red scarf wraps the neck and hangs down the right side, and two brown stick arms point up and out."
    },

    {
      title: "Ice cream cone with two scoops",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="An ice cream cone with two scoops and a cherry on top"><rect width="400" height="300" fill="#fdf4e8"/><polygon points="164,168 236,168 200,286" fill="#d8a349" stroke="#33383d" stroke-width="3"/><line x1="178" y1="192" x2="212" y2="228" stroke="#a9762c" stroke-width="3"/><line x1="212" y1="192" x2="184" y2="222" stroke="#a9762c" stroke-width="3"/><circle cx="200" cy="146" r="46" fill="#f6a6b8" stroke="#33383d" stroke-width="3"/><circle cx="200" cy="90" r="38" fill="#f7ecd2" stroke="#33383d" stroke-width="3"/><circle cx="200" cy="44" r="12" fill="#d1483b" stroke="#33383d" stroke-width="3"/><line x1="200" y1="34" x2="212" y2="18" stroke="#3f9c52" stroke-width="4"/></svg>',
      use: ["draw"],
      elements: 4,
      category: "Objects",
      difficulty: 1,
      describe: "A pointed cone sits in the centre with its tip at the bottom. A pink scoop sits on the cone and a cream scoop sits on top of that, with a small red cherry and a green stalk at the very top."
    },

    /* ---------------- DRAW: difficulty 2 (5 to 6 elements) ---------------- */

    {
      title: "Cat on a chair beside a table",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="A cat sitting on a chair on the left, next to a small table on the right holding a cup"><rect width="400" height="300" fill="#f6f1e7"/><rect y="248" width="400" height="52" fill="#e0d4c0"/><ellipse cx="196" cy="272" rx="150" ry="16" fill="#c9b9d6"/><rect x="86" y="150" width="14" height="112" fill="#8a5a2b"/><rect x="160" y="180" width="14" height="82" fill="#8a5a2b"/><rect x="80" y="168" width="100" height="16" fill="#a9762c" stroke="#33383d" stroke-width="2"/><rect x="86" y="96" width="88" height="74" fill="#a9762c" stroke="#33383d" stroke-width="2"/><ellipse cx="130" cy="132" rx="30" ry="26" fill="#6b7078" stroke="#33383d" stroke-width="3"/><circle cx="130" cy="94" r="20" fill="#6b7078" stroke="#33383d" stroke-width="3"/><polygon points="114,80 118,58 132,78" fill="#6b7078" stroke="#33383d" stroke-width="2"/><polygon points="146,80 142,58 128,78" fill="#6b7078" stroke="#33383d" stroke-width="2"/><circle cx="123" cy="93" r="3" fill="#33383d"/><circle cx="137" cy="93" r="3" fill="#33383d"/><path d="M158 146 q34 6 26 -34" fill="none" stroke="#6b7078" stroke-width="9" stroke-linecap="round"/><rect x="238" y="180" width="120" height="12" fill="#a9762c" stroke="#33383d" stroke-width="2"/><rect x="248" y="192" width="12" height="70" fill="#8a5a2b"/><rect x="336" y="192" width="12" height="70" fill="#8a5a2b"/><rect x="278" y="148" width="42" height="32" rx="4" fill="#ffffff" stroke="#33383d" stroke-width="3"/><path d="M320 154 q18 12 0 22" fill="none" stroke="#33383d" stroke-width="3"/></svg>',
      use: ["draw"],
      elements: 5,
      category: "Animals",
      difficulty: 2,
      describe: "A grey cat sits on a wooden chair on the left, facing you, with pointed ears and a curled tail behind it. A small table stands on the right with a white cup and handle on top, and a purple oval rug lies under both of them."
    },

    {
      title: "Bicycle leaning on a lamp post",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="A bicycle leaning against a street lamp post with a bird perched on the lamp"><rect width="400" height="300" fill="#e7f3fb"/><rect y="252" width="400" height="48" fill="#bfc7cd"/><circle cx="52" cy="52" r="26" fill="#f7c948"/><rect x="292" y="70" width="12" height="184" fill="#4a5560"/><rect x="270" y="52" width="56" height="22" rx="8" fill="#f7c948" stroke="#33383d" stroke-width="3"/><ellipse cx="298" cy="36" rx="16" ry="12" fill="#6b7078" stroke="#33383d" stroke-width="2"/><circle cx="290" cy="32" r="4" fill="#33383d"/><polygon points="312,34 330,40 312,44" fill="#e8873a"/><circle cx="120" cy="208" r="44" fill="none" stroke="#33383d" stroke-width="6"/><circle cx="240" cy="208" r="44" fill="none" stroke="#33383d" stroke-width="6"/><polyline points="120,208 172,208 200,150 152,150 120,208" fill="none" stroke="#d1483b" stroke-width="6"/><line x1="200" y1="150" x2="240" y2="208" stroke="#d1483b" stroke-width="6"/><line x1="152" y1="150" x2="140" y2="132" stroke="#33383d" stroke-width="5"/><rect x="126" y="124" width="34" height="10" rx="5" fill="#33383d"/><line x1="200" y1="150" x2="212" y2="126" stroke="#33383d" stroke-width="5"/><line x1="198" y1="124" x2="228" y2="124" stroke="#33383d" stroke-width="6"/><circle cx="180" cy="208" r="8" fill="#33383d"/></svg>',
      use: ["draw"],
      elements: 5,
      category: "Objects",
      difficulty: 2,
      describe: "A red framed bicycle with two big wheels stands in the centre, leaning to the right against a tall grey lamp post. A yellow lamp box sits at the top of the post and a small grey bird perches on the lamp. A yellow sun is in the top left corner."
    },

    {
      title: "Fish tank with three fish",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="A glass fish tank holding three fish, a green plant and pebbles on the bottom"><rect width="400" height="300" fill="#f4f6f2"/><rect x="60" y="50" width="280" height="200" rx="10" fill="#bfe6f5" stroke="#33383d" stroke-width="5"/><rect x="60" y="216" width="280" height="34" fill="#d8c9a6"/><circle cx="92" cy="232" r="10" fill="#a99b7c"/><circle cx="120" cy="238" r="8" fill="#a99b7c"/><circle cx="160" cy="234" r="11" fill="#a99b7c"/><circle cx="220" cy="238" r="9" fill="#a99b7c"/><circle cx="286" cy="232" r="10" fill="#a99b7c"/><path d="M300 216 q-22 -50 -6 -92" fill="none" stroke="#3f9c52" stroke-width="9" stroke-linecap="round"/><path d="M300 216 q14 -44 34 -66" fill="none" stroke="#3f9c52" stroke-width="9" stroke-linecap="round"/><ellipse cx="150" cy="110" rx="30" ry="18" fill="#e8873a" stroke="#33383d" stroke-width="3"/><polygon points="180,110 202,96 202,124" fill="#e8873a" stroke="#33383d" stroke-width="3"/><circle cx="136" cy="105" r="3" fill="#33383d"/><ellipse cx="230" cy="160" rx="24" ry="14" fill="#d1483b" stroke="#33383d" stroke-width="3"/><polygon points="254,160 272,148 272,172" fill="#d1483b" stroke="#33383d" stroke-width="3"/><circle cx="219" cy="156" r="3" fill="#33383d"/><ellipse cx="120" cy="186" rx="20" ry="12" fill="#f7c948" stroke="#33383d" stroke-width="3"/><polygon points="140,186 156,176 156,196" fill="#f7c948" stroke="#33383d" stroke-width="3"/><circle cx="111" cy="183" r="3" fill="#33383d"/></svg>',
      use: ["draw"],
      elements: 6,
      category: "Animals",
      difficulty: 2,
      describe: "A rectangular glass tank fills the picture. Three fish swim inside: a big orange one top left, a red one in the middle right, and a small yellow one lower left. A green plant grows in the bottom right corner and round pebbles line the sandy floor."
    },

    {
      title: "Tent with a campfire and two trees",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="A triangular tent with a campfire in front, two pine trees behind and a moon in the sky"><rect width="400" height="300" fill="#1f2a44"/><rect y="236" width="400" height="64" fill="#3c5a3a"/><circle cx="340" cy="52" r="26" fill="#f5efd0"/><circle cx="330" cy="46" r="24" fill="#1f2a44"/><polygon points="70,236 30,236 50,180" fill="#2f6b43"/><polygon points="76,236 24,236 50,150" fill="#3f9c52"/><rect x="44" y="236" width="12" height="20" fill="#8a5a2b"/><polygon points="360,236 308,236 334,150" fill="#3f9c52"/><rect x="328" y="236" width="12" height="20" fill="#8a5a2b"/><polygon points="120,240 200,120 280,240" fill="#e0a24a" stroke="#33383d" stroke-width="4"/><polygon points="176,240 200,150 224,240" fill="#33383d"/><line x1="200" y1="120" x2="200" y2="240" stroke="#a9762c" stroke-width="3"/><ellipse cx="322" cy="252" rx="42" ry="10" fill="#6b7078"/><rect x="296" y="240" width="52" height="9" rx="4" fill="#8a5a2b"/><rect x="300" y="248" width="46" height="9" rx="4" fill="#a9762c"/><polygon points="322,196 340,236 304,236" fill="#e8873a"/><polygon points="322,212 334,238 310,238" fill="#f7c948"/></svg>',
      use: ["draw"],
      elements: 5,
      category: "Scenes",
      difficulty: 2,
      describe: "An orange triangular tent stands in the centre with a dark triangular opening. A campfire with orange and yellow flames burns on two logs to the right of the tent. A pine tree stands on each side and a crescent moon sits in the top right sky."
    },

    /* ---------------- DRAW: difficulty 3 (7 to 9 elements) ---------------- */

    {
      title: "Rocket between two planets",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="A rocket flying upward between two planets with three stars and a crescent moon"><rect width="400" height="300" fill="#111a33"/><circle cx="62" cy="96" r="42" fill="#e8873a"/><circle cx="48" cy="82" r="10" fill="#c96e28"/><circle cx="74" cy="112" r="7" fill="#c96e28"/><circle cx="330" cy="180" r="34" fill="#5b7fd4"/><ellipse cx="330" cy="180" rx="58" ry="12" fill="none" stroke="#c9d4f2" stroke-width="6"/><circle cx="316" cy="56" r="22" fill="#f5efd0"/><circle cx="306" cy="50" r="20" fill="#111a33"/><polygon points="150,44 156,62 174,62 160,74 166,92 150,80 134,92 140,74 126,62 144,62" fill="#f7c948"/><polygon points="248,116 252,128 264,128 254,136 258,148 248,140 238,148 242,136 232,128 244,128" fill="#f7c948"/><polygon points="96,214 100,226 112,226 102,234 106,246 96,238 86,246 90,234 80,226 92,226" fill="#f7c948"/><path d="M200 74 q26 40 26 96 h-52 q0 -56 26 -96" fill="#eef1f6" stroke="#33383d" stroke-width="3"/><circle cx="200" cy="132" r="15" fill="#7fd0f0" stroke="#33383d" stroke-width="3"/><polygon points="174,170 152,206 174,196" fill="#d1483b" stroke="#33383d" stroke-width="3"/><polygon points="226,170 248,206 226,196" fill="#d1483b" stroke="#33383d" stroke-width="3"/><rect x="182" y="170" width="36" height="14" fill="#c2c8d2" stroke="#33383d" stroke-width="3"/><polygon points="184,186 216,186 200,232" fill="#e8873a"/><polygon points="190,186 210,186 200,214" fill="#f7c948"/></svg>',
      use: ["draw"],
      elements: 7,
      category: "Space",
      difficulty: 3,
      describe: "A white rocket with a round blue window points straight up in the centre, with two red fins and an orange flame under it. An orange planet sits on the left, a blue planet with a ring sits on the lower right, a crescent moon is in the top right, and three yellow stars are scattered around."
    },

    {
      title: "Desk with laptop, mug and wall clock",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="A desk holding a laptop, a plant, a mug and two sticky notes, with a round clock on the wall behind"><rect width="400" height="300" fill="#f3efe6"/><rect y="214" width="400" height="86" fill="#e3dbcb"/><circle cx="330" cy="66" r="34" fill="#ffffff" stroke="#33383d" stroke-width="4"/><line x1="330" y1="66" x2="330" y2="44" stroke="#33383d" stroke-width="4"/><line x1="330" y1="66" x2="348" y2="74" stroke="#33383d" stroke-width="4"/><rect x="40" y="206" width="320" height="14" fill="#a9762c" stroke="#33383d" stroke-width="3"/><rect x="62" y="220" width="14" height="70" fill="#8a5a2b"/><rect x="324" y="220" width="14" height="70" fill="#8a5a2b"/><polygon points="150,206 168,138 258,138 274,206" fill="#c2c8d2" stroke="#33383d" stroke-width="3"/><rect x="168" y="138" width="90" height="66" fill="#4a5560" stroke="#33383d" stroke-width="3"/><rect x="176" y="146" width="74" height="46" fill="#7fd0f0"/><rect x="86" y="168" width="34" height="38" rx="4" fill="#d1483b" stroke="#33383d" stroke-width="3"/><path d="M103 168 q-24 -12 -18 -40" fill="none" stroke="#3f9c52" stroke-width="8" stroke-linecap="round"/><path d="M103 168 q22 -16 18 -44" fill="none" stroke="#3f9c52" stroke-width="8" stroke-linecap="round"/><rect x="292" y="174" width="34" height="32" rx="4" fill="#ffffff" stroke="#33383d" stroke-width="3"/><path d="M326 180 q16 10 0 20" fill="none" stroke="#33383d" stroke-width="3"/><rect x="128" y="176" width="30" height="30" fill="#f7c948" stroke="#33383d" stroke-width="2"/><rect x="272" y="118" width="30" height="30" fill="#f6a6b8" stroke="#33383d" stroke-width="2"/></svg>',
      use: ["draw"],
      elements: 7,
      category: "Office",
      difficulty: 3,
      describe: "A wooden desk runs across the middle. An open laptop sits in the centre with a blue screen, a red pot plant is on the left, a white mug with a handle is on the right, a yellow sticky note lies on the desk left of the laptop, a pink sticky note is stuck on the wall to the right, and a round clock hangs on the wall top right."
    },

    {
      title: "Park bench with a dog and a ball",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="A park bench under a tree with a dog beside it, a ball on the grass, a bin on the right and two clouds"><rect width="400" height="300" fill="#dff1fb"/><rect y="216" width="400" height="84" fill="#86c06a"/><ellipse cx="72" cy="52" rx="34" ry="20" fill="#ffffff"/><ellipse cx="106" cy="46" rx="24" ry="16" fill="#ffffff"/><ellipse cx="286" cy="42" rx="30" ry="18" fill="#ffffff"/><rect x="176" y="126" width="18" height="98" fill="#8a5a2b" stroke="#33383d" stroke-width="2"/><circle cx="185" cy="104" r="54" fill="#3f9c52" stroke="#33383d" stroke-width="3"/><rect x="96" y="188" width="140" height="12" rx="4" fill="#a9762c" stroke="#33383d" stroke-width="2"/><rect x="96" y="158" width="140" height="12" rx="4" fill="#a9762c" stroke="#33383d" stroke-width="2"/><rect x="104" y="200" width="10" height="34" fill="#8a5a2b"/><rect x="218" y="200" width="10" height="34" fill="#8a5a2b"/><rect x="104" y="150" width="10" height="40" fill="#8a5a2b"/><rect x="218" y="150" width="10" height="40" fill="#8a5a2b"/><ellipse cx="278" cy="222" rx="30" ry="20" fill="#c8863a" stroke="#33383d" stroke-width="3"/><circle cx="308" cy="200" r="18" fill="#c8863a" stroke="#33383d" stroke-width="3"/><polygon points="298,186 292,166 310,180" fill="#8a5a2b" stroke="#33383d" stroke-width="2"/><circle cx="315" cy="198" r="3" fill="#33383d"/><line x1="262" y1="238" x2="262" y2="252" stroke="#33383d" stroke-width="5"/><line x1="292" y1="238" x2="292" y2="252" stroke="#33383d" stroke-width="5"/><path d="M250 214 q-20 -12 -10 -30" fill="none" stroke="#c8863a" stroke-width="7" stroke-linecap="round"/><circle cx="146" cy="256" r="16" fill="#d1483b" stroke="#33383d" stroke-width="3"/><rect x="342" y="180" width="44" height="60" rx="5" fill="#6b7078" stroke="#33383d" stroke-width="3"/><rect x="336" y="170" width="56" height="12" rx="4" fill="#4a5560" stroke="#33383d" stroke-width="3"/></svg>',
      use: ["draw"],
      elements: 7,
      category: "Scenes",
      difficulty: 3,
      describe: "A wooden bench sits on the left half of the grass under a round green tree. A brown dog stands to the right of the bench with its tail up and one ear pointing back. A red ball lies on the grass in front of the bench, a grey bin stands at the far right, and two white clouds float in the sky."
    },

    {
      title: "Kitchen shelf with jars and a pan",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="A kitchen shelf holding a kettle, three jars, a bowl and a spoon, with a pan hanging underneath"><rect width="400" height="300" fill="#fbf3e6"/><rect x="30" y="150" width="340" height="16" rx="4" fill="#a9762c" stroke="#33383d" stroke-width="3"/><rect x="48" y="166" width="16" height="26" fill="#8a5a2b"/><rect x="336" y="166" width="16" height="26" fill="#8a5a2b"/><rect x="58" y="96" width="60" height="54" rx="8" fill="#6b7078" stroke="#33383d" stroke-width="3"/><path d="M118 112 q26 12 0 26" fill="none" stroke="#33383d" stroke-width="5"/><path d="M70 96 q18 -22 36 0" fill="none" stroke="#33383d" stroke-width="5"/><rect x="140" y="106" width="36" height="44" rx="4" fill="#f6a6b8" stroke="#33383d" stroke-width="3"/><rect x="136" y="98" width="44" height="10" rx="3" fill="#4a5560"/><rect x="186" y="112" width="34" height="38" rx="4" fill="#7fd0f0" stroke="#33383d" stroke-width="3"/><rect x="182" y="104" width="42" height="10" rx="3" fill="#4a5560"/><rect x="230" y="100" width="36" height="50" rx="4" fill="#f7c948" stroke="#33383d" stroke-width="3"/><rect x="226" y="92" width="44" height="10" rx="3" fill="#4a5560"/><path d="M286 118 h64 a32 32 0 0 1 -64 0" fill="#ffffff" stroke="#33383d" stroke-width="3"/><line x1="316" y1="80" x2="316" y2="116" stroke="#33383d" stroke-width="4"/><ellipse cx="316" cy="74" rx="10" ry="7" fill="#c2c8d2" stroke="#33383d" stroke-width="3"/><line x1="200" y1="166" x2="200" y2="186" stroke="#33383d" stroke-width="4"/><circle cx="200" cy="226" r="42" fill="#4a5560" stroke="#33383d" stroke-width="3"/><rect x="238" y="216" width="66" height="12" rx="6" fill="#33383d"/></svg>',
      use: ["draw"],
      elements: 8,
      category: "Objects",
      difficulty: 3,
      describe: "A long wooden shelf crosses the middle. On it, from left to right: a grey kettle with a handle and spout, a pink jar, a blue jar, a yellow jar, a white bowl and a spoon standing in it. A dark round pan with a handle to the right hangs from the centre of the shelf below."
    },

    /* ---------------- CAPTION ---------------- */

    {
      title: "Cat parked on the keyboard mid call",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="A cat sitting on a laptop keyboard in front of a screen showing four video call tiles"><rect width="400" height="300" fill="#eef1f6"/><rect y="230" width="400" height="70" fill="#d7cdbb"/><rect x="70" y="34" width="260" height="160" rx="8" fill="#33383d" stroke="#23272b" stroke-width="4"/><rect x="82" y="46" width="112" height="64" fill="#7fd0f0"/><circle cx="138" cy="76" r="18" fill="#4a5560"/><rect x="206" y="46" width="112" height="64" fill="#a7d8a0"/><circle cx="262" cy="76" r="18" fill="#4a5560"/><rect x="82" y="118" width="112" height="64" fill="#f6c9a0"/><circle cx="138" cy="148" r="18" fill="#4a5560"/><rect x="206" y="118" width="112" height="64" fill="#c9b2e8"/><circle cx="262" cy="148" r="18" fill="#4a5560"/><rect x="96" y="200" width="208" height="14" rx="4" fill="#c2c8d2" stroke="#33383d" stroke-width="3"/><polygon points="96,214 304,214 336,240 64,240" fill="#dfe4ea" stroke="#33383d" stroke-width="3"/><rect x="104" y="222" width="192" height="10" rx="3" fill="#b9c0c9"/><ellipse cx="200" cy="196" rx="52" ry="34" fill="#4a5560" stroke="#23272b" stroke-width="3"/><circle cx="200" cy="150" r="28" fill="#4a5560" stroke="#23272b" stroke-width="3"/><polygon points="178,132 182,104 200,128" fill="#4a5560" stroke="#23272b" stroke-width="2"/><polygon points="222,132 218,104 200,128" fill="#4a5560" stroke="#23272b" stroke-width="2"/><circle cx="190" cy="148" r="4" fill="#f7f7f2"/><circle cx="210" cy="148" r="4" fill="#f7f7f2"/><path d="M186 160 q14 10 28 0" fill="none" stroke="#f7f7f2" stroke-width="3"/><path d="M252 202 q34 -6 26 -46" fill="none" stroke="#4a5560" stroke-width="10" stroke-linecap="round"/></svg>',
      use: ["caption"],
      elements: 5,
      category: "Office",
      difficulty: 2,
      describe: "A large dark cat sits squarely on an open laptop keyboard, filling the centre. Behind it a screen shows four video call tiles with faceless round avatars in blue, green, orange and purple. The cat looks straight out at you with its tail curled to the right."
    },

    {
      title: "Buried under sticky notes",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="A person at a desk almost completely buried under a heap of colourful sticky notes"><rect width="400" height="300" fill="#f3efe6"/><rect y="238" width="400" height="62" fill="#d7cdbb"/><rect x="30" y="230" width="340" height="14" fill="#a9762c" stroke="#33383d" stroke-width="3"/><circle cx="200" cy="112" r="26" fill="#e6c9a8" stroke="#33383d" stroke-width="3"/><path d="M162 230 q0 -62 38 -62 q38 0 38 62 z" fill="#5b7fd4" stroke="#33383d" stroke-width="3"/><circle cx="191" cy="110" r="3" fill="#33383d"/><circle cx="209" cy="110" r="3" fill="#33383d"/><path d="M190 126 q10 -8 20 0" fill="none" stroke="#33383d" stroke-width="3"/><rect x="60" y="180" width="42" height="42" fill="#f7c948" stroke="#33383d" stroke-width="2"/><rect x="104" y="196" width="42" height="42" fill="#f6a6b8" stroke="#33383d" stroke-width="2"/><rect x="146" y="172" width="42" height="42" fill="#a7d8a0" stroke="#33383d" stroke-width="2"/><rect x="190" y="186" width="42" height="42" fill="#f7c948" stroke="#33383d" stroke-width="2"/><rect x="232" y="164" width="42" height="42" fill="#7fd0f0" stroke="#33383d" stroke-width="2"/><rect x="274" y="188" width="42" height="42" fill="#f6a6b8" stroke="#33383d" stroke-width="2"/><rect x="82" y="146" width="42" height="42" fill="#a7d8a0" stroke="#33383d" stroke-width="2"/><rect x="128" y="132" width="42" height="42" fill="#7fd0f0" stroke="#33383d" stroke-width="2"/><rect x="238" y="120" width="42" height="42" fill="#f7c948" stroke="#33383d" stroke-width="2"/><rect x="288" y="140" width="42" height="42" fill="#c9b2e8" stroke="#33383d" stroke-width="2"/><rect x="316" y="96" width="38" height="38" fill="#f6a6b8" stroke="#33383d" stroke-width="2"/><rect x="46" y="106" width="38" height="38" fill="#7fd0f0" stroke="#33383d" stroke-width="2"/><rect x="284" y="52" width="34" height="34" fill="#a7d8a0" stroke="#33383d" stroke-width="2"/><rect x="72" y="58" width="34" height="34" fill="#f7c948" stroke="#33383d" stroke-width="2"/></svg>',
      use: ["caption"],
      elements: 5,
      category: "Office",
      difficulty: 2,
      describe: "A person in a blue top stands behind a desk in the centre, visible only from the shoulders up. A heap of yellow, pink, green, blue and purple sticky notes piles up around them and a few more float in the air on both sides."
    },

    {
      title: "Dog in a tie at the desk",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="A dog wearing a necktie sitting at an office desk behind a laptop"><rect width="400" height="300" fill="#eef1f6"/><rect y="244" width="400" height="56" fill="#d7cdbb"/><rect x="20" y="236" width="360" height="14" fill="#a9762c" stroke="#33383d" stroke-width="3"/><rect x="40" y="250" width="14" height="50" fill="#8a5a2b"/><rect x="346" y="250" width="14" height="50" fill="#8a5a2b"/><rect x="30" y="40" width="80" height="60" fill="#ffffff" stroke="#33383d" stroke-width="3"/><line x1="42" y1="60" x2="98" y2="60" stroke="#c2c8d2" stroke-width="5"/><line x1="42" y1="76" x2="86" y2="76" stroke="#c2c8d2" stroke-width="5"/><path d="M150 236 q0 -74 50 -74 q50 0 50 74 z" fill="#c8863a" stroke="#33383d" stroke-width="3"/><circle cx="200" cy="118" r="46" fill="#c8863a" stroke="#33383d" stroke-width="3"/><ellipse cx="156" cy="120" rx="16" ry="34" fill="#8a5a2b" stroke="#33383d" stroke-width="3"/><ellipse cx="244" cy="120" rx="16" ry="34" fill="#8a5a2b" stroke="#33383d" stroke-width="3"/><circle cx="184" cy="110" r="5" fill="#33383d"/><circle cx="216" cy="110" r="5" fill="#33383d"/><ellipse cx="200" cy="136" rx="12" ry="9" fill="#33383d"/><path d="M200 145 q-14 14 -26 4" fill="none" stroke="#33383d" stroke-width="3"/><path d="M200 145 q14 14 26 4" fill="none" stroke="#33383d" stroke-width="3"/><polygon points="190,166 210,166 200,182" fill="#d1483b" stroke="#33383d" stroke-width="2"/><polygon points="196,182 204,182 212,222 188,222" fill="#d1483b" stroke="#33383d" stroke-width="2"/><rect x="256" y="200" width="96" height="8" rx="3" fill="#c2c8d2" stroke="#33383d" stroke-width="2"/><polygon points="256,208 352,208 366,236 242,236" fill="#dfe4ea" stroke="#33383d" stroke-width="3"/><rect x="70" y="196" width="34" height="34" rx="4" fill="#ffffff" stroke="#33383d" stroke-width="3"/><path d="M104 202 q16 10 0 20" fill="none" stroke="#33383d" stroke-width="3"/></svg>',
      use: ["caption"],
      elements: 5,
      category: "Animals",
      difficulty: 2,
      describe: "A brown dog with long floppy ears sits upright at a desk in the centre, wearing a red necktie. An open laptop sits on the desk to its right and a white mug to its left, with a framed picture on the wall behind."
    },

    {
      title: "Robot pours coffee on the keyboard",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="A robot tipping a coffee pot so the coffee pours onto a computer keyboard"><rect width="400" height="300" fill="#eef1f6"/><rect y="242" width="400" height="58" fill="#c9cfd6"/><rect x="20" y="234" width="360" height="12" fill="#a9762c" stroke="#33383d" stroke-width="3"/><rect x="70" y="120" width="96" height="110" rx="10" fill="#8f9aa8" stroke="#33383d" stroke-width="3"/><rect x="86" y="150" width="64" height="34" rx="4" fill="#7fd0f0" stroke="#33383d" stroke-width="2"/><circle cx="106" cy="204" r="8" fill="#d1483b" stroke="#33383d" stroke-width="2"/><circle cx="132" cy="204" r="8" fill="#f7c948" stroke="#33383d" stroke-width="2"/><rect x="88" y="60" width="60" height="52" rx="8" fill="#b6c0cb" stroke="#33383d" stroke-width="3"/><circle cx="104" cy="84" r="7" fill="#33383d"/><circle cx="132" cy="84" r="7" fill="#33383d"/><line x1="118" y1="60" x2="118" y2="40" stroke="#33383d" stroke-width="4"/><circle cx="118" cy="34" r="8" fill="#d1483b"/><rect x="52" y="140" width="20" height="70" rx="8" fill="#8f9aa8" stroke="#33383d" stroke-width="3"/><rect x="164" y="132" width="72" height="18" rx="9" fill="#8f9aa8" stroke="#33383d" stroke-width="3"/><rect x="232" y="104" width="56" height="50" rx="6" fill="#4a5560" stroke="#33383d" stroke-width="3"/><path d="M288 116 q22 14 0 28" fill="none" stroke="#33383d" stroke-width="5"/><polygon points="232,116 210,140 232,132" fill="#4a5560" stroke="#33383d" stroke-width="3"/><path d="M228 138 q-6 40 6 68" fill="none" stroke="#6b4423" stroke-width="9" stroke-linecap="round"/><polygon points="212,222 320,222 342,244 190,244" fill="#dfe4ea" stroke="#33383d" stroke-width="3"/><rect x="222" y="228" width="90" height="9" rx="3" fill="#b9c0c9"/><ellipse cx="238" cy="226" rx="30" ry="9" fill="#8a5a2b"/><ellipse cx="286" cy="250" rx="26" ry="7" fill="#8a5a2b"/></svg>',
      use: ["caption"],
      elements: 5,
      category: "Office",
      difficulty: 2,
      describe: "A grey robot with a boxy head and a red antenna stands on the left, holding a dark coffee pot in its extended right arm. A stream of coffee pours down from the pot onto a keyboard on the desk to the right, with a brown puddle spreading across it."
    },

    {
      title: "Printer having a moment",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="An office printer with sheets of paper flying out in all directions while a person raises both arms"><rect width="400" height="300" fill="#f1f4f8"/><rect y="246" width="400" height="54" fill="#cfd6de"/><rect x="120" y="170" width="170" height="78" rx="8" fill="#8f9aa8" stroke="#33383d" stroke-width="3"/><rect x="140" y="196" width="60" height="14" rx="4" fill="#4a5560"/><circle cx="262" cy="188" r="8" fill="#3f9c52" stroke="#33383d" stroke-width="2"/><circle cx="262" cy="212" r="8" fill="#d1483b" stroke="#33383d" stroke-width="2"/><rect x="150" y="158" width="110" height="14" rx="3" fill="#b6c0cb" stroke="#33383d" stroke-width="2"/><rect x="168" y="96" width="52" height="66" fill="#ffffff" stroke="#33383d" stroke-width="3"/><polygon points="238,60 292,80 268,132 216,110" fill="#ffffff" stroke="#33383d" stroke-width="3"/><polygon points="300,116 352,104 364,158 310,166" fill="#ffffff" stroke="#33383d" stroke-width="3"/><polygon points="96,74 148,60 162,110 108,124" fill="#ffffff" stroke="#33383d" stroke-width="3"/><polygon points="36,140 88,132 96,182 44,190" fill="#ffffff" stroke="#33383d" stroke-width="3"/><polygon points="272,20 322,32 310,78 262,64" fill="#ffffff" stroke="#33383d" stroke-width="3"/><circle cx="334" cy="212" r="22" fill="#e6c9a8" stroke="#33383d" stroke-width="3"/><path d="M304 292 q0 -58 30 -58 q30 0 30 58 z" fill="#5b7fd4" stroke="#33383d" stroke-width="3"/><line x1="310" y1="242" x2="286" y2="196" stroke="#5b7fd4" stroke-width="10" stroke-linecap="round"/><line x1="358" y1="242" x2="382" y2="196" stroke="#5b7fd4" stroke-width="10" stroke-linecap="round"/><circle cx="326" cy="210" r="3" fill="#33383d"/><circle cx="342" cy="210" r="3" fill="#33383d"/><ellipse cx="334" cy="222" rx="6" ry="7" fill="#33383d"/></svg>',
      use: ["caption"],
      elements: 6,
      category: "Office",
      difficulty: 2,
      describe: "A grey office printer sits in the centre with a sheet of paper standing straight up out of it. Six more sheets fly through the air around it at odd angles. On the right a person in a blue top throws both arms up in the air."
    },

    {
      title: "Queue at the broken coffee machine",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="Three people queueing at a coffee machine that has a large red cross over it"><rect width="400" height="300" fill="#f1f4f8"/><rect y="252" width="400" height="48" fill="#cfd6de"/><rect x="40" y="90" width="110" height="162" rx="8" fill="#6b7078" stroke="#33383d" stroke-width="3"/><rect x="58" y="110" width="74" height="44" rx="4" fill="#33383d"/><rect x="70" y="170" width="50" height="34" fill="#4a5560" stroke="#33383d" stroke-width="2"/><rect x="86" y="190" width="18" height="14" fill="#ffffff" stroke="#33383d" stroke-width="2"/><circle cx="132" cy="222" r="8" fill="#d1483b"/><line x1="46" y1="96" x2="146" y2="246" stroke="#d1483b" stroke-width="14" stroke-linecap="round"/><line x1="146" y1="96" x2="46" y2="246" stroke="#d1483b" stroke-width="14" stroke-linecap="round"/><circle cx="212" cy="130" r="24" fill="#e6c9a8" stroke="#33383d" stroke-width="3"/><path d="M180 252 q0 -66 32 -66 q32 0 32 66 z" fill="#5b7fd4" stroke="#33383d" stroke-width="3"/><circle cx="204" cy="128" r="3" fill="#33383d"/><circle cx="220" cy="128" r="3" fill="#33383d"/><path d="M202 144 q10 -8 20 0" fill="none" stroke="#33383d" stroke-width="3"/><circle cx="288" cy="140" r="24" fill="#d9b48f" stroke="#33383d" stroke-width="3"/><path d="M256 252 q0 -64 32 -64 q32 0 32 64 z" fill="#3f9c52" stroke="#33383d" stroke-width="3"/><circle cx="280" cy="138" r="3" fill="#33383d"/><circle cx="296" cy="138" r="3" fill="#33383d"/><path d="M278 152 q10 6 20 0" fill="none" stroke="#33383d" stroke-width="3"/><circle cx="358" cy="134" r="24" fill="#c99a6e" stroke="#33383d" stroke-width="3"/><path d="M326 252 q0 -66 32 -66 q32 0 32 66 z" fill="#e0a24a" stroke="#33383d" stroke-width="3"/><circle cx="350" cy="132" r="3" fill="#33383d"/><circle cx="366" cy="132" r="3" fill="#33383d"/><line x1="348" y1="148" x2="368" y2="148" stroke="#33383d" stroke-width="3"/></svg>',
      use: ["caption"],
      elements: 5,
      category: "Office",
      difficulty: 2,
      describe: "A tall coffee machine stands on the left with a big red cross drawn over it. Three people wait in a line to the right of it, one behind the other, each with a plain round face and no coffee."
    },

    /* ---------------- DRAW AND CAPTION ---------------- */

    {
      title: "Hiding behind the office plant",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="A person crouching behind a large potted office plant, peeking out at a desk"><rect width="400" height="300" fill="#f3efe6"/><rect y="250" width="400" height="50" fill="#cfd6de"/><rect x="230" y="196" width="150" height="12" fill="#a9762c" stroke="#33383d" stroke-width="3"/><rect x="244" y="208" width="12" height="42" fill="#8a5a2b"/><rect x="356" y="208" width="12" height="42" fill="#8a5a2b"/><rect x="286" y="164" width="66" height="8" rx="3" fill="#c2c8d2" stroke="#33383d" stroke-width="2"/><polygon points="286,172 352,172 366,196 272,196" fill="#dfe4ea" stroke="#33383d" stroke-width="3"/><circle cx="150" cy="128" r="26" fill="#e6c9a8" stroke="#33383d" stroke-width="3"/><path d="M112 250 q0 -68 38 -68 q38 0 38 68 z" fill="#5b7fd4" stroke="#33383d" stroke-width="3"/><circle cx="158" cy="126" r="4" fill="#33383d"/><path d="M140 148 q10 6 20 0" fill="none" stroke="#33383d" stroke-width="3"/><polygon points="76,250 60,182 176,182 160,250" fill="#c8663f" stroke="#33383d" stroke-width="3"/><rect x="52" y="168" width="132" height="18" rx="4" fill="#d97b4f" stroke="#33383d" stroke-width="3"/><line x1="118" y1="168" x2="118" y2="86" stroke="#2f6b43" stroke-width="6"/><ellipse cx="80" cy="120" rx="34" ry="16" fill="#3f9c52" stroke="#33383d" stroke-width="2"/><ellipse cx="156" cy="112" rx="34" ry="16" fill="#3f9c52" stroke="#33383d" stroke-width="2"/><ellipse cx="90" cy="86" rx="28" ry="14" fill="#2f6b43" stroke="#33383d" stroke-width="2"/><ellipse cx="150" cy="76" rx="28" ry="14" fill="#2f6b43" stroke="#33383d" stroke-width="2"/><ellipse cx="118" cy="56" rx="24" ry="13" fill="#3f9c52" stroke="#33383d" stroke-width="2"/></svg>',
      use: ["draw", "caption"],
      elements: 5,
      category: "Office",
      difficulty: 2,
      describe: "A big leafy plant in an orange pot fills the left half, its leaves fanning out on both sides of a straight green stem. A person in a blue top crouches behind the plant with only the head and one eye showing above the leaves. A desk with an open laptop stands on the right."
    },

    {
      title: "Very deep in thought at the meeting",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="A person at a meeting table resting a chin on one hand with closed eyes and small bubbles floating up"><rect width="400" height="300" fill="#eef1f6"/><rect y="252" width="400" height="48" fill="#cfd6de"/><rect x="20" y="216" width="360" height="14" rx="4" fill="#a9762c" stroke="#33383d" stroke-width="3"/><rect x="60" y="230" width="14" height="46" fill="#8a5a2b"/><rect x="326" y="230" width="14" height="46" fill="#8a5a2b"/><rect x="286" y="150" width="88" height="66" rx="6" fill="#33383d" stroke="#23272b" stroke-width="3"/><rect x="296" y="160" width="68" height="46" fill="#7fd0f0"/><rect x="40" y="188" width="70" height="28" rx="3" fill="#ffffff" stroke="#33383d" stroke-width="3"/><line x1="52" y1="198" x2="98" y2="198" stroke="#c2c8d2" stroke-width="4"/><line x1="52" y1="208" x2="86" y2="208" stroke="#c2c8d2" stroke-width="4"/><circle cx="186" cy="120" r="34" fill="#e6c9a8" stroke="#33383d" stroke-width="3"/><path d="M136 216 q0 -66 50 -66 q50 0 50 66 z" fill="#5b7fd4" stroke="#33383d" stroke-width="3"/><line x1="170" y1="118" x2="184" y2="118" stroke="#33383d" stroke-width="3"/><line x1="194" y1="118" x2="208" y2="118" stroke="#33383d" stroke-width="3"/><path d="M176 138 q10 8 20 0" fill="none" stroke="#33383d" stroke-width="3"/><path d="M228 212 q14 -44 -22 -62" fill="#5b7fd4" stroke="#33383d" stroke-width="3"/><ellipse cx="200" cy="150" rx="18" ry="12" fill="#e6c9a8" stroke="#33383d" stroke-width="3"/><circle cx="236" cy="76" r="7" fill="#c2c8d2"/><circle cx="256" cy="52" r="11" fill="#c2c8d2"/><circle cx="284" cy="26" r="15" fill="#c2c8d2"/><rect x="120" y="196" width="40" height="20" rx="4" fill="#ffffff" stroke="#33383d" stroke-width="3"/></svg>',
      use: ["draw", "caption"],
      elements: 6,
      category: "Office",
      difficulty: 2,
      describe: "A person in a blue top sits at a long table in the centre, chin resting on one hand and both eyes closed as flat lines. Three small grey bubbles rise from the head towards the top right corner. A screen glows on the wall behind on the right, and a notepad and a mug sit on the table on the left."
    }

  ], [
    { key: "title", label: "Title", type: "text", required: true },
    { key: "svg", label: "SVG markup", type: "svg", required: true },
    { key: "use", label: "Use: draw and/or caption", type: "list", required: true },
    { key: "elements", label: "Number of distinct elements", type: "number", required: false },
    { key: "category", label: "Category", type: "text", required: false },
    { key: "difficulty", label: "Difficulty 1 to 3", type: "number", required: false },
    { key: "describe", label: "Reference description (facilitator)", type: "textarea", required: false }
  ]);
})();
