"use client";

import { useState } from "react";
import { LogIn, Loader2, ShieldCheck } from "lucide-react";
import { Card, Field, Button, inputClass, Eyebrow } from "./ui";

// Synthetic demo accounts, shown openly so anyone trying the app can sign
// in — never do this with real institutional credentials.
const DEMO_HINTS = [
  { id: "STAN", label: "Stanford University", password: "stanford-2026" },
  { id: "MIT", label: "MIT", password: "mit-2026" },
  { id: "IITKGP", label: "IIT Kharagpur", password: "iitkgp-2026" },
];

export default function InstitutionLogin({ institutions, onSuccess }) {
  const [institutionId, setInstitutionId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionId, password }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error);
      else onSuccess(data.institution);
    } catch {
      setError("Could not reach the authentication service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="mb-6 text-center">
        <Eyebrow>Accredited Issuing Authority Portal</Eyebrow>
        <h1 className="mt-4 text-3xl font-bold text-white">Institution Sign In</h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in as an accredited institution to issue or revoke credentials.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Institution" required>
            <select
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              className={inputClass}
              required
            >
              <option value="" disabled>
                Select institution…
              </option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.shortCode})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Password" required>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>

          {error && (
            <p className="rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-signal-red">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            Sign In
          </Button>
        </form>
      </Card>

      <Card className="mt-4 p-4">
        <p className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-slate-500">
          <ShieldCheck size={13} className="text-signal-blue" /> Demo Credentials
        </p>
        <div className="space-y-1 text-xs text-slate-400">
          {DEMO_HINTS.map((h) => (
            <div key={h.id} className="flex justify-between">
              <span>{h.label}</span>
              <span className="font-mono text-slate-300">{h.password}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-600">
          Synthetic demo accounts, shown here for convenience — never expose real credentials like this.
        </p>
      </Card>
    </div>
  );
}
