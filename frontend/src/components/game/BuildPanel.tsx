"use client";
import { useGameStore } from "@/stores/gameStore";
import { BUILDING_PANEL, BUILDING_COLORS } from "@/lib/constants";
import type { BuildingType } from "@/lib/types";

const FONT = "Menlo, Monaco, 'Courier New', monospace";

export function BuildPanel() {
  const { selectedBuilding, selectBuilding } = useGameStore();

  const production = BUILDING_PANEL.filter((b) => b.category === "production");
  const defense = BUILDING_PANEL.filter((b) => b.category === "defense");

  return (
    <div
      style={{
        width: 160,
        background: "#00214d",
        borderRight: "1px solid #0a3d7a",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflowX: "hidden",
        overflowY: "auto",
        fontFamily: FONT,
        fontSize: 11,
      }}
    >
      <div style={{ color: "#a0b0c0", fontSize: 10, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>
        Build
      </div>

      {/* Production section */}
      <div style={{ color: "#a0b0c0", fontSize: 10, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6, marginTop: 8 }}>
        Production
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
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
      <div style={{ color: "#a0b0c0", fontSize: 10, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6, marginTop: 12 }}>
        Defense
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
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
      <div style={{ marginTop: 16, fontSize: 10, lineHeight: 1.6 }}>
        <div style={{ color: "#a0b0c0", fontSize: 10, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>
          Chain
        </div>
        <div style={{ color: "#8aa0b8" }}>Iron Ore → Smelter → Iron Plate</div>
        <div style={{ color: "#8aa0b8" }}>Copper Ore → Smelter → Copper Plate</div>
        <div style={{ color: "#8aa0b8" }}>Copper Plate → Assembler → Wire</div>
        <div style={{ color: "#8aa0b8" }}>Iron Plate + Wire → Green Circuit</div>
        <div style={{ color: "#5af78e", fontWeight: "bold" }}>Green Circuit → ADVANCED</div>
      </div>

      {/* Keyboard shortcuts */}
      <div style={{ marginTop: 12, fontSize: 9, color: "#7090b0", lineHeight: 1.5 }}>
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
      style={{
        background: selected ? "#0a1f3d" : "#001433",
        border: selected ? `1px solid #57c7ff` : "1px solid #0a3d7a",
        padding: "6px 4px",
        textAlign: "center",
        borderRadius: 3,
        fontSize: 10,
        color: "#aaa",
        cursor: "pointer",
        fontFamily: FONT,
        transition: "border-color 0.1s",
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
        style={{
          fontSize: 14,
          fontWeight: "bold",
          display: "block",
          marginBottom: 2,
          color: glyphColor,
          fontFamily: FONT,
        }}
      >
        {glyph}
      </span>
      <span style={{ color: "#a0b0c0", fontSize: 9, display: "block" }}>[{shortcut}]</span>
      <span style={{ color: "#aaa", fontSize: 10 }}>{name}</span>
    </button>
  );
}
