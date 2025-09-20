import React from 'react';
import WalletLockStatus from "../wallet/WalletLockStatus";

export default function DashboardWalletLockStatus({ onStatusChange }) {
  return <WalletLockStatus onStatusChange={onStatusChange} />;
}