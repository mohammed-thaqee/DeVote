"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { BrowserProvider, JsonRpcSigner } from "ethers";
import { ethers } from "ethers";
import {
  fetchCandidates,
  fetchVotingState,
  fetchWinner,
  fetchAdmin,
  CONTRACT_ADDRESS,
  sepoliaExplorerAddress,
} from "../../utils/contract";
import type { Candidate, VotingState, Winner } from "../../utils/contract";
import WalletConnect from "../../components/WalletConnect";
import VotingStatus from "../../components/VotingStatus";
import VotingPanel from "../../components/VotingPanel";
import CandidateCard from "../../components/CandidateCard";
import WinnerBanner from "../../components/WinnerBanner";

export default function VotingPage() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votingState, setVotingState] = useState<VotingState>("NOT_STARTED");
  const [winner, setWinner] = useState<Winner | null>(null);
  const [adminAddress, setAdminAddress] = useState<string>("");
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin =
    !!address && adminAddress.toLowerCase() === address.toLowerCase();
  const totalVotes = candidates.reduce((s, c) => s + Number(c.voteCount), 0);

  const loadContractData = useCallback(async (prov: ethers.Provider) => {
    try {
      const [cands, state, admin] = await Promise.all([
        fetchCandidates(prov),
        fetchVotingState(prov),
        fetchAdmin(prov),
      ]);
      setCandidates(cands);
      setVotingState(state);
      setAdminAddress(admin);
      if (state === "ENDED") {
        try {
          const w = await fetchWinner(prov);
          setWinner(w);
        } catch { /* edge case: 0 votes */ }
      } else {
        setWinner(null);
      }
      setLastRefresh(new Date());
      setLoadError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.slice(0, 120) : "Unknown error";
      setLoadError("Failed to load contract data: " + msg);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const readProv = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
        await loadContractData(readProv);
      } catch {
        setLoadError("Could not connect to Sepolia. Check your internet connection.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadContractData]);

  useEffect(() => {
    if (provider) loadContractData(provider);
  }, [provider, loadContractData]);

  useEffect(() => {
    const eth = typeof window !== "undefined" ? window.ethereum : undefined;
    if (!eth) return;
    const reload = () => window.location.reload();
    eth.on("accountsChanged", reload);
    eth.on("chainChanged", reload);
    return () => {
      eth.removeListener("accountsChanged", reload);
      eth.removeListener("chainChanged", reload);
    };
  }, []);

  function handleWalletConnected(prov: BrowserProvider, sgn: JsonRpcSigner, addr: string) {
    setProvider(prov);
    setSigner(sgn);
    setAddress(addr);
  }

  async function handleRefresh() {
    if (!provider) return;
    setRefreshing(true);
    await loadContractData(provider);
    setRefreshing(false);
  }

  function handleVoteCast() {
    setHasVoted(true);
    if (provider) loadContractData(provider);
  }

  function handleStateChange() {
    if (provider) loadContractData(provider);
  }

  const statColor = votingState === "ONGOING"
    ? "var(--accent)"
    : votingState === "ENDED"
    ? "var(--danger)"
    : "var(--warning)";

  return (
    <main style={{ position: "relative", minHeight: "100vh" }}>
      <div className="grid-bg" style={{ position: "fixed", inset: 0, opacity: 0.3 }} />
      <div className="orb orb-indigo" style={{ top: 0, left: "50%", transform: "translateX(-50%)" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Nav */}
        <nav style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 40px", borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(12px)", background: "#0a0a0f99",
          position: "sticky", top: 0, zIndex: 50, flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <span className="font-display" style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>
                De<span style={{ color: "var(--text)" }}>Vote</span>
              </span>
            </Link>
            <span style={{ color: "var(--border)" }}>|</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Ballot</span>
          </div>
          <WalletConnect onConnected={handleWalletConnected} address={address} isAdmin={isAdmin} />
        </nav>

        {/* Page body */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
            <div>
              <h1 className="font-display" style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>
                Cast Your Vote
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Contract:</span>
                <a href={sepoliaExplorerAddress(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer"
                  style={{ fontSize: 11, color: "var(--accent-2)", fontFamily: "var(--font-mono)", textDecoration: "none" }}>
                  {CONTRACT_ADDRESS.slice(0, 10)}&#8230;{CONTRACT_ADDRESS.slice(-6)} &#8599;
                </a>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <button className="btn btn-secondary" onClick={handleRefresh}
                disabled={refreshing || !provider} style={{ fontSize: 12 }}>
                {refreshing ? <><span className="spinner" />{" "}Refreshing</> : "↻ Refresh"}
              </button>
              {lastRefresh && (
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  Updated: {lastRefresh.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
              <div className="spinner" style={{ width: 32, height: 32, margin: "0 auto 16px", borderWidth: 3, borderTopColor: "var(--accent)" }} />
              <div>Loading ballot data from Sepolia&#8230;</div>
            </div>
          )}

          {/* Error */}
          {loadError && !loading && (
            <div className="toast toast-error animate-slide-up" style={{ marginBottom: 24 }}>
              &#9888; {loadError}
            </div>
          )}

          {!loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                {[
                  { label: "Candidates", value: candidates.length, color: "var(--accent-2)" },
                  { label: "Total Votes", value: totalVotes, color: "var(--accent)" },
                  { label: "Status", value: votingState.replace("_", " "), color: statColor },
                ].map((s) => (
                  <div key={s.label} className="card" style={{ padding: "16px 20px" }}>
                    <div className="font-display" style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Lifecycle + admin controls */}
              <VotingStatus state={votingState} isAdmin={isAdmin} signer={signer} onStateChange={handleStateChange} />

              {/* ONGOING: voting */}
              {votingState === "ONGOING" && (
                <section>
                  <div className="font-display" style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Select a Candidate</div>
                  <VotingPanel candidates={candidates} signer={signer} onVoteCast={handleVoteCast} hasVoted={hasVoted} />
                </section>
              )}

              {/* NOT_STARTED: preview */}
              {votingState === "NOT_STARTED" && candidates.length > 0 && (
                <section>
                  <div className="font-display" style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Registered Candidates</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                    {candidates.map((c) => (
                      <CandidateCard key={c.id} candidate={c} totalVotes={totalVotes}
                        selected={false} onSelect={() => {}} votingOngoing={false} />
                    ))}
                  </div>
                </section>
              )}

              {/* ENDED: results */}
              {votingState === "ENDED" && (
                <section>
                  {winner && (
                    <div style={{ marginBottom: 24 }}>
                      <WinnerBanner winner={winner} totalVotes={totalVotes} />
                    </div>
                  )}
                  <div className="font-display" style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Final Results</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                    {[...candidates].sort((a, b) => Number(b.voteCount - a.voteCount)).map((c) => (
                      <CandidateCard key={c.id} candidate={c} totalVotes={totalVotes}
                        selected={false} onSelect={() => {}} votingOngoing={false}
                        isWinner={winner?.name === c.name} />
                    ))}
                  </div>
                </section>
              )}

              {/* Connect prompt */}
              {!address && votingState === "ONGOING" && (
                <div className="toast toast-info animate-fade-in">
                  Connect your MetaMask wallet using the button in the top-right to cast your vote.
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </main>
  );
}
