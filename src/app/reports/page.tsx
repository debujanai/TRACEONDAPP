'use client';

import AppLayout from '@/components/AppLayout';
import GlassCard from '@/components/GlassCard';
import { useState, useEffect, useCallback } from 'react';
import { SearchHistoryItem, getUserSearchHistory, getRecentSearchHistory, clearUserSearchHistory } from '@/lib/supabase';
import { useWallet } from '@/contexts/WalletContext';

export default function ReportsPage() {
  const { userProfile } = useWallet();
  const [allSearchHistory, setAllSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isClearingHistory, setIsClearingHistory] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const loadSearchHistory = useCallback(async () => {
    if (!userProfile) return;
    
    setIsLoadingHistory(true);
    setErrorMessage('');
    try {
      console.log("Loading search history for user ID:", userProfile.id);
      const [allHistory, recentHistory] = await Promise.all([
        getUserSearchHistory(userProfile.id),
        getRecentSearchHistory(userProfile.id)
      ]);
      console.log("Search history loaded - All:", allHistory.length, "Recent:", recentHistory.length);
      setAllSearchHistory(allHistory);
      setRecentSearches(recentHistory);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error loading search history:', error);
      setErrorMessage('Failed to load search history. Please refresh the page.');
      setAllSearchHistory([]);
      setRecentSearches([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile) {
      loadSearchHistory();
    }
  }, [userProfile, loadSearchHistory]);

  const handleClearHistory = async () => {
    if (!userProfile || isClearingHistory) return;
    
    if (confirm('Are you sure you want to clear your search history? This action cannot be undone.')) {
      setIsClearingHistory(true);
      setErrorMessage('');
      try {
        const success = await clearUserSearchHistory(userProfile.id);
        if (success) {
          setAllSearchHistory([]);
          setRecentSearches([]);
        } else {
          setErrorMessage('Failed to clear history. Please try again.');
        }
      } catch (error) {
        console.error('Error clearing search history:', error);
        setErrorMessage('An error occurred while clearing history.');
      } finally {
        setIsClearingHistory(false);
      }
    }
  };

  // Calculate statistics from search history
  const getUniqueContractsCount = () => {
    const uniqueContracts = new Set(allSearchHistory.map(item => item.contract_address).filter(Boolean));
    return uniqueContracts.size;
  };

  const getSearchesByDate = () => {
    const last24Hours = allSearchHistory.filter(item => {
      const itemDate = new Date(item.created_at);
      const now = new Date();
      const diffHours = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);
      return diffHours <= 24;
    }).length;

    const lastWeek = allSearchHistory.filter(item => {
      const itemDate = new Date(item.created_at);
      const now = new Date();
      const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    }).length;

    return { last24Hours, lastWeek };
  };

  const searchStats = getSearchesByDate();

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Search History</h1>
          <p className="text-sm opacity-70">Track your smart contract security analysis history</p>
        </div>

        {errorMessage && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded mb-6">
            <p>{errorMessage}</p>
          </div>
        )}

        <GlassCard className="p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Search Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="backdrop-blur-sm bg-white/5 dark:bg-black/10 p-4 rounded-lg border border-white/10">
              <p className="text-sm opacity-70 mb-1">Total Searches</p>
              <p className="text-3xl font-bold">{allSearchHistory.length}</p>
            </div>
            <div className="backdrop-blur-sm bg-white/5 dark:bg-black/10 p-4 rounded-lg border border-white/10">
              <p className="text-sm opacity-70 mb-1">Unique Contracts</p>
              <p className="text-3xl font-bold">{getUniqueContractsCount()}</p>
            </div>
            <div className="backdrop-blur-sm bg-white/5 dark:bg-black/10 p-4 rounded-lg border border-white/10">
              <p className="text-sm opacity-70 mb-1">Last 24 Hours</p>
              <p className="text-3xl font-bold">{searchStats.last24Hours}</p>
            </div>
            <div className="backdrop-blur-sm bg-white/5 dark:bg-black/10 p-4 rounded-lg border border-white/10">
              <p className="text-sm opacity-70 mb-1">Last 7 Days</p>
              <p className="text-3xl font-bold">{searchStats.lastWeek}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Recent Searches</h2>
            <div className="flex items-center gap-4">
              {lastRefreshed && (
                <span className="text-xs text-gray-400">
                  Last updated: {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
              <button 
                onClick={loadSearchHistory}
                disabled={isLoadingHistory}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                {isLoadingHistory ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          {isLoadingHistory ? (
            <div className="text-center py-6">Loading history...</div>
          ) : recentSearches.length > 0 ? (
            <div className="space-y-4">
              {recentSearches.map((item) => (
                <div key={item.id} className="p-3 rounded-lg bg-white/5 dark:bg-black/20 border border-white/10">
                  <div className="flex justify-between">
                    <p className="font-medium">{item.search_query}</p>
                    <p className="text-xs opacity-70">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                  {item.contract_address && (
                    <p className="text-xs opacity-70 mt-1">Contract: {item.contract_address}</p>
                  )}
                </div>
              ))}
              {allSearchHistory.length > recentSearches.length && (
                <p className="text-center text-sm opacity-70 pt-2">
                  Showing {recentSearches.length} most recent searches out of {allSearchHistory.length} total
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 opacity-70">No search history found</div>
          )}
          
          {allSearchHistory.length > 0 && (
            <div className="mt-4 text-right">
              <button 
                className="text-sm text-purple-400 hover:text-purple-300"
                onClick={handleClearHistory}
                disabled={isClearingHistory}
              >
                {isClearingHistory ? 'Clearing...' : 'Clear History'}
              </button>
            </div>
          )}
        </GlassCard>
      </div>
    </AppLayout>
  );
} 