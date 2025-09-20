
import React, { useState } from "react";
import { User } from "@/api/entities";
import { Wallet } from "@/api/entities";
import { importUserWallet } from "@/api/functions";
import { importWalletDat } from "@/api/functions";
import { UploadFile } from "@/api/integrations";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeyRound, ArrowLeft, AlertCircle, Info, Wallet as WalletIcon, Upload, FileText, CheckCircle } from "lucide-react";

export default function ImportWalletPage() {
    const navigate = useNavigate();
    const [privateKey, setPrivateKey] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [walletFile, setWalletFile] = useState(null);
    const [passphrase, setPassphrase] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.name.toLowerCase().includes('wallet') || file.name.toLowerCase().endsWith('.dat')) {
                setWalletFile(file);
                setError('');
            } else {
                setError('Please select a valid wallet.dat file');
                setWalletFile(null);
            }
        }
    };

    const handleImportByKey = async () => {
        if (!privateKey.trim()) {
            setError("Please enter your private key.");
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const { data, error: importError } = await importUserWallet({ privateKey });
            
            if (importError || !data.success) {
                throw new Error(importError?.message || data?.error || "Failed to import wallet. Please check your private key.");
            }

            setSuccessMessage(data.message);
            await updateWalletRecord(data.walletAddress);

            setTimeout(() => navigate(createPageUrl("Dashboard")), 3000);

        } catch (err) {
            setError(err.message);
        }

        setLoading(false);
    };

    const handleImportByAddress = async () => {
        if (!walletAddress.trim()) {
            setError("Please enter your wallet address.");
            return;
        }

        if (!walletAddress.startsWith('B')) {
            setError("BluChip addresses should start with 'B'.");
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            await updateWalletRecord(walletAddress);
            setSuccessMessage("Watch-only address set successfully! You will be redirected shortly.");
            setTimeout(() => navigate(createPageUrl("Dashboard")), 3000);
        } catch (err) {
            setError(err.message);
        }

        setLoading(false);
    };

    const handleImportWalletDat = async () => {
        if (!walletFile) {
            setError("Please select a wallet.dat file.");
            return;
        }

        setLoading(true);
        setUploading(true);
        setError('');
        setSuccessMessage('');

        try {
            // Upload the wallet file first
            const uploadResult = await UploadFile({ file: walletFile });
            if (!uploadResult || !uploadResult.file_url) {
                throw new Error('Failed to upload wallet file');
            }
            setUploading(false);
            
            // Import the wallet file using the uploaded URL
            const { data, error: importError } = await importWalletDat({ 
                walletFile: uploadResult.file_url,
                passphrase: passphrase || ''
            });
            
            if (importError || !data.success) {
                throw new Error(importError?.message || data?.error || "Failed to import wallet.dat file.");
            }

            setSuccessMessage(data.message);
            setTimeout(() => navigate(createPageUrl("Dashboard")), 3000);

        } catch (err) {
            console.error('Import error:', err);
            setError(err.message);
            setUploading(false);
        }

        setLoading(false);
    };

    const updateWalletRecord = async (address) => {
        const user = await User.me();
        let userWallets = await Wallet.filter({ user_id: user.id });

        if (userWallets.length > 0) {
            // Only update if the address is different to avoid unnecessary writes
            if (userWallets[0].wallet_address !== address) {
                await Wallet.update(userWallets[0].id, {
                    wallet_address: address,
                    private_key_hash: "imported_manually",
                });
            }
        } else {
            await Wallet.create({
                user_id: user.id,
                wallet_address: address,
                balance: 0,
                private_key_hash: "imported_manually",
                public_key: "imported_manually"
            });
        }
    };

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen flex items-center justify-center">
            <div className="max-w-md mx-auto w-full">
                <div className="flex items-center gap-4 mb-6">
                    <Link to={createPageUrl("Dashboard")}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Import Wallet</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Import Your BluChip Wallet</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Alert className="mb-6">
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Importing will associate your existing funds with this web wallet. It does not move your funds.
                          </AlertDescription>
                        </Alert>

                        <Tabs defaultValue="private-key" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="private-key">Private Key</TabsTrigger>
                                <TabsTrigger value="wallet-file">Wallet File</TabsTrigger>
                                <TabsTrigger value="address">Watch-Only</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="private-key" className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <KeyRound className="w-5 h-5 text-blue-600" />
                                    <Label className="text-base font-medium">Private Key Import</Label>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Enter a single private key to get full access to its funds. Recommended method.
                                </p>
                                <Textarea
                                    placeholder="Enter your private key..."
                                    value={privateKey}
                                    onChange={(e) => setPrivateKey(e.target.value)}
                                    className="font-mono h-24"
                                    disabled={loading}
                                />
                                <Button
                                    onClick={handleImportByKey}
                                    disabled={loading || !privateKey}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    {loading ? 'Importing...' : 'Import by Private Key'}
                                </Button>
                            </TabsContent>
                            
                            <TabsContent value="wallet-file" className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <Label className="text-base font-medium">Wallet File Import</Label>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Upload your entire `wallet.dat` file. This will import all keys from the file.
                                </p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="walletFile">Select wallet.dat file</Label>
                                        <Input
                                            id="walletFile"
                                            type="file"
                                            accept=".dat"
                                            onChange={handleFileChange}
                                            disabled={loading}
                                            className="mt-1"
                                        />
                                        {walletFile && (
                                            <p className="text-sm text-green-600 mt-1">
                                                Selected: {walletFile.name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="passphrase">Wallet Passphrase (optional)</Label>
                                        <Input
                                            id="passphrase"
                                            type="password"
                                            placeholder="Enter if wallet is encrypted"
                                            value={passphrase}
                                            onChange={(e) => setPassphrase(e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>

                                    <Button
                                        onClick={handleImportWalletDat}
                                        disabled={loading || !walletFile}
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                    >
                                        {uploading ? 'Uploading...' : loading ? 'Importing...' : 'Import wallet.dat'}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="address" className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <WalletIcon className="w-5 h-5 text-blue-600" />
                                    <Label className="text-base font-medium">Watch-Only Address</Label>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Monitor a public address. You will be able to see its balance but not send from it.
                                </p>
                                <Input
                                    placeholder="B1234567890ABCDEF..."
                                    value={walletAddress}
                                    onChange={(e) => setWalletAddress(e.target.value)}
                                    className="font-mono"
                                    disabled={loading}
                                />
                                <Button
                                    onClick={handleImportByAddress}
                                    disabled={loading || !walletAddress}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    {loading ? 'Setting...' : 'Set Watch-Only Address'}
                                </Button>
                            </TabsContent>
                        </Tabs>

                        {error && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {successMessage && (
                            <Alert variant="default" className="mt-4 bg-green-50 border-green-200 text-green-800">
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>{successMessage}</AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-yellow-800 text-sm mt-6">
                            <strong>Security Note:</strong> Your private keys and wallet files are processed on the server and are not stored after the import is complete.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
