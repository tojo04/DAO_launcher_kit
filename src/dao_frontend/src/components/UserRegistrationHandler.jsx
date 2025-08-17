import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDAOAPI } from '../utils/daoAPI';
import { useDAOManagement } from '../context/DAOManagementContext';

const UserRegistrationHandler = () => {
  const { identity, userSettings } = useAuth();
  const daoAPI = useDAOAPI();
  const { selectedDAO } = useDAOManagement();

  useEffect(() => {
    const registerUser = async () => {
      if (identity && daoAPI && selectedDAO?.id) {
        try {
          await daoAPI.registerUser(selectedDAO.id, userSettings.displayName, '');
        } catch (error) {
          if (error.message !== 'User already registered') {
            console.error('Failed to register user:', error);
          }
        }
      }
    };

    registerUser();
  }, [identity, daoAPI, selectedDAO, userSettings.displayName]);

  return null;
};

export default UserRegistrationHandler;

