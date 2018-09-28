import { memory } from "chip-8-wasm/chip_8_wasm_bg";
import { Chip8 } from "chip-8-wasm";

const chip8 = Chip8.new();
const CYCLES_PER_FRAME = 20;
const MIN_PIXEL_SIZE = 10;
const MAX_SCREEN_WIDTH = 128;
const MAX_SCREEN_HEIGHT = 64;
const ROMS = [
  "15PUZZLE",
  "ALIEN",
  "ANT",
  "BLINKY",
  "BLITZ",
  "BRIX",
  "CAR",
  "CONNECT4",
  "FIELD",
  "GUESS",
  "HIDDEN",
  "INVADERS",
  "JOUST",
  "KALEID",
  "MAZE",
  "MERLIN",
  "MISSILE",
  "PIPER",
  "PONG",
  "PONG2",
  "PUZZLE",
  "RACE",
  "SPACEFIG",
  "SYZYGY",
  "TANK",
  "TETRIS",
  "TICTAC",
  "UBOAT",
  "UFO",
  "VBRIX",
  "VERS",
  "WIPEOFF",
  "WORM3",
];

const canvas = document.getElementById("chip-8-canvas");
const ctx = canvas.getContext('2d');
canvas.height = MIN_PIXEL_SIZE * MAX_SCREEN_HEIGHT;
canvas.width = MIN_PIXEL_SIZE * MAX_SCREEN_WIDTH;

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
    chip8.execute_cycle();
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
startButton.disabled = true;
stopButton.disabled = true;
stepButton.disabled = true;

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
  const screen = new Uint8Array(memory.buffer, screenPtr, MAX_SCREEN_WIDTH * MAX_SCREEN_HEIGHT / 8);

  ctx.beginPath();

  const isSuper = chip8.screen_height() == MAX_SCREEN_HEIGHT;
  const pixelSize = MIN_PIXEL_SIZE * (isSuper ? 1 : 2);

  ctx.fillStyle = "#000000"
  const height = chip8.screen_height();
  const width = chip8.screen_width();
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const index = row * width + col;
      const byteIndex = Math.floor(index / 8);
      const bitIndex = index % 8;
      if ((screen[byteIndex] & (1 << bitIndex)) != 0) {
        ctx.fillRect(
          col * pixelSize,
          row * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }
  }

  ctx.fillStyle = "#FFFFFF"
  for (let row = 0; row < chip8.screen_height(); row++) {
    for (let col = 0; col < chip8.screen_width(); col++) {
      const index = row * chip8.screen_width() + col;
      const byteIndex = Math.floor(index / 8);
      const bitIndex = index % 8;
      if ((screen[byteIndex] & (1 << bitIndex)) == 0) {
        ctx.fillRect(
          col * pixelSize,
          row * pixelSize,
          pixelSize,
          pixelSize
        );
      }
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
