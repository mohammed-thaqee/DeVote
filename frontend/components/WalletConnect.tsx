"use client";

import { useState } from "react";
import { connectWallet, truncateAddress, sepoliaExplorerAddress } from "../utils/contract";
import type { BrowserProvider, JsonRpcSigner } from "ethers";

interface Props {
  onConnected: (provider: BrowserProvider, signer: JsonRpcSigner, address: string) => void;
  address: string | null;
  isAdmin: boolean;
}

export default function WalletConnect({ onConnected, address, isAdmin }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    try {
      const { provider, signer, address: addr } = await connectWallet();
      onConnected(provider, signer, addr);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Connection failed.");
    } finally {
      setLoading(false);
    }
  }

  if (address) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {isAdmin && (
          <span className="badge badge-yellow">👑 Admin</span>
        )}
        <a
          href={sepoliaExplorerAddress(address)}
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: "none" }}
        >
          <span className="badge badge-green" style={{ cursor: "pointer" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "pulse-orb 2s infinite" }} />
            {truncateAddress(address)}
            <span style={{ fontSize: 9, opacity: 0.7 }}>↗</span>
          </span>
        </a>
      </div>
    );
  }

  return (
    <div>
      <button
        className="btn btn-primary"
        onClick={handleConnect}
        disabled={loading}
        style={{ minWidth: 160 }}
      >
        {loading ? (
          <><span className="spinner" /> Connecting…</>
        ) : (
          <>🦊 Connect Wallet</>
        )}
      </button>
      {error && (
        <div className="toast toast-error animate-slide-up" style={{ marginTop: 10, maxWidth: 360 }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
