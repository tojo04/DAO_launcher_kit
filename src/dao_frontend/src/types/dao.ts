import type { CanisterIds, Actors } from '../config/agent';

export interface DAO {
  id: string;
  name: string;
  description: string;
  tokenSymbol: string;
  logo?: string;
  memberCount: number;
  totalValueLocked: string;
  createdAt: Date;
  category: string;
  status: 'active' | 'pending' | 'paused';
  governance: {
    totalProposals: number;
    activeProposals: number;
  };
  treasury: {
    balance: string;
    monthlyInflow: string;
  };
  staking: {
    totalStaked: string;
    apr: string;
  };
  canisterIds: CanisterIds;
}

export interface DAOContextType {
  daos: DAO[];
  selectedDAO: DAO | null;
  daoActors: Record<string, Actors>;
  loading: boolean;
  error: string | null;
  fetchDAOs: () => Promise<void>;
  selectDAO: (dao: DAO) => void;
  createDAO: (daoData: Partial<DAO>) => Promise<void>;
  refreshDAOs: () => Promise<void>;
  deleteDAO: (daoId: string) => Promise<void>;
  setActorsForDAO: (daoId: string, actors: Actors) => void;
}

export interface DAOFormData {
  daoName: string;
  description: string;
  category: string;
  website: string;
  logo?: string;
  selectedModules: string[];
  selectedFeatures: Record<string, Record<string, boolean>>;
  tokenName: string;
  tokenSymbol: string;
  totalSupply: string;
  initialPrice: string;
  votingPeriod: string;
  quorumThreshold: string;
  proposalThreshold: string;
  fundingGoal: string;
  fundingDuration: string;
  minInvestment: string;
  teamMembers: Array<{
    name: string;
    role: string;
    wallet: string;
  }>;
  termsAccepted: boolean;
  kycRequired: boolean;
}