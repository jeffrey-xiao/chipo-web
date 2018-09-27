import { memory } from "chip-8/chip_8_bg";
import { Chip8 } from "chip-8";

const chip8 = Chip8.new();
const CYCLES_PER_FRAME = 10;
const PIXEL_SIZE = 10;
const SCREEN_WIDTH = chip8.screen_width();
const SCREEN_HEIGHT = chip8.screen_height();
const ROMS = [
  "15PUZZLE",
  "BLINKY",
  "BLITZ",
  "BRIX",
  "CONNECT4",
  "GUESS",
  "HIDDEN",
  "INVADERS",
  "KALEID",
  "MAZE",
  "MERLIN",
  "MISSILE",
  "PONG",
  "PONG2",
  "PUZZLE",
  "SYZYGY",
  "TANK",
  "TEST",
  "TETRIS",
  "TICTAC",
  "UFO",
  "VBRIX",
  "VERS",
  "WIPEOFF",
];

const canvas = document.getElementById("chip-8-canvas");
const ctx = canvas.getContext('2d');
canvas.height = PIXEL_SIZE * SCREEN_HEIGHT;
canvas.width = PIXEL_SIZE * SCREEN_WIDTH;

let isRunning = false;


// Handle keyboard input
// 123C => 1234
// 456D => QWER
// 789E => ASDF
// A0BF => ZXCV
const KEYS = [88, 49, 50, 51, 81, 87, 69, 65, 83, 68, 90, 67, 52, 82, 70, 86];

document.addEventListener('keydown', event => {
  let index = KEYS.indexOf(event.keyCode);
  if (index !== -1) {
    chip8.press_key(index);
  }
});

document.addEventListener('keyup', event => {
  let index = KEYS.indexOf(event.keyCode);
  if (index !== -1) {
    chip8.release_key(index);
  }
});


// User Interface
const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const stepButton = document.getElementById("step-button");
const romList = document.getElementById("rom-list");
const loadButton = document.getElementById("load-button");

ROMS.forEach(romName => {
  const romOption = document.createElement("option");
  romOption.value = romOption.text = romName;
  romList.add(romOption);
});

const start = () => {
  startButton.disabled = true;
  stepButton.disabled = true;
  stopButton.disabled = false;

  isRunning = true;
  render();
};

const stop = () => {
  stopButton.disabled = true;
  startButton.disabled = false;
  stepButton.disabled = false;

  isRunning = false;
};

const step = () => {
  chip8.execute_cycle();
  chip8.decrement_timers();
  drawScreen();
};

const load = () => {
  stop();

  fetch(`roms/${romList.options[romList.selectedIndex].value}`)
    .then(response => response.arrayBuffer())
    .then(buffer => {
      chip8.load_rom(new Uint8Array(buffer))
      start();
    });
}

startButton.addEventListener("click", start);
stopButton.addEventListener("click", stop);
stepButton.addEventListener("click", step);
loadButton.addEventListener("click", load);

// Sound
const playBeep = () => {
  let beep = new Audio("./beep.mp3");
  beep.play();
}

const drawScreen = () => {
  const screenPtr = chip8.screen();
  const screen = new Uint8Array(memory.buffer, screenPtr, SCREEN_WIDTH * SCREEN_HEIGHT / 8);

  ctx.beginPath();

  for (let row = 0; row < SCREEN_HEIGHT; row++) {
    for (let col = 0; col < SCREEN_WIDTH; col++) {
      const index = row * SCREEN_WIDTH + col;
      const byteIndex = Math.floor(index / 8);
      const bitIndex = index % 8;

      ctx.fillStyle = (screen[byteIndex] & (1 << bitIndex)) != 0 ? "#000000" : "#FFFFFF";

      ctx.fillRect(
        col * PIXEL_SIZE,
        row * PIXEL_SIZE,
        PIXEL_SIZE,
        PIXEL_SIZE
      );
    }
  }

  ctx.closePath();
};

const render = () => {
  if (isRunning) {
    for (let i = 0; i < CYCLES_PER_FRAME; i++) {
      chip8.execute_cycle();
      if (chip8.should_draw()) {
        break;
      }
    }
    chip8.decrement_timers();
    if (chip8.should_draw()) {
      drawScreen();
    }
    if (chip8.should_beep()) {
      playBeep();
    }
    window.requestAnimationFrame(render);
  }
};
