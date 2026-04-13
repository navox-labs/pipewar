"use client";
import { useGameStore } from "@/stores/gameStore";

interface Props {
  onPause: () => void;
}

function uptimeColor(pct: number): string {
  if (pct >= 99.9) return "#34d399";
  if (pct >= 97) return "#e0e0e0";
  if (pct >= 95) return "#f59e0b";
  return "#f43f5e";
}

export function HUD({ onPause }: Props) {
  const {
    uptimePct, advancedCircuits, currentWave, waveActive,
    waveAttackTypes, waveAttackerCount, paused, totalTraffic, connected,
  } = useGameStore();

  return (
    <div
      style={{
        height: 48,
        background: "#001a3d",
        borderBottom: "1px solid #0a3d7a",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        flexShrink: 0,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* Left: production status */}
      <div>
        <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          PRODUCTION
        </div>
        <div style={{ color: "#7dd3fc", fontSize: 12 }}>
          Traffic: {totalTraffic.toFixed(1)} items/min
        </div>
      </div>

      {/* Center: uptime */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: uptimeColor(uptimePct), lineHeight: 1.2 }}>
          {uptimePct.toFixed(2)}%
        </div>
        <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          UPTIME &middot; {advancedCircuits}/20 CIRCUITS
        </div>
      </div>

      {/* Right: wave status */}
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 12, color: "#e0e0e0" }}>
          WAVE {currentWave} {waveActive ? `— ${waveAttackerCount} attackers` : ""}
        </div>
        {waveActive ? (
          <div style={{ fontSize: 10, color: "#6b7280" }}>
            {waveAttackTypes.join(", ")}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "#34d399" }}>
            {currentWave === 0 ? "Build to trigger wave" : "CLEAR"}
          </div>
        )}
      </div>

      {/* Connection + Pause */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 10, color: connected ? "#34d399" : "#f43f5e" }}>
          {connected ? "●" : "○"}
        </span>
        <button
          onClick={onPause}
          style={{
            background: "transparent",
            border: "1px solid #0a3d7a",
            color: "#60a5fa",
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            padding: "2px 8px",
          }}
        >
          {paused ? "RESUME" : "PAUSE"}
        </button>
      </div>
    </div>
  );
}
