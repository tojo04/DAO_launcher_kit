import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { DAO } from '../../types/dao';
import { useProposals } from '../../hooks/useProposals';

const ManagementProposals: React.FC = () => {
  const { dao } = useOutletContext<{ dao: DAO }>();
  const { createProposal, getAllProposals, loading, error } = useProposals();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [proposals, setProposals] = useState<any[]>([]);

  const fetchProposals = async () => {
    try {
      const list = await getAllProposals();
      setProposals(list || []);
    } catch {
      // error handled in hook
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProposal(title, description, '', '');
      setTitle('');
      setDescription('');
      fetchProposals();
    } catch {
      // error handled in hook
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 font-mono">PROPOSALS</h2>
          <p className="text-gray-400">
            Create and manage governance proposals for {dao.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg"
        >
          <Plus className="w-4 h-4" />
          <span>{loading ? 'Creating...' : 'New Proposal'}</span>
        </motion.button>
      </form>

      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-4">
        {loading && proposals.length === 0 ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          proposals.map((p) => (
            <div
              key={p.id.toString()}
              className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg"
            >
              <h4 className="text-white font-semibold">{p.title}</h4>
              <p className="text-gray-400 text-sm">{p.description}</p>
            </div>
          ))
        )}
        {proposals.length === 0 && !loading && (
          <p className="text-gray-400 text-center">No proposals found</p>
        )}
      </div>
    </div>
  );
};

export default ManagementProposals;

