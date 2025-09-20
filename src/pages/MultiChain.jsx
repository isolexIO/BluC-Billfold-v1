
import React, { useState, useEffect, useCallback } from "react";
import { MultiChainAccount } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  MoreVertical,
  Edit,
  EyeOff,
  Trash2,
  Eye,
  Send
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getMultiChainBalances } from "@/api/functions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SendDialog from "../components/multichain/SendDialog";

const CHAIN_CONFIG = {
  ethereum: {
    name: "Ethereum",
    symbol: "ETH",
    explorer: "https://etherscan.io/address/",
    logo: (
      <svg width="24" height="24" viewBox="0 0 24 24" className="w-6 h-6">
        <path fill="#627EEA" d="M12 0L5.5 12.25L12 16.5L18.5 12.25L12 0Z"/>
        <path fill="#627EEA" d="M12 17.5L5.5 13.25L12 24L18.5 13.25L12 17.5Z"/>
      </svg>
    )
  },
  polygon: {
    name: "Polygon",
    symbol: "MATIC",
    explorer: "https://polygonscan.com/address/",
    logo: (
      <svg width="24" height="24" viewBox="0 0 24 24" className="w-6 h-6">
        <path fill="#8247E5" d="M12 2.6L17.6 6.3V13.7L12 17.4L6.4 13.7V6.3L12 2.6ZM12 0L4 5V15L12 20L20 15V5L12 0Z"/>
        <path fill="#8247E5" d="M12 7.7L15.2 9.6V13.4L12 15.3L8.8 13.4V9.6L12 7.7Z"/>
      </svg>
    )
  },
  base: {
    name: "Base",
    symbol: "ETH",
    explorer: "https://basescan.org/address/",
    logo: (
      <svg width="24" height="24" viewBox="0 0 24 24" className="w-6 h-6">
        <circle cx="12" cy="12" r="12" fill="#0052FF"/>
      </svg>
    )
  },
  solana: {
    name: "Solana",
    symbol: "SOL",
    explorer: "https://explorer.solana.com/address/",
    logo: (
      <svg width="24" height="24" viewBox="0 0 24 24" className="w-6 h-6">
        <defs>
          <linearGradient id="solanaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9945FF"/>
            <stop offset="100%" stopColor="#14F195"/>
          </linearGradient>
        </defs>
        <path fill="url(#solanaGradient)" d="M4.23 8.42a2.3 2.3 0 0 0-1.02 1.57l.02 8.35c.02 1.28 1.04 2.3 2.32 2.3l13.4-.01c1.28 0 2.3-1.03 2.32-2.3l.02-8.35a2.3 2.3 0 0 0-1.02-1.57l-6.7-3.93a2.3 2.3 0 0 0-2.3 0l-6.7 3.93ZM-.95 1.57a.95.95 0 0 1 .43-.65l6.7-3.93c.27-.16.6-.16.87 0l6.7 3.93c.27.16.44.45.43.76l-.02 8.35a.95.95 0 0 1-.95.95l-13.4.01a.95.95 0 0 1-.95-.95l-.02-8.35Z"/>
      </svg>
    )
  }
};

// Helper function to get the correct BluChip token symbol for each chain
const getBluChipSymbol = (chain) => {
  switch (chain) {
    case 'polygon': return 'pBluC';
    case 'ethereum': return 'BluC'; // Even though not deployed
    case 'base': return 'BluC';
    case 'solana': return 'BluC';
    default: return 'BluC';
  }
};

