'use client';

import { useWallet } from '@/contexts/WalletContext';

const WalletButton = () => {
  const { isConnected, address, connectWallet, disconnectWallet, userProfile } = useWallet();

  const handleWalletAction = async () => {
    console.log("Wallet button clicked");
    try {
      if (isConnected) {
        disconnectWallet();
        console.log("Wallet disconnected");
      } else {
        await connectWallet();
        console.log("Wallet connection attempted");
      }
    } catch (error) {
      console.error("Error handling wallet action:", error);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <button
      onClick={handleWalletAction}
      aria-label={isConnected ? "Disconnect wallet" : "Connect wallet"}
      className={`
        flex items-center gap-2 px-4 py-2 
        backdrop-blur-md cursor-pointer
        rounded-full border transition-all
        hover:shadow-md hover:shadow-purple-500/20
        active:scale-95 transform duration-200
        ${isConnected 
          ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-white/20 hover:border-white/50' 
          : 'bg-gradient-to-r from-purple-500/80 to-blue-500/80 border-white/10 hover:border-white/40'
        }
      `}
    >
      {isConnected ? (
        <>
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <span className="text-sm font-medium">
            {userProfile?.name || shortenAddress(address || '')}
          </span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
          <span className="text-sm font-medium">Connect Wallet</span>
        </>
      )}
    </button>
  );
};

export default WalletButton; 