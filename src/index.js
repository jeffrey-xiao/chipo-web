import { memory } from "chipo/chipo_bg";
import { Chip8 } from "chipo";
import './styles.scss';

const chip8 = Chip8.new();
const beep_sfx = new Audio("./assets/beep.mp3");
const CYCLES_PER_FRAME = 20;
const MAX_SCREEN_WIDTH = 128;
const MAX_SCREEN_HEIGHT = 64;
const REGISTER_COUNT = 18;
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

const canvasWrapper = document.getElementById("chipo-canvas-wrapper");
const canvas = document.getElementById("chipo-canvas");
const ctx = canvas.getContext('2d');

const adjustSizes = () => {
  canvasWrapper.style.height = canvasWrapper.offsetWidth / 2 + "px";
  canvas.width = Math.floor((canvasWrapper.offsetWidth - 10) / MAX_SCREEN_WIDTH) * MAX_SCREEN_WIDTH;
  canvas.height = canvas.width / 2;
};

window.addEventListener('resize', adjustSizes);
adjustSizes();

let isRunning = false;
let romName;


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


// Sound
const playBeep = () => {
  beep_sfx.play();
}


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
  updateUi();
};

const load = () => {
  stop();

  romName = romList.options[romList.selectedIndex].value;
  fetch(`assets/roms/${romName}`)
    .then(response => response.arrayBuffer())
    .then(buffer => {
      const machineCode = new Uint8Array(buffer);

      // Blitz expects that off screen sprites are clipped
      chip8.load_rom(machineCode, romName !== "BLITZ");

      // Blitz has most of its instructions on odd program counter values
      disassembleMachineCode(machineCode, romName !== "BLITZ");
      updateRegisters();
    });
};

startButton.addEventListener("click", start);
stopButton.addEventListener("click", stop);
stepButton.addEventListener("click", step);
loadButton.addEventListener("click", load);

const registers = [];
for (let i = 0; i < REGISTER_COUNT; i++) {
  const registerContainer = document.getElementById("registers");
  let register = document.createElement('div');
  register.className = "register";
  registerContainer.appendChild(register);
  registers.push(register);
}

const assemblyCode = document.getElementById("assembly-code");
const assemblyLines = [];

