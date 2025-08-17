import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { Coins, Plus } from 'lucide-react';
import { DAO } from '../../types/dao';
import { useStaking } from '../../hooks/useStaking';
import { useActors } from '../../context/ActorContext';
import { useAuth } from '../../context/AuthContext';
import { Principal } from '@dfinity/principal';

const ManagementStaking: React.FC = () => {
  const { dao } = useOutletContext<{ dao: DAO }>();
  const { stake, unstake, claimRewards, loading, error } = useStaking();
  const actors = useActors();
  const { principal } = useAuth();

  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('instant');
  const [stakes, setStakes] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const fetchData = async () => {
    if (!principal) return;
    try {
      const p = Principal.fromText(principal);
      const list = await actors.staking.getUserStakes(p);
      const sum = await actors.staking.getUserStakingSummary(p);
      setStakes(list);
      setSummary(sum);
    } catch {
      // errors handled by hooks/actors
    }
  };

  useEffect(() => {
    fetchData();
  }, [principal]);

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await stake(amount, period);
      setAmount('');
      fetchData();
    } catch {
      // error handled by hook
    }
  };

  const handleUnstake = async (id: bigint) => {
    try {
      await unstake(id);
      fetchData();
    } catch {
      // error handled by hook
    }
  };

  const handleClaim = async (id: bigint) => {
    try {
      await claimRewards(id);
      fetchData();
    } catch {
      // error handled by hook
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 font-mono">STAKING</h2>
          <p className="text-gray-400">
            Stake your tokens to earn rewards and gain voting power
          </p>
        </div>
      </div>

      <form onSubmit={handleStake} className="space-y-4">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white"
        />
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white"
        >
          <option value="instant">Instant</option>
          <option value="locked30">30 Days</option>
          <option value="locked90">90 Days</option>
          <option value="locked180">180 Days</option>
          <option value="locked365">365 Days</option>
        </select>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg"
        >
          <Plus className="w-4 h-4" />
          <span>{loading ? 'Staking...' : 'Stake Tokens'}</span>
        </motion.button>
      </form>

      {error && <p className="text-red-500">{error}</p>}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 border border-purple-500/30 p-6 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Coins className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400 font-mono">TOTAL STAKED</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {summary.totalStaked?.toString()}
            </p>
          </div>
          <div className="bg-gray-800/50 border border-green-500/30 p-6 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Coins className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400 font-mono">TOTAL REWARDS</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {summary.totalRewards?.toString()}
            </p>
          </div>
          <div className="bg-gray-800/50 border border-blue-500/30 p-6 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Coins className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400 font-mono">ACTIVE STAKES</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {summary.activeStakes?.toString()}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {stakes.map((s) => (
          <div
            key={s.id.toString()}
            className="p-6 bg-gray-800/50 border border-gray-700/30 rounded-lg"
          >
            <div className="flex justify-between mb-4">
              <div>
                <h4 className="text-white font-semibold">Stake #{s.id.toString()}</h4>
                <p className="text-gray-400 text-sm">{s.amount.toString()} tokens</p>
              </div>
              <p className="text-green-400 font-bold">
                {s.rewards?.toString()} rewards
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleClaim(s.id)}
                className="flex-1 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-mono"
              >
                Claim Rewards
              </button>
              <button
                onClick={() => handleUnstake(s.id)}
                className="flex-1 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-mono"
              >
                Unstake
              </button>
            </div>
          </div>
        ))}
        {stakes.length === 0 && (
          <p className="text-gray-400 text-center">No active stakes</p>
        )}
      </div>
    </div>
  );
};

export default ManagementStaking;

