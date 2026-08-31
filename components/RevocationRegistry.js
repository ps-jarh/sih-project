"use client";

import { useEffect, useState } from "react";
import { Ban, Loader2, ShieldAlert, KeyRound } from "lucide-react";
import { Card, Field, Button, inputClass, Badge, MonoLabel } from "./ui";

export default function RevocationRegistry({ institution }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickedId, setPickedId] = useState("");
  const [reason, setReason] = useState("");
  const [signingKey, setSigningKey] = useState("");
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

  // An institution can only revoke what it originally issued.
  const ownCredentials = credentials.filter((c) => c.institutionId === institution?.id);
  const revocable = ownCredentials.filter((c) => !c.revoked);
  const revoked = ownCredentials.filter((c) => c.revoked);
  const picked = ownCredentials.find((c) => c.id === pickedId);

  async function handleRevoke() {
    setError(null);
    setNotice(null);
    if (!picked) return setError("Pick a credential to revoke.");
    if (!reason.trim()) return setError("A revocation reason is required for the audit trail.");
    if (!signingKey.trim()) {
      return setError("This institution's private key is required to authorize the revocation.");
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialId: picked.id,
          reason: reason.trim(),
          signingPrivateKey: signingKey.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setNotice(`Credential ${picked.id} revoked and anchored as block #${data.block.index}.`);
        setPickedId("");
        setReason("");
        setSigningKey("");
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
        credential, so the revocation itself is just as tamper-evident as the issuance was. Only{" "}
        {institution?.name || "the signed-in institution"} can revoke credentials it issued.
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
                  {c.id} — {c.recipientName}
                </option>
              ))}
            </select>
            {revocable.length === 0 && (
              <p className="mt-1.5 text-xs text-slate-600">
                {institution?.name || "This institution"} has no active credentials to revoke.
              </p>
            )}
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

          <div className="mt-5 rounded-xl border border-signal-red/30 bg-signal-red/5 p-4">
            <div className="flex items-center gap-2">
              <KeyRound size={15} className="text-signal-red" />
              <MonoLabel className="text-signal-red">Authorize with Institution Private Key</MonoLabel>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Revocation is anchored to the ledger just like issuance — it needs the same signature.
            </p>
            <textarea
              value={signingKey}
              onChange={(e) => setSigningKey(e.target.value)}
              placeholder="-----BEGIN PRIVATE KEY-----&#10;…&#10;-----END PRIVATE KEY-----"
              rows={3}
              className="mt-3 w-full resize-none rounded-lg border border-ink-600 bg-ink-900 p-2.5 font-mono text-[11px] text-slate-300 placeholder:text-slate-700 outline-none focus:border-signal-red/60 focus:ring-1 focus:ring-signal-red/40"
            />
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
              <MonoLabel>Revoked by {institution?.shortCode}</MonoLabel>
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
