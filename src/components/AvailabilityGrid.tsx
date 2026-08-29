"use client";

import { useRef, useState } from "react";
import { DAYS, PERIODS, slotId } from "@/lib/constants";

export default function AvailabilityGrid({
  value,
  onChange,
}: {
  value: string[];
  onChange: (slots: string[]) => void;
}) {
  const selected = new Set(value);
  const [importState, setImportState] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggle(slot: string) {
    const next = new Set(selected);
    if (next.has(slot)) next.delete(slot);
    else next.add(slot);
    onChange(Array.from(next));
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImportState("loading");
    setImportError(null);
    try {
      const icsText = await file.text();
      const res = await fetch("/api/ics/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icsText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't read that calendar file.");
      onChange(data.suggestedSlots);
      setImportState("done");
    } catch (err) {
      setImportState("error");
      setImportError(err instanceof Error ? err.message : "Couldn't read that calendar file.");
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-stone-600">Tap the times you&apos;re usually free and online.</p>
        <div>
          <input ref={fileInputRef} type="file" accept=".ics,text/calendar" className="hidden" onChange={handleFile} />
          <button type="button" className="btn-secondary text-sm" onClick={() => fileInputRef.current?.click()}>
            {importState === "loading" ? "Reading..." : "Import from calendar (.ics)"}
          </button>
        </div>
      </div>
      {importState === "done" && (
        <p className="mb-2 text-sm text-green-700">
          Filled in free slots based on your calendar's busy times — double check and adjust below.
        </p>
      )}
      {importState === "error" && <p className="mb-2 text-sm text-red-600">{importError}</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="w-24"></th>
              {DAYS.map((day) => (
                <th key={day} className="pb-1 text-xs font-semibold text-stone-500">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period.key}>
                <td className="pr-2 text-right text-xs text-stone-500">
                  {period.label}
                  <div className="text-[10px] text-stone-400">{period.hours}</div>
                </td>
                {DAYS.map((day) => {
                  const slot = slotId(day, period.key);
                  const isOn = selected.has(slot);
                  return (
                    <td key={slot}>
                      <button
                        type="button"
                        onClick={() => toggle(slot)}
                        aria-pressed={isOn}
                        className={`h-9 w-full rounded-lg border transition-colors ${
                          isOn ? "border-cheese-500 bg-cheese-400" : "border-stone-200 bg-stone-50 hover:bg-stone-100"
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
