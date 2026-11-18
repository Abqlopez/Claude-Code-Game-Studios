// Morning fishing in 3D (v4 step 2). Uses the v3 rules from data.js and state.js:
// slow days, daily fish odds, the rare Old Whiskers, gear and bait, and the v3 fight.
(function () {
  const A = window.FR3D, D = FR.DATA, C = D.config;
  const { scene } = A;
  const boat = A.skiff; // the little fishing boat does the sailing
  const $ = id => document.getElementById(id);
  const rnd = FR.rand;

  // ---------- sound blips (from the 2D game) ----------
  FR.sfx = function (name) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ctx = FR._ac || (FR._ac = new AC()); if (ctx.state === 'suspended') ctx.resume();
      const def = { blip: [660, 0.08, 'sine', 0.07], bite: [880, 0.15, 'square', 0.06], good: [784, 0.3, 'triangle', 0.09], bad: [160, 0.3, 'sawtooth', 0.06], coin: [1046, 0.2, 'triangle', 0.08], zap: [90, 0.2, 'sawtooth', 0.09], splash: [220, 0.25, 'sine', 0.08], perfect: [1318, 0.35, 'triangle', 0.1], click: [440, 0.05, 'square', 0.03], order: [587, 0.12, 'triangle', 0.07], sizzle: [1800, 0.12, 'sawtooth', 0.02], wash: [520, 0.1, 'sine', 0.05], chop: [300, 0.05, 'square', 0.05],
        // v4.1
        ring: [1560, 0.07, 'square', 0.05], snore: [110, 0.5, 'sine', 0.06], pop: [900, 0.08, 'sine', 0.08], whoosh: [300, 0.3, 'triangle', 0.05], scribble: [2400, 0.04, 'sawtooth', 0.012], stamp: [140, 0.12, 'square', 0.1], squawk: [1300, 0.15, 'sawtooth', 0.04], cheer: [988, 0.4, 'triangle', 0.08] }[name];
      if (!def) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = def[2]; o.frequency.value = def[0];
      g.gain.setValueAtTime(def[3], ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + def[1]);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + def[1]);
    } catch (e) { /* audio is optional */ }
  };
  FR.ui = { toast() {} }; FR.juice = { pop() {} };

  // ---------- the save ----------
  FR.state = FR.load() || FR.newState();
  let S = FR.state;
  if (!S.gear[S.useGear]) S.useGear = 'light';

  // ---------- small helpers ----------
  let toastTimer = null;
  function toast(msg, color) {
    const el = $('toast'); el.textContent = msg; el.style.color = color || '#ffffff'; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 3400);
  }
  const hex = n => '#' + n.toString(16).padStart(6, '0');
  function textSprite(text, color, w) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
    g.font = '64px "Lilita One", "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 14; g.strokeStyle = '#2b2140'; g.strokeText(text, 256, 68); g.fillStyle = color; g.fillText(text, 256, 68);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true }));
    sp.scale.set(w || 8, (w || 8) / 4, 1); sp.renderOrder = 10; return sp;
  }
  const whiteGlow = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const glowSprite = (color, size, op) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: whiteGlow, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: op === undefined ? 0.9 : op })); sp.scale.set(size, size, 1); return sp; };
  const flakeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 4; g.lineCap = 'round'; g.translate(32, 32); for (let i = 0; i < 3; i++) { g.rotate(Math.PI / 3); g.beginPath(); g.moveTo(-26, 0); g.lineTo(26, 0); [-16, 16].forEach(x => { g.moveTo(x, 0); g.lineTo(x + Math.sign(x) * 7, -7); g.moveTo(x, 0); g.lineTo(x + Math.sign(x) * 7, 7); }); g.stroke(); } return new THREE.CanvasTexture(c); })();
  const starTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#fff6c2'; g.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 7 : 30, a = i * Math.PI / 4; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } g.fill(); return new THREE.CanvasTexture(c); })();
  const texSprite = (tex, size, color) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: color || 0xffffff, transparent: true, depthWrite: false })); sp.scale.set(size, size, 1); return sp; };
  const basic = (color, op) => new THREE.MeshBasicMaterial({ color, transparent: op !== undefined, opacity: op === undefined ? 1 : op, depthWrite: op === undefined, side: THREE.DoubleSide });
  function disc(g, color, r, op, y) { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 28), basic(color, op)); m.rotation.x = -Math.PI / 2; m.position.y = y || 0.08; g.add(m); return m; }
  function rings(g, color, n, maxR) {
    const arr = [];
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 40), basic(color, 0.8)); m.rotation.x = -Math.PI / 2; m.position.y = 0.15; g.add(m); arr.push(m); }
    return t => arr.forEach((m, i) => { const p = (t * 0.45 + i / n) % 1; m.scale.setScalar(0.6 + p * maxR); m.material.opacity = (1 - p) * 0.8; });
  }

  // ---------- a sign on the water for every fish ----------
  const SIGNS = {
    ripples: g => {
      const r = rings(g, 0xffffff, 3, 5), fish = [];
      for (let i = 0; i < 4; i++) { const m = disc(g, 0x0d2a4a, 0.6, 0.55, 0.05); m.scale.set(1.6, 0.6, 1); fish.push(m); }
      return t => { r(t); fish.forEach((m, i) => { const a = t * 0.8 + i * 1.57; m.position.x = Math.cos(a) * 2; m.position.z = Math.sin(a) * 1.5; m.rotation.z = -a; }); };
    },
    reef: g => rings(g, 0xff8fb0, 3, 5),
    flash: g => {
      const bits = [], r = rings(g, 0xcfe8ff, 1, 4);
      for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 0.28), basic(0xe8f4ff)); m.position.set(rnd(-3, 3), 0.25, rnd(-3, 3)); m.rotation.y = rnd(0, 3); g.add(m); bits.push(m); }
      return t => { r(t); bits.forEach((m, i) => { m.visible = Math.sin(t * 9 + i * 2.3) > 0.2; }); };
    },
    sand: g => {
      const p = [];
      for (let i = 0; i < 7; i++) { const m = disc(g, 0xc9a46a, 1.5, 0.4, 0.1 + i * 0.01); m.position.x = rnd(-2.5, 2.5); m.position.z = rnd(-2.5, 2.5); p.push(m); }
      return t => p.forEach((m, i) => { const k = 0.5 + 0.5 * Math.sin(t * 1.2 + i); m.scale.setScalar(0.8 + k * 0.8); m.material.opacity = 0.2 + 0.35 * (1 - k); });
    },
    glow: (g, f) => {
      const s = glowSprite(f.color, 9); s.position.y = 0.8; g.add(s); const d = disc(g, f.color, 2.6, 0.35);
      return t => { const k = 0.85 + Math.sin(t * 3) * 0.15; s.scale.set(9 * k, 9 * k, 1); d.material.opacity = 0.25 + 0.15 * Math.sin(t * 3); };
    },
    moon: g => {
      const s = glowSprite(0x9a7bff, 9); s.position.y = 0.8; g.add(s); disc(g, 0x6a4bdf, 2.4, 0.3);
      const cres = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.3, 8, 24, Math.PI * 1.25), basic(0xfff6c2)); g.add(cres);
      const orb = [0, 1, 2].map(() => { const o = glowSprite(0xe6e0ff, 1.4); g.add(o); return o; });
      return t => { cres.rotation.z = 0.9 + Math.sin(t) * 0.3; cres.position.y = 2.4 + Math.sin(t * 1.5) * 0.3; orb.forEach((o, i) => { const a = t * 1.2 + i * 2.1; o.position.set(Math.cos(a) * 3, 1.2 + Math.sin(t * 2 + i) * 0.4, Math.sin(a) * 3); }); };
    },
    frost: g => {
      const s = glowSprite(0xbff0ff, 8); s.position.y = 0.6; g.add(s); disc(g, 0xdff6ff, 2.4, 0.35);
      const fl = []; for (let i = 0; i < 6; i++) { const f = texSprite(flakeTex, 1.3); f.position.set(rnd(-2.5, 2.5), rnd(0.8, 2.4), rnd(-2.5, 2.5)); g.add(f); fl.push(f); }
      return t => fl.forEach((f, i) => { f.material.rotation = t * (i % 2 ? 1 : -1); f.position.y = 1.2 + Math.sin(t * 1.4 + i) * 0.6; });
    },
    embers: g => {
      const s = glowSprite(0xff6a3c, 8); s.position.y = 0.6; g.add(s);
      const e = []; for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 4), basic(FR.pick([0xffd23c, 0xff8a2b, 0xff5b3c]))); g.add(m); e.push({ m, x: rnd(-2, 2), z: rnd(-2, 2), o: rnd(0, 1) }); }
      return t => e.forEach(p => { const k = (t * 0.5 + p.o) % 1; p.m.position.set(p.x + Math.sin(t * 3 + p.o * 9) * 0.3, k * 4.5, p.z); p.m.scale.setScalar(1 - k * 0.7); });
    },
    bubbles: g => {
      const b = []; for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(rnd(0.2, 0.4), 10, 8), basic(0xffffff, 0.45)); g.add(m); b.push({ m, x: rnd(-2.2, 2.2), z: rnd(-2.2, 2.2), o: rnd(0, 1) }); }
      const shape = new THREE.Shape(); [[0, 3], [0.9, 1.6], [0.2, 1.6], [0.8, 0], [-0.3, 1.8], [0.4, 1.8], [-0.3, 3]].forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
      const bolt = new THREE.Mesh(new THREE.ShapeGeometry(shape), basic(0xfff27a)); bolt.position.y = 1; g.add(bolt);
      return t => { b.forEach(p => { const k = (t * 0.6 + p.o) % 1; p.m.position.set(p.x, k * 2.5, p.z); p.m.material.opacity = 0.5 * (1 - k); }); bolt.visible = (t % 1.4) < 0.3; };
    },
    ink: g => {
      const d = disc(g, 0x140c24, 4, 0.7); const r = rings(g, 0x1a1026, 1, 4);
      return t => { r(t); d.scale.setScalar(0.9 + Math.sin(t * 1.3) * 0.1); };
    },
    lure: g => {
      disc(g, 0x0b0820, 4, 0.75); const l = glowSprite(0x8cffe6, 2.2); g.add(l); const b = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), basic(0xd0fff6)); g.add(b);
      return t => { const x = Math.sin(t * 1.1) * 1.4, y = 0.8 + Math.sin(t * 2.3) * 0.3; l.position.set(x, y, 0); b.position.set(x, y, 0); };
    },
    birds: g => {
      const r = rings(g, 0xffffff, 1, 4), gulls = [];
      for (let i = 0; i < 3; i++) {
        const gg = new THREE.Group(); g.add(gg);
        const wings = [-1, 1].map(s => { const w = new THREE.Group(); gg.add(w); const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.4), basic(0xffffff)); p.rotation.x = -Math.PI / 2; p.position.x = s * 0.6; w.add(p); return w; });
        gulls.push({ gg, wings });
      }
      return t => { r(t); gulls.forEach((gl, i) => { const a = t * 0.9 + i * 2.1; gl.gg.position.set(Math.cos(a) * 3, 5 + i * 0.4, Math.sin(a) * 3); gl.gg.rotation.y = -a; const f = Math.sin(t * 8 + i) * 0.6; gl.wings[0].rotation.z = f; gl.wings[1].rotation.z = -f; }); };
    },
    fin: g => {
      const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(1.6, 0); shape.quadraticCurveTo(0.6, 0.6, 0.3, 1.8); shape.lineTo(0, 0);
      const fin = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: 0x2b4a7a, roughness: 0.4 })); g.add(fin);
      const r = rings(g, 0xffffff, 2, 3);
      return t => { r(t); const a = t * 0.8; fin.position.set(Math.cos(a) * 2.5, -0.1, Math.sin(a) * 2.5); fin.rotation.y = -a - Math.PI / 2; };
    },
    puff: g => {
      const b = []; for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), basic(0xc59bff, 0.5)); g.add(m); b.push(m); }
      return t => b.forEach((m, i) => { const k = (t * 0.5) % 1, a = i / 8 * Math.PI * 2; m.position.set(Math.cos(a) * (1 + k * 3), 0.4, Math.sin(a) * (1 + k * 3)); m.scale.setScalar(1 + k); m.material.opacity = 0.6 * (1 - k); });
    },
    gold: g => {
      const s = glowSprite(0xffd23c, 9); s.position.y = 0.8; g.add(s); disc(g, 0xffc020, 2.6, 0.35);
      const st = []; for (let i = 0; i < 6; i++) { const sp = texSprite(starTex, 1.4); sp.position.set(rnd(-2.6, 2.6), rnd(0.6, 2.6), rnd(-2.6, 2.6)); g.add(sp); st.push(sp); }
      return t => st.forEach((sp, i) => { const k = Math.max(0, Math.sin(t * 3 + i * 1.7)); sp.scale.setScalar(0.3 + k * 1.4); sp.material.rotation = t; });
    },
    shadow: g => {
      const sh = new THREE.Group(); g.add(sh);
      const body = disc(sh, 0x061428, 1, 0.6, 0.06); body.scale.set(6, 2.2, 1);
      const tail = new THREE.Mesh(new THREE.CircleGeometry(1.4, 3), basic(0x061428, 0.6)); tail.rotation.x = -Math.PI / 2; tail.position.set(-6.5, 0.06, 0); sh.add(tail);
      const r = rings(g, 0xffe9a8, 2, 8);
      return t => { r(t); sh.rotation.y = Math.sin(t * 0.3) * 0.6; sh.position.x = Math.sin(t * 0.4) * 2; };
    }
  };

  // ---------- morning state ----------
  let fday, timeLeft, spots = [], timers = [], traps = [], cast = null, fight = null, finished = true, caught = [];
  let boatSpeed = 0, steerTarget = null, spaceQ = false, dirQ = null, reelHeld = false;
  const later = (sec, fn) => timers.push({ t: sec, fn });

  // bobber, line and the "!" over a bite
  const bobber = new THREE.Group(); scene.add(bobber); bobber.visible = false;
  [[0xe8344e, 0], [0xffffff, Math.PI]].forEach(([c, r]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: c })); m.rotation.x = r; bobber.add(m); });
  const lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(16 * 3), 3));
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xfff6d6 })); line.frustumCulled = false; scene.add(line); line.visible = false;
  const bang = textSprite('!', '#ffe14d', 6); bang.visible = false; scene.add(bang);
  // wake behind the boat
  const wake = []; for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 16), basic(0xffffff, 0)); m.rotation.x = -Math.PI / 2; scene.add(m); wake.push({ m, life: 0 }); }
  let wakeT = 0;
  // v4.1: splash droplets (casts, bites, fish leaping out)
  const drops = []; for (let i = 0; i < 48; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 4), basic(0xffffff, 0.9)); m.visible = false; scene.add(m); drops.push({ m, v: new THREE.Vector3(), life: 0 }); }
  function splash(at, n, color) {
    for (let i = 0; i < n; i++) { const d = drops.find(x => x.life <= 0); if (!d) return; d.life = 1; d.m.visible = true; d.m.material.color.setHex(color || 0xffffff); d.m.position.set(at.x, Math.max(0.2, at.y), at.z); const a = rnd(0, Math.PI * 2), sp = rnd(1.5, 4); d.v.set(Math.cos(a) * sp, rnd(4, 8), Math.sin(a) * sp); }
  }
  function stepDrops(dt) { drops.forEach(d => { if (d.life <= 0) return; d.life -= dt * 1.4; d.v.y -= 18 * dt; d.m.position.addScaledVector(d.v, dt); d.m.scale.setScalar(Math.max(0.1, d.life)); if (d.life <= 0 || d.m.position.y < -0.5) { d.life = 0; d.m.visible = false; } }); }
  A.splash = splash;

  const tipPos = () => A.rodTip.getWorldPosition(new THREE.Vector3());
  const bowPos = () => new THREE.Vector3(boat.position.x - Math.sin(boat.rotation.y) * 3.4, 0, boat.position.z - Math.cos(boat.rotation.y) * 3.4);

  // ---------- spots ----------
  function spawnSpot(forceId) {
    if (finished) return;
    const odds = FR.todayOdds(), tk = FR.tackle();
    for (const k in odds) if (FR.tackleFits(k, tk)) odds[k] *= C.baitRules.attract; // v4.1: what you carry draws its fish in
    const id = forceId || FR.weighted(odds), f = D.fish[id];
    let x, z, tries = 0;
    do { const a = rnd(0, Math.PI * 2), d = rnd(20, 60); x = boat.position.x + Math.cos(a) * d; z = boat.position.z + Math.sin(a) * d; tries++; }
    while (tries < 40 && (Math.abs(x) > 110 || Math.abs(z) > 110 || Math.hypot(x, z - 1) < 24 || spots.some(s => Math.hypot(s.g.position.x - x, s.g.position.z - z) < 16)));
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    const tick = (SIGNS[f.sign] || SIGNS.ripples)(g, f);
    const known = !!S.journal[id];
    const label = textSprite(known || f.boss ? f.name : '???', f.boss ? '#ffe14d' : '#ffffff', f.boss ? 13 : 8); label.position.y = f.boss ? 7 : 5; g.add(label);
    // v4.1: a green ring under signs that will bite what is on your hook (only for fish you know)
    const smell = new THREE.Mesh(new THREE.RingGeometry(4.6, 5.2, 40), basic(0x5cff8a, 0.7)); smell.rotation.x = -Math.PI / 2; smell.position.y = 0.12; smell.visible = false; g.add(smell);
    g.scale.setScalar(0.01);
    spots.push({ id, g, tick, smell, grow: 0, life: f.boss ? 1e9 : rnd(C.spotLife[0], C.spotLife[1]) * FR.hexMod('spotLife') * fday.life * 1.4, dying: false });
  }
  function removeSpot(sp, respawn) {
    if (sp.dying) return;
    sp.dying = true;
    if (respawn && !D.fish[sp.id].boss) later(fday.respawn * rnd(0.7, 1.3) + 0.5, () => spawnSpot());
  }

  // ---------- gear bar ----------
  function drawBar() {
    const bar = $('gearBar'); bar.innerHTML = '';
    const owned = Object.keys(D.gear).filter(g => S.gear[g]);
    owned.forEach((g, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = `${i + 1}  ${D.gear[g].name}`; if (S.useGear === g) b.className = 'on'; b.onclick = () => pickGear(i + 1); bar.appendChild(b); });
    if (S.bait && !(S.baits[S.bait] > 0)) S.bait = null;
    const tk = FR.tackle();
    const bb = document.createElement('button'); bb.type = 'button'; bb.className = 'bait'; bb.textContent = tk ? `Q  ${tk.name}${tk.kind === 'bait' ? ' ×' + S.baits[tk.id] : ' (lure)'}` : 'Q  Nothing on the hook'; bb.onclick = nextBait; bar.appendChild(bb);
    if (S.traps > 0) { const tb = document.createElement('button'); tb.type = 'button'; tb.textContent = `T  Drop trap ×${S.traps - traps.length}`; tb.disabled = traps.length >= S.traps; tb.onclick = dropTrap; bar.appendChild(tb); }
  }
  function pickGear(n) { if (cast || fight) return; const owned = Object.keys(D.gear).filter(g => S.gear[g]); if (owned[n - 1]) { S.useGear = owned[n - 1]; FR.sfx('click'); drawBar(); } }
  // Q cycles: nothing → each bait you have → each lure you own
  function nextBait() {
    if (cast || fight) return;
    const opts = [null].concat(Object.keys(D.baits).filter(b => S.baits[b] > 0).map(b => 'b:' + b), Object.keys(D.lures || {}).filter(l => S.lures[l]).map(l => 'l:' + l));
    const cur = S.lure && S.lures[S.lure] ? 'l:' + S.lure : S.bait ? 'b:' + S.bait : null;
    const nx = opts[(opts.indexOf(cur) + 1) % opts.length];
    S.bait = nx && nx[0] === 'b' ? nx.slice(2) : null; S.lure = nx && nx[0] === 'l' ? nx.slice(2) : null;
    FR.sfx('click'); drawBar();
    const tk = FR.tackle();
    if (tk) { const likes = Object.keys(D.fish).filter(id => S.journal[id] && FR.tackleFits(id, tk)).map(id => D.fish[id].name); toast(`${tk.name}${likes.length ? ': ' + likes.join(', ') + ' will bite' : ': try it on new fish'}`, '#c9a0ff'); }
  }

  // v4.2: R puts the right bait (or its lure, if you own it) on for the sign in front of you
  function rightBait() {
    if (cast || fight) return;
    const sp = nearestSpot(); if (!sp) { toast('Sail up to a sign first.', '#ffe9a8'); return; }
    const id = sp.id, f = D.fish[id], l = FR.lureFor(id);
    if (!FR.baitKnown(id) && !f.boss) { toast("You don't know what this fish likes yet. Cast and see.", '#ffe9a8'); return; }
    if (l && S.lures[l]) { S.lure = l; S.bait = null; }
    else if (S.baits[f.bait] > 0) { S.bait = f.bait; S.lure = null; }
    else { toast(`You have no ${D.baits[f.bait].name}. Buy some in the afternoon.`, '#ff9c9c'); FR.sfx('bad'); return; }
    FR.sfx('click'); drawBar(); toast(`${FR.tackle().name} on the hook.`, '#c9a0ff');
  }

  // ---------- crab traps ----------
  function dropTrap() {
    if (cast || fight || finished || traps.length >= S.traps) return;
    const g = new THREE.Group(); g.position.set(boat.position.x + Math.sin(boat.rotation.y) * 4, 0, boat.position.z + Math.cos(boat.rotation.y) * 4); scene.add(g);
    const buoy = new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 10), new THREE.MeshStandardMaterial({ color: 0xff7a3c })); buoy.position.y = 0.3; g.add(buoy);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 6), new THREE.MeshStandardMaterial({ color: 0x2b2140 })); pole.position.y = 1.4; g.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), basic(0xffe14d)); flag.position.set(0.4, 2.0, 0); g.add(flag);
    const label = textSprite(Math.ceil(C.trapSeconds) + 's', '#ffffff', 5); label.position.y = 3.4; g.add(label);
    traps.push({ g, t: C.trapSeconds, label, shown: '' });
    FR.sfx('splash'); drawBar(); toast('Trap dropped. Come back when it says READY.', '#ffe9a8');
  }
  function collectTrap(tr) {
    const id = FR.weighted(C.trapCatch), n = id === 'crab' ? 1 + (Math.random() < 0.4 ? 1 : 0) : 1;
    scene.remove(tr.g); traps = traps.filter(x => x !== tr);
    land(id, 'normal', false, n); drawBar();
  }
  function setLabel(sp, text, color) {
    const c = sp.material.map.image, g = c.getContext('2d'); g.clearRect(0, 0, 512, 128);
    g.font = '64px "Lilita One", "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 14; g.strokeStyle = '#2b2140'; g.strokeText(text, 256, 68); g.fillStyle = color; g.fillText(text, 256, 68);
    sp.material.map.needsUpdate = true;
  }

  // ---------- landing a fish (same rules as the 2D game) ----------
  function land(id, cut, lucky, count) {
    const f = D.fish[id]; let n = 0, size = 'normal'; const notes = [];
    for (let i = 0; i < (count || 1) && S.tank.length < FR.tankCap(); i++) {
      size = f.boss ? 'trophy' : FR.rollSize(lucky);
      if (lucky === 'extra' && D.sizes[size].rank < 2 && Math.random() < 0.5) size = 'big'; // a Strong fish or an Ember Fly II
      FR.addFish(id, cut, size); FR.goalEvent('catch', { id, cut, size });
      const j = FR.logCatch(id, size);
      if (j.first) notes.push(`New in your journal! +$${j.reward}`);
      if (j.complete) notes.push(`${j.complete} journal complete! +$${C.journalComplete}`);
      caught.push({ id, size, cut, first: j.first }); n++;
    }
    if (!n) { toast('The tank is full, so you let it go.', '#ffe9a8'); return null; }
    const sizeTxt = n > 1 ? ` ×${n}` : size !== 'normal' ? ` (${D.sizes[size].name})` : '';
    const cutTxt = cut === 'perfect' ? '  Clean catch!' : cut === 'bruised' ? '  Bruised.' : '';
    toast(`Caught ${f.name}${sizeTxt}!${cutTxt}${notes.length ? '\n' + notes.join('  ') : ''}`, cut === 'bruised' ? '#ffe9a8' : '#9cffb0');
    FR.sfx(size === 'trophy' || cut === 'perfect' ? 'perfect' : 'good'); A.react('yay', 1.0);
    // the fish leaps out of the water at the bobber
    leapId = id; leap(f.color, bobber.position.clone());
    spots.forEach(sp => { if (sp.id === id && !S.journal[id + '_shown']) { /* labels update on next spawn */ } });
    return size;
  }
  let leapFish = null, leapId = null;
  function leap(color, at) {
    if (leapFish) scene.remove(leapFish.g);
    const art = FR.fishArt[leapId];
    const g = art ? new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(art), transparent: true })) : A.fishModel(color, 1.6);
    if (art) g.scale.set(4.4, 2.5, 1);
    scene.add(g); g.position.copy(at); leapFish = { g, t: 0, from: at.clone(), to: tipPos() }; splash(at, 14, 0xdff6ff);
  }

  // ---------- casting ----------
  function startCast(sp) {
    // v4.1: what is on the hook decides whether this fish bites at all
    const f = D.fish[sp.id], tk = FR.tackle();
    if (tk && tk.kind === 'bait') { S.baits[tk.id]--; if (S.baits[tk.id] <= 0) S.bait = null; }
    const match = FR.tackleFits(sp.id, tk), lure = tk && tk.kind === 'lure' ? tk : null, perk = lure ? D.lures[lure.id].perk : null;
    const w = C.biteWait[match ? 'match' : tk ? 'other' : 'none'];
    const ignore = Math.random() >= FR.biteChance(sp.id, tk);
    const nothing = !ignore && !f.boss && Math.random() < fday.noBite * (match ? 0.3 : 1);
    let wait = rnd(w[0], w[1]) * fday.bite; if (perk === 'quick') wait *= 0.35;
    cast = { sp, tk, lure, perk, match, phase: 'fly', t: 0.6, wait: ignore ? rnd(1.4, 2.2) : wait, ignore, nothing, window: C.biteWindow + (perk === 'quick' ? 0.4 * lure.lv : 0) };
    bobber.position.copy(tipPos()); bobber.visible = true; line.visible = true; cast.from = tipPos(); cast.to = new THREE.Vector3(sp.g.position.x, 0.2, sp.g.position.z);
    FR.sfx('click'); drawBar();
  }
  function endCast(spook) {
    const sp = cast.sp; cast = null; bobber.visible = false; line.visible = false; bang.visible = false;
    if (spook) removeSpot(sp, true);
  }
  function hook() {
    const id = cast.sp.id, f = D.fish[id], check = FR.gearCheck(id, S.useGear);
    bang.visible = false;
    if (check.fail) { FR.sfx('bad'); toast(check.fail, '#ff9c9c'); endCast(!f.boss); return; }
    if (check.scoop) { const m = cast.match; endCast(true); land(id, 'perfect', m, check.scoop); return; }
    cast.phase = 'fight'; A.react('jerk', 0.4);
    const j = S.journal[id], quick = !f.boss && (f.rarity === 'common' || f.rarity === 'uncommon') && j && j.n >= C.fight.mastered;
    fight = new Fight(id, {
      gear: S.useGear, baitMatch: cast.match, lure: cast.lure, quick,
      onDone: res => {
        fight = null; const boss = f.boss, m = cast.match;
        if (!res.caught) { endCast(!boss); FR.sfx('bad'); A.react('sad', 1.2); toast(res.msg, '#ff9c9c'); return; }
        const lk = res.strong || (cast.perk === 'big' && cast.lure.lv > 1) ? 'extra' : m || cast.perk === 'big';
        const size = land(id, check.bruise ? 'bruised' : res.cut, lk);
        endCast(true);
        if (boss && size) {
          S.bossBeaten = true; S.bossToday = false;
          const r = D.recipes.find(x => x.legendary && x.fish[id]); if (r) FR.unlockRecipe(r.id);
          toast(`You beat ${f.name}!\nLegendary recipe unlocked: ${r ? r.name : ''}`, '#ffe14d');
        }
      }
    });
  }

  // ---------- the fight (v4 step 3): the v3 tension-and-stamina fight, plus a move of its own for every fish ----------
  FR.gearCheck = function (fishId, gear) {
    const f = D.fish[fishId];
    if (f.gear.includes(gear)) return gear === 'net' ? { scoop: 3 + Math.floor(Math.random() * 2) } : { fight: true };
    if (f.boss) return { fail: `${f.name} snaps your line like thread. Only a harpoon will stop it.` };
    if (gear === 'net') return { fail: `The ${f.name} slipped right through the net.` };
    if (gear === 'harpoon') return { fail: `A harpoon is far too much for a ${f.name}. It bolts.` };
    if (gear === 'light') return { fail: `SNAP! The ${f.name} is too strong for a light rod.` };
    return { fight: true, bruise: true };
  };

  // Which moves each fish uses. hint = what the fight screen tells you at the start.
  const FIGHTS = {
    sardine: { moves: ['dart'], hint: 'DART: it zig-zags. Ease off a little while it darts.' },
    mackerel: { moves: ['surge'], hint: 'SURGE: sudden sprints with almost no warning. Let go fast.' },
    flounder: { moves: ['sand'], hint: 'SAND CLOUD: the tension meter hides. Watch the line shake: shaking means it is running.' },
    glowgill: { moves: ['blink'], hint: 'BLINK: it vanishes. Stop reeling until it comes back.' },
    frostfin_cod: { moves: ['freeze'], hint: 'FREEZE: it ices your reel. Tap SPACE fast to crack the ice.' },
    squid: { moves: ['ink', 'grab'], hint: 'INK and TENTACLE: ink hides the meters, and a tentacle pull means let go.' },
    thunder_eel: { moves: ['zap'], hint: 'ZAP: a charge bar fills up, then it zaps. Let go when the charge is full.' },
    ember_trout: { moves: ['heat'], hint: 'HEAT: reeling heats the line. Rest before the heat bar fills or it burns through.' },
    moon_ray: { moves: ['glide', 'phase'], hint: 'GLIDE: it swims toward you, so REEL fast. It also fades into the dark.' },
    ghost_shrimp: { moves: ['phase', 'blink'], hint: 'FADE: it is hard to see. Trust the line.' },
    bluefin_tuna: { moves: ['dive'], secondWind: true, hint: 'DEEP DIVE: long runs. When it is tired it gets a second wind.' },
    swordfish: { moves: ['leap', 'slash'], hint: 'LEAP: tap SPACE when the rings meet. SLASH: let go.' },
    abyss_angler: { moves: ['lure', 'phase'], hint: 'LURE: two lights appear. Pick the one that pulses (◀ or ▶).' },
    bubble_puffer: { moves: ['puff', 'blink'], hint: 'PUFF: it blows up big and heavy. Wait for it to shrink.' },
    coral_snapper: { moves: ['snag', 'dive'], hint: 'REEF RUN: rocks appear. Pull the other way (◀ or ▶).' },
    dragon_koi: { moves: ['sparks'], hint: 'SPARKS: copy each arrow. The patterns get longer as it tires.' },
    old_whiskers: { rounds: [['slam'], ['mud', 'slam'], ['thrash', 'dive', 'slam']], hint: 'THREE ROUNDS: tail slams first, then mud, then a wild thrash.' }
  };

  // Each move: name, warn (seconds of warning), dur, and what it does while on.
  // A move's on() returns true to end early. this.mod changes the basic fight while the move is on.
  const LETGO = (label, hitAmt) => ({
    name: label, warn: 0.5, dur: 0.75,
    start() { FR.sfx('zap'); },
    on(dt, inp, sp) { this.mod.white = true; this.flash(label + ' Let go!'); if (inp.down && sp.t > 0.15 && !sp.hit) { sp.hit = true; this.hit(hitAmt); } }
  });
  const ARROWS = (label, n0, stepMax) => ({
    name: label, dur: 99,
    start(sp) { const n = n0 + Math.min(2, Math.floor(Math.max(0, 1 - this.stamina) * 3)); sp.seq = Array.from({ length: n }, () => FR.pick(['up', 'down', 'left', 'right'])); sp.pos = 0; sp.step = 0; this.showArrows(sp.seq[0], true); },
    on(dt, inp, sp) {
      this.flash(label === 'THRASH' ? 'THRASH! Match the arrows!' : 'Copy the sparks! (arrows / WASD)');
      sp.step += dt;
      if (inp.dir || sp.step > stepMax) {
        if (inp.dir === sp.seq[sp.pos]) { FR.sfx('blip'); this.say('Good!', '#9cffb0'); } else this.hit(0.22);
        sp.pos++; sp.step = 0;
        if (sp.pos >= sp.seq.length) return true;
        this.showArrows(sp.seq[sp.pos], true);
      }
    }
  });
  const CLOUD = label => ({
    name: label, dur: 3.2,
    on() { this.mod.sand = true; this.mod.hideNeedle = true; this.mod.hideFish = true; this.flash(label + '! Watch the line shake.'); }
  });
  const MOVE = {
    dart: { name: 'DART', warn: 0.4, dur: 1.6, on() { this.mod.tensionMul = 1.6; this.mod.dart = true; this.flash('Darting! Ease off a little.'); } },
    surge: { name: 'SURGE', warn: 0.25, dur: 0.9, on() { this.mod.forceRun = true; this.mod.tensionMul = 2.2; this.mod.pullMul = 2; this.flash('SURGE! Let go!'); } },
    sand: CLOUD('SAND CLOUD'),
    mud: CLOUD('MUD CLOUD'),
    blink: {
      name: 'BLINK', dur: 1.3,
      on(dt, inp, sp) { this.mod.alpha = 0.05; this.flash('It vanished! Stop reeling!'); if (inp.down && sp.t > 0.3) { this.tension += 1.1 * dt; sp.hit = true; } },
      end(sp) { if (sp.hit) this.hits++; }
    },
    phase: { name: 'FADE', dur: 1.6, on() { this.mod.alpha = 0.12; this.mod.dimMeters = true; this.flash('It fades into the dark…'); } },
    freeze: {
      name: 'FREEZE', warn: 0.5, dur: 3,
      start(sp) { sp.taps = 0; $('reel').classList.add('iced'); FR.sfx('zap'); },
      on(dt, inp, sp) {
        this.mod.reelBlocked = true;
        if (inp.just) { sp.taps++; FR.sfx('blip'); }
        this.flash(`Reel frozen! Tap SPACE!  ${'▮'.repeat(Math.max(0, 6 - sp.taps))}`);
        if (sp.taps >= 6) { this.say('Cracked it!', '#9cffb0'); return true; }
      },
      end() { $('reel').classList.remove('iced'); }
    },
    ink: {
      name: 'INK', dur: 3,
      start() { FR.sfx('splash'); const ink = $('fInk'); for (let i = 0; i < 10; i++) { const b = document.createElement('i'); const r = rnd(50, 90); b.style.cssText = `width:${r}px;height:${r}px;left:${rnd(0, 88)}%;top:${rnd(25, 105)}%`; ink.appendChild(b); } },
      on() { this.flash('INKED! Feel the line…'); }
    },
    grab: {
      name: 'TENTACLE', warn: 0.45, dur: 1,
      on(dt, inp, sp) { this.mod.forceRun = true; this.mod.pullMul = 1.6; this.flash('TENTACLE PULL! Let go!'); if (inp.down && sp.t > 0.15 && !sp.hit) { sp.hit = true; this.hit(0.28); } }
    },
    zap: Object.assign(LETGO('ZAP!', 0.3), { warn: 1.4, warnText(sp) { const n = Math.min(5, Math.round(sp.t / 1.4 * 5)); return 'Charging  ' + '▮'.repeat(n) + '▯'.repeat(5 - n); } }),
    slash: LETGO('SLASH!', 0.3),
    slam: Object.assign(LETGO('TAIL SLAM!', 0.35), { warn: 0.7 }),
    heat: {
      name: 'HEAT', dur: 4.5,
      start() { this.heat = 0; $('fHeatRow').hidden = false; },
      on(dt, inp) {
        this.heat = Math.max(0, Math.min(1, this.heat + (inp.down ? 0.45 : -0.6) * dt));
        this.mod.hot = this.heat;
        this.flash(this.heat > 0.7 ? 'Too hot! Rest!' : 'The line is heating up…');
        if (this.heat >= 1) { this.hit(0.4); this.heat = 0.3; this.say('It burned through a strand!', '#ff9c9c'); }
      },
      end() { $('fHeatRow').hidden = true; }
    },
    glide: { name: 'GLIDE', warn: 0.5, dur: 2.4, on() { this.mod.glide = true; this.flash('It glides toward you! REEL fast!'); } },
    dive: {
      name: 'DEEP DIVE', dur: 2.5,
      start() { this.state = 'run'; this.timer = 2.5; },
      on() { this.mod.forceRun = true; this.flash('DEEP DIVE! Let it run!'); },
      end() { this.state = 'tired'; this.timer = 1.6; }
    },
    leap: {
      name: 'LEAP', warn: 0.4, dur: 1.4,
      start(sp) { sp.answered = false; FR.sfx('splash'); },
      on(dt, inp, sp) {
        this.mod.reelBlocked = true; this.mod.leap = sp;
        this.flash('LEAP! Tap SPACE when the rings meet!');
        if (inp.just && !sp.answered) {
          sp.answered = true;
          if (Math.abs(sp.t - 0.75) < 0.16) { FR.sfx('perfect'); this.dist -= 0.15; this.stamina = Math.max(0, this.stamina - 0.15); this.say('Perfect hook-set!', '#9cffb0'); }
          else { this.hit(0.3); this.say('Missed! It shook the line.', '#ff9c9c'); }
        }
      },
      end(sp) { if (!sp.answered) { this.hit(0.3); this.say('Too late! It shook the line.', '#ff9c9c'); } }
    },
    lure: {
      name: 'LURE', warn: 0.6, dur: 2.6,
      start(sp) { sp.side = Math.random() < 0.5 ? 'left' : 'right'; sp.answered = false; this.showArrows(null, false); },
      on(dt, inp, sp) {
        this.mod.lure = sp; this.flash('Which light is the fish?  ◀ or ▶');
        if (inp.dir === 'left' || inp.dir === 'right') {
          sp.answered = true;
          if (inp.dir === sp.side) { FR.sfx('perfect'); this.stamina = Math.max(0, this.stamina - 0.22); this.dist -= 0.1; this.say('Got it!', '#9cffb0'); }
          else { this.hit(0.3); this.dist += 0.12; this.say('That was the fake!', '#ff9c9c'); }
          return true;
        }
      },
      end(sp) { if (!sp.answered) { this.hit(0.25); this.say('Too slow! It slipped away a little.', '#ff9c9c'); } }
    },
    puff: { name: 'PUFF', dur: 3, on() { this.mod.scale = 1.8; this.mod.tensionMul = 3; this.mod.pullMul = 0.4; this.flash('It puffed up! Too heavy. Wait!'); } },
    snag: {
      name: 'REEF', warn: 0.5, dur: 1.7,
      start(sp) { sp.side = Math.random() < 0.5 ? 'left' : 'right'; sp.need = sp.side === 'left' ? 'right' : 'left'; sp.answered = false; this.showArrows(null, false); },
      on(dt, inp, sp) {
        this.mod.rocks = sp.side;
        this.flash(`Rocks on the ${sp.side}! Pull ${sp.need === 'left' ? '◀' : '▶'}`);
        if (inp.dir === 'left' || inp.dir === 'right') {
          sp.answered = true;
          if (inp.dir === sp.need) { FR.sfx('perfect'); this.say('Steered clear!', '#9cffb0'); } else { this.hit(0.32); this.say('Snagged on the reef!', '#ff9c9c'); }
          return true;
        }
      },
      end(sp) { if (!sp.answered) { this.hit(0.32); this.say('Snagged on the reef!', '#ff9c9c'); } }
    },
    sparks: ARROWS('SPARKS', 3, 1.0),
    thrash: ARROWS('THRASH', 4, 0.8)
  };

  class Fight {
    constructor(id, o) {
      const f = this.fish = D.fish[id], F = C.fight; this.id = id; this.o = o;
      this.def = FIGHTS[id] || { moves: [f.special && f.special !== 'none' ? f.special : 'dart'], hint: f.tip };
      this.dist = 1; this.tension = 0.15; this.maxTension = 0; this.hits = 0; this.t = 0;
      this.stamina = o.baitMatch ? C.baitStamina : 1; this.stage = 1; this.stages = f.stages || 1;
      // v4.1: every bite has a mood, a side it pulls to, a late trick, and ends with a landing
      const MD = F.moods, mw = {}; for (const k in MD) mw[k] = MD[k].weight[f.rarity] || 0;
      this.moodId = FR.weighted(mw); this.mood = MD[this.moodId];
      this.stamina *= this.mood.stamina || 1;
      this.perk = o.lure ? D.lures[o.lure.id].perk : null; this.lv = o.lure ? o.lure.lv : 0;
      if (this.perk === 'tired') this.stamina *= this.lv > 1 ? 0.55 : 0.75;
      this.forgive = this.perk === 'clean' ? this.lv : 0;
      this.pull = null; this.fakeT = 0; this.finale = null; this.perfectLand = false;
      const own = this.def.rounds ? [].concat(...this.def.rounds) : this.def.moves;
      const extra = ['dart', 'surge', 'blink', 'leap', 'snag', 'dive', 'puff'].filter(m => !own.includes(m));
      this.late = this.def.rounds ? null : FR.pick(extra); this.lateOn = false;
      this.lineK = (o.gear === 'heavy' || o.gear === 'harpoon') ? F.heavyRod : 1;
      this.state = 'run'; this.timer = 1.2; this.special = null; this.nextSpecial = rnd(F.specialEvery[0], F.specialEvery[1]) * 0.7;
      this.fx = 420; this.heat = 0; this.mod = {}; this.sayT = 0; this.windUsed = false; this.shake = 0;
      this.art = FR.fishArt[id] || null;
      $('fName').textContent = `${f.name}  ·  ${this.mood.name}${o.quick ? '  ·  Quick catch' : ''}`;
      $('fTip').textContent = o.quick ? 'You know this fish well! Tap SPACE when the marker is in the green to land it at once.' : `${this.mood.name}: ${this.mood.desc}.  ${this.def.hint}  When it runs ◀ or ▶, pull the other way (A / D).`;
      $('fSide').hidden = !!o.quick;
      $('fight').hidden = false; $('fInk').innerHTML = ''; $('fArrows').hidden = true; $('fFlash').textContent = ''; $('fHeatRow').hidden = true;
      $('fMeters').style.opacity = 1; $('reel').classList.remove('iced');
      this.g = $('fCanvas').getContext('2d');
      FR.sfx('bite');
      if (o.quick) { this.dist = F.landAt; this.startFinale(true); }
    }
    startFinale(quick) {
      const F = C.fight, r = this.fish.rarity, z = F.landZone[r] || 0.2;
      const c = 0.25 + Math.random() * 0.5;
      this.finale = { x: 0, dir: 1, speed: (F.landSpeed[r] || 1.4) * (quick ? 1.15 : 1), zone: [c - z / 2, c + z / 2], gold: [c - z / 8, c + z / 8], quick, t: 0 };
      if (this.special) this.endSpecial();
      this.say(quick ? 'Old friend! Tap in the green!' : 'AT THE BOAT! Tap in the green!', '#9cffb0'); FR.sfx('order');
    }
    runFinale(dt, inp) {
      const fn = this.finale; fn.t += dt;
      fn.x += fn.dir * fn.speed * dt; if (fn.x > 1) { fn.x = 1; fn.dir = -1; } if (fn.x < 0) { fn.x = 0; fn.dir = 1; }
      this.tension = Math.max(0.1, this.tension - dt * 0.5);
      if (!inp.just || fn.t < 0.15) return null;
      if (fn.x >= fn.gold[0] && fn.x <= fn.gold[1]) { this.perfectLand = true; FR.sfx('perfect'); return 'land'; }
      if (fn.x >= fn.zone[0] && fn.x <= fn.zone[1]) { FR.sfx('good'); return 'land'; }
      // a miss: it thrashes free and you have to bring it back in
      this.finale = null; this.hit(0.15); this.dist = fn.quick ? 0.6 : C.fight.landMiss; this.stamina = Math.min(1, this.stamina + 0.15);
      this.state = 'run'; this.timer = 1.2; this.pull = Math.random() < 0.5 ? 'left' : 'right';
      this.say(fn.quick ? 'Missed! Not so easy today. Reel it in!' : 'It thrashed free! Bring it back!', '#ff9c9c'); $('fSide').hidden = false;
      return null;
    }
    flash(text) { if (this.sayT <= 0) { $('fFlash').textContent = text; $('fFlash').style.color = '#fff27a'; } }
    say(text, color) { this.sayT = 1.1; $('fFlash').textContent = text; $('fFlash').style.color = color; }
    hit(a) {
      if (this.forgive > 0) { this.forgive--; this.tension += a * 0.4; this.shake = 0.15; this.say('The Bottom Crawler held on! (no harm done)', '#9cffb0'); FR.sfx('blip'); return; }
      this.tension += a; this.hits++; this.shake = 0.25; FR.sfx('bad');
    }
    showArrows(dir, all) {
      const rot = { up: '▲', right: '▶', down: '▼', left: '◀' };
      $('fArrows').hidden = false; $('fBig').textContent = dir ? rot[dir] : '';
      document.querySelectorAll('#fArrows .ar.up, #fArrows .ar.down').forEach(b => { b.hidden = !all; });
    }
    startSpecial() {
      const list = this.def.rounds ? this.def.rounds[Math.min(this.stage, this.def.rounds.length) - 1] : this.def.moves.concat(this.lateOn ? [this.late, this.late] : []);
      const type = FR.pick(list), m = MOVE[type];
      if (!m) return;
      this.special = { type, m, t: 0, phase: 'warn', warn: m.warn === undefined ? 0.6 : m.warn, dur: m.dur, hit: false };
      FR.sfx('bite');
    }
    endSpecial() {
      const sp = this.special; this.special = null;
      if (sp && sp.phase === 'on' && sp.m.end) sp.m.end.call(this, sp);
      this.mod = {}; $('fMeters').style.opacity = 1; $('fInk').innerHTML = ''; $('fArrows').hidden = true; if (this.sayT <= 0) $('fFlash').textContent = '';
      this.nextSpecial = rnd(C.fight.specialEvery[0], C.fight.specialEvery[1]) * (this.mood.tricks || 1) * (0.6 + 0.4 * this.stamina);
    }
    runSpecial(dt, inp) {
      const sp = this.special; sp.t += dt;
      if (sp.phase === 'warn') {
        this.flash(sp.m.warnText ? sp.m.warnText(sp) : `! ! !  ${sp.m.name}`);
        if (sp.t >= sp.warn) { sp.phase = 'on'; sp.t = 0; if (sp.m.start) sp.m.start.call(this, sp); }
        return;
      }
      this.mod = {};
      const done = sp.m.on.call(this, dt, inp, sp);
      if (done || sp.t >= sp.dur) this.endSpecial();
    }
    // ----- drawing: the v3 fish art in a side view of the water -----
    draw(running) {
      const g = this.g, W = 560, H = 190, m = this.mod, SURF = 46;
      g.save();
      if (this.shake > 0) g.translate(rnd(-5, 5), rnd(-4, 4));
      const sky = g.createLinearGradient(0, 0, 0, SURF); sky.addColorStop(0, '#8fd3ff'); sky.addColorStop(1, '#cfeeff'); g.fillStyle = sky; g.fillRect(-10, -10, W + 20, SURF + 10);
      const sea = g.createLinearGradient(0, SURF, 0, H); sea.addColorStop(0, '#2a8fc0'); sea.addColorStop(1, '#0b2f52'); g.fillStyle = sea; g.fillRect(-10, SURF, W + 20, H);
      g.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(80 + i * 130 + Math.sin(this.t + i) * 10, SURF); g.lineTo(130 + i * 130, H); g.lineTo(100 + i * 130, H); g.fill(); }
      g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= W; x += 10) g.lineTo(x, SURF + Math.sin(x * 0.05 + this.t * 3) * 2); g.stroke();
      // the skiff and the chef
      g.fillStyle = '#faf3e3'; g.strokeStyle = '#2b2140'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-10, 30); g.lineTo(78, 30); g.lineTo(62, 54); g.lineTo(-10, 54); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#3bb6b0'; g.fillRect(-10, 40, 80, 5);
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(34, 6, 11, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#f2c09a'; g.beginPath(); g.arc(34, 16, 8, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = '#5a3a22'; g.lineWidth = 3; g.beginPath(); g.moveTo(42, 24); g.lineTo(84, -4); g.stroke();
      // where the fish is
      let fy = 120 + Math.sin(this.t * (running ? 14 : 3)) * (running ? 7 : 3);
      if (m.dart) fy += Math.sin(this.t * 25) * 14;
      let s = (this.fish.boss ? 1.5 : 1) * (m.scale || 1);
      const leap = m.leap;
      if (leap) { const k = Math.min(1, leap.t / leap.dur); fy = SURF - Math.sin(k * Math.PI) * 70; }
      // the line: red when it is about to snap, orange when hot, shaking in a sand cloud while it runs
      const hot = m.hot || 0;
      g.strokeStyle = this.tension > 0.85 ? '#ff5b5b' : hot > 0.05 ? `rgb(255,${Math.round(220 - hot * 160)},${Math.round(160 - hot * 140)})` : '#fff6d6';
      g.lineWidth = 2 + hot * 2;
      const jig = m.sand && running ? 7 : 0, midX = (84 + this.fx) / 2, midY = (fy + 0) / 2 + 30 - this.tension * 40;
      g.beginPath(); g.moveTo(84, -4); g.quadraticCurveTo(midX + rnd(-jig, jig), midY + rnd(-jig, jig), this.fx - 34 * s, fy); g.stroke();
      // the fish
      if (!m.hideFish && !m.lure) {
        g.save(); g.globalAlpha = m.alpha === undefined ? 1 : m.alpha; g.translate(this.fx, fy); g.scale(running ? s : -s, s);
        if (leap) g.rotate(-(0.5 - Math.min(1, leap.t / leap.dur)) * 1.4);
        if (this.art) g.drawImage(this.art, -64, -36, 128, 72); else { g.fillStyle = hex(this.fish.color); g.beginPath(); g.ellipse(0, 0, 32, 15, 0, 0, 7); g.fill(); }
        g.restore();
        if (m.white) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, 0, W, H); g.strokeStyle = '#fff27a'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); let x = this.fx + rnd(-60, 60), y = fy - 50; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += rnd(-14, 14); y += 22; g.lineTo(x, y); } g.stroke(); } }
      }
      // the leap's timing rings
      if (leap) {
        g.strokeStyle = '#ffe14d'; g.lineWidth = 4; g.beginPath(); g.arc(this.fx, fy, 34, 0, 7); g.stroke();
        const r = 34 + Math.max(0, 0.75 - leap.t) * 150; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 3; g.beginPath(); g.arc(this.fx, fy, Math.max(6, r - (leap.t > 0.75 ? (leap.t - 0.75) * 60 : 0)), 0, 7); g.stroke();
      }
      // sand or mud cloud
      if (m.sand) {
        g.fillStyle = this.special && this.special.type === 'mud' ? 'rgba(70,52,30,0.88)' : 'rgba(170,130,80,0.86)'; g.fillRect(0, SURF + 4, W, H);
        g.fillStyle = 'rgba(255,240,210,0.25)'; for (let i = 0; i < 30; i++) { g.beginPath(); g.arc((i * 97 + this.t * 30) % W, SURF + 10 + (i * 53) % (H - SURF - 10), 3, 0, 7); g.fill(); }
      }
      // the lure: two lights in the dark, one is the fish
      if (m.lure) {
        g.fillStyle = 'rgba(4,4,18,0.92)'; g.fillRect(0, SURF, W, H);
        const real = m.lure.side, pulse = 0.5 + 0.5 * Math.sin(this.t * 9);
        [['left', 180], ['right', 400]].forEach(([side, x]) => {
          const isReal = side === real, r = isReal ? 16 + pulse * 10 : 20, col = isReal ? '140,255,230' : '255,255,255';
          const gr = g.createRadialGradient(x, 120, 0, x, 120, r * 2.4); gr.addColorStop(0, `rgba(${col},0.95)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, 120, r * 2.4, 0, 7); g.fill();
          if (isReal && this.art) { g.globalAlpha = 0.18; g.drawImage(this.art, x - 30, 120 - 6, 90, 50); g.globalAlpha = 1; }
        });
        g.fillStyle = '#ffe9a8'; g.font = '22px "Lilita One", sans-serif'; g.textAlign = 'center'; g.fillText('◀', 180, 178); g.fillText('▶', 400, 178);
      }
      // reef rocks
      if (m.rocks) {
        const left = m.rocks === 'left', x0 = left ? 0 : W;
        g.fillStyle = '#5a5a66'; g.strokeStyle = '#2b2140'; g.lineWidth = 3;
        for (let i = 0; i < 4; i++) { const x = left ? 20 + i * 45 : W - 20 - i * 45; g.beginPath(); g.moveTo(x - 30, H); g.lineTo(x - 18, H - 40 - (i % 2) * 25); g.lineTo(x + 6, H - 55 - (i % 3) * 15); g.lineTo(x + 28, H); g.closePath(); g.fill(); g.stroke(); }
        g.fillStyle = '#ff8fb0'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(left ? 30 + i * 35 : W - 30 - i * 35, H - 30 - (i % 2) * 20, 6, 0, 7); g.fill(); }
        void x0;
      }
      // v4.1: which way it is pulling
      if (running && this.pull && !m.hideFish && !this.finale) {
        const L = this.pull === 'left', ax = this.fx + (L ? -80 : 80), ay = fy - 46, wob = Math.sin(this.t * 14) * 4;
        g.fillStyle = 'rgba(255,90,90,0.92)'; g.strokeStyle = '#2b2140'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(ax + (L ? -26 : 26) + wob, ay); g.lineTo(ax + (L ? 6 : -6), ay - 18); g.lineTo(ax + (L ? 6 : -6), ay + 18); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = '#ffffff'; g.font = '16px "Lilita One", sans-serif'; g.textAlign = 'center'; g.fillText(L ? 'PULLS ◀' : 'PULLS ▶', ax, ay - 24);
      }
      // the landing bar
      if (this.finale) {
        const fn = this.finale, bx = 100, bw = 360, by = 150;
        g.fillStyle = 'rgba(20,16,40,0.85)'; g.fillRect(bx - 6, by - 6, bw + 12, 30);
        g.fillStyle = '#b3262b'; g.fillRect(bx, by, bw, 18);
        g.fillStyle = '#3f8f4f'; g.fillRect(bx + fn.zone[0] * bw, by, (fn.zone[1] - fn.zone[0]) * bw, 18);
        g.fillStyle = '#ffd23c'; g.fillRect(bx + fn.gold[0] * bw, by, (fn.gold[1] - fn.gold[0]) * bw, 18);
        g.fillStyle = '#ffffff'; g.strokeStyle = '#2b2140'; g.lineWidth = 2; g.fillRect(bx + fn.x * bw - 4, by - 8, 8, 34); g.strokeRect(bx + fn.x * bw - 4, by - 8, 8, 34);
        g.fillStyle = '#ffe9a8'; g.font = '16px "Lilita One", sans-serif'; g.textAlign = 'center'; g.fillText('LAND IT!  gold = clean catch', bx + bw / 2, by - 12);
      }
      g.fillStyle = 'rgba(43,33,64,0.8)'; g.fillRect(8, SURF + 6, 120, 24); g.fillStyle = '#ffe9a8'; g.font = '15px "Lilita One", sans-serif'; g.textAlign = 'left'; g.fillText(this.mood.name.toUpperCase() + (this.forgive ? ' · ♥'.repeat(1) + this.forgive : ''), 14, SURF + 24);
      if (this.stages > 1) { g.fillStyle = '#2b2140'; g.font = '18px "Lilita One", sans-serif'; g.textAlign = 'right'; g.fillText(`Round ${this.stage} of ${this.stages}`, W - 12, 26); }
      g.restore();
    }
    finish(res) { A.rod.rotation.z = 0; $('fight').hidden = true; $('reel').classList.remove('iced'); $('fHeatRow').hidden = true; this.o.onDone(res); }
    update(dt, inp) {
      const F = C.fight, f = this.fish;
      this.t += dt; this.sayT -= dt; this.shake = Math.max(0, this.shake - dt);
      const power = f.power * (0.45 + 0.55 * this.stamina) * (1 + (this.stage - 1) * 0.2);
      if (this.finale) {
        const r = this.runFinale(dt, inp);
        this.draw(false); this.meters(false, inp, false);
        if (r === 'land') this.landed();
        return;
      }
      this.timer -= dt;
      if (this.timer <= 0 && !(this.special && this.special.type === 'dive' && this.special.phase === 'on')) {
        if (this.state === 'run') { this.state = 'tired'; this.timer = rnd(1.3, 2.3) * (1.5 - this.stamina * 0.5); this.pull = null; if (this.mood.fake && Math.random() < this.mood.fake) this.fakeT = rnd(0.5, 1.1); }
        else this.startRun();
      }
      // a Sneaky fish pretends to be tired, then bolts
      if (this.fakeT > 0 && this.state === 'tired') { this.fakeT -= dt; if (this.fakeT <= 0) { this.startRun(); this.say('FAKE-OUT! It was not tired!', '#ff9c9c'); } }
      // below half stamina it learns one more trick
      if (this.late && !this.lateOn && this.stamina < C.fight.lateTrick) { this.lateOn = true; this.say(`Desperate! New trick: ${MOVE[this.late].name}`, '#ffe14d'); this.nextSpecial = Math.min(this.nextSpecial, 1.2); }
      if (!this.special) { this.nextSpecial -= dt; if (this.nextSpecial <= 0) this.startSpecial(); }
      if (this.special) { this.runSpecial(dt, inp); if ($('fight').hidden) return; }
      const m = this.mod, running = (this.state === 'run' || m.forceRun) && !m.glide;
      const reeling = inp.down && !m.reelBlocked;
      // v4.1: pulling against the way it runs keeps the line safe and tires it out
      const opp = this.pull === 'left' ? 'right' : 'left', side = running && this.pull ? (inp.side === opp ? 'counter' : inp.side === this.pull ? 'same' : null) : null;
      const tm = (m.tensionMul || 1) * (side === 'counter' ? F.counterPull : side === 'same' ? F.samePull : 1) * (this.mood.power || 1);
      const pm = (m.pullMul || 1) * (side === 'counter' ? 0.5 : 1), tk = side === 'counter' ? F.counterTire : 1;
      if (m.glide) {
        if (reeling) { this.dist -= F.reel * 2.6 / f.stamina * dt; this.stamina -= 0.05 * dt; }
        else this.dist += 0.12 * dt;
        this.tension -= F.tensionDrop * dt;
      } else if (reeling) {
        if (running) { this.dist -= F.runReel * dt; this.tension += F.tensionRun * (0.5 + power) * this.lineK * tm * dt; this.stamina -= F.tireReel * tk * dt; }
        else { this.dist -= F.reel / f.stamina * dt; this.tension += F.tensionReel * this.lineK * tm * dt; }
      } else {
        this.tension -= F.tensionDrop * dt;
        if (running) { this.dist += F.runPull * (0.6 + power) * pm * dt; this.stamina -= F.tireRest * tk * dt; }
      }
      this.tension = Math.max(0, this.tension); this.stamina = Math.max(0, this.stamina); this.maxTension = Math.max(this.maxTension, this.tension);
      // the Bluefin's second wind
      if (this.def.secondWind && !this.windUsed && this.stamina < 0.2) { this.windUsed = true; this.stamina = 0.6; this.state = 'run'; this.timer = 1.6; this.say('SECOND WIND! It is not done yet!', '#ffe14d'); FR.sfx('splash'); }
      const target = 100 + Math.min(1.4, Math.max(0, this.dist)) * 300; this.fx += (target - this.fx) * Math.min(1, dt * 8);
      this.draw(running);
      this.meters(running, inp, side);
      A.rod.rotation.x = -0.75 + (reeling ? 0.35 : 0) + Math.sin(this.t * 20) * this.tension * 0.05;
      A.rod.rotation.z = running && this.pull ? (this.pull === 'left' ? 0.35 : -0.35) : 0;
      if (this.tension >= 1) { this.finish({ caught: false, msg: 'SNAP! Too much tension. The line broke.' }); return; }
      if (this.dist >= F.escapeAt) { this.finish({ caught: false, msg: 'You gave it too much slack. It swam off.' }); return; }
      if (this.stage < this.stages && this.dist <= 0) {
        this.stage++; this.dist = 1; this.stamina = 1; this.tension = 0.2; this.state = 'run'; this.timer = 1.5; if (this.special) this.endSpecial();
        FR.sfx('good'); this.say(`HARPOON HIT! Round ${this.stage}!`, '#ffe14d'); return;
      }
      if (this.stage >= this.stages && this.dist <= F.landAt) this.startFinale(false);
    }
    meters(running, inp, side) {
      const m = this.mod, st = $('fStatus');
      $('fMeters').style.opacity = m.dimMeters ? 0.06 : 1;
      $('fNeedle').style.left = (Math.min(1, this.tension) * 100) + '%'; $('fNeedle').style.opacity = m.hideNeedle ? 0 : 1;
      $('fStam').style.width = (this.stamina * 100) + '%';
      $('fHeat').style.width = (this.heat * 100) + '%';
      document.querySelectorAll('#fSide button').forEach(b => b.classList.toggle('on', inp.side === b.dataset.side));
      $('reel').textContent = this.finale ? 'TAP to land it!  (SPACE)' : 'Hold to REEL  (or hold SPACE)';
      if (this.finale) { st.textContent = 'Tap when the marker is in the GREEN!'; st.style.color = '#9cffb0'; }
      else if (m.reelBlocked && !m.leap) { st.textContent = 'Your reel is frozen!'; st.style.color = '#bff0ff'; }
      else if (m.glide) { st.textContent = 'It is coming toward you! REEL!'; st.style.color = '#9cffb0'; }
      else if (m.hideNeedle) { st.textContent = running ? 'The line is shaking…' : 'The line is still…'; st.style.color = '#ffe9a8'; }
      else if (running && this.pull) { const arrow = this.pull === 'left' ? '▶' : '◀'; st.textContent = side === 'counter' ? `Good! Pulling against it ${arrow}` : `It runs ${this.pull.toUpperCase()}! Hold ${arrow} or ease off`; st.style.color = side === 'counter' ? '#9cffb0' : '#ff9c9c'; }
      else { st.textContent = running ? "It's RUNNING! Ease off!" : "It's tired! REEL!"; st.style.color = running ? '#ff9c9c' : '#9cffb0'; }
    }
    landed() {
      const cut = (this.hits === 0 && this.maxTension < 0.9) || (this.perfectLand && this.hits <= 1) ? 'perfect' : this.hits >= 2 ? 'bruised' : 'normal';
      this.finish({ caught: true, cut, strong: this.moodId === 'strong' });
    }
    startRun() {
      this.state = 'run'; this.timer = rnd(0.9, 1.8) * (0.5 + this.stamina * 0.5) * (this.mood.run || 1); this.fakeT = 0;
      this.pull = Math.random() < 0.5 ? 'left' : 'right'; FR.sfx('splash');
    }
  }

  // ---------- input ----------
  const DIRS = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' };
  addEventListener('keydown', e => {
    if (e.repeat) return;
    if (A.nightFight) { if (e.code === 'Space' || e.code === 'KeyE') { spaceQ = true; e.preventDefault(); } if (DIRS[e.code]) dirQ = DIRS[e.code]; return; }
    if (A.mode !== 'fish') return;
    if (e.code === 'Space' || e.code === 'KeyE') { spaceQ = true; e.preventDefault(); }
    if (DIRS[e.code]) dirQ = DIRS[e.code];
    if (/^Digit[1-4]$/.test(e.code)) pickGear(Number(e.code.slice(5)));
    if (e.code === 'KeyQ') nextBait();
    if (e.code === 'KeyR') rightBait();
    if (e.code === 'KeyT') dropTrap();
  });
  const reel = $('reel');
  reel.addEventListener('pointerdown', e => { reelHeld = true; spaceQ = true; reel.setPointerCapture(e.pointerId); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => reel.addEventListener(ev, () => { reelHeld = false; }));
  let sideHeld = null;
  document.querySelectorAll('#fSide button').forEach(b => {
    b.addEventListener('pointerdown', e => { sideHeld = b.dataset.side; b.setPointerCapture(e.pointerId); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { if (sideHeld === b.dataset.side) sideHeld = null; }));
  });
  document.querySelectorAll('#fArrows .ar').forEach(b => b.addEventListener('click', () => { dirQ = b.dataset.dir; }));
  A.onSeaClick = ray => {
    if (fight || finished) return;
    const p = new THREE.Vector3();
    if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) {
      // clicking a sign you can reach casts at it; anywhere else sails there
      const sp = nearestSpot();
      if (!cast && sp && Math.hypot(p.x - sp.g.position.x, p.z - sp.g.position.z) < 6) { spaceQ = true; return; }
      steerTarget = p;
    }
  };
  $('finishBtn').addEventListener('click', () => finish());
  function nearestSpot() {
    const b = bowPos();
    return spots.filter(s => !s.dying && Math.hypot(s.g.position.x - b.x, s.g.position.z - b.z) < 12).sort((p, q) => Math.hypot(p.g.position.x - b.x, p.g.position.z - b.z) - Math.hypot(q.g.position.x - b.x, q.g.position.z - b.z))[0];
  }

  // ---------- start and finish a morning ----------
  function startMorning() {
    S = FR.state; A.setMode('fish'); A.setTime('day');
    FR.rollDay(); fday = FR.fishDayDef();
    timeLeft = C.morningSeconds; finished = false; caught = []; cast = null; fight = null; boatSpeed = 0; steerTarget = null;
    spots.forEach(s => scene.remove(s.g)); spots = []; timers = []; traps.forEach(tr => scene.remove(tr.g)); traps = [];
    ['fishHud', 'finishBtn', 'gearBar', 'minimap'].forEach(id => { $(id).hidden = false; });
    $('summary').hidden = true;
    // v4.1: start with bait on the hook if you have any (the one most fish here like)
    const needs = FR.menuNeeds();
    if (!FR.tackle()) { const sp0 = D.areas[S.area].spots, cnt = {}; Object.keys(sp0).forEach(f => { const b = D.fish[f].bait; if (b && S.baits[b] > 0) cnt[b] = (cnt[b] || 0) + sp0[f] * (needs.some(n => n.id === f) ? 4 : 1); }); const best = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0]; if (best) S.bait = best; }
    for (let i = 0; i < fday.spots; i++) spawnSpot();
    if (S.bossToday) spawnSpot(D.areas[S.area].boss);
    drawBar();
    const hot = S.hotFish ? `  ${S.journal[S.hotFish] ? D.fish[S.hotFish].name : 'Something new'} ${S.journal[S.hotFish] ? 'are' : 'is'} running.` : '';
    const needTxt = needs.length ? '\nYour menu needs: ' + needs.map(n => `${D.fish[n.id].name} (${n.lure ? D.lures[FR.lureFor(n.id)].name : D.baits[n.bait].name + ' ×' + n.have})`).join(', ') : '';
    toast((S.day === 1 ? 'Every fish bites only its own bait. Sail to a sign, press R for the right bait, SPACE to cast.' : (S.bossToday ? 'A HUGE shadow was seen under the water today!\n' : '') + fday.name + hot) + needTxt, S.bossToday ? '#ffe14d' : fday.color);
  }
  function finish() {
    if (finished || fight) return;
    finished = true;
    traps.filter(tr => tr.t <= 0).forEach(collectTrap);
    // v4.1: the Deckhand fished all morning from the other side of the skiff
    const crew = FR.crewData3d ? FR.crewData3d() : S;
    if (S.deckhand3d) {
      const lv = crew.train3d.deckhand || 1, n = Math.round(C.staffRules.deckhandCatch[lv - 1] * (C.staffRules.minMood + (1 - C.staffRules.minMood) * crew.mood3d.deckhand));
      const odds = FR.todayOdds(), ok = {}; for (const k in odds) { const f = D.fish[k]; if ((f.rarity === 'common' || f.rarity === 'uncommon') && f.gear && f.gear.some(g => S.gear[g]) && FR.canHook(k)) ok[k] = odds[k]; }
      let got = 0; for (let i = 0; i < n && S.tank.length < FR.tankCap() && Object.keys(ok).length; i++) { const id = FR.weighted(ok), sz = FR.rollSize(), f = D.fish[id];
        if (!S.lures[FR.lureFor(id)]) { S.baits[f.bait]--; if (S.baits[f.bait] <= 0) delete ok[id]; } FR.addFish(id, 'normal', sz); const j = FR.logCatch(id, sz); caught.push({ id, size: sz, cut: 'normal', first: j.first, crew: true }); got++; }
      setTimeout(() => toast(got ? `Your Deckhand caught ${got} fish this morning (using your bait).` : 'Your Deckhand had no bait for anything here. Nothing caught.', '#d0b8ff'), 200);
    }
    if (cast) endCast(false);
    spots.forEach(s => scene.remove(s.g)); spots = []; traps.forEach(tr => scene.remove(tr.g)); traps = [];
    ['fishHud', 'finishBtn', 'gearBar', 'prompt', 'minimap'].forEach(id => { $(id).hidden = true; });
    // the catch, grouped
    const list = $('sList'); list.innerHTML = '';
    const groups = {};
    caught.forEach(c => { const k = c.id + '|' + c.size; groups[k] = groups[k] || { id: c.id, size: c.size, n: 0, clean: 0 }; groups[k].n++; if (c.cut === 'perfect') groups[k].clean++; });
    Object.values(groups).forEach(gr => { const row = document.createElement('div'); row.className = 'catch'; const art = FR.fishArt[gr.id]; row.innerHTML = `<span class="cfish">${art ? `<img alt="" src="${art.toDataURL()}">` : ''}<b>${D.fish[gr.id].name}</b> · ${D.sizes[gr.size].name}${gr.clean ? ` · ${gr.clean} clean` : ''}</span><span>×${gr.n}</span>`; list.appendChild(row); });
    if (!caught.length) list.innerHTML = '<div class="catch"><span>Nothing this morning. It happens!</span></div>';
    $('sTitle').textContent = `Day ${S.day}: morning's catch`;
    $('sNote').textContent = `Fish in the tank: ${S.tank.length}/${FR.tankCap()}   ·   Money: $${S.money}`;
    $('summary').hidden = false;
    FR.save();
  }
  $('sGo').addEventListener('click', () => { $('summary').hidden = true; A.day.afternoon(); });

  // ---------- every frame ----------
  A.update = function (dt, t) {
    if (finished) return;
    // timers and the clock (slower while fighting a rare fish)
    timers = timers.filter(tm => { tm.t -= dt; if (tm.t <= 0) { tm.fn(); return false; } return true; });
    const slow = fight ? (C.fightClock[D.fish[fight.id].rarity] || 1) : 1;
    timeLeft -= dt * FR.dev.speed * slow;
    const g0 = (S.goals || []).find(g => g.when === 'morning');
    $('fhTitle').textContent = `Day ${S.day} · Morning ${Math.floor(Math.max(0, timeLeft) / 60)}:${String(Math.ceil(Math.max(0, timeLeft)) % 60).padStart(2, '0')}${slow < 1 ? '  (clock slowed)' : ''}`;
    $('fhDay').textContent = `${fday.name.split('.')[0]}${S.bossToday ? '  ·  A giant is near!' : ''}\nFish ${S.tank.length}/${FR.tankCap()}   ·   $${S.money}`;
    $('fhGoal').textContent = g0 ? 'GOAL: ' + FR.goalLine(g0) : '';
    const done = FR.goalQueue.shift(); if (done) { toast(`Goal done: ${done.text}!  Reward: ${FR.rewardText(done)}`, '#9cffb0'); FR.sfx('perfect'); }

    // signs: grow in, bob on the waves, fade away
    spots = spots.filter(sp => {
      if (!(cast && cast.sp === sp)) sp.life -= dt;
      if (sp.life <= 0) removeSpot(sp, true);
      sp.grow = Math.max(0, Math.min(1, sp.grow + (sp.dying ? -dt * 2 : dt * 2)));
      sp.g.scale.setScalar(Math.max(0.01, sp.grow));
      sp.g.position.y = A.waveAt(sp.g.position.x, sp.g.position.z, t) * 0.6;
      sp.tick(t);
      const smells = FR.baitKnown(sp.id) && FR.tackleFits(sp.id); sp.smell.visible = smells; if (smells) { sp.smell.scale.setScalar(1 + Math.sin(t * 3) * 0.06); sp.smell.material.opacity = 0.45 + Math.sin(t * 3) * 0.25; }
      if (sp.dying && sp.grow <= 0) { scene.remove(sp.g); return false; }
      return true;
    });
    traps.forEach(tr => { tr.t -= dt; tr.g.position.y = A.waveAt(tr.g.position.x, tr.g.position.z, t) * 0.6; const txt = tr.t > 0 ? Math.ceil(tr.t) + 's' : 'READY!'; if (txt !== tr.shown) { tr.shown = txt; setLabel(tr.label, txt, tr.t > 0 ? '#ffffff' : '#9cffb0'); } });

    // the fish you just landed leaps up to the boat
    if (leapFish) { leapFish.t += dt / 0.9; const k = Math.min(1, leapFish.t); leapFish.g.position.lerpVectors(leapFish.from, leapFish.to, k); leapFish.g.position.y += Math.sin(k * Math.PI) * 6; if (leapFish.g.isSprite) leapFish.g.material.rotation = (0.5 - k) * 1.5; else leapFish.g.rotation.z = (0.5 - k) * 3; if (k >= 1) { scene.remove(leapFish.g); leapFish = null; } }

    drawMap(t); stepDrops(dt);
    const K = A.keys, sideL = K.KeyA || K.ArrowLeft || sideHeld === 'left', sideR = K.KeyD || K.ArrowRight || sideHeld === 'right';
    const inp = { down: !!(K.Space || K.KeyE || reelHeld), just: spaceQ, dir: dirQ, side: sideL && !sideR ? 'left' : sideR && !sideL ? 'right' : null };
    spaceQ = false; dirQ = null;
    const prompt = $('prompt');
    if (fight) { prompt.hidden = true; fight.update(dt, inp); updateLine(t); boatSpeed *= 0.95; moveBoat(dt, t); return; }
    A.rod.rotation.x += (-0.75 - A.rod.rotation.x) * Math.min(1, dt * 6);

    if (cast) {
      updateLine(t);
      const c = cast;
      if (c.phase === 'fly') {
        c.t -= dt; const k = 1 - Math.max(0, c.t) / 0.6;
        bobber.position.lerpVectors(c.from, c.to, k); bobber.position.y += Math.sin(k * Math.PI) * 4;
        A.rod.rotation.x = -0.75 + (k < 0.25 ? -1.1 * (k / 0.25) : -1.1 + 1.6 * Math.min(1, (k - 0.25) / 0.3)); // swing back, then whip forward
        if (c.t <= 0) { c.phase = 'wait'; c.t = c.wait; FR.sfx('splash'); splash(bobber.position, 10, 0xffffff); }
        prompt.textContent = 'Casting…';
      } else if (c.phase === 'wait') {
        c.t -= dt; bobber.position.y = A.waveAt(bobber.position.x, bobber.position.z, t) * 0.6 + 0.2;
        prompt.textContent = 'Wait for the bite…';
        if (inp.just) { toast('Too early! You scared them off.', '#ffe9a8'); endCast(true); }
        else if (c.t <= 0) {
          if (c.nothing) { toast('Nothing. Not even a nibble. The school swims off.', '#ffe9a8'); endCast(true); }
          else if (c.ignore) {
            // v4.1: the fish says what it wants (by name once it is in your journal)
            const f = D.fish[c.sp.id], known = S.journal[c.sp.id], lureFor = FR.lureFor(c.sp.id), bait = D.baits[f.bait];
            const what = c.tk ? `your ${c.tk.name}` : 'your bare hook';
            S.baitSeen = S.baitSeen || {}; S.baitSeen[c.sp.id] = true; // now you know what it wants
            const have = FR.canHook(c.sp.id) ? '  You have it: press R!' : '  Buy it in the afternoon (Gear + bait).';
            toast(`${known ? 'The ' + f.name : 'Something'} sniffs ${what}… and swims off.\nIt only bites ${bait.name}${lureFor ? ' or a ' + D.lures[lureFor].name : ''}.${have}`, '#ffe9a8');
            A.react('sad', 0.7); endCast(false);
          }
          else { c.phase = 'bite'; c.t = c.window; bang.visible = true; FR.sfx('bite'); }
        }
      } else if (c.phase === 'bite') {
        c.t -= dt; bobber.position.y = A.waveAt(bobber.position.x, bobber.position.z, t) * 0.6 - 0.25 + Math.sin(t * 30) * 0.08;
        bang.position.set(bobber.position.x, 4 + Math.sin(t * 12) * 0.3, bobber.position.z);
        prompt.textContent = 'NOW! Press SPACE!';
        if (inp.just) hook();
        else if (c.t <= 0) { FR.sfx('bad'); toast('Too slow. It spat the hook.', '#ff9c9c'); endCast(true); }
      }
      prompt.hidden = !cast && !fight ? true : false;
      boatSpeed *= 0.92; moveBoat(dt, t);
    } else {
      steer(dt, t);
      const full = S.tank.length >= FR.tankCap();
      const b = bowPos();
      const trap = traps.find(tr => tr.t <= 0 && Math.hypot(tr.g.position.x - b.x, tr.g.position.z - b.z) < 8);
      const sp = nearestSpot();
      if (trap) { prompt.textContent = full ? 'The fish tank is full!' : 'SPACE: haul up the trap'; if (inp.just && !full) collectTrap(trap); }
      else if (sp) {
        const f = D.fish[sp.id], known = S.journal[sp.id];
        const tk = FR.tackle(), fits = FR.tackleFits(sp.id, tk), lureFor = FR.lureFor(sp.id), bk = FR.baitKnown(sp.id) || f.boss;
        const want = `${D.baits[f.bait].name}${lureFor ? ' or the ' + D.lures[lureFor].name : ''}`;
        const fix = fits ? '  ✓ right bait' : FR.canHook(sp.id) ? '  ✗ wrong bait: press R' : `  ✗ you have no ${D.baits[f.bait].name}`;
        const info = bk ? `${known || f.boss ? f.name : 'Unknown fish'}: bites only ${want} · use the ${D.gear[f.gear[0]].name}${fix}` : `Unknown fish. ${tk ? 'Try your ' + tk.name + '. If it refuses, it tells you what it wants.' : 'Put some bait on (Q).'}`;
        prompt.textContent = full ? 'The fish tank is full!' : `SPACE: cast with the ${D.gear[S.useGear].name}${tk ? ' + ' + tk.name : ' (no bait)'}\n${info}`;
        if (inp.just && !full) startCast(sp);
      } else prompt.textContent = spots.length ? 'Sail the front of your skiff up to a sign on the water.' : 'Looking for fish…';
      prompt.hidden = false;
    }
    if (timeLeft <= 0 && !cast) finish();
  };
  // ---------- mini map: shows THAT something is there, never what ----------
  const map = $('minimap'), mg = map.getContext('2d');
  function drawMap(t) {
    const W = 300, R = 140, range = 80, cx = boat.position.x, cz = boat.position.z, k = R / range;
    const toMap = (x, z) => [W / 2 + (x - cx) * k, W / 2 + (z - cz) * k];
    mg.clearRect(0, 0, W, W);
    mg.save(); mg.beginPath(); mg.arc(W / 2, W / 2, R + 8, 0, 7); mg.clip();
    const bg = mg.createRadialGradient(W / 2, W / 2, 10, W / 2, W / 2, R + 8); bg.addColorStop(0, '#2a8fc0'); bg.addColorStop(1, '#174f80'); mg.fillStyle = bg; mg.fillRect(0, 0, W, W);
    mg.strokeStyle = 'rgba(255,255,255,0.15)'; mg.lineWidth = 2; [0.33, 0.66].forEach(f => { mg.beginPath(); mg.arc(W / 2, W / 2, R * f, 0, 7); mg.stroke(); });
    // fishing spots: plain dots
    spots.forEach((sp, i) => {
      if (sp.dying) return;
      const [x, y] = toMap(sp.g.position.x, sp.g.position.z); if (Math.hypot(x - W / 2, y - W / 2) > R) return;
      const p = 1 + Math.sin(t * 4 + i) * 0.25;
      mg.fillStyle = 'rgba(255,255,255,0.25)'; mg.beginPath(); mg.arc(x, y, 14 * p, 0, 7); mg.fill();
      mg.fillStyle = '#ffffff'; mg.beginPath(); mg.arc(x, y, 7, 0, 7); mg.fill();
    });
    // crab traps: orange, green when ready
    traps.forEach(tr => {
      const [x, y] = toMap(tr.g.position.x, tr.g.position.z), d = Math.hypot(x - W / 2, y - W / 2);
      const s = d > R - 10 ? (R - 10) / d : 1, px = W / 2 + (x - W / 2) * s, py = W / 2 + (y - W / 2) * s;
      mg.fillStyle = tr.t <= 0 ? '#5cff8a' : '#ff8a3c'; mg.strokeStyle = '#2b2140'; mg.lineWidth = 3;
      mg.beginPath(); mg.rect(px - 8, py - 8, 16, 16); mg.fill(); mg.stroke();
    });
    // the restaurant: a house, pinned to the edge when it is far away
    {
      const [x, y] = toMap(0, 1), d = Math.hypot(x - W / 2, y - W / 2), s = d > R - 14 ? (R - 14) / d : 1, px = W / 2 + (x - W / 2) * s, py = W / 2 + (y - W / 2) * s;
      mg.fillStyle = '#ffe9a8'; mg.strokeStyle = '#2b2140'; mg.lineWidth = 3;
      mg.beginPath(); mg.moveTo(px, py - 15); mg.lineTo(px + 14, py - 2); mg.lineTo(px + 10, py - 2); mg.lineTo(px + 10, py + 12); mg.lineTo(px - 10, py + 12); mg.lineTo(px - 10, py - 2); mg.lineTo(px - 14, py - 2); mg.closePath(); mg.fill(); mg.stroke();
    }
    // you: an arrow pointing the way the skiff faces
    mg.save(); mg.translate(W / 2, W / 2); mg.rotate(-boat.rotation.y);
    mg.fillStyle = '#ff8a3c'; mg.strokeStyle = '#2b2140'; mg.lineWidth = 3;
    mg.beginPath(); mg.moveTo(0, -18); mg.lineTo(12, 14); mg.lineTo(0, 7); mg.lineTo(-12, 14); mg.closePath(); mg.fill(); mg.stroke();
    mg.restore(); mg.restore();
  }
  function updateLine(t) {
    const a = tipPos(), b = bobber.position, pos = lineGeo.attributes.position;
    const sag = fight ? 0.4 - fight.tension * 0.4 : 1.6;
    for (let i = 0; i < 16; i++) { const k = i / 15; pos.setXYZ(i, a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * sag, a.z + (b.z - a.z) * k); }
    pos.needsUpdate = true;
  }
  const BOAT_MAX = 12;
  function steer(dt, t) {
    const K = A.keys;
    let mx = (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0);
    let mz = (K.KeyS || K.ArrowDown ? 1 : 0) - (K.KeyW || K.ArrowUp ? 1 : 0);
    if (mx || mz) steerTarget = null;
    else if (steerTarget) {
      // aim the bow (not the middle of the boat) at the spot clicked
      const b = bowPos(), dx = steerTarget.x - b.x, dz = steerTarget.z - b.z, d = Math.hypot(dx, dz);
      if (d < 3) steerTarget = null; else { mx = dx / d; mz = dz / d; }
    }
    if (mx || mz) {
      const face = Math.atan2(-mx, -mz);
      let diff = face - boat.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      boat.rotation.y += diff * Math.min(1, dt * 3.4);
      boatSpeed += (BOAT_MAX * Math.max(0.15, Math.cos(diff)) - boatSpeed) * Math.min(1, dt * 1.5);
    } else boatSpeed *= 1 - Math.min(1, dt * 1.2);
    moveBoat(dt, t);
  }
  function moveBoat(dt, t) {
    const h = boat.rotation.y;
    boat.position.x = Math.max(-115, Math.min(115, boat.position.x - Math.sin(h) * boatSpeed * dt));
    boat.position.z = Math.max(-115, Math.min(115, boat.position.z - Math.cos(h) * boatSpeed * dt));
    // wake puffs behind the stern
    wakeT -= dt;
    if (boatSpeed > 2 && wakeT <= 0) {
      wakeT = 0.07; const w = wake.find(x => x.life <= 0);
      if (w) { w.life = 1; w.m.position.set(boat.position.x + Math.sin(h) * 3.8 + rnd(-0.4, 0.4), 0.25, boat.position.z + Math.cos(h) * 3.8 + rnd(-0.4, 0.4)); }
    }
    wake.forEach(w => { if (w.life > 0) { w.life -= dt * 0.7; w.m.scale.setScalar(0.5 + (1 - w.life) * 1.8); w.m.material.opacity = Math.max(0, w.life) * 0.5; w.m.position.y = A.waveAt(w.m.position.x, w.m.position.z, t) * 0.6 + 0.2; } });
  }

  A.fishing = { startMorning, finish, todayCatch: () => caught.slice() };
  A.Fight = Fight; A.fightInput = () => { const K = A.keys, sideL = K.KeyA || K.ArrowLeft || sideHeld === 'left', sideR = K.KeyD || K.ArrowRight || sideHeld === 'right'; const inp = { down: !!(K.Space || K.KeyE || reelHeld), just: spaceQ, dir: dirQ, side: sideL && !sideR ? 'left' : sideR && !sideL ? 'right' : null }; spaceQ = false; dirQ = null; return inp; };
  A.debug = { startFight: (id) => { cast = { sp: spots[0], phase: 'fight' }; fight = new Fight(id, { gear: 'heavy', baitMatch: false, onDone: r => { fight = null; cast = null; A.debug.last = r; } }); return fight; }, MOVE, spots: () => spots, fight: () => fight, cast: () => cast, finish, boat };
})();
