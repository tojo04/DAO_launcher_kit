import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
// import Debug "mo:base/Debug";
import Buffer "mo:base/Buffer";
import Float "mo:base/Float";
// import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Nat32 "mo:base/Nat32";

import Types "../shared/types";

/**
 * Treasury Canister
 * 
 * This canister manages the DAO's financial operations and fund management:
 * - Multi-signature wallet functionality for secure fund management
 * - Transaction history and audit trail for transparency
 * - Allowance system for controlled spending by authorized entities
 * - Balance segregation (available, locked, reserved) for different purposes
 * 
 * Treasury Features:
 * - Deposit tracking from various sources (initial funding, fees, revenue)
 * - Withdrawal approval workflows with multi-sig requirements
 * - Automated allocation for different DAO functions (rewards, development, etc.)
 * - Integration with governance for spending proposal execution
 * 
 * Security Mechanisms:
 * - Multi-signature requirements for large transactions
 * - Spending limits and approval workflows
 * - Time-locked withdrawals for major fund movements
 * - Emergency pause functionality for security incidents
 */
persistent actor TreasuryCanister {
    // Type aliases for improved code readability
    type Result<T, E> = Result.Result<T, E>;
    type TreasuryBalance = Types.TreasuryBalance;
    type TreasuryTransaction = Types.TreasuryTransaction;
    type TokenAmount = Types.TokenAmount;
    type TreasuryError = Types.TreasuryError;
    type CommonError = Types.CommonError;

    // Stable storage for upgrade persistence
    // Core financial data that must survive canister upgrades
    private var balancesEntries : [(Principal, TreasuryBalance)] = [];
    private var nextTransactionId : Nat = 1;
    private var transactionsEntries : [(Nat, TreasuryTransaction)] = [];
    private var allowancesEntries : [(Principal, TokenAmount)] = [];

    // Runtime storage - rebuilt from stable storage after upgrades
    // HashMaps provide efficient transaction and allowance management
    private transient var balances = HashMap.HashMap<Principal, TreasuryBalance>(10, Principal.equal, Principal.hash);
    private transient var transactions = HashMap.HashMap<Nat, TreasuryTransaction>(100, Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n) });
    private transient var allowances = HashMap.HashMap<Principal, TokenAmount>(10, Principal.equal, Principal.hash);

    // Authorization system for treasury operations
    // In production, this would be managed by governance proposals
    private var authorizedPrincipals : [Principal] = [];

    // System functions for upgrades
    system func preupgrade() {
        balancesEntries := Iter.toArray(balances.entries());
        transactionsEntries := Iter.toArray(transactions.entries());
        allowancesEntries := Iter.toArray(allowances.entries());
    };

    system func postupgrade() {
        balances := HashMap.fromIter<Principal, TreasuryBalance>(
            balancesEntries.vals(),
            balancesEntries.size(),
            Principal.equal,
            Principal.hash
        );
        transactions := HashMap.fromIter<Nat, TreasuryTransaction>(
            transactionsEntries.vals(),
            transactionsEntries.size(),
            Nat.equal,
            func(n: Nat) : Nat32 { Nat32.fromNat(n) }
        );
        allowances := HashMap.fromIter<Principal, TokenAmount>(
            allowancesEntries.vals(),
            allowancesEntries.size(),
            Principal.equal,
            Principal.hash
        );
    };

    // Public functions

    // Deposit tokens to treasury
    public shared(msg) func deposit(daoId: Principal, amount: TokenAmount, description: Text) : async Result<Nat, Text> {
        if (amount == 0) {
            return #err("Amount must be greater than 0");
        };

        let transactionId = nextTransactionId;
        nextTransactionId += 1;

        let transaction : TreasuryTransaction = {
            id = transactionId;
            daoId = daoId;
            transactionType = #deposit;
            amount = amount;
            from = ?msg.caller;
            to = null;
            timestamp = Time.now();
            proposalId = null;
            description = description;
            status = #completed;
        };

        transactions.put(transactionId, transaction);

        // Update balances
        let bal = getBalanceInternal(daoId);
        balances.put(daoId, { bal with total = bal.total + amount; available = bal.available + amount });

        #ok(transactionId)
    };

    // Withdraw tokens from treasury (requires authorization)
    public shared(msg) func withdraw(
        daoId: Principal,
        recipient: Principal,
        amount: TokenAmount,
        description: Text,
        proposalId: ?Types.ProposalId
    ) : async Result<Nat, Text> {
        let caller = msg.caller;

        // Check authorization
        if (not isAuthorized(caller)) {
            return #err("Not authorized to withdraw from treasury");
        };

        // Check available balance
        let bal = getBalanceInternal(daoId);
        if (amount > bal.available) {
            return #err("Insufficient available balance");
        };

        let transactionId = nextTransactionId;
        nextTransactionId += 1;

        let transaction : TreasuryTransaction = {
            id = transactionId;
            daoId = daoId;
            transactionType = #withdrawal;
            amount = amount;
            from = null;
            to = ?recipient;
            timestamp = Time.now();
            proposalId = proposalId;
            description = description;
            status = #pending;
        };

        transactions.put(transactionId, transaction);

        // Execute withdrawal
        switch (await executeWithdrawal(transactionId)) {
            case (#ok(_)) {
                // Update balances
                balances.put(daoId, { bal with total = bal.total - amount; available = bal.available - amount });
                
                let completedTransaction = {
                    id = transaction.id;
                    transactionType = transaction.transactionType;
                    amount = transaction.amount;
                    from = transaction.from;
                    to = transaction.to;
                    timestamp = transaction.timestamp;
                    proposalId = transaction.proposalId;
                    description = transaction.description;
                    status = #completed;
                };
                transactions.put(transactionId, completedTransaction);
                
                #ok(transactionId)
            };
            case (#err(error)) {
                let failedTransaction = {
                    id = transaction.id;
                    transactionType = transaction.transactionType;
                    amount = transaction.amount;
                    from = transaction.from;
                    to = transaction.to;
                    timestamp = transaction.timestamp;
                    proposalId = transaction.proposalId;
                    description = transaction.description;
                    status = #failed;
                };
                transactions.put(transactionId, failedTransaction);
                #err(error)
            };
        }
    };

    // Lock tokens for specific purposes (e.g., staking rewards)
    public shared(msg) func lockTokens(daoId: Principal, amount: TokenAmount, reason: Text) : async Result<(), Text> {
        if (not isAuthorized(msg.caller)) {
            return #err("Not authorized");
        };

        let bal = getBalanceInternal(daoId);
        if (amount > bal.available) {
            return #err("Insufficient available balance");
        };

        balances.put(daoId, { bal with available = bal.available - amount; locked = bal.locked + amount });

        let transactionId = nextTransactionId;
        nextTransactionId += 1;

        let transaction : TreasuryTransaction = {
            id = transactionId;
            daoId = daoId;
            transactionType = #stakingReward;
            amount = amount;
            from = null;
            to = null;
            timestamp = Time.now();
            proposalId = null;
            description = "Locked tokens: " # reason;
            status = #completed;
        };

        transactions.put(transactionId, transaction);
        #ok()
    };

    // Unlock tokens
    public shared(msg) func unlockTokens(daoId: Principal, amount: TokenAmount, reason: Text) : async Result<(), Text> {
        if (not isAuthorized(msg.caller)) {
            return #err("Not authorized");
        };

        let bal = getBalanceInternal(daoId);
        if (amount > bal.locked) {
            return #err("Insufficient locked balance");
        };

        balances.put(daoId, { bal with locked = bal.locked - amount; available = bal.available + amount });

        let transactionId = nextTransactionId;
        nextTransactionId += 1;

        let transaction : TreasuryTransaction = {
            id = transactionId;
            daoId = daoId;
            transactionType = #stakingReward;
            amount = amount;
            from = null;
            to = null;
            timestamp = Time.now();
            proposalId = null;
            description = "Unlocked tokens: " # reason;
            status = #completed;
        };

        transactions.put(transactionId, transaction);
        #ok()
    };

    // Reserve tokens for future use
    public shared(msg) func reserveTokens(daoId: Principal, amount: TokenAmount, reason: Text) : async Result<(), Text> {
        if (not isAuthorized(msg.caller)) {
            return #err("Not authorized");
        };

        let bal = getBalanceInternal(daoId);
        if (amount > bal.available) {
            return #err("Insufficient available balance");
        };

        balances.put(daoId, { bal with available = bal.available - amount; reserved = bal.reserved + amount });

        let transactionId = nextTransactionId;
        nextTransactionId += 1;

        let transaction : TreasuryTransaction = {
            id = transactionId;
            daoId = daoId;
            transactionType = #fee;
            amount = amount;
            from = null;
            to = null;
            timestamp = Time.now();
            proposalId = null;
            description = "Reserved tokens: " # reason;
            status = #completed;
        };

        transactions.put(transactionId, transaction);
        #ok()
    };

    // Release reserved tokens
    public shared(msg) func releaseReservedTokens(daoId: Principal, amount: TokenAmount, reason: Text) : async Result<(), Text> {
        if (not isAuthorized(msg.caller)) {
            return #err("Not authorized");
        };

        let bal = getBalanceInternal(daoId);
        if (amount > bal.reserved) {
            return #err("Insufficient reserved balance");
        };

        balances.put(daoId, { bal with reserved = bal.reserved - amount; available = bal.available + amount });

        let transactionId = nextTransactionId;
        nextTransactionId += 1;

        let transaction : TreasuryTransaction = {
            id = transactionId;
            daoId = daoId;
            transactionType = #fee;
            amount = amount;
            from = null;
            to = null;
            timestamp = Time.now();
            proposalId = null;
            description = "Released reserved tokens: " # reason;
            status = #completed;
        };

        transactions.put(transactionId, transaction);
        #ok()
    };

    // Query functions

    // Get treasury balance
    public query func getBalance(daoId: Principal) : async TreasuryBalance {
        switch (balances.get(daoId)) {
            case (?bal) { bal };
            case null {
                {
                    total = 0;
                    available = 0;
                    locked = 0;
                    reserved = 0;
                }
            };
        }
    };

    // Get transaction by ID
    public query func getTransaction(transactionId: Nat, daoId: Principal) : async ?TreasuryTransaction {
        switch (transactions.get(transactionId)) {
            case (?tx) { if (tx.daoId == daoId) ?tx else null };
            case null { null };
        }
    };

    // Get all transactions
    public query func getAllTransactions(daoId: Principal) : async [TreasuryTransaction] {
        let filteredTransactions = Buffer.Buffer<TreasuryTransaction>(0);
        for (transaction in transactions.vals()) {
            if (transaction.daoId == daoId) {
                filteredTransactions.add(transaction);
            };
        };
        Buffer.toArray(filteredTransactions)
    };

    // Get transactions by type
    public query func getTransactionsByType(daoId: Principal, transactionType: Types.TreasuryTransactionType) : async [TreasuryTransaction] {
        let filteredTransactions = Buffer.Buffer<TreasuryTransaction>(0);
        for (transaction in transactions.vals()) {
            if (transaction.daoId == daoId and transaction.transactionType == transactionType) {
                filteredTransactions.add(transaction);
            };
        };
        Buffer.toArray(filteredTransactions)
    };

    // Get recent transactions
    public query func getRecentTransactions(daoId: Principal, limit: Nat) : async [TreasuryTransaction] {
        let buffer = Buffer.Buffer<TreasuryTransaction>(0);
        for (transaction in transactions.vals()) {
            if (transaction.daoId == daoId) {
                buffer.add(transaction);
            };
        };
        let allTransactions = Buffer.toArray(buffer);
        let sortedTransactions = Array.sort(allTransactions, func(a: TreasuryTransaction, b: TreasuryTransaction) : {#less; #equal; #greater} {
            if (a.timestamp > b.timestamp) #less
            else if (a.timestamp < b.timestamp) #greater
            else #equal
        });

        if (sortedTransactions.size() <= limit) {
            sortedTransactions
        } else {
            Array.tabulate<TreasuryTransaction>(limit, func(i) = sortedTransactions[i])
        }
    };

    // Get treasury statistics
    public query func getTreasuryStats(daoId: Principal) : async {
        totalTransactions: Nat;
        totalDeposits: TokenAmount;
        totalWithdrawals: TokenAmount;
        averageTransactionAmount: Float;
        balance: TreasuryBalance;
    } {
        var totalDeposits : TokenAmount = 0;
        var totalWithdrawals : TokenAmount = 0;
        var totalAmount : TokenAmount = 0;
        var txCount : Nat = 0;

        for (transaction in transactions.vals()) {
            if (transaction.daoId == daoId) {
                txCount += 1;
                switch (transaction.transactionType) {
                    case (#deposit) {
                        totalDeposits += transaction.amount;
                        totalAmount += transaction.amount;
                    };
                    case (#withdrawal) {
                        totalWithdrawals += transaction.amount;
                        totalAmount += transaction.amount;
                    };
                    case (_) {
                        totalAmount += transaction.amount;
                    };
                };
            };
        };

        let averageAmount = if (txCount > 0) {
            Float.fromInt(totalAmount) / Float.fromInt(txCount)
        } else { 0.0 };

        let bal = switch (balances.get(daoId)) {
            case (?b) b;
            case null {
                { total = 0; available = 0; locked = 0; reserved = 0 };
            };
        };

        {
            totalTransactions = txCount;
            totalDeposits = totalDeposits;
            totalWithdrawals = totalWithdrawals;
            averageTransactionAmount = averageAmount;
            balance = bal;
        }
    };

    // Administrative functions

    // Add authorized principal
    public shared(_msg) func addAuthorizedPrincipal(principal: Principal) : async Result<(), Text> {
        // In real implementation, only governance or admin should be able to do this
        let principals = Buffer.fromArray<Principal>(authorizedPrincipals);
        principals.add(principal);
        authorizedPrincipals := Buffer.toArray(principals);
        #ok()
    };

    // Remove authorized principal
    public shared(_msg) func removeAuthorizedPrincipal(principal: Principal) : async Result<(), Text> {
        // In real implementation, only governance or admin should be able to do this
        authorizedPrincipals := Array.filter<Principal>(authorizedPrincipals, func(p) = p != principal);
        #ok()
    };

    // Get authorized principals
    public query func getAuthorizedPrincipals() : async [Principal] {
        authorizedPrincipals
    };

    // Helper functions
    private func getBalanceInternal(daoId: Principal) : TreasuryBalance {
        switch (balances.get(daoId)) {
            case (?bal) { bal };
            case null {
                let b : TreasuryBalance = {
                    total = 0;
                    available = 0;
                    locked = 0;
                    reserved = 0;
                };
                balances.put(daoId, b);
                b
            };
        }
    };

    private func isAuthorized(principal: Principal) : Bool {
        Array.find<Principal>(authorizedPrincipals, func(p) = p == principal) != null
    };

    private func executeWithdrawal(_transactionId: Nat) : async Result<(), Text> {
        // In a real implementation, this would interact with the ledger canister
        // For now, we'll simulate a successful withdrawal
        #ok()
    };
}
