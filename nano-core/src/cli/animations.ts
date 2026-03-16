/**
 * NanoSolana Terminal Animations v2
 *
 * Epic startup experience with `unicode-animations` braille spinners,
 * gradient banners, animated lobsters, progress bars, phase transitions,
 * matrix rain, and system boot readouts.
 */

import chalk from "chalk";
import spinners from "unicode-animations";

// eslint-disable-next-line no-control-regex -- ANSI escape sequences are intentional
const ESC = "\x1B";
const CLEAR_LINE = `\r${ESC}[2K`;
const HIDE_CURSOR = `${ESC}[?25l`;
const SHOW_CURSOR = `${ESC}[?25h`;
const CLEAR_SCREEN = `${ESC}[2J`;
const HOME = `${ESC}[H`;
const SAVE_CURSOR = `${ESC}7`;
const RESTORE_CURSOR = `${ESC}8`;
function cursorUp(n: number) { return `${ESC}[${n}A`; }
function moveTo(row: number, col: number) { return `${ESC}[${row};${col}H`; }
function clearLineAt(row: number) { return `${moveTo(row, 1)}${ESC}[2K`; }

// ── Color Palette ──────────────────────────────────────────────

const SOL_GREEN  = "#14F195";
const SOL_PURPLE = "#9945FF";
const NANO_CYAN  = "#00E5FF";
const NANO_GOLD  = "#FFD700";
const NANO_RED   = "#FF3864";
const NANO_BLUE  = "#4FC3F7";
const DIM_GREEN  = "#0A7B4A";

const GRADIENT_COLORS = [
  "#14F195", "#12E08A", "#10CF7F", "#0EBE74",
  "#0CAD69", "#0A9C5E", "#088B53", "#067A48",
];

const SOLANA_GRADIENT = [
  "#14F195", "#1EE5A0", "#28D9AB", "#32CDB6",
  "#3CC1C1", "#46B5CC", "#50A9D7", "#5A9DE2",
  "#6491ED", "#6E85F8", "#7879FF", "#826DFF",
  "#8C61FF", "#9945FF",
];

// ── Utility ─────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h${m % 60}m`;
  if (m > 0) return `${m}m${s % 60}s`;
  return `${s}s`;
}

function gradientText(text: string, colors: string[]): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const colorIdx = Math.floor((i / text.length) * colors.length);
    result += chalk.hex(colors[Math.min(colorIdx, colors.length - 1)])(text[i]);
  }
  return result;
}

// ── Spinner Helper (using unicode-animations) ────────────────

export function createSpinner(msg: string, name: keyof typeof spinners = "braille") {
  const { frames, interval } = spinners[name];
  let i = 0;
  let text = msg;
  const timer = setInterval(() => {
    process.stdout.write(
      `${CLEAR_LINE}  ${chalk.hex(NANO_CYAN)(frames[i++ % frames.length])} ${chalk.white(text)}`,
    );
  }, interval);

  return {
    update(newMsg: string) {
      text = newMsg;
    },
    stop(doneMsg: string) {
      clearInterval(timer);
      process.stdout.write(`${CLEAR_LINE}  ${chalk.hex(SOL_GREEN)("✓")} ${chalk.white(doneMsg)}\n`);
    },
    fail(errMsg: string) {
      clearInterval(timer);
      process.stdout.write(`${CLEAR_LINE}  ${chalk.hex(NANO_RED)("✗")} ${chalk.hex(NANO_RED)(errMsg)}\n`);
    },
  };
}

export async function runWithSpinner<T>(
  label: string,
  fn: () => Promise<T>,
  name: keyof typeof spinners = "braille",
): Promise<T> {
  const s = createSpinner(label, name);
  try {
    const result = await fn();
    s.stop(label);
    return result;
  } catch (err) {
    s.fail(`${label} — ${(err as Error).message}`);
    throw err;
  }
}

// ── Progress Bar ────────────────────────────────────────────────

function progressBar(percent: number, width = 30): string {
  const filled = Math.round(width * percent);
  const empty = width - filled;
  const bar =
    chalk.hex(SOL_GREEN)("█".repeat(filled)) +
    chalk.hex(DIM_GREEN)("░".repeat(empty));
  const pct = chalk.hex(SOL_GREEN)(`${Math.round(percent * 100)}%`);
  return `${bar} ${pct}`;
}

