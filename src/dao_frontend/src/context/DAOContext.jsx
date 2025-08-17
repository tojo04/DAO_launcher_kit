import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useDAOManagement } from './DAOManagementContext';
import { safeJsonStringify, safeJsonParse } from '../utils/jsonUtils';

// Create the DAO Context
const DAOContext = createContext();

// DAO Provider component
export const DAOProvider = ({ children }) => {
  const { isAuthenticated, principal } = useAuth();
  const { selectedDAO, daoActors } = useDAOManagement();
  const [actors, setActors] = useState(null);
  const daoBackend = actors?.daoBackend;
  const [activeDAO, setActiveDAO] = useState(null);
  const [userDAOs, setUserDAOs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Check if user has any DAOs when authenticated
  useEffect(() => {
    if (isAuthenticated && principal) {
      checkUserDAOs();
    } else {
      setActiveDAO(null);
      setUserDAOs([]);
    }
  }, [isAuthenticated, principal, daoBackend]);

  const checkUserDAOs = async () => {
    setLoading(true);
    try {
      if (!daoBackend || !principal) {
        setUserDAOs([]);
        setActiveDAO(null);
        return;
      }
      let daos = [];

      if (typeof daoBackend.getUserDAOs === 'function') {
        try {
          const response = await daoBackend.getUserDAOs(principal);
          if (Array.isArray(response)) {
            daos = response;
          }
        } catch (err) {
          console.error('Error fetching user DAOs from backend:', err);
        }
      }

      if (daos.length === 0 && process.env.NODE_ENV !== 'production') {
        const launchedDAOs = localStorage.getItem(`daos_${principal}`);
        if (launchedDAOs) {
          daos = safeJsonParse(launchedDAOs);
        }
      }

      setUserDAOs(daos);

      if (daos.length > 0) {
        const storedActive = localStorage.getItem(`activeDAO_${principal}`);
        if (storedActive) {
          setActiveDAO(safeJsonParse(storedActive));
        } else {
          const defaultDAO = daos[0];
          setActiveDAO(defaultDAO);
          localStorage.setItem(`activeDAO_${principal}`, safeJsonStringify(defaultDAO));
        }
      } else {
        setActiveDAO(null);
      }
    } catch (error) {
      console.error('Failed to fetch user DAOs:', error);
      setUserDAOs([]);
      setActiveDAO(null);
    } finally {
      setLoading(false);
    }
  };

  const selectDAO = (dao) => {
    setActiveDAO(dao);
    localStorage.setItem(`activeDAO_${principal}`, safeJsonStringify(dao));
  };

  const addUserDAO = (dao) => {
    const updatedDAOs = [...userDAOs, dao];
    setUserDAOs(updatedDAOs);
    setActiveDAO(dao);
    localStorage.setItem(`daos_${principal}`, safeJsonStringify(updatedDAOs));
    localStorage.setItem(`activeDAO_${principal}`, safeJsonStringify(dao));
  };

  const removeUserDAO = (daoId) => {
    const updatedDAOs = userDAOs.filter(dao => dao.id !== daoId);
    setUserDAOs(updatedDAOs);
    if (activeDAO?.id === daoId) {
      setActiveDAO(updatedDAOs.length > 0 ? updatedDAOs[0] : null);
    }
    localStorage.setItem(`daos_${principal}`, safeJsonStringify(updatedDAOs));
  };

  const hasActiveDAO = activeDAO !== null;

  // Update actors when selectedDAO changes
  useEffect(() => {
    if (selectedDAO) {
      setActors(daoActors[selectedDAO.id] || null);
    } else {
      setActors(null);
    }
  }, [selectedDAO, daoActors]);

  const value = {
    activeDAO,
    userDAOs,
    hasActiveDAO,
    loading,
    actors,
    selectDAO,
    addUserDAO,
    removeUserDAO,
    checkUserDAOs
  };

  return (
    <DAOContext.Provider value={value}>
      {children}
    </DAOContext.Provider>
  );
};

// Custom hook to use the DAO context
export const useDAO = () => {
  const context = useContext(DAOContext);
  if (context === undefined) {
    throw new Error('useDAO must be used within a DAOProvider');
  }
  return context;
};
