import { memory } from "chip-8/chip_8_bg";
import { Cpu } from "chip-8";

const cpu = Cpu.new();
cpu.initialize();

const PIXEL_SIZE = 10;
const SCREEN_WIDTH = cpu.screen_width();
const SCREEN_HEIGHT = cpu.screen_height();

const canvas = document.getElementById("chip-8-canvas");
canvas.height = PIXEL_SIZE * SCREEN_HEIGHT;
canvas.width = PIXEL_SIZE * SCREEN_WIDTH;

const ctx = canvas.getContext('2d');

// Handle keyboard input
// 123C => 1234
// 456D => QWER
// 789E => ASDF
// A0BF => ZXCV
const KEYS = [88, 49, 50, 51, 81, 87, 69, 65, 83, 68, 90, 67, 52, 82, 70, 86];
document.addEventListener('keydown', event => {
  let index = KEYS.indexOf(event.keyCode);
  if (index !== -1) {
    cpu.press_key(index);
  }
})

document.addEventListener('keyup', event => {
  let index = KEYS.indexOf(event.keyCode);
  if (index !== -1) {
    cpu.release_key(index);
  }
})

fetch("roms/15PUZZLE")
  .then(response => response.arrayBuffer())
  .then(buffer => {
    cpu.load_rom(new Uint8Array(buffer));
    render();
  });

const drawScreen = () => {
  const screenPtr = cpu.screen();
  const screen = new Uint8Array(memory.buffer, screenPtr, SCREEN_WIDTH * SCREEN_HEIGHT / 8);

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
};

const render = () => {
  cpu.execute_cycle();
  drawScreen();
  window.requestAnimationFrame(render);
};
