import { useState } from 'react';
import { useActors } from '../context/ActorContext';

export const useStaking = () => {
  const actors = useActors();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const stake = async (daoId, amount, period) => {
    setLoading(true);
    setError(null);
    try {
      const periodVariant = { [period]: null };
      const res = await actors.staking.stake(
        daoId,
        BigInt(amount),
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

  const unstake = async (daoId, stakeId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.staking.unstake(
        daoId,
        BigInt(stakeId)
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

  const claimRewards = async (daoId, stakeId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.staking.claimRewards(
        daoId,
        BigInt(stakeId)
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

  const extendStakingPeriod = async (daoId, stakeId, newPeriod) => {
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

  const getStake = async (daoId, stakeId) => {
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

  const getStakingRewards = async (daoId, stakeId) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.staking.getStakingRewards(
        daoId,
        BigInt(stakeId)
      );
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStakingStats = async (daoId) => {
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

  const getUserStakes = async (daoId, user) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.staking.getUserStakes(daoId, user);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserActiveStakes = async (daoId, user) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.staking.getUserActiveStakes(daoId, user);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserStakingSummary = async (daoId, user) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.staking.getUserStakingSummary(
        daoId,
        user
      );
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setMinimumStakeAmount = async (amount) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.staking.setMinimumStakeAmount(BigInt(amount));
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setMaximumStakeAmount = async (amount) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.staking.setMaximumStakeAmount(BigInt(amount));
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setStakingEnabled = async (enabled) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.staking.setStakingEnabled(enabled);
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
