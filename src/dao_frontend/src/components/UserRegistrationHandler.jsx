import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDAOAPI } from '../utils/daoAPI';
import { useDAOManagement } from '../context/DAOManagementContext';

const UserRegistrationHandler = () => {
  const { identity, userSettings } = useAuth();
  const daoAPI = useDAOAPI();
  const { selectedDAO } = useDAOManagement();
  const registrationAttempted = useRef(new Set());

  useEffect(() => {
    const registerUser = async () => {
      if (identity && daoAPI && selectedDAO?.id) {
        const registrationKey = `${identity.getPrincipal().toString()}-${selectedDAO.id}`;
        
        // Prevent duplicate registration attempts
        if (registrationAttempted.current.has(registrationKey)) {
          return;
        }
        
        registrationAttempted.current.add(registrationKey);
        
        try {
          await daoAPI.registerUser(selectedDAO.id, userSettings.displayName, '');
        } catch (error) {
          registrationAttempted.current.delete(registrationKey); // Allow retry on actual failure
          if (error.message !== 'User already registered') {
            console.error('Failed to register user:', error);
          }
        }
      }
    };

    registerUser();
  }, [identity, daoAPI, selectedDAO?.id, userSettings.displayName]);

  return null;
};

export default UserRegistrationHandler;

