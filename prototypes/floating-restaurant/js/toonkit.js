// PROTOTYPE - NOT FOR PRODUCTION
// Toon look for Floating Restaurant (from prototypes/floating-restaurant-style-spike):
// three flat tones of light, an ink outline drawn in screen space, and a pass that turns the
// game's existing standard materials into toon ones without touching how they were built.
// window.FRToon = { ramp, INK, T, mk, grp, addOutline, toonifyScene, resize }
(function () {
  const INK = 0x1d1430;
  const ramp = new THREE.DataTexture(new Uint8Array([150, 150, 150, 215, 215, 215, 255, 255, 255]), 3, 1, THREE.RGBFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
  const outlineW = { value: 5 / innerHeight }, aspect = { value: innerHeight / innerWidth };
  const resize = () => { outlineW.value = 4.5 / innerHeight; aspect.value = innerHeight / innerWidth; };
  addEventListener('resize', resize);

  const mats = {};
  const T = (color, o) => { o = o || {}; const k = color + JSON.stringify(o); return mats[k] || (mats[k] = new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: ramp }, o))); };
  let olMat = null;
  const outlineMat = () => olMat || (olMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { c: { value: new THREE.Color(INK) }, w: outlineW, asp: aspect },
    vertexShader: `uniform float w; uniform float asp;
      void main(){
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec3 vn = normalize(normalMatrix * normal);
        vec2 d = (projectionMatrix * vec4(vn, 0.0)).xy; float l = length(d); d = l > 0.0 ? d / l : vec2(0.0);
        d.x *= asp; p.xy += d * w * p.w; gl_Position = p;
      }`,
    fragmentShader: 'uniform vec3 c; void main(){ gl_FragColor = vec4(c, 1.0); }'
  }));
  // Outlines need smooth normals or they crack along hard edges.
  function smoothGeo(geo) {
    if (geo.userData.smooth) return geo.userData.smooth;
    const g = geo.clone(); if (!g.attributes.normal) g.computeVertexNormals();
    const p = g.attributes.position, n = g.attributes.normal, acc = new Map(), key = i => `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    for (let i = 0; i < p.count; i++) { const k = key(i), a = acc.get(k) || [0, 0, 0]; a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i); acc.set(k, a); }
    const out = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const a = acc.get(key(i)), l = Math.hypot(a[0], a[1], a[2]) || 1; out[i * 3] = a[0] / l; out[i * 3 + 1] = a[1] / l; out[i * 3 + 2] = a[2] / l; }
    g.setAttribute('normal', new THREE.BufferAttribute(out, 3));
    return (geo.userData.smooth = g);
  }
  // The outline is a child of its mesh, so it moves, scales and hides with it.
  function addOutline(m) {
    const o = new THREE.Mesh(smoothGeo(m.geometry), outlineMat());
    o.castShadow = false; o.userData.isOutline = true; m.add(o); return o;
  }
  // Outline every mesh under a group (once), e.g. the chef.
  function outlineAll(root, minSize) {
    const list = []; root.traverse(o => { if (o.isMesh && o.visible && !o.userData.isOutline && !o.userData.outlined && !o.isInstancedMesh && !(o.material && (o.material.isMeshBasicMaterial || o.material.transparent))) list.push(o); });
    list.forEach(m => { m.geometry.computeBoundingSphere(); if (m.geometry.boundingSphere.radius >= (minSize || 0)) { addOutline(m); m.userData.outlined = true; } });
  }
  function mk(geo, color, x, y, z, parent, o) {
    o = o || {};
    const m = new THREE.Mesh(geo, o.mat || T(color, o.m));
    m.position.set(x || 0, y || 0, z || 0); m.castShadow = o.shadow !== false; m.receiveShadow = true;
    parent.add(m);
    if (o.outline !== false) addOutline(m);
    m.userData.outlined = true; // outlineAll leaves it alone
    return m;
  }
  const grp = (x, y, z, p) => { const g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); if (p) p.add(g); return g; };

  // Swap standard materials for toon ones (same colour, map, emissive, transparency). Materials with
  // their own shader changes (the sea), see-through glass and plain unlit ones are left alone.
  const swapped = new Map();
  function toonOf(m) {
    if (!m || !m.isMeshStandardMaterial || m.onBeforeCompile.toString().length > 30 || (m.transparent && m.opacity < 0.6)) return m;
    if (swapped.has(m)) return swapped.get(m);
    const t = new THREE.MeshToonMaterial({ color: m.color, map: m.map, gradientMap: ramp, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity, emissiveMap: m.emissiveMap,
      transparent: m.transparent, opacity: m.opacity, side: m.side, depthWrite: m.depthWrite, vertexColors: m.vertexColors });
    // keep the two in step: the game animates colour, opacity and glow on its own materials
    t.userData.src = m; t.userData.sig = sig(m); swapped.set(m, t); live.push(t); return t;
  }
  const live = [];
  // Some game code recolours a material it holds (wall paint, lamps), some recolours mesh.material
  // (now the toon copy). Copy across only when the original actually changed, so both work.
  const sig = m => m.color.getHex() + ':' + m.emissive.getHex() + ':' + m.emissiveIntensity.toFixed(3) + ':' + m.opacity.toFixed(3) + ':' + (m.map ? m.map.uuid : '');
  function syncLive() {
    live.forEach(t => { const m = t.userData.src, s = sig(m); if (s !== t.userData.sig) { t.userData.sig = s; t.color.copy(m.color); t.emissive.copy(m.emissive); t.emissiveIntensity = m.emissiveIntensity; t.opacity = m.opacity; t.map = m.map; t.needsUpdate = true; } });
  }
  function toonifyScene(root) {
    root.traverse(o => {
      if (!o.isMesh || o.userData.isOutline || o.userData.noToon) return;
      o.material = Array.isArray(o.material) ? o.material.map(toonOf) : toonOf(o.material);
    });
  }
  window.FRToon = { ramp, INK, T, mk, grp, addOutline, outlineAll, toonifyScene, syncLive, resize };
})();
