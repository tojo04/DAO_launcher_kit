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

  const getDaoPrincipal = () => {
    if (!activeDAO?.id) throw new Error('No active DAO selected');
    return Principal.fromText(activeDAO.id);
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
      const daoPrincipal = getDaoPrincipal();
      const res = await actors.governance.createProposal(
        daoPrincipal,
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
      const daoPrincipal = getDaoPrincipal();
      const res = await actors.governance.vote(
        daoPrincipal,
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
      const daoPrincipal = getDaoPrincipal();
      const res = await actors.governance.getConfig(daoPrincipal);
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
      const daoPrincipal = getDaoPrincipal();
      const res = await actors.governance.getGovernanceStats(daoPrincipal);
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
      const daoPrincipal = getDaoPrincipal();
      const res = await actors.governance.executeProposal(
        daoPrincipal,
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
      const daoPrincipal = getDaoPrincipal();
      return await actors.governance.getActiveProposals(daoPrincipal);
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
      const daoPrincipal = getDaoPrincipal();
      return await actors.governance.getAllProposals(daoPrincipal);
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
      const daoPrincipal = getDaoPrincipal();
      const res = await actors.governance.getProposal(
        daoPrincipal,
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
      const daoPrincipal = getDaoPrincipal();
      return await actors.governance.getProposalVotes(
        daoPrincipal,
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
      const daoPrincipal = getDaoPrincipal();
      return await actors.governance.getProposalsByStatus(
        daoPrincipal,
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
      const daoPrincipal = getDaoPrincipal();
      const userPrincipal = Principal.fromText(user);
      const res = await actors.governance.getUserVote(
        daoPrincipal,
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
      const daoPrincipal = getDaoPrincipal();
      const res = await actors.governance.updateConfig(
        daoPrincipal,
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
