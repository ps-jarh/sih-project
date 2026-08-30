"use client";

import { useEffect, useState } from "react";
import { Award, Loader2, Search } from "lucide-react";
import { Card, Eyebrow, Badge, HashChip, inputClass } from "@/components/ui";

export default function GalleryPage() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/credentials", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setCredentials(d.credentials);
        setLoading(false);
      });
  }, []);

  const filtered = credentials.filter((c) => {
    const haystack = `${c.recipientName} ${c.title} ${c.institutionName} ${c.id}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div>
      <Eyebrow>Public Record</Eyebrow>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Credential <span className="text-signal-blue">Gallery</span>
      </h1>
      <p className="mt-3 max-w-2xl text-slate-400">
        Every credential ever anchored to the ledger, with live status pulled straight from the chain.
      </p>

      <div className="relative mt-6 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, degree, or ID…"
          className={`${inputClass} pl-9`}
        />
      </div>

      {loading ? (
        <div className="mt-10 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Loading credentials…
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center text-slate-600">
          <Award size={32} />
          <p className="mt-3 text-sm">No credentials match your search.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-signal-blue/30 bg-signal-blue/10">
                  <Award size={18} className="text-signal-blue" />
                </span>
                <Badge tone={c.revoked ? "red" : "green"}>{c.revoked ? "Revoked" : "Valid"}</Badge>
              </div>
              <h3 className="mt-4 font-semibold text-slate-100">{c.recipientName}</h3>
              <p className="text-sm text-slate-400">{c.title}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-slate-500">
                {c.institutionName}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-ink-700 pt-3 text-xs">
                <span className="text-slate-500">Block #{c.blockIndex}</span>
                <HashChip value={c.blockHash} length={6} />
              </div>
              <p className="mt-2 font-mono text-[11px] text-slate-600">{c.id} · {c.issuanceDate}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
