"use client";
import { useEffect, useRef, useCallback } from "react";
import { GRID_SIZE, CELL_SIZE, COLORS, BUILDING_GLYPHS, ITEM_COLORS, BUILDING_COLORS } from "@/lib/constants";
import { useGameStore } from "@/stores/gameStore";
import type { BuildingType, Direction } from "@/lib/types";

// Defense coverage types
const DEFENSE_TYPES = new Set([
  "rate_limiter", "waf", "auth_middleware", "circuit_breaker",
]);

// Per-type border colors matching scene3 palette
const BUILDING_BORDER_COLORS: Record<string, string> = {
  miner: "#3a8abf",
  smelter: "#b3b56a",
  assembler: "#b34a88",
  rate_limiter: "#5af78e",
  waf: "#b35c22",
  auth_middleware: "#3a8abf",
  circuit_breaker: "#b3b56a",
};

interface Props {
  onCellClick: (x: number, y: number, button: number) => void;
  onCellHover: (x: number, y: number) => void;
}

export function GameCanvas({ onCellClick, onCellHover }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const store = useGameStore();

  // Read store state inside render loop via refs to avoid re-subscribing
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
    const time = fc * 16; // approximate ms

    ctx.clearRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);

    // 1. Background
    ctx.fillStyle = COLORS.gridBg;
    ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);

    // 2. Subtle grid lines (very faint)
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 0.3;
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

    // 3. Grid dots at intersections (scene3 style)
    ctx.fillStyle = COLORS.gridDot;
    for (let x = 0; x <= GRID_SIZE; x++) {
      for (let y = 0; y <= GRID_SIZE; y++) {
        ctx.beginPath();
        ctx.arc(x * CELL_SIZE, y * CELL_SIZE, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.font = `bold 14px Menlo, Monaco, 'Courier New', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const { grid, beltItems, machineStates, attackers, exposedMachines, waveActive } = s;

    // 4. Resources — ore tiles
    for (const [key, res] of Object.entries(grid.resources)) {
      const [cx, cy] = key.split(",").map(Number);
      const px = cx * CELL_SIZE;
      const py = cy * CELL_SIZE;
      const oreColor = res.type === "iron_ore" ? COLORS.ironOre : COLORS.copperOre;
      // Ore background fill
      ctx.fillStyle = oreColor;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      ctx.globalAlpha = 1;
      // Small cross pattern
      ctx.fillStyle = oreColor;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(px + CELL_SIZE / 2 - 2, py + CELL_SIZE / 2 - 6, 4, 12);
      ctx.fillRect(px + CELL_SIZE / 2 - 6, py + CELL_SIZE / 2 - 2, 12, 4);
      ctx.globalAlpha = 1;
    }

    // 5. Defense coverage zone preview
    if (s.selectedBuilding && DEFENSE_TYPES.has(s.selectedBuilding) && s.hoveredCell) {
      const { x: hx, y: hy } = s.hoveredCell;
      const defColor = BUILDING_COLORS[s.selectedBuilding] ?? "#5af78e";
      for (let ox = -2; ox <= 2; ox++) {
        for (let oy = -2; oy <= 2; oy++) {
          const nx = hx + ox;
          const ny = hy + oy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            ctx.fillStyle = defColor;
            ctx.globalAlpha = 0.05;
            ctx.fillRect(nx * CELL_SIZE, ny * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    // 6. Defenses — scene3 style: border box + colored fill + range circles
    for (const [key, b] of Object.entries(grid.defenses)) {
      const [cx, cy] = key.split(",").map(Number);
      const px = cx * CELL_SIZE;
      const py = cy * CELL_SIZE;
      const color = BUILDING_COLORS[b.type] ?? COLORS.accent;

      // Range circles
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.06;
      ctx.beginPath();
      ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, CELL_SIZE * 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.1;
      ctx.beginPath();
      ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, CELL_SIZE * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Tower box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 3, py + 3, CELL_SIZE - 6, CELL_SIZE - 6);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(px + 3, py + 3, CELL_SIZE - 6, CELL_SIZE - 6);
      ctx.globalAlpha = 1;

      // Glyph
      ctx.fillStyle = color;
      ctx.font = `bold 13px Menlo, Monaco, 'Courier New', monospace`;
      ctx.fillText(BUILDING_GLYPHS[b.type] ?? "?", px + CELL_SIZE / 2, py + CELL_SIZE / 2);
      ctx.font = `bold 14px Menlo, Monaco, 'Courier New', monospace`;

      // Health bar
      const health = b.health ?? 100;
      if (health < 100) {
        const barY = py + CELL_SIZE - 3;
        ctx.fillStyle = "#0a3d7a";
        ctx.fillRect(px, barY, CELL_SIZE, 3);
        const pct = health / 100;
        ctx.fillStyle = pct > 0.5 ? COLORS.accent : pct > 0.25 ? COLORS.warning : COLORS.critical;
        ctx.fillRect(px, barY, CELL_SIZE * pct, 3);
      }
    }

    // 7. Belts — thin center line
    for (const [key, b] of Object.entries(grid.buildings)) {
      if (b.type !== "belt") continue;
      const [cx, cy] = key.split(",").map(Number);
      const px = cx * CELL_SIZE;
      const py = cy * CELL_SIZE;
      // Belt track fill
      ctx.fillStyle = COLORS.belt;
      ctx.globalAlpha = 0.4;
      if (b.direction === "east" || b.direction === "west") {
        ctx.fillRect(px + 4, py + CELL_SIZE / 2 - 4, CELL_SIZE - 8, 8);
      } else {
        ctx.fillRect(px + CELL_SIZE / 2 - 4, py + 4, 8, CELL_SIZE - 8);
      }
      ctx.globalAlpha = 1;
    }

    // 8. Belt items (live from tick_update)
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
      const itemColor = (ITEM_COLORS as Record<string, string>)[item_type] ?? COLORS.beltItem;
      ctx.fillStyle = itemColor;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(itemX, itemY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // 9. Production machines — scene3 bordered box style
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

      const fillColor = BUILDING_COLORS[b.type] ?? COLORS.machine;
      const borderColor = BUILDING_BORDER_COLORS[b.type] ?? fillColor;

      // Bordered box with colored fill at low opacity (scene3 pattern)
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 3, py + 3, CELL_SIZE - 6, CELL_SIZE - 6);
      ctx.fillStyle = fillColor;
      ctx.globalAlpha = health <= 0 ? 0.05 : 0.15;
      ctx.fillRect(px + 3, py + 3, CELL_SIZE - 6, CELL_SIZE - 6);
      ctx.globalAlpha = 1;

      // Exposed outline (pulsing red during wave)
      if (waveActive && exposedMachines.some(([ex, ey]) => ex === cx && ey === cy)) {
        const pulse = fc % 20 < 10;
        if (pulse) {
          ctx.strokeStyle = COLORS.critical;
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        }
      }

      // Glyph
      ctx.fillStyle = health <= 0 ? COLORS.critical : fillColor;
      if (health <= 0) ctx.globalAlpha = 0.3;
      ctx.font = `bold 14px Menlo, Monaco, 'Courier New', monospace`;
      ctx.fillText(BUILDING_GLYPHS[b.type] ?? "?", px + CELL_SIZE / 2, py + CELL_SIZE / 2);
      ctx.globalAlpha = 1;

      // Processing spinner (rotating line in top-right corner)
      if (liveState?.processing && health > 0) {
        const angle = (fc * 0.1) % (Math.PI * 2);
        const cx2 = px + CELL_SIZE - 7;
        const cy2 = py + 7;
        ctx.strokeStyle = fillColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx2 + Math.cos(angle) * 3, cy2 + Math.sin(angle) * 3);
        ctx.lineTo(cx2 + Math.cos(angle + Math.PI) * 3, cy2 + Math.sin(angle + Math.PI) * 3);
        ctx.stroke();
      }

      // Health bar
      if (health < 100) {
        const barY = py + CELL_SIZE - 3;
        ctx.fillStyle = "#0a3d7a";
        ctx.fillRect(px, barY, CELL_SIZE, 3);
        const pct = health / 100;
        ctx.fillStyle = pct > 0.5 ? COLORS.accent : pct > 0.25 ? COLORS.warning : COLORS.critical;
        ctx.fillRect(px, barY, CELL_SIZE * pct, 3);
      }
    }

    // 10. Attackers — scene3 glow + core dot style
    for (const att of attackers) {
      // Trail (faded red squares behind attacker)
      for (let t = 0; t < att.trail.length; t++) {
        const [tx, ty] = att.trail[t];
        ctx.globalAlpha = 0.35 * ((t + 1) / att.trail.length);
        ctx.fillStyle = COLORS.attacker;
        ctx.beginPath();
        ctx.arc(
          tx * CELL_SIZE + CELL_SIZE / 2,
          ty * CELL_SIZE + CELL_SIZE / 2,
          2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const ax = att.x * CELL_SIZE + CELL_SIZE / 2;
      const ay = att.y * CELL_SIZE + CELL_SIZE / 2;

      // Glow (pulsing)
      const pulsePhase = (fc * 0.05) % (Math.PI * 2);
      ctx.fillStyle = COLORS.attacker;
      ctx.globalAlpha = 0.12 + 0.08 * Math.sin(time * 0.004 + pulsePhase);
      ctx.beginPath();
      ctx.arc(ax, ay, 10, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(ax, ay, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // 11. Hover preview
    if (s.selectedBuilding && s.hoveredCell) {
      const { x: hx, y: hy } = s.hoveredCell;
      const isDefense = DEFENSE_TYPES.has(s.selectedBuilding);
      const isOccupied = !!(
        grid.buildings[`${hx},${hy}`] || grid.defenses[`${hx},${hy}`]
      );
      const previewColor = isOccupied
        ? COLORS.critical
        : (BUILDING_COLORS[s.selectedBuilding] ?? COLORS.accent);
      ctx.globalAlpha = isOccupied ? 0.3 : 0.5;
      ctx.fillStyle = previewColor;
      const previewGlyph = s.selectedBuilding === "belt"
        ? (BUILDING_GLYPHS[`belt_${s.selectedDirection}`] ?? BUILDING_GLYPHS["belt"] ?? "─")
        : (BUILDING_GLYPHS[s.selectedBuilding] ?? "?");
      ctx.font = `bold 14px Menlo, Monaco, 'Courier New', monospace`;
      ctx.fillText(
        previewGlyph,
        hx * CELL_SIZE + CELL_SIZE / 2,
        hy * CELL_SIZE + CELL_SIZE / 2
      );
      ctx.globalAlpha = 1;

      // Preview border box
      ctx.strokeStyle = previewColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.strokeRect(hx * CELL_SIZE + 3, hy * CELL_SIZE + 3, CELL_SIZE - 6, CELL_SIZE - 6);
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
        border: "1px solid #1a2a3a",
      }}
    />
  );
}
