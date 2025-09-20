
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  TrendingUp, 
  Coins, 
  Gift,
  Lock,
  Unlock,
  Info,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Globe,
  User as UserIcon,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { getStakingStatus } from "@/api/functions";
import { setStaking } from "@/api/functions";
import { useWallet } from "../components/wallet/WalletProvider";
import WalletLockStatus from "../components/wallet/WalletLockStatus";

export default function StakingPage() {
  const { 
    balance: realTimeBalance, 
    transactions, 
    walletStatus, 
    loading: walletLoading,
    refreshWalletData
  } = useWallet();

  const [stakingStatus, setStakingStatus] = useState({ 
    isStaking: false, 
    stakedAmount: 0, 
    myWeight: 0, 
    networkWeight: 0, 
    expectedTime: 0,
    stakingYield: 0,
    canStake: false,
    isEncrypted: false,
    walletUnlocked: false,
    matureBalance: 0
  });
  const [stakingRewards, setStakingRewards] = useState(0);
  const [stakingHistory, setStakingHistory] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingStakingData, setLoadingStakingData] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);

  // State for unlock dialog
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [passphrase, setPassphrase] = useState('');

  const addDebugLog = (message) => {
    console.log(`[Staking UI] ${message}`);
    setDebugLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const loadStakingData = useCallback(async () => {
    setLoadingStakingData(true);
    addDebugLog("Loading staking data...");
    
    try {
      const { data: stakingData, error: stakingError } = await getStakingStatus();

      if (stakingError) {
        addDebugLog(`Staking data error: ${stakingError}`);
        setStakingStatus(prev => ({ ...prev, isStaking: false, stakedAmount: 0 }));
      } else {
        console.log('Received staking status:', stakingData);
        setStakingStatus(stakingData);
        addDebugLog(`Staking: ${stakingData.isStaking ? 'Active' : 'Inactive'} | Staked: ${stakingData.stakedAmount} BLC`);
      }
    } catch (err) {
      console.error('Error loading staking data:', err);
      addDebugLog(`Staking data load failed: ${err.message}`);
      setStakingStatus(prev => ({ ...prev, isStaking: false, stakedAmount: 0 }));
    }
    setLoadingStakingData(false);
  }, []);

  // Effect to calculate staking rewards and history from global transactions
  useEffect(() => {
    if (transactions) {
      const rewardTxs = transactions.filter(tx => 
        tx.category === 'generate' || tx.category === 'stake' || tx.type === 'stake_reward'
      );
      
      const totalRewards = rewardTxs.reduce((sum, tx) => {
        const amount = Math.abs(parseFloat(tx.amount) || 0);
        return sum + amount;
      }, 0);
      
      setStakingRewards(totalRewards);
      
      const sortedRewards = rewardTxs
        .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
        .slice(0, 10);
      
      setStakingHistory(sortedRewards);
      
      if (rewardTxs.length > 0) {
        addDebugLog(`Found ${rewardTxs.length} staking rewards totaling ${totalRewards.toFixed(2)} BLC`);
      }
    }
  }, [transactions]);

  useEffect(() => {
    if (!walletLoading && realTimeBalance !== undefined) {
      loadStakingData();
    }
  }, [walletLoading, realTimeBalance, loadStakingData]);

  const handleToggleStaking = async (enabled) => {
    setUpdating(true);
    setError('');
    setSuccess('');
    
    addDebugLog(`Attempting to ${enabled ? 'enable' : 'disable'} staking...`);
    
    try {
      const params = { enabled };
      if (enabled && stakingStatus.isEncrypted) {
        if (!passphrase) {
          setShowUnlockDialog(true);
          setUpdating(false);
          return;
        }
        params.passphrase = passphrase;
      }
      
      const { data, error: stakingError } = await setStaking(params);
      
      if (stakingError || (data && !data.success)) {
        const errorMsg = stakingError?.message || data?.error || 'Failed to change staking status.';
        setError(errorMsg);
        addDebugLog(`Staking toggle failed: ${errorMsg}`);
      } else {
        setSuccess(data.message);
        addDebugLog(`Staking toggle successful: ${data.message}`);
        setPassphrase('');
        setShowUnlockDialog(false);
        
        // Update local state and refresh data
        await Promise.all([refreshWalletData(), loadStakingData()]);
      }
    } catch (err) {
      setError(err.message);
      addDebugLog(`Staking toggle error: ${err.message}`);
    }
    setUpdating(false);
  };

  const handleUnlockForStaking = async () => {
    if (!passphrase) {
      setError("Passphrase cannot be empty.");
      return;
    }
    await handleToggleStaking(true);
  };

  const formatExpectedTime = (seconds) => {
    if (!seconds || seconds <= 0) return 'N/A';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    let parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (days === 0 && hours === 0 && minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    
    if (parts.length === 0) return "Less than a minute";
    
    return parts.join(', ');
  }

  if (walletLoading && !realTimeBalance) {
    return (
      <div className="p-4 md:p-6 bg-gray-900 text-white min-h-screen">
        <div className="animate-pulse max-w-4xl mx-auto">
          <div className="h-8 bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="h-32 bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-900 text-gray-200 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-gray-200">BluChip Staking</h1>
          </div>
          <div className="flex items-center gap-4">
            <WalletLockStatus />
            <Button onClick={() => { refreshWalletData(); loadStakingData(); }} variant="outline" size="sm" disabled={walletLoading || loadingStakingData}>
              <RefreshCw className={`w-4 h-4 mr-2 ${(walletLoading || loadingStakingData) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Status Alerts */}
        {success && (
          <Alert className="mb-6 bg-green-500/10 border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b85aecf045e1f939b1fbf6/06225600f_7299877ff8ae78677197cdca21bab1df-1-154x154.png" 
                    alt="$BluC Logo" 
                    className="w-6 h-6 rounded-full"
                  />
                </div>
                <div>
                  <p className="text-gray-400 text-xs md:text-sm">Total Balance</p>
                  <p className="text-xl md:text-3xl font-bold text-white">{realTimeBalance.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs md:text-sm">≈ ${(realTimeBalance * 0.25).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <Coins className="w-6 md:w-8 h-6 md:h-8 text-blue-400" />
                <div>
                  <p className="text-gray-400 text-xs md:text-sm">Currently Staking</p>
                  <p className="text-xl md:text-3xl font-bold text-white">{stakingStatus.stakedAmount.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs md:text-sm">
                    APY: {stakingStatus.stakingYield.toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <Gift className="w-6 md:w-8 h-6 md:h-8 text-green-400" />
                <div>
                  <p className="text-gray-400 text-xs md:text-sm">Total Rewards Earned</p>
                  <p className="text-xl md:text-3xl font-bold text-white">{stakingRewards.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs md:text-sm">≈ ${(stakingRewards * 0.25).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-4 md:space-y-6">
            {/* Staking Controls */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Staking Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-gray-700/50 border-gray-600">
                  <Info className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-gray-300 text-sm">
                    Staking allows you to earn rewards by helping secure the network. {stakingStatus.isEncrypted ? 'Your wallet is encrypted and requires unlocking for staking.' : 'Your unencrypted wallet stakes automatically.'}
                  </AlertDescription>
                </Alert>

                {/* FIX: Smarter conditional rendering for staking status alerts */}
                
                {/* Case 1: Staking on, 0 staked, but MATURE coins ARE available. */}
                {stakingStatus.isStaking && stakingStatus.stakedAmount === 0 && stakingStatus.matureBalance > 0 && (
                   <Alert variant="destructive" className="bg-blue-500/10 border-blue-500/20">
                     <AlertTriangle className="h-4 w-4 text-blue-400" />
                     <AlertDescription className="text-blue-300">
                       Staking is active. The network is processing your mature coins to begin staking. This may take a few minutes.
                       <br/>
                       <span className="font-bold">Mature Balance Ready to Stake: {stakingStatus.matureBalance.toLocaleString()} BLC</span>
                     </AlertDescription>
                   </Alert>
                )}

                {/* Case 2: Staking on, 0 staked, and NO mature coins are available. */}
                {stakingStatus.isStaking && stakingStatus.stakedAmount === 0 && stakingStatus.matureBalance === 0 && realTimeBalance > 0 && (
                   <Alert variant="destructive" className="bg-yellow-500/10 border-yellow-500/20">
                     <AlertTriangle className="h-4 w-4 text-yellow-400" />
                     <AlertDescription className="text-yellow-300">
                       Staking is active, but no coins are currently staked. Your coins must reach 500+ confirmations to become mature for staking.
                     </AlertDescription>
                   </Alert>
                )}

                <div className="flex justify-between items-center p-3 md:p-4 bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-sm md:text-base">Staking Status</p>
                    <p className="text-xs md:text-sm text-gray-400">
                      {stakingStatus.isEncrypted ? 
                        (stakingStatus.walletUnlocked ? 'Wallet unlocked for staking' : 'Wallet is locked') : 
                        'Unencrypted wallet (always staking)'}
                    </p>
                    {stakingStatus.isStaking && (
                      <p className="text-xs text-green-400 mt-1">✓ Actively earning rewards</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={stakingStatus.isStaking ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"}>
                      {stakingStatus.isStaking ? <Unlock className="w-3 h-3 mr-2"/> : <Lock className="w-3 h-3 mr-2"/>}
                      {stakingStatus.isStaking ? "Active" : "Inactive"}
                    </Badge>
                    <Switch
                      checked={stakingStatus.isStaking}
                      onCheckedChange={handleToggleStaking}
                      disabled={updating || (!stakingStatus.isEncrypted && !stakingStatus.isStaking)}
                    />
                  </div>
                </div>

                {/* Unlock Dialog for Encrypted Wallets */}
                {stakingStatus.isEncrypted && (
                  <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
                    <DialogContent className="bg-gray-800 border-gray-700 text-white">
                      <DialogHeader>
                        <DialogTitle>Unlock for Staking</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <p className="text-sm text-gray-400">
                          Enter your wallet passphrase to unlock it for staking. This will allow you to earn rewards while keeping your spending capabilities secure.
                        </p>
                        <div className="space-y-2">
                          <Label htmlFor="passphrase">Wallet Passphrase</Label>
                          <Input
                            id="passphrase"
                            type="password"
                            value={passphrase}
                            onChange={(e) => setPassphrase(e.target.value)}
                            className="bg-gray-900 border-gray-600 focus:ring-purple-500 text-white"
                          />
                        </div>
                        <Button onClick={handleUnlockForStaking} disabled={updating} className="w-full">
                          {updating ? "Unlocking..." : "Unlock for Staking"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {stakingStatus.isStaking ? (
                  <div className="text-center p-3 md:p-4 bg-green-900/50 border border-green-500/20 rounded-lg">
                    <ShieldCheck className="w-6 md:w-8 h-6 md:h-8 text-green-400 mx-auto mb-2" />
                    <p className="font-semibold text-green-300 text-sm md:text-base">Your wallet is actively staking!</p>
                    <p className="text-xs text-gray-400">
                      {stakingStatus.stakedAmount > 0 ? `${stakingStatus.stakedAmount.toLocaleString()} BLC is earning rewards` : 'You are currently earning rewards'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center p-3 md:p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                    <Lock className="w-6 md:w-8 h-6 md:h-8 text-blue-400 mx-auto mb-2" />
                    <p className="font-semibold text-blue-300 text-sm md:text-base">Staking Inactive</p>
                    <p className="text-xs text-gray-400">
                      {stakingStatus.canStake ? 'Toggle the switch to start earning rewards' : 'Unlock your wallet to start staking'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 md:space-y-6">
            {/* Staking Analytics */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-400">
                  <TrendingUp className="w-5 h-5"/>
                  Staking Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-400">
                    <UserIcon className="w-4 h-4"/>
                    <span>My Staking Weight</span>
                  </div>
                  <span className="font-semibold text-white">{stakingStatus.myWeight ? stakingStatus.myWeight.toLocaleString() : 'Loading...'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Globe className="w-4 h-4"/>
                    <span>Network Staking Weight</span>
                  </div>
                  <span className="font-semibold text-white">{stakingStatus.networkWeight ? stakingStatus.networkWeight.toLocaleString() : 'Loading...'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4"/>
                    <span>Est. Time to Reward</span>
                  </div>
                  <span className="font-semibold text-white">{formatExpectedTime(stakingStatus.expectedTime)}</span>
                </div>
                
                {/* Debug Logs */}
                <div className="mt-6 p-3 bg-gray-900 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Debug Logs</h4>
                  <div className="space-y-1 text-xs text-gray-500 font-mono max-h-32 overflow-y-auto">
                    {debugLogs.length === 0 ? (
                      <p>No debug logs yet</p>
                    ) : (
                      debugLogs.map((log, index) => (
                        <div key={index}>{log}</div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Staking Rewards */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <Gift className="w-4 md:w-5 h-4 md:h-5" />
                  Recent Staking Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stakingHistory.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No staking rewards yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {stakingStatus.isStaking ? "Rewards will appear here as you earn them." : "Enable staking to start earning."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stakingHistory.map((reward, index) => (
                      <div key={reward.id || index} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                        <div>
                          <p className="font-medium text-green-400 text-sm">
                            Staking Reward
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(reward.created_date), 'MMM d, yyyy HH:mm:ss')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white text-sm md:text-base">+{Number(reward.amount).toLocaleString()} BLC</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
