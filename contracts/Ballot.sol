// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title Ballot
 * @dev A decentralized voting contract with lifecycle management and double-vote prevention.
 *      Uses nullifier hashes to prevent double voting without revealing voter identity.
 */
contract Ballot {
    // ─────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────

    /// @dev Represents a single voting candidate
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    // ─────────────────────────────────────────────
    // Enums
    // ─────────────────────────────────────────────

    /// @dev Voting lifecycle states
    enum VotingState {
        NOT_STARTED, // 0 – contract deployed, voting not open
        ONGOING,     // 1 – voting is live
        ENDED        // 2 – voting has been closed
    }

    // ─────────────────────────────────────────────
    // State Variables
    // ─────────────────────────────────────────────

    address public immutable admin;          // Contract deployer / admin
    VotingState public votingState;          // Current lifecycle state
    Candidate[] public candidates;           // Dynamic array of candidates

    /// @dev Tracks used nullifier hashes to prevent double voting
    mapping(uint256 => bool) public nullifierUsed;

    // ─────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────

    event VoteCast(uint256 indexed candidateId, uint256 indexed nullifierHash);
    event VotingStarted(uint256 timestamp);
    event VotingEnded(uint256 timestamp);

    // ─────────────────────────────────────────────
    // Errors (gas-efficient custom errors)
    // ─────────────────────────────────────────────

    error NotAdmin();
    error InvalidCandidate(uint256 candidateId);
    error NullifierAlreadyUsed(uint256 nullifierHash);
    error VotingNotOngoing(VotingState currentState);
    error VotingNotEnded();
    error InvalidNullifier();

    // ─────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier onlyDuringVoting() {
        if (votingState != VotingState.ONGOING) revert VotingNotOngoing(votingState);
        _;
    }

    modifier onlyAfterVoting() {
        if (votingState != VotingState.ENDED) revert VotingNotEnded();
        _;
    }

    // ─────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────

    /**
     * @param candidateNames Array of candidate names to initialize the ballot with.
     *                       Must have at least 2 candidates.
     */
    constructor(string[] memory candidateNames) {
        require(candidateNames.length >= 2, "Ballot: need at least 2 candidates");

        admin = msg.sender;
        votingState = VotingState.NOT_STARTED;

        for (uint256 i = 0; i < candidateNames.length; i++) {
            candidates.push(Candidate({ name: candidateNames[i], voteCount: 0 }));
        }
    }

    // ─────────────────────────────────────────────
    // Admin Functions
    // ─────────────────────────────────────────────

    /// @notice Opens voting. Only callable by admin when NOT_STARTED.
    function startVoting() external onlyAdmin {
        require(votingState == VotingState.NOT_STARTED, "Ballot: already started");
        votingState = VotingState.ONGOING;
        emit VotingStarted(block.timestamp);
    }

    /// @notice Closes voting. Only callable by admin when ONGOING.
    function endVoting() external onlyAdmin {
        require(votingState == VotingState.ONGOING, "Ballot: not ongoing");
        votingState = VotingState.ENDED;
        emit VotingEnded(block.timestamp);
    }

    // ─────────────────────────────────────────────
    // Voting
    // ─────────────────────────────────────────────

    /**
     * @notice Cast a vote for a candidate using a unique nullifier hash.
     * @param candidateId  Zero-based index of the chosen candidate.
     * @param nullifierHash A unique hash that identifies this vote without
     *                      revealing the voter (dummy random uint in this demo).
     *
     * Security properties enforced:
     *  – Voting must be ONGOING
     *  – Candidate index must be valid
     *  – Nullifier must not have been used before
     *  – No reentrancy risk (state written before any external call)
     */
    function castVote(uint256 candidateId, uint256 nullifierHash)
        external
        onlyDuringVoting
    {
        // Validate nullifier is non-zero (prevent trivial collision)
        if (nullifierHash == 0) revert InvalidNullifier();

        // Validate candidate
        if (candidateId >= candidates.length) revert InvalidCandidate(candidateId);

        // Prevent double voting via nullifier reuse
        if (nullifierUsed[nullifierHash]) revert NullifierAlreadyUsed(nullifierHash);

        // Mark nullifier as used BEFORE incrementing (checks-effects-interactions)
        nullifierUsed[nullifierHash] = true;

        // Increment the vote count
        candidates[candidateId].voteCount += 1;

        emit VoteCast(candidateId, nullifierHash);
    }

    // ─────────────────────────────────────────────
    // View / Pure Functions
    // ─────────────────────────────────────────────

    /// @notice Returns all candidates as parallel arrays (gas-efficient for frontends).
    function getCandidates()
        external
        view
        returns (string[] memory names, uint256[] memory voteCounts)
    {
        uint256 len = candidates.length;
        names = new string[](len);
        voteCounts = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            names[i] = candidates[i].name;
            voteCounts[i] = candidates[i].voteCount;
        }
    }

    /// @notice Returns the number of registered candidates.
    function candidateCount() external view returns (uint256) {
        return candidates.length;
    }

    /**
     * @notice Returns the winning candidate after voting has ended.
     * @return winnerName  Name of the candidate with the most votes.
     * @return winnerVotes Their total vote count.
     *
     * Note: In case of a tie, the candidate with the lower index wins.
     */
    function getWinner()
        external
        view
        onlyAfterVoting
        returns (string memory winnerName, uint256 winnerVotes)
    {
        uint256 winningIndex = 0;
        uint256 highestVotes = 0;

        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > highestVotes) {
                highestVotes = candidates[i].voteCount;
                winningIndex = i;
            }
        }

        winnerName = candidates[winningIndex].name;
        winnerVotes = candidates[winningIndex].voteCount;
    }
}
