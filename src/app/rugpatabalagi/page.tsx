'use client';

import { useState, ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useWallet } from '@/contexts/WalletContext';
import { addSearchToHistory } from '@/lib/supabase';
import LiquidityInfo from '@/components/LiquidityInfo';
import TopTradersInfo from '@/components/TopTradersInfo';
import TokenStatsInfo from '@/components/TokenStatsInfo';
import GoPlusSecurityInfo from '@/components/GoPlusSecurityInfo';
import SolanaSecurityInfo from '@/components/SolanaSecurityInfo';
import Image from 'next/image';

type TabType = 'overview' | 'risk' | 'holders' | 'liquidity' | 'past_rugs';

interface TabProps {
  name: TabType;
  label: string;
  icon: ReactNode;
}

const tabs: TabProps[] = [
  {
    name: 'overview',
    label: 'Overview',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9"></rect>
        <rect x="14" y="3" width="7" height="5"></rect>
        <rect x="14" y="12" width="7" height="9"></rect>
        <rect x="3" y="16" width="7" height="5"></rect>
      </svg>
    )
  },
  {
    name: 'risk',
    label: 'Risk Analysis',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    )
  },
  {
    name: 'holders',
    label: 'Wallets Involved',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    )
  },
  {
    name: 'liquidity',
    label: 'Liquidity',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
      </svg>
    )
  },
  {
    name: 'past_rugs',
    label: 'Past Rugs',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"></polyline>
        <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
        <polyline points="7 23 3 19 7 15"></polyline>
        <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
      </svg>
    )
  }
];

interface GoPlusData {
  token_name: string;
  token_symbol: string;
  creator_address: string;
  owner_address: string;
  total_supply: number;
  holder_count: number;
  is_open_source: number;
  is_proxy: number;
  is_mintable: number;
  is_blacklisted: number;
  is_whitelisted: number;
  is_in_dex: number;
  is_honeypot: number;
  buy_tax: number;
  sell_tax: number;
  creator_balance: number;
  creator_percent: number;
  owner_balance: number;
  owner_percent: number;
  lp_holder_count: number;
  top_10_holder_rate: number;
  lockInfo: {
    isLock: boolean;
    lockPercent: number;
    leftLockPercent: number;
  };
}

