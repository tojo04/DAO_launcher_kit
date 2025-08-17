import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DAO } from '../../types/dao';
import { useAssets } from '../../hooks/useAssets';

const ManagementAssets: React.FC = () => {
  const { dao } = useOutletContext<{ dao: DAO }>();
  const { getUserAssets, getAssetMetadata, loading, error } = useAssets();
  const [assets, setAssets] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});

  useEffect(() => {
    getUserAssets()
      .then(setAssets)
      .catch(console.error);
  }, []);

  const handleMetadata = async (id: any) => {
    try {
      const meta = await getAssetMetadata(id);
      setMetadata(prev => ({ ...prev, [id]: meta }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white font-mono">ASSETS for {dao.name}</h2>
      {loading && <p className="text-gray-400">Loading...</p>}
      {error && <p className="text-red-400">{error}</p>}
      <ul className="space-y-2">
        {assets.map(id => (
          <li key={id.toString()} className="p-4 border border-gray-700 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-white font-mono">Asset {id.toString()}</span>
              <button
                className="text-blue-400 hover:underline text-sm"
                onClick={() => handleMetadata(id)}
              >
                Metadata
              </button>
            </div>
            {metadata[id] && (
              <pre className="text-xs text-gray-400 mt-2">
                {JSON.stringify(metadata[id], null, 2)}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManagementAssets;
