"use client";

import { useState } from "react";
import { KeyRound, Eye, EyeOff, Copy, Loader2, ShieldAlert, Check } from "lucide-react";
import { Card, Button, MonoLabel } from "./ui";

export default function KeyVault({ institution }) {
  const [key, setKey] = useState(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  async function reveal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/institutions/reveal-key", { method: "POST" });
      const data = await res.json();
      if (!res.ok) setError(data.error);
      else {
        setKey(data.privateKey);
        setVisible(true);
      }
    } catch {
      setError("Could not reach the key vault.");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!key) return;
    navigator.clipboard?.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <KeyRound size={15} className="text-signal-cyan" />
        <MonoLabel>Cryptographic Keys &amp; Authority</MonoLabel>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {institution?.name}&rsquo;s private signing key. Paste it into the &ldquo;Authorize with Private
        Key&rdquo; field when issuing or revoking a credential.
      </p>

      {!key ? (
        <Button variant="ghost" className="mt-4 w-full" onClick={reveal} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
          Reveal Private Key
        </Button>
      ) : (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wide text-slate-500">
              EC Private Key (secp256k1)
            </span>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="text-slate-400 hover:text-slate-200"
                title={visible ? "Hide" : "Show"}
              >
                {visible ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button
                type="button"
                onClick={copy}
                className="text-slate-400 hover:text-signal-blue"
                title="Copy"
              >
                {copied ? <Check size={13} className="text-signal-green" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={visible ? key : key.replace(/[^\n-]/g, "•")}
            rows={6}
            className="mt-2 w-full resize-none rounded-lg border border-ink-600 bg-ink-900 p-2.5 font-mono text-[10px] leading-relaxed text-slate-300 outline-none"
          />
        </div>
      )}

      {error && <p className="mt-2 text-xs text-signal-red">{error}</p>}

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-signal-amber/30 bg-signal-amber/5 p-2.5">
        <ShieldAlert size={12} className="mt-0.5 shrink-0 text-signal-amber" />
        <p className="text-[11px] leading-relaxed text-slate-500">
          Demo-only convenience. In production this key would never leave institutional custody (an
          HSM or local keystore) — the server wouldn&rsquo;t hold or serve a copy at all.
        </p>
      </div>
    </Card>
  );
}
