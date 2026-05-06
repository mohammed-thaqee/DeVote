"use client";

import type { Winner } from "../utils/contract";

interface Props {
  winner: Winner;
  totalVotes: number;
}

export default function WinnerBanner({ winner, totalVotes }: Props) {
  const pct = totalVotes > 0 ? ((Number(winner.votes) / totalVotes) * 100).toFixed(1) : "0.0";

  return (
    <div
      className="card animate-slide-up"
      style={{
        padding: 32,
        border: "1px solid var(--warning)",
        background: "linear-gradient(135deg, #fbbf2411 0%, #0a0a0f 60%)",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, #fbbf2411 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>👑</div>
        <div
          style={{
            fontSize: 11,
            color: "var(--warning)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Election Winner
        </div>
        <h2
          className="font-display"
          style={{
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--text)",
            marginBottom: 16,
          }}
        >
          {winner.name}
        </h2>

        <div
          style={{
            display: "flex",
            gap: 24,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              className="font-display"
              style={{ fontSize: 36, fontWeight: 800, color: "var(--warning)" }}
            >
              {winner.votes.toString()}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Votes Received
            </div>
          </div>
          <div>
            <div
              className="font-display"
              style={{ fontSize: 36, fontWeight: 800, color: "var(--warning)" }}
            >
              {pct}%
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              of Total Votes
            </div>
          </div>
        </div>

        <div
          className="badge badge-yellow"
          style={{ marginTop: 20, display: "inline-flex" }}
        >
          ✓ Verified On-Chain · Sepolia Testnet
        </div>
      </div>
    </div>
  );
}
