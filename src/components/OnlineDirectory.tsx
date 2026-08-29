"use client";

import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/lib/socketClient";
import { displayName } from "@/lib/format";
import { parseJsonArray } from "@/lib/constants";

export type DirectoryUser = {
  id: string;
  name: string;
  preferredName: string | null;
  gender: string | null;
  ageRange: string | null;
  faculty: string | null;
  mbti: string | null;
  ownedGames: string | null;
  steamGames: string | null;
  friendStatus: "none" | "pending_out" | "pending_in" | "friends";
  friendshipId?: string;
};

function gameNames(user: DirectoryUser): string[] {
  const manual = parseJsonArray(user.ownedGames);
  let steam: string[] = [];
  try {
    const parsed = user.steamGames ? JSON.parse(user.steamGames) : [];
    if (Array.isArray(parsed)) steam = parsed.map((g: any) => g.name).filter(Boolean);
  } catch {
    // ignore
  }
  return Array.from(new Set([...manual, ...steam]));
}

export default function OnlineDirectory({ initialUsers }: { initialUsers: DirectoryUser[] }) {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState(initialUsers);

  useEffect(() => {
    const socket = getSocket();
    const onList = (ids: string[]) => setOnlineIds(new Set(ids));
    const onOnline = ({ userId }: { userId: string }) => setOnlineIds((prev) => new Set(prev).add(userId));
    const onOffline = ({ userId }: { userId: string }) =>
      setOnlineIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });

    socket.on("presence:list", onList);
    socket.on("presence:online", onOnline);
    socket.on("presence:offline", onOffline);
    return () => {
      socket.off("presence:list", onList);
      socket.off("presence:online", onOnline);
      socket.off("presence:offline", onOffline);
    };
  }, []);

  const { online, offline } = useMemo(() => {
    const online = users.filter((u) => onlineIds.has(u.id));
    const offline = users.filter((u) => !onlineIds.has(u.id));
    return { online, offline };
  }, [users, onlineIds]);

  async function sendFriendRequest(toUserId: string) {
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId }),
    });
    if (res.ok) {
      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === toUserId ? { ...u, friendStatus: "pending_out", friendshipId: data.friendshipId } : u))
      );
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
          Online ({online.length})
        </h2>
        {online.length === 0 ? (
          <p className="text-sm text-stone-500">No one else is online right now.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {online.map((u) => (
              <UserCard key={u.id} user={u} online onAddFriend={sendFriendRequest} />
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
          Offline ({offline.length})
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offline.map((u) => (
            <UserCard key={u.id} user={u} online={false} onAddFriend={sendFriendRequest} />
          ))}
        </div>
      </section>
    </div>
  );
}

function UserCard({
  user,
  online,
  onAddFriend,
}: {
  user: DirectoryUser;
  online: boolean;
  onAddFriend: (id: string) => void;
}) {
  const games = gameNames(user);
  return (
    <div className={`card ${online ? "" : "opacity-60"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-green-500" : "bg-stone-300"}`} />
            <p className="font-semibold">{displayName(user)}</p>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {user.gender && <span className="chip">{user.gender}</span>}
            {user.ageRange && <span className="chip">{user.ageRange}</span>}
            {user.faculty && <span className="chip">{user.faculty}</span>}
            {user.mbti && <span className="chip">{user.mbti}</span>}
          </div>
        </div>
      </div>

      {games.length > 0 && (
        <p className="mt-2 truncate text-xs text-stone-500">
          🎮 {games.slice(0, 3).join(", ")}
          {games.length > 3 ? ` +${games.length - 3} more` : ""}
        </p>
      )}

      <div className="mt-3">
        {user.friendStatus === "none" && (
          <button className="btn-secondary w-full text-sm" onClick={() => onAddFriend(user.id)}>
            Add friend
          </button>
        )}
        {user.friendStatus === "pending_out" && (
          <button className="btn-secondary w-full text-sm" disabled>
            Request sent
          </button>
        )}
        {user.friendStatus === "pending_in" && (
          <a href="/friends" className="btn-primary block w-full text-center text-sm">
            Respond to request
          </a>
        )}
        {user.friendStatus === "friends" && (
          <a href={`/chat/${user.id}`} className="btn-primary block w-full text-center text-sm">
            Message
          </a>
        )}
      </div>
    </div>
  );
}
