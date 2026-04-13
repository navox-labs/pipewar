"use client";
import { useGameStore } from "@/stores/gameStore";
import { BUILDING_PANEL } from "@/lib/constants";
import type { BuildingType } from "@/lib/types";

export function BuildPanel() {
  const { selectedBuilding, selectBuilding } = useGameStore();

  const production = BUILDING_PANEL.filter((b) => b.category === "production");
  const defense = BUILDING_PANEL.filter((b) => b.category === "defense");

  return (
    <div
      style={{
        width: 220,
        background: "#001a3d",
        borderRight: "1px solid #0a3d7a",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        flexShrink: 0,
        overflowY: "auto",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          borderBottom: "1px solid #0a3d7a",
          paddingBottom: 8,
        }}
      >
        BUILD
      </div>

      {/* Production section */}
      <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase" }}>
        PRODUCTION
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {production.map((b) => (
          <BuildingCard
            key={b.type}
            shortcut={b.key}
            glyph={b.glyph}
            name={b.name}
            type={b.type}
            selected={selectedBuilding === b.type}
            category="production"
            onClick={() => selectBuilding(selectedBuilding === b.type ? null : b.type as BuildingType)}
          />
        ))}
      </div>

      {/* Defense section */}
      <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", marginTop: 8 }}>
        DEFENSE
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {defense.map((b) => (
          <BuildingCard
            key={b.type}
            shortcut={b.key}
            glyph={b.glyph}
            name={b.name}
            type={b.type}
            selected={selectedBuilding === b.type}
            category="defense"
            onClick={() => selectBuilding(selectedBuilding === b.type ? null : b.type as BuildingType)}
          />
        ))}
      </div>

      {/* Production chain legend */}
      <div
        style={{
          marginTop: "auto",
          fontSize: 11,
          color: "#6b7280",
          borderTop: "1px solid #0a3d7a",
          paddingTop: 8,
          lineHeight: 1.6,
        }}
      >
        <div style={{ color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          CHAIN
        </div>
        <div>Iron Ore &rarr; Smelter</div>
        <div>&rarr; Iron Plate</div>
        <div>Copper Ore &rarr; Smelter</div>
        <div>&rarr; Copper Plate</div>
        <div>Copper Plate &rarr; Assembler</div>
        <div>&rarr; Copper Wire (x2)</div>
        <div>Iron Plate + Wire(x3)</div>
        <div>&rarr; Green Circuit</div>
        <div>Green Circuit (x2)</div>
        <div style={{ color: "#34d399" }}>&rarr; ADVANCED CIRCUIT</div>
      </div>

      {/* Keyboard shortcuts */}
      <div
        style={{
          fontSize: 10,
          color: "#374151",
          borderTop: "1px solid #0a3d7a",
          paddingTop: 8,
          lineHeight: 1.7,
        }}
      >
        <div>1-4: production | 5-8: defense</div>
        <div>R: rotate | Esc: deselect</div>
        <div>Space: pause | Del: remove</div>
      </div>
    </div>
  );
}

function BuildingCard({
  shortcut,
  glyph,
  name,
  type,
  selected,
  category,
  onClick,
}: {
  shortcut: string;
  glyph: string;
  name: string;
  type: string;
  selected: boolean;
  category: "production" | "defense";
  onClick: () => void;
}) {
  const borderColor = category === "production" ? "#38bdf8" : "#1d4ed8";
  const glyphColor = category === "production" ? "#7dd3fc" : "#60a5fa";

  return (
    <button
      onClick={onClick}
      style={{
        height: 48,
        background: selected ? "rgba(10,31,61,0.8)" : "transparent",
        border: selected ? `1px solid ${borderColor}` : "1px solid transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 8px",
        fontFamily: "'JetBrains Mono', monospace",
        transition: "none",
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLButtonElement).style.background = "#0a1f3d";
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <span style={{ fontSize: 18, color: glyphColor, width: 24, textAlign: "center" }}>
        {glyph}
      </span>
      <div>
        <div style={{ fontSize: 10, color: "#6b7280" }}>[{shortcut}]</div>
        <div style={{ fontSize: 11, color: "#e0e0e0" }}>{name}</div>
      </div>
    </button>
  );
}
