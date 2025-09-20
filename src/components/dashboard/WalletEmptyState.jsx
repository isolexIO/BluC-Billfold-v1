import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { KeyRound, Info } from "lucide-react";

export default function WalletEmptyState() {
  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-900">
          <Info className="w-5 h-5" />
          Is Your Balance Zero?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-yellow-800">
          If you have an existing wallet with funds, your current node might be using a new, empty wallet file. You can easily restore access to your funds by importing your wallet's private key.
        </p>
        <Link to={createPageUrl("ImportWallet")}>
          <Button variant="default" className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900">
            <KeyRound className="w-4 h-4 mr-2" />
            Import Existing Wallet
          </Button>
        </Link>
        <p className="text-xs text-yellow-700">
          Importing will allow this app to view your correct balance and send transactions.
        </p>
      </CardContent>
    </Card>
  );
}