# 🗳️ DeVote — Decentralized Voting DApp

A fully on-chain, tamper-proof voting system built with **Solidity**, **Hardhat**, **Ethers v6**, and **Next.js 16 (App Router)**. Deployed to **Ethereum Sepolia Testnet**.

---

## 📁 Project Structure

```
voting-dapp/
├── contracts/
│   └── Ballot.sol              # Core smart contract
├── scripts/
│   └── deploy.ts               # Hardhat deploy script
├── test/
│   └── Ballot.test.ts          # Comprehensive test suite (25 tests)
├── hardhat.config.ts           # Hardhat configuration
├── .env.example                # Environment variable template
└── frontend/                   # Next.js 16 App Router
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── page.tsx            # Home / landing page
    │   └── voting/
    │       └── page.tsx        # Main ballot page
    ├── components/
    │   ├── WalletConnect.tsx   # MetaMask connection
    │   ├── CandidateCard.tsx   # Candidate display + selection
    │   ├── VotingPanel.tsx     # Vote casting UI
    │   ├── VotingStatus.tsx    # Lifecycle + admin controls
    │   └── WinnerBanner.tsx    # Results display
    ├── utils/
    │   ├── contract.ts         # All Ethers.js contract interactions
    │   └── Ballot.abi.json     # Contract ABI (auto-generated)
    └── types/
        └── global.d.ts         # window.ethereum type declaration
```

---

## ⚙️ Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18.x | https://nodejs.org |
| npm | ≥ 9.x | bundled with Node |
| MetaMask | Latest | https://metamask.io |
| Git | Any | https://git-scm.com |

