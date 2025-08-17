import { useState } from 'react';
import { useActors } from '../context/ActorContext';
import { Principal } from '@dfinity/principal';

export const useTreasury = () => {
  const actors = useActors();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deposit = async (daoId, amount, description) => {
    setLoading(true);
    setError(null);
    try {
      const daoPrincipal = Principal.fromText(daoId);
      const res = await actors.treasury.deposit(
        daoPrincipal,
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
      const principal = Principal.fromText(recipient);
      const daoPrincipal = Principal.fromText(daoId);
      const res = await actors.treasury.withdraw(
        daoPrincipal,
        principal,
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
      const daoPrincipal = Principal.fromText(daoId);
      const result = await actors.treasury.lockTokens(
        daoPrincipal,
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
      const daoPrincipal = Principal.fromText(daoId);
      const result = await actors.treasury.unlockTokens(
        daoPrincipal,
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
      const daoPrincipal = Principal.fromText(daoId);
      const result = await actors.treasury.reserveTokens(
        daoPrincipal,
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
      const daoPrincipal = Principal.fromText(daoId);
      const result = await actors.treasury.releaseReservedTokens(
        daoPrincipal,
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
      const daoPrincipal = Principal.fromText(daoId);
      const res = await actors.treasury.getBalance(daoPrincipal);
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
      const daoPrincipal = Principal.fromText(daoId);
      const txs = await actors.treasury.getAllTransactions(daoPrincipal);
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
      const daoPrincipal = Principal.fromText(daoId);
      const txs = await actors.treasury.getTransactionsByType(daoPrincipal, {
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
      const daoPrincipal = Principal.fromText(daoId);
      const txs = await actors.treasury.getRecentTransactions(
        daoPrincipal,
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
      const daoPrincipal = Principal.fromText(daoId);
      const stats = await actors.treasury.getTreasuryStats(daoPrincipal);
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
      const daoPrincipal = Principal.fromText(daoId);
      const principal = Principal.fromText(principalId);
      const res = await actors.treasury.addAuthorizedPrincipal(
        daoPrincipal,
        principal
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
      const daoPrincipal = Principal.fromText(daoId);
      const principal = Principal.fromText(principalId);
      const res = await actors.treasury.removeAuthorizedPrincipal(
        daoPrincipal,
        principal
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
      const daoPrincipal = Principal.fromText(daoId);
      const res = await actors.treasury.getAuthorizedPrincipals(daoPrincipal);
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

