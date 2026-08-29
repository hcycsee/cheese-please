"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socketClient";
import GamePanel from "./GamePanel";

export type ChatMessage = {
  id: string;
  senderId: string;
  receiverId?: string | null;
  groupId?: string | null;
  content: string;
  createdAt: string;
  sender?: { id: string; name: string; preferredName: string | null };
};

export default function ChatWindow({
  mode,
  targetId,
  currentUserId,
  initialMessages,
  title,
  subtitle,
}: {
  mode: "dm" | "group";
  targetId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  title: string;
  subtitle?: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = getSocket();

    function onMessage(msg: ChatMessage) {
      const relevant =
        mode === "dm"
          ? (msg.senderId === currentUserId && msg.receiverId === targetId) ||
            (msg.senderId === targetId && msg.receiverId === currentUserId)
          : msg.groupId === targetId;
      if (relevant) setMessages((prev) => [...prev, msg]);
    }
    function onError(payload: { message: string }) {
      setError(payload.message);
    }

    socket.on("chat:message", onMessage);
    socket.on("chat:error", onError);
    return () => {
      socket.off("chat:message", onMessage);
      socket.off("chat:error", onError);
    };
  }, [mode, targetId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function send() {
    const content = draft.trim();
    if (!content) return;
    const socket = getSocket();
    if (mode === "dm") socket.emit("chat:dm", { toUserId: targetId, content });
    else socket.emit("chat:group", { groupId: targetId, content });
    setDraft("");
    setError(null);
  }

  return (
    <div className="card flex h-[70vh] flex-col p-0">
      <div className="border-b border-stone-200 px-5 py-3">
        <p className="font-semibold">{title}</p>
        {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
      </div>

      <GamePanel mode={mode} targetId={targetId} currentUserId={currentUserId} />

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && <p className="text-sm text-stone-400">No messages yet — say hi!</p>}
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-brand-500 text-white" : "bg-stone-100"}`}>
                {mode === "group" && !mine && m.sender && (
                  <p className="mb-0.5 text-xs font-semibold text-stone-500">
                    {m.sender.preferredName || m.sender.name}
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-5 pb-1 text-xs text-red-600">{error}</p>}

      <div className="flex gap-2 border-t border-stone-200 p-3">
        <input
          className="input"
          placeholder="Type a message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button className="btn-primary" onClick={send}>
          Send
        </button>
      </div>
    </div>
  );
}
