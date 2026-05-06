"use client";

import type { Candidate } from "../utils/contract";

interface Props {
  candidate: Candidate;
  totalVotes: number;
  selected: boolean;
  onSelect: (id: number) => void;
  votingOngoing: boolean;
  isWinner?: boolean;
}

const AVATAR_COLORS = [
  ["#6ee7b7", "#34d399"],
  ["#818cf8", "#6366f1"],
  ["#f9a8d4", "#ec4899"],
  ["#fbbf24", "#f59e0b"],
  ["#67e8f9", "#22d3ee"],
];

export default function CandidateCard({
  candidate,
  totalVotes,
  selected,
  onSelect,
  votingOngoing,
  isWinner = false,
}: Props) {
  const pct = totalVotes > 0 ? (Number(candidate.voteCount) / totalVotes) * 100 : 0;
  const colors = AVATAR_COLORS[candidate.id % AVATAR_COLORS.length];
  const initials = candidate.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`card candidate-card${selected ? " selected" : ""}`}
      onClick={() => votingOngoing && onSelect(candidate.id)}
      style={{
        padding: 24,
        cursor: votingOngoing ? "pointer" : "default",
        opacity: !votingOngoing && !isWinner ? 0.85 : 1,
      }}
    >
      {/* Winner crown */}
      {isWinner && (
        <div
          style={{
            position: "absolute",
            top: -1,
            right: 16,
            background: "var(--warning)",
            color: "#0a0a0f",
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: "0 0 8px 8px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          👑 Winner
        </div>
      )}

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        {/* Avatar */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 18,
            color: "#0a0a0f",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>

        <div style={{ flex: 1 }}>
          <div
            className="font-display"
            style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}
          >
            {candidate.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Candidate #{candidate.id + 1}
          </div>
        </div>

        {/* Vote count badge */}
        <div
          style={{
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          <div
            className="font-display"
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: selected || isWinner ? "var(--accent)" : "var(--text)",
              lineHeight: 1,
            }}
          >
            {candidate.voteCount.toString()}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
            VOTES
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "var(--text-muted)",
            marginBottom: 6,
          }}
        >
          <span>Share of votes</span>
          <span style={{ color: selected ? "var(--accent)" : "var(--text-muted)", fontWeight: 700 }}>
            {pct.toFixed(1)}%
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${pct}%`,
              background: selected || isWinner
                ? `linear-gradient(90deg, ${colors[1]}, ${colors[0]})`
                : "linear-gradient(90deg, var(--accent-2), var(--accent))",
            }}
          />
        </div>
      </div>

      {/* Select indicator */}
      {votingOngoing && (
        <div
          style={{
            marginTop: 16,
            fontSize: 12,
            color: selected ? "var(--accent)" : "var(--text-muted)",
            fontWeight: selected ? 700 : 400,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              border: `2px solid ${selected ? "var(--accent)" : "var(--border)"}`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: selected ? "var(--accent)" : "transparent",
              flexShrink: 0,
              transition: "all 0.15s",
            }}
          >
            {selected && (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 4L3 5.5L6.5 2" stroke="#0a0a0f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          {selected ? "Selected" : "Click to select"}
        </div>
      )}
    </div>
  );
}
