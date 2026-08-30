"use client";

import { useEffect, useState } from "react";
import { TriangleAlert, FlaskConical, Loader2, CheckCircle2, XCircle, Zap } from "lucide-react";
import { Card, Eyebrow, Field, Button, inputClass, HashChip, MonoLabel } from "@/components/ui";

const EDITABLE_FIELDS = [
  { key: "recipientName", label: "Recipient Full Name" },
  { key: "title", label: "Conferred Title / Degree" },
  { key: "gradeHonors", label: "Grade / GPA / Honors" },
  { key: "major", label: "Major / Specialization" },
];

export default function TamperLabPage() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState("");
  const [edited, setEdited] = useState(null);
  const [original, setOriginal] = useState(null);
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetch("/api/chain", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setBlocks(d.chain.filter((b) => b.type === "ISSUANCE"));
        setLoading(false);
      });
  }, []);

  function pickBlock(indexStr) {
    setSelectedIndex(indexStr);
    setResult(null);
    const block = blocks.find((b) => String(b.index) === indexStr);
    if (block) {
      setOriginal(block);
      setEdited({ ...block.payload });
    }
  }

  async function recompute() {
    setChecking(true);
    setResult(null);
    try {
      const res = await fetch("/api/tamper-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockIndex: original.index, editedPayload: edited }),
      });
      setResult(await res.json());
    } finally {
      setChecking(false);
    }
  }

  return (
    <div>
      <Eyebrow tone="amber">Tamper-Evidence Demonstration</Eyebrow>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Tamper <span className="text-signal-amber">Lab</span>
      </h1>
      <p className="mt-3 max-w-2xl text-slate-400">
        Pick a credential already on the ledger, edit any field below, and recompute its block hash. Nothing
        here is written back to the real ledger — it only shows what would happen.
      </p>

      {loading ? (
        <div className="mt-10 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Loading issued credentials…
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <Field label="Credential to Edit">
              <select value={selectedIndex} onChange={(e) => pickBlock(e.target.value)} className={inputClass}>
                <option value="">Select a block…</option>
                {blocks.map((b) => (
                  <option key={b.index} value={b.index}>
                    Block #{b.index} — {b.payload.recipientName} ({b.payload.id})
                  </option>
                ))}
              </select>
            </Field>

            {edited && (
              <div className="mt-5 space-y-4">
                {EDITABLE_FIELDS.map(({ key, label }) => (
                  <Field key={key} label={label}>
                    <input
                      className={inputClass}
                      value={edited[key] || ""}
                      onChange={(e) => setEdited((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  </Field>
                ))}
                <Button variant="ghost" className="w-full" onClick={recompute} disabled={checking}>
                  {checking ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                  Recompute Hash &amp; Verify Chain
                </Button>
              </div>
            )}

            {!edited && (
              <div className="mt-8 flex flex-col items-center py-10 text-center text-slate-600">
                <FlaskConical size={32} />
                <p className="mt-3 text-sm">Select a credential to start editing.</p>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <MonoLabel>Result</MonoLabel>
            {!result ? (
              <div className="mt-8 flex flex-col items-center py-10 text-center text-slate-600">
                <TriangleAlert size={32} />
                <p className="mt-3 text-sm">Edit a field and recompute to see the effect on the chain.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div
                  className={`flex items-center gap-3 rounded-xl border p-4 ${
                    result.matchesOriginal
                      ? "border-signal-green/30 bg-signal-green/5"
                      : "border-signal-red/30 bg-signal-red/5"
                  }`}
                >
                  {result.matchesOriginal ? (
                    <CheckCircle2 className="text-signal-green" size={22} />
                  ) : (
                    <XCircle className="text-signal-red" size={22} />
                  )}
                  <div>
                    <h4 className="font-semibold text-slate-100">
                      {result.matchesOriginal ? "No Change Detected" : "Tamper Detected"}
                    </h4>
                    <p className="text-sm text-slate-400">
                      {result.matchesOriginal
                        ? "The edited fields still hash to the original value."
                        : `Signature is now invalid, and blocks #${result.cascadeBrokenFromIndex}–#${
                            result.chainLength - 1
                          } (${result.affectedBlockCount} total) can no longer be trusted.`}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Original Hash</span>
                    <HashChip value={result.originalHash} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Recomputed Hash</span>
                    <HashChip value={result.recomputedHash} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Signature Still Valid</span>
                    <span className={result.signatureStillValid ? "text-signal-green" : "text-signal-red"}>
                      {result.signatureStillValid ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
