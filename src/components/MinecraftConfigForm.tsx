"use client";

import { useEffect, useState } from "react";

export default function MinecraftConfigForm() {
  const [online, setOnline] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/minecraft-config")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setOnline(!!data.online);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load.");
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle() {
    const next = !online;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/minecraft-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save.");
        return;
      }
      setOnline(data.online);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Minecraft demo status</p>
          <p className="text-xs text-stone-500">Preview an in-game "online" indicator.</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={loading || !loaded}
          aria-pressed={online}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${online ? "bg-brand-600" : "bg-stone-300"}`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
              online ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
