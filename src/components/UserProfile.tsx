'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import Image from 'next/image';

const UserProfile = () => {
  const { isConnected, userProfile, address, connectWallet, disconnectWallet } = useWallet();
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // When userProfile changes, reset error state and update image URL
    if (userProfile?.profile_image) {
      console.log("UserProfile component received image URL:", userProfile.profile_image);
      setImageUrl(userProfile.profile_image);
      setImageError(false);
    } else {
      setImageUrl(null);
    }
  }, [userProfile]);

  // Function to get initials from name for the avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleImageError = () => {
    console.error("Profile image failed to load:", imageUrl);
    setImageError(true);
  };

  return (
    <div className="backdrop-blur-md bg-black/30 border border-white/10 rounded-2xl p-4">
      {isConnected ? (
        <>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{userProfile?.name || 'User'}</span>
              <span className="text-xs text-gray-400">Premium Account</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 p-0.5">
              <div className="h-full w-full rounded-full overflow-hidden flex items-center justify-center text-white font-bold">
                {imageUrl && !imageError ? (
                  <Image 
                    src={imageUrl} 
                    alt="User Avatar" 
                    className="h-full w-full object-cover"
                    width={40}
                    height={40}
                    onError={handleImageError}
                    unoptimized={true}
                  />
                ) : (
                  <span>{userProfile?.name ? getInitials(userProfile.name) : 'U'}</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-2 py-2 px-3 backdrop-blur-md bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400 mr-2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span className="text-xs font-medium">Credits</span>
            </div>
            <span className="text-sm font-bold">{userProfile?.credits || 0}</span>
          </div>
          
          <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400">
            <div className="flex justify-between items-center">
              <div>Address: <span className="text-white">{address?.slice(0, 6)}...{address?.slice(-4)}</span></div>
              <div className="flex items-center">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                <span>Active</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button 
              onClick={disconnectWallet} 
              className="w-full py-2 px-4 bg-gradient-to-r from-red-500/20 to-purple-500/20 rounded-lg border border-white/10 hover:border-white/20 transition-all text-xs font-['ClashGrotesk-Light']"
            >
              Disconnect Wallet
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center rounded-full backdrop-blur-md bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h3 className="text-md font-medium mb-1">Connect Wallet</h3>
            <p className="text-xs text-gray-400">Sign in to access your account</p>
          </div>
          
          <button
            onClick={connectWallet}
            className="w-full py-3 bg-gradient-to-r from-purple-500/80 to-blue-500/80 rounded-lg border border-white/10 hover:border-white/40 hover:shadow-md hover:shadow-purple-500/20 active:scale-95 transform duration-200 transition-all text-sm font-['ClashGrotesk-Light']"
          >
            Connect Wallet
          </button>
        </>
      )}
    </div>
  );
};

export default UserProfile; 