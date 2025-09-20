
import React, { useState, useEffect } from 'react';
import { MultiChainAccount } from '@/api/entities'; // Keep if MultiChainAccount type is still needed, though not directly used for fetching
import { User } from '@/api/entities';
import { getMultiChainBalances } from '@/api/functions';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KeyRound, Eye, EyeOff, Copy, Check, AlertTriangle, RefreshCw } from "lucide-react";

// Helper component for a single key entry
const KeyEntry = ({ label, value, isSecret = true, isFormatted = false }) => {
    const [revealed, setRevealed] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (value && value !== 'Loading...' && value !== 'Not available') {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Format the value for display if it's a long key
    const displayValue = isFormatted && value && value.length > 64 && !revealed ?
        `${value.slice(0, 32)}...${value.slice(-32)}` : value;

    return (
        <div className="space-y-1">
            <p className="text-sm font-medium text-gray-400">{label}</p>
            <div className="flex gap-2">
                <Input
                    type={isSecret && !revealed ? "password" : "text"}
                    value={displayValue || 'Not available'}
                    readOnly
                    className="font-mono text-xs bg-gray-900 border-gray-600 text-gray-300"
                />
                {isSecret && value && value !== 'Loading...' && value !== 'Not available' && (
                    <Button variant="outline" size="icon" onClick={() => setRevealed(!revealed)}>
                        {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                )}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    disabled={!value || value === 'Loading...' || value === 'Not available'}
                >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
            </div>
        </div>
    );
};

export default function ExportKeysCard() {
    const [accounts, setAccounts] = useState([]);
    const [mnemonic, setMnemonic] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            setError('');

            // Get user data for mnemonic
            const user = await User.me();
            console.log('ExportKeysCard: User mnemonic:', user.mnemonic_encrypted ? 'Present' : 'Missing');
            setMnemonic(user.mnemonic_encrypted || '');

            // Use the same function as MultiChain page to ensure accounts exist
            console.log('ExportKeysCard: Calling getMultiChainBalances to ensure accounts exist...');
            const { data: multiChainData, error: multiChainError } = await getMultiChainBalances();

            if (multiChainError) {
                console.error('ExportKeysCard: Error from getMultiChainBalances:', multiChainError);
                setError('Failed to load wallet data: ' + (multiChainError.message || String(multiChainError)));
                setAccounts([]); // Clear accounts on error
                return;
            }

            if (multiChainData && Array.isArray(multiChainData.accounts)) {
                console.log('ExportKeysCard: Retrieved accounts:', multiChainData.accounts.length);
                setAccounts(multiChainData.accounts);
            } else {
                console.log('ExportKeysCard: No accounts in response or unexpected data structure.');
                setAccounts([]);
            }

        } catch (error) {
            console.error("ExportKeysCard: Failed to fetch wallet secrets:", error);
            setError('Failed to load wallet data: ' + error.message);
            setAccounts([]); // Clear accounts on error
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchData();
            setLoading(false);
        };
        loadData();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    if (loading) {
        return (
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <KeyRound className="w-5 h-5 text-yellow-400" />
                        Wallet Secrets & Keys
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse h-20 bg-gray-700 rounded-lg"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-yellow-400" />
                        Wallet Secrets & Keys
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <Alert variant="destructive" className="bg-red-900/50 border-red-500/30 text-red-300">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertDescription>
                        <strong>Security Warning:</strong> Never share your Mnemonic Phrase or Private Keys with anyone. Exposing them could result in the permanent loss of your funds.
                    </AlertDescription>
                </Alert>

                {error && (
                    <Alert variant="destructive" className="bg-red-900/50 border-red-500/30 text-red-300">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {mnemonic && (
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Master Mnemonic Phrase</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            This phrase recovers all your wallets. Store it securely offline. You can import this into any compatible wallet.
                        </p>
                        <KeyEntry label="12-Word Mnemonic Phrase" value={mnemonic} />
                    </div>
                )}

                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Individual Account Private Keys</h3>
                    <p className="text-sm text-gray-400 mb-4">
                        Each private key controls one specific wallet address. You can import these individually into wallets.
                    </p>
                    <div className="space-y-4">
                        {accounts.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-400">
                                    {error ? 'Error loading accounts. Please try refreshing.' : 'Loading wallet accounts...'}
                                </p>
                                {!error && (
                                    <Button onClick={handleRefresh} className="mt-4" disabled={refreshing}>
                                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                        Load Accounts
                                    </Button>
                                )}
                            </div>
                        ) : (
                            accounts.map(account => (
                                <div key={account.id} className="p-4 bg-gray-900 rounded-lg">
                                    <div className="mb-3">
                                        <h4 className="font-medium text-white">
                                            {account.chain.charAt(0).toUpperCase() + account.chain.slice(1)} Wallet
                                        </h4>
                                        <p className="text-xs text-gray-500">Address: {account.address}</p>
                                        {account.derivation_path && account.derivation_path !== 'n/a' && (
                                            <p className="text-xs text-gray-500">Path: {account.derivation_path}</p>
                                        )}
                                    </div>
                                    <KeyEntry 
                                        label={`${account.chain.toUpperCase()} ${account.chain === 'solana' ? 'Secret Key (Array Format)' : 'Private Key (32 bytes)'}`}
                                        value={account.chain === 'solana' && account.private_key_encrypted ? 
                                            (account.private_key_encrypted.startsWith('[') ? 
                                                account.private_key_encrypted : 
                                                'Legacy format - refresh to update') : 
                                            account.private_key_encrypted
                                        } 
                                        isSecret={true} // Assuming all private keys should be secret
                                        isFormatted={false} // Changed to false to prevent truncation of the array string
                                    />
                                    {!account.private_key_encrypted && (
                                        <Alert className="mt-2 bg-yellow-500/10 border-yellow-500/20">
                                            <AlertTriangle className="h-4 w-4 text-yellow-400" />
                                            <AlertDescription className="text-yellow-300">
                                                Private key not available for this account. It may need to be regenerated.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {/* Add key verification info for Solana */}
                                    {account.chain === 'solana' && account.private_key_encrypted && (
                                        <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                                            <p className="text-xs text-blue-300">
                                                <strong>Solana Secret Key:</strong> This is stored as a JSON array of 64 bytes. 
                                                Copy this entire array and import it into Phantom or Solflare as a "Private Key" (array format).
                                                {!account.private_key_encrypted.startsWith('[') && (
                                                    <span className="text-yellow-300 block mt-1">
                                                        ⚠️ Legacy format detected. Please refresh this page to update to the correct format.
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-300 mb-2">How to use these keys:</h3>
                    <ul className="text-sm text-blue-200 space-y-1">
                        <li>• <strong>Mnemonic:</strong> Import into any BIP-39 compatible wallet (MetaMask, Trust Wallet, etc.)</li>
                        <li>• <strong>Private Keys:</strong> Import individual keys into chain-specific wallets</li>
                        <li>• <strong>Solana:</strong> Use with Phantom, Solflare, or any Solana wallet</li>
                        <li>• <strong>EVM chains:</strong> Use with MetaMask, Trust Wallet, or any Ethereum wallet</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
