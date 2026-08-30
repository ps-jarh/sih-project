"use client";

import { useRef, useState } from "react";
import { UploadCloud, Search, QrCode, FileCheck2, Loader2, GraduationCap, Landmark, TriangleAlert } from "lucide-react";
import { Card, Eyebrow, Button, inputClass } from "@/components/ui";
import VerificationResult from "@/components/VerificationResult";
import { sha256HexOfBuffer, sha256HexOfFile } from "@/lib/clientHash";
import { decodeQRFromFile } from "@/lib/clientQr";

const TABS = [
  { id: "file", label: "Verify Document File", icon: UploadCloud },
  { id: "search", label: "Search by ID / Hash", icon: Search },
  { id: "qr", label: "QR Code Lookup", icon: QrCode },
];

const TEST_FILES = [
  { label: "Stanford BS (Alice Chen)", icon: GraduationCap, file: "/demo-files/stanford-bs-alice-chen.txt", tamper: false },
  { label: "MIT MEng (David Miller)", icon: Landmark, file: "/demo-files/mit-meng-david-miller.txt", tamper: false },
  { label: "Tampered File (Altered 1-byte)", icon: TriangleAlert, file: "/demo-files/stanford-bs-alice-chen.txt", tamper: true, tone: "amber" },
];

export default function PublicVerifierPage() {
  const [tab, setTab] = useState("file");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [query, setQuery] = useState("");
  const [fileName, setFileName] = useState(null);
  const fileInputRef = useRef(null);
  const qrInputRef = useRef(null);

  async function runVerify(payloadQuery) {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: payloadQuery }),
      });
      setResult(await res.json());
    } catch {
      setResult({ found: false, message: "Could not reach the verification service. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function handleFile(file) {
    setFileName(file.name);
    const hash = await sha256HexOfFile(file);
    runVerify(hash);
  }

  async function handleTestFile({ file, tamper, label }) {
    setFileName(tamper ? "tampered-copy.txt (1 byte altered)" : label);
    const res = await fetch(file);
    const buffer = await res.arrayBuffer();
    let bytes = new Uint8Array(buffer);
    if (tamper) {
      bytes = new Uint8Array(bytes);
      bytes[10] = bytes[10] ^ 0xff; // flip one byte — enough to change the whole digest
    }
    const hash = await sha256HexOfBuffer(bytes.buffer);
    runVerify(hash);
  }

  async function handleQrFile(file) {
    setLoading(true);
    setResult(null);
    const decoded = await decodeQRFromFile(file).catch(() => null);
    if (!decoded) {
      setLoading(false);
      setResult({ found: false, message: "Could not read a QR code in that image. Try a clearer, tighter crop of the code." });
      return;
    }
    runVerify(decoded);
  }

  return (
    <div>
      <div className="mb-8 flex flex-col items-center text-center">
        <Eyebrow>Hash-Chain &amp; Signature Verification</Eyebrow>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Public Credential <span className="text-signal-blue">Validator</span>
        </h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          Instantly validate digital credentials, academic degrees, and certificates directly against the
          ledger — without contacting the issuing institution.
        </p>
      </div>

      <Card className="p-2">
        <div className="flex flex-wrap gap-1 border-b border-ink-700 px-2 pb-2 pt-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                setResult(null);
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                tab === id ? "bg-ink-700 text-signal-blue" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "file" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition ${
                dragOver ? "border-signal-blue bg-signal-blue/5" : "border-ink-600 hover:border-ink-500"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-signal-blue/40 bg-signal-blue/10">
                <FileCheck2 className="text-signal-blue" size={26} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-100">
                Drop Original Certificate File
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Your browser calculates the cryptographic SHA-256 digest in real time. No file contents are
                sent to a server — only the fingerprint is matched against the ledger.
              </p>
              <Button
                variant="primary"
                className="mx-auto mt-5"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <UploadCloud size={16} />
                Select File From Device
              </Button>
              {fileName && <p className="mt-4 font-mono text-xs text-slate-500">Last checked: {fileName}</p>}
            </div>
          )}

          {tab === "search" && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && query.trim() && runVerify(query.trim())}
                placeholder="e.g. CRED-9F3A2C1B or a 64-character SHA-256 hash"
                className={inputClass}
              />
              <Button
                variant="primary"
                disabled={!query.trim()}
                onClick={() => runVerify(query.trim())}
                className="shrink-0"
              >
                <Search size={16} />
                Verify
              </Button>
            </div>
          )}

          {tab === "qr" && (
            <div
              onClick={() => qrInputRef.current?.click()}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-ink-600 p-12 text-center transition hover:border-ink-500"
            >
              <input
                ref={qrInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleQrFile(e.target.files[0])}
              />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-signal-blue/40 bg-signal-blue/10">
                <QrCode className="text-signal-blue" size={26} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-100">Upload a QR Code Image</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Decoded entirely in your browser using jsQR, then matched against the ledger — the same code
                printed on an issued credential.
              </p>
              <Button variant="primary" className="mx-auto mt-5" onClick={(e) => e.stopPropagation()}>
                <QrCode size={16} />
                Select QR Image
              </Button>
            </div>
          )}
        </div>

        <div className="border-t border-ink-700 px-6 py-5">
          <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            ✦ One-Click Test Files
          </p>
          <div className="flex flex-wrap gap-2">
            {TEST_FILES.map((t) => (
              <button
                key={t.label}
                onClick={() => handleTestFile(t)}
                className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition ${
                  t.tone === "amber"
                    ? "border-signal-amber/40 text-signal-amber hover:bg-signal-amber/10"
                    : "border-ink-600 text-slate-300 hover:bg-ink-700"
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          Checking ledger…
        </div>
      )}

      <VerificationResult result={result} />
    </div>
  );
}
