"use client";

import { getSocket } from "@/lib/socketClient";
import type { TicTacToeSession } from "@/lib/games/tictactoe";

export default function TicTacToeGame({
  mode,
  targetId,
  currentUserId,
  session,
}: {
  mode: "dm" | "group";
  targetId: string;
  currentUserId: string;
  session: TicTacToeSession;
}) {
  function start() {
    getSocket().emit("game:start", { mode, targetId, type: "tictactoe" });
  }
  function join() {
    getSocket().emit("game:join", { mode, targetId });
  }
  function begin() {
    getSocket().emit("game:begin", { mode, targetId });
  }
  function move(index: number) {
    getSocket().emit("game:move", { mode, targetId, index });
  }

  const myMark = session.marks[currentUserId];
  const iJoined = !!session.players[currentUserId];
  const playerNames = session.playerOrder.map((id) => session.players[id]);

  return (
    <div>
      <p className="mb-2 text-sm font-semibold">❌⭕ Tic-Tac-Toe</p>

      {session.status === "lobby" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-stone-600">
            Players ({session.playerOrder.length}/2): {playerNames.join(", ") || "none yet"}
          </p>
          <div className="flex gap-2">
            {!iJoined && session.playerOrder.length < 2 && (
              <button className="btn-secondary text-xs" onClick={join}>
                Join
              </button>
            )}
            <button className="btn-primary text-xs" onClick={begin} disabled={session.playerOrder.length < 2}>
              Start
            </button>
          </div>
        </div>
      )}

      {session.status === "active" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            {myMark ? `You are ${myMark}. ` : "You're spectating. "}
            {session.turn === myMark ? "Your turn!" : `Waiting on ${session.turn}...`}
          </p>
          <div className="grid w-48 grid-cols-3 gap-2">
            {session.board.map((cell, i) => (
              <button
                key={i}
                className="flex h-14 w-14 items-center justify-center rounded-lg border border-stone-200 bg-surface text-2xl font-bold hover:bg-stone-100 disabled:opacity-60"
                onClick={() => move(i)}
                disabled={!myMark || session.turn !== myMark || !!cell}
              >
                {cell}
              </button>
            ))}
          </div>
        </div>
      )}

      {session.status === "ended" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">{session.winner === "draw" ? "🤝 It's a draw!" : `🎉 ${session.winner} wins!`}</p>
          <button className="btn-primary self-start text-xs" onClick={start}>
            Play again
          </button>
        </div>
      )}
    </div>
  );
}
