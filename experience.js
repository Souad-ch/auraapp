/* AURA — cinematic 3D experience (Three.js).
   Each section morphs the centerpiece into a 3D emblem of its content. */
import * as THREE from 'three';
import { EffectComposer } from './vendor/three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('scene');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* reveal zones + track active emblem */
const zones = Array.from(document.querySelectorAll('.zone'));
let activeEmblem = 'crystal';
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); if (e.target.dataset.emblem) activeEmblem = e.target.dataset.emblem; }
  }), { threshold: 0.35 });
  zones.forEach(z => io.observe(z));
} else zones.forEach(z => z.classList.add('in'));

let renderer, scene, camera, composer, env, panels = [], stars, clock;
let scrollN = 0, scrollTarget = 0;
const emblems = {};

const scrollProgress = () => { const d = document.documentElement, m = d.scrollHeight - d.clientHeight; return m > 0 ? (d.scrollTop || scrollY) / m : 0; };

function envTexture(r) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#1a1130'); g.addColorStop(.45, '#2a1b4d'); g.addColorStop(.7, '#5a3aa0'); g.addColorStop(1, '#e3b661');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const blob = (px, py, rad, col) => { const rg = x.createRadialGradient(px, py, 0, px, py, rad); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = rg; x.fillRect(0, 0, 256, 256); };
  blob(70, 60, 120, 'rgba(200,160,255,.8)'); blob(200, 120, 90, 'rgba(255,220,150,.7)');
  const tex = new THREE.CanvasTexture(c); tex.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(r); const e = pm.fromEquirectangular(tex).texture; tex.dispose(); pm.dispose();
  return e;
}

/* ---- emblem factory: each returns {group, update, mats[]} ---- */
function mkEmblem(build) {
  const group = new THREE.Group();
  const mats = [];
  const api = { group, mats, update: () => {} };
  build(group, mats, api);
  group.traverse(o => { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.transparent = true; if (m._base === undefined) m._base = m.opacity; mats.push(m); }); } });
  group.scale.setScalar(0.001); group.visible = false;
  return api;
}