// ── Splash Banner ───────────────────────────────────────────────

const NANO_BANNER = [
  "  ███╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ███████╗ ██████╗ ██╗      █████╗ ███╗   ██╗ █████╗ ",
  "  ████╗  ██║██╔══██╗████╗  ██║██╔═══██╗██╔════╝██╔═══██╗██║     ██╔══██╗████╗  ██║██╔══██╗",
  "  ██╔██╗ ██║███████║██╔██╗ ██║██║   ██║███████╗██║   ██║██║     ███████║██╔██╗ ██║███████║",
  "  ██║╚██╗██║██╔══██║██║╚██╗██║██║   ██║╚════██║██║   ██║██║     ██╔══██║██║╚██╗██║██╔══██║",
  "  ██║ ╚████║██║  ██║██║ ╚████║╚██████╔╝███████║╚██████╔╝███████╗██║  ██║██║ ╚████║██║  ██║",
  "  ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝",
];

export async function printSplashBanner(): Promise<void> {
  console.log();

  // Animate banner line by line with gradient
  for (let i = 0; i < NANO_BANNER.length; i++) {
    const line = NANO_BANNER[i];
    console.log(gradientText(line, SOLANA_GRADIENT));
    await sleep(40);
  }

  console.log();

  // Subtitle with typing effect
  const subtitle = "  🦞 Autonomous Financial Intelligence on Solana";
  for (let i = 0; i <= subtitle.length; i++) {
    process.stdout.write(`${CLEAR_LINE}${chalk.hex(SOL_GREEN)(subtitle.slice(0, i))}${chalk.hex(DIM_GREEN)("▌")}`);
    await sleep(12);
  }
  process.stdout.write(`${CLEAR_LINE}${chalk.hex(SOL_GREEN)(subtitle)}\n`);

  // Tagline
  console.log(chalk.gray("  OODA Trading · ClawVault Memory · TamaGOchi Pet · Mesh Network\n"));

  // Animated divider
  const cols = process.stdout.columns || 80;
  const dividerWidth = Math.min(cols - 4, 88);
  for (let i = 0; i <= dividerWidth; i++) {
    const filled = chalk.hex(SOL_GREEN)("━".repeat(i));
    const rest = chalk.hex(DIM_GREEN)("─".repeat(dividerWidth - i));
    process.stdout.write(`\r  ${filled}${rest}`);
    await sleep(3);
  }
  console.log();
}

// ── Phase Transition ────────────────────────────────────────────

const PHASE_ICONS: Record<string, string> = {
  init:     "⚙",
  birth:    "🔑",
  memory:   "🧠",
  pet:      "🐾",
  trade:    "📊",
  gateway:  "🌐",
  scan:     "🔍",
  pay:      "💳",
  register: "📋",
  mesh:     "🕸",
  complete: "🚀",
};

export async function phaseTransition(phaseName: string, label: string): Promise<void> {
  const icon = PHASE_ICONS[phaseName] ?? "▸";
  const cols = process.stdout.columns || 80;
  const lineW = Math.min(cols - 4, 60);

  console.log();

  // Phase header with animated bar
  const header = `${icon}  ${label}`;
  process.stdout.write(`  ${chalk.hex(SOL_PURPLE).bold(header)}  `);
  const barStart = header.length + 4;
  const barLen = Math.max(0, lineW - barStart);

  for (let i = 0; i < barLen; i++) {
    const color = SOLANA_GRADIENT[Math.floor((i / barLen) * SOLANA_GRADIENT.length)];
    process.stdout.write(chalk.hex(color)("─"));
    if (i % 4 === 0) await sleep(2);
  }
  console.log();
  console.log();
}

// ── Unicode Lobster Frames ──────────────────────────────────────

