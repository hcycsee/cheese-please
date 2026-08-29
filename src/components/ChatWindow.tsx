"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socketClient";
import GamePanel from "./GamePanel";
import MinecraftConfigForm from "./MinecraftConfigForm";

export type ChatMessage = {
  id: string;
  senderId: string;
  receiverId?: string | null;
  groupId?: string | null;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  sender?: { id: string; name: string; preferredName: string | null };
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

export default function ChatWindow({
  mode,
  targetId,
  currentUserId,
  isAdmin,
  initialMessages,
  title,
  subtitle,
}: {
  mode: "dm" | "group";
  targetId: string;
  currentUserId: string;
  isAdmin?: boolean;
  initialMessages: ChatMessage[];
  title: string;
  subtitle?: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function blockUser() {
    if (!window.confirm("Block this person? They'll disappear from your directory and won't be able to message or add you.")) {
      return;
    }
    await fetch("/api/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: targetId }),
    });
    router.push("/friends");
  }

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

  function pickImage() {
    fileInputRef.current?.click();
  }

  function onImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImageError(null);

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Only PNG, JPEG, GIF, or WebP images are supported.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image is too large (max 5MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPendingImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  function send() {
    const content = draft.trim();
    if (!content && !pendingImage) return;
    const socket = getSocket();
    const payload = pendingImage ? { content, imageUrl: pendingImage } : { content };
    if (mode === "dm") socket.emit("chat:dm", { toUserId: targetId, ...payload });
    else socket.emit("chat:group", { groupId: targetId, ...payload });
    setDraft("");
    setPendingImage(null);
    setError(null);
  }

  return (
    <div className="card flex h-[70vh] flex-col p-0">
      <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
        <div>
          <p className="font-semibold">{title}</p>
          {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
        </div>
        {(mode === "dm" || isAdmin) && (
          <div className="relative">
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Chat menu"
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-72 rounded-xl border border-stone-200 bg-surface p-3 shadow-lg">
                {mode === "dm" && (
                  <button
                    type="button"
                    className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-stone-600 hover:bg-stone-100 hover:text-red-600"
                    onClick={blockUser}
                  >
                    Block this person
                  </button>
                )}
                {isAdmin && (
                  <div className={mode === "dm" ? "mt-2 border-t border-stone-100 pt-2" : ""}>
                    <MinecraftConfigForm />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
                {m.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.imageUrl} alt="" className="mb-1 max-h-64 max-w-full rounded-lg object-contain" />
                )}
                {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-5 pb-1 text-xs text-red-600">{error}</p>}
      {imageError && <p className="px-5 pb-1 text-xs text-red-600">{imageError}</p>}

      {pendingImage && (
        <div className="flex items-center gap-2 border-t border-stone-200 px-5 pt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pendingImage} alt="" className="h-14 w-14 rounded-lg object-cover" />
          <button type="button" className="text-xs text-stone-400 hover:text-red-600" onClick={() => setPendingImage(null)}>
            Remove
          </button>
        </div>
      )}

      <div className="flex gap-2 border-t border-stone-200 p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={onImageSelected}
        />
        <button
          type="button"
          className="btn-secondary px-3"
          onClick={pickImage}
          title="Attach an image or GIF"
          aria-label="Attach an image or GIF"
        >
          🖼️
        </button>
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
