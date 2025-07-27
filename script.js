// Setup básico Three.js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
// Posición inicial cámara para ver mejor
camera.position.set(0, 3, 10);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Luces
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Luz ambiental más fuerte
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// Helper para ver ejes XYZ
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// Cargar modelo GLB con escala
const loader = new THREE.GLTFLoader();
loader.load('backrooms_level_188.glb', gltf => {
  const model = gltf.scene;
  model.scale.set(2, 2, 2); // Escala doble, podés ajustar
  scene.add(model);
}, undefined, error => {
  console.error('Error cargando modelo:', error);
});

// Variables para movimiento
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let prevTime = performance.now();

// Movimiento con joystick virtual
const joystick = document.getElementById('joystick');
const joystickStick = document.getElementById('joystickStick');

let joystickActive = false;
let joystickStartX = 0;
let joystickStartY = 0;
let joystickX = 0;
let joystickY = 0;

joystick.addEventListener('touchstart', e => {
  e.preventDefault();
  joystickActive = true;
  const touch = e.targetTouches[0];
  joystickStartX = touch.clientX;
  joystickStartY = touch.clientY;
}, {passive:false});

joystick.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!joystickActive) return;
  const touch = e.targetTouches[0];
  joystickX = touch.clientX - joystickStartX;
  joystickY = touch.clientY - joystickStartY;

  // Limitar movimiento stick a 40px radio
  const maxDist = 40;
  const dist = Math.sqrt(joystickX*joystickX + joystickY*joystickY);
  if (dist > maxDist) {
    joystickX = (joystickX / dist) * maxDist;
    joystickY = (joystickY / dist) * maxDist;
  }

  joystickStick.style.transform = `translate(${joystickX}px, ${joystickY}px)`;

  // Definir dirección
  moveForward = joystickY < -10;
  moveBackward = joystickY > 10;
  moveLeft = joystickX < -10;
  moveRight = joystickX > 10;
}, {passive:false});

joystick.addEventListener('touchend', e => {
  e.preventDefault();
  joystickActive = false;
  joystickX = 0;
  joystickY = 0;
  joystickStick.style.transform = `translate(0,0)`;
  moveForward = moveBackward = moveLeft = moveRight = false;
}, {passive:false});

// Controlar cámara con touch drag (mirar alrededor)
let isPointerDown = false;
let pointerX = 0;
let pointerY = 0;
let lon = 0;
let lat = 0;

document.addEventListener('touchstart', e => {
  if(e.target === joystick || e.target === joystickStick) return;
  if(e.touches.length === 1){
    isPointerDown = true;
    pointerX = e.touches[0].pageX;
    pointerY = e.touches[0].pageY;
  }
}, {passive:false});

document.addEventListener('touchmove', e => {
  if(!isPointerDown) return;
  if(e.touches.length === 1){
    const touch = e.touches[0];
    const deltaX = touch.pageX - pointerX;
    const deltaY = touch.pageY - pointerY;
    pointerX = touch.pageX;
    pointerY = touch.pageY;

    lon -= deltaX * 0.1;
    lat -= deltaY * 0.1;

    lat = Math.max(-85, Math.min(85, lat));
  }
}, {passive:false});

document.addEventListener('touchend', e => {
  isPointerDown = false;
}, {passive:false});

// Animación y lógica de movimiento
function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();
  const delta = (time - prevTime) / 1000;

  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveRight) - Number(moveLeft);
  direction.normalize();

  const speed = 3.5;
  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  if (direction.length() > 0) {
    velocity.x -= direction.x * speed * delta;
    velocity.z -= direction.z * speed * delta;
  }

  camera.position.x += velocity.x;
  camera.position.z += velocity.z;

  // Rotar cámara según lat/lon
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon);

  const target = new THREE.Vector3();
  target.x = camera.position.x + Math.sin(phi) * Math.cos(theta);
  target.y = camera.position.y + Math.cos(phi);
  target.z = camera.position.z + Math.sin(phi) * Math.sin(theta);

  camera.lookAt(target);

  renderer.render(scene, camera);
  prevTime = time;
}

// Empezar animación
animate();

// Ajustar canvas cuando cambia tamaño ventana
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
