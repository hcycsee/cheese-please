"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socketClient";
import type { TileRushSession } from "@/lib/games/tileRush";

export default function TileRushGame({
  mode,
  targetId,
  currentUserId,
  session,
}: {
  mode: "dm" | "group";
  targetId: string;
  currentUserId: string;
  session: TileRushSession;
}) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (session.status !== "active" || !session.endsAt) {
      setSecondsLeft(null);
      return;
    }
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((session.endsAt! - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [session]);

  function start() {
    getSocket().emit("game:start", { mode, targetId, type: "tilerush" });
  }
  function join() {
    getSocket().emit("game:join", { mode, targetId });
  }
  function begin() {
    getSocket().emit("game:begin", { mode, targetId });
  }
  function tile(index: number) {
    getSocket().emit("game:tile", { mode, targetId, index });
  }

  const iJoined = !!session.players[currentUserId];
  const playerNames = Object.values(session.players);

  return (
    <div>
      <p className="mb-2 text-sm font-semibold">🍎 Tile Rush</p>

      {session.status === "lobby" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-stone-600">
            Match the target emoji as a team before time runs out. Joined: {playerNames.join(", ")}
          </p>
          <div className="flex gap-2">
            {!iJoined && (
              <button className="btn-secondary text-xs" onClick={join}>
                Join
              </button>
            )}
            <button className="btn-primary text-xs" onClick={begin} disabled={!iJoined}>
              Start round
            </button>
          </div>
        </div>
      )}

      {session.status === "active" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              Target: <span className="text-xl align-middle">{session.target}</span>
            </span>
            <span>
              Score: {session.score}/{session.winScore}
            </span>
            <span>⏱ {secondsLeft ?? 0}s</span>
          </div>
          {!iJoined && <p className="text-xs text-amber-600">Round already in progress — join the next one.</p>}
          <div className="grid grid-cols-4 gap-2">
            {session.grid.map((emoji, i) => (
              <button
                key={i}
                className="flex h-12 items-center justify-center rounded-lg border border-stone-200 bg-white text-2xl hover:bg-stone-100 disabled:opacity-50"
                onClick={() => tile(i)}
                disabled={!iJoined}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {session.status === "ended" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            {session.result === "won" ? `🎉 Team won! Final score: ${session.score}` : `⏰ Time's up — final score: ${session.score}`}
          </p>
          <button className="btn-primary self-start text-xs" onClick={start}>
            Play again
          </button>
        </div>
      )}
    </div>
  );
}
