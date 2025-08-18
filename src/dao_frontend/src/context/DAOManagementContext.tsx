import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Principal } from '@dfinity/principal';
import { useAuth } from './AuthContext';
import { DAO, DAOContextType } from '../types/dao';
import type { Actors } from '../config/agent';

const DAOManagementContext = createContext<DAOContextType | undefined>(undefined);

interface DAOManagementProviderProps {
  children: ReactNode;
}

export const DAOManagementProvider: React.FC<DAOManagementProviderProps> = ({ children }) => {
  const [daos, setDAOs] = useState<DAO[]>([]);
  const [selectedDAO, setSelectedDAO] = useState<DAO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daoActors, setDAOActors] = useState<Record<string, Actors>>({});
  const { isAuthenticated, principal } = useAuth();

  const fetchDAOs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Create a default DAO using the deployed canister IDs from environment
      const canisterIdEnv = import.meta.env.VITE_CANISTER_ID_DAO_BACKEND;
      
      // Convert canister ID to a valid Principal and use that as DAO ID
      let daoId: string;
      try {
        if (canisterIdEnv && canisterIdEnv !== 'undefined') {
          // Convert the canister ID to a proper Principal format
          const principal = Principal.fromText(canisterIdEnv);
          daoId = principal.toText();
        } else {
          daoId = 'dao-local-dev';
        }
      } catch (error) {
        console.warn('Invalid canister ID format, using fallback:', error);
        daoId = 'dao-local-dev';
      }

      const defaultDAO: DAO = {
        id: daoId,
        name: 'Local Development DAO',
        description: 'A DAO for local development and testing',
        tokenSymbol: 'LDAO',
        memberCount: 1,
        totalValueLocked: '0',
        createdAt: new Date(),
        category: 'Development',
        status: 'active',
        governance: {
          totalProposals: 0,
          activeProposals: 0,
        },
        treasury: {
          balance: '0',
          monthlyInflow: '0',
        },
        staking: {
          totalStaked: '0',
          apr: '0%',
        },
        canisterIds: {
          daoBackend: canisterIdEnv || 'rdmx6-jaaaa-aaaaa-aaadq-cai',
          governance: import.meta.env.VITE_CANISTER_ID_GOVERNANCE || 'rrkah-fqaaa-aaaaa-aaaaq-cai',
          staking: import.meta.env.VITE_CANISTER_ID_STAKING || 'ryjl3-tyaaa-aaaaa-aaaba-cai',
          treasury: import.meta.env.VITE_CANISTER_ID_TREASURY || 'rdmx6-jaaaa-aaaaa-aaadq-cai',
          proposals: import.meta.env.VITE_CANISTER_ID_PROPOSALS || 'rdmx6-jaaaa-aaaaa-aaadq-cai',
          assets: import.meta.env.VITE_CANISTER_ID_ASSETS || 'rdmx6-jaaaa-aaaaa-aaadq-cai',
        },
      };

      let allDAOs = [defaultDAO];

      // Also check for stored DAOs from localStorage
      if (principal) {
        const storedDAOs = localStorage.getItem(`user_daos_${principal}`);
        if (storedDAOs) {
          const userDAOs = JSON.parse(storedDAOs).map((dao: any) => ({
            ...dao,
            createdAt: new Date(dao.createdAt),
          }));
          allDAOs = [defaultDAO, ...userDAOs];
        }
      }

      setDAOs(allDAOs);
      if (!selectedDAO && allDAOs.length > 0) {
        setSelectedDAO(allDAOs[0]);
      }
    } catch (err) {
      setError('Failed to initialize DAOs');
      console.error('Error initializing DAOs:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectDAO = (dao: DAO) => {
    setSelectedDAO(dao);
  };

  const createDAO = async (daoData: Partial<DAO>) => {
    setLoading(true);
    setError(null);
    try {
      const newDAO: DAO = {
        id: `dao-${Date.now()}`,
        name: daoData.name || 'New DAO',
        description: daoData.description || 'A new decentralized autonomous organization',
        tokenSymbol: daoData.tokenSymbol || 'NEW',
        memberCount: 1,
        totalValueLocked: '$0',
        createdAt: new Date(),
        category: daoData.category || 'Other',
        status: 'active',
        governance: {
          totalProposals: 0,
          activeProposals: 0
        },
        treasury: {
          balance: '$0',
          monthlyInflow: '$0'
        },
        staking: {
          totalStaked: '$0',
          apr: '0%'
        },
        ...daoData,
        canisterIds: { daoBackend: '', ...(daoData.canisterIds || {}) },
      };
      
      // Add to state immediately
      setDAOs(prev => [...prev, newDAO]);
      setSelectedDAO(newDAO);
      
      // Persist to localStorage for the current user
      if (principal) {
        const existingDAOs = localStorage.getItem(`user_daos_${principal}`);
        const userDAOs = existingDAOs ? JSON.parse(existingDAOs) : [];
        const updatedUserDAOs = [...userDAOs, newDAO];
        localStorage.setItem(`user_daos_${principal}`, JSON.stringify(updatedUserDAOs));
      }
      
      console.log('DAO created successfully:', newDAO);
    } catch (err) {
      setError('Failed to create DAO');
      console.error('Error creating DAO:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshDAOs = async () => {
    await fetchDAOs();
  };

  const deleteDAO = async (daoId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Remove from state
      setDAOs(prev => prev.filter(dao => dao.id !== daoId));
      
      // Remove from localStorage if it's a user-created DAO
      if (principal) {
        const existingDAOs = localStorage.getItem(`user_daos_${principal}`);
        if (existingDAOs) {
          const userDAOs = JSON.parse(existingDAOs);
          const updatedUserDAOs = userDAOs.filter((dao: DAO) => dao.id !== daoId);
          localStorage.setItem(`user_daos_${principal}`, JSON.stringify(updatedUserDAOs));
        }
      }
      
      console.log('DAO deleted successfully:', daoId);
    } catch (err) {
      setError('Failed to delete DAO');
      console.error('Error deleting DAO:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setActorsForDAO = (daoId: string, actors: Actors) => {
    setDAOActors(prev => ({ ...prev, [daoId]: actors }));
  };

  useEffect(() => {
    if (isAuthenticated && principal) {
      fetchDAOs();
    } else if (!isAuthenticated) {
      setDAOs([]);
      setSelectedDAO(null);
    }
  }, [isAuthenticated, principal]);

  const value: DAOContextType = {
    daos,
    selectedDAO,
    daoActors,
    loading,
    error,
    fetchDAOs,
    selectDAO,
    createDAO,
    refreshDAOs,
    deleteDAO,
    setActorsForDAO
  };

  return (
    <DAOManagementContext.Provider value={value}>
      {children}
    </DAOManagementContext.Provider>
  );
};

export const useDAOManagement = (): DAOContextType => {
  const context = useContext(DAOManagementContext);
  if (context === undefined) {
    throw new Error('useDAOManagement must be used within a DAOManagementProvider');
  }
  return context;
};
