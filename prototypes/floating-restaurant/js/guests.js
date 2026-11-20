// PROTOTYPE - NOT FOR PRODUCTION
// Floating Restaurant guest kit (shared with prototypes/floating-restaurant-style-spike/guests.js): our own characters, built from simple rounded shapes in a chunky
// low-poly cartoon style. Species and role outfits follow design/floating-restaurant/Systems/Guests.md.
// No guest carries a weapon: the Sea King's trident and the Sea Witch's staff from the notes are left out
// (the witch carries a glowing lantern instead).
//
// window.makeGuestKit(kit) -> { make(spec), SKIN, HAIR }
//   kit = { mk, grp, T, INK }  (from index.html: toon material + outline helpers)
//   spec = { species, role, skin, hair, hairColor, shirt, pants, scale, name, ... }
// A made character is a THREE.Group with userData { play(mode), update(dt, t), setMood(0..1), walk, carry }.
window.makeGuestKit = function (kit) {
  const { mk, grp, INK } = kit;
  const V2 = (x, y) => new THREE.Vector2(x, y);
  const cache = {};
  const G = (k, f) => cache[k] || (cache[k] = f());
  const sph = (r, w, h) => G(`s${r},${w},${h}`, () => new THREE.SphereGeometry(r, w || 12, h || 9));
  const cyl = (a, b, h, s) => G(`c${a},${b},${h},${s}`, () => new THREE.CylinderGeometry(a, b, h, s || 10));
  const cone = (r, h, s) => G(`k${r},${h},${s}`, () => new THREE.ConeGeometry(r, h, s || 10));
  const box = (w, h, d) => G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
  const torus = (r, t, a, b, arc) => G(`t${r},${t},${a},${b},${arc}`, () => new THREE.TorusGeometry(r, t, a || 6, b || 14, arc || Math.PI * 2));
  // a limb hanging down from its pivot: rounded at both ends
  const limb = (r, len) => G(`l${r},${len}`, () => {
    const pts = [], n = 4;
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI / 2; pts.push(V2(Math.max(1e-4, Math.cos(a) * r), -len + Math.sin(a) * r)); }
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI / 2; pts.push(V2(Math.max(1e-4, Math.cos(a) * r), Math.sin(a) * r)); }
    return new THREE.LatheGeometry(pts, 9);
  });
  // a turned shape from [radius, y] pairs listed bottom to top (so the faces point outwards)
  const lathe = (key, prof, seg) => G('L' + key, () => new THREE.LatheGeometry(prof.map(([r, y]) => V2(Math.max(1e-4, r), y)), seg || 12));
  const stripes = (a, b) => G(`st${a}${b}`, () => {
    const c = document.createElement('canvas'); c.width = 16; c.height = 64; const g = c.getContext('2d');
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(0, i * 8, 16, 8); }
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; return t;
  });
  const toonMap = map => new THREE.MeshToonMaterial({ map, gradientMap: kit.ramp });

  const SKIN = [0xffd7b5, 0xf2b48a, 0xd9956a, 0xb5754a, 0x8a5636, 0x5e3a26];
  const HAIR = [0x2a1d14, 0x5a3420, 0xa8642a, 0xe8c070, 0xd23c2a, 0xc8c8d0];
  const GOLD = 0xffd23c, GOLDE = { emissive: 0x4a3000 };

  // ---------- faces: dot eyes with a shine, little brows, a mouth that can frown ----------
  function face(head, R, o) {
    o = o || {};
    const y = o.y !== undefined ? o.y : -0.02, s = o.s || 1, zAt = dy => Math.sqrt(Math.max(0, R * R - dy * dy)) - 0.03;
    const F = { eyes: [], brows: [] };
    [-1, 1].forEach(k => {
      const e = grp(k * 0.2 * s, y, zAt(y), head);
      if (o.big) { mk(sph(0.13 * s, 10, 8), 0xffffff, 0, 0, -0.02, e).scale.set(0.9, 1.1, 0.6); }
      mk(sph(0.075 * s, 8, 6), INK, 0, 0, o.big ? 0.05 : 0, e, { outline: false }).scale.set(1, 1.4, 0.6);
      mk(sph(0.026 * s, 5, 4), 0xffffff, 0.025 * s, 0.045 * s, o.big ? 0.09 : 0.04, e, { outline: false });
      if (o.lashes) mk(box(0.09 * s, 0.025, 0.02), INK, 0.07 * k * s, 0.1 * s, 0.02, e, { outline: false }).rotation.z = k * 0.5;
      F.eyes.push(e);
      if (!o.noBrows) { const b = mk(box(0.15 * s, 0.035 * s, 0.03), o.brow || 0x3a2416, k * 0.2 * s, y + 0.17 * s, zAt(y + 0.17 * s), head, { outline: false }); F.brows.push(b); }
    });
    const my = y - 0.21 * s;
    F.mouth = mk(torus(0.065 * s, 0.02 * s, 4, 8, Math.PI), 0x7a1d2a, 0, my, zAt(my) + 0.01, head, { outline: false });
    F.mouth.rotation.z = Math.PI;
    if (!o.noNose) mk(sph(0.055 * s, 8, 6), o.skin, 0, y - 0.09 * s, zAt(y - 0.09 * s) + 0.03, head, { outline: false });
    [-1, 1].forEach(k => mk(sph(0.07 * s, 8, 6), 0xff8aa0, k * 0.31 * s, y - 0.13 * s, zAt(y - 0.13 * s) - 0.04, head, { outline: false }).scale.set(1, 0.6, 0.35));
    return F;
  }

  // ---------- body plans ----------
  // Every plan fills c.p with: body (moves for hops), head, headTop (hat anchor), face, torso,
  // armL/armR (shoulder pivots), handL/handR, legL/legR (or none), R (head radius).
  function humanoid(c, o) {
    const p = c.p, body = p.body;
    const hipY = o.kid ? 0.42 : 0.55;
    const hips = grp(0, hipY, 0, body);
    if (o.legs !== false) {
      p.legL = grp(-0.16, 0, 0, hips); p.legR = grp(0.16, 0, 0, hips);
      [p.legL, p.legR].forEach(L => {
        mk(limb(0.13, hipY - 0.2), o.pants, 0, 0, 0, L);
        mk(sph(0.15, 10, 7), o.shoes || 0x3a2a55, 0, -hipY + 0.07, 0.06, L).scale.set(1, 0.6, 1.3);
      });
    }
    p.torso = grp(0, 0, 0, hips);
    const tm = o.shirtMap ? { mat: toonMap(o.shirtMap) } : {};
    mk(lathe('torso', [[0.3, -0.06], [0.38, 0.14], [0.4, 0.34], [0.36, 0.54], [0.26, 0.67], [0.1, 0.72]], 12), o.shirt, 0, 0, 0, p.torso, tm);
    const R = o.kid ? 0.52 : 0.58;
    p.head = grp(0, o.kid ? 1.12 : 1.2, 0, hips); p.R = R;
    mk(sph(R, 14, 11), o.skin, 0, 0, 0, p.head).scale.set(1, 0.95, 0.95);
    [-1, 1].forEach(k => mk(sph(0.1, 8, 6), o.skin, k * R * 0.97, -0.02, 0, p.head).scale.set(0.5, 0.9, 0.7));
    p.face = face(p.head, R * 0.95, { skin: o.skin, lashes: o.lashes, brow: o.brow });
    p.headTop = grp(0, R * 0.82, 0, p.head);
    const arm = side => {
      const a = grp(side * 0.37, 0.52, 0, hips);
      mk(limb(0.11, 0.32), o.sleeve || o.shirt, 0, 0, 0, a);
      const h = grp(0, -0.48, 0, a); mk(sph(0.13, 10, 7), o.skin, 0, 0, 0, h);
      return [a, h];
    };
    [p.armL, p.handL] = arm(-1); [p.armR, p.handR] = arm(1);
    p.hips = hips;
  }
  function hair(c, style, color) {
    const p = c.p, R = p.R;
    if (style === 'bald' || !style) return;
    const cap = mk(G('cap' + R, () => new THREE.SphereGeometry(R * 1.06, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5)), color, 0, 0.02, -0.03, p.head);
    cap.rotation.x = -0.35;
    if (style === 'bun') mk(sph(0.24, 10, 8), color, 0, R * 0.75, -R * 0.55, p.head);
    if (style === 'long') { const b = mk(lathe('hairback' + R, [[R * 0.9, -R * 1.25], [R * 1.0, -R * 0.6], [R * 1.05, 0], [R * 0.9, R * 0.4]], 12), color, 0, 0, -0.12, p.head); b.scale.set(1, 1, 0.75); }
    if (style === 'curly') for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; mk(sph(0.17, 8, 6), color, Math.cos(a) * R * 0.75, R * 0.55 + Math.sin(i * 1.7) * 0.06, Math.sin(a) * R * 0.75 - 0.08, p.head); }
    if (style === 'spiky') for (let i = 0; i < 5; i++) { const s = mk(cone(0.14, 0.32, 5), color, (i - 2) * 0.17, R * 0.85, -0.05 - Math.abs(i - 2) * 0.05, p.head); s.rotation.z = (2 - i) * 0.25; }
  }
  function beard(c, color, big) {
    // only the lower face, so the eyes and cheeks stay visible
    const b = mk(G('beard' + big, () => new THREE.SphereGeometry(big ? 0.44 : 0.4, 12, 9, 0, Math.PI * 2, Math.PI * 0.58, Math.PI * 0.42)), color, 0, -0.06, 0.2, c.p.head);
    b.scale.set(1.05, big ? 1.45 : 1.1, 0.8);
    const m = mk(sph(0.12, 8, 6), color, 0, -0.13, c.p.R * 0.9, c.p.head); m.scale.set(1.9, 0.6, 0.6);
  }
  function mustache(c, color) { [-1, 1].forEach(k => { const m = mk(sph(0.1, 8, 6), color, k * 0.09, -0.13, c.p.R * 0.9, c.p.head); m.scale.set(1.5, 0.6, 0.6); m.rotation.z = -k * 0.3; }); }

  function mermaidTail(c, color, fin) {
    const p = c.p;
    let g = grp(0, 0.02, 0, p.hips); const segs = [[0.33, 0.29, 0.3, 0.1], [0.29, 0.24, 0.28, 0.55], [0.24, 0.17, 0.26, 0.75], [0.17, 0.1, 0.22, 0.6]];
    p.tail = [];
    segs.forEach(([r0, r1, len, bend], i) => {
      const m = mk(cyl(r1, r0, len, 10), color, 0, -len / 2, 0, g);
      if (i % 2 === 0) mk(torus(r0 * 0.98, 0.025, 4, 12), fin, 0, -0.02, 0, g, { outline: false }).rotation.x = Math.PI / 2;
      const n = grp(0, -len, 0, g); n.rotation.x = -bend; p.tail.push(g); g = n;
    });
    [-1, 1].forEach(k => { const f = mk(cone(0.22, 0.45, 4), fin, k * 0.16, -0.12, 0, g); f.rotation.z = Math.PI + k * 0.7; f.scale.z = 0.3; });
  }
  function robe(c, color, trim) {
    mk(lathe('robe', [[0.62, -0.56], [0.55, -0.3], [0.44, 0.05], [0.36, 0.3]], 12), color, 0, 0, 0, c.p.hips);
    if (trim) mk(torus(0.6, 0.05, 4, 16), trim, 0, -0.52, 0, c.p.hips, { outline: false }).rotation.x = Math.PI / 2;
  }
  function cape(c, color, trim) {
    const g = grp(0, 0.62, -0.1, c.p.hips);
    const m = mk(G('cape', () => new THREE.CylinderGeometry(0.42, 0.7, 1.2, 12, 1, true, Math.PI * 0.6, Math.PI * 0.8)), color, 0, -0.6, 0, g, { m: { side: THREE.DoubleSide } });
    m.rotation.y = Math.PI;
    if (trim) mk(torus(0.42, 0.07, 4, 12, Math.PI * 0.8), trim, 0, 0, 0, g, { outline: false }).rotation.set(Math.PI / 2, 0, Math.PI * 1.1);
    c.p.cape = g;
  }

  function octoBody(c, o) {
    const p = c.p, body = p.body;
    p.hips = grp(0, 0.5, 0, body); p.torso = p.hips;
    const R = 0.78; p.R = R;
    p.head = grp(0, 0.78, 0, p.hips);
    mk(sph(R, 14, 11), o.skin, 0, 0, 0, p.head).scale.set(1, 1.12, 0.95);
    [[0.35, 0.45, 0.45], [-0.4, 0.3, 0.5], [0.15, 0.7, 0.35], [-0.2, 0.75, 0.3]].forEach(([x, y, z]) => mk(sph(0.07, 6, 4), o.spot || 0x7a3fc0, x, y, z, p.head, { outline: false }));
    p.face = face(p.head, R * 0.95, { skin: o.skin, y: -0.18, s: 1.25, big: true, brow: 0x4a2080, lashes: o.lashes, noNose: true });
    p.headTop = grp(0, R * 1.02, 0, p.head);
    p.tents = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      let g = grp(Math.cos(a) * 0.42, 0.05, Math.sin(a) * 0.42, p.hips); g.rotation.y = -a + Math.PI / 2;
      const chain = [];
      [[0.16, 0.25], [0.12, 0.22], [0.08, 0.2]].forEach(([r, len], k) => {
        mk(cyl(r * 0.75, r, len, 7), o.skin, 0, -len / 2, 0, g); chain.push(g);
        const n = grp(0, -len, 0, g); n.rotation.x = k === 0 ? 0.7 : 0.5; g = n;
      });
      chain[0].rotation.x = 0.6; p.tents.push(chain);
    }
    const arm = side => {
      const a = grp(side * 0.7, 0.55, 0.05, p.hips);
      let g = a; const chain = [];
      [[0.12, 0.24], [0.09, 0.22], [0.06, 0.18]].forEach(([r, len]) => { mk(cyl(r * 0.75, r, len, 7), o.skin, 0, -len / 2, 0, g); chain.push(g); const n = grp(0, -len, 0, g); n.rotation.z = -side * 0.35; g = n; });
      mk(sph(0.07, 6, 4), o.skin, 0, 0, 0, g); p['chain' + side] = chain;
      return [a, g];
    };
    [p.armL, p.handL] = arm(-1); [p.armR, p.handR] = arm(1);
  }

  function crabBody(c, o) {
    const p = c.p, body = p.body;
    p.hips = grp(0, 0.35, 0, body);
    p.torso = grp(0, 0.5, 0, p.hips);
    mk(sph(0.62, 14, 10), o.skin, 0, 0, 0, p.torso).scale.set(1.25, 0.85, 1);
    mk(sph(0.5, 12, 9), o.belly || 0xffd2a0, 0, -0.05, 0.22, p.torso, { outline: false }).scale.set(1.1, 0.75, 0.8);
    p.crabLegs = [];
    [-1, 1].forEach(k => { for (let i = 0; i < 3; i++) { const l = grp(k * 0.55, 0.25, (i - 1) * 0.28, p.hips); l.rotation.z = k * 0.9; mk(limb(0.06, 0.38), o.skin, 0, 0, 0, l); p.crabLegs.push(l); } });
    // the "head" is the eye-stalk cluster on top of the shell
    p.head = grp(0, 0.5, 0.2, p.torso); p.R = 0.45;
    p.face = { eyes: [], brows: [] };
    [-1, 1].forEach(k => {
      mk(cyl(0.05, 0.06, 0.4, 6), o.skin, k * 0.22, 0.2, 0, p.head);
      const e = grp(k * 0.22, 0.45, 0, p.head);
      mk(sph(0.15, 10, 8), 0xffffff, 0, 0, 0, e);
      mk(sph(0.075, 8, 6), INK, 0, 0, 0.11, e, { outline: false });
      mk(sph(0.026, 5, 4), 0xffffff, 0.03, 0.04, 0.17, e, { outline: false });
      p.face.eyes.push(e);
      const br = mk(box(0.14, 0.035, 0.03), INK, k * 0.22, 0.65, 0.05, p.head, { outline: false }); p.face.brows.push(br);
    });
    p.face.mouth = mk(torus(0.09, 0.025, 4, 8, Math.PI), 0x7a1d2a, 0, -0.08, 0.66, p.torso, { outline: false }); p.face.mouth.rotation.z = Math.PI;
    [-1, 1].forEach(k => mk(sph(0.08, 8, 6), 0xff8aa0, k * 0.36, 0.02, 0.6, p.torso, { outline: false }).scale.set(1, 0.6, 0.35));
    p.headTop = grp(0, 0.42, -0.15, p.torso);
    const arm = side => {
      const a = grp(side * 0.72, 0.55, 0.1, p.hips);
      mk(limb(0.09, 0.3), o.skin, 0, 0, 0, a);
      const h = grp(0, -0.48, 0.05, a);
      mk(sph(0.2, 10, 8), o.skin, 0, 0, 0, h).scale.set(0.9, 1.1, 0.9);
      const top = mk(cone(0.13, 0.36, 6), o.skin, 0.02 * side, 0.26, 0.08, h); top.rotation.x = 0.25;
      const bot = mk(cone(0.1, 0.28, 6), o.skin, -0.02 * side, 0.24, -0.1, h); bot.rotation.x = -0.35;
      return [a, h];
    };
    [p.armL, p.handL] = arm(-1); [p.armR, p.handR] = arm(1);
    p.armL.rotation.z = -0.35; p.armR.rotation.z = 0.35;
  }

  // ---------- role outfits (work on any species: they hang off headTop, face, torso and hands) ----------
  function sailorCap(c, band) { if (c.hatTaken) return; const g = grp(0, 0, 0, c.p.headTop); mk(cyl(0.36, 0.42, 0.22, 12), 0xffffff, 0, 0.06, 0, g); mk(torus(0.42, 0.06, 5, 14), 0xffffff, 0, -0.04, 0, g).rotation.x = Math.PI / 2; mk(torus(0.395, 0.03, 4, 14), band || 0x2f5fd6, 0, 0.02, 0, g, { outline: false }).rotation.x = Math.PI / 2; g.rotation.x = -0.15; return g; }
  function captainHat(c) { if (c.hatTaken) return; const g = grp(0, 0.02, 0, c.p.headTop); mk(cyl(0.5, 0.42, 0.24, 12), 0xffffff, 0, 0.1, -0.03, g); mk(cyl(0.43, 0.43, 0.08, 12), 0x1d2440, 0, -0.02, 0, g); const v = mk(cyl(0.3, 0.3, 0.04, 10, 1), 0x1d2440, 0, -0.06, 0.35, g); v.scale.z = 0.6; mk(sph(0.07, 6, 5), GOLD, 0, 0.06, 0.43, g, { outline: false, m: GOLDE }); return g; }
  function beret(c, color) { if (c.hatTaken) return; const g = grp(0.08, 0.02, -0.02, c.p.headTop); const b = mk(sph(0.45, 12, 8), color, 0, 0.05, 0, g); b.scale.set(1.1, 0.35, 1.05); mk(cyl(0.03, 0.04, 0.1, 6), color, 0, 0.21, 0, g, { outline: false }); g.rotation.z = -0.2; return g; }
  function tricorn(c) { if (c.hatTaken) return; const g = grp(0, 0.04, 0, c.p.headTop); const t = mk(cyl(0.62, 0.66, 0.24, 3), 0x2a2240, 0, 0.04, 0, g); t.rotation.y = Math.PI; mk(torus(0.6, 0.035, 4, 3), GOLD, 0, -0.08, 0, g, { outline: false }).rotation.set(Math.PI / 2, 0, Math.PI / 2); mk(sph(0.3, 10, 8), 0x2a2240, 0, 0.15, 0, g).scale.set(1, 0.7, 1); return g; }
  function sunHat(c) { if (c.hatTaken) return; const g = grp(0, 0.02, 0, c.p.headTop); mk(cyl(0.88, 0.88, 0.05, 16), 0xf2d38a, 0, -0.02, 0, g); mk(cyl(0.36, 0.42, 0.26, 12), 0xf2d38a, 0, 0.1, 0, g); mk(cyl(0.425, 0.425, 0.08, 12), 0xff6f91, 0, 0.0, 0, g, { outline: false }); g.rotation.x = -0.12; return g; }
  function fedora(c) { if (c.hatTaken) return; const g = grp(0, 0.04, 0, c.p.headTop); mk(cyl(0.68, 0.68, 0.05, 14), 0x6a4a2a, 0, -0.02, 0, g); mk(cyl(0.34, 0.4, 0.32, 10), 0x6a4a2a, 0, 0.14, 0, g); mk(cyl(0.405, 0.405, 0.08, 10), 0x2a1d14, 0, 0.02, 0, g, { outline: false }); return g; }
  function crown(c, s) {
    s = s || 1; const g = grp(0, 0.04, 0, c.p.headTop);
    mk(cyl(0.34 * s, 0.32 * s, 0.2 * s, 10), GOLD, 0, 0.08 * s, 0, g, { m: GOLDE });
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; mk(cone(0.08 * s, 0.24 * s, 4), GOLD, Math.cos(a) * 0.3 * s, 0.28 * s, Math.sin(a) * 0.3 * s, g, { m: GOLDE }); mk(sph(0.05 * s, 6, 4), [0xff4f8a, 0x3fd0ff, 0x7dff8a][i % 3], Math.cos(a) * 0.34 * s, 0.08 * s, Math.sin(a) * 0.34 * s, g, { outline: false }); }
    return g;
  }
  function witchHat(c) { const g = grp(0, 0.02, 0, c.p.headTop); mk(cyl(0.8, 0.8, 0.05, 14), 0x3a2266, 0, 0, 0, g); mk(cone(0.42, 0.7, 10), 0x3a2266, 0, 0.36, 0, g); const tip = mk(cone(0.17, 0.42, 8), 0x3a2266, 0.1, 0.82, -0.05, g); tip.rotation.z = -0.6; mk(cyl(0.43, 0.43, 0.08, 10), 0x7dff8a, 0, 0.06, 0, g, { outline: false, m: { emissive: 0x1a5a20 } }); return g; }
  function toque(c) { const g = grp(0, -0.04, 0, c.p.headTop); mk(cyl(0.4, 0.42, 0.38, 12), 0xffffff, 0, 0.18, 0, g); [[-0.2, 0], [0.2, 0], [0, 0.18], [0, -0.18], [0, 0]].forEach(([x, z]) => mk(sph(0.27, 10, 8), 0xffffff, x, 0.42, z, g)); return g; }
  function eyepatch(c) { const F = c.p.face, e = F.eyes[0]; mk(cyl(0.11, 0.11, 0.03, 10), INK, 0, 0, 0.05, e, { outline: false }).rotation.x = Math.PI / 2; const st = mk(torus(c.p.R * 0.97, 0.02, 3, 20), INK, 0, 0.05, 0, c.p.head, { outline: false }); st.rotation.set(Math.PI / 2 - 0.3, 0.35, 0); }
  function shades(c, color, heart) { c.p.face.eyes.forEach(e => { const l = mk(heart ? G('heart', heartGeo) : cyl(0.12, 0.12, 0.03, 10), color, 0, 0, 0.07, e, { outline: false }); if (!heart) l.rotation.x = Math.PI / 2; else l.scale.setScalar(0.17); }); const br = mk(box(0.16, 0.03, 0.03), color, 0, c.p.face.eyes[0].position.y + 0.03, c.p.face.eyes[0].position.z + 0.06, c.p.head, { outline: false }); }
  function heartGeo() { const s = new THREE.Shape(); s.moveTo(0, -0.6); s.bezierCurveTo(-0.9, 0, -0.6, 0.8, 0, 0.35); s.bezierCurveTo(0.6, 0.8, 0.9, 0, 0, -0.6); return new THREE.ExtrudeGeometry(s, { depth: 0.15, bevelEnabled: false }); }
  function sash(c, color) { const s = mk(torus(0.39, 0.07, 5, 14), color, 0, 0.12, 0, c.p.torso); s.rotation.set(Math.PI / 2 + 0.15, 0.1, 0); const k = mk(sph(0.1, 8, 6), color, 0.3, 0.05, 0.27, c.p.torso); }
  function bib(c) { const b = mk(cone(0.3, 0.42, 3), 0xffffff, 0, 0.45, 0.33, c.p.torso); b.rotation.set(Math.PI + 0.25, Math.PI / 3, 0); b.scale.z = 0.25; }
  function neckerchief(c, color) { mk(torus(0.24, 0.07, 5, 12), color, 0, 0.66, 0.02, c.p.torso).rotation.x = Math.PI / 2 - 0.2; const k = mk(cone(0.12, 0.2, 3), color, 0, 0.55, 0.26, c.p.torso); k.rotation.x = Math.PI; }
  function buttons(c, color) { [[-0.09, 0.45], [0.09, 0.45], [-0.09, 0.25], [0.09, 0.25]].forEach(([x, y]) => mk(sph(0.035, 6, 4), color, x, y, 0.38, c.p.torso, { outline: false })); }
  function phone(c) { const ph = mk(box(0.16, 0.26, 0.04), 0xff6fae, 0, 0.12, 0.08, c.p.handR); mk(box(0.13, 0.2, 0.01), 0x9cf0ff, 0, 0.13, 0.105, c.p.handR, { outline: false, m: { emissive: 0x2a6a80 } }); c.phone = ph; }
  function notepad(c) { mk(box(0.22, 0.28, 0.04), 0xfff6e0, 0, 0.1, 0.1, c.p.handL); mk(box(0.18, 0.02, 0.01), 0x9aa4b4, 0, 0.16, 0.125, c.p.handL, { outline: false }); }
  function pipe(c) { const g = grp(0.14, -0.2, c.p.R * 0.92, c.p.head); mk(cyl(0.025, 0.025, 0.22, 6), 0x5a3420, 0.08, 0, 0.04, g).rotation.z = Math.PI / 2 + 0.3; mk(cyl(0.07, 0.055, 0.12, 8), 0x7a4520, 0.2, 0.05, 0.04, g); c.smoke = grp(0.2, 0.15, 0.04, g); }
  function flowers(c) { [[-0.3, 0.35], [0.05, 0.5], [0.35, 0.3]].forEach(([x, y], i) => { const f = grp(x, y, c.p.R * 0.55, c.p.head); for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; mk(sph(0.06, 6, 4), [0xff6fae, 0xffd23c, 0xffffff][i], Math.cos(a) * 0.07, Math.sin(a) * 0.07, 0, f, { outline: false }); } mk(sph(0.045, 6, 4), 0xff9a3c, 0, 0, 0.03, f, { outline: false }); }); }
  function shellTop(c) { [-1, 1].forEach(k => { const s = mk(G('shell', () => new THREE.SphereGeometry(0.16, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2)), 0xff9ac0, k * 0.15, 0.42, 0.3, c.p.torso); s.rotation.x = Math.PI / 2 - 0.2; }); }
  function lantern(c) { const g = grp(0, -0.05, 0.12, c.p.handR); mk(cyl(0.02, 0.02, 0.25, 5), 0x5a3420, 0, 0.1, 0, g, { outline: false }); const orb = mk(sph(0.15, 10, 8), 0x7dff8a, 0, -0.12, 0, g, { m: { emissive: 0x3aff6a } }); c.orb = orb; }

  // ---------- assemble ----------
  const ROLE = {
    sailor: c => { sailorCap(c); },
    foodie: c => { beret(c, c.spec.beret || 0xd23c2a); if (c.p.torso && c.spec.species !== 'octofolk') bib(c); },
    pirate: c => { tricorn(c); if (c.p.face.eyes.length) eyepatch(c); sash(c, 0xd23c2a); },
    family: c => { sunHat(c); },
    influencer: c => { shades(c, 0xff6fae, true); phone(c); },
    critic: c => { fedora(c); shades(c, 0x1d1430); notepad(c); },
    royal: c => { if (!c.hatTaken) crown(c); cape(c, 0x8a3fd0, 0xffffff); },
    chef: c => { toque(c); neckerchief(c, 0xff4f4f); buttons(c, 0x1d1430); mustache(c, 0x5a3420); }
  };
  function make(spec) {
    const root = new THREE.Group(), c = { spec, root, p: { body: grp(0, 0, 0, root) } };
    const sp = spec.species || 'human', skin = spec.skin !== undefined ? spec.skin : SKIN[1];
    const shirtMap = spec.role === 'sailor' && sp !== 'crabfolk' && sp !== 'octofolk' ? stripes('#2f5fd6', '#ffffff') : null;
    if (sp === 'human' || sp === 'seaking' || sp === 'seawitch' || sp === 'mermaid') {
      const robed = sp === 'seawitch' || spec.role === 'royal';
      humanoid(c, { skin, shirt: spec.shirt || 0x3fd08a, sleeve: spec.sleeve, pants: spec.pants || 0x3a4a80, shoes: spec.shoes, legs: !(sp === 'mermaid' || robed), kid: spec.kid, lashes: spec.lashes, brow: spec.brow, shirtMap });
      if (sp === 'mermaid') { mermaidTail(c, spec.tail || 0x2ec4b6, spec.fin || 0x8af0e0); if (!spec.role || spec.role === 'foodie') shellTop(c); }
      if (robed) robe(c, sp === 'seawitch' ? 0x5a2a8a : 0x8a3fd0, sp === 'seawitch' ? 0x7dff8a : 0xffffff);
      hair(c, spec.hair, spec.hairColor !== undefined ? spec.hairColor : HAIR[0]);
      if (sp === 'seaking') { beard(c, 0xe8f0f0, true); crown(c, 1.15); cape(c, 0xd23c2a, 0xffd23c); c.hatTaken = true; }
      if (sp === 'seawitch') { witchHat(c); lantern(c); c.hatTaken = true; }
    } else if (sp === 'octofolk') octoBody(c, { skin: skin, spot: spec.spot, lashes: spec.lashes });
    else if (sp === 'crabfolk') crabBody(c, { skin: skin, belly: spec.belly });
    if (spec.beard) beard(c, spec.beard, spec.bigBeard);
    if (spec.mustache) mustache(c, spec.mustache);
    if (spec.role && ROLE[spec.role] && !(sp === 'seaking' && spec.role === 'royal')) ROLE[spec.role](c);
    if (spec.captain) captainHat(c);
    if (spec.pipe) pipe(c);
    if (spec.flowers) flowers(c);
    if (spec.apron && c.p.torso) { const ap = mk(box(0.5, 0.5, 0.06), spec.apron, 0, 0.18, 0.36, c.p.torso); ap.rotation.x = -0.12; }
    if (spec.scale) root.scale.setScalar(spec.scale);
    // ---------- animation: everything is moved by hand, no skeletons ----------
    const p = c.p, F = p.face;
    let mode = 'Idle', mt = 0, mood = 1;
    const ph = Math.random() * 6;
    const base = { armL: p.armL ? p.armL.rotation.clone() : null, armR: p.armR ? p.armR.rotation.clone() : null };
    const ud = root.userData;
    ud.walk = false; ud.carry = false;
    ud.play = m => { mode = m; mt = 0; };
    ud.setMood = v => { mood = v; };
    ud.update = (dt, t) => {
      mt += dt; if (mode !== 'Idle' && mode !== 'Mad' && mt > 1.3) mode = 'Idle';
      const mad = mode === 'Mad' || mood < 0.3, tt = t + ph;
      // body: breathe, hop when happy
      const hop = mode === 'Yes' ? Math.abs(Math.sin(mt * 9)) * 0.35 : 0;
      p.body.position.y = hop + (ud.walk ? Math.abs(Math.sin(tt * 9)) * 0.08 : 0);
      if (p.torso) p.torso.scale.set(1, 1 + Math.sin(tt * 2.2) * 0.025, 1);
      // head
      p.head.rotation.set(mode === 'Yes' ? Math.sin(mt * 14) * 0.25 : Math.sin(tt * 1.3) * 0.04, mode === 'No' ? Math.sin(mt * 16) * 0.45 : 0, ud.walk ? Math.sin(tt * 4.5) * 0.08 : Math.sin(tt * 0.9) * 0.06 + (mad ? Math.sin(tt * 10) * 0.05 : 0));
      // arms
      if (p.armL && base.armL) {
        p.armL.rotation.copy(base.armL); p.armR.rotation.copy(base.armR);
        const sw = Math.sin(tt * 2.2) * 0.05;
        p.armL.rotation.x = sw; p.armR.rotation.x = -sw;
        if (ud.walk) { p.armL.rotation.x = Math.sin(tt * 9) * 0.6; p.armR.rotation.x = -Math.sin(tt * 9) * 0.6; }
        if (ud.carry) { p.armL.rotation.x = p.armR.rotation.x = -1.3; p.armL.rotation.z = -0.25; p.armR.rotation.z = 0.25; }
        if (c.phone && !ud.carry) { p.armR.rotation.x = -1.6 + Math.sin(tt * 1.5) * 0.08; p.armR.rotation.z = 0.35; }
        if (mode === 'Wave' || mode === 'Yes') { p.armR.rotation.z = 2.5 + Math.sin(mt * 14) * 0.35; p.armR.rotation.x = 0; if (mode === 'Yes') { p.armL.rotation.z = -2.5 - Math.sin(mt * 14) * 0.35; p.armL.rotation.x = 0; } }
        if (mad && mode !== 'Yes' && !ud.carry) { p.armL.rotation.set(0, 0, -0.9); p.armR.rotation.set(0, 0, 0.9); }
      }
      if (p.legL && ud.walk) { p.legL.rotation.x = Math.sin(tt * 9) * 0.6; p.legR.rotation.x = -Math.sin(tt * 9) * 0.6; }
      else if (p.legL) { p.legL.rotation.x = 0; p.legR.rotation.x = mad ? -Math.max(0, Math.sin(tt * 10)) * 0.35 : 0; }
      if (p.tail) p.tail.forEach((g, i) => { g.rotation.z = Math.sin(tt * 2 + i * 0.7) * 0.08; });
      if (p.tents) p.tents.forEach((ch, i) => ch.forEach((g, k) => { g.rotation.z = Math.sin(tt * 2.5 + i + k) * 0.12; }));
      if (p.chain1) [p.chain1, p['chain-1']].forEach((ch, s) => ch.forEach((g, k) => { g.rotation.x = Math.sin(tt * 2 + k + s) * 0.15; }));
      if (p.cape) p.cape.rotation.x = 0.08 + Math.sin(tt * 1.7) * 0.05;
      // face
      const blink = (tt * 0.8) % 4 < 0.12;
      F.eyes.forEach(e => { e.scale.y = blink ? 0.12 : 1; });
      F.brows.forEach((b, i) => { b.rotation.z = mad ? (i ? 0.45 : -0.45) : (i ? -0.1 : 0.1); });
      F.mouth.rotation.z = mad || mode === 'No' ? 0 : Math.PI;
      if (c.orb) c.orb.scale.setScalar(1 + Math.sin(tt * 3) * 0.1);
    };
    // External mode: the game moves the body (see the real game's service3d.js); we only run the face.
    ud.rig = p; ud.orb = c.orb; ud.phone = c.phone;
    ud.face = (dt, t, faceMood) => {
      const tt = t + ph, mad = faceMood === 'mad';
      F.eyes.forEach(e => { e.scale.y = (tt * 0.8) % 4 < 0.12 ? 0.12 : 1; });
      F.brows.forEach((b, i) => { b.rotation.z = mad ? (i ? 0.45 : -0.45) : (i ? -0.1 : 0.1); });
      F.mouth.rotation.z = mad ? 0 : Math.PI;
      if (c.orb) c.orb.scale.setScalar(1 + Math.sin(tt * 3) * 0.1);
    };
    ud.name = spec.name || '';
    return root;
  }
  return { make, SKIN, HAIR };
};
