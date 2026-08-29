"use client";

import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/lib/socketClient";
import { displayName, ageRangeBuckets } from "@/lib/format";
import { parseJsonArray, GENDERS, FACULTIES, MBTI_TYPES } from "@/lib/constants";

export type DirectoryUser = {
  id: string;
  name: string;
  preferredName: string | null;
  avatarUrl: string | null;
  bio: string | null;
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

const AGE_RANGE_OPTIONS = ageRangeBuckets();

type Filters = {
  search: string;
  gender: string;
  faculty: string;
  mbti: string;
  ageRange: string;
};

const EMPTY_FILTERS: Filters = { search: "", gender: "", faculty: "", mbti: "", ageRange: "" };

function matchesFilters(user: DirectoryUser, filters: Filters): boolean {
  // Every active filter must match — an AND across categories, not an OR.
  if (filters.search.trim()) {
    const needle = filters.search.trim().toLowerCase();
    if (!displayName(user).toLowerCase().includes(needle)) return false;
  }
  if (filters.gender && user.gender !== filters.gender) return false;
  if (filters.faculty && user.faculty !== filters.faculty) return false;
  if (filters.mbti && user.mbti !== filters.mbti) return false;
  if (filters.ageRange && user.ageRange !== filters.ageRange) return false;
  return true;
}

export default function OnlineDirectory({ initialUsers }: { initialUsers: DirectoryUser[] }) {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState(initialUsers);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

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
    const filtered = users.filter((u) => matchesFilters(u, filters));
    const online = filtered.filter((u) => onlineIds.has(u.id));
    const offline = filtered.filter((u) => !onlineIds.has(u.id));
    return { online, offline };
  }, [users, onlineIds, filters]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

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

  async function blockUser(toUserId: string) {
    if (!window.confirm("Block this person? They'll disappear from your directory and won't be able to message or add you.")) {
      return;
    }
    const res = await fetch("/api/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: toUserId }),
    });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== toUserId));
  }

  return (
    <div className="flex flex-col gap-8">
      <FilterBar filters={filters} onChange={setFilters} activeFilterCount={activeFilterCount} />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
          Online ({online.length})
        </h2>
        {online.length === 0 ? (
          <p className="text-sm text-stone-500">
            {activeFilterCount > 0 ? "No one online matches your filters." : "No one else is online right now."}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {online.map((u) => (
              <UserCard key={u.id} user={u} online onAddFriend={sendFriendRequest} onBlock={blockUser} />
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
          Offline ({offline.length})
        </h2>
        {offline.length === 0 && activeFilterCount > 0 ? (
          <p className="text-sm text-stone-500">No one offline matches your filters.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offline.map((u) => (
              <UserCard key={u.id} user={u} online={false} onAddFriend={sendFriendRequest} onBlock={blockUser} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterBar({
  filters,
  onChange,
  activeFilterCount,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  activeFilterCount: number;
}) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <input
          className="input max-w-xs"
          placeholder="Search by name..."
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
        />
        {activeFilterCount > 0 && (
          <button type="button" className="btn-ghost text-xs" onClick={() => onChange(EMPTY_FILTERS)}>
            Clear filters ({activeFilterCount})
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select className="input" value={filters.gender} onChange={(e) => set("gender", e.target.value)}>
          <option value="">Any gender</option>
          {GENDERS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select className="input" value={filters.ageRange} onChange={(e) => set("ageRange", e.target.value)}>
          <option value="">Any age</option>
          {AGE_RANGE_OPTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select className="input" value={filters.faculty} onChange={(e) => set("faculty", e.target.value)}>
          <option value="">Any faculty</option>
          {FACULTIES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <select className="input" value={filters.mbti} onChange={(e) => set("mbti", e.target.value)}>
          <option value="">Any MBTI</option>
          {MBTI_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function UserCard({
  user,
  online,
  onAddFriend,
  onBlock,
}: {
  user: DirectoryUser;
  online: boolean;
  onAddFriend: (id: string) => void;
  onBlock: (id: string) => void;
}) {
  const games = gameNames(user);
  return (
    <div className={`card flex h-full flex-col ${online ? "" : "opacity-60"}`}>
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-stone-100">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg">🙂</span>
            )}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface ${
              online ? "bg-green-500" : "bg-stone-300"
            }`}
          />
        </div>
        <div>
          <p className="font-semibold">{displayName(user)}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {user.gender && <span className="chip">{user.gender}</span>}
            {user.ageRange && <span className="chip">{user.ageRange}</span>}
            {user.faculty && <span className="chip">{user.faculty}</span>}
            {user.mbti && <span className="chip">{user.mbti}</span>}
          </div>
        </div>
      </div>

      {user.bio && <p className="mt-2 line-clamp-2 text-xs text-stone-600">{user.bio}</p>}

      {games.length > 0 && (
        <p className="mt-2 truncate text-xs text-stone-500">
          🎮 {games.slice(0, 3).join(", ")}
          {games.length > 3 ? ` +${games.length - 3} more` : ""}
        </p>
      )}

      <div className="mt-auto pt-3">
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
        <button
          type="button"
          className="mt-1 w-full text-center text-xs text-stone-400 hover:text-red-600 hover:underline"
          onClick={() => onBlock(user.id)}
        >
          Block
        </button>
      </div>
    </div>
  );
}