export default function MultiChainPage() {
  const [accounts, setAccounts] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [copiedAddress, setCopiedAddress] = useState('');
  const [editingAccount, setEditingAccount] = useState(null);
  const [newLabel, setNewLabel] = useState("");
  const [sendAccount, setSendAccount] = useState(null);

  const loadMultiChainData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setRefreshing(true);
    setError('');
    
    try {
      console.log("MultiChain: Loading multi-chain data...");
      const response = await getMultiChainBalances();
      console.log("MultiChain: Multi-chain response:", response);
      
      if (response.error) {
        setError(response.error.message || 'Failed to load balances');
      } else if (response.data) {
        console.log("MultiChain: Setting accounts:", response.data.accounts);
        
        // Debug: Log each account's details
        response.data.accounts.forEach(acc => {
          console.log(`MultiChain: Account - ID: ${acc.id}, Chain: ${acc.chain}, Address: ${acc.address}, User: ${acc.user_id}`);
        });
        
        setAccounts(response.data.accounts || []);
        setTotalValue(response.data.totalValue || 0);
      } else {
        setError("No data received from balance service");
      }
    } catch (error) {
      console.error("MultiChain: Error loading multi-chain data:", error);
      setError("Failed to load multi-chain accounts: " + error.message);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMultiChainData();
  }, [loadMultiChainData]);

  const copyAddress = async (address) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(''), 2000);
  };

  const openInExplorer = (chain, address) => {
    const config = CHAIN_CONFIG[chain];
    if (config?.explorer) {
      window.open(config.explorer + address, '_blank', 'noopener,noreferrer');
    }
  };

  const handleUpdateLabel = async () => {
    if (!editingAccount || !newLabel) return;
    setError('');
    try {
      await MultiChainAccount.update(editingAccount.id, { label: newLabel });
      setEditingAccount(null);
      setNewLabel("");
      await loadMultiChainData(true);
    } catch (err) {
      setError("Failed to update label.");
    }
  };

  const toggleAccountActive = async (account, isActive) => {
    setError('');
    try {
      await MultiChainAccount.update(account.id, { is_active: isActive });
      await loadMultiChainData(true);
    } catch (err) {
      setError(`Failed to ${isActive ? 'reactivate' : 'deactivate'} account.`);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    setError('');
    try {
      console.log(`MultiChain: Deleting account ${accountId}`);
      await MultiChainAccount.delete(accountId);
      await loadMultiChainData(true);
    } catch (err) {
      console.error(`MultiChain: Delete error:`, err);
      setError("Failed to delete account.");
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-900 text-white min-h-screen">
        <div className="animate-pulse max-w-6xl mx-auto">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="h-24 bg-gray-700 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-56 bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeAccounts = accounts.filter(acc => acc.is_active);
  const inactiveAccounts = accounts.filter(acc => !acc.is_active);
  const portfolioAccountCount = activeAccounts.length;

  return (
    <div className="p-4 md:p-6 bg-gray-900 text-white min-h-screen">
      <Dialog open={!!editingAccount} onOpenChange={() => setEditingAccount(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Edit Label</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="account-label">Account Label</Label>
            <Input
              id="account-label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g., My Savings"
              className="mt-2 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {setEditingAccount(null); setNewLabel("");}} className="bg-gray-700 border-gray-600 hover:bg-gray-600">Cancel</Button>
            <Button onClick={handleUpdateLabel} className="bg-purple-600 hover:bg-purple-700 text-white">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <SendDialog
        account={sendAccount}
        open={!!sendAccount}
        onClose={() => setSendAccount(null)}
      />

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" size="icon" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Multi-Chain Portfolio</h1>
            <p className="text-gray-200">Your independent wallets across multiple blockchains</p>
          </div>
          <Button
            variant="outline"
            onClick={() => loadMultiChainData(true)}
            disabled={refreshing}
            className="bg-gray-800 border-gray-700 hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-8 bg-gradient-to-r from-purple-800 to-cyan-800 text-white border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Total Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">${totalValue.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
            <p className="text-purple-200 mt-1">Across {portfolioAccountCount} active wallet{portfolioAccountCount !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 text-white">Your Wallets</h2>
          {accounts.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700 p-8 text-center">
              <Wallet className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No wallets found</h3>
              <p className="text-gray-400 mb-4">Multi-chain wallets will be created automatically when you visit this page.</p>
              <Button onClick={() => loadMultiChainData(true)} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Create Wallets
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeAccounts.map((account) => {
                const config = CHAIN_CONFIG[account.chain];
                return (
                  <Card key={account.id} className="bg-gray-800 border-gray-700 hover:border-purple-500/50 transition-colors duration-300 flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                            {config.logo}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-white">{account.label || config.name}</h3>
                            <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                              {config.name}
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400 hover:text-white">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
                            <DropdownMenuItem className="focus:bg-gray-700" onClick={() => { setEditingAccount(account); setNewLabel(account.label || ""); }}>
                              <Edit className="w-4 h-4 mr-2" /> Edit Label
                            </DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-gray-700" onClick={() => toggleAccountActive(account, false)}>
                              <EyeOff className="w-4 h-4 mr-2" /> Deactivate
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:bg-red-500/20 focus:text-red-400">
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-400">This will permanently delete the wallet record. This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex justify-end gap-2">
                                  <AlertDialogCancel className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-white">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteAccount(account.id)} className="bg-red-600 hover:bg-red-700 text-white">Continue</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-between">
                      <div className="space-y-4">
                        <div>
                          <p className="text-2xl font-bold text-white">
                            {(account.balance || 0).toFixed(6)} <span className="text-base font-normal text-white">{config.symbol}</span>
                          </p>
                          {account.blc_balance !== undefined && account.blc_balance > 0 && (
                             <p className="text-lg font-bold text-white mt-2">
                               {(account.blc_balance || 0).toLocaleString()} <span className="text-sm font-normal text-white">{getBluChipSymbol(account.chain)}</span>
                             </p>
                          )}
                        </div>
                        <div className="text-xs text-white font-mono break-all">
                          {account.address}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => copyAddress(account.address)} className="flex-1 bg-gray-700 hover:bg-gray-600 border-gray-600">
                          {copiedAddress === account.address ? <Check className="w-3 h-3 mr-1 text-green-400" /> : <Copy className="w-3 h-3 mr-1" />}
                          Copy Addr
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => openInExplorer(account.chain, account.address)} className="bg-gray-700 hover:bg-gray-600 border-gray-600">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button size="icon" onClick={() => {
                          console.log(`MultiChain: Opening send dialog for account:`, account);
                          setSendAccount(account);
                        }} className="bg-blue-600 hover:bg-blue-700">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {inactiveAccounts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 text-gray-200">Inactive Wallets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {inactiveAccounts.map(account => {
                const config = CHAIN_CONFIG[account.chain];
                return (
                  <Card key={account.id} className="bg-gray-800/50 border-gray-700/50 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">{config.logo}</div>
                      <div>
                        <h4 className="font-medium text-white">{account.label || config.name}</h4>
                        <p className="text-xs text-gray-400">{account.address.slice(0,6)}...{account.address.slice(-4)}</p>
                      </div>
                    </div>
                    <Button onClick={() => toggleAccountActive(account, true)} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Eye className="w-4 h-4 mr-2" /> Reactivate
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
