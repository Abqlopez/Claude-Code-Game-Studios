// Afternoon prep (v4): tonight's guests, the menu, the shop, gear, upgrades, staff + stations, and the journal.
// Same rules as the 2D game's afternoon, laid out as one panel over the boat.
(function () {
  const A = window.FR3D, D = FR.DATA, C = D.config;
  const $ = id => document.getElementById(id);
  const TABS = [['guests', 'Guests'], ['menu', 'Menu'], ['shop', 'Shop'], ['gear', 'Gear + bait'], ['upgrades', 'Upgrades'], ['staff', 'Staff'], ['decor', 'Decor'], ['build', 'Build'], ['lab', 'Kitchen lab'], ['journal', 'Journal']];
  const KIND = { real: 'real fish', fantasy: 'fantasy fish', kelp: 'kelp, no fish', mixed: 'mixed fish' };
  let tab = 'guests', acts = [];
  const S = () => FR.state;

  function toast(msg, color) { const el = $('toast'); el.textContent = msg; el.style.color = color || '#fff'; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 2600); }
  const act = fn => { acts.push(fn); return acts.length - 1; };
  const btn = (label, fn, opts) => `<button type="button" data-a="${act(fn)}"${opts && opts.off ? ' disabled' : ''}${opts && opts.cls ? ` class="${opts.cls}"` : ''}>${label}</button>`;
  function buy(key, price, fn) {
    if (!FR.spend(key, price)) { toast('Not enough money.', '#ff9c9c'); return; }
    FR.sfx('coin'); fn(); FR.save(); render();
  }
  function ingredientText(r) {
    const parts = [];
    for (const id in r.fish) parts.push(D.fish[id].name);
    if (r.anyFish) parts.push(`any ${r.anyFish} fish`);
    for (const id in r.sides) parts.push(D.sides[id].name.toLowerCase());
    return parts.join(' + ');
  }
  const img = (src, cls) => src ? `<img alt="" src="${src}"${cls ? ` class="${cls}"` : ''}>` : '';

  // ---------- tabs ----------
  const T = {};
  T.guests = () => {
    const plan = FR.planNight(false), st = S();
    const WHY = { request: g => `Only comes if ${FR.recipe(g.returning).name} is on the menu (pays double)`, menu: g => `Wants a menu of ${D.roles[g.role].minMenu}+ dishes`, diet: () => 'Nothing on the menu they can eat', stock: () => 'Not enough ingredients for them' };
    let h = `<h3>Tonight's guests</h3><p class="small" style="text-align:left">The booking is set. Each guest orders what you see; change the menu and it updates.</p>`;
    const ev = FR.eventDef();
    h += ev && ev.when === 'night' ? `<div class="row"><b>Tonight: ${ev.name}.</b> <span class="sub">${ev.desc}</span></div>` : '<div class="row"><span class="sub">Tonight: a quiet night. No surprises.</span></div>';
    const night = (st.goals || []).filter(g => g.when === 'night'); if (night.length) h += `<div class="row"><span class="sub" style="color:#9cffb0">Goals: ${night.map(FR.goalLine).join(' · ')}</span></div>`;
    if (st.hex) { const hx = D.hexes.find(x => x.id === st.hex); if (hx) h += `<div class="row ${hx.good ? 'on' : 'bad'}"><span class="sub">Sea Witch ${hx.good ? 'blessing' : 'curse'} today: <b>${hx.name}</b>. ${hx.desc}</span></div>`; }
    h += '<div class="grid2">';
    plan.forEach((p, i) => {
      const g = p.g, names = [];
      p.orders.forEach(o => { const n = o.live ? 'Catch of the moment' : o.recipe.name, e = names.find(v => v.n === n); if (e) e.c++; else names.push({ n, c: 1, id: o.recipe && o.recipe.id }); });
      const bad = p.why && p.why !== 'request';
      const reg = g.regular && D.regulars.find(r => r.id === g.regular);
      const who = reg ? `${reg.name} (regular, loves ${FR.recipe(reg.favorite).name})` : g.celeb ? `★ ${FR.eventDef().title} ★` : `${D.species[g.species].name} ${D.roles[g.look] ? D.roles[g.look].name : ''}${g.size > 1 ? ' ×' + g.size + ' (BIG table)' : ''}${D.roles[g.role].courses ? ' (VIP table)' : ''}${g.returning ? ' (back for their request)' : ''}`;
      const what = p.why ? WHY[p.why](g) : names.map(v => `${v.id ? img(FR.dishSrc(v.id)) : ''}${v.n}${v.c > 1 ? ' ×' + v.c : ''}`).join(' ') + (p.short ? ' (not enough for all!)' : '');
      h += `<div class="row ${bad || p.short ? 'bad' : ''}"><span class="grow"><b>${i + 1}. ${who}</b><span class="sub">${what}</span></span></div>`;
    });
    h += '</div>';
    if (!plan.length) h += '<p>Nobody is booked tonight.</p>';
    const needs = FR.menuNeeds();
    if (needs.length) h += `<div class="row"><span class="grow"><b>Tomorrow, fish for:</b> ${needs.map(n => `${D.fish[n.id].name} (${n.lure ? D.lures[FR.lureFor(n.id)].name : D.baits[n.bait].name + ' ×' + n.have})`).join(' · ')}</span>${needs.some(n => !n.lure && n.have < 3) ? btn('Buy bait', () => { tab = 'gear'; render(); }) : ''}</div>`;
    const miss = plan.missing || [];
    if (miss.length) h += `<div class="row bad"><span class="grow"><b>SHORT ON:</b> ${miss.map(m => `${m.name} (${m.shop ? 'buy in Shop' : 'catch it'})`).join(' · ')}</span>${miss.some(m => m.shop) ? btn('Go to Shop', () => { tab = 'shop'; render(); }) : ''}</div>`;
    return h;
  };
  T.menu = () => {
    const st = S();
    st.menu = st.menu.filter(id => st.known.includes(id) && FR.canCook(FR.recipe(id))).slice(0, FR.menuSlots());
    let h = `<h3>Tonight's menu: ${st.menu.length}/${FR.menuSlots()} dishes</h3><p class="small" style="text-align:left">Guests can only order what is on it. Each dish sells for about 3× its ingredients.</p>`;
    st.known.map(FR.recipe).forEach(r => {
      const on = st.menu.includes(r.id), n = FR.canMakeCount(r);
      const tool = r.heat === 'none' ? 'Prep counter' : D.heat[r.heat].name;
      let b;
      if (!FR.canCook(r)) b = btn(`Needs the ${D.upgrades.find(u => u.id === r.needs).name}`, () => {}, { off: true });
      else b = btn(on ? 'On menu ✓' : 'Add', () => {
        if (on) st.menu = st.menu.filter(id => id !== r.id);
        else if (st.menu.length >= FR.menuSlots()) { toast('The menu is full. Take something off first.', '#ff9c9c'); return; }
        else st.menu.push(r.id);
        render();
      });
      h += `<div class="row ${on ? 'on' : ''}">${img(FR.dishSrc(r.id))}<span class="grow"><b>${r.name}</b><span class="sub">${ingredientText(r)} · ${tool} · ${KIND[r.kind]}</span></span><span class="price">$${FR.price(r)}</span><span class="sub" style="min-width:80px">${n > 0 ? 'can make ' + n : 'SOLD OUT'}</span>${b}</div>`;
    });
    return h;
  };
  T.shop = () => {
    const st = S();
    let h = '<h3>Side ingredients</h3><div class="grid2">';
    Object.keys(D.sides).forEach(id => {
      const sd = D.sides[id];
      h += `<div class="row"><span class="grow"><b>${sd.name}</b> <span class="price">$${sd.price}</span><span class="sub">You have ${st.sides[id] || 0}</span></span>${btn('+1', () => buy('ingredients', sd.price, () => { st.sides[id] = (st.sides[id] || 0) + 1; }))}${btn('+5', () => buy('ingredients', sd.price * 5, () => { st.sides[id] = (st.sides[id] || 0) + 5; }))}</div>`;
    });
    h += '</div><h3>Plates</h3>';
    h += `<div class="row"><span class="grow">You own <b>${st.plates}</b> plates. Every dish needs a clean one, and washing sometimes breaks one.</span>${btn('Buy a plate $' + C.platePrice, () => buy('plates', C.platePrice, () => { st.plates++; }))}</div>`;
    const caught = r => Object.keys(r.fish).every(id => st.journal[id]) && (!r.anyFish || Object.keys(st.journal).length >= r.anyFish);
    const buyable = D.recipes.filter(r => !st.known.includes(r.id) && r.unlock), shown = buyable.filter(caught).sort((a, b) => a.unlock - b.unlock), hidden = buyable.length - shown.length;
    h += `<h3>Recipes</h3><p class="small" style="text-align:left">${hidden ? `${hidden} more recipe${hidden > 1 ? 's' : ''} to find. Catch new fish to unlock them.` : 'You have found every recipe you can buy.'}</p><div class="grid2">`;
    shown.forEach(r => { h += `<div class="row">${img(FR.dishSrc(r.id))}<span class="grow"><b>${r.name}</b><span class="sub">sells for $${FR.price(r)}</span></span>${btn('$' + r.unlock, () => buy('invest', r.unlock, () => { FR.unlockRecipe(r.id); }))}</div>`; });
    h += '</div>';
    if (!st.known.includes('whiskers_gumbo')) h += '<p class="small" style="text-align:left">One legendary recipe cannot be bought. A giant in these waters guards it.</p>';
    return h;
  };
  T.gear = () => {
    const st = S();
    let h = '<h3>Gear</h3><p class="small" style="text-align:left">The right tool lands the fish. The wrong one snaps, tears or misses.</p>';
    Object.keys(D.gear).forEach(id => {
      const g = D.gear[id], own = !!st.gear[id];
      h += `<div class="row ${own ? 'on' : ''}"><span class="grow"><b>${g.name}</b><span class="sub">${g.desc}</span></span>${own ? '<span class="sub">Owned ✓</span>' : btn('Buy $' + g.price, () => buy('invest', g.price, () => { st.gear[id] = true; }))}</div>`;
    });
    // v4.2: one bait and one lure for every fish. You only see the ones for fish whose bait you have learned.
    h += '<h3>Bait</h3><p class="small" style="text-align:left">Every fish bites only its own bait (or its own lure). No bait, no bite. A fish that refuses your hook tells you what it wants, and then its bait shows up here.</p><div class="grid2">';
    let hidden = 0;
    Object.keys(D.baits).forEach(id => {
      const b = D.baits[id], fid = b.fish, f = D.fish[fid], seen = FR.baitKnown(fid) || st.baits[id] > 0 || (f.boss && st.day >= C.bossFromDay);
      if (!seen) { hidden++; return; }
      h += `<div class="row">${img(FR.fishSrc(fid))}<span class="grow"><b>${b.name}</b> <span class="price">$${b.price}</span><span class="sub">For ${FR.baitKnown(fid) || f.boss ? f.name : 'an unknown fish'} · you have ${st.baits[id] || 0}</span></span>${btn('+1', () => buy('bait', b.price, () => { st.baits[id] = (st.baits[id] || 0) + 1; }))}${btn('+5', () => buy('bait', b.price * 5, () => { st.baits[id] = (st.baits[id] || 0) + 5; }))}</div>`;
    });
    h += '</div>';
    if (hidden) h += `<p class="small" style="text-align:left">${hidden} more bait${hidden > 1 ? 's' : ''} to discover. Cast at new fish to learn what they want.</p>`;
    h += '<h3>Lures</h3><p class="small" style="text-align:left">A lure is made for one fish, never gets used up, and has a perk. Level II makes the perk stronger. Switch with Q, or R picks it for you.</p><div class="grid2">';
    let hiddenL = 0;
    Object.keys(D.lures).forEach(id => {
      const L = D.lures[id], lv = st.lures[id] || 0, next = L.prices[lv], f = D.fish[id];
      if (!(FR.baitKnown(id) || lv || (f.boss && st.day >= C.bossFromDay))) { hiddenL++; return; }
      h += `<div class="row ${lv ? 'on' : ''}">${img(FR.fishSrc(id))}<span class="grow"><b>${L.name}${lv > 1 ? ' II' : ''}</b><span class="sub">For ${FR.baitKnown(id) || f.boss ? f.name : 'an unknown fish'}. ${D.perks[L.perk][Math.max(0, lv - 1)]}${lv === 1 ? ' (II: ' + D.perks[L.perk][1] + ')' : ''}</span></span>${next === undefined ? '<span class="sub">Max ✓</span>' : btn((lv ? 'Upgrade $' : 'Buy $') + next, () => buy('invest', next, () => { st.lures[id] = lv + 1; }))}</div>`;
    });
    h += '</div>';
    if (hiddenL) h += `<p class="small" style="text-align:left">${hiddenL} more lure${hiddenL > 1 ? 's' : ''} to discover.</p>`;
    // Crabfolk pay in shells: trade them for any bait you know
    h += `<h3>Shells: ${st.shells || 0}</h3><p class="small" style="text-align:left">Crabfolk pay in shells. Trade them for bait here.</p><div class="grid2">`;
    Object.keys(D.baits).filter(id => FR.baitKnown(D.baits[id].fish) || st.baits[id] > 0).forEach(id => { const p = Math.max(1, Math.round(D.baits[id].price * C.shells.perDollar)); h += `<div class="row"><span class="grow"><b>1 ${D.baits[id].name}</b><span class="sub">${p} shell${p > 1 ? 's' : ''}</span></span>${btn('Trade', () => { st.shells -= p; st.baits[id] = (st.baits[id] || 0) + 1; FR.sfx('coin'); FR.save(); render(); }, { off: (st.shells || 0) < p })}</div>`; });
    h += '</div><h3>Crab traps</h3>';
    h += `<div class="row"><span class="grow">You own <b>${st.traps}</b> of ${C.trapMax} traps. Drop one with T in the morning; crabs and lobsters crawl in.</span>${btn('Buy $' + C.trapPrice, () => buy('invest', C.trapPrice, () => { st.traps++; }), { off: st.traps >= C.trapMax })}</div>`;
    return h;
  };
  T.upgrades = () => {
    const st = S();
    let h = '<h3>Upgrades</h3>';
    ['tables', 'bigtable', 'vip', 'tank', 'station', 'board', 'dragongrill', 'engine'].forEach(id => {
      const u = D.upgrades.find(x => x.id === id); if (!u) return;
      const lvl = st.upgrades[id] || 0, prices = u.prices, next = prices[lvl];
      const desc = id === 'tables' ? (lvl === 0 ? '2 more tables on deck (4 in all).' : '2 more tables on a dock patio (6 in all).') : id === 'engine' ? 'Unlocks fishing in Coral Bay, and moving the whole restaurant there' : id === 'bigtable' ? 'Table 2, then table 4, get 4 seats. Groups and Families only book if you have one' : u.desc;
      h += `<div class="row ${next === undefined ? 'on' : ''}"><span class="grow"><b>${u.name}</b>${prices.length > 1 ? ` <span class="sub" style="display:inline">level ${lvl}/${prices.length}</span>` : ''}<span class="sub">${desc}</span></span>${next === undefined ? '<span class="sub">Done ✓</span>' : btn('Buy $' + next, () => buy('invest', next, () => { st.upgrades[id] = lvl + 1; refreshBoat(); if (['tables', 'bigtable', 'vip'].includes(id)) FR.rollGuests(); }))}</div>`;
    });
    // v4.1: move the whole restaurant to other waters (guests there are different)
    h += '<h3>Move the restaurant</h3><p class="small" style="text-align:left">Where the restaurant is moored decides who books a table. Moving re-books tonight\'s guests.</p>';
    Object.keys(D.areas).forEach(id => {
      const a = D.areas[id], here = (st.home || 'home') === id, can = id === 'home' || st.upgrades.engine > 0;
      h += `<div class="row ${here ? 'on' : ''}"><span class="grow"><b>${a.name}</b><span class="sub">Guests: ${Object.keys(a.species).map(s => D.species[s].name).join(', ')}</span></span>${here ? '<span class="sub">Moored here ✓</span>' : btn(can ? 'Sail here $' + MOVE_COST : 'Needs the Boat engine', () => buy('invest', MOVE_COST, () => { st.home = id; refreshBoat(); FR.rollGuests(); toast(`The restaurant sails to ${a.name}!`, '#9cffb0'); }), { off: !can })}</div>`;
    });
    return h;
  };
  T.staff = () => {
    const st = FR.crewData3d(), R = C.staffRules;
    const B = FR.BUILD3D, wages = Object.keys(B).reduce((n, k) => n + Math.min(st.crew3d[k], st.built3d[k]) * FR.staffDef3d(k).wage, 0) + (st.deckhand3d ? FR.staffDef3d('deckhand').wage : 0);
    const moodTxt = k => st.mood3d[k] >= 0.99 ? 'happy' : st.mood3d[k] > 0.5 ? 'grumpy (missed pay)' : 'miserable (missed pay)';
    const train = k => { const lv = st.train3d[k] || 1, cost = R.trainCost[lv - 1]; return cost ? btn(`Train to level ${lv + 1} $${cost}`, () => buy('invest', cost, () => { st.train3d[k] = lv + 1; })) : '<span class="sub">Fully trained</span>'; };
    let h = `<h3>Staff + stations · wages $${wages}/night</h3><p class="small" style="text-align:left">Every member of staff needs a station. Build one, then hire. Staff are paid after closing; miss a wage and they slow down. They tire late in the night; training helps.</p>`;
    Object.keys(B).forEach(k => {
      const b = B[k], d = FR.staffDef3d(k), built = st.built3d[k], hired = st.crew3d[k];
      h += `<div class="row"><span class="grow"><b>${b.name}</b> <span class="sub" style="display:inline">${built}/${b.max} built</span><span class="sub">${b.desc}</span></span>${btn(built >= b.max ? 'All built' : 'Build $' + b.price, () => buy('invest', b.price, () => { st.built3d[k]++; FR.syncBuilt3d(); }), { off: built >= b.max })}</div>`;
      h += `<div class="row ${hired ? 'on' : ''}" style="margin-left:24px"><span class="grow"><b>${d.name}</b> <span class="sub" style="display:inline">${hired} hired · level ${st.train3d[k]}/3 · wage $${d.wage}/night each${hired ? ' · ' + moodTxt(k) : ''} · speed ${Math.round(FR.crewSpeed3d(k, 0) * 100)}%</span><span class="sub">${d.does}</span></span>${btn('Hire $' + d.hire, () => buy('invest', d.hire, () => { st.crew3d[k]++; }), { off: hired >= built })}${hired ? btn('Let one go', () => { st.crew3d[k]--; FR.save(); render(); }) + train(k) : ''}</div>`;
    });
    const dh = FR.staffDef3d('deckhand');
    h += `<div class="row ${st.deckhand3d ? 'on' : ''}"><span class="grow"><b>${dh.name}</b> <span class="sub" style="display:inline">level ${st.train3d.deckhand}/3 · wage $${dh.wage}/night${st.deckhand3d ? ' · ' + moodTxt('deckhand') : ''}</span><span class="sub">${dh.does}: about ${R.deckhandCatch[st.train3d.deckhand - 1]} fish a morning. Needs no station.</span></span>${st.deckhand3d ? btn('Let go', () => { st.deckhand3d = false; FR.save(); render(); }) + train('deckhand') : btn('Hire $' + dh.hire, () => buy('invest', dh.hire, () => { st.deckhand3d = true; }))}</div>`;
    return h;
  };
  T.decor = () => {
    const st = S(), X = C.style, stars = FR.styleStars(), pts = FR.stylePoints(), next = X.stars.find(n => n > pts);
    let h = `<h3>Style ${'★'.repeat(stars)}${'☆'.repeat(5 - stars)} · ${pts} points${next ? ` (next star at ${next})` : ''}</h3><p class="small" style="text-align:left">Every star makes all guests ${Math.round(X.patiencePerStar * 100)}% more patient. Guests who love your theme get another ${Math.round(X.lovePatiencePerStar * 100)}% and book ${Math.round(X.loveWeightPerStar * 100)}% more often per star.</p><div class="grid2">`;
    D.decor.forEach(d => { const own = !!st.decor[d.id]; h += `<div class="row ${own ? 'on' : ''}"><span class="grow"><b>${d.name}</b> <span class="sub" style="display:inline">+${d.style} style</span><span class="sub">${d.desc}${d.id === 'lanterns' ? '. Also lets you fish off the bow at night' : ''}</span></span>${own ? '<span class="sub">Owned ✓</span>' : btn('Buy $' + d.price, () => buy('invest', d.price, () => { st.decor[d.id] = true; refreshBoat(); }))}</div>`; });
    h += '</div><h3>Theme</h3><div class="grid2">';
    const who = id => (D.roles[id] || D.species[id]).name;
    Object.keys(D.themes).forEach(id => { const th = D.themes[id], on = st.theme === id; h += `<div class="row ${on ? 'on' : ''}"><span class="grow"><b>${th.name}</b><span class="sub">Loved by: ${(th.loves || []).map(who).join(', ')}</span></span>${on ? '<span class="sub">Current ✓</span>' : btn('Switch (free)', () => { st.theme = id; refreshBoat(); FR.save(); render(); })}</div>`; });
    h += `</div><h3>Paint the trim ($${C.paintPrice})</h3><div class="row">`;
    D.paints.forEach(pt => { const on = st.paint === pt.id, col = pt.color === null ? D.themes[st.theme].trim : pt.color; h += btn(`<span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#${col.toString(16).padStart(6, '0')};vertical-align:middle"></span> ${pt.name}${on ? ' ✓' : ''}`, () => { if (!on) buy('invest', C.paintPrice, () => { st.paint = pt.id; refreshBoat(); }); }); });
    const safe = String(st.name || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    h += `</div><h3>Your restaurant's name</h3><div class="row"><input id="nameIn" maxlength="24" value="${safe}" aria-label="Restaurant name" style="flex:1;min-width:160px;font:600 15px var(--body);padding:8px;border-radius:10px;border:2px solid var(--lantern);background:#10233b;color:#fff">${btn('Save name', () => { const v = ($('nameIn').value || '').trim().slice(0, 24); if (v) { st.name = v; refreshBoat(); FR.save(); toast('Painted on the stern!', '#9cffb0'); render(); } })}</div><p class="small" style="text-align:left">${st.decor.sign ? 'It shows on the stern and on the sign over the gangway.' : 'It shows on the stern. Buy the Sign to hang it over the gangway too.'}</p>`;
    return h;
  };
  T.build = () => {
    const st = S();
    let h = '<h3>Sections</h3><div class="grid2">';
    D.sections.forEach(sec => {
      const own = !!(st.sections && st.sections[sec.id]), ms = D.milestones.find(m => m.id === sec.needs), open = !ms || FR.milestoneDone(ms.id);
      h += `<div class="row ${own ? 'on' : ''}"><span class="grow"><b>${sec.name}</b><span class="sub">${sec.desc}</span>${!open ? `<span class="sub" style="color:#ff9c9c">Needs: ${ms.name}</span>` : ''}</span>${own ? '<span class="sub">Built ✓</span>' : btn(open ? 'Build $' + sec.price : 'Locked', () => buy('invest', sec.price, () => { st.sections = st.sections || {}; st.sections[sec.id] = true; refreshBoat(); }), { off: !open })}</div>`;
    });
    h += '</div><h3>Layout</h3><div class="row"><span class="grow"><b>Move your tables</b><span class="sub">A smart layout saves walking. Free to change any afternoon.</span></span>' + btn('Build mode ▶', () => startBuild()) + '</div>';
    h += '<h3>Milestones</h3>';
    D.milestones.forEach(m => {
      const done = FR.milestoneDone(m.id);
      const prog = m.kind === 'earned' ? `$${Math.min(st.stats.earned, m.n)} / $${m.n}` : m.kind === 'stars' ? `★ ${FR.rating().toFixed(1)} / ${m.n} (${st.reviews.length}/10 reviews)` : `${Object.keys(D.areas.home.species).filter(sp => st.stats.species && st.stats.species[sp]).length} / ${Object.keys(D.areas.home.species).length} kinds served`;
      h += `<div class="row ${done ? 'on' : ''}"><span class="grow"><b>${done ? '✓ ' : ''}${m.name}</b><span class="sub">Reward: ${m.reward}</span></span><span class="sub">${done ? 'Done' : prog}</span></div>`;
    });
    return h;
  };
  let mix = [], labMsg = '';
  T.lab = () => {
    const st = S(), used = id => mix.filter(m => m === id).length;
    let h = '<h3>Kitchen lab</h3><p class="small" style="text-align:left">Mix up to 4 ingredients to discover a recipe for free. A failed mix still uses them up.</p><div class="row">';
    let any = false;
    Object.keys(D.fish).forEach(id => { const n = FR.portionsOf(id) - used('fish:' + id); if (FR.portionsOf(id)) { any = true; h += btn(`${D.fish[id].name} (${n})`, () => { if (mix.length < 4) { mix.push('fish:' + id); labMsg = ''; render(); } }, { off: n <= 0 }); } });
    Object.keys(D.sides).forEach(id => { const n = (st.sides[id] || 0) - used('side:' + id); if (st.sides[id]) { any = true; h += btn(`${D.sides[id].name} (${n})`, () => { if (mix.length < 4) { mix.push('side:' + id); labMsg = ''; render(); } }, { off: n <= 0 }); } });
    if (!any) h += '<span class="sub">You have nothing to mix yet.</span>';
    const names = mix.map(m => { const [t, id] = m.split(':'); return t === 'fish' ? D.fish[id].name : D.sides[id].name; });
    h += `</div><div class="row" style="justify-content:center;font-size:16px;min-height:50px"><b>${names.length ? names.join('  +  ') : 'Pick up to 4 ingredients above'}</b></div>`;
    h += `<div class="row" style="justify-content:center">${btn('Mix!', doMix, { off: !mix.length })}${btn('Clear', () => { mix = []; labMsg = ''; render(); })}</div>`;
    if (labMsg) h += `<p class="small">${labMsg}</p>`;
    return h;
  };
  function doMix() {
    const st = S(), fish = {}, sides = {}; let fishTotal = 0;
    mix.forEach(m => { const [t, id] = m.split(':'); if (t === 'fish') { fish[id] = (fish[id] || 0) + 1; fishTotal++; } else sides[id] = (sides[id] || 0) + 1; });
    const same = (a, b) => Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(k => a[k] === b[k]);
    const hits = D.recipes.filter(r => !r.legendary && same(r.sides, sides) && (r.anyFish ? fishTotal === r.anyFish && !Object.keys(r.fish).length : same(r.fish, fish)));
    const match = hits.find(r => !r.anyFish) || hits[0]; // a named dish wins over Catch of the Day
    if (match && st.known.includes(match.id)) { labMsg = `That is ${match.name}. You already know it, so nothing was used.`; mix = []; render(); return; }
    for (const id in fish) for (let n = 0; n < fish[id]; n++) FR.takeFish(id);
    for (const id in sides) st.sides[id] -= sides[id];
    if (match) { FR.unlockRecipe(match.id); FR.sfx('perfect'); labMsg = `Discovered: ${match.name}! Add it to your menu.`; }
    else { FR.sfx('bad'); labMsg = 'A smelly mess. Nothing discovered.'; }
    mix = []; FR.save(); render();
  }
  T.journal = () => {
    const st = S(), ids = D.areas.home.journal.concat(st.area === 'home' ? [] : D.areas[st.area].journal);
    let h = `<h3>Fish journal ${ids.filter(id => st.journal[id]).length}/${ids.length}</h3><div class="grid2">`;
    ids.forEach(id => {
      const f = D.fish[id], j = st.journal[id];
      h += `<div class="row">${img(FR.fishSrc(id), '')}<span class="grow"><b>${j ? f.name : '???'}</b><span class="sub">${j ? `Caught ${j.n} · best ${D.sizes[j.best].name}` : f.trap ? 'It will not take a hook.' : f.nightOnly ? 'Never seen by day.' : 'Not caught yet.'}</span></span></div>`;
    });
    return h + '</div>';
  };

  const MOVE_COST = 40;
  function refreshBoat() { if (FR.syncDecor3d) FR.syncDecor3d(); A.setTableCount(Math.min(FR.tableCount(), A.tableGroups.length)); }
  // ---------- build mode: move the tables on deck ----------
  let picked = null;
  function startBuild() {
    $('prep').hidden = true; $('buildBar').hidden = false; A.setMode('build'); A.inputLocked = true;
    A.cam = { pos: A.boat.localToWorld(new THREE.Vector3(0, A.FLOOR + 17, 1.5)), look: A.boat.localToWorld(new THREE.Vector3(0, A.FLOOR, -2.6)) };
    picked = null; $('buildMsg').textContent = 'Click a table, then click where it should go. Tables stay on the left or right of the middle aisle.';
  }
  const ZONE = { x0: 1.7, x1: 2.8, z0: -6.4, z1: 0.4 };
  A.onDeckClick = p => {
    const st = S(), n = Math.min(4, FR.tableCount());
    const hit = A.tableGroups.slice(0, n).findIndex(t => Math.hypot(t.userData.at.x - p.x, t.userData.at.z - p.z) < 1.1);
    if (picked === null) { if (hit >= 0) { picked = hit; FR.sfx('click'); $('buildMsg').textContent = `Table ${hit + 1} picked up. Click a free spot on deck.`; } return; }
    const x = Math.round(p.x * 2) / 2, z = Math.round(p.z * 2) / 2, ax = Math.abs(x);
    const ok = ax >= ZONE.x0 && ax <= ZONE.x1 && z >= ZONE.z0 && z <= ZONE.z1 && A.tableGroups.slice(0, n).every((t, i) => i === picked || Math.hypot(t.userData.at.x - x, t.userData.at.z - z) >= 3.2);
    if (!ok) { FR.sfx('bad'); $('buildMsg').textContent = "That spot doesn't work: too close to another table, the aisle or the rail."; return; }
    st.layout3d = st.layout3d || {}; st.layout3d[picked] = [x, z]; FR.applyLayout3d(); A.setTableCount(Math.min(FR.tableCount(), A.tableGroups.length)); FR.sfx('good');
    $('buildMsg').textContent = `Table ${picked + 1} moved. Pick another, or press Done.`; picked = null;
  };
  $('buildReset').addEventListener('click', () => { S().layout3d = {}; FR.applyLayout3d(); A.setTableCount(Math.min(FR.tableCount(), A.tableGroups.length)); picked = null; FR.sfx('click'); });
  $('buildDone').addEventListener('click', () => { $('buildBar').hidden = true; A.cam = null; A.setMode('cut'); A.inputLocked = true; FR.save(); tab = 'build'; render(); $('prep').hidden = false; });
  function render() {
    acts = [];
    const st = S();
    $('ptabs').innerHTML = TABS.map(([id, n]) => btn(n, () => { tab = id; render(); }, { cls: tab === id ? 'on' : '' })).join('');
    $('pbody').innerHTML = T[tab]();
    // journal silhouettes for fish not caught yet
    if (tab === 'journal') $('pbody').querySelectorAll('.row').forEach((r, i) => { const id = (D.areas.home.journal.concat(st.area === 'home' ? [] : D.areas[st.area].journal))[i]; if (!st.journal[id]) { const im = r.querySelector('img'); if (im) im.style.filter = 'brightness(0) opacity(0.45)'; } });
    const plan = FR.planNight(false), booked = plan.filter(p => p.why !== 'request'), fed = booked.filter(p => !p.why && !p.short).length;
    $('pinfo').innerHTML = `Day ${st.day} afternoon · $${st.money} · ★ ${FR.rating().toFixed(1)} · <b style="color:${fed === booked.length ? '#9cffb0' : '#ff9c9c'}">Booked ${booked.length}, food for ${fed}</b>`;
  }
  $('prep').addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && !b.disabled && acts[b.dataset.a]) { FR.sfx('click'); acts[b.dataset.a](); } });
  $('openBtn').addEventListener('click', () => {
    const st = S();
    if (!st.menu.length) { toast("Put at least one dish on tonight's menu first.", '#ff9c9c'); tab = 'menu'; render(); return; }
    if (st.plates < 2) { toast('You need at least 2 plates. Buy some in the Shop.', '#ff9c9c'); tab = 'shop'; render(); return; }
    $('prep').hidden = true; FR.save();
    A.day.opening();
  });

  A.prep = {
    open() {
      FR.rollDay();
      if (S().guestsDay !== S().day) FR.rollGuests();
      tab = 'guests'; render(); $('prep').hidden = false;
    }
  };
})();
