// Game constants
export const GRID_SIZE = 20;
export const CELL_SIZE = 32; // pixels
export const CANVAS_SIZE = GRID_SIZE * CELL_SIZE; // 640

// REST goes through Vercel rewrites (same-origin cookies).
// WebSocket connects directly to Fly.io (Vercel can't proxy WS).
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
export const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "wss://pipewar-backend.fly.dev";

// Color palette — scene3 dark navy palette (also used for canvas rendering)
export const COLORS = {
  // Canvas background
  gridBg: "#001433",
  gridDot: "#0a2a4a",
  gridLine: "#0a1f3d",

  // Production buildings
  miner: "#57c7ff",
  minerBorder: "#3a8abf",
  smelter: "#f3f99d",
  smelterBorder: "#b3b56a",
  assembler: "#ff6ac1",
  assemblerBorder: "#b34a88",

  // Belt
  belt: "#4a5568",
  beltItem: "#5af78e",

  // Defense buildings
  rl: "#5af78e",
  waf: "#f0883e",
  auth: "#57c7ff",
  cb: "#f3f99d",

  // Ore
  ironOre: "#c87533",
  copperOre: "#c87533",
  oreBg: "#0f0a02",

  // Attackers
  attacker: "#ff4757",
  enemyGlow: "rgba(255, 71, 87, 0.25)",
  trail: "rgba(255, 71, 87, 0.4)",

  // UI chrome
  accent: "#5af78e",
  panelBg: "#001a3d",
  panelBorder: "#0a3d7a",
  cellBg: "#001433",

  // Text
  text: "#e0e0e0",
  textDim: "#a0b0c0",
  textMuted: "#7dd3fc",

  // States
  critical: "#ff4757",
  warning: "#f59e0b",
  empty: "#001433",
  emptyDot: "#0a2a4a",

  // Legacy aliases kept for canvas backward compat
  machine: "#57c7ff",
  machineText: "#57c7ff",
  defense: "#5af78e",
  defenseText: "#5af78e",
  machineActiveBg: "#001a3d",
  circuit: "#5af78e",
  ironPlate: "#94a3b8",
  copperPlate: "#c87533",
  copperWire: "#d97706",
  greenCircuit: "#5af78e",
} as const;

// Per-type glyph colors used in the canvas and build panel
export const BUILDING_COLORS: Record<string, string> = {
  miner: "#57c7ff",
  smelter: "#f3f99d",
  assembler: "#ff6ac1",
  belt: "#888",
  rate_limiter: "#5af78e",
  waf: "#f0883e",
  auth_middleware: "#57c7ff",
  circuit_breaker: "#f3f99d",
};

// Building glyphs
export const BUILDING_GLYPHS: Record<string, string> = {
  miner: "M",
  smelter: "S",
  assembler: "A",
  belt: "─",
  belt_east: "─",
  belt_west: "─",
  belt_north: "│",
  belt_south: "│",
  rate_limiter: "T",
  waf: "W",
  auth_middleware: "@",
  circuit_breaker: "◆",
};

export const ITEM_COLORS: Record<string, string> = {
  iron_ore: "#c87533",
  copper_ore: "#c87533",
  iron_plate: "#94a3b8",
  copper_plate: "#c87533",
  copper_wire: "#d97706",
  green_circuit: "#5af78e",
  advanced_circuit: "#5af78e",
};

// Build panel config
export const BUILDING_PANEL = [
  { key: "1", type: "miner" as const, glyph: "M", name: "Miner", category: "production" },
  { key: "2", type: "smelter" as const, glyph: "S", name: "Smelter", category: "production" },
  { key: "3", type: "assembler" as const, glyph: "A", name: "Assembler", category: "production" },
  { key: "4", type: "belt" as const, glyph: "─", name: "Belt", category: "production" },
  { key: "5", type: "rate_limiter" as const, glyph: "T", name: "Rate Lim.", category: "defense" },
  { key: "6", type: "waf" as const, glyph: "W", name: "WAF", category: "defense" },
  { key: "7", type: "auth_middleware" as const, glyph: "@", name: "Auth MW", category: "defense" },
  { key: "8", type: "circuit_breaker" as const, glyph: "◆", name: "Circuit Br.", category: "defense" },
] as const;
