import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function RecentTransactions({ transactions, wallet }) {
  const getTransactionIcon = (type) => {
    return type === 'send' ? (
      <ArrowUpRight className="w-4 h-4 text-red-400" />
    ) : (
      <ArrowDownLeft className="w-4 h-4 text-green-400" />
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-300 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-300 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-300 border-gray-500/20';
    }
  };

  const getExplorerUrl = (txHash) => {
    return `http://185.196.102.139:3001/tx/${txHash}`;
  };

  const openInExplorer = (txHash) => {
    if (txHash) {
      window.open(getExplorerUrl(txHash), '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Recent Transactions</CardTitle>
        <Link to={createPageUrl("History")}>
          <Button variant="outline" size="sm">View All</Button>
        </Link>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-white mb-1">No transactions yet</h3>
            <p className="text-gray-400 text-sm">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const amount = Number(tx.amount) || 0;
              const usdValue = amount * 0.25;
              
              return (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between p-3 border border-gray-700 bg-gray-900/50 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer group"
                  onClick={() => tx.transaction_hash && openInExplorer(tx.transaction_hash)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">
                          {tx.type === 'send' ? 'Sent' : 'Received'}
                        </p>
                        <Badge variant="outline" className={`${getStatusColor(tx.status)}`}>
                          {getStatusIcon(tx.status)}
                          <span className="ml-1 capitalize text-xs">{tx.status}</span>
                        </Badge>
                        {tx.transaction_hash && (
                          <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-400">
                          {tx.type === 'send' ? `To: ${tx.to_address?.slice(0, 10)}...` : `From: ${tx.from_address?.slice(0, 10)}...`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(tx.created_date), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.type === 'send' ? 'text-red-400' : 'text-green-400'}`}>
                      {tx.type === 'send' ? '-' : '+'}{amount.toLocaleString()} BLC
                    </p>
                    <p className="text-xs text-gray-400">
                      ${usdValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}