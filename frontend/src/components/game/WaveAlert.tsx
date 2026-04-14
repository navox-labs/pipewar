"use client";
import { useEffect, useState, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";

export function WaveAlert() {
  const { waveActive, waveNumber, waveAttackTypes } = useGameStore();
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const prevWaveRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (waveActive && waveNumber !== prevWaveRef.current) {
      prevWaveRef.current = waveNumber;
      setFading(false);
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setFading(true);
        timerRef.current = setTimeout(() => setVisible(false), 500);
      }, 3000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [waveActive, waveNumber]);

  if (!visible) return null;

  return (
    <div
      className="absolute top-12 left-40 right-[200px] px-4 py-1.5 bg-[rgba(11,22,34,0.92)] border-b border-pw-attacker flex items-center justify-center gap-3 z-[100] font-mono"
      style={{
        opacity: fading ? 0 : 1,
        transition: fading ? "opacity 0.5s" : "none",
      }}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-pw-attacker" />
      <span className="text-xs font-bold text-pw-attacker tracking-[0.5px]">
        WAVE {waveNumber} INCOMING
      </span>
      <span className="text-[11px] text-pw-text-dim">
        {waveAttackTypes.map((t) => t.replace(/_/g, " ")).join(", ")}
      </span>
    </div>
  );
}
