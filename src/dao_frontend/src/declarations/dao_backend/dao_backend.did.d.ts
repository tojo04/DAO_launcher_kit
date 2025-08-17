import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface DAOConfig {
  'termsAccepted' : boolean,
  'fundingDuration' : bigint,
  'proposalThreshold' : bigint,
  'minInvestment' : bigint,
  'selectedModules' : Array<string>,
  'totalSupply' : bigint,
  'website' : string,
  'tokenSymbol' : string,
  'initialPrice' : bigint,
  'votingPeriod' : bigint,
  'category' : string,
  'tokenName' : string,
  'fundingGoal' : bigint,
  'quorumThreshold' : bigint,
  'kycRequired' : boolean,
  'moduleFeatures' : Array<ModuleFeature>,
}
export interface DAOStats {
  'treasuryBalance' : TokenAmount,
  'totalVotingPower' : bigint,
  'totalProposals' : bigint,
  'totalMembers' : bigint,
  'totalStaked' : TokenAmount,
  'activeProposals' : bigint,
}
export interface Activity {
  'activityType' : string,
  'title' : string,
  'description' : string,
  'timestamp' : Time,
  'status' : string,
}
export interface ModuleFeature {
  'moduleId' : string,
  'features' : Array<string>,
}
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : bigint } |
  { 'err' : string };
export type Time = bigint;
export type TokenAmount = bigint;
export type UserId = Principal;
export interface UserProfile {
  'id' : UserId,
  'bio' : string,
  'displayName' : string,
  'votingPower' : bigint,
  'joinedAt' : Time,
  'reputation' : bigint,
  'totalStaked' : bigint,
}
export interface _SERVICE {
  'addAdmin' : ActorMethod<[string, Principal], Result>,
  'adminRegisterUser' : ActorMethod<[string, Principal, string, string], Result>,
  'checkIsAdmin' : ActorMethod<[string, Principal], boolean>,
  'createProposal' : ActorMethod<[string, string, string, string], Result_1>,
  'getAllUsers' : ActorMethod<[string], Array<UserProfile>>,
  'getCanisterReferences' : ActorMethod<
    [string],
    {
      'staking' : [] | [Principal],
      'governance' : [] | [Principal],
      'proposals' : [] | [Principal],
      'treasury' : [] | [Principal],
    }
  >,
  'getDAOConfig' : ActorMethod<[string], [] | [DAOConfig]>,
  'getDAOInfo' : ActorMethod<
    [string],
    {
      'initialized' : boolean,
      'name' : string,
      'description' : string,
      'totalMembers' : bigint,
    }
  >,
  'getDAOStats' : ActorMethod<[string], DAOStats>,
  'getRecentActivity' : ActorMethod<[string], Array<Activity>>,
  'getGovernanceStats' : ActorMethod<
    [string],
    {
      'passedProposals' : bigint,
      'totalVotingPower' : bigint,
      'totalProposals' : bigint,
      'activeProposals' : bigint,
    }
  >,
  'getUserProfile' : ActorMethod<[string, Principal], [] | [UserProfile]>,
  'greet' : ActorMethod<[string, string], string>,
  'health' : ActorMethod<[], { 'status' : string, 'timestamp' : bigint }>,
  'initialize' : ActorMethod<[string, string, string, Array<Principal>], Result>,
  'registerUser' : ActorMethod<[string, string, string], Result>,
  'removeAdmin' : ActorMethod<[string, Principal], Result>,
  'setCanisterReferences' : ActorMethod<
    [string, Principal, Principal, Principal, Principal],
    Result
  >,
  'setDAOConfig' : ActorMethod<[string, DAOConfig], Result>,
  'updateUserProfile' : ActorMethod<[string, string, string], Result>,
  'vote' : ActorMethod<[string, bigint, string, [] | [string]], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
