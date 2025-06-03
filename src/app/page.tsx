'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AppLayout from '@/components/AppLayout';
import ProductCarousel from '@/components/ProductCarousel';
import TrendingSection from '@/components/TrendingSection';
import { useWallet } from '@/contexts/WalletContext';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { isConnected, connectWallet } = useWallet();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Grid background pattern */}
        <div className="absolute inset-0 z-0 opacity-50">
          <Image
            src="/grid-pattern.svg"
            alt="Background Grid"
            fill
            priority
            className="object-cover"
          />
        </div>
        
        {/* Glowing orbs effect */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/4 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Main content */}
        <div className="relative z-10">
          {/* Header Section - Centered */}
          <div className="mb-8 text-center">
            <div className="inline-block backdrop-blur-md bg-black/20 border border-white/10 rounded-full px-6 py-2 mb-4">
              <span className="text-xs uppercase tracking-widest text-white/70">Blockchain Security</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-['ClashGrotesk-Regular'] mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
              TraceOn Security Suite
            </h1>
          </div>
          
          {isConnected ? (
            <>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Product Carousel */}
                <div className="lg:flex-1">
                  <ProductCarousel />
                </div>
              </div>
              
              {/* Trending Section instead of Stats */}
              <TrendingSection />
              
              {/* Footer CTA */}
              <div className="mt-8 text-center">
                <div className="inline-flex items-center justify-center px-6 py-3 backdrop-blur-md bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full border border-white/20 hover:border-white/30 transition-all cursor-pointer hover:shadow-lg">
                  <span className="mr-2 text-sm font-medium">Powered by advanced AI models</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-12 text-center">
              <div className="backdrop-blur-md bg-black/30 border border-white/10 rounded-2xl p-8 max-w-md mx-auto">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-full backdrop-blur-md bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">Connect Your Wallet</h3>
                  <p className="text-sm text-white/70 mb-6">
                    Connect your Ethereum wallet to access TraceOn Security Suite features and analytics.
                  </p>
                  <button 
                    onClick={connectWallet}
                    className="w-full py-4 px-6 bg-gradient-to-r from-purple-500/80 to-blue-500/80 rounded-lg border border-white/10 hover:border-white/40 hover:shadow-lg hover:shadow-purple-500/30 active:scale-98 transform duration-200 transition-all text-base font-['ClashGrotesk-Light']"
                  >
                    Connect Wallet
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
