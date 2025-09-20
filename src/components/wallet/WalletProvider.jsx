
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { User } from '@/api/entities';
import { Wallet } from '@/api/entities';
import { getUserWalletData } from '@/api/functions';
import { getWalletStatus } from '@/api/functions';
import { getNetworkStats } from '@/api/functions';
import { getMultiChainBalances } from '@/api/functions';

const WalletContext = createContext(null);

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [walletStatus, setWalletStatus] = useState({ isLocked: false, isEncrypted: false });
  const [networkStats, setNetworkStats] = useState(null);
  const [multiChainData, setMultiChainData] = useState({ accounts: [], totalValue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllWalletData = useCallback(async () => {
    console.log("WalletProvider: Starting sequential data fetch...");
    // Don't set loading to true on interval refreshes to avoid UI flashing
    
    try {
      const userData = await User.me();
      if (!userData) {
          setLoading(false);
          return;
      }

      // --- Waterfall Step 1: Core Wallet Data (Highest Priority) ---
      const { data: realData, error: dataError } = await getUserWalletData();
      if (dataError) throw new Error(dataError.message || 'Failed to fetch wallet data.');

      setBalance(realData.balance || 0);
      setTransactions(realData.transactions || []);
      
      let userWallets = await Wallet.filter({ user_id: userData.id });
      let currentWallet;
      if (userWallets.length === 0 && realData.activeAddress) {
        currentWallet = await Wallet.create({
          user_id: userData.id, wallet_address: realData.activeAddress, balance: realData.balance,
          private_key_hash: "synced_from_node", public_key: "synced_from_node"
        });
      } else if (userWallets.length > 0) {
        currentWallet = userWallets[0];
        // FIX: Always update the DB wallet with the latest live balance
        if (Math.abs((currentWallet.balance || 0) - (realData.balance || 0)) > 1e-9) {
          await Wallet.update(currentWallet.id, { balance: realData.balance });
          currentWallet.balance = realData.balance; // Update in-memory object for immediate use
        }
      } else { // This else block would typically not be reached if userWallets.length is 0 and realData.activeAddress is falsy, or if there's no active address. It's safer to ensure currentWallet is defined.
        // If userWallets is empty and no activeAddress, currentWallet remains undefined.
        // The original code had `currentWallet = userWallets[0];` here which would throw an error if userWallets is empty.
        // It's better to explicitly handle the case where no wallet is found or created.
        console.warn("No wallet found or created for user and no active address provided.");
        currentWallet = null; // Ensure it's null if no wallet is found/created
      }

      if (currentWallet) {
        currentWallet.allAddresses = realData.allAddresses || [];
        currentWallet.activeAddress = realData.activeAddress || currentWallet.wallet_address;
        setWallet(currentWallet);
      }
      
      // --- Waterfall Step 2: Wallet Lock Status ---
      const { data: statusData, error: statusError } = await getWalletStatus();
      if (statusError) console.warn("Could not fetch wallet status:", statusError);
      setWalletStatus(statusData || { isLocked: false, isEncrypted: false, fallback: true });

      // --- Waterfall Step 3: Network Stats (Less Critical) ---
      const { data: statsData, error: statsError } = await getNetworkStats();
      if (statsError) console.warn("Failed to fetch network stats:", statsError);
      setNetworkStats(statsData);
      
      // --- Waterfall Step 4: Multi-Chain Balances (Least Critical) ---
      // Make this completely optional and non-blocking
      try {
        const { data: multiChainRes, error: multiChainError } = await getMultiChainBalances();
        if (multiChainError) {
          console.warn("Failed to fetch multi-chain balances:", multiChainError);
          // Don't throw - just use empty data
          setMultiChainData({ accounts: [], totalValue: 0, error: multiChainError });
        } else {
          setMultiChainData(multiChainRes || { accounts: [], totalValue: 0 });
        }
      } catch (multiChainErr) {
        console.warn("Multi-chain fetch failed completely:", multiChainErr);
        setMultiChainData({ accounts: [], totalValue: 0, error: 'Multi-chain data unavailable' });
      }

      setError(null);
    } catch (err) {
      console.error("WalletProvider Error:", err);
      let errorMessage = err.message;
      if (err.message && (err.message.includes('429') || err.message.toLowerCase().includes('rate limit'))) {
        errorMessage = "The network is busy. Data will be refreshed shortly.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllWalletData();
    const interval = setInterval(fetchAllWalletData, 300000); // Changed from 120000 (2min) to 300000 (5min)
    return () => clearInterval(interval);
  }, [fetchAllWalletData]);

  const value = {
    wallet,
    balance,
    transactions,
    walletStatus,
    networkStats,
    multiChainData,
    loading,
    error,
    refreshWalletData: fetchAllWalletData,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}
