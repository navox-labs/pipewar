"use client";
import { useEffect, useState, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";

const FONT = "Menlo, Monaco, 'Courier New', monospace";

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
      style={{
        position: "absolute",
        top: 48,
        left: 160,   // clear the build panel
        right: 200,  // clear the metrics panel
        padding: "6px 16px",
        background: "rgba(11, 22, 34, 0.92)",
        borderBottom: "1px solid #ff4757",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        zIndex: 100,
        opacity: fading ? 0 : 1,
        transition: fading ? "opacity 0.5s" : "none",
        fontFamily: FONT,
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#ff4757",
        }}
      />
      <span style={{ fontSize: 12, fontWeight: "bold", color: "#ff4757", letterSpacing: "0.5px" }}>
        WAVE {waveNumber} INCOMING
      </span>
      <span style={{ fontSize: 11, color: "#a0b0c0" }}>
        {waveAttackTypes.map((t) => t.replace(/_/g, " ")).join(", ")}
      </span>
    </div>
  );
}
