"use client";
import { useGameStore } from "@/stores/gameStore";

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

  const maxRate = Math.max(...machines.map((m) => m.items_per_min), 1);

  const defenses = Object.entries({
    ...grid.defenses,
  }).map(([key, b]) => ({
    key,
    type: b.type,
    health: b.health,
    active: b.health > 0,
  }));

  return (
    <div
      style={{
        width: 200,
        background: "#001a3d",
        borderLeft: "1px solid #0a3d7a",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        flexShrink: 0,
        overflowY: "auto",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* THROUGHPUT */}
      <section>
        <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid #0a3d7a", paddingBottom: 3, marginBottom: 6 }}>
          THROUGHPUT
        </div>
        {sortedMachines.length === 0 && (
          <div style={{ color: "#374151", fontSize: 11 }}>No machines placed</div>
        )}
        {sortedMachines.map((m) => (
          <div key={m.pos.join(",")} style={{ marginBottom: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ color: m.is_bottleneck ? "#f59e0b" : "#7dd3fc" }}>
                {m.pos[0]},{m.pos[1]}
                {m.is_bottleneck ? " ⚠" : ""}
              </span>
              <span style={{ color: "#e0e0e0" }}>{m.items_per_min.toFixed(0)}/min</span>
            </div>
            <div style={{ height: 3, background: "#0a3d7a", marginTop: 2 }}>
              <div
                style={{
                  height: 3,
                  width: `${(m.items_per_min / maxRate) * 100}%`,
                  background: m.is_bottleneck ? "#f59e0b" : "#38bdf8",
                  transition: "none",
                }}
              />
            </div>
          </div>
        ))}
      </section>

      {/* WAVES */}
      <section>
        <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid #0a3d7a", paddingBottom: 3, marginBottom: 6 }}>
          WAVES
        </div>
        <div style={{ fontSize: 12, color: "#e0e0e0" }}>
          Wave {waveNumber || "—"}
        </div>
        {waveActive ? (
          <>
            <div style={{ fontSize: 11, color: "#f59e0b" }}>{waveAttackerCount} attackers</div>
            <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>
              {waveAttackTypes.map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f43f5e", display: "inline-block" }} />
                  {t.replace(/_/g, " ")}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 11, color: "#34d399" }}>
            {waveNumber === 0 ? "Awaiting traffic..." : "CLEAR"}
          </div>
        )}
      </section>

      {/* DEFENSES */}
      <section>
        <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid #0a3d7a", paddingBottom: 3, marginBottom: 6 }}>
          DEFENSES
        </div>
        {defenses.length === 0 && (
          <div style={{ color: "#374151", fontSize: 11 }}>No defenses placed</div>
        )}
        {defenses.map(({ key, type, active }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
            <span
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: active ? "#34d399" : "#2a1a1a",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, color: "#e0e0e0" }}>
              {type.replace(/_/g, " ")}
            </span>
            <span style={{ fontSize: 10, color: "#6b7280", marginLeft: "auto" }}>
              {key}
            </span>
          </div>
        ))}
      </section>

      {/* EVENT LOG */}
      <section style={{ marginTop: "auto" }}>
        <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid #0a3d7a", paddingBottom: 3, marginBottom: 6 }}>
          LOG
        </div>
        {events.length === 0 && (
          <div style={{ color: "#374151", fontSize: 11 }}>No events yet</div>
        )}
        {events.map((ev, i) => (
          <div key={i} style={{ marginBottom: 3, fontSize: 10 }}>
            <span style={{ color: "#374151" }}>{ev.timestamp} </span>
            <span style={{ color: eventColor(ev.eventType) }}>{ev.message}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

function eventColor(type: string): string {
  switch (type) {
    case "attack": return "#f43f5e";
    case "warning": return "#f87171";
    case "success": return "#34d399";
    default: return "#0a3d7a";
  }
}
