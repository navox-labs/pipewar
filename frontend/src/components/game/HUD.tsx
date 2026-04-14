"use client";
import { useGameStore } from "@/stores/gameStore";

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
    <div className="flex justify-between items-center px-4 py-2 bg-pw-bg border-b border-pw-panel-border shrink-0 font-mono">
      {/* Left: production status */}
      <div>
        <div className="text-[10px] text-pw-text-dim uppercase tracking-[1px]">
          Production
        </div>
        <div className="text-xs text-[#c0c0c0]">
          Traffic: <span className="text-pw-accent">{totalTraffic.toFixed(1)}</span> items/min
        </div>
      </div>

      {/* Center: uptime (large) */}
      <div className="text-center">
        <div className="text-[20px] font-bold leading-[1.2]" style={{ color: uptimeColor(uptimePct) }}>
          {uptimePct.toFixed(2)}%
        </div>
        <div className="text-[11px] text-pw-text-dim">
          UPTIME &middot; {advancedCircuits}/20 CIRCUITS
        </div>
      </div>

      {/* Right: wave info */}
      <div className="text-right">
        <div className="text-sm font-bold text-pw-text">
          WAVE {currentWave}
          {waveActive && (
            <span className="text-[11px] font-normal text-pw-text-dim">
              {" "}— {waveAttackerCount} attackers
            </span>
          )}
        </div>
        {waveActive ? (
          <div className="text-[11px] text-pw-text-dim">
            {waveAttackTypes.map((t) => t.replace(/_/g, " ")).join(", ")}
          </div>
        ) : (
          <div className="text-[11px] text-pw-accent">
            {currentWave === 0 ? "Build to trigger wave" : "CLEAR"}
          </div>
        )}
      </div>

      {/* Connection indicator + pause */}
      <div className="flex items-center gap-3">
        <span className="text-[10px]" style={{ color: connected ? "#5af78e" : "#ff4757" }}>
          {connected ? "●" : "○"}
        </span>
        <button
          onClick={onPause}
          className="inline-block px-[10px] py-[2px] border border-pw-accent text-pw-accent text-[11px] rounded-[3px] bg-transparent cursor-pointer font-mono"
        >
          {paused ? "RESUME" : "PAUSE"}
        </button>
      </div>
    </div>
  );
}
