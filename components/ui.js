export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-ink-600 bg-ink-850/80 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, tone = "blue" }) {
  const tones = {
    blue: "border-signal-blue/40 text-signal-blue bg-signal-blue/10",
    green: "border-signal-green/40 text-signal-green bg-signal-green/10",
    amber: "border-signal-amber/40 text-signal-amber bg-signal-amber/10",
    red: "border-signal-red/40 text-signal-red bg-signal-red/10",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Badge({ children, tone = "blue" }) {
  const tones = {
    blue: "border-signal-blue/40 text-signal-blue bg-signal-blue/10",
    green: "border-signal-green/40 text-signal-green bg-signal-green/10",
    amber: "border-signal-amber/40 text-signal-amber bg-signal-amber/10",
    red: "border-signal-red/40 text-signal-red bg-signal-red/10",
    slate: "border-ink-500 text-slate-300 bg-ink-700/60",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary:
      "bg-signal-blue text-white hover:bg-signal-blue/90 shadow-glow disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none",
    ghost:
      "border border-ink-500 text-slate-200 hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed",
    danger:
      "border border-signal-red/50 text-signal-red hover:bg-signal-red/10 disabled:opacity-40 disabled:cursor-not-allowed",
    subtle: "text-slate-400 hover:text-slate-100",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function MonoLabel({ children, className = "" }) {
  return (
    <span className={`font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 ${className}`}>
      {children}
    </span>
  );
}

export function HashChip({ value, length = 10 }) {
  if (!value) return <span className="font-mono text-xs text-slate-600">—</span>;
  const short = `${value.slice(0, length)}…${value.slice(-6)}`;
  return (
    <button
      type="button"
      title={value}
      onClick={() => navigator.clipboard?.writeText(value)}
      className="group inline-flex items-center gap-1 rounded border border-ink-600 bg-ink-900 px-2 py-1 font-mono text-xs text-slate-300 hover:border-signal-blue/50 hover:text-signal-blue"
    >
      {short}
    </button>
  );
}

export function Field({ label, required, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">
        {label} {required && <span className="text-signal-red">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-signal-blue/60 focus:ring-1 focus:ring-signal-blue/40";