const LOBSTER_FRAMES = [
  [
    "         ╱╲    ╱╲         ",
    "        ╱  ╲──╱  ╲        ",
    "       │  ◉    ◉  │       ",
    "       │    ╲╱    │       ",
    "        ╲  │││  ╱        ",
    "         ╲═╧╧═╱         ",
    "        ╱╱╱ ╲╲╲        ",
    "       ╱╱╱   ╲╲╲       ",
  ],
  [
    "        ╱╲      ╱╲        ",
    "       ╱  ╲────╱  ╲       ",
    "       │  ●    ●  │       ",
    "       │    ──    │       ",
    "        ╲  │││  ╱        ",
    "         ╲═╧╧═╱         ",
    "       ╱╱╱╱ ╲╲╲╲       ",
    "      ╱╱╱╱   ╲╲╲╲      ",
  ],
  [
    "         ╱╲    ╱╲         ",
    "        ╱  ╲──╱  ╲        ",
    "       │  ◉    ◉  │       ",
    "       │    ╱╲    │       ",
    "        ╲  │││  ╱        ",
    "         ╲═╧╧═╱         ",
    "         ╱╱╲╲          ",
    "        ╱╱  ╲╲         ",
  ],
  [
    "          ╱╲  ╱╲          ",
    "         ╱  ╲╱  ╲         ",
    "        │  ◉  ◉  │        ",
    "        │   ╲╱   │        ",
    "         ╲ │││ ╱         ",
    "          ╲╧╧╧╱          ",
    "        ╱╱╱ ╲╲╲        ",
    "       ╱╱╱   ╲╲╲       ",
  ],
];

const LOBSTER_MEGA = [
  "                 ╱▔▔╲         ╱▔▔╲                 ",
  "           ┌────╱    ╲───────╱    ╲────┐           ",
  "          ╱│   │  ◉   │     │  ◉   │  │╲          ",
  "         ╱ │   │      ╰──┬──╯      │  │ ╲         ",
  "        ╱  ╰───╲     ╱██│██╲     ╱───╯  ╲        ",
  "       ╱        ╲   ╱███│███╲   ╱        ╲       ",
  "      │          ╲═╱████│████╲═╱          │      ",
  "      │           ╱█████│█████╲           │      ",
  "       ╲         ╱╱╱╱╱  │  ╲╲╲╲╲         ╱       ",
  "        ╲       ╱╱╱╱╱   │   ╲╲╲╲╲       ╱        ",
  "         ╲     ╱╱╱╱     │     ╲╲╲╲     ╱         ",
  "          ╲   ╱╱╱    ╱█████╲    ╲╲╲   ╱          ",
  "           ╰─╱╱    ╱█████████╲    ╲╲─╯           ",
];

const LOBSTER_COMPACT = [
  "    ╱╲  ╱╲    ",
  "   ╱◉╲──╱◉╲   ",
  "   │  ╲╱  │   ",
  "    ╲═╧╧═╱    ",
  "   ╱╱╱╲╲╲   ",
];

const LOBSTER_BIG = `
         ╱▔╲       ╱▔╲
        ╱╱  ╲─────╱  ╲╲
       ││ ◉ │     │ ◉ ││
       ││   ╰─┬─┬─╯   ││
        ╲╲   ╱│█│╲   ╱╱
         ╲╲ ╱█│█│█╲ ╱╱
          ╰╱██│█│██╲╯
          ╱╱╱ │█│ ╲╲╲
         ╱╱╱  │█│  ╲╲╲
        ╱╱   ╱███╲   ╲╲
`;

// ── Animated Lobster (frame-based) ──────────────────────────────

const LOBSTER_COLORS = [
  chalk.hex(SOL_GREEN),
  chalk.hex("#14F195"),
  chalk.hex(NANO_CYAN),
  chalk.hex("#00C9A7"),
  chalk.hex("#14F195"),
  chalk.hex(SOL_GREEN),
];

export function animateLobster(durationMs = 2400): Promise<void> {
  return new Promise((resolve) => {
    const frameCount = LOBSTER_FRAMES.length;
    const frameH = LOBSTER_FRAMES[0].length + 2;
    let frame = 0;

    // Reserve space
    process.stdout.write("\n".repeat(frameH));

    const interval = setInterval(() => {
      // Move cursor up
      process.stdout.write(cursorUp(frameH));
      // Draw frame with color cycling
      const f = LOBSTER_FRAMES[frame % frameCount];
      const color = LOBSTER_COLORS[frame % LOBSTER_COLORS.length];
      for (const line of f) {
        process.stdout.write(`${CLEAR_LINE}  ${color(line)}\n`);
      }
      // Animated name with sparkles
      const sparkles = frame % 3 === 0 ? "✦" : frame % 3 === 1 ? "✧" : "⋆";
      process.stdout.write(
        `${CLEAR_LINE}  ${chalk.hex(SOL_GREEN)(sparkles)} ${gradientText("  NanoSolana", SOLANA_GRADIENT)} ${chalk.hex(SOL_GREEN)(sparkles)}\n`,
      );
      process.stdout.write(
        `${CLEAR_LINE}  ${chalk.gray("    v1.0.1 · Solana Agent Framework")}\n`,
      );
      frame++;
    }, 180);

    setTimeout(() => {
      clearInterval(interval);
      resolve();
    }, durationMs);
  });
}

