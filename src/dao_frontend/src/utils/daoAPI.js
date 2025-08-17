/**
 * Standardized API wrapper for DAO backend calls
 * Provides consistent error handling and response formatting
 */

export class DAOAPIWrapper {
    constructor(actors) {
        this.actors = actors;
    }

    /**
     * Wrapper for backend API calls with standardized error handling
     * @param {Function} apiCall - The async function to call
     * @param {string} operationName - Name of the operation for logging
     * @returns {Promise} - Standardized response
     */
    async callAPI(apiCall, operationName) {
        try {
            console.log(`🔄 Calling ${operationName}...`);
            const result = await apiCall();
            
            // Handle Motoko Result type responses
            if (result && typeof result === 'object') {
                if ('err' in result) {
                    const error = new Error(result.err);
                    error.operation = operationName;
                    throw error;
                }
                if ('ok' in result) {
                    console.log(`✅ ${operationName} succeeded`);
                    return result.ok;
                }
            }
            
            // Handle direct responses
            console.log(`✅ ${operationName} succeeded`);
            return result;
        } catch (error) {
            console.error(`❌ ${operationName} failed:`, error);
            error.operation = operationName;
            throw error;
        }
    }

    // DAO Management APIs
    async initializeDAO(daoId, name, description, initialAdmins) {
        const id = daoId ?? 'default';
        return this.callAPI(
            () => this.actors.daoBackend.initialize(id, name, description, initialAdmins),
            'Initialize DAO'
        );
    }

    async setCanisterReferences(daoId, governance, staking, treasury, proposals) {
        const id = daoId ?? 'default';
        return this.callAPI(
            () => this.actors.daoBackend.setCanisterReferences(id, governance, staking, treasury, proposals),
            'Set Canister References'
        );
    }

    async getCanisterReferences(daoId) {
        const id = daoId ?? 'default';
        return this.callAPI(
            () => this.actors.daoBackend.getCanisterReferences(id),
            'Get Canister References'
        );
    }

    async setDAOConfig(daoId, config) {
        const id = daoId ?? 'default';
        return this.callAPI(
            () => this.actors.daoBackend.setDAOConfig(id, config),
            'Set DAO Configuration'
        );
    }

    async getDAOInfo(daoId) {
        const id = daoId ?? 'default';
        return this.callAPI(
            () => this.actors.daoBackend.getDAOInfo(id),
            'Get DAO Info'
        );
    }

    async getDAOConfig(daoId) {
        const id = daoId ?? 'default';
        return this.callAPI(
            () => this.actors.daoBackend.getDAOConfig(id),
            'Get DAO Configuration'
        );
    }

    async getDAOStats(daoId) {
        const id = daoId ?? 'default';
        return this.callAPI(
            () => this.actors.daoBackend.getDAOStats(id),
            'Get DAO Statistics'
        );
    }

    // User Management APIs
    async registerUser(daoId, displayName, bio) {
        const id = daoId ?? 'default';
        return this.callAPI(
            () => this.actors.daoBackend.registerUser(id, displayName, bio),
            'Register User'
        );
    }

    async adminRegisterUser(daoId, userPrincipal, displayName, bio) {
        const id = daoId ?? 'default';
        return this.callAPI(
            () => this.actors.daoBackend.adminRegisterUser(id, userPrincipal, displayName, bio),
            'Admin Register User'
        );
    }

    async updateUserProfile(daoId, displayName, bio) {
        const id = daoId ?? 'default';
        return this.callAPI(
            () => this.actors.daoBackend.updateUserProfile(id, displayName, bio),
            'Update User Profile'
        );
    }

    async getUserProfile(daoId, userId) {
        const id = daoId ?? 'default';
        return this.callAPI(
            () => this.actors.daoBackend.getUserProfile(id, userId),
            'Get User Profile'
        );
    }

    async getAllUsers(daoId) {
        const id = daoId ?? 'default';
        return this.callAPI(
            () => this.actors.daoBackend.getAllUsers(id),
            'Get All Users'
        );
    }

    // Admin Management APIs
    async addAdmin(daoId, newAdmin) {
        const id = daoId ?? 'default';
        return this.callAPI(
            () => this.actors.daoBackend.addAdmin(id, newAdmin),
            'Add Admin'
        );
    }

    async removeAdmin(daoId, adminToRemove) {
        const id = daoId ?? 'default';
        return this.callAPI(
            () => this.actors.daoBackend.removeAdmin(id, adminToRemove),
            'Remove Admin'
        );
    }

    async checkIsAdmin(daoId, principal) {
        const id = daoId ?? 'default';
        return this.callAPI(
            () => this.actors.daoBackend.checkIsAdmin(id, principal),
            'Check Is Admin'
        );
    }

    // Governance APIs (temporary implementations)
    async getGovernanceStats() {
        return this.callAPI(
            () => this.actors.daoBackend.getGovernanceStats(),
            'Get Governance Statistics'
        );
    }

    async createProposal(daoId, title, description, proposalType) {
        const id = daoId ?? 'default';
        return this.callAPI(
            () => this.actors.daoBackend.createProposal(id, title, description, proposalType),
            'Create Proposal'
        );
    }

    async vote(daoId, proposalId, choice, reason) {
        const id = daoId ?? 'default';
        return this.callAPI(
            () => this.actors.daoBackend.vote(id, proposalId, choice, reason),
            'Cast Vote'
        );
    }

    // Health check
    async healthCheck() {
        return this.callAPI(
            () => this.actors.daoBackend.health(),
            'Health Check'
        );
    }

    // Utility method for batch operations
    async batchCall(operations) {
        const results = [];
        const errors = [];

        for (const operation of operations) {
            try {
                const result = await operation();
                results.push({ success: true, result });
            } catch (error) {
                results.push({ success: false, error: error.message });
                errors.push(error);
            }
        }

        return {
            results,
            errors,
            allSucceeded: errors.length === 0,
            successCount: results.filter(r => r.success).length,
            errorCount: errors.length
        };
    }

    // Enhanced error handling with retry logic
    async callAPIWithRetry(apiCall, operationName, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.callAPI(apiCall, operationName);
            } catch (error) {
                lastError = error;
                console.warn(`${operationName} attempt ${attempt} failed:`, error.message);
                
                if (attempt < maxRetries) {
                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }
        
        throw lastError;
    }

    // Validation helpers
    validateDAOConfig(config) {
        const errors = [];
        
        if (!config.category || config.category.trim() === '') {
            errors.push('Category is required');
        }
        
        if (!config.tokenName || config.tokenName.trim() === '') {
            errors.push('Token name is required');
        }
        
        if (!config.tokenSymbol || config.tokenSymbol.trim() === '') {
            errors.push('Token symbol is required');
        }
        
        if (!config.totalSupply || config.totalSupply <= 0) {
            errors.push('Total supply must be greater than 0');
        }
        
        if (!config.termsAccepted) {
            errors.push('Terms and conditions must be accepted');
        }
        
        return errors;
    }
}

/**
 * React hook to use the DAO API wrapper
 */
import { useMemo } from 'react';
import { useActors } from '../context/ActorContext';

export const useDAOAPI = () => {
    const actors = useActors();
    
    const api = useMemo(() => {
        if (!actors) return null;
        return new DAOAPIWrapper(actors);
    }, [actors]);

    return api;
};
