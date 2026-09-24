import * as THREE from '../vendor/three.module.js';

const $ = (selector) => document.querySelector(selector);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// The aerial selection is the final stop of the page.
const closingSection = document.querySelector('.closing');
document.querySelector('.interlude').before(closingSection);
const viewSection = $('#view');
if (location.hash) {
  requestAnimationFrame(() => {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    target?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
}
const buildingStage = $('.building-stage');
buildingStage.querySelector('img').src = 'assets/final-aerial.jpg';
const buildingSvg = buildingStage.querySelector('svg');
buildingSvg.setAttribute('viewBox', '0 0 1600 900');
buildingSvg.innerHTML = `
  <defs>
    <linearGradient id="tower-line" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd09a"/>
      <stop offset=".52" stop-color="#e88752"/>
      <stop offset="1" stop-color="#ffc287"/>
    </linearGradient>
    <filter id="tower-glow" x="-40%" y="-25%" width="180%" height="150%">
      <feGaussianBlur stdDeviation="5"/>
    </filter>
  </defs>
  <polygon class="tower-underlay" points="923,340 1026,336 1033,576 915,590"/>
  <polygon class="tower-halo" points="923,340 1026,336 1033,576 915,590"/>
  <polygon class="tower-face" points="923,340 1026,336 1033,576 915,590"/>
  <polygon id="floor-highlight" points="923,410 1028,410 1028,426 922,426"/>
  <circle class="tower-node" cx="923" cy="340" r="3.4"/>
  <circle class="tower-node" cx="1026" cy="336" r="3.4"/>
  <circle class="tower-node" cx="1033" cy="576" r="3.4"/>
  <circle class="tower-node" cx="915" cy="590" r="3.4"/>
  <polygon class="tower-hit" points="923,340 1026,336 1033,576 915,590"/>
`;
const towerTooltip = document.createElement('div');
towerTooltip.className = 'tower-tooltip';
towerTooltip.innerHTML = '<span>СМОТРЕТЬ С ЭТАЖА</span><strong>12</strong><b>↗</b>';
buildingStage.append(towerTooltip);
let aerialScale = 1, aerialX = 0, aerialY = 0;
function positionFloorTooltip(worldY) {
  towerTooltip.style.left = `${aerialX + 1052 * aerialScale}px`;
  towerTooltip.style.top = `${aerialY + (worldY + 8) * aerialScale}px`;
}
function positionAerialOverlay() {
  const { width, height } = buildingStage.getBoundingClientRect();
  aerialScale = Math.max(width / 1600, height / 900);
  const imageWidth = 1600 * aerialScale, imageHeight = 900 * aerialScale;
  aerialX = (width - imageWidth) / 2;
  aerialY = (height - imageHeight) / 2;
  Object.assign(buildingSvg.style, {
    width: `${imageWidth}px`, height: `${imageHeight}px`,
    left: `${aerialX}px`, top: `${aerialY}px`, transform: 'none',
    right: 'auto', bottom: 'auto'
  });
  positionFloorTooltip(346 + (16 - selectedFloor) * 15.9);
}
new ResizeObserver(positionAerialOverlay).observe(buildingStage);
const blockObserver = new IntersectionObserver(entries => {
  if (entries.some(entry => entry.isIntersecting)) {
    viewSection.classList.add('block-selected');
    blockObserver.disconnect();
  }
}, { threshold: .38 });
blockObserver.observe(buildingStage);
const flight = $('#flight');
const videoA = $('#video-a');
const videoB = $('#video-b');
const flightProgress = $('#flight-progress');
const flightKicker = $('#flight-kicker');
const flightTitle = $('#flight-title');
const flightBody = $('#flight-body');
const flightNumber = $('#flight-number');
const header = $('#header');
const copy = [
  { kicker: '01 / 03 — ВАШ ГОРОД', title: 'Город.<br><em>В вашем ритме.</em>', body: '4U Tashkent — место, где энергия мегаполиса встречается с комфортом собственного дома.' },
  { kicker: '02 / 03 — ВАШЕ ПРОСТРАНСТВО', title: 'Создано<br><em>для жизни.</em>', body: 'Архитектура большого города, просторные планировки и продуманная среда на каждый день.' },
  { kicker: '03 / 03 — ВАШ ГОРИЗОНТ', title: 'Ближе<br><em>к мечте.</em>', body: 'Свой ритм. Свой дом. Свой вид на Ташкент — с высоты, которая вдохновляет.' }
];
let targetProgress = 0;
let smoothProgress = 0;
let currentChapter = 0;
let running = false;

function setChapter(index) {
  if (currentChapter === index) return;
  currentChapter = index;
  const c = copy[index];
  const content = $('.flight-content');
  content.style.opacity = '0';
  content.style.transform = 'translateY(calc(-40% + 14px))';
  setTimeout(() => {
    flightKicker.textContent = c.kicker;
    flightTitle.innerHTML = c.title;
    flightBody.textContent = c.body;
    flightNumber.textContent = `0${index + 1} / 03`;
    content.style.opacity = '1';
    content.style.transform = 'translateY(-40%)';
  }, 180);
}

async function loadVideo(video, url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    video.src = URL.createObjectURL(blob);
  } catch {
    video.src = url;
  }
  video.load();
}

if (!reduceMotion) {
  Promise.all([
    loadVideo(videoA, 'assets/flight-two.mp4'),
    loadVideo(videoB, 'assets/flight-one.mp4')
  ]);
  [videoA, videoB].forEach(video => {
    video.addEventListener('loadeddata', () => { video.dataset.ready = 'true'; });
  });
  const prime = () => {
    [videoA, videoB].forEach(async video => {
      if (video.readyState >= 2) {
        try { await video.play(); video.pause(); } catch {}
      }
    });
    window.removeEventListener('pointerdown', prime);
  };
  window.addEventListener('pointerdown', prime, { once: true });
}

function seek(video, fraction) {
  if (!video.duration || video.seeking) return;
  const time = Math.min(video.duration - .05, Math.max(.02, fraction * video.duration));
  if (Math.abs(video.currentTime - time) > .04) video.currentTime = time;
}

function frame() {
  smoothProgress += (targetProgress - smoothProgress) * .19;
  const p = smoothProgress;
  flightProgress.style.width = `${p * 100}%`;
  setChapter(p < .29 ? 0 : p < .65 ? 1 : 2);
  if (!reduceMotion) {
    const blend = Math.max(0, Math.min(1, (p - .45) / .1));
    videoA.style.opacity = videoA.dataset.ready ? `${1 - blend}` : '0';
    videoB.style.opacity = videoB.dataset.ready ? `${blend}` : '0';
    if (p <= .57) seek(videoA, Math.min(1, p / .52));
    // The second flight lands on the selected aerial frame at 4 seconds.
    if (p >= .43 && videoB.duration) {
      seek(videoB, Math.max(0, (p - .48) / .52) * (4 / videoB.duration));
    }
  }
  if (Math.abs(targetProgress - smoothProgress) > .0008) requestAnimationFrame(frame);
  else running = false;
}

function updateScroll() {
  const range = flight.offsetHeight - innerHeight;
  targetProgress = Math.max(0, Math.min(1, -flight.getBoundingClientRect().top / range));
  header.classList.toggle('scrolled', scrollY > 30);
  if (!running) { running = true; requestAnimationFrame(frame); }
}
addEventListener('scroll', updateScroll, { passive: true });
addEventListener('resize', updateScroll);
updateScroll();
$('.flight-content').style.transition = 'opacity .28s ease, transform .28s ease';

const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }
}, { threshold: .13 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const menuButton = $('#menu-button');
const mobileNav = $('#mobile-nav');
menuButton.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? '×' : '☰';
});
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  mobileNav.classList.remove('open');
  menuButton.textContent = '☰';
  menuButton.setAttribute('aria-expanded', 'false');
}));

