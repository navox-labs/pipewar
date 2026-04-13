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
    // Show alert when a new wave starts
    if (waveActive && waveNumber !== prevWaveRef.current) {
      prevWaveRef.current = waveNumber;
      setFading(false);
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      // Fade after 3 seconds
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
        top: 56, // below HUD
        left: 0,
        right: 0,
        height: 40,
        background: "rgba(244,63,94,0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        opacity: fading ? 0 : 1,
        transition: fading ? "opacity 0.5s" : "none",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
        WAVE {waveNumber} INCOMING — {waveAttackTypes.map((t) => t.replace(/_/g, " ")).join(", ")}
      </span>
    </div>
  );
}
