import * as THREE from 'three';

// Basic Three.js scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

// Camera
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('scene-container').appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Grid
const size = 10;
const divisions = 10;
const gridHelper = new THREE.GridHelper(size, divisions);
scene.add(gridHelper);

// Invisible plane for raycasting
const planeGeometry = new THREE.PlaneGeometry(size, size);
planeGeometry.rotateX(-Math.PI / 2);
const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
const raycastPlane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(raycastPlane);

// Spawn in the middle
camera.position.set(0, 1.6, 0); // Eye-level

// --- Game State ---
let flyMode = false;
let buildMode = false;
let buildCube = null;
const placedCubes = [];

// --- Player ---
const hand = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xffd8b1 })
);
hand.position.set(0.5, -0.3, -0.5);
camera.add(hand);
scene.add(camera);

// --- First Person Controls ---

const controls = {
    pitch: 0,
    yaw: 0,
    targetPitch: 0,
    targetYaw: 0,
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    isCommandInputFocused: false,
};

const moveSpeed = 0.1;
const turnSpeed = 0.2;
let bobbing = 0;

// --- UI Elements ---
const sceneContainer = document.getElementById('scene-container');
const commandInput = document.getElementById('command-input');
const consoleEl = document.getElementById('console');
const consoleOutput = document.getElementById('console-output');

// Pointer lock for mouse controls
sceneContainer.addEventListener('click', () => {
    if (buildMode && buildCube) {
        // Raycast from camera to grid to place a new cube
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera({ x: 0, y: 0 }, camera);
        const intersects = raycaster.intersectObject(raycastPlane); // Use the invisible plane

        if (intersects.length > 0) {
            const intersect = intersects[0];
            const newPosition = new THREE.Vector3().copy(intersect.point);
            newPosition.x = Math.round(newPosition.x);
            newPosition.y = 0.5; // Place it on the grid
            newPosition.z = Math.round(newPosition.z);

            const newCube = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                buildCube.material.clone() // Clone the material from the hand-held cube
            );
            newCube.position.copy(newPosition);
            scene.add(newCube);
            placedCubes.push(newCube);
        }
    } else if (!document.pointerLockElement) {
        sceneContainer.requestPointerLock();
    }
});

document.addEventListener('pointerlockchange', () => {
    const cursor = document.getElementById('cursor');
    if (document.pointerLockElement === sceneContainer) {
        consoleEl.style.display = 'none';
        cursor.style.display = 'block';
    } else {
        consoleEl.style.display = 'block';
        cursor.style.display = 'none';
        commandInput.focus();
    }
});

document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === sceneContainer) {
        controls.targetYaw -= event.movementX * 0.002;
        controls.targetPitch -= event.movementY * 0.002;
        controls.targetPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, controls.targetPitch));
    }
});

document.addEventListener('keydown', (event) => {
    if (controls.isCommandInputFocused) {
        return;
    }

    switch (event.code) {
        case 'KeyW': controls.moveForward = true; break;
        case 'KeyS': controls.moveBackward = true; break;
        case 'KeyA': controls.moveLeft = true; break;
        case 'KeyD': controls.moveRight = true; break;
        case 'KeyC':
            if (buildMode) {
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera({ x: 0, y: 0 }, camera);
                const intersects = raycaster.intersectObjects(placedCubes);
                if (intersects.length > 0) {
                    buildCube.material = intersects[0].object.material.clone();
                }
            }
            break;
    }
});

document.addEventListener('keyup', (event) => {
    if (controls.isCommandInputFocused) return;
    switch (event.code) {
        case 'KeyW': controls.moveForward = false; break;
        case 'KeyS': controls.moveBackward = false; break;
        case 'KeyA': controls.moveLeft = false; break;
        case 'KeyD': controls.moveRight = false; break;
    }
});

