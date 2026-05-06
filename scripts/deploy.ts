import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploy the Ballot contract with a predefined set of candidates.
 *
 * Usage:
 *   npm run deploy:local    → Hardhat local node
 *   npm run deploy:sepolia  → Sepolia testnet
 */
async function main() {
  console.log("\n🗳️  Deploying Ballot contract...");
  console.log(`   Network: ${network.name}`);

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`   Balance: ${ethers.formatEther(balance)} ETH\n`);

  // ── Candidate names – customise as needed ──────────────────────────────
  const candidateNames = [
    "Alice Johnson",
    "Bob Martinez",
    "Carol White",
    "David Kim",
  ];
  // ───────────────────────────────────────────────────────────────────────

  const BallotFactory = await ethers.getContractFactory("Ballot");
  const ballot = await BallotFactory.deploy(candidateNames);
  await ballot.waitForDeployment();

  const contractAddress = await ballot.getAddress();
  console.log(`✅ Ballot deployed at: ${contractAddress}`);
  console.log(`   Candidates: ${candidateNames.join(", ")}\n`);

  // ── Persist the address for the frontend ───────────────────────────────
  const deployInfo = {
    network: network.name,
    address: contractAddress,
    deployer: deployer.address,
    candidates: candidateNames,
    deployedAt: new Date().toISOString(),
  };

  // Write to the root and to the frontend utils folder
  const outputPaths = [
    path.join(__dirname, "..", "deployed-address.json"),
    path.join(__dirname, "..", "frontend", "utils", "deployed-address.json"),
  ];

  for (const outputPath of outputPaths) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(deployInfo, null, 2));
  }

  console.log("📄 Deployment info saved to deployed-address.json");
  console.log("\nNext steps:");
  console.log("  1. Copy the ABI from artifacts/contracts/Ballot.sol/Ballot.json");
  console.log("     to frontend/utils/Ballot.abi.json");
  console.log("  2. Start the frontend: cd frontend && npm run dev");

  if (network.name !== "localhost") {
    console.log("\n🔍 Verify on Etherscan:");
    console.log(
      `  npx hardhat verify --network ${network.name} ${contractAddress} ${candidateNames.map((n) => `"${n}"`).join(" ")}`
    );
  }
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
