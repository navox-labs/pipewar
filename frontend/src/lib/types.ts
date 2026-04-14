// PIPEWAR shared types matching architecture doc data model

export type BuildingType =
  | "miner"
  | "smelter"
  | "assembler"
  | "belt"
  | "rate_limiter"
  | "waf"
  | "auth_middleware"
  | "circuit_breaker";

export type ItemType =
  | "iron_ore"
  | "copper_ore"
  | "iron_plate"
  | "copper_plate"
  | "copper_wire"
  | "green_circuit"
  | "advanced_circuit";

export type Direction = "north" | "east" | "south" | "west";

export type AttackType =
  | "ddos_bot"
  | "credential_stuffer"
  | "sql_injection_probe"
  | "peak_load_attack"
  | "zero_day_exploit";

export interface BeltItem {
  item_type: ItemType;
  position: number; // 0.0 to 1.0
}

export interface BuildingData {
  type: BuildingType;
  direction: Direction;
  health: number;
  input_buffer?: Record<string, number>;
  output_buffer?: Record<string, number>;
  processing_ticks_remaining?: number;
  items?: BeltItem[]; // belt items
  active?: boolean;
}

export interface ResourceData {
  type: "iron_ore" | "copper_ore";
  remaining: number;
}

export interface GridState {
  buildings: Record<string, BuildingData>;
  defenses: Record<string, BuildingData>;
  resources: Record<string, ResourceData>;
}

export interface AttackerState {
  id: string;
  type: AttackType;
  x: number;
  y: number;
  hp: number;
  max_hp: number;
  trail: [number, number][];
}

export interface BeltItemUpdate {
  x: number;
  y: number;
  item_type: ItemType;
  position: number;
}

export interface MachineStateUpdate {
  x: number;
  y: number;
  type: BuildingType;
  health: number;
  processing: boolean;
  output_buffer: Record<string, number>;
}

export interface MachineMetric {
  pos: [number, number];
  items_per_min: number;
  is_bottleneck: boolean;
  has_demand: boolean;
}

export type GameEventType = "attack" | "warning" | "success" | "info";

export interface GameEvent {
  timestamp: string;
  message: string;
  eventType: GameEventType;
}

// WebSocket message types (server -> client)
export type ServerMessage =
  | StateSyncMsg
  | TickUpdateMsg
  | MetricsMsg
  | WaveStartMsg
  | WaveEndMsg
  | GameOverMsg
  | ErrorMsg
  | BuildingPlacedMsg
  | BuildingRemovedMsg
  | { type: "ping" };

export interface StateSyncMsg {
  type: "state_sync";
  tick: number;
  grid: GridState;
  advanced_circuits: number;
  uptime_pct: number;
  current_wave: number;
  status: string;
  exposed_machines?: [number, number][];
}

export interface TickUpdateMsg {
  type: "tick_update";
  tick: number;
  belt_items: BeltItemUpdate[];
  machine_states: MachineStateUpdate[];
  attackers: AttackerState[];
  exposed_machines?: [number, number][];
}

export interface MetricsMsg {
  type: "metrics";
  machines: MachineMetric[];
  total_traffic: number;
}

export interface WaveStartMsg {
  type: "wave_start";
  wave_number: number;
  total_attackers: number;
  attack_types: AttackType[];
  has_boss: boolean;
}

export interface WaveEndMsg {
  type: "wave_end";
  wave_number: number;
  attackers_blocked: number;
  attackers_leaked: number;
}

export interface GameOverMsg {
  type: "game_over";
  result: "won" | "lost";
  final_uptime: number;
  advanced_circuits: number;
  waves_survived: number;
}

export interface ErrorMsg {
  type: "error";
  message: string;
}

export interface BuildingPlacedMsg {
  type: "building_placed";
  x: number;
  y: number;
  building_type: BuildingType;
  direction: Direction;
}

export interface BuildingRemovedMsg {
  type: "building_removed";
  x: number;
  y: number;
}
