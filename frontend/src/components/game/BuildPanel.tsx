"use client";
import { useGameStore } from "@/stores/gameStore";
import { BUILDING_PANEL, BUILDING_COLORS } from "@/lib/constants";
import type { BuildingType } from "@/lib/types";

export function BuildPanel() {
  const { selectedBuilding, selectBuilding } = useGameStore();

  const production = BUILDING_PANEL.filter((b) => b.category === "production");
  const defense = BUILDING_PANEL.filter((b) => b.category === "defense");

  return (
    <div className="w-40 bg-pw-bg border-r border-pw-panel-border p-3 flex flex-col shrink-0 overflow-x-hidden overflow-y-auto font-mono text-[11px]">
      <div className="text-pw-text-dim text-[10px] uppercase tracking-[1px] mb-1.5">
        Build
      </div>

      {/* Production section */}
      <div className="text-pw-text-dim text-[10px] uppercase tracking-[1px] mb-1.5 mt-2">
        Production
      </div>
      <div className="grid grid-cols-2 gap-1">
        {production.map((b) => (
          <BuildingTile
            key={b.type}
            shortcut={b.key}
            glyph={b.glyph}
            name={b.name}
            type={b.type}
            selected={selectedBuilding === b.type}
            onClick={() => selectBuilding(selectedBuilding === b.type ? null : b.type as BuildingType)}
          />
        ))}
      </div>

      {/* Defense section */}
      <div className="text-pw-text-dim text-[10px] uppercase tracking-[1px] mb-1.5 mt-3">
        Defense
      </div>
      <div className="grid grid-cols-2 gap-1">
        {defense.map((b) => (
          <BuildingTile
            key={b.type}
            shortcut={b.key}
            glyph={b.glyph}
            name={b.name}
            type={b.type}
            selected={selectedBuilding === b.type}
            onClick={() => selectBuilding(selectedBuilding === b.type ? null : b.type as BuildingType)}
          />
        ))}
      </div>

      {/* Production chain legend */}
      <div className="mt-4 text-[10px] leading-[1.6]">
        <div className="text-pw-text-dim text-[10px] uppercase tracking-[1px] mb-1">
          Chain
        </div>
        <div className="text-pw-chain">Iron Ore → Smelter → Iron Plate</div>
        <div className="text-pw-chain">Copper Ore → Smelter → Copper Plate</div>
        <div className="text-pw-chain">Copper Plate → Assembler → Wire</div>
        <div className="text-pw-chain">Iron Plate + Wire → Green Circuit</div>
        <div className="text-pw-accent font-bold">Green Circuit → ADVANCED</div>
      </div>

      {/* Keyboard shortcuts */}
      <div className="mt-3 text-[9px] text-pw-text-faint leading-[1.5]">
        1-4: prod | 5-8: defense<br />
        R: rotate | Esc: deselect<br />
        Space: pause | Del: remove
      </div>
    </div>
  );
}

function BuildingTile({
  shortcut,
  glyph,
  name,
  type,
  selected,
  onClick,
}: {
  shortcut: string;
  glyph: string;
  name: string;
  type: string;
  selected: boolean;
  onClick: () => void;
}) {
  const glyphColor = BUILDING_COLORS[type] ?? "#aaa";

  return (
    <button
      onClick={onClick}
      className="px-1 py-1.5 text-center rounded-[3px] text-[10px] text-[#aaa] cursor-pointer font-mono transition-[border-color] duration-100"
      style={{
        background: selected ? "#0a1f3d" : "#001433",
        border: selected ? "1px solid #57c7ff" : "1px solid #0a3d7a",
      }}
      onMouseEnter={(e) => {
        if (!selected)
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a3a4a";
      }}
      onMouseLeave={(e) => {
        if (!selected)
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#0a3d7a";
      }}
    >
      <span
        className="text-sm font-bold block mb-0.5 font-mono"
        style={{ color: glyphColor }}
      >
        {glyph}
      </span>
      <span className="text-pw-text-dim text-[9px] block">[{shortcut}]</span>
      <span className="text-[#aaa] text-[10px]">{name}</span>
    </button>
  );
}
