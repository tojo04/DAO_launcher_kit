import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
      const registryUrl = import.meta.env.VITE_DAO_REGISTRY_URL || '/api/dao-registry';
      const response = await fetch(registryUrl);
      const data = await response.json();
      const registryDAOs = Array.isArray(data)
        ? data.map((dao: any) => ({ ...dao, createdAt: new Date(dao.createdAt) }))
        : [];

      let allDAOs = registryDAOs;

      if (principal) {
        const storedDAOs = localStorage.getItem(`user_daos_${principal}`);
        if (storedDAOs) {
          const userDAOs = JSON.parse(storedDAOs).map((dao: any) => ({
            ...dao,
            createdAt: new Date(dao.createdAt),
          }));
          allDAOs = [...registryDAOs, ...userDAOs];
        }
      }

      setDAOs(allDAOs);
      if (!selectedDAO && allDAOs.length > 0) {
        setSelectedDAO(allDAOs[0]);
      }
    } catch (err) {
      setError('Failed to fetch DAOs');
      console.error('Error fetching DAOs:', err);
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
