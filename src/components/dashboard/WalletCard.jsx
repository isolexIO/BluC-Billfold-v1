
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Copy, Check, Wallet, ChevronDown, ChevronUp } from "lucide-react";

export default function WalletCard({ wallet, balance: liveBalance, balanceVisible, setBalanceVisible }) {
  const [copiedAddress, setCopiedAddress] = useState('');
  const [showAllAddresses, setShowAllAddresses] = useState(false);

  const copyAddress = async (address) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(''), 2000);
  };

  // FIX: Use the liveBalance prop passed from the Dashboard for display.
  const balance = Number(liveBalance) || 0;
  const usdValue = balance * 0.25;
  const activeAddress = wallet?.activeAddress;
  const otherAddresses = wallet?.allAddresses?.filter(addr => addr !== activeAddress) || [];

  return (
    <Card className="bg-gradient-to-br from-purple-600 via-purple-700 to-cyan-600 text-white border-none shadow-2xl">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4 md:mb-6">
          <div className="flex-1 min-w-0">
            <p className="text-purple-200 text-xs md:text-sm mb-1 md:mb-2">Total Wallet Balance</p>
            <div className="flex items-center gap-2 md:gap-3">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold truncate">
                {balanceVisible ? `${balance.toLocaleString(undefined, {maximumFractionDigits: 8})}` : '••••••'}
              </h2>
              <span className="text-lg md:text-xl text-purple-200 flex-shrink-0">BLC</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="text-white hover:bg-white/10 w-8 h-8 md:w-10 md:h-10 flex-shrink-0"
              >
                {balanceVisible ? <EyeOff className="w-3 h-3 md:w-4 md:h-4" /> : <Eye className="w-3 h-3 md:w-4 md:h-4" />}
              </Button>
            </div>
            <p className="text-purple-200 text-xs md:text-sm mt-1">
              ≈ ${balanceVisible ? usdValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '••••••'} USD
            </p>
          </div>
          
          <div className="text-center md:text-right flex-shrink-0">
            <div className="w-12 h-8 md:w-16 md:h-10 bg-white/20 rounded-lg flex items-center justify-center mb-1 md:mb-2 mx-auto md:mx-0">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b85aecf045e1f939b1fbf6/06225600f_7299877ff8ae78677197cdca21bab1df-1-154x154.png" 
                alt="$BluC Logo" 
                className="w-6 h-6 md:w-8 md:h-8 rounded-full"
              />
            </div>
            <p className="text-xs text-purple-200">$BluC</p>
          </div>
        </div>
        
        <div className="bg-white/10 rounded-lg p-3 md:p-4 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-2">
            <div className="flex-1 min-w-0 mr-2">
              <p className="text-purple-200 text-xs mb-1">Primary Address</p>
              <p className="font-mono text-xs md:text-sm truncate">
                {activeAddress || 'Loading...'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyAddress(activeAddress)}
              className="text-white hover:bg-white/10 w-8 h-8 md:w-10 md:h-10 flex-shrink-0"
              disabled={!activeAddress}
            >
              {copiedAddress === activeAddress ? <Check className="w-3 h-3 md:w-4 md:h-4" /> : <Copy className="w-3 h-3 md:w-4 md:h-4" />}
            </Button>
          </div>
          
          {otherAddresses.length > 0 && (
            <>
              <Button
                variant="ghost"
                onClick={() => setShowAllAddresses(!showAllAddresses)}
                className="w-full justify-start text-purple-200 hover:text-white px-0 mt-2 text-xs md:text-sm h-auto py-2"
              >
                {showAllAddresses ? <ChevronUp className="w-3 h-3 md:w-4 md:h-4 mr-2" /> : <ChevronDown className="w-3 h-3 md:w-4 md:h-4 mr-2" />}
                {otherAddresses.length} other address{otherAddresses.length > 1 ? 'es' : ''}
              </Button>
              {showAllAddresses && (
                <div className="mt-2 space-y-2 max-h-24 md:max-h-32 overflow-y-auto pr-2">
                  {otherAddresses.map(addr => (
                    <div key={addr} className="flex items-center justify-between text-xs">
                      <p className="font-mono truncate flex-1 mr-2">{addr}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyAddress(addr)}
                        className="text-white hover:bg-white/10 h-6 w-6 md:h-8 md:w-8 flex-shrink-0"
                      >
                        {copiedAddress === addr ? <Check className="w-2 h-2 md:w-3 md:h-3" /> : <Copy className="w-2 h-2 md:w-3 md:h-3" />}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
