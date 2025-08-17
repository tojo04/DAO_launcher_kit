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
  'daoId' : Principal,
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
  'addAuthorizedPrincipal' : ActorMethod<[Principal, Principal], Result_1>,
  'deposit' : ActorMethod<[Principal, TokenAmount, string], Result>,
  'getAllTransactions' : ActorMethod<[Principal], Array<TreasuryTransaction>>,
  'getAuthorizedPrincipals' : ActorMethod<[Principal], Array<Principal>>,
  'getBalance' : ActorMethod<[Principal], TreasuryBalance>,
  'getRecentTransactions' : ActorMethod<[Principal, bigint], Array<TreasuryTransaction>>,
  'getTransaction' : ActorMethod<[bigint, Principal], [] | [TreasuryTransaction]>,
  'getTransactionsByType' : ActorMethod<
    [Principal, TreasuryTransactionType],
    Array<TreasuryTransaction>
  >,
  'getTreasuryStats' : ActorMethod<
    [Principal],
    {
      'balance' : TreasuryBalance,
      'totalWithdrawals' : TokenAmount,
      'averageTransactionAmount' : number,
      'totalDeposits' : TokenAmount,
      'totalTransactions' : bigint,
    }
  >,
  'lockTokens' : ActorMethod<[Principal, TokenAmount, string], Result_1>,
  'releaseReservedTokens' : ActorMethod<[Principal, TokenAmount, string], Result_1>,
  'removeAuthorizedPrincipal' : ActorMethod<[Principal, Principal], Result_1>,
  'reserveTokens' : ActorMethod<[Principal, TokenAmount, string], Result_1>,
  'unlockTokens' : ActorMethod<[Principal, TokenAmount, string], Result_1>,
  'withdraw' : ActorMethod<
    [Principal, Principal, TokenAmount, string, [] | [ProposalId]],
    Result
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
