export const idlFactory = ({ IDL }) => {
  const Result_1 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const TokenAmount = IDL.Nat;
  const Result = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Principal = IDL.Principal;
  const TreasuryTransactionType = IDL.Variant({
    'fee' : IDL.Null,
    'deposit' : IDL.Null,
    'stakingReward' : IDL.Null,
    'withdrawal' : IDL.Null,
    'proposalExecution' : IDL.Null,
  });
  const Time = IDL.Int;
  const ProposalId = IDL.Nat;
  const TreasuryTransaction = IDL.Record({
    'id' : IDL.Nat,
    'daoId' : Principal,
    'transactionType' : TreasuryTransactionType,
    'amount' : TokenAmount,
    'from' : IDL.Opt(Principal),
    'to' : IDL.Opt(Principal),
    'timestamp' : Time,
    'proposalId' : IDL.Opt(ProposalId),
    'description' : IDL.Text,
    'status' : IDL.Variant({
      'pending' : IDL.Null,
      'completed' : IDL.Null,
      'failed' : IDL.Null,
    }),
  });
  const TreasuryBalance = IDL.Record({
    'total' : TokenAmount,
    'reserved' : TokenAmount,
    'locked' : TokenAmount,
    'available' : TokenAmount,
  });
  return IDL.Service({
    'addAuthorizedPrincipal' : IDL.Func([Principal, IDL.Principal], [Result_1], []),
    'deposit' : IDL.Func([Principal, TokenAmount, IDL.Text], [Result], []),
    'getAllTransactions' : IDL.Func(
        [Principal],
        [IDL.Vec(TreasuryTransaction)],
        ['query'],
      ),
    'getAuthorizedPrincipals' : IDL.Func(
        [Principal],
        [IDL.Vec(IDL.Principal)],
        ['query'],
      ),
    'getBalance' : IDL.Func([Principal], [TreasuryBalance], ['query']),
    'getRecentTransactions' : IDL.Func(
        [Principal, IDL.Nat],
        [IDL.Vec(TreasuryTransaction)],
        ['query'],
      ),
    'getTransaction' : IDL.Func(
        [IDL.Nat, Principal],
        [IDL.Opt(TreasuryTransaction)],
        ['query'],
      ),
    'getTransactionsByType' : IDL.Func(
        [Principal, TreasuryTransactionType],
        [IDL.Vec(TreasuryTransaction)],
        ['query'],
      ),
    'getTreasuryStats' : IDL.Func(
        [Principal],
        [
          IDL.Record({
            'balance' : TreasuryBalance,
            'totalWithdrawals' : TokenAmount,
            'averageTransactionAmount' : IDL.Float64,
            'totalDeposits' : TokenAmount,
            'totalTransactions' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'lockTokens' : IDL.Func([Principal, TokenAmount, IDL.Text], [Result_1], []),
    'releaseReservedTokens' : IDL.Func([Principal, TokenAmount, IDL.Text], [Result_1], []),
    'removeAuthorizedPrincipal' : IDL.Func([Principal, IDL.Principal], [Result_1], []),
    'reserveTokens' : IDL.Func([Principal, TokenAmount, IDL.Text], [Result_1], []),
    'unlockTokens' : IDL.Func([Principal, TokenAmount, IDL.Text], [Result_1], []),
    'withdraw' : IDL.Func(
        [Principal, IDL.Principal, TokenAmount, IDL.Text, IDL.Opt(ProposalId)],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
