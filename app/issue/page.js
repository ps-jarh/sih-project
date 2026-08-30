"use client";

import { useEffect, useState } from "react";
import { Landmark, PlusCircle, Ban } from "lucide-react";
import { Eyebrow } from "@/components/ui";
import IssuanceForm from "@/components/IssuanceForm";
import RevocationRegistry from "@/components/RevocationRegistry";
import SignerSidebar from "@/components/SignerSidebar";

const SUBTABS = [
  { id: "issue", label: "Issue Single Credential", icon: PlusCircle },
  { id: "revoke", label: "Revocation Registry", icon: Ban },
];

export default function IssuanceTerminalPage() {
  const [institutions, setInstitutions] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [subtab, setSubtab] = useState("issue");

  useEffect(() => {
    fetch("/api/institutions")
      .then((r) => r.json())
      .then((d) => {
        setInstitutions(d.institutions);
        if (d.institutions.length) setSelectedId(d.institutions[0].id);
      });
  }, []);

  const institution = institutions.find((i) => i.id === selectedId) || null;

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
        <div className="flex items-center gap-2 rounded-xl border border-ink-600 bg-ink-850 px-4 py-3">
          <Landmark size={16} className="text-signal-blue" />
          <span className="font-mono text-xs text-slate-400">Active Authority</span>
          <span className="font-semibold text-slate-100">{institution?.name || "…"}</span>
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
          {subtab === "issue" && (
            <IssuanceForm institutions={institutions} selectedId={selectedId} onSelectInstitution={setSelectedId} />
          )}
          {subtab === "revoke" && <RevocationRegistry selectedId={selectedId} />}
        </div>
        <SignerSidebar institution={institution} />
      </div>
    </div>
  );
}
