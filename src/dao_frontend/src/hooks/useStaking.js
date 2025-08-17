import { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { useActors } from '../context/ActorContext';
import { useDAO } from '../context/DAOContext';

export const useStaking = () => {
  const actors = useActors();
  const { activeDAO } = useDAO();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const stake = async (amount, period, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const periodVariant = { [period]: null };
      const res = await actors.staking.stake(daoId, BigInt(amount), periodVariant);
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const unstake = async (stakeId, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.staking.unstake(daoId, BigInt(stakeId));
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const claimRewards = async (stakeId, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.staking.claimRewards(daoId, BigInt(stakeId));
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const extendStakingPeriod = async (stakeId, newPeriod, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const periodVariant = { [newPeriod]: null };
      const res = await actors.staking.extendStakingPeriod(
        daoId,
        BigInt(stakeId),
        periodVariant
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

  const getStake = async (stakeId, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.staking.getStake(daoId, BigInt(stakeId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStakingRewards = async (stakeId, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.staking.getStakingRewards(daoId, BigInt(stakeId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStakingStats = async (daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.staking.getStakingStats(daoId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserStakes = async (user, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const principal = Principal.fromText(user);
      return await actors.staking.getUserStakes(daoId, principal);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserActiveStakes = async (user, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const principal = Principal.fromText(user);
      return await actors.staking.getUserActiveStakes(daoId, principal);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserStakingSummary = async (user, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const principal = Principal.fromText(user);
      return await actors.staking.getUserStakingSummary(daoId, principal);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setMinimumStakeAmount = async (amount, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.staking.setMinimumStakeAmount(daoId, BigInt(amount));
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setMaximumStakeAmount = async (amount, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.staking.setMaximumStakeAmount(daoId, BigInt(amount));
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setStakingEnabled = async (enabled, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.staking.setStakingEnabled(daoId, enabled);
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    stake,
    unstake,
    claimRewards,
    extendStakingPeriod,
    getStake,
    getStakingRewards,
    getStakingStats,
    getUserStakes,
    getUserActiveStakes,
    getUserStakingSummary,
    setMinimumStakeAmount,
    setMaximumStakeAmount,
    setStakingEnabled,
    loading,
    error,
  };
};
