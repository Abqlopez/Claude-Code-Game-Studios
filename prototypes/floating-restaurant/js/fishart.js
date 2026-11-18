// The v3 fish pictures, copied from the 2D game's art files so the 3D game keeps the same look.
// FR.fishArt[id] is a 256 x 144 canvas (the 2D game's 128 x 72 art at double size), facing right.
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

  const FISH1 = {
    sardine: c => drawFish(c, {
      L: 84, H: 24, tail: 16, dorsal: 6, fork: 0.3, top: '#4f7fb3', belly: '#eef5fa', fin: '#7fa6cf', eye: 4,
      pattern: (c, cx, cy, L) => {
        line(c, [[cx - L / 2, cy - 2], [cx + L / 2, cy - 2]], '#d9f0ff', 3);
        for (let i = 0; i < 6; i++) { ell(c, cx - 30 + i * 9, cy - 7, 1.6, 1.6); fs(c, '#2b4d78', null); }
      }
    }),
    glowgill: c => {
      glow(c, 70, 36, 46, 'rgba(125,255,176,0.35)');
      drawFish(c, {
        L: 70, H: 38, tail: 18, dorsal: 10, top: '#1c5d6b', belly: '#2fb59a', fin: '#7dffb0', eye: 6,
        pattern: (c, cx, cy) => {
          [[-18, -4], [-6, 5], [6, -6], [-28, 4], [-12, -10]].forEach(([dx, dy]) => { glow(c, cx + dx, cy + dy, 9, 'rgba(200,255,225,0.95)'); });
          for (let i = 0; i < 3; i++) line(c, [[cx + 10 - i * 4, cy - 6], [cx + 8 - i * 4, cy + 8]], '#b8ffd9', 2);
        },
        after: (c, cx, cy, L, H) => {
          // angler lure
          c.beginPath(); c.moveTo(cx + L * 0.3, cy - H * 0.45); c.quadraticCurveTo(cx + L * 0.45, cy - H * 0.95, cx + L * 0.62, cy - H * 0.6);
          c.strokeStyle = OUT; c.lineWidth = 2; c.stroke();
          glow(c, cx + L * 0.62, cy - H * 0.6, 10, 'rgba(255,255,200,0.9)');
          ell(c, cx + L * 0.62, cy - H * 0.6, 4, 4); fs(c, '#fffbd0', OUT, 1.5);
        }
      });
    },
    thunder_eel: c => {
      const pts = [];
      for (let i = 0; i <= 20; i++) pts.push([12 + i * 4.6, 38 + Math.sin(i * 0.75) * 9 * (1 - i / 40)]);
      line(c, pts, OUT, 24); line(c, pts, '#f2c530', 18);
      line(c, pts.map(p => [p[0], p[1] + 5]), '#ffe98a', 5);
      // lightning stripes
      for (let i = 2; i < 18; i += 3) { const p = pts[i]; line(c, [[p[0] - 3, p[1] - 8], [p[0] + 2, p[1] - 1], [p[0] - 2, p[1] + 1], [p[0] + 3, p[1] + 8]], '#7a4a00', 2.5); }
      // tail fin + head
      poly(c, [[14, 38], [2, 26], [6, 38], [2, 52]]); fs(c, '#ffb300');
      ell(c, 106, 36, 15, 13); fs(c, '#f2c530');
      eye(c, 110, 32, 5);
      line(c, [[120, 40], [110, 43]], OUT, 2);
      // sparks
      [[30, 14], [62, 60], [88, 12]].forEach(([x, y]) => line(c, [[x - 5, y - 5], [x + 1, y - 1], [x - 2, y + 1], [x + 5, y + 6]], '#8fe9ff', 2.5));
    },
    bluefin_tuna: c => drawFish(c, {
      L: 100, H: 46, tail: 22, dorsal: 16, fork: 0.15, top: '#1d3f8a', belly: '#dfe8f2', fin: '#27468f', eye: 5,
      pattern: (c, cx, cy, L, H) => {
        line(c, [[cx - L / 2, cy + 3], [cx + L / 2, cy + 1]], '#8fb4e8', 2);
        for (let i = 0; i < 6; i++) { poly(c, [[cx - 44 + i * 7, cy - H * 0.3 + i], [cx - 41 + i * 7, cy - H * 0.3 - 6 + i], [cx - 38 + i * 7, cy - H * 0.3 + i]]); fs(c, '#ffd23c', null); }
      },
      after: (c, cx, cy, L, H) => { for (let i = 0; i < 5; i++) { poly(c, [[cx - 40 + i * 7, cy + H * 0.36 - i], [cx - 37 + i * 7, cy + H * 0.36 + 6 - i], [cx - 34 + i * 7, cy + H * 0.36 - i]]); fs(c, '#ffd23c', OUT, 1); } }
    }),
    dragon_koi: c => {
      glow(c, 66, 36, 50, 'rgba(255,200,90,0.35)');
      // flowing back fins
      c.beginPath(); c.moveTo(34, 36); c.bezierCurveTo(8, 6, 0, 30, 14, 34); c.bezierCurveTo(-2, 44, 6, 68, 34, 40); c.closePath(); fs(c, lin(c, 0, 0, 30, 0, ['#ffd23c', '#ff5b3c']));
      drawFish(c, {
        L: 92, H: 44, tail: 6, dorsal: 18, top: '#ff7a1f', belly: '#fff1d6', fin: '#ff5b3c', eye: 6,
        pattern: (c, cx, cy, L, H) => {
          ell(c, cx - 14, cy - 12, 16, 10); fs(c, '#ffffff', null);
          ell(c, cx + 12, cy + 10, 12, 8); fs(c, '#ffd23c', null);
          c.strokeStyle = 'rgba(122,40,0,0.45)'; c.lineWidth = 1.5;
          for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(cx - 40 + i * 9 + (r % 2) * 4, cy - 12 + r * 8, 5, 0.3, 2.8); c.stroke(); }
        },
        after: (c, cx, cy, L) => {
          const hx = cx + L / 2;
          // whiskers and antlers: this one is part dragon
          c.strokeStyle = OUT; c.lineWidth = 2;
          c.beginPath(); c.moveTo(hx - 6, cy + 6); c.quadraticCurveTo(hx + 8, cy + 10, hx + 6, cy + 24); c.stroke();
          c.beginPath(); c.moveTo(hx - 12, cy + 8); c.quadraticCurveTo(hx - 4, cy + 20, hx - 10, cy + 26); c.stroke();
          line(c, [[hx - 22, cy - 16], [hx - 18, cy - 30], [hx - 10, cy - 34]], '#ffd23c', 4);
          line(c, [[hx - 18, cy - 30], [hx - 24, cy - 36]], '#ffd23c', 4);
          [[20, 10], [104, 62], [50, 4]].forEach(([x, y]) => { line(c, [[x - 4, y], [x + 4, y]], '#fff6c2', 2); line(c, [[x, y - 4], [x, y + 4]], '#fff6c2', 2); });
        }
      });
    },
    coral_snapper: c => drawFish(c, {
      L: 80, H: 46, tail: 20, dorsal: 14, top: '#ff5f7e', belly: '#ffd7c9', fin: '#ff9a5c', eye: 6,
      pattern: (c, cx, cy, L, H) => { for (let i = 0; i < 5; i++) line(c, [[cx - 30 + i * 13, cy - H], [cx - 36 + i * 13, cy + H]], 'rgba(255,255,255,0.35)', 4); },
      after: (c, cx, cy, L, H) => { for (let i = 0; i < 5; i++) line(c, [[cx - 18 + i * 8, cy - H * 0.5], [cx - 20 + i * 8, cy - H * 0.5 - 9]], OUT, 2); }
    }),
    bubble_puffer: c => {
      glow(c, 66, 36, 44, 'rgba(197,155,255,0.35)');
      for (let a = 0; a < 14; a++) { const an = a / 14 * Math.PI * 2; line(c, [[66 + Math.cos(an) * 24, 36 + Math.sin(an) * 24], [66 + Math.cos(an) * 33, 36 + Math.sin(an) * 33]], OUT, 3); }
      poly(c, [[44, 36], [26, 24], [30, 36], [26, 48]]); fs(c, '#8e5fd6');
      ell(c, 66, 36, 26, 25); fs(c, lin(c, 0, 10, 0, 62, ['#a678f0', '#a678f0', '#f3e6ff']));
      [[56, 24], [72, 20], [62, 34], [50, 38]].forEach(([x, y]) => { ell(c, x, y, 3, 3); fs(c, '#7446c2', null); });
      eye(c, 78, 30, 7);
      ell(c, 90, 40, 4, 3); fs(c, '#ff8fab', OUT, 2);
      [[104, 20, 6], [114, 34, 4], [108, 50, 5]].forEach(([x, y, r]) => { ell(c, x, y, r, r); fs(c, 'rgba(255,255,255,0.35)', '#ffffff', 1.5); });
    }
  };

  const FISH2 = {
    crab: c => {
      [[-1], [1]].forEach(([s]) => {
        for (let i = 0; i < 3; i++) line(c, [[64 + s * 18, 40 + i * 5], [64 + s * (34 + i * 3), 34 + i * 10], [64 + s * (40 + i * 3), 44 + i * 9]], OUT, 4);
        line(c, [[64 + s * 16, 30], [64 + s * 32, 18]], OUT, 6); line(c, [[64 + s * 16, 30], [64 + s * 32, 18]], '#e8553a', 3);
        c.beginPath(); c.arc(64 + s * 38, 14, 10, s > 0 ? -2.4 : -0.7, s > 0 ? 2.2 : 3.9); c.closePath(); fs(c, '#ff7a5c');
      });
      ell(c, 64, 40, 26, 18); fs(c, lin(c, 0, 22, 0, 58, ['#ff7a5c', '#d9432a']));
      [[54, 34], [74, 34], [64, 44]].forEach(([x, y]) => { ell(c, x, y, 3, 2); fs(c, '#ffb09a', null); });
      [56, 72].forEach(x => { line(c, [[x, 26], [x, 18]], OUT, 2.5); eye(c, x, 15, 4.5); });
    },
    squid: c => {
      for (let i = 0; i < 6; i++) { const y = 22 + i * 5.5; c.beginPath(); c.moveTo(52, y); c.bezierCurveTo(34, y + (i % 2 ? 8 : -8), 22, y + (i % 2 ? -6 : 6), 8, y + (i - 2.5) * 3); c.strokeStyle = OUT; c.lineWidth = 6; c.stroke(); c.strokeStyle = '#f2a6c2'; c.lineWidth = 3; c.stroke(); }
      poly(c, [[96, 18], [118, 36], [96, 54]]); fs(c, '#d9749c');
      rr(c, 48, 20, 60, 32, 15); fs(c, lin(c, 0, 20, 0, 52, ['#e58fb0', '#f7c4d6']));
      [[70, 28], [84, 42], [94, 30]].forEach(([x, y]) => { ell(c, x, y, 2.5, 2.5); fs(c, '#c85a8a', null); });
      eye(c, 58, 34, 7);
    },
    ghost_shrimp: c => {
      glow(c, 64, 36, 44, 'rgba(200,230,255,0.4)');
      c.globalAlpha = 0.85;
      line(c, [[92, 30], [118, 14]], '#dff1ff', 2); line(c, [[92, 34], [120, 28]], '#dff1ff', 2);
      for (let i = 0; i < 5; i++) { const a = 0.5 + i * 0.5; ell(c, 64 - Math.cos(a) * 22 + 6, 40 - Math.sin(a) * 12, 13 - i, 10 - i * 0.8, -a * 0.6); fs(c, lin(c, 0, 18, 0, 56, ['#eaf6ff', '#a9d4f5']), OUT, 2.5); }
      poly(c, [[30, 46], [12, 40], [18, 50], [12, 60]]); fs(c, '#a9d4f5', OUT, 2.5);
      ell(c, 90, 32, 12, 9); fs(c, '#eaf6ff', OUT, 2.5);
      for (let i = 0; i < 4; i++) line(c, [[58 + i * 8, 48], [56 + i * 8, 58]], OUT, 2);
      c.globalAlpha = 1;
      eye(c, 94, 30, 4);
    },
    old_whiskers: c => drawFish(c, {
      L: 104, H: 54, tail: 16, dorsal: 8, top: '#55664a', belly: '#d8d9b4', fin: '#3f4d36', eye: 6,
      pattern: (c, cx, cy, L, H) => { for (let i = 0; i < 9; i++) { ell(c, cx - 44 + i * 11, cy - 10 + (i % 3) * 6, 4, 3); fs(c, 'rgba(40,50,30,0.5)', null); } line(c, [[cx - 20, cy - 16], [cx - 4, cy - 6]], '#c9d0b0', 2.5); },
      after: (c, cx, cy, L) => {
        const hx = cx + L / 2;
        c.strokeStyle = OUT; c.lineWidth = 2.5;
        [[-4, 4, 12, -18], [-4, 6, 16, 20], [-10, 8, 6, 26], [-8, 2, 4, -22]].forEach(([sx, sy, ex, ey]) => { c.beginPath(); c.moveTo(hx + sx, cy + sy); c.quadraticCurveTo(hx + ex, cy + sy + ey * 0.2, hx + ex * 0.9, cy + ey); c.stroke(); });
        rr(c, hx - 30, cy + 10, 26, 7, 3); fs(c, '#3f4d36', OUT, 2);
      }
    })
  };
  const FISH3 = {
    mackerel: c => drawFish(c, {
      L: 88, H: 26, tail: 18, dorsal: 8, fork: 0.25, top: '#2f6f8a', belly: '#eef6f2', fin: '#4f8fa8', eye: 4,
      pattern: (c, cx, cy, L, H) => { for (let i = 0; i < 9; i++) line(c, [[cx - 36 + i * 8, cy - H * 0.5], [cx - 30 + i * 8, cy - 2], [cx - 34 + i * 8, cy + 2]], '#123a4f', 2.5); }
    }),
    flounder: c => {
      poly(c, [[28, 36], [8, 22], [14, 36], [8, 50]]); fs(c, '#8a6f45');
      ell(c, 68, 36, 44, 26); fs(c, lin(c, 0, 10, 0, 62, ['#b8955f', '#a88a5f', '#8a6f45']));
      c.save(); ell(c, 68, 36, 44, 26); c.clip();
      for (let i = 0; i < 16; i++) { ell(c, 34 + (i * 37) % 70, 18 + (i * 23) % 38, 3, 2.5); fs(c, 'rgba(60,40,20,0.45)', null); }
      c.restore();
      ell(c, 68, 36, 44, 26); fs(c, null);
      for (let i = 0; i < 11; i++) { const a = -2.6 + i * 0.52; line(c, [[68 + Math.cos(a) * 44, 36 + Math.sin(a) * 26], [68 + Math.cos(a) * 50, 36 + Math.sin(a) * 31]], '#6b5232', 2.5); }
      eye(c, 92, 26, 4.5); eye(c, 100, 34, 4.5);
      line(c, [[108, 42], [100, 45]], OUT, 2);
    },
    lobster: c => {
      [[-1], [1]].forEach(([s]) => {
        line(c, [[96, 36 + s * 6], [112, 36 + s * 16]], OUT, 5);
        ell(c, 116, 36 + s * 22, 10, 7, s * 0.4); fs(c, '#d9432a');
        line(c, [[100, 34 + s * 2], [126, 36 + s * 30]], '#7a1a10', 1.5);
        for (let i = 0; i < 3; i++) line(c, [[60 + i * 10, 36 + s * 8], [56 + i * 10, 36 + s * 20]], OUT, 3);
      });
      for (let i = 0; i < 5; i++) { ell(c, 52 - i * 9, 36, 10 - i, 11 - i); fs(c, i % 2 ? '#c8423b' : '#d9532f'); }
      poly(c, [[14, 36], [2, 24], [6, 36], [2, 48]]); fs(c, '#c8423b');
      ell(c, 76, 36, 22, 13); fs(c, lin(c, 0, 22, 0, 50, ['#e8553a', '#b3262b']));
      line(c, [[92, 30], [124, 6]], OUT, 1.5); line(c, [[92, 42], [124, 66]], OUT, 1.5);
      eye(c, 92, 30, 3.5); eye(c, 92, 42, 3.5);
    },
    swordfish: c => {
      line(c, [[100, 34], [128, 30]], OUT, 6); line(c, [[100, 34], [127, 30]], '#9fb6d6', 3);
      drawFish(c, {
        L: 90, H: 36, tail: 22, dorsal: 22, fork: 0.1, top: '#2b4a7a', belly: '#d8e2ef', fin: '#203a66', eye: 5,
        pattern: (c, cx, cy, L) => line(c, [[cx - L / 2, cy + 2], [cx + L / 2, cy]], '#7fa0cc', 2)
      });
    },
    frostfin_cod: c => {
      glow(c, 70, 36, 46, 'rgba(160,230,255,0.4)');
      drawFish(c, {
        L: 80, H: 34, tail: 18, dorsal: 12, top: '#6fb8d9', belly: '#f2fbff', fin: '#bfeaff', eye: 5,
        pattern: (c, cx, cy) => {
          [[-20, -6], [0, 4], [16, -8], [-6, -10]].forEach(([dx, dy]) => {
            for (let a = 0; a < 3; a++) { const an = a * Math.PI / 3; line(c, [[cx + dx - Math.cos(an) * 5, cy + dy - Math.sin(an) * 5], [cx + dx + Math.cos(an) * 5, cy + dy + Math.sin(an) * 5]], '#ffffff', 1.5); }
          });
        }
      });
    },
    ember_trout: c => {
      glow(c, 70, 36, 46, 'rgba(255,120,40,0.4)');
      drawFish(c, {
        L: 84, H: 32, tail: 18, dorsal: 12, top: '#c8341f', belly: '#ffd27a', fin: '#ff8a2b', eye: 5,
        pattern: (c, cx, cy) => {
          line(c, [[cx - 40, cy + 2], [cx + 40, cy]], '#ff9a5c', 4);
          [[-24, -8], [-10, -4], [6, -9], [18, -3], [-16, 6], [2, 7]].forEach(([dx, dy]) => glow(c, cx + dx, cy + dy, 5, 'rgba(255,240,140,1)'));
        },
        after: () => { [[22, 14], [16, 54], [110, 12]].forEach(([x, y]) => glow(c, x, y, 5, 'rgba(255,180,60,0.9)')); }
      });
    },
    moon_ray: c => {
      glow(c, 64, 36, 50, 'rgba(216,208,255,0.4)');
      line(c, [[30, 36], [2, 40]], OUT, 4); line(c, [[30, 36], [3, 40]], '#a89fe0', 2);
      poly(c, [[30, 36], [70, 4], [116, 34], [70, 68]]); fs(c, lin(c, 0, 4, 0, 68, ['#bdb3ff', '#8e84d6', '#bdb3ff']));
      c.save(); poly(c, [[30, 36], [70, 4], [116, 34], [70, 68]]); c.clip();
      ell(c, 72, 36, 14, 14); fs(c, 'rgba(255,255,240,0.85)', null);
      ell(c, 77, 32, 12, 12); fs(c, '#8e84d6', null);
      [[52, 22], [90, 20], [96, 50], [50, 50]].forEach(([x, y]) => glow(c, x, y, 4, 'rgba(255,255,255,1)'));
      c.restore();
      poly(c, [[30, 36], [70, 4], [116, 34], [70, 68]]); fs(c, null);
      eye(c, 100, 28, 3.5); eye(c, 100, 42, 3.5);
    },
    abyss_angler: c => {
      glow(c, 66, 36, 50, 'rgba(90,70,180,0.35)');
      c.beginPath(); c.moveTo(96, 14); c.quadraticCurveTo(110, -2, 122, 12); c.strokeStyle = OUT; c.lineWidth = 2.5; c.stroke();
      glow(c, 122, 14, 12, 'rgba(160,255,240,1)'); ell(c, 122, 14, 4, 4); fs(c, '#d0fff6', OUT, 1.5);
      drawFish(c, {
        L: 88, H: 50, tail: 16, dorsal: 8, top: '#2a2250', belly: '#4a3f80', fin: '#3a2f6b', eye: 7,
        pattern: (c, cx, cy) => { [[-24, -10], [-8, 8], [8, -12], [-30, 8]].forEach(([dx, dy]) => glow(c, cx + dx, cy + dy, 5, 'rgba(140,255,230,0.8)')); },
        after: (c, cx, cy, L) => {
          const hx = cx + L / 2;
          c.beginPath(); c.moveTo(hx - 22, cy + 4); c.lineTo(hx + 2, cy + 2); c.lineTo(hx - 20, cy + 16); c.closePath(); fs(c, '#140f2a', OUT, 2);
          for (let i = 0; i < 4; i++) { poly(c, [[hx - 18 + i * 5, cy + 4], [hx - 16 + i * 5, cy + 10], [hx - 14 + i * 5, cy + 4]]); fs(c, '#ffffff', null); }
        }
      });
    }
  };
  const ALL = Object.assign({}, FISH1, FISH2, FISH3);
  FR.fishArt = {};
  for (const id in ALL) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 144;
    const g = cv.getContext('2d'); g.lineJoin = 'round'; g.lineCap = 'round'; g.scale(2, 2);
    try { ALL[id](g, 128, 72); } catch (e) { /* a picture that fails just stays blank */ }
    FR.fishArt[id] = cv;
  }
})();
