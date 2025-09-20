
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft, // New icon import
  ChevronRight // New icon import
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, isValid } from "date-fns";
import { useWallet } from "../components/wallet/WalletProvider"; // Import useWallet context

export default function HistoryPage() {
  const { transactions, loading: walletLoading } = useWallet(); // Get data from context
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1); // New state for current page
  const TX_PER_PAGE = 10; // Number of transactions per page

  // Removed loadTransactions as data now comes from the provider

  // Moved filtering logic directly into useEffect and removed useCallback
  useEffect(() => {
    let filtered = [...transactions];

    if (searchTerm) {
      filtered = filtered.filter(tx =>
        (tx.transaction_hash && tx.transaction_hash.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.from_address && tx.from_address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.to_address && tx.to_address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to page 1 whenever filters change
  }, [transactions, searchTerm, statusFilter, typeFilter]);

  // Pagination calculations
  const pageCount = Math.ceil(filteredTransactions.length / TX_PER_PAGE);
  const displayedTransactions = filteredTransactions.slice(
    (currentPage - 1) * TX_PER_PAGE,
    currentPage * TX_PER_PAGE
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, pageCount));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };


  const getTransactionIcon = (type) => {
    return type === 'send' ? (
      <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
        <ArrowUpRight className="w-5 h-5 text-red-600" />
      </div>
    ) : (
      <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
        <ArrowDownLeft className="w-5 h-5 text-green-600" />
      </div>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getExplorerUrl = (txHash) => {
    return `http://185.196.102.139:3001/tx/${txHash}`;
  };

  const openInExplorer = (txHash, e) => {
    e.stopPropagation(); // Prevent the parent div's click event if any
    if (txHash) {
      window.open(getExplorerUrl(txHash), '_blank', 'noopener,noreferrer');
    }
  };

  if (walletLoading && transactions.length === 0) {
    return (
      <div className="p-4 md:p-6 bg-gray-900 min-h-screen">
        <div className="animate-pulse max-w-4xl mx-auto">
          <div className="h-10 bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="h-24 bg-gray-700 rounded mb-6"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Transaction History</h1>
        </div>

        <Card className="mb-6 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Filter className="w-5 h-5" />
              Filter Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by hash or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-600 text-white"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="send">Sent</SelectItem>
                  <SelectItem value="receive">Received</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              All Transactions ({filteredTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {displayedTransactions.length === 0 ? ( // Check displayedTransactions for empty state
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="font-semibold text-gray-200 mb-1">No transactions found</h3>
                <p className="text-sm">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Your transaction history will appear here'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedTransactions.map((tx) => ( // Map over displayedTransactions
                  <div key={tx.id || tx.transaction_hash} className="p-4 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-700/50 transition-colors group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {getTransactionIcon(tx.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">
                              {tx.type === 'send' ? 'Sent BluChip' : 'Received BluChip'}
                            </h3>
                            <Badge variant="outline" className={`border ${getStatusColor(tx.status)}`}>
                              {getStatusIcon(tx.status)}
                              <span className="ml-1 capitalize">{tx.status}</span>
                            </Badge>
                          </div>

                          <div className="space-y-1 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Hash:</span>
                              <span className="font-mono text-xs">
                                {tx.transaction_hash ? `${tx.transaction_hash.slice(0, 20)}...` : 'N/A'}
                              </span>
                              {tx.transaction_hash && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => openInExplorer(tx.transaction_hash, e)}
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="View on explorer"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                            <p>
                              <span className="font-medium">
                                {tx.type === 'send' ? 'To:' : 'From:'}
                              </span>{' '}
                              <span className="font-mono text-xs">
                                {tx.type === 'send'
                                  ? `${(tx.to_address || '').slice(0, 15)}...`
                                  : `${(tx.from_address || '').slice(0, 15)}...`
                                }
                              </span>
                            </p>
                            {tx.created_date && isValid(new Date(tx.created_date)) && (
                              <p className="text-xs text-gray-500">
                                {format(new Date(tx.created_date), 'MMM d, yyyy HH:mm:ss')}
                                {tx.confirmations > 0 && (
                                  <span className="ml-2">• {tx.confirmations} confirmations</span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-lg font-bold ${tx.type === 'send' ? 'text-red-500' : 'text-green-400'}`}>
                          {tx.type === 'send' ? '-' : '+'}{tx.amount} BLC
                        </p>
                        <p className="text-sm text-gray-500">
                          ${(tx.amount * 0.25).toFixed(2)} USD
                        </p>
                        {tx.fee > 0 && (
                          <p className="text-xs text-gray-400">
                            Fee: {tx.fee} BLC
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {pageCount > 1 && ( // Show pagination controls only if more than one page
            <div className="flex items-center justify-center gap-4 p-4 border-t border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <span className="text-sm text-gray-400">
                Page {currentPage} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === pageCount}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
