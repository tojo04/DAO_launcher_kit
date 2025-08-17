import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface MembershipChangeProposal {
  'member' : Principal,
  'action' : { 'add' : null } |
    { 'remove' : null },
  'role' : string,
}
export interface ParameterChangeProposal {
  'oldValue' : string,
  'parameter' : string,
  'newValue' : string,
}
export type Principal = Principal;
export interface Proposal {
  'daoId' : string,
  'id' : ProposalId,
  'status' : ProposalStatus,
  'title' : string,
  'votesAgainst' : bigint,
  'createdAt' : Time,
  'totalVotingPower' : bigint,
  'votingDeadline' : Time,
  'description' : string,
  'proposalType' : ProposalType,
  'votesInFavor' : bigint,
  'proposer' : Principal,
  'quorumThreshold' : bigint,
  'executionDeadline' : [] | [Time],
  'approvalThreshold' : bigint,
}
export interface ProposalCategory {
  'id' : string,
  'name' : string,
  'color' : string,
  'description' : string,
}
export type ProposalId = bigint;
export type ProposalStatus = { 'active' : null } |
  { 'cancelled' : null } |
  { 'pending' : null } |
  { 'executed' : null } |
  { 'failed' : null } |
  { 'succeeded' : null };
export interface ProposalTemplate {
  'id' : bigint,
  'name' : string,
  'description' : string,
  'requiredFields' : Array<string>,
  'template' : string,
  'category' : string,
}
export type ProposalType = { 'membershipChange' : MembershipChangeProposal } |
  { 'parameterChange' : ParameterChangeProposal } |
  { 'treasuryTransfer' : TreasuryTransferProposal } |
  { 'textProposal' : string };
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : ProposalId } |
  { 'err' : string };
export type Result_2 = { 'ok' : bigint } |
  { 'err' : string };
export type Time = bigint;
export type TokenAmount = bigint;
export interface TreasuryTransferProposal {
  'recipient' : Principal,
  'amount' : TokenAmount,
  'reason' : string,
}
export type VoteChoice = { 'against' : null } |
  { 'abstain' : null } |
  { 'inFavor' : null };
export interface _SERVICE {
  'addCategory' : ActorMethod<[string, string, string, string, string], Result>,
  'addTemplate' : ActorMethod<
    [string, string, string, string, Array<string>, string],
    Result_2
  >,
  'batchVote' : ActorMethod<
    [string, Array<[ProposalId, VoteChoice, [] | [string]]>],
    Array<Result>
  >,
  'createProposal' : ActorMethod<
    [string, string, string, ProposalType, [] | [string], [] | [bigint]],
    Result_1
  >,
  'createProposalFromTemplate' : ActorMethod<
    [string, bigint, string, Array<[string, string]>, [] | [bigint]],
    Result_1
  >,
  'getAllProposals' : ActorMethod<[string], Array<Proposal>>,
  'getProposal' : ActorMethod<[string, ProposalId], [] | [Proposal]>,
  'getProposalCategories' : ActorMethod<[string], Array<ProposalCategory>>,
  'getProposalStats' : ActorMethod<
    [string],
    {
      'succeededProposals' : bigint,
      'totalVotes' : bigint,
      'totalProposals' : bigint,
      'totalCategories' : bigint,
      'failedProposals' : bigint,
      'totalTemplates' : bigint,
      'activeProposals' : bigint,
    }
  >,
  'getProposalTemplates' : ActorMethod<[string], Array<ProposalTemplate>>,
  'getProposalsByCategory' : ActorMethod<[string, string], Array<Proposal>>,
  'getTemplate' : ActorMethod<[string, bigint], [] | [ProposalTemplate]>,
  'getTemplatesByCategory' : ActorMethod<[string, string], Array<ProposalTemplate>>,
  'getTrendingProposals' : ActorMethod<[string, bigint], Array<Proposal>>,
  'init' : ActorMethod<[Principal], undefined>,
  'vote' : ActorMethod<[string, ProposalId, VoteChoice, [] | [string]], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
