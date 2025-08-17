import { useState } from 'react';
import { useActors } from '../context/ActorContext';
import { useDAO } from '../context/DAOContext';

export const useGovernance = () => {
  const actors = useActors();
  const { activeDAO } = useDAO();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toNanoseconds = (seconds) => BigInt(seconds) * 1_000_000_000n;

  const createProposal = async (
    title,
    description,
    proposalType,
    votingPeriod,
    daoId = activeDAO?.id
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.governance.createProposal(
        daoId,
        title,
        description,
        proposalType,
        votingPeriod ? [toNanoseconds(votingPeriod)] : []
      );
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const vote = async (proposalId, choice, reason, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const choiceVariant = { [choice]: null };
      const res = await actors.governance.vote(
        daoId,
        BigInt(proposalId),
        choiceVariant,
        reason ? [reason] : []
      );
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getConfig = async (daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.governance.getConfig(daoId);
      if ('err' in res) throw new Error(res.err);
      return 'ok' in res ? res.ok : res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getGovernanceStats = async (daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.governance.getGovernanceStats(daoId);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const executeProposal = async (proposalId, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.governance.executeProposal(daoId, BigInt(proposalId));
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getActiveProposals = async (daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.governance.getActiveProposals(daoId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAllProposals = async (daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.governance.getAllProposals(daoId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProposal = async (proposalId, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.governance.getProposal(daoId, BigInt(proposalId));
      return res && res.length ? res[0] : null;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProposalVotes = async (proposalId, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.governance.getProposalVotes(daoId, BigInt(proposalId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProposalsByStatus = async (status, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const statusVariant = { [status]: null };
      return await actors.governance.getProposalsByStatus(daoId, statusVariant);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserVote = async (proposalId, user, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.governance.getUserVote(
        daoId,
        BigInt(proposalId),
        user
      );
      return res && res.length ? res[0] : null;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (newConfig, daoId = activeDAO?.id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.governance.updateConfig(daoId, newConfig);
      if ('err' in res) throw new Error(res.err);
      return res.ok;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createProposal,
    vote,
    getConfig,
    getGovernanceStats,
    executeProposal,
    getActiveProposals,
    getAllProposals,
    getProposal,
    getProposalVotes,
    getProposalsByStatus,
    getUserVote,
    updateConfig,
    loading,
    error,
  };
};
