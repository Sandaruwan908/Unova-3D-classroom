// UNOVA 3D Virtual Campus - Complete Three.js Scene & Avatar Engine

let scene, camera, renderer, controls;
let avatarGroup, buildingGroup, particleSystem;
let playerAvatar, npcAvatars = [];
let targetCameraPos = new THREE.Vector3(0, 15, 30);
let targetCameraLookAt = new THREE.Vector3(0, 0, 0);

// Initialize 3D Graphics Engine
function init3D() {
  const canvas = document.getElementById('webgl-canvas');

  // 1. Scene & Fog Setup
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050716, 0.012);

  // 2. Camera Setup
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 15, 30);

  // 3. WebGL Renderer
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 4. Orbit Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.minDistance = 3;
  controls.maxDistance = 80;

  // 5. Lighting System
  const ambientLight = new THREE.AmbientLight(0x1a1c3b, 1.8);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0x00f3ff, 1.2);
  sunLight.position.set(25, 45, 20);
  sunLight.castShadow = true;
  scene.add(sunLight);

  const purpleSpot = new THREE.PointLight(0x9d4edd, 3, 60);
  purpleSpot.position.set(-20, 15, -10);
  scene.add(purpleSpot);

  const cyanSpot = new THREE.PointLight(0x00f3ff, 2, 50);
  cyanSpot.position.set(25, 12, -15);
  scene.add(cyanSpot);

  // 6. Environment & Grid Floor
  const gridHelper = new THREE.GridHelper(140, 70, 0x00f3ff, 0x1e1b4b);
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);

  const floorGeo = new THREE.PlaneGeometry(160, 160);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x070a1e, roughness: 0.7, metalness: 0.2 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // 7. Render 3D World Objects & Avatars
  createBuildings();
  createParticles();

  // Create Player Avatar
  playerAvatar = createAnimatedAvatar({
    name: 'Kavindu (UoM)',
    outfitColor: 0x00f3ff,
    hairColor: 0x9d4edd,
    x: 0, z: 8,
    isPlayer: true
  });

  // Create NPC Student Avatars continuously moving across campus
  npcAvatars.push(createAnimatedAvatar({
    name: 'Dilani (UoM)',
    outfitColor: 0xff007f,
    hairColor: 0xffd700,
    x: -6, z: -2,
    waypoints: [{x: -12, z: -10}, {x: -2, z: -18}, {x: -6, z: -2}]
  }));

  npcAvatars.push(createAnimatedAvatar({
    name: 'Nimesh (UoC)',
    outfitColor: 0x00ff88,
    hairColor: 0x00dfff,
    x: 10, z: 2,
    waypoints: [{x: 22, z: -10}, {x: 25, z: -14}, {x: 10, z: 2}]
  }));

  npcAvatars.push(createAnimatedAvatar({
    name: 'Thilini (UoP)',
    outfitColor: 0xffaa00,
    hairColor: 0xff00ff,
    x: -18, z: 10,
    waypoints: [{x: -22, z: -5}, {x: -10, z: 12}, {x: -18, z: 10}]
  }));

  // Window Resize Listener
  window.addEventListener('resize', onWindowResize);

  // Start Main Render & Animation Loop
  animate();
}

// Procedural 3D Animated Avatar Creator
function createAnimatedAvatar(config) {
  const group = new THREE.Group();

  // Avatar Materials
  const outfitMat = new THREE.MeshStandardMaterial({ color: config.outfitColor, roughness: 0.4 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: config.hairColor, roughness: 0.3 });

  // Torso / Body
  const torsoGeo = new THREE.CylinderGeometry(0.5, 0.4, 1.4, 12);
  const torso = new THREE.Mesh(torsoGeo, outfitMat);
  torso.position.y = 1.7;
  torso.castShadow = true;
  group.add(torso);

  // Head
  const headGeo = new THREE.SphereGeometry(0.45, 16, 16);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 2.75;
  head.castShadow = true;
  group.add(head);

  // Hair
  const hairGeo = new THREE.ConeGeometry(0.52, 0.5, 12);
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.y = 3.2;
  group.add(hair);

  // Left Leg Pivot Group
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.25, 1.0, 0);
  const legGeo = new THREE.CylinderGeometry(0.18, 0.15, 1.0, 8);
  const leftLeg = new THREE.Mesh(legGeo, outfitMat);
  leftLeg.position.y = -0.5;
  leftLegPivot.add(leftLeg);
  group.add(leftLegPivot);

  // Right Leg Pivot Group
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.25, 1.0, 0);
  const rightLeg = new THREE.Mesh(legGeo, outfitMat);
  rightLeg.position.y = -0.5;
  rightLegPivot.add(rightLeg);
  group.add(rightLegPivot);

  // Left Arm Pivot Group
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.65, 2.2, 0);
  const armGeo = new THREE.CylinderGeometry(0.14, 0.12, 1.1, 8);
  const leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.position.y = -0.55;
  leftArmPivot.add(leftArm);
  group.add(leftArmPivot);

  // Right Arm Pivot Group
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.65, 2.2, 0);
  const rightArm = new THREE.Mesh(armGeo, skinMat);
  rightArm.position.y = -0.55;
  rightArmPivot.add(rightArm);
  group.add(rightArmPivot);

  // Position Avatar Group
  group.position.set(config.x, 0, config.z);
  scene.add(group);

  return {
    group: group,
    torsoMat: outfitMat,
    hairMat: hairMat,
    leftLegPivot: leftLegPivot,
    rightLegPivot: rightLegPivot,
    leftArmPivot: leftArmPivot,
    rightArmPivot: rightArmPivot,
    isWalking: true,
    waypoints: config.waypoints || [],
    currentWaypointIdx: 0,
    speed: 0.04,
    animTime: Math.random() * 100
  };
}

