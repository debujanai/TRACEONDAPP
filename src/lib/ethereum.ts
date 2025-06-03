'use client';

/**
 * Checks if MetaMask or a compatible Ethereum wallet is installed
 */
export const isWalletInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for Ethereum provider
  return !!window.ethereum;
};

/**
 * Checks if the user should be prompted to install MetaMask
 */
export const shouldPromptForWalletInstall = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Not on a mobile device and no wallet detected
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  return !isMobile && !isWalletInstalled();
};

/**
 * Get the wallet installation link based on the user's device
 */
export const getWalletInstallLink = (): string => {
  if (typeof window === 'undefined') return 'https://metamask.io/download/';
  
  // Check if on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  if (isMobile) {
    // Mobile deep link
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isAndroid) {
      return 'https://metamask.app.link/dapp/your-website.com';
    } else if (isIOS) {
      return 'https://metamask.app.link/dapp/your-website.com';
    }
  }
  
  // Default to desktop download
  return 'https://metamask.io/download/';
}; 