import { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { useActors } from '../context/ActorContext';

export const useTreasury = () => {
  const actors = useActors();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deposit = async (daoId, amount, description) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.treasury.deposit(
        daoId,
        BigInt(amount),
        description
      );
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async (daoId, recipient, amount, description) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.treasury.withdraw(
        daoId,
        Principal.fromText(recipient),
        BigInt(amount),
        description,
        []
      );
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const lockTokens = async (daoId, amount, reason) => {
    setLoading(true);
    setError(null);
    try {
      
      const result = await actors.treasury.lockTokens(
        daoId,
        BigInt(amount),
        reason
      );
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const unlockTokens = async (daoId, amount, reason) => {
    setLoading(true);
    setError(null);
    try {
      
      const result = await actors.treasury.unlockTokens(
        daoId,
        BigInt(amount),
        reason
      );
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reserveTokens = async (daoId, amount, reason) => {
    setLoading(true);
    setError(null);
    try {
      
      const result = await actors.treasury.reserveTokens(
        daoId,
        BigInt(amount),
        reason
      );
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const releaseReservedTokens = async (daoId, amount, reason) => {
    setLoading(true);
    setError(null);
    try {
      
      const result = await actors.treasury.releaseReservedTokens(
        daoId,
        BigInt(amount),
        reason
      );
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getBalance = async (daoId) => {
    setLoading(true);
    setError(null);
    try {
      
      const res = await actors.treasury.getBalance(daoId);
      if ('err' in res) throw new Error(res.err);
      return 'ok' in res ? res.ok : res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAllTransactions = async (daoId) => {
    setLoading(true);
    setError(null);
    try {
      
      const txs = await actors.treasury.getAllTransactions(daoId);
      return txs;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTransactionsByType = async (daoId, type) => {
    setLoading(true);
    setError(null);
    try {
      
      const txs = await actors.treasury.getTransactionsByType(daoId, {
        [type]: null,
      });
      return txs;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getRecentTransactions = async (daoId, limit) => {
    setLoading(true);
    setError(null);
    try {
      
      const txs = await actors.treasury.getRecentTransactions(
        daoId,
        BigInt(limit)
      );
      return txs;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTreasuryStats = async (daoId) => {
    setLoading(true);
    setError(null);
    try {
      
      const stats = await actors.treasury.getTreasuryStats(daoId);
      return stats;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addAuthorizedPrincipal = async (daoId, principalId) => {
    setLoading(true);
    setError(null);
    try {
      
      const res = await actors.treasury.addAuthorizedPrincipal(
        daoId,
        Principal.fromText(principalId)
      );
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeAuthorizedPrincipal = async (daoId, principalId) => {
    setLoading(true);
    setError(null);
    try {
      
      const res = await actors.treasury.removeAuthorizedPrincipal(
        daoId,
        Principal.fromText(principalId)
      );
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAuthorizedPrincipals = async (daoId) => {
    setLoading(true);
    setError(null);
    try {
      
      const res = await actors.treasury.getAuthorizedPrincipals(daoId);
      return res.map((p) => (typeof p.toText === 'function' ? p.toText() : p));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    deposit,
    withdraw,
    lockTokens,
    unlockTokens,

    reserveTokens,
    releaseReservedTokens,
    getBalance,
    getAllTransactions,
    getTransactionsByType,
    getRecentTransactions,
    getTreasuryStats,
    addAuthorizedPrincipal,
    removeAuthorizedPrincipal,
    getAuthorizedPrincipals,
    loading,
    error,
  };
};