// Render Campus Architecture
function createBuildings() {
  buildingGroup = new THREE.Group();

  // Central Tech & Innovation Hub
  const hubGeo = new THREE.CylinderGeometry(9, 13, 18, 12);
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
  const hub = new THREE.Mesh(hubGeo, hubMat);
  hub.position.set(0, 9, -22);
  hub.castShadow = true;
  buildingGroup.add(hub);

  // Glowing Ring on Central Hub
  const ringGeo = new THREE.TorusGeometry(9.8, 0.45, 16, 100);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 18, -22);
  buildingGroup.add(ring);

  // Central Research Library (Left Building)
  const libGeo = new THREE.BoxGeometry(16, 12, 22);
  const libMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.6, roughness: 0.3 });
  const lib = new THREE.Mesh(libGeo, libMat);
  lib.position.set(-28, 6, -16);
  lib.castShadow = true;
  buildingGroup.add(lib);

  // 3D Dome Meeting Center (Right Building)
  const domeGeo = new THREE.SphereGeometry(8.5, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshStandardMaterial({ color: 0x3b0764, transparent: true, opacity: 0.82, metalness: 0.4 });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.set(28, 0, -16);
  buildingGroup.add(dome);

  // 3D Meeting Table Inside Dome
  const tableGeo = new THREE.CylinderGeometry(4.5, 4.5, 1.2, 16);
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x00f3ff, roughness: 0.1 });
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.set(28, 0.6, -16);
  buildingGroup.add(table);

  // 3D Presentation Whiteboard Screen Inside Dome
  const screenGeo = new THREE.BoxGeometry(7, 4, 0.3);
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x9d4edd });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(28, 4.5, -21);
  buildingGroup.add(screen);

  scene.add(buildingGroup);
}

// Particle System Creation
function createParticles() {
  const particleCount = 450;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 110;
    positions[i + 1] = Math.random() * 35 + 1;
    positions[i + 2] = (Math.random() - 0.5) * 110;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0x00f3ff, size: 0.45, transparent: true, opacity: 0.75 });
  particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);
}

// Animation Loop with Continuous Avatar Movement
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  // Particle System Motion
  if (particleSystem) {
    particleSystem.rotation.y = elapsedTime * 0.02;
  }

  // Smooth Camera Interpolation
  camera.position.lerp(targetCameraPos, 0.04);
  controls.target.lerp(targetCameraLookAt, 0.04);

  // Animate Player Avatar
  if (playerAvatar) {
    updateAvatarAnimation(playerAvatar, delta, elapsedTime);
  }

  // Animate NPC Student Avatars continuously
  npcAvatars.forEach(avatar => {
    updateAvatarWaypoints(avatar);
    updateAvatarAnimation(avatar, delta, elapsedTime);
  });

  controls.update();
  renderer.render(scene, camera);
}

// Update Avatar Limb Walking & Idle Animations
function updateAvatarAnimation(avatar, delta, elapsedTime) {
  avatar.animTime += delta * (avatar.isWalking ? 8 : 2);

  if (avatar.isWalking) {
    // Walking leg/arm swing cycle
    const swing = Math.sin(avatar.animTime);
    avatar.leftLegPivot.rotation.x = swing * 0.6;
    avatar.rightLegPivot.rotation.x = -swing * 0.6;
    avatar.leftArmPivot.rotation.x = -swing * 0.5;
    avatar.rightArmPivot.rotation.x = swing * 0.5;

    // Slight vertical bounce
    avatar.group.position.y = Math.abs(Math.sin(avatar.animTime * 2)) * 0.08;
  } else {
    // Idle breathing animation
    avatar.leftLegPivot.rotation.x = THREE.MathUtils.lerp(avatar.leftLegPivot.rotation.x, 0, 0.1);
    avatar.rightLegPivot.rotation.x = THREE.MathUtils.lerp(avatar.rightLegPivot.rotation.x, 0, 0.1);
    avatar.leftArmPivot.rotation.x = Math.sin(elapsedTime * 2) * 0.05;
    avatar.rightArmPivot.rotation.x = -Math.sin(elapsedTime * 2) * 0.05;
    avatar.group.position.y = Math.sin(elapsedTime * 2.5) * 0.04;
  }
}

