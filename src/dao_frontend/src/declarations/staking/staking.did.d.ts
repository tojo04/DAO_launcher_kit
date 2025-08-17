import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Principal = Principal;
export type Result = { 'ok' : TokenAmount } |
  { 'err' : string };
export type Result_1 = { 'ok' : StakeId } |
  { 'err' : string };
export type Result_2 = { 'ok' : null } |
  { 'err' : string };
export interface Stake {
  'daoId' : string,
  'id' : StakeId,
  'staker' : Principal,
  'unlocksAt' : [] | [Time],
  'stakedAt' : Time,
  'isActive' : boolean,
  'stakingPeriod' : StakingPeriod,
  'rewards' : TokenAmount,
  'amount' : TokenAmount,
}
export type StakeId = bigint;
export type StakingPeriod = { 'locked180' : null } |
  { 'locked365' : null } |
  { 'instant' : null } |
  { 'locked30' : null } |
  { 'locked90' : null };
export interface StakingRewards {
  'apr' : number,
  'totalRewards' : TokenAmount,
  'lastClaimedAt' : [] | [Time],
  'claimableRewards' : TokenAmount,
}
export type Time = bigint;
export type TokenAmount = bigint;
export interface _SERVICE {
  'claimRewards' : ActorMethod<[string, StakeId], Result>,
  'extendStakingPeriod' : ActorMethod<
    [string, StakeId, StakingPeriod],
    Result_2
  >,
  'getStake' : ActorMethod<[string, StakeId], [] | [Stake]>,
  'getStakingRewards' : ActorMethod<[string, StakeId], [] | [StakingRewards]>,
  'getStakingStats' : ActorMethod<
    [string],
    {
      'stakingPeriodDistribution' : Array<[StakingPeriod, bigint]>,
      'averageStakeAmount' : number,
      'totalRewardsDistributed' : TokenAmount,
      'activeStakes' : bigint,
      'totalStakes' : bigint,
      'totalStakedAmount' : TokenAmount,
    }
  >,
  'getUserActiveStakes' : ActorMethod<[string, Principal], Array<Stake>>,
  'getUserStakes' : ActorMethod<[string, Principal], Array<Stake>>,
  'getUserStakingSummary' : ActorMethod<
    [string, Principal],
    {
      'totalRewards' : TokenAmount,
      'totalVotingPower' : bigint,
      'activeStakes' : bigint,
      'totalStaked' : TokenAmount,
    }
  >,
  'setMaximumStakeAmount' : ActorMethod<[TokenAmount], Result_2>,
  'setMinimumStakeAmount' : ActorMethod<[TokenAmount], Result_2>,
  'setStakingEnabled' : ActorMethod<[boolean], Result_2>,
  'stake' : ActorMethod<[string, TokenAmount, StakingPeriod], Result_1>,
  'unstake' : ActorMethod<[string, StakeId], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