// ── Mega Lobster Display ────────────────────────────────────────

export async function printMegaLobster(): Promise<void> {
  console.log();
  for (let i = 0; i < LOBSTER_MEGA.length; i++) {
    const progress = i / LOBSTER_MEGA.length;
    const colorIdx = Math.floor(progress * SOLANA_GRADIENT.length);
    const color = SOLANA_GRADIENT[Math.min(colorIdx, SOLANA_GRADIENT.length - 1)];
    console.log(chalk.hex(color)(`  ${LOBSTER_MEGA[i]}`));
    await sleep(30);
  }
  console.log();
}

// ── DVD Bouncing Logo ──────────────────────────────────────────

const DVD_LOGO = [
  "╔═══════════════════════════════╗",
  "║      🦞 NanoSolana 🦞         ║",
  "║   ════════════════════════    ║",
  "║  Autonomous Solana Agent      ║",
  "║  OODA · ClawVault · TamaGOchi ║",
  "║      nanosolana.com           ║",
  "╚═══════════════════════════════╝",
];

const DVD_COLORS = [
  chalk.hex(SOL_GREEN),
  chalk.hex(SOL_PURPLE),
  chalk.hex(NANO_CYAN),
  chalk.hex(NANO_GOLD),
  chalk.hex(NANO_BLUE),
  chalk.hex("#FF6B6B"),
  chalk.hex("#C084FC"),
  chalk.hex("#34D399"),
];

export function startDvdScreensaver(): { stop: () => void } {
  const logoWidth = 33;
  const logoHeight = DVD_LOGO.length;
  let cols = process.stdout.columns || 80;
  let rows = process.stdout.rows || 24;

  let x = Math.floor(Math.random() * Math.max(1, cols - logoWidth));
  let y = Math.floor(Math.random() * Math.max(1, rows - logoHeight - 2));
  let dx = 1;
  let dy = 1;
  let colorIdx = 0;
  let hits = 0;
  let cornerHits = 0;

  // Hide cursor + clear
  process.stdout.write(`${HIDE_CURSOR}${CLEAR_SCREEN}`);

  const interval = setInterval(() => {
    cols = process.stdout.columns || 80;
    rows = process.stdout.rows || 24;

    // Clear previous
    for (let i = 0; i < logoHeight; i++) {
      process.stdout.write(clearLineAt(y + i + 1));
    }

    // Move
    x += dx;
    y += dy;

    // Bounce
    let bounced = false;
    if (x <= 0 || x + logoWidth >= cols) {
      dx *= -1;
      bounced = true;
    }
    if (y <= 0 || y + logoHeight >= rows - 1) {
      dy *= -1;
      bounced = true;
    }
    if (bounced) {
      colorIdx = (colorIdx + 1) % DVD_COLORS.length;
      hits++;
      // Corner hit detection
      if ((x <= 1 || x + logoWidth >= cols - 1) && (y <= 1 || y + logoHeight >= rows - 2)) {
        cornerHits++;
      }
    }

    x = Math.max(0, Math.min(x, cols - logoWidth));
    y = Math.max(0, Math.min(y, rows - logoHeight - 1));

    // Draw
    const color = DVD_COLORS[colorIdx];
    for (let i = 0; i < logoHeight; i++) {
      process.stdout.write(moveTo(y + i + 1, x + 1));
      process.stdout.write(color(DVD_LOGO[i]));
    }

    // Status bar
    process.stdout.write(moveTo(rows, 1));
    const cornerText = cornerHits > 0 ? ` │ 🎯 Corner: ${cornerHits}` : "";
    process.stdout.write(
      chalk.bgHex("#0a0a1a").hex(SOL_GREEN)(
        ` 🦞 NanoSolana DVD │ Bounces: ${hits}${cornerText} │ ${new Date().toLocaleTimeString()} │ Ctrl+C to exit `.padEnd(cols),
      ),
    );
  }, 50);

  const stop = () => {
    clearInterval(interval);
    process.stdout.write(`${SHOW_CURSOR}${CLEAR_SCREEN}${HOME}`);
  };

  return { stop };
}

