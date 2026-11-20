// Night service in 3D. v4 built the kitchen and the stations; v4.1 brings the guests to life the way
// the 2D game had them: every species and role looks and acts like itself, regulars come back,
// guests chat, ask questions, complain, run off without paying and demand other tables, groups need
// big tables, Royals eat three courses at the VIP table, critics hide in disguise, Crabfolk pay in
// shells, Sea Witches leave a blessing or a curse, and night events (storm, sea monster, rival boat,
// celebrity) really happen. Plus a Waiter, staff training and moods, and night fishing off the bow.
(function () {
  const A = window.FR3D, D = FR.DATA, C = D.config;
  const { boat } = A;
  const $ = id => document.getElementById(id);
  const rnd = FR.rand;
  const V = (x, z) => new THREE.Vector3(x, 0, z);
  const FLOOR = A.FLOOR, WALL_Z = A.WALL_Z;
  const S = () => FR.state;

  // ---------- places on the boat (boat coordinates; the dock lines up with them) ----------
  const tableAt = i => { const a = A.tableGroups[i].userData.at; return V(a.x, a.z); };
  const PODIUM = V(3.6, 2.3);
  const QUEUE = [V(8.0, 0.9), V(9.2, 0.9), V(10.4, 0.9), V(11.6, 0.9)];
  const ARRIVE = V(12.2, -3.0);
  const SINK = V(3.25, 7.3), PASS = V(2.3, 3.2);
  const TANK = V(-3.25, 6.3), PANTRY = V(-3.65, 4.9), BOARD = V(3.7, 8.85), BIN = V(0.6, 4.3);
  const SUSHI = V(1.6, -6.75), ROD = V(-3.0, -5.9);
  const DOOR = [V(-1.2, 2.4), V(-1.2, 4.0)];
  const STATIONS = [
    { id: 'grill', heat: 'grill', name: 'Grill', at: V(-3.5, 8.85) },
    { id: 'fry', heat: 'fry', name: 'Fryer', at: V(-1.75, 8.85) },
    { id: 'pot', heat: 'pot', name: 'Stove', at: V(0.15, 8.85) }
  ];
  // stations you can build: each one lets you hire one member of staff
  const BUILD = FR.BUILD3D = {
    host: { name: 'Host stand', price: 150, max: 2, staff: 'host', spots: [V(7.2, -1.6), V(7.2, 3.6)], desc: 'A stand on the dock. A Host there seats guests at the right table and collects their payment.' },
    waiter: { name: 'Waiter station', price: 150, max: 2, staff: 'waiter', spots: [V(1.7, 2.55), V(-3.0, 2.55)], desc: 'A little stand by the pass. A Waiter there takes orders and serves any dish left on the PASS.' },
    dish: { name: 'Dish pit', price: 200, max: 2, staff: 'dishwasher', spots: [V(-4.05, 8.4), V(-2.3, 7.0)], desc: 'A second sink. A Dishwasher there clears tables and washes plates.' },
    cook: { name: 'Cook station', price: 300, max: 2, staff: 'cook', spots: [V(1.4, 6.7), V(1.4, 5.0)], desc: 'A stove for any dish. A Line Cook there cooks orders and puts them on the pass.' }
  };
  const CREW = Object.keys(BUILD);
  function crewData() {
    const st = S(), z = () => ({ host: 0, waiter: 0, dish: 0, cook: 0 });
    st.built3d = Object.assign(z(), st.built3d || {});
    st.crew3d = Object.assign(z(), st.crew3d || {});
    st.train3d = Object.assign({ host: 1, waiter: 1, dish: 1, cook: 1, deckhand: 1 }, st.train3d || {});
    st.mood3d = Object.assign({ host: 1, waiter: 1, dish: 1, cook: 1, deckhand: 1 }, st.mood3d || {});
    return st;
  }
  FR.crewData3d = crewData;
  FR.staffDef3d = key => D.staff.find(d => d.id === (BUILD[key] ? BUILD[key].staff : key));
  // how fast a crew member works: training level, mood (missed wages), and tiredness late in the night
  function crewSpeed(k, tired) {
    const st = crewData(), R = C.staffRules, lv = st.train3d[k] || 1;
    return R.levelSpeed[lv - 1] * (R.minMood + (1 - R.minMood) * st.mood3d[k]) * (1 - R.tired * (tired || 0) / lv);
  }
  FR.crewSpeed3d = crewSpeed;

  // ================= people =================
  const matCache = {};
  const mat = (c, o) => { const k = c + (o ? JSON.stringify(o) : ''); return matCache[k] || (matCache[k] = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o || {}))); };
  const mesh = (geo, m, x, y, z, p) => { const o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; (p || boat).add(o); return o; };
  const sph = (r, c, x, y, z, p, sx, sy, sz) => { const o = mesh(new THREE.SphereGeometry(r, 12, 9), mat(c), x, y, z, p); if (sx) o.scale.set(sx, sy, sz); return o; };
  const cyl = (rt, rb, h, c, x, y, z, p, seg) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 10), mat(c), x, y, z, p);
  const cone = (r, h, c, x, y, z, p, seg) => mesh(new THREE.ConeGeometry(r, h, seg || 12), mat(c), x, y, z, p);
  const bx = (w, h, d, c, x, y, z, p) => mesh(new THREE.BoxGeometry(w, h, d), mat(c), x, y, z, p);
  const grp = (x, y, z, p) => { const g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); (p || boat).add(g); return g; };
  const SKINS = [0xf2c09a, 0xe0a87a, 0xb07a52, 0x7a4a2e, 0xf6d2b8];
  const HAIR = [0x3a2a1a, 0xd9a520, 0x8a3a1a, 0x1a1a1a, 0xc8c0b0];
  const ROLE_BODY = { sailor: 0x3d7edb, foodie: 0xd9548f, pirate: 0x333333, family: 0x3f9e5a, influencer: 0x1fa3c4, critic: 0x6b7785, royal: 0x7b2d8e };

  // ----- v4.2 look: our own guest kit (js/guests.js) in the toon style (js/toonkit.js) -----
  // The game keeps moving simple stand-in parts (torso, head, arms, legs...) exactly as before;
  // u.sync copies those moves onto the kit's character every frame. Our characters face +z and
  // the game's face -z, so the model is turned round and the x and z turns are mirrored.
  let GK = null;
  const pickOne = a => a[Math.floor(Math.random() * a.length)];
  function kitPerson(o) {
    const T = window.FRToon;
    GK = GK || window.makeGuestKit({ mk: T.mk, grp: T.grp, INK: T.INK, ramp: T.ramp });
    const sp = o.species || 'human', role = o.role, kid = !!o.kid;
    const spec = { species: sp, role: kid ? null : role, kid };
    spec.skin = { seaking: 0x4fb5a5, seawitch: 0x7bc96f, octofolk: 0xa36bff, crabfolk: 0xff5d3c }[sp] || pickOne(GK.SKIN);
    spec.shirt = spec.sleeve = o.body || ROLE_BODY[role] || 0x9fd0ff;
    spec.pants = o.legs || (role === 'royal' ? 0x5a1d6e : 0x2b2140);
    if (sp === 'human') { spec.hair = kid ? 'spiky' : pickOne(['short', 'long', 'bun', 'curly', 'spiky', 'short', 'bald']); spec.hairColor = pickOne(GK.HAIR); spec.lashes = spec.hair === 'long' || spec.hair === 'bun'; }
    if (sp === 'mermaid') Object.assign(spec, { shirt: spec.skin, sleeve: spec.skin, hair: 'long', hairColor: pickOne(GK.HAIR), lashes: true, tail: pickOne([0x2ec4b6, 0x8a5ae0, 0xff6fae]), fin: 0x9cf0e0 });
    if (sp === 'seawitch') Object.assign(spec, { shirt: 0x5a2a8a, sleeve: 0x5a2a8a, hair: 'long', hairColor: 0x2a1d14, lashes: true });
    if (sp === 'seaking') Object.assign(spec, { shirt: 0x1f6a7a, sleeve: 0x1f6a7a, pants: 0x1d3f6a });
    if (sp === 'octofolk') spec.lashes = Math.random() < 0.5;
    if (o.regular === 'gus') Object.assign(spec, { role: null, skin: GK.SKIN[2], hair: 'short', hairColor: 0xc8c8d0, beard: 0xe0e0e8, bigBeard: true, captain: true, pipe: true, shirt: 0x24356a, sleeve: 0x24356a, pants: 0x2a2a3a });
    if (o.regular === 'marina') Object.assign(spec, { role: null, skin: GK.SKIN[0], shirt: GK.SKIN[0], sleeve: GK.SKIN[0], hair: 'long', hairColor: 0xd23c2a, flowers: true, lashes: true, tail: 0x2ec4b6 });
    if (o.celeb) spec.role = 'royal';
    if (o.apron) Object.assign(spec, { apron: o.apron, hair: 'short', hairColor: pickOne(GK.HAIR) });
    const model = GK.make(spec), rig = model.userData.rig;
    const g = new THREE.Group(); g.rotation.order = 'YXZ'; boat.add(g);
    const SC = 0.82, inner = new THREE.Group(); inner.rotation.y = Math.PI; inner.scale.setScalar(SC); g.add(inner); inner.add(model);
    const P = () => new THREE.Object3D();
    const u = { legs: [], arms: [P(), P()], tents: [], kind: 'legs', walkT: Math.random() * 6, bob: 0, torso: P(), head: P(), orb: model.userData.orb, phone: model.userData.phone };
    if (sp === 'mermaid') { u.kind = 'tail'; u.tail = P(); }
    else if (sp === 'octofolk') { u.kind = 'tents'; u.tents = rig.tents.map(ch => ch.map(() => P())); }
    else if (sp === 'crabfolk') { u.kind = 'crab'; u.legs = rig.crabLegs.map(() => P()); }
    else if (rig.legL) u.legs = [P(), P()];
    else { u.kind = 'robe'; u.robe = P(); }
    const base = {
      armL: rig.armL.rotation.clone(), armR: rig.armR.rotation.clone(),
      tents: rig.tents ? rig.tents.map(ch => ch.map(x => x.rotation.x)) : null,
      crab: rig.crabLegs ? rig.crabLegs.map(l => l.rotation.x) : null,
      tail: rig.tail ? rig.tail[0].rotation.clone() : null
    };
    const mirror = (dst, src, b) => dst.rotation.set(b.x - src.rotation.x, b.y + src.rotation.y, b.z - src.rotation.z);
    u.sync = (t, m) => {
      rig.body.rotation.set(-u.torso.rotation.x, 0, -u.torso.rotation.z);
      rig.body.position.y = u.torso.position.y / SC;
      rig.head.rotation.set(-u.head.rotation.x, u.head.rotation.y, -u.head.rotation.z);
      mirror(rig.armR, u.arms[0], base.armR); mirror(rig.armL, u.arms[1], base.armL);
      if (u.kind === 'legs' && rig.legL) { rig.legR.rotation.x = -u.legs[0].rotation.x; rig.legL.rotation.x = -u.legs[1].rotation.x; }
      inner.position.y = m && m.sit && u.kind === 'legs' ? 0.1 : 0; // our hips sit a little lower than the old model's
      if (u.kind === 'tents') u.tents.forEach((ch, i) => ch.forEach((px, k) => { rig.tents[i][k].rotation.x = base.tents[i][k] + (px.rotation.x - 0.15) * 0.7; }));
      if (u.kind === 'crab') u.legs.forEach((px, i) => { rig.crabLegs[i].rotation.x = base.crab[i] + px.rotation.x; });
      if (u.kind === 'tail' && base.tail) { rig.tail[0].rotation.x = base.tail.x - u.tail.rotation.x * 0.5; rig.tail[0].rotation.z = base.tail.z - u.tail.rotation.z; }
      model.userData.face(0, t, m && (m.anim === 'angry' || m.anim === 'tap') ? 'mad' : 'ok');
    };
    g.userData = u;
    return g;
  }

  // look: { species, role (what they look like), kid, regular, staff color, celeb, size }
  function makePerson(o) {
    if (window.makeGuestKit && window.FRToon) return kitPerson(o);
    const g = new THREE.Group(); g.rotation.order = 'YXZ'; boat.add(g);
    const sp = o.species || 'human', role = o.role, u = { legs: [], arms: [], tents: [], kind: 'legs', walkT: Math.random() * 6, bob: 0 };
    let skin = SKINS[Math.floor(Math.random() * SKINS.length)], body = o.body || ROLE_BODY[role] || 0x9fd0ff;
    if (sp === 'mermaid') skin = 0xf2c9a0; if (sp === 'seaking') skin = 0x7fc8b8; if (sp === 'seawitch') skin = 0x9fd68f; if (sp === 'octofolk') skin = 0xb26bd6; if (sp === 'crabfolk') skin = 0xf0916f;
    if (o.regular === 'gus') { skin = 0xe0a87a; body = 0x2f4f8f; }
    if (o.regular === 'marina') body = 0xd9548f;
    // ----- lower body -----
    if (sp === 'mermaid') {
      u.kind = 'tail'; const tail = grp(0, 0.6, 0, g); u.tail = tail;
      const tc = o.regular === 'marina' ? 0x3fbfb0 : 0x4fd1c5;
      cone(0.27, 0.75, tc, 0, -0.3, 0, tail).rotation.x = Math.PI;
      const fin = cone(0.24, 0.3, 0x2f9e9e, 0, -0.62, 0.05, tail, 4); fin.scale.set(1.6, 1, 0.3);
      for (let i = 0; i < 3; i++) { const r = mesh(new THREE.TorusGeometry(0.2 - i * 0.04, 0.02, 4, 16), mat(0x2f9e9e), 0, -0.1 - i * 0.16, 0, tail); r.rotation.x = Math.PI / 2; }
    } else if (sp === 'octofolk') {
      u.kind = 'tents';
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, t0 = grp(Math.cos(a) * 0.18, 0.55, Math.sin(a) * 0.18, g); t0.rotation.y = -a; let par = t0; const segs = []; for (let k = 0; k < 3; k++) { const s = grp(0, k ? -0.18 : 0, 0, par); cyl(0.07 - k * 0.015, 0.06 - k * 0.015, 0.2, skin, 0, -0.1, 0, s, 6); segs.push(s); par = s; } u.tents.push(segs); }
    } else if (sp === 'crabfolk') {
      u.kind = 'crab';
      for (let i = 0; i < 4; i++) { const side = i < 2 ? -1 : 1, l = grp(side * 0.22, 0.45, (i % 2 ? 0.12 : -0.12), g); const leg = cyl(0.04, 0.03, 0.5, 0xd9704f, side * 0.12, -0.2, 0, l, 6); leg.rotation.z = side * 0.6; u.legs.push(l); }
    } else if (sp === 'seawitch') {
      u.kind = 'robe'; const robe = cone(0.42, 1.0, 0x3a2a5a, 0, 0.5, 0, g, 14); robe.rotation.x = Math.PI; robe.position.y = 0.5; u.robe = robe;
    } else {
      [-0.13, 0.13].forEach(x => { const h = grp(x, 0.55, 0, g); cyl(0.09, 0.08, 0.5, o.legs || (role === 'royal' ? 0x5a1d6e : 0x2b2140), 0, -0.25, 0, h, 8); bx(0.14, 0.08, 0.24, 0x1a1426, 0, -0.52, -0.04, h); u.legs.push(h); });
    }
    // ----- body and head -----
    const torso = grp(0, 0, 0, g); u.torso = torso;
    if (sp === 'crabfolk') { sph(0.48, skin, 0, 0.82, 0, torso, 1, 0.65, 0.85); sph(0.36, 0xffd2b8, 0, 0.8, -0.18, torso, 1, 0.6, 0.6); }
    else if (sp === 'octofolk') sph(0.3, skin, 0, 0.8, 0, torso, 1, 1, 0.9);
    else { const t = sph(0.36, body, 0, 0.95, 0, torso, 1, 1.2, 0.85); void t;
      if (role === 'sailor' && sp !== 'seaking') for (let i = 0; i < 3; i++) { const r = mesh(new THREE.TorusGeometry(0.34 - Math.abs(i - 1) * 0.04, 0.025, 4, 18), mat(0xffffff), 0, 0.8 + i * 0.16, 0, torso); r.rotation.x = Math.PI / 2; }
      if (role === 'pirate') { const r = mesh(new THREE.TorusGeometry(0.33, 0.06, 6, 18), mat(0xc8423b), 0, 0.82, 0, torso); r.rotation.x = Math.PI / 2; }
      if (role === 'foodie') bx(0.32, 0.36, 0.03, 0xffffff, 0, 1.0, -0.31, torso);
      if (sp === 'mermaid') [-0.12, 0.12].forEach(x => sph(0.09, 0xff8fb0, x, 1.08, -0.27, torso));
    }
    const head = grp(0, sp === 'crabfolk' ? 1.18 : sp === 'octofolk' ? 1.32 : 1.58, 0, torso); u.head = head;
    if (sp === 'crabfolk') {
      [-0.13, 0.13].forEach(x => { cyl(0.025, 0.025, 0.28, 0xd9704f, x, 0.05, -0.15, head, 6); sph(0.07, 0xffffff, x, 0.21, -0.15, head); sph(0.035, 0x1a1026, x, 0.22, -0.21, head); });
    } else {
      const hr = sp === 'octofolk' ? 0.42 : o.kid ? 0.3 : 0.3;
      sph(hr, skin, 0, 0, 0, head, 1, sp === 'octofolk' ? 1.15 : 1, 1);
      const ey = sp === 'octofolk' ? 0.05 : 0.04, ez = -hr * 0.9;
      [-0.1, 0.1].forEach(x => { sph(sp === 'octofolk' ? 0.08 : 0.045, sp === 'octofolk' ? 0xffffff : 0x1a1026, x * (sp === 'octofolk' ? 1.4 : 1), ey, ez, head); if (sp === 'octofolk') sph(0.04, 0x1a1026, x * 1.4, ey, ez - 0.06, head); });
      if (sp === 'human' || sp === 'mermaid') { const hairC = o.regular === 'gus' ? 0xc8c0b0 : o.regular === 'marina' ? 0xc8423b : HAIR[Math.floor(Math.random() * HAIR.length)]; sph(0.31, hairC, 0, 0.08, 0.06, head, 1, 0.9, 1); if (sp === 'mermaid') sph(0.28, hairC, 0, -0.32, 0.14, head, 1.05, 1.6, 0.5); }
      if (sp === 'seaking' || o.regular === 'gus') { const b = cone(0.2, 0.42, o.regular === 'gus' ? 0xc8c0b0 : 0xffffff, 0, -0.28, -0.12, head); b.rotation.x = Math.PI + 0.25; }
      if (sp === 'octofolk') { const m = mesh(new THREE.TorusGeometry(0.06, 0.015, 4, 10, Math.PI), mat(0x5a2a6a), 0, -0.12, -0.38, head); m.rotation.z = Math.PI; }
    }
    // ----- headwear: species first, then role -----
    const hat = sp === 'seaking' || role === 'royal' || o.celeb ? 'crown' : sp === 'seawitch' ? 'witch' : o.regular === 'gus' ? 'captain' : o.kid ? null : { sailor: 'cap', foodie: 'beret', pirate: 'tricorn', family: 'sunhat', influencer: 'shades', critic: 'beret' }[role] || null;
    const hy = sp === 'octofolk' ? 0.42 : sp === 'crabfolk' ? 0.32 : 0.28;
    if (hat === 'crown') { const c = mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.18, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0xffd23c, metalness: 0.6, roughness: 0.3, side: THREE.DoubleSide }), 0, hy + 0.04, 0, head); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; cone(0.04, 0.12, 0xffd23c, Math.cos(a) * 0.19, hy + 0.18, Math.sin(a) * 0.19, head, 4); } sph(0.04, 0xe8344e, 0, hy + 0.05, -0.2, head); void c; }
    else if (hat === 'witch') { cyl(0.36, 0.36, 0.03, 0x4a2a6a, 0, hy, 0, head, 16); const w = cone(0.22, 0.6, 0x4a2a6a, 0, hy + 0.3, 0.05, head); w.rotation.x = 0.25; }
    else if (hat === 'cap') { cyl(0.24, 0.26, 0.12, 0xffffff, 0, hy, 0, head, 14); cyl(0.255, 0.255, 0.04, 0x2f4f8f, 0, hy - 0.04, 0, head, 14); }
    else if (hat === 'captain') { cyl(0.26, 0.24, 0.14, 0x2f4f8f, 0, hy, 0, head, 14); bx(0.3, 0.03, 0.12, 0x1a1a1a, 0, hy - 0.06, -0.24, head); sph(0.04, 0xffd23c, 0, hy + 0.02, -0.25, head); }
    else if (hat === 'beret') { sph(0.28, role === 'critic' ? 0x2b2140 : 0x8e1a3a, 0.04, hy + 0.02, 0, head, 1, 0.35, 1); }
    else if (hat === 'tricorn') { const t = cone(0.4, 0.22, 0x1a1a1a, 0, hy + 0.04, 0, head, 3); t.rotation.y = Math.PI / 6; sph(0.06, 0xffffff, 0, hy + 0.04, 0, head, 1, 0.5, 1); }
    else if (hat === 'sunhat') { cyl(0.44, 0.44, 0.03, 0xf2dca0, 0, hy - 0.02, 0, head, 18); cyl(0.2, 0.24, 0.16, 0xf2dca0, 0, hy + 0.06, 0, head, 14); }
    else if (hat === 'shades') bx(0.34, 0.07, 0.04, 0xff6f91, 0, 0.05, -0.3, head);
    if (role === 'pirate' && sp !== 'crabfolk') { sph(0.07, 0x1a1a1a, 0.1, 0.05, -0.28, head, 1, 1, 0.4); const st = mesh(new THREE.TorusGeometry(0.31, 0.012, 4, 20), mat(0x1a1a1a), 0, 0.06, 0, head); st.rotation.set(0.2, 0, 0.2); }
    if (role === 'critic') [-0.1, 0.1].forEach(x => { const r = mesh(new THREE.TorusGeometry(0.07, 0.015, 4, 12), mat(0x1a1a1a), x, 0.05, -0.3, head); void r; });
    if (o.regular === 'marina') { [0, 1, 2, 3, 4].forEach(i => sph(0.05, 0xffd23c, 0.22 + Math.cos(i * 1.25) * 0.07, 0.15 + Math.sin(i * 1.25) * 0.07, 0, head)); }
    // ----- arms (claws for crabfolk) -----
    [-1, 1].forEach(sd => {
      const a = grp(sd * (sp === 'crabfolk' ? 0.5 : sp === 'octofolk' ? 0.28 : 0.4), sp === 'crabfolk' ? 0.85 : sp === 'octofolk' ? 0.85 : 1.15, 0, torso);
      if (sp === 'crabfolk') { cyl(0.05, 0.05, 0.35, 0xd9704f, 0, -0.17, 0, a, 6); const cl = grp(0, -0.38, 0, a); sph(0.13, 0xe8553a, 0, 0, 0, cl, 1, 1.2, 0.8); const p1 = cone(0.07, 0.24, 0xe8553a, 0.05, -0.18, 0, cl, 6); p1.rotation.z = 0.3; const p2 = cone(0.06, 0.2, 0xe8553a, -0.05, -0.16, 0, cl, 6); p2.rotation.z = -0.4; }
      else { const ac = sp === 'octofolk' ? skin : sp === 'seawitch' ? 0x3a2a5a : body; cyl(0.07, 0.06, 0.45, ac, 0, -0.22, 0, a, 8); sph(0.065, skin, 0, -0.46, 0, a); }
      u.arms.push(a);
    });
    // ----- props -----
    const hand = u.arms[1];
    if (role === 'influencer') { u.phone = bx(0.12, 0.2, 0.02, 0x2b2140, 0, -0.5, -0.06, hand); bx(0.1, 0.17, 0.005, 0x8fd3ff, 0, -0.5, -0.075, hand); }
    if (sp === 'seawitch') { cyl(0.025, 0.025, 1.6, 0x5a3a22, 0, -0.3, -0.05, hand, 6); const orb = mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0x7dffb0 }), 0, 0.5, -0.05, hand); u.orb = orb; }
    if (sp === 'seaking' && !o.kid) { cyl(0.02, 0.02, 1.7, 0xffd23c, 0, -0.35, -0.05, hand, 6); [-0.08, 0, 0.08].forEach(x => cone(0.025, 0.16, 0xffd23c, x, 0.55, -0.05, hand, 4)); }
    if (sp === 'seaking' || role === 'royal' || o.celeb) { const cape = mesh(new THREE.PlaneGeometry(0.7, 1.1), new THREE.MeshStandardMaterial({ color: role === 'royal' ? 0x5a1d6e : 0xb3262b, side: THREE.DoubleSide, roughness: 0.8 }), 0, 0.85, 0.3, torso); cape.rotation.x = 0.12; }
    if (o.regular === 'gus') { const pipe = cyl(0.02, 0.02, 0.2, 0x5a3a22, 0.08, -0.12, -0.32, head, 6); pipe.rotation.x = Math.PI / 2; cyl(0.04, 0.035, 0.07, 0x5a3a22, 0.08, -0.08, -0.43, head, 8); }
    if (o.apron) bx(0.5, 0.45, 0.04, o.apron, 0, 0.85, -0.3, torso);
    if (o.kid) g.scale.setScalar(0.65);
    g.traverse(m => { if (m.isMesh) m.castShadow = true; });
    g.userData = u;
    return g;
  }

  // ---------- walking ----------
  const dockY = () => 1.225 - boat.position.y;
  function floorAt(x) { return x > 7 ? dockY() : x > 4.7 ? FLOOR + (dockY() - FLOOR) * (x - 4.7) / 2.3 : FLOOR; }
  function mover(g, speed) { return { g, path: [], speed: speed || 2.6, sit: false, face: null, anim: null, animT: 0 }; }
  // the lane in front of a table (on the side away from the rail)
  function laneFor(v) {
    for (let i = 0; i < A.tableGroups.length; i++) {
      const t = A.tableGroups[i]; if (!t.visible) continue;
      const a = t.userData.at;
      if (Math.abs(v.x - a.x) <= 1.45 && Math.abs(v.z - a.z) <= 1.45) return { at: a, z: t.userData.dock ? (a.z > 0.9 ? a.z - 1.6 : a.z + 1.6) : a.z + 1.6 };
    }
    return null;
  }
  const zone = v => v.x > 4.6 ? 'dock' : v.z > WALL_Z + 0.1 ? 'kitchen' : 'dining';
  function route(from, to) {
    const pts = [], zf = zone(from), zt = zone(to), lf = laneFor(from), lt = laneFor(to);
    const backSide = (v, l) => (v.z - l.at.z) * Math.sign(l.z - l.at.z) < -0.9;
    if (lf) {
      if (backSide(from, lf)) { const sx = l => l.at.x + (l.at.x < 0 ? -1.75 : 1.75); pts.push(V(sx(lf), from.z), V(sx(lf), lf.z)); }
      pts.push(V(from.x, lf.z)); if (zf === 'dining') pts.push(V(0, lf.z));
    }
    if (zf !== zt || (zf === 'dining' && !lf && lt && Math.abs(from.x) > 0.6)) {
      if (zf === 'dining' && zt === 'dining') pts.push(V(0, from.z)); // step into the middle aisle first
      if (zf === 'dining' && zt !== 'dining') pts.push(V(0, 0.9));
      if (zf === 'dock') pts.push(V(7.0, 0.9), V(4.2, 0.9));
      if (zf === 'kitchen') pts.push(DOOR[1].clone(), DOOR[0].clone());
      if (zt === 'kitchen') { if (zf === 'dock') pts.push(V(-1.2, 0.9)); pts.push(DOOR[0].clone(), DOOR[1].clone()); }
      if (zt === 'dock') { if (zf === 'kitchen') pts.push(V(-1.2, 0.9)); pts.push(V(4.2, 0.9), V(7.0, 0.9)); }
      if (zt === 'dining' && zf !== 'dining') pts.push(V(0, 0.9));
    }
    if (lt) {
      if (zt === 'dining') pts.push(V(0, lt.z));
      pts.push(V(to.x, lt.z));
      if (backSide(to, lt)) { const sx = lt.at.x + (lt.at.x < 0 ? -1.75 : 1.75); pts.splice(pts.length - 1, 1, V(sx, lt.z), V(sx, to.z)); }
    }
    pts.push(to.clone());
    return pts;
  }
  function goTo(m, to, onArrive) { m.sit = false; m.path = route(m.g.position, to); m.onArrive = onArrive || null; }
  function stepMover(m, dt, t) {
    const g = m.g, u = g.userData;
    let moving = false;
    if (m.path.length) {
      const p = m.path[0], dx = p.x - g.position.x, dz = p.z - g.position.z, d = Math.hypot(dx, dz);
      if (d < 0.1) { m.path.shift(); if (!m.path.length && m.onArrive) { const f = m.onArrive; m.onArrive = null; f(); } }
      else {
        const st = Math.min(d, m.speed * dt); g.position.x += dx / d * st; g.position.z += dz / d * st; moving = true;
        const face = Math.atan2(-dx, -dz); let diff = face - g.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); g.rotation.y += diff * Math.min(1, dt * 10);
      }
    } else if (m.face !== null) { let diff = m.face - g.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); g.rotation.y += diff * Math.min(1, dt * 6); }
    u.walkT = moving ? u.walkT + dt * 9 * (m.speed / 2.4) : u.walkT;
    u.ww = (u.ww || 0) + ((moving ? 1 : 0) - (u.ww || 0)) * Math.min(1, dt * 10);
    const sw = Math.sin(u.walkT) * 0.65 * u.ww;
    // reset the pose, then walk, then the mood on top
    u.torso.rotation.set(-0.08 * u.ww, 0, 0); u.torso.position.y = 0; u.head.rotation.set(0, 0, 0);
    u.arms[0].rotation.set(-sw * 0.8, 0, 0); u.arms[1].rotation.set(sw * 0.8, 0, 0);
    if (u.kind === 'legs') { u.legs[0].rotation.x = m.sit ? 1.4 : sw; u.legs[1].rotation.x = m.sit ? 1.4 : -sw; }
    if (u.kind === 'crab') u.legs.forEach((l, i) => { l.rotation.x = Math.sin(u.walkT * 1.6 + i * 1.6) * 0.5 * u.ww; });
    if (u.kind === 'tents') u.tents.forEach((segs, i) => segs.forEach((s, k) => { s.rotation.x = (m.sit ? 0.6 : 0.15) + Math.sin(t * 3 + i + k * 0.8 + u.walkT) * (0.15 + 0.25 * u.ww); }));
    if (u.kind === 'tail' && u.tail) { u.tail.rotation.x = m.sit ? 1.2 : Math.sin(t * 2 + u.walkT) * 0.12 * (1 + u.ww * 2); u.tail.rotation.z = Math.sin(u.walkT) * 0.2 * u.ww; }
    if (u.orb) u.orb.material.color.setHSL(0.38 + Math.sin(t * 2) * 0.05, 1, 0.6 + Math.sin(t * 5) * 0.1);
    if (m.carry) { u.arms[0].rotation.x = u.arms[1].rotation.x = 1.2; }
    let hop = moving ? Math.abs(Math.sin(u.walkT)) * (u.kind === 'tail' ? 0.12 : 0.05) : 0;
    // moods and reactions
    m.animT += dt; const at = m.animT;
    switch (m.anim) {
      case 'happy': hop += Math.abs(Math.sin(at * 3)) * 0.05; u.head.rotation.z = Math.sin(at * 3) * 0.15; break;
      case 'tap': u.arms[1].rotation.x = 1.3 + Math.abs(Math.sin(at * 14)) * 0.25; u.head.rotation.z = 0.15; break;
      case 'wave': u.arms[1].rotation.x = -2.7; u.arms[1].rotation.z = 0.4 + Math.sin(at * 10) * 0.4; break;
      case 'stand': if (m.sit) { u.torso.position.y = 0.25; } u.arms[0].rotation.x = u.arms[1].rotation.x = -2.6 + Math.sin(at * 12) * 0.3; hop += Math.abs(Math.sin(at * 8)) * 0.08; break;
      case 'eat': u.arms[1].rotation.x = 1.6 + Math.max(0, Math.sin(at * 4)) * 0.8; u.head.rotation.x = 0.1 + Math.max(0, Math.sin(at * 4 - 0.4)) * 0.15; break;
      case 'angry': u.arms[0].rotation.x = u.arms[1].rotation.x = -1.8 + Math.sin(at * 18) * 0.5; u.torso.rotation.z = Math.sin(at * 18) * 0.06; break;
      case 'cheer': u.arms[0].rotation.x = u.arms[1].rotation.x = -2.9; u.arms[0].rotation.z = -0.4; u.arms[1].rotation.z = 0.4; hop += Math.abs(Math.sin(at * 7)) * 0.25; break;
      case 'photo': u.arms[1].rotation.x = 2.4; u.arms[0].rotation.x = 1.6; u.head.rotation.x = -0.15; break;
      case 'write': u.arms[1].rotation.x = 1.3 + Math.sin(at * 20) * 0.1; u.head.rotation.x = 0.3; break;
      case 'think': u.arms[1].rotation.x = 2.4; u.arms[1].rotation.z = -0.5; u.head.rotation.z = 0.2; break;
      case 'dash': u.arms[0].rotation.x = -sw * 1.6; u.arms[1].rotation.x = sw * 1.6; u.torso.rotation.x = -0.3; break;
    }
    g.position.y = floorAt(g.position.x) + (m.sit && u.kind === 'legs' ? -0.15 : m.sit ? 0.1 : 0) + hop;
    if (u.sync) u.sync(t, m);
  }

  // ---------- built stations (3D models) ----------
  const builtModels = { host: [], waiter: [], dish: [], cook: [] };
  function buildModel(key, i) {
    const at = BUILD[key].spots[i], g = new THREE.Group(); g.position.set(at.x, 0, at.z); boat.add(g);
    const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o || {}));
    const b = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
    if (key === 'host') {
      g.userData.dock = true;
      b(0.8, 1.0, 0.5, M(0x5a3a22), 0, 0.5, 0); b(0.9, 0.06, 0.6, M(0x8a5a34), 0, 1.03, 0); b(0.4, 0.04, 0.3, M(0xc8423b), 0, 1.08, 0);
    } else if (key === 'waiter') {
      b(0.5, 0.95, 0.45, M(0x5a3a22), 0, FLOOR + 0.48, 0); b(0.56, 0.05, 0.5, M(0xfff3d6), 0, FLOOR + 0.98, 0); b(0.3, 0.02, 0.3, M(0xffffff), 0, FLOOR + 1.02, 0);
      A.addSolid(at.x, at.z, 0.5, 0.45);
    } else if (key === 'dish') {
      b(1.0, 0.85, 0.9, M(0x3f6f8a), 0, FLOOR + 0.42, 0); b(1.06, 0.06, 0.96, M(0xb8c2cc, { metalness: 0.7, roughness: 0.3 }), 0, FLOOR + 0.88, 0);
      b(0.7, 0.04, 0.6, M(0x5bc8ff, { roughness: 0.1 }), 0, FLOOR + 0.9, 0);
      A.addSolid(at.x, at.z, 1.0, 0.9);
    } else {
      b(1.5, 0.85, 1.0, M(0x2f3540, { metalness: 0.4 }), 0, FLOOR + 0.42, 0); b(1.54, 0.06, 1.04, M(0x1a1a1e, { metalness: 0.5 }), 0, FLOOR + 0.88, 0);
      [-0.35, 0.35].forEach(x => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 18), M(0x3a3a3a, { emissive: 0xff3a10, emissiveIntensity: 0.6 })); r.rotation.x = Math.PI / 2; r.position.set(x, FLOOR + 0.93, 0); g.add(r); });
      A.addSolid(at.x, at.z, 1.5, 1.0);
    }
    builtModels[key].push(g);
  }
  FR.syncBuilt3d = function () {
    const st = crewData();
    for (const k in BUILD) while (builtModels[k].length < st.built3d[k]) buildModel(k, builtModels[k].length);
  };
  // decor, paint, theme, sections, waters and tables, all from the save
  FR.syncDecor3d = function () {
    const st = S();
    A.setLook(st); A.setSections(st.sections || {}); A.setWaters(st.home || 'home');
    FR.applyLayout3d();
    const big = FR.bigTables();
    A.tableGroups.forEach((t, i) => { t.userData.extra.visible = big.includes(i); t.userData.vip.visible = i === C.vipTable && st.upgrades.vip > 0; });
  };
  // Build mode: tables you moved. A table's block (for walking) and its group move together.
  FR.applyLayout3d = function () {
    const lay = (S().layout3d || {});
    A.tableGroups.forEach((t, i) => {
      if (t.userData.dock) return;
      const home = t.userData.home0 || (t.userData.home0 = { x: t.userData.at.x, z: t.userData.at.z });
      const p = lay[i] || [home.x, home.z];
      t.userData.at.x = p[0]; t.userData.at.z = p[1]; t.position.set(p[0], FLOOR, p[1]); t.updateMatrix();
      const h = t.userData.home; h[0] = p[0] - 1.3; h[1] = p[1] - 1.3; h[2] = p[0] + 1.3; h[3] = p[1] + 1.3;
      if (t.visible) { const b = t.userData.block; b[0] = h[0]; b[1] = h[1]; b[2] = h[2]; b[3] = h[3]; }
    });
  };
  // the kitchen bin
  {
    const bin = new THREE.Group(); bin.position.set(BIN.x, FLOOR, BIN.z - 0.55); boat.add(bin);
    const bm = new THREE.MeshStandardMaterial({ color: 0x5a6a7a, metalness: 0.5, roughness: 0.4 });
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.7, 14), bm); can.position.y = 0.35; can.castShadow = true; bin.add(can);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.06, 14), bm); lid.position.y = 0.72; bin.add(lid);
    A.addSolid(BIN.x, BIN.z - 0.55, 0.6, 0.6);
  }
  function placeDockModels() { builtModels.host.forEach(g => { g.position.y = dockY(); }); }

  // ================= little effects =================
  // sprite bursts: coins, hearts, stars, sparkles. pos is in boat coordinates.
  const fxTex = {};
  function glyphTex(ch, color) {
    const k = ch + color; if (fxTex[k]) return fxTex[k];
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    g.font = '48px "Lilita One", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 6; g.strokeStyle = '#2b2140'; g.strokeText(ch, 32, 34); g.fillStyle = color; g.fillText(ch, 32, 34);
    return (fxTex[k] = new THREE.CanvasTexture(c));
  }
  const fxPool = []; for (let i = 0; i < 60; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false })); sp.visible = false; boat.add(sp); fxPool.push({ sp, v: new THREE.Vector3(), life: 0 }); }
  function burst(pos, ch, color, n, up) {
    for (let i = 0; i < (n || 8); i++) {
      const f = fxPool.find(x => x.life <= 0); if (!f) return;
      f.life = 1; f.sp.visible = true; f.sp.material.map = glyphTex(ch, color); f.sp.material.needsUpdate = true; f.sp.scale.setScalar(0.45);
      f.sp.position.set(pos.x, (pos.y || FLOOR + 1.6), pos.z); const a = rnd(0, Math.PI * 2), s = rnd(0.6, 1.8);
      f.v.set(Math.cos(a) * s, rnd(2.0, 3.8) * (up || 1), Math.sin(a) * s);
    }
  }
  function stepFx(dt) { fxPool.forEach(f => { if (f.life <= 0) return; f.life -= dt * 0.9; f.v.y -= 4 * dt; f.sp.position.addScaledVector(f.v, dt); f.sp.material.opacity = Math.min(1, f.life * 2); if (f.life <= 0) f.sp.visible = false; }); }
  // steam puffs over pots and pans that are cooking
  const steam = []; for (let i = 0; i < 24; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); boat.add(m); steam.push({ m, life: 0 }); }
  function puff(at, color) { const p = steam.find(x => x.life <= 0); if (!p) return; p.life = 1; p.m.material.color.setHex(color || 0xffffff); p.m.position.set(at.x + rnd(-0.2, 0.2), FLOOR + 1.1, at.z + rnd(-0.2, 0.2)); }
  function stepSteam(dt) { steam.forEach(p => { if (p.life <= 0) { p.m.material.opacity = 0; return; } p.life -= dt * 0.8; p.m.position.y += dt * 0.8; p.m.scale.setScalar(1 + (1 - p.life) * 2.5); p.m.material.opacity = Math.max(0, p.life) * 0.5; }); }
  // food on the tables: the dish's picture on each guest's plate, then a dirty plate after they go
  const dirtyTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#f2ede2'; g.beginPath(); g.arc(32, 32, 28, 0, 7); g.fill(); g.strokeStyle = '#cfc6b0'; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 18, 0, 7); g.stroke(); g.fillStyle = '#b08a5a'; [[24, 28], [38, 36], [30, 40], [40, 24]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }); return new THREE.CanvasTexture(c); })();
  const dishTexCache = {};
  const dishTex = id => dishTexCache[id] || (dishTexCache[id] = new THREE.CanvasTexture(id === 'live' ? FR.fishArt.glowgill : FR.dishArt[id]));

  // ================= night state =================
  let N = null;
  const labelsEl = $('labels');
  function label(cls) { const d = document.createElement('div'); d.className = 'lbl ' + (cls || ''); labelsEl.appendChild(d); return d; }
  const LIVE = { id: 'live', name: 'Catch of the moment', heat: 'none', kind: 'real', fish: {}, sides: {} };
  // v4.2: at night too, only the fish your hook is for will bite
  FR.pickNightFish = () => { const w = {}, all = D.areas[S().home || 'home'].night || D.areas.home.night; for (const k in all) if (FR.tackleFits(k)) w[k] = all[k]; return Object.keys(w).length ? FR.weighted(w) : null; };
  function needOf(res) {
    const need = [];
    res.fish.forEach(f => need.push({ kind: 'ing', t: 'fish', id: f.id, fish: f }));
    for (const id in res.sides) for (let i = 0; i < res.sides[id]; i++) need.push({ kind: 'ing', t: 'side', id });
    return need;
  }
  const resCount = () => ({ served: 0, walked: 0, turned: 0, reviews: [], requests: [], events: [], buzz: 0, hex: null, broken: 0, bestCombo: 0, shells: 0, complaints: 0, fixed: 0, caught: 0, dashed: 0, stolen: 0, tentacles: 0 });
  const BIG_TABLES = () => FR.bigTables();
  const isVip = i => i === C.vipTable && S().upgrades.vip > 0;

  function startNight() {
    const st = crewData();
    FR.syncBuilt3d(); FR.syncDecor3d();
    const nTables = Math.min(A.tableGroups.length, FR.tableCount());
    A.setTableCount(nTables);
    const plan = FR.planNight(true);
    const coming = [];
    const res = resCount();
    plan.forEach(p => {
      if (p.why === 'request') return;
      if (p.why || !p.orders.length) { p.turnAway = p.why || 'stock'; p.orders.forEach(o => o.res && FR.refund(o.res)); p.myOrders = []; coming.push(p); return; }
      p.myOrders = p.orders.map((o, k) => o.live ? { live: true, recipe: LIVE, need: [], served: false, ticketed: false, claimed: false, guest: null } : { recipe: o.recipe, need: needOf(o.res), served: false, ticketed: false, claimed: false, guest: null, payMult: p.g.returning === o.recipe.id ? 2 : 1, course: D.roles[p.g.role].courses ? k + 1 : undefined });
      coming.push(p);
    });
    const ev = FR.eventDef(), evd = ev && ev.when === 'night' ? ev : null;
    N = {
      coming, guests: [], orders: [].concat(...coming.map(p => p.myOrders)), pass: [], carry: [], t: 0, nextArrive: C.arrival.first, arrived: 0, total: coming.length,
      tables: A.tableGroups.slice(0, nTables).map((t, i) => ({ i, at: tableAt(i), g: t, guest: null, dirty: 0, label: label('t'), big: BIG_TABLES().includes(i), vip: isVip(i), food: [], grab: null })),
      clean: st.plates, res, combo: 0, chatCD: 0,
      stations: STATIONS.map(s => Object.assign({ slots: [], cap: FR.burners(), label: label('s'), load: 0 }, s)),
      board: { items: [], prog: 0, prep: null, label: label('s') },
      sink: { dirty: 0, prog: 0, label: label('s') },
      store: null, staff: [], done: false, leading: null, paused: false, evd, fight: null
    };
    // extra cook stations cook anything
    for (let i = 0; i < Math.min(st.built3d.cook, 2); i++) { const at = BUILD.cook.spots[i]; N.stations.push({ id: 'cook' + i, heat: 'any', name: 'Cook station', at: V(at.x, at.z - 0.85), slots: [], cap: 2, label: label('s'), cookSpot: i, load: 0 }); }
    // staff, with their station's apron colour
    const hires = { host: 0x9fd0ff, waiter: 0xffd08a, dish: 0xa8f0b8, cook: 0xffa8a8 };
    CREW.forEach(k => {
      for (let i = 0; i < Math.min(st.crew3d[k], st.built3d[k]); i++) {
        const spot = BUILD[k].spots[i], home = k === 'host' ? V(spot.x - 0.7, spot.z) : k === 'waiter' ? V(spot.x, spot.z - 0.6) : k === 'dish' ? V(spot.x + (spot.x < -3 ? 0.9 : 0), spot.z - (spot.x < -3 ? 0 : 0.85)) : V(spot.x, spot.z - 0.85);
        const g = makePerson({ species: 'human', body: 0xffffff, apron: hires[k], legs: 0x2b2140 }); g.position.set(home.x, floorAt(home.x), home.z);
        const sf = { kind: k, i, m: mover(g, 2.4), home, t: 0, carry: 0, label: label('g') };
        N.staff.push(sf);
      }
    });
    // tonight's event
    if (evd) startEvent(evd);
    $('nightHud').hidden = false; $('rail').hidden = false; $('actBtn').hidden = false; $('carry').hidden = false;
    A.setOpenSign(true);
    drawCarry();
    if (st.day <= 2) toast('Greet guests at the podium, then lead them to a table. Take orders, cook, serve, and collect the bill.\nKitchen: open the FISH TANK and PANTRY, chop on the BOARD, HOLD to cook.', '#ffe9a8');
    else if (!coming.some(p => !p.turnAway)) toast('Nobody you can feed tonight. Check the Guests tab tomorrow.', '#ff9c9c');
    if (evd) setTimeout(() => toast(`Tonight: ${evd.name}! ${evd.desc}`, '#ffe14d'), st.day <= 2 ? 3600 : 400);
  }

  // ================= events =================
  function startEvent(E) {
    if (E.id === 'storm') { N.storm = { t: rnd(E.every[0], E.every[1]), gust: 0, dir: 1, warned: false }; A.weather.rain = true; A.weather.dark = 0.35; A.weather.rock = 1.8; }
    if (E.id === 'monster') N.monster = { t: rnd(E.first[0], E.first[1]), n: 0 };
    if (E.id === 'rival') { A.rival.visible = true; }
  }
  function endEvent() { Object.assign(A.weather, { rain: false, dark: 0, rock: 1, roll: 0, flash: 0 }); A.rival.visible = false; if (N) N.tables.forEach(tb => { if (tb.grab) { boat.remove(tb.grab.k); tb.grab = null; } }); }
  function runEvent(dt) {
    const E = N.evd, chef = A.chef;
    if (N.storm) {
      const st = N.storm;
      if (Math.random() < dt * 0.15) { A.weather.flash = 1; setTimeout(() => FR.sfx('zap'), 300); }
      if (st.gust > 0) {
        st.gust -= dt;
        const k = Math.sin(Math.min(1, st.gust / E.gust) * Math.PI);
        A.weather.rock = 1.8 + k * 3; A.weather.roll = st.dir * 0.05 * k;
        if (!N.fight && chef.parent === boat) { const nx = chef.position.x + st.dir * 1.8 * dt; if (A.onDeck(nx, chef.position.z)) chef.position.x = nx; }
        if (st.gust <= 0) { A.weather.roll = 0; A.weather.rock = 1.8; }
      } else {
        st.t -= dt;
        if (st.t <= 1.2 && !st.warned) { st.warned = true; st.dir = Math.random() < 0.5 ? -1 : 1; bigText(A.chef.position, st.dir < 0 ? '◀ BIG WAVE!' : 'BIG WAVE! ▶', '#bfe3ff'); FR.sfx('splash'); }
        if (st.t <= 0) {
          st.gust = E.gust; st.t = rnd(E.every[0], E.every[1]); st.warned = false; FR.sfx('splash'); A.weather.flash = 0.6;
          N.tables.forEach(tb => {
            if (tb.dirty > 0 && !tb.guest && S().plates > 2 && Math.random() < E.plateSlide) { tb.dirty--; S().plates--; N.res.broken++; tb.food.pop(); drawTableFood(tb); floatText(tb.at, 'A plate slid off and smashed!', '#ff9c9c'); burst(V(tb.at.x + st.dir, tb.at.z), '✦', '#ffffff', 6); }
          });
        }
      }
    }
    if (N.monster && N.monster.n < E.max) {
      const m = N.monster; m.t -= dt;
      if (m.t <= 0) {
        const free = N.tables.filter(t => !t.guest && !t.grab && !N.guests.some(g => g.demand && g.demand.table === t));
        if (!free.length) m.t = 3; else { m.n++; m.t = rnd(E.again[0], E.again[1]); grabTable(FR.pick(free)); }
      }
    }
    N.tables.forEach(tb => { if (tb.grab) { tb.grab.k.userData.wiggle(N.t, true); tb.grab.k.position.y = (tb.g.userData.dock ? dockY() : FLOOR) - 0.5 + Math.min(1, tb.grab.rise += dt) * 0.5; } });
  }
  function grabTable(tb) {
    const k = A.makeTentacle(); boat.add(k);
    const side = tb.at.x < 0 ? -1 : 1; k.position.set(tb.at.x + side * 1.6, FLOOR - 0.5, tb.at.z - 0.6); k.rotation.z = -side * 0.55;
    tb.grab = { hp: 1, k, rise: 0 };
    bigText(tb.at, 'SEA MONSTER!', '#c59bff'); A.weather.flash = 0.4; FR.sfx('zap');
    toast(`A tentacle has table ${tb.i + 1}! Hold E there to fight it off.`, '#c59bff');
  }

  // ================= guests =================
  function spawnGuest(p) {
    const g = p.g, role = D.roles[g.role], sp = D.species[g.species], look = D.roles[g.look] || role;
    const reg = g.regular ? D.regulars.find(r => r.id === g.regular) : null;
    const n = g.size || 1, models = [];
    for (let i = 0; i < n; i++) {
      const kid = role.id === 'family' && i >= 2;
      const pm = makePerson({ species: g.species, role: look.id, kid, regular: reg && i === 0 ? reg.id : null, celeb: g.celeb && i === 0 });
      pm.position.set(ARRIVE.x + i * 0.6, dockY(), ARRIVE.z - i * 0.3);
      models.push(pm);
    }
    const bar = S().sections && S().sections.bar ? D.sections.find(x => x.id === 'bar').patience : 1;
    const ptime = C.patience[role.patience] * FR.stylePatience(role.id, sp.id) * bar * (1 + C.group.patiencePer * (n - 1)) * FR.hexMod('patience');
    const gu = { p, g, role, sp, look, reg, models, ms: models.map(m => mover(m, 2.2)), state: 'arriving', patience: 1, ptime, rate: 1, table: null, orders: p.myOrders, label: label('g'), sayEl: label('g'), orderT: 0, eatT: 0, tipBonus: 0, reviewPen: 0, noTip: false, chatT: rnd(C.chat.every[0], C.chat.every[1]), celeb: !!g.celeb, returning: g.returning || null, payT: 0 };
    gu.orders.forEach(o => { o.guest = gu; });
    N.guests.push(gu);
    if (p.turnAway) {
      // they read the menu at the podium and leave (no bad review: they never sat down)
      gu.state = 'turnaway'; N.res.turned++;
      const why = p.turnAway === 'menu' ? `Only ${S().menu.length} dishes? No thanks.` : p.turnAway === 'diet' ? (g.species === 'mermaid' ? 'No kelp dish? Hmph!' : g.species === 'seaking' ? 'No fantasy fish? Bah!' : g.species === 'seawitch' ? 'No fantasy fish? I shall remember this.' : 'Nothing for me here.') : 'Sold out of everything I eat? Pity.';
      gu.ms.forEach((m, k) => goTo(m, V(QUEUE[0].x + 1.2 + k * 0.5, QUEUE[0].z - 1.4), () => { if (k) return; say(gu, why); m.anim = 'angry'; setTimeout(() => leave(gu), 2600); }));
      return;
    }
    queueUp(gu);
    FR.sfx('order');
  }
  const queueGuests = () => N.guests.filter(x => x.state === 'queue' || x.state === 'arriving');
  function queueUp(gu) {
    const q = queueGuests(), i = Math.min(QUEUE.length - 1, q.indexOf(gu));
    gu.ms.forEach((m, k) => goTo(m, V(QUEUE[i].x + k * 0.45, QUEUE[i].z + k * 0.35), () => { if (gu.state === 'arriving') gu.state = 'queue'; m.face = Math.PI / 2; }));
  }
  // where a guest (or member k of a group) sits at a table
  const SEAT_ANG = [Math.PI, 0, Math.PI / 2, -Math.PI / 2];
  const seatOf = (tb, k) => { const a = SEAT_ANG[k % 4]; return { at: V(tb.at.x + Math.cos(a) * 1.25, tb.at.z + Math.sin(a) * 1.25), face: Math.atan2(Math.cos(a), Math.sin(a)) }; };
  const tableFits = (gu, tb) => !tb.guest && !tb.dirty && !tb.grab && ((gu.g.size || 1) <= 1 || tb.big) && (!(gu.role.courses && !gu.reg) || tb.vip);
  // 1) greet: the guest follows you  2) walk to a table and seat them there
  function greet(gu) {
    gu.state = 'follow'; N.leading = gu; gu.patience = Math.min(1, gu.patience + 0.2);
    sayFloat(gu, 'Welcome aboard!', '#9cffb0'); FR.sfx('order');
    queueGuests().forEach(queueUp);
  }
  function seat(gu, tb) {
    if (N.leading === gu) N.leading = null;
    gu.state = 'toTable'; gu.table = tb; tb.guest = gu;
    gu.patience = Math.min(1, gu.patience + 0.25);
    gu.ms.forEach((m, k) => {
      const s = seatOf(tb, k);
      goTo(m, s.at, () => { m.sit = true; m.face = s.face; if (k === 0) onSeated(gu, tb); });
    });
    queueGuests().forEach(queueUp);
    FR.sfx('blip');
  }
  function onSeated(gu, tb) {
    const T = C.trouble;
    gu.state = 'seated'; gu.orderT = C.orderDelay;
    if (gu.demand) {
      const ok = gu.demand.table === tb; gu.demand = null;
      if (ok) { gu.patience = Math.min(1, gu.patience + T.demandPatience); gu.tipBonus += T.demandTip; sayFloat(gu, '"Much better." Bigger tip!', '#9cffb0'); FR.sfx('good'); }
      else { gu.rate *= T.demandRate; sayFloat(gu, '"This is not what I asked for."', '#ff9c9c'); FR.sfx('bad'); }
    } else if (gu.sp.id === 'seaking' && (gu.g.size || 1) === 1 && !gu.reg && !gu.celeb && !gu.demanded && S().day >= T.fromDay && Math.random() < T.demandChance) {
      const free = N.tables.filter(t => t !== tb && !t.guest && !t.dirty && !t.grab);
      if (free.length) { gu.demanded = true; gu.demand = { table: FR.pick(free), t: T.demandSeconds }; say(gu, `I demand table ${gu.demand.table.i + 1}!`); FR.sfx('order'); }
    }
    if (gu.reg && !gu.greeted) { gu.greeted = true; say(gu, FR.pick(gu.reg.lines)); toast(`${gu.reg.name}: "${FR.pick(gu.reg.lines)}"`, '#ffe9a8'); }
  }
  function moveTable(gu) {
    gu.table.guest = null; gu.table = null; gu.ms.forEach(m => { m.sit = false; });
    N.leading = gu; gu.state = 'follow'; FR.sfx('order');
  }
  function leave(gu) {
    if (gu.state === 'leaving' || gu.state === 'gone') return;
    gu.state = 'leaving'; gu.ask = null; gu.complaint = null;
    if (N.leading === gu) N.leading = null;
    if (gu.table) { gu.table.guest = null; gu.table = null; }
    gu.ms.forEach(m => { m.sit = false; if (m.anim !== 'angry' && m.anim !== 'cheer') m.anim = null; goTo(m, ARRIVE, () => { m.g.visible = false; if (gu.ms.every(x => !x.g.visible)) { gu.state = 'gone'; gu.models.forEach(x => boat.remove(x)); gu.label.remove(); gu.sayEl.remove(); } }); });
    queueGuests().forEach(queueUp);
  }
  function refundItem(it) { if (it.t === 'fish') FR.refundFish(it.fish); else S().sides[it.id] = (S().sides[it.id] || 0) + 1; }
  function refundOrders(gu) { gu.orders.forEach(o => { if (!o.served) { o.served = 'gone'; o.need.forEach(refundItem); o.need = []; } }); }
  function walkOut(gu) {
    const inQueue = gu.state === 'queue' || gu.state === 'arriving';
    if (N.evd && N.evd.id === 'rival' && inQueue) { N.res.stolen++; sayFloat(gu, 'Lured away by the rival boat!', '#ff9c9c'); FR.sfx('bad'); refundOrders(gu); gu.ms.forEach(m => { m.anim = null; }); leave(gu); return; }
    N.res.walked++; breakCombo('a guest walked out'); N.res.reviews.push(1);
    afterVisit(gu, 1, false);
    refundOrders(gu);
    gu.ms.forEach(m => { m.anim = 'angry'; });
    if (gu.table) { const eaten = gu.orders.filter(o => o.served === true).length; if (eaten) { gu.table.dirty += eaten; gu.table.food.forEach(f => { f.dirty = true; }); drawTableFood(gu.table); } }
    sayFloat(gu, inQueue ? 'Tired of waiting! ★' : 'Too slow! ★', '#ff9c9c');
    FR.sfx('bad');
    leave(gu);
  }
  function breakCombo(why) { if (N.combo >= 2) floatText(A.chef.position, `Combo lost: ${why}`, '#ff9c9c'); N.combo = 0; }

  // ---------- ordering ----------
  function inFlight(r) { return N.carry.concat(N.board.prep ? [N.board.prep] : [], N.pass, ...N.stations.map(s => s.slots.map(x => x.prep))).some(it => it.recipe === r); }
  // their food was set aside when you opened; if you borrowed some, top it back up from the shelf
  function topUp(o) {
    if (o.live) return true;
    const r = o.recipe, st = S(), have = (t, id) => o.need.filter(n => n.t === t && (id === null || n.id === id)).length;
    let ok = true;
    for (const id in r.sides) for (let n = have('side', id); n < r.sides[id]; n++) { if (st.sides[id] > 0) { st.sides[id]--; o.need.push({ kind: 'ing', t: 'side', id }); } else ok = false; }
    for (const id in r.fish) for (let n = have('fish', id); n < r.fish[id]; n++) { const f = FR.takeFish(id); if (f) o.need.push({ kind: 'ing', t: 'fish', id, fish: f }); else ok = false; }
    for (let n = have('fish', null); n < (r.anyFish || 0); n++) { const f = FR.takeCheapFish(); if (f) o.need.push({ kind: 'ing', t: 'fish', id: f.id, fish: f }); else ok = false; }
    return ok || inFlight(r);
  }
  function takeOrder(gu) {
    const st = S();
    const edible = st.menu.map(FR.recipe).filter(r => FR.edible(gu.sp, r));
    if (gu.sp.fantasyNerves && edible.length && edible.every(r => r.kind === 'fantasy')) gu.rate = gu.sp.fantasyNerves;
    const keep = [];
    gu.orders.forEach(o => {
      if (topUp(o)) { keep.push(o); return; }
      o.need.forEach(refundItem); o.need = []; o.served = 'gone';
      const r = FR.dishFor({ role: gu.role.id, species: gu.sp.id, r: Math.random() }, null, 0); // you used up their food: they settle for something else
      if (r) { const res = FR.reserve(r); if (res) { const sw = { recipe: r, need: needOf(res), served: false, ticketed: false, claimed: false, guest: gu, payMult: 1, course: o.course }; N.orders.push(sw); keep.push(sw); } }
    });
    gu.orders = keep;
    if (!keep.length) { N.res.turned++; sayFloat(gu, 'Everything they eat is sold out!', '#ff9c9c'); gu.ms.forEach(m => { m.anim = 'angry'; }); leave(gu); return; }
    gu.state = 'waitfood'; gu.patience = Math.min(1, gu.patience + 0.25);
    gu.orders.forEach(o => { o.ticketed = true; });
    if ((gu.g.size || 1) === 1 && gu.orders.length > 1) gu.ptime *= 1.5;
    if (gu.orders[0].live) gu.ptime *= 1.3;
    if (!gu.reg && Math.random() < C.chat.askChance) gu.askAt = rnd(C.chat.askDelay[0], C.chat.askDelay[1]);
    FR.sfx('order');
    // a special request: a dish they would come back for tomorrow (and pay double)
    if (!gu.reg && !gu.returning && !gu.role.secret && !gu.celeb && N.res.requests.length < C.maxRequestsPerNight && Math.random() < C.specialRequestChance) {
      const opts = D.recipes.filter(r => !r.legendary && !st.menu.includes(r.id) && FR.edible(gu.sp, r) && !N.res.requests.some(q => q.recipe === r.id));
      if (opts.length) { const r = FR.pick(opts); N.res.requests.push({ recipe: r.id, role: gu.role.id, species: gu.sp.id }); say(gu, `Do you ever serve ${r.name}? I'd come back for that.`); toast(`${gu.sp.name} ${gu.look.name}: "Do you ever serve ${r.name}? I'd come back for that."\n(Put it on tomorrow's menu: they pay double.)`, '#ffe9a8'); }
    }
    if (gu.returning && gu.orders.some(o => o.payMult === 2)) sayFloat(gu, 'Back for their request! Pays double', '#9cffb0');
  }
  const tickets = () => N.orders.filter(o => o.ticketed && !o.served);
  // which of this guest's open orders a dish answers (a Royal takes one course at a time, in order)
  function wants(gu, item) {
    let open = gu.orders.filter(o => !o.served);
    if (gu.role.courses && !gu.reg) open = open.slice(0, 1);
    return open.find(o => item.live ? o.live : !o.live && fits(o.recipe, item.recipe));
  }
  // v4.2 fix: one plain fish on the grill plates as its named dish (Grilled Sardine...), but it is still a
  // Catch of the Day: an "any fish" order takes any dish with that many fish, no sides, cooked the same way.
  function fits(want, got) {
    if (want === got) return true;
    if (!want || !got || !want.anyFish) return false;
    const n = Object.values(got.fish || {}).reduce((a, b) => a + b, 0) + (got.anyFish || 0);
    return n === want.anyFish && !Object.keys(got.sides || {}).length && got.heat === want.heat;
  }
  function serve(gu, item) {
    const o = wants(gu, item), tb = gu.table;
    N.carry = N.carry.filter(x => x !== item); drawCarry();
    if (!o) {
      if (gu.role.courses && !item.live && gu.orders.some(x => !x.served && fits(x.recipe, item.recipe))) { N.carry.push(item); drawCarry(); sayFloat(gu, '"One course at a time!"', '#ffe9a8'); FR.sfx('bad'); return; }
      if (gu.sp.id === 'mermaid' && (item.live || item.recipe.kind !== 'kelp')) {
        N.clean++; N.res.reviews.push(1); breakCombo('served a Mermaid fish');
        FR.sfx('bad'); burst(V(tb.at.x, tb.at.z), '💧', '#5bd1ff', 10); sayFloat(gu, 'FISH?! How dare you! ★', '#ff9c9c');
        gu.ms.forEach(m => { m.anim = 'angry'; }); refundOrders(gu); tb.dirty++; leave(gu);
        return;
      }
      N.carry.push(item); drawCarry();
      breakCombo('wrong dish');
      if (gu.complaint) { sayFloat(gu, 'Still not my order!', '#ffe9a8'); FR.sfx('bad'); }
      else { gu.patience = Math.max(0.02, gu.patience - C.complaint.wrongPatience); complain(gu, 'wrong', null); }
      return;
    }
    o.served = true; o.q = item.q;
    if (item.live) o.livePay = item.livePay;
    tb.food.push({ id: item.live ? 'live' : item.recipe.id, k: tb.food.length });
    drawTableFood(tb);
    if (item.q === 'burnt') { breakCombo('served a burnt dish'); complain(gu, 'burnt', o); }
    else {
      N.combo = Math.min(C.comboMax, N.combo + 1); N.res.bestCombo = Math.max(N.res.bestCombo, N.combo);
      FR.goalEvent('combo', { n: N.combo });
      if (item.q === 'perfect') { FR.goalEvent('perfect', {}); burst(V(tb.at.x, tb.at.z), '★', '#ffe14d', 8); }
      if (N.combo >= 2) { bigText(tb.at, `COMBO ×${N.combo}`, '#ffe14d'); FR.sfx('perfect'); }
    }
    gu.comboMult = Math.max(gu.comboMult || 1, 1 + C.comboStep * Math.min(N.combo, C.comboMax));
    FR.sfx('good');
    if (gu.orders.every(x => x.served)) {
      gu.state = 'eating'; gu.eatT = C.eatSeconds; say(gu, FR.pick(D.chatter.eating));
      if ((gu.g.size || 1) > 1 && gu.orders.length > 1 && !gu.cold && !gu.groupDone) { gu.tipBonus += C.group.togetherTip; sayFloat(gu, 'All served together! Bigger tip', '#9cffb0'); }
      gu.groupDone = true;
    } else if (gu.role.courses && !gu.reg) { gu.state = 'eating'; gu.eatT = C.royal.courseSeconds; gu.course = true; say(gu, 'Next course, please…'); }
    else { gu.patience = Math.min(1, gu.patience + 0.25); if ((gu.g.size || 1) > 1 && gu.groupT === undefined) gu.groupT = C.group.window; }
  }
  function drawTableFood(tb) {
    (tb.foodSprites || []).forEach(s => tb.g.remove(s));
    tb.foodSprites = tb.food.map((f, i) => {
      const a = SEAT_ANG[i % 4], sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: f.dirty ? dirtyTex : dishTex(f.id), transparent: true }));
      sp.scale.setScalar(f.dirty ? 0.45 : 0.6); sp.position.set(Math.cos(a) * 0.5, 1.12, Math.sin(a) * 0.5); tb.g.add(sp); return sp;
    });
  }

  // ---------- the bill ----------
  function bill(gu) {
    let pay = 0, tip = 0, worst = 5;
    gu.orders.forEach(o => {
      if (o.live) { pay += o.livePay.pay; tip += o.livePay.tip; worst = Math.min(worst, o.livePay.flashy ? 5 : 4); return; }
      const q = C.quality[o.q];
      worst = Math.min(worst, Math.max(q.review, o.reviewFloor || 0));
      if (gu.role.id === 'foodie' && o.q === 'burnt') return; // a Foodie will not pay for a burnt dish
      const base = FR.price(o.recipe) * q.pay * gu.role.pay * (gu.sp.pay || 1) * (o.payMult || 1);
      pay += base; tip += base * C.tipRate * gu.patience;
      if (gu.role.id === 'foodie' && o.q === 'perfect') tip += base * C.foodiePerfectTip;
    });
    let review = worst - gu.reviewPen;
    if (gu.patience < 0.2) review--;
    review = Math.max(1, review);
    gu.due = { pay: Math.round(pay), tip: gu.noTip ? 0 : Math.round(tip * (gu.comboMult || 1) * (1 + gu.tipBonus) * FR.hexMod('tip')), review };
    if (gu.sp.shells && gu.due.pay > 0) { gu.due.shells = Math.ceil(gu.due.pay / C.shells.value); gu.due.pay = 0; }
    const T = C.trouble;
    if (gu.role.id === 'pirate' && !gu.reg && gu.due.pay > 0 && !gu.due.shells && S().day >= T.fromDay && Math.random() < T.dashChance) { dash(gu); return; }
    if (gu.celeb) {
      const E = N.evd, perfect = gu.orders.every(o => o.live || o.q === 'perfect');
      if (perfect) { gu.due.review = 5; if (!gu.noTip) gu.due.tip += Math.round(gu.due.pay * E.tip); } else gu.due.review = Math.min(gu.due.review, E.failReview);
    }
    gu.state = 'paying'; gu.payT = 0;
    gu.table.food.forEach(f => { f.dirty = true; }); drawTableFood(gu.table);
    FR.sfx('order');
  }
  function collect(gu, byHost) {
    const st = S(), tb = gu.table, late = gu.payT > C.payGrace;
    const pay = gu.due.pay, tip = late ? 0 : gu.due.tip, review = late ? Math.max(1, gu.due.review - 1) : gu.due.review;
    FR.earn('sales', pay); FR.earn('tips', tip);
    st.stats.species = st.stats.species || {}; st.stats.species[gu.sp.id] = true;
    FR.goalEvent('serve', { species: gu.sp.id, role: gu.look.id }); FR.goalEvent('tips', { n: tip });
    N.res.served++; N.res.reviews.push(review);
    if (gu.orders.some(o => o.live && o.livePay.flashy)) N.res.reviews.push(5);
    const shells = gu.due.shells || 0;
    if (shells) { st.shells = (st.shells || 0) + shells; N.res.shells += shells; }
    FR.sfx(pay > 0 || shells ? 'coin' : 'bad');
    burst(V(tb.at.x, tb.at.z), shells ? '🐚' : '$', shells ? '#f0916f' : '#ffd23c', pay > 0 || shells ? 10 : 0);
    afterVisit(gu, review, true);
    floatText(tb.at, shells ? `+${shells} shells${tip ? '  tip $' + tip : ''}  ${'★'.repeat(review)}` : pay > 0 ? `+$${pay}${tip ? '  tip $' + tip : late ? '  (no tip: too slow)' : ''}  ${'★'.repeat(review)}` : `Burnt! No pay  ${'★'.repeat(review)}`, pay > 0 || shells ? '#9cffb0' : '#ff9c9c');
    if (gu.role.id === 'pirate' && !st.spot && Math.random() < C.pirateMapChance) { st.spot = true; st.baits.gold = (st.baits.gold || 0) + 2; N.res.events.push('A pirate paid with a treasure map! It led to 2 gold flakes, the bait legends like.'); toast('The pirate slides a treasure map across the table!', '#ffe9a8'); }
    if (gu.sp.id === 'seaking' && Math.random() < C.seaKingBaitChance) { st.baits.gold = (st.baits.gold || 0) + 1; N.res.events.push('A Sea King tipped you with gold flakes (rare bait).'); sayFloat(gu, '+1 gold flakes', '#ffe9a8'); }
    if (gu.reg && gu.orders.some(o => !o.live && o.recipe.id === gu.reg.favorite) && (st.friends[gu.reg.id] || 0) < C.friendshipGoal) {
      const f = st.friends[gu.reg.id] = (st.friends[gu.reg.id] || 0) + 1;
      burst(V(tb.at.x, tb.at.z), '♥', '#ff6f91', 10);
      if (f >= C.friendshipGoal) {
        const r = FR.recipe(gu.reg.reward);
        if (FR.unlockRecipe(r.id)) N.res.events.push(`${gu.reg.name} is now your friend and taught you a recipe: ${r.name}!`); else { FR.earn('rewards', 50); N.res.events.push(`${gu.reg.name} is now your friend and left a $50 gift.`); }
        toast(`${gu.reg.name} is now your friend! ♥`, '#ff9ccf');
      } else N.res.events.push(`${gu.reg.name} loved their favorite dish. Friendship ${f}/${C.friendshipGoal}.`);
    }
    N.combo = N.combo; // (combo only grows when dishes land well)
    tb.dirty += gu.orders.length;
    gu.ms.forEach(m => { m.anim = review >= 4 ? 'cheer' : null; });
    if (!byHost) FR.sfx('coin');
    leave(gu);
  }
  // what a visit leaves behind: the Critic's verdict, an Influencer's post, the Sea Witch's spell, the King's mood
  function afterVisit(gu, review, stayed) {
    const at = gu.ms[0].g.position;
    if (gu.celeb) { const E = N.evd; for (let i = 1; i < E.reviews; i++) N.res.reviews.push(review); bigText(at, review >= 5 ? 'THE KING IS PLEASED!' : 'THE KING IS NOT AMUSED', review >= 5 ? '#ffe14d' : '#ff9c9c'); N.res.events.push(`${E.title} gave you ${review}★, counted ${E.reviews} times.`); }
    if (gu.role.secret) {
      for (let i = 1; i < C.critic.reviews; i++) N.res.reviews.push(review);
      bigText(at, 'A CRITIC!', review >= 4 ? '#9cffb0' : '#ff9c9c'); gu.look = gu.role;
      N.res.events.push(`A food critic was here in disguise. Their ${review}★ counted ${C.critic.reviews} times.`);
      FR.sfx(review >= 4 ? 'perfect' : 'bad');
    }
    if (gu.role.id === 'influencer' && stayed && review >= C.influencer.happyReview) { N.res.buzz += C.influencer.wave; sayFloat(gu, `Posted! +${C.influencer.wave} guests tomorrow`, '#9cffb0'); A.weather.flash = Math.max(A.weather.flash, 0.3); }
    if (gu.sp.hex) {
      const W = C.witch, good = review >= W.blessReview, bad = review <= W.curseReview;
      if (good || bad) { const h = FR.pick(D.hexes.filter(v => v.good === good)); N.res.hex = h.id; toast(`The Sea Witch ${good ? 'blesses' : 'curses'} you: ${h.name}. Tomorrow: ${h.desc}`, good ? '#9cffb0' : '#ff9c9c'); burst(at, good ? '✦' : '☠', good ? '#9cffb0' : '#9b5de5', 14); }
    }
  }
  // a pirate who finishes eating and makes a run for the dock
  function dash(gu) {
    const tb = gu.table;
    tb.dirty += gu.orders.length; tb.guest = null; gu.table = null;
    gu.state = 'dash'; gu.dashT = C.trouble.dashWarn;
    say(gu, FR.pick(D.chatter.dash)); bigText(tb.at, 'RUNNER!', '#ff9c9c'); FR.sfx('bad');
    gu.ms.forEach(m => { m.sit = false; m.anim = 'dash'; m.path = []; m.g.position.y = floorAt(m.g.position.x); });
  }
  function endDash(gu, caught) {
    const pay = gu.due.pay, fine = Math.round(pay * C.trouble.dashFine);
    if (caught) { FR.earn('sales', pay); FR.earn('tips', fine); N.res.served++; N.res.caught++; N.res.reviews.push(gu.due.review); FR.sfx('coin'); burst(gu.ms[0].g.position, '$', '#ffd23c', 12); bigText(gu.ms[0].g.position, 'CAUGHT!', '#ffe14d'); floatText(gu.ms[0].g.position, `+$${pay} and a $${fine} fine`, '#9cffb0'); A.react('yay', 0.9); }
    else { N.res.dashed++; FR.sfx('bad'); floatText(ARRIVE, `The pirate got away with $${pay}!`, '#ff9c9c'); breakCombo('a pirate ran off'); }
    gu.ms.forEach(m => { m.anim = caught ? 'angry' : 'cheer'; });
    leave(gu);
  }

  // ---------- talk, questions, complaints ----------
  function say(gu, line) {
    gu.sayLine = line; gu.sayT = C.chat.show; N.chatCD = C.chat.gap;
  }
  function sayFloat(gu, text, color) { floatText(gu.ms[0].g.position, text, color); }
  function complain(gu, kind, o) {
    if (gu.complaint) return;
    gu.complaint = { kind, o, t: C.complaint.seconds }; N.res.complaints++;
    FR.sfx('bad'); say(gu, kind === 'burnt' ? 'This is BURNT!' : "That's not my order!");
    gu.ms.forEach(m => { m.anim = 'angry'; m.animT = 0; });
  }
  function social(gu, dt) {
    const X = C.chat;
    if (gu.sayT > 0) gu.sayT -= dt;
    if (['seated', 'ready', 'waitfood'].includes(gu.state)) {
      gu.chatT -= dt;
      if (gu.chatT <= 0 && N.chatCD <= 0 && !gu.complaint && !gu.ask) {
        gu.chatT = rnd(X.every[0], X.every[1]);
        const W = D.chatter.waiting;
        const pool = gu.patience < C.mood.wave ? D.chatter.impatient : W.any.concat(W[gu.sp.id] || [], W[gu.look.id] || [], gu.role.secret ? W[gu.role.id].concat(W[gu.role.id]) : []);
        say(gu, FR.pick(pool));
        if (gu.role.id === 'influencer' && Math.random() < 0.6) { gu.ms[0].anim = 'photo'; gu.ms[0].animT = 0; A.weather.flash = Math.max(A.weather.flash, 0.15); FR.sfx('click'); }
        if (gu.role.secret && Math.random() < 0.5) { gu.ms[0].anim = 'write'; gu.ms[0].animT = 0; }
      }
    }
    if (gu.state === 'waitfood' && gu.askAt !== undefined && !gu.ask && !gu.complaint) {
      gu.askAt -= dt;
      if (gu.askAt <= 0) { gu.askAt = undefined; const opts = D.questions.filter(q => q.who === 'any' || q.who === gu.sp.id || q.who === gu.look.id); if (opts.length) { gu.ask = { q: FR.pick(opts), t: X.askSeconds }; say(gu, gu.ask.q.q); FR.sfx('order'); gu.ms[0].anim = 'think'; gu.ms[0].animT = 0; } }
    }
    if (gu.ask) { gu.ask.t -= dt; if (gu.ask.t <= 0 || gu.state !== 'waitfood') { if (gu.state === 'waitfood') gu.patience -= X.askIgnored; gu.ask = null; } }
    if (gu.complaint) {
      gu.complaint.t -= dt;
      if (gu.complaint.t <= 0) { gu.complaint = null; gu.reviewPen += C.complaint.ignoredReview; gu.noTip = true; sayFloat(gu, 'Complaint ignored! No tip, worse review', '#ff9c9c'); FR.sfx('bad'); breakCombo('ignored a complaint'); }
    }
    if (gu.state === 'waitfood' && gu.groupT !== undefined && !gu.cold && !gu.groupDone) {
      gu.groupT -= dt;
      if (gu.groupT <= 0) { gu.cold = true; gu.patience = Math.max(0.02, gu.patience - C.group.coldPatience); sayFloat(gu, 'The food is going cold! Bring the rest!', '#ff9c9c'); FR.sfx('bad'); }
    }
    if (gu.demand && gu.state === 'seated') { gu.demand.t -= dt; if (gu.demand.t <= 0) { gu.demand = null; gu.rate *= C.trouble.demandRate; sayFloat(gu, 'Hmph. I shall stay, then.', '#ff9c9c'); } }
  }
  // what each guest is doing with their body right now
  function mood(gu) {
    const M = C.mood, p = gu.patience;
    let a = null;
    if (gu.complaint) a = 'angry';
    else if (gu.state === 'eating') a = 'eat';
    else if (gu.state === 'paying') a = 'wave';
    else if (['queue', 'seated', 'ready', 'waitfood'].includes(gu.state)) a = p < M.stand ? 'stand' : p < M.wave ? 'wave' : p < M.tap ? 'tap' : p > M.happy ? 'happy' : null;
    gu.ms.forEach((m, k) => {
      if (m.anim === 'dash') return;
      if (['photo', 'write', 'think', 'cheer', 'happy'].includes(m.anim) && m.animT < 2.2 && a !== 'stand' && a !== 'angry') return;
      const want = k === 0 || ['eat', 'stand', 'happy', 'angry'].includes(a) ? a : null;
      if (m.anim !== want) { m.anim = want; m.animT = 0; }
    });
    if (gu.state === 'eating' && Math.random() < 0.02) burst(V(gu.ms[0].g.position.x, gu.ms[0].g.position.z), '♪', '#9cffb0', 1, 0.6);
  }

  // ---------- the choice panel (questions and complaints) ----------
  let choiceOpts = null;
  function choice(title, body, opts) {
    N.paused = true;
    $('chTitle').textContent = title; $('chBody').textContent = body;
    choiceOpts = opts.map(o => (o.enabled === false ? null : () => { closeChoice(); if (o.cb) o.cb(); }));
    $('chOpts').innerHTML = opts.map((o, i) => `<button type="button" data-c="${i}"${o.enabled === false ? ' disabled' : ''}>${i + 1}.  ${o.label}</button>`).join('');
    $('choice').hidden = false;
  }
  function closeChoice() { choiceOpts = null; $('choice').hidden = true; if (N) N.paused = false; }
  $('chOpts').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b && choiceOpts && choiceOpts[b.dataset.c]) choiceOpts[b.dataset.c](); });
  function askPanel(gu) {
    const X = C.chat, q = gu.ask.q;
    const opts = [
      { label: q.good, cb: () => { gu.patience = Math.min(1, gu.patience + X.askGood); gu.tipBonus += X.askGoodTip; sayFloat(gu, 'They liked that! Bigger tip', '#9cffb0'); FR.sfx('good'); burst(gu.ms[0].g.position, '♥', '#9cffb0', 6); gu.ms[0].anim = 'happy'; } },
      { label: q.bad, cb: () => { gu.patience = Math.max(0.02, gu.patience - X.askBad); sayFloat(gu, 'That went down badly…', '#ff9c9c'); FR.sfx('bad'); } }
    ];
    if (Math.random() < 0.5) opts.reverse();
    opts.forEach(o => { const cb = o.cb; o.cb = () => { gu.ask = null; cb(); }; });
    choice(`The ${gu.sp.name} ${gu.look.name} asks`, `"${q.q}"`, opts);
  }
  function complaintPanel(gu) {
    const X = C.complaint, cp = gu.complaint, burnt = cp.kind === 'burnt', st = S();
    const settle = (msg, floor) => { if (burnt) cp.o.reviewFloor = floor; gu.complaint = null; N.res.fixed++; sayFloat(gu, msg, '#9cffb0'); FR.sfx('good'); gu.ms.forEach(m => { m.anim = null; }); };
    const opts = [
      { label: cp.sorry ? 'Apologise  (already tried)' : 'Apologise  (free, but might not work)', enabled: !cp.sorry, cb: () => { cp.sorry = true; if (Math.random() < (X.apology[gu.role.id] || 0.5)) settle('They accept the apology.', X.apologyReview); else { sayFloat(gu, '"Sorry is not enough!"', '#ff9c9c'); FR.sfx('bad'); } } },
      { label: st.sections && st.sections.bar ? 'Free drink from the Bar  (always works)' : `Free drink  (-$${X.drinkCost}, always works)`, enabled: !!(st.sections && st.sections.bar) || st.money >= X.drinkCost, cb: () => { if (!(st.sections && st.sections.bar)) FR.spend('ingredients', X.drinkCost); gu.patience = Math.min(1, gu.patience + X.drinkPatience); settle('A free drink smooths it over.', X.drinkReview); } }
    ];
    if (burnt) {
      const can = FR.canMakeCount(cp.o.recipe) > 0;
      opts.push({ label: can ? `Remake the ${cp.o.recipe.name}  (cook it again)` : 'Remake  (out of ingredients)', enabled: can, cb: () => {
        const o = cp.o, res = FR.reserve(o.recipe);
        o.need = needOf(res); o.served = false; o.q = null; o.ticketed = true; o.claimed = false;
        gu.complaint = null; gu.state = 'waitfood'; N.res.fixed++; gu.patience = Math.max(gu.patience, X.remakePatience);
        const tb = gu.table; tb.food.pop(); tb.dirty++; drawTableFood(tb);
        sayFloat(gu, 'One fresh dish, coming up!', '#9cffb0'); FR.sfx('good'); gu.ms.forEach(m => { m.anim = null; });
      } });
    }
    opts.push({ label: 'Not now' });
    choice('Complaint!', burnt ? `Their ${cp.o.recipe.name} is burnt. ${Math.ceil(cp.t)}s left to fix it.` : `You brought the wrong dish. ${Math.ceil(cp.t)}s left to fix it.`, opts);
  }

  // ================= the kitchen (v3 rules) =================
  const room = () => N.carry.length < C.carryMax;
  const itemName = it => it.kind === 'ing' ? (it.t === 'fish' ? D.fish[it.id].name : D.sides[it.id].name) : it.kind === 'prep' ? `chopped ${it.recipe.name}` : it.kind === 'dish' ? (it.live ? `fresh ${D.fish[it.fishId].name}` : it.recipe.name) : 'dirty plate';
  const heatName = r => (r.heat === 'none' ? 'cutting board' : D.heat[r.heat].name);
  function stock(t, id) {
    const held = N.orders.reduce((n, o) => n + (o.served ? 0 : o.need.filter(x => x.t === t && x.id === id).length), 0);
    return held + (t === 'fish' ? FR.portionsOf(id) : (S().sides[id] || 0));
  }
  function grab(t, id) {
    if (!room()) { toast('Your hands are full', '#ff9c9c'); FR.sfx('bad'); return; }
    let it = null;
    const take = o => { const n = o.need.find(x => x.t === t && x.id === id); if (n) { o.need = o.need.filter(x => x !== n); it = n; return true; } return false; };
    tickets().some(take);
    if (!it && t === 'side' && S().sides[id] > 0) { S().sides[id]--; it = { kind: 'ing', t: 'side', id }; }
    if (!it && t === 'fish') { const f = FR.takeFish(id); if (f) it = { kind: 'ing', t: 'fish', id, fish: f }; }
    if (!it) N.orders.filter(o => !o.served).some(take);
    if (!it) { FR.sfx('bad'); return; }
    N.carry.push(it); drawCarry(); FR.sfx(t === 'fish' ? 'splash' : 'blip'); drawStore();
  }
  function putBack(it) {
    const lacks = o => {
      if (o.served || o.claimed || o.live) return false;
      const r = o.recipe, have = o.need.filter(x => x.t === it.t && (r.anyFish && it.t === 'fish' ? true : x.id === it.id)).length;
      const want = it.t === 'side' ? (r.sides[it.id] || 0) : r.anyFish ? r.anyFish : (r.fish[it.id] || 0);
      return have < want;
    };
    const o = tickets().find(lacks) || N.orders.find(lacks);
    if (o) o.need.push(it); else refundItem(it);
    N.carry = N.carry.filter(x => x !== it); drawCarry(); FR.sfx('blip'); drawStore();
  }
  function openStore(t) { N.store = { t, at: t === 'fish' ? TANK : PANTRY }; FR.sfx(t === 'fish' ? 'splash' : 'blip'); drawStore(); $('store').hidden = false; }
  function closeStore() { if (N && N.store) { N.store = null; $('store').hidden = true; } }
  let storeKeys = {};
  function drawStore() {
    if (!N || !N.store) return;
    const t = N.store.t, ids = t === 'fish' ? Object.keys(D.fish).filter(id => stock('fish', id) > 0) : Object.keys(D.sides);
    storeKeys = {};
    $('stTitle').textContent = t === 'fish' ? 'Fish tank' : 'Pantry';
    $('store').className = 'panel ' + (t === 'fish' ? 'tank' : 'pantry');
    let h = ids.length ? '' : '<p>The tank is empty. Catch more fish tomorrow.</p>';
    ids.forEach((id, i) => {
      const n = stock(t, id), src = t === 'fish' ? FR.fishSrc(id) : sideSrc(id);
      if (i < 9 && n > 0) storeKeys['Digit' + (i + 1)] = () => grab(t, id);
      h += `<button type="button" class="sitem" data-g="${t}|${id}"${n > 0 ? '' : ' disabled'}><span class="key">${i + 1}</span><span class="cnt">×${n}</span><img alt="" src="${src}"><b>${t === 'fish' ? D.fish[id].name : D.sides[id].name}</b></button>`;
    });
    $('stGrid').innerHTML = h;
    $('stHands').innerHTML = 'In your hands: ' + (N.carry.length ? N.carry.map((it, j) => {
      const mine = it.kind === 'ing' && it.t === t, key = 'ZX'[j];
      if (mine) storeKeys['Key' + key] = () => putBack(it);
      return mine ? `<button type="button" data-b="${j}">${key}: put back ${itemName(it)}</button>` : `<span class="pill">${itemName(it)}</span>`;
    }).join(' ') : `nothing (you can carry ${C.carryMax})`);
    const seen = [], names = [];
    tickets().forEach(o => { const r = o.recipe; if (o.live || seen.includes(r.id)) return; seen.push(r.id);
      const parts = Object.keys(r.fish).map(f => D.fish[f].name + (r.fish[f] > 1 ? ' ×' + r.fish[f] : ''));
      if (r.anyFish) parts.push(`any ${r.anyFish} fish`);
      Object.keys(r.sides).forEach(sd => parts.push(D.sides[sd].name + (r.sides[sd] > 1 ? ' ×' + r.sides[sd] : '')));
      names.push(`<b>${r.name}</b> = ${parts.join(' + ')}`); });
    $('stOrders').innerHTML = names.length ? 'Open orders: ' + names.join(' · ') : 'No open orders right now.';
  }
  $('store').addEventListener('click', e => {
    const g = e.target.closest('[data-g]'), b = e.target.closest('[data-b]');
    if (g && !g.disabled) { const [t, id] = g.dataset.g.split('|'); grab(t, id); }
    if (b) { const it = N.carry[Number(b.dataset.b)]; if (it) putBack(it); }
    if (e.target.id === 'stClose') closeStore();
  });
  const sideCache = {};
  function sideSrc(id) {
    if (sideCache[id]) return sideCache[id];
    const c = document.createElement('canvas'); c.width = c.height = 80; const g = c.getContext('2d');
    const col = { tortilla: '#ffcf5c', rice: '#ffffff', kelp: '#2f9e5b', veggies: '#ff7a3c', bread: '#e0a85c' }[id] || '#cccccc';
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(40, 58, 30, 10, 0, 0, 7); g.fill();
    if (id === 'rice') { g.fillStyle = '#3d6fb5'; g.beginPath(); g.moveTo(12, 38); g.quadraticCurveTo(14, 70, 40, 70); g.quadraticCurveTo(66, 70, 68, 38); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(40, 38, 26, Math.PI, 0); g.fill(); }
    else if (id === 'kelp') { g.strokeStyle = col; g.lineWidth = 7; g.lineCap = 'round'; [[26, -0.3], [40, 0], [54, 0.3]].forEach(([x, r]) => { g.save(); g.translate(x, 62); g.rotate(r); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-12, -16, 12, -30, 0, -48); g.stroke(); g.restore(); }); }
    else if (id === 'veggies') { g.fillStyle = '#ff7a3c'; g.beginPath(); g.moveTo(18, 26); g.lineTo(52, 38); g.lineTo(22, 62); g.fill(); g.fillStyle = '#e8344e'; g.beginPath(); g.arc(54, 52, 14, 0, 7); g.fill(); g.fillStyle = '#2f9e5b'; g.fillRect(16, 18, 6, 12); }
    else if (id === 'bread') { g.fillStyle = col; g.beginPath(); g.roundRect ? g.roundRect(14, 22, 52, 40, 14) : g.rect(14, 22, 52, 40); g.fill(); g.fillStyle = '#f7dca8'; g.fillRect(22, 30, 36, 24); }
    else { g.fillStyle = col; g.beginPath(); g.ellipse(40, 44, 28, 22, 0, 0, 7); g.fill(); g.fillStyle = '#d9a030'; [[30, 38], [48, 48], [44, 34]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }); }
    return (sideCache[id] = c.toDataURL());
  }
  FR.sideSrc = sideSrc;
  function matchRecipe(items) {
    const fish = {}, sides = {}; let nFish = 0;
    items.forEach(it => { if (it.t === 'fish') { fish[it.id] = (fish[it.id] || 0) + 1; nFish++; } else sides[it.id] = (sides[it.id] || 0) + 1; });
    const same = (a, b) => Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(k => a[k] === b[k]);
    const hits = S().known.map(FR.recipe).filter(r => same(r.sides, sides) && (r.anyFish ? nFish === r.anyFish && !Object.keys(r.fish).length : same(r.fish, fish)));
    return hits.find(r => !r.anyFish) || hits[0]; // a named dish wins over Catch of the Day
  }
  function stage(slot) { const over = slot.t - C.cookSeconds; return over < 0 ? 'cooking' : over <= C.perfectWindow ? 'perfect' : over <= C.perfectWindow + C.goodWindow ? 'good' : 'burnt'; }
  const canCookAt = (st, r) => st.heat === 'any' || st.heat === r.heat;

  // ---------- night fishing off the bow (needs the Deck lanterns) ----------
  function startLive(tk) {
    const st = S(), id = FR.pickNightFish(), tkl = FR.tackle();
    if (!id) { const nf = Object.keys(D.areas[st.home || 'home'].night).map(k => `${D.fish[k].name} (${FR.baitKnown(k) ? D.baits[D.fish[k].bait].name : '???'})`); toast(`Nothing bites ${tkl ? 'your ' + tkl.name : 'a bare hook'} at night.\nNight fish: ${nf.join(', ')}. Switch bait in the morning with Q.`, '#ffe9a8'); FR.sfx('bad'); return; }
    const f = D.fish[id];
    if (tkl && tkl.kind === 'bait') { st.baits[tkl.id]--; if (st.baits[tkl.id] <= 0) st.bait = null; }
    A.splash && A.splash(boat.localToWorld(V(-5.2, -6.2)), 8);
    A.inputLocked = true; A.nightFight = true; A.chef.rotation.y = Math.PI / 2;
    N.fight = new A.Fight(id, { gear: 'light', baitMatch: FR.tackleFits(id, tkl), lure: tkl && tkl.kind === 'lure' ? tkl : null, onDone: res => {
      N.fight = null; A.inputLocked = false; A.nightFight = false; A.act = null;
      pressQ = false; rodWait = performance.now() + 700; // v4.2 fix: the last reel tap must not cast again; you press to fish again
      const others = N.guests.filter(g => g.state === 'waitfood');
      if (!res.caught) { FR.sfx('bad'); toast(res.msg + (tk ? ' The whole deck groans.' : ''), '#ff9c9c'); A.react('sad', 1); if (tk) others.forEach(g => { g.patience = Math.max(0.05, g.patience - 0.08); }); return; }
      const j = FR.logCatch(id, 'normal');
      if (!tk || tk.guest.state !== 'waitfood' || N.clean <= 0 || !room()) { if (st.tank.length < FR.tankCap()) { FR.addFish(id, res.cut, FR.rollSize()); toast(`Caught a ${f.name} for the tank!${j.first ? `\nNew in your journal! +$${j.reward}` : ''}`, '#9cffb0'); } else toast(`A ${f.name}, but the tank is full. You let it go.`, '#ffe9a8'); A.react('yay', 0.9); return; }
      const flashy = res.cut === 'perfect' || f.rarity === 'rare' || f.rarity === 'legendary';
      const pay = Math.round(f.value * C.priceMultiplier * C.liveCatchPay * tk.guest.role.pay * (tk.guest.sp.pay || 1));
      N.clean--; N.carry.push({ kind: 'dish', live: true, fishId: id, recipe: LIVE, q: 'good', livePay: { pay, tip: Math.round(flashy ? pay * 0.5 : pay * C.tipRate), flashy } }); drawCarry();
      if (flashy) { others.forEach(g => { g.patience = Math.min(1, g.patience + 0.15); g.ms.forEach(m => { m.anim = 'cheer'; m.animT = 0; }); }); bigText(A.chef.position, 'THE CROWD GOES WILD!', '#ffe14d'); FR.sfx('perfect'); }
      A.react('yay', 1);
      toast(`A ${f.name}, landed in front of everyone! Carry it to table ${tk.guest.table.i + 1}.${j.first ? `\nNew in your journal! +$${j.reward}` : ''}`, '#9cffb0');
    } });
  }

  // ================= what the E / SPACE button does where you stand =================
  const near = (a, r) => { const c = A.chef.position; return Math.hypot(a.x - c.x, a.z - c.z) < r; };
  function findAction() {
    if (!N || A.chef.parent !== boat || N.fight) return null;
    if (N.store) return { text: 'E / SPACE: close', press: closeStore };
    // a pirate running for it
    const runner = N.guests.find(g => g.state === 'dash' && near(g.ms[0].g.position, 1.6));
    if (runner) return { text: `Stop the pirate!  ($${runner.due.pay})`, press: () => endDash(runner, true) };
    const L = N.leading;
    // podium: greet the next guest
    if (near(PODIUM, 1.9) && !L) {
      const q = queueGuests().filter(x => x.state === 'queue');
      if (q.length) { const gu = q[0]; return { text: (gu.g.size || 1) > 1 ? `Greet the group of ${gu.g.size} (they need a BIG table)` : gu.role.courses && !gu.reg ? `Greet the ${gu.sp.name} ${gu.look.name} (VIP table only)` : `Greet the ${gu.reg ? gu.reg.name : gu.sp.name + ' ' + gu.look.name}`, press: () => greet(gu) }; }
    }
    // tables
    for (const tb of N.tables) {
      if (!near(tb.at, 2.4)) continue;
      const gu = tb.guest;
      if (tb.grab) return { text: 'HOLD E: fight off the tentacle!', prog: 1 - tb.grab.hp, act: 'fight', hold: dt => {
        tb.grab.hp -= dt / N.evd.fightSeconds; if (Math.random() < dt * 10) { FR.sfx('chop'); burst(V(tb.at.x, tb.at.z), '✦', '#c59bff', 2); }
        if (tb.grab.hp <= 0) { boat.remove(tb.grab.k); tb.grab = null; N.res.tentacles++; FR.earn('tips', N.evd.reward); bigText(tb.at, 'IT LETS GO!', '#9cffb0'); floatText(tb.at, `The guests cheer! +$${N.evd.reward}`, '#9cffb0'); FR.sfx('perfect'); A.react('yay', 1); N.guests.forEach(g => g.ms.forEach(m => { if (m.sit) { m.anim = 'cheer'; m.animT = 0; } })); }
      } };
      if (L && !gu) {
        if (tb.dirty) return room() ? { text: 'Clear the dirty plates first (they will wait)', press: () => clearTable(tb) } : { text: 'Dirty table, and your hands are full' };
        if ((L.g.size || 1) > 1 && !tb.big) return { text: `Too small for a group of ${L.g.size}. Find a BIG table` };
        if (L.role.courses && !L.reg && !tb.vip) return { text: 'Royals only sit at the VIP table' };
        return { text: L.demand && L.demand.table === tb ? 'Seat them here (the table they asked for)' : `Seat them at table ${tb.i + 1}`, press: () => seat(L, tb) };
      }
      if (gu && gu.state === 'seated' && gu.demand && !L) return { text: `Move them to table ${gu.demand.table.i + 1}`, press: () => moveTable(gu) };
      if (gu && gu.state === 'ready') return { text: 'Take their order', press: () => takeOrder(gu) };
      if (gu && gu.state === 'waitfood') {
        const dishes = N.carry.filter(x => x.kind === 'dish');
        const right = dishes.find(x => wants(gu, x));
        if (right) return { text: `Serve the ${itemName(right)}`, press: () => serve(gu, right) };
        if (gu.complaint) return { text: 'Handle the complaint', press: () => complaintPanel(gu) };
        if (dishes.length) return { text: `Offer the ${itemName(dishes[0])} (not their order!)`, press: () => serve(gu, dishes[0]) };
        if (gu.ask) return { text: 'Answer their question', press: () => askPanel(gu) };
      }
      if (gu && gu.complaint) return { text: 'Handle the complaint', press: () => complaintPanel(gu) };
      if (gu && gu.state === 'paying') return { text: gu.due.shells ? `Collect ${gu.due.shells} shells` : `Collect $${gu.due.pay + (gu.payT > C.payGrace ? 0 : gu.due.tip)}`, press: () => collect(gu) };
      if (!gu && tb.dirty && room() && !N.carry.some(x => x.kind !== 'plate')) return { text: `Clear ${tb.dirty} dirty plate${tb.dirty > 1 ? 's' : ''}`, press: () => clearTable(tb) };
    }
    // sink
    if (near(SINK, 1.5)) {
      const s = N.sink;
      if (N.carry.some(x => x.kind === 'plate')) return { text: 'Drop the dirty plates in the sink', press: () => { s.dirty += N.carry.filter(x => x.kind === 'plate').length; N.carry = N.carry.filter(x => x.kind !== 'plate'); drawCarry(); FR.sfx('splash'); } };
      if (s.dirty > 0) return { text: `HOLD to wash (${s.dirty} dirty)`, prog: s.prog, act: 'wash', hold: dt => {
        s.prog += dt / C.washSeconds; if (Math.random() < dt * 6) { FR.sfx('wash'); puff(SINK, 0xdff6ff); }
        if (s.prog >= 1) { s.prog = 0; s.dirty--; if (Math.random() < C.plateBreakChance * FR.hexMod('plateBreak')) { S().plates--; N.res.broken++; toast('A plate slipped and broke!', '#ff9c9c'); FR.sfx('bad'); } else { N.clean++; FR.sfx('blip'); } }
      } };
    }
    if (near(BIN, 1.2)) { const it = N.carry.slice().reverse().find(x => x.kind !== 'plate'); if (it) return { text: `Throw away the ${itemName(it)}`, press: () => { N.carry = N.carry.filter(x => x !== it); if (it.kind === 'ing') refundItem(it); if (it.kind === 'dish') N.clean++; drawCarry(); FR.sfx('bad'); } }; }
    // pass: pick up what the cooks left, or leave a dish for the Waiter
    const atPass = near(V(PASS.x, PASS.z + 0.7), 1.4) || near(V(PASS.x, PASS.z - 0.7), 1.4);
    if (atPass) {
      const waiter = N.staff.some(s => s.kind === 'waiter'), dish = N.carry.find(x => x.kind === 'dish' && !x.live);
      if (dish && waiter && N.pass.length < C.staffRules.passSlots) return { text: `Leave the ${dish.recipe.name} on the pass (the Waiter serves it)`, press: () => { N.carry = N.carry.filter(x => x !== dish); N.pass.push(dish); drawCarry(); FR.sfx('blip'); } };
      if (N.pass.length) return room() ? { text: `Pick up the ${N.pass[0].recipe.name} from the pass`, press: () => { N.carry.push(N.pass.shift()); drawCarry(); FR.sfx('blip'); } } : { text: 'Your hands are full' };
    }
    if (near(TANK, 1.45)) return { text: 'Open the fish tank', press: () => openStore('fish') };
    if (near(PANTRY, 1.45)) return { text: 'Open the pantry', press: () => openStore('side') };
    // the rod by the bow rail
    if (near(ROD, 1.4) && A.rodStand.visible) {
      const live = tickets().find(o => o.live && !o.claimed && o.guest && o.guest.state === 'waitfood');
      if (live && !room()) return { text: 'Your hands are full' };
      if (!live && S().tank.length >= FR.tankCap()) return { text: 'The fish tank is full' };
      if (performance.now() < rodWait) return { text: 'Line in. Catch your breath...' };
      return { text: live ? 'Fish for the Catch of the Moment!' : 'Cast a line (night fish for the tank)', press: () => startLive(live || null) };
    }
    // the sushi counter: no-cook dishes made here are always Perfect
    if (near(SUSHI, 1.4) && A.sushiSec.visible) {
      const p = N.carry.find(x => x.kind === 'prep' && x.recipe.heat === 'none');
      if (p) return N.clean > 0 ? { text: `HOLD to roll the ${p.recipe.name} (always Perfect here)`, prog: N.sushiP || 0, act: 'chop', hold: dt => { N.sushiP = (N.sushiP || 0) + dt / 1.0; if (N.sushiP >= 1) { N.sushiP = 0; N.carry = N.carry.filter(x => x !== p); N.clean--; N.carry.push({ kind: 'dish', recipe: p.recipe, q: 'perfect' }); drawCarry(); FR.sfx('perfect'); burst(SUSHI, '★', '#ffe14d', 6); } } } : { text: 'No clean plates! Wash some at the sink.' };
    }
    // cutting board
    if (near(BOARD, 1.5)) {
      const b = N.board, ings = N.carry.filter(x => x.kind === 'ing');
      if (ings.length && !b.prep && b.items.length + ings.length <= 4) return { text: 'Put it on the cutting board', press: () => { ings.forEach(it => b.items.push(it)); N.carry = N.carry.filter(x => x.kind !== 'ing'); b.prog = 0; drawCarry(); FR.sfx('blip'); } };
      if (b.prep) {
        const r = b.prep.recipe;
        if (!room()) return { text: 'Your hands are full' };
        if (r.heat === 'none') return N.clean > 0 ? { text: `Plate the ${r.name}${A.sushiSec.visible ? ' (or take it to the Sushi counter for Perfect)' : ''}`, press: () => { N.clean--; N.carry.push({ kind: 'dish', recipe: r, q: FR.qualityOf(C.noHeatScore, b.prep.fish) }); b.prep = null; drawCarry(); FR.sfx('blip'); } } : { text: 'No clean plates! Wash some at the sink.' };
        return { text: `Pick up the chopped ${r.name} (goes on the ${heatName(r)})`, press: () => { N.carry.push(b.prep); b.prep = null; drawCarry(); FR.sfx('blip'); } };
      }
      const m = matchRecipe(b.items);
      if (m) return { text: `HOLD to chop: ${m.name}`, prog: b.prog, act: 'chop', hold: dt => {
        b.prog += dt / C.chopSeconds; if (Math.random() < dt * 8) FR.sfx('chop');
        if (b.prog >= 1) { b.prep = { kind: 'prep', recipe: m, fish: b.items.filter(x => x.t === 'fish').map(x => x.fish) }; b.items = []; b.prog = 0; FR.sfx('good'); }
      } };
      if (b.items.length) return room() ? { text: `Not a recipe yet (${b.items.map(itemName).join(' + ')}). Tap to pick one back up`, press: () => { N.carry.push(b.items.pop()); drawCarry(); } } : { text: 'Not a recipe yet' };
    }
    for (const st of N.stations) {
      if (!near(st.at, 1.35)) continue;
      const done = st.slots.filter(x => x.t >= C.cookSeconds).sort((a, b) => b.t - a.t)[0];
      if (done) {
        if (!room()) return { text: 'Your hands are full' };
        if (N.clean <= 0) return { text: 'No clean plates! Wash some at the sink.' };
        const stg = stage(done);
        return { text: `Take the ${done.prep.recipe.name} (${C.quality[stg].label})`, press: () => { st.slots = st.slots.filter(x => x !== done); N.clean--; N.carry.push({ kind: 'dish', recipe: done.prep.recipe, q: FR.qualityOf(stg === 'perfect' ? 1 : stg === 'good' ? 0.6 : 0, done.prep.fish) }); drawCarry(); FR.sfx(stg === 'perfect' ? 'perfect' : stg === 'burnt' ? 'bad' : 'blip'); if (stg === 'perfect') burst(st.at, '★', '#ffe14d', 5); } };
      }
      const p = N.carry.find(x => x.kind === 'prep' && canCookAt(st, x.recipe));
      if (p && st.slots.length < st.cap) return { text: `HOLD to put the ${p.recipe.name} on the ${st.name}`, prog: st.load, act: 'stir', hold: dt => { st.load += dt / 0.8; if (st.load >= 1) { st.load = 0; N.carry = N.carry.filter(x => x !== p); st.slots.push({ prep: p, t: 0 }); drawCarry(); FR.sfx('sizzle'); } } };
      if (p) return { text: `The ${st.name} is full` };
      const wrong = N.carry.find(x => x.kind === 'prep');
      if (wrong) return { text: `The ${wrong.recipe.name} goes on the ${heatName(wrong.recipe)}` };
      if (st.slots.length) return { text: 'Still cooking…' };
    }
    // nothing else to do here: remind you who is following you
    if (L) return { text: `Leading the ${L.reg ? L.reg.name : L.sp.name + ' ' + L.look.name}${(L.g.size || 1) > 1 ? ' (group: BIG table)' : ''}: walk to a free table` };
    return null;
  }
  function clearTable(tb) { const n = Math.min(tb.dirty, C.carryMax - N.carry.length); tb.dirty -= n; for (let i = 0; i < n; i++) N.carry.push({ kind: 'plate' }); tb.food.splice(0, n); if (!tb.dirty) tb.food = []; drawTableFood(tb); drawCarry(); FR.sfx('blip'); }

  // ---------- input: tap vs hold ----------
  let pressQ = false, held = false, rodWait = 0;
  addEventListener('keydown', e => {
    if (A.mode !== 'night' || !N) return;
    if (choiceOpts) { const n = /^Digit([1-9])$/.exec(e.code); if (n && choiceOpts[Number(n[1]) - 1]) { e.preventDefault(); choiceOpts[Number(n[1]) - 1](); } return; }
    if (N.store && storeKeys[e.code]) { e.preventDefault(); storeKeys[e.code](); return; }
    if (e.code === 'Space' || e.code === 'KeyE') { e.preventDefault(); if (!e.repeat) pressQ = true; }
  });
  const actBtn = $('actBtn');
  actBtn.addEventListener('pointerdown', e => { held = true; pressQ = true; actBtn.setPointerCapture(e.pointerId); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => actBtn.addEventListener(ev, () => { held = false; }));
  const holding = () => held || !!(A.keys.Space || A.keys.KeyE);

  // ================= staff brains =================
  function bestTable(gu) {
    const ok = N.tables.filter(tb => tableFits(gu, tb) && !tb.claimHost);
    // keep big and VIP tables for the guests who need them
    return ok.sort((a, b) => ((a.big ? 1 : 0) + (a.vip ? 2 : 0)) - ((b.big ? 1 : 0) + (b.vip ? 2 : 0)))[0];
  }
  function staffUpdate(sf, dt, t) {
    sf.m.speed = 2.4 * crewSpeed(sf.kind, N.arrived / Math.max(1, N.total));
    stepMover(sf.m, dt, t);
    if (sf.m.path.length) return;
    sf.t -= dt;
    if (sf.t > 0) return;
    if (sf.kind === 'host') {
      sf.m.face = Math.PI / 2;
      const payer = N.guests.find(g => g.state === 'paying' && !g.hostClaim);
      if (payer && payer.payT > 1.2) { payer.hostClaim = true; goTo(sf.m, V(payer.table.at.x, payer.table.at.z + (payer.table.g.userData.dock ? -1.6 : 1.6)), () => { if (payer.state === 'paying') collect(payer, true); payer.hostClaim = false; goTo(sf.m, sf.home, () => { sf.t = 0.3; }); }); return; }
      const q = queueGuests().filter(x => x.state === 'queue');
      const gu = q[0], tb = gu && bestTable(gu);
      if (gu && tb && N.leading !== gu) { gu.patience = Math.min(1, gu.patience + 0.2); seat(gu, tb); sf.t = 2.4; sf.m.anim = 'wave'; sf.m.animT = 0; setTimeout(() => { sf.m.anim = null; }, 900); }
      else sf.t = 0.5;
    } else if (sf.kind === 'waiter') {
      // serve a dish from the pass, or take an order
      const pd = N.pass.find(d => !d.live && N.guests.some(g => g.state === 'waitfood' && wants(g, d)));
      if (pd) {
        const gu = N.guests.find(g => g.state === 'waitfood' && wants(g, pd));
        N.pass = N.pass.filter(x => x !== pd); sf.m.carry = true;
        goTo(sf.m, V(PASS.x, PASS.z - 0.7), () => goTo(sf.m, V(gu.table ? gu.table.at.x : 0, gu.table ? gu.table.at.z + 1.6 : 0), () => {
          sf.m.carry = false;
          if (gu.state === 'waitfood' && wants(gu, pd)) { N.carry.push(pd); serve(gu, pd); } else N.pass.push(pd);
          goTo(sf.m, sf.home, () => { sf.t = 0.3; });
        }));
        return;
      }
      const gu = N.guests.find(g => g.state === 'ready' && !g.waiterClaim && g.table);
      if (gu) { gu.waiterClaim = true; goTo(sf.m, V(gu.table.at.x, gu.table.at.z + (gu.table.g.userData.dock ? -1.6 : 1.6)), () => { gu.waiterClaim = false; if (gu.state === 'ready') takeOrder(gu); goTo(sf.m, sf.home, () => { sf.t = 0.3; }); }); return; }
      sf.t = 0.5;
    } else if (sf.kind === 'dish') {
      if (sf.carry) {
        const n = sf.carry; sf.carry = 0; sf.m.carry = false; sf.t = C.washSeconds * n * 0.8 / crewSpeed('dish');
        setTimeout(() => { if (!N) return; let ok = n; for (let i = 0; i < n; i++) if (Math.random() < C.plateBreakChance * FR.hexMod('plateBreak') * C.staffRules.dishBreak[Math.min(2, (S().train3d.dish || 1) - 1)]) { ok--; S().plates--; N.res.broken++; } N.clean += ok; }, sf.t * 1000);
        return;
      }
      const tb = N.tables.find(x => x.dirty > 0 && !x.claimed && !x.guest);
      if (tb) { tb.claimed = true; goTo(sf.m, V(tb.at.x, tb.at.z + (tb.g.userData.dock ? -1.6 : 1.3)), () => { const n = tb.dirty; tb.dirty = 0; tb.food = []; drawTableFood(tb); tb.claimed = false; sf.carry = n; sf.m.carry = true; goTo(sf.m, sf.home, () => { sf.t = 0; }); }); }
      else sf.t = 0.6;
    } else if (sf.kind === 'cook') {
      const st = N.stations.find(x => x.cookSpot === sf.i);
      if (sf.hold) {
        if (N.pass.length < C.staffRules.passSlots) { N.pass.push(sf.hold); sf.hold = null; sf.m.carry = false; FR.sfx('blip'); goTo(sf.m, sf.home); }
        else sf.t = 0.5;
        return;
      }
      if (!st) return;
      if (sf.chop) {
        const p = sf.chop; sf.chop = null; sf.m.carry = false;
        if (p.recipe.heat === 'none') { if (N.clean > 0) { N.clean--; sf.hold = { kind: 'dish', recipe: p.recipe, q: FR.qualityOf(C.noHeatScore, p.fish) }; sf.m.carry = true; goTo(sf.m, V(PASS.x, PASS.z + 0.8), () => { sf.t = 0; }); } else N.pass.push(p); }
        else st.slots.push({ prep: p, t: 0 });
        return;
      }
      const ready = st.slots.find(x => stage(x) === 'perfect') || st.slots.find(x => stage(x) === 'good' || stage(x) === 'burnt');
      if (ready && N.clean > 0) { const stg = stage(ready); st.slots = st.slots.filter(x => x !== ready); N.clean--; sf.hold = { kind: 'dish', recipe: ready.prep.recipe, q: FR.qualityOf(stg === 'perfect' ? 1 : stg === 'good' ? 0.6 : 0, ready.prep.fish) }; sf.m.carry = true; goTo(sf.m, V(PASS.x, PASS.z + 0.8), () => { sf.t = 0; }); return; }
      const o = st.slots.length < st.cap && tickets().find(x => !x.claimed && !x.live && fullSet(x));
      if (o) {
        o.claimed = true; const items = o.need; o.need = [];
        const stops = []; if (items.some(x => x.t === 'fish')) stops.push(TANK); if (items.some(x => x.t === 'side')) stops.push(PANTRY);
        const nextStop = () => { if (!N) return; const at = stops.shift(); if (at) goTo(sf.m, at, () => { sf.m.carry = true; FR.sfx('blip'); nextStop(); }); else goTo(sf.m, sf.home, () => { sf.chop = { kind: 'prep', recipe: o.recipe, fish: items.filter(x => x.t === 'fish').map(x => x.fish) }; sf.t = C.chopSeconds / crewSpeed('cook'); sf.m.anim = 'tap'; setTimeout(() => { sf.m.anim = null; }, sf.t * 1000); }); };
        nextStop();
        return;
      }
      sf.t = 0.4;
    }
  }
  function fullSet(o) { const r = o.recipe, want = Object.values(r.fish).reduce((a, b) => a + b, 0) + (r.anyFish || 0) + Object.values(r.sides).reduce((a, b) => a + b, 0); return o.need.length === want; }

  // ================= every frame =================
  A.nightUpdate = function (dt, t) {
    if (!N || N.done) return;
    stepFx(dt); stepSteam(dt); placeDockModels();
    if (N.fight) { N.fight.update(dt, A.fightInput()); A.act = 'fight'; drawLabels(t); return; }
    if (N.paused) { drawLabels(t); A.act = null; return; }
    N.t += dt; N.chatCD -= dt;
    if (N.evd) runEvent(dt);
    // arrivals: spaced out, and the dock queue never holds more than queueMax
    N.nextArrive -= dt;
    if (N.coming.length && N.nextArrive <= 0 && queueGuests().length < C.arrival.queueMax) {
      spawnGuest(N.coming.shift()); N.arrived++;
      const k = N.arrived / Math.max(1, N.arrived + N.coming.length);
      N.nextArrive = C.arrival.gap[0] + (C.arrival.gap[1] - C.arrival.gap[0]) * k;
    }
    // the guest you are leading follows you
    if (N.leading) { const L = N.leading, c = A.chef.position; L.ms.forEach((m, k) => { const back = c.z > WALL_Z ? V(-1.9 + k * 0.6, 1.9) : V(c.x + Math.sin(A.chef.rotation.y) * (1.0 + k * 0.6), c.z + Math.cos(A.chef.rotation.y) * (1.0 + k * 0.6)); const d = Math.hypot(back.x - m.g.position.x, back.z - m.g.position.z); m.path = d > 0.35 ? [back] : []; m.speed = Math.max(2.4, Math.min(6, d * 3)); }); }
    // guests
    N.guests.forEach(gu => {
      gu.ms.forEach(m => stepMover(m, dt, t));
      if (gu.state === 'gone' || gu.state === 'leaving' || gu.state === 'turnaway') return;
      if (gu.state === 'dash') {
        if (gu.dashT > 0) { gu.dashT -= dt; return; }
        gu.ms.forEach(m => { if (!m.path.length && !m.dashing) { m.dashing = true; m.speed = C.trouble.dashSpeed / 30; goTo(m, ARRIVE, () => { if (gu.state === 'dash') endDash(gu, false); }); } });
        return;
      }
      const rival = N.evd && N.evd.id === 'rival';
      const rate = gu.state === 'queue' || gu.state === 'arriving' ? C.queuePatienceRate * (rival ? N.evd.queueRate : 1) : ['eating', 'toTable', 'follow', 'paying'].includes(gu.state) ? 0 : gu.rate;
      gu.patience -= dt * rate / gu.ptime;
      if (gu.state === 'seated') { gu.orderT -= dt; if (gu.orderT <= 0 && !gu.demand) gu.state = 'ready'; }
      if (gu.state === 'eating') { gu.eatT -= dt; if (gu.eatT <= 0) { if (gu.course) { gu.course = false; gu.state = 'waitfood'; gu.patience = Math.max(gu.patience, C.royal.coursePatience); } else bill(gu); } }
      if (gu.state === 'paying') gu.payT += dt;
      social(gu, dt); mood(gu);
      if (gu.patience <= 0) walkOut(gu);
    });
    // cooking: steam and sizzle
    N.stations.forEach(st => st.slots.forEach(sl => { const before = stage(sl); sl.t += dt; const now = stage(sl); if (before === 'cooking' && now === 'perfect') { FR.sfx('bite'); burst(st.at, '!', '#5cff8a', 2); } if (Math.random() < dt * 2.5) puff(st.at, now === 'burnt' ? 0x333333 : 0xffffff); }));
    N.staff.forEach(sf => staffUpdate(sf, dt, t));
    if (N.store && !near(N.store.at, 2.2)) closeStore();
    // the action under your feet: tap or hold
    const a = findAction(), pr = $('prompt');
    A.act = a && a.hold && holding() ? a.act : null;
    if (a && a.hold && holding()) a.hold(dt);
    else if (a && a.press && pressQ) a.press();
    pressQ = false;
    const a2 = a && (a.hold || a.press) ? findAction() || a : a;
    pr.hidden = !a2;
    if (a2) { const html = `${a2.press && !N.store ? 'E / SPACE: ' : ''}${a2.text}${a2.hold ? `<div class="hbar"><b style="width:${Math.round((a2.prog || 0) * 100)}%"></b></div>` : ''}`; if (pr._h !== html) { pr.innerHTML = html; pr._h = html; } }
    if (N.store && Math.floor(N.t * 4) !== N.storeTick) { N.storeTick = Math.floor(N.t * 4); drawStore(); }
    drawLabels(t); drawRail(); drawHud();
    if (!N.coming.length && N.guests.every(g => g.state === 'gone')) finishNight();
  };

  // ================= on-screen labels =================
  const tmpV = new THREE.Vector3();
  function place(el, x, y, z) {
    tmpV.set(x, y, z); boat.localToWorld(tmpV); tmpV.project(A.camera);
    if (tmpV.z > 1) { el.style.display = 'none'; return; }
    el.style.display = ''; el.style.left = ((tmpV.x + 1) / 2 * innerWidth) + 'px'; el.style.top = ((1 - tmpV.y) / 2 * innerHeight) + 'px';
  }
  function setHtml(el, html) { if (el._h !== html) { el.innerHTML = html; el._h = html; } }
  const patColor = p => p > 0.6 ? '#5cff8a' : p > 0.3 ? '#ffd23c' : '#ff5b5b';
  const dishImg = o => `<img alt="" src="${o.live ? FR.fishSrc('glowgill') : FR.dishSrc(o.recipe.id)}">`;
  function drawLabels() {
    N.guests.forEach(gu => {
      const m0 = gu.ms[0].g, el = gu.label, sy = gu.sayEl;
      if (gu.state === 'gone') return;
      if (gu.state === 'leaving') { el.style.display = 'none'; sy.style.display = 'none'; return; }
      let bub = '', mark = '';
      if (gu.complaint) bub = `<div class="bub">! ${gu.complaint.kind === 'burnt' ? 'BURNT' : 'WRONG'} ${Math.ceil(gu.complaint.t)}s</div>`;
      else if (gu.ask) bub = '<div class="bub">? ? ?</div>';
      else if (gu.demand) bub = `<div class="bub">Table ${gu.demand.table.i + 1}!</div>`;
      else if (gu.state === 'ready') bub = `<div class="bub">! ${gu.orders.map(dishImg).join('')}</div>`;
      else if (gu.state === 'waitfood') { let open = gu.orders.filter(o => !o.served); if (gu.role.courses && !gu.reg) open = open.slice(0, 1); bub = `<div class="bub">${open.map(dishImg).join('')}${gu.role.courses && !gu.reg ? ` <small>course ${gu.orders.length - gu.orders.filter(o => !o.served).length + 1}/3</small>` : ''}</div>`; }
      else if (gu.state === 'eating') bub = '<div class="bub">Yum!</div>';
      else if (gu.state === 'paying') bub = `<div class="bub">${gu.due.shells ? '🐚 ' + gu.due.shells : '$' + gu.due.pay}${gu.payT > C.payGrace ? ' (late)' : ''}</div>`;
      else if (gu.state === 'dash') bub = '<div class="bub">!!</div>';
      if (gu.patience < C.mood.wave && ['queue', 'seated', 'ready', 'waitfood'].includes(gu.state)) mark = `<div class="mark">${gu.patience < C.mood.stand ? '!!' : '!'}</div>`;
      const who = gu.reg ? `${gu.reg.name} <span class="hearts">${'♥'.repeat(S().friends[gu.reg.id] || 0)}${'♡'.repeat(Math.max(0, C.friendshipGoal - (S().friends[gu.reg.id] || 0)))}</span>` : gu.celeb ? `★ ${N.evd.title} ★` : `${gu.sp.name} ${gu.look.name}${(gu.g.size || 1) > 1 ? ' ×' + gu.g.size : ''}`;
      const pat = gu.state === 'turnaway' ? '' : `<div class="pat"><b style="width:${Math.max(0, gu.patience) * 100}%;background:${patColor(gu.patience)}"></b></div>`;
      setHtml(el, `${mark}${bub}<div class="tag2">${who}</div>${pat}`);
      place(el, m0.position.x, m0.position.y + 2.4, m0.position.z);
      if (gu.sayT > 0 && gu.sayLine) { setHtml(sy, `<div class="say">${gu.sayLine}</div>`); place(sy, m0.position.x, m0.position.y + 3.6, m0.position.z); sy.style.zIndex = 2; } else sy.style.display = 'none';
    });
    N.staff.forEach(sf => { setHtml(sf.label, `<div class="tag2" style="opacity:0.75">${FR.staffDef3d(sf.kind).name}${(S().train3d[sf.kind] || 1) > 1 ? ' ★'.repeat(S().train3d[sf.kind] - 1) : ''}</div>`); place(sf.label, sf.m.g.position.x, sf.m.g.position.y + 2.3, sf.m.g.position.z); });
    N.tables.forEach(tb => { setHtml(tb.label, tb.dirty && !tb.guest ? `<div class="tag2">${tb.dirty} dirty plate${tb.dirty > 1 ? 's' : ''}</div>` : (N.leading && !tb.guest && !tb.dirty) ? `<div class="tag2">${tb.vip ? 'VIP ' : tb.big ? 'BIG ' : ''}table ${tb.i + 1}</div>` : ''); place(tb.label, tb.at.x, (tb.g.userData.dock ? dockY() : FLOOR) + 1.3, tb.at.z); });
    N.stations.forEach(st => {
      setHtml(st.label, st.slots.map(sl => { const stg = stage(sl), w = stg === 'cooking' ? sl.t / C.cookSeconds : 1, col = { cooking: '#ffd23c', perfect: '#5cff8a', good: '#9cd8ff', burnt: '#ff5b5b' }[stg]; return `<div class="bub"><img alt="" src="${FR.dishSrc(sl.prep.recipe.id)}"><div class="slot"><b style="width:${w * 100}%;background:${col}"></b></div></div>`; }).join(''));
      place(st.label, st.at.x, FLOOR + 1.9, st.at.z + 0.9);
    });
    const b = N.board;
    setHtml(b.label, b.prep ? `<div class="bub"><img alt="" src="${FR.dishSrc(b.prep.recipe.id)}"> chopped</div>` : b.items.length ? `<div class="tag2">On the board: ${b.items.map(itemName).join(' + ')}</div>` : '');
    place(b.label, BOARD.x, FLOOR + 1.8, BOARD.z + 0.9);
    setHtml(N.sink.label, N.sink.dirty ? `<div class="tag2">${N.sink.dirty} to wash</div>` : '');
    place(N.sink.label, SINK.x + 0.9, FLOOR + 1.6, SINK.z);
  }
  function drawRail() {
    const html = tickets().map(o => {
      const r = o.recipe, tnum = o.guest && o.guest.table ? o.guest.table.i + 1 : '?';
      if (o.live) return `<div class="tk"><img alt="" src="${FR.fishSrc('glowgill')}"><span>Catch of the moment · table ${tnum}<br><small>Fish for it at the rod by the bow</small></span></div>`;
      const inPipe = N.carry.concat(N.pass, N.board.prep ? [N.board.prep] : []).some(x => (x.kind === 'dish' || x.kind === 'prep') && x.recipe === r) || N.stations.some(s => s.slots.some(sl => sl.prep.recipe === r));
      let st;
      if (o.claimed) st = 'The line cook has it';
      else if (o.need.length) st = 'Get: ' + o.need.map(x => `${itemName(x)} (${x.t === 'fish' ? 'tank' : 'pantry'})`).join(', ');
      else st = inPipe ? 'In the kitchen' : 'Ingredients taken';
      return `<div class="tk${inPipe ? ' cook' : ''}"><img alt="" src="${FR.dishSrc(r.id)}"><span>${r.name}${o.course ? ` (course ${o.course})` : ''} · table ${tnum}<br><small>${st}${r.heat === 'none' ? '' : ' → ' + heatName(r)}</small></span></div>`;
    }).join('');
    setHtml($('rail'), html);
  }
  function drawHud() {
    const S0 = S(), left = N.coming.filter(p => !p.turnAway).length + N.guests.filter(g => !['gone', 'leaving', 'turnaway'].includes(g.state)).length;
    $('nhTitle').textContent = `Day ${S0.day} · Night service${N.evd ? ' · ' + N.evd.name : ''}`;
    $('nhInfo').textContent = `Served ${N.res.served} · Walked out ${N.res.walked} · Still to serve ${left}\n$${S0.money}  ·  ★ ${FR.rating().toFixed(1)}  ·  Clean plates ${N.clean}${N.combo > 1 ? `  ·  Combo ×${N.combo}` : ''}`;
    const goals = (S0.goals || []).filter(g => g.when === 'night');
    $('nhGoal').textContent = goals.length ? 'GOALS: ' + goals.map(FR.goalLine).join('   ') : '';
    const done = FR.goalQueue.shift(); if (done) { toast(`Goal done: ${done.text}!  Reward: ${FR.rewardText(done)}`, '#9cffb0'); FR.sfx('perfect'); }
  }
  function drawCarry() {
    const hands = A.hands;
    while (hands.children.length) hands.remove(hands.children[0]);
    N.carry.forEach((it, i) => {
      const x = i ? 0.3 : -0.3;
      const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.04, 16), new THREE.MeshStandardMaterial({ color: it.kind === 'plate' ? 0xd9cfb4 : 0xffffff }));
      pl.position.set(x, 0, 0); if (it.kind !== 'ing') hands.add(pl);
      if (it.kind === 'ing') { const c = it.t === 'fish' ? D.fish[it.id].color : ({ tortilla: 0xffcf5c, rice: 0xffffff, kelp: 0x2f9e5b, veggies: 0xff7a3c, bread: 0xe0a85c }[it.id] || 0xcccccc); const m = new THREE.Mesh(it.t === 'fish' ? new THREE.SphereGeometry(0.16, 10, 8) : new THREE.BoxGeometry(0.24, 0.16, 0.2), new THREE.MeshStandardMaterial({ color: c })); m.position.set(x, 0.05, 0); if (it.t === 'fish') m.scale.set(1.6, 0.8, 0.6); hands.add(m); }
      if (it.kind === 'prep') { const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd9e6ee, side: THREE.DoubleSide })); bowl.position.set(x, 0.16, 0); hands.add(bowl); const blob = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffcf70 })); blob.position.set(x, 0.12, 0); hands.add(blob); }
      if (it.kind === 'dish') { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dishTex(it.live ? 'live' : it.recipe.id) })); sp.scale.set(0.6, 0.6, 1); sp.position.set(x, 0.2, 0); hands.add(sp); }
    });
    const icon = it => it.kind === 'dish' || it.kind === 'prep' ? `<img alt="" src="${it.live ? FR.fishSrc(it.fishId) : FR.dishSrc(it.recipe.id)}">` : it.kind === 'ing' ? `<img alt="" src="${it.t === 'fish' ? FR.fishSrc(it.id) : sideSrc(it.id)}">` : '';
    $('carry').innerHTML = N.carry.length ? 'Carrying: ' + N.carry.map(it => `${icon(it)} ${itemName(it)}${it.kind === 'dish' ? ` <small>(${C.quality[it.q].label})</small>` : ''}`).join(' · ') : 'Hands free';
  }
  function floatText(at, text, color) {
    const el = label(); el.innerHTML = `<div class="tag2" style="color:${color};font-size:14px">${text}</div>`;
    const x = at.x, z = at.z, y0 = (at.y && at.y > 0.5 ? at.y : FLOOR) + 2.4;
    let k = 0; const tick = () => { k += 0.016; place(el, x, y0 + k * 1.5, z); el.style.opacity = String(1 - k / 1.6); if (k < 1.6) requestAnimationFrame(tick); else el.remove(); }; tick();
  }
  function bigText(at, text, color) {
    const el = label(); el.innerHTML = `<div class="big" style="color:${color}">${text}</div>`;
    const x = at.x, z = at.z;
    let k = 0; const tick = () => { k += 0.016; place(el, x, FLOOR + 3 + k * 0.6, z); el.style.transform = `translate(-50%,-100%) scale(${Math.min(1.2, 0.4 + k * 4)})`; el.style.opacity = String(Math.min(1, (1.8 - k) * 2)); if (k < 1.8) requestAnimationFrame(tick); else el.remove(); }; tick();
  }
  function toast(msg, color) { const el = $('toast'); el.textContent = msg; el.style.color = color || '#fff'; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 3800); }

  function finishNight() {
    N.done = true;
    const st = crewData(), R = N.res;
    closeStore(); closeChoice(); endEvent();
    // pay the crew; anyone you cannot pay loses heart (and works slower) until they are paid again
    CREW.forEach(k => { const d = FR.staffDef3d(k), n = Math.min(st.crew3d[k], st.built3d[k]); for (let i = 0; i < n; i++) { if (S().money >= d.wage) { FR.spend('wages', d.wage); st.mood3d[k] = Math.min(1, st.mood3d[k] + C.staffRules.paidMood); } else { st.mood3d[k] = Math.max(0, st.mood3d[k] - C.staffRules.unpaidMood); R.events.push(`You could not pay your ${d.name} ($${d.wage}). They will work slower until they are paid.`); } } });
    if (st.deckhand3d) { const d = FR.staffDef3d('deckhand'); if (S().money >= d.wage) FR.spend('wages', d.wage); else { st.mood3d.deckhand = Math.max(0, st.mood3d.deckhand - C.staffRules.unpaidMood); R.events.push(`You could not pay your Deckhand ($${d.wage}).`); } }
    // anyone still waiting to pay settles up at the door, without a tip
    N.guests.forEach(gu => { if (gu.state === 'paying') { FR.earn('sales', gu.due.pay); R.served++; R.reviews.push(Math.max(1, gu.due.review - 1)); } });
    N.orders.forEach(o => { if (!o.served || o.served === 'gone') o.need.forEach(refundItem); o.need = []; });
    N.board.items.forEach(refundItem); N.carry.filter(x => x.kind === 'ing').forEach(refundItem);
    if (N.evd) R.events.unshift(`Tonight's event: ${N.evd.name}.`);
    if (R.stolen) R.events.push(`The rival boat lured away ${R.stolen} of your guests.`);
    if (R.tentacles) R.events.push(`You fought off the sea monster ${R.tentacles} time${R.tentacles > 1 ? 's' : ''}.`);
    if (R.shells) R.events.push(`Crabfolk paid you ${R.shells} shells. Trade them for bait under Gear + bait.`);
    if (R.buzz) R.events.push(`Influencers posted about you: about ${Math.min(C.influencer.maxWave, R.buzz)} extra guests tomorrow.`);
    if (R.hex) { const h = D.hexes.find(x => x.id === R.hex); R.events.push(`The Sea Witch left a ${h.good ? 'blessing' : 'curse'} for tomorrow: ${h.name}. ${h.desc}`); }
    if (R.complaints) R.events.push(`Complaints: you fixed ${R.fixed} of ${R.complaints}.`);
    if (R.caught || R.dashed) R.events.push(`Pirates who ran: ${R.caught} caught, ${R.dashed} got away.`);
    R.requests.forEach(q => R.events.push(`A ${D.species[q.species].name} asked for ${FR.recipe(q.recipe).name}. Put it on tomorrow's menu and they come back, paying double.`));
    // clean up
    N.staff.forEach(sf => { boat.remove(sf.m.g); sf.label.remove(); });
    N.guests.forEach(gu => { gu.models.forEach(m => boat.remove(m)); gu.label.remove(); gu.sayEl.remove(); });
    N.tables.forEach(tb => { tb.label.remove(); tb.food = []; drawTableFood(tb); }); N.stations.forEach(s => s.label.remove()); N.board.label.remove(); N.sink.label.remove();
    N.carry = []; drawCarry(); A.act = null;
    ['nightHud', 'rail', 'actBtn', 'carry', 'prompt'].forEach(id => { $(id).hidden = true; });
    A.setOpenSign(false);
    const res = Object.assign({}, R);
    N = null;
    A.day.closing(res);
  }

  // test and debug helpers
  A.service = { startNight, debug: () => N, BUILD, makePerson, route, api: { findAction, grab, putBack, openStore, closeStore, greet, seat, takeOrder, serve, collect, bill, walkOut, askPanel, complaintPanel, grabTable, startLive, press() { const a = findAction(); if (a && a.press) a.press(); return a && a.text; }, hold(sec) { const a = findAction(); if (a && a.hold) a.hold(sec); return a && a.text; } } };
})();
