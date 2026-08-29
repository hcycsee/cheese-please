"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socketClient";
import { displayName } from "@/lib/format";

type IncomingMessage = {
  id: string;
  senderId: string;
  receiverId?: string | null;
  groupId?: string | null;
  content: string;
  imageUrl?: string | null;
  sender?: { id: string; name: string; preferredName: string | null } | null;
};

type Toast = { id: string; text: string; href: string };

const TOAST_LIFETIME_MS = 5000;

export default function NotificationToasts({ currentUserId }: { currentUserId: string }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const socket = getSocket();

    function onMessage(message: IncomingMessage) {
      if (message.senderId === currentUserId) return; // never notify about your own messages

      const isGroup = !!message.groupId;
      const href = isGroup ? `/chat/group/${message.groupId}` : `/chat/${message.senderId}`;
      if (pathname === href) return; // already looking at this conversation

      const senderName = message.sender ? displayName(message.sender) : "Someone";
      const preview = message.content || (message.imageUrl ? "📷 Image" : "");
      const toastId = message.id;
      setToasts((prev) => [...prev, { id: toastId, text: `${senderName}: ${preview}`, href }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, TOAST_LIFETIME_MS);
    }

    socket.on("chat:message", onMessage);
    return () => {
      socket.off("chat:message", onMessage);
    };
  }, [currentUserId, pathname]);

  function open(toast: Toast) {
    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    router.push(toast.href);
  }

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          onClick={() => open(toast)}
          className="card truncate text-left text-sm shadow-lg hover:bg-stone-100"
        >
          💬 {toast.text}
        </button>
      ))}
    </div>
  );
}