let selectedFloor = 12;
const floorList = $('#floor-list');
const floorHighlight = $('#floor-highlight');
const floorLabel = $('#selected-floor');
const panoFloor = $('#pano-floor');
const modal = $('#pano-modal');
let previousFocus = null;
// Add verified, floor-specific equirectangular images here as they become available.
const panoramaByFloor = {};
const defaultPanorama = 'assets/balcony-panorama.webp';
let loadedPanorama = defaultPanorama;
const panoramaPreload = new Image();
panoramaPreload.src = defaultPanorama;
let bandY = 346 + (16 - selectedFloor) * 15.9;
let bandAnimation = 0;

function drawFloorBand(y) {
  const edge = (vertical, left) => left
    ? 923 - 8 * ((vertical - 340) / 250)
    : 1026 + 7 * ((vertical - 340) / 250);
  const bottom = y + 15.9;
  floorHighlight.setAttribute('points',
    `${edge(y, true).toFixed(1)},${y.toFixed(1)} ${edge(y, false).toFixed(1)},${y.toFixed(1)} ${edge(bottom, false).toFixed(1)},${bottom.toFixed(1)} ${edge(bottom, true).toFixed(1)},${bottom.toFixed(1)}`);
}
function animateFloorBand(to) {
  cancelAnimationFrame(bandAnimation);
  if (reduceMotion) { bandY = to; drawFloorBand(to); return; }
  const from = bandY;
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / 360);
    const eased = 1 - Math.pow(1 - t, 3);
    bandY = from + (to - from) * eased;
    drawFloorBand(bandY);
    if (t < 1) bandAnimation = requestAnimationFrame(step);
  }
  bandAnimation = requestAnimationFrame(step);
}

