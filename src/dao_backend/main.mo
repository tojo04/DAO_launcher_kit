import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Array "mo:base/Array";

import Types "shared/types";

/**
 * Main DAO Backend Canister
 * 
 * This is the central coordinator canister for the DAO system. It manages:
 * - DAO initialization and configuration
 * - User profile management and registration
 * - Admin permissions and access control
 * - Canister reference management for the modular architecture
 * - Cross-canister communication coordination
 * 
 * The canister follows the upgrade-safe pattern with stable variables
 * and proper state management for Internet Computer upgrades.
 */
persistent actor DAOMain {
    // Type aliases for cleaner code and better readability
    type Result<T, E> = Result.Result<T, E>;
    type Proposal = Types.Proposal;
    type Vote = Types.Vote;
    type ProposalId = Types.ProposalId;
    type Stake = Types.Stake;
    type StakeId = Types.StakeId;
    type TokenAmount = Types.TokenAmount;
    type UserProfile = Types.UserProfile;
    type DAOStats = Types.DAOStats;
    type DAOConfig = Types.DAOConfig;
    type Activity = Types.Activity;
    type DAOId = Types.DAOId;

    // Stable storage for upgrades - persisted per DAO
    private type DAOStable = {
        initialized: Bool;
        name: Text;
        description: Text;
        totalMembers: Nat;
        userProfilesEntries: [(Principal, UserProfile)];
        adminPrincipalsEntries: [Principal];
        daoConfig: ?DAOConfig;
        governanceCanister: ?Principal;
        stakingCanister: ?Principal;
        treasuryCanister: ?Principal;
        proposalsCanister: ?Principal;
    };

    private var daoStatesEntries : [(DAOId, DAOStable)] = [];

    // Runtime storage - recreated after upgrades from stable storage
    private type DAOState = {
        var initialized: Bool;
        var daoName: Text;
        var daoDescription: Text;
        var totalMembers: Nat;
        var userProfiles: HashMap.HashMap<Principal, UserProfile>;
        var adminPrincipals: HashMap.HashMap<Principal, Bool>;
        var daoConfig: ?DAOConfig;
        var governanceCanister: ?Principal;
        var stakingCanister: ?Principal;
        var treasuryCanister: ?Principal;
        var proposalsCanister: ?Principal;
    };

    private transient var daoStates = HashMap.HashMap<DAOId, DAOState>(10, Text.equal, Text.hash);

    // System functions for upgrades
    /**
     * Pre-upgrade hook - Serializes runtime state to stable storage
     * Called automatically before canister upgrade to preserve data
     */
    system func preupgrade() {
        daoStatesEntries := Iter.toArray(
            Iter.map<(DAOId, DAOState),(DAOId, DAOStable)>(
                daoStates.entries(),
                func (entry: (DAOId, DAOState)) : (DAOId, DAOStable) {
                    let (id, state) = entry;
                    (id, {
                        initialized = state.initialized;
                        name = state.daoName;
                        description = state.daoDescription;
                        totalMembers = state.totalMembers;
                        userProfilesEntries = Iter.toArray(state.userProfiles.entries());
                        adminPrincipalsEntries = Iter.toArray(state.adminPrincipals.keys());
                        daoConfig = state.daoConfig;
                        governanceCanister = state.governanceCanister;
                        stakingCanister = state.stakingCanister;
                        treasuryCanister = state.treasuryCanister;
                        proposalsCanister = state.proposalsCanister;
                    })
                }
            )
        );
    };

    /**
     * Post-upgrade hook - Restores runtime state from stable storage
     * Called automatically after canister upgrade to restore functionality
     */
    system func postupgrade() {
        daoStates := HashMap.HashMap<DAOId, DAOState>(daoStatesEntries.size(), Text.equal, Text.hash);
        for ((id, stableState) in daoStatesEntries.vals()) {
            let userMap = HashMap.fromIter<Principal, UserProfile>(
                stableState.userProfilesEntries.vals(),
                stableState.userProfilesEntries.size(),
                Principal.equal,
                Principal.hash
            );
            let adminMap = HashMap.HashMap<Principal, Bool>(stableState.adminPrincipalsEntries.size(), Principal.equal, Principal.hash);
            for (admin in stableState.adminPrincipalsEntries.vals()) {
                adminMap.put(admin, true);
            };
            daoStates.put(id, {
                initialized = stableState.initialized;
                daoName = stableState.name;
                daoDescription = stableState.description;
                totalMembers = stableState.totalMembers;
                userProfiles = userMap;
                adminPrincipals = adminMap;
                daoConfig = stableState.daoConfig;
                governanceCanister = stableState.governanceCanister;
                stakingCanister = stableState.stakingCanister;
                treasuryCanister = stableState.treasuryCanister;
                proposalsCanister = stableState.proposalsCanister;
            });
        };
    };

    private func ensureDAO(daoId: DAOId) : DAOState {
        switch (daoStates.get(daoId)) {
            case (?state) state;
            case null Debug.trap("DAO not initialized");
        }
    };

    /**
     * Initialize the DAO with basic configuration
     *
     * This is the first function called when setting up a new DAO.
     * It establishes the foundational parameters and admin structure.
     *
     * @param daoId - Unique identifier for the DAO
     * @param name - Human-readable name for the DAO
     * @param description - Brief description of the DAO's purpose
     * @param initialAdmins - Array of Principal IDs who will have admin privileges
     * @returns Result indicating success or failure with error message
     */
    public shared(msg) func initialize(
        daoId: DAOId,
        name: Text,
        description: Text,
        initialAdmins: [Principal]
    ) : async Result<(), Text> {
        let state = switch (daoStates.get(daoId)) {
            case (?existing) {
                if (existing.initialized) {
                    return #err("DAO already initialized");
                };
                existing
            };
            case null {
                let newState : DAOState = {
                    initialized = false;
                    daoName = "";
                    daoDescription = "";
                    totalMembers = 0;
                    userProfiles = HashMap.HashMap<Principal, UserProfile>(100, Principal.equal, Principal.hash);
                    adminPrincipals = HashMap.HashMap<Principal, Bool>(10, Principal.equal, Principal.hash);
                    daoConfig = null;
                    governanceCanister = null;
                    stakingCanister = null;
                    treasuryCanister = null;
                    proposalsCanister = null;
                };
                daoStates.put(daoId, newState);
                newState
            };
        };

        state.daoName := name;
        state.daoDescription := description;

        for (admin in initialAdmins.vals()) {
            state.adminPrincipals.put(admin, true);
        };
        state.adminPrincipals.put(msg.caller, true);

        state.initialized := true;
        Debug.print("DAO initialized: " # name);
        #ok()
    };

    /**
     * Set references to other canisters in the DAO ecosystem
     * 
     * This establishes the microservices architecture by connecting
     * the main canister to specialized function canisters.
     * 
     * @param governance - Principal ID of the governance canister
     * @param staking - Principal ID of the staking canister  
     * @param treasury - Principal ID of the treasury canister
     * @param proposals - Principal ID of the proposals canister
     * @returns Result indicating success or failure
     */
    public shared(msg) func setCanisterReferences(
        daoId: DAOId,
        governance: Principal,
        staking: Principal,
        treasury: Principal,
        proposals: Principal
    ) : async Result<(), Text> {
        if (not isAdmin(daoId, msg.caller)) {
            return #err("Only admins can set canister references");
        };

        let state = ensureDAO(daoId);
        if (not state.initialized) {
            return #err("DAO not initialized");
        };
        state.governanceCanister := ?governance;
        state.stakingCanister := ?staking;
        state.treasuryCanister := ?treasury;
        state.proposalsCanister := ?proposals;

        Debug.print("Canister references set successfully");
        #ok()
    };

    // DAO configuration
    public shared(msg) func setDAOConfig(daoId: DAOId, config: DAOConfig) : async Result<(), Text> {
        if (not isAdmin(daoId, msg.caller)) {
            return #err("Only admins can set DAO configuration");
        };
        let state = ensureDAO(daoId);
        if (not state.initialized) {
            return #err("DAO not initialized");
        };
        state.daoConfig := ?config;
        Debug.print("DAO configuration saved");
        #ok()
    };

    // User management

    public shared(msg) func registerUser(daoId: DAOId, displayName: Text, bio: Text) : async Result<(), Text> {
        let caller = msg.caller;
        let state = ensureDAO(daoId);
        if (not state.initialized) {
            return #err("DAO not initialized");
        };

        switch (state.userProfiles.get(caller)) {
            case (?_) return #err("User already registered");
            case null {};
        };

        let userProfile : UserProfile = {
            daoId = daoId;
            id = caller;
            displayName = displayName;
            bio = bio;
            joinedAt = Time.now();
            reputation = 0;
            totalStaked = 0;
            votingPower = 0;
        };


        state.userProfiles.put(caller, userProfile);
        state.totalMembers += 1;

        Debug.print("User registered: " # displayName);
        #ok()
    };


    public shared(msg) func adminRegisterUser(daoId: DAOId, newUser: Principal, displayName: Text, bio: Text) : async Result<(), Text> {
        if (not isAdmin(daoId, msg.caller)) {
            return #err("Only admins can register users");
        };

        let state = ensureDAO(daoId);
        if (not state.initialized) {
            return #err("DAO not initialized");
        };

        switch (state.userProfiles.get(newUser)) {
            case (?_) return #err("User already registered");
            case null {};
        };

        let userProfile : UserProfile = {
            daoId = daoId;
            id = newUser;
            displayName = displayName;
            bio = bio;
            joinedAt = Time.now();
            reputation = 0;
            totalStaked = 0;
            votingPower = 0;
        };

        state.userProfiles.put(newUser, userProfile);
        state.totalMembers += 1;

        Debug.print("User registered by admin: " # displayName);
        #ok()
    };


    public shared(msg) func updateUserProfile(daoId: DAOId, displayName: Text, bio: Text) : async Result<(), Text> {
        let caller = msg.caller;
        let state = ensureDAO(daoId);
        if (not state.initialized) {
            return #err("DAO not initialized");
        };

        switch (state.userProfiles.get(caller)) {
            case null return #err("User not found");
            case (?profile) {
                let updatedProfile = {
                    daoId = daoId;
                    id = profile.id;
                    displayName = displayName;
                    bio = bio;
                    joinedAt = profile.joinedAt;
                    reputation = profile.reputation;
                    totalStaked = profile.totalStaked;
                    votingPower = profile.votingPower;
                };

                state.userProfiles.put(caller, updatedProfile);
                #ok()
            };
        };
    };

    // Query functions
    public query func getDAOInfo(daoId: DAOId) : async {
        name: Text;
        description: Text;
        totalMembers: Nat;
        initialized: Bool;
    } {
        switch (daoStates.get(daoId)) {
            case (?state) {
                {
                    name = state.daoName;
                    description = state.daoDescription;
                    totalMembers = state.totalMembers;
                    initialized = state.initialized;
                }
            };
            case null {
                {
                    name = "";
                    description = "";
                    totalMembers = 0;
                    initialized = false;
                }
            }
        }
    };

    public query func getDAOConfig(daoId: DAOId) : async ?DAOConfig {
        switch (daoStates.get(daoId)) {
            case (?state) state.daoConfig;
            case null null;
        }
    };

    public query func getUserProfile(daoId: DAOId, userId: Principal) : async ?UserProfile {
        switch (daoStates.get(daoId)) {
            case (?state) state.userProfiles.get(userId);
            case null null;
        }
    };

    public query func getAllUsers(daoId: DAOId) : async [UserProfile] {
        switch (daoStates.get(daoId)) {
            case (?state) Iter.toArray(state.userProfiles.vals());
            case null [];
        }
    };

    public query func getCanisterReferences(daoId: DAOId) : async {
        governance: ?Principal;
        staking: ?Principal;
        treasury: ?Principal;
        proposals: ?Principal;
    } {
        switch (daoStates.get(daoId)) {
            case (?state) {
                {
                    governance = state.governanceCanister;
                    staking = state.stakingCanister;
                    treasury = state.treasuryCanister;
                    proposals = state.proposalsCanister;
                }
            };
            case null {
                {
                    governance = null;
                    staking = null;
                    treasury = null;
                    proposals = null;
                }
            }
        }
    };

    public query func getDAOStats(daoId: DAOId) : async DAOStats {
        switch (daoStates.get(daoId)) {
            case (?state) {
                {
                    totalMembers = state.totalMembers;
                    totalProposals = 0;
                    activeProposals = 0;
                    totalStaked = 0;
                    treasuryBalance = 0;
                    totalVotingPower = 0;
                }
            };
            case null {
                {
                    totalMembers = 0;
                    totalProposals = 0;
                    activeProposals = 0;
                    totalStaked = 0;
                    treasuryBalance = 0;
                    totalVotingPower = 0;
                }
            }
        }
    };

    // Recent activity
    public query func getRecentActivity() : async [Activity] {
        // This function will aggregate recent activity from various DAO modules.
        // For now, return an empty list as a placeholder implementation.
        []
    };

    // Governance operations routed to dedicated canisters
    public func getGovernanceStats(daoId: DAOId) : async {
        totalProposals: Nat;
        activeProposals: Nat;
        passedProposals: Nat;
        totalVotingPower: Nat;
    } {
        switch (daoStates.get(daoId)) {
            case (?state) {
                switch (state.governanceCanister) {
                    case (?canisterId) {
                        let governance : actor {
                            getGovernanceStats : shared query (Principal) -> async {
                                totalProposals: Nat;
                                activeProposals: Nat;
                                succeededProposals: Nat;
                                failedProposals: Nat;
                                totalVotes: Nat;
                            };
                        } = actor(Principal.toText(canisterId));
                        let stats = await governance.getGovernanceStats(Principal.fromText(daoId));
                        {
                            totalProposals = stats.totalProposals;
                            activeProposals = stats.activeProposals;
                            passedProposals = stats.succeededProposals;
                            totalVotingPower = stats.totalVotes;
                        }
                    };
                    case null {
                        {
                            totalProposals = 0;
                            activeProposals = 0;
                            passedProposals = 0;
                            totalVotingPower = 0;
                        }
                    };
                }
            };
            case null {
                {
                    totalProposals = 0;
                    activeProposals = 0;
                    passedProposals = 0;
                    totalVotingPower = 0;
                }
            };
        }
    };

    public shared(msg) func createProposal(
        daoId: DAOId,
        title: Text,
        description: Text,
        _proposalType: Text
    ) : async Result<Nat, Text> {
        if (not isRegisteredUser(daoId, msg.caller)) {
            return #err("Only registered users can create proposals");
        };
        switch (daoStates.get(daoId)) {
            case (?state) {
                switch (state.proposalsCanister) {
                    case (?canisterId) {
                        let proposals : actor {
                            createProposal : shared (Principal, Text, Text, Types.ProposalType, ?Text, ?Nat) -> async Result<Nat, Text>;
                        } = actor(Principal.toText(canisterId));
                        let res = await proposals.createProposal(
                            Principal.fromText(daoId),
                            title,
                            description,
                            #textProposal(description),
                            null,
                            null
                        );
                        res
                    };
                    case null { #err("Proposals canister not configured") };
                }
            };
            case null { #err("DAO not found") };
        }
    };

    public shared(msg) func vote(
        daoId: DAOId,
        proposalId: Nat,
        choice: Text,
        reason: ?Text
    ) : async Result<(), Text> {
        if (not isRegisteredUser(daoId, msg.caller)) {
            return #err("Only registered users can vote");
        };
        switch (daoStates.get(daoId)) {
            case (?state) {
                switch (state.proposalsCanister) {
                    case (?canisterId) {
                        let proposals : actor {
                            vote : shared (Principal, Nat, Types.VoteChoice, ?Text) -> async Result<(), Text>;
                        } = actor(Principal.toText(canisterId));
                        let voteChoice = switch (choice) {
                            case ("inFavor") #inFavor;
                            case ("against") #against;
                            case _ #abstain;
                        };
                        let res = await proposals.vote(
                            Principal.fromText(daoId),
                            proposalId,
                            voteChoice,
                            reason
                        );
                        res
                    };
                    case null { #err("Proposals canister not configured") };
                }
            };
            case null { #err("DAO not found") };
        }
    };

    // Utility functions
    private func isAdmin(daoId: DAOId, principal: Principal) : Bool {
        switch (daoStates.get(daoId)) {
            case (?state) {
                switch (state.adminPrincipals.get(principal)) {
                    case (?_) true;
                    case null false;
                }
            };
            case null false;
        }
    };

    private func isRegisteredUser(daoId: DAOId, principal: Principal) : Bool {
        switch (daoStates.get(daoId)) {
            case (?state) {
                switch (state.userProfiles.get(principal)) {
                    case (?_) true;
                    case null false;
                }
            };
            case null false;
        }
    };

    public query func checkIsAdmin(daoId: DAOId, principal: Principal) : async Bool {
        isAdmin(daoId, principal)
    };

    // Admin functions
    public shared(msg) func addAdmin(daoId: DAOId, newAdmin: Principal) : async Result<(), Text> {
        if (not isAdmin(daoId, msg.caller)) {
            return #err("Only admins can add other admins");
        };

        let state = ensureDAO(daoId);
        if (not state.initialized) {
            return #err("DAO not initialized");
        };
        state.adminPrincipals.put(newAdmin, true);
        Debug.print("New admin added: " # Principal.toText(newAdmin));
        #ok()
    };

    public shared(msg) func removeAdmin(daoId: DAOId, adminToRemove: Principal) : async Result<(), Text> {
        if (not isAdmin(daoId, msg.caller)) {
            return #err("Only admins can remove other admins");
        };

        if (msg.caller == adminToRemove) {
            return #err("Cannot remove yourself as admin");
        };

        let state = ensureDAO(daoId);
        if (not state.initialized) {
            return #err("DAO not initialized");
        };
        state.adminPrincipals.delete(adminToRemove);
        Debug.print("Admin removed: " # Principal.toText(adminToRemove));
        #ok()
    };

    // Health check
    public query func health() : async { status: Text; timestamp: Int } {
        {
            status = "healthy";
            timestamp = Time.now();
        }
    };

    // Greet function (keeping for compatibility)
    public query func greet(daoId: DAOId, name : Text) : async Text {
        let daoName = switch (daoStates.get(daoId)) {
            case (?state) state.daoName;
            case null "DAO";
        };
        return "Hello, " # name # "! Welcome to " # daoName;
    };
};