// NPC Waypoint Pathfinding Movement
function updateAvatarWaypoints(avatar) {
  if (!avatar.waypoints || avatar.waypoints.length === 0) return;

  const target = avatar.waypoints[avatar.currentWaypointIdx];
  const currentPos = avatar.group.position;
  const dx = target.x - currentPos.x;
  const dz = target.z - currentPos.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist < 0.5) {
    // Reached waypoint, select next
    avatar.currentWaypointIdx = (avatar.currentWaypointIdx + 1) % avatar.waypoints.length;
  } else {
    // Rotate smoothly towards walking direction
    const angle = Math.atan2(dx, dz);
    avatar.group.rotation.y = angle;

    // Move avatar forward
    avatar.group.position.x += (dx / dist) * avatar.speed;
    avatar.group.position.z += (dz / dist) * avatar.speed;
    avatar.isWalking = true;
  }
}

// Window Resize Adjustment
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// UI Navigation & Camera Transitions
function switchView(viewId) {
  document.querySelectorAll('.overlay-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) targetView.classList.add('active');

  // Highlight active nav button
  const activeNavBtn = document.querySelector(`.nav-links button[onclick*="${viewId}"]`);
  if (activeNavBtn) activeNavBtn.classList.add('active');

  // Camera Target Positioning
  if (viewId === 'home') {
    setCameraTarget(0, 15, 30, 0, 0, 0);
  } else if (viewId === 'campus') {
    setCameraTarget(0, 25, 42, 0, 0, 0);
  } else if (viewId === 'avatar') {
    setCameraTarget(0, 3.2, 12, 0, 2, 8);
  } else if (viewId === 'meeting') {
    setCameraTarget(28, 8, -6, 28, 1, -16);
  } else if (viewId === 'research') {
    setCameraTarget(-28, 14, 6, -28, 4, -16);
  }
}

function teleportCamera(loc) {
  if (loc === 'plaza') setCameraTarget(0, 16, 26, 0, 0, 0);
  if (loc === 'tech') setCameraTarget(0, 14, -6, 0, 9, -22);
  if (loc === 'library') setCameraTarget(-28, 12, 6, -28, 5, -16);
  if (loc === 'meeting') setCameraTarget(28, 8, -6, 28, 1, -16);
}

function setCameraTarget(px, py, pz, tx, ty, tz) {
  targetCameraPos.set(px, py, pz);
  targetCameraLookAt.set(tx, ty, tz);
}

// Avatar Studio Controls
function updateAvatarProfile() {
  const name = document.getElementById('avatar-name').value || 'Student';
  const uni = document.getElementById('avatar-uni').value;
  document.getElementById('nav-user-name').innerText = `${name} (${uni})`;
}

function updateAvatarAppearance() {
  const outfitColor = document.getElementById('avatar-color').value;
  const hairColor = document.getElementById('hair-color').value;

  if (playerAvatar) {
    playerAvatar.torsoMat.color.set(outfitColor);
    playerAvatar.hairMat.color.set(hairColor);
  }
}

function toggleAvatarAnim() {
  if (playerAvatar) {
    playerAvatar.isWalking = !playerAvatar.isWalking;
  }
}

// Interactive Features
function sendMessage() {
  const input = document.getElementById('chat-input');
  const chatBox = document.getElementById('chat-box');
  if (input.value.trim() !== '') {
    const user = document.getElementById('nav-user-name').innerText;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg';
    msgDiv.innerHTML = `<strong>${user}:</strong> ${input.value}`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    input.value = '';
  }
}

function saveNotes() {
  alert('Whiteboard notes synced to UNOVA project workspace!');
}

function triggerPresentation() {
  alert('Screen share presentation active on 3D Dome screen!');
}

function submitResearchConcept() {
  const topic = prompt('Enter your Research Topic / Thesis Concept:');
  if (topic) {
    alert(`Research concept "${topic}" submitted to UNOVA Inter-University Research Board!`);
  }
}

// Start 3D Engine on page load
window.onload = init3D;
