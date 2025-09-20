
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Lock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import { useWallet } from "../components/wallet/WalletProvider";
import WalletCard from "../components/dashboard/WalletCard";
import QuickActions from "../components/dashboard/QuickActions";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import DebugInfoCard from "../components/dashboard/DebugInfoCard";
import WalletEmptyState from "../components/dashboard/WalletEmptyState";
import WalletLockStatus from "../components/dashboard/WalletLockStatus";
import MultiChainOverview from "../components/dashboard/MultiChainOverview";
import NotificationBanner from "../components/dashboard/NotificationBanner"; // Added import

export default function Dashboard() {
  const {
    wallet,
    balance,
    transactions,
    walletStatus,
    networkStats,
    loading: walletLoading,
    error: walletError,
  } = useWallet();

  const [user, setUser] = useState(null);
  const [balanceVisible, setBalanceVisible] = useState(true);

  useEffect(() => {
    async function loadInitialUser() {
      try {
        const userData = await User.me();
        setUser(userData);
        if (userData && userData.wallet_settings && typeof userData.wallet_settings.showBalance === 'boolean') {
          setBalanceVisible(userData.wallet_settings.showBalance);
        }
      } catch(e) {
        console.error("Failed to load user", e);
      }
    }
    loadInitialUser();
  }, []);
  
  if (walletLoading && !wallet) {
    return (
      <div className="p-3 md:p-6 space-y-4 md:space-y-6 bg-gray-900 min-h-screen">
        <div className="animate-pulse">
          <div className="h-24 md:h-32 bg-gray-700 rounded-lg mb-4 md:mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            <div className="h-16 md:h-24 bg-gray-700 rounded-lg"></div>
            <div className="h-16 md:h-24 bg-gray-700 rounded-lg"></div>
            <div className="h-16 md:h-24 bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const usdValue = balance * 0.25;
  const isWalletEmpty = balance === 0 && transactions.length === 0;

  return (
    <div className="p-3 md:p-6 bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-3 md:space-y-6">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-start md:gap-4">
          <div className="flex-1">
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-white leading-tight">
              Welcome back, {user?.full_name?.split(' ')[0]}
            </h1>
            <p className="text-gray-400 mt-1 text-xs md:text-base">Manage your BluChip cryptocurrency</p>
          </div>
          <div className="flex justify-start md:justify-end">
            <WalletLockStatus />
          </div>
        </div>

        {/* Alerts and Notifications */}
        <NotificationBanner /> {/* Added NotificationBanner component */}

        {walletError && (
          <Alert variant="destructive" className="mx-1 md:mx-0">
            <AlertDescription className="text-sm">{walletError}</AlertDescription>
          </Alert>
        )}

        {isWalletEmpty && !walletLoading && <WalletEmptyState />}

        {walletStatus.isLocked && walletStatus.isEncrypted && (
          <Alert className="border-orange-500/20 bg-orange-500/10 mx-1 md:mx-0">
            <Lock className="h-4 w-4 text-orange-400" />
            <AlertDescription className="text-orange-300 text-sm">
              Your wallet is currently locked. You can view your balance but cannot send transactions until you unlock it.
            </AlertDescription>
          </Alert>
        )}

        {/* Wallet Card */}
        <WalletCard
          wallet={wallet}
          balance={balance} // FIX: Explicitly pass the live balance from context
          balanceVisible={balanceVisible}
          setBalanceVisible={setBalanceVisible}
        />

        {/* Quick Actions */}
        <QuickActions />

        {/* Main Content Grid - Mobile First */}
        <div className="space-y-4 md:space-y-6">
          {/* Multi-Chain Overview - Full width on mobile */}
          <MultiChainOverview />

          {/* Desktop: Two column layout, Mobile: Stacked */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
            {/* Recent Transactions */}
            <div className="xl:col-span-2">
              <RecentTransactions
                transactions={transactions.slice(0, 5)}
                wallet={wallet}
              />
            </div>

            {/* Side Panel Content */}
            <div className="space-y-4 md:space-y-6">
              {/* BluChip Summary */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3 md:pb-6">
                  <CardTitle className="flex items-center gap-2 text-white text-base md:text-lg">
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                    BluChip Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm md:text-base">BLC Balance</span>
                      <span className="font-semibold text-white text-sm md:text-base">
                        {balanceVisible ? `${balance.toLocaleString()} BLC` : '••••••'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm md:text-base">USD Value</span>
                      <span className="font-semibold text-white text-sm md:text-base">
                        {balanceVisible ? `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm md:text-base">24h Change</span>
                      <span className="font-semibold text-green-400 text-sm md:text-base">+2.5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Network Status */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3 md:pb-6">
                  <CardTitle className="text-white text-base md:text-lg">Network Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {networkStats ? (
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm md:text-base">Network</span>
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                          Online
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm md:text-base">Block Height</span>
                        <span className="font-semibold text-white text-sm md:text-base">{networkStats.blocks?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm md:text-base">Circulation</span>
                        <span className="font-semibold text-white text-sm md:text-base">{(networkStats.circulation || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} BLC</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm md:text-base">Difficulty</span>
                        <span className="font-semibold text-white text-sm md:text-base">{(Number(networkStats.difficulty) || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm md:text-base">Connections</span>
                        <span className="font-semibold text-white text-sm md:text-base">{networkStats.connections}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm md:text-base">Hashrate</span>
                        <span className="font-semibold text-white text-sm md:text-base">{(networkStats.hashrate / 1e9).toFixed(2)} GH/s</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Loading network data...</p>
                  )}
                  <Separator className="my-3 md:my-4 bg-gray-700" />
                  <a href="http://185.196.102.139:3001" target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button variant="outline" className="w-full text-sm">
                      View Block Explorer
                      <ExternalLink className="w-3 h-3 md:w-4 md:h-4 ml-2" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <DebugInfoCard />

      </div>
    </div>
  );
}
