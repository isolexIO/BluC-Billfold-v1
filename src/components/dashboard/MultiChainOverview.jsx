
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useWallet } from "../wallet/WalletProvider";

const CHAIN_CONFIG = {
  ethereum: { 
    name: "Ethereum", 
    symbol: "ETH", 
    logo: (
      <svg width="16" height="16" viewBox="0 0 24 24" className="w-4 h-4">
        <path fill="#627EEA" d="M12 0L5.5 12.25L12 16.5L18.5 12.25L12 0Z"/>
        <path fill="#627EEA" d="M12 17.5L5.5 13.25L12 24L18.5 13.25L12 17.5Z"/>
      </svg>
    )
  },
  polygon: { 
    name: "Polygon", 
    symbol: "MATIC", 
    logo: (
      <svg width="16" height="16" viewBox="0 0 24 24" className="w-4 h-4">
        <path fill="#8247E5" d="M12 0L24 6V18L12 24L0 18V6L12 0Z"/>
        <path fill="#FFFFFF" d="M8 8V16L12 18V10L16 8V16L12 18L8 16V8Z"/>
      </svg>
    )
  },
  base: { 
    name: "Base", 
    symbol: "ETH", 
    logo: (
      <svg width="16" height="16" viewBox="0 0 24 24" className="w-4 h-4">
        <circle cx="12" cy="12" r="12" fill="#0052FF"/>
        <path fill="#FFFFFF" d="M12 4C16.4 4 20 7.6 20 12C20 16.4 16.4 20 12 20C7.6 20 4 16.4 4 12C4 7.6 7.6 4 12 4Z"/>
        <text x="12" y="16" textAnchor="middle" fontSize="8" fill="#0052FF" fontWeight="bold">B</text>
      </svg>
    )
  },
  solana: { 
    name: "Solana", 
    symbol: "SOL", 
    logo: (
      <svg width="16" height="16" viewBox="0 0 24 24" className="w-4 h-4">
        <defs>
          <linearGradient id="solanaGradientSmall" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9945FF"/>
            <stop offset="100%" stopColor="#14F195"/>
          </linearGradient>
        </defs>
        <path fill="url(#solanaGradientSmall)" d="M4 8L20 8L16 4L4 8ZM4 16L20 16L16 20L4 16ZM8 12L20 12L16 8L8 12Z"/>
      </svg>
    )
  }
};

export default function MultiChainOverview() {
  const { multiChainData, loading } = useWallet();
  const accounts = multiChainData?.accounts || [];
  const totalValue = multiChainData?.totalValue || 0;

  if (loading && accounts.length === 0) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-600 rounded w-48"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-600 rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Multi-Chain Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-4">Expand to multiple blockchains</p>
          <Link to={createPageUrl("MultiChain")}>
            <Button variant="outline" className="w-full">
              <span className="mr-2">🚀</span>
              Get Started
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Multi-Chain Portfolio
        </CardTitle>
        <Link to={createPageUrl("MultiChain")}>
          <Button variant="outline" size="sm">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-2xl font-bold text-white">
              ${totalValue.toLocaleString(undefined, {maximumFractionDigits: 2})}
            </p>
            <p className="text-sm text-gray-400">
              Total across {accounts.length} blockchain{accounts.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="space-y-2">
            {accounts.slice(0, 3).map((account) => {
              const config = CHAIN_CONFIG[account.chain];
              return (
                <div key={account.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {config.logo}
                    <span className="font-medium text-white">{config.name}</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-gray-300">
                    {account.balance.toFixed(4)} {config.symbol}
                  </Badge>
                </div>
              );
            })}
            
            {accounts.length > 3 && (
              <div className="text-center text-sm text-gray-500 pt-2">
                +{accounts.length - 3} more chains
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
