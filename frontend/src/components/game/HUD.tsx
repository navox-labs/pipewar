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
        height: 56,
        background: "#001a3d",
        borderBottom: "1px solid #0a3d7a",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        flexShrink: 0,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* Left: production status */}
      <div>
        <div style={{ fontSize: 14, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          PRODUCTION
        </div>
        <div style={{ color: "#7dd3fc", fontSize: 18 }}>
          Traffic: {totalTraffic.toFixed(1)} items/min
        </div>
      </div>

      {/* Center: uptime */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: uptimeColor(uptimePct), lineHeight: 1 }}>
          {uptimePct.toFixed(2)}%
        </div>
        <div style={{ fontSize: 14, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          UPTIME
        </div>
        <div style={{ fontSize: 18, color: "#34d399" }}>
          {advancedCircuits} / 20 CIRCUITS
        </div>
      </div>

      {/* Right: wave status */}
      <div style={{ textAlign: "right", minWidth: 180 }}>
        <div style={{ fontSize: 18, color: "#e0e0e0" }}>
          WAVE {currentWave} {waveActive ? `— ${waveAttackerCount} attackers` : ""}
        </div>
        {waveActive ? (
          <div style={{ fontSize: 14, color: "#6b7280" }}>
            {waveAttackTypes.join(", ")}
          </div>
        ) : (
          <div style={{ fontSize: 18, color: "#34d399" }}>
            {currentWave === 0 ? "Build to trigger wave" : "CLEAR"}
          </div>
        )}
        <div style={{ fontSize: 14, color: "#6b7280" }}>
          {connected ? "● CONNECTED" : "○ DISCONNECTED"}
        </div>
      </div>

      {/* Far right: pause */}
      <button
        onClick={onPause}
        style={{
          background: "transparent",
          border: "none",
          color: "#60a5fa",
          fontSize: 16,
          cursor: "pointer",
          fontFamily: "'JetBrains Mono', monospace",
          padding: "4px 8px",
        }}
      >
        {paused ? "RESUME" : "PAUSE"}
      </button>
    </div>
  );
}