function buildAll() {
  const MAUVE = 0x8a5cd6, GOLD = 0xe3b661;

  // 1) AURA crystal — energy/aura
  emblems.crystal = mkEmblem((g) => {
    const geo = new THREE.IcosahedronGeometry(1.0, 0);
    const m = new THREE.MeshStandardMaterial({ color: 0x8a5cd6, metalness: .4, roughness: .12, emissive: 0x6a3fc0, emissiveIntensity: .3, envMap: env, envMapIntensity: 1.5, flatShading: true });
    const mesh = new THREE.Mesh(geo, m); g.add(mesh);
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: .5 })));
    return { update: (t) => { g.rotation.y = t * .35; g.rotation.x = .35 + t * .12; } };
  });
  emblems.crystal.update = (t) => { emblems.crystal.group.rotation.y = t * .35; emblems.crystal.group.rotation.x = .35 + t * .12; };

  // 2) MOON + stars — energy reading / tarot
  emblems.moon = mkEmblem((g) => {
    const moon = new THREE.Mesh(new THREE.SphereGeometry(0.8, 48, 48),
      new THREE.MeshStandardMaterial({ color: 0xcdbcf5, emissive: 0x9a7fe0, emissiveIntensity: .5, roughness: .5, metalness: .1, envMap: env, envMapIntensity: 1 }));
    g.add(moon);
    // crescent shadow sphere
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.82, 48, 48), new THREE.MeshBasicMaterial({ color: 0x0b0917 }));
    sh.position.set(0.5, 0.18, 0.35); g.add(sh);
    // orbiting stars
    const N = 60, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const a = Math.random() * 6.28, r = 1.4 + Math.random() * 1.1, y = (Math.random() - .5) * 2; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = y; pos[i * 3 + 2] = Math.sin(a) * r; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const str = new THREE.Points(pg, new THREE.PointsMaterial({ color: GOLD, size: .07, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(str); g.userData.stars = str;
  });
  emblems.moon.update = (t) => { const g = emblems.moon.group; g.rotation.y = t * .25; if (g.userData.stars) g.userData.stars.rotation.y = -t * .4; };

  // 3) THETA waves — concentric pulsing frequency rings
  emblems.theta = mkEmblem((g) => {
    const rings = [];
    for (let i = 0; i < 6; i++) {
      const r = 0.4 + i * 0.28;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 12, 80),
        new THREE.MeshStandardMaterial({ color: i % 2 ? GOLD : MAUVE, emissive: i % 2 ? 0xb98a2e : 0x6a3fc0, emissiveIntensity: 1.2, metalness: .3, roughness: .3 }));
      g.add(ring); rings.push(ring);
    }
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), new THREE.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xe3b661, emissiveIntensity: 1.5 }));
    g.add(core); g.userData.rings = rings; g.rotation.x = 1.15;
  });
  emblems.theta.update = (t) => { const g = emblems.theta.group; g.rotation.z = t * .12; g.userData.rings.forEach((r, i) => { const s = 1 + 0.14 * Math.sin(t * 2.2 - i * 0.7); r.scale.setScalar(s); }); };

  // 4) REIKI — energy sphere with radiating rays
  emblems.reiki = mkEmblem((g) => {
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 32), new THREE.MeshStandardMaterial({ color: 0xe9c98a, emissive: GOLD, emissiveIntensity: 1.1, roughness: .3, metalness: .2, envMap: env }));
    g.add(core);
    const rays = new THREE.Group(); const N = 14;
    for (let i = 0; i < N; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.7, 10),
        new THREE.MeshStandardMaterial({ color: MAUVE, emissive: 0x7a4fd0, emissiveIntensity: 1, transparent: true, opacity: .85 }));
      const a = (i / N) * 6.28, b = Math.random() * 3.14;
      cone.position.set(Math.cos(a) * Math.sin(b) * 0.95, Math.cos(b) * 0.95, Math.sin(a) * Math.sin(b) * 0.95);
      cone.lookAt(0, 0, 0); cone.rotateX(Math.PI / 2); cone.position.multiplyScalar(1.15);
      rays.add(cone);
    }
    g.add(rays); g.userData.rays = rays;
  });
  emblems.reiki.update = (t) => { const g = emblems.reiki.group; g.rotation.y = t * .3; if (g.userData.rays) g.userData.rays.scale.setScalar(1 + 0.08 * Math.sin(t * 3)); };

  // 5) SOUND — singing bowl + expanding sound rings
  emblems.sound = mkEmblem((g) => {
    const bowl = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.16, 20, 60),
      new THREE.MeshStandardMaterial({ color: GOLD, emissive: 0x9a6e1e, emissiveIntensity: .7, metalness: .8, roughness: .25, envMap: env, envMapIntensity: 1.5 }));
    bowl.rotation.x = 1.35; g.add(bowl);
    const rings = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.02, 10, 60), new THREE.MeshStandardMaterial({ color: 0xcdbcf5, emissive: MAUVE, emissiveIntensity: 1.3, transparent: true }));
      ring.rotation.x = 1.35; g.add(ring); rings.push(ring);
    }
    g.userData.rings = rings;
  });
  emblems.sound.update = (t) => { const g = emblems.sound.group; g.rotation.y = t * .2; g.userData.rings.forEach((r, i) => { const ph = (t * 0.5 + i / 3) % 1; const s = 1 + ph * 2.4; r.scale.set(s, s, 1); r.material.opacity = (1 - ph) * (r.material._k || 1); }); };

  // 6) CHAKRA — 7 glowing colored orbs stacked
  emblems.chakra = mkEmblem((g) => {
    const cols = [0xe14b4b, 0xe8843f, 0xf0c34b, 0x54c07a, 0x4ba6e0, 0x5a5ad8, 0x9a5cd6];
    const orbs = [];
    cols.forEach((c, i) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.26, 28, 28), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.1, roughness: .35, metalness: .1 }));
      s.position.y = 1.8 - i * 0.6; g.add(s); orbs.push(s);
    });
    // thin energy column
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xcdbcf5, emissiveIntensity: .8, transparent: true, opacity: .5 }));
    g.add(col); g.userData.orbs = orbs;
  });
  emblems.chakra.update = (t) => { const g = emblems.chakra.group; g.rotation.y = t * .25; g.userData.orbs.forEach((o, i) => { o.position.x = Math.sin(t * 1.5 + i) * 0.05; const p = 1 + 0.12 * Math.sin(t * 2 + i * 0.8); o.scale.setScalar(p); }); };

  // add all to a shared stage (upper-center)
  const stage = new THREE.Group(); stage.position.set(0, 1.5, 0); scene.add(stage);
  Object.values(emblems).forEach(e => stage.add(e.group));
  // remember base opacity for sound rings
  emblems.sound.group.userData.rings.forEach(r => r.material._k = 1);
}

