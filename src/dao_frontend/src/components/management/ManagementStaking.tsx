import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DAO } from '../../types/dao';
import { useStaking } from '../../hooks/useStaking';

const ManagementStaking: React.FC = () => {
  const { dao } = useOutletContext<{ dao: DAO }>();
  const {
    getStake,
    getUserStakes,
    getUserStakingSummary,
    getStakingStats,
    loading,
    error
  } = useStaking();

  const [stakes, setStakes] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    getUserStakes().then(setStakes).catch(console.error);
    getUserStakingSummary().then(setSummary).catch(console.error);
    getStakingStats().then(setStats).catch(console.error);
  }, []);

  const handleStake = async (id: any) => {
    try {
      const s = await getStake(id);
      setSelected(s);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white font-mono">STAKING for {dao.name}</h2>
      {loading && <p className="text-gray-400">Loading...</p>}
      {error && <p className="text-red-400">{error}</p>}
      {summary && (
        <div className="p-4 border border-gray-700 rounded">
          <pre className="text-xs text-gray-400">{JSON.stringify(summary, null, 2)}</pre>
        </div>
      )}
      {stats && (
        <div className="p-4 border border-gray-700 rounded">
          <pre className="text-xs text-gray-400">{JSON.stringify(stats, null, 2)}</pre>
        </div>
      )}
      <ul className="space-y-2">
        {stakes.map(stake => (
          <li key={stake.id?.toString?.()} className="p-4 border border-gray-700 rounded">
            <div className="flex justify-between items-center">
              <span className="text-white font-mono">Stake {stake.id?.toString?.()}</span>
              <button
                className="text-blue-400 hover:underline text-sm"
                onClick={() => handleStake(stake.id)}
              >
                Details
              </button>
            </div>
            {selected && selected[0]?.id === stake.id && (
              <pre className="text-xs text-gray-400 mt-2">
                {JSON.stringify(selected[0], null, 2)}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManagementStaking;
