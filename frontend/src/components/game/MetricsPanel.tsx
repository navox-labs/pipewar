"use client";
import { useGameStore } from "@/stores/gameStore";
import { BUILDING_COLORS, BUILDING_GLYPHS } from "@/lib/constants";

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
    <div className="text-pw-text-dim text-[10px] uppercase tracking-[1px] mb-1.5 font-mono">
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
    <div className="w-[200px] bg-pw-bg border-l border-pw-panel-border p-3 flex flex-col gap-3.5 shrink-0 overflow-y-auto font-mono text-[11px]">
      {/* THROUGHPUT */}
      <div>
        <SectionTitle>Throughput</SectionTitle>
        {sortedMachines.length === 0 ? (
          <div className="text-pw-text-faint text-[11px]">No machines placed</div>
        ) : (
          sortedMachines.slice(0, 6).map((m) => (
            <div
              key={m.pos.join(",")}
              className="flex justify-between mb-[3px] text-[11px]"
            >
              <span
                className="font-mono"
                style={{ color: m.is_bottleneck ? "#f59e0b" : "#5af78e" }}
              >
                {m.pos[0]},{m.pos[1]}
                {m.is_bottleneck ? " !" : ""}
              </span>
              <span className="text-pw-text-dim font-mono">
                {m.items_per_min.toFixed(0)}/min
              </span>
            </div>
          ))
        )}
      </div>

      {/* WAVES */}
      <div>
        <SectionTitle>Waves</SectionTitle>
        <div className="text-xs">
          <span className="text-pw-text font-bold">
            Wave {waveNumber || "—"}
          </span>
        </div>
        {waveActive ? (
          <>
            <div className="text-pw-attacker font-bold text-[11px] mt-0.5">
              {waveAttackerCount} attackers
            </div>
            <div className="mt-1">
              {waveAttackTypes.map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-1 text-[11px] mb-0.5"
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: attackerColor(t) }}
                  />
                  <span className="text-pw-text-dim">{t.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-[11px] text-pw-accent mt-0.5">
            {waveNumber === 0 ? "Awaiting traffic..." : "CLEAR"}
          </div>
        )}
      </div>

      {/* DEFENSES */}
      <div>
        <SectionTitle>Defenses</SectionTitle>
        {Object.keys(defenseGroups).length === 0 ? (
          <div className="text-pw-text-faint text-[11px]">No defenses placed</div>
        ) : (
          Object.entries(defenseGroups).map(([type, count]) => {
            const color = BUILDING_COLORS[type] ?? "#888";
            const glyph = BUILDING_GLYPHS[type] ?? "?";
            return (
              <div key={type} className="text-[11px] mb-0.5" style={{ color }}>
                {glyph} {type.replace(/_/g, " ")} ×{count}
              </div>
            );
          })
        )}
      </div>

      {/* EVENT LOG */}
      <div className="flex-1 overflow-hidden">
        <SectionTitle>Log</SectionTitle>
        {events.length === 0 ? (
          <div className="text-pw-text-faint text-[10px]">No events yet</div>
        ) : (
          events.slice(-8).map((ev, i) => (
            <div
              key={i}
              className="mb-0.5 text-[10px] leading-[1.4]"
            >
              <span className="text-pw-text-faint">{ev.timestamp} </span>
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
