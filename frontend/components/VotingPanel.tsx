"use client";

import { useState } from "react";
import type { JsonRpcSigner } from "ethers";
import type { Candidate } from "../utils/contract";
import { castVote, sepoliaExplorerTx } from "../utils/contract";
import CandidateCard from "./CandidateCard";

interface Props {
  candidates: Candidate[];
  signer: JsonRpcSigner | null;
  onVoteCast: () => void;
  hasVoted: boolean;
}

type TxStatus =
  | { type: "idle" }
  | { type: "pending" }
  | { type: "success"; txHash: string; nullifier: string }
  | { type: "error"; message: string };

export default function VotingPanel({ candidates, signer, onVoteCast, hasVoted }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [status, setStatus] = useState<TxStatus>({ type: "idle" });

  const totalVotes = candidates.reduce((s, c) => s + Number(c.voteCount), 0);

  async function handleVote() {
    if (selectedId === null || !signer) return;
    setStatus({ type: "pending" });
    try {
      const { txHash, nullifier } = await castVote(signer, selectedId);
      setStatus({ type: "success", txHash, nullifier: nullifier.toString() });
      onVoteCast();
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message.includes("NullifierAlreadyUsed")
            ? "You have already voted (nullifier reused)."
            : e.message.includes("VotingNotOngoing")
            ? "Voting is not currently active."
            : e.message.slice(0, 160)
          : "Transaction failed.";
      setStatus({ type: "error", message: msg });
    }
  }

  if (hasVoted && status.type !== "success") {
    return (
      <div className="toast toast-info animate-fade-in" style={{ padding: "20px 24px" }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>✓ Vote Recorded</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Your vote has been cast and confirmed on-chain. Each wallet can vote only once.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Candidate grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {candidates.map((c) => (
          <CandidateCard
            key={c.id}
            candidate={c}
            totalVotes={totalVotes}
            selected={selectedId === c.id}
            onSelect={setSelectedId}
            votingOngoing={true}
          />
        ))}
      </div>

      {/* Cast Vote section */}
      <div
        className="card"
        style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}
      >
        <div>
          {selectedId !== null ? (
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Selected candidate</div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 18, color: "var(--accent)" }}>
                {candidates[selectedId]?.name}
              </div>
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              ← Select a candidate to vote
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {selectedId !== null && (
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedId(null)}
              style={{ fontSize: 12 }}
            >
              Clear
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleVote}
            disabled={selectedId === null || status.type === "pending" || !signer}
            style={{ minWidth: 140 }}
          >
            {status.type === "pending" ? (
              <><span className="spinner" /> Submitting…</>
            ) : (
              <>🗳️ Cast Vote</>
            )}
          </button>
        </div>
      </div>

      {/* Not connected */}
      {!signer && (
        <div className="toast toast-warning animate-slide-up" style={{ marginTop: 12 }}>
          ⚠ Connect your wallet above to cast a vote.
        </div>
      )}

      {/* Transaction feedback */}
      {status.type === "success" && (
        <div className="toast toast-success animate-slide-up" style={{ marginTop: 16, flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>🎉 Vote cast successfully!</div>
          <div style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 4 }}>
            <span>
              Tx:{" "}
              <a
                href={sepoliaExplorerTx(status.txHash)}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}
              >
                {status.txHash.slice(0, 22)}…
              </a>
            </span>
            <span style={{ color: "var(--text-muted)" }}>
              Nullifier: <code style={{ color: "var(--accent-2)", fontSize: 11 }}>{status.nullifier.slice(0, 24)}…</code>
            </span>
          </div>
        </div>
      )}

      {status.type === "error" && (
        <div className="toast toast-error animate-slide-up" style={{ marginTop: 16 }}>
          ⚠ {status.message}
        </div>
      )}
    </div>
  );
}
