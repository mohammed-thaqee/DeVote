"use client";

import { useState } from "react";
import type { JsonRpcSigner } from "ethers";
import type { VotingState } from "../utils/contract";
import { startVoting, endVoting } from "../utils/contract";

interface Props {
  state: VotingState;
  isAdmin: boolean;
  signer: JsonRpcSigner | null;
  onStateChange: () => void;
}

const STATE_CONFIG: Record<VotingState, { label: string; badgeClass: string; dot: string; desc: string }> = {
  NOT_STARTED: {
    label: "Not Started",
    badgeClass: "badge-yellow",
    dot: "var(--warning)",
    desc: "Voting has not opened yet. Waiting for the admin to start the session.",
  },
  ONGOING: {
    label: "Voting Open",
    badgeClass: "badge-green",
    dot: "var(--accent)",
    desc: "The ballot is live! Connect your wallet and cast your vote.",
  },
  ENDED: {
    label: "Voting Closed",
    badgeClass: "badge-red",
    dot: "var(--danger)",
    desc: "Voting has concluded. The winner has been determined on-chain.",
  },
};

export default function VotingStatus({ state, isAdmin, signer, onStateChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const cfg = STATE_CONFIG[state];

  async function handleStart() {
    if (!signer) return;
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      const hash = await startVoting(signer);
      setTxHash(hash);
      onStateChange();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnd() {
    if (!signer) return;
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      const hash = await endVoting(signer);
      setTxHash(hash);
      onStateChange();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ padding: 24 }}>
      {/* Status header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Ballot Status
        </div>
        <span className={`badge ${cfg.badgeClass}`}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
          {cfg.label}
        </span>
      </div>

      <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: isAdmin ? 20 : 0 }}>
        {cfg.desc}
      </p>

      {/* Admin controls */}
      {isAdmin && signer && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {state === "NOT_STARTED" && (
            <button className="btn btn-primary" onClick={handleStart} disabled={loading} style={{ fontSize: 12 }}>
              {loading ? <><span className="spinner" /> Starting…</> : "▶ Start Voting"}
            </button>
          )}
          {state === "ONGOING" && (
            <button className="btn btn-danger" onClick={handleEnd} disabled={loading} style={{ fontSize: 12 }}>
              {loading ? <><span className="spinner" /> Ending…</> : "⏹ End Voting"}
            </button>
          )}
          {state === "ENDED" && (
            <span style={{ fontSize: 12, color: "var(--text-muted)", padding: "12px 0" }}>
              Voting session complete.
            </span>
          )}
        </div>
      )}

      {/* Feedback */}
      {error && (
        <div className="toast toast-error animate-slide-up" style={{ marginTop: 12, fontSize: 12 }}>
          ⚠ {error}
        </div>
      )}
      {txHash && (
        <div className="toast toast-success animate-slide-up" style={{ marginTop: 12, fontSize: 12 }}>
          ✓ Tx confirmed:{" "}
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: 11 }}
          >
            {txHash.slice(0, 18)}…
          </a>
        </div>
      )}
    </div>
  );
}
