// Survey sphere: every TrES Lyr1 star on a celestial sphere you can rotate and zoom.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const TRES_ID = "TrES_Lyr1_01614";

async function loadJson(url, label) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${label} (${response.status})`);
  }
  return response.json();
}

function formatSky(star) {
  const magnitude =
    star.vmag == null ? "no V magnitude" : `V = ${Number(star.vmag).toFixed(3)}`;
  return `${star.star_id} · RA ${star.ra.toFixed(3)}° · Dec ${star.dec.toFixed(3)}° · ${magnitude} · ${star.npts.toLocaleString()} light-curve points`;
}

function setSkyReadout(text) {
  document.getElementById("skyReadout").textContent = text;
}

// Right ascension and declination on a sphere. Y is the north celestial pole.
function skyPosition(raDeg, decDeg, radius) {
  const ra = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  const cosDec = Math.cos(dec);
  return new THREE.Vector3(
    radius * cosDec * Math.cos(ra),
    radius * Math.sin(dec),
    radius * cosDec * Math.sin(ra),
  );
}

function circleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.35, "rgba(255,255,255,0.85)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function ringTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(32, 32, 22, 0, Math.PI * 2);
  ctx.stroke();
  return new THREE.CanvasTexture(canvas);
}

function pushSegment(positions, a, b) {
  positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
}

function buildGraticule(radius) {
  const positions = [];
  const steps = 96;

  for (let decDeg = -75; decDeg <= 75; decDeg += 15) {
    let previous = null;
    for (let i = 0; i <= steps; i += 1) {
      const ra = (i / steps) * 360;
      const point = skyPosition(ra, decDeg, radius);
      if (previous) pushSegment(positions, previous, point);
      previous = point;
    }
  }

  for (let raDeg = 0; raDeg < 360; raDeg += 15) {
    let previous = null;
    for (let i = 0; i <= steps; i += 1) {
      const dec = -90 + (i / steps) * 180;
      const point = skyPosition(raDeg, dec, radius);
      if (previous) pushSegment(positions, previous, point);
      previous = point;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ color: 0x8d8d8d, transparent: true, opacity: 0.45 }),
  );
}

function buildFootprint(radius, raMin, raMax, decMin, decMax) {
  const positions = [];
  const steps = 48;
  const corners = [
    [raMin, decMin, raMax, decMin],
    [raMax, decMin, raMax, decMax],
    [raMax, decMax, raMin, decMax],
    [raMin, decMax, raMin, decMin],
  ];

  corners.forEach(([ra0, dec0, ra1, dec1]) => {
    let previous = null;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const point = skyPosition(ra0 + (ra1 - ra0) * t, dec0 + (dec1 - dec0) * t, radius);
      if (previous) pushSegment(positions, previous, point);
      previous = point;
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }),
  );
}

// A star on the sphere is visible when the camera sits outside that star's tangent plane.
function isVisible(position, cameraPosition) {
  return position.dot(cameraPosition) > position.lengthSq();
}

function closestFacingHit(hits, stars, cameraPosition) {
  let best = null;
  hits.forEach((hit) => {
    const star = stars[hit.index];
    if (!star) return;
    if (!isVisible(skyPosition(star.ra, star.dec, 1.012), cameraPosition)) return;
    const gap = hit.distanceToRay ?? hit.distance;
    if (!best || gap < best.gap) best = { star, gap, index: hit.index };
  });
  return best;
}

export async function initSkySphere({ catalogUrl = "TRESCSV.json" } = {}) {
  const stage = document.getElementById("skyStage");
  const canvas = document.getElementById("skyChart");
  if (!stage || !canvas) return;

  const catalog = await loadJson(catalogUrl, "the catalog");
  const stars = catalog.stars;
  const tres = stars.find((star) => star.star_id === TRES_ID) ?? null;
  const field = stars.filter((star) => star.star_id !== TRES_ID);

  const marker = document.getElementById("tresMarker");
  const defaultSkyText = `${stars.length.toLocaleString()} stars. Drag to rotate. Hover one to see its catalog entry.`;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch (error) {
    setSkyReadout("This browser could not start the 3D view.");
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x0e0e0e, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 50);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.7;
  controls.zoomSpeed = 0.85;
  controls.minDistance = 0.06;
  controls.maxDistance = 4;

  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.99, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0x141414 }),
  ));
  scene.add(buildGraticule(1.001));

  let raMin = Infinity;
  let raMax = -Infinity;
  let decMin = Infinity;
  let decMax = -Infinity;
  const fieldPositions = new Float32Array(field.length * 3);
  const centroid = new THREE.Vector3();
  field.forEach((star, index) => {
    const position = skyPosition(star.ra, star.dec, 1.012);
    fieldPositions[index * 3] = position.x;
    fieldPositions[index * 3 + 1] = position.y;
    fieldPositions[index * 3 + 2] = position.z;
    centroid.add(position);
    raMin = Math.min(raMin, star.ra);
    raMax = Math.max(raMax, star.ra);
    decMin = Math.min(decMin, star.dec);
    decMax = Math.max(decMax, star.dec);
  });
  if (tres) {
    centroid.add(skyPosition(tres.ra, tres.dec, 1.012));
    raMin = Math.min(raMin, tres.ra);
    raMax = Math.max(raMax, tres.ra);
    decMin = Math.min(decMin, tres.dec);
    decMax = Math.max(decMax, tres.dec);
  }
  centroid.normalize();

  scene.add(buildFootprint(1.004, raMin, raMax, decMin, decMax));

  const fieldGeometry = new THREE.BufferGeometry();
  fieldGeometry.setAttribute("position", new THREE.BufferAttribute(fieldPositions, 3));
  const fieldColors = new Float32Array(field.length * 3);
  fieldColors.fill(1);
  fieldGeometry.setAttribute("color", new THREE.BufferAttribute(fieldColors, 3));
  const fieldPoints = new THREE.Points(
    fieldGeometry,
    new THREE.PointsMaterial({
      vertexColors: true,
      map: circleTexture(),
      size: 3.2,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      alphaTest: 0.2,
    }),
  );
  scene.add(fieldPoints);

  const tresPosition = tres ? skyPosition(tres.ra, tres.dec, 1.016) : null;
  let tresPoints = null;
  if (tresPosition) {
    const tresGeometry = new THREE.BufferGeometry();
    tresGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([tresPosition.x, tresPosition.y, tresPosition.z], 3),
    );
    tresPoints = new THREE.Points(
      tresGeometry,
      new THREE.PointsMaterial({
        color: 0xffffff,
        map: ringTexture(),
        size: 18,
        sizeAttenuation: false,
        transparent: true,
        depthTest: false,
        alphaTest: 0.2,
      }),
    );
    tresPoints.renderOrder = 2;
    scene.add(tresPoints);
  }

  const hoverAccentGeometry = new THREE.BufferGeometry();
  hoverAccentGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([0, 0, 0], 3),
  );
  const hoverAccent = new THREE.Points(
    hoverAccentGeometry,
    new THREE.PointsMaterial({
      color: 0xff2a2a,
      map: circleTexture(),
      size: 8,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
      depthWrite: false,
    }),
  );
  hoverAccent.visible = false;
  hoverAccent.renderOrder = 1;
  scene.add(hoverAccent);

  const focus = centroid.clone().setLength(1.012);
  controls.target.copy(focus);
  camera.position.copy(centroid).setLength(1.2);
  controls.update();
  controls.saveState();

  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovering = false;
  let viewDirty = true;
  let hoveredId = null;
  let hoveredFieldIndex = null;

  function setHoverAccent(star) {
    const position = skyPosition(star.ra, star.dec, 1.018);
    const accentPosition = hoverAccentGeometry.getAttribute("position");
    accentPosition.setXYZ(0, position.x, position.y, position.z);
    accentPosition.needsUpdate = true;
    hoverAccent.visible = true;
  }

  function clearHoverHighlight() {
    hoverAccent.visible = false;
    if (hoveredFieldIndex !== null) {
      const base = hoveredFieldIndex * 3;
      fieldColors[base] = 1;
      fieldColors[base + 1] = 1;
      fieldColors[base + 2] = 1;
      fieldGeometry.attributes.color.needsUpdate = true;
      hoveredFieldIndex = null;
    }
    if (tresPoints) {
      tresPoints.material.color.set(0xffffff);
      tresPoints.material.size = 18;
    }
    hoveredId = null;
  }

  function pickStar() {
    const fovRad = (camera.fov * Math.PI) / 180;
    const distance = Math.max(camera.position.distanceTo(controls.target), 0.05);
    const worldPerPixel = (2 * Math.tan(fovRad / 2) * distance) / canvas.clientHeight;
    raycaster.params.Points.threshold = worldPerPixel * 14;
    raycaster.setFromCamera(pointer, camera);

    const fieldHit = closestFacingHit(
      raycaster.intersectObject(fieldPoints, false),
      field,
      camera.position,
    );
    const tresHit = tresPoints
      ? closestFacingHit(raycaster.intersectObject(tresPoints, false), [tres], camera.position)
      : null;
    const chosen = tresHit && (!fieldHit || tresHit.gap <= fieldHit.gap) ? tresHit : fieldHit;

    if (!chosen) {
      if (hoveredId !== null) {
        clearHoverHighlight();
        setSkyReadout("Hover a star to see its catalog entry.");
      }
      return;
    }

    const isTres = chosen.star.star_id === TRES_ID;
    if (hoveredId !== chosen.star.star_id) {
      clearHoverHighlight();
      if (isTres && tresPoints) {
        tresPoints.material.color.set(0xff2a2a);
        tresPoints.material.size = 24;
        hoverAccent.visible = false;
      } else {
        hoveredFieldIndex = chosen.index;
        const base = chosen.index * 3;
        fieldColors[base] = 1;
        fieldColors[base + 1] = 0;
        fieldColors[base + 2] = 0;
        fieldGeometry.attributes.color.needsUpdate = true;
        setHoverAccent(chosen.star);
      }
      hoveredId = chosen.star.star_id;
      setSkyReadout(formatSky(chosen.star));
    }
  }

  function updateMarker() {
    if (!tresPosition) {
      marker.hidden = true;
      return;
    }
    if (!isVisible(tresPosition, camera.position)) {
      marker.hidden = true;
      return;
    }
    const projected = tresPosition.clone().project(camera);
    const x = (projected.x * 0.5 + 0.5) * stage.clientWidth;
    const y = (-projected.y * 0.5 + 0.5) * stage.clientHeight;
    const onStage = x >= 0 && y >= 0 && x <= stage.clientWidth && y <= stage.clientHeight;
    marker.hidden = !onStage;
    if (!onStage) return;
    marker.style.transform = `translate(${x + 12}px, ${y}px) translateY(-50%)`;
  }

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    hovering = true;
    viewDirty = true;
  });
  canvas.addEventListener("pointerleave", () => {
    hovering = false;
    clearHoverHighlight();
    setSkyReadout(defaultSkyText);
  });
  controls.addEventListener("start", () => stage.classList.add("is-dragging"));
  controls.addEventListener("end", () => stage.classList.remove("is-dragging"));
  controls.addEventListener("change", () => {
    if (camera.position.length() < 1.07) camera.position.setLength(1.07);
    viewDirty = true;
  });
  const resetSky = document.getElementById("resetSky");
  resetSky?.addEventListener("click", () => {
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.reset();
    controls.enableDamping = damping;
  });

  setSkyReadout(defaultSkyText);

  function frame() {
    requestAnimationFrame(frame);
    controls.update();
    if (hovering && viewDirty) {
      viewDirty = false;
      pickStar();
    }
    updateMarker();
    renderer.render(scene, camera);
  }
  frame();
}
