import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DAO } from '../../types/dao';
import { useGovernance } from '../../hooks/useGovernance';

const ManagementGovernance: React.FC = () => {
  const { dao } = useOutletContext<{ dao: DAO }>();
  const { updateConfig, loading, error } = useGovernance();
  const [config, setConfig] = useState({
    maxProposalsPerUser: '',
    proposalDeposit: '',
    votingPeriod: '',
    quorumThreshold: '',
    approvalThreshold: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cfg = {
      maxProposalsPerUser: BigInt(config.maxProposalsPerUser || '0'),
      proposalDeposit: BigInt(config.proposalDeposit || '0'),
      votingPeriod: BigInt(config.votingPeriod || '0'),
      quorumThreshold: BigInt(config.quorumThreshold || '0'),
      approvalThreshold: BigInt(config.approvalThreshold || '0')
    } as any;
    try {
      await updateConfig(cfg);
      setConfig({ maxProposalsPerUser: '', proposalDeposit: '', votingPeriod: '', quorumThreshold: '', approvalThreshold: '' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white font-mono">GOVERNANCE for {dao.name}</h2>
      {loading && <p className="text-gray-400">Updating...</p>}
      {error && <p className="text-red-400">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
          placeholder="Max Proposals Per User"
          value={config.maxProposalsPerUser}
          onChange={e => setConfig({ ...config, maxProposalsPerUser: e.target.value })}
        />
        <input
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
          placeholder="Proposal Deposit"
          value={config.proposalDeposit}
          onChange={e => setConfig({ ...config, proposalDeposit: e.target.value })}
        />
        <input
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
          placeholder="Voting Period (ns)"
          value={config.votingPeriod}
          onChange={e => setConfig({ ...config, votingPeriod: e.target.value })}
        />
        <input
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
          placeholder="Quorum Threshold"
          value={config.quorumThreshold}
          onChange={e => setConfig({ ...config, quorumThreshold: e.target.value })}
        />
        <input
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
          placeholder="Approval Threshold"
          value={config.approvalThreshold}
          onChange={e => setConfig({ ...config, approvalThreshold: e.target.value })}
        />
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
          Update Config
        </button>
      </form>
    </div>
  );
};

export default ManagementGovernance;