/**
 * Play a short DVD-style intro animation and return to normal terminal mode.
 */
export async function playDvdIntro(durationMs = 1400): Promise<void> {
  const dvd = startDvdScreensaver();
  await sleep(durationMs);
  dvd.stop();
}

// ── Matrix Rain (nano-style) ───────────────────────────────────

export function matrixRain(durationMs = 1500): Promise<void> {
  return new Promise((resolve) => {
    const cols = process.stdout.columns || 80;
    const rows = process.stdout.rows || 24;
    const chars = "█▓▒░╬╫╪┼┤├┴┬│─◉◎○●◆◇✦✧⋆★☆".split("");
    const solChars = "SOLANANANOCLAWVAULTOODAx402".split("");
    const drops: number[] = Array(cols).fill(0).map(() => Math.floor(Math.random() * -rows));

    process.stdout.write(`${HIDE_CURSOR}${CLEAR_SCREEN}`);

    const interval = setInterval(() => {
      for (let c = 0; c < cols; c += 2) {
        const y = drops[c];
        if (y >= 0 && y < rows) {
          // Lead character (bright)
          const ch = Math.random() > 0.3
            ? chars[Math.floor(Math.random() * chars.length)]
            : solChars[Math.floor(Math.random() * solChars.length)];
          process.stdout.write(moveTo(y + 1, c + 1));
          process.stdout.write(chalk.hex(SOL_GREEN).bold(ch));

          // Trail (dimmer)
          if (y > 0 && y - 1 < rows) {
            process.stdout.write(moveTo(y, c + 1));
            process.stdout.write(chalk.hex(DIM_GREEN)(chars[Math.floor(Math.random() * chars.length)]));
          }
          if (y > 2 && y - 3 < rows) {
            process.stdout.write(moveTo(y - 2, c + 1));
            process.stdout.write(chalk.hex("#033d1a")(" "));
          }
        }
        drops[c]++;
        if (drops[c] > rows + 10) {
          drops[c] = Math.floor(Math.random() * -5);
        }
      }
    }, 35);

    setTimeout(() => {
      clearInterval(interval);
      process.stdout.write(`${SHOW_CURSOR}${CLEAR_SCREEN}${HOME}`);
      resolve();
    }, durationMs);
  });
}

// ── System Boot Readout ─────────────────────────────────────────

interface BootLine {
  label: string;
  value: string;
  color?: string;
}

export async function systemBootReadout(lines: BootLine[]): Promise<void> {
  const maxLabel = Math.max(...lines.map((l) => l.label.length));

  for (const line of lines) {
    const label = chalk.hex(SOL_GREEN)(line.label.padEnd(maxLabel));
    const sep = chalk.hex(DIM_GREEN)(" ── ");
    const value = chalk.hex(line.color ?? "#FFFFFF")(line.value);
    console.log(`    ${label}${sep}${value}`);
    await sleep(40);
  }
}

// ── Full Startup Animation Pipeline ─────────────────────────────

interface StartupStep {
  label: string;
  spinner: keyof typeof spinners;
  durationMs: number;
  icon: string;
}

const STARTUP_STEPS: StartupStep[] = [
  { label: "Generating Ed25519 keypair",               spinner: "helix",      durationMs: 400, icon: "🔐" },
  { label: "Deriving Solana wallet address",            spinner: "dna",        durationMs: 300, icon: "👛" },
  { label: "Encrypting private key (AES-256-GCM)",     spinner: "cascade",    durationMs: 500, icon: "🔒" },
  { label: "Requesting devnet airdrop",                 spinner: "orbit",      durationMs: 700, icon: "💰" },
  { label: "Minting Birth Certificate (Metaplex)",      spinner: "scan",       durationMs: 600, icon: "📜" },
  { label: "Initializing ClawVault memory engine",      spinner: "rain",       durationMs: 400, icon: "🧠" },
  { label: "Hatching TamaGOchi pet",                    spinner: "breathe",    durationMs: 500, icon: "🥚" },
  { label: "Calibrating RSI + EMA + ATR strategy",      spinner: "columns",    durationMs: 400, icon: "📈" },
  { label: "Bootstrapping OODA trading loop",           spinner: "snake",      durationMs: 300, icon: "🔄" },
  { label: "Initializing payment system (PumpAgent)",   spinner: "sparkle",    durationMs: 350, icon: "💳" },
  { label: "Connecting gateway (HMAC-SHA256)",          spinner: "braille",    durationMs: 400, icon: "🌐" },
];

