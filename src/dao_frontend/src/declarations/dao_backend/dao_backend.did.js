export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const UserId = IDL.Principal;
  const Time = IDL.Int;
  const UserProfile = IDL.Record({
    'daoId' : IDL.Text,
    'id' : UserId,
    'bio' : IDL.Text,
    'displayName' : IDL.Text,
    'votingPower' : IDL.Nat,
    'joinedAt' : Time,
    'reputation' : IDL.Nat,
    'totalStaked' : IDL.Nat,
  });
  const ModuleFeature = IDL.Record({
    'moduleId' : IDL.Text,
    'features' : IDL.Vec(IDL.Text),
  });
  const DAOConfig = IDL.Record({
    'termsAccepted' : IDL.Bool,
    'fundingDuration' : IDL.Nat,
    'proposalThreshold' : IDL.Nat,
    'minInvestment' : IDL.Nat,
    'selectedModules' : IDL.Vec(IDL.Text),
    'totalSupply' : IDL.Nat,
    'website' : IDL.Text,
    'tokenSymbol' : IDL.Text,
    'initialPrice' : IDL.Nat,
    'votingPeriod' : IDL.Nat,
    'category' : IDL.Text,
    'tokenName' : IDL.Text,
    'fundingGoal' : IDL.Nat,
    'quorumThreshold' : IDL.Nat,
    'kycRequired' : IDL.Bool,
    'moduleFeatures' : IDL.Vec(ModuleFeature),
  });
  const TokenAmount = IDL.Nat;
  const DAOStats = IDL.Record({
    'treasuryBalance' : TokenAmount,
    'totalVotes' : IDL.Nat,
    'totalProposals' : IDL.Nat,
    'totalMembers' : IDL.Nat,
    'totalStaked' : TokenAmount,
    'activeProposals' : IDL.Nat,
  });
  const Activity = IDL.Record({
    'activityType' : IDL.Text,
    'title' : IDL.Text,
    'description' : IDL.Text,
    'timestamp' : Time,
    'status' : IDL.Text,
  });
  return IDL.Service({
    'addAdmin' : IDL.Func([IDL.Text, IDL.Principal], [Result], []),
    'adminRegisterUser' : IDL.Func(
        [IDL.Text, IDL.Principal, IDL.Text, IDL.Text],
        [Result],
        [],
      ),
    'checkIsAdmin' : IDL.Func([IDL.Text, IDL.Principal], [IDL.Bool], ['query']),
    'createProposal' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [Result_1], []),
    'getAllUsers' : IDL.Func([IDL.Text], [IDL.Vec(UserProfile)], ['query']),
    'getCanisterReferences' : IDL.Func(
        [IDL.Text],
        [
          IDL.Record({
            'staking' : IDL.Opt(IDL.Principal),
            'governance' : IDL.Opt(IDL.Principal),
            'proposals' : IDL.Opt(IDL.Principal),
            'treasury' : IDL.Opt(IDL.Principal),
          }),
        ],
        ['query'],
      ),
    'getDAOConfig' : IDL.Func([IDL.Text], [IDL.Opt(DAOConfig)], ['query']),
    'getDAOInfo' : IDL.Func(
        [IDL.Text],
        [
          IDL.Record({
            'initialized' : IDL.Bool,
            'name' : IDL.Text,
            'description' : IDL.Text,
            'totalMembers' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getDAOStats' : IDL.Func([IDL.Text], [DAOStats], ['query']),
    'getRecentActivity' : IDL.Func([IDL.Text], [IDL.Vec(Activity)], ['query']),
    'getGovernanceStats' : IDL.Func(
        [IDL.Text],
        [
          IDL.Record({
            'passedProposals' : IDL.Nat,
            'totalVotingPower' : IDL.Nat,
            'totalProposals' : IDL.Nat,
            'activeProposals' : IDL.Nat,
          }),
        ],
        [],
      ),
    'getUserProfile' : IDL.Func(
        [IDL.Text, IDL.Principal],
        [IDL.Opt(UserProfile)],
        ['query'],
      ),
    'greet' : IDL.Func([IDL.Text, IDL.Text], [IDL.Text], ['query']),
    'health' : IDL.Func(
        [],
        [IDL.Record({ 'status' : IDL.Text, 'timestamp' : IDL.Int })],
        ['query'],
      ),
    'initialize' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Vec(IDL.Principal)],
        [Result],
        [],
      ),
    'registerUser' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [Result], []),
    'removeAdmin' : IDL.Func([IDL.Text, IDL.Principal], [Result], []),
    'setCanisterReferences' : IDL.Func(
        [IDL.Text, IDL.Principal, IDL.Principal, IDL.Principal, IDL.Principal],
        [Result],
        [],
      ),
    'setDAOConfig' : IDL.Func([IDL.Text, DAOConfig], [Result], []),
    'updateUserProfile' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [Result], []),
    'vote' : IDL.Func([IDL.Text, IDL.Nat, IDL.Text, IDL.Opt(IDL.Text)], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
