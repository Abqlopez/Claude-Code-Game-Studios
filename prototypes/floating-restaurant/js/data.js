// Floating Restaurant v3.1 (more fish and recipes, slow days, rare boss). v3 (all 5 steps: customers, roles and species, gating upgrades, style, events and goals, staff and building) – all tunable data lives in this one file.
// Change numbers here after playtesting; nothing else needs to be touched.
window.FR = window.FR || {};

(function () {
  // Dev helpers: add ?speed=5 to run clocks faster, ?auto=1 to auto-win fish fights.
  const q = new URLSearchParams(window.location.search);
  FR.dev = { speed: Number(q.get('speed')) || 1, auto: q.get('auto') === '1' };

  FR.DATA = {
    config: {
      startMoney: 100,
      startSides: { tortilla: 3, rice: 3, veggies: 0, kelp: 3, bread: 0 },
      // v4.2: you start with the bait for the fish your starting menu needs, and a few of those fish in the tank
      startBaits: { krill: 8, glow: 6 },
      startFish: { sardine: 3, glowgill: 3 },
      startRecipes: ['grilled_sardine', 'glowgill_tacos', 'kelp_wrap', 'catch_of_the_day'],
      startReviews: [2, 2, 2],
      startPlates: 5,

      // Day loop (seconds of real time)
      morningSeconds: 90,
      // The night has no clock (v3): it ends when every booked guest has been served or has left.
      // Guests arrive one after another: "gap" seconds apart, from the first guest to the last
      // (so the night speeds up), and the dock never holds more than queueMax at once.
      arrival: { first: 3, gap: [16, 8], queueMax: 3 },
      duskSeconds: 60,      // how long the sunset takes to turn into night

      // --- Money rules (v2): every price is derived from these ---
      priceMultiplier: 3,   // dish price = 3x the cost of its ingredients
      rawShare: 0.4,        // raw fish sells for 40% of what it earns as a dish
      rawOkMultiplier: 0.5, // raw value of a fish that is only "OK"
      platePrice: 12,
      plateBreakChance: 0.06,
      journalFirstCatch: 3, // reward = this x fish value
      journalComplete: 150,

      // --- Fishing ---
      boatSpeed: 190,
      spotCount: 5,
      spotLife: [14, 24],   // seconds before a school moves on
      spotRadius: 62,
      biteWindow: 1,
      biteWait: { match: [0.5, 0.9], other: [1.6, 3], none: [2.2, 4] },
      baitStamina: 0.7,     // a fish hooked on its favorite bait starts this tired
      trapPrice: 40, trapMax: 3, trapSeconds: 25,
      bossFromDay: 3,
      // v3.1: Old Whiskers is rare now. Chance he shows up on a given morning (from bossFromDay),
      // and a smaller chance he comes back after you have beaten him once.
      bossChance: 0.12, bossReturnChance: 0.04,
      // v3.1: every morning rolls how good the fishing is. spots = signs on the water,
      // life = how long they stay, bite = multiplies the wait for a bite, respawn = seconds before
      // a new sign appears, noBite = chance a cast gets nothing at all.
      fishDays: {
        great:  { weight: 15, name: 'Fish are jumping!', color: '#9cffb0', spots: 6, life: 1.3, bite: 0.8, respawn: 0.9, noBite: 0 },
        normal: { weight: 50, name: 'Normal waters', color: '#ffffff', spots: 5, life: 1, bite: 1, respawn: 0.9, noBite: 0 },
        slow:   { weight: 25, name: 'Slow waters. The fish are not biting much.', color: '#ffe9a8', spots: 3, life: 0.8, bite: 1.7, respawn: 6, noBite: 0.2 },
        dead:   { weight: 10, name: 'Dead calm. Barely a nibble today.', color: '#ff9c9c', spots: 2, life: 0.7, bite: 2.3, respawn: 10, noBite: 0.35 }
      },
      // v3.1: each morning every fish's chance is multiplied by a random number in this range,
      // and one random fish is "running" (its chance x hotFish), so no two mornings look the same.
      dailyJitter: [0.3, 1.7], hotFish: 2.5,
      // v3.1: the morning clock runs this fast while you fight a fish of each rarity,
      // so one big fish does not eat the whole morning.
      fightClock: { common: 1, uncommon: 0.8, rare: 0.35, legendary: 0.3, boss: 0.2 },
      trapCatch: { crab: 70, lobster: 30 },
      fight: {
        reel: 0.26,         // distance reeled per second on a tired fish (divided by fish stamina)
        runReel: 0.025,     // distance reeled per second while it runs
        runPull: 0.04,      // distance the fish takes back while it runs and you rest
        tensionReel: 0.22,  // tension per second, reeling a tired fish
        tensionRun: 0.75,   // tension per second, reeling a running fish (x fish power)
        tensionDrop: 0.65,  // tension lost per second while resting
        tireReel: 0.22,     // stamina the fish loses per second when you reel against a run
        tireRest: 0.09,     // stamina it loses per second running on a slack line
        heavyRod: 0.75,     // heavy rod and harpoon lines take this much of the tension
        escapeAt: 1.4,
        specialEvery: [4, 7],
        // v4.1: what makes fights different from each other
        counterPull: 0.45,  // tension while reeling a run, if you pull the OTHER way (◀ ▶)
        samePull: 1.3,      // ...and if you pull the same way it is going
        counterTire: 1.6,   // a fish you pull against tires this much faster
        lateTrick: 0.5,     // below this stamina the fish learns one more trick
        landAt: 0.12,       // distance where the landing (tap in the green) starts
        landSpeed: { common: 1.1, uncommon: 1.4, rare: 1.7, legendary: 2.0, boss: 2.0 }, // how fast the marker moves
        landZone: { common: 0.34, uncommon: 0.26, rare: 0.2, legendary: 0.16, boss: 0.16 },  // how wide the green zone is
        landMiss: 0.4,      // distance a missed landing gives back
        mastered: 5,        // catch a common or uncommon fish this many times and it can be a Quick catch
        // temperament: rolled every time a fish bites. weight per rarity, and what it changes
        moods: {
          lazy:   { name: 'Lazy', weight: { common: 40, uncommon: 25, rare: 15, legendary: 5, boss: 0 }, stamina: 0.7, run: 0.75, desc: 'tires fast' },
          feisty: { name: 'Feisty', weight: { common: 25, uncommon: 30, rare: 30, legendary: 35, boss: 50 }, run: 1.4, tricks: 0.75, desc: 'long runs, more tricks' },
          sneaky: { name: 'Sneaky', weight: { common: 20, uncommon: 25, rare: 30, legendary: 30, boss: 30 }, fake: 0.35, desc: 'fakes being tired' },
          strong: { name: 'Strong', weight: { common: 15, uncommon: 20, rare: 25, legendary: 30, boss: 20 }, power: 1.25, lucky: true, desc: 'pulls hard, but it is a big one' }
        }
      },
      // v4.1: bait is the key. A fish ALWAYS bites its favorite bait (or a lure made for it).
      // Otherwise this is the chance it bites at all, by rarity. Uncommon and rarer fish want the right bait.
      // v4.2: every fish has a bait of its own (and a lure of its own). Without it, nothing bites.
      baitRules: {
        none: { common: 0, uncommon: 0, rare: 0, legendary: 0, boss: 0 },
        wrong: { common: 0, uncommon: 0, rare: 0, legendary: 0, boss: 0 },
        attract: 3          // new signs on the water are this much more likely to be the fish your hook is for
      },

      // --- Restaurant ---
      playerSpeed: 215,
      carryMax: 2,
      reach: 34,            // how close you must stand to use something
      orderDelay: 1.5,      // seconds before a seated customer is ready to order
      chopSeconds: 1.3,
      washSeconds: 1.0,
      cookSeconds: 6,
      perfectWindow: 3.5,   // seconds after "done" that a dish is still Perfect
      goodWindow: 5,        // then Good for this long, then it burns
      noHeatScore: 0.75,    // uncooked dishes are only Perfect with a cleanly caught fish
      eatSeconds: 6,
      payGrace: 12,         // collect within this or lose the tip and a star
      comboStep: 0.1, comboMax: 5, // each combo step adds 10% to tips, up to +50%
      quality: {
        perfect: { min: 0.8, pay: 1.3, label: 'Perfect', review: 5 },
        good: { min: 0.42, pay: 1, label: 'Good', review: 4 },
        burnt: { min: -9, pay: 0.5, label: 'Burnt', review: 2 }
      },
      fishMods: { ok: -0.12, perfectCut: 0.12, bruised: -0.12 },
      rainChance: 0.2,

      // Upgrade effects per level
      tankSize: [10, 15, 25],
      menuSlots: [4, 6],
      tables: [2, 4, 6],
      stations: [1, 2, 3], // slots on each of grill / fryer / pot; a second cutting board comes at level 1

      // Customers
      patience: { high: 85, medium: 66, low: 50 }, // seconds
      queuePatienceRate: 0.5,
      customersByStars: [4, 10], // at 1 star, at 5 stars
      customersPerDay: 0.5,      // plus this many more guests for every day played, so each day is harder
      customersMax: 16,          // the most guests the booking can reach (before influencer extras)
      reviewWindow: 15,
      specialRequestChance: 0.2,
      maxRequestsPerNight: 3,
      liveCatchChance: 0.12,
      liveCatchPay: 2,
      tipRate: 0.15,
      foodiePerfectTip: 0.5,
      pirateMapChance: 0.2,
      seaKingBaitChance: 0.3,
      regularEvery: 3,
      friendshipGoal: 3,

      // --- v3 step 1: customer interaction ---
      // Chat: seconds between lines, and what answering a question well or badly does to patience.
      chat: { every: [7, 15], gap: 2.5, show: 2.8, askChance: 0.3, askDelay: [2, 6], askSeconds: 16, askGood: 0.2, askGoodTip: 0.1, askBad: 0.15, askIgnored: 0.05 },
      // Moods: the patience level where each one starts.
      mood: { happy: 0.75, tap: 0.5, wave: 0.3, stand: 0.15 },
      // Complaints: seconds to fix one, the chance an apology works per role, and what each fix is worth.
      complaint: { seconds: 18, wrongPatience: 0.1, apology: { sailor: 0.8, foodie: 0.4, pirate: 0.55 }, apologyReview: 3, drinkCost: 4, drinkPatience: 0.2, drinkReview: 4, remakePatience: 0.6, ignoredReview: 1 },
      // Groups: bigTables are table numbers minus 1. window = seconds to bring every dish once the first lands.
      group: { chance: 0.16, fromDay: 1, roles: ['sailor', 'foodie', 'pirate'], maxPerNight: 2, sizes: { 2: 50, 3: 35, 4: 15 }, bigTables: [1, 3], patiencePer: 0.35, window: 25, togetherTip: 0.3, coldPatience: 0.15 },
      // Troublemakers: pirates who run without paying, Sea Kings who demand another table.
      // --- v3 step 5: staff, layout, sections ---
      actionButton: { night: [66, 520], scale: 0.8 }, // the on-screen ACTION button on touch screens
      // Where things stand by default. The Layout editor lets the player move them inside the zones.
      layout: {
        tables: [[230, 210], [410, 210], [230, 352], [410, 352], [230, 494], [410, 494]],
        stations: { pantry: [640, 104], board0: [722, 104], board1: [805, 104], tank: [890, 104], grill: [890, 215], fry: [890, 305], pot: [890, 395], sink: [880, 546], trash: [790, 546], pass: [640, 300], sushi: [640, 430] },
        rod: [560, 548],
        tableZone: { x0: 120, x1: 560, y0: 170, y1: 520 }, stationZone: { x0: 640, x1: 892, y0: 104, y1: 546 },
        tableGap: [150, 120], stationGap: [80, 70], snap: 10
      },
      // Staff: speed per level, what training costs, how tired they get by the end of a night (0.25 = 25% slower),
      // how much mood an unpaid night costs / a paid night restores, and each job's numbers per level.
      staffRules: { walk: 150, levelSpeed: [1, 1.2, 1.4], trainCost: [150, 300], tired: 0.25, unpaidMood: 0.34, paidMood: 0.2, minMood: 0.5,
        passSlots: 4, deckhandCatch: [4, 6, 8], dishBreak: [1, 0.6, 0.3] },
      // --- v3 step 3: upgrades that gate content, and style ---
      vipTable: 0,     // which table (number minus 1) the VIP upgrade ropes off
      bossTankLevel: 2, // a boss fish only keeps overnight in a tank of this level
      paintPrice: 25,
      // Style: decor adds points, points become stars (the list is the points needed for 1..5 stars).
      // Every star makes everyone a little more patient; guests who love your theme get extra
      // patience and book more often.
      style: { stars: [2, 5, 8, 11, 14], trophy: 1, patiencePerStar: 0.04, lovePatiencePerStar: 0.04, loveWeightPerStar: 0.12 },
      // --- v3 step 2: new roles and species ---
      critic: { reviews: 5, disguises: ['sailor', 'foodie', 'pirate'] }, // a critic's review counts this many times
      royal: { courseSeconds: 3.5, coursePatience: 0.5 },                 // eating time between courses, patience topped up to this
      influencer: { happyReview: 4, wave: 3, maxWave: 6 },                // extra customers tomorrow per happy influencer
      shells: { value: 5, perDollar: 0.5 },                               // a Crabfolk pays 1 shell per $value; any bait costs half its price in shells (at least 1)
      witch: { blessReview: 4, curseReview: 2 },                          // review needed for a blessing / low enough for a curse
      trouble: { fromDay: 2, dashChance: 0.3, dashWarn: 1.8, dashSpeed: 85, dashFine: 0.25, demandChance: 0.35, demandSeconds: 14, demandPatience: 0.3, demandTip: 0.25, demandRate: 1.4 }
    },

    // --- v3 step 5: who you can hire. home = where they stand when idle. ---
    staff: [
      { id: 'host', name: 'Host', hire: 300, wage: 20, color: 0x9fd0ff, home: [120, 250], does: 'Greets guests, seats them, and collects payment' },
      { id: 'dishwasher', name: 'Dishwasher', hire: 250, wage: 15, color: 0xa8f0b8, home: [820, 490], does: 'Buses dirty plates and washes them' },
      { id: 'waiter', name: 'Waiter', hire: 500, wage: 30, color: 0xffd08a, home: [575, 250], does: 'Takes orders, and serves any dish you leave on the PASS' },
      { id: 'cook', name: 'Line Cook', hire: 800, wage: 40, color: 0xffa8a8, home: [800, 300], does: 'Takes food off the heat at the right moment, plates it, puts it on the PASS' },
      { id: 'deckhand', name: 'Deckhand', hire: 1000, wage: 40, color: 0xd0b8ff, does: 'Fishes all morning beside you (even if you finish early)' }
    ],
    // Boat sections you build. needs = a milestone id that unlocks it.
    sections: [
      { id: 'bar', name: 'Bar', price: 300, needs: 'earn1500', patience: 1.1, desc: 'Drinks on the house: complaint drinks are free and every guest is 10% more patient' },
      { id: 'sushi', name: 'Sushi counter', price: 450, needs: 'species', desc: 'A new station. No-cook dishes (kelp wrap, sushi) made on it are always Perfect' }
    ],
    // Milestones: kind = earned (lifetime sales + tips) | species (served every kind here) | stars.
    milestones: [
      { id: 'earn1500', name: 'Earn $1,500 in total', kind: 'earned', n: 1500, reward: 'Unlocks the Bar' },
      { id: 'species', name: 'Serve every kind of guest in Home Waters', kind: 'species', reward: 'Unlocks the Sushi counter' },
      { id: 'stars', name: 'Reach 4.5 stars', kind: 'stars', n: 4.5, cash: 200, reward: '$200' },
      { id: 'earn10000', name: 'Earn $10,000 in total', kind: 'earned', n: 10000, cash: 500, reward: '$500  (new waters arrive in v4)' }
    ],

    // --- v3 step 4: random events. One per day at most; noneChance = a quiet day. ---
    // when = the half of the day it happens in. weight = how often it is picked.
    events: {
      noneChance: 0.25, fromDay: 2,
      list: [
        { id: 'frenzy', name: 'Fish frenzy', when: 'morning', weight: 25, desc: 'Rare fish are near the surface this morning.',
          boost: { uncommon: 2, rare: 4, legendary: 4 } },             // spot chances are multiplied by rarity
        { id: 'storm', name: 'Storm', when: 'night', weight: 25, desc: 'Big waves shove you across the deck. Dirty plates left on empty tables slide off and smash.',
          every: [11, 17], gust: 2.2, push: 90, plateSlide: 0.4 },     // seconds between waves, wave length, shove speed, chance a plate slides
        { id: 'monster', name: 'Sea monster', when: 'night', weight: 20, desc: 'A tentacle will grab an empty table. Hold E at the table to fight it off.',
          first: [15, 30], again: [35, 55], max: 2, fightSeconds: 2.5, reward: 15 },
        { id: 'rival', name: 'Rival food boat', when: 'night', weight: 20, desc: 'Guests left waiting on the dock get lured away fast, so greet them quickly.',
          queueRate: 2.2 },                                             // dock patience drains this much faster
        { id: 'celebrity', name: 'Celebrity Sea King', when: 'night', weight: 15, fromDay: 3, desc: 'King Tidemane is coming. Only Perfect dishes will do, and his review counts 3 times.',
          guest: { role: 'foodie', species: 'seaking' }, title: 'King Tidemane', reviews: 3, tip: 1, failReview: 2 }
      ]
    },

    // --- v3 step 4: daily goals. 1 for the morning, 2 for the night. n = [min, max]. ---
    // {n} {fish} {who} in the text are filled in. reward is cash; sometimes it is a decor item instead.
    goals: {
      decorChance: 0.15, decorMaxPrice: 60,
      morning: [
        { kind: 'catchFish', text: 'Catch a {fish}', reward: 25 },
        { kind: 'catchN', n: [5, 8], text: 'Catch {n} fish', reward: 20 },
        { kind: 'clean', n: [2, 3], text: 'Land {n} clean catches', reward: 25 },
        { kind: 'big', text: 'Catch a Big or Trophy fish', reward: 25 }
      ],
      night: [
        { kind: 'serveSpecies', max: 3, text: 'Serve {n} {who} guests', reward: 25 },
        { kind: 'serveRole', max: 3, text: 'Serve {n} {who} guests', reward: 25 },
        { kind: 'perfect', n: [2, 4], text: 'Serve {n} Perfect dishes', reward: 30 },
        { kind: 'combo', n: [3, 5], text: 'Reach a combo of {n}', reward: 25 },
        { kind: 'nowalk', text: 'Nobody walks out', reward: 30 },
        { kind: 'tips', per: 3, text: 'Earn ${n} in tips', reward: 25 }  // n = per x tonight's guests
      ]
    },

    // --- v3 step 2: a Sea Witch leaves one of these for the whole next day ---
    // lucky = bigger fish, tip / patience / plateBreak / spotLife are multipliers.
    hexes: [
      { id: 'tides', good: true, name: 'Lucky Tides', desc: 'Bigger fish in the morning.', lucky: 2 },
      { id: 'gold', good: true, name: 'Golden Touch', desc: 'Tips are 30% bigger at night.', tip: 1.3 },
      { id: 'calm', good: true, name: 'Calm Crowd', desc: 'Customers are 25% more patient.', patience: 1.25 },
      { id: 'butter', good: false, name: 'Butterfingers', desc: 'Plates break 4 times as often.', plateBreak: 4 },
      { id: 'restless', good: false, name: 'Restless Crowd', desc: 'Customers are 20% less patient.', patience: 0.8 },
      { id: 'shy', good: false, name: 'Shy Fish', desc: 'Schools swim off much sooner in the morning.', spotLife: 0.55 }
    ],

    // What customers say. Keys under "waiting" are: any, a species id, or a role id.
    chatter: {
      waiting: {
        any: ['Smells good out here.', 'Nice night for it.', 'I could eat a whale.', 'Love the lanterns.'],
        human: ['Is the eel safe?', 'Do the glowing ones glow inside you?', 'Just normal fish for me.'],
        mermaid: ['Best kelp in the sea!', 'I can hear the fish from here.', 'No fins on my plate, please.'],
        seaking: ['My throne is comfier.', 'Bring me something that sparkles.', 'I ruled this bay once.'],
        octofolk: ['Eight arms, one stomach. Sadly.', 'I could carry my own plates, you know.'],
        sailor: ['Long day on the water.', 'Quick bite, then back to sea.'],
        foodie: ['I hear the chef does it all alone.', 'Presentation matters.', 'Was this caught today?'],
        pirate: ['Arr, what be the priciest thing?', 'Nice boat. Be a shame to lose it.', 'I pay in gold. Usually.'],
        crabfolk: ['Click click. What is cheapest?', 'I brought my own shells.', 'Sideways is the only way.'],
        seawitch: ['I taste the future. It is fried.', 'Serve me well, little cook.', 'The tide owes me a favor.'],
        family: ['Are we eating yet?', 'Sit still, all of you.', 'One big table, how nice.'],
        influencer: ['Hold on, the light is perfect.', 'My followers will love this.', 'Say "kelp"!'],
        critic: ['Hmm. Interesting.', '*scribbles something down*', 'Noted.'],
        royal: ['We are not accustomed to waiting.', 'Is this the royal deck?', 'One course at a time, please.']
      },
      impatient: ['Hello? Anyone?', 'Any day now…', 'Is the chef asleep?', 'I am wasting away here.'],
      eating: ['Mmm…', 'Mmm! So good.', 'Worth the wait.', 'Compliments to the chef!', 'Delicious.'],
      dash: ['Thanks for the grub, sucker!', 'Last one to the dock pays!', "Put it on me tab!"]
    },

    // A question with one reply they like and one they do not. who = any, a species id, or a role id.
    questions: [
      { who: 'human', q: 'Is the eel safe to eat?', good: 'Totally. The zap cooks out.', bad: 'Mostly. Chew slowly.' },
      { who: 'human', q: 'Will fantasy fish make me glow?', good: 'Only with happiness.', bad: 'For a week or two.' },
      { who: 'mermaid', q: 'Did any fish touch my kelp?', good: 'Never. Separate board.', bad: 'Only a little one.' },
      { who: 'mermaid', q: 'Is the kelp picked fresh?', good: 'Picked at dawn.', bad: 'It was floating nearby.' },
      { who: 'seaking', q: 'Do you know who I am?', good: 'Of course, Your Majesty.', bad: 'Table 3, right?' },
      { who: 'seaking', q: 'Is this the finest table?', good: 'Saved it just for you.', bad: 'It is a table.' },
      { who: 'octofolk', q: 'Can I get extra napkins?', good: 'Eight of them, coming up.', bad: 'One per customer.' },
      { who: 'sailor', q: 'Will it take long?', good: 'Quick as the tide.', bad: 'Depends on my mood.' },
      { who: 'foodie', q: 'Was this caught today?', good: 'This morning, by me.', bad: 'Define "today".' },
      { who: 'foodie', q: 'What do you recommend?', good: 'Whatever is freshest tonight.', bad: 'The cheap one.' },
      { who: 'pirate', q: 'Ye take treasure maps?', good: 'Aye, and gold too.', bad: 'Cash only, pal.' },
      { who: 'pirate', q: 'Biggest portion ye got?', good: 'Fit for a captain.', bad: 'Same size for everyone.' },
      { who: 'crabfolk', q: 'You take shells, yes?', good: 'Shells are welcome here.', bad: 'I would prefer real money.' },
      { who: 'seawitch', q: 'Do you fear me, cook?', good: 'I respect you, madam.', bad: 'Should I?' },
      { who: 'family', q: 'Can the little ones have small plates?', good: 'Of course, small plates all round.', bad: 'One size only.' },
      { who: 'influencer', q: 'Can I film the kitchen?', good: 'Get my good side.', bad: 'No phones on deck.' },
      { who: 'royal', q: 'Will each course be worthy of us?', good: 'Fit for a crown.', bad: 'It is food. You eat it.' },
      { who: 'any', q: 'Do you really run this alone?', good: 'Every job, every night.', bad: 'Sadly, yes.' },
      { who: 'any', q: 'Does the boat always rock like this?', good: 'It rocks you to sleep.', bad: 'Only before it sinks.' }
    ],

    // Catch sizes. Bigger fish feed more customers (portions).
    sizes: {
      small: { name: 'Small', weight: 25, portions: 1, value: 0.7, rank: 0 },
      normal: { name: 'Normal', weight: 50, portions: 1, value: 1, rank: 1 },
      big: { name: 'Big', weight: 20, portions: 2, value: 1, rank: 2 },
      trophy: { name: 'Trophy', weight: 5, portions: 3, value: 1, rank: 3 }
    },

    gear: {
      light: { name: 'Light rod', price: 0, desc: 'For small fish' },
      net: { name: 'Net', price: 60, desc: 'Scoops a whole school at once' },
      heavy: { name: 'Heavy rod', price: 180, desc: 'For big fish. Bruises small ones' },
      harpoon: { name: 'Harpoon', price: 350, desc: 'The only thing that stops a giant' }
    },

    // v4.2: one bait for every fish. fish = the only fish that bites it. Used up one per cast.
    baits: {
      krill: { name: 'Krill', price: 2, fish: 'sardine' },
      sandeels: { name: 'Sand eels', price: 2, fish: 'mackerel' },
      worms: { name: 'Bloodworms', price: 2, fish: 'flounder' },
      glow: { name: 'Glow paste', price: 2, fish: 'glowgill' },
      iceshrimp: { name: 'Ice shrimp', price: 2, fish: 'frostfin_cod' },
      crabbits: { name: 'Crab bits', price: 3, fish: 'squid' },
      sparkminnows: { name: 'Spark minnows', price: 4, fish: 'thunder_eel' },
      firegrubs: { name: 'Fire grubs', price: 4, fish: 'ember_trout' },
      moonjelly: { name: 'Moon jelly', price: 4, fish: 'moon_ray' },
      plankton: { name: 'Ghost plankton', price: 4, fish: 'ghost_shrimp' },
      shrimp: { name: 'Shrimp', price: 4, fish: 'coral_snapper' },
      livebait: { name: 'Live sardines', price: 8, fish: 'bluefin_tuna' },
      squidstrips: { name: 'Squid strips', price: 8, fish: 'swordfish' },
      glowworms: { name: 'Deep glowworms', price: 8, fish: 'abyss_angler' },
      urchin: { name: 'Sea urchin', price: 8, fish: 'bubble_puffer' },
      gold: { name: 'Gold flakes', price: 25, fish: 'dragon_koi' },
      stinkbait: { name: 'Stinkbait', price: 30, fish: 'old_whiskers' }
    },

    // v4.1: lures. Bought once, never used up. Each one counts as the right bait for its fish,
    // and has a perk that gets stronger at level 2. perk: tired | quick | big | clean
    // v4.2: one lure for every fish. Bought once, never used up, counts as that fish's bait,
    // and has a perk that gets stronger at level II. perk: tired | quick | big | clean
    lures: {
      sardine: { name: 'Silver Flicker', prices: [60, 100], fish: ['sardine'], perk: 'quick' },
      mackerel: { name: 'Stripe Spinner', prices: [60, 100], fish: ['mackerel'], perk: 'tired' },
      flounder: { name: 'Sand Crawler', prices: [60, 100], fish: ['flounder'], perk: 'clean' },
      glowgill: { name: 'Glow Jig', prices: [70, 110], fish: ['glowgill'], perk: 'quick' },
      frostfin_cod: { name: 'Frost Spoon', prices: [70, 110], fish: ['frostfin_cod'], perk: 'clean' },
      squid: { name: 'Ink Wobbler', prices: [80, 130], fish: ['squid'], perk: 'big' },
      thunder_eel: { name: 'Spark Coil', prices: [110, 170], fish: ['thunder_eel'], perk: 'tired' },
      ember_trout: { name: 'Ember Fly', prices: [110, 170], fish: ['ember_trout'], perk: 'big' },
      moon_ray: { name: 'Moon Feather', prices: [120, 180], fish: ['moon_ray'], perk: 'quick' },
      ghost_shrimp: { name: 'Ghost Lantern', prices: [120, 180], fish: ['ghost_shrimp'], perk: 'clean' },
      coral_snapper: { name: 'Reef Runner', prices: [130, 200], fish: ['coral_snapper'], perk: 'tired' },
      bluefin_tuna: { name: 'Deep Diver', prices: [200, 320], fish: ['bluefin_tuna'], perk: 'tired' },
      swordfish: { name: 'Swordtail Plug', prices: [220, 340], fish: ['swordfish'], perk: 'clean' },
      abyss_angler: { name: 'Abyss Light', prices: [220, 340], fish: ['abyss_angler'], perk: 'quick' },
      bubble_puffer: { name: 'Bubble Popper', prices: [200, 320], fish: ['bubble_puffer'], perk: 'big' },
      dragon_koi: { name: 'Dragon Scale', prices: [450, 700], fish: ['dragon_koi'], perk: 'tired' },
      old_whiskers: { name: 'Catfish King', prices: [500, 800], fish: ['old_whiskers'], perk: 'clean' }
    },
    perks: {
      tired: ['It starts 25% tired.', 'It starts 45% tired.'],
      quick: ['It bites almost at once, with a longer window.', 'It bites at once, with an even longer window.'],
      big: ['Bigger fish bite it.', 'Much bigger fish bite it.'],
      clean: ['Forgives 1 mistake, so clean catches are easier.', 'Forgives 2 mistakes.']
    },

    // value = what one portion is worth as an ingredient (drives dish prices).
    // sign = what you see on the water. gear = what can land it (first is best).
    // stamina = how long the fight is. power = how hard it runs. special = its trick.
    fish: {
      sardine: { name: 'Sardine', type: 'real', rarity: 'common', value: 4, color: 0xb8c7d6, sign: 'ripples', gear: ['net', 'light'], bait: 'krill', stamina: 0.5, power: 0.3, special: 'none', tip: 'Swims in schools. A net scoops several.' },
      glowgill: { name: 'Glowgill', type: 'fantasy', rarity: 'common', value: 6, color: 0x7dffb0, sign: 'glow', gear: ['light'], bait: 'glow', stamina: 0.75, power: 0.45, special: 'blink', nightBoost: 2, tip: 'Blinks out of sight. Stop reeling while it is dark.' },
      squid: { name: 'Squid', type: 'real', rarity: 'common', value: 8, color: 0xe58fb0, sign: 'ink', gear: ['light'], bait: 'crabbits', stamina: 0.9, power: 0.5, special: 'ink', tip: 'Inks your screen. Feel the line.' },
      thunder_eel: { name: 'Thunder Eel', type: 'fantasy', rarity: 'uncommon', value: 10, color: 0xf2d53c, sign: 'bubbles', gear: ['light', 'heavy'], bait: 'sparkminnows', stamina: 1, power: 0.6, special: 'zap', tip: 'Zaps the line. Let go during each zap.' },
      crab: { name: 'Crab', type: 'real', rarity: 'uncommon', value: 9, color: 0xe8553a, trap: true, tip: 'Only walks into traps. Set one and come back.' },
      ghost_shrimp: { name: 'Ghost Shrimp', type: 'fantasy', rarity: 'uncommon', value: 12, color: 0xcfe8ff, nightOnly: true, gear: ['light'], bait: 'plankton', stamina: 0.6, power: 0.4, special: 'phase', tip: 'Only seen at night, off the dining deck.' },
      bluefin_tuna: { name: 'Bluefin Tuna', type: 'real', rarity: 'rare', value: 22, color: 0x3c6fd9, sign: 'birds', gear: ['heavy'], bait: 'livebait', stamina: 1.5, power: 0.9, special: 'dive', tip: 'Dives deep. Snaps a light rod every time.' },
      dragon_koi: { name: 'Sunscale Dragon Koi', type: 'fantasy', rarity: 'legendary', value: 60, color: 0xff8a2b, sign: 'gold', gear: ['heavy'], bait: 'gold', needsBait: true, stamina: 1.8, power: 0.8, special: 'sparks', tip: 'Breathes spark patterns. Only bites Gold flakes or a Dragon Scale.' },
      old_whiskers: { name: 'Old Whiskers', type: 'real', rarity: 'boss', value: 30, color: 0x6b7a5a, sign: 'shadow', gear: ['harpoon'], bait: 'stinkbait', stamina: 1.1, power: 1, special: 'boss', stages: 3, portions: 6, boss: true, tip: 'A giant catfish. Three rounds with the harpoon.' },
      // Coral Bay fish (the area itself is rebuilt in v4)
      coral_snapper: { name: 'Coral Snapper', type: 'real', rarity: 'uncommon', value: 14, color: 0xff6f91, sign: 'reef', gear: ['light', 'heavy'], bait: 'shrimp', stamina: 1, power: 0.6, special: 'dive', tip: 'A strong runner from the reef.' },
      bubble_puffer: { name: 'Bubble Puffer', type: 'fantasy', rarity: 'rare', value: 28, color: 0xc59bff, sign: 'puff', gear: ['light'], bait: 'urchin', stamina: 1.2, power: 0.6, special: 'blink', tip: 'Puffs up and vanishes in its own bubbles.' },
      // --- v3.1: new fish. Real ones ---
      mackerel: { name: 'Mackerel', type: 'real', rarity: 'common', value: 5, color: 0x5f8fa8, sign: 'flash', gear: ['net', 'light'], bait: 'sandeels', stamina: 0.6, power: 0.4, special: 'none', tip: 'Fast and striped. Travels in schools.' },
      flounder: { name: 'Flounder', type: 'real', rarity: 'common', value: 6, color: 0xa88a5f, sign: 'sand', gear: ['light'], bait: 'worms', stamina: 0.7, power: 0.35, special: 'ink', tip: 'Flat fish that kicks up sand. You lose sight of the line.' },
      lobster: { name: 'Lobster', type: 'real', rarity: 'uncommon', value: 16, color: 0xc8423b, trap: true, tip: 'Sometimes crawls into a crab trap.' },
      swordfish: { name: 'Swordfish', type: 'real', rarity: 'rare', value: 26, color: 0x4a6fa5, sign: 'fin', gear: ['heavy'], bait: 'squidstrips', stamina: 1.6, power: 1, special: 'zap', tip: 'Slashes with its sword. Let go when it thrashes.' },
      // --- v3.1: new fish. Fantasy ones ---
      frostfin_cod: { name: 'Frostfin Cod', type: 'fantasy', rarity: 'common', value: 6, color: 0x9fe3ff, sign: 'frost', gear: ['light'], bait: 'iceshrimp', stamina: 0.7, power: 0.4, special: 'blink', tip: 'Freezes into clear ice and vanishes. Stop reeling.' },
      ember_trout: { name: 'Ember Trout', type: 'fantasy', rarity: 'uncommon', value: 11, color: 0xff6a3c, sign: 'embers', gear: ['light', 'heavy'], bait: 'firegrubs', stamina: 0.95, power: 0.6, special: 'zap', tip: 'Spits embers up the line. Let go when it flares.' },
      moon_ray: { name: 'Moon Ray', type: 'fantasy', rarity: 'uncommon', value: 13, color: 0xd8d0ff, sign: 'moon', gear: ['light'], bait: 'moonjelly', stamina: 1, power: 0.5, special: 'phase', nightBoost: 2, tip: 'Glides into the dark. Watch the fish, not the meter.' },
      abyss_angler: { name: 'Abyss Angler', type: 'fantasy', rarity: 'rare', value: 30, color: 0x3a2f6b, sign: 'lure', gear: ['heavy'], bait: 'glowworms', stamina: 1.5, power: 0.85, special: 'phase', tip: 'From the deep trench. Its lure hides it in the dark.' }
    },

    areas: {
      home: {
        name: 'Home Waters', sky: 0x8fd3ff, water: 0x2a7fb8,
        spots: { sardine: 26, mackerel: 20, flounder: 16, glowgill: 20, frostfin_cod: 16, squid: 14, thunder_eel: 14, ember_trout: 12, moon_ray: 9, bluefin_tuna: 9, swordfish: 6, abyss_angler: 5, dragon_koi: 3 },
        night: { glowgill: 40, ghost_shrimp: 35, moon_ray: 18, sardine: 20, thunder_eel: 12 },
        boss: 'old_whiskers', journal: ['sardine', 'mackerel', 'flounder', 'glowgill', 'frostfin_cod', 'squid', 'thunder_eel', 'ember_trout', 'moon_ray', 'crab', 'lobster', 'ghost_shrimp', 'bluefin_tuna', 'swordfish', 'abyss_angler', 'dragon_koi', 'old_whiskers'],
        species: { human: 50, mermaid: 25, seaking: 25, crabfolk: 14, seawitch: 8 }
      },
      coral: {
        name: 'Coral Bay', sky: 0xffc9d9, water: 0x1fa3a3,
        spots: { sardine: 16, glowgill: 14, coral_snapper: 28, bubble_puffer: 14, thunder_eel: 12, bluefin_tuna: 10, dragon_koi: 4 },
        night: { glowgill: 40, ghost_shrimp: 30, bubble_puffer: 15 },
        journal: ['coral_snapper', 'bubble_puffer'],
        species: { human: 35, mermaid: 20, seaking: 20, octofolk: 25, crabfolk: 12, seawitch: 8 }
      }
    },

    sides: {
      tortilla: { name: 'Tortilla', price: 2 },
      rice: { name: 'Rice', price: 2 },
      kelp: { name: 'Sea kelp', price: 3 },
      veggies: { name: 'Veggies', price: 3 },
      bread: { name: 'Bread', price: 2 }
    },

    // heat: grill | fry | pot | none. Price is worked out from the ingredients
    // (x priceMultiplier) unless a recipe sets its own.
    recipes: [
      { id: 'grilled_sardine', name: 'Grilled Sardine', fish: { sardine: 1 }, sides: {}, heat: 'grill', kind: 'real' },
      { id: 'glowgill_tacos', name: 'Glowgill Tacos', fish: { glowgill: 1 }, sides: { tortilla: 1 }, heat: 'fry', kind: 'fantasy' },
      { id: 'kelp_wrap', name: 'Kelp Wrap', fish: {}, sides: { kelp: 1, rice: 1 }, heat: 'none', kind: 'kelp' },
      // v4.2: Catch of the Day. Any 1 fish off the grill, always known, sells cheap. Uses your cheapest fish,
      // so whatever the morning brought in can still be sold. Fixed price: below almost every named dish.
      { id: 'catch_of_the_day', name: 'Catch of the Day', fish: {}, anyFish: 1, sides: {}, heat: 'grill', kind: 'mixed', price: 10, always: true },
      { id: 'fried_calamari', name: 'Fried Calamari', fish: { squid: 1 }, sides: { veggies: 1 }, heat: 'fry', kind: 'real', unlock: 60 },
      { id: 'crab_cakes', name: 'Crab Cakes', fish: { crab: 1 }, sides: { rice: 1 }, heat: 'fry', kind: 'real', unlock: 80 },
      { id: 'thunder_eel_soup', name: 'Thunder Eel Soup', fish: { thunder_eel: 1 }, sides: { veggies: 1 }, heat: 'pot', kind: 'fantasy', unlock: 100 },
      { id: 'shrimp_skewers', name: 'Ghost Shrimp Skewers', fish: { ghost_shrimp: 1 }, sides: { kelp: 1 }, heat: 'grill', kind: 'fantasy', unlock: 140 },
      { id: 'seafood_platter', name: 'Seafood Platter', fish: {}, anyFish: 3, sides: {}, heat: 'grill', kind: 'mixed', price: 45, unlock: 160 },
      { id: 'tuna_sushi', name: 'Tuna Sushi', fish: { bluefin_tuna: 1 }, sides: { rice: 1 }, heat: 'none', kind: 'real', unlock: 240 },
      { id: 'dragon_koi_feast', name: 'Dragon Koi Feast', fish: { dragon_koi: 1 }, sides: { rice: 1, veggies: 1 }, heat: 'grill', kind: 'fantasy', unlock: 400, needs: 'dragongrill' }, // needs = an upgrade id
      // --- v3.1: new recipes ---
      { id: 'seaweed_salad', name: 'Seaweed Salad', fish: {}, sides: { kelp: 2, veggies: 1 }, heat: 'none', kind: 'kelp', unlock: 50 },
      { id: 'sardine_toast', name: 'Sardine Toast', fish: { sardine: 1 }, sides: { bread: 1 }, heat: 'grill', kind: 'real', unlock: 40 },
      { id: 'smoked_mackerel', name: 'Smoked Mackerel', fish: { mackerel: 1 }, sides: { rice: 1 }, heat: 'grill', kind: 'real', unlock: 70 },
      { id: 'fish_and_chips', name: 'Flounder & Chips', fish: { flounder: 1 }, sides: { veggies: 1 }, heat: 'fry', kind: 'real', unlock: 90 },
      { id: 'frostfin_ceviche', name: 'Frostfin Ceviche', fish: { frostfin_cod: 1 }, sides: { veggies: 1 }, heat: 'none', kind: 'fantasy', unlock: 90 },
      { id: 'glowgill_sushi', name: 'Glowgill Sushi', fish: { glowgill: 1 }, sides: { rice: 1 }, heat: 'none', kind: 'fantasy', unlock: 80 },
      { id: 'ember_trout_tacos', name: 'Ember Trout Tacos', fish: { ember_trout: 1 }, sides: { tortilla: 1 }, heat: 'fry', kind: 'fantasy', unlock: 120 },
      { id: 'moon_ray_ramen', name: 'Moon Ray Ramen', fish: { moon_ray: 1 }, sides: { kelp: 1, rice: 1 }, heat: 'pot', kind: 'fantasy', unlock: 150 },
      { id: 'lobster_roll', name: 'Lobster Roll', fish: { lobster: 1 }, sides: { bread: 1 }, heat: 'pot', kind: 'real', unlock: 180 },
      { id: 'swordfish_steak', name: 'Swordfish Steak', fish: { swordfish: 1 }, sides: { veggies: 1 }, heat: 'grill', kind: 'real', unlock: 220 },
      { id: 'abyss_stew', name: 'Abyss Angler Stew', fish: { abyss_angler: 1 }, sides: { rice: 1, veggies: 1 }, heat: 'pot', kind: 'fantasy', unlock: 300 },
      { id: 'whiskers_gumbo', name: 'Old Whiskers Gumbo', fish: { old_whiskers: 1 }, sides: { rice: 1, veggies: 1 }, heat: 'pot', kind: 'real', legendary: true }
    ],

    heat: {
      grill: { name: 'Grill' }, fry: { name: 'Fryer' }, pot: { name: 'Pot' }, none: { name: 'No cooking' }
    },

    roles: {
      sailor: { id: 'sailor', name: 'Sailor', letter: 'S', color: 0x3d7edb, weight: 45, patience: 'high', pay: 1, blurb: 'cheap + fast' },
      foodie: { id: 'foodie', name: 'Foodie', letter: 'F', color: 0xd9548f, weight: 30, patience: 'medium', pay: 1.2, minMenu: 3, blurb: 'wants quality' },
      pirate: { id: 'pirate', name: 'Pirate', letter: 'P', color: 0x333333, weight: 25, patience: 'low', pay: 1.6, blurb: 'priciest dish' },
      // v3: fromDay = first day they can show up. group = [min, max] size. courses = dishes served one by one.
      family: { id: 'family', name: 'Family', letter: 'Fa', color: 0x3f9e5a, weight: 10, patience: 'high', pay: 1, group: [3, 4], fromDay: 2, blurb: '3-4 people, BIG table' },
      influencer: { id: 'influencer', name: 'Influencer', letter: 'I', color: 0x1fa3c4, weight: 10, patience: 'medium', pay: 1, fromDay: 2, blurb: 'happy = more guests tomorrow' },
      critic: { id: 'critic', name: 'Critic', letter: 'C', color: 0x6b7785, weight: 7, patience: 'medium', pay: 1, secret: true, fromDay: 3, blurb: 'in disguise! review counts x5' },
      royal: { id: 'royal', name: 'Royal', letter: 'R', color: 0x7b2d8e, weight: 6, patience: 'high', pay: 1.5, courses: 3, minMenu: 3, fromDay: 4, blurb: '3 courses, one at a time' }
    },

    species: {
      human: { id: 'human', name: 'Human', letter: 'H', color: 0xe8b98a, eats: ['real', 'fantasy', 'kelp', 'mixed'], fantasyNerves: 1.4, blurb: 'nervous about fantasy fish' },
      mermaid: { id: 'mermaid', name: 'Mermaid', letter: 'M', color: 0x4fd1c5, eats: ['kelp'], blurb: 'kelp dishes only' },
      seaking: { id: 'seaking', name: 'Sea King', letter: 'K', color: 0xe0b23a, eats: ['fantasy'], pay: 1.3, blurb: 'fantasy fish only' },
      octofolk: { id: 'octofolk', name: 'Octofolk', letter: 'O', color: 0xb26bd6, eats: ['real', 'fantasy', 'kelp', 'mixed'], orders: 2, blurb: 'orders 2 dishes' },
      crabfolk: { id: 'crabfolk', name: 'Crabfolk', letter: 'C', color: 0xf0916f, eats: ['real', 'fantasy', 'kelp', 'mixed'], cheap: true, shells: true, fromDay: 2, blurb: 'cheapest dish, pays in shells' },
      seawitch: { id: 'seawitch', name: 'Sea Witch', letter: 'W', color: 0x9fd68f, eats: ['fantasy'], hex: true, fromDay: 3, blurb: 'fantasy only. Blesses or curses' }
    },

    regulars: [
      {
        id: 'gus', name: 'Old Gus', role: 'sailor', species: 'human', dayMod: 2,
        favorite: 'grilled_sardine', reward: 'thunder_eel_soup',
        lines: ["Evenin', cap'n. The usual, if you've got it.", "Calm sea tonight. Good night for a sardine."]
      },
      {
        id: 'marina', name: 'Marina', role: 'foodie', species: 'mermaid', dayMod: 0,
        favorite: 'kelp_wrap', reward: 'seafood_platter',
        lines: ['Your deck looks lovely tonight.', 'Kelp, please. And make it pretty.']
      }
    ],

    // Each tier costs about 2x the last; each should pay for itself in 2-4 nights.
    upgrades: [
      { id: 'tables', name: 'Tables', prices: [150, 350], desc: '4, then 6 tables. The boat grows with them' },
      { id: 'tank', name: 'Fish tank', prices: [120, 300], desc: 'Holds 15, then 25. Fish stay fresh 1 day longer. Only level 2 keeps a boss fish overnight' },
      { id: 'station', name: 'Kitchen', prices: [200, 450], desc: 'A 2nd cutting board and 2, then 3 burners per station' },
      { id: 'board', name: 'Menu board', prices: [200], desc: '6 menu slots instead of 4' },
      // v3: these unlock things you cannot get any other way
      { id: 'bigtable', name: 'Big tables', prices: [120, 260], desc: 'Table 2, then table 4, seats 2-4. Groups and Families only book if you have one' },
      { id: 'vip', name: 'VIP table', prices: [400], desc: 'Ropes off table 1. Royals only book (and only sit) at a VIP table' },
      { id: 'dragongrill', name: 'Dragon Grill', prices: [350], desc: 'A far hotter grill. The Dragon Koi Feast cannot be cooked without it' },
      { id: 'engine', name: 'Boat engine', prices: [1500], desc: 'Unlocks sailing to Coral Bay' }
    ],

    decor: [
      // style = points towards your style stars
      { id: 'lanterns', name: 'Deck lanterns', price: 40, style: 2, desc: 'Light to fish off the deck at night' },
      { id: 'plants', name: 'Plants', price: 30, style: 1, desc: 'Greenery in the corners' },
      { id: 'sign', name: 'Sign', price: 60, style: 2, desc: 'Shows your restaurant name' },
      { id: 'tablestyle', name: 'Checked tablecloths', price: 50, style: 2, desc: 'Red and white, on every table' },
      { id: 'flags', name: 'Bunting', price: 45, style: 1, desc: 'Little flags along the rail' },
      { id: 'stringlights', name: 'String lights', price: 70, style: 2, desc: 'Coloured bulbs over the deck' },
      { id: 'rugs', name: 'Rugs', price: 80, style: 2, desc: 'A rug under every table' },
      { id: 'aquarium', name: 'Aquarium wall', price: 180, style: 3, desc: 'A glass tank by the dining deck' }
    ],

    // Boat paint: the colour of the trim. null = the theme's own colour.
    paints: [
      { id: 'theme', name: 'Theme', color: null },
      { id: 'red', name: 'Red', color: 0xc8423b },
      { id: 'navy', name: 'Navy', color: 0x2f4f8f },
      { id: 'gold', name: 'Gold', color: 0xd9a520 },
      { id: 'mint', name: 'Mint', color: 0x5bc8a0 },
      { id: 'plum', name: 'Plum', color: 0x8e4a9e }
    ],

    themes: {
      // loves = the roles and species who love this look (see config.style)
      beach: { name: 'Beach Shack', deck: 0xd9b77a, hull: 0xf0dfb4, trim: 0x3bb6b0, table: 0xfff3d6, loves: ['mermaid', 'crabfolk', 'family'] },
      pirate: { name: 'Pirate Ship', deck: 0x7a4e2d, hull: 0x4a2e1a, trim: 0xb3262b, table: 0xc9a56b, loves: ['pirate', 'sailor', 'seawitch'] }
    }
  };
})();
