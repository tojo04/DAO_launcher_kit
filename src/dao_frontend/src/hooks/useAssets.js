import { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { useActors } from '../context/ActorContext';

export const useAssets = () => {
  const actors = useActors();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const uploadAsset = async (daoId, file, isPublic = true, tags = []) => {
    setLoading(true);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const data = Array.from(new Uint8Array(arrayBuffer));
      const result = await actors.assets.uploadAsset(
        daoId,
        file.name,
        file.type,
        data,
        isPublic,
        tags
      );
      if (result.err) {
        throw new Error(result.err);
      }
      return result.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAsset = async (daoId, assetId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.assets.getAsset(
        daoId,
        BigInt(assetId)
      );
      if (res.err) {
        throw new Error(res.err);
      }
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAssetMetadata = async (daoId, assetId) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.assets.getAssetMetadata(
        daoId,
        BigInt(assetId)
      );
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPublicAssets = async (daoId) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.assets.getPublicAssets(daoId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserAssets = async (daoId) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.assets.getUserAssets(daoId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchAssetsByTag = async (daoId, tag) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.assets.searchAssetsByTag(
        daoId,
        tag
      );
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAsset = async (daoId, assetId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.assets.deleteAsset(
        daoId,
        BigInt(assetId)
      );
      if (res.err) {
        throw new Error(res.err);
      }
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAssetMetadata = async (daoId, assetId, { name = null, isPublic = null, tags = null }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.assets.updateAssetMetadata(
        daoId,
        BigInt(assetId),
        name === null ? [] : [name],
        isPublic === null ? [] : [isPublic],
        tags === null ? [] : [tags]
      );
      if (res.err) {
        throw new Error(res.err);
      }
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStorageStats = async (daoId) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.assets.getStorageStats(daoId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAuthorizedUploaders = async (daoId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.assets.getAuthorizedUploaders(daoId);
      return res.map((p) => (typeof p.toText === 'function' ? p.toText() : p));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addAuthorizedUploader = async (daoId, principal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.assets.addAuthorizedUploader(
        daoId,
        Principal.fromText(principal)
      );
      if (res.err) {
        throw new Error(res.err);
      }
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeAuthorizedUploader = async (daoId, principal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.assets.removeAuthorizedUploader(
        daoId,
        Principal.fromText(principal)
      );
      if (res.err) {
        throw new Error(res.err);
      }
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateStorageLimits = async (
    daoId,
    maxFileSizeNew = null,
    maxTotalStorageNew = null
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.assets.updateStorageLimits(
        daoId,
        maxFileSizeNew === null ? [] : [BigInt(maxFileSizeNew)],
        maxTotalStorageNew === null ? [] : [BigInt(maxTotalStorageNew)]
      );
      if (res.err) {
        throw new Error(res.err);
      }
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSupportedContentTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      return await actors.assets.getSupportedContentTypes();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAssetByName = async (daoId, name) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.assets.getAssetByName(
        daoId,
        name
      );
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const batchUploadAssets = async (daoId, files) => {
    setLoading(true);
    setError(null);
    try {
      const formatted = await Promise.all(
        files.map(async ({ file, isPublic = true, tags = [] }) => {
          const arrayBuffer = await file.arrayBuffer();
          const data = Array.from(new Uint8Array(arrayBuffer));
          return [file.name, file.type, data, isPublic, tags];
        })
      );
      return await actors.assets.batchUploadAssets(
        daoId,
        formatted
      );
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      return await actors.assets.health();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    uploadAsset,
    getAsset,
    getAssetMetadata,
    getPublicAssets,
    getUserAssets,

    searchAssetsByTag,
    deleteAsset,
    updateAssetMetadata,
    getStorageStats,

    getAuthorizedUploaders,
    addAuthorizedUploader,
    removeAuthorizedUploader,
    updateStorageLimits,
    getSupportedContentTypes,
    getAssetByName,
    batchUploadAssets,
    getHealth,
    loading,
    error,
  };
};

