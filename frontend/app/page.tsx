"use client";

import Link from "next/link";

/* ─── Animated counter (pure CSS trick via inline keyframes) ─── */
const FEATURES = [
  {
    icon: "🔗",
    title: "On-Chain Votes",
    desc: "Every ballot is recorded as an immutable Ethereum transaction—publicly auditable by anyone.",
  },
  {
    icon: "🛡️",
    title: "Double-Vote Proof",
    desc: "Nullifier hashes cryptographically ensure each identity may vote exactly once.",
  },
  {
    icon: "⚡",
    title: "No Middlemen",
    desc: "Smart contract logic replaces central authorities. Rules are code—transparent and unstoppable.",
  },
  {
    icon: "🔍",
    title: "Verifiable Results",
    desc: "Tally and winner computation happen on-chain. Anyone can independently verify the outcome.",
  },
];

const STEPS = [
  { n: "01", title: "Connect Wallet", desc: "Link your MetaMask to authenticate on Sepolia testnet." },
  { n: "02", title: "Browse Candidates", desc: "View all registered candidates and live vote totals." },
  { n: "03", title: "Cast Your Vote", desc: "Select a candidate. A unique nullifier seals your choice." },
  { n: "04", title: "Verify On-Chain", desc: "Confirm your transaction on Sepolia Etherscan." },
];

export default function HomePage() {
  return (
    <main style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      {/* Grid background */}
      <div className="grid-bg" style={{ position: "fixed", inset: 0, opacity: 0.4 }} />

      {/* Ambient orbs */}
      <div className="orb orb-green" style={{ top: "-150px", left: "-150px" }} />
      <div className="orb orb-indigo" style={{ bottom: "0", right: "-100px" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* ── Nav ──────────────────────────────────────────────── */}
        <nav style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 40px", borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(12px)", background: "#0a0a0f99",
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <div className="font-display" style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.02em" }}>
            De<span style={{ color: "var(--text)" }}>Vote</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span className="badge badge-green">
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
              Sepolia Testnet
            </span>
            <Link href="/voting">
              <button className="btn btn-primary">Launch App →</button>
            </Link>
          </div>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section style={{ padding: "100px 40px 80px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div className="badge badge-indigo" style={{ marginBottom: 24 }}>
            ✦ Powered by Ethereum Smart Contracts
          </div>
          <h1 className="font-display animate-slide-up" style={{
            fontSize: "clamp(48px, 8vw, 88px)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            marginBottom: 24,
          }}>
            Voting,{" "}
            <span style={{ color: "var(--accent)" }}>reimagined</span>{" "}
            for Web3
          </h1>
          <p style={{ fontSize: 18, color: "var(--text-muted)", maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Transparent. Immutable. Trustless. Cast your vote on-chain and let
            the blockchain do the rest—no databases, no gatekeepers.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/voting">
              <button className="btn btn-primary" style={{ padding: "14px 32px", fontSize: 15 }}>
                Start Voting ↗
              </button>
            </Link>
            <a href="https://sepolia.etherscan.io" target="_blank" rel="noreferrer">
              <button className="btn btn-secondary" style={{ padding: "14px 32px", fontSize: 15 }}>
                View on Etherscan
              </button>
            </a>
          </div>

          {/* Stat pills */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 56, flexWrap: "wrap" }}>
            {[
              ["100%", "On-Chain"],
              ["0", "Central Servers"],
              ["∞", "Transparency"],
            ].map(([n, l]) => (
              <div key={l} className="card" style={{ padding: "16px 28px", textAlign: "center", minWidth: 130 }}>
                <div className="font-display" style={{ fontSize: 32, fontWeight: 800, color: "var(--accent)" }}>{n}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────── */}
        <section style={{ padding: "60px 40px", maxWidth: 1100, margin: "0 auto" }}>
          <h2 className="font-display" style={{ fontSize: 36, fontWeight: 800, textAlign: "center", marginBottom: 48, letterSpacing: "-0.03em" }}>
            Why <span style={{ color: "var(--accent-2)" }}>decentralized</span> voting?
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="card card-glow" style={{ padding: 28 }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
                <h3 className="font-display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────── */}
        <section style={{ padding: "60px 40px 100px", maxWidth: 900, margin: "0 auto" }}>
          <h2 className="font-display" style={{ fontSize: 36, fontWeight: 800, textAlign: "center", marginBottom: 48, letterSpacing: "-0.03em" }}>
            How it <span style={{ color: "var(--accent)" }}>works</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} className="card" style={{ padding: "24px 28px", display: "flex", alignItems: "flex-start", gap: 24 }}>
                <div className="font-display" style={{ fontSize: 48, fontWeight: 800, color: i % 2 === 0 ? "var(--accent)" : "var(--accent-2)", lineHeight: 1, flexShrink: 0, opacity: 0.6 }}>
                  {s.n}
                </div>
                <div>
                  <h3 className="font-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <Link href="/voting">
              <button className="btn btn-primary" style={{ padding: "16px 40px", fontSize: 16 }}>
                Open the Ballot →
              </button>
            </Link>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────── */}
        <footer style={{ borderTop: "1px solid var(--border)", padding: "24px 40px", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
          DeVote · Built with Solidity, Ethers v6 & Next.js · Sepolia Testnet
        </footer>
      </div>
    </main>
  );
}
