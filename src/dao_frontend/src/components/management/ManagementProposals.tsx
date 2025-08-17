import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DAO } from '../../types/dao';
import { useProposals } from '../../hooks/useProposals';

const ManagementProposals: React.FC = () => {
  const { dao } = useOutletContext<{ dao: DAO }>();
  const { getTrendingProposals, addTemplate, loading, error } = useProposals();
  const [trending, setTrending] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    required: ''
  });

  useEffect(() => {
    getTrendingProposals(5)
      .then(setTrending)
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fields = form.required
      .split(',')
      .map(f => f.trim())
      .filter(Boolean);
    try {
      await addTemplate(form.name, form.description, form.category, fields, {});
      setForm({ name: '', description: '', category: '', required: '' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white font-mono">PROPOSALS for {dao.name}</h2>
      {loading && <p className="text-gray-400">Loading...</p>}
      {error && <p className="text-red-400">{error}</p>}
      <div>
        <h3 className="text-xl font-semibold text-white font-mono mb-2">Trending</h3>
        <ul className="space-y-2">
          {trending.map(p => (
            <li key={p.id?.toString?.()} className="p-4 border border-gray-700 rounded-lg">
              <span className="text-white">{p.title}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white font-mono mb-2">Add Template</h3>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
            placeholder="Name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
            placeholder="Description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <input
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
            placeholder="Category"
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
          />
          <input
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
            placeholder="Required Fields (comma separated)"
            value={form.required}
            onChange={e => setForm({ ...form, required: e.target.value })}
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            Add Template
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManagementProposals;
