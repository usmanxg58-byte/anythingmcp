/* AgentFOXXY — WebGL scene: "the fox core"
   Layers: text particles (FOXXY) → shard swarm → displaced core → starfield → bloom
   No external assets: the wordmark is rasterised from a 2D canvas and sampled. */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(hover: none)').matches;

const COL = {
  gold:  new THREE.Color('#fcd34d'),
  fox:   new THREE.Color('#f59e0b'),
  ember: new THREE.Color('#ea580c'),
  deep:  new THREE.Color('#7c2d12'),
};

const rand = (() => { let s = 0x9e3779b9; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; })();

/* ── shared GLSL: simplex noise (Ashima / Gustavson, MIT) ── */
const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

/* ── wordmark → point cloud ─────────────────────────────── */
function textPointCloud(text = 'FOXXY', max = 5200) {
  const W = 1024, H = 300;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '900 210px Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  g.fillText(text, W / 2, H / 2 + 8);

  const { data } = g.getImageData(0, 0, W, H);
  const hits = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (data[(y * W + x) * 4 + 3] > 128) hits.push(x, y);
    }
  }
  const n = Math.min(max, hits.length / 2) | 0;
  const pos = new Float32Array(n * 3);
  const scale = 7.2 / W;
  for (let i = 0; i < n; i++) {
    const k = (rand() * (hits.length / 2)) | 0;
    pos[i * 3]     = (hits[k * 2] - W / 2) * scale;
    pos[i * 3 + 1] = -(hits[k * 2 + 1] - H / 2) * scale;
    pos[i * 3 + 2] = (rand() - 0.5) * 0.7;
  }
  return pos;
}

