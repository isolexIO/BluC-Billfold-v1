import { base44 } from './base44Client';


export const createWallet = base44.functions.createWallet;

export const importWallet = base44.functions.importWallet;

export const sendTransaction = base44.functions.sendTransaction;

export const getNetworkStats = base44.functions.getNetworkStats;

export const stakeCoins = base44.functions.stakeCoins;

export const unstakeCoins = base44.functions.unstakeCoins;

export const getStakingStatus = base44.functions.getStakingStatus;

export const createUserWallet = base44.functions.createUserWallet;

export const getUserWalletData = base44.functions.getUserWalletData;

export const importUserWallet = base44.functions.importUserWallet;

export const importWalletDat = base44.functions.importWalletDat;

export const lockWallet = base44.functions.lockWallet;

export const unlockWallet = base44.functions.unlockWallet;

export const getWalletStatus = base44.functions.getWalletStatus;

export const getMultiChainBalances = base44.functions.getMultiChainBalances;

export const enableStaking = base44.functions.enableStaking;

export const getQrCode = base44.functions.getQrCode;

export const sendMultiChainTransaction = base44.functions.sendMultiChainTransaction;

export const getMiningInfo = base44.functions.getMiningInfo;

export const setMining = base44.functions.setMining;

export const confirmSolSwap = base44.functions.confirmSolSwap;

export const clearTestSwaps = base44.functions.clearTestSwaps;

export const setStaking = base44.functions.setStaking;

