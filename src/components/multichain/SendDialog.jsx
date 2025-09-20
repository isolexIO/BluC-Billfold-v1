
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Send, AlertCircle } from "lucide-react";
import { sendMultiChainTransaction } from "@/api/functions";

const CHAIN_SYMBOLS = {
  ethereum: "ETH",
  polygon: "MATIC", 
  base: "ETH",
  solana: "SOL"
};

// Helper function to get the correct BluChip token symbol for each chain
const getBluChipSymbol = (chain) => {
  switch (chain) {
    case 'polygon': return 'pBluC';
    case 'ethereum': return 'BluC';
    case 'base': return 'BluC';
    case 'solana': return 'BluC';
    default: return 'BluC';
  }
};

export default function SendDialog({ account, open, onClose }) {
  const [selectedAsset, setSelectedAsset] = useState("native");
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState("");

  const nativeSymbol = account ? CHAIN_SYMBOLS[account.chain] : "";

  useEffect(() => {
    if (open) {
      setSelectedAsset("native");
      setToAddress("");
      setAmount("");
      setError("");
      setSuccess(false);
      setSending(false);
      setTxHash("");
    }
  }, [open]);

  const assets = [];
  if (account) {
    assets.push({ value: "native", label: nativeSymbol, balance: account.balance || 0 });
    if (account.blc_balance !== undefined && account.blc_balance > 0) {
      assets.push({ value: "blc", label: getBluChipSymbol(account.chain), balance: account.blc_balance || 0 });
    }
  }

  const selectedAssetData = assets.find(a => a.value === selectedAsset);

  const handleSend = async () => {
    setError("");
    if (!toAddress.trim()) {
      setError("Recipient address is required.");
      return;
    }
    const sendAmount = parseFloat(amount);
    if (!sendAmount || sendAmount <= 0) {
      setError("A valid amount is required.");
      return;
    }
    if (selectedAssetData && sendAmount > selectedAssetData.balance) {
      setError("Insufficient balance.");
      return;
    }

    setSending(true);
    
    try {
      console.log('SendDialog: Preparing transaction with account data:', {
        chain: account.chain,
        address: account.address, // Still relevant for logging context
        user_id: account.user_id, // Still relevant for logging context
        toAddress: toAddress,
        amount: sendAmount,
        asset: selectedAsset
      });

      // MODIFIED: No longer sending accountId, just the essential info for multi-chain transaction
      const response = await sendMultiChainTransaction({
        chain: account.chain,
        toAddress: toAddress,
        amount: sendAmount,
        asset: selectedAsset
      });

      console.log('SendDialog: Transaction response:', response);

      if (response.error) {
        console.error('SendDialog: Transaction error from server:', response.error);
        setError(response.error.message || response.error || "Transaction failed");
        return;
      }

      if (response.data && response.data.transactionHash) {
        setTxHash(response.data.transactionHash);
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 5000);
      } else {
        console.error('SendDialog: No transaction hash in response:', response);
        setError("Transaction completed but no hash received");
      }
    } catch (err) {
      console.error('SendDialog: Send error:', err);
      setError(err.message || "Failed to send transaction");
    } finally {
      setSending(false);
    }
  };

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        {!success ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-400" />
                Send from {account.label || account.chain}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="asset">Asset to Send</Label>
                <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {assets.map(asset => (
                      <SelectItem key={asset.value} value={asset.value} className="focus:bg-gray-700">
                        {asset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAssetData && (
                  <p className="text-xs text-gray-400">
                    Available Balance: {selectedAssetData.balance.toLocaleString()} {selectedAssetData.label}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="to-address">Recipient Address</Label>
                <Input
                  id="to-address"
                  placeholder={`Enter ${account.chain} address...`}
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={sending}>Cancel</Button>
              <Button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700" disabled={sending}>
                {sending ? 'Sending...' : 'Send'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Transaction Sent!</h2>
            <p className="text-gray-300 mb-4">
              {amount} {selectedAssetData ? selectedAssetData.label : ''} was sent to {toAddress.slice(0, 6)}...{toAddress.slice(-4)}.
            </p>
            {txHash && (
              <div className="text-xs text-gray-400 break-all bg-gray-900 p-3 rounded mt-4">
                <p>Transaction Hash: {txHash}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
