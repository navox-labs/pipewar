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
      className="text-2xl text-pw-accent inline-block"
      style={{ animation: "pulse-arrow 1s ease-in-out infinite" }}
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
    fontFamily: "Menlo, Monaco, 'Courier New', monospace",
    animation: "pulse-border 1.2s ease-in-out infinite",
  });

  if (highlight === "ore") {
    return (
      <div className="flex items-center gap-3 mt-3.5">
        <Arrow direction="right" />
        <div style={annotationStyle("#c87533", "#c87533")}>
          ░ Ore Deposits — scattered on the grid
        </div>
      </div>
    );
  }
  if (highlight === "adjacent") {
    return (
      <div className="flex items-center gap-3 mt-3.5">
        <Arrow direction="right" />
        <div style={annotationStyle("#57c7ff", "#57c7ff")}>
          [M] → [S] &nbsp; Miner adjacent to Smelter
        </div>
      </div>
    );
  }
  if (highlight === "belt") {
    return (
      <div className="flex items-center gap-3 mt-3.5">
        <Arrow direction="right" />
        <div style={annotationStyle("#4a5568", "#888")}>
          [M] ──→ [S] &nbsp; Belt connects them
        </div>
      </div>
    );
  }
  if (highlight === "defense") {
    return (
      <div className="flex items-center gap-3 mt-3.5">
        <Arrow direction="right" />
        <div style={annotationStyle("#5af78e", "#5af78e")}>
          [T] [W] [@] [◆] &nbsp; Right side of grid
        </div>
      </div>
    );
  }
  if (highlight === "goal") {
    return (
      <div className="flex items-center gap-3 mt-3.5">
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
      <div className="fixed inset-0 bg-[rgba(0,8,20,0.78)] z-[800] pointer-events-none" />

      {/* Tutorial card */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[900] w-[500px] bg-pw-panel-bg border border-[#1a2a3a] px-8 py-7 font-mono shadow-[0_0_40px_rgba(90,247,142,0.08)] rounded-[4px]">
        {/* Step dots */}
        <div className="flex gap-1.5 mb-[18px]">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="w-[7px] h-[7px] rounded-full transition-[background] duration-200"
              style={{ background: i === step ? "#5af78e" : "#0a3d7a" }}
            />
          ))}
        </div>

        {/* Title */}
        <div className="text-[11px] text-pw-accent uppercase tracking-[1px] mb-2.5">
          {current.title}
        </div>

        {/* Body */}
        <div className="text-[13px] text-[#c0c0c0] leading-[1.65] mb-1.5">
          {current.body}
        </div>

        {/* Annotation */}
        <StepAnnotation highlight={current.highlight} />

        {/* Actions */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={dismiss}
            className="bg-transparent border-none text-pw-text-faint text-[11px] cursor-pointer font-mono p-0"
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
            className="bg-transparent border border-pw-accent text-pw-accent text-xs font-bold cursor-pointer font-mono px-6 py-2 rounded-[3px] tracking-[0.05em]"
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
