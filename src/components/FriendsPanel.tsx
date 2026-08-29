"use client";

import { useEffect, useState } from "react";
import { displayName } from "@/lib/format";
import { getSocket } from "@/lib/socketClient";

type FriendRow = {
  friendshipId: string;
  user: { id: string; name: string; preferredName: string | null; gender: string | null; faculty: string | null; mbti: string | null; online: boolean };
};

export default function FriendsPanel() {
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [incoming, setIncoming] = useState<FriendRow[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/friends");
    if (res.ok) {
      const data = await res.json();
      setFriends(data.friends);
      setIncoming(data.incoming);
      setOutgoing(data.outgoing);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const socket = getSocket();
    const refresh = () => load();
    socket.on("presence:online", refresh);
    socket.on("presence:offline", refresh);
    return () => {
      socket.off("presence:online", refresh);
      socket.off("presence:offline", refresh);
    };
  }, []);

  async function respond(friendshipId: string, action: "accept" | "decline" | "remove") {
    await fetch(`/api/friends/${friendshipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  if (loading) return <p className="text-stone-500">Loading...</p>;

  return (
    <div className="flex flex-col gap-8">
      {incoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Requests</h2>
          <div className="flex flex-col gap-2">
            {incoming.map((row) => (
              <div key={row.friendshipId} className="card flex items-center justify-between">
                <p className="font-medium">{displayName(row.user)}</p>
                <div className="flex gap-2">
                  <button className="btn-primary text-sm" onClick={() => respond(row.friendshipId, "accept")}>
                    Accept
                  </button>
                  <button className="btn-secondary text-sm" onClick={() => respond(row.friendshipId, "decline")}>
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
          Friends ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <p className="text-sm text-stone-500">No friends yet — add some from the online page.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map((row) => (
              <div key={row.friendshipId} className="card flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${row.user.online ? "bg-green-500" : "bg-stone-300"}`} />
                  <p className="font-medium">{displayName(row.user)}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`/chat/${row.user.id}`} className="btn-primary text-sm">
                    Message
                  </a>
                  <button className="btn-ghost text-sm" onClick={() => respond(row.friendshipId, "remove")}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {outgoing.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Sent requests</h2>
          <div className="flex flex-col gap-2">
            {outgoing.map((row) => (
              <div key={row.friendshipId} className="card flex items-center justify-between">
                <p className="font-medium">{displayName(row.user)}</p>
                <button className="btn-ghost text-sm" onClick={() => respond(row.friendshipId, "remove")}>
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
