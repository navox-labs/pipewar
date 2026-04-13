"use client";
import { useEffect, useRef, useCallback } from "react";
import { GRID_SIZE, CELL_SIZE, COLORS, BUILDING_GLYPHS, ITEM_COLORS } from "@/lib/constants";
import { useGameStore } from "@/stores/gameStore";
import type { BuildingType, Direction } from "@/lib/types";

// Defense coverage types that are defense buildings
const DEFENSE_TYPES = new Set([
  "rate_limiter", "waf", "auth_middleware", "circuit_breaker",
]);

interface Props {
  onCellClick: (x: number, y: number, button: number) => void;
  onCellHover: (x: number, y: number) => void;
}

export function GameCanvas({ onCellClick, onCellHover }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const store = useGameStore();

  // We read store state inside the render loop via refs to avoid re-subscribing
  const storeRef = useRef(store);
  useEffect(() => {
    storeRef.current = store;
  });

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const s = storeRef.current;
    const fc = frameCountRef.current++;

    ctx.clearRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);

    // 1. Background
    ctx.fillStyle = COLORS.gridBg;
    ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);

    // 2. Grid lines
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    ctx.font = `16px 'JetBrains Mono', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 3. Resources
    const { grid, beltItems, machineStates, attackers, exposedMachines, waveActive } = s;
    for (const [key, res] of Object.entries(grid.resources)) {
      const [cx, cy] = key.split(",").map(Number);
      const px = cx * CELL_SIZE;
      const py = cy * CELL_SIZE;
      ctx.fillStyle = COLORS.oreBg;
      ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
      ctx.fillStyle = res.type === "iron_ore" ? COLORS.ironOre : COLORS.copperOre;
      ctx.fillText("░", px + CELL_SIZE / 2, py + CELL_SIZE / 2);
    }

    // 4. Empty cell dots
    const occupiedKeys = new Set([
      ...Object.keys(grid.buildings),
      ...Object.keys(grid.defenses),
      ...Object.keys(grid.resources),
    ]);
    ctx.fillStyle = COLORS.emptyDot;
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (!occupiedKeys.has(`${x},${y}`)) {
          ctx.fillRect(x * CELL_SIZE + CELL_SIZE / 2 - 1, y * CELL_SIZE + CELL_SIZE / 2 - 1, 2, 2);
        }
      }
    }

    // 5. Defense coverage zones (when selected defense)
    if (s.selectedBuilding && DEFENSE_TYPES.has(s.selectedBuilding) && s.hoveredCell) {
      const { x: hx, y: hy } = s.hoveredCell;
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const nx = hx + ox;
          const ny = hy + oy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            ctx.fillStyle = "rgba(29,78,216,0.08)";
            ctx.fillRect(nx * CELL_SIZE, ny * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          }
        }
      }
    }

    // 6. Defenses
    for (const [key, b] of Object.entries(grid.defenses)) {
      const [cx, cy] = key.split(",").map(Number);
      const px = cx * CELL_SIZE;
      const py = cy * CELL_SIZE;
      ctx.fillStyle = COLORS.machineActiveBg;
      ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = COLORS.defense;
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      ctx.fillStyle = COLORS.defenseText;
      const glyph = BUILDING_GLYPHS[b.type] ?? "?";
      ctx.fillText(glyph, px + CELL_SIZE / 2, py + CELL_SIZE / 2);
    }

    // 7. Belts (base lines)
    for (const [key, b] of Object.entries(grid.buildings)) {
      if (b.type !== "belt") continue;
      const [cx, cy] = key.split(",").map(Number);
      const px = cx * CELL_SIZE;
      const py = cy * CELL_SIZE;
      ctx.strokeStyle = COLORS.belt;
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (b.direction === "east" || b.direction === "west") {
        ctx.moveTo(px, py + CELL_SIZE / 2);
        ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE / 2);
      } else {
        ctx.moveTo(px + CELL_SIZE / 2, py);
        ctx.lineTo(px + CELL_SIZE / 2, py + CELL_SIZE);
      }
      ctx.stroke();
    }

    // 8. Belt items (from live tick_update, interpolated)
    for (const item of beltItems) {
      const { x, y, item_type, position } = item;
      const building = grid.buildings[`${x},${y}`];
      if (!building || building.type !== "belt") continue;
      const dir = building.direction;
      let itemX: number, itemY: number;
      const startX = x * CELL_SIZE;
      const startY = y * CELL_SIZE;
      if (dir === "east") {
        itemX = startX + position * CELL_SIZE;
        itemY = startY + CELL_SIZE / 2;
      } else if (dir === "west") {
        itemX = startX + (1 - position) * CELL_SIZE;
        itemY = startY + CELL_SIZE / 2;
      } else if (dir === "south") {
        itemX = startX + CELL_SIZE / 2;
        itemY = startY + position * CELL_SIZE;
      } else {
        itemX = startX + CELL_SIZE / 2;
        itemY = startY + (1 - position) * CELL_SIZE;
      }
      ctx.fillStyle = (ITEM_COLORS as Record<string, string>)[item_type] ?? "#ffffff";
      ctx.beginPath();
      ctx.arc(itemX, itemY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 9. Production machines
    const machineStateMap = new Map(
      machineStates.map((ms) => [`${ms.x},${ms.y}`, ms])
    );

    for (const [key, b] of Object.entries(grid.buildings)) {
      if (b.type === "belt") continue;
      const [cx, cy] = key.split(",").map(Number);
      const px = cx * CELL_SIZE;
      const py = cy * CELL_SIZE;
      const liveState = machineStateMap.get(key);
      const health = liveState?.health ?? b.health ?? 100;

      // Background
      ctx.fillStyle = "#001a3d";
      ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

      // Border
      ctx.strokeStyle = COLORS.machine;
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);

      // Exposed outline (during wave)
      if (waveActive && exposedMachines.some(([ex, ey]) => ex === cx && ey === cy)) {
        const pulse = fc % 20 < 10;
        if (pulse) {
          ctx.strokeStyle = COLORS.critical;
          ctx.lineWidth = 2;
          ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
        }
      }

      // Glyph
      ctx.fillStyle = health <= 0 ? COLORS.critical : COLORS.machineText;
      if (health <= 0) ctx.globalAlpha = 0.3;
      ctx.fillText(BUILDING_GLYPHS[b.type] ?? "?", px + CELL_SIZE / 2, py + CELL_SIZE / 2);
      ctx.globalAlpha = 1;

      // Processing indicator (rotating 4px line)
      if (liveState?.processing && health > 0) {
        const angle = (fc * 0.1) % (Math.PI * 2);
        const cx2 = px + CELL_SIZE - 6;
        const cy2 = py + 6;
        ctx.strokeStyle = COLORS.machine;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx2 + Math.cos(angle) * 4, cy2 + Math.sin(angle) * 4);
        ctx.lineTo(cx2 + Math.cos(angle + Math.PI) * 4, cy2 + Math.sin(angle + Math.PI) * 4);
        ctx.stroke();
      }

      // Health bar
      if (health < 100) {
        const barY = py + CELL_SIZE - 3;
        ctx.fillStyle = "#333";
        ctx.fillRect(px, barY, CELL_SIZE, 3);
        const pct = health / 100;
        ctx.fillStyle = pct > 0.5 ? "#34d399" : pct > 0.25 ? "#f59e0b" : "#f43f5e";
        ctx.fillRect(px, barY, CELL_SIZE * pct, 3);
      }
    }

    // 10. Attackers with flicker and trail
    for (const att of attackers) {
      // Trail
      for (let t = 0; t < att.trail.length; t++) {
        const [tx, ty] = att.trail[t];
        ctx.globalAlpha = 0.5 * ((t + 1) / att.trail.length);
        ctx.fillStyle = COLORS.trail;
        ctx.fillRect(
          tx * CELL_SIZE + CELL_SIZE / 2 - 2,
          ty * CELL_SIZE + CELL_SIZE / 2 - 2,
          4, 4
        );
      }
      ctx.globalAlpha = 1;

      // Attacker glyph -- flicker every ~8 frames
      const visible = fc % 8 < 5;
      if (visible) {
        const ax = att.x * CELL_SIZE + CELL_SIZE / 2;
        const ay = att.y * CELL_SIZE + CELL_SIZE / 2;
        ctx.fillStyle = COLORS.attacker;
        ctx.font = `14px 'JetBrains Mono', monospace`;
        ctx.fillText("◆", ax, ay);
        ctx.font = `16px 'JetBrains Mono', monospace`;
      }
    }

    // 11. Hover preview
    if (s.selectedBuilding && s.hoveredCell) {
      const { x: hx, y: hy } = s.hoveredCell;
      const isDefense = DEFENSE_TYPES.has(s.selectedBuilding);
      const isOccupied = !!(
        grid.buildings[`${hx},${hy}`] || grid.defenses[`${hx},${hy}`]
      );
      ctx.globalAlpha = isOccupied ? 0.3 : 0.5;
      ctx.fillStyle = isOccupied ? COLORS.critical : (isDefense ? COLORS.defense : COLORS.machine);
      ctx.fillText(
        BUILDING_GLYPHS[s.selectedBuilding] ?? "?",
        hx * CELL_SIZE + CELL_SIZE / 2,
        hy * CELL_SIZE + CELL_SIZE / 2
      );
      ctx.globalAlpha = 1;
    }

    frameRef.current = requestAnimationFrame(render);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    frameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameRef.current);
  }, [render]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      onCellHover(x, y);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      onCellClick(x, y, e.button);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={GRID_SIZE * CELL_SIZE}
      height={GRID_SIZE * CELL_SIZE}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        handleClick(e as unknown as React.MouseEvent<HTMLCanvasElement>);
      }}
      onMouseLeave={() => storeRef.current.setHoveredCell(null)}
      style={{
        display: "block",
        cursor: store.selectedBuilding ? "crosshair" : "default",
        border: "1px solid #0a3d7a",
      }}
    />
  );
}
