/**
 * contract.ts
 * -----------
 * Central module for all Ethereum / smart-contract interactions.
 * Uses Ethers v6 throughout.
 */

import { ethers, BrowserProvider, Contract, ContractRunner } from "ethers";
import BALLOT_ABI from "./Ballot.abi.json";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Replace this with the address printed after running:
 *   npm run deploy:sepolia
 * or `npm run deploy:local` for a local Hardhat node.
 */
export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0xbbAaE02BDe0575c7e4aAC0dE021FC43347c7Da12"; // ← paste deployed address here

export const SEPOLIA_CHAIN_ID = 11155111n;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Candidate {
  id: number;
  name: string;
  voteCount: bigint;
}

export type VotingState = "NOT_STARTED" | "ONGOING" | "ENDED";

export interface Winner {
  name: string;
  votes: bigint;
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns a read-only contract connected to window.ethereum (no wallet needed) */
function getReadContract(provider: ContractRunner): Contract {
  return new Contract(CONTRACT_ADDRESS, BALLOT_ABI, provider);
}

/** Returns a write-capable contract connected to the signer (wallet) */
function getWriteContract(signer: ContractRunner): Contract {
  return new Contract(CONTRACT_ADDRESS, BALLOT_ABI, signer);
}

// ─────────────────────────────────────────────────────────────────────────────
// Wallet connection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Requests MetaMask account access and returns the BrowserProvider + signer.
 * Also ensures the user is on Sepolia (chainId 11155111).
 */
export async function connectWallet(): Promise<{
  provider: BrowserProvider;
  signer: ethers.JsonRpcSigner;
  address: string;
}> {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask not detected. Please install the MetaMask browser extension."
    );
  }

  const provider = new BrowserProvider(window.ethereum);

  // Request account access
  await provider.send("eth_requestAccounts", []);

  // Verify correct network
  const network = await provider.getNetwork();
  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    // Try switching automatically
    try {
      await provider.send("wallet_switchEthereumChain", [
        { chainId: "0xaa36a7" }, // 11155111 in hex
      ]);
    } catch {
      throw new Error(
        `Please switch MetaMask to the Sepolia testnet (chain ID 11155111).`
      );
    }
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { provider, signer, address };
}

// ─────────────────────────────────────────────────────────────────────────────
// Read functions
// ─────────────────────────────────────────────────────────────────────────────

/** Fetches all candidates from the contract. */
export async function fetchCandidates(
  provider: ContractRunner
): Promise<Candidate[]> {
  const contract = getReadContract(provider);
  const [names, voteCounts]: [string[], bigint[]] =
    await contract.getCandidates();

  return names.map((name, i) => ({
    id: i,
    name,
    voteCount: voteCounts[i],
  }));
}

/** Returns the current voting lifecycle state as a string. */
export async function fetchVotingState(
  provider: ContractRunner
): Promise<VotingState> {
  const contract = getReadContract(provider);
  const stateNum: bigint = await contract.votingState();
  const states: VotingState[] = ["NOT_STARTED", "ONGOING", "ENDED"];
  return states[Number(stateNum)];
}

/** Returns the winner; only works when state === ENDED. */
export async function fetchWinner(provider: ContractRunner): Promise<Winner> {
  const contract = getReadContract(provider);
  const [name, votes]: [string, bigint] = await contract.getWinner();
  return { name, votes };
}

/** Returns the admin address. */
export async function fetchAdmin(provider: ContractRunner): Promise<string> {
  const contract = getReadContract(provider);
  return contract.admin();
}

// ─────────────────────────────────────────────────────────────────────────────
// Write functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Casts a vote for `candidateId` using a freshly-generated random nullifier.
 * Returns the transaction hash and nullifier used.
 */
export async function castVote(
  signer: ethers.JsonRpcSigner,
  candidateId: number
): Promise<{ txHash: string; nullifier: bigint }> {
  const contract = getWriteContract(signer);

  // Generate a random 128-bit nullifier (safe substitute for ZK nullifier)
  // const nullifier =
  //   (BigInt(Math.floor(Math.random() * 0xffffffff)) << 96n) |
  //   (BigInt(Math.floor(Math.random() * 0xffffffff)) << 64n) |
  //   (BigInt(Math.floor(Math.random() * 0xffffffff)) << 32n) |
  //   BigInt(Math.floor(Math.random() * 0xffffffff) + 1);
  const address = await signer.getAddress();
  const nullifier = BigInt(address);

  const tx = await contract.castVote(candidateId, nullifier);
  await tx.wait(); // wait for 1 confirmation

  return { txHash: tx.hash, nullifier };
}

/** Admin: starts the voting period. */
export async function startVoting(
  signer: ethers.JsonRpcSigner
): Promise<string> {
  const contract = getWriteContract(signer);
  const tx = await contract.startVoting();
  await tx.wait();
  return tx.hash;
}

/** Admin: ends the voting period. */
export async function endVoting(
  signer: ethers.JsonRpcSigner
): Promise<string> {
  const contract = getWriteContract(signer);
  const tx = await contract.endVoting();
  await tx.wait();
  return tx.hash;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Truncates a wallet address for display: 0x1234…abcd */
export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Returns an Etherscan link for a transaction hash (Sepolia). */
export function sepoliaExplorerTx(hash: string): string {
  return `https://sepolia.etherscan.io/tx/${hash}`;
}

/** Returns an Etherscan link for an address (Sepolia). */
export function sepoliaExplorerAddress(address: string): string {
  return `https://sepolia.etherscan.io/address/${address}`;
}
