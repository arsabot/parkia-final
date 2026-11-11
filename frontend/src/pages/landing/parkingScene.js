// Escena 3D del hero: estacionamiento con autos, plaza elegida en lima y la línea que guía al auto.
// Se usa desde LandingPage con createParkingScene(canvas, opciones) y devuelve una función para limpiarla.
import * as THREE from 'three';

export function createParkingScene(cv, opts) {
  const LIME = '#A3E635';
  const state = { dead: false, raf: 0, ro: null };
  const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); 
  R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); R.setClearColor(0x000000, 0);
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.2; R.outputEncoding = THREE.sRGBEncoding;
  const S = new THREE.Scene(); S.fog = new THREE.Fog('#05080F', 26, 48);
  const C = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const pm = new THREE.PMREMGenerator(R), es = new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.SphereGeometry(20, 16, 16), new THREE.MeshBasicMaterial({ color: '#121a2c', side: THREE.BackSide })));
  [-5, 0, 5].forEach(x => { const b = new THREE.Mesh(new THREE.PlaneGeometry(1, 5), new THREE.MeshBasicMaterial({ color: '#e6efff' })); b.position.set(x, 9, 0); b.rotation.x = Math.PI / 2; es.add(b); });
  S.environment = pm.fromScene(es, 0.03).texture;
  S.add(new THREE.HemisphereLight('#7f9bd6', '#0a0d16', 0.7));
  const key = new THREE.DirectionalLight('#b8ccf0', 0.75); key.position.set(-6, 14, -4); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 8; key.shadow.bias = -0.0004;
  Object.assign(key.shadow.camera, { left: -17, right: 17, top: 9, bottom: -9 }); S.add(key);
  [-9, -3, 3, 9].forEach(x => { const l = new THREE.PointLight('#cfe0ff', 1.6, 9, 1.6); l.position.set(x, 3.2, 0); S.add(l); });

  const SWr = 1.6, SWa = 2.25, SWh = 1.25, ZA = -4.0, ZB = 4.0, DEP = 2.5;
  const patA = [1, 0, 1, 1, 'a', 'h', 'a', 1, 0, 1, 1, 0, 1];
  const patB = [1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1];
  const layout = (pat) => { const ws = pat.map(v => v === 'a' ? SWa : (v === 'h' ? SWh : SWr)); const tot = ws.reduce((a, b) => a + b, 0); let x = -tot / 2; return pat.map((v, i) => { const o = { v, x0: x, w: ws[i], cx: x + ws[i] / 2 }; x += ws[i]; return o; }); };
  const A = layout(patA), B = layout(patB);
  let T = 6;
  const pad = (i) => String(i + 1).padStart(2, '0');

  const GW = 32, GD = 11, k = 80;
  const P = (x, z) => [(x + GW / 2) * k, (z + GD / 2) * k];
  const base = document.createElement('canvas'); base.width = GW * k; base.height = GD * k;
  { const b = base.getContext('2d'); b.fillStyle = '#171c28'; b.fillRect(0, 0, base.width, base.height); const im = b.getImageData(0, 0, base.width, base.height); for (let i = 0; i < im.data.length; i += 4) { const n = (Math.random() - 0.5) * 10; im.data[i] += n; im.data[i + 1] += n; im.data[i + 2] += n + 1; } b.putImageData(im, 0, 0); }
  const gc = document.createElement('canvas'); gc.width = GW * k; gc.height = GD * k; const g = gc.getContext('2d');
  const ln = (x1, z1, x2, z2, w, c) => { g.strokeStyle = c; g.lineWidth = w * k; g.beginPath(); g.moveTo(...P(x1, z1)); g.lineTo(...P(x2, z2)); g.stroke(); };
  const wc = (x, z) => { const p = P(x, z), u = k * 0.34; g.save(); g.translate(p[0], p[1]); g.strokeStyle = '#7DB3FF'; g.fillStyle = '#7DB3FF'; g.lineWidth = u * 0.24; g.lineCap = 'round';
    g.beginPath(); g.arc(-u * 0.2, -u * 1.3, u * 0.28, 0, 7); g.fill(); g.beginPath(); g.moveTo(-u * 0.25, -u * 0.8); g.lineTo(-u * 0.25, u * 0.15); g.lineTo(u * 0.6, u * 0.15); g.lineTo(u * 0.95, u * 0.9); g.stroke();
    g.beginPath(); g.moveTo(-u * 0.25, -u * 0.4); g.lineTo(u * 0.4, -u * 0.4); g.stroke(); g.beginPath(); g.arc(-u * 0.1, u * 0.45, u * 0.75, Math.PI * 0.15, Math.PI * 1.35); g.stroke(); g.restore(); };
  const drawGround = () => {
    g.drawImage(base, 0, 0);
    A.forEach(s => { if (s.v === 'a') { const p = P(s.x0, ZA); g.fillStyle = 'rgba(40,110,230,.34)'; g.fillRect(p[0], p[1], s.w * k, DEP * k); }
      if (s.v === 'h') { g.save(); const p = P(s.x0, ZA); g.beginPath(); g.rect(p[0], p[1], s.w * k, DEP * k); g.clip(); g.strokeStyle = 'rgba(80,150,255,.8)'; g.lineWidth = 0.13 * k; for (let d = -3; d < 5; d += 0.38) { g.beginPath(); g.moveTo(...P(s.x0 + d, ZA)); g.lineTo(...P(s.x0 + d - DEP, ZA + DEP)); g.stroke(); } g.restore(); } });
    const WL = 'rgba(205,218,240,.55)', BL = '#4F8DF5';
    A.forEach((s, i) => { const prev = A[i - 1]; const blue = s.v === 'a' || s.v === 'h' || (prev && (prev.v === 'a' || prev.v === 'h')); ln(s.x0, ZA, s.x0, ZA + DEP, blue ? 0.09 : 0.07, blue ? BL : WL); });
    { const l = A[A.length - 1]; ln(l.x0 + l.w, ZA, l.x0 + l.w, ZA + DEP, 0.07, WL); }
    B.forEach(s => ln(s.x0, ZB - DEP, s.x0, ZB, 0.07, WL)); { const l = B[B.length - 1]; ln(l.x0 + l.w, ZB - DEP, l.x0 + l.w, ZB, 0.07, WL); }
    ln(A[0].x0, ZA, A[A.length - 1].x0 + A[A.length - 1].w, ZA, 0.07, WL); ln(B[0].x0, ZB, B[B.length - 1].x0 + B[B.length - 1].w, ZB, 0.07, WL);
    for (let x = -15; x < 15; x += 1.4) ln(x, 0, x + 0.7, 0, 0.06, 'rgba(205,218,240,.28)');
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 ' + (0.3 * k) + 'px sans-serif'; g.fillStyle = 'rgba(190,204,230,.4)';
    A.forEach((s, i) => { if (s.v !== 'h') g.fillText('A' + pad(i), ...P(s.cx, ZA + 0.32)); });
    B.forEach((s, i) => { if (i !== T) g.fillText('B' + pad(i), ...P(s.cx, ZB - 0.36)); });
    A.forEach(s => { if (s.v === 'a') wc(s.cx, ZA + 1.3); });
  };
  drawGround();
  const gt = new THREE.CanvasTexture(gc); gt.encoding = THREE.sRGBEncoding; gt.anisotropy = 8;
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(GW, GD), new THREE.MeshStandardMaterial({ map: gt, roughness: 0.6, metalness: 0.15 })); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; S.add(gr);

  const mkTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return new THREE.CanvasTexture(c); };
  const stripTex = mkTex(4, 64, (x, w, h) => { const r = x.createLinearGradient(0, 0, 0, h); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(0.5, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = r; x.fillRect(0, 0, w, h); });
  const gtex = mkTex(64, 64, (x) => { const r = x.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.15, 'rgba(255,255,255,.6)'); r.addColorStop(0.4, 'rgba(255,255,255,.12)'); r.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = r; x.fillRect(0, 0, 64, 64); });
  const pool = (col, w, l, op) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), new THREE.MeshBasicMaterial({ map: gtex, color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; return m; };
  const neonLine = (parent, x1, z1, x2, z2, col, op, glowCol, glowW) => { const len = Math.hypot(x2 - x1, z2 - z1), a = Math.atan2(z2 - z1, x2 - x1);
    const core = new THREE.Mesh(new THREE.BoxGeometry(len, 0.03, 0.06), new THREE.MeshBasicMaterial({ color: col, toneMapped: false })); core.position.set((x1 + x2) / 2, 0.016, (z1 + z2) / 2); core.rotation.y = -a; parent.add(core);
    const h = new THREE.Mesh(new THREE.PlaneGeometry(len + 0.3, glowW || 0.8), new THREE.MeshBasicMaterial({ color: glowCol || col, map: stripTex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); h.rotation.x = -Math.PI / 2; h.rotation.z = -a; h.position.set((x1 + x2) / 2, 0.018, (z1 + z2) / 2); parent.add(h); return { core, h }; };

  const accLines = [], accFloors = [];
  A.forEach(s => { if (s.v === 'a') {
    accLines.push(neonLine(S, s.x0, ZA, s.x0, ZA + DEP, '#60A5FA', 0.18, '#3B82F6', 0.3), neonLine(S, s.x0 + s.w, ZA, s.x0 + s.w, ZA + DEP, '#60A5FA', 0.18, '#3B82F6', 0.3), neonLine(S, s.x0, ZA, s.x0 + s.w, ZA, '#60A5FA', 0, '#3B82F6', 0.3), neonLine(S, s.x0, ZA + DEP, s.x0 + s.w, ZA + DEP, '#60A5FA', 0, '#3B82F6', 0.3));
    const fm = new THREE.Mesh(new THREE.PlaneGeometry(s.w - 0.1, DEP - 0.1), new THREE.MeshBasicMaterial({ color: '#3B82F6', transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); fm.rotation.x = -Math.PI / 2; fm.position.set(s.cx, 0.013, ZA + DEP / 2); S.add(fm); accFloors.push(fm);
  } });
  accLines.forEach((l, i) => { l.edge = i % 4 >= 2; if (l.edge) l.core.material.transparent = true, l.core.material.opacity = 0; });
  let accK = 0;

  const limeG = new THREE.Group(); S.add(limeG); let lime = [];
  const buildLime = () => { while (limeG.children.length) { const c = limeG.children.pop(); c.geometry.dispose(); c.material.dispose(); }
    const s = B[T], x0 = s.x0, x1 = s.x0 + s.w;
    lime = [neonLine(limeG, x0, ZB - DEP, x0, ZB, LIME, 0.5, '#8fd81e'), neonLine(limeG, x1, ZB - DEP, x1, ZB, LIME, 0.5, '#8fd81e'), neonLine(limeG, x0, ZB, x1, ZB, LIME, 0.5, '#8fd81e'), neonLine(limeG, x0, ZB - DEP, x1, ZB - DEP, LIME, 0.5, '#8fd81e')]; };
  buildLime();
  const fillM = new THREE.MeshBasicMaterial({ color: '#7cc416', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }); const fill = new THREE.Mesh(new THREE.PlaneGeometry(SWr - 0.08, DEP - 0.08), fillM); fill.rotation.x = -Math.PI / 2; fill.position.set(B[T].cx, 0.012, ZB - DEP / 2); S.add(fill);
  const sg = pool('#6fc010', 3.4, 4.2, 0); sg.position.set(B[T].cx, 0.02, ZB - 1.25); S.add(sg);
  const lblC = document.createElement('canvas'); lblC.width = 256; lblC.height = 96; const lx = lblC.getContext('2d'); const lblTex = new THREE.CanvasTexture(lblC);
  const drawLbl = () => { lx.clearRect(0, 0, 256, 96); lx.font = '800 64px sans-serif'; lx.textAlign = 'center'; lx.textBaseline = 'middle'; lx.fillStyle = '#fff'; lx.fillText('B' + pad(T), 128, 50); lblTex.needsUpdate = true; };
  drawLbl();
  const lblM = new THREE.MeshBasicMaterial({ map: lblTex, color: '#5b6b45', transparent: true, depthWrite: false, toneMapped: false }); const lbl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.45), lblM); lbl.rotation.x = -Math.PI / 2; lbl.position.set(B[T].cx, 0.022, ZB - 0.4); S.add(lbl);

  const ledCol = (row, i) => { const s = (row === 'A' ? A : B)[i]; if (s.v === 'h') return null; if (row === 'B' && i === T) return LIME; if (s.v === 1) return '#F43F5E'; if (s.v === 'a') return '#3B82F6'; return '#22C55E'; };
  const leds = { A: [], B: [] };
  ['A', 'B'].forEach(row => { (row === 'A' ? A : B).forEach((s, i) => { const c = ledCol(row, i); if (!c) { leds[row].push(null); return; }
    const z = row === 'A' ? ZA + DEP - 0.16 : ZB - DEP + 0.16;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.09), new THREE.MeshBasicMaterial({ color: c, toneMapped: false })); m.position.set(s.cx, 0.03, z); S.add(m);
    const gl = pool(c, s.v === 'a' ? 0.9 : 1.5, s.v === 'a' ? 0.4 : 0.85, s.v === 'a' ? 0.18 : 0.5); gl.position.set(s.cx, 0.025, z); S.add(gl);
    leds[row].push({ m, gl }); }); });
  const recolorLeds = () => B.forEach((s, i) => { const L = leds.B[i]; if (!L) return; const c = ledCol('B', i); L.m.material.color.set(c); L.gl.material.color.set(c); });

  const BW = 0.9, BL = 2.1;
  const rr = (w, l, rf, rb) => { const s = new THREE.Shape(), x = w / 2, y = l / 2; s.moveTo(-x + rb, -y); s.lineTo(x - rb, -y); s.quadraticCurveTo(x, -y, x, -y + rb); s.lineTo(x, y - rf); s.quadraticCurveTo(x, y, x - rf, y); s.lineTo(-x + rf, y); s.quadraticCurveTo(-x, y, -x, y - rf); s.lineTo(-x, -y + rb); s.quadraticCurveTo(-x, -y, -x + rb, -y); return s; };
  const CG = new THREE.BoxGeometry(0.8, 0.28, 1.2); { const p = CG.attributes.position; for (let i = 0; i < p.count; i++) { if (p.getY(i) > 0) { p.setX(i, p.getX(i) * 0.74); p.setZ(i, p.getZ(i) < 0 ? p.getZ(i) * 0.45 : p.getZ(i) * 0.68); } } CG.computeVertexNormals(); }
  const BG = new THREE.ExtrudeGeometry(rr(BW - 0.12, BL - 0.12, 0.26, 0.18), { depth: 0.2, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 5, curveSegments: 12 });
  const car = (col, lit) => { const gp = new THREE.Group();
    const paint = new THREE.MeshPhysicalMaterial({ color: col, metalness: lit ? 0.3 : 0.7, roughness: lit ? 0.22 : 0.35, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: lit ? 1.2 : 1 });
    const glm = new THREE.MeshStandardMaterial({ color: '#05070b', metalness: 0.95, roughness: 0.05, envMapIntensity: 1.6 });
    const blk = new THREE.MeshStandardMaterial({ color: '#0a0b0d', roughness: 0.6 });
    const b = new THREE.Mesh(BG, paint); b.rotation.x = -Math.PI / 2; b.position.y = 0.15;
    const cb = new THREE.Mesh(CG, glm); cb.position.set(0, 0.57, 0.12);
    const rf = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.035, 0.7), paint); rf.position.set(0, 0.72, 0.2);
    const sk = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.02, 0.07, BL - 0.3), blk); sk.position.y = 0.16;
    [b, cb, rf, sk].forEach(m => { m.castShadow = true; m.receiveShadow = true; gp.add(m); });
    [[0.42, 0.7], [-0.42, 0.7], [0.42, -0.66], [-0.42, -0.66]].forEach(p => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.16, 20), blk); w.rotation.z = Math.PI / 2; w.position.set(p[0], 0.18, p[1]); gp.add(w); });
    [0.46, -0.46].forEach(x => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.08), paint); m.position.set(x, 0.48, -0.28); gp.add(m); });
    const tl = new THREE.MeshStandardMaterial({ color: '#2a0303', emissive: '#ff2418', emissiveIntensity: lit ? 2.2 : 0.15 });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.035, 0.03), tl); bar.position.set(0, 0.34, BL / 2 - 0.005); gp.add(bar);
    const hm = new THREE.MeshStandardMaterial({ color: '#cfd8e2', metalness: 0.5, roughness: 0.2, emissive: '#ffffff', emissiveIntensity: lit ? 4 : 0 });
    [0.29, -0.29].forEach(x => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.03), hm); m.position.set(x, 0.33, -BL / 2 + 0.005); m.rotation.y = x > 0 ? -0.18 : 0.18; gp.add(m); });
    if (lit) {
      [0.29, -0.29].forEach(x => { const sp = new THREE.SpotLight('#f2f5ff', 12, 10, 0.5, 0.85, 1.6); sp.position.set(x, 0.36, -BL / 2); const tg = new THREE.Object3D(); tg.position.set(x * 1.5, 0, -6); gp.add(sp); gp.add(tg); sp.target = tg; });
      const hp = pool('#e8eeff', 3, 4.6, 0.3); hp.position.set(0, 0.016, -BL / 2 - 2.1); gp.add(hp);
      const ug = pool('#8fd81e', 2, 3.2, 0.45); ug.position.y = 0.015; gp.add(ug);
      const ul = new THREE.PointLight('#9be320', 1.3, 2.6); ul.position.set(0, 0.06, 0); gp.add(ul);
    }
    S.add(gp); return gp; };
  const cols = ['#1a1e27', '#2a2f38', '#0f1218', '#20252e', '#14181f', '#2e333c'];
  let n = 0;
  A.forEach((s, i) => { if (s.v === 1) { const m = car(cols[n++ % cols.length], false); m.position.set(s.cx + Math.sin(i * 7) * 0.04, 0, ZA + 1.3); m.rotation.y = Math.sin(i * 3) * 0.02; } });
  B.forEach((s, i) => { if (s.v === 1) { const m = car(cols[n++ % cols.length], false); m.position.set(s.cx + Math.sin(i * 7) * 0.04, 0, ZB - 1.3); m.rotation.y = Math.PI + Math.sin(i * 3) * 0.02; } });
  const me = car('#eef0f2', true);
  const zp = ZB - 1.3;
  const mkCurve = () => { const tx = B[T].cx; return new THREE.CatmullRomCurve3([[-17, 0.7], [tx - 3.4, 0.7], [tx - 1.3, 0.75], [tx - 0.25, 1.35], [tx, 2.1], [tx, zp]].map(p => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal'); };
  let curve = mkCurve();
  const SEG = 260;
  const ribbon = (width) => { const pos = [], uv = [], idx = [];
    for (let i = 0; i <= SEG; i++) { const t = i / SEG, p = curve.getPointAt(t), d = curve.getTangentAt(t); const l = Math.hypot(d.x, d.z) || 1; const ox = -d.z / l * width / 2, oz = d.x / l * width / 2;
      pos.push(p.x + ox, 0, p.z + oz, p.x - ox, 0, p.z - oz); uv.push(t, 0, t, 1); if (i < SEG) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); ge.setIndex(idx); return ge; };
  const fadeTex = mkTex(512, 4, (x, w, h) => { const r = x.createLinearGradient(0, 0, w, 0); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(0.35, 'rgba(255,255,255,.35)'); r.addColorStop(0.8, 'rgba(255,255,255,.85)'); r.addColorStop(1, 'rgba(255,255,255,1)'); x.fillStyle = r; x.fillRect(0, 0, w, h); });
  const coreM = new THREE.MeshBasicMaterial({ color: '#ECFCCB', map: fadeTex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  const glowM = new THREE.MeshBasicMaterial({ color: LIME, map: fadeTex, alphaMap: stripTex, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  const route = new THREE.Mesh(ribbon(0.035), coreM); route.position.y = 0.028; S.add(route);
  const routeGlow = new THREE.Mesh(ribbon(0.26), glowM); routeGlow.position.y = 0.026; S.add(routeGlow);
  const tip = pool(LIME, 0.6, 0.6, 0.9); tip.position.y = 0.03; S.add(tip);

  let t0 = performance.now();
  const setT = (i) => {
    T = i; drawGround(); gt.needsUpdate = true; buildLime(); recolorLeds();
    fill.position.x = B[T].cx; sg.position.x = B[T].cx; lbl.position.x = B[T].cx; drawLbl();
    curve = mkCurve(); route.geometry.dispose(); route.geometry = ribbon(0.035); routeGlow.geometry.dispose(); routeGlow.geometry = ribbon(0.26);
    if (opts.getChipCode()) opts.getChipCode().textContent = 'Plaza B' + pad(T);
    t0 = performance.now();
  };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const pickSpot = (e) => { const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, C); const hit = ray.intersectObject(gr)[0]; if (!hit) return -1;
    const p = hit.point; if (p.z < ZB - DEP || p.z > ZB) return -1; const i = B.findIndex(s => p.x >= s.x0 && p.x < s.x0 + s.w); if (i < 0 || B[i].v === 1) return -1; return i; };

  let el = 1.0, dist = 14, aspect = 2.4;
  const size = () => { const w = cv.clientWidth || 1200, h = cv.clientHeight || 600; R.setSize(w, h, false); aspect = w / h; C.aspect = aspect; const t15 = 2 * Math.tan(15 * Math.PI / 180); const fitW = 20 / (t15 * aspect); const fitH = 9 * Math.sin(el) / (0.5 * t15); dist = Math.max(14, Math.min(40, Math.max(fitW, fitH))); C.setViewOffset(w, h, 0, w < 860 ? -h * 0.04 : -h * 0.23, w, h); C.updateProjectionMatrix(); };
  size(); if (window.ResizeObserver) { state.ro = new ResizeObserver(size); state.ro.observe(cv); }
  const ez = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const dim = new THREE.Color('#3c5414'), hot = new THREE.Color(LIME), gDim = new THREE.Color('#2c4a0a'), gHot = new THREE.Color('#8fd81e'), lDim = new THREE.Color('#5b6b45'), tmp = new THREE.Color();
  const chipPt = new THREE.Vector3();
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tick = (ms) => { if (state.dead) return;
    const DUR = 7.4, DELAY = 0.9, s = reduce ? 9 : ((ms - t0) / 1000) % 12;
    const u = s < DELAY ? 0 : (s < DUR ? ez((s - DELAY) / (DUR - DELAY)) : 1);
    const p = curve.getPointAt(u), tn = curve.getTangentAt(Math.min(Math.max(u, 0.001), 0.999)); me.position.set(p.x, 0, p.z); me.rotation.y = Math.atan2(-tn.x, -tn.z);
    const grow = Math.min(1, ss(0, 1, s / 2.6) * 1.0);
    const lead = Math.max(grow, Math.min(1, u + 0.06));
    const startI = Math.min(Math.floor(SEG * Math.max(0, u - 0.015)), SEG - 1) * 6, endI = Math.floor(SEG * lead) * 6;
    route.geometry.setDrawRange(startI, Math.max(0, endI - startI)); routeGlow.geometry.setDrawRange(startI, Math.max(0, endI - startI));
    const tp = curve.getPointAt(lead); tip.position.x = tp.x; tip.position.z = tp.z;
    const vis = s < DUR ? 1 : Math.max(0, 1 - (s - DUR) / 0.9); coreM.opacity = vis; glowM.opacity = 0.45 * vis; tip.material.opacity = 0.9 * (s < DUR ? 1 : 0);
    const heat = s < DUR ? ss(0.4, 1, u) : 1, br = s >= DUR ? 0.88 + 0.12 * Math.sin(ms / 400) : 1;
    tmp.copy(dim).lerp(hot, heat); lime.forEach(l => l.core.material.color.copy(tmp)); tmp.copy(gDim).lerp(gHot, heat); lime.forEach(l => { l.h.material.color.copy(tmp); l.h.material.opacity = (0.15 + 0.5 * heat) * br; });
    fillM.opacity = 0.3 * heat * br; sg.material.opacity = 0.45 * heat * br; lblM.color.copy(lDim).lerp(hot, heat);
    const az = reduce ? 0 : Math.sin(ms / 7000) * 0.06;
    C.position.set(Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist); C.lookAt(0, 0, 0.4);
    accK += (((opts.getAccUntil() && ms < opts.getAccUntil()) ? 1 : 0) - accK) * 0.06;
    const ap = 0.55 + 0.45 * Math.sin(ms / 180);
    accLines.forEach(l => { l.h.material.opacity = 0.18 + accK * 0.7 * ap; if (l.edge) l.core.material.opacity = accK; });
    accFloors.forEach(f => { f.material.opacity = accK * 0.35 * ap; });
    R.render(S, C);
    const chipEl = opts.getChip(); if (chipEl) { chipPt.set(B[T].cx, 1.6, zp); chipPt.project(C); const w = cv.clientWidth, h = cv.clientHeight; const x = (chipPt.x * 0.5 + 0.5) * w, y = (-chipPt.y * 0.5 + 0.5) * h; const cw = chipEl.offsetWidth || 140, ch = chipEl.offsetHeight || 90;
      chipEl.style.transform = 'translate(' + (x - cw / 2).toFixed(1) + 'px,' + (y - ch).toFixed(1) + 'px)'; chipEl.style.opacity = (0.25 + 0.75 * heat).toFixed(2); }
    state.raf = requestAnimationFrame(tick); };
  state.raf = requestAnimationFrame(tick);

  const onMove = (e) => { const i = pickSpot(e); cv.style.cursor = (i >= 0 && i !== T) ? 'pointer' : 'default'; };
  const onClick = (e) => { const i = pickSpot(e); if (i >= 0 && i !== T) setT(i); };
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('click', onClick);
  return () => {
    state.dead = true;
    cancelAnimationFrame(state.raf);
    if (state.ro) state.ro.disconnect();
    cv.removeEventListener('pointermove', onMove);
    cv.removeEventListener('click', onClick);
    S.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); });
    pm.dispose();
    R.dispose();
  };
}