/* ── scene ─────────────────────────────────────────────── */
export function initScene(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !coarse, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    console.warn('[foxxy] WebGL unavailable:', err);
    return { fail: true };
  }
  if (!renderer.getContext()) return { fail: true };

  const dpr = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060a, 0.055);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);
  camera.position.set(0, 0, 8.4);

  const world = new THREE.Group();
  scene.add(world);

  /* ── 1. displaced core ── */
  const coreGeo = new THREE.IcosahedronGeometry(1.5, 22);
  const coreMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uAmp: { value: 0.34 }, uScroll: { value: 0 } },
    vertexShader: NOISE + `
      uniform float uTime, uAmp, uScroll;
      varying vec3 vN; varying vec3 vV; varying float vD;
      float disp(vec3 p){
        float a = snoise(p * 1.5 + vec3(0.0, uTime * 0.28, uTime * 0.15));
        float b = snoise(p * 3.6 - vec3(uTime * 0.22, 0.0, uTime * 0.31));
        return a * 0.7 + b * 0.3;
      }
      void main(){
        float d = disp(normal);
        vec3 pos = position + normal * d * uAmp * (1.0 + uScroll * 0.8);
        float e = 0.06;
        vec3 t1 = normalize(position + vec3(e,0.,0.));
        vec3 t2 = normalize(position + vec3(0.,e,0.));
        vec3 n = normalize(cross(t1 - normalize(position), t2 - normalize(position)));
        vN = normalize(normalMatrix * n);
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        vV = -mv.xyz; vD = d;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vN; varying vec3 vV; varying float vD;
      void main(){
        float f = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 2.2);
        float band = smoothstep(-0.55, 0.65, vD);
        vec3 col = mix(vec3(0.32,0.06,0.02), vec3(1.0,0.72,0.28), band);
        col = mix(col, vec3(1.0,0.93,0.72), f * 0.85);
        float pulse = 0.82 + 0.18 * sin(uTime * 1.7);
        gl_FragColor = vec4(col * (0.34 + f * 1.5) * pulse, clamp(0.16 + f * 0.9, 0.0, 1.0));
      }`,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  world.add(core);

  /* ── 2. wireframe shell ── */
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.15, 1),
    new THREE.MeshBasicMaterial({ color: 0xea580c, wireframe: true, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  world.add(shell);

  const shell2 = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.9, 1),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  world.add(shell2);

  /* ── 3. text particles ⇄ swarm ── */
  const target = textPointCloud('FOXXY', coarse ? 2200 : 5200);
  const COUNT = target.length / 3;
  const seeds = new Float32Array(COUNT);
  const seeds2 = new Float32Array(COUNT);
  const dummy = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    seeds[i] = rand();
    seeds2[i] = rand();
    const th = rand() * Math.PI * 2, ph = Math.acos(2 * rand() - 1), r = 4.2 + rand() * 3.4;
    dummy[i * 3] = Math.sin(ph) * Math.cos(th) * r;
    dummy[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * r * 0.62;
    dummy[i * 3 + 2] = Math.cos(ph) * r * 0.7;
  }

  const ptsGeo = new THREE.BufferGeometry();
  ptsGeo.setAttribute('position', new THREE.BufferAttribute(dummy, 3));
  ptsGeo.setAttribute('aTarget', new THREE.BufferAttribute(target, 3));
  ptsGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  ptsGeo.setAttribute('aSeed2', new THREE.BufferAttribute(seeds2, 1));

  const ptsMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uMorph: { value: 0 }, uPointer: { value: new THREE.Vector3(0, 0, 40) },
      uDpr: { value: dpr }, uScroll: { value: 0 },
    },
    vertexShader: NOISE + `
      attribute vec3 aTarget; attribute float aSeed; attribute float aSeed2;
      uniform float uTime, uMorph, uDpr, uScroll;
      uniform vec3 uPointer;
      varying float vA; varying float vMix;
      void main(){
        float sp = 0.16 + aSeed2 * 0.5;
        float ang = uTime * sp * (0.35 + aSeed * 0.8);
        float r = 3.4 + aSeed * 4.6;
        vec3 orbit = vec3(
          cos(ang) * r,
          sin(ang * 0.8 + aSeed * 6.28) * r * 0.42 * sin(uTime * 0.16 + aSeed * 3.0),
          sin(ang) * r * 0.72
        ) + position;

        float m = clamp(uMorph + snoise(aTarget * 0.55 + uTime * 0.12) * 0.09, 0.0, 1.0);
        vec3 p = mix(aTarget, orbit, m);

        p += vec3(
          snoise(p * 0.9 + uTime * 0.25),
          snoise(p * 0.9 + 31.4 - uTime * 0.21),
          snoise(p * 0.9 - 17.7 + uTime * 0.18)
        ) * (0.10 + m * 0.20);

        vec3 d = p - uPointer;
        float dl = length(d);
        float push = 1.0 - smoothstep(0.0, 3.4, dl);
        p += normalize(d + 0.0001) * push * push * 1.85;

        vMix = m;
        vA = (0.34 + 0.66 * (1.0 - m * 0.55)) * (0.55 + 0.45 * sin(uTime * 2.1 + aSeed * 12.0) * 0.5 + 0.225);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (1.0 + aSeed * 2.4) * uDpr * (34.0 / max(0.001, -mv.z)) * (1.0 + uScroll * 0.35);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vA; varying float vMix;
      void main(){
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float core = smoothstep(0.5, 0.0, d);
        float glow = pow(core, 3.5);
        vec3 col = mix(vec3(1.0, 0.95, 0.82), vec3(0.95, 0.42, 0.08), vMix);
        col = mix(col, vec3(0.75, 0.20, 0.03), vMix * 0.55);
        gl_FragColor = vec4(col, core * core * vA);
      }`,
  });
  const points = new THREE.Points(ptsGeo, ptsMat);
  world.add(points);

  /* ── 4. shard swarm (instanced) ── */
  const SHARDS = coarse ? 260 : 900;
  const tetra = new THREE.TetrahedronGeometry(0.1, 0);
  const shardGeo = new THREE.InstancedBufferGeometry();
  shardGeo.index = tetra.index;
  shardGeo.setAttribute('position', tetra.attributes.position);
  shardGeo.setAttribute('normal', tetra.attributes.normal);
  shardGeo.instanceCount = SHARDS;
  const aSeed = new Float32Array(SHARDS), aRad = new Float32Array(SHARDS), aScale = new Float32Array(SHARDS), aTint = new Float32Array(SHARDS);
  for (let i = 0; i < SHARDS; i++) {
    aSeed[i] = rand();
    aRad[i] = 2.6 + rand() * 4.4;
    aScale[i] = 0.5 + rand() * 1.9;
    aTint[i] = rand();
  }
  shardGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
  shardGeo.setAttribute('aRad', new THREE.InstancedBufferAttribute(aRad, 1));
  shardGeo.setAttribute('aScale', new THREE.InstancedBufferAttribute(aScale, 1));
  shardGeo.setAttribute('aTint', new THREE.InstancedBufferAttribute(aTint, 1));

  const shardMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uPointer: { value: new THREE.Vector3(0, 0, 40) },
      uScroll: { value: 0 }, uFox: { value: COL.fox }, uEmber: { value: COL.ember }, uGold: { value: COL.gold },
    },
    vertexShader: `
      attribute float aSeed, aRad, aScale, aTint;
      uniform float uTime, uScroll; uniform vec3 uPointer;
      varying float vTint; varying float vFres; varying float vSeed;
      mat3 rot(float a, float b){ float ca=cos(a), sa=sin(a), cb=cos(b), sb=sin(b);
        return mat3(ca,0.,-sa, 0.,1.,0., sa,0.,ca) * mat3(1.,0.,0., 0.,cb,-sb, 0.,sb,cb); }
      void main(){
        float sp = 0.1 + aSeed * 0.42;
        float ang = uTime * sp + aSeed * 6.2831;
        float rad = aRad + sin(uTime * 0.35 + aSeed * 9.0) * 0.28;
        vec3 p = vec3(cos(ang) * rad, sin(ang * 1.3 + aSeed * 4.0) * rad * 0.3, sin(ang) * rad * 0.78);
        p.y += uScroll * 1.2 * (0.3 + aSeed);

        vec3 local = rot(uTime * (0.6 + aSeed * 2.2), aSeed * 12.0) * position * aScale;
        vec3 wp = p + local;

        vec3 d = wp - uPointer;
        float dl = length(d);
        float push = 1.0 - smoothstep(0.0, 2.8, dl);
        wp += normalize(d + 0.0001) * push * push * 1.5;

        vSeed = aSeed;
        vTint = aTint;
        vec4 mv = modelViewMatrix * vec4(wp, 1.0);
        vFres = pow(1.0 - abs(dot(normalize(normalMatrix * rot(uTime * 0.7, aSeed * 6.0) * normal), normalize(-mv.xyz))), 2.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uFox, uEmber, uGold;
      varying float vTint; varying float vFres; varying float vSeed;
      void main(){
        vec3 col = mix(uEmber, uFox, vTint);
        col = mix(col, uGold, smoothstep(0.82, 1.0, vTint));
        gl_FragColor = vec4(col * (0.30 + vFres * 1.6), 0.16 + vFres * 0.62);
      }`,
  });
  world.add(new THREE.Mesh(shardGeo, shardMat));

  /* ── 5. starfield ── */
  const STARS = coarse ? 700 : 2200;
  const sPos = new Float32Array(STARS * 3);
  const sSeed = new Float32Array(STARS);
  for (let i = 0; i < STARS; i++) {
    const th = rand() * Math.PI * 2, ph = Math.acos(2 * rand() - 1), r = 9 + rand() * 24;
    sPos[i * 3] = Math.sin(ph) * Math.cos(th) * r;
    sPos[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * r;
    sPos[i * 3 + 2] = Math.cos(ph) * r;
    sSeed[i] = rand();
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  starGeo.setAttribute('aSeed', new THREE.BufferAttribute(sSeed, 1));
  const starMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uDpr: { value: dpr } },
    vertexShader: `
      attribute float aSeed; uniform float uTime, uDpr; varying float vS;
      void main(){
        vS = 0.25 + aSeed * 0.75;
        vec3 p = position;
        p.y += sin(uTime * 0.08 + aSeed * 6.28) * 0.5;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (0.6 + aSeed * 1.9) * uDpr * (26.0 / max(0.001, -mv.z));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vS;
      void main(){
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float g = pow(smoothstep(0.5, 0.0, d), 2.6);
        gl_FragColor = vec4(mix(vec3(0.55,0.62,0.8), vec3(1.0,0.78,0.42), vS), g * vS * 0.75);
      }`,
  });
  scene.add(new THREE.Points(starGeo, starMat));

  /* ── post ── */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), coarse ? 0.62 : 0.9, 0.72, 0.16);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ── interaction state ── */
  const ptr = new THREE.Vector2(0, 0);
  const ptrSmooth = new THREE.Vector2(0, 0);
  const world3 = new THREE.Vector3(0, 0, 40);
  let scroll = 0, scrollTarget = 0, morph = 0, morphTarget = 0, visible = true, t = 0;

  const onMove = (e) => {
    ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  };
  addEventListener('pointermove', onMove, { passive: true });

  function resize() {
    const w = canvas.clientWidth || innerWidth;
    const h = canvas.clientHeight || innerHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.setSize(w, h);
  }
  addEventListener('resize', resize, { passive: true });
  resize();

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
  io.observe(canvas);

  const onLost = (e) => { e.preventDefault(); console.warn('[foxxy] context lost'); };
  canvas.addEventListener('webglcontextlost', onLost, false);

  /* adaptive quality: software renderers and weak iGPUs get the expensive
     post-processing and the 2× pixel ratio dropped instead of a slideshow */
  let probeFrames = 0;
  let probeStart = 0;
  let degraded = false;
  function degrade() {
    degraded = true;
    renderer.setPixelRatio(1);
    ptsMat.uniforms.uDpr.value = 1;
    starMat.uniforms.uDpr.value = 1;
    bloom.enabled = false;
    resize();
    console.info('[foxxy] low-performance GPU detected — bloom and 2× DPR disabled');
  }

  function frame() {
    if (!visible || document.hidden) return;
    t += 0.016;

    if (!degraded) {
      const now = performance.now();
      if (!probeStart) probeStart = now;
      probeFrames++;
      const span = now - probeStart;
      if (span > 1400) {
        if (probeFrames / (span / 1000) < 26) degrade();
        probeFrames = 0;
        probeStart = now;
      }
    }

    ptrSmooth.lerp(ptr, 0.045);
    world3.x = ptrSmooth.x * 4.2;
    world3.y = ptrSmooth.y * 2.6;
    world3.z = 0.6;

    scroll += (scrollTarget - scroll) * 0.06;
    morph += (morphTarget - morph) * 0.035;

    world.rotation.y = t * 0.075 + ptrSmooth.x * 0.42;
    world.rotation.x = -ptrSmooth.y * 0.24 + scroll * 0.22;

    camera.position.z = 8.4 + scroll * 3.1;
    camera.position.y = -scroll * 0.9 + ptrSmooth.y * 0.18;
    camera.lookAt(0, 0, 0);

    core.rotation.y = -t * 0.13;
    core.rotation.z = Math.sin(t * 0.21) * 0.16;
    coreMat.uniforms.uTime.value = t;
    coreMat.uniforms.uScroll.value = scroll;
    core.scale.setScalar(1 + Math.sin(t * 0.9) * 0.03 - scroll * 0.18);

    shell.rotation.y = t * 0.11;
    shell.rotation.x = t * 0.05;
    shell2.rotation.y = -t * 0.07;
    shell2.rotation.z = t * 0.04;

    ptsMat.uniforms.uTime.value = t;
    ptsMat.uniforms.uMorph.value = morph;
    ptsMat.uniforms.uScroll.value = scroll;
    ptsMat.uniforms.uPointer.value.copy(world3);

    shardMat.uniforms.uTime.value = t;
    shardMat.uniforms.uScroll.value = scroll;
    shardMat.uniforms.uPointer.value.copy(world3);
    starMat.uniforms.uTime.value = t;

    composer.render();
  }

  if (reduced) {
    // one static frame, no loop
    t = 6;
    for (let i = 0; i < 8; i++) frame();
    return { fail: false, dispose() {} };
  }

  let raf = 0;
  const loop = () => { raf = requestAnimationFrame(loop); frame(); };
  raf = requestAnimationFrame(loop);

  return {
    fail: false,
    setScroll(p) { scrollTarget = p; },
    setMorph(m) { morphTarget = m; },
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      removeEventListener('pointermove', onMove);
      removeEventListener('resize', resize);
      renderer.dispose();
    },
  };
}
