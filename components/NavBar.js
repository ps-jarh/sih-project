"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Landmark, TriangleAlert, Share2, Award } from "lucide-react";

const TABS = [
  { href: "/", label: "Public Verifier", icon: ShieldCheck },
  { href: "/issue", label: "Issuance Terminal", icon: Landmark },
  { href: "/tamper-lab", label: "Tamper Lab", icon: TriangleAlert, tone: "amber" },
  { href: "/chain", label: "Hash Chain", icon: Share2 },
  { href: "/gallery", label: "Credential Gallery", icon: Award },
];

export default function NavBar() {
  const pathname = usePathname();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/chain", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setStatus(data);
      } catch {
        if (!cancelled) setStatus({ error: true });
      }
    }
    load();
    const id = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const synced = status && !status.error;
  const chainOk = status?.integrity?.valid !== false;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700 bg-ink-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-signal-blue/40 bg-signal-blue/10">
            <ShieldCheck size={20} className="text-signal-blue" />
          </span>
          <span className="leading-tight">
            <span className="block font-mono text-lg font-bold tracking-tight text-white">
              TRUSTCHAIN <span className="text-signal-blue">//</span> LEDGER
            </span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
              Enterprise Decentralized Credential Network
            </span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-1.5">
          {TABS.map(({ href, label, icon: Icon, tone }) => {
            const active = pathname === href;
            const amber = tone === "amber";
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 font-mono text-xs font-semibold uppercase tracking-wide transition ${
                  active
                    ? amber
                      ? "bg-signal-amber text-ink-950"
                      : "bg-signal-blue text-white shadow-glow"
                    : amber
                    ? "text-signal-amber hover:bg-ink-700/70"
                    : "text-slate-400 hover:bg-ink-700/70 hover:text-slate-100"
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-900 px-3.5 py-2">
          <span
            className={`status-dot h-2 w-2 rounded-full ${
              synced && chainOk ? "bg-signal-green" : synced ? "bg-signal-red" : "bg-slate-600"
            }`}
          />
          <span className="font-mono text-[11px] leading-tight text-slate-400">
            <span className="block uppercase tracking-wide text-slate-500">Node Status</span>
            <span className={`block font-bold ${synced && chainOk ? "text-signal-green" : "text-signal-red"}`}>
              {!synced ? "CONNECTING…" : chainOk ? "SYNCHRONIZED" : "INTEGRITY ALERT"}
              {synced && <span className="ml-1 font-normal text-slate-500">[#{status.height}]</span>}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}
