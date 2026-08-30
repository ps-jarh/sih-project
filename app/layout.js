import "./globals.css";
import NavBar from "@/components/NavBar";
import StatusFooter from "@/components/StatusFooter";

export const metadata = {
  title: "TrustChain Ledger — Credential Verification",
  description:
    "Blockchain-backed academic credential issuance and verification — SIH PS-03 hash-chain demo.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-950 text-slate-200 antialiased">
        <div className="pointer-events-none fixed inset-0 bg-grid bg-grid opacity-[0.35]" />
        <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-gradient-to-b from-signal-blue/10 via-transparent to-transparent" />
        <div className="relative flex min-h-screen flex-col">
          <NavBar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-20 pt-10">{children}</main>
          <StatusFooter />
        </div>
      </body>
    </html>
  );
}
