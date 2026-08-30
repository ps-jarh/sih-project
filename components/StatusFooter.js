"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

export default function StatusFooter() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/chain", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => !cancelled && setStatus(d))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="border-t border-ink-700 bg-ink-950/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4 font-mono text-[11px] text-slate-500">
        <span className="flex items-center gap-2">
          <ShieldCheck size={13} className="text-signal-blue" />
          TRUSTCHAIN // LEDGER · Enterprise Decentralized Credential Network
        </span>
        <span className="flex items-center gap-4">
          <span className={status?.integrity?.valid === false ? "text-signal-red" : "text-signal-green"}>
            ● Node {status?.integrity?.valid === false ? "Integrity Alert" : "Synchronized"}
          </span>
          <span>Height: #{status?.height ?? "…"}</span>
          <span>Zero-Knowledge Verification Enabled</span>
        </span>
      </div>
    </footer>
  );
}
