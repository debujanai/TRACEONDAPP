"use client";
import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';

const LoginModal = () => {
  const { address, updateUserProfile, isNewUser, showLoginModal, setShowLoginModal, dbConnectionError } = useWallet();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal is opened
  useEffect(() => {
    if (showLoginModal) {
      setName('');
      setIsSubmitting(false);
    }
  }, [showLoginModal]);

  if (!showLoginModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    console.log("Creating profile with name:", name);
    setIsSubmitting(true);
    await updateUserProfile(name, undefined);
    setIsSubmitting(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the backdrop, not its children
    if (e.target === e.currentTarget) {
      setShowLoginModal(false);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={handleBackdropClick}
      ></div>
      
      <div className="relative z-10 p-6 w-full max-w-md backdrop-blur-md bg-black/30 border border-white/10 rounded-2xl">
        {/* Glowing effect */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        
        <div className="text-center mb-6">
          <h3 className="text-2xl font-['ClashGrotesk-Regular'] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
            {isNewUser ? 'Complete Your Profile' : 'Welcome Back'}
          </h3>
          <p className="text-sm font-['ClashGrotesk-Light'] text-white/70 mt-2">
            {isNewUser 
              ? 'You\'re almost there! Just fill in your details to continue.' 
              : 'Sign in to access your account.'}
          </p>
        </div>
        
        <div className="text-center mb-6">
          <div className="inline-block backdrop-blur-md bg-white/5 rounded-full px-4 py-2 border border-white/10">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-['ClashGrotesk-Light'] text-white/80">
                {address ? shortenAddress(address) : 'Wallet Connected'}
              </span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {isNewUser && (
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-['ClashGrotesk-Light'] text-white/80 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent font-['ClashGrotesk-Light']"
                placeholder="Enter your name"
                required
              />
            </div>
          )}
          
          {dbConnectionError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center text-sm text-red-300 font-['ClashGrotesk-Light']">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Database connection issue detected. Your profile may not be saved.</span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-4">
            {isNewUser ? (
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-500/80 to-blue-500/80 rounded-lg border border-white/10 hover:border-white/20 transition-all text-sm font-['ClashGrotesk-Light'] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="w-full py-3 bg-gradient-to-r from-purple-500/80 to-blue-500/80 rounded-lg border border-white/10 hover:border-white/20 transition-all text-sm font-['ClashGrotesk-Light']"
              >
                Continue
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              className="w-full py-3 bg-transparent border border-white/10 hover:border-white/20 rounded-lg transition-all text-sm font-['ClashGrotesk-Light']"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal; 