interface TokenData {
  security_info?: {
    code: number;
    msg: string;
    data: {
      goplus: GoPlusData;
    };
  };
  goplus_security?: {
    data: {
      result: {
        [key: string]: Record<string, unknown>;
      }
    }
  };
  launch_security?: {
    code: number;
    msg: string;
    data: {
      code: number;
      reason: string;
      message: string;
      data: {
        address: string;
        security: {
          address: string;
          is_show_alert: boolean;
          top_10_holder_rate: string;
          burn_ratio: string;
          burn_status: string;
          dev_token_burn_amount: string;
          dev_token_burn_ratio: string;
          is_open_source: boolean;
          open_source: number;
          is_blacklist: boolean;
          blacklist: number;
          is_honeypot: boolean;
          honeypot: number;
          is_renounced: boolean;
          renounced: number;
          can_sell: number;
          can_not_sell: number;
          buy_tax: string;
          sell_tax: string;
          average_tax: string;
          high_tax: string;
          flags: string[];
          lockInfo: Array<{
            NFT_list: null | Record<string, unknown>;
            address: string;
            balance: string;
            is_contract?: number;
            is_locked?: number;
            locked_detail?: Array<{
              amount: string;
              end_time: string;
              opt_time: string;
            }>;
            percent: string;
            tag?: string;
          }>;
          lock_summary: {
            is_locked: boolean;
            lock_detail: Array<{
              percent: string;
              pool: string;
              is_blackhole: boolean;
              end_time: number;
            }>;
            lock_tags: string[];
            lock_percent: string;
            left_lock_percent: string;
          };
          hide_risk: boolean;
        };
        launchpad: null | Record<string, unknown>;
      };
    };
  };
  rug_analysis?: {
    code: number;
    msg: string;
    data: {
      code: number;
      reason: string;
      message: string;
      data: {
        address: string;
        link: {
          address: string;
          gmgn: string;
          geckoterminal: string;
          twitter_username: string;
          website: string;
          telegram: string;
          bitbucket: string;
          discord: string;
          description: string;
          facebook: string;
          github: string;
          instagram: string;
          linkedin: string;
          medium: string;
          reddit: string;
          tiktok: string;
          youtube: string;
          verify_status: number;
        };
        rug: null | {
          // Add specific rug fields
          rug_ratio: string | number;
          holder_rugged_num: number;
          holder_token_num: number;
          rugged_tokens?: Array<{
            name: string;
            symbol: string;
            address: string;
            logo?: string;
          }>;
          // Add a catch-all for any additional properties
          [key: string]: unknown;
        };
        vote: {
          like: number;
          unlike: number;
        };
      };
    };
  };
  top_traders?: {
    code: number;
    msg: string;
    data: {
      code: number;
      msg: string;
      data: Array<{
        address: string;
        account_address: string;
        addr_type: number;
        amount_cur: number;
        usd_value: number;
        cost_cur: number;
        sell_amount_cur: number;
        sell_amount_percentage: number;
        sell_volume_cur: number;
        buy_volume_cur: number;
        buy_amount_cur: number;
        netflow_usd: number;
        netflow_amount: number;
        buy_tx_count_cur: number;
        sell_tx_count_cur: number;
        wallet_tag_v2: string;
        eth_balance: string;
        sol_balance: string;
        trx_balance: string;
        balance: string;
        profit: number;
        realized_profit: number;
        profit_change: number;
        amount_percentage: number;
        unrealized_profit: number;
        unrealized_pnl: unknown;
        avg_cost: number;
        avg_sold: number;
        tags: string[];
        maker_token_tags: string[];
        name: string | null;
        avatar: string | null;
        twitter_username: string | null;
        twitter_name: string | null;
        tag_rank: Record<string, unknown>;
        last_active_timestamp: number;
        created_at: number;
        accu_amount: number;
        accu_cost: number;
        cost: number;
        total_cost: number;
        transfer_in: boolean;
        is_new: boolean;
        native_transfer: {
          name: string | null;
          from_address: string | null;
          timestamp: number;
        };
        is_suspicious: boolean;
        start_holding_at: number | null;
        end_holding_at: number | null;
      }>;
    };
  };
  token_stats?: {
    code: number;
    msg: string;
    data: {
      code: number;
      reason: string;
      message: string;
      data: {
        holder_count: number;
        bluechip_owner_count: number;
        bluechip_owner_percentage: string;
        signal_count: number;
        degen_call_count: number;
        top_rat_trader_percentage: string;
        top_bundler_trader_percentage: string;
        top_entrapment_trader_percentage: string;
      };
    };
  };
  token_data?: {
    data: {
      id: string;
      type: string;
      attributes: {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        image_url: string | null;
        coingecko_coin_id: string | null;
        total_supply: string;
        price_usd: string;
        fdv_usd: string;
        total_reserve_in_usd: string;
        volume_usd: {
          h24: string;
        };
        market_cap_usd: string | null;
      };
      relationships: {
        top_pools: {
          data: Array<{
            id: string;
            type: string;
          }>;
        };
      };
    };
  };
}

