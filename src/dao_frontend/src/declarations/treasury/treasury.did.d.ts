import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Principal = Principal;
export type ProposalId = bigint;
export type Result = { 'ok' : bigint } |
  { 'err' : string };
export type Result_1 = { 'ok' : null } |
  { 'err' : string };
export type Time = bigint;
export type TokenAmount = bigint;
export interface TreasuryBalance {
  'total' : TokenAmount,
  'reserved' : TokenAmount,
  'locked' : TokenAmount,
  'available' : TokenAmount,
}
export interface TreasuryTransaction {
  'id' : bigint,
  'daoId' : string,
  'transactionType' : TreasuryTransactionType,
  'amount' : TokenAmount,
  'from' : [] | [Principal],
  'to' : [] | [Principal],
  'timestamp' : Time,
  'proposalId' : [] | [ProposalId],
  'description' : string,
  'status' : { 'pending' : null } |
    { 'completed' : null } |
    { 'failed' : null },
}
export type TreasuryTransactionType = { 'fee' : null } |
  { 'deposit' : null } |
  { 'stakingReward' : null } |
  { 'withdrawal' : null } |
  { 'proposalExecution' : null };
export interface _SERVICE {
  'addAuthorizedPrincipal' : ActorMethod<[string, Principal], Result_1>,
  'deposit' : ActorMethod<[string, TokenAmount, string], Result>,
  'getAllTransactions' : ActorMethod<[string], Array<TreasuryTransaction>>,
  'getAuthorizedPrincipals' : ActorMethod<[string], Array<Principal>>,
  'getBalance' : ActorMethod<[string], TreasuryBalance>,
  'getRecentTransactions' : ActorMethod<[string, bigint], Array<TreasuryTransaction>>,
  'getTransaction' : ActorMethod<[bigint, string], [] | [TreasuryTransaction]>,
  'getTransactionsByType' : ActorMethod<
    [string, TreasuryTransactionType],
    Array<TreasuryTransaction>
  >,
  'getTreasuryStats' : ActorMethod<
    [string],
    {
      'balance' : TreasuryBalance,
      'totalWithdrawals' : TokenAmount,
      'averageTransactionAmount' : number,
      'totalDeposits' : TokenAmount,
      'totalTransactions' : bigint,
    }
  >,
  'lockTokens' : ActorMethod<[string, TokenAmount, string], Result_1>,
  'releaseReservedTokens' : ActorMethod<[string, TokenAmount, string], Result_1>,
  'removeAuthorizedPrincipal' : ActorMethod<[string, Principal], Result_1>,
  'reserveTokens' : ActorMethod<[string, TokenAmount, string], Result_1>,
  'unlockTokens' : ActorMethod<[string, TokenAmount, string], Result_1>,
  'withdraw' : ActorMethod<
    [string, Principal, TokenAmount, string, [] | [ProposalId]],
    Result
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
