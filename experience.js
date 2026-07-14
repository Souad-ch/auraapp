/* AURA — cinematic 3D experience (Three.js). Real glass, bloom, scroll flythrough. */
import * as THREE from 'three';
import { EffectComposer } from './vendor/three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('scene');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- reveal zones on scroll ---------- */
const zones = Array.from(document.querySelectorAll('.zone'));
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }), { threshold: 0.25 });
  zones.forEach(z => { if (!z.classList.contains('in')) io.observe(z); });
} else zones.forEach(z => z.classList.add('in'));

let renderer, scene, camera, composer, bloom, crystal, panels = [], stars, clock;
let scrollN = 0, scrollTarget = 0;

function scrollProgress() {
  const d = document.documentElement;
  const m = d.scrollHeight - d.clientHeight;
  return m > 0 ? (d.scrollTop || window.scrollY) / m : 0;
}

/* environment map (gradient) so glass has something to reflect/refract */
function envTexture(r) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.0, '#1a1130'); g.addColorStop(0.45, '#2a1b4d');
  g.addColorStop(0.7, '#5a3aa0'); g.addColorStop(1.0, '#e3b661');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  // soft light blobs for highlights
  function blob(px, py, rad, col) { const rg = x.createRadialGradient(px, py, 0, px, py, rad); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = rg; x.fillRect(0, 0, 256, 256); }
  blob(70, 60, 120, 'rgba(200,160,255,.8)');
  blob(200, 120, 90, 'rgba(255,220,150,.7)');
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(r);
  const env = pmrem.fromEquirectangular(tex).texture;
  tex.dispose(); pmrem.dispose();
  return env;
}

function makePanel(env, tint) {
  // thin rounded glass shard
  const shape = new THREE.Shape();
  const w = 1.0, h = 1.4, rr = 0.22;
  shape.moveTo(-w + rr, -h);
  shape.lineTo(w - rr, -h); shape.quadraticCurveTo(w, -h, w, -h + rr);
  shape.lineTo(w, h - rr); shape.quadraticCurveTo(w, h, w - rr, h);
  shape.lineTo(-w + rr, h); shape.quadraticCurveTo(-w, h, -w, h - rr);
  shape.lineTo(-w, -h + rr); shape.quadraticCurveTo(-w, -h, -w + rr, -h);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, steps: 1 });
  geo.center();
  const mat = new THREE.MeshPhysicalMaterial({
    color: tint, metalness: 0, roughness: 0.12, transmission: 0.0,
    transparent: true, opacity: 0.42, envMap: env, envMapIntensity: 1.6,
    iridescence: 1.0, iridescenceIOR: 1.35, clearcoat: 1.0, clearcoatRoughness: 0.15,
    emissive: tint, emissiveIntensity: 0.08, side: THREE.DoubleSide
  });
  return new THREE.Mesh(geo, mat);
}

function init() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(1.6, window.devicePixelRatio || 1));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0818, 0.03);
  camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 6);

  const env = envTexture(renderer);
  scene.environment = env;

  /* central crystal — faceted glowing gem */
  const cgeo = new THREE.IcosahedronGeometry(1.0, 0);
  const cmat = new THREE.MeshStandardMaterial({
    color: 0x8a5cd6, metalness: 0.4, roughness: 0.12,
    emissive: 0x6a3fc0, emissiveIntensity: 0.28,
    envMap: env, envMapIntensity: 1.5, flatShading: true
  });
  crystal = new THREE.Mesh(cgeo, cmat);
  crystal.position.set(0, 1.75, 0);
  scene.add(crystal);
  // gold wire edges
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(cgeo), new THREE.LineBasicMaterial({ color: 0xe3b661, transparent: true, opacity: 0.5 }));
  crystal.add(edges);

  /* floating glass shards spread along -z so we fly past them */
  const tints = [0xb98fe0, 0xe3b661, 0x9a72d6, 0xc7a0ea, 0xd9b877];
  for (let i = 0; i < 9; i++) {
    const p = makePanel(env, tints[i % tints.length]);
    const side = i % 2 === 0 ? 1 : -1;
    p.position.set(side * (3.8 + Math.random() * 2.0), (Math.random() - 0.5) * 3.6, -7 - i * 2.8);
    p.rotation.set(Math.random() * 0.5, side * (0.5 + Math.random() * 0.5), (Math.random() - 0.5) * 0.4);
    p.userData.spin = (Math.random() - 0.5) * 0.15;
    p.userData.bob = Math.random() * 6.28;
    panels.push(p); scene.add(p);
  }

  /* particles */
  const N = 700, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const cA = new THREE.Color(0xa678e6), cB = new THREE.Color(0xe3b661);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 26; pos[i * 3 + 1] = (Math.random() - 0.5) * 18; pos[i * 3 + 2] = -Math.random() * 40 + 6;
    const c = Math.random() < 0.4 ? cB : cA; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  stars = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(stars);

  /* lights */
  scene.add(new THREE.AmbientLight(0x554477, 0.6));
  const l1 = new THREE.PointLight(0xa678e6, 60, 40); l1.position.set(4, 5, 4); scene.add(l1);
  const l2 = new THREE.PointLight(0xe3b661, 40, 40); l2.position.set(-5, -2, 3); scene.add(l2);
  const l3 = new THREE.DirectionalLight(0xffffff, 1.1); l3.position.set(0, 6, 8); scene.add(l3);

  /* postprocessing bloom */
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.5, 0.25);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  clock = new THREE.Clock();
  addEventListener('resize', onResize, { passive: true });
  addEventListener('scroll', () => { scrollTarget = scrollProgress(); }, { passive: true });
  scrollTarget = scrollProgress();

  const loading = document.getElementById('loading');
  if (loading) { loading.classList.add('gone'); setTimeout(() => loading.remove(), 700); }
  renderer.setAnimationLoop(animate);
}

function onResize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
}

function animate() {
  const t = reduce ? 0 : clock.getElapsedTime();
  scrollN += (scrollTarget - scrollN) * 0.06;

  // camera flies forward through the scene as you scroll
  camera.position.z = 6 - scrollN * 22;
  camera.position.x = Math.sin(scrollN * 3.14) * 0.6;
  camera.position.y = 0.2 + Math.sin(scrollN * 6.28) * 0.3;
  camera.lookAt(0, 0.3, camera.position.z - 6);

  if (crystal) {
    crystal.rotation.y = t * 0.35 + scrollN * 3.0;
    crystal.rotation.x = 0.35 + t * 0.12;
    crystal.position.z = -scrollN * 4; // keep it ahead a touch
  }
  panels.forEach((p, i) => {
    p.rotation.z += p.userData.spin * 0.01;
    p.position.y += Math.sin(t * 0.6 + p.userData.bob) * 0.0016;
  });
  if (stars) stars.rotation.y = t * 0.02;

  composer.render();
}

try { init(); }
catch (e) {
  // graceful fallback: dark holographic gradient
  console.warn('3D init failed', e);
  canvas.style.background = 'radial-gradient(45% 32% at 50% 34%,rgba(166,120,230,.8),transparent 66%),radial-gradient(60% 44% at 50% 34%,rgba(227,182,97,.4),transparent 60%),linear-gradient(165deg,#0d0a1c,#080611)';
  const l = document.getElementById('loading'); if (l) l.classList.add('gone');
}
