"use client";

import { useState } from "react";
import { FACULTIES, GENDERS, parseJsonArray } from "@/lib/constants";
import AvailabilityGrid from "./AvailabilityGrid";
import MbtiPicker from "./MbtiPicker";

type SteamGame = { appid: number; name: string; playtimeMinutes: number; iconUrl: string | null };

export type ProfileData = {
  preferredName: string | null;
  institution: string | null;
  gender: string | null;
  faculty: string | null;
  age: number | null;
  mbti: string | null;
  availability: string | null;
  ownedGames: string | null;
  steamId64: string | null;
  steamProfileUrl: string | null;
  steamGames: string | null;
  steamSyncedAt: string | null;
};

export default function ProfileEditor({ initial }: { initial: ProfileData }) {
  return (
    <div className="flex flex-col gap-6">
      <BasicInfoCard initial={initial} />
      <AvailabilityCard initialSlots={parseJsonArray(initial.availability)} />
      <GamesCard initialGames={parseJsonArray(initial.ownedGames)} />
      <SteamCard initial={initial} />
    </div>
  );
}

function SavedBadge({ saved }: { saved: boolean }) {
  if (!saved) return null;
  return <span className="text-xs text-green-700">Saved ✓</span>;
}

function BasicInfoCard({ initial }: { initial: ProfileData }) {
  const [preferredName, setPreferredName] = useState(initial.preferredName ?? "");
  const [institution, setInstitution] = useState(initial.institution ?? "");
  const [gender, setGender] = useState(initial.gender ?? "");
  const [faculty, setFaculty] = useState(initial.faculty ?? "");
  const [age, setAge] = useState(initial.age != null ? String(initial.age) : "");
  const [mbti, setMbti] = useState<string | null>(initial.mbti ?? null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredName,
          institution,
          gender,
          faculty,
          age: age === "" ? null : age,
          mbti,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save.");
        return;
      }
      setSaved(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card flex flex-col gap-4" onSubmit={save}>
      <h2 className="font-semibold">Basic info</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Preferred name</label>
          <input className="input" value={preferredName} onChange={(e) => setPreferredName(e.target.value)} />
        </div>
        <div>
          <label className="label">Institution</label>
          <input className="input" value={institution} onChange={(e) => setInstitution(e.target.value)} />
        </div>
        <div>
          <label className="label">Gender *</label>
          <select className="input" value={gender} onChange={(e) => setGender(e.target.value)} required>
            <option value="" disabled>Select...</option>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Faculty *</label>
          <select className="input" value={faculty} onChange={(e) => setFaculty(e.target.value)} required>
            <option value="" disabled>Select...</option>
            {FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Age *</label>
          <input type="number" min={13} max={120} className="input" value={age} onChange={(e) => setAge(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="label mb-2">MBTI (optional)</label>
        <MbtiPicker initialValue={mbti} onChange={setMbti} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
        <SavedBadge saved={saved} />
      </div>
    </form>
  );
}

function AvailabilityCard({ initialSlots }: { initialSlots: string[] }) {
  const [slots, setSlots] = useState(initialSlots);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setSaved(false);
    try {
      await fetch("/api/profile/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });
      setSaved(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex flex-col gap-4">
      <h2 className="font-semibold">When you&apos;re usually online</h2>
      <AvailabilityGrid value={slots} onChange={setSlots} />
      <div className="flex items-center gap-3">
        <button className="btn-primary self-start" onClick={save} disabled={loading}>
          {loading ? "Saving..." : "Save availability"}
        </button>
        <SavedBadge saved={saved} />
      </div>
    </div>
  );
}

function GamesCard({ initialGames }: { initialGames: string[] }) {
  const [games, setGames] = useState(initialGames);
  const [draft, setDraft] = useState("");

  async function persist(next: string[]) {
    setGames(next);
    await fetch("/api/profile/games", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ games: next }),
    });
  }

  function addGame() {
    const name = draft.trim();
    if (!name || games.includes(name)) return;
    persist([...games, name]);
    setDraft("");
  }

  return (
    <div className="card flex flex-col gap-4">
      <h2 className="font-semibold">Games you own</h2>
      <p className="text-sm text-stone-600">Visible to other people on the platform.</p>
      <div className="flex gap-2">
        <input
          className="input"
          placeholder="e.g. Valorant, Catan, Smash Bros"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addGame();
            }
          }}
        />
        <button className="btn-secondary" onClick={addGame} type="button">
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {games.map((g) => (
          <span key={g} className="chip gap-1">
            {g}
            <button
              className="ml-1 text-stone-400 hover:text-stone-700"
              onClick={() => persist(games.filter((x) => x !== g))}
              aria-label={`Remove ${g}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function SteamCard({ initial }: { initial: ProfileData }) {
  const [input, setInput] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steamGames, setSteamGames] = useState<SteamGame[]>(() => {
    try {
      return initial.steamGames ? JSON.parse(initial.steamGames) : [];
    } catch {
      return [];
    }
  });
  const [linked, setLinked] = useState(!!initial.steamId64);

  async function sync() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/steam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to sync Steam.");
        return;
      }
      setSteamGames(data.games);
      setLinked(true);
    } finally {
      setSyncing(false);
    }
  }

  async function unlink() {
    await fetch("/api/profile/steam", { method: "DELETE" });
    setSteamGames([]);
    setLinked(false);
  }

  return (
    <div className="card flex flex-col gap-4">
      <h2 className="font-semibold">Steam library</h2>
      <p className="text-sm text-stone-600">
        Enter your Steam profile URL, vanity name, or SteamID64. Requires the server to have a
        <code className="mx-1 rounded bg-stone-100 px-1">STEAM_API_KEY</code> configured, and your Steam
        &quot;Game details&quot; privacy set to Public.
      </p>
      <div className="flex gap-2">
        <input
          className="input"
          placeholder="https://steamcommunity.com/id/yourname"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn-secondary whitespace-nowrap" onClick={sync} disabled={syncing || !input}>
          {syncing ? "Syncing..." : "Sync"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {linked && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-stone-600">{steamGames.length} games synced</p>
            <button className="btn-ghost text-xs" onClick={unlink}>
              Unlink Steam
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {steamGames.slice(0, 20).map((g) => (
              <span key={g.appid} className="chip">{g.name}</span>
            ))}
            {steamGames.length > 20 && <span className="chip">+{steamGames.length - 20} more</span>}
          </div>
        </div>
      )}
    </div>
  );
}