const disassembleMachineCode = (machineCode, isEven) => {
  while (assemblyLines.firstChild) {
    assemblyLines.removeChild(assemblyCode.firstChild);
  }

  for (let i = isEven ? 0 : 1; i < machineCode.length - 1; i += 2) {
    const programCounter = 0x200 + i;
    const assemblyLine = document.createElement("pre");
    assemblyLine.className = "assembly-line";
    assemblyLine.innerText = (" " + programCounter).slice(-4) + ": ";

    const opcode = (machineCode[i] << 8) + machineCode[i + 1];

    const t1 = (opcode & 0xF000) >> 12;
    const t2 = (opcode & 0x0F00) >> 8;
    const t3 = (opcode & 0x00F0) >> 4;
    const t4 = opcode & 0x000F;

    const x = t1;
    const y = t2;
    const nnn = opcode & 0x0FFF;
    const kk = opcode & 0x00FF;
    const n = opcode & 0x000F;

    if (t1 == 0x0 && t2 == 0x0 && t3 == 0xC)      assemblyLine.innerText += `SCD ${n}`;
    else if (opcode == 0x00E0)                    assemblyLine.innerText += "CLS";
    else if (opcode == 0x00EE)                    assemblyLine.innerText += "RET";
    else if (opcode == 0x00FB)                    assemblyLine.innerText += "SCR";
    else if (opcode == 0x00FC)                    assemblyLine.innerText += "SCL";
    else if (opcode == 0x00FD)                    assemblyLine.innerText += "EXIT";
    else if (opcode == 0x00FE)                    assemblyLine.innerText += "LOW";
    else if (opcode == 0x00FF)                    assemblyLine.innerText += "HIGH";
    else if (t1 == 0x1)                           assemblyLine.innerText += `JP ${nnn}`;
    else if (t1 == 0x2)                           assemblyLine.innerText += `CALL ${nnn}`;
    else if (t1 == 0x3)                           assemblyLine.innerText += `SE V${x}, ${kk}`;
    else if (t1 == 0x4)                           assemblyLine.innerText += `SNE V${x}, ${kk}`;
    else if (t1 == 0x5 && t4 == 0x0)              assemblyLine.innerText += `SE V${x}, V${y}`;
    else if (t1 == 0x6)                           assemblyLine.innerText += `LD V${x}, ${kk}`;
    else if (t1 == 0x7)                           assemblyLine.innerText += `ADD V${x}, ${kk}`;
    else if (t1 == 0x8 && t4 == 0x0)              assemblyLine.innerText += `LD V${x}, V${y}`;
    else if (t1 == 0x8 && t4 == 0x1)              assemblyLine.innerText += `OR V${x}, V${y}`;
    else if (t1 == 0x8 && t4 == 0x2)              assemblyLine.innerText += `AND V${x}, V${y}`;
    else if (t1 == 0x8 && t4 == 0x3)              assemblyLine.innerText += `XOR V${x}, V${y}`;
    else if (t1 == 0x8 && t4 == 0x4)              assemblyLine.innerText += `ADD V${x}, V${y}`;
    else if (t1 == 0x8 && t4 == 0x5)              assemblyLine.innerText += `SUB V${x}, V${y}`;
    else if (t1 == 0x8 && t4 == 0x6)              assemblyLine.innerText += `SHR V${x}, V${y}`;
    else if (t1 == 0x8 && t4 == 0x7)              assemblyLine.innerText += `SUBN V${x}, V${y}`;
    else if (t1 == 0x8 && t4 == 0xE)              assemblyLine.innerText += `SHL V${x}, V${y}`;
    else if (t1 == 0x9 && t4 == 0x0)              assemblyLine.innerText += `SNE V${x}, V${y}`;
    else if (t1 == 0xA)                           assemblyLine.innerText += `LD I, ${nnn}`;
    else if (t1 == 0xB)                           assemblyLine.innerText += `JP V0, ${nnn}`;
    else if (t1 == 0xC)                           assemblyLine.innerText += `RNG V${x}, ${kk}`;
    else if (t1 == 0xD)                           assemblyLine.innerText += `DRW V${x}, V${y}, ${n}`;
    else if (t1 == 0xE && t3 == 0x9 && t4 == 0xE) assemblyLine.innerText += `SKP V${x}`;
    else if (t1 == 0xE && t3 == 0xA && t4 == 0x1) assemblyLine.innerText += `SKNP V${x}`;
    else if (t1 == 0xF && t3 == 0x0 && t4 == 0x7) assemblyLine.innerText += `LD V${x}, DT`;
    else if (t1 == 0xF && t3 == 0x0 && t4 == 0xA) assemblyLine.innerText += `LD V${x}, K`;
    else if (t1 == 0xF && t3 == 0x1 && t4 == 0x5) assemblyLine.innerText += `LD DT, V${x}`;
    else if (t1 == 0xF && t3 == 0x1 && t4 == 0x8) assemblyLine.innerText += `LD ST, V${x}`;
    else if (t1 == 0xF && t3 == 0x1 && t4 == 0xE) assemblyLine.innerText += `ADD I, V${x}`;
    else if (t1 == 0xF && t3 == 0x2 && t4 == 0x9) assemblyLine.innerText += `LD F, V${x}`;
    else if (t1 == 0xF && t3 == 0x3 && t4 == 0x0) assemblyLine.innerText += `LD HF, V${x}`;
    else if (t1 == 0xF && t3 == 0x3 && t4 == 0x3) assemblyLine.innerText += `LD B, V${x}`;
    else if (t1 == 0xF && t3 == 0x5 && t4 == 0x5) assemblyLine.innerText += `LD [I], V${x}`;
    else if (t1 == 0xF && t3 == 0x6 && t4 == 0x5) assemblyLine.innerText += `LD V${x}, [I]`;
    else if (t1 == 0xF && t3 == 0x7 && t4 == 0x5) assemblyLine.innerText += `LD R, V${x}`;
    else if (t1 == 0xF && t3 == 0x8 && t4 == 0x5) assemblyLine.innerText += `LD V${x}, R`;
    else                                          assemblyLine.innerText += `${opcode}`;

    assemblyLines.push(assemblyLine);
    assemblyCode.appendChild(assemblyLine);
  }
};

const updateAssemblyCode = () => {
  assemblyLines[Math.round((chip8.program_counter() - 0x200) / 2)].scrollIntoView(true);
};

const updateRegisters = () => {
  const register_values = new Uint8Array(memory.buffer, chip8.registers(), REGISTER_COUNT - 2);
  for (let i = 0; i < REGISTER_COUNT; i++) {
    const register = registers[i];
    if (i == 0) {
      register.innerText = `PC: ${("  " + chip8.program_counter()).slice(-3)}`;
    } else if (i == 1) {
      register.innerText = ` I: ${("  " + chip8.index()).slice(-3)}`;
    } else {
      register.innerText = `${(" " + (i - 1)).slice(-2)}: ${("  " + register_values[i - 2]).slice(-3)}`;
    }
  }
};

const drawScreen = () => {
  const screenPtr = chip8.screen();
  const screen = new Uint8Array(memory.buffer, screenPtr, MAX_SCREEN_WIDTH * MAX_SCREEN_HEIGHT / 8);

  ctx.beginPath();

  const isSuper = chip8.screen_height() == MAX_SCREEN_HEIGHT;
  const pixelSize = (canvas.width / MAX_SCREEN_WIDTH) * (isSuper ? 1 : 2);

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

const updateUi = () => {
  updateAssemblyCode();
  updateRegisters();
  if (chip8.should_draw()) {
    drawScreen();
  }
  if (chip8.should_beep()) {
    playBeep();
  }
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
    updateUi();
    window.requestAnimationFrame(render);
  }
};

updateRegisters();
