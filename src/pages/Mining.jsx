
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Cpu, Zap, Activity, Info, RefreshCw, Lock, AlertTriangle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getMiningInfo } from "@/api/functions";
import { setMining } from "@/api/functions";
import { useWallet } from "../components/wallet/WalletProvider";
import WalletLockStatus from "../components/wallet/WalletLockStatus";

export default function MiningPage() {
  const { balance, walletStatus, refreshWalletData } = useWallet();
  const [miningInfo, setMiningInfo] = useState({ 
    isMining: false, 
    hashrate: 0, 
    threads: 0,
    walletUnlocked: false,
    networkhashps: 0,
    difficulty: 0,
    blocks: 0
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugLogs, setDebugLogs] = useState([]);

  const addDebugLog = useCallback((message) => {
    console.log(`[Mining UI] ${message}`);
    setDebugLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  const loadMiningInfo = useCallback(async () => {
    addDebugLog("Loading mining information...");
    
    try {
      const { data, error: miningError } = await getMiningInfo();
      
      if (data) {
        setMiningInfo(data);
        setError('');
        
        if (data.error) {
          setError(data.error);
          addDebugLog(`Mining service error: ${data.error}`);
        } else {
          addDebugLog(`Mining status: ${data.isMining ? 'Active' : 'Inactive'} | Hashrate: ${(data.hashrate / 1000).toFixed(2)} kH/s`);
        }
      } else if (miningError) {
        setMiningInfo(prev => ({ ...prev, isMining: false, hashrate: 0, threads: 0 }));
        setError('Mining service is currently unavailable.');
        addDebugLog(`Mining service unavailable: ${miningError}`);
      }
    } catch (err) {
      console.error('Error loading mining info:', err);
      setError('Failed to connect to mining service.');
      addDebugLog(`Failed to connect to mining service: ${err.message}`);
    }
    setLoading(false);
  }, [addDebugLog]);

  useEffect(() => {
    loadMiningInfo();
    const interval = setInterval(loadMiningInfo, 30000);
    return () => clearInterval(interval);
  }, [loadMiningInfo]);

  const handleToggleMining = async (enabled) => {
    setUpdating(true);
    setError('');
    setSuccess('');
    
    addDebugLog(`Attempting to ${enabled ? 'start' : 'stop'} mining...`);
    
    try {
      const { data, error: miningError } = await setMining({ enabled });
      
      if (miningError || (data && !data.success)) {
        const errorMsg = miningError?.message || data?.error || 'Failed to change mining status.';
        setError(errorMsg);
        addDebugLog(`Mining toggle failed: ${errorMsg}`);
      } else {
        setSuccess(data.message);
        addDebugLog(`Mining toggle successful: ${data.message}`);
        
        // Update local state immediately with the confirmed values from the setMining response
        if (data.isMining !== undefined) {
          setMiningInfo(prev => ({
            ...prev,
            isMining: data.isMining,
            hashrate: data.hashrate || 0,
            threads: data.threads || 0
          }));
        }
        
        // FIX: Removed the immediate refresh that causes the UI flicker.
        // The main 30-second interval will handle synchronization.
        // setTimeout(loadMiningInfo, 2000); 
      }
    } catch (err) {
      setError(err.message);
      addDebugLog(`Mining toggle error: ${err.message}`);
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-gray-900 text-white min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-4 w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-700 rounded"></div>
              <div className="h-64 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isWalletLocked = walletStatus.isEncrypted && walletStatus.isLocked;
  const canMine = !isWalletLocked && miningInfo.walletUnlocked;
  const nodeOffline = miningInfo.error && (miningInfo.error.includes('unavailable') || miningInfo.error.includes('timeout'));

  return (
    <div className="p-4 md:p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">CPU Mining</h1>
          </div>
          <div className="flex items-center gap-4">
            <WalletLockStatus />
            <Button onClick={loadMiningInfo} variant="outline" size="sm" disabled={updating}>
              <RefreshCw className={`w-4 h-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
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
        
        {isWalletLocked && (
          <Alert variant="destructive" className="mb-6 bg-orange-500/10 border-orange-500/20">
            <Lock className="h-4 w-4 text-orange-400" />
            <AlertDescription className="text-orange-300">
              Your wallet is locked. You must unlock it before you can start or stop mining.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mining Controls */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                Mining Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-gray-700/50 border-gray-600">
                <Info className="h-4 w-4 text-cyan-400" />
                <AlertDescription className="text-gray-300 text-sm">
                  Use your computer's CPU to mine BluChip blocks and earn rewards. Mining requires an unlocked wallet.
                </AlertDescription>
              </Alert>

              <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-white">Mining Status</p>
                  <p className="text-sm text-gray-400">
                    {nodeOffline ? 'Service Offline' : 
                     miningInfo.isMining ? 'Active - Earning rewards' : 
                     canMine ? 'Ready to mine' : 'Wallet locked'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={
                    nodeOffline ? "bg-red-500/20 text-red-300" :
                    miningInfo.isMining ? "bg-green-500/20 text-green-300" : 
                    canMine ? "bg-yellow-500/20 text-yellow-300" : "bg-gray-500/20 text-gray-300"
                  }>
                    {nodeOffline ? "Offline" : 
                     miningInfo.isMining ? "Mining" : 
                     canMine ? "Ready" : "Locked"}
                  </Badge>
                  <Switch
                    checked={miningInfo.isMining}
                    onCheckedChange={handleToggleMining}
                    disabled={updating || !canMine || nodeOffline}
                  />
                </div>
              </div>

              {/* Mining Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-gray-300">Hashrate</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {nodeOffline ? 'N/A' : `${(miningInfo.hashrate / 1000).toFixed(2)} kH/s`}
                  </p>
                </div>
                
                <div className="p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-gray-300">Threads</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {nodeOffline ? 'N/A' : (miningInfo.threads || 'Auto')}
                  </p>
                </div>
              </div>

              {/* Status Display */}
              {nodeOffline ? (
                <div className="text-center p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="font-semibold text-red-300">Mining Service Unavailable</p>
                  <p className="text-sm text-gray-400">
                    The BluChip node is currently offline. Please try again later.
                  </p>
                </div>
              ) : !miningInfo.isMining ? (
                <div className="text-center p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                  <Zap className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="font-semibold text-blue-300">Ready to Mine</p>
                  <p className="text-sm text-gray-400">
                    {canMine ? 'Toggle the switch above to start earning BluChip' : 'Unlock your wallet to start mining'}
                  </p>
                </div>
              ) : (
                <div className="text-center p-4 bg-green-900/20 border border-green-500/20 rounded-lg">
                  <Activity className="w-8 h-8 text-green-400 mx-auto mb-2 animate-pulse" />
                  <p className="font-semibold text-green-300">Mining Active!</p>
                  <p className="text-sm text-gray-400">
                    Your computer is contributing to the BluChip network
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mining Statistics & Debug */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                Network & Debug Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Current Balance</span>
                  <span className="font-bold text-white">{balance.toLocaleString()} BLC</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Network Hashrate</span>
                  <span className="font-bold text-white">
                    {nodeOffline ? 'N/A' : `${(miningInfo.networkhashps / 1e9).toFixed(2)} GH/s`}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Difficulty</span>
                  <span className="font-bold text-white">
                    {nodeOffline ? 'N/A' : (miningInfo.difficulty || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Block Height</span>
                  <span className="font-bold text-white">
                    {nodeOffline ? 'N/A' : (miningInfo.blocks || 0).toLocaleString()}
                  </span>
                </div>
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
        </div>
      </div>
    </div>
  );
}
