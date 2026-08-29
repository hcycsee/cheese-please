"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Prefs = {
  sameGenderOnly: boolean;
  ageFactor: boolean;
  facultyFactor: boolean;
  mbtiFactor: boolean;
};

export default function MatchPanel({ initialPrefs }: { initialPrefs: Prefs }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState(initialPrefs);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function updatePref(key: keyof Prefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await fetch("/api/profile/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
  }

  async function findGroup() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/match", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Something went wrong.");
        return;
      }
      if (!data.groupId) {
        setMessage(data.message ?? "No group available right now.");
        return;
      }
      router.push(`/chat/group/${data.groupId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex flex-col gap-5">
      <div>
        <h2 className="mb-2 font-semibold">Match preferences</h2>
        <p className="mb-3 text-sm text-stone-600">
          We group up to 12 people who are free right now. Toggle which of these should count toward the match.
        </p>
        <div className="flex flex-col gap-2">
          <ToggleRow
            label="Only match me with the same gender"
            checked={prefs.sameGenderOnly}
            onChange={(v) => updatePref("sameGenderOnly", v)}
          />
          <ToggleRow label="Consider age (±2 years)" checked={prefs.ageFactor} onChange={(v) => updatePref("ageFactor", v)} />
          <ToggleRow label="Consider faculty" checked={prefs.facultyFactor} onChange={(v) => updatePref("facultyFactor", v)} />
          <ToggleRow label="Consider MBTI type" checked={prefs.mbtiFactor} onChange={(v) => updatePref("mbtiFactor", v)} />
        </div>
      </div>

      <button className="btn-primary" onClick={findGroup} disabled={loading}>
        {loading ? "Finding a group..." : "Find people free right now"}
      </button>

      {message && <p className="text-sm text-stone-600">{message}</p>}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-stone-200 px-3 py-2">
      <span className="text-sm">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
    </label>
  );
}
