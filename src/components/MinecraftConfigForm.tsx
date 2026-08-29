"use client";

import { useState } from "react";

export default function MinecraftConfigForm({
  initialAllowedIp,
  initialTargetEmail,
  initialTargetName,
}: {
  initialAllowedIp: string;
  initialTargetEmail: string;
  initialTargetName: string | null;
}) {
  const [allowedIp, setAllowedIp] = useState(initialAllowedIp);
  const [targetEmail, setTargetEmail] = useState(initialTargetEmail);
  const [targetName, setTargetName] = useState(initialTargetName);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/minecraft-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowedIp, targetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save.");
        return;
      }
      setTargetName(data.targetUser?.name ?? null);
      setSaved(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card flex flex-col gap-4 max-w-lg" onSubmit={save}>
      <div>
        <label className="label">Server IP allowed to check status</label>
        <input
          className="input"
          placeholder="e.g. 203.0.113.42"
          value={allowedIp}
          onChange={(e) => setAllowedIp(e.target.value)}
        />
        <p className="mt-1 text-xs text-stone-500">
          Requests from any other IP get a 403 — the bridge script's real TCP source address is checked, not a
          client-supplied value, so this can't be spoofed by changing a query parameter.
        </p>
      </div>
      <div>
        <label className="label">Account to relay online status for</label>
        <input
          className="input"
          type="email"
          placeholder="someone@example.com"
          value={targetEmail}
          onChange={(e) => setTargetEmail(e.target.value)}
        />
        {targetName && <p className="mt-1 text-xs text-stone-500">Currently: {targetName}</p>}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button className="btn-primary self-start" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
        {saved && <span className="text-xs text-green-700">Saved ✓</span>}
      </div>
    </form>
  );
}
