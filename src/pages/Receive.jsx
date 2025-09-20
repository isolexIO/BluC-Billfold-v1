
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, Copy, Check, QrCode } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { useWallet } from "../components/wallet/WalletProvider"; // Use the new context

export default function ReceivePage() {
  const { wallet, loading } = useWallet(); // Wallet and loading come from the global context
  const [addressCopied, setAddressCopied] = useState(false);
  const [amount, setAmount] = useState('');

  // Derive wallet data from the context's wallet object
  const walletAddress = wallet?.activeAddress || '';
  const allAddresses = wallet?.allAddresses || [];

  const copyAddress = async (address = null) => {
    const addressToCopy = address || walletAddress;
    if (addressToCopy) {
      await navigator.clipboard.writeText(addressToCopy);
      setAddressCopied(addressToCopy);
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  const generatePaymentUrl = () => {
    if (!walletAddress) return '';
    let url = `bluchip:${walletAddress}`;
    if (amount) {
      url += `?amount=${amount}`;
    }
    return url;
  };

  if (loading) { // Using loading from context
    return (
      <div className="p-6 bg-gray-900 min-h-screen">
        <div className="animate-pulse max-w-md mx-auto">
          <div className="h-8 bg-gray-700 rounded mb-4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // If not loading and no wallet is available
  if (!wallet) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Receive BluChip</h1>
          </div>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <QrCode className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-red-400 mb-4">No wallet found or loaded. Please ensure you have a wallet configured.</p>
              <Link to={createPageUrl("Dashboard")}> {/* Link to dashboard, or a dedicated create/recover wallet page */}
                <Button variant="outline">
                  Go to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
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
          <h1 className="text-2xl font-bold text-white">Receive BluChip</h1>
        </div>

        <div className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Download className="w-5 h-5 text-green-400" />
                Your Wallet Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-900 p-4 rounded-lg text-center">
                {walletAddress ? (
                  <img 
                    src={`/api/functions/getQrCode?address=${walletAddress}`}
                    alt="Wallet QR Code"
                    className="w-32 h-32 mx-auto mb-2 border-2 border-gray-600 rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="w-32 h-32 bg-gray-800 border-2 border-gray-600 rounded-lg flex items-center justify-center mx-auto mb-4" style={{display: walletAddress ? 'none' : 'flex'}}>
                  <QrCode className="w-16 h-16 text-gray-500" />
                </div>
                <p className="text-xs text-gray-400 mb-2">Scannable QR Code</p>
                <p className="text-xs text-gray-500">
                  Scan with any BluChip compatible wallet
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Primary Wallet Address</Label>
                <div className="flex gap-2">
                  <Input
                    value={walletAddress}
                    readOnly
                    className="font-mono text-sm bg-gray-900 border-gray-600 text-white"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyAddress()}
                    className="shrink-0"
                  >
                    {addressCopied === walletAddress ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Share this address to receive BluChip
                </p>
              </div>

              {/* Show other addresses if available */}
              {allAddresses.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Other Addresses in Wallet</Label>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {allAddresses.filter(addr => addr !== walletAddress).map((addr, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={addr}
                          readOnly
                          className="font-mono text-xs bg-gray-900 border-gray-600 text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyAddress(addr)}
                          className="shrink-0"
                        >
                          {addressCopied === addr ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Request Specific Amount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-gray-300">Amount (BLC) - Optional</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.000001"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-500">
                  ≈ ${(parseFloat(amount || 0) * 0.25).toFixed(2)} USD
                </p>
              </div>

              {amount && (
                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                  <p className="text-sm font-medium text-blue-300 mb-2">
                    Payment Request URL:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={generatePaymentUrl()}
                      readOnly
                      className="font-mono text-xs bg-gray-900 border-gray-600 text-gray-300"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigator.clipboard.writeText(generatePaymentUrl())}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-300 mb-2">How to receive BluChip:</h3>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• Share your wallet address with the sender</li>
                <li>• Or let them scan your QR code</li>
                <li>• Funds will appear after network confirmation</li>
                <li>• Typical confirmation time: 2-5 minutes</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
