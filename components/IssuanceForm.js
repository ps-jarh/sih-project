"use client";

import { useState } from "react";
import { ShieldCheck, UploadCloud, Plus, X, Loader2, CheckCircle2, QrCode as QrIcon, KeyRound } from "lucide-react";
import { Card, Field, Button, inputClass, MonoLabel, HashChip, Badge } from "./ui";
import { sha256HexOfFile } from "@/lib/clientHash";

const CREDENTIAL_TYPES = ["Bachelor Degree", "Master Degree", "Doctoral Degree", "Diploma", "Professional Certificate"];

const PRESETS = {
  "BS CS": { credentialType: "Bachelor Degree", title: "Bachelor of Science in Computer Science" },
  "MS AI": { credentialType: "Master Degree", title: "Master of Science in Artificial Intelligence" },
  "Cloud Cert": { credentialType: "Professional Certificate", title: "Professional Certificate in Cloud Architecture" },
};

const EMPTY_FORM = {
  recipientName: "",
  recipientIdNumber: "",
  recipientEmail: "",
  credentialType: "Bachelor Degree",
  title: "",
  major: "",
  gradeHonors: "",
  issuanceDate: new Date().toISOString().slice(0, 10),
  expiryDate: "",
};

export default function IssuanceForm({ institution }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [claims, setClaims] = useState([]);
  const [claimKey, setClaimKey] = useState("");
  const [claimValue, setClaimValue] = useState("");
  const [file, setFile] = useState(null);
  const [fileHash, setFileHash] = useState(null);
  const [hashing, setHashing] = useState(false);
  const [signingKey, setSigningKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [issued, setIssued] = useState(null);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function applyPreset(preset) {
    setForm((f) => ({ ...f, ...PRESETS[preset] }));
  }

  async function handleAttach(f) {
    setFile(f);
    setHashing(true);
    const hash = await sha256HexOfFile(f);
    setFileHash(hash);
    setHashing(false);
  }

  function addClaim() {
    if (!claimKey.trim() || !claimValue.trim()) return;
    setClaims((c) => [...c, { key: claimKey.trim(), value: claimValue.trim() }]);
    setClaimKey("");
    setClaimValue("");
  }

  function removeClaim(idx) {
    setClaims((c) => c.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    setError(null);
    if (!form.recipientName || !form.recipientIdNumber || !form.title) {
      return setError("Recipient name, ID, and conferred title are required.");
    }
    if (!signingKey.trim()) {
      return setError("This institution's private key is required to authorize the signature.");
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/credentials/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          claims: Object.fromEntries(claims.map((c) => [c.key, c.value])),
          documentHash: fileHash,
          documentName: file?.name || null,
          signingPrivateKey: signingKey.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Issuance failed.");
      } else {
        setIssued(data);
        setSigningKey("");
      }
    } catch {
      setError("Could not reach the issuance service.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setIssued(null);
    setForm(EMPTY_FORM);
    setClaims([]);
    setFile(null);
    setFileHash(null);
    setSigningKey("");
  }

  if (issued) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 rounded-xl border border-signal-green/30 bg-signal-green/10 p-4">
          <CheckCircle2 className="text-signal-green" size={22} />
          <div>
            <h3 className="font-semibold text-slate-100">Credential Signed &amp; Anchored</h3>
            <p className="text-sm text-slate-400">
              Block #{issued.block.index} written to the hash-chain by {issued.institution.name}.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto]">
          <div className="space-y-2.5 text-sm">
            <Row label="Credential ID" value={issued.credential.id} mono />
            <Row label="Recipient" value={issued.credential.recipientName} />
            <Row label="Credential" value={issued.credential.title} />
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Block Hash</span>
              <HashChip value={issued.block.hash} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Prev Hash</span>
              <HashChip value={issued.block.prevHash} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Signature (ECDSA)</span>
              <HashChip value={issued.block.signature} />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 rounded-xl border border-ink-600 bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={issued.qrDataUrl} alt="Verification QR code" className="h-40 w-40" />
            <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-ink-700">
              <QrIcon size={11} /> Scan to verify
            </span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="primary" onClick={resetForm}>
            Issue Another Credential
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Issue New Verifiable Credential</h2>
          <p className="text-sm text-slate-500">Fill in academic details and bind the original document hash.</p>
        </div>
        <div className="flex gap-1.5">
          {Object.keys(PRESETS).map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className="rounded-md border border-ink-600 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:border-signal-blue/50 hover:text-signal-blue"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Recipient Full Name" required>
          <input
            className={inputClass}
            placeholder="e.g. Jordan Alexander Taylor"
            value={form.recipientName}
            onChange={(e) => setField("recipientName", e.target.value)}
          />
        </Field>
        <Field label="Recipient Student / Employee ID" required>
          <input
            className={inputClass}
            placeholder="e.g. SU-994021"
            value={form.recipientIdNumber}
            onChange={(e) => setField("recipientIdNumber", e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field label="Recipient Email" hint="Used for verifiable claim delivery, not shown to public verifiers.">
          <input
            type="email"
            className={inputClass}
            placeholder="e.g. jordan.taylor@alumni.stanford.edu"
            value={form.recipientEmail}
            onChange={(e) => setField("recipientEmail", e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Credential Type">
          <select
            className={inputClass}
            value={form.credentialType}
            onChange={(e) => setField("credentialType", e.target.value)}
          >
            {CREDENTIAL_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Conferred Title / Degree" required>
          <input
            className={inputClass}
            placeholder="e.g. Bachelor of Science in Computer Science"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Major / Specialization">
          <input
            className={inputClass}
            placeholder="e.g. Systems & Autonomous Robotics"
            value={form.major}
            onChange={(e) => setField("major", e.target.value)}
          />
        </Field>
        <Field label="Grade / GPA / Honors">
          <input
            className={inputClass}
            placeholder="e.g. 3.96 / 4.00 (High Honors)"
            value={form.gradeHonors}
            onChange={(e) => setField("gradeHonors", e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Issuance Date">
          <input
            type="date"
            className={inputClass}
            value={form.issuanceDate}
            onChange={(e) => setField("issuanceDate", e.target.value)}
          />
        </Field>
        <Field label="Expiry Date (Optional)">
          <input
            type="date"
            className={inputClass}
            value={form.expiryDate}
            onChange={(e) => setField("expiryDate", e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-6">
        <MonoLabel>Original Certificate File Attachment</MonoLabel>
        <p className="mt-1 text-xs text-slate-500">
          Calculates a client-side SHA-256 hash. Enables verifiers to drop the same file later to confirm
          authenticity.
        </p>
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-600 px-4 py-6 text-sm text-slate-400 hover:border-ink-500">
          <input
            type="file"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleAttach(e.target.files[0])}
          />
          <UploadCloud size={16} />
          {file ? file.name : "Click to attach original PDF / document"}
        </label>
        {hashing && <p className="mt-2 text-xs text-slate-500">Hashing…</p>}
        {fileHash && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-slate-500">SHA-256:</span>
            <HashChip value={fileHash} />
          </div>
        )}
      </div>

      <div className="mt-6">
        <MonoLabel>Additional Institutional Claims / Attributes</MonoLabel>
        <div className="mt-3 flex flex-wrap gap-2">
          {claims.map((c, idx) => (
            <Badge key={idx} tone="slate">
              {c.key}: <span className="font-normal normal-case">{c.value}</span>
              <button onClick={() => removeClaim(idx)} className="ml-1 text-slate-500 hover:text-signal-red">
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className={inputClass}
            placeholder="Key (e.g. Dean Seal)"
            value={claimKey}
            onChange={(e) => setClaimKey(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Value (e.g. Approved by Registrar)"
            value={claimValue}
            onChange={(e) => setClaimValue(e.target.value)}
          />
          <Button variant="ghost" onClick={addClaim} className="shrink-0">
            <Plus size={15} />
            Add
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-signal-blue/30 bg-signal-blue/5 p-4">
        <div className="flex items-center gap-2">
          <KeyRound size={15} className="text-signal-blue" />
          <MonoLabel className="text-signal-blue">Authorize with Institution Private Key</MonoLabel>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Required to sign this record. Paste {institution?.shortCode || "the institution's"} EC private key —
          reveal it from the &ldquo;Cryptographic Keys &amp; Authority&rdquo; panel if you don&rsquo;t have it
          copied. It&rsquo;s checked against the institution&rsquo;s registered public key and never stored.
        </p>
        <textarea
          value={signingKey}
          onChange={(e) => setSigningKey(e.target.value)}
          placeholder="-----BEGIN PRIVATE KEY-----&#10;…&#10;-----END PRIVATE KEY-----"
          rows={4}
          className="mt-3 w-full resize-none rounded-lg border border-ink-600 bg-ink-900 p-2.5 font-mono text-[11px] text-slate-300 placeholder:text-slate-700 outline-none focus:border-signal-blue/60 focus:ring-1 focus:ring-signal-blue/40"
        />
      </div>

      {error && (
        <p className="mt-5 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-signal-red">
          {error}
        </p>
      )}

      <Button variant="primary" className="mt-6 w-full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
        Sign with {institution?.shortCode || "…"} Private Key &amp; Anchor to Blockchain
      </Button>
    </Card>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right font-medium text-slate-100 ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
