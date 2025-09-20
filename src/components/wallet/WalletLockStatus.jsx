
import React, { useState } from 'react';
import { useWallet } from './WalletProvider'; // Use the new context
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Unlock, Shield, Clock, AlertCircle } from 'lucide-react';
import { lockWallet } from "@/api/functions";
import { unlockWallet } from "@/api/functions";

export default function WalletLockStatus() {
  const { walletStatus, refreshWalletData } = useWallet();
  const [passphrase, setPassphrase] = useState('');
  const [timeout, setTimeout] = useState('60');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  const timeRemaining = walletStatus?.timeRemaining;

  const handleLockWallet = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: lockError } = await lockWallet();
      if (lockError || !data.success) {
        throw new Error(lockError?.message || data?.error || 'Failed to lock wallet');
      }
      await refreshWalletData(); // Refresh global state
      setShowDialog(false);
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleUnlockWallet = async () => {
    if (!passphrase.trim()) {
      setError('Please enter your wallet passphrase');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data, error: unlockError } = await unlockWallet({
        passphrase,
        timeout: parseInt(timeout)
      });
      
      if (unlockError || !data.success) {
        throw new Error(unlockError?.message || data?.error || 'Failed to unlock wallet');
      }
      
      setPassphrase('');
      await refreshWalletData(); // Refresh global state
      setShowDialog(false);
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  if (walletStatus?.fallback) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-500">
        Status Unknown
      </Badge>
    );
  }
  
  if (!walletStatus?.isEncrypted) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
          <Shield className="w-3 h-3 mr-1" />
          Unencrypted
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className={walletStatus.isLocked 
          ? "bg-red-50 text-red-700 border-red-200" 
          : "bg-green-50 text-green-700 border-green-200"
        }
      >
        {walletStatus.isLocked ? (
          <>
            <Lock className="w-3 h-3 mr-1" />
            Locked
          </>
        ) : (
          <>
            <Unlock className="w-3 h-3 mr-1" />
            Unlocked
            {timeRemaining > 0 && (
              <span className="ml-1">({Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')})</span>
            )}
          </>
        )}
      </Badge>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            {walletStatus.isLocked ? (
              <>
                <Unlock className="w-4 h-4 mr-2" />
                Unlock
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Lock
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {walletStatus.isLocked ? 'Unlock Wallet' : 'Lock Wallet'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {walletStatus.isLocked ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="passphrase">Wallet Passphrase</Label>
                  <Input
                    id="passphrase"
                    type="password"
                    placeholder="Enter your wallet passphrase"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Unlock Duration (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    placeholder="60"
                    value={timeout}
                    onChange={(e) => setTimeout(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">
                    Wallet will automatically lock after this time
                  </p>
                </div>
              </>
            ) : (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Locking your wallet will prevent all transactions until you unlock it again with your passphrase.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={walletStatus.isLocked ? handleUnlockWallet : handleLockWallet}
                disabled={loading || (walletStatus.isLocked && !passphrase.trim())}
              >
                {loading ? 'Processing...' : walletStatus.isLocked ? 'Unlock Wallet' : 'Lock Wallet'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
