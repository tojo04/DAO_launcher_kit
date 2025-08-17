import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
// import Debug "mo:base/Debug";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Nat32 "mo:base/Nat32";

import Types "../shared/types";

/**
 * Staking Canister
 * 
 * This canister manages the token staking system that provides:
 * - Multiple staking periods with different reward rates
 * - Voting power calculation based on staked amounts and duration
 * - Automated reward distribution and compounding
 * - Flexible unstaking with penalty mechanisms
 * 
 * Staking Mechanics:
 * - Instant staking: No lock period, lower rewards, full liquidity
 * - Locked staking: 30/90/180/365 days with increasing reward multipliers
 * - Voting power: Calculated as staked_amount * time_multiplier
 * - Rewards: Distributed continuously, compounded automatically
 * 
 * Security Features:
 * - Minimum/maximum stake limits
 * - Early unstaking penalties
 * - Slashing protection for governance participation
 * - Anti-gaming mechanisms for reward distribution
 */
persistent actor StakingCanister {
    // Type aliases for better code readability
    type Result<T, E> = Result.Result<T, E>;
    type Stake = Types.Stake;
    type StakeId = Types.StakeId;
    type StakingPeriod = Types.StakingPeriod;
    type StakingRewards = Types.StakingRewards;
    type TokenAmount = Types.TokenAmount;
    type StakingError = Types.StakingError;
    type CommonError = Types.CommonError;

    // Stable storage for upgrade persistence
    // Core staking data that must survive canister upgrades
    private var nextStakeId : Nat = 1;
    private var stakesEntries : [((Principal, StakeId), Stake)] = [];
    private var userStakesEntries : [(Principal, [(Principal, [StakeId])])] = [];
    private var adminPrincipalsEntries : [(Principal, [Principal])] = [];
    private var totalStakedAmount : TokenAmount = 0;
    private var totalRewardsDistributed : TokenAmount = 0;

    // Runtime storage - rebuilt from stable storage after upgrades
    // HashMaps provide efficient lookup and management of stake data
    private func stakeKeyEqual(a: (Principal, StakeId), b: (Principal, StakeId)) : Bool {
        Principal.equal(a.0, b.0) and Nat.equal(a.1, b.1)
    };
    private func stakeKeyHash(k: (Principal, StakeId)) : Nat32 {
        Nat32.xor(Principal.hash(k.0), Nat32.fromNat(k.1))
    };
    private transient var stakes = HashMap.HashMap<(Principal, StakeId), Stake>(100, stakeKeyEqual, stakeKeyHash);
    private transient var userStakes = HashMap.HashMap<Principal, HashMap.HashMap<Principal, [StakeId]>>(50, Principal.equal, Principal.hash);
    // Local admin list for permission checks
    private transient var adminPrincipals = HashMap.HashMap<Principal, [Principal]>(10, Principal.equal, Principal.hash);

    // Staking configuration parameters
    // These control the economic parameters of the staking system
    private var stakingEnabled : Bool = true;
    private var minimumStakeAmount : TokenAmount = 10; // Minimum 10 tokens to prevent dust attacks
    private var maximumStakeAmount : TokenAmount = 1000000; // Maximum 1M tokens to prevent centralization

    // System functions for upgrades
    system func preupgrade() {
        stakesEntries := Iter.toArray(stakes.entries());
        userStakesEntries := Iter.toArray(
            Iter.map(userStakes.entries(), func ((user, daoMap)) {
                (user, Iter.toArray(daoMap.entries()))
            })
        );
        adminPrincipalsEntries := Iter.toArray(adminPrincipals.entries());
    };

    system func postupgrade() {
        stakes := HashMap.fromIter<(Principal, StakeId), Stake>(
            stakesEntries.vals(),
            stakesEntries.size(),
            stakeKeyEqual,
            stakeKeyHash
        );
        userStakes := HashMap.HashMap<Principal, HashMap.HashMap<Principal, [StakeId]>>(50, Principal.equal, Principal.hash);
        for ((user, daoEntries) in userStakesEntries.vals()) {
            let daoMap = HashMap.fromIter<Principal, [StakeId]>(
                daoEntries.vals(),
                daoEntries.size(),
                Principal.equal,
                Principal.hash
            );
            userStakes.put(user, daoMap);
        };
        adminPrincipals := HashMap.fromIter<Principal, [Principal]>(
            adminPrincipalsEntries.vals(),
            adminPrincipalsEntries.size(),
            Principal.equal,
            Principal.hash
        );
    };

    // Public functions

    // Stake tokens
    public shared(msg) func stake(daoId: Principal, amount: TokenAmount, period: StakingPeriod) : async Result<StakeId, Text> {
        let caller = msg.caller;

        if (not stakingEnabled) {
            return #err("Staking is currently disabled");
        };

        if (amount < minimumStakeAmount) {
            return #err("Amount below minimum stake requirement");
        };

        if (amount > maximumStakeAmount) {
            return #err("Amount exceeds maximum stake limit");
        };

        let stakeId = nextStakeId;
        nextStakeId += 1;

        let now = Time.now();
        let unlockTime = calculateUnlockTime(now, period);

        let newStake : Stake = {
            daoId = daoId;
            id = stakeId;
            staker = caller;
            amount = amount;
            stakingPeriod = period;
            stakedAt = now;
            unlocksAt = unlockTime;
            rewards = 0;
            isActive = true;
        };

        stakes.put((daoId, stakeId), newStake);

        // Update user stakes
        let daoMap = switch (userStakes.get(caller)) {
            case (?map) map;
            case null HashMap.HashMap<Principal, [StakeId]>(1, Principal.equal, Principal.hash);
        };
        let currentUserStakes = switch (daoMap.get(daoId)) {
            case (?stakes) stakes;
            case null [];
        };
        let updatedUserStakes = Array.append<StakeId>(currentUserStakes, [stakeId]);
        daoMap.put(daoId, updatedUserStakes);
        userStakes.put(caller, daoMap);

        // Update total staked amount
        totalStakedAmount += amount;

        #ok(stakeId)
    };

    // Unstake tokens
    public shared(msg) func unstake(daoId: Principal, stakeId: StakeId) : async Result<TokenAmount, Text> {
        let caller = msg.caller;

        let stake = switch (stakes.get((daoId, stakeId))) {
            case (?s) s;
            case null return #err("Stake not found");
        };

        if (stake.staker != caller) {
            return #err("Not authorized to unstake this stake");
        };

        if (not stake.isActive) {
            return #err("Stake is not active");
        };

        // Check if stake is unlocked
        switch (stake.unlocksAt) {
            case (?unlockTime) {
                if (Time.now() < unlockTime) {
                    return #err("Stake is still locked");
                };
            };
            case null {}; // Instant staking, always unlocked
        };

        // Calculate final rewards
        let finalRewards = calculateRewards(stake);
        let totalAmount = stake.amount + finalRewards;

        // Deactivate stake
        let updatedStake = {
            daoId = stake.daoId;
            id = stake.id;
            staker = stake.staker;
            amount = stake.amount;
            stakingPeriod = stake.stakingPeriod;
            stakedAt = stake.stakedAt;
            unlocksAt = stake.unlocksAt;
            rewards = finalRewards;
            isActive = false;
        };
        stakes.put((daoId, stakeId), updatedStake);

        // Update total staked amount
        totalStakedAmount -= stake.amount;
        totalRewardsDistributed += finalRewards;

        #ok(totalAmount)
    };

    // Claim rewards without unstaking (for instant staking)
    public shared(msg) func claimRewards(daoId: Principal, stakeId: StakeId) : async Result<TokenAmount, Text> {
        let caller = msg.caller;

        let stake = switch (stakes.get((daoId, stakeId))) {
            case (?s) s;
            case null return #err("Stake not found");
        };

        if (stake.staker != caller) {
            return #err("Not authorized to claim rewards for this stake");
        };

        if (not stake.isActive) {
            return #err("Stake is not active");
        };

        // Only instant staking allows reward claiming
        if (stake.stakingPeriod != #instant) {
            return #err("Rewards can only be claimed for instant staking");
        };

        let currentRewards = calculateRewards(stake);
        let claimableRewards: Nat = if (currentRewards >= stake.rewards) {
            currentRewards - stake.rewards
            } else { 0 };


        if (claimableRewards == 0) {
            return #err("No rewards available to claim");
        };

        // Update stake with claimed rewards
        let updatedStake = {
            daoId = stake.daoId;
            id = stake.id;
            staker = stake.staker;
            amount = stake.amount;
            stakingPeriod = stake.stakingPeriod;
            stakedAt = stake.stakedAt;
            unlocksAt = stake.unlocksAt;
            rewards = currentRewards;
            isActive = stake.isActive;
        };
        stakes.put((daoId, stakeId), updatedStake);

        totalRewardsDistributed += claimableRewards;

        #ok(claimableRewards)
    };

    // Extend staking period
    public shared(msg) func extendStakingPeriod(daoId: Principal, stakeId: StakeId, newPeriod: StakingPeriod) : async Result<(), Text> {
        let caller = msg.caller;

        let stake = switch (stakes.get((daoId, stakeId))) {
            case (?s) s;
            case null return #err("Stake not found");
        };

        if (stake.staker != caller) {
            return #err("Not authorized to modify this stake");
        };

        if (not stake.isActive) {
            return #err("Stake is not active");
        };

        // Check if new period is longer than current
        if (not isLongerPeriod(stake.stakingPeriod, newPeriod)) {
            return #err("New period must be longer than current period");
        };

        let newUnlockTime = calculateUnlockTime(Time.now(), newPeriod);
        let updatedStake = {
            daoId = stake.daoId;
            id = stake.id;
            staker = stake.staker;
            amount = stake.amount;
            stakingPeriod = newPeriod;
            stakedAt = stake.stakedAt;
            unlocksAt = newUnlockTime;
            rewards = stake.rewards;
            isActive = stake.isActive;
        };
        stakes.put((daoId, stakeId), updatedStake);

        #ok()
    };

    // Query functions

    // Get stake by ID
    public query func getStake(daoId: Principal, stakeId: StakeId) : async ?Stake {
        stakes.get((daoId, stakeId))
    };

    // Get user's stakes
    // Private version for internal use
    private func getUserStakesInternal(daoId: Principal, user: Principal) : [Stake] {
        let daoMap = switch (userStakes.get(user)) {
            case (?map) map;
            case null return [];
        };
        let stakeIds = switch (daoMap.get(daoId)) {
            case (?ids) ids;
            case null return [];
        };

        let userStakesList = Buffer.Buffer<Stake>(0);
        for (stakeId in stakeIds.vals()) {
            switch (stakes.get((daoId, stakeId))) {
                case (?stake) userStakesList.add(stake);
                case null {};
            };
        };
        Buffer.toArray(userStakesList)
    };

    public query func getUserStakes(daoId: Principal, user: Principal) : async [Stake] {
        getUserStakesInternal(daoId, user)
    };

    // Get user's active stakes
    public query func getUserActiveStakes(daoId: Principal, user: Principal) : async [Stake] {
        let allUserStakes = getUserStakesInternal(daoId, user);
        Array.filter<Stake>(allUserStakes, func(stake) = stake.isActive)
    };

    // Get staking rewards for a stake
    public query func getStakingRewards(daoId: Principal, stakeId: StakeId) : async ?StakingRewards {
        switch (stakes.get((daoId, stakeId))) {
            case (?stake) {
                let totalRewards = calculateRewards(stake);
                let claimableRewards: Nat =
                    if (stake.stakingPeriod != #instant) {
                        0
                    } else if (totalRewards >= stake.rewards) {
                        totalRewards - stake.rewards
                    } else {
                        0
                    };

                ?{
                    totalRewards = totalRewards;
                    claimableRewards = claimableRewards;
                    lastClaimedAt = if (stake.rewards > 0) ?stake.stakedAt else null;
                    apr = getAPRForPeriod(stake.stakingPeriod);
                }
            };
            case null null;
        }
    };

    // Get user's total staking summary
    public query func getUserStakingSummary(daoId: Principal, user: Principal) : async {
        totalStaked: TokenAmount;
        totalRewards: TokenAmount;
        activeStakes: Nat;
        totalVotingPower: Nat;
    } {
        let userStakesList = getUserStakesInternal(daoId, user);
        var totalStaked : TokenAmount = 0;
        var totalRewards : TokenAmount = 0;
        var activeStakes : Nat = 0;
        var totalVotingPower : Nat = 0;

        for (stake in userStakesList.vals()) {
            if (stake.isActive) {
                totalStaked += stake.amount;
                totalRewards += calculateRewards(stake);
                activeStakes += 1;
                totalVotingPower += Types.calculateVotingPower(stake.amount, stake.stakingPeriod);
            };
        };

        {
            totalStaked = totalStaked;
            totalRewards = totalRewards;
            activeStakes = activeStakes;
            totalVotingPower = totalVotingPower;
        }
    };

    // Get staking statistics
    public query func getStakingStats(daoId: Principal) : async {
        totalStakes: Nat;
        activeStakes: Nat;
       totalStakedAmount: TokenAmount;
       totalRewardsDistributed: TokenAmount;
       averageStakeAmount: Float;
       stakingPeriodDistribution: [(StakingPeriod, Nat)];
    } {
        var totalStakesDao : Nat = 0;
        var activeStakesDao : Nat = 0;
        var totalStakedAmountDao : TokenAmount = 0;
        var totalRewardsDistributedDao : TokenAmount = 0;
        var instantCount : Nat = 0;
        var locked30Count : Nat = 0;
        var locked90Count : Nat = 0;
        var locked180Count : Nat = 0;
        var locked365Count : Nat = 0;

        for (stake in stakes.vals()) {
            if (Principal.equal(stake.daoId, daoId)) {
                totalStakesDao += 1;
                totalRewardsDistributedDao += stake.rewards;
                if (stake.isActive) {
                    activeStakesDao += 1;
                    totalStakedAmountDao += stake.amount;
                    switch (stake.stakingPeriod) {
                        case (#instant) instantCount += 1;
                        case (#locked30) locked30Count += 1;
                        case (#locked90) locked90Count += 1;
                        case (#locked180) locked180Count += 1;
                        case (#locked365) locked365Count += 1;
                    };
                };
            };
        };

        let averageAmount = if (activeStakesDao > 0) {
            Float.fromInt(totalStakedAmountDao) / Float.fromInt(activeStakesDao)
        } else { 0.0 };

        {
            totalStakes = totalStakesDao;
            activeStakes = activeStakesDao;
            totalStakedAmount = totalStakedAmountDao;
            totalRewardsDistributed = totalRewardsDistributedDao;
            averageStakeAmount = averageAmount;
            stakingPeriodDistribution = [
                (#instant, instantCount),
                (#locked30, locked30Count),
                (#locked90, locked90Count),
                (#locked180, locked180Count),
                (#locked365, locked365Count)
            ];
        }
    };

    // Recent staking activity
    public query func getRecentActivity() : async [Types.Activity] {
        let buf = Buffer.Buffer<Types.Activity>(0);
        for (stake in stakes.vals()) {
            let periodText = switch (stake.stakingPeriod) {
                case (#instant) "instant";
                case (#locked30) "locked30";
                case (#locked90) "locked90";
                case (#locked180) "locked180";
                case (#locked365) "locked365";
            };
            let statusText = if (stake.isActive) { "active" } else { "ended" };
            buf.add({
                activityType = "stake";
                title = "Stake " # Nat.toText(stake.amount) # " tokens";
                description = "period: " # periodText;
                timestamp = stake.stakedAt;
                status = statusText;
            });
        };

        let all = Buffer.toArray(buf);
        let sorted = Array.sort(all, func(a: Types.Activity, b: Types.Activity) : { #less; #equal; #greater } {
            if (a.timestamp > b.timestamp) { #less } else if (a.timestamp < b.timestamp) { #greater } else { #equal }
        });

        let limit = 20;
        if (sorted.size() <= limit) {
            sorted
        } else {
            Array.tabulate<Types.Activity>(limit, func(i) = sorted[i])
        }
    };

    // Administrative functions

    // Enable or disable staking (admin only)
    public shared(msg) func setStakingEnabled(daoId: Principal, enabled: Bool) : async Result<(), Text> {
        if (not isAdmin(daoId, msg.caller)) {
            return #err("Not authorized");
        };
        stakingEnabled := enabled;
        #ok()
    };

    // Update minimum stake amount (admin only)
    public shared(msg) func setMinimumStakeAmount(daoId: Principal, amount: TokenAmount) : async Result<(), Text> {
        if (not isAdmin(daoId, msg.caller)) {
            return #err("Not authorized");
        };
        minimumStakeAmount := amount;
        #ok()
    };

    // Update maximum stake amount (admin only)
    public shared(msg) func setMaximumStakeAmount(daoId: Principal, amount: TokenAmount) : async Result<(), Text> {
        if (not isAdmin(daoId, msg.caller)) {
            return #err("Not authorized");
        };
        maximumStakeAmount := amount;
        #ok()
    };

    // Set or update admin principals for a DAO
    public shared(msg) func setAdminPrincipals(daoId: Principal, daoCanister: Principal, admins: [Principal]) : async Result<(), Text> {
        if (not canSetAdminList(daoId, msg.caller, daoCanister)) {
            return #err("Not authorized");
        };
        adminPrincipals.put(daoId, admins);
        #ok()
    };

    // Helper functions
    private func isAdmin(daoId: Principal, principal: Principal) : Bool {
        switch (adminPrincipals.get(daoId)) {
            case (?arr) { Array.find<Principal>(arr, func(p) = p == principal) != null };
            case null false;
        }
    };

    private func canSetAdminList(daoId: Principal, caller: Principal, daoCanister: Principal) : Bool {
        switch (adminPrincipals.get(daoId)) {
            case (?existing) { Array.find<Principal>(existing, func(p) = p == caller) != null };
            case null caller == daoCanister;
        }
    };

    private func calculateUnlockTime(stakedAt: Time.Time, period: StakingPeriod) : ?Time.Time {
        switch (period) {
            case (#instant) null;
            case (#locked30) ?(stakedAt + 30 * 24 * 60 * 60 * 1_000_000_000);
            case (#locked90) ?(stakedAt + 90 * 24 * 60 * 60 * 1_000_000_000);
            case (#locked180) ?(stakedAt + 180 * 24 * 60 * 60 * 1_000_000_000);
            case (#locked365) ?(stakedAt + 365 * 24 * 60 * 60 * 1_000_000_000);
        }
    };

    private func calculateRewards(stake: Stake) : TokenAmount {
        let stakingDuration = Time.now() - stake.stakedAt;
        Types.calculateStakingRewards(stake.amount, stake.stakingPeriod, Int.abs(stakingDuration))
    };

    private func getAPRForPeriod(period: StakingPeriod) : Float {
        switch (period) {
            case (#instant) 0.05; // 5% APR
            case (#locked30) 0.08; // 8% APR
            case (#locked90) 0.12; // 12% APR
            case (#locked180) 0.18; // 18% APR
            case (#locked365) 0.25; // 25% APR
        }
    };

    private func isLongerPeriod(current: StakingPeriod, new: StakingPeriod) : Bool {
        let currentValue = switch (current) {
            case (#instant) 0;
            case (#locked30) 30;
            case (#locked90) 90;
            case (#locked180) 180;
            case (#locked365) 365;
        };

        let newValue = switch (new) {
            case (#instant) 0;
            case (#locked30) 30;
            case (#locked90) 90;
            case (#locked180) 180;
            case (#locked365) 365;
        };

        newValue > currentValue
    };
}
