// Alias Matter.js modules
const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint } = Matter;

const container = document.getElementById('physics-container');

// Helper to get accurate full screen size on all mobile/desktop devices
function getScreenSize() {
  return {
    width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  };
}

let screenSize = getScreenSize();

// Setup Physics Engine
const engine = Engine.create();

// Setup Renderer
const render = Render.create({
  element: container,
  engine: engine,
  options: {
    width: screenSize.width,
    height: screenSize.height,
    wireframes: false,
    background: 'transparent',
    pixelRatio: window.devicePixelRatio || 1 // Sharp rendering on mobile retina displays
  }
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Add Mouse/Touch Control to enable dragging plushies
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.2,
    render: { visible: false }
  }
});

Composite.add(engine.world, mouseConstraint);
render.mouse = mouse;

// Ground Floor Setup
const groundThickness = 100;
const ground = Bodies.rectangle(
  screenSize.width / 2,
  screenSize.height + (groundThickness / 2),
  screenSize.width * 2,
  groundThickness,
  { isStatic: true }
);
Composite.add(engine.world, ground);

// Adjust canvas, bounds & ground dynamically on screen resize/orientation change
window.addEventListener('resize', () => {
  screenSize = getScreenSize();
  
  // Update canvas size
  render.canvas.width = screenSize.width;
  render.canvas.height = screenSize.height;
  
  // Update render bounds
  render.bounds.max.x = screenSize.width;
  render.bounds.max.y = screenSize.height;
  render.options.width = screenSize.width;
  render.options.height = screenSize.height;

  // Reposition ground relative to new screen height
  Matter.Body.setPosition(ground, {
    x: screenSize.width / 2,
    y: screenSize.height + (groundThickness / 2)
  });
});

// --- Background Music Setup ---
const bgm = document.getElementById('bgm');
let isBgmStarted = false;

function startBgm() {
  if (!isBgmStarted && bgm) {
    bgm.volume = 0.3;
    bgm.play().catch(err => console.log('BGM playback waiting:', err));
    isBgmStarted = true;
  }
}

// Triggers BGM on first interaction (click or mobile tap)
window.addEventListener('pointerdown', startBgm, { once: true });

// --- State Management & Character Pool ---
let isSpawningActive = false;
const toggleBtn = document.getElementById('toggle-btn');

const CHARACTERS = [
  { name: 'Aston Machan', url: 'AMplushie.png', soundId: 'sound-aston', chance: 0.90 },
  { name: 'Daiwa Scarlet', url: 'DSplushie.png', soundId: 'sound-daiwa', chance: 0.05 },
  { name: 'Vodka', url: 'Vplushie.png', soundId: 'sound-vodka', chance: 0.05 }
];

function playCharacterSound(soundId) {
  const audio = document.getElementById(soundId);
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(err => console.log('Audio playback waiting:', err));
  }
}

function getRandomCharacter() {
  const roll = Math.random();
  if (roll < 0.05) return CHARACTERS[1];
  if (roll < 0.10) return CHARACTERS[2];
  return CHARACTERS[0];
}

// Toggle Spawning Mode
if (toggleBtn) {
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isSpawningActive = !isSpawningActive;

    if (isSpawningActive) {
      toggleBtn.textContent = 'Stop Spawning';
      toggleBtn.style.backgroundColor = '#2ec1ac';
      container.classList.add('active');
    } else {
      toggleBtn.textContent = 'Start Spawning';
      toggleBtn.style.backgroundColor = '';
      container.classList.remove('active');
    }
  });
}

// Spawn Plushie on Pointer Click / Tap Anywhere
window.addEventListener('pointerdown', (e) => {
  if (!isSpawningActive) return;

  // Prevent spawning if user clicked an interactive button/overlay
  if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

  // Prevent spawning a new plushie while grabbing/dragging an existing one
  if (mouseConstraint.body) return;

  const chosenCharacter = getRandomCharacter();

  const spawnedItem = Bodies.circle(e.clientX, e.clientY, 30, {
    restitution: 0.6,
    friction: 0.5,
    render: {
      sprite: {
        texture: chosenCharacter.url,
        xScale: 0.30,
        yScale: 0.30
      }
    }
  });

  Composite.add(engine.world, spawnedItem);
  playCharacterSound(chosenCharacter.soundId);
});

// Clear Button Functionality
const clearBtn = document.getElementById('clear-btn');
if (clearBtn) {
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const allBodies = Composite.allBodies(engine.world);
    const itemsToRemove = allBodies.filter(body => body !== ground);

    itemsToRemove.forEach(item => {
      Composite.remove(engine.world, item);
    });
  });
}

// Jumpscare Functionality
const jumpscareBtn = document.getElementById('jumpscare-btn');
const jumpscareOverlay = document.getElementById('jumpscare-overlay');
const jumpscareSound = document.getElementById('jumpscare-sound');

if (jumpscareBtn) {
  jumpscareBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    if (jumpscareSound) {
      jumpscareSound.currentTime = 0;
      jumpscareSound.volume = 1.0;
      jumpscareSound.play().catch(err => console.log('Audio playback waiting:', err));
    }

    if (jumpscareOverlay) {
      jumpscareOverlay.classList.add('active');
      setTimeout(() => {
        jumpscareOverlay.classList.remove('active');
      }, 10000);
    }
  });
    }
