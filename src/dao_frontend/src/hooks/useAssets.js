import { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { useActors } from '../context/ActorContext';
import { useDAO } from '../context/DAOContext';

export const useAssets = () => {
  const actors = useActors();
  const { activeDAO } = useDAO();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const uploadAsset = async (file, isPublic = true, tags = [], daoId = activeDAO?.id) => {
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

  const getAsset = async (assetId, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.assets.getAsset(daoId, BigInt(assetId));
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

  const getAssetMetadata = async (assetId, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.assets.getAssetMetadata(daoId, BigInt(assetId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPublicAssets = async (daoId = activeDAO?.id) => {
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

  const getUserAssets = async (daoId = activeDAO?.id) => {
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

  const searchAssetsByTag = async (tag, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.assets.searchAssetsByTag(daoId, tag);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAsset = async (assetId, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.assets.deleteAsset(daoId, BigInt(assetId));
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

  const updateAssetMetadata = async (
    assetId,
    { name = null, isPublic = null, tags = null },
    daoId = activeDAO?.id
  ) => {
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

  const getStorageStats = async (daoId = activeDAO?.id) => {
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

  const getAuthorizedUploaders = async (daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.assets.getAuthorizedUploaders(daoId);
      return res.map((p) => p.toText());
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addAuthorizedUploader = async (principal, daoId = activeDAO?.id) => {
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

  const removeAuthorizedUploader = async (principal, daoId = activeDAO?.id) => {
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
    maxFileSizeNew = null,
    maxTotalStorageNew = null,
    daoId = activeDAO?.id
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

  const getSupportedContentTypes = async (daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.assets.getSupportedContentTypes(daoId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAssetByName = async (name, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.assets.getAssetByName(daoId, name);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const batchUploadAssets = async (files, daoId = activeDAO?.id) => {
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
      return await actors.assets.batchUploadAssets(daoId, formatted);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getHealth = async (daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.assets.health(daoId);
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