function updatePlayer() {
    if (document.pointerLockElement === sceneContainer) {
        controls.yaw = THREE.MathUtils.lerp(controls.yaw, controls.targetYaw, turnSpeed);
        controls.pitch = THREE.MathUtils.lerp(controls.pitch, controls.targetPitch, turnSpeed);

        camera.rotation.y = controls.yaw;
        camera.rotation.x = controls.pitch;

        if (buildMode) {
            // This block is intentionally left empty. 
            // The buildCube is now attached to the camera and does not need to be moved by the raycaster here.
        }

        hand.visible = !flyMode;

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

        if (flyMode) {
            if (controls.moveForward) camera.position.addScaledVector(forward, moveSpeed);
            if (controls.moveBackward) camera.position.addScaledVector(forward, -moveSpeed);
            if (controls.moveLeft) camera.position.addScaledVector(right, -moveSpeed);
            if (controls.moveRight) camera.position.addScaledVector(right, moveSpeed);
        } else {
            const walkDirection = new THREE.Vector3();
            if (controls.moveForward) walkDirection.add(forward);
            if (controls.moveBackward) walkDirection.sub(forward);
            if (controls.moveLeft) walkDirection.sub(right);
            if (controls.moveRight) walkDirection.add(right);

            walkDirection.y = 0;
            walkDirection.normalize();

            camera.position.addScaledVector(walkDirection, moveSpeed);

            camera.position.x = Math.max(-size / 2, Math.min(size / 2, camera.position.x));
            camera.position.z = Math.max(-size / 2, Math.min(size / 2, camera.position.z));

            if (walkDirection.length() > 0.1) {
                bobbing += 0.15;
                camera.position.y = 1.6 + Math.sin(bobbing) * 0.05;
                hand.position.x = 0.5 + Math.sin(bobbing) * 0.05;
                hand.position.y = -0.3 + Math.abs(Math.sin(bobbing)) * 0.05;
            } else {
                camera.position.y = 1.6;
            }
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    updatePlayer();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

commandInput.addEventListener('focus', () => {
    controls.isCommandInputFocused = true;
});

commandInput.addEventListener('blur', () => {
    controls.isCommandInputFocused = false;
});

function logToConsole(message) {
    const p = document.createElement('p');
    p.innerHTML = message; // Use innerHTML to allow for colored text
    consoleOutput.appendChild(p);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

commandInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const command = commandInput.value;
        logToConsole('> ' + command);
        handleCommand(command);
        commandInput.value = '';
    }
});

function handleCommand(command) {
    const parts = command.split(' ');
    const commandName = parts[0];
    const arg = parts[1];

    switch (commandName) {
        case '/help':
            logToConsole('Available commands:<br>' +
                '&nbsp;&nbsp;<span style="color: #00ff00;">/build [on|off]</span> - Toggle build mode.<br>' +
                '&nbsp;&nbsp;<span style="color: #00ff00;">/fly [on|off]</span> - Toggle fly mode.<br>' +
                '&nbsp;&nbsp;<span style="color: #00ff00;">C</span> - Clone the material of the cube you are looking at.');
            break;
        case '/build':
            if (arg === 'on') {
                buildMode = true;
                consoleEl.style.display = 'none';
                sceneContainer.requestPointerLock();
                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
                buildCube = new THREE.Mesh(geometry, material);
                camera.add(buildCube);
                buildCube.position.set(0.5, -0.3, -1.5);
            } else if (arg === 'off') {
                buildMode = false;
                if (buildCube) {
                    scene.remove(buildCube);
                    buildCube = null;
                }
            } else {
                logToConsole('Usage: /build [on|off]');
            }
            break;
        case '/fly':
            if (arg === 'on') {
                flyMode = true;
                consoleEl.style.display = 'none';
                sceneContainer.requestPointerLock();
                logToConsole('Fly mode enabled.');
            } else if (arg === 'off') {
                flyMode = false;
                logToConsole('Fly mode disabled.');
            } else {
                logToConsole('Usage: /fly [on|off]');
            }
            break;
        default:
            logToConsole('Unknown command: ' + commandName);
    }
}

logToConsole('Welcome to Gridulator! Here are some tips to get you started:<br>' +
    '&nbsp;&nbsp;- Type <span style="color: #00ff00;">/build on</span> to start building.<br>' +
    '&nbsp;&nbsp;- Left-click to place a cube.<br>' +
    '&nbsp;&nbsp;- While in build mode, look at a placed cube and press <span style="color: #00ff00;">C</span> to clone its color.<br>' +
    '&nbsp;&nbsp;- Type <span style="color: #00ff00;">/help</span> for a full list of commands.');