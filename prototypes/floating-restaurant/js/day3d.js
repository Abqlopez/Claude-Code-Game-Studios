// The day loop and its little movies (v4 step 7, redone in v4.1):
// wake up → sea chart (pick your waters) → morning fishing → afternoon → prep → opening → night service
// → closing → the chef writes the day in his journal (results) → bed.
(function () {
  const A = window.FR3D, D = FR.DATA;
  const { boat, chef } = A;
  const P = A.parts;
  const $ = id => document.getElementById(id);
  const S = () => FR.state;
  const V = (x, z) => new THREE.Vector3(x, 0, z);
  const FLOOR = A.FLOOR;
  const W = (x, y, z) => boat.localToWorld(new THREE.Vector3(x, y, z));
  const ease = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const lerp = (a, b, k) => a + (b - a) * k;

  // ---------- a tiny cutscene runner ----------
  // steps: { caption, sec } | { wait } | { walk: [points] } | { cam: [pos, look] | null, camSpeed, snap } | { camW: world [pos, look] }
  //        | { fade: 'out' | 'in' } | { fn } | { tween: sec, fn: k => } | { pose: (k, t, parts) => } (with sec or tween)
  let scene = null;
  function play(steps, finish) {
    scene = { steps: steps.slice(), finish, cur: null, t: 0, done: false };
    A.setMode('cut'); A.inputLocked = true;
    $('skipBtn').hidden = false;
    next();
  }
  function setCam(st) {
    if (st.camW) A.cam = { pos: new THREE.Vector3(...st.camW[0]), look: new THREE.Vector3(...st.camW[1]), speed: st.camSpeed, snap: st.snap };
    else if (st.cam !== undefined) A.cam = st.cam ? { pos: W(...st.cam[0]), look: W(...st.cam[1]), speed: st.camSpeed, snap: st.snap } : null;
  }
  function next() {
    const sc = scene; if (!sc) return;
    $('caption').hidden = true;
    const st = sc.cur = sc.steps.shift();
    sc.t = 0; A.pose = null;
    if (!st) { end(); return; }
    if (st.caption) { $('caption').textContent = st.caption; $('caption').hidden = false; }
    setCam(st);
    if (st.fade) { $('fader').style.opacity = st.fade === 'out' ? '1' : '0'; }
    if (st.fn && st.tween === undefined) st.fn();
    if (st.pose) A.pose = (dt, t, parts) => st.pose(st.tween ? Math.min(1, sc.t / st.tween) : sc.t, t, parts);
    if (st.walk) { A.chefPath = st.walk.map(p => V(p[0], p[1])); A.onArrive = () => { if (scene && scene.cur === st) next(); }; }
  }
  function end() {
    const sc = scene; if (!sc || sc.done) return;
    sc.done = true; scene = null;
    $('caption').hidden = true; $('skipBtn').hidden = true; A.chefPath = null; A.onArrive = null; A.cam = null; A.inputLocked = false; A.pose = null;
    sc.finish();
  }
  A.cutUpdate = function (dt) {
    const sc = scene; if (!sc || !sc.cur) return;
    const st = sc.cur; sc.t += dt;
    if (st.tween !== undefined) { if (st.fn) st.fn(ease(Math.min(1, sc.t / st.tween)), Math.min(1, sc.t / st.tween)); if (sc.t >= st.tween) next(); return; }
    const dur = st.sec !== undefined ? st.sec : st.wait !== undefined ? st.wait : st.fade ? 0.9 : st.walk ? null : 0;
    if (dur !== null && sc.t >= dur) next();
  };
  $('skipBtn').addEventListener('click', () => { if (scene) { $('fader').style.opacity = '0'; end(); } });

  // ---------- chef poses ----------
  const BED = { x: -2.05, y: FLOOR + 1.08, z: 13.4 };
  function hats(sleepy) { P.nightcap.visible = !!sleepy; P.toque.visible = !sleepy; }
  function resetProps() { A.alarm.rotation.set(0, 0, 0); A.alarm.scale.setScalar(1); A.alarm.position.y = FLOOR + 0.6; A.sunRise(null); A.roofForce = null; }
  function toBoat() { if (chef.parent !== boat) { boat.add(chef); } A.rod.visible = false; A.skiff.position.copy(A.SKIFF_HOME); A.skiff.rotation.set(0, 0, 0); }
  function lieDown() { toBoat(); chef.position.set(BED.x, BED.y, BED.z); chef.rotation.set(Math.PI / 2, -Math.PI / 2, 0); chef.scale.setScalar(0.85); hats(true); }
  function standAt(x, z, ry) { toBoat(); chef.rotation.set(0, ry || 0, 0); chef.scale.setScalar(1); chef.position.set(x, FLOOR, z); }
  // floating text over the 3D scene (Z z z, RIIING!, *sniff*)
  function floater(text, size, color) {
    const el = document.createElement('div'); el.className = 'lbl'; el.innerHTML = `<div class="tag2" style="font-size:${size || 18}px;color:${color || '#ffe9a8'}">${text}</div>`; el.style.display = 'none'; $('labels').appendChild(el);
    return { el, at: null, set(t) { el.firstChild.textContent = t; } };
  }
  const zzz = floater('Z z z', 20), ring = floater('RIIIING!', 26, '#ffe14d');
  (function floatLoop() {
    [[zzz, () => W(BED.x - 1.2, BED.y + 1.2 + Math.sin(performance.now() / 400) * 0.15, BED.z)], [ring, () => W(-3.75 + Math.sin(performance.now() / 30) * 0.05, FLOOR + 1.6, 11.75)]].forEach(([f, pos]) => {
      if (!f.on) { f.el.style.display = 'none'; return; }
      const v = pos().project(A.camera); f.el.style.display = ''; f.el.style.left = ((v.x + 1) / 2 * innerWidth) + 'px'; f.el.style.top = ((1 - v.y) / 2 * innerHeight) + 'px';
    });
    requestAnimationFrame(floatLoop);
  })();
  function sfxRepeat(name, n, gap) { for (let i = 0; i < n; i++) setTimeout(() => FR.sfx(name), i * gap); }

  const BEDROOM_CAM = [[-0.5, FLOOR + 10, 21.5], [-2.0, FLOOR + 0.5, 12.8]];
  const CLOSE_BED_CAM = [[-0.6, FLOOR + 3.6, 15.6], [-2.6, FLOOR + 0.9, 12.6]];
  const TO_BED = [[-1.2, 2.3], [-1.2, 4.2], [0.4, 7.6], [2.05, 10.4], [2.05, 12.2], [-1.4, 12.7]];

  // ---------- 1. wake up (v4.1: sunrise, snoring, the alarm, a big stretch, the hat swap, a sniff of the pot, off to the skiff) ----------
  function wake() {
    $('fader').style.opacity = '1';
    resetProps(); lieDown(); A.setTime('dawn'); A.setOpenSign(false); A.refreshTank(S().tank.map(f => D.fish[f.id].color));
    A.setTableCount(Math.min(FR.tableCount(), A.tableGroups.length)); if (FR.syncBuilt3d) FR.syncBuilt3d(); if (FR.syncDecor3d) FR.syncDecor3d();
    const first = S().day === 1;
    let stood = false;
    const standUp = () => { if (!stood) { stood = true; standAt(-1.5, 12.7, -Math.PI / 2); } };
    const sunTo = k => A.sunRise(k);
    play([
      // the sun comes up over the sea
      { camW: [[-6, 6, 34], [40, 4, -150]], snap: true, fn: () => sunTo(0) },
      { fade: 'in' },
      { caption: `Day ${S().day}. The sun peeks over the sea…`, tween: first ? 3.2 : 2.0, fn: k => sunTo(k) },
      // swoop down through the roof into the cabin
      { caption: 'Somewhere on board, someone is still asleep.', cam: [[-0.8, FLOOR + 16, 22], [-2.2, FLOOR + 0.5, 12.8]], camSpeed: 0.9, fn: () => { A.roofForce = 0.06; zzz.on = true; }, sec: 2.2 },
      { cam: CLOSE_BED_CAM, camSpeed: 1.2, caption: 'Zzz… mmm… fish tacos…', sec: 2.4, pose: (s, t, p) => { const k = (Math.sin(t * 2.4) + 1) / 2; p.torso.scale.set(1 + k * 0.05, 1, 1 + k * 0.05); p.mouth.scale.set(1, 0.3 + k, 0.6); if (Math.random() < 0.01) FR.sfx('snore'); } },
      // the alarm!
      { caption: 'RIIIIIIING!', fn: () => { zzz.on = false; ring.on = true; sfxRepeat('ring', 7, 110); }, tween: 0.9,
        pose: (k, t, p) => { A.alarm.rotation.z = Math.sin(t * 60) * 0.25; A.alarm.position.y = FLOOR + 0.6 + Math.abs(Math.sin(t * 30)) * 0.05; p.torso.scale.set(1, 1, 1); } },
      // he jolts awake and bounces out of bed
      { caption: 'WAH!', tween: 0.8, fn: (k, raw) => { chef.rotation.set(Math.PI / 2 * (1 - k), -Math.PI / 2 * (1 - k), 0); chef.scale.setScalar(0.85 + 0.15 * k); chef.position.set(lerp(BED.x, -1.5, k), lerp(BED.y, FLOOR, k) + Math.sin(raw * Math.PI) * 1.2, lerp(BED.z, 12.7, k)); if (raw >= 1) stood = true; },
        pose: (k, t, p) => { A.alarm.rotation.z = Math.sin(t * 60) * 0.25; p.shoulders[0].rotation.x = -2.6 + Math.sin(t * 30) * 0.5; p.shoulders[1].rotation.x = -2.6 - Math.sin(t * 30) * 0.5; p.hips[0].rotation.x = Math.sin(t * 25) * 0.8; p.hips[1].rotation.x = -Math.sin(t * 25) * 0.8; p.mouth.scale.set(1.3, 1.4, 0.6); } },
      // SMACK the clock
      { walk: [[-3.0, 11.35]], pose: (s, t) => { A.alarm.rotation.z = Math.sin(t * 60) * 0.25; } },
      { fn: () => { chef.rotation.y = 2.3; }, tween: 0.55, pose: (k, t, p) => {
          A.alarm.rotation.z = k < 0.6 ? Math.sin(t * 60) * 0.25 : 0;
          p.shoulders[1].rotation.x = k < 0.6 ? lerp(0, -2.8, k / 0.6) : lerp(-2.8, 1.2, Math.min(1, (k - 0.6) / 0.15));
          if (k >= 0.6 && !A.alarm.userData.smacked) { A.alarm.userData.smacked = true; ring.on = false; FR.sfx('stamp'); $('caption').textContent = 'SMACK.'; $('caption').hidden = false; }
          if (k >= 0.6) A.alarm.scale.set(1.3, lerp(0.4, 1, (k - 0.6) / 0.4), 1.3);
        } },
      { caption: '…', sec: 0.5, fn: () => { A.alarm.userData.smacked = false; A.alarm.scale.setScalar(1); A.alarm.rotation.set(0, 0, 0); } },
      // a giant stretch and yawn
      { caption: 'Yaaaaawn…', fn: () => { chef.rotation.y = 0; FR.sfx('snore'); }, cam: [[-1.4, FLOOR + 3.2, 15.0], [-2.6, FLOOR + 1.3, 11.4]], tween: 1.9, pose: (k, t, p) => {
          const up = Math.sin(Math.min(1, k * 1.3) * Math.PI / 2) * (k > 0.85 ? (1 - k) / 0.15 : 1);
          p.shoulders[0].rotation.x = -2.9 * up; p.shoulders[1].rotation.x = -2.9 * up; p.shoulders[0].rotation.z = -0.35 * up; p.shoulders[1].rotation.z = 0.35 * up;
          p.torso.rotation.x = 0.22 * up; p.head.rotation.x = -0.35 * up; p.mouth.scale.set(1.2, 0.2 + 1.6 * up, 0.6); p.torso.position.y += up * 0.08;
        } },
      // swap the nightcap for the chef's hat, with a spin
      { caption: 'Hat on…', tween: 0.8, fn: (k, raw) => { chef.rotation.y = raw * Math.PI * 2; if (raw > 0.5 && P.nightcap.visible) { hats(false); FR.sfx('pop'); } } },
      { caption: 'CHEF MODE: ON!', fn: () => { A.react('yay', 1.0); FR.sfx('perfect'); }, sec: 1.1 },
      // a sniff of last night's broth
      { sniff: 1, caption: first ? 'First, the kitchen.' : 'A quick look at the kitchen…', cam: null, walk: [[2.05, 12.2], [2.05, 10.4], [0.6, 8.75], [-0.4, 8.75]] },
      { sniff: 1, fn: () => { chef.rotation.y = Math.PI; }, caption: '*sniff sniff*', cam: [[1.6, FLOOR + 3.4, 6.0], [-0.4, FLOOR + 1.2, 9.4]], tween: 1.5, pose: (k, t, p) => { p.torso.rotation.x = -0.35 * Math.sin(k * Math.PI); p.head.rotation.x = -0.25 * Math.sin(k * Math.PI) + Math.sin(t * 18) * 0.05 * Math.sin(k * Math.PI); } },
      { sniff: 1, caption: 'Smells like a good day!', fn: () => A.react('yay', 0.8), sec: 1.0 },
      // out the door to the skiff
      { caption: 'Time to catch some fish!', cam: null, walk: [[0.4, 7.6], [-1.2, 4.2], [-1.2, 2.3], [-3.4, 1.0]] },
      { caption: 'Hup!', fn: () => { chef.rotation.y = Math.PI / 2; FR.sfx('whoosh'); }, tween: 0.75, fn2: null },
      { fade: 'out' }
    ].filter(st => !st.sniff || first || S().day % 2 === 1).map(st => {
      // the hop into the skiff (a world-space arc from the deck to the skiff's seat)
      if (st.caption === 'Time to catch some fish!' && !(first || S().day % 2 === 1)) st.walk = [[2.05, 12.2], [2.05, 10.4]].concat(st.walk);
      if (st.caption === 'Hup!') { st.fn = (k, raw) => { const a = new THREE.Vector3(-3.4, FLOOR, 1.0), b = boat.worldToLocal(A.skiff.localToWorld(new THREE.Vector3(0, 0.32, 0.25))); chef.position.lerpVectors(a, b, k); chef.position.y += Math.sin(raw * Math.PI) * 1.6; }; st.pose = (k, t, p) => { p.shoulders[0].rotation.x = -2.4; p.shoulders[1].rotation.x = -2.4; p.hips[0].rotation.x = 0.9; p.hips[1].rotation.x = -0.4; }; }
      return st;
    }), () => { zzz.on = false; ring.on = false; resetProps(); standUp(); hats(false); pickWaters(); });
  }

  // ---------- 2. the sea chart: pick where to fish (v4.1) ----------
  const MAP = { home: { x: 310, y: 360, r: 125 }, coral: { x: 660, y: 185, r: 110 } };
  const TEASE = { x: 700, y: 470, r: 80, name: 'Deep Trench', note: 'Uncharted. A bigger boat may get you there one day.' };
  const mapC = $('seaMap'), mg = mapC.getContext('2d');
  let mapSel = null, mapAnim = null, mapOpen = false;
  const areaIds = () => Object.keys(D.areas);
  const locked = id => id !== 'home' && !(S().upgrades.engine > 0);
  function islandBlob(x, y, r, seed) {
    mg.beginPath();
    for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2, rr = r * (0.75 + 0.25 * Math.sin(a * 3 + seed) * Math.cos(a * 2 + seed * 2)); mg[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.7); }
    mg.closePath(); mg.fillStyle = '#e8d29a'; mg.fill(); mg.strokeStyle = '#8a5a34'; mg.lineWidth = 3; mg.stroke();
    mg.fillStyle = '#6aa85a'; mg.beginPath(); mg.arc(x - r * 0.15, y - r * 0.1, r * 0.35, 0, 7); mg.fill();
  }
  function drawMap(t) {
    const w = 900, h = 600;
    // parchment and a blue sea wash
    const bg = mg.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, 560); bg.addColorStop(0, '#f6e7c1'); bg.addColorStop(1, '#d9bf86'); mg.fillStyle = bg; mg.fillRect(0, 0, w, h);
    mg.fillStyle = 'rgba(70,140,190,0.28)'; mg.fillRect(20, 20, w - 40, h - 40);
    mg.strokeStyle = 'rgba(90,60,30,0.18)'; mg.lineWidth = 1; for (let x = 20; x < w; x += 60) { mg.beginPath(); mg.moveTo(x, 20); mg.lineTo(x, h - 20); mg.stroke(); } for (let y = 20; y < h; y += 60) { mg.beginPath(); mg.moveTo(20, y); mg.lineTo(w - 20, y); mg.stroke(); }
    // little waves
    mg.strokeStyle = 'rgba(40,90,140,0.45)'; mg.lineWidth = 2;
    for (let i = 0; i < 40; i++) { const x = (i * 211) % 840 + 30, y = (i * 137) % 540 + 30 + Math.sin(t * 1.5 + i) * 3; mg.beginPath(); mg.moveTo(x, y); mg.quadraticCurveTo(x + 7, y - 6, x + 14, y); mg.quadraticCurveTo(x + 21, y + 6, x + 28, y); mg.stroke(); }
    islandBlob(120, 120, 50, 1); islandBlob(820, 380, 40, 2.5); islandBlob(470, 520, 34, 4); islandBlob(520, 300, 26, 6);
    // the uncharted trench, in fog
    mg.save(); mg.globalAlpha = 0.75; const fg = mg.createRadialGradient(TEASE.x, TEASE.y, 10, TEASE.x, TEASE.y, TEASE.r + 30); fg.addColorStop(0, 'rgba(30,30,60,0.8)'); fg.addColorStop(1, 'rgba(120,120,140,0)'); mg.fillStyle = fg; mg.beginPath(); mg.arc(TEASE.x, TEASE.y, TEASE.r + 30, 0, 7); mg.fill(); mg.restore();
    mg.fillStyle = '#3a2a1a'; mg.font = '22px "Lilita One", sans-serif'; mg.textAlign = 'center'; mg.fillText('??? ' + TEASE.name, TEASE.x, TEASE.y + 6);
    // the seas you can pick
    areaIds().forEach((id, i) => {
      const a = D.areas[id], m = MAP[id] || { x: 200 + i * 200, y: 300, r: 90 }, sel = mapSel === id, lk = locked(id);
      const col = '#' + a.water.toString(16).padStart(6, '0');
      mg.save();
      if (sel) { mg.shadowColor = '#ffe14d'; mg.shadowBlur = 30 + Math.sin(t * 4) * 10; }
      mg.globalAlpha = lk ? 0.45 : 0.8; mg.fillStyle = col; mg.beginPath(); mg.arc(m.x, m.y, m.r, 0, 7); mg.fill();
      mg.restore();
      mg.setLineDash([12, 8]); mg.lineDashOffset = -t * 20; mg.strokeStyle = sel ? '#ffe14d' : '#3a2a1a'; mg.lineWidth = sel ? 5 : 3; mg.beginPath(); mg.arc(m.x, m.y, m.r, 0, 7); mg.stroke(); mg.setLineDash([]);
      // a few fish jumping in it
      for (let k = 0; k < 3; k++) { const ph = (t * 0.8 + k * 0.33 + i * 0.2) % 1, fx = m.x - m.r * 0.5 + k * m.r * 0.45, fy = m.y + 20 - Math.sin(ph * Math.PI) * 26; if (ph < 0.6 && !lk) { mg.fillStyle = 'rgba(255,255,255,0.85)'; mg.beginPath(); mg.ellipse(fx, fy, 9, 4, -0.8 + ph * 2.6, 0, 7); mg.fill(); } }
      if (id === 'coral') { mg.fillStyle = '#ff8fb0'; [[-40, 30], [30, 50], [50, -20], [-20, -50]].forEach(([dx, dy]) => { mg.beginPath(); mg.arc(m.x + dx, m.y + dy, 9, 0, 7); mg.fill(); mg.beginPath(); mg.arc(m.x + dx + 8, m.y + dy - 8, 6, 0, 7); mg.fill(); }); }
      mg.fillStyle = '#fffbe8'; mg.strokeStyle = '#2b2140'; mg.lineWidth = 6; mg.font = '30px "Lilita One", sans-serif'; mg.textAlign = 'center';
      mg.strokeText(`${i + 1}. ${a.name}`, m.x, m.y - m.r - 14); mg.fillText(`${i + 1}. ${a.name}`, m.x, m.y - m.r - 14);
      if (lk) { mg.font = '42px sans-serif'; mg.fillText('🔒', m.x, m.y + 14); }
    });
    // the restaurant boat (home), and your skiff on its way
    const h0 = MAP.home;
    mg.fillStyle = '#faf3e3'; mg.strokeStyle = '#2b2140'; mg.lineWidth = 3;
    mg.beginPath(); mg.moveTo(h0.x - 26, h0.y + 4); mg.lineTo(h0.x + 26, h0.y + 4); mg.lineTo(h0.x + 18, h0.y + 18); mg.lineTo(h0.x - 18, h0.y + 18); mg.closePath(); mg.fill(); mg.stroke();
    mg.fillStyle = '#b3262b'; mg.fillRect(h0.x - 12, h0.y - 10, 24, 14); mg.strokeRect(h0.x - 12, h0.y - 10, 24, 14);
    mg.fillStyle = '#3a2a1a'; mg.font = '16px "Fredoka", sans-serif'; mg.fillText('your restaurant', h0.x, h0.y + 38);
    if (mapSel && MAP[mapSel]) {
      const to = MAP[mapSel], k = mapAnim ? Math.min(1, mapAnim.t / 1.4) : 0;
      const cx = (h0.x + to.x) / 2, cy = Math.min(h0.y, to.y) - 70;
      // dotted route
      mg.setLineDash([4, 10]); mg.strokeStyle = '#a3302a'; mg.lineWidth = 4; mg.beginPath(); mg.moveTo(h0.x, h0.y); mg.quadraticCurveTo(cx, cy, to.x, to.y); mg.stroke(); mg.setLineDash([]);
      if (mapSel !== 'home') { mg.font = '34px sans-serif'; mg.fillText('✕', to.x, to.y + 12); }
      // the skiff
      const q = ease(k), bx = (1 - q) * (1 - q) * h0.x + 2 * (1 - q) * q * cx + q * q * to.x, by = (1 - q) * (1 - q) * h0.y + 2 * (1 - q) * q * cy + q * q * to.y;
      mg.save(); mg.translate(bx + (mapSel === 'home' ? 40 : 0), by - 6 + Math.sin(t * 6) * 2); mg.fillStyle = '#ff8a3c'; mg.beginPath(); mg.moveTo(-14, 0); mg.lineTo(14, 0); mg.lineTo(8, 9); mg.lineTo(-8, 9); mg.closePath(); mg.fill(); mg.stroke(); mg.fillStyle = '#fff'; mg.beginPath(); mg.moveTo(0, -2); mg.lineTo(0, -20); mg.lineTo(12, -4); mg.closePath(); mg.fill(); mg.stroke(); mg.restore();
    }
    // compass rose
    mg.save(); mg.translate(820, 90); mg.rotate(Math.sin(t * 0.5) * 0.05);
    mg.fillStyle = '#a3302a'; mg.beginPath(); mg.moveTo(0, -46); mg.lineTo(9, 0); mg.lineTo(-9, 0); mg.fill();
    mg.fillStyle = '#3a2a1a'; mg.beginPath(); mg.moveTo(0, 46); mg.lineTo(9, 0); mg.lineTo(-9, 0); mg.fill(); mg.beginPath(); mg.moveTo(-46, 0); mg.lineTo(0, 8); mg.lineTo(0, -8); mg.fill(); mg.beginPath(); mg.moveTo(46, 0); mg.lineTo(0, 8); mg.lineTo(0, -8); mg.fill();
    mg.font = '18px "Lilita One", sans-serif'; mg.fillText('N', 0, -52); mg.restore();
    // frame
    mg.strokeStyle = '#6a3f22'; mg.lineWidth = 8; mg.strokeRect(4, 4, w - 8, h - 8);
  }
  function mapCard() {
    const st = S(), id = mapSel, a = D.areas[id], lk = locked(id);
    const fish = Object.keys(a.spots).concat(Object.keys(a.night || {})).filter((f, i, arr) => arr.indexOf(f) === i && !D.fish[f].boss);
    const known = fish.filter(f => st.journal[f]).length;
    const ready = fish.filter(f => FR.canHook(f)).map(f => D.fish[f].name), fav = ready.length ? `You have bait for: ${ready.join(', ')}` : 'You have no bait for anything here!';
    let h = `<h3>${a.name}</h3>`;
    h += `<div>${known} of ${fish.length} kinds of fish found here${id === st.area ? '<br>You fished here last.' : ''}</div>`;
    h += `<div class="fishes">${fish.map(f => `<img alt="${st.journal[f] ? D.fish[f].name : 'unknown fish'}" title="${st.journal[f] ? D.fish[f].name : '???'}" src="${FR.fishSrc(f)}" style="${st.journal[f] ? '' : 'filter:brightness(0) opacity(0.4)'}">`).join('')}</div>`;
    h += `<div><b>Bait:</b> ${fav}</div>`;
    if (a.boss) h += `<div>Locals talk of a giant catfish in these waters.</div>`;
    const guests = Object.keys(a.species).map(s => D.species[s].name).join(', ');
    h += `<div><b>Guests from here:</b> ${guests}</div>`;
    if (lk) h += `<div class="lock">Locked: buy the Boat engine upgrade ($${D.upgrades.find(u => u.id === 'engine').prices[0]}) to sail here.</div>`;
    h += `<button type="button" id="sailBtn"${lk ? ' disabled' : ''}>Set sail ▶</button>`;
    $('mapCard').innerHTML = h;
    const b = $('sailBtn'); if (b) b.onclick = sail;
  }
  function selectSea(id) { if (!D.areas[id] || mapAnim) return; mapSel = id; FR.sfx('click'); mapCard(); }
  function sail() {
    if (!mapSel || locked(mapSel) || mapAnim) return;
    mapAnim = { t: 0 }; FR.sfx('whoosh');
    $('sailBtn').disabled = true;
  }
  function mapLoop(now) {
    if (!mapOpen) return;
    const t = now / 1000;
    if (mapAnim) {
      mapAnim.t = mapAnim.t0 === undefined ? (mapAnim.t0 = now, 0) : (now - mapAnim.t0) / 1000;
      if (mapAnim.t > 1.6) {
        mapOpen = false; mapAnim = null; $('waters').hidden = true; A.cam = null;
        S().area = mapSel; A.fishing.startMorning();
        return;
      }
    }
    drawMap(t);
    requestAnimationFrame(mapLoop);
  }
  mapC.addEventListener('click', e => {
    const r = mapC.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 900, y = (e.clientY - r.top) / r.height * 600;
    const hit = areaIds().find(id => MAP[id] && Math.hypot(MAP[id].x - x, MAP[id].y - y) < MAP[id].r);
    if (hit) selectSea(hit);
    else if (Math.hypot(TEASE.x - x, TEASE.y - y) < TEASE.r) { FR.sfx('bad'); $('mapCard').innerHTML = `<h3>??? ${TEASE.name}</h3><div>${TEASE.note}</div>`; mapSel = null; }
  });
  addEventListener('keydown', e => {
    if (!mapOpen) return;
    const n = /^Digit([1-9])$/.exec(e.code); if (n) selectSea(areaIds()[Number(n[1]) - 1]);
    if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); sail(); }
  });
  function pickWaters() {
    $('fader').style.opacity = '0';
    A.setMode('walk'); $('walkHud').hidden = true; A.setTime('day');
    // look out over the water from behind the skiff while you choose
    A.cam = { pos: new THREE.Vector3(-14, 9, 22), look: new THREE.Vector3(-8, 0, 2) };
    mapSel = S().area && !locked(S().area) ? S().area : 'home';
    mapCard(); $('waters').hidden = false; mapOpen = true; mapAnim = null;
    requestAnimationFrame(mapLoop);
  }

  // ---------- 3. afternoon: sail home, put the catch in the tank, then prep ----------
  function afternoon() {
    $('fader').style.opacity = '1';
    setTimeout(() => {
      A.setMode('cut'); standAt(-3.4, 1.0, Math.PI / 2); A.setTime('afternoon');
      const n = S().tank.length;
      play([
        { cam: null, fade: 'in' },
        { caption: 'Afternoon. Back home with the catch.', walk: [[-1.2, 2.3], [-1.2, 4.2], [-3.1, 5.6], [-3.2, 6.3]] },
        { fn: () => { chef.rotation.y = Math.PI / 2; A.refreshTank(S().tank.map(f => D.fish[f.id].color)); FR.sfx('splash'); }, caption: n ? 'Into the tank they go!' : 'Nothing to put in the tank today…', tween: 1.4,
          pose: (k, t, p) => { if (n) { p.shoulders[0].rotation.x = 1.4 - Math.sin(k * Math.PI * 3) * 0.6; p.shoulders[1].rotation.x = 1.4 - Math.cos(k * Math.PI * 3) * 0.6; } else { p.torso.rotation.x = 0.3; p.head.rotation.x = 0.4; } } },
        { caption: "Now let's plan tonight's menu.", sec: 1.2 }
      ], () => { standAt(-3.2, 6.3, Math.PI / 2); A.setMode('cut'); A.inputLocked = true; A.prep.open(); });
    }, 850);
  }

  // ---------- 4. opening ----------
  function opening() {
    play([
      { caption: 'Evening. Lanterns on, sign out…', fn: () => A.setTime('dusk'), walk: [[-1.2, 4.2], [-1.2, 2.3], [2.6, 2.4]] },
      { fn: () => { chef.rotation.y = -Math.PI / 2; A.setOpenSign(true); FR.sfx('perfect'); A.setTime('night'); A.react('yay', 1); }, caption: 'Open for dinner!', cam: [[6.5, FLOOR + 3.5, 5.0], [3.2, FLOOR + 1.4, 2.6]], sec: 1.8 }
    ], () => { A.setTime('night'); A.setOpenSign(true); standAt(2.6, 2.4, -Math.PI / 2); A.setMode('night'); A.inputLocked = false; A.service.startNight(); });
  }

  // ---------- 5. closing, then the journal (v4.1) ----------
  let lastRes = null;
  const DESK_SEAT = [3.2, 12.5];
  function closing(res) {
    const fromKitchen = chef.position.z > A.WALL_Z;
    play([
      { caption: "Last guest gone. That's a wrap!", walk: fromKitchen ? [[-1.2, 4.0], [-1.2, 2.3], [2.6, 2.4]] : [[2.6, 2.4]] },
      { fn: () => { chef.rotation.y = -Math.PI / 2; A.setOpenSign(false); FR.sfx('click'); }, caption: 'Closed for the night.', sec: 1.3 },
      { caption: 'Time to write it all down…', walk: [[-1.2, 2.3], [-1.2, 4.2], [0.4, 7.6], [2.05, 10.4], [2.05, 12.2], [DESK_SEAT[0] - 0.6, 12.2], DESK_SEAT] },
      { fn: () => { chef.rotation.y = -Math.PI / 2; }, cam: [[1.4, FLOOR + 3.3, 14.4], [3.9, FLOOR + 0.9, 12.5]], camSpeed: 1.4, tween: 0.6, pose: (k, t, p) => { sitPose(p, k); } },
      // he opens the journal, licks the pencil and starts to write
      { caption: 'Dear journal…', fn: () => { FR.sfx('pop'); }, cam: [[2.6, FLOOR + 2.2, 13.6], [3.9, FLOOR + 0.9, 12.45]], camSpeed: 1.2, sec: 2.2, pose: (s, t, p) => {
          sitPose(p, 1); A.book.scale.setScalar(1 + Math.max(0, Math.sin(Math.min(1, s / 0.4) * Math.PI)) * 0.25);
          if (s < 0.7) { p.shoulders[1].rotation.x = 2.2; p.head.rotation.x = -0.1; p.mouth.scale.set(1, 0.8, 0.6); }
          else { p.shoulders[1].rotation.x = 1.0 + Math.sin(t * 22) * 0.12; p.shoulders[1].rotation.z = 0.2 + Math.cos(t * 17) * 0.12; p.head.rotation.x = 0.3; if (Math.random() < 0.08) FR.sfx('scribble'); }
        } }
    ], () => { A.setOpenSign(false); sitAtDesk(); showJournal(res); });
  }
  function sitPose(p, k) { p.hips[0].rotation.x = p.hips[1].rotation.x = 1.4 * k; chef.position.y = FLOOR - 0.12 * k; p.shoulders[0].rotation.x = p.shoulders[1].rotation.x = 1.0 * k; }
  function sitAtDesk() {
    standAt(DESK_SEAT[0], DESK_SEAT[1], -Math.PI / 2);
    A.setMode('cut'); A.inputLocked = true; A.roofForce = 0.06;
    A.cam = { pos: W(1.4, FLOOR + 3.3, 14.4), look: W(3.9, FLOOR + 0.9, 12.5), speed: 1.4 };
    // writing: the right hand scribbles while the quill moves
    A.pose = (dt, t, p) => { sitPose(p, 1); if (writing) { p.shoulders[1].rotation.x = 1.0 + Math.sin(t * 22) * 0.12; p.shoulders[1].rotation.z = 0.2 + Math.cos(t * 17) * 0.12; p.head.rotation.x = 0.25; } };
  }

  // ---------- the journal: the day's results, written out line by line ----------
  let writing = false, jobs = [], jSkip = false;
  const money = n => (n < 0 ? '-$' + (-n) : '$' + n);
  function showJournal(res) {
    const r = lastRes = FR.endDay(res), st = S();
    const L = r.ledger, income = L.sales + L.tips + L.raw + L.rewards, costs = L.ingredients + L.bait + L.plates + (L.wages || 0), profit = income - costs;
    const catchList = (A.fishing.todayCatch && A.fishing.todayCatch()) || [];
    const left = [], right = [];
    const ln = (arr, html, o) => arr.push(Object.assign({ html }, o || {}));
    // left page: the morning
    ln(left, `<h4>Day ${r.day}</h4>`);
    ln(left, `${D.areas[st.area] ? D.areas[st.area].name : ''} · ${(FR.fishDayDef().name || '').split('.')[0]}`);
    ln(left, '<b>This morning I caught:</b>');
    const groups = {};
    catchList.forEach(c => { const k = c.id; groups[k] = groups[k] || { id: c.id, n: 0, first: false, best: c.size }; groups[k].n++; if (c.first) groups[k].first = true; if (D.sizes[c.size].rank > D.sizes[groups[k].best].rank) groups[k].best = c.size; });
    const gl = Object.values(groups);
    if (!gl.length) ln(left, 'Not a single fish. Tomorrow, then.');
    gl.forEach(g => ln(left, `<span class="fishrow"><img alt="" src="${FR.fishSrc(g.id)}"> ${D.fish[g.id].name} ×${g.n}${g.best !== 'normal' ? ` (best: ${D.sizes[g.best].name})` : ''}${g.first ? '<span class="stamp">NEW!</span>' : ''}</span>`, { stamp: g.first }));
    (r.goals || []).filter(g => g.when === 'morning').forEach(g => ln(left, `${g.done ? '✓' : '✗'} Goal: ${g.text}`));
    const jIds = D.areas.home.journal.concat(st.area === 'home' ? [] : D.areas[st.area].journal);
    ln(left, `Fish journal: ${jIds.filter(id => st.journal[id]).length} of ${jIds.length} found.`);
    if (r.spoiled.length) ln(left, `Spoiled in the tank: ${r.spoiled.join(', ')}`);
    // right page: the night
    ln(right, '<h4>Tonight\'s service</h4>');
    ln(right, `Served ${r.served} · walked out ${r.walked}${r.turned ? ` · stayed home ${r.turned}` : ''}`);
    [['Dishes sold', L.sales], ['Tips' + (r.bestCombo >= 2 ? ` (best combo ×${r.bestCombo})` : ''), L.tips], ['Journal + rewards', L.rewards], ['Ingredients', -L.ingredients], ['Bait + plates' + (r.broken ? ` (${r.broken} broke)` : ''), -L.bait - L.plates], ['Staff wages', -(L.wages || 0)]]
      .filter(([, v]) => v !== 0).forEach(([n, v]) => ln(right, `${n} <span class="money ${v < 0 ? 'neg' : 'pos'}" data-n="${v}">${money(0)}</span>`));
    ln(right, `<div class="total">Profit <span class="money ${profit < 0 ? 'neg' : 'pos'}" data-n="${profit}">${money(0)}</span>${profit > 0 ? '<span class="stamp">PROFIT!</span>' : ''}</div>`, { stamp: profit > 0 });
    if (L.invest) ln(right, `Spent on the boat: $${L.invest}`);
    ln(right, `Rating ${'★'.repeat(Math.round(r.rating))}${'☆'.repeat(5 - Math.round(r.rating))} ${r.rating.toFixed(1)}${r.reviews.length ? ' · reviews ' + r.reviews.slice(0, 12).map(n => n + '★').join(' ') : ''}`);
    (r.goals || []).filter(g => g.when === 'night').forEach(g => ln(right, `${g.done ? '✓' : '✗'} Goal: ${g.text}`));
    r.events.forEach(e => ln(right, `• ${e}`));
    ln(right, `Tomorrow: ${FR.customersTonight()} guests booked. Purse: $${st.money}.`);
    const needs = FR.menuNeeds();
    if (needs.length) ln(right, `Bait for tomorrow's menu: ${needs.map(n => `${D.fish[n.id].name} → ${n.lure ? D.lures[FR.lureFor(n.id)].name : D.baits[n.bait].name + ' ×' + n.have}`).join(', ')}`);
    ln(right, '<span class="stamp">SAVED</span>', { stamp: true });
    $('jLeft').innerHTML = left.map(x => `<div class="ln">${x.html}</div>`).join('');
    $('jRight').innerHTML = right.map(x => `<div class="ln">${x.html}</div>`).join('');
    $('journalBook').hidden = false; $('rGo2').hidden = true; $('jSkip').hidden = false;
    FR.sfx('pop');
    // write each line in turn
    jobs = [...$('jLeft').querySelectorAll('.ln'), ...$('jRight').querySelectorAll('.ln')];
    writing = true; jSkip = false;
    let i = 0;
    const quill = $('quill');
    const nextLine = () => {
      if (i >= jobs.length) { writing = false; quill.style.opacity = '0'; $('jSkip').hidden = true; $('rGo2').hidden = false; $('rGo2').focus(); return; }
      const el = jobs[i++], book = $('journalBook').querySelector('.jbook').getBoundingClientRect(), r2 = el.getBoundingClientRect();
      el.classList.add('on');
      quill.style.opacity = '1'; quill.style.left = (r2.left - book.left + Math.min(r2.width, 340)) + 'px'; quill.style.top = (r2.top - book.top - 30) + 'px';
      el.querySelectorAll('[data-n]').forEach(m => countUp(m, Number(m.dataset.n)));
      const stamp = el.querySelector('.stamp');
      if (stamp) setTimeout(() => { stamp.classList.add('on'); FR.sfx('stamp'); }, jSkip ? 0 : 280);
      else FR.sfx('scribble');
      setTimeout(nextLine, jSkip ? 20 : el.querySelector('h4') ? 450 : 330);
    };
    setTimeout(nextLine, 650);
  }
  function countUp(el, n) {
    const t0 = performance.now(), dur = jSkip ? 1 : 500;
    (function tick(now) { const k = Math.min(1, (now - t0) / dur); el.textContent = money(Math.round(n * ease(k))); if (k < 1) requestAnimationFrame(tick); })(t0);
  }
  $('jSkip').addEventListener('click', () => { jSkip = true; });
  $('rGo2').addEventListener('click', () => { $('journalBook').hidden = true; writing = false; A.pose = null; sleep(); });
  addEventListener('keydown', e => { if (!$('journalBook').hidden && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE')) { e.preventDefault(); if (writing) jSkip = true; else $('rGo2').click(); } });

  // ---------- 6. bed ----------
  function sleep() {
    const from = chef.position, inCabin = from.z > A.KEND;
    const path = inCabin ? [[DESK_SEAT[0] - 0.6, 12.2], [-1.4, 12.7]] : (from.z < A.WALL_Z ? [[from.x > 0 ? 2.6 : from.x, 2.0]] : []).concat(TO_BED);
    chef.position.y = FLOOR;
    play([
      { caption: 'What a day. Time for bed.', cam: inCabin ? CLOSE_BED_CAM : null, walk: path },
      { caption: '*yawn*', fn: () => { chef.rotation.y = Math.PI / 2; }, tween: 0.9, pose: (k, t, p) => { p.mouth.scale.set(1.1, 0.2 + Math.sin(k * Math.PI) * 1.4, 0.6); p.shoulders[0].rotation.x = -1.2 * Math.sin(k * Math.PI); } },
      { cam: BEDROOM_CAM, fn: (k, raw) => { if (raw > 0.3 && !P.nightcap.visible) { hats(true); FR.sfx('pop'); } chef.rotation.set(Math.PI / 2 * k, -Math.PI / 2 * k, 0); chef.scale.setScalar(1 - 0.15 * k); chef.position.set(-1.4 + (BED.x + 1.4) * k, FLOOR + (BED.y - FLOOR) * k + Math.sin(raw * Math.PI) * 0.5, 12.7 + (BED.z - 12.7) * k); }, tween: 1.0 },
      { fn: () => { zzz.on = true; A.setTime('night'); }, caption: 'Good night, chef.', sec: 2.4, pose: (s, t, p) => { const k = (Math.sin(t * 2.4) + 1) / 2; p.mouth.scale.set(1, 0.3 + k, 0.6); } },
      { fade: 'out' }
    ], () => { zzz.on = false; A.roofForce = null; wake(); });
  }

  A.day = { wake, pickWaters, afternoon, opening, closing, sleep, last: () => lastRes, scene: () => scene, selectSea, sail };
  // ---------- title screen: Continue or New game ----------
  function showTitle() {
    const hasSave = !!FR.load() && (S().day > 1 || Object.keys(S().journal).length > 0);
    A.setMode('cut'); A.inputLocked = true; A.setTime('dusk'); A.setOpenSign(true);
    A.setTableCount(Math.min(FR.tableCount(), A.tableGroups.length)); if (FR.syncBuilt3d) FR.syncBuilt3d(); if (FR.syncDecor3d) FR.syncDecor3d();
    $('tContinue').hidden = !hasSave;
    if (hasSave) $('tContinue').textContent = `Continue  (Day ${S().day}, $${S().money})`;
    $('tNote').textContent = 'v4.1 · WASD or arrows to move · E or SPACE to act · works with a mouse or touch too';
    $('title').hidden = false;
    // the camera slowly circles the boat behind the menu
    let a = 0;
    (function orbit() {
      if ($('title').hidden) return;
      a += 0.002;
      A.cam = { pos: W(Math.sin(a) * 30, 22, 8 + Math.cos(a) * 30), look: W(0, FLOOR, 0) };
      requestAnimationFrame(orbit);
    })();
  }
  let confirmNew = false;
  $('tNew').addEventListener('click', () => {
    const hasSave = !$('tContinue').hidden;
    if (hasSave && !confirmNew) { confirmNew = true; $('tNew').textContent = 'Tap again to start over (your save is erased)'; return; }
    FR.state = FR.newState(); FR.save();
    $('title').hidden = true; A.cam = null; FR.sfx('click'); wake();
  });
  $('tContinue').addEventListener('click', () => { $('title').hidden = true; A.cam = null; FR.sfx('click'); wake(); });
  setTimeout(showTitle, 300);
})();
