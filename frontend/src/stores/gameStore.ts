"use client";
import { create } from "zustand";
import type {
  GridState,
  AttackerState,
  MachineMetric,
  GameEvent,
  BuildingType,
  Direction,
  AttackType,
  BeltItemUpdate,
  MachineStateUpdate,
  BuildingPlacedMsg,
  BuildingRemovedMsg,
} from "@/lib/types";

interface GameStore {
  // Connection
  connected: boolean;
  gameId: string | null;

  // Grid state (from server)
  grid: GridState;

  // Belt items (live from tick_update)
  beltItems: BeltItemUpdate[];

  // Machine states (live from tick_update)
  machineStates: MachineStateUpdate[];

  // Metrics (from server)
  machines: MachineMetric[];
  totalTraffic: number;

  // Game state
  uptimePct: number;
  advancedCircuits: number;
  currentWave: number;
  gameStatus: "active" | "won" | "lost";
  paused: boolean;

  // Attackers
  attackers: AttackerState[];

  // Exposed machines (during waves)
  exposedMachines: [number, number][];

  // Wave
  waveActive: boolean;
  waveAttackTypes: AttackType[];
  waveAttackerCount: number;
  waveNumber: number;

  // Game over
  gameOverResult: null | {
    result: "won" | "lost";
    final_uptime: number;
    advanced_circuits: number;
    waves_survived: number;
  };

  // Events
  events: GameEvent[];

  // UI state (client only)
  selectedBuilding: BuildingType | null;
  selectedDirection: Direction;
  hoveredCell: { x: number; y: number } | null;

  // Actions
  setConnected: (v: boolean) => void;
  setGameId: (id: string | null) => void;
  applyStateSync: (msg: import("@/lib/types").StateSyncMsg) => void;
  applyTickUpdate: (msg: import("@/lib/types").TickUpdateMsg) => void;
  applyMetrics: (msg: import("@/lib/types").MetricsMsg) => void;
  applyWaveStart: (msg: import("@/lib/types").WaveStartMsg) => void;
  applyWaveEnd: (msg: import("@/lib/types").WaveEndMsg) => void;
  applyGameOver: (msg: import("@/lib/types").GameOverMsg) => void;
  applyBuildingPlaced: (msg: BuildingPlacedMsg) => void;
  applyBuildingRemoved: (msg: BuildingRemovedMsg) => void;
  addEvent: (event: GameEvent) => void;
  selectBuilding: (type: BuildingType | null) => void;
  setDirection: (dir: Direction) => void;
  setHoveredCell: (cell: { x: number; y: number } | null) => void;
  resetGame: () => void;
}

const INITIAL_GRID: GridState = { buildings: {}, defenses: {}, resources: {} };

export const useGameStore = create<GameStore>((set, get) => ({
  connected: false,
  gameId: null,
  grid: INITIAL_GRID,
  beltItems: [],
  machineStates: [],
  machines: [],
  totalTraffic: 0,
  uptimePct: 100,
  advancedCircuits: 0,
  currentWave: 0,
  gameStatus: "active",
  paused: false,
  attackers: [],
  exposedMachines: [],
  waveActive: false,
  waveAttackTypes: [],
  waveAttackerCount: 0,
  waveNumber: 0,
  gameOverResult: null,
  events: [],
  selectedBuilding: null,
  selectedDirection: "east",
  hoveredCell: null,

  setConnected: (v) => set({ connected: v }),
  setGameId: (id) => set({ gameId: id }),

  applyStateSync: (msg) =>
    set({
      grid: msg.grid,
      advancedCircuits: msg.advanced_circuits,
      uptimePct: msg.uptime_pct,
      currentWave: msg.current_wave,
      exposedMachines: msg.exposed_machines ?? [],
      paused: msg.status === "paused",
    }),

  applyTickUpdate: (msg) =>
    set({
      beltItems: msg.belt_items,
      machineStates: msg.machine_states,
      attackers: msg.attackers,
      exposedMachines: msg.exposed_machines ?? get().exposedMachines,
    }),

  applyMetrics: (msg) =>
    set({
      machines: msg.machines,
      totalTraffic: msg.total_traffic,
    }),

  applyWaveStart: (msg) => {
    const event: GameEvent = {
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
      message: `Wave ${msg.wave_number} incoming -- ${msg.attack_types.join(", ")}`,
      eventType: "attack",
    };
    set((s) => ({
      waveActive: true,
      waveNumber: msg.wave_number,
      waveAttackTypes: msg.attack_types,
      waveAttackerCount: msg.total_attackers,
      events: [event, ...s.events].slice(0, 5),
    }));
  },

  applyWaveEnd: (msg) => {
    const event: GameEvent = {
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
      message: `Wave ${msg.wave_number} cleared -- blocked: ${msg.attackers_blocked}`,
      eventType: "success",
    };
    set((s) => ({
      waveActive: false,
      events: [event, ...s.events].slice(0, 5),
    }));
  },

  applyGameOver: (msg) =>
    set({
      gameStatus: msg.result,
      gameOverResult: msg,
    }),

  applyBuildingPlaced: (msg) =>
    set((s) => {
      const key = `${msg.x},${msg.y}`;
      const isDefense = ["rate_limiter", "waf", "auth_middleware", "circuit_breaker"].includes(msg.building_type);
      const buildingData = {
        type: msg.building_type,
        direction: s.selectedDirection,
        health: 100,
      };
      if (isDefense) {
        return {
          grid: {
            ...s.grid,
            defenses: { ...s.grid.defenses, [key]: buildingData },
          },
        };
      }
      return {
        grid: {
          ...s.grid,
          buildings: { ...s.grid.buildings, [key]: buildingData },
        },
      };
    }),

  applyBuildingRemoved: (msg) =>
    set((s) => {
      const key = `${msg.x},${msg.y}`;
      const buildings = { ...s.grid.buildings };
      const defenses = { ...s.grid.defenses };
      delete buildings[key];
      delete defenses[key];
      return { grid: { ...s.grid, buildings, defenses } };
    }),

  addEvent: (event) =>
    set((s) => ({ events: [event, ...s.events].slice(0, 5) })),

  selectBuilding: (type) => set({ selectedBuilding: type }),

  setDirection: (dir) => set({ selectedDirection: dir }),

  setHoveredCell: (cell) => set({ hoveredCell: cell }),

  resetGame: () =>
    set({
      connected: false,
      gameId: null,
      grid: INITIAL_GRID,
      beltItems: [],
      machineStates: [],
      machines: [],
      totalTraffic: 0,
      uptimePct: 100,
      advancedCircuits: 0,
      currentWave: 0,
      gameStatus: "active",
      paused: false,
      attackers: [],
      exposedMachines: [],
      waveActive: false,
      waveAttackTypes: [],
      waveAttackerCount: 0,
      waveNumber: 0,
      gameOverResult: null,
      events: [],
    }),
}));