You'll also need:
- A **Sepolia RPC URL** — free from [Alchemy](https://alchemy.com) or [Infura](https://infura.io)
- A **wallet with Sepolia ETH** — get free ETH from [sepoliafaucet.com](https://sepoliafaucet.com)
- An **Etherscan API key** (optional, for contract verification) — [etherscan.io/myapikey](https://etherscan.io/myapikey)

---

## 🚀 Quick Start (Local Development)

### 1. Clone & install root dependencies

```bash
git clone <your-repo-url>
cd voting-dapp
npm install
```

### 2. Compile the smart contract

```bash
npm run compile
```

This generates `artifacts/` and `typechain-types/`.

### 3. Run the test suite

```bash
npm test
```

Expected output: **25 passing** tests across 6 describe blocks.

### 4. Start a local Hardhat node

```bash
npm run node
```

This starts a local blockchain at `http://127.0.0.1:8545` with 20 funded test accounts.

### 5. Deploy to local node (new terminal)

```bash
npm run deploy:local
```

This prints the deployed contract address and writes it to:
- `deployed-address.json`
- `frontend/utils/deployed-address.json`

### 6. Copy the ABI to the frontend

The ABI is already pre-copied to `frontend/utils/Ballot.abi.json` when you compiled. If you need to refresh it:

```bash
cp artifacts/contracts/Ballot.sol/Ballot.json /tmp/ballot-full.json
node -e "
  const f = require('/tmp/ballot-full.json');
  require('fs').writeFileSync('frontend/utils/Ballot.abi.json', JSON.stringify(f.abi, null, 2));
"
```

### 7. Configure the frontend

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedAddressHere
```

Or directly edit `frontend/utils/contract.ts` line:

```ts
export const CONTRACT_ADDRESS = "0xYourAddressHere";
```

### 8. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploy to Sepolia Testnet

### 1. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0xYourWalletPrivateKey
ETHERSCAN_API_KEY=YourEtherscanKey
```

> ⚠️ **NEVER commit `.env` to git.** It contains your private key.

### 2. Deploy

```bash
npm run deploy:sepolia
```

Output example:
```
🗳️  Deploying Ballot contract...
   Network: sepolia
   Deployer: 0xYourAddress
   Balance: 0.5 ETH

✅ Ballot deployed at: 0xABCDEF1234567890...
   Candidates: Alice Johnson, Bob Martinez, Carol White, David Kim

📄 Deployment info saved to deployed-address.json
```

### 3. (Optional) Verify on Etherscan

```bash
npx hardhat verify --network sepolia 0xYourContractAddress \
  "Alice Johnson" "Bob Martinez" "Carol White" "David Kim"
```

### 4. Update the frontend

Set `NEXT_PUBLIC_CONTRACT_ADDRESS` in `frontend/.env.local` to your deployed address.

---

## 🦊 Connecting MetaMask

1. Install [MetaMask](https://metamask.io)
2. Open MetaMask → Networks → **Add Network**
3. Fill in:

| Field | Value |
|-------|-------|
| Network Name | Sepolia |
| RPC URL | https://rpc.sepolia.org |
| Chain ID | 11155111 |
| Currency Symbol | ETH |
| Explorer | https://sepolia.etherscan.io |

4. Get test ETH from [sepoliafaucet.com](https://sepoliafaucet.com)
5. Navigate to `/voting` and click **Connect Wallet**

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Watch mode
npx hardhat test --watch

# With gas report
REPORT_GAS=true npm test
```

### Test Coverage

| Suite | Tests |
|-------|-------|
| Deployment | 6 |
| `startVoting()` | 4 |
| `endVoting()` | 3 |
| `castVote()` | 8 |
| `getWinner()` | 5 |
| `getCandidates()` | 2 |
| **Total** | **28** |

---

## 🏗️ Smart Contract Architecture

### `Ballot.sol` — Key Design Decisions

**Nullifier-based double-vote prevention**
```solidity
mapping(uint256 => bool) public nullifierUsed;

function castVote(uint256 candidateId, uint256 nullifierHash) external {
    if (nullifierUsed[nullifierHash]) revert NullifierAlreadyUsed(nullifierHash);
    nullifierUsed[nullifierHash] = true;  // mark BEFORE incrementing (CEI pattern)
    candidates[candidateId].voteCount += 1;
}
```

**Lifecycle state machine**
```
NOT_STARTED → (admin calls startVoting) → ONGOING → (admin calls endVoting) → ENDED
```

**Gas-efficient custom errors** (vs `require` strings):
```solidity
error NotAdmin();
error InvalidCandidate(uint256 candidateId);
error NullifierAlreadyUsed(uint256 nullifierHash);
```

**Checks-Effects-Interactions pattern** prevents reentrancy even though no ETH is transferred.

---

## 🔑 Admin Controls

The deployer wallet is automatically the admin. Admin can:

- **Start voting** — opens the ballot
- **End voting** — closes the ballot and enables winner declaration

Admin panel is visible in the UI when you connect the deployer's wallet.

---

## 🗺️ Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with features + how it works |
| `/voting` | Main ballot page — connect, vote, see results |

### Voting Page Features
- Real-time candidate vote counts
- Live voting state indicator
- Animated candidate selection cards with vote share progress bars
- Transaction status + Etherscan deep links
- Winner banner with vote percentage breakdown
- Admin controls (start/end voting) — visible only to deployer wallet
- Auto-reconnect on MetaMask account/chain change

---

## 🔐 Security Notes

| Threat | Mitigation |
|--------|-----------|
| Double voting | Nullifier hash mapping on-chain |
| Unauthorized admin | `onlyAdmin` modifier checks `msg.sender == admin` |
| Voting outside lifecycle | `onlyDuringVoting` / `onlyAfterVoting` modifiers |
| Reentrancy | CEI pattern; no ETH transfers |
| Zero nullifier collision | Explicit `nullifierHash != 0` check |
| Front-end manipulation | All logic is on-chain; UI is purely display |

---

## 📜 Environment Variables Reference

### Root (`.env`)
| Variable | Description |
|----------|-------------|
| `SEPOLIA_RPC_URL` | Alchemy/Infura Sepolia endpoint |
| `PRIVATE_KEY` | Deployer wallet private key (starts with `0x`) |
| `ETHERSCAN_API_KEY` | For contract verification (optional) |

### Frontend (`frontend/.env.local`)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed Ballot contract address |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity ^0.8.26 |
| Dev Framework | Hardhat 2.22 |
| Testing | Mocha + Chai + Hardhat Toolbox |
| Frontend Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Blockchain Library | Ethers.js v6 |
| Styling | CSS Custom Properties + Tailwind utilities |
| Fonts | Syne (display) + Space Mono (code) |
| Network | Ethereum Sepolia Testnet |

---

## 📄 License

MIT
