"use client";

import { CheckCircle2, XCircle, ShieldAlert, ShieldX, HelpCircle } from "lucide-react";
import { Card, Badge, MonoLabel, HashChip } from "./ui";

const STATUS_META = {
  VALID: {
    icon: CheckCircle2,
    tone: "green",
    title: "Credential Valid",
    text: "This credential is authentic, unaltered, and currently in good standing on the ledger.",
  },
  REVOKED: {
    icon: ShieldAlert,
    tone: "amber",
    title: "Credential Revoked",
    text: "This credential was authentically issued, but the issuing institution has since revoked it.",
  },
  TAMPERED: {
    icon: ShieldX,
    tone: "red",
    title: "Verification Failed — Tampered",
    text: "The record on the ledger does not match what was originally signed. Treat this credential as untrustworthy.",
  },
};

function CheckRow({ label, ok, neutral }) {
  const Icon = neutral ? HelpCircle : ok ? CheckCircle2 : XCircle;
  const color = neutral ? "text-slate-500" : ok ? "text-signal-green" : "text-signal-red";
  return (
    <div className="flex items-center justify-between border-b border-ink-700/70 py-2.5 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`flex items-center gap-1.5 text-sm font-semibold ${color}`}>
        <Icon size={16} />
        {neutral ? "N/A" : ok ? "Pass" : "Fail"}
      </span>
    </div>
  );
}

export default function VerificationResult({ result }) {
  if (!result) return null;

  if (!result.found) {
    return (
      <Card className="mt-6 border-signal-red/30 p-6">
        <div className="flex items-start gap-3">
          <ShieldX className="mt-0.5 shrink-0 text-signal-red" size={22} />
          <div>
            <h3 className="font-semibold text-slate-100">No Match Found</h3>
            <p className="mt-1 text-sm text-slate-400">{result.message}</p>
          </div>
        </div>
      </Card>
    );
  }

  const meta = STATUS_META[result.overallStatus] || STATUS_META.TAMPERED;
  const Icon = meta.icon;
  const c = result.credential;
  const claims = c.claims && typeof c.claims === "object" ? Object.entries(c.claims) : [];

  return (
    <Card className="mt-6 overflow-hidden p-0">
      <div
        className={`flex items-center gap-3 border-b border-ink-700 px-6 py-4 ${
          meta.tone === "green"
            ? "bg-signal-green/10"
            : meta.tone === "amber"
            ? "bg-signal-amber/10"
            : "bg-signal-red/10"
        }`}
      >
        <Icon
          size={26}
          className={
            meta.tone === "green" ? "text-signal-green" : meta.tone === "amber" ? "text-signal-amber" : "text-signal-red"
          }
        />
        <div>
          <h3 className="font-semibold text-slate-100">{meta.title}</h3>
          <p className="text-sm text-slate-400">{meta.text}</p>
        </div>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-[1.3fr_1fr]">
        <div>
          <MonoLabel>Credential Details</MonoLabel>
          <dl className="mt-3 space-y-2.5 text-sm">
            <Row label="Recipient" value={c.recipientName} />
            <Row label="ID Number" value={c.recipientIdNumber} />
            <Row label="Issuing Institution" value={result.institution?.name} />
            <Row label="Credential" value={c.title} />
            {c.major && <Row label="Major / Specialization" value={c.major} />}
            {c.gradeHonors && <Row label="Grade / GPA" value={c.gradeHonors} />}
            <Row label="Issuance Date" value={c.issuanceDate} />
            {c.expiryDate && <Row label="Expiry Date" value={c.expiryDate} />}
            {claims.map(([k, v]) => (
              <Row key={k} label={k} value={String(v)} />
            ))}
          </dl>
        </div>

        <div>
          <MonoLabel>Cryptographic Checks</MonoLabel>
          <div className="mt-3">
            <CheckRow label="Issuer signature valid" ok={result.checks.signatureValid} />
            <CheckRow label="Hash-chain intact" ok={result.checks.chainIntact} />
            <CheckRow
              label="Document hash match"
              ok={result.checks.documentHashMatch === true}
              neutral={result.checks.documentHashMatch === null}
            />
            <CheckRow label="Not revoked" ok={!result.checks.revoked} />
          </div>

          {result.checks.revoked && (
            <p className="mt-3 rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-3 text-xs text-signal-amber">
              Revoked {result.checks.revokedAt?.slice(0, 10)} — reason: “{result.checks.revocationReason}”
            </p>
          )}

          <MonoLabel className="mt-5 block">Ledger Anchor</MonoLabel>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Block</span>
              <Badge tone="blue">#{result.block.index}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Block Hash</span>
              <HashChip value={result.block.hash} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Prev Hash</span>
              <HashChip value={result.block.prevHash} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-200">{value}</dd>
    </div>
  );
}
