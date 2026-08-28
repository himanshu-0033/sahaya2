import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CORE_PARTS, RIBBONS } from './sculpturePaths.js';
import Inkblot3D from '../features/inkblot/Inkblot3D.jsx';

// The hero sculpture as real geometry: the ink-blot paths in
// lib/sculpturePaths.js get extruded and given a transmissive, iridescent
// glass material, so the piece refracts and picks up colour as it turns.
//
// The SVG version (Inkblot3D) stays as the fallback for machines without
// WebGL — it draws the same paths, just flat.

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl')),
    );
  } catch {
    return false;
  }
}

// SVGLoader works on a document, not a bare `d` string, so each path is
// wrapped in a minimal SVG. `evenodd` is what punches the hollow centre out
// of each wing — without it the inner contour would fill in solid.
function shapesFromPath(loader, d) {
  const doc = `<svg xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="${d}"/></svg>`;
  const shapes = [];
  for (const path of loader.parse(doc).paths) {
    shapes.push(...SVGLoader.createShapes(path));
  }
  return shapes;
}

function glassMaterial(tint, iridescenceThickness) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(tint),
    // Fully transmissive: light passes through and bends rather than
    // bouncing off, which is what separates glass from shiny plastic.
    transmission: 1,
    thickness: 18,
    ior: 1.6,
    roughness: 0.07,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    // The oil-on-water sheen. Varying the film thickness per ribbon is what
    // spreads the colour across the piece instead of tinting it uniformly.
    iridescence: 1,
    iridescenceIOR: 1.34,
    iridescenceThicknessRange: [100, iridescenceThickness],
    attenuationColor: new THREE.Color(tint),
    attenuationDistance: 34,
    envMapIntensity: 1.5,
    side: THREE.DoubleSide,
    transparent: true,
  });
}

