"use client";
import { useGameStore } from "@/stores/gameStore";
import { BUILDING_COLORS, BUILDING_GLYPHS } from "@/lib/constants";

const FONT = "Menlo, Monaco, 'Courier New', monospace";

// Attacker type colors matching scene3
const ATTACKER_COLORS: Record<string, string> = {
  ddos_bot: "#ff4757",
  sql_inject: "#ff9500",
  cred_stuffer: "#ff6ac1",
};

function attackerColor(type: string): string {
  return ATTACKER_COLORS[type] ?? "#ff4757";
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: "#a0b0c0",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "1px",
        marginBottom: 6,
        fontFamily: FONT,
      }}
    >
      {children}
    </div>
  );
}

export function MetricsPanel() {
  const {
    machines, totalTraffic, waveActive, waveNumber, waveAttackTypes,
    waveAttackerCount, grid, events,
  } = useGameStore();

  const sortedMachines = [...machines].sort((a, b) => {
    if (a.is_bottleneck && !b.is_bottleneck) return -1;
    if (!a.is_bottleneck && b.is_bottleneck) return 1;
    return b.items_per_min - a.items_per_min;
  });

  const defenses = Object.entries(grid.defenses).map(([key, b]) => ({
    key,
    type: b.type,
    health: b.health,
    active: b.health > 0,
  }));

  // Group defenses by type for compact display
  const defenseGroups: Record<string, number> = {};
  defenses.forEach(({ type }) => {
    defenseGroups[type] = (defenseGroups[type] ?? 0) + 1;
  });

  return (
    <div
      style={{
        width: 200,
        background: "#00214d",
        borderLeft: "1px solid #0a3d7a",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        flexShrink: 0,
        overflowY: "auto",
        fontFamily: FONT,
        fontSize: 11,
      }}
    >
      {/* THROUGHPUT */}
      <div>
        <SectionTitle>Throughput</SectionTitle>
        {sortedMachines.length === 0 ? (
          <div style={{ color: "#7090b0", fontSize: 11 }}>No machines placed</div>
        ) : (
          sortedMachines.slice(0, 6).map((m) => (
            <div
              key={m.pos.join(",")}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 3,
                fontSize: 11,
              }}
            >
              <span
                style={{
                  color: m.is_bottleneck ? "#f59e0b" : "#5af78e",
                  fontFamily: FONT,
                }}
              >
                {m.pos[0]},{m.pos[1]}
                {m.is_bottleneck ? " !" : ""}
              </span>
              <span style={{ color: "#a0b0c0", fontFamily: FONT }}>
                {m.items_per_min.toFixed(0)}/min
              </span>
            </div>
          ))
        )}
      </div>

      {/* WAVES */}
      <div>
        <SectionTitle>Waves</SectionTitle>
        <div style={{ fontSize: 12 }}>
          <span style={{ color: "#e0e0e0", fontWeight: "bold" }}>
            Wave {waveNumber || "—"}
          </span>
        </div>
        {waveActive ? (
          <>
            <div style={{ color: "#ff4757", fontWeight: "bold", fontSize: 11, marginTop: 2 }}>
              {waveAttackerCount} attackers
            </div>
            <div style={{ marginTop: 4 }}>
              {waveAttackTypes.map((t) => (
                <div
                  key={t}
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, marginBottom: 2 }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: attackerColor(t),
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: "#a0b0c0" }}>{t.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 11, color: "#5af78e", marginTop: 2 }}>
            {waveNumber === 0 ? "Awaiting traffic..." : "CLEAR"}
          </div>
        )}
      </div>

      {/* DEFENSES */}
      <div>
        <SectionTitle>Defenses</SectionTitle>
        {Object.keys(defenseGroups).length === 0 ? (
          <div style={{ color: "#7090b0", fontSize: 11 }}>No defenses placed</div>
        ) : (
          Object.entries(defenseGroups).map(([type, count]) => {
            const color = BUILDING_COLORS[type] ?? "#888";
            const glyph = BUILDING_GLYPHS[type] ?? "?";
            return (
              <div key={type} style={{ fontSize: 11, color, marginBottom: 2 }}>
                {glyph} {type.replace(/_/g, " ")} ×{count}
              </div>
            );
          })
        )}
      </div>

      {/* EVENT LOG */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <SectionTitle>Log</SectionTitle>
        {events.length === 0 ? (
          <div style={{ color: "#7090b0", fontSize: 10 }}>No events yet</div>
        ) : (
          events.slice(-8).map((ev, i) => (
            <div
              key={i}
              style={{ marginBottom: 2, fontSize: 10, lineHeight: 1.4 }}
            >
              <span style={{ color: "#7090b0" }}>{ev.timestamp} </span>
              <span style={{ color: eventColor(ev.eventType) }}>{ev.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function eventColor(type: string): string {
  switch (type) {
    case "attack": return "#ff4757";
    case "warning": return "#f59e0b";
    case "success": return "#5af78e";
    case "info": return "#f3f99d";
    default: return "#888";
  }
}
