import React, { useState, useEffect } from 'react';
import { PresaleConfig } from '@/api/entities';
import { SwapRequest } from '@/api/entities';
import { confirmSolSwap } from '@/api/functions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Repeat, Copy, Check, Info, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function SwapPage() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [solTxHash, setSolTxHash] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [processing, setProcessing] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const configs = await PresaleConfig.list();
                if (configs.length > 0) {
                    setConfig(configs[0]);
                }
            } catch (e) {
                setError("Could not load swap configuration. Please try again later.");
            }
            setLoading(false);
        };
        loadConfig();
    }, []);

    const handleCopyAddress = () => {
        if (!config?.sol_deposit_address) return;
        navigator.clipboard.writeText(config.sol_deposit_address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleConfirmSwap = async () => {
        if (!solTxHash.trim()) {
            setError("Please enter your Solana transaction hash.");
            return;
        }
        setProcessing(true);
        setError('');
        setSuccess('');
        try {
            const { data, error: funcError } = await confirmSolSwap({ solTxHash });
            if (funcError) {
                // Better error handling for duplicate transactions
                if (funcError.message && funcError.message.includes("already been processed")) {
                    setError("This transaction has already been processed. Each Solana transaction can only be used once. Please send a new SOL transaction if you want to make another swap.");
                } else {
                    throw new Error(funcError.message || "An unknown error occurred.");
                }
            } else {
                setSuccess(data.message);
                setSolTxHash('');
            }
        } catch (e) {
            setError(e.message);
        }
        setProcessing(false);
    };

    if (loading) {
        return <div className="p-6 bg-gray-900 text-white min-h-screen">Loading Swap...</div>;
    }

    if (!config || !config.is_active) {
        return (
            <div className="p-6 bg-gray-900 text-white min-h-screen flex items-center justify-center">
                 <div className="max-w-xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <Link to={createPageUrl("Dashboard")}>
                            <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
                        </Link>
                        <h1 className="text-2xl font-bold text-white">Swap SOL for BluC</h1>
                    </div>
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Service Unavailable</AlertTitle>
                        <AlertDescription>
                            The SOL to BluC swap service is currently disabled. Please check back later.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }
    
    return (
        <div className="p-4 md:p-6 bg-gray-900 text-white min-h-screen">
            <div className="max-w-xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Link to={createPageUrl("Dashboard")}>
                        <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Swap SOL for BluC</h1>
                </div>

                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Repeat /> How to Swap</CardTitle>
                        <CardDescription>Follow these two steps to exchange your Solana for native BluChip coins.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Step 1 */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-sm">1</span>
                                Send SOL
                            </h3>
                            <p className="text-gray-400 text-sm">
                                Send the amount of SOL you wish to swap to the following official deposit address.
                                <br/>
                                Current rate: <span className="font-bold text-white">1 SOL = {config.exchange_rate.toLocaleString()} BLC</span>
                            </p>
                            <div className="p-3 bg-gray-900 rounded-lg">
                                <Label className="text-xs text-gray-400">Official Deposit Address</Label>
                                <div className="flex gap-2 items-center mt-1">
                                    <p className="font-mono text-sm text-purple-300 break-all">{config.sol_deposit_address}</p>
                                    <Button variant="ghost" size="icon" onClick={handleCopyAddress}>
                                        {copied ? <Check className="w-4 h-4 text-green-400"/> : <Copy className="w-4 h-4"/>}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-600 text-white text-sm">2</span>
                                Confirm Transaction
                            </h3>
                             <p className="text-gray-400 text-sm">
                                After sending, copy the transaction hash/signature from your Solana wallet and paste it below to receive your BluC.
                            </p>
                            <div className="space-y-2">
                                <Label htmlFor="sol-tx-hash">Solana Transaction Hash</Label>
                                <Input 
                                    id="sol-tx-hash"
                                    placeholder="Enter your transaction hash here"
                                    value={solTxHash}
                                    onChange={(e) => setSolTxHash(e.target.value)}
                                    disabled={processing}
                                />
                            </div>
                            <Button onClick={handleConfirmSwap} disabled={processing || !solTxHash} className="w-full">
                                {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : 'Confirm & Receive BluC'}
                            </Button>
                        </div>
                        
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        {success && (
                             <Alert variant="default" className="bg-green-900/50 border-green-500/30">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                <AlertTitle className="text-green-300">Success!</AlertTitle>
                                <AlertDescription className="text-green-300">{success}</AlertDescription>
                            </Alert>
                        )}

                        <Alert className="bg-blue-900/20 border-blue-500/30">
                            <Info className="h-4 w-4 text-blue-400" />
                            <AlertTitle className="text-blue-300">Important Notes</AlertTitle>
                            <AlertDescription className="text-blue-300 space-y-1 text-sm">
                                <p>• Each Solana transaction can only be processed once</p>
                                <p>• Make sure to send SOL to the exact address shown above</p>
                                <p>• Your BluC will be credited to your wallet after verification</p>
                                <p>• Processing typically takes 1-2 minutes</p>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}