function setFloor(floor) {
  selectedFloor = floor;
  floorLabel.textContent = String(floor).padStart(2, '0');
  panoFloor.textContent = String(floor).padStart(2, '0');
  const top = 346 + (16 - floor) * 15.9;
  animateFloorBand(top);
  towerTooltip.querySelector('strong').textContent = String(floor).padStart(2, '0');
  positionFloorTooltip(top);
  floorList.querySelectorAll('button').forEach(btn => {
    const active = Number(btn.dataset.floor) === floor;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}
const towerHit = buildingSvg.querySelector('.tower-hit');
towerHit.addEventListener('pointerenter', () => buildingStage.classList.add('tower-hover'));
towerHit.addEventListener('pointermove', event => {
  const bounds = buildingSvg.getBoundingClientRect();
  const y = (event.clientY - bounds.top) / bounds.height * 900;
  const floor = Math.max(2, Math.min(16, 16 - Math.round((y - 346) / 15.9)));
  if (floor !== selectedFloor) setFloor(floor);
});
towerHit.addEventListener('pointerleave', () => buildingStage.classList.remove('tower-hover'));
towerHit.addEventListener('click', () => openPanorama());
for (let floor = 16; floor >= 2; floor--) {
  const btn = document.createElement('button');
  btn.textContent = String(floor).padStart(2, '0');
  btn.dataset.floor = String(floor);
  btn.type = 'button';
  btn.setAttribute('aria-label', `${floor} этаж, открыть панораму`);
  btn.addEventListener('mouseenter', () => setFloor(floor));
  btn.addEventListener('focus', () => setFloor(floor));
  btn.addEventListener('click', () => { setFloor(floor); openPanorama(); });
  floorList.appendChild(btn);
}
setFloor(selectedFloor);
positionAerialOverlay();

let scene, camera, renderer, sphere, animationId;
let launchTimer = 0, closeTimer = 0;
let yaw = -.7, pitch = 0, targetYaw = -.7, targetPitch = 0;
let dragging = false, startX = 0, startY = 0, startYaw = 0, startPitch = 0;
const canvasHost = $('#pano-canvas');

function initPanorama() {
  if (renderer) return;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(76, canvasHost.clientWidth / canvasHost.clientHeight, 1, 1100);
  camera.position.set(0, 0, 0);
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(canvasHost.clientWidth, canvasHost.clientHeight);
  canvasHost.appendChild(renderer.domElement);
  const geometry = new THREE.SphereGeometry(500, 80, 48);
  geometry.scale(-1, 1, 1);
  const texture = new THREE.TextureLoader().load(defaultPanorama);
  texture.colorSpace = THREE.SRGBColorSpace;
  sphere = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture }));
  scene.add(sphere);
  canvasHost.addEventListener('pointerdown', e => {
    dragging = true; startX = e.clientX; startY = e.clientY; startYaw = targetYaw; startPitch = targetPitch;
    canvasHost.setPointerCapture(e.pointerId);
  });
  canvasHost.addEventListener('pointermove', e => {
    if (!dragging) return;
    targetYaw = startYaw + (e.clientX - startX) * .004;
    targetPitch = Math.max(-1.1, Math.min(1.1, startPitch + (e.clientY - startY) * .003));
  });
  canvasHost.addEventListener('pointerup', () => dragging = false);
  canvasHost.addEventListener('pointercancel', () => dragging = false);
  canvasHost.addEventListener('wheel', e => {
    e.preventDefault();
    camera.fov = Math.max(40, Math.min(92, camera.fov + e.deltaY * .04));
    camera.updateProjectionMatrix();
  }, { passive: false });
  addEventListener('resize', resizePanorama);
}
function choosePanorama(floor) {
  const source = panoramaByFloor[floor] || defaultPanorama;
  if (source === loadedPanorama) return;
  new THREE.TextureLoader().load(source, texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    sphere.material.map.dispose();
    sphere.material.map = texture;
    sphere.material.needsUpdate = true;
    loadedPanorama = source;
  });
}
function resizePanorama() {
  if (!renderer || modal.hidden) return;
  const width = canvasHost.clientWidth, height = canvasHost.clientHeight;
  camera.aspect = width / height; camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
function animatePanorama() {
  if (modal.hidden) return;
  yaw += (targetYaw - yaw) * .12;
  pitch += (targetPitch - pitch) * .12;
  const x = 500 * Math.sin(yaw) * Math.cos(pitch);
  const y = 500 * Math.sin(pitch);
  const z = 500 * Math.cos(yaw) * Math.cos(pitch);
  camera.lookAt(x, y, z);
  renderer.render(scene, camera);
  animationId = requestAnimationFrame(animatePanorama);
}
function openPanorama() {
  if (!modal.hidden || launchTimer || closeTimer) return;
  previousFocus = document.activeElement;
  document.body.style.overflow = 'hidden';
  const stageBounds = buildingStage.getBoundingClientRect();
  const towerX = stageBounds.left + aerialX + 977 * aerialScale;
  const towerY = stageBounds.top + aerialY + (346 + (16 - selectedFloor) * 15.9) * aerialScale;
  const originX = innerWidth <= 1200 ? innerWidth / 2 : Math.max(0, Math.min(innerWidth, towerX));
  const originY = innerWidth <= 1200 ? innerHeight / 2 : Math.max(0, Math.min(innerHeight, towerY));
  modal.style.setProperty('--portal-x', `${originX}px`);
  modal.style.setProperty('--portal-y', `${originY}px`);
  viewSection.classList.add('launching');
  launchTimer = setTimeout(() => {
    launchTimer = 0;
    modal.hidden = false;
    initPanorama();
    choosePanorama(selectedFloor);
    resizePanorama();
    cancelAnimationFrame(animationId);
    animatePanorama();
    requestAnimationFrame(() => modal.classList.add('visible'));
    $('#pano-close').focus();
  }, reduceMotion ? 0 : 320);
}
function closePanorama() {
  if (launchTimer) { clearTimeout(launchTimer); launchTimer = 0; }
  if (modal.hidden) {
    viewSection.classList.remove('launching');
    document.body.style.overflow = '';
    return;
  }
  if (closeTimer) return;
  modal.classList.remove('visible');
  closeTimer = setTimeout(() => {
    closeTimer = 0;
    modal.hidden = true;
    viewSection.classList.remove('launching');
    document.body.style.overflow = '';
    cancelAnimationFrame(animationId);
    previousFocus?.focus();
  }, reduceMotion ? 0 : 480);
}
$('#open-panorama').addEventListener('click', openPanorama);
$('#pano-close').addEventListener('click', closePanorama);
$('#pano-left').addEventListener('click', () => targetYaw -= .3);
$('#pano-right').addEventListener('click', () => targetYaw += .3);
document.addEventListener('keydown', e => {
  if (modal.hidden) return;
  if (e.key === 'Escape') closePanorama();
  if (e.key === 'ArrowLeft') targetYaw -= .15;
  if (e.key === 'ArrowRight') targetYaw += .15;
  if (e.key === 'ArrowUp') targetPitch = Math.max(-1.1, targetPitch + .1);
  if (e.key === 'ArrowDown') targetPitch = Math.min(1.1, targetPitch - .1);
});
