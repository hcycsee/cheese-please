"use client";

import { useState } from "react";

type Dichotomy = "EI" | "SN" | "TF" | "JP";

const DICHOTOMIES: Array<{
  key: Dichotomy;
  question: string;
  options: [{ letter: string; label: string }, { letter: string; label: string }];
}> = [
  {
    key: "EI",
    question: "At a party or group hangout, you...",
    options: [
      { letter: "E", label: "Get energized being around people" },
      { letter: "I", label: "Recharge by having time alone" },
    ],
  },
  {
    key: "SN",
    question: "You tend to focus more on...",
    options: [
      { letter: "S", label: "Concrete facts and details" },
      { letter: "N", label: "Ideas, patterns and possibilities" },
    ],
  },
  {
    key: "TF",
    question: "You make decisions mostly based on...",
    options: [
      { letter: "T", label: "Logic and consistency" },
      { letter: "F", label: "Values and how people are affected" },
    ],
  },
  {
    key: "JP",
    question: "You prefer to...",
    options: [
      { letter: "J", label: "Plan ahead and keep things settled" },
      { letter: "P", label: "Stay flexible and keep options open" },
    ],
  },
];

function splitInitial(initialValue?: string | null) {
  const v = initialValue && initialValue.length === 4 ? initialValue : "";
  return { EI: v[0], SN: v[1], TF: v[2], JP: v[3] } as Record<Dichotomy, string | undefined>;
}

export default function MbtiPicker({
  initialValue,
  onChange,
}: {
  initialValue?: string | null;
  onChange: (mbti: string | null) => void;
}) {
  const [letters, setLetters] = useState<Record<Dichotomy, string | undefined>>(() => splitInitial(initialValue));

  function choose(key: Dichotomy, letter: string) {
    const next = { ...letters, [key]: letter };
    setLetters(next);
    const code = [next.EI, next.SN, next.TF, next.JP];
    onChange(code.every(Boolean) ? code.join("") : null);
  }

  return (
    <div className="flex flex-col gap-4">
      {DICHOTOMIES.map((d) => (
        <div key={d.key}>
          <p className="mb-2 text-sm font-medium text-stone-700">{d.question}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {d.options.map((opt) => {
              const selected = letters[d.key] === opt.letter;
              return (
                <button
                  key={opt.letter}
                  type="button"
                  onClick={() => choose(d.key, opt.letter)}
                  aria-pressed={selected}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? "border-brand-500 bg-brand-100 font-medium"
                      : "border-stone-200 bg-stone-50 hover:bg-stone-100"
                  }`}
                >
                  <span className="mr-2 font-mono text-xs text-stone-400">{opt.letter}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
