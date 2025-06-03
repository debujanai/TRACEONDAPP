'use client';

import { useState, useEffect } from 'react';
import { getTrendingSearches, getTopProfiles, UserProfile } from '@/lib/supabase';
import Image from 'next/image';

const TrendingSection = () => {
  const [trendingContracts, setTrendingContracts] = useState<{address: string, count: number}[]>([]);
  const [topProfiles, setTopProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching real trending data from database...');
        
        // Get trending contract addresses and top profiles from database
        const [contractAddresses, profiles] = await Promise.all([
          getTrendingSearches(6),
          getTopProfiles(4) // Fetch up to 4 profiles
        ]);
        
        console.log('Fetched contract addresses:', contractAddresses);
        console.log('Fetched profiles:', profiles);
        
        // Use the contract addresses with their actual counts directly
        setTrendingContracts(contractAddresses);
        setTopProfiles(profiles);
      } catch (err) {
        console.error('Error fetching trending data:', err);
        
        // On error, just set empty arrays - no more fallbacks
        setTrendingContracts([]);
        setTopProfiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Copy address to clipboard
  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Function to shorten wallet addresses
  const shortenAddress = (address: string) => {
    if (!address) return '';
    if (address.includes('...')) return address; // Already shortened
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex flex-col">
      <div className="mt-8 flex flex-col lg:flex-row gap-6">
        {/* Trending Contract Addresses */}
        <div className="flex-1 backdrop-blur-md bg-black/20 border border-white/10 rounded-2xl p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-1">Trending Contracts</h3>
            <p className="text-sm opacity-70">Most analyzed smart contracts</p>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 bg-white/5 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {trendingContracts.length > 0 ? (
                trendingContracts.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 backdrop-blur-md bg-white/5 rounded-lg border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all cursor-pointer flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-medium">
                        #{idx+1}
                      </div>
                      <div>
                        <div className="text-sm font-mono">{shortenAddress(item.address)}</div>
                        <div className="text-xs text-green-400">{item.count} audits</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => copyToClipboard(item.address)}
                      className="text-white/60 hover:text-white/90 transition-colors"
                      aria-label="Copy address"
                    >
                      {copiedAddress === item.address ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 opacity-70">No trending contracts found</div>
              )}
            </div>
          )}
        </div>
        
        {/* Top Profiles - Grid Style */}
        <div className="flex-1 backdrop-blur-md bg-black/20 border border-white/10 rounded-2xl p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-1">Top Profiles</h3>
            <p className="text-sm opacity-70">Most active community members</p>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 bg-white/5 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {topProfiles.length > 0 ? (
                topProfiles.map((profile, idx) => (
                  <div 
                    key={idx}
                    className="backdrop-blur-md bg-white/5 rounded-lg border border-white/10 hover:border-blue-500/30 hover:bg-white/10 transition-all cursor-pointer p-4"
                  >
                    <div className="flex flex-col items-center">
                      {/* Avatar */}
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center overflow-hidden border border-white/20 mb-2">
                        {profile.profile_image ? (
                          <Image 
                            src={profile.profile_image} 
                            alt={profile.name} 
                            className="w-full h-full object-cover"
                            width={80}
                            height={80}
                            unoptimized={true}
                            onError={() => {
                              console.error('Error loading profile image:', profile.profile_image);
                              // Remove the image from the DOM by forcing a re-render
                              const element = document.getElementById(`profile-image-${idx}`);
                              if (element) {
                                element.remove();
                              }
                            }}
                            id={`profile-image-${idx}`}
                          />
                        ) : (
                          <span className="text-2xl font-bold">
                            {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                          </span>
                        )}
                      </div>
                      
                      {/* Name & Credits */}
                      <div className="text-center mt-1 mb-2">
                        <div className="font-medium text-base">{profile.name || 'Anonymous User'}</div>
                        <div className="flex items-center justify-center gap-1 opacity-70 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polygon points="10 8 16 12 10 16 10 8"></polygon>
                          </svg>
                          <span>{profile.credits || 0}</span>
                        </div>
                      </div>
                      
                      {/* Wallet Address */}
                      <div className="flex items-center mt-1 bg-black/20 rounded-full py-1 px-3">
                        <div className="text-xs font-mono opacity-70">{shortenAddress(profile.wallet_address)}</div>
                        <button
                          onClick={() => copyToClipboard(profile.wallet_address)}
                          className="ml-2 text-white/60 hover:text-white transition-colors"
                          aria-label="Copy address"
                        >
                          {copiedAddress === profile.wallet_address ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                              <path d="M5 13l4 4L19 7"></path>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center p-4 opacity-70">No profiles found</div>
              )}
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default TrendingSection; 