"use client";

import { useEffect, useState } from "react";
import { Ban, Loader2, ShieldAlert } from "lucide-react";
import { Card, Field, Button, inputClass, Badge, MonoLabel } from "./ui";

export default function RevocationRegistry({ selectedId }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickedId, setPickedId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/credentials", { cache: "no-store" });
    const data = await res.json();
    setCredentials(data.credentials);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const revocable = credentials.filter((c) => !c.revoked);
  const revoked = credentials.filter((c) => c.revoked);
  const picked = credentials.find((c) => c.id === pickedId);

  async function handleRevoke() {
    setError(null);
    setNotice(null);
    if (!picked) return setError("Pick a credential to revoke.");
    if (!reason.trim()) return setError("A revocation reason is required for the audit trail.");
    if (picked.institutionId !== selectedId) {
      return setError(
        `Only ${picked.institutionName} can revoke this credential. Switch the active institution above.`
      );
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId: picked.id, reason: reason.trim(), institutionId: selectedId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setNotice(`Credential ${picked.id} revoked and anchored as block #${data.block.index}.`);
        setPickedId("");
        setReason("");
        load();
      }
    } catch {
      setError("Could not reach the revocation service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center gap-2">
        <Ban size={17} className="text-signal-red" />
        <h2 className="text-lg font-semibold text-slate-100">Revocation Registry</h2>
        <Badge tone="slate">{revoked.length} revoked</Badge>
      </div>
      <p className="mb-5 text-sm text-slate-500">
        Revoking never deletes ledger history — it appends a new, signed block referencing the original
        credential, so the revocation itself is just as tamper-evident as the issuance was.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={15} className="animate-spin" /> Loading credentials…
        </div>
      ) : (
        <>
          <Field label="Credential to Revoke">
            <select value={pickedId} onChange={(e) => setPickedId(e.target.value)} className={inputClass}>
              <option value="">Select an active credential…</option>
              {revocable.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.recipientName} ({c.institutionShortCode})
                </option>
              ))}
            </select>
          </Field>

          <div className="mt-4">
            <Field label="Reason" required>
              <input
                className={inputClass}
                placeholder="e.g. Issued in error — duplicate record"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
          </div>

          {error && (
            <p className="mt-4 flex items-center gap-2 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-signal-red">
              <ShieldAlert size={14} /> {error}
            </p>
          )}
          {notice && (
            <p className="mt-4 rounded-lg border border-signal-green/30 bg-signal-green/10 p-3 text-sm text-signal-green">
              {notice}
            </p>
          )}

          <Button variant="danger" className="mt-4" onClick={handleRevoke} disabled={submitting}>
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />}
            Revoke Credential
          </Button>

          {revoked.length > 0 && (
            <div className="mt-8">
              <MonoLabel>Revoked Credentials</MonoLabel>
              <div className="mt-3 divide-y divide-ink-700 rounded-lg border border-ink-700">
                {revoked.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-200">
                        {c.recipientName} · {c.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {c.id} — “{c.revocation?.reason}”
                      </p>
                    </div>
                    <Badge tone="red">Revoked</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
