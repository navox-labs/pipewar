"use client";
import { useGameStore } from "@/stores/gameStore";

const FONT = "Menlo, Monaco, 'Courier New', monospace";

interface Props {
  onPause: () => void;
}

function uptimeColor(pct: number): string {
  if (pct >= 99.9) return "#5af78e";
  if (pct >= 97) return "#e0e0e0";
  if (pct >= 95) return "#f59e0b";
  return "#ff4757";
}

export function HUD({ onPause }: Props) {
  const {
    uptimePct, advancedCircuits, currentWave, waveActive,
    waveAttackTypes, waveAttackerCount, paused, totalTraffic, connected,
  } = useGameStore();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 16px",
        background: "#00214d",
        borderBottom: "1px solid #0a3d7a",
        flexShrink: 0,
        fontFamily: FONT,
      }}
    >
      {/* Left: production status */}
      <div>
        <div style={{ fontSize: 10, color: "#a0b0c0", textTransform: "uppercase", letterSpacing: "1px" }}>
          Production
        </div>
        <div style={{ fontSize: 12, color: "#c0c0c0" }}>
          Traffic: <span style={{ color: "#5af78e" }}>{totalTraffic.toFixed(1)}</span> items/min
        </div>
      </div>

      {/* Center: uptime (large) */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: "bold", color: uptimeColor(uptimePct), lineHeight: 1.2 }}>
          {uptimePct.toFixed(2)}%
        </div>
        <div style={{ fontSize: 11, color: "#a0b0c0" }}>
          UPTIME &middot; {advancedCircuits}/20 CIRCUITS
        </div>
      </div>

      {/* Right: wave info */}
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 14, fontWeight: "bold", color: "#e0e0e0" }}>
          WAVE {currentWave}
          {waveActive && (
            <span style={{ fontSize: 11, fontWeight: "normal", color: "#a0b0c0" }}>
              {" "}— {waveAttackerCount} attackers
            </span>
          )}
        </div>
        {waveActive ? (
          <div style={{ fontSize: 11, color: "#a0b0c0" }}>
            {waveAttackTypes.map((t) => t.replace(/_/g, " ")).join(", ")}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "#5af78e" }}>
            {currentWave === 0 ? "Build to trigger wave" : "CLEAR"}
          </div>
        )}
      </div>

      {/* Connection indicator + pause */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 10, color: connected ? "#5af78e" : "#ff4757" }}>
          {connected ? "●" : "○"}
        </span>
        <button
          onClick={onPause}
          style={{
            display: "inline-block",
            padding: "2px 10px",
            border: "1px solid #5af78e",
            color: "#5af78e",
            fontSize: 11,
            borderRadius: 3,
            background: "transparent",
            cursor: "pointer",
            fontFamily: FONT,
          }}
        >
          {paused ? "RESUME" : "PAUSE"}
        </button>
      </div>
    </div>
  );
}
