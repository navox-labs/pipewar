"use client";
import { useState, useEffect } from "react";

const FONT = "Menlo, Monaco, 'Courier New', monospace";
const STORAGE_KEY = "pipewar_tutorial_complete";

interface TutorialStep {
  title: string;
  body: string;
  highlight: "ore" | "adjacent" | "belt" | "defense" | "goal";
}

const STEPS: TutorialStep[] = [
  {
    title: "Step 1 of 5 — Mine Resources",
    body: "Click an ore deposit on the grid to place a Miner. Iron ore and Copper ore are scattered across the map.",
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
    body: "Place Rate Limiters, WAFs, Auth Middleware, and Circuit Breakers on the right side of the grid. Waves trigger once production reaches 10 items/min.",
    highlight: "defense",
  },
  {
    title: "Step 5 of 5 — Win Condition",
    body: "Produce 20 Advanced Circuits while maintaining 99.9% uptime. Circuit chain: Ore → Smelter → Plates → Assembler → Circuits.",
    highlight: "goal",
  },
];

function Arrow({ direction }: { direction: "left" | "right" | "down" | "up" }) {
  const arrows: Record<string, string> = {
    left: "←",
    right: "→",
    down: "↓",
    up: "↑",
  };
  return (
    <span
      style={{
        fontSize: 24,
        color: "#5af78e",
        display: "inline-block",
        animation: "pulse-arrow 1s ease-in-out infinite",
      }}
    >
      {arrows[direction]}
    </span>
  );
}

function StepAnnotation({ highlight }: { highlight: TutorialStep["highlight"] }) {
  const annotationStyle = (borderColor: string, color: string) => ({
    padding: "6px 12px",
    border: `2px solid ${borderColor}`,
    color,
    fontSize: 12,
    fontFamily: FONT,
    animation: "pulse-border 1.2s ease-in-out infinite",
  });

  if (highlight === "ore") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
        <Arrow direction="right" />
        <div style={annotationStyle("#c87533", "#c87533")}>
          ░ Ore Deposits — scattered on the grid
        </div>
      </div>
    );
  }
  if (highlight === "adjacent") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
        <Arrow direction="right" />
        <div style={annotationStyle("#57c7ff", "#57c7ff")}>
          [M] → [S] &nbsp; Miner adjacent to Smelter
        </div>
      </div>
    );
  }
  if (highlight === "belt") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
        <Arrow direction="right" />
        <div style={annotationStyle("#4a5568", "#888")}>
          [M] ──→ [S] &nbsp; Belt connects them
        </div>
      </div>
    );
  }
  if (highlight === "defense") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
        <Arrow direction="right" />
        <div style={annotationStyle("#5af78e", "#5af78e")}>
          [T] [W] [@] [◆] &nbsp; Right side of grid
        </div>
      </div>
    );
  }
  if (highlight === "goal") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
        <Arrow direction="right" />
        <div style={annotationStyle("#5af78e", "#5af78e")}>
          20 ◆ Advanced Circuits @ 99.9% uptime
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

      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 8, 20, 0.78)",
          zIndex: 800,
          pointerEvents: "none",
        }}
      />

      {/* Tutorial card */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 900,
          width: 500,
          background: "#001a3d",
          border: "1px solid #1a2a3a",
          padding: "28px 32px",
          fontFamily: FONT,
          boxShadow: "0 0 40px rgba(90, 247, 142, 0.08)",
          borderRadius: 4,
        }}
      >
        {/* Step dots */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: i === step ? "#5af78e" : "#0a3d7a",
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 11,
            color: "#5af78e",
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginBottom: 10,
          }}
        >
          {current.title}
        </div>

        {/* Body */}
        <div
          style={{
            fontSize: 13,
            color: "#c0c0c0",
            lineHeight: 1.65,
            marginBottom: 6,
          }}
        >
          {current.body}
        </div>

        {/* Annotation */}
        <StepAnnotation highlight={current.highlight} />

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 24,
          }}
        >
          <button
            onClick={dismiss}
            style={{
              background: "transparent",
              border: "none",
              color: "#7090b0",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: FONT,
              padding: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#888";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#555";
            }}
          >
            SKIP TUTORIAL
          </button>

          <button
            onClick={next}
            style={{
              background: "transparent",
              border: "1px solid #5af78e",
              color: "#5af78e",
              fontSize: 12,
              fontWeight: "bold",
              cursor: "pointer",
              fontFamily: FONT,
              padding: "8px 24px",
              borderRadius: 3,
              letterSpacing: "0.05em",
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.background = "rgba(90,247,142,0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            {isLast ? "START PLAYING" : "NEXT →"}
          </button>
        </div>
      </div>
    </>
  );
}
