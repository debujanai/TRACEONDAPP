'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Interface for our crypto data
interface CryptoData {
  last_updated: string;
  coins: {
    [key: string]: {
      analysis: {
        sentiment: string;
        score: number;
        summary: string;
      };
      price_usd: string;
      price_change_1h: string;
    };
  };
}

const MarketSentiment = () => {
  const [expandedCoin, setExpandedCoin] = useState<string | null>(null);
  const [cryptoData, setCryptoData] = useState<CryptoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSentimentData = async () => {
      try {
        setLoading(true);
        // Fetch the most recent sentiment report from Supabase
        const { data, error } = await supabase
          .from('sentiment_reports')
          .select('report, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          throw error;
        }

        if (data && data.report) {
          // Parse the JSON report data
          setCryptoData({
            last_updated: data.created_at,
            coins: data.report.coins || {}
          });
        }
      } catch (err) {
        console.error('Error fetching sentiment data:', err);
        setError('Failed to load sentiment data');
      } finally {
        setLoading(false);
      }
    };

    fetchSentimentData();
    
    // Set up a polling interval to refresh data every 5 minutes
    const intervalId = setInterval(fetchSentimentData, 5 * 60 * 1000);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  const handleCoinClick = (symbol: string) => {
    if (expandedCoin === symbol) {
      setExpandedCoin(null);
    } else {
      setExpandedCoin(symbol);
    }
  };

  // Get all coins data if available
  const coinsEntries = cryptoData?.coins ? Object.entries(cryptoData.coins) : [];

  if (loading) {
    return (
      <div className="backdrop-blur-md bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col h-full items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-white/80 rounded-full border-t-transparent mb-3"></div>
        <p className="text-sm opacity-70">Loading sentiment data...</p>
      </div>
    );
  }

  if (error || !cryptoData) {
    return (
      <div className="backdrop-blur-md bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col">
        <div className="mb-3">
          <h3 className="text-lg font-semibold mb-1">Market Sentiment</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-400 text-sm">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col">
      <div className="mb-3">
        <h3 className="text-lg font-semibold mb-1">Market Sentiment</h3>
        <div className="flex items-center">
          <p className="text-xs opacity-70">Last updated: {new Date(cryptoData.last_updated).toLocaleTimeString()}</p>
          <div className="ml-auto flex items-center">
            <span className="animate-pulse inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
            <span className="text-xs text-green-400">Live</span>
          </div>
        </div>
      </div>
      
      {/* Scrollable coin list container */}
      <div className="flex-1 overflow-y-auto max-h-[50vh] custom-scrollbar pr-1 space-y-2 mb-2">
        {coinsEntries.length > 0 ? (
          coinsEntries.map(([symbol, data]) => (
            <div 
              key={symbol} 
              className="backdrop-blur-md bg-black/50 rounded-xl border border-white/10 hover:border-white/20 transition-all overflow-hidden cursor-pointer"
              onClick={() => handleCoinClick(symbol)}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-bold">{symbol}</div>
                  <div className="flex items-center">
                    <div className={`text-xs px-2 py-0.5 rounded-full ${
                      parseFloat(data.price_change_1h) > 0 
                        ? 'bg-green-500/20 text-green-400' 
                        : parseFloat(data.price_change_1h) < 0 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {parseFloat(data.price_change_1h) > 0 ? '+' : ''}{data.price_change_1h}%
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs opacity-80 mb-2">
                  <div>${parseFloat(data.price_usd).toLocaleString(undefined, { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 8
                  })}</div>
                  <div className="capitalize text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                    {data.analysis.sentiment}
                  </div>
                </div>
                
                <div>
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-purple-500 h-1.5 rounded-full" 
                    style={{ width: `${data.analysis.score}%` }}
                  ></div>
                </div>
                <div className="flex justify-end">
                  <span className="text-xs opacity-70 pt-1.5">{data.analysis.score}% positive</span>
                </div>
              </div>
              
              {/* Expandable sentiment summary */}
              <div className={`px-3 pb-3 transition-all overflow-hidden ${
                expandedCoin === symbol 
                  ? 'max-h-40 opacity-100' 
                  : 'max-h-0 opacity-0'
              }`}>
                <div className="text-xs opacity-70 mt-1 border-t border-white/10 pt-2">
                  {data.analysis.summary}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-sm opacity-70">
            No coin data available
          </div>
        )}
      </div>
      
      {/* Bottom indicator to show scrolling is possible */}
      {coinsEntries.length > 0 && (
        <div className="text-center text-xs text-white/60 mb-2">
          <span>Scroll to see all coins</span>
          <div className="mt-1 animate-bounce inline-block">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M18 13l-6 6-6-6"/>
            </svg>
          </div>
        </div>
      )}
      
      <div className="pt-4 border-t border-white/10">
        <button className="w-full py-2 px-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-white/10 hover:border-white/20 transition-all text-sm font-['ClashGrotesk-Light']">
          View Full Analysis
        </button>
      </div>
    </div>
  );
};

export default MarketSentiment; 