"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socketClient";
import { gameRoomKey, type GameType } from "@/lib/games/shared";
import type { TileRushSession } from "@/lib/games/tileRush";
import type { TicTacToeSession } from "@/lib/games/tictactoe";
import type { GarticSession, MyTurn } from "@/lib/games/gartic";
import TileRushGame from "./games/TileRushGame";
import TicTacToeGame from "./games/TicTacToeGame";
import GarticGame from "./games/GarticGame";

type AnySession = TileRushSession | TicTacToeSession | GarticSession;
type GarticTurnPayload = { key: string; round: number; totalRounds: number } & MyTurn;

export default function GamePanel({
  mode,
  targetId,
  currentUserId,
}: {
  mode: "dm" | "group";
  targetId: string;
  currentUserId: string;
}) {
  const [session, setSession] = useState<AnySession | null>(null);
  const [garticTurn, setGarticTurn] = useState<GarticTurnPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const expectedKey = gameRoomKey(currentUserId, mode, targetId);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("game:sync", { mode, targetId });

    function onState(payload: { key: string; session: AnySession | null }) {
      if (payload.key !== expectedKey) return;
      setSession(payload.session);
      setError(null);
      if (!payload.session || payload.session.type !== "gartic" || payload.session.status !== "active") {
        setGarticTurn(null);
      }
    }
    function onGarticTurn(payload: GarticTurnPayload) {
      if (payload.key !== expectedKey) return;
      setGarticTurn(payload);
    }
    function onError(payload: { message: string }) {
      setError(payload.message);
    }

    socket.on("game:state", onState);
    socket.on("game:garticTurn", onGarticTurn);
    socket.on("game:error", onError);
    return () => {
      socket.off("game:state", onState);
      socket.off("game:garticTurn", onGarticTurn);
      socket.off("game:error", onError);
    };
  }, [expectedKey, mode, targetId]);

  function startGame(type: GameType) {
    getSocket().emit("game:start", { mode, targetId, type });
  }

  if (!session) {
    return (
      <div className="flex flex-col gap-2 border-b border-stone-200 px-5 py-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-stone-500">No game running.</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary text-xs" onClick={() => startGame("tilerush")}>
            🍎 Tile Rush
          </button>
          <button className="btn-secondary text-xs" onClick={() => startGame("tictactoe")}>
            ❌⭕ Tic-Tac-Toe
          </button>
          {mode === "group" && (
            <button className="btn-secondary text-xs" onClick={() => startGame("gartic")}>
              📞 Gartic Phone
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-stone-200 bg-stone-50 px-5 py-3">
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      {session.type === "tilerush" && (
        <TileRushGame mode={mode} targetId={targetId} currentUserId={currentUserId} session={session} />
      )}
      {session.type === "tictactoe" && (
        <TicTacToeGame mode={mode} targetId={targetId} currentUserId={currentUserId} session={session} />
      )}
      {session.type === "gartic" && (
        <GarticGame mode={mode} targetId={targetId} currentUserId={currentUserId} session={session} turn={garticTurn} />
      )}
    </div>
  );
}
