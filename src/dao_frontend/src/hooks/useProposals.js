import { useState } from 'react';
import { useActors } from '../context/ActorContext';

export const useProposals = () => {
  const actors = useActors();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toNanoseconds = (seconds) => BigInt(seconds) * 1_000_000_000n;

  const createProposal = async (
    daoId,
    title,
    description,
    category,
    votingPeriod
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await actors.proposals.createProposal(
        daoId,
        title,
        description,
        { textProposal: '' },
        category ? [category] : [],
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

  const getAllProposals = async (daoId) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.proposals.getAllProposals(daoId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProposalsByCategory = async (daoId, category) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.proposals.getProposalsByCategory(daoId, category);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProposalTemplates = async (daoId) => {
    setLoading(true);
    setError(null);
    try {
      return await actors.proposals.getProposalTemplates(daoId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const vote = async (daoId, proposalId, choice, reason) => {
    setLoading(true);
    setError(null);
    try {
      const choiceVariant = { [choice]: null };
      const res = await actors.proposals.vote(
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

  return {
    createProposal,
    vote,
    getAllProposals,
    getProposalsByCategory,
    getProposalTemplates,
    loading,
    error,
  };
};
