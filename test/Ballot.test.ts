import { expect } from "chai";
import { ethers } from "hardhat";
import { Ballot } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Generate a pseudo-random non-zero nullifier hash */
function randomNullifier(): bigint {
  return BigInt(Math.floor(Math.random() * 1_000_000_000) + 1);
}

const CANDIDATES = ["Alice Johnson", "Bob Martinez", "Carol White"];

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe("Ballot", function () {
  let ballot: Ballot;
  let admin: HardhatEthersSigner;
  let voter1: HardhatEthersSigner;
  let voter2: HardhatEthersSigner;
  let stranger: HardhatEthersSigner;

  beforeEach(async function () {
    [admin, voter1, voter2, stranger] = await ethers.getSigners();
    const BallotFactory = await ethers.getContractFactory("Ballot", admin);
    ballot = (await BallotFactory.deploy(CANDIDATES)) as Ballot;
    await ballot.waitForDeployment();
  });

  // ── 1. Deployment ──────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("sets the deployer as admin", async function () {
      expect(await ballot.admin()).to.equal(admin.address);
    });

    it("starts in NOT_STARTED state (0)", async function () {
      expect(await ballot.votingState()).to.equal(0);
    });

    it("initialises the correct number of candidates", async function () {
      expect(await ballot.candidateCount()).to.equal(CANDIDATES.length);
    });

    it("stores candidate names correctly", async function () {
      const { names } = await ballot.getCandidates();
      for (let i = 0; i < CANDIDATES.length; i++) {
        expect(names[i]).to.equal(CANDIDATES[i]);
      }
    });

    it("initialises all vote counts to zero", async function () {
      const { voteCounts } = await ballot.getCandidates();
      for (const count of voteCounts) {
        expect(count).to.equal(0n);
      }
    });

    it("reverts if fewer than 2 candidates are supplied", async function () {
      const BallotFactory = await ethers.getContractFactory("Ballot", admin);
      await expect(BallotFactory.deploy(["OnlyOne"])).to.be.revertedWith(
        "Ballot: need at least 2 candidates"
      );
    });
  });

  // ── 2. Lifecycle: startVoting ──────────────────────────────────────────────

  describe("startVoting()", function () {
    it("admin can start voting", async function () {
      await expect(ballot.connect(admin).startVoting())
        .to.emit(ballot, "VotingStarted");
      expect(await ballot.votingState()).to.equal(1); // ONGOING
    });

    it("emits VotingStarted with a timestamp", async function () {
      const tx = await ballot.connect(admin).startVoting();
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);
    });

    it("reverts when called by non-admin", async function () {
      await expect(ballot.connect(stranger).startVoting())
        .to.be.revertedWithCustomError(ballot, "NotAdmin");
    });

    it("reverts if already started", async function () {
      await ballot.connect(admin).startVoting();
      await expect(ballot.connect(admin).startVoting()).to.be.revertedWith(
        "Ballot: already started"
      );
    });
  });

  // ── 3. Lifecycle: endVoting ────────────────────────────────────────────────

  describe("endVoting()", function () {
    beforeEach(async function () {
      await ballot.connect(admin).startVoting();
    });

    it("admin can end voting", async function () {
      await expect(ballot.connect(admin).endVoting())
        .to.emit(ballot, "VotingEnded");
      expect(await ballot.votingState()).to.equal(2); // ENDED
    });

    it("reverts when called by non-admin", async function () {
      await expect(ballot.connect(stranger).endVoting())
        .to.be.revertedWithCustomError(ballot, "NotAdmin");
    });

    it("reverts if voting has not started yet", async function () {
      const BallotFactory = await ethers.getContractFactory("Ballot", admin);
      const freshBallot = await BallotFactory.deploy(CANDIDATES);
      await freshBallot.waitForDeployment();
      await expect(freshBallot.connect(admin).endVoting()).to.be.revertedWith(
        "Ballot: not ongoing"
      );
    });
  });

  // ── 4. castVote ───────────────────────────────────────────────────────────

  describe("castVote()", function () {
    beforeEach(async function () {
      await ballot.connect(admin).startVoting();
    });

    it("successfully records a valid vote", async function () {
      const nullifier = randomNullifier();
      await expect(ballot.connect(voter1).castVote(0, nullifier))
        .to.emit(ballot, "VoteCast")
        .withArgs(0n, nullifier);

      const { voteCounts } = await ballot.getCandidates();
      expect(voteCounts[0]).to.equal(1n);
    });

    it("increments only the chosen candidate's count", async function () {
      await ballot.connect(voter1).castVote(1, randomNullifier());
      const { voteCounts } = await ballot.getCandidates();
      expect(voteCounts[0]).to.equal(0n);
      expect(voteCounts[1]).to.equal(1n);
      expect(voteCounts[2]).to.equal(0n);
    });

    it("allows multiple voters to vote for different candidates", async function () {
      await ballot.connect(voter1).castVote(0, randomNullifier());
      await ballot.connect(voter2).castVote(2, randomNullifier());
      const { voteCounts } = await ballot.getCandidates();
      expect(voteCounts[0]).to.equal(1n);
      expect(voteCounts[2]).to.equal(1n);
    });

    // Double-voting prevention
    it("reverts when the same nullifier is reused (double vote)", async function () {
      const nullifier = randomNullifier();
      await ballot.connect(voter1).castVote(0, nullifier);
      await expect(ballot.connect(voter2).castVote(0, nullifier))
        .to.be.revertedWithCustomError(ballot, "NullifierAlreadyUsed")
        .withArgs(nullifier);
    });

    it("marks nullifier as used after voting", async function () {
      const nullifier = randomNullifier();
      await ballot.connect(voter1).castVote(0, nullifier);
      expect(await ballot.nullifierUsed(nullifier)).to.be.true;
    });

    // Invalid candidate
    it("reverts for out-of-bounds candidateId", async function () {
      await expect(ballot.connect(voter1).castVote(99, randomNullifier()))
        .to.be.revertedWithCustomError(ballot, "InvalidCandidate")
        .withArgs(99n);
    });

    // Zero nullifier
    it("reverts for zero nullifier", async function () {
      await expect(ballot.connect(voter1).castVote(0, 0n))
        .to.be.revertedWithCustomError(ballot, "InvalidNullifier");
    });

    // Lifecycle gating
    it("reverts before voting has started", async function () {
      const BallotFactory = await ethers.getContractFactory("Ballot", admin);
      const freshBallot = await BallotFactory.deploy(CANDIDATES);
      await freshBallot.waitForDeployment();
      await expect(freshBallot.connect(voter1).castVote(0, randomNullifier()))
        .to.be.revertedWithCustomError(freshBallot, "VotingNotOngoing");
    });

    it("reverts after voting has ended", async function () {
      await ballot.connect(admin).endVoting();
      await expect(ballot.connect(voter1).castVote(0, randomNullifier()))
        .to.be.revertedWithCustomError(ballot, "VotingNotOngoing");
    });
  });

  // ── 5. getWinner ──────────────────────────────────────────────────────────

  describe("getWinner()", function () {
    it("reverts if voting is still ongoing", async function () {
      await ballot.connect(admin).startVoting();
      await expect(ballot.getWinner())
        .to.be.revertedWithCustomError(ballot, "VotingNotEnded");
    });

    it("reverts if voting has not started at all", async function () {
      await expect(ballot.getWinner())
        .to.be.revertedWithCustomError(ballot, "VotingNotEnded");
    });

    it("returns the correct winner", async function () {
      await ballot.connect(admin).startVoting();
      // voter1 → Alice (0), voter2 → Carol (2), stranger → Carol (2)
      await ballot.connect(voter1).castVote(0, randomNullifier());
      await ballot.connect(voter2).castVote(2, randomNullifier());
      await ballot.connect(stranger).castVote(2, randomNullifier());
      await ballot.connect(admin).endVoting();

      const [winnerName, winnerVotes] = await ballot.getWinner();
      expect(winnerName).to.equal("Carol White");
      expect(winnerVotes).to.equal(2n);
    });

    it("returns the first candidate on a tie", async function () {
      await ballot.connect(admin).startVoting();
      await ballot.connect(voter1).castVote(0, randomNullifier());
      await ballot.connect(voter2).castVote(1, randomNullifier());
      await ballot.connect(admin).endVoting();

      const [winnerName] = await ballot.getWinner();
      expect(winnerName).to.equal("Alice Johnson"); // lower index wins on tie
    });

    it("returns candidate with 0 votes if nobody voted", async function () {
      await ballot.connect(admin).startVoting();
      await ballot.connect(admin).endVoting();
      const [winnerName, winnerVotes] = await ballot.getWinner();
      expect(winnerName).to.equal("Alice Johnson");
      expect(winnerVotes).to.equal(0n);
    });
  });

  // ── 6. getCandidates ──────────────────────────────────────────────────────

  describe("getCandidates()", function () {
    it("returns parallel arrays of names and vote counts", async function () {
      const { names, voteCounts } = await ballot.getCandidates();
      expect(names.length).to.equal(CANDIDATES.length);
      expect(voteCounts.length).to.equal(CANDIDATES.length);
    });

    it("reflects updated vote counts after voting", async function () {
      await ballot.connect(admin).startVoting();
      await ballot.connect(voter1).castVote(1, randomNullifier());
      const { voteCounts } = await ballot.getCandidates();
      expect(voteCounts[1]).to.equal(1n);
    });
  });
});
