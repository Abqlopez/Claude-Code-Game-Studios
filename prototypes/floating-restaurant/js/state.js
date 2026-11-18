// Game state, saving, and the rules that several screens share.
(function () {
  const D = FR.DATA, C = D.config;
  const KEY = 'floating-restaurant-save-v1';

  FR.rand = (a, b) => a + Math.random() * (b - a);
  FR.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  FR.weighted = function (w) {
    let total = 0;
    for (const k in w) total += w[k];
    let r = Math.random() * total;
    for (const k in w) { r -= w[k]; if (r <= 0) return k; }
    return Object.keys(w)[0];
  };

  const newLedger = () => ({ sales: 0, tips: 0, raw: 0, rewards: 0, ingredients: 0, bait: 0, plates: 0, invest: 0, wages: 0 });
  const V3 = () => ({ shells: 0, buzz: 0, hex: null, name: 'Floating Restaurant', paint: 'theme', staff: {}, sections: {}, layout: { tables: {}, stations: {} }, stats: { earned: 0, species: {} }, milestones: {} });

  FR.newState = function () {
    const st = {
      v: 2, day: 1, money: C.startMoney, area: 'home', home: 'home', won: false,
      tank: [], nextUid: 1,
      sides: Object.assign({}, C.startSides),
      baits: Object.assign({}, C.startBaits), bait: null, lures: {}, lure: null,
      gear: { light: true }, useGear: 'light', traps: 0,
      plates: C.startPlates,
      journal: {}, journalDone: {}, trophies: [], bossBeaten: false,
      spot: false,
      known: C.startRecipes.slice(), menu: C.startRecipes.slice(),
      upgrades: { tank: 0, station: 0, board: 0, tables: 0, engine: 0, bigtable: 0, vip: 0, dragongrill: 0 },
      name: 'Floating Restaurant', paint: 'theme',
      staff: {}, sections: {}, layout: { tables: {}, stations: {} }, stats: { earned: 0, species: {} }, milestones: {}, // v3 step 5
      decor: {}, theme: 'beach',
      reviews: C.startReviews.slice(), requests: [],
      friends: { gus: 0, marina: 0 },
      shells: 0, buzz: 0, hex: null, // v3: Crabfolk shells, tomorrow's extra guests, the Sea Witch's spell
      ledger: newLedger()
    };
    // v4.2: a few fish to get the first night going, and an empty "which bait does this fish want" notebook
    st.baitSeen = {}; for (const id in (C.startFish || {})) st.baitSeen[id] = true;
    for (const id in (C.startFish || {})) for (let i = 0; i < C.startFish[id]; i++) st.tank.push({ uid: st.nextUid++, id, age: 0, cut: 'normal', size: 'normal', portions: 1 });
    return st;
  };

  // Bring a version 1 save forward so nobody loses their boat.
  function migrate(s) {
    if (s.v === 2) return s;
    const n = FR.newState();
    const rod = (s.upgrades && s.upgrades.rod) || 0;
    Object.assign(n, {
      day: s.day, money: s.money, area: s.area, won: s.won, nextUid: s.nextUid || 1,
      sides: Object.assign(n.sides, s.sides), spot: !!s.spot,
      decor: s.decor || {}, theme: s.theme || 'beach', reviews: s.reviews || n.reviews,
      friends: s.friends || n.friends
    });
    n.tank = (s.tank || []).map(f => Object.assign({ size: 'normal', portions: 1 }, f));
    n.known = (s.known || []).filter(id => D.recipes.some(r => r.id === id));
    n.menu = (s.menu || []).filter(id => n.known.includes(id));
    ['tank', 'station', 'board', 'tables', 'engine'].forEach(k => { n.upgrades[k] = (s.upgrades && s.upgrades[k]) || 0; });
    if (rod > 0) n.gear.heavy = true;
    n.baits.gold += s.bait || 0;
    return n;
  }

  FR.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(FR.state)); } catch (e) { /* storage unavailable */ }
  };
  FR.load = function () {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && (s.v === 1 || s.v === 2)) {
        const m = Object.assign(V3(), migrate(s));
        m.ledger = Object.assign(newLedger(), m.ledger);
        m.upgrades = Object.assign({ bigtable: 0, vip: 0, dragongrill: 0 }, m.upgrades);
        for (const id in D.sides) if (typeof m.sides[id] !== 'number') m.sides[id] = 0; // v3.1: new sides
        // v4.2: every fish has its own bait and lure. v4.1's group lures become the lure of their main fish.
        for (const id in D.baits) if (typeof m.baits[id] !== 'number') m.baits[id] = 0;
        for (const id in m.baits) if (!D.baits[id]) delete m.baits[id];
        const old = { spinner: 'sardine', crawler: 'flounder', jig: 'glowgill', fly: 'ember_trout', dragon: 'dragon_koi' };
        m.lures = m.lures || {}; for (const k in old) if (m.lures[k]) { m.lures[old[k]] = Math.max(m.lures[old[k]] || 0, m.lures[k]); delete m.lures[k]; }
        for (const k in m.lures) if (!D.lures[k]) delete m.lures[k];
        if (m.lure && old[m.lure]) m.lure = old[m.lure];
        if (m.lure && !m.lures[m.lure]) m.lure = null;
        if (m.bait && !D.baits[m.bait]) m.bait = null;
        m.baitSeen = m.baitSeen || {};
        D.recipes.forEach(r => { if (r.always && !m.known.includes(r.id)) m.known.push(r.id); }); // v4.2: Catch of the Day for old saves
        if (!D.themes[m.theme]) m.theme = 'beach'; m.decor = m.decor || {}; m.paint = m.paint || 'theme';
        return m;
      }
    } catch (e) { /* no save */ }
    return null;
  };

  // --- Money: everything goes through the ledger so the night's earnings screen adds up ---
  FR.earn = function (key, amount) { const S = FR.state; S.money += amount; S.ledger[key] += amount; if (key === 'sales' || key === 'tips') S.stats.earned += amount; };
  FR.spend = function (key, amount) {
    const S = FR.state;
    if (S.money < amount) return false;
    S.money -= amount; S.ledger[key] += amount;
    return true;
  };

  // --- Layout, staff, milestones (v3 step 5) ---
  FR.tablePos = i => FR.state.layout.tables[i] || C.layout.tables[i];
  FR.stationPos = k => (k === 'rod' ? C.layout.rod : FR.state.layout.stations[k] || C.layout.stations[k]);
  FR.hired = id => FR.state.staff[id] || null;
  // How fast a staff member works right now. tired = 0..1, how far through the night it is.
  FR.staffSpeed = function (id, tired) {
    const st = FR.state.staff[id], R = C.staffRules;
    return st ? R.levelSpeed[st.level - 1] * (R.minMood + (1 - R.minMood) * st.mood) * (1 - R.tired * (tired || 0) / st.level) : 0;
  };
  FR.wages = () => D.staff.reduce((n, d) => n + (FR.state.staff[d.id] ? d.wage : 0), 0);
  FR.milestoneDone = id => !!FR.state.milestones[id];
  // Returns the milestones finished just now (and pays any cash reward).
  FR.checkMilestones = function () {
    const S = FR.state, out = [];
    D.milestones.forEach(m => {
      if (S.milestones[m.id]) return;
      const ok = m.kind === 'earned' ? S.stats.earned >= m.n : m.kind === 'stars' ? FR.rating() >= m.n && S.reviews.length >= 10 : Object.keys(D.areas.home.species).every(sp => S.stats.species[sp]);
      if (!ok) return;
      S.milestones[m.id] = true;
      if (m.cash) FR.earn('rewards', m.cash);
      out.push(m);
    });
    return out;
  };

  // --- The Sea Witch's blessing or curse for today (1 = no effect) ---
  FR.hexDef = () => (FR.state.hex ? D.hexes.find(h => h.id === FR.state.hex) : null) || null;
  FR.hexMod = k => { const h = FR.hexDef(); return (h && h[k]) || 1; };

  // --- v4.1: what is on your hook, and does this fish want it? ---
  // You carry either one bait (used up per cast) or one lure (never used up).
  FR.tackle = function () {
    const S = FR.state;
    if (S.lure && S.lures[S.lure]) return { kind: 'lure', id: S.lure, lv: S.lures[S.lure], name: D.lures[S.lure].name + (S.lures[S.lure] > 1 ? ' II' : '') };
    if (S.bait && S.baits[S.bait] > 0) return { kind: 'bait', id: S.bait, name: D.baits[S.bait].name };
    return null;
  };
  FR.tackleFits = (fishId, tk) => { tk = tk === undefined ? FR.tackle() : tk; const f = D.fish[fishId]; if (!tk) return false; return tk.kind === 'bait' ? tk.id === f.bait : D.lures[tk.id].fish.includes(fishId); };
  // chance this fish bites at all with what you carry
  FR.biteChance = function (fishId, tk) {
    tk = tk === undefined ? FR.tackle() : tk;
    if (FR.tackleFits(fishId, tk)) return 1;
    const R = C.baitRules, rar = D.fish[fishId].rarity;
    return (tk ? R.wrong : R.none)[rar] || 0;
  };

  // v4.2: do you know which bait this fish wants? (from the journal, or from a fish that refused your hook)
  FR.baitKnown = id => !!(FR.state.journal[id] || (FR.state.baitSeen || {})[id]);
  FR.lureFor = id => Object.keys(D.lures).find(l => D.lures[l].fish.includes(id)) || null;
  // can you catch it at all right now? (its bait in stock, or its lure)
  FR.canHook = id => { const S = FR.state, f = D.fish[id], l = FR.lureFor(id); return !!((f.bait && S.baits[f.bait] > 0) || (l && S.lures[l])); };
  // the fish your menu needs, and whether you have the bait for each
  FR.menuNeeds = function () {
    const S = FR.state, out = [];
    S.menu.map(FR.recipe).forEach(r => { for (const id in r.fish) if (!out.some(x => x.id === id) && !D.fish[id].trap) out.push({ id, bait: D.fish[id].bait, have: S.baits[D.fish[id].bait] || 0, lure: !!S.lures[FR.lureFor(id)], stock: FR.portionsOf(id) }); });
    return out;
  };

  // --- Upgrade lookups ---
  FR.tankCap = () => C.tankSize[FR.state.upgrades.tank];
  FR.menuSlots = () => C.menuSlots[FR.state.upgrades.board];
  FR.tableCount = () => C.tables[FR.state.upgrades.tables];
  FR.burners = () => C.stations[FR.state.upgrades.station];
  FR.boardCount = () => (FR.state.upgrades.station > 0 ? 2 : 1);
  FR.decorCount = () => D.decor.filter(d => FR.state.decor[d.id]).length + FR.state.trophies.length;
  FR.bigTables = () => C.group.bigTables.slice(0, FR.state.upgrades.bigtable).filter(i => i < FR.tableCount());
  FR.canCook = r => !r.needs || FR.state.upgrades[r.needs] > 0;
  // --- Style (v3): decor points -> stars; guests who love your theme like you even more ---
  FR.stylePoints = () => D.decor.reduce((n, d) => n + (FR.state.decor[d.id] ? d.style : 0), 0) + FR.state.trophies.length * C.style.trophy;
  FR.styleStars = () => C.style.stars.filter(n => FR.stylePoints() >= n).length;
  FR.loves = (roleId, speciesId) => { const l = D.themes[FR.state.theme].loves || []; return l.includes(roleId) || l.includes(speciesId); };
  FR.stylePatience = (roleId, speciesId) => 1 + FR.styleStars() * (C.style.patiencePerStar + (FR.loves(roleId, speciesId) ? C.style.lovePatiencePerStar : 0));
  FR.trimColor = () => { const p = D.paints.find(x => x.id === FR.state.paint); return p && p.color !== null ? p.color : D.themes[FR.state.theme].trim; };

  // --- Fish ---
  FR.rollSize = function (lucky) {
    lucky = lucky || FR.hexMod('lucky') > 1;
    const w = {};
    for (const id in D.sizes) w[id] = D.sizes[id].weight * (lucky && D.sizes[id].rank >= 2 ? 2 : 1);
    return FR.weighted(w);
  };
  FR.addFish = function (id, cut, size) {
    const S = FR.state, def = D.fish[id];
    size = size || 'normal';
    const f = { uid: S.nextUid++, id, age: 0, cut: cut || 'normal', size, portions: def.portions || D.sizes[size].portions };
    S.tank.push(f);
    return f;
  };
  // Fresh on day 1, OK on day 2, spoiled on day 3. The tank upgrade adds a fresh day.
  FR.freshness = function (f) {
    if (D.fish[f.id].boss && FR.state.upgrades.tank < C.bossTankLevel) return f.age <= 0 ? 'fresh' : 'spoiled'; // a giant needs the giant tank
    const a = f.age - (FR.state.upgrades.tank > 0 ? 1 : 0);
    return a <= 0 ? 'fresh' : a === 1 ? 'ok' : 'spoiled';
  };
  FR.rawValue = function (f) {
    const v = C.rawShare * C.priceMultiplier * D.fish[f.id].value * D.sizes[f.size || 'normal'].value * f.portions;
    return Math.max(1, Math.round(v * (FR.freshness(f) === 'ok' ? C.rawOkMultiplier : 1)));
  };
  FR.portionsOf = id => FR.state.tank.filter(f => f.id === id).reduce((n, f) => n + f.portions, 0);
  FR.portionsAll = () => FR.state.tank.reduce((n, f) => n + f.portions, 0);

  // The fish journal. Returns what (if anything) the catch unlocked.
  FR.logCatch = function (id, size) {
    const S = FR.state, def = D.fish[id];
    const j = S.journal[id] || (S.journal[id] = { n: 0, best: size });
    const out = { first: j.n === 0, reward: 0, complete: null };
    j.n++;
    if (D.sizes[size].rank > D.sizes[j.best].rank) j.best = size;
    if (out.first) { out.reward = Math.round(def.value * C.journalFirstCatch); FR.earn('rewards', out.reward); }
    for (const a in D.areas) {
      if (!S.journalDone[a] && D.areas[a].journal.every(f => S.journal[f])) {
        S.journalDone[a] = true; out.complete = D.areas[a].name; FR.earn('rewards', C.journalComplete);
      }
    }
    return out;
  };

  // --- Reputation ---
  FR.rating = function () {
    const r = FR.state.reviews;
    if (!r.length) return 1;
    const avg = r.reduce((a, b) => a + b, 0) / r.length;
    return Math.max(1, Math.min(5, Math.round(avg * 10) / 10));
  };
  FR.customersTonight = function () {
    const [lo, hi] = C.customersByStars;
    const byDay = Math.floor((FR.state.day - 1) * C.customersPerDay);
    return Math.min(C.customersMax, Math.round(lo + (FR.rating() - 1) / 4 * (hi - lo)) + byDay) + (FR.state.buzz || 0);
  };

  // --- Recipes and ingredients ---
  FR.recipe = id => D.recipes.find(r => r.id === id);
  FR.edible = (species, recipe) => species.eats.includes(recipe.kind);
  FR.recipeCost = function (r) {
    let c = 0;
    for (const id in r.fish) c += D.fish[id].value * r.fish[id];
    for (const id in r.sides) c += D.sides[id].price * r.sides[id];
    return c;
  };
  FR.price = r => (r.price !== undefined ? r.price : Math.round(C.priceMultiplier * FR.recipeCost(r)));

  FR.canMakeCount = function (r) {
    const S = FR.state;
    let n = 99;
    for (const id in r.fish) n = Math.min(n, Math.floor(FR.portionsOf(id) / r.fish[id]));
    if (r.anyFish) n = Math.min(n, Math.floor(FR.portionsAll() / r.anyFish));
    for (const id in r.sides) n = Math.min(n, Math.floor((S.sides[id] || 0) / r.sides[id]));
    return n;
  };

  // Take one portion off a fish. Returns a light copy that remembers where it came from.
  function takePortion(f) {
    const S = FR.state;
    f.portions--;
    if (f.portions <= 0) S.tank = S.tank.filter(x => x !== f);
    return { uid: f.uid, id: f.id, age: f.age, cut: f.cut, size: f.size };
  }

  // Pull the ingredients for one serving out of stock. Oldest fish go first;
  // the platter uses your cheapest fish so it never eats a Dragon Koi by accident.
  FR.reserve = function (r) {
    if (FR.canMakeCount(r) < 1) return null;
    const S = FR.state, res = { fish: [], sides: {} };
    for (const id in r.fish) {
      for (let i = 0; i < r.fish[id]; i++) {
        const f = S.tank.filter(x => x.id === id).sort((a, b) => b.age - a.age)[0];
        res.fish.push(takePortion(f));
      }
    }
    for (let i = 0; i < (r.anyFish || 0); i++) {
      const f = S.tank.slice().sort((a, b) => D.fish[a.id].value - D.fish[b.id].value || b.age - a.age)[0];
      res.fish.push(takePortion(f));
    }
    for (const id in r.sides) { S.sides[id] -= r.sides[id]; res.sides[id] = r.sides[id]; }
    return res;
  };
  // Take one portion of a fish out of the tank by hand (oldest first).
  FR.takeFish = function (id) {
    const f = FR.state.tank.filter(x => x.id === id).sort((a, b) => b.age - a.age)[0];
    return f ? takePortion(f) : null;
  };
  FR.refundFish = function (p) {
    const S = FR.state, f = S.tank.find(x => x.uid === p.uid);
    if (f) f.portions++; else S.tank.push(Object.assign({ portions: 1 }, p));
  };
  FR.refund = function (res) {
    if (!res) return;
    res.fish.forEach(FR.refundFish);
    for (const id in res.sides) FR.state.sides[id] += res.sides[id];
  };

  // Dish quality = how well it was cooked + how fresh / cleanly caught the fish was.
  FR.qualityOf = function (score, fish) {
    let mod = 0;
    if (fish && fish.length) {
      for (const f of fish) {
        if (FR.freshness(f) === 'ok') mod += C.fishMods.ok;
        if (f.cut === 'perfect') mod += C.fishMods.perfectCut;
        if (f.cut === 'bruised') mod += C.fishMods.bruised;
      }
      mod /= fish.length;
    }
    if (score <= 0) return 'burnt';
    const q = score + mod;
    return q >= C.quality.perfect.min ? 'perfect' : q >= C.quality.good.min ? 'good' : 'burnt';
  };

  FR.unlockRecipe = function (id) {
    if (FR.state.known.includes(id)) return false;
    FR.state.known.push(id);
    return true;
  };

  // --- Tonight's booking (v3) ---
  // After the morning the guest list is fixed: who comes, in what order, and (once the
  // menu is set) exactly what each one will order. Their food is set aside for them.
  FR.rollGuests = function () {
    const S = FR.state, G = C.group, list = [];
    const bigTable = FR.bigTables().length > 0, love = 1 + FR.styleStars() * C.style.loveWeightPerStar;
    let live = false;
    for (let i = 0; i < FR.customersTonight(); i++) {
      const roleW = {}, spW = {}, groups = list.filter(x => x.size > 1).length;
      for (const id in D.roles) { const r = D.roles[id]; if (S.day >= (r.fromDay || 1) && !(r.group && (!bigTable || groups >= G.maxPerNight)) && !(r.courses && !S.upgrades.vip)) roleW[id] = r.weight * (FR.loves(id, null) ? love : 1); }
      const home = D.areas[S.home] ? S.home : 'home'; // v4.1: guests come from where the restaurant is moored
      for (const id in D.areas[home].species) if (S.day >= (D.species[id].fromDay || 1)) spW[id] = D.areas[home].species[id] * (FR.loves(null, id) ? love : 1);
      const g = { role: FR.weighted(roleW), species: FR.weighted(spW), size: 1, r: Math.random() };
      const role = D.roles[g.role], sp = D.species[g.species];
      if (role.group) g.size = role.group[0] + Math.floor(Math.random() * (role.group[1] - role.group[0] + 1));
      else if (G.roles.includes(g.role) && S.day >= G.fromDay && bigTable && groups < G.maxPerNight && Math.random() < G.chance) g.size = Number(FR.weighted(G.sizes));
      g.look = role.secret ? FR.pick(C.critic.disguises) : g.role; // a Critic books under a false name
      const fishEater = sp.eats.includes('real') || sp.eats.includes('fantasy');
      if (!live && S.decor.lanterns && g.size === 1 && !role.courses && fishEater && Math.random() < C.liveCatchChance) g.live = live = true;
      list.push(g);
    }
    const slip = g => list.splice(1 + Math.floor(Math.random() * list.length), 0, g);
    D.regulars.forEach(r => { if (S.day % C.regularEvery === r.dayMod) slip({ role: r.role, species: r.species, size: 1, r: Math.random(), look: r.role, regular: r.id }); });
    S.requests.forEach(q => slip({ role: q.role, species: q.species, size: 1, r: Math.random(), look: q.role, returning: q.recipe }));
    const ev = FR.eventDef();
    if (ev && ev.guest) slip(Object.assign({ size: 1, r: Math.random(), look: ev.guest.role, celeb: true }, ev.guest)); // the celebrity is on the list too
    S.guests = list; S.guestsDay = S.day;
    FR.rollNightGoals();
  };

  // --- Today's random event and daily goals (v3 step 4) ---
  FR.eventDef = () => (FR.state.event ? D.events.list.find(e => e.id === FR.state.event) : null) || null;
  FR.goalQueue = []; // goals just finished, waiting for a scene to announce them
  function makeGoal(t, when, fill) {
    const S = FR.state, G = D.goals;
    const g = Object.assign({ kind: t.kind, when, have: 0, done: false, n: t.n ? t.n[0] + Math.floor(Math.random() * (t.n[1] - t.n[0] + 1)) : 1 }, fill || {});
    g.text = t.text.replace('{n}', g.n).replace('{fish}', g.fish ? D.fish[g.fish].name : '').replace('{who}', g.who ? (D.species[g.who] || D.roles[g.who]).name : '');
    const decor = D.decor.filter(d => !S.decor[d.id] && d.price <= G.decorMaxPrice && !(S.goals || []).some(x => x.reward.decor === d.id));
    g.reward = decor.length && Math.random() < G.decorChance ? { decor: FR.pick(decor).id } : { cash: t.reward };
    return g;
  }
  FR.rewardText = g => (g.reward.decor ? D.decor.find(d => d.id === g.reward.decor).name : '$' + g.reward.cash);
  FR.goalLine = g => (g.done ? '✓ ' + g.text : `${g.text}  ${Math.min(g.have, g.n)}/${g.n}`) + `  (${FR.rewardText(g)})`;

  // Once at the start of each day: pick the event and the morning goal.
  FR.rollDay = function () {
    const S = FR.state, E = D.events;
    if (S.dayRolled === S.day) return;
    S.dayRolled = S.day; S.event = null; S.goals = [];
    // v3.1: how good is the fishing today, which fish are around, and is the giant here?
    const FD = C.fishDays, fw = {};
    for (const k in FD) fw[k] = FD[k].weight;
    S.fishDay = S.day === 1 ? 'normal' : FR.weighted(fw);
    S.fishOdds = {};
    const base = D.areas[S.area].spots, ids = Object.keys(base).filter(id => !D.fish[id].boss);
    ids.forEach(id => { S.fishOdds[id] = base[id] * FR.rand(C.dailyJitter[0], C.dailyJitter[1]); });
    const hot = FR.pick(ids.filter(id => D.fish[id].rarity === 'common' || D.fish[id].rarity === 'uncommon'));
    if (hot && S.day > 1) { S.fishOdds[hot] *= C.hotFish; S.hotFish = hot; } else S.hotFish = null;
    const boss = D.areas[S.area].boss;
    S.bossToday = !!boss && S.day >= C.bossFromDay && Math.random() < (S.bossBeaten ? C.bossReturnChance : C.bossChance);
    if (S.day >= E.fromDay && Math.random() >= E.noneChance) {
      const w = {};
      E.list.forEach(e => { if (S.day >= (e.fromDay || 1)) w[e.id] = e.weight; });
      S.event = FR.weighted(w);
    }
    // a morning goal you can actually do with the gear you own
    const spots = D.areas[S.area].spots, can = Object.keys(spots).filter(id => { const f = D.fish[id]; return f.gear.some(g => S.gear[g]) && FR.canHook(id); });
    const opts = D.goals.morning.filter(t => t.kind !== 'catchFish' || can.length);
    const t = FR.pick(opts);
    S.goals.push(makeGoal(t, 'morning', t.kind === 'catchFish' ? { fish: FR.pick(can) } : null));
  };
  // v3.1: today's fishing conditions and fish chances (with the Fish frenzy boost on top).
  FR.fishDayDef = () => C.fishDays[FR.state.fishDay] || C.fishDays.normal;
  FR.todayOdds = function () {
    const S = FR.state, base = D.areas[S.area].spots, out = {};
    for (const id in base) if (!D.fish[id].boss) out[id] = (S.fishOdds && S.fishOdds[id] !== undefined) ? S.fishOdds[id] : base[id];
    const evd = FR.eventDef();
    if (evd && evd.boost) for (const k in out) out[k] *= (evd.boost[D.fish[k].rarity] || 1);
    return out;
  };

  // Once the guest list is known: two night goals that tonight's guests make possible.
  FR.rollNightGoals = function () {
    const S = FR.state;
    FR.rollDay();
    S.goals = S.goals.filter(g => g.when === 'morning');
    const count = key => { const m = {}; S.guests.forEach(g => { if (!g.returning) m[g[key]] = (m[g[key]] || 0) + 1; }); return Object.keys(m).filter(k => m[k] >= 2).map(k => ({ who: k, n: m[k] })); };
    const sp = count('species'), ro = count('look');
    const opts = D.goals.night.filter(t => (t.kind !== 'serveSpecies' || sp.length) && (t.kind !== 'serveRole' || ro.length) && S.guests.length > 0);
    for (let i = 0; i < 2 && opts.length; i++) {
      const t = opts.splice(Math.floor(Math.random() * opts.length), 1)[0];
      let fill = null;
      if (t.kind === 'serveSpecies' || t.kind === 'serveRole') { const c = FR.pick(t.kind === 'serveSpecies' ? sp : ro); fill = { who: c.who, n: Math.min(c.n, t.max) }; }
      if (t.kind === 'tips') fill = { n: Math.max(5, t.per * S.guests.length) };
      S.goals.push(makeGoal(t, 'night', fill));
    }
  };
  // Tell the goals something happened. type: catch | serve | perfect | combo | tips | nightEnd.
  FR.goalEvent = function (type, d) {
    const S = FR.state;
    (S.goals || []).forEach(g => {
      if (g.done) return;
      const k = g.kind;
      if (type === 'catch' && (k === 'catchN' || (k === 'catchFish' && d.id === g.fish) || (k === 'clean' && d.cut === 'perfect') || (k === 'big' && D.sizes[d.size].rank >= 2))) g.have++;
      else if (type === 'serve' && ((k === 'serveSpecies' && d.species === g.who) || (k === 'serveRole' && d.role === g.who))) g.have++;
      else if (type === 'perfect' && k === 'perfect') g.have++;
      else if (type === 'combo' && k === 'combo') g.have = Math.max(g.have, d.n);
      else if (type === 'tips' && k === 'tips') g.have += d.n;
      else if (type === 'nightEnd' && k === 'nowalk' && d.walked === 0 && d.served > 0) g.have = 1;
      if (g.have >= g.n) {
        g.done = true;
        if (g.reward.decor) S.decor[g.reward.decor] = true; else FR.earn('rewards', g.reward.cash);
        FR.goalQueue.push(g);
      }
    });
  };
  // Scenes call this every frame to announce finished goals.
  FR.flushGoals = function (scene) {
    const g = FR.goalQueue.shift();
    if (!g) return;
    FR.ui.toast(scene, `Goal done: ${g.text}!   Reward: ${FR.rewardText(g)}`, '#9cffb0');
    FR.juice.pop(scene, 480, 170, 'GOAL!', '#9cffb0', 40); FR.sfx('perfect');
  };

  // Which dish a guest picks from tonight's menu. k = which of their dishes this is.
  FR.dishFor = function (g, avoid, k) {
    const S = FR.state, role = D.roles[g.role], sp = D.species[g.species];
    let avail = S.menu.map(FR.recipe).filter(r => FR.edible(sp, r) && FR.canMakeCount(r) > 0);
    if (!avail.length) return null;
    if (avoid) { const fresh = avail.filter(r => !avoid.includes(r.id)); if (fresh.length) avail = fresh; } // a Royal wants 3 different courses if they can
    if (g.returning) { const r = avail.find(a => a.id === g.returning); if (r) return r; }
    if (g.regular) { const fav = D.regulars.find(x => x.id === g.regular).favorite, r = avail.find(a => a.id === fav); if (r) return r; }
    if (g.role === 'sailor' || sp.cheap) return avail.sort((a, b) => FR.price(a) - FR.price(b))[0];
    if (g.role === 'pirate') return avail.sort((a, b) => FR.price(b) - FR.price(a))[0];
    // everyone else leans towards pricier dishes; g.r keeps the pick the same every time you look
    let total = 0;
    avail.forEach(r => { total += FR.price(r); });
    let x = ((g.r + k * 0.618) % 1) * total;
    for (const r of avail) { x -= FR.price(r); if (x <= 0) return r; }
    return avail[avail.length - 1];
  };

  // Work out the whole night. commit = true really sets the food aside (opening for dinner);
  // false is a preview for the afternoon and leaves the stock untouched.
  // Each entry: { g, orders: [{ live } | { recipe, res }], why, short }.
  // why = 'request' | 'menu' | 'diet' | 'stock' means that guest stays home tonight.
  FR.planNight = function (commit) {
    const S = FR.state, menu = S.menu.map(FR.recipe);
    const snap = commit ? null : JSON.stringify({ tank: S.tank, sides: S.sides });
    const out = (S.guests || []).map(g => {
      const role = D.roles[g.role], sp = D.species[g.species], p = { g, orders: [], why: null, short: false };
      if (g.returning && !S.menu.includes(g.returning)) p.why = 'request';
      else if (role.minMenu && menu.length < role.minMenu) p.why = 'menu';
      else if (!menu.some(r => FR.edible(sp, r))) p.why = 'diet';
      else if (g.live) p.orders.push({ live: true });
      else {
        const n = role.courses && !g.regular ? role.courses : g.size > 1 ? g.size : sp.orders || 1, used = [];
        for (let k = 0; k < n; k++) {
          const r = FR.dishFor(g, role.courses ? used : null, k);
          if (!r) break;
          used.push(r.id);
          p.orders.push({ recipe: r, res: FR.reserve(r) });
        }
        if (!p.orders.length) p.why = 'stock';
        else if (p.orders.length < n) p.short = true;
      }
      return p;
    });
    if (!commit) {
      // v3.2: for guests who cannot be fed, which ingredients of the dishes they could eat have run out?
      const hungry = out.filter(p => p.why === 'stock' || p.short), seen = {};
      out.missing = [];
      hungry.forEach(p => menu.filter(r => FR.edible(D.species[p.g.species], r)).forEach(r => {
        for (const id in r.fish) if (FR.portionsOf(id) < r.fish[id] && !seen['f' + id]) { seen['f' + id] = 1; out.missing.push({ name: D.fish[id].name, shop: false }); }
        if (r.anyFish && FR.portionsAll() < r.anyFish && !seen.any) { seen.any = 1; out.missing.push({ name: 'any fish', shop: false }); }
        for (const id in r.sides) if ((S.sides[id] || 0) < r.sides[id] && !seen['s' + id]) { seen['s' + id] = 1; out.missing.push({ name: D.sides[id].name, shop: true }); }
      }));
      const o = JSON.parse(snap); S.tank = o.tank; S.sides = o.sides;
    }
    return out;
  };
  FR.takeCheapFish = function () {
    const f = FR.state.tank.slice().sort((a, b) => D.fish[a.id].value - D.fish[b.id].value || b.age - a.age)[0];
    return f ? takePortion(f) : null;
  };

  // --- End of day: reviews, spoilage, next day, auto-save ---
  FR.endDay = function (res) {
    const S = FR.state, day = S.day;
    FR.goalEvent('nightEnd', res);
    FR.goalQueue.length = 0; // the results screen lists them instead
    res.goals = (S.goals || []).slice();
    S.reviews.push(...res.reviews);
    S.reviews = S.reviews.slice(-C.reviewWindow);
    S.requests = res.requests;
    // pay the staff. Anyone you cannot pay loses heart and works slower until they are paid again.
    D.staff.forEach(d => {
      const st = S.staff[d.id];
      if (!st) return;
      if (S.money >= d.wage) { S.money -= d.wage; S.ledger.wages += d.wage; st.mood = Math.min(1, st.mood + C.staffRules.paidMood); }
      else { st.mood = Math.max(0, st.mood - C.staffRules.unpaidMood); res.events.push(`You could not pay the ${d.name} ($${d.wage}). They will work slower until they are paid.`); }
    });
    FR.checkMilestones().forEach(m => res.events.push(`MILESTONE: ${m.name}!  ${m.reward}.`));
    S.buzz = Math.min(C.influencer.maxWave, res.buzz || 0);
    S.hex = res.hex || null;
    const spoiled = [];
    S.tank.forEach(f => f.age++);
    S.tank = S.tank.filter(f => {
      if (FR.freshness(f) === 'spoiled') { spoiled.push(D.fish[f.id].name); return false; }
      return true;
    });
    const ledger = S.ledger;
    S.ledger = newLedger();
    S.day++;
    FR.save();
    return Object.assign({ day, spoiled, rating: FR.rating(), ledger }, res);
  };
})();
