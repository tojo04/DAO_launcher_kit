import { useState } from 'react';
import { useActors } from '../context/ActorContext';

export const useStaking = () => {
  const actors = useActors();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const stake = async (amount, period) => {
    setLoading(true);
    setError(null);
    try {
      const periodVariant = { [period]: null };
      const res = await actors.staking.stake(BigInt(amount), periodVariant);
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const unstake = async (stakeId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.staking.unstake(BigInt(stakeId));
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const claimRewards = async (stakeId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.staking.claimRewards(BigInt(stakeId));
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStake = async (stakeId) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.staking.getStake(BigInt(stakeId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserStakes = async () => {
    setLoading(true);
    setError(null);
    try {
      const principal = await actors.staking.agent.getPrincipal();
      return await actors.staking.getUserStakes(principal);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserStakingSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const principal = await actors.staking.agent.getPrincipal();
      return await actors.staking.getUserStakingSummary(principal);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStakingStats = async () => {
    setLoading(true);
    setError(null);
    try {
      return await actors.staking.getStakingStats();
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
    getStake,
    getUserStakes,
    getUserStakingSummary,
    getStakingStats,
    loading,
    error,
  };
};