// The reflection only needs to read as a soft echo on a glossy floor, so it
// skips transmission entirely — refraction there would cost a second render
// pass per frame and be invisible under the fade.
function reflectionMaterial(tint) {
  return new THREE.MeshBasicMaterial({
    // Darkened well below the real thing: on a near-black floor an echo at
    // full strength stops reading as a reflection and just looks like more
    // sculpture hanging underneath.
    color: new THREE.Color(tint).multiplyScalar(0.30),
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

// Builds one half of the sculpture. The paths describe the left side only;
// the right is the same geometry mirrored, exactly like folding the paper.
function buildArt(makeMaterial) {
  const loader = new SVGLoader();
  const art = new THREE.Group();
  const disposables = [];

  const parts = [
    ...RIBBONS.map((r) => ({ d: r.d, tint: r.tint, depth: r.depth, z: r.z, mirror: true })),
    ...CORE_PARTS.map((c) => ({ ...c, mirror: true })),
  ];

  parts.forEach((part, i) => {
    const shapes = shapesFromPath(loader, part.d);
    if (shapes.length === 0) return;

    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth: part.depth,
      bevelEnabled: true,
      bevelThickness: 1.7,
      bevelSize: 1.3,
      bevelOffset: 0,
      bevelSegments: 3,
      curveSegments: 14,
    });
    disposables.push(geometry);

    const material = makeMaterial(part.tint, 320 + i * 70);
    disposables.push(material);

    for (const sign of part.mirror ? [1, -1] : [1]) {
      const mesh = new THREE.Mesh(geometry, material);
      // Extrusion grows along +Z from the shape plane; pull it back by half
      // its depth so `part.z` positions the ribbon's middle, not its face.
      mesh.position.z = part.z - part.depth / 2;
      mesh.scale.x = sign;
      art.add(mesh);
    }
  });

  // The paths are authored in SVG space, where Y grows downward. A half turn
  // about X puts them the right way up — a rotation rather than a negative
  // scale, so the surface normals stay correct for the lighting.
  art.rotation.x = Math.PI;

  return { art, disposables };
}

const DRAG_SPEED = 0.0095; // radians per pixel dragged
const IDLE_SPIN = 0.0022; // radians per frame when left alone
const FRICTION = 0.94; // how quickly a flick bleeds off
const MAX_TILT = 0.62; // radians, so it never tips past its own poles

export default function GlassSculpture({ className = '' }) {
  const hostRef = useRef(null);
  const [supported] = useState(hasWebGL);
  const [grabbing, setGrabbing] = useState(false);

  useEffect(() => {
    if (!supported) return;
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'pan-y';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 1, 3000);
    camera.position.set(0, 0, 560);

    // Glass has nothing to show without something to refract. A neutral room
    // gives it structure; the two coloured lamps supply the teal/amber cast
    // the rest of the app runs on.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-180, 220, 320);
    scene.add(key);

    const teal = new THREE.PointLight(0x4fd8c8, 900, 1400, 2);
    teal.position.set(-260, 60, 220);
    scene.add(teal);

    const amber = new THREE.PointLight(0xff8a3d, 780, 1400, 2);
    amber.position.set(240, -110, 180);
    scene.add(amber);

    const rim = new THREE.DirectionalLight(0xa79cf0, 1.1);
    rim.position.set(160, -180, -320);
    scene.add(rim);

    scene.add(new THREE.AmbientLight(0xffffff, 0.28));

    // Sculpture, plus its echo on the floor.
    const pivot = new THREE.Group();
    const { art, disposables } = buildArt(glassMaterial);
    pivot.add(art);

    const reflPivot = new THREE.Group();
    const { art: reflArt, disposables: reflDisposables } = buildArt(reflectionMaterial);
    reflPivot.add(reflArt);

    // Centre the piece on its own bounding box so it turns about its middle
    // rather than about wherever the path coordinates happen to sit.
    const box = new THREE.Box3().setFromObject(art);
    const centre = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    art.position.sub(centre);
    reflArt.position.sub(centre);

    const stage = new THREE.Group();
    stage.add(pivot);

    const floor = new THREE.Group();
    floor.scale.y = -1;
    floor.position.y = -size.y * 0.60;
    floor.add(reflPivot);
    stage.add(floor);

    // Lift the pair so the sculpture sits above centre and its reflection
    // has room below, the way the piece is composed in the reference.
    stage.position.y = size.y * 0.16;
    scene.add(stage);

    const rot = { x: 0, y: 0 };
    const vel = { x: 0, y: 0 };
    const hover = { x: 0, y: 0 };
    let dragging = false;
    let pointerId = null;
    let last = { x: 0, y: 0 };
    let frame = 0;

    function resize() {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Frame the sculpture to the box's height, and to its width on narrow
      // viewports, so it never crops when the layout stacks.
      const fitH = size.y * 1.62;
      const fitW = size.x * 1.35;
      const fovR = (camera.fov * Math.PI) / 180;
      const distH = fitH / 2 / Math.tan(fovR / 2);
      const distW = fitW / 2 / Math.tan(fovR / 2) / camera.aspect;
      camera.position.z = Math.max(distH, distW);
      camera.updateProjectionMatrix();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    function onPointerDown(e) {
      dragging = true;
      pointerId = e.pointerId;
      last = { x: e.clientX, y: e.clientY };
      vel.x = 0;
      vel.y = 0;
      renderer.domElement.setPointerCapture?.(e.pointerId);
      setGrabbing(true);
    }

    function onPointerMove(e) {
      if (!dragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      rot.y += dx * DRAG_SPEED;
      rot.x = THREE.MathUtils.clamp(rot.x + dy * DRAG_SPEED, -MAX_TILT, MAX_TILT);
      // Remember the last motion so releasing mid-drag keeps the spin going.
      vel.y = dx * DRAG_SPEED;
      vel.x = dy * DRAG_SPEED;
    }

    function endDrag(e) {
      if (e && pointerId !== null && e.pointerId !== pointerId) return;
      dragging = false;
      pointerId = null;
      setGrabbing(false);
    }

    // Cursor position anywhere on the page nudges the piece, so it responds
    // before you ever grab it.
    function onHover(e) {
      hover.x = (e.clientX / window.innerWidth) * 2 - 1;
      hover.y = (e.clientY / window.innerHeight) * 2 - 1;
    }

    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('lostpointercapture', endDrag);
    if (!reduced) window.addEventListener('pointermove', onHover, { passive: true });

    function tick() {
      frame = requestAnimationFrame(tick);

      if (!dragging) {
        if (!reduced) {
          // A released flick coasts to a stop, then the idle turn takes over.
          rot.y += vel.y + IDLE_SPIN;
          rot.x = THREE.MathUtils.clamp(rot.x + vel.x, -MAX_TILT, MAX_TILT);
          vel.y *= FRICTION;
          vel.x *= FRICTION;

          // Ease back toward the cursor's tilt once the flick has died down.
          const settle = 1 - Math.min(Math.abs(vel.y) / 0.02, 1);
          rot.x += (hover.y * -0.26 - rot.x) * 0.02 * settle;
        }
        stage.position.x += (hover.x * 14 - stage.position.x) * 0.04;
      }

      pivot.rotation.set(rot.x, rot.y, 0);
      reflPivot.rotation.set(rot.x, rot.y, 0);
      renderer.render(scene, camera);
    }
    tick();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', endDrag);
      canvas.removeEventListener('pointercancel', endDrag);
      canvas.removeEventListener('lostpointercapture', endDrag);
      window.removeEventListener('pointermove', onHover);
      [...disposables, ...reflDisposables].forEach((d) => d.dispose());
      envRT.texture.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [supported]);

  if (!supported) {
    return <Inkblot3D spin interactive className={className} />;
  }

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ cursor: grabbing ? 'grabbing' : 'grab', touchAction: 'pan-y' }}
      role="img"
      aria-label="An iridescent glass sculpture with mirrored, ink-blot-like symmetry. Drag to turn it."
    />
  );
}
