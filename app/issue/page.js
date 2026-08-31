"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Ban, LogOut, ShieldCheck, Loader2 } from "lucide-react";
import { Eyebrow, Button } from "@/components/ui";
import IssuanceForm from "@/components/IssuanceForm";
import RevocationRegistry from "@/components/RevocationRegistry";
import SignerSidebar from "@/components/SignerSidebar";
import KeyVault from "@/components/KeyVault";
import InstitutionLogin from "@/components/InstitutionLogin";

const SUBTABS = [
  { id: "issue", label: "Issue Single Credential", icon: PlusCircle },
  { id: "revoke", label: "Revocation Registry", icon: Ban },
];

export default function IssuanceTerminalPage() {
  const [institutions, setInstitutions] = useState([]);
  const [session, setSession] = useState(null); // signed-in institution, or null
  const [checkingSession, setCheckingSession] = useState(true);
  const [subtab, setSubtab] = useState("issue");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/institutions")
      .then((r) => r.json())
      .then((d) => setInstitutions(d.institutions));

    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setSession(d.authenticated ? d.institution : null);
        setCheckingSession(false);
      });
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    setLoggingOut(false);
  }

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" /> Checking session…
      </div>
    );
  }

  if (!session) {
    return <InstitutionLogin institutions={institutions} onSuccess={setSession} />;
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Eyebrow>Accredited Issuing Authority Portal</Eyebrow>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Institutional Credential <span className="text-signal-blue">Engine</span>
          </h1>
          <p className="mt-3 max-w-xl text-slate-400">
            Issue tamper-proof credentials, bind original documents via SHA-256, and anchor cryptographic
            proofs onto the hash-chain.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-signal-green/30 bg-signal-green/5 px-4 py-3">
            <ShieldCheck size={16} className="text-signal-green" />
            <span className="font-mono text-xs text-slate-400">Signed in as</span>
            <span className="font-semibold text-slate-100">{session.name}</span>
          </div>
          <Button variant="subtle" onClick={handleLogout} disabled={loggingOut} className="!px-2 !py-1 text-xs">
            {loggingOut ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
            Log out
          </Button>
        </div>
      </div>

      <div className="mb-6 flex gap-1.5">
        {SUBTABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSubtab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              subtab === id ? "bg-signal-blue text-white shadow-glow" : "border border-ink-600 text-slate-400 hover:bg-ink-700"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {subtab === "issue" && <IssuanceForm institution={session} />}
          {subtab === "revoke" && <RevocationRegistry institution={session} />}
        </div>
        <div className="space-y-5">
          <SignerSidebar institution={session} />
          <KeyVault institution={session} />
        </div>
      </div>
    </div>
  );
}
