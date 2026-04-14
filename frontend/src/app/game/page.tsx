"use client";
import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/gameStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { GameCanvas } from "@/components/game/GameCanvas";
import { HUD } from "@/components/game/HUD";
import { BuildPanel } from "@/components/game/BuildPanel";
import { MetricsPanel } from "@/components/game/MetricsPanel";
import { WaveAlert } from "@/components/game/WaveAlert";
import { GameOverModal } from "@/components/game/GameOverModal";
import { TutorialOverlay } from "@/components/game/TutorialOverlay";
import { createSession, getCurrentGame, createGame } from "@/lib/api";
import { BUILDING_PANEL } from "@/lib/constants";
import type { BuildingType, Direction } from "@/lib/types";

const DIRECTIONS: Direction[] = ["north", "east", "south", "west"];

export default function GamePage() {
  const {
    gameId,
    setGameId,
    selectBuilding,
    selectedBuilding,
    selectedDirection,
    setDirection,
    setHoveredCell,
    hoveredCell,
  } = useGameStore();
  const router = useRouter();
  const { send } = useWebSocket(gameId);
  const [viewportOk, setViewportOk] = useState(true);

  // Viewport size check
  useEffect(() => {
    function check() {
      setViewportOk(window.innerWidth >= 1100 && window.innerHeight >= 640);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Bootstrap: ensure session + game on mount
  useEffect(() => {
    async function init() {
      try {
        await createSession();
        let game = await getCurrentGame();
        if (!game) {
          game = await createGame();
        }
        setGameId(game.game_id);
      } catch (e) {
        console.error("Game init failed:", e);
        router.push("/");
      }
    }
    if (!gameId) init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as Element).tagName === "INPUT") return;

      switch (e.key) {
        case "1": case "2": case "3": case "4":
        case "5": case "6": case "7": case "8": {
          const idx = parseInt(e.key) - 1;
          const b = BUILDING_PANEL[idx];
          if (b) selectBuilding(b.type as BuildingType);
          break;
        }
        case "Escape":
          selectBuilding(null);
          break;
        case "r":
        case "R": {
          const currentIdx = DIRECTIONS.indexOf(selectedDirection);
          setDirection(DIRECTIONS[(currentIdx + 1) % 4]);
          break;
        }
        case " ":
          e.preventDefault();
          send({ type: "toggle_pause" });
          break;
        case "Delete":
        case "Backspace":
          if (hoveredCell) {
            send({ type: "remove_building", x: hoveredCell.x, y: hoveredCell.y });
          }
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDirection, hoveredCell, selectBuilding, setDirection, send]);

  const handleCellClick = useCallback(
    (x: number, y: number, button: number) => {
      if (button === 2 || (button === 0 && !selectedBuilding)) {
        send({ type: "remove_building", x, y });
        return;
      }
      if (selectedBuilding) {
        send({
          type: "place_building",
          x,
          y,
          building_type: selectedBuilding,
          direction: selectedDirection,
        });
      }
    },
    [selectedBuilding, selectedDirection, send]
  );

  const handleCellHover = useCallback(
    (x: number, y: number) => {
      setHoveredCell({ x, y });
    },
    [setHoveredCell]
  );

  const handlePause = useCallback(() => {
    send({ type: "toggle_pause" });
  }, [send]);

  if (!viewportOk) {
    return (
      <div className="flex items-center justify-center h-screen bg-pw-bg text-[#c0c0c0] font-mono text-center p-8 text-xs">
        PIPEWAR requires a larger viewport. Minimum 1100×640.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-pw-bg relative overflow-hidden">
      <HUD onPause={handlePause} />
      <WaveAlert />
      <div className="flex flex-1 overflow-hidden">
        <BuildPanel />
        <div className="flex-1 flex items-center justify-center bg-pw-bg">
          {gameId ? (
            <GameCanvas onCellClick={handleCellClick} onCellHover={handleCellHover} />
          ) : (
            <div className="text-pw-connecting font-mono text-xs">
              CONNECTING...
            </div>
          )}
        </div>
        <MetricsPanel />
      </div>
      <GameOverModal />
      <TutorialOverlay />
    </div>
  );
}
