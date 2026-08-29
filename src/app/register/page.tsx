"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FACULTIES, GENDERS } from "@/lib/constants";
import AvailabilityGrid from "@/components/AvailabilityGrid";
import MbtiPicker from "@/components/MbtiPicker";

const STEP_LABELS = ["Account", "Verify ID", "About you", "Personality", "Availability"];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // step 1
  const [name, setName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [institution, setInstitution] = useState("");

  // step 3
  const [gender, setGender] = useState("");
  const [faculty, setFaculty] = useState("");
  const [age, setAge] = useState("");

  // step 4
  const [mbti, setMbti] = useState<string | null>(null);

  // step 5
  const [slots, setSlots] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/me")
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((user) => {
        if (user) {
          if (user.onboardingComplete) {
            router.replace("/dashboard");
            return;
          }
          setStep(Math.min(Math.max(user.onboardingStep ?? 1, 1), 5));
          setGender(user.gender ?? "");
          setFaculty(user.faculty ?? "");
          setAge(user.age != null ? String(user.age) : "");
          setMbti(user.mbti ?? null);
        }
      })
      .finally(() => setReady(true));
  }, [router]);

  async function submitStep(url: string, body: unknown, onSuccess: () => void) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setStep(1);
          setError("Your session expired — please create your account again.");
          return;
        }
        setError(data.error ?? "Something went wrong.");
        return;
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <div className="mb-6 flex gap-2">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1.5 rounded-full ${i + 1 <= step ? "bg-cheese-500" : "bg-stone-200"}`} />
            <p className="mt-1 text-center text-[11px] text-stone-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {step === 1 && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              submitStep("/api/register/account", { name, preferredName, email, password, institution }, () => setStep(2));
            }}
          >
            <h1 className="text-xl font-bold">Create your account</h1>
            <div>
              <label className="label">Full name *</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="label">Preferred name (optional)</label>
              <input
                className="input"
                placeholder="What should we call you?"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password *</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="label">Institution (optional)</label>
              <input
                className="input"
                placeholder="e.g. University of Sydney"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>
            <button className="btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Continue"}
            </button>
          </form>
        )}

        {step === 2 && (
          <VerifyIdStep
            loading={loading}
            onVerify={() => submitStep("/api/register/verify-id", { skip: false }, () => setStep(3))}
            onSkip={() => submitStep("/api/register/verify-id", { skip: true }, () => setStep(3))}
          />
        )}

        {step === 3 && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              submitStep("/api/register/details", { gender, faculty, age }, () => setStep(4));
            }}
          >
            <h1 className="text-xl font-bold">About you</h1>
            <div>
              <label className="label">Gender *</label>
              <select className="input" value={gender} onChange={(e) => setGender(e.target.value)} required>
                <option value="" disabled>Select...</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Faculty *</label>
              <select className="input" value={faculty} onChange={(e) => setFaculty(e.target.value)} required>
                <option value="" disabled>Select...</option>
                {FACULTIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Age *</label>
              <input
                type="number"
                min={13}
                max={120}
                className="input"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary" disabled={loading || !gender || !faculty || !age}>
              {loading ? "Saving..." : "Continue"}
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <h1 className="text-xl font-bold">Personality (optional)</h1>
            <p className="text-sm text-stone-600">Answer these to get matched with people who share your MBTI type.</p>
            <MbtiPicker initialValue={mbti} onChange={setMbti} />
            <div className="flex gap-3">
              <button
                className="btn-secondary flex-1"
                disabled={loading}
                onClick={() => submitStep("/api/register/mbti", { skip: true }, () => setStep(5))}
              >
                Skip
              </button>
              <button
                className="btn-primary flex-1"
                disabled={loading || !mbti}
                onClick={() => submitStep("/api/register/mbti", { mbti }, () => setStep(5))}
              >
                {loading ? "Saving..." : "Continue"}
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-4">
            <h1 className="text-xl font-bold">When are you usually free?</h1>
            <AvailabilityGrid value={slots} onChange={setSlots} />
            <button
              className="btn-primary"
              disabled={loading}
              onClick={() => submitStep("/api/register/availability", { slots }, () => router.push("/dashboard"))}
            >
              {loading ? "Finishing..." : "Finish"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function VerifyIdStep({ loading, onVerify, onSkip }: { loading: boolean; onVerify: () => void; onSkip: () => void }) {
  const [scanning, setScanning] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Verify your identity (optional)</h1>
      <p className="text-sm text-stone-600">
        This is a demo placeholder — in a real deployment this step would check a real ID document or your
        institution&apos;s single sign-on instead of just simulating a check.
      </p>
      <div className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-stone-300 text-sm text-stone-400">
        {scanning ? "Scanning ID..." : "ID upload placeholder"}
      </div>
      <div className="flex gap-3">
        <button className="btn-secondary flex-1" disabled={loading} onClick={onSkip}>
          Skip for now
        </button>
        <button
          className="btn-primary flex-1"
          disabled={loading || scanning}
          onClick={() => {
            setScanning(true);
            setTimeout(() => {
              setScanning(false);
              onVerify();
            }, 1200);
          }}
        >
          {scanning ? "Scanning..." : "Simulate verification"}
        </button>
      </div>
    </div>
  );
}
