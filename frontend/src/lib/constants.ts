// Game constants
export const GRID_SIZE = 20;
export const CELL_SIZE = 32; // pixels
export const CANVAS_SIZE = GRID_SIZE * CELL_SIZE; // 640

// Backend URLs
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

// Color palette (exact hex from UX spec -- also in CSS but needed for canvas)
export const COLORS = {
  gridBg: "#001433",
  gridLine: "#0a1f3d",
  panelBg: "#001a3d",
  panelBorder: "#0a3d7a",
  machine: "#38bdf8",
  machineText: "#7dd3fc",
  circuit: "#34d399",
  ironOre: "#854d0e",
  copperOre: "#b45309",
  oreBg: "#0f0a02",
  belt: "#1e4080",
  attacker: "#f43f5e",
  trail: "#7f1d1d",
  defense: "#1d4ed8",
  defenseText: "#60a5fa",
  warning: "#f59e0b",
  critical: "#f43f5e",
  ironPlate: "#94a3b8",
  copperPlate: "#b45309",
  copperWire: "#d97706",
  greenCircuit: "#34d399",
  machineActiveBg: "#001a3d",
  empty: "#001433",
  emptyDot: "#1a2940",
} as const;

// Building glyphs (UX spec section 1)
export const BUILDING_GLYPHS: Record<string, string> = {
  miner: "M",
  smelter: "S",
  assembler: "A",
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
  iron_ore: "#854d0e",
  copper_ore: "#b45309",
  iron_plate: "#94a3b8",
  copper_plate: "#b45309",
  copper_wire: "#d97706",
  green_circuit: "#34d399",
  advanced_circuit: "#34d399",
};

// Build panel config
export const BUILDING_PANEL = [
  { key: "1", type: "miner" as const, glyph: "M", name: "Miner", category: "production" },
  { key: "2", type: "smelter" as const, glyph: "S", name: "Smelter", category: "production" },
  { key: "3", type: "assembler" as const, glyph: "A", name: "Assembler", category: "production" },
  { key: "4", type: "belt" as const, glyph: "─", name: "Belt", category: "production" },
  { key: "5", type: "rate_limiter" as const, glyph: "T", name: "Rate Limiter", category: "defense" },
  { key: "6", type: "waf" as const, glyph: "W", name: "WAF", category: "defense" },
  { key: "7", type: "auth_middleware" as const, glyph: "@", name: "Auth Middleware", category: "defense" },
  { key: "8", type: "circuit_breaker" as const, glyph: "◆", name: "Circuit Breaker", category: "defense" },
] as const;
