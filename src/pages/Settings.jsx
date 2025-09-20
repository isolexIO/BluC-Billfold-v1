import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { Wallet } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Settings as SettingsIcon, 
  Shield, 
  Eye, 
  Bell,
  User as UserIcon,
  Smartphone,
  Copy,
  Check,
  KeyRound
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getUserWalletData } from "@/api/functions";
import WalletLockStatus from "../components/wallet/WalletLockStatus";
import ExportKeysCard from "../components/settings/ExportKeysCard";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [liveBalance, setLiveBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addressCopied, setAddressCopied] = useState(false);
  const [walletStatus, setWalletStatus] = useState({ isLocked: false, isEncrypted: false });
  const [settings, setSettings] = useState({
    notifications: true,
    biometric: false,
    autoLock: true,
    showBalance: true
  });

  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      const userWallet = await Wallet.filter({ user_id: userData.id });
      if (userWallet.length > 0) {
        setWallet(userWallet[0]);
      }

      // Fetch live data
      const { data: realData, error: dataError } = await getUserWalletData();
      if (!dataError) {
        setLiveBalance(realData.balance || 0);
        if (userWallet.length > 0 && realData.activeAddress && userWallet[0].wallet_address !== realData.activeAddress) {
            await Wallet.update(userWallet[0].id, { wallet_address: realData.activeAddress });
            setWallet(prev => ({...prev, wallet_address: realData.activeAddress}));
        }
      }

      if (userData.wallet_settings) {
        setSettings(prevSettings => ({ ...prevSettings, ...userData.wallet_settings }));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const updateSettings = async (newSettings) => {
    setSettings(newSettings);
    try {
      await User.updateMyUserData({
        wallet_settings: newSettings
      });
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const copyAddress = async () => {
    if (wallet?.wallet_address) {
      await navigator.clipboard.writeText(wallet.wallet_address);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  const handleWalletStatusChange = (status) => {
    setWalletStatus(status);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-900 text-white min-h-screen">
        <div className="animate-pulse max-w-2xl mx-auto">
          <div className="h-8 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <UserIcon className="w-5 h-5 text-blue-400" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{user?.full_name}</h3>
                  <p className="text-gray-400">{user?.email}</p>
                  <Badge variant="outline" className="mt-1 border-gray-600 text-gray-300">
                    {user?.role === 'admin' ? 'Administrator' : 'User'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Information */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="w-5 h-5 text-green-400" />
                Wallet Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Active Wallet Address</Label>
                <div className="flex gap-2">
                  <Input
                    value={wallet?.wallet_address || ''}
                    readOnly
                    className="font-mono text-sm bg-gray-900 border-gray-600 text-white"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyAddress}
                  >
                    {addressCopied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-300">Live Balance</Label>
                  <p className="font-semibold text-white">{liveBalance} BLC</p>
                </div>
                <div>
                  <Label className="text-gray-300">USD Value</Label>
                  <p className="font-semibold text-white">${(liveBalance * 0.25).toFixed(2)}</p>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium text-white">Wallet Security</Label>
                  <p className="text-sm text-gray-400">Lock/unlock wallet for transactions</p>
                </div>
                <WalletLockStatus onStatusChange={handleWalletStatusChange} />
              </div>

              <Separator className="bg-gray-700"/>

              <Link to={createPageUrl("ImportWallet")}>
                <Button variant="outline" className="w-full">
                  <KeyRound className="w-4 h-4 mr-2" />
                  Import or Restore Wallet
                </Button>
              </Link>

            </CardContent>
          </Card>
          
          <ExportKeysCard />

          {/* Privacy & Security */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Eye className="w-5 h-5 text-purple-400" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium text-white">Show Balance on Dashboard</Label>
                  <p className="text-sm text-gray-400">Toggle balance visibility</p>
                </div>
                <Switch
                  checked={settings.showBalance}
                  onCheckedChange={(checked) => 
                    updateSettings({ ...settings, showBalance: checked })
                  }
                />
              </div>
              
              <Separator className="bg-gray-700"/>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium text-white">Auto Lock</Label>
                  <p className="text-sm text-gray-400">Lock wallet after inactivity</p>
                </div>
                <Switch
                  checked={settings.autoLock}
                  onCheckedChange={(checked) => 
                    updateSettings({ ...settings, autoLock: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Bell className="w-5 h-5 text-orange-400" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium text-white">Push Notifications</Label>
                  <p className="text-sm text-gray-400">Receive alerts for transactions</p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => 
                    updateSettings({ ...settings, notifications: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}