export async function playStartupAnimation(): Promise<void> {
  const total = STARTUP_STEPS.length;

  for (let idx = 0; idx < total; idx++) {
    const step = STARTUP_STEPS[idx];
    const { frames, interval } = spinners[step.spinner];
    let i = 0;
    const percent = (idx + 1) / total;

    // Start spinner
    const timer = setInterval(() => {
      const spin = chalk.hex(NANO_CYAN)(frames[i++ % frames.length]);
      const bar = progressBar(percent);
      process.stdout.write(
        `${CLEAR_LINE}  ${spin} ${chalk.white(step.icon)} ${chalk.white(step.label)}  ${bar}`,
      );
    }, interval);

    await sleep(step.durationMs);

    clearInterval(timer);
    process.stdout.write(
      `${CLEAR_LINE}  ${chalk.hex(SOL_GREEN)("✓")} ${step.icon} ${chalk.white(step.label)}  ${progressBar(percent)}\n`,
    );
  }
}

// ── Lobster Walk ────────────────────────────────────────────────

export async function lobsterWalk(message: string): Promise<void> {
  const cols = process.stdout.columns || 80;
  const walkLen = Math.min(cols - 30, 30);
  const { frames, interval } = spinners.braille;
  let fi = 0;

  // Walk animation
  for (let i = 0; i < walkLen; i++) {
    const pad = " ".repeat(i);
    const trail = gradientText("·".repeat(Math.min(i, 8)), GRADIENT_COLORS);
    const spin = chalk.hex(NANO_CYAN)(frames[fi++ % frames.length]);
    process.stdout.write(`${CLEAR_LINE}  ${pad}${trail} ${spin} 🦞`);
    await sleep(interval);
  }

  // Arrival
  process.stdout.write(CLEAR_LINE);
  console.log(gradientText(`  🦞 ${message}`, SOLANA_GRADIENT));
}

// ── Print Static Lobster ────────────────────────────────────────

export function printLobster(): void {
  const lines = LOBSTER_BIG.split("\n");
  for (const line of lines) {
    console.log(chalk.hex(SOL_GREEN)(`  ${line}`));
  }
}

// ── Compact Lobster (inline) ────────────────────────────────────

export function printCompactLobster(): void {
  for (const line of LOBSTER_COMPACT) {
    console.log(chalk.hex(SOL_GREEN)(`    ${line}`));
  }
}

// ── Command Header ──────────────────────────────────────────────

export function printCommandHeader(command: string, description: string): void {
  const cols = process.stdout.columns || 80;
  const lineW = Math.min(cols - 4, 70);

  console.log();
  console.log(`  ${chalk.hex(SOL_GREEN).bold(`🦞 nanosolana ${command}`)}  ${chalk.gray(description)}`);
  console.log(`  ${chalk.hex(DIM_GREEN)("━".repeat(lineW))}`);
  console.log();
}

// ── Success / Error Banners ─────────────────────────────────────

export function printSuccess(message: string): void {
  console.log(`  ${chalk.hex(SOL_GREEN)("✓")} ${chalk.white(message)}`);
}

export function printError(message: string): void {
  console.log(`  ${chalk.hex(NANO_RED)("✗")} ${chalk.hex(NANO_RED)(message)}`);
}

export function printWarning(message: string): void {
  console.log(`  ${chalk.hex(NANO_GOLD)("⚠")} ${chalk.hex(NANO_GOLD)(message)}`);
}

export function printInfo(message: string): void {
  console.log(`  ${chalk.hex(NANO_CYAN)("ℹ")} ${chalk.white(message)}`);
}

