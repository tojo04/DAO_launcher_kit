import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DAO } from '../../types/dao';
import { useTreasury } from '../../hooks/useTreasury';

const ManagementTreasury: React.FC = () => {
  const { dao } = useOutletContext<{ dao: DAO }>();
  const { getAllTransactions, getTreasuryStats, loading, error } = useTreasury();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getAllTransactions().then(setTransactions).catch(console.error);
    getTreasuryStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white font-mono">TREASURY for {dao.name}</h2>
      {loading && <p className="text-gray-400">Loading...</p>}
      {error && <p className="text-red-400">{error}</p>}
      {stats && (
        <div className="p-4 border border-gray-700 rounded">
          <pre className="text-xs text-gray-400">{JSON.stringify(stats, null, 2)}</pre>
        </div>
      )}
      <ul className="space-y-2">
        {transactions.map((tx, idx) => (
          <li key={idx} className="p-4 border border-gray-700 rounded">
            <pre className="text-xs text-gray-400">{JSON.stringify(tx, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManagementTreasury;
