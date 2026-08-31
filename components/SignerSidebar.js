"use client";

import { useEffect, useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Card, MonoLabel, HashChip } from "./ui";

export default function SignerSidebar({ institution }) {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/chain", { cache: "no-store" });
      const data = await res.json();
      if (!cancelled) setMetrics(data);
    }
    load();
    const id = setInterval(load, 6000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <KeyRound size={15} className="text-signal-cyan" />
          <MonoLabel>Cryptographic Signer</MonoLabel>
        </div>
        {institution ? (
          <div className="mt-4 space-y-3 text-xs">
            <Row label="Authorized Signer" value={institution.name} />
            <Row label="Curve" value={`ECDSA · ${institution.curve}`} />
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Key Fingerprint</span>
              <HashChip value={institution.keyFingerprint} length={8} />
            </div>
            <Row label="Target Block" value={metrics ? `#${metrics.height + 1} (next)` : "…"} />
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">Select an institution to load its signing key.</p>
        )}

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-signal-blue/30 bg-signal-blue/5 p-3">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-signal-blue" />
          <p className="text-[11px] leading-relaxed text-slate-400">
            Any future edit to a field on an issued record changes its block hash, breaking the signature and
            every hash-chain link after it — instantly detectable, never silently accepted.
          </p>
        </div>
      </Card>

      <Card className="p-5">
        <MonoLabel>Ledger Metrics</MonoLabel>
        <div className="mt-4 space-y-3 text-sm">
          <MetricRow label="Total Blocks Mined" value={metrics?.metrics.totalBlocksMined} />
          <MetricRow label="Total Valid Credentials" value={metrics?.metrics.totalValidCredentials} />
          <MetricRow
            label="Revocation Rate"
            value={metrics ? `${metrics.metrics.revocationRate}%` : "…"}
            tone={metrics?.metrics.revocationRate > 0 ? "amber" : "green"}
          />
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-200">{value ?? "…"}</span>
    </div>
  );
}

function MetricRow({ label, value, tone = "blue" }) {
  const color = tone === "amber" ? "text-signal-amber" : tone === "green" ? "text-signal-green" : "text-slate-100";
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-mono text-base font-bold ${color}`}>{value ?? "…"}</span>
    </div>
  );
}