// ── Complete Banner ─────────────────────────────────────────────

export async function printCompleteBanner(stats: {
  publicKey: string;
  petName: string;
  stage: string;
  mood: string;
  balance: number;
  memory: string;
  uptime?: string;
}): Promise<void> {
  const cols = process.stdout.columns || 80;
  const lineW = Math.min(cols - 4, 60);

  console.log();
  console.log(`  ${chalk.hex(SOL_GREEN)("━".repeat(lineW))}`);
  console.log();
  console.log(gradientText("  🦞 NanoSolana Agent Online", SOLANA_GRADIENT));
  console.log();

  await systemBootReadout([
    { label: "Wallet",   value: stats.publicKey, color: NANO_CYAN },
    { label: "Pet",      value: `${stats.stage} ${stats.petName} ${stats.mood}`, color: SOL_GREEN },
    { label: "Balance",  value: `${stats.balance.toFixed(4)} SOL`, color: NANO_GOLD },
    { label: "Memory",   value: stats.memory, color: SOL_PURPLE },
    { label: "Status",   value: "OODA loop active · Gateway connected", color: SOL_GREEN },
  ]);

  console.log();
  console.log(`  ${chalk.hex(SOL_GREEN)("━".repeat(lineW))}`);
  console.log(chalk.gray("  Press Ctrl+C to stop · nanosolana.com\n"));
}

// ── Payment Animation ───────────────────────────────────────────

export async function paymentAnimation(action: "invoice" | "verify" | "status"): Promise<void> {
  const labels: Record<string, { icon: string; text: string; spinner: keyof typeof spinners }> = {
    invoice: { icon: "💳", text: "Creating on-chain invoice", spinner: "cascade" },
    verify:  { icon: "🔍", text: "Verifying payment on-chain", spinner: "scan" },
    status:  { icon: "📊", text: "Loading payment status", spinner: "orbit" },
  };

  const { icon, text, spinner } = labels[action];
  const { frames, interval } = spinners[spinner];
  let i = 0;

  const timer = setInterval(() => {
    const spin = chalk.hex(NANO_CYAN)(frames[i++ % frames.length]);
    process.stdout.write(`${CLEAR_LINE}  ${spin} ${icon} ${chalk.white(text)}...`);
  }, interval);

  await sleep(800);
  clearInterval(timer);
  process.stdout.write(`${CLEAR_LINE}  ${chalk.hex(SOL_GREEN)("✓")} ${icon} ${chalk.white(text)}\n`);
}

// ── Status Bar ──────────────────────────────────────────────────

export function updateStatusBar(info: {
  balance: number;
  mood: string;
  stage: string;
  petName: string;
  signals: number;
  uptime: number;
}): void {
  const cols = process.stdout.columns || 80;
  const uptimeStr = formatUptime(info.uptime);
  const bar =
    ` 🦞 ${info.petName} ${info.stage}${info.mood} │ ` +
    `${info.balance.toFixed(4)} SOL │ ` +
    `${info.signals} signals │ ` +
    `⏱ ${uptimeStr}`;

  process.stdout.write(SAVE_CURSOR);
  const rows = process.stdout.rows || 24;
  process.stdout.write(moveTo(rows, 1));
  process.stdout.write(chalk.bgHex("#0a0a1a").hex(SOL_GREEN)(bar.padEnd(cols)));
  process.stdout.write(RESTORE_CURSOR);
}

// ── Demo Mode Animation ─────────────────────────────────────────

export async function demoIntro(): Promise<void> {
  printCommandHeader("demo", "Synthetic simulation mode");
  printCompactLobster();
  console.log();
  console.log(chalk.hex(NANO_GOLD)("  ⚡ Demo mode — no API keys required"));
  console.log(chalk.gray("  Simulating OODA trading cycles with synthetic data\n"));
}

// ── Init Prompt Style ───────────────────────────────────────────

export function printInitHeader(): void {
  console.log();
  console.log(gradientText("  ⚙  First Run Configuration", SOLANA_GRADIENT));
  console.log(chalk.gray("  Let's set up your API keys and agent configuration\n"));
}

export function printSectionHeader(title: string): void {
  console.log(chalk.hex(NANO_CYAN)(`  ── ${title} ${"─".repeat(Math.max(0, 50 - title.length))}\n`));
}
