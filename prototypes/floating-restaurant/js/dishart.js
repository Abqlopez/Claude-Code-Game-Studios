// The v3 dish pictures (and plain pictures for recipes that never had one), copied from the 2D game.
// FR.dishArt[recipeId] is a 128 x 128 canvas (the 2D game's 64 x 64 art at double size).
(function () {
  const D = FR.DATA;
  const OUT = '#2b2140';
  const hex = n => '#' + n.toString(16).padStart(6, '0');
  function fs(c, fill, stroke, lw) {
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke !== null) { c.strokeStyle = stroke || OUT; c.lineWidth = lw || 3; c.stroke(); }
  }
  function lin(c, x0, y0, x1, y1, stops) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s));
    return g;
  }
  function glow(c, x, y, r, color) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  }
  function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); }
  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function poly(c, pts) { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); }
  function line(c, pts, color, lw) { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = color || OUT; c.lineWidth = lw || 2; c.stroke(); }
  function eye(c, x, y, r) {
    ell(c, x, y, r, r); fs(c, '#ffffff', OUT, 2);
    ell(c, x + r * 0.25, y, r * 0.55, r * 0.55); fs(c, OUT, null);
    ell(c, x + r * 0.5, y - r * 0.3, r * 0.22, r * 0.22); fs(c, '#ffffff', null);
  }
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---------- fish (128 x 72, facing right) ----------
  function fishBody(c, cx, cy, L, H) {
    c.beginPath();
    c.moveTo(cx + L / 2, cy);
    c.bezierCurveTo(cx + L * 0.3, cy - H * 0.72, cx - L * 0.25, cy - H * 0.6, cx - L / 2, cy);
    c.bezierCurveTo(cx - L * 0.25, cy + H * 0.6, cx + L * 0.3, cy + H * 0.72, cx + L / 2, cy);
    c.closePath();
  }
  function drawFish(c, o) {
    const cx = 70, cy = 36, L = o.L, H = o.H, bx = cx - L / 2, T = o.tail;
    // tail
    c.beginPath();
    c.moveTo(bx + 8, cy);
    c.quadraticCurveTo(bx - T * 0.4, cy - T * 0.25, bx - T, cy - T * 0.85);
    c.quadraticCurveTo(bx - T * (o.fork || 0.45), cy, bx - T, cy + T * 0.85);
    c.quadraticCurveTo(bx - T * 0.4, cy + T * 0.25, bx + 8, cy);
    c.closePath(); fs(c, o.fin);
    // dorsal + belly fins
    c.beginPath();
    c.moveTo(cx + L * 0.14, cy - H * 0.42);
    c.quadraticCurveTo(cx - L * 0.02, cy - H * 0.5 - o.dorsal, cx - L * 0.28, cy - H * 0.34);
    c.closePath(); fs(c, o.fin);
    poly(c, [[cx, cy + H * 0.42], [cx - L * 0.12, cy + H * 0.5 + o.dorsal * 0.5], [cx - L * 0.2, cy + H * 0.36]]); fs(c, o.fin);
    // body
    fishBody(c, cx, cy, L, H);
    fs(c, lin(c, 0, cy - H / 2, 0, cy + H / 2, [o.top, o.top, o.belly]));
    if (o.pattern) {
      c.save(); fishBody(c, cx, cy, L, H); c.clip(); o.pattern(c, cx, cy, L, H); c.restore();
      fishBody(c, cx, cy, L, H); fs(c, null);
    }
    // gill, side fin, face
    c.globalAlpha = 0.45; c.beginPath(); c.arc(cx + L * 0.2, cy, H * 0.3, -1, 1); c.strokeStyle = OUT; c.lineWidth = 2; c.stroke(); c.globalAlpha = 1;
    c.beginPath(); c.moveTo(cx + L * 0.1, cy + H * 0.06); c.quadraticCurveTo(cx - L * 0.04, cy + H * 0.42, cx - L * 0.12, cy + H * 0.1); c.closePath(); fs(c, o.fin, OUT, 2);
    eye(c, cx + L * 0.33, cy - H * 0.1, o.eye || 5);
    line(c, [[cx + L / 2 - 2, cy + 3], [cx + L / 2 - 10, cy + 5]], OUT, 2);
    if (o.after) o.after(c, cx, cy, L, H);
  }

  function plate(c, rim) {
    ell(c, 32, 40, 29, 19); fs(c, 'rgba(0,0,0,0.18)', null);
    ell(c, 32, 37, 29, 19); fs(c, rim || '#ffffff');
    ell(c, 32, 36, 21, 13); fs(c, '#eef2f5', '#c9d3da', 1.5);
  }
  function miniFish(c, x, y, s, col, rot) {
    c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(s, s);
    poly(c, [[-14, 0], [-22, -7], [-22, 7]]); fs(c, col, OUT, 2);
    ell(c, 0, 0, 16, 7); fs(c, col, OUT, 2);
    ell(c, 9, -2, 1.6, 1.6); fs(c, OUT, null);
    c.restore();
  }
  const DISH1 = {
    grilled_sardine: c => {
      plate(c);
      miniFish(c, 30, 35, 1.15, '#c9a36a', -0.15);
      for (let i = 0; i < 4; i++) line(c, [[20 + i * 6, 29], [17 + i * 6, 40]], '#5b3a1a', 2);
      poly(c, [[44, 40], [54, 36], [52, 46]]); fs(c, '#ffe14d', OUT, 2);
    },
    glowgill_tacos: c => {
      plate(c);
      [[22, 0], [40, 2]].forEach(([x, dy]) => {
        c.beginPath(); c.arc(x, 40 + dy, 12, Math.PI, 0); c.closePath(); fs(c, '#ffcf5c', OUT, 2);
        c.beginPath(); c.arc(x, 39 + dy, 8, Math.PI, 0); c.closePath(); fs(c, '#7dffb0', null);
        [[-5, -3], [0, -5], [5, -2]].forEach(([a, b]) => { ell(c, x + a, 38 + dy + b, 2, 2); fs(c, '#ff5b5b', null); });
      });
    },
    kelp_wrap: c => {
      plate(c);
      [[22, 34], [36, 38], [46, 31]].forEach(([x, y]) => {
        rr(c, x - 7, y - 8, 14, 16, 5); fs(c, '#2f9e5b', OUT, 2);
        ell(c, x, y - 7, 6, 3.5); fs(c, '#ffffff', OUT, 1.5);
        ell(c, x, y - 7, 2, 1.5); fs(c, '#ff9a5c', null);
      });
    },
    thunder_eel_soup: c => {
      ell(c, 32, 48, 24, 8); fs(c, 'rgba(0,0,0,0.18)', null);
      c.beginPath(); c.moveTo(6, 32); c.quadraticCurveTo(10, 58, 32, 58); c.quadraticCurveTo(54, 58, 58, 32); c.closePath(); fs(c, '#3d6fb5');
      ell(c, 32, 32, 26, 10); fs(c, '#ffe07a');
      line(c, [[18, 32], [24, 29], [30, 34], [36, 29], [44, 33]], '#c98a00', 4);
      ell(c, 42, 34, 3, 2); fs(c, '#2f9e5b', null); ell(c, 22, 35, 3, 2); fs(c, '#ff7a3c', null);
      [[24, 0], [34, -3], [42, 1]].forEach(([x, dy]) => { c.beginPath(); c.moveTo(x, 20 + dy); c.quadraticCurveTo(x - 5, 14 + dy, x, 9 + dy); c.quadraticCurveTo(x + 4, 5 + dy, x, 2 + dy); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2.5; c.stroke(); });
    },
    tuna_sushi: c => {
      plate(c, '#2e3350');
      ell(c, 32, 36, 21, 13); fs(c, '#3b4266', null);
      [[20, 36], [33, 32], [45, 38]].forEach(([x, y]) => {
        rr(c, x - 7, y - 3, 14, 9, 4); fs(c, '#ffffff', OUT, 2);
        rr(c, x - 8, y - 8, 16, 8, 4); fs(c, '#e8344e', OUT, 2);
        line(c, [[x - 4, y - 6], [x + 3, y - 3]], '#ff9aa8', 1.5);
      });
    },
    seafood_platter: c => {
      ell(c, 32, 41, 30, 19); fs(c, 'rgba(0,0,0,0.18)', null);
      ell(c, 32, 38, 30, 19); fs(c, '#d8b06a');
      ell(c, 32, 37, 24, 14); fs(c, '#f3dca8', '#b98d45', 1.5);
      miniFish(c, 24, 32, 0.85, '#8fb4e8', -0.3);
      miniFish(c, 40, 34, 0.85, '#ff9a8a', 0.25);
      miniFish(c, 30, 43, 0.8, '#ffd23c', 0.05);
      ell(c, 48, 44, 4, 4); fs(c, '#ffe14d', OUT, 1.5);
      ell(c, 16, 42, 3, 3); fs(c, '#2f9e5b', null);
    },
    dragon_koi_feast: c => {
      glow(c, 32, 34, 32, 'rgba(255,210,90,0.6)');
      ell(c, 32, 41, 30, 19); fs(c, 'rgba(0,0,0,0.18)', null);
      ell(c, 32, 38, 30, 19); fs(c, lin(c, 0, 20, 0, 58, ['#ffe98a', '#e0a020']));
      ell(c, 32, 37, 23, 13); fs(c, '#fff6d6', '#c98a00', 1.5);
      c.beginPath(); c.arc(32, 36, 11, 0.4, 5.4); c.strokeStyle = OUT; c.lineWidth = 11; c.stroke();
      c.beginPath(); c.arc(32, 36, 11, 0.4, 5.4); c.strokeStyle = '#ff7a1f'; c.lineWidth = 7; c.stroke();
      c.beginPath(); c.arc(32, 36, 11, 1.2, 2.2); c.strokeStyle = '#ffffff'; c.lineWidth = 7; c.stroke();
      ell(c, 42, 31, 1.6, 1.6); fs(c, OUT, null);
      [[12, 22], [52, 20], [54, 50]].forEach(([x, y]) => { line(c, [[x - 4, y], [x + 4, y]], '#ffffff', 2); line(c, [[x, y - 4], [x, y + 4]], '#ffffff', 2); });
    },
    live: c => {
      glow(c, 32, 34, 30, 'rgba(180,107,255,0.5)');
      line(c, [[40, 4], [40, 34]], '#ffffff', 2);
      c.beginPath(); c.arc(32, 34, 8, 0, Math.PI); c.strokeStyle = '#dfe6ea'; c.lineWidth = 4; c.stroke();
      miniFish(c, 26, 46, 1.1, '#7dffb0', -0.6);
      [[14, 18], [52, 22]].forEach(([x, y]) => { line(c, [[x - 5, y], [x + 5, y]], '#ffe14d', 2.5); line(c, [[x, y - 5], [x, y + 5]], '#ffe14d', 2.5); });
    }
  };
  const DISH2 = {
    // v4.2: a grilled fish with grill marks, lemon and a little chalkboard flag
    catch_of_the_day: c => {
      plate(c);
      miniFish(c, 31, 37, 1.15, '#d9a060', -0.12);
      [-6, 0, 6].forEach(dx => line(c, [[30 + dx - 3, 32], [30 + dx + 3, 42]], '#6a3a1a', 1.8));
      ell(c, 49, 44, 4.5, 4.5); fs(c, '#ffe14d', OUT, 1.5); line(c, [[46, 44], [52, 44]], '#e8c020', 1);
      line(c, [[50, 12], [50, 30]], '#8a5a34', 2);
      rr(c, 38, 10, 22, 12, 2); fs(c, '#2b3a33', '#8a5a34', 2);
      line(c, [[41, 14], [47, 14]], '#ffffff', 1.2); line(c, [[41, 18], [56, 18]], '#ffffff', 1.2);
    },
    fried_calamari: c => { plate(c); for (let i = 0; i < 5; i++) { ell(c, 20 + (i % 3) * 11 + (i > 2 ? 6 : 0), 33 + (i > 2 ? 7 : 0), 6, 4.5); fs(c, null, OUT, 6); fs(c, null, '#f0b860', 3.5); } poly(c, [[44, 42], [54, 38], [52, 47]]); fs(c, '#ffe14d', OUT, 2); },
    crab_cakes: c => { plate(c); [[24, 34], [38, 33], [31, 41]].forEach(([x, y]) => { ell(c, x, y, 8, 5.5); fs(c, '#d9903c', OUT, 2); ell(c, x - 2, y - 1.5, 3, 1.5); fs(c, '#f2c078', null); }); ell(c, 47, 42, 3.5, 3.5); fs(c, '#2f9e5b', null); },
    shrimp_skewers: c => { plate(c); [[30], [38]].forEach(([y]) => { line(c, [[12, y + 2], [52, y - 2]], '#8a5a34', 2.5); [18, 28, 38].forEach(x => { c.beginPath(); c.arc(x + 4, y, 5, 0.6, 5.2); c.strokeStyle = OUT; c.lineWidth = 6; c.stroke(); c.strokeStyle = '#cfe8ff'; c.lineWidth = 3.5; c.stroke(); }); }); },
    whiskers_gumbo: c => {
      glow(c, 32, 34, 32, 'rgba(255,170,80,0.5)');
      ell(c, 32, 48, 24, 8); fs(c, 'rgba(0,0,0,0.18)', null);
      c.beginPath(); c.moveTo(6, 32); c.quadraticCurveTo(10, 58, 32, 58); c.quadraticCurveTo(54, 58, 58, 32); c.closePath(); fs(c, '#7a2e2e');
      ell(c, 32, 32, 26, 10); fs(c, '#c9622a');
      [[22, 31, '#ffffff'], [34, 34, '#2f9e5b'], [42, 30, '#ffe07a'], [28, 35, '#55664a']].forEach(([x, y, col]) => { ell(c, x, y, 4, 2.5); fs(c, col, OUT, 1.5); });
      [[26, 0], [38, -2]].forEach(([x, dy]) => { c.beginPath(); c.moveTo(x, 20 + dy); c.quadraticCurveTo(x - 5, 14 + dy, x, 9 + dy); c.quadraticCurveTo(x + 4, 5 + dy, x, 2 + dy); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2.5; c.stroke(); });
    }
  };
  function sideBits(c, r, cx, cy) {
    let i = 0;
    for (const id in r.sides) {
      const x = cx + [14, -16, 18, -12][i % 4], y = cy + [6, 8, -4, -6][i % 4]; i++;
      if (id === 'rice') { ell(c, x, y, 7, 5); fs(c, '#ffffff', OUT, 1.5); }
      else if (id === 'veggies') { ell(c, x - 3, y, 3.5, 3.5); fs(c, '#2f9e5b', null); ell(c, x + 3, y + 1, 3, 3); fs(c, '#ff7a3c', null); }
      else if (id === 'kelp') { line(c, [[x - 6, y + 3], [x - 2, y - 3], [x + 2, y + 3], [x + 6, y - 3]], '#2f9e5b', 3); }
      else if (id === 'tortilla') { c.beginPath(); c.arc(x, y + 3, 8, Math.PI, 0); c.closePath(); fs(c, '#ffcf5c', OUT, 1.5); }
      else if (id === 'bread') { rr(c, x - 8, y - 5, 16, 11, 4); fs(c, '#e0a85c', OUT, 1.5); rr(c, x - 6, y - 3, 12, 7, 3); fs(c, '#f7dca8', null); }
    }
  }
  function genericDish(c, r) {
    const fid = Object.keys(r.fish)[0], col = fid ? hex(D.fish[fid].color) : '#2f9e5b';
    if (r.heat === 'pot') {
      ell(c, 32, 48, 24, 8); fs(c, 'rgba(0,0,0,0.18)', null);
      c.beginPath(); c.moveTo(6, 32); c.quadraticCurveTo(10, 58, 32, 58); c.quadraticCurveTo(54, 58, 58, 32); c.closePath(); fs(c, '#4a5a8a');
      ell(c, 32, 32, 26, 10); fs(c, '#e8c27a');
      if (fid) { ell(c, 26, 31, 7, 3.5); fs(c, col, OUT, 1.5); ell(c, 38, 33, 6, 3); fs(c, col, OUT, 1.5); }
      if (r.sides.kelp) line(c, [[14, 32], [20, 29], [26, 33]], '#2f9e5b', 3);
      if (r.sides.veggies) { ell(c, 44, 30, 2.5, 2); fs(c, '#ff7a3c', null); ell(c, 20, 34, 2.5, 2); fs(c, '#2f9e5b', null); }
      if (r.sides.bread) { rr(c, 40, 16, 18, 12, 4); fs(c, '#e0a85c', OUT, 1.5); }
      [[24, 0], [36, -2]].forEach(([x, dy]) => { c.beginPath(); c.moveTo(x, 20 + dy); c.quadraticCurveTo(x - 5, 14 + dy, x, 9 + dy); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2.5; c.stroke(); });
      return;
    }
    if (r.heat === 'none') {
      plate(c, '#2e3350'); ell(c, 32, 36, 21, 13); fs(c, '#3b4266', null);
      if (fid) [[20, 36], [33, 32], [45, 38]].forEach(([x, y]) => { rr(c, x - 7, y - 3, 14, 9, 4); fs(c, r.sides.rice ? '#ffffff' : '#9be38f', OUT, 2); rr(c, x - 8, y - 8, 16, 8, 4); fs(c, col, OUT, 2); });
      else { line(c, [[16, 36], [22, 30], [28, 38], [34, 30], [40, 38], [46, 31]], '#2f9e5b', 5); line(c, [[18, 40], [26, 35], [34, 41], [44, 36]], '#3fbf6b', 4); ell(c, 30, 34, 3, 3); fs(c, '#ff7a3c', null); ell(c, 42, 40, 3, 3); fs(c, '#e8344e', null); }
      return;
    }
    plate(c);
    if (r.heat === 'fry') {
      if (r.sides.tortilla) [[22, 0], [40, 2]].forEach(([x, dy]) => { c.beginPath(); c.arc(x, 40 + dy, 12, Math.PI, 0); c.closePath(); fs(c, '#ffcf5c', OUT, 2); c.beginPath(); c.arc(x, 39 + dy, 8, Math.PI, 0); c.closePath(); fs(c, col, null); });
      else {
        [[22, 32], [34, 30], [28, 40]].forEach(([x, y]) => { ell(c, x, y, 9, 5.5, 0.2); fs(c, '#e0a040', OUT, 2); });
        for (let i = 0; i < 5; i++) { rr(c, 40 + (i % 2) * 5, 30 + i * 3, 12, 3.5, 1.5); fs(c, '#ffd86b', OUT, 1); }
      }
      return;
    }
    // grill
    if (fid && D.fish[fid].trap) { ell(c, 28, 36, 14, 9); fs(c, col, OUT, 2); }
    else if (fid) {
      if (r.fish.swordfish) { rr(c, 16, 28, 26, 16, 6); fs(c, '#e8d2b8', OUT, 2); for (let i = 0; i < 3; i++) line(c, [[20 + i * 7, 30], [17 + i * 7, 42]], '#5b3a1a', 2); }
      else { miniFish(c, 28, 35, 1.1, col, -0.12); for (let i = 0; i < 3; i++) line(c, [[20 + i * 6, 30], [17 + i * 6, 40]], '#5b3a1a', 2); }
    }
    sideBits(c, r, 34, 36);
  }

  const ALL = Object.assign({}, DISH1, DISH2);
  FR.dishArt = {};
  D.recipes.forEach(r => {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
    const g = cv.getContext('2d'); g.lineJoin = 'round'; g.lineCap = 'round'; g.scale(2, 2);
    try { (ALL[r.id] || (c => genericDish(c, r)))(g, 64, 64); } catch (e) { /* a picture that fails stays blank */ }
    FR.dishArt[r.id] = cv;
  });
  FR.dishImg = {};
  FR.dishSrc = id => FR.dishImg[id] || (FR.dishImg[id] = FR.dishArt[id] ? FR.dishArt[id].toDataURL() : '');
  FR.fishSrcCache = {};
  FR.fishSrc = id => FR.fishSrcCache[id] || (FR.fishSrcCache[id] = FR.fishArt && FR.fishArt[id] ? FR.fishArt[id].toDataURL() : '');
})();