export default function RugTrace() {
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState('1');
  const [loading, setLoading] = useState(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [previousTab, setPreviousTab] = useState<TabType>('overview');
  const [direction, setDirection] = useState(0);
  
  const { isConnected, connectWallet, userProfile, updateCredits } = useWallet();

  // Determine animation direction when tab changes
  useEffect(() => {
    if (previousTab === activeTab) return;
    
    const prevIndex = tabs.findIndex(tab => tab.name === previousTab);
    const activeIndex = tabs.findIndex(tab => tab.name === activeTab);
    
    setDirection(activeIndex > prevIndex ? 1 : -1);
    setPreviousTab(activeTab);
  }, [activeTab, previousTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError('Please connect your wallet to use this service.');
      return;
    }
    
    // Deduct credits for the service (3 credits for RugTrace)
    const requiredCredits = 3;
    if (!userProfile || userProfile.credits < requiredCredits) {
      setError(`Insufficient credits to use this service. Required: ${requiredCredits}`);
      return;
    }
    
    // Update credits
    await updateCredits(-requiredCredits);

    // Save search to history
    if (userProfile) {
      try {
        await addSearchToHistory(
          userProfile.id,
          `RugTrace: ${address}`,
          address,
          'rug_trace'
        );
      } catch (historyError) {
        console.error('Error saving search to history:', historyError);
      }
    }
    
    setLoading(true);
    setError('');

    try {
      // Fetch GoPlus security data directly - we don't need to fetch security_info from token-investigation anymore
      const goPlusResponse = await fetch('/api/goplus-token-security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, chainId })
      });

      // Fetch liquidity data
      const liquidityResponse = await fetch('/api/token-investigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, dataType: 'launch_security', chainId })
      });
      
      // Fetch rug analysis data
      const rugAnalysisResponse = await fetch('/api/token-investigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, dataType: 'rug_analysis', chainId })
      });
      
      // Fetch top traders data
      const topTradersResponse = await fetch('/api/token-investigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, dataType: 'top_traders', chainId })
      });
      
      // Fetch token stats data for overview
      const tokenStatsResponse = await fetch('/api/token-investigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, dataType: 'token_stats', chainId })
      });
      
      // Fetch token data from our custom API
      const tokenDataResponse = await fetch('/api/token-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, chainId })
      });

      if (!goPlusResponse.ok) {
        const goPlusData = await goPlusResponse.json();
        throw new Error(goPlusData.error || 'Failed to fetch GoPlus security data');
      }

      if (!liquidityResponse.ok) {
        const liquidityData = await liquidityResponse.json();
        throw new Error(liquidityData.error || 'Failed to fetch liquidity data');
      }
      
      if (!rugAnalysisResponse.ok) {
        const rugAnalysisData = await rugAnalysisResponse.json();
        throw new Error(rugAnalysisData.error || 'Failed to fetch rug analysis data');
      }
      
      if (!topTradersResponse.ok) {
        const topTradersData = await topTradersResponse.json();
        throw new Error(topTradersData.error || 'Failed to fetch top traders data');
      }
      
      if (!tokenStatsResponse.ok) {
        const tokenStatsData = await tokenStatsResponse.json();
        throw new Error(tokenStatsData.error || 'Failed to fetch token stats data');
      }
      
      if (!tokenDataResponse.ok) {
        const tokenData = await tokenDataResponse.json();
        throw new Error(tokenData.error || 'Failed to fetch token data');
      }

      // Parse all responses
      const goPlusData = await goPlusResponse.json();
      const liquidityData = await liquidityResponse.json();
      const rugAnalysisData = await rugAnalysisResponse.json();
      const topTradersData = await topTradersResponse.json();
      const tokenStatsData = await tokenStatsResponse.json();
      const tokenData = await tokenDataResponse.json();
      
      // Set the token data with all information
      setTokenData({
        goplus_security: goPlusData,
        launch_security: liquidityData.launch_security,
        rug_analysis: rugAnalysisData.rug_analysis,
        top_traders: topTradersData.top_traders,
        token_stats: tokenStatsData.token_stats,
        token_data: tokenData.token_data
      });
      
      console.log('Setting Token Data:', { goPlusData, liquidityData, rugAnalysisData, topTradersData, tokenStatsData, tokenData });
    } catch (err: unknown) {
      const error = err as { message: string };
      setError(error.message || 'An error occurred');
      console.error('Error fetching token data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tab Navigation Component
  const TabNavigation = () => {
    return (
      <motion.div 
        className="relative mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex overflow-x-auto no-scrollbar pb-2 sm:pb-0 gap-2 w-full">
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.name 
                  ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-white/20 text-white shadow-md' 
                  : 'bg-black/30 text-white/70 hover:bg-white/10 border border-transparent'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className={activeTab === tab.name ? 'text-purple-400' : 'text-white/70'}>
                {tab.icon}
              </span>
              {tab.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {/* Background elements */}
        <motion.div 
          className="absolute top-1/4 right-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl opacity-20"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 8,
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute bottom-1/3 left-1/4 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl opacity-20"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.25, 0.2]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 10,
            ease: "easeInOut",
            delay: 2
          }}
        />
        
        {/* Header */}
        <motion.div 
          className="relative z-10 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="inline-block backdrop-blur-md bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-white/10 rounded-full px-6 py-2 mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span className="text-xs uppercase tracking-widest text-white/70">Scam Detection</span>
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-5xl font-['ClashGrotesk-Regular'] mb-2 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            RugTrace
          </motion.h1>
          <motion.p 
            className="text-sm opacity-70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Detect potential scams and analyze token safety
          </motion.p>
        </motion.div>

        {/* Search Form */}
        <motion.div 
          className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 mb-8 border border-white/10 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          whileHover={{ boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12), 0 0 1px rgba(255, 255, 255, 0.2)" }}
        >
          <form onSubmit={handleSubmit} className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <motion.input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter token address..."
                className="w-full backdrop-blur-md bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                whileFocus={{ scale: 1.01, borderColor: "rgba(255, 255, 255, 0.2)" }}
              />
            </div>
            <motion.select 
              value={chainId}
              onChange={(e) => setChainId(e.target.value)}
              className="backdrop-blur-md bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <option value="1">Ethereum</option>
              <option value="sol">Solana</option>
            </motion.select>
            <motion.button 
              type="submit" 
              disabled={loading}
              className="bg-black border border-white/20 text-white rounded-xl px-6 py-3 text-sm transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              whileHover={{ 
                scale: 1.03, 
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                boxShadow: "0 0 15px rgba(255, 255, 255, 0.2)"
              }}
              whileTap={{ scale: 0.97 }}
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </motion.button>
          </form>
          {error && (
            <motion.div 
              className="mt-4 backdrop-blur-md bg-red-500/10 border border-red-500/30 rounded-xl p-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Results Section */}
        {tokenData && (
          <div className="space-y-6">
            <TabNavigation />
            
            {/* Tab Content */}
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={activeTab}
                custom={direction}
                initial={{ opacity: 0, x: direction * 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-6 overflow-hidden no-scrollbar"
              >
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <motion.div 
                    className="space-y-6 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {tokenData?.token_stats?.data?.data ? (
                      <TokenStatsInfo 
                        data={tokenData.token_stats.data.data} 
                        tokenData={tokenData.token_data}
                      />
                    ) : (
                    <motion.div 
                      className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                        <h2 className="text-xl font-medium mb-4">No Overview Data Available</h2>
                        <p className="text-white/70">Unable to fetch token statistics for this token.</p>
                        {tokenData?.token_stats && (
                          <div className="mt-4 text-xs text-white/50 bg-black/30 p-3 rounded-lg overflow-auto max-h-48">
                            <pre>{JSON.stringify(tokenData.token_stats, null, 2)}</pre>
                          </div>
                        )}
                    </motion.div>
                    )}
                  </motion.div>
                )}
                
                {/* Risk Analysis Tab */}
                {activeTab === 'risk' && (
                  <motion.div 
                    className="space-y-6 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {chainId === 'sol' && tokenData?.goplus_security?.data ? (
                      <SolanaSecurityInfo data={tokenData.goplus_security} />
                    ) : tokenData?.goplus_security?.data ? (
                      <GoPlusSecurityInfo data={tokenData.goplus_security} />
                    ) : (
                      <motion.div 
                        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <h2 className="text-xl font-medium mb-4">No Security Data Available</h2>
                        <p className="text-white/70">Unable to fetch security information for this token.</p>
                        <p className="text-white/50 mt-2">Response: {JSON.stringify(tokenData, null, 2)}</p>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Wallets Involved Tab (formerly Holders) */}
                {activeTab === 'holders' && (
                  <motion.div 
                    className="space-y-6 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {tokenData?.top_traders?.data ? (
                      <TopTradersInfo data={tokenData.top_traders.data} />
                    ) : (
                    <motion.div 
                      className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                        <h2 className="text-xl font-medium mb-4">No Wallet Data Available</h2>
                        <p className="text-white/70">Unable to fetch wallet information for this token.</p>
                        {tokenData?.top_traders && (
                          <div className="mt-4 text-xs text-white/50 bg-black/30 p-3 rounded-lg overflow-auto max-h-48">
                            <pre>{JSON.stringify(tokenData.top_traders, null, 2)}</pre>
                          </div>
                        )}
                    </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Liquidity Tab */}
                {activeTab === 'liquidity' && (
                  <motion.div 
                    className="space-y-6 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {tokenData?.launch_security?.data?.data ? (
                      <LiquidityInfo data={tokenData.launch_security.data.data} />
                    ) : (
                    <motion.div 
                      className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                        <h2 className="text-xl font-medium mb-4">No Liquidity Data Available</h2>
                        <p className="text-white/70">Unable to fetch liquidity information for this token.</p>
                        {tokenData?.launch_security && (
                          <div className="mt-4 text-xs text-white/50 bg-black/30 p-3 rounded-lg overflow-auto max-h-48">
                            <pre>{JSON.stringify(tokenData.launch_security, null, 2)}</pre>
                          </div>
                        )}
                    </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Past Rugs Tab */}
                {activeTab === 'past_rugs' && (
                  <motion.div 
                    className="space-y-6 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {tokenData?.rug_analysis?.data?.data ? (
                    <motion.div 
                      className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                        <h2 className="text-xl font-medium mb-4">Token Information & Links</h2>
                        
                        {/* Token Description Section */}
                        {tokenData.rug_analysis.data.data.link.description && (
                          <motion.div 
                            className="bg-black/20 p-4 rounded-lg border border-white/10 mb-6"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                          >
                            <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                              </svg>
                              Token Description
                            </h3>
                            <div className="text-sm text-white/80 leading-relaxed">
                              {tokenData.rug_analysis.data.data.link.description}
                            </div>
                          </motion.div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Social Links */}
                          <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                            <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                              </svg>
                              Social Links
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {tokenData.rug_analysis.data.data.link.website && (
                                <a 
                                  href={tokenData.rug_analysis.data.data.link.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-black/20 border border-white/10 hover:bg-black/30 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="2" y1="12" x2="22" y2="12"></line>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                  </svg>
                                  Website
                                </a>
                              )}
                              
                              {tokenData.rug_analysis.data.data.link.twitter_username && (
                                <a 
                                  href={`https://twitter.com/${tokenData.rug_analysis.data.data.link.twitter_username}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-black/20 border border-white/10 hover:bg-black/30 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                                  </svg>
                                  Twitter
                                </a>
                              )}
                              
                              {tokenData.rug_analysis.data.data.link.telegram && (
                                <a 
                                  href={tokenData.rug_analysis.data.data.link.telegram} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-black/20 border border-white/10 hover:bg-black/30 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-16.5 7.5a2.25 2.25 0 0 0 .126 4.073l3.9 1.764 1.376 4.326a2.247 2.247 0 0 0 3.935.952l5.02-6.027 5.145 2.332a2.25 2.25 0 0 0 3.137-2.175V4.249a2.25 2.25 0 0 0-2.25-2.249a2.252 2.252 0 0 0-.767.133z"></path>
                                  </svg>
                                  Telegram
                                </a>
                              )}
                              
                              {/* Other social links... */}
                            </div>
                          </div>
                          
                          {/* Right column with Analytics and Community Voting */}
                          <div className="space-y-6">
                            {/* Analytics */}
                            <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                              <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                                  <polyline points="17 2 12 7 7 2"></polyline>
                                </svg>
                                Analytics
                              </h3>
                              <div className="grid grid-cols-1 gap-3">
                                <a 
                                  href={tokenData.rug_analysis.data.data.link.geckoterminal} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-black/20 border border-white/10 hover:bg-black/30 transition-colors"
                                >
                                  <span className="h-4 w-4 text-green-400 flex items-center justify-center font-bold text-xs">GT</span>
                                  GeckoTerminal
                                </a>
                              </div>
                            </div>
                            
                            {/* Community Voting */}
                            <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                              <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                </svg>
                                Community Voting
                              </h3>
                              <div className="flex items-center gap-6">
                                <div className="flex flex-col items-center">
                                  <span className="text-2xl font-bold text-green-400">{tokenData.rug_analysis.data.data.vote.like}</span>
                                  <span className="text-xs text-white/60">Likes</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-2xl font-bold text-red-400">{tokenData.rug_analysis.data.data.vote.unlike}</span>
                                  <span className="text-xs text-white/60">Dislikes</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Rug Pull Warning & Details */}
                        {tokenData.rug_analysis.data.data.rug ? (
                          <motion.div 
                            className="bg-red-500/20 p-6 rounded-lg border border-red-500/30 mt-6"
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="flex items-center gap-4 mb-4">
                              <div className="bg-red-500/30 rounded-full p-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-lg font-medium text-red-400">Rug Pull Detected</h3>
                                <p className="text-sm text-white/70">This token has been identified as a rug pull.</p>
                              </div>
                            </div>

                            <div className="bg-black/30 p-4 rounded-lg mb-4">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-medium text-white/90">Rug Pull Information</h4>
                                <span className="text-xs bg-red-500/30 text-red-400 px-2 py-1 rounded-full">
                                  Rug Ratio: {tokenData.rug_analysis.data.data.rug.rug_ratio}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-white/70">Holders Affected</p>
                                  <p className="font-medium">{tokenData.rug_analysis.data.data.rug.holder_rugged_num} / {tokenData.rug_analysis.data.data.rug.holder_token_num}</p>
                                </div>
                              </div>
                            </div>

                            {tokenData.rug_analysis.data.data.rug.rugged_tokens && tokenData.rug_analysis.data.data.rug.rugged_tokens.length > 0 && (
                              <div className="bg-black/30 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-white/90 mb-3">Related Rugged Tokens</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                  {tokenData.rug_analysis.data.data.rug.rugged_tokens.map((token, index) => (
                                    <div key={index} className="bg-black/40 rounded-lg p-3 border border-white/10">
                                      <div className="flex items-center gap-3">
                                        {token.logo && (
                                          <Image 
                                            src={token.logo} 
                                            alt={token.name} 
                                            className="w-8 h-8 rounded-full"
                                            width={32}
                                            height={32}
                                            onError={(e) => {
                                              // Replace broken image with placeholder
                                              const target = e.target as HTMLImageElement;
                                              target.src = 'https://placehold.co/32x32/gray/white?text=?';
                                            }}
                                          />
                                        )}
                                        <div className="overflow-hidden">
                                          <p className="font-medium text-sm truncate">{token.name}</p>
                                          <p className="text-xs text-white/70 truncate">{token.symbol}</p>
                                        </div>
                                      </div>
                                      <div className="mt-2">
                                        <p className="text-xs text-white/50 truncate">{token.address}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ) : (
                          <motion.div 
                            className="bg-green-500/20 p-6 rounded-lg border border-green-500/30 mt-6"
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="flex items-center gap-4 mb-4">
                              <div className="bg-green-500/30 rounded-full p-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-lg font-medium text-green-400">No Rug Pull Detected</h3>
                                <p className="text-sm text-white/70">This token has not been identified as a rug pull in our database.</p>
                              </div>
                            </div>
                            <div className="text-sm text-white/80">
                              <p>Note: While our analysis doesn&apos;t indicate a rug pull, always conduct your own research before investing.</p>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <h2 className="text-xl font-medium mb-4">No Rug Analysis Data Available</h2>
                        <p className="text-white/70">Unable to fetch rug analysis information for this token.</p>
                        {tokenData?.rug_analysis && (
                          <div className="mt-4 text-xs text-white/50 bg-black/30 p-3 rounded-lg overflow-auto max-h-48">
                            <pre>{JSON.stringify(tokenData.rug_analysis, null, 2)}</pre>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
        
        {loading && (
          <motion.div 
            className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-10 border border-white/10 shadow-lg flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-24 h-24">
                {/* Outer spinning ring */}
                <motion.div 
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 border-r-blue-500"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                />
                
                {/* Middle spinning ring */}
                <motion.div 
                  className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-400 border-l-purple-400"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2.5, ease: "linear", repeat: Infinity }}
                />
                
                {/* Inner pulsing circle */}
                <motion.div 
                  className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{ 
                    duration: 2, 
                    ease: "easeInOut", 
                    repeat: Infinity 
                  }}
                >
                  <motion.div
                    className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500"
                    animate={{ 
                      scale: [0.8, 1.1, 0.8],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{ 
                      duration: 1.5, 
                      ease: "easeInOut", 
                      repeat: Infinity 
                    }}
                  />
                </motion.div>
              </div>
              
              <div className="text-center">
                <motion.h3 
                  className="text-xl font-medium mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400"
                  animate={{ 
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{ 
                    duration: 2, 
                    ease: "easeInOut", 
                    repeat: Infinity 
                  }}
                >
                  Analyzing Token
                </motion.h3>
                <motion.div 
                  className="flex justify-center gap-1.5 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <motion.div 
                    className="h-1.5 w-1.5 rounded-full bg-purple-500"
                    animate={{ y: [-1, -4, -1] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.2 }}
                  />
                  <motion.div 
                    className="h-1.5 w-1.5 rounded-full bg-purple-400"
                    animate={{ y: [-1, -4, -1] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.3, delay: 0.1 }}
                  />
                  <motion.div 
                    className="h-1.5 w-1.5 rounded-full bg-blue-400"
                    animate={{ y: [-1, -4, -1] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.4, delay: 0.2 }}
                  />
                  <motion.div 
                    className="h-1.5 w-1.5 rounded-full bg-blue-500"
                    animate={{ y: [-1, -4, -1] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.5, delay: 0.3 }}
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
        
        {!loading && !tokenData && !error && (
          <motion.div 
            className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-8 border border-white/10 shadow-lg text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={{ boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12), 0 0 1px rgba(255, 255, 255, 0.2)" }}
          >
            <motion.div 
              className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-full backdrop-blur-md bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/10"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="M12 8v4"></path>
                <path d="M12 16h.01"></path>
              </svg>
            </motion.div>
            <motion.h3 
              className="text-xl font-medium mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              Detect Potential Scams
            </motion.h3>
            <motion.p 
              className="text-sm opacity-70 max-w-lg mx-auto mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              Enter a token address to analyze its risk factors, liquidity health, and detect potential rug pull indicators.
            </motion.p>
            {!isConnected && (
              <motion.button
                onClick={connectWallet}
                className="mt-4 bg-gradient-to-r from-purple-500/80 to-blue-500/80 rounded-lg border border-white/10 px-6 py-3 hover:border-white/20 hover:shadow-lg hover:shadow-purple-500/20 transition-all text-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
                whileHover={{ scale: 1.03, boxShadow: "0 0 15px rgba(168, 85, 247, 0.4)" }}
                whileTap={{ scale: 0.97 }}
              >
                Connect Wallet to Start
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
} 