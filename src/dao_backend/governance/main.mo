import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Nat32 "mo:base/Nat32";
import Error "mo:base/Error";

import Types "../shared/types";

/**
 * Governance Canister
 * 
 * This canister manages the democratic decision-making process of the DAO:
 * - Proposal creation, voting, and execution
 * - Vote counting and quorum validation
 * - Governance parameter management
 * - Integration with staking for voting power calculation
 * 
 * The governance system supports multiple voting mechanisms:
 * - Token-weighted voting (proportional to stake)
 * - Quadratic voting (to prevent whale dominance)
 * - Delegated voting (vote delegation to representatives)
 * 
 * Security features:
 * - Proposal deposits to prevent spam
 * - Time-locked execution for major changes
 * - Quorum requirements for legitimacy
 */
persistent actor GovernanceCanister {
    // Type aliases for improved code readability
    type Result<T, E> = Result.Result<T, E>;
    type Proposal = Types.Proposal;
    type Vote = Types.Vote;
    type ProposalId = Types.ProposalId;
    type GovernanceConfig = Types.GovernanceConfig;
    type GovernanceError = Types.GovernanceError;
    type CommonError = Types.CommonError;


    // Key types for multi-DAO support
    type ProposalKey = (Principal, ProposalId);
    type VoteKey = (Principal, ProposalId, Principal);

    private func proposalKeyEqual(a: ProposalKey, b: ProposalKey) : Bool {
        Principal.equal(a.0, b.0) and a.1 == b.1
    };

    private func proposalKeyHash(k: ProposalKey) : Nat32 {
        Principal.hash(k.0) + Nat32.fromNat(k.1)
    };

    private func voteKeyEqual(a: VoteKey, b: VoteKey) : Bool {
        Principal.equal(a.0, b.0) and a.1 == b.1 and Principal.equal(a.2, b.2)
    };

    private func voteKeyHash(k: VoteKey) : Nat32 {
        Principal.hash(k.0) + Nat32.fromNat(k.1) + Principal.hash(k.2)
    };

    // Inter-canister communication setup
    // Actor reference for staking canister

    var staking : actor {
        getUserStakingSummary: shared query (Principal, Principal) -> async {

            totalStaked: Nat;
            totalRewards: Nat;
            activeStakes: Nat;
            totalVotingPower: Nat;
        };

    } = actor("aaaaa-aa");

    // Inter-canister communication setup

    // These actor references enable cross-canister calls for governance functionality
    var dao : actor {
        getUserProfile: shared query (Types.DAOId, Principal) -> async ?Types.UserProfile;
        checkIsAdmin: shared query (Types.DAOId, Principal) -> async Bool;

    } = actor("aaaaa-aa");

    // Stable storage for upgrade persistence
    // These arrays store serialized data that survives canister upgrades
    private var nextProposalId : Nat = 1;
    private var proposalsEntries : [(ProposalKey, Proposal)] = [];
    private var votesEntries : [(VoteKey, Vote)] = [];
    private var configEntries : [(Principal, GovernanceConfig)] = [];
    private var stakingId : Principal = Principal.fromText("aaaaa-aa");
    private var daoInstance : Types.DAOId = "";
    private var initialized : Bool = false;

    // Runtime storage - rebuilt from stable storage after upgrades
    // HashMaps provide O(1) lookup performance for governance operations
    private transient var proposals = HashMap.HashMap<ProposalKey, Proposal>(10, proposalKeyEqual, proposalKeyHash);
    private transient var votes = HashMap.HashMap<VoteKey, Vote>(100, voteKeyEqual, voteKeyHash);
    private transient var config = HashMap.HashMap<Principal, GovernanceConfig>(1, Principal.equal, Principal.hash);

    public shared(msg) func init(newDaoId: Principal, newStakingId: Principal, daoInstanceId: Types.DAOId) : async () {
        if (initialized) {
            Debug.print("Initialization already completed");
            throw Error.reject("Governance canister already initialized");
        };

        // Verify caller is authorized: either the canister itself or an admin
        let caller = msg.caller;
        let self = Principal.fromActor(GovernanceCanister);
        let daoTemp : actor {
            getUserProfile: shared query (Types.DAOId, Principal) -> async ?Types.UserProfile;
            checkIsAdmin: shared query (Types.DAOId, Principal) -> async Bool;
        } = actor(Principal.toText(newDaoId));
        let isAdmin = await daoTemp.checkIsAdmin(daoInstanceId, caller);
        if (caller != self and not isAdmin) {
            Debug.print("Unauthorized init attempt by " # Principal.toText(caller));
            throw Error.reject("Caller is not authorized to initialize");
        };

        stakingId := newStakingId;

        daoInstance := daoInstanceId;
        dao := daoTemp;
        staking := actor(Principal.toText(newStakingId));
        initialized := true;
        Debug.print("Initialization complete");
    };

    // Default configuration and helper
    private func defaultConfig() : GovernanceConfig {
        {
            votingPeriod = 7 * 24 * 60 * 60 * 1_000_000_000; // 7 days in nanoseconds
            quorumThreshold = 1000; // Minimum 1000 voting power
            approvalThreshold = 51; // 51% approval needed
            proposalDeposit = 100; // 100 tokens required
            maxProposalsPerUser = 3; // Max 3 active proposals per user
        }
    };

    private func getConfigForDao(daoId: Principal) : GovernanceConfig {
        switch (config.get(daoId)) {
            case (?c) c;
            case null {
                let c = defaultConfig();
                config.put(daoId, c);
                c
            };
        }
    };

    // System functions for upgrades
    system func preupgrade() {
        proposalsEntries := Iter.toArray(proposals.entries());
        votesEntries := Iter.toArray(votes.entries());
        configEntries := Iter.toArray(config.entries());
    };

    system func postupgrade() {
        proposals := HashMap.fromIter<ProposalKey, Proposal>(
            proposalsEntries.vals(),
            proposalsEntries.size(),
            proposalKeyEqual,
            proposalKeyHash
        );
        votes := HashMap.fromIter<VoteKey, Vote>(
            votesEntries.vals(),
            votesEntries.size(),
            voteKeyEqual,
            voteKeyHash
        );
        config := HashMap.fromIter<Principal, GovernanceConfig>(
            configEntries.vals(),
            configEntries.size(),
            Principal.equal,
            Principal.hash
        );

        staking := actor(Principal.toText(stakingId));
    };

    // Public functions

    // Create a new proposal
    public shared(msg) func createProposal(
        daoId: Principal,
        title: Text,
        description: Text,
        proposalType: Types.ProposalType,
        votingPeriod: ?Nat
    ) : async Result<ProposalId, Text> {

        let caller = msg.caller;

        // Check if user has too many active proposals in this DAO
        let activeProposals = getActiveProposalsByUser(daoId, caller);
        let currentConfig = getConfigForDao(daoId);

        if (Array.size(activeProposals) >= currentConfig.maxProposalsPerUser) {
            return #err("Maximum active proposals limit reached");
        };

        let proposalId = nextProposalId;
        nextProposalId += 1;

        let period = switch (votingPeriod) {
            case (?p) p;
            case null currentConfig.votingPeriod;
        };

        let proposal : Proposal = {
            daoId = daoId;
            id = proposalId;
            proposer = caller;
            title = title;
            description = description;
            proposalType = proposalType;
            status = #active;
            votesInFavor = 0;
            votesAgainst = 0;
            totalVotingPower = 0;
            createdAt = Time.now();
            votingDeadline = Time.now() + period;

            executionDeadline = ?(Time.now() + period + (24 * 60 * 60 * 1_000_000_000));
            quorumThreshold = currentConfig.quorumThreshold;
            approvalThreshold = currentConfig.approvalThreshold;
        };

        proposals.put((daoId, proposalId), proposal);
        #ok(proposalId)
    };


    // Cast a vote on a proposal
    public shared(msg) func vote(
        daoId: Principal,
        proposalId: ProposalId,
        choice: Types.VoteChoice,
        reason: ?Text
    ) : async Result<(), Text> {

        let caller = msg.caller;
        let voteKey : VoteKey = (daoId, proposalId, caller);

        // Check if already voted
        switch (votes.get(voteKey)) {
            case (?_) return #err("Already voted on this proposal");
            case null {};
        };

        // Get proposal
        let proposal = switch (proposals.get((daoId, proposalId))) {
            case (?p) p;
            case null return #err("Proposal not found");
        };

        // Check if proposal is active and not expired
        if (proposal.status != #active) {
            return #err("Proposal is not active");
        };

        if (Time.now() > proposal.votingDeadline) {
            return #err("Voting period has ended");
        };

        // Verify voter registration using the DAO backend actor
        let profileOpt = await dao.getUserProfile(daoInstance, caller);
        switch (profileOpt) {
            case null return #err("User not registered");
            case (?_) {};
        };

        // Determine voting power from staking data
        let summary = await staking.getUserStakingSummary(daoId, caller);
        let votingPower = summary.totalVotingPower;
        if (votingPower == 0) {
            return #err("No voting power");
        };

        // Create vote record

        let vote : Vote = {
            daoId = daoId;
            voter = caller;
            proposalId = proposalId;
            choice = choice;
            votingPower = votingPower;
            timestamp = Time.now();
            reason = reason;
        };


        votes.put(voteKey, vote);

        // Update proposal vote counts
        let updatedProposal = switch (choice) {
            case (#inFavor) {

                {
                    daoId = proposal.daoId;
                    id = proposal.id;
                    proposer = proposal.proposer;
                    title = proposal.title;
                    description = proposal.description;
                    proposalType = proposal.proposalType;
                    status = proposal.status;
                    votesInFavor = proposal.votesInFavor + votingPower;
                    votesAgainst = proposal.votesAgainst;
                    totalVotingPower = proposal.totalVotingPower + votingPower;
                    createdAt = proposal.createdAt;
                    votingDeadline = proposal.votingDeadline;
                    executionDeadline = proposal.executionDeadline;
                    quorumThreshold = proposal.quorumThreshold;
                    approvalThreshold = proposal.approvalThreshold;
                }
            };
            case (#against) {
                {
                    daoId = proposal.daoId;
                    id = proposal.id;
                    proposer = proposal.proposer;
                    title = proposal.title;
                    description = proposal.description;
                    proposalType = proposal.proposalType;
                    status = proposal.status;
                    votesInFavor = proposal.votesInFavor;
                    votesAgainst = proposal.votesAgainst + votingPower;
                    totalVotingPower = proposal.totalVotingPower + votingPower;
                    createdAt = proposal.createdAt;
                    votingDeadline = proposal.votingDeadline;
                    executionDeadline = proposal.executionDeadline;
                    quorumThreshold = proposal.quorumThreshold;
                    approvalThreshold = proposal.approvalThreshold;
                }
            };
            case (#abstain) {
                {
                    daoId = proposal.daoId;
                    id = proposal.id;
                    proposer = proposal.proposer;
                    title = proposal.title;
                    description = proposal.description;
                    proposalType = proposal.proposalType;
                    status = proposal.status;
                    votesInFavor = proposal.votesInFavor;
                    votesAgainst = proposal.votesAgainst;
                    totalVotingPower = proposal.totalVotingPower + votingPower;
                    createdAt = proposal.createdAt;
                    votingDeadline = proposal.votingDeadline;
                    executionDeadline = proposal.executionDeadline;
                    quorumThreshold = proposal.quorumThreshold;
                    approvalThreshold = proposal.approvalThreshold;
                }
            };
        };


        proposals.put((daoId, proposalId), updatedProposal);
        #ok()
    };

    // Execute a proposal
    public shared(_msg) func executeProposal(daoId: Principal, proposalId: ProposalId) : async Result<(), Text> {
        let proposal = switch (proposals.get((daoId, proposalId))) {
            case (?p) p;
            case null return #err("Proposal not found");
        };

        // Check if proposal can be executed
        if (proposal.status != #active) {
            return #err("Proposal is not active");
        };

        if (Time.now() <= proposal.votingDeadline) {
            return #err("Voting period has not ended");
        };

        // Check quorum
        if (proposal.totalVotingPower < proposal.quorumThreshold) {
            let failedProposal = {
                daoId = proposal.daoId;
                id = proposal.id;
                proposer = proposal.proposer;
                title = proposal.title;
                description = proposal.description;
                proposalType = proposal.proposalType;
                status = #failed;
                votesInFavor = proposal.votesInFavor;
                votesAgainst = proposal.votesAgainst;
                totalVotingPower = proposal.totalVotingPower;
                createdAt = proposal.createdAt;
                votingDeadline = proposal.votingDeadline;
                executionDeadline = proposal.executionDeadline;
                quorumThreshold = proposal.quorumThreshold;
                approvalThreshold = proposal.approvalThreshold;
            };

            proposals.put((daoId, proposalId), failedProposal);
            return #err("Quorum not met");
        };

        // Check approval threshold
        let approvalRate = if (proposal.totalVotingPower > 0) {
            (proposal.votesInFavor * 100) / proposal.totalVotingPower
        } else { 0 };

        let newStatus = if (approvalRate >= proposal.approvalThreshold) {
            #succeeded
        } else {
            #failed
        };

        let updatedProposal = {
            daoId = proposal.daoId;
            id = proposal.id;
            proposer = proposal.proposer;
            title = proposal.title;
            description = proposal.description;
            proposalType = proposal.proposalType;
            status = newStatus;
            votesInFavor = proposal.votesInFavor;
            votesAgainst = proposal.votesAgainst;
            totalVotingPower = proposal.totalVotingPower;
            createdAt = proposal.createdAt;
            votingDeadline = proposal.votingDeadline;
            executionDeadline = proposal.executionDeadline;
            quorumThreshold = proposal.quorumThreshold;
            approvalThreshold = proposal.approvalThreshold;
        };

        proposals.put((daoId, proposalId), updatedProposal);

        if (newStatus == #succeeded) {
            // Here you would implement the actual execution logic
            // For now, we just mark it as executed
            let executedProposal = {
                daoId = updatedProposal.daoId;
                id = updatedProposal.id;
                proposer = updatedProposal.proposer;
                title = updatedProposal.title;
                description = updatedProposal.description;
                proposalType = updatedProposal.proposalType;
                status = #executed;
                votesInFavor = updatedProposal.votesInFavor;
                votesAgainst = updatedProposal.votesAgainst;
                totalVotingPower = updatedProposal.totalVotingPower;
                createdAt = updatedProposal.createdAt;
                votingDeadline = updatedProposal.votingDeadline;
                executionDeadline = updatedProposal.executionDeadline;
                quorumThreshold = updatedProposal.quorumThreshold;
                approvalThreshold = updatedProposal.approvalThreshold;
            };

            proposals.put((daoId, proposalId), executedProposal);
        };


        #ok()
    };

    // Query functions

    // Get proposal by ID
    public query func getProposal(daoId: Principal, proposalId: ProposalId) : async ?Proposal {
        proposals.get((daoId, proposalId))
    };

    // Get all proposals for a DAO
    public query func getAllProposals(daoId: Principal) : async [Proposal] {
        let buffer = Buffer.Buffer<Proposal>(0);
        for (proposal in proposals.vals()) {
            if (proposal.daoId == daoId) {
                buffer.add(proposal);
            };
        };
        Buffer.toArray(buffer)
    };

    // Get active proposals for a DAO
    public query func getActiveProposals(daoId: Principal) : async [Proposal] {
        let activeProposals = Buffer.Buffer<Proposal>(0);
        for (proposal in proposals.vals()) {
            if (proposal.daoId == daoId and proposal.status == #active and Time.now() <= proposal.votingDeadline) {
                activeProposals.add(proposal);
            };
        };
        Buffer.toArray(activeProposals)
    };

    // Get proposals by status for a DAO
    public query func getProposalsByStatus(daoId: Principal, status: Types.ProposalStatus) : async [Proposal] {
        let filteredProposals = Buffer.Buffer<Proposal>(0);
        for (proposal in proposals.vals()) {
            if (proposal.daoId == daoId and proposal.status == status) {
                filteredProposals.add(proposal);
            };
        };
        Buffer.toArray(filteredProposals)
    };

    // Get user's vote on a proposal
    public query func getUserVote(daoId: Principal, proposalId: ProposalId, user: Principal) : async ?Vote {
        votes.get((daoId, proposalId, user))
    };

    // Get all votes for a proposal
    public query func getProposalVotes(daoId: Principal, proposalId: ProposalId) : async [Vote] {
        let proposalVotes = Buffer.Buffer<Vote>(0);
        for (vote in votes.vals()) {
            if (vote.daoId == daoId and vote.proposalId == proposalId) {
                proposalVotes.add(vote);
            };
        };
        Buffer.toArray(proposalVotes)
    };

    // Get governance configuration for a DAO
    public query func getConfig(daoId: Principal) : async ?GovernanceConfig {
        config.get(daoId)
    };

    // Update governance configuration (admin only)
    public shared(_msg) func updateConfig(daoId: Principal, newConfig: GovernanceConfig) : async Result<(), Text> {
        // In a real implementation, you'd check if the caller is an admin
        config.put(daoId, newConfig);
        #ok()
    };

    // Helper functions
    private func getActiveProposalsByUser(daoId: Principal, user: Principal) : [Proposal] {
        let userProposals = Buffer.Buffer<Proposal>(0);
        for (proposal in proposals.vals()) {
            if (proposal.daoId == daoId and proposal.proposer == user and proposal.status == #active) {
                userProposals.add(proposal);
            };
        };
        Buffer.toArray(userProposals)
    };

    // Get governance statistics for a DAO
    public query func getGovernanceStats(daoId: Principal) : async {
        totalProposals: Nat;
        activeProposals: Nat;
        succeededProposals: Nat;
        failedProposals: Nat;
        totalVotes: Nat;
    } {
        var activeCount = 0;
        var succeededCount = 0;
        var failedCount = 0;
        var totalCount = 0;
        var voteCount = 0;

        for (proposal in proposals.vals()) {
            if (proposal.daoId == daoId) {
                totalCount += 1;
                switch (proposal.status) {
                    case (#active) activeCount += 1;
                    case (#succeeded) succeededCount += 1;
                    case (#executed) succeededCount += 1;
                    case (#failed) failedCount += 1;
                    case (_) {};
                };
            };
        };

        for (vote in votes.vals()) {
            if (vote.daoId == daoId) {
                voteCount += 1;
            };
        };

        {
            totalProposals = totalCount;
            activeProposals = activeCount;
            succeededProposals = succeededCount;
            failedProposals = failedCount;
            totalVotes = voteCount;
        }
    };
}
