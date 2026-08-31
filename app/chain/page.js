"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldX, Boxes, GraduationCap, Ban, Loader2 } from "lucide-react";
import { Card, Eyebrow, Badge, HashChip, MonoLabel } from "@/components/ui";

const TYPE_META = {
  GENESIS: { icon: Boxes, tone: "blue", label: "Genesis" },
  ISSUANCE: { icon: GraduationCap, tone: "green", label: "Issuance" },
  REVOCATION: { icon: Ban, tone: "red", label: "Revocation" },
};

export default function HashChainPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/chain", { cache: "no-store" });
      const json = await res.json();
      if (!cancelled) setData(json);
    }
    load();
    const id = setInterval(load, 6000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div>
      <Eyebrow>Single-Node Hash-Chain</Eyebrow>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Ledger <span className="text-signal-blue">Hash Chain</span>
      </h1>
      <p className="mt-3 max-w-2xl text-slate-400">
        Every block hashes the block before it. Recomputed live, on every load — if any stored record were
        edited, the break would show up here immediately.
      </p>

      {!data ? (
        <div className="mt-10 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Reading ledger…
        </div>
      ) : (
        <>
          <Card
            className={`mt-8 flex items-center gap-3 p-5 ${
              data.integrity.valid ? "border-signal-green/30 bg-signal-green/5" : "border-signal-red/30 bg-signal-red/5"
            }`}
          >
            {data.integrity.valid ? (
              <ShieldCheck className="text-signal-green" size={22} />
            ) : (
              <ShieldX className="text-signal-red" size={22} />
            )}
            <div>
              <h3 className="font-semibold text-slate-100">
                {data.integrity.valid ? "Chain Intact" : `Integrity Broken at Block #${data.integrity.brokenAtIndex}`}
              </h3>
              <p className="text-sm text-slate-400">
                {data.chain.length} blocks · height #{data.height}
                {data.integrity.valid
                  ? " · every hash and signature checks out"
                  : ` · reason: ${data.integrity.reason}`}
              </p>
            </div>
          </Card>

          <div className="relative mt-8 space-y-4">
            <div className="absolute bottom-0 left-[27px] top-0 w-px bg-ink-600" />
            {data.chain.map((block) => {
              const meta = TYPE_META[block.type];
              const Icon = meta.icon;
              const broken = !data.integrity.valid && block.index >= data.integrity.brokenAtIndex;
              return (
                <div key={block.index} className="relative pl-16">
                  <span
                    className={`absolute left-0 top-4 flex h-14 w-14 items-center justify-center rounded-full border-2 bg-ink-900 ${
                      broken ? "border-signal-red text-signal-red" : "border-ink-600 text-slate-400"
                    }`}
                  >
                    <Icon size={20} />
                  </span>
                  <Card className={`p-5 ${broken ? "border-signal-red/40" : ""}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="blue">#{block.index}</Badge>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      {block.signerInstitutionId && <Badge tone="slate">{block.signerInstitutionId}</Badge>}
                      {block.type !== "GENESIS" && (
                        <Badge tone={block.signatureValid ? "green" : "red"}>
                          {block.signatureValid ? "Signature Valid" : "Signature Invalid"}
                        </Badge>
                      )}
                      <span className="ml-auto font-mono text-[11px] text-slate-500">
                        {new Date(block.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-300">
                      {block.type === "GENESIS" && block.payload.message}
                      {block.type === "ISSUANCE" && (
                        <>
                          <span className="font-medium text-slate-100">{block.payload.recipientName}</span> —{" "}
                          {block.payload.title}
                        </>
                      )}
                      {block.type === "REVOCATION" && (
                        <>
                          Revoked <span className="font-mono text-xs">{block.payload.credentialId}</span> —{" "}
                          &ldquo;{block.payload.reason}&rdquo;
                        </>
                      )}
                    </p>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div className="flex items-center justify-between text-xs">
                        <MonoLabel>Hash</MonoLabel>
                        <HashChip value={block.hash} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <MonoLabel>Prev Hash</MonoLabel>
                        <HashChip value={block.prevHash} />
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