function makePanel(tint) {
  const s = new THREE.Shape(); const w = 1, h = 1.4, rr = 0.22;
  s.moveTo(-w + rr, -h); s.lineTo(w - rr, -h); s.quadraticCurveTo(w, -h, w, -h + rr);
  s.lineTo(w, h - rr); s.quadraticCurveTo(w, h, w - rr, h); s.lineTo(-w + rr, h);
  s.quadraticCurveTo(-w, h, -w, h - rr); s.lineTo(-w, -h + rr); s.quadraticCurveTo(-w, -h, -w + rr, -h);
  const geo = new THREE.ExtrudeGeometry(s, { depth: .06, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 2, steps: 1 }); geo.center();
  const mat = new THREE.MeshPhysicalMaterial({ color: tint, metalness: 0, roughness: .12, transparent: true, opacity: .34, envMap: env, envMapIntensity: 1.6, iridescence: 1, iridescenceIOR: 1.35, clearcoat: 1, clearcoatRoughness: .15, emissive: tint, emissiveIntensity: .07, side: THREE.DoubleSide });
  return new THREE.Mesh(geo, mat);
}

function init() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(1.6, devicePixelRatio || 1));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x0a0818, 0.028);
  camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100); camera.position.set(0, 0.5, 6);
  env = envTexture(renderer); scene.environment = env;

  buildAll();

  const tints = [0xb98fe0, 0xe3b661, 0x9a72d6, 0xc7a0ea, 0xd9b877];
  for (let i = 0; i < 9; i++) {
    const p = makePanel(tints[i % tints.length]); const side = i % 2 ? -1 : 1;
    p.position.set(side * (3.8 + Math.random() * 2), (Math.random() - .5) * 3.6, -7 - i * 2.8);
    p.rotation.set(Math.random() * .5, side * (.5 + Math.random() * .5), (Math.random() - .5) * .4);
    p.userData.bob = Math.random() * 6.28; panels.push(p); scene.add(p);
  }

  const N = 650, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const cA = new THREE.Color(0xa678e6), cB = new THREE.Color(0xe3b661);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 26; pos[i * 3 + 1] = (Math.random() - .5) * 18; pos[i * 3 + 2] = -Math.random() * 40 + 6; const c = Math.random() < .4 ? cB : cA; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  stars = new THREE.Points(pg, new THREE.PointsMaterial({ size: .06, vertexColors: true, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(stars);

  scene.add(new THREE.AmbientLight(0x554477, 0.7));
  const l1 = new THREE.PointLight(0xa678e6, 60, 40); l1.position.set(4, 5, 4); scene.add(l1);
  const l2 = new THREE.PointLight(0xe3b661, 40, 40); l2.position.set(-5, -2, 3); scene.add(l2);
  const l3 = new THREE.DirectionalLight(0xffffff, 1.1); l3.position.set(0, 6, 8); scene.add(l3);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.6, 0.5, 0.22));
  composer.addPass(new OutputPass());

  clock = new THREE.Clock();
  addEventListener('resize', onResize, { passive: true });
  addEventListener('scroll', () => { scrollTarget = scrollProgress(); }, { passive: true });
  scrollTarget = scrollProgress();
  const l = document.getElementById('loading'); if (l) { l.classList.add('gone'); setTimeout(() => l.remove(), 700); }
  renderer.setAnimationLoop(animate);
}

function onResize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); }

function animate() {
  const t = reduce ? 1.5 : clock.getElapsedTime();
  scrollN += (scrollTarget - scrollN) * 0.06;

  // gentle camera drift (keeps the stage framed, adds life)
  camera.position.x = Math.sin(scrollN * 6.28) * 0.5;
  camera.position.y = 0.5 + Math.sin(t * 0.3) * 0.06;
  camera.lookAt(0, 1.0, -2);

  // cross-fade emblems: only the active one grows in
  for (const key in emblems) {
    const e = emblems[key]; const on = key === activeEmblem;
    const cur = e.group.scale.x; const tgt = on ? 1 : 0.001;
    const s = cur + (tgt - cur) * 0.09; e.group.scale.setScalar(s);
    e.group.visible = s > 0.02;
    const k = Math.max(0, (s - 0.02) / 0.98);
    e.mats.forEach(m => { if (m._base !== undefined) { m.opacity = m._base * k; if (m._k !== undefined) m._k = k; } });
    if (e.group.visible) e.update(t);
  }

  panels.forEach(p => { p.rotation.z += 0.0006; p.position.y += Math.sin(t * 0.6 + p.userData.bob) * 0.0015; });
  if (stars) stars.rotation.y = t * 0.02;
  composer.render();
}

try { init(); }
catch (e) {
  console.warn('3D init failed', e);
  canvas.style.background = 'radial-gradient(45% 32% at 50% 34%,rgba(166,120,230,.8),transparent 66%),radial-gradient(60% 44% at 50% 34%,rgba(227,182,97,.4),transparent 60%),linear-gradient(165deg,#0d0a1c,#080611)';
  const l = document.getElementById('loading'); if (l) l.classList.add('gone');
}
