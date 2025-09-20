
import React, { useState } from "react"; // Removed useEffect as context handles initial load
import { User } from "@/api/entities"; // User entity might still be needed for other context operations if not handled by WalletProvider
import { Wallet } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Send as SendIcon, AlertCircle, CheckCircle, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { sendTransaction } from "@/api/functions";
// Removed getUserWalletData as WalletProvider will handle this
import { useWallet } from "../components/wallet/WalletProvider"; // Use the new context
import WalletLockStatus from "../components/wallet/WalletLockStatus";

export default function SendPage() {
  const navigate = useNavigate();
  const { 
    wallet, 
    balance: liveBalance, 
    walletStatus, 
    refreshWalletData,
    loading: walletLoading // Added loading state from context
  } = useWallet();

  const [formData, setFormData] = useState({
    toAddress: '',
    amount: '',
    fee: 0.001
  });
  // Removed local loading state as it's handled by context
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');

  // Removed useEffect and loadWallet function as WalletProvider handles data loading

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Removed handleWalletStatusChange as WalletLockStatus will consume context directly

  const validateForm = () => {
    // WalletStatus is now from context
    if (walletStatus.isLocked && walletStatus.isEncrypted) {
      setError('Wallet is locked. Please unlock it in Settings before sending transactions.');
      return false;
    }

    if (!formData.toAddress.trim()) {
      setError('Please enter a recipient address');
      return false;
    }
    
    if (!formData.toAddress.match(/^[A-Za-z0-9]{25,35}$/)) {
      setError('Invalid BluChip address format');
      return false;
    }

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    // liveBalance is now from context
    if (amount + formData.fee > liveBalance) {
      setError(`Insufficient balance. Available: ${liveBalance} BLC, Required: ${(amount + formData.fee).toFixed(6)} BLC`);
      return false;
    }

    // wallet is now from context
    if (formData.toAddress === wallet?.wallet_address) {
      setError('Cannot send to your own address');
      return false;
    }

    return true;
  };

  const handleSend = async () => {
    if (!validateForm()) return;

    setSending(true);
    setError('');
    setSuccess(false);

    try {
      const { data, error: apiError } = await sendTransaction({
        toAddress: formData.toAddress,
        amount: parseFloat(formData.amount),
      });

      if (apiError || !data?.transactionHash) {
        throw new Error(apiError?.message || 'Failed to broadcast transaction.');
      }
      
      // Create local transaction record for history, using wallet from context
      if (wallet) {
        await Transaction.create({
          wallet_id: wallet.id,
          transaction_hash: data.transactionHash,
          from_address: wallet.wallet_address,
          to_address: formData.toAddress,
          amount: parseFloat(formData.amount),
          type: 'send',
          status: 'pending',
          fee: formData.fee,
        });
      }

      // Refresh global wallet data after sending
      await refreshWalletData();

      setTxHash(data.transactionHash);
      setSuccess(true);
      
      // Auto redirect after success
      setTimeout(() => {
        navigate(createPageUrl("Dashboard"));
      }, 4000);
      
    } catch (error) {
      setError(error.message);
    }
    setSending(false);
  };

  // Using walletLoading from context
  if (walletLoading) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen">
        <div className="animate-pulse max-w-md mx-auto">
          <div className="h-8 bg-gray-700 rounded mb-4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // If wallet is null after loading, display a message
  if (!wallet && !walletLoading) {
    return (
      <div className="p-6 max-w-md mx-auto bg-gray-900 min-h-screen flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 w-full text-center">
          <CardContent className="p-8">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Wallet Found</h2>
            <p className="text-gray-300 mb-4">
              It seems you don't have an active wallet. Please ensure your wallet is set up correctly.
            </p>
            <Button onClick={() => navigate(createPageUrl("Settings"))}>Go to Settings</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-6 max-w-md mx-auto bg-gray-900 min-h-screen">
        <Card className="text-center bg-gray-800 border-gray-700">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Transaction Sent!</h2>
            <p className="text-gray-300 mb-4">
              Your transaction has been broadcast to the network.
            </p>
            <div className="text-sm text-gray-400 break-all bg-gray-900 p-3 rounded">
              <p>Tx Hash: {txHash}</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-900 min-h-screen">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Send BluChip</h1>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <SendIcon className="w-5 h-5 text-blue-400" />
                Send Transaction
              </div>
              {/* WalletLockStatus now consumes context directly, no prop needed */}
              <WalletLockStatus />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* WalletStatus from context */}
            {walletStatus.isLocked && walletStatus.isEncrypted && (
              <Alert className="bg-orange-500/10 border-orange-500/20">
                <Lock className="h-4 w-4 text-orange-400" />
                <AlertDescription className="text-orange-300">
                  Your wallet is currently locked. Please unlock it in Settings before making transactions.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="balance" className="text-sm font-medium text-gray-300">
                Available Balance
              </Label>
              {/* liveBalance from context */}
              <div className="mt-1 text-2xl font-bold text-white">
                {liveBalance.toLocaleString(undefined, {maximumFractionDigits: 8})} BLC
              </div>
              <div className="text-sm text-gray-400">
                {/* Assuming a fixed rate for display, adjust as needed */}
                ≈ ${(liveBalance * 0.25).toFixed(2)} USD
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toAddress" className="text-gray-300">Recipient Address</Label>
              <Input
                id="toAddress"
                placeholder="Enter BluChip address..."
                value={formData.toAddress}
                onChange={(e) => handleInputChange('toAddress', e.target.value)}
                className="font-mono text-sm bg-gray-900 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-500">
                Enter a valid BluChip wallet address
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-300">Amount (BLC)</Label>
              <Input
                id="amount"
                type="number"
                step="0.000001"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>≈ ${(parseFloat(formData.amount || 0) * 0.25).toFixed(2)} USD</span>
                <button
                  type="button"
                  className="text-blue-400 hover:text-blue-300"
                  // liveBalance from context
                  onClick={() => handleInputChange('amount', (liveBalance - formData.fee).toString())}
                  disabled={liveBalance <= formData.fee}
                >
                  Max
                </button>
              </div>
            </div>

            <div className="bg-gray-900 p-4 rounded-lg">
              <div className="flex justify-between items-center text-gray-300">
                <span className="text-sm">Network Fee</span>
                <span className="font-medium">{formData.fee} BLC</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700 text-white">
                <span className="font-medium">Total</span>
                <span className="font-bold">
                  {(parseFloat(formData.amount || 0) + formData.fee).toFixed(6)} BLC
                </span>
              </div>
            </div>

            {error && (
              <Alert className="bg-red-500/10 border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleSend}
              // walletStatus from context
              disabled={sending || !formData.toAddress || !formData.amount || (walletStatus.isLocked && walletStatus.isEncrypted)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {sending ? 'Sending Transaction...' : 'Send BluChip'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
