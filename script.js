// Alias Matter.js modules for easier coding
const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint } = Matter;

// Setup Physics Engine & Renderer
const container = document.getElementById('physics-container');
const engine = Engine.create();

const render = Render.create({
  element: container,
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false, // Set false to show full images instead of outline shapes
    background: 'transparent'
  }
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Add Mouse Control to enable dragging plushies
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.2, // Controls how "tight" the drag feels
    render: {
      visible: false // Hides the constraint line while dragging
    }
  }
});

Composite.add(engine.world, mouseConstraint);

// Keep mouse scroll/drag coordinates aligned with rendering
render.mouse = mouse;

// Create Ground Floor at the bottom for items to land on
const ground = Bodies.rectangle(
  window.innerWidth / 2, 
  window.innerHeight + 30, 
  window.innerWidth * 2, 
  100, 
  { isStatic: true }
);
Composite.add(engine.world, ground);

// Adjust renderer & ground dynamically if user resizes browser window
window.addEventListener('resize', () => {
  render.canvas.width = window.innerWidth;
  render.canvas.height = window.innerHeight;
  Matter.Body.setPosition(ground, {
    x: window.innerWidth + 100,
    y: window.innerHeight + 100
  });
});

// --- Background Music Setup ---
const bgm = document.getElementById('bgm');
let isBgmStarted = false;

// Function to start looping BGM on first user click anywhere
function startBgm() {
  if (!isBgmStarted && bgm) {
    bgm.volume = 0.3; // Sets comfortable background volume (30%)
    bgm.play().catch(err => console.log('BGM playback waiting:', err));
    isBgmStarted = true;
  }
}

// Attach BGM trigger to the very first click on the page
window.addEventListener('click', startBgm, { once: true });

// --- State Management & Character Pool ---
let isSpawningActive = false;
const toggleBtn = document.getElementById('toggle-btn');

// Character List with 90% / 5% / 5% weighted chances
const CHARACTERS = [
  {
    name: 'Aston Machan',
    url: 'AMplushie.png', // Main image (90%)
    soundId: 'sound-aston',
    chance: 0.90
  },
  {
    name: 'Daiwa Scarlet',
    url: 'DSplushie.png', // Rare image #1 (5%)
    soundId: 'sound-daiwa',
    chance: 0.05
  },
  {
    name: 'Vodka',
    url: 'Vplushie.png', // Rare image #2 (5%)
    soundId: 'sound-vodka',
    chance: 0.05
  }
];

// Sound Player Function
function playCharacterSound(soundId) {
  const audio = document.getElementById(soundId);
  if (audio) {
    audio.currentTime = 0; // Rewind to start for rapid clicking
    audio.play().catch(err => console.log('Audio playback waiting:', err));
  }
}

// Helper function to select character based on probability
function getRandomCharacter() {
  const roll = Math.random(); // Generates a number between 0.00 and 1.00

  if (roll < 0.05) {
    // 5% Chance (0.00 to 0.049) -> Daiwa Scarlet
    return CHARACTERS[1]; 
  } else if (roll < 0.10) {
    // 5% Chance (0.05 to 0.099) -> Vodka
    return CHARACTERS[2];
  } else {
    // 90% Chance (0.10 to 0.999) -> Aston Machan
    return CHARACTERS[0]; 
  }
}

// Toggle Mode ON / OFF on Button Click
toggleBtn.addEventListener('click', (e) => {
  e.stopPropagation(); // Prevents button click from spawning an image instantly
  isSpawningActive = !isSpawningActive;

  if (isSpawningActive) {
    toggleBtn.textContent = 'Stop Spawning';
    toggleBtn.style.backgroundColor = '#2ec1ac'; // Change color to indicate ACTIVE
    container.classList.add('active');
  } else {
    toggleBtn.textContent = 'Start Spawning';
    toggleBtn.style.backgroundColor = ''; // Reset button color
    container.classList.remove('active');
  }
});

// Click Anywhere to Spawn Image with Physics & Sound
window.addEventListener('click', (e) => {
  if (!isSpawningActive) return;

  // Prevent spawning a new plushie while holding/dragging an existing one
  if (mouseConstraint.body) return;

  // 1. Pick character based on probability
  const chosenCharacter = getRandomCharacter();

  // 2. Spawn using the chosen character's image URL
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

  // 3. Play the matching sound effect
  playCharacterSound(chosenCharacter.soundId);
});

// Clear Button Functionality (Silent)
const clearBtn = document.getElementById('clear-btn');

if (clearBtn) {
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevents spawning an item when clicking the button

    // Get all physics bodies currently in the world
    const allBodies = Composite.allBodies(engine.world);

    // Filter out ground and constraint objects so we only delete spawned plushies
    const itemsToRemove = allBodies.filter(body => body !== ground);

    // Remove each item from the physics world
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
    e.stopPropagation(); // Stops the physics spawner from triggering

    // 1. Play loud scream sound
    if (jumpscareSound) {
      jumpscareSound.currentTime = 0;
      jumpscareSound.volume = 1.0; // Maximum volume
      jumpscareSound.play().catch(err => console.log('Audio playback waiting:', err));
    }

    // 2. Show the full-screen image
    if (jumpscareOverlay) {
      jumpscareOverlay.classList.add('active');

      // 3. Hide the jumpscare after 10 seconds (10000ms)
      setTimeout(() => {
        jumpscareOverlay.classList.remove('active');
      }, 10000);
    }
  });
}
