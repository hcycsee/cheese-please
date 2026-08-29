"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socketClient";
import type { GarticSession, MyTurn } from "@/lib/games/gartic";
import DrawingCanvas from "./DrawingCanvas";

type TurnInfo = { key: string; round: number; totalRounds: number } & MyTurn;

export default function GarticGame({
  mode,
  targetId,
  currentUserId,
  session,
  turn,
}: {
  mode: "dm" | "group";
  targetId: string;
  currentUserId: string;
  session: GarticSession;
  turn: TurnInfo | null;
}) {
  const [textDraft, setTextDraft] = useState("");
  const [submittedRound, setSubmittedRound] = useState<number | null>(null);

  useEffect(() => {
    setSubmittedRound(null);
    setTextDraft("");
  }, [turn?.round]);

  function start() {
    getSocket().emit("game:start", { mode, targetId, type: "gartic" });
  }
  function join() {
    getSocket().emit("game:join", { mode, targetId });
  }
  function begin() {
    getSocket().emit("game:begin", { mode, targetId });
  }
  function submitText() {
    if (!textDraft.trim() || !turn) return;
    getSocket().emit("game:garticSubmit", { mode, targetId, content: textDraft.trim() });
    setSubmittedRound(turn.round);
  }
  function submitDrawing(dataUrl: string) {
    if (!turn) return;
    getSocket().emit("game:garticSubmit", { mode, targetId, content: dataUrl });
    setSubmittedRound(turn.round);
  }

  const playerNames = session.playerOrder.map((id) => session.players[id]);
  const iJoined = !!session.players[currentUserId];
  const waitingForOthers = !!turn && submittedRound === turn.round;

  return (
    <div>
      <p className="mb-2 text-sm font-semibold">📞 Gartic Phone</p>

      {session.status === "lobby" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-stone-600">
            Joined ({session.playerOrder.length}): {playerNames.join(", ") || "none yet"} — needs at least 3 to start.
          </p>
          <div className="flex gap-2">
            {!iJoined && (
              <button className="btn-secondary text-xs" onClick={join}>
                Join
              </button>
            )}
            <button className="btn-primary text-xs" onClick={begin} disabled={session.playerOrder.length < 3}>
              Start round
            </button>
          </div>
        </div>
      )}

      {session.status === "active" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-stone-600">
            {session.round === 0 ? "Starting phrases" : `Round ${session.round}/${session.totalRounds - 1}`} —{" "}
            {session.submitted.length}/{session.playerOrder.length} submitted
          </p>

          {!iJoined && <p className="text-xs text-amber-600">You joined after this round started — wait for the next game.</p>}

          {iJoined && waitingForOthers && <p className="text-sm text-stone-500">Submitted — waiting for everyone else...</p>}

          {iJoined && turn && !waitingForOthers && (
            <div className="flex flex-col gap-2">
              {turn.previous === null && <p className="text-sm">Write a phrase to kick off a chain!</p>}
              {turn.previous && turn.previous.kind === "text" && (
                <p className="text-sm">
                  Draw this: <span className="font-semibold">&quot;{turn.previous.content}&quot;</span>
                </p>
              )}
              {turn.previous && turn.previous.kind === "drawing" && (
                <div>
                  <p className="mb-1 text-sm">What is this?</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={turn.previous.content} alt="previous drawing" className="rounded-lg border border-stone-300" />
                </div>
              )}

              {turn.promptType === "write" ? (
                <div className="flex gap-2">
                  <input
                    className="input"
                    value={textDraft}
                    onChange={(e) => setTextDraft(e.target.value)}
                    placeholder="Type your phrase..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitText();
                      }
                    }}
                  />
                  <button className="btn-primary text-xs" onClick={submitText}>
                    Submit
                  </button>
                </div>
              ) : (
                <DrawingCanvas onSubmit={submitDrawing} />
              )}
            </div>
          )}
        </div>
      )}

      {session.status === "ended" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold">🎉 Here&apos;s what happened:</p>
          {session.chains.map((chain, i) => (
            <div key={i} className="rounded-lg border border-stone-200 bg-white p-3">
              <p className="mb-2 text-xs font-semibold text-stone-500">Chain {i + 1}</p>
              <div className="flex flex-col gap-2">
                {chain.map((entry, j) => (
                  <div key={j} className="text-sm">
                    <span className="text-xs text-stone-400">{entry.authorName}: </span>
                    {entry.kind === "text" ? (
                      <span>{entry.content}</span>
                    ) : entry.content ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={entry.content} alt="" className="mt-1 max-w-xs rounded-lg border border-stone-300" />
                    ) : (
                      <span className="italic text-stone-400">(no drawing submitted)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button className="btn-primary self-start text-xs" onClick={start}>
            Play again
          </button>
        </div>
      )}
    </div>
  );
}
