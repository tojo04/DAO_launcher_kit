import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { Image, Upload, Download, Folder } from 'lucide-react';
import { DAO } from '../../types/dao';
import { useAssets } from '../../hooks/useAssets';

const ManagementAssets: React.FC = () => {
  const { dao } = useOutletContext<{ dao: DAO }>();
  const {
    uploadAsset,
    getPublicAssets,
    getUserAssets,
    loading,
    error,
  } = useAssets();

  const [assets, setAssets] = useState<any[]>([]);
  const [view, setView] = useState<'public' | 'user'>('public');
  const [file, setFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    try {
      const list =
        view === 'public' ? await getPublicAssets() : await getUserAssets();
      setAssets(list || []);
    } catch {
      // error handled in hook
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [view]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    try {
      await uploadAsset(file, view === 'public', []);
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      fetchAssets();
    } catch {
      // error handled in hook
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 font-mono">ASSETS</h2>
          <p className="text-gray-400">
            Manage digital assets and files for {dao.name}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInput.current?.click()}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all font-semibold"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Asset</span>
        </motion.button>
        <input
          ref={fileInput}
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
        />
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => setView('public')}
          className={`flex items-center space-x-1 px-3 py-1 rounded ${
            view === 'public'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Public</span>
        </button>
        <button
          onClick={() => setView('user')}
          className={`flex items-center space-x-1 px-3 py-1 rounded ${
            view === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>My Assets</span>
        </button>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        {file && <p className="text-gray-300">{file.name}</p>}
        <button
          type="submit"
          disabled={loading || !file}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 disabled:opacity-50 text-white rounded-lg"
        >
          {loading ? 'Uploading...' : 'Confirm Upload'}
        </button>
      </form>

      {error && <p className="text-red-500">{error}</p>}

      {loading && assets.length === 0 ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <ul className="space-y-2">
          {assets.map((asset) => (
            <li
              key={Number(asset.id)}
              className="flex justify-between p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <Image className="w-4 h-4 text-gray-400" />
                <span className="text-white">{asset.name}</span>
              </div>
              <span className="text-sm text-gray-400">{asset.contentType}</span>
            </li>
          ))}
        </ul>
      )}

      {assets.length === 0 && !loading && (
        <p className="text-gray-400 text-center">No assets found</p>
      )}
    </div>
  );
};

export default ManagementAssets;

