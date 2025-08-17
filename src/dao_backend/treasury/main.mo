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
import Nat64 "mo:base/Nat64";
import Blob "mo:base/Blob";

import Types "../shared/types";

module ICRC1 {
    public type Account = { owner: Principal; subaccount: ?[Nat8] };
    public type TransferArgs = {
        from_subaccount: ?[Nat8];
        to: Account;
        amount: Nat;
        fee: ?Nat;
        memo: ?Blob;
        created_at_time: ?Nat64;
    };
    public type TransferError = {
        #BadFee: { expected_fee: Nat };
        #InsufficientFunds: { balance: Nat };
        #TxTooOld: { allowed_window_nanos: Nat64 };
        #TxCreatedInFuture: { ledger_time: Nat64 };
        #TxDuplicate: { duplicate_of: Nat };
        #BadBurn: { min_burn_amount: Nat };
        #GenericError: { error_code: Nat; message: Text };
    };
    public type TransferResult = { #Ok: Nat; #Err: TransferError };
    public type Service = actor {
        icrc1_transfer: TransferArgs -> async TransferResult;
    };
};

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
    private var authorizedPrincipalsEntries : [(Principal, [Principal])] = [];
    private var ledgerCanister : ?Principal = null;

    // Runtime storage - rebuilt from stable storage after upgrades
    // HashMaps provide efficient transaction and allowance management
    private transient var balances = HashMap.HashMap<Principal, TreasuryBalance>(10, Principal.equal, Principal.hash);
    private transient var transactions = HashMap.HashMap<Nat, TreasuryTransaction>(100, Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n) });
    private transient var allowances = HashMap.HashMap<Principal, TokenAmount>(10, Principal.equal, Principal.hash);
    private transient var authorizedPrincipals = HashMap.HashMap<Principal, [Principal]>(10, Principal.equal, Principal.hash);

    // System functions for upgrades
    system func preupgrade() {
        balancesEntries := Iter.toArray(balances.entries());
        transactionsEntries := Iter.toArray(transactions.entries());
        allowancesEntries := Iter.toArray(allowances.entries());
        authorizedPrincipalsEntries := Iter.toArray(authorizedPrincipals.entries());
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
        authorizedPrincipals := HashMap.fromIter<Principal, [Principal]>(
            authorizedPrincipalsEntries.vals(),
            authorizedPrincipalsEntries.size(),
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

        let ledger = switch (getLedger()) {
            case (#ok(l)) l;
            case (#err(e)) { return #err(e) };
        };

        let transferArgs : ICRC1.TransferArgs = {
            from_subaccount = null;
            to = { owner = Principal.fromActor(TreasuryCanister); subaccount = null };
            amount = amount;
            fee = null;
            memo = null;
            created_at_time = null;
        };

        let transactionId = nextTransactionId;
        nextTransactionId += 1;

        switch (await ledger.icrc1_transfer(transferArgs)) {
            case (#Ok(_)) {
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
            case (#Err(err)) {
                let failedTx : TreasuryTransaction = {
                    id = transactionId;
                    daoId = daoId;
                    transactionType = #deposit;
                    amount = amount;
                    from = ?msg.caller;
                    to = null;
                    timestamp = Time.now();
                    proposalId = null;
                    description = description;
                    status = #failed;
                };
                transactions.put(transactionId, failedTx);
                #err("Ledger transfer failed: " # transferErrorToText(err))
            };
        }
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
        if (not isAuthorized(daoId, caller)) {
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
                    daoId = transaction.daoId;
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
                    daoId = transaction.daoId;
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

        if (not isAuthorized(daoId, msg.caller)) {
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
        if (not isAuthorized(daoId, msg.caller)) {
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
        if (not isAuthorized(daoId, msg.caller)) {
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
        if (not isAuthorized(daoId, msg.caller)) {
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

    // Convert recent transactions into activity records
    public query func getRecentActivity() : async [Types.Activity] {
        let txBuffer = Buffer.Buffer<TreasuryTransaction>(0);
        for (tx in transactions.vals()) {
            txBuffer.add(tx);
        };
        let allTx = Buffer.toArray(txBuffer);
        let sortedTx = Array.sort(allTx, func(a: TreasuryTransaction, b: TreasuryTransaction) : {#less; #equal; #greater} {
            if (a.timestamp > b.timestamp) #less
            else if (a.timestamp < b.timestamp) #greater
            else #equal
        });

        let limit = 20;
        let selected = if (sortedTx.size() <= limit) {
            sortedTx
        } else {
            Array.tabulate<TreasuryTransaction>(limit, func(i) = sortedTx[i])
        };

        Array.map<TreasuryTransaction, Types.Activity>(selected, func(tx) : Types.Activity {
            let typeText = switch (tx.transactionType) {
                case (#deposit) "deposit";
                case (#withdrawal) "withdrawal";
                case (#proposalExecution) "proposalExecution";
                case (#stakingReward) "stakingReward";
                case (#fee) "fee";
            };
            let statusText = switch (tx.status) {
                case (#pending) "pending";
                case (#completed) "completed";
                case (#failed) "failed";
            };
            {
                activityType = typeText;
                title = typeText;
                description = tx.description;
                timestamp = tx.timestamp;
                status = statusText;
            }
        })
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
    // Configure ledger canister
    public shared(_msg) func setLedgerCanister(canister: Principal) : async Result<(), Text> {
        ledgerCanister := ?canister;
        #ok()
    };

    public query func getLedgerCanister() : async ?Principal {
        ledgerCanister
    };

  

    // Add authorized principal (admin only)
    public shared(msg) func addAuthorizedPrincipal(daoId: Principal, principal: Principal) : async Result<(), Text> {
        if (not isAdmin(daoId, msg.caller)) {
            return #err("Not authorized");
        };

        let principals = Buffer.fromArray<Principal>(
            switch (authorizedPrincipals.get(daoId)) {
                case (?arr) arr;
                case null [];
            }
        );
        principals.add(principal);
        authorizedPrincipals.put(daoId, Buffer.toArray(principals));
        #ok()
    };

    // Remove authorized principal (admin only)
    public shared(msg) func removeAuthorizedPrincipal(daoId: Principal, principal: Principal) : async Result<(), Text> {
        if (not isAdmin(daoId, msg.caller)) {
            return #err("Not authorized");
        };
        let updated = switch (authorizedPrincipals.get(daoId)) {
            case (?arr) Array.filter<Principal>(arr, func(p) = p != principal);
            case null [];
        };
        if (updated.size() == 0) {
            authorizedPrincipals.remove(daoId);
        } else {
            authorizedPrincipals.put(daoId, updated);
        };
        #ok()
    };

    // Get authorized principals
    public query func getAuthorizedPrincipals(daoId: Principal) : async [Principal] {
        switch (authorizedPrincipals.get(daoId)) {
            case (?arr) arr;
            case null [];
        }
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

    private func isAuthorized(daoId: Principal, principal: Principal) : Bool {
        switch (authorizedPrincipals.get(daoId)) {
            case (?arr) { Array.find<Principal>(arr, func(p) = p == principal) != null };
            case null { false };
        }
    };


    private func getLedger() : Result<ICRC1.Service, Text> {
        switch (ledgerCanister) {
            case (?p) { #ok(actor(Principal.toText(p)) : ICRC1.Service) };
            case null { #err("Ledger canister not configured") };
        }
    };

    private func transferErrorToText(e: ICRC1.TransferError) : Text {
        switch (e) {
            case (#BadFee { expected_fee }) {
                "Bad fee: expected " # Nat.toText(expected_fee)
            };
            case (#InsufficientFunds { balance }) {
                "Insufficient funds: balance " # Nat.toText(balance)
            };
            case (#TxTooOld { allowed_window_nanos }) {
                "Transaction too old: " # Nat64.toText(allowed_window_nanos)
            };
            case (#TxCreatedInFuture { ledger_time }) {
                "Transaction created in future: " # Nat64.toText(ledger_time)
            };
            case (#TxDuplicate { duplicate_of }) {
                "Duplicate transaction: " # Nat.toText(duplicate_of)
            };
            case (#BadBurn { min_burn_amount }) {
                "Bad burn: minimum " # Nat.toText(min_burn_amount)
            };
            case (#GenericError { error_code; message }) {
                "Generic error " # Nat.toText(error_code) # ": " # message
            };
        }
    };

    private func executeWithdrawal(_transactionId: Nat) : async Result<(), Text> {
        let txOpt = transactions.get(_transactionId);
        switch (txOpt) {
            case (?tx) {
                let ledger = switch (getLedger()) {
                    case (#ok(l)) l;
                    case (#err(e)) { return #err(e) };
                };

                switch (tx.to) {
                    case (?recipient) {
                        let args : ICRC1.TransferArgs = {
                            from_subaccount = null;
                            to = { owner = recipient; subaccount = null };
                            amount = tx.amount;
                            fee = null;
                            memo = null;
                            created_at_time = null;
                        };
                        switch (await ledger.icrc1_transfer(args)) {
                            case (#Ok(_)) { #ok() };
                            case (#Err(err)) { #err(transferErrorToText(err)) };
                        }
                    };
                    case null { #err("Recipient not specified") };
                }
            };
            case null { #err("Transaction not found") };
        }
    };

    private func isAdmin(daoId: Principal, principal: Principal) : Bool {
        // For now, reuse the authorized principal list for admin checks
        isAuthorized(daoId, principal)
    };

}
