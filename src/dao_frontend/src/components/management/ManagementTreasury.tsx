import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { DAO } from '../../types/dao';
import { useTreasury } from '../../hooks/useTreasury';

const ManagementTreasury: React.FC = () => {
  const { dao } = useOutletContext<{ dao: DAO }>();
  const {
    deposit,
    withdraw,
    getBalance,
    getRecentTransactions,
    loading,
    error,
  } = useTreasury();

  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDesc, setDepositDesc] = useState('');
  const [recipient, setRecipient] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDesc, setWithdrawDesc] = useState('');

  const fetchData = async () => {
    try {
      const bal = await getBalance();
      setBalance(bal);
      const txs = await getRecentTransactions(5);
      setTransactions(txs || []);
    } catch {
      // error handled by hook
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await deposit(depositAmount, depositDesc);
      setDepositAmount('');
      setDepositDesc('');
      fetchData();
    } catch {
      // error handled by hook
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await withdraw(recipient, withdrawAmount, withdrawDesc);
      setRecipient('');
      setWithdrawAmount('');
      setWithdrawDesc('');
      fetchData();
    } catch {
      // error handled by hook
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 font-mono">TREASURY</h2>
          <p className="text-gray-400">Monitor and manage DAO financial resources</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl">
          <p className="text-sm text-gray-400 font-mono mb-1">TOTAL BALANCE</p>
          <p className="text-2xl font-bold text-white">
            {balance ? balance.toString() : '—'}
          </p>
        </div>

        <form onSubmit={handleDeposit} className="space-y-2">
          <input
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Amount"
            className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white"
          />
          <input
            value={depositDesc}
            onChange={(e) => setDepositDesc(e.target.value)}
            placeholder="Description"
            className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-mono"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{loading ? 'Processing...' : 'Deposit'}</span>
          </motion.button>
        </form>

        <form onSubmit={handleWithdraw} className="space-y-2">
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Recipient Principal"
            className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white"
          />
          <input
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Amount"
            className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white"
          />
          <input
            value={withdrawDesc}
            onChange={(e) => setWithdrawDesc(e.target.value)}
            placeholder="Description"
            className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-mono"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>{loading ? 'Processing...' : 'Withdraw'}</span>
          </motion.button>
        </form>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white font-mono">RECENT TRANSACTIONS</h3>
        {transactions.map((tx) => {
          const type = Object.keys(tx.transactionType)[0];
          const time = new Date(
            Number(tx.timestamp / BigInt(1_000_000))
          ).toLocaleString();
          const amountClass =
            type === 'deposit' ? 'text-green-400' : 'text-red-400';
          return (
            <div
              key={tx.id.toString()}
              className="flex justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700/30"
            >
              <div>
                <p className="text-white font-semibold">{type}</p>
                <p className="text-gray-400 text-sm font-mono">{time}</p>
              </div>
              <p className={`font-bold ${amountClass}`}>{tx.amount.toString()}</p>
            </div>
          );
        })}
        {transactions.length === 0 && (
          <p className="text-gray-400 text-center">No transactions</p>
        )}
      </div>
    </div>
  );
};

export default ManagementTreasury;

