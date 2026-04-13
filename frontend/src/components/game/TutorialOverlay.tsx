"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "pipewar_tutorial_complete";

interface TutorialStep {
  title: string;
  body: string;
  highlight: "ore" | "adjacent" | "belt" | "defense" | "goal";
}

const STEPS: TutorialStep[] = [
  {
    title: "Step 1 of 5 — Mine Resources",
    body: "Click an ore deposit on the grid to place a Miner. Iron ore (brown) and Copper ore (orange) are scattered across the map.",
    highlight: "ore",
  },
  {
    title: "Step 2 of 5 — Smelt Plates",
    body: "Place a Smelter next to your Miner. It converts raw ore into usable plates — iron plates and copper plates.",
    highlight: "adjacent",
  },
  {
    title: "Step 3 of 5 — Connect with Belts",
    body: "Place Belts between buildings to move items. Press R to rotate belt direction. Belts carry items automatically once placed.",
    highlight: "belt",
  },
  {
    title: "Step 4 of 5 — Build Defenses",
    body: "Place Rate Limiters, WAFs, Auth Middleware, and Circuit Breakers on the right side of the grid. Waves of attackers trigger once production reaches 10 items/min.",
    highlight: "defense",
  },
  {
    title: "Step 5 of 5 — Win Condition",
    body: "Produce 20 Advanced Circuits while maintaining 99.9% uptime. Circuit chain: Ore \u2192 Smelter \u2192 Plates \u2192 Assembler \u2192 Circuits.",
    highlight: "goal",
  },
];

// Arrow component — points toward a region of the canvas
function Arrow({ direction }: { direction: "left" | "right" | "down" | "up" }) {
  const arrows: Record<string, string> = {
    left: "\u2190",
    right: "\u2192",
    down: "\u2193",
    up: "\u2191",
  };
  return (
    <span
      style={{
        fontSize: 32,
        color: "#38bdf8",
        display: "inline-block",
        animation: "pulse-arrow 1s ease-in-out infinite",
      }}
    >
      {arrows[direction]}
    </span>
  );
}

// What region to visually annotate per step
function StepAnnotation({ highlight }: { highlight: TutorialStep["highlight"] }) {
  if (highlight === "ore") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
        <Arrow direction="right" />
        <div
          style={{
            padding: "6px 12px",
            border: "2px solid #854d0e",
            color: "#b45309",
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            animation: "pulse-border 1.2s ease-in-out infinite",
          }}
        >
          ░ Ore Deposits — scattered on the grid
        </div>
      </div>
    );
  }
  if (highlight === "adjacent") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
        <Arrow direction="right" />
        <div
          style={{
            padding: "6px 12px",
            border: "2px solid #38bdf8",
            color: "#7dd3fc",
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            animation: "pulse-border 1.2s ease-in-out infinite",
          }}
        >
          [M] &#x2192; [S] &nbsp; Miner adjacent to Smelter
        </div>
      </div>
    );
  }
  if (highlight === "belt") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
        <Arrow direction="right" />
        <div
          style={{
            padding: "6px 12px",
            border: "2px solid #1e4080",
            color: "#60a5fa",
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            animation: "pulse-border 1.2s ease-in-out infinite",
          }}
        >
          [M] &#x2500;&#x2500;&#x2192; [S] &nbsp; Belt connects them
        </div>
      </div>
    );
  }
  if (highlight === "defense") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
        <Arrow direction="right" />
        <div
          style={{
            padding: "6px 12px",
            border: "2px solid #1d4ed8",
            color: "#60a5fa",
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            animation: "pulse-border 1.2s ease-in-out infinite",
          }}
        >
          [T] [W] [@] [&#x25C6;] &nbsp; Right side of grid
        </div>
      </div>
    );
  }
  if (highlight === "goal") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
        <Arrow direction="right" />
        <div
          style={{
            padding: "6px 12px",
            border: "2px solid #34d399",
            color: "#34d399",
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            animation: "pulse-border 1.2s ease-in-out infinite",
          }}
        >
          20 &#x25C6; Advanced Circuits @ 99.9% uptime
        </div>
      </div>
    );
  }
  return null;
}

export function TutorialOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      {/* Keyframe styles injected once */}
      <style>{`
        @keyframes pulse-border {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes pulse-arrow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(6px); }
        }
      `}</style>

      {/* Semi-transparent dark backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 10, 28, 0.72)",
          zIndex: 800,
          pointerEvents: "none",
        }}
      />

      {/* Tutorial popover — centered, above backdrop */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 900,
          width: 520,
          background: "#001a3d",
          border: "2px solid #0a3d7a",
          padding: "32px 36px",
          fontFamily: "'JetBrains Mono', monospace",
          boxShadow: "0 0 40px rgba(56, 189, 248, 0.15)",
        }}
      >
        {/* Step indicator dots */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: i === step ? "#38bdf8" : "#0a3d7a",
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>

        {/* Step title */}
        <div
          style={{
            fontSize: 13,
            color: "#38bdf8",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 12,
          }}
        >
          {current.title}
        </div>

        {/* Body text */}
        <div
          style={{
            fontSize: 19,
            color: "#e0e0e0",
            lineHeight: 1.6,
            marginBottom: 8,
          }}
        >
          {current.body}
        </div>

        {/* Visual annotation */}
        <StepAnnotation highlight={current.highlight} />

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 28,
          }}
        >
          <button
            onClick={dismiss}
            style={{
              background: "transparent",
              border: "none",
              color: "#374151",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#374151";
            }}
          >
            SKIP TUTORIAL
          </button>

          <button
            onClick={next}
            style={{
              background: "#1d4ed8",
              border: "1px solid #38bdf8",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              padding: "10px 28px",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#38bdf8";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#1d4ed8";
            }}
          >
            {isLast ? "START PLAYING" : "NEXT \u2192"}
          </button>
        </div>
      </div>
    </>
  );
}
