import { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { useActors } from '../context/ActorContext';
import { useDAO } from '../context/DAOContext';

export const useGovernance = () => {
  const actors = useActors();
  const { activeDAO } = useDAO();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toNanoseconds = (seconds) => BigInt(seconds) * 1_000_000_000n;

  const getDaoId = () => {
    if (!activeDAO?.id) throw new Error('No active DAO selected');
    return activeDAO.id;
  };

  const createProposal = async (
    title,
    description,
    proposalType,
    votingPeriod
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.governance.createProposal(
        getDaoId(),
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

  const vote = async (proposalId, choice, reason) => {
    setLoading(true);
    setError(null);
    try {
      const choiceVariant = { [choice]: null };
      const res = await actors.governance.vote(
        getDaoId(),
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

  const getConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.governance.getConfig(getDaoId());
      return res && res.length ? res[0] : null;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getGovernanceStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.governance.getGovernanceStats(getDaoId());
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const executeProposal = async (proposalId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.governance.executeProposal(
        getDaoId(),
        BigInt(proposalId)
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

  const getActiveProposals = async () => {
    setLoading(true);
    setError(null);
    try {
      return await actors.governance.getActiveProposals(getDaoId());
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAllProposals = async () => {
    setLoading(true);
    setError(null);
    try {
      return await actors.governance.getAllProposals(getDaoId());
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProposal = async (proposalId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.governance.getProposal(
        getDaoId(),
        BigInt(proposalId)
      );
      return res && res.length ? res[0] : null;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProposalVotes = async (proposalId) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.governance.getProposalVotes(
        getDaoId(),
        BigInt(proposalId)
      );
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProposalsByStatus = async (status) => {
    setLoading(true);
    setError(null);
    try {
      const statusVariant = { [status]: null };
      return await actors.governance.getProposalsByStatus(
        getDaoId(),
        statusVariant
      );
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserVote = async (proposalId, user) => {
    setLoading(true);
    setError(null);
    try {
      const userPrincipal = Principal.fromText(user);
      const res = await actors.governance.getUserVote(
        getDaoId(),
        BigInt(proposalId),
        userPrincipal
      );
      return res && res.length ? res[0] : null;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (newConfig) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.governance.updateConfig(
        getDaoId(),
        newConfig
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
