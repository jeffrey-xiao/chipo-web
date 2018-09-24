import { memory } from "chip-8/chip_8_bg";
import { Cpu } from "chip-8";

const PIXEL_SIZE = 5;
const width = 64;
const height = 32;

const canvas = document.getElementById("chip-8-canvas");
canvas.height = PIXEL_SIZE * height;
canvas.width = PIXEL_SIZE * width;

const ctx = canvas.getContext('2d');

const cpu = Cpu.new();
cpu.initialize();

fetch("roms/15PUZZLE")
  .then(response => response.arrayBuffer())
  .then(buffer => {
    console.log(new Uint8Array(buffer));
    cpu.load_rom(new Uint8Array(buffer));
    render();
  });

const drawScreen = () => {
  const screenPtr = cpu.screen();
  const screen = new Uint8Array(memory.buffer, screenPtr, width * height);

  ctx.beginPath();

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const index = row * width + col;

      ctx.fillStyle = screen[index] ? "#000000" : "#FFFFFF";

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
  for (let i = 0; i < 10000; i++) {
    cpu.execute_cycle();
  }
  drawScreen();
};
