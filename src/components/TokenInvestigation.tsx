'use client';

import { useState } from 'react';
import GlassCard from './GlassCard';
import { useWallet } from '@/contexts/WalletContext';
import { addSearchToHistory } from '@/lib/supabase';

// Define interfaces based on API response
interface SecurityInfo {
  code: number;
  msg: string;
  data: {
    goplus: {
      id: number;
      chain: string;
      address: string;
      anti_whale_modifiable: number;
      buy_tax: number;
      cannot_buy: number;
      can_take_back_ownership: number;
      creator_address: string;
      creator_balance: number;
      creator_percent: number;
      external_call: number;
      hidden_owner: number;
      holder_count: number;
      honeypot_with_same_creator: number;
      is_anti_whale: number;
      is_blacklisted: number;
      is_honeypot: number;
      is_in_dex: number;
      is_mintable: number;
      is_open_source: number;
      is_proxy: number;
      is_whitelisted: number;
      owner_address: string;
      owner_balance: number;
      owner_change_balance: number;
      owner_percent: number;
      personal_slippage_modifiable: number;
      selfdestruct: number;
      sell_tax: number;
      slippage_modifiable: number;
      token_name: string;
      token_symbol: string;
      total_supply: number;
      trading_cooldown: number;
      transfer_pausable: number;
      updated_at: number;
      lp_holders: Array<{
        tag?: string;
        value: string | null;
        address: string;
        balance: string;
        percent: string;
        NFT_list: Record<string, unknown> | null;
        is_locked: number;
        is_contract: number;
      }>;
      lp_total_supply: number;
      fake_token: null | Record<string, unknown>;
      cannot_sell_all: number;
      lp_holder_count: number;
      renounced: number;
      honeypot_data: {
        token: {
          name: string;
          symbol: string;
          decimals: number;
          address: string;
          totalHolders: number;
        };
        withToken: {
          name: string;
          symbol: string;
          decimals: number;
          address: string;
          totalHolders: number;
        };
        summary: {
          risk: string;
          riskLevel: number;
          flags: string[];
        };
        simulationSuccess: boolean;
        honeypotResult: {
          isHoneypot: boolean;
        };
        simulationResult: {
          buyTax: number;
          sellTax: number;
          transferTax: number;
          buyGas: string;
          sellGas: string;
        };
        holderAnalysis: {
          holders: string;
          successful: string;
          failed: string;
          siphoned: string;
          averageTax: number;
          averageGas: number;
          highestTax: number;
          highTaxWallets: string;
          taxDistribution: Array<{
            tax: number;
            count: number;
          }>;
          snipersFailed: number;
          snipersSuccess: number;
        };
        flags: string[];
        contractCode: {
          openSource: boolean;
          rootOpenSource: boolean;
          isProxy: boolean;
          hasProxyCalls: boolean;
        };
        chain: {
          id: string;
          name: string;
          shortName: string;
          currency: string;
        };
        router: string;
        pair: {
          pair: {
            name: string;
            address: string;
            token0: string;
            token1: string;
            type: string;
          };
          chainId: string;
          reserves0: string;
          reserves1: string;
          liquidity: number;
          router: string;
          createdAtTimestamp: string;
          creationTxHash: string;
        };
        pairAddress: string;
        updated_at: number;
      };
      flags: string[];
      is_tradable: number;
      is_in_token_list: number;
      is_low_liq: number;
      launched: null | Record<string, unknown>;
      rugged: null | Record<string, unknown>;
      deploys: null | Record<string, unknown>;
      lockInfo: {
        isLock: boolean;
        lockDetail: Array<{
          percent: string;
          pool: string;
          isBlackHole: boolean;
        }>;
        lockTag: string[];
        lockPercent: number;
        leftLockPercent: number;
      };
      top_10_holder_rate: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface RugAnalysis {
  data: {
    link: {
      address?: string;
      gmgn?: string;
      geckoterminal?: string;
      twitter_username?: string;
      website?: string;
      telegram?: string;
      bitbucket?: string;
      discord?: string;
      description?: string;
      facebook?: string;
      github?: string;
      instagram?: string;
      linkedin?: string;
      medium?: string;
      reddit?: string;
      tiktok?: string;
      youtube?: string;
      verify_status?: number;
      [key: string]: unknown;
    };
    rug: unknown;
    vote: {
      like: number;
      unlike: number;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface LockInfoItem {
  NFT_list: null | Record<string, unknown>;
  address: string;
  balance: string;
  is_locked: number;
  locked_detail: null | Record<string, unknown>;
  percent: string;
  tag?: string;
}

interface LockDetail {
  percent: string;
  pool: string;
  is_blackhole: boolean;
}

interface LaunchSecurity {
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
      lockInfo: LockInfoItem[];
      lock_summary: {
        is_locked: boolean;
        lock_detail: LockDetail[];
        lock_tags: string[];
        lock_percent: string;
        left_lock_percent: string;
      };
      hide_risk: boolean;
      [key: string]: unknown;
    };
    launchpad: null | Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface TokenStats {
  data: {
    holder_count: number;
    bluechip_owner_count: number;
    bluechip_owner_percentage: string;
    signal_count: number;
    degen_call_count: number;
    top_rat_trader_percentage: string;
    top_bundler_trader_percentage: string;
    top_entrapment_trader_percentage: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface Trader {
  address: string;
  profit: number;
  tags: string[];
  wallet_tag_v2: string;
  maker_token_tags: string[];
  buy_amount_cur: number;
  sell_amount_cur: number;
  [key: string]: unknown;
}

interface TokenRisk {
  score: number;
  level: 'High' | 'Medium' | 'Low';
  factors: {
    name: string;
    risk: 'high' | 'medium' | 'low';
    description: string;
  }[];
}

const TokenInvestigation = () => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const { isConnected, useCredits: spendCredits, userProfile } = useWallet();

  // State for API data
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);
  const [rugAnalysis, setRugAnalysis] = useState<RugAnalysis | null>(null);
  const [launchSecurity, setLaunchSecurity] = useState<LaunchSecurity | null>(null);
  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null);
  const [topTraders, setTopTraders] = useState<Trader[]>([]);
  const [tokenRisk, setTokenRisk] = useState<TokenRisk | null>(null);
  const [showAllData, setShowAllData] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  // Add new state for tag tabs
  const [activeMakerTag, setActiveMakerTag] = useState<string>('');

  const calculateRiskScore = (
    securityInfo: SecurityInfo | null,
    launchSecurity: LaunchSecurity | null,
    rugAnalysis: RugAnalysis | null
  ): TokenRisk => {
    let score = 50; // Start with neutral score
    const factors: TokenRisk['factors'] = [];
    
    // Check security issues from security info
    if (securityInfo?.data?.goplus) {
      const g = securityInfo.data.goplus;
      
      // Add to risk score based on crucial factors
      if (g.is_honeypot === 1) {
        score += 30;
        factors.push({
        name: 'Contract Analysis',
        risk: 'high',
          description: 'Contract detected as a honeypot - cannot sell tokens'
        });
      }
      
      if (g.is_blacklisted === 1) {
        score += 20;
        factors.push({
          name: 'Contract Status',
          risk: 'high',
          description: 'Token is blacklisted on major platforms'
        });
      }
      
      if (g.is_open_source === 0) {
        score += 15;
        factors.push({
          name: 'Transparency',
          risk: 'high',
          description: 'Contract is not open source - code cannot be verified'
        });
      }
      
      // Tax analysis
      const totalTax = (g.buy_tax || 0) + (g.sell_tax || 0);
      if (totalTax > 20) {
        score += 15;
        factors.push({
          name: 'Transaction Tax',
          risk: 'high',
          description: `High transaction taxes: Buy ${g.buy_tax}%, Sell ${g.sell_tax}%`
        });
      } else if (totalTax > 10) {
        score += 10;
        factors.push({
          name: 'Transaction Tax',
          risk: 'medium',
          description: `Moderate transaction taxes: Buy ${g.buy_tax}%, Sell ${g.sell_tax}%`
        });
      }
    }
    
    // Check launch security
    if (launchSecurity?.data?.security) {
      const s = launchSecurity.data.security;
      
      // Top holder concentration
      const topHolderRate = parseFloat(s.top_10_holder_rate || '0');
      if (topHolderRate > 0.7) {
        score += 20;
        factors.push({
          name: 'Holder Distribution',
          risk: 'high',
          description: `Top 10 wallets control over ${Math.round(topHolderRate * 100)}% of supply`
        });
      } else if (topHolderRate > 0.5) {
        score += 10;
        factors.push({
          name: 'Holder Distribution',
          risk: 'medium',
          description: `Top 10 wallets control ${Math.round(topHolderRate * 100)}% of supply`
        });
      }
      
      // Liquidity lock check
      if (!s.lock_summary?.is_locked) {
        score += 15;
        factors.push({
          name: 'Liquidity Security',
          risk: 'high',
          description: 'Liquidity is not locked - high risk of rug pull'
        });
      }
    }
    
    // Social presence from rug analysis
    if (rugAnalysis?.data?.link) {
      const links = rugAnalysis.data.link;
      let socialCount = 0;
      
      if (links.website) socialCount++;
      if (links.telegram) socialCount++;
      if (links.twitter_username) socialCount++;
      if (links.github) socialCount++;
      
      if (socialCount === 0) {
        score += 15;
        factors.push({
          name: 'Social Presence',
          risk: 'high',
          description: 'No social media or website found - potential for anonymous scam'
        });
      } else if (socialCount < 2) {
        score += 5;
        factors.push({
          name: 'Social Presence',
          risk: 'medium',
          description: 'Limited social presence - increased anonymity risk'
        });
      }
    }
    
    // Add default factor if none found
    if (factors.length === 0) {
      factors.push({
        name: 'Limited Data',
        risk: 'medium',
        description: 'Not enough data to generate complete risk profile'
      });
    }
    
    // Determine risk level
    let level: 'High' | 'Medium' | 'Low';
    if (score >= 70) {
      level = 'High';
    } else if (score >= 40) {
      level = 'Medium';
    } else {
      level = 'Low';
    }
    
    return { score, level, factors };
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!isConnected) {
      setError('Please connect your wallet to use this service.');
      return;
    }
    
    // Deduct credits for the service (5 credits for RugTrace)
    let success = false;
    try {
      success = await spendCredits(5);
    } catch (err) {
      console.error('Error using credits:', err);
      setError('Failed to use credits for this service.');
      return;
    }
    
    if (!success) {
      setError('Insufficient credits to use this service.');
      return;
    }

    // Save search to history
    if (userProfile) {
      try {
        console.log('Saving RugTrace search to history:', address);
        await addSearchToHistory(
          userProfile.id,
          `RugTrace: ${address}`,
          address,
          'rug_trace'
        );
      } catch (historyError) {
        console.error('Error saving search to history:', historyError);
        // Continue with the search even if logging fails
      }
    }
    
    setLoading(true);
    setError('');
    setAnalysisComplete(false);

    try {
      // Call the API
      const response = await fetch('/api/token-investigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch token data');
      }
      
      const data = await response.json();
      
      // Update state with API data
      setSecurityInfo(data.securityInfo);
      setRugAnalysis(data.rugAnalysis);
      setLaunchSecurity(data.launchSecurity);
      setTokenStats(data.tokenStats);
      setTopTraders(Array.isArray(data.topTraders?.data) ? data.topTraders.data.slice(0, 5) : []);
      
      // Calculate risk score based on the data
      const risk = calculateRiskScore(data.securityInfo, data.launchSecurity, data.rugAnalysis);
      setTokenRisk(risk);
      
      setAnalysisComplete(true);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const getNumericValue = (value: unknown, defaultValue: number = 0): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  };

  const formatAddress = (address: string): string => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format percentage values
  const formatPercentage = (value: unknown): string => {
    if (typeof value === 'number') return `${value.toFixed(2)}%`;
    if (typeof value === 'string') {
      // Check if the string already has a % symbol
      if (value.includes('%')) return value;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? '0%' : `${parsed.toFixed(2)}%`;
    }
    return '0%';
  };

  // Calculate burn percentage
  const getBurnPercentage = (): string => {
    if (launchSecurity?.data?.security?.burn_ratio) {
      return formatPercentage(launchSecurity.data.security.burn_ratio);
    }
    return '0%';
  };

  // Calculate lock percentage
  const getLockPercentage = (): string => {
    if (launchSecurity?.data?.security?.lock_summary?.lock_percent) {
      return formatPercentage(launchSecurity.data.security.lock_summary.lock_percent);
    } else if (securityInfo?.data?.goplus?.lockInfo?.lockPercent) {
      return formatPercentage(securityInfo.data.goplus.lockInfo.lockPercent);
    }
    return '0%';
  };

  // Helper function to get unique maker token tags
  const getUniqueMakerTags = (): string[] => {
    const allTags: string[] = [];
    topTraders.forEach(trader => {
      if (trader.maker_token_tags) {
        trader.maker_token_tags.forEach(tag => {
          if (!allTags.includes(tag)) {
            allTags.push(tag);
          }
        });
      }
    });
    return allTags;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-medium mb-1">RugTrace</h1>
        <p className="text-sm opacity-70">Comprehensive token analysis for security, social presence, and trading metrics</p>
      </header>

      {/* Search Form */}
      <div className="mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter token address..."
            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg px-6 py-3 transition-all duration-200 disabled:opacity-50 shadow-lg border border-white/10"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </span>
            ) : (
              'Analyze Token'
            )}
          </button>
        </form>
      </div>

      {analysisComplete && (
        <>
          {/* Controls & Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex overflow-x-auto pb-2 sm:pb-0 gap-2 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'overview' 
                    ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border border-white/20 text-white shadow-md' 
                    : 'bg-black/30 text-white/70 hover:bg-white/10 border border-transparent'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'security' 
                    ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border border-white/20 text-white shadow-md' 
                    : 'bg-black/30 text-white/70 hover:bg-white/10 border border-transparent'
                }`}
              >
                Security
              </button>
              <button
                onClick={() => setActiveTab('liquidity')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'liquidity' 
                    ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border border-white/20 text-white shadow-md' 
                    : 'bg-black/30 text-white/70 hover:bg-white/10 border border-transparent'
                }`}
              >
                Liquidity
              </button>
              <button
                onClick={() => setActiveTab('traders')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'traders' 
                    ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border border-white/20 text-white shadow-md' 
                    : 'bg-black/30 text-white/70 hover:bg-white/10 border border-transparent'
                }`}
              >
                Traders
              </button>
              <button
                onClick={() => setActiveTab('wallets')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'wallets' 
                    ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border border-white/20 text-white shadow-md' 
                    : 'bg-black/30 text-white/70 hover:bg-white/10 border border-transparent'
                }`}
              >
                Wallets
              </button>
            </div>
            
            <button
              onClick={() => setShowAllData(!showAllData)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                showAllData 
                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30' 
                  : 'bg-black/30 hover:bg-white/10 border border-white/10'
              }`}
            >
              {showAllData ? 'Hide Raw Data' : 'Show Raw Data'}
            </button>
          </div>

          {/* Token Overview */}
          {activeTab === 'overview' && (
            <>
              <GlassCard className="p-6 mb-6 backdrop-blur-md bg-black/30 border border-white/10">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Token Header & Social Links */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">{securityInfo?.data?.goplus?.token_name || 'Unknown Token'}</h2>
                          <span className="px-2.5 py-1 bg-black/40 rounded text-sm font-medium border border-white/10">{securityInfo?.data?.goplus?.token_symbol || '-'}</span>
                        </div>
                        <div className="mt-1 text-sm opacity-70 font-mono">{address}</div>
                      </div>
                      
                      {/* Risk Score Circle */}
                      {tokenRisk && (
                        <div className="hidden sm:block">
                          <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-xl backdrop-blur-lg ${
                            tokenRisk.level === 'High' ? 'bg-gradient-to-br from-red-500/20 to-red-800/50 border-2 border-red-500/50' : 
                            tokenRisk.level === 'Medium' ? 'bg-gradient-to-br from-amber-500/20 to-amber-800/50 border-2 border-amber-500/50' : 
                            'bg-gradient-to-br from-emerald-500/20 to-emerald-800/50 border-2 border-emerald-500/50'
                          }`}>
                            <span className="text-4xl font-bold">{tokenRisk.score}</span>
                            <span className={`text-xs font-medium ${
                              tokenRisk.level === 'High' ? 'text-red-300' : 
                              tokenRisk.level === 'Medium' ? 'text-amber-300' : 
                              'text-emerald-300'
                            }`}>{tokenRisk.level} Risk</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Token Description */}
                    {rugAnalysis?.data?.link?.description && (
                      <div className="mt-2 text-sm border-l-2 border-purple-500/50 pl-3 italic bg-black/20 p-3 rounded-r-lg">
                        {rugAnalysis.data.link.description}
                      </div>
                    )}
                    
                    {/* Social Links */}
                    {rugAnalysis?.data?.link && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {rugAnalysis.data.link.website && (
                          <a href={rugAnalysis.data.link.website} target="_blank" rel="noopener noreferrer" 
                             className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-blue-700/20 hover:from-blue-500/30 hover:to-blue-700/30 rounded-full text-sm transition-colors border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.572-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                            </svg>
                            Website
                          </a>
                        )}
                        {rugAnalysis.data.link.twitter_username && (
                          <a href={`https://twitter.com/${rugAnalysis.data.link.twitter_username}`} target="_blank" rel="noopener noreferrer" 
                             className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-400/20 to-blue-600/20 hover:from-blue-400/30 hover:to-blue-600/30 rounded-full text-sm transition-colors border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                            </svg>
                            Twitter
                          </a>
                        )}
                        {rugAnalysis.data.link.telegram && (
                          <a href={rugAnalysis.data.link.telegram} target="_blank" rel="noopener noreferrer" 
                             className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600/20 to-blue-800/20 hover:from-blue-600/30 hover:to-blue-800/30 rounded-full text-sm transition-colors border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
                            </svg>
                            Telegram
                          </a>
                        )}
                        {rugAnalysis.data.link.discord && (
                          <a href={rugAnalysis.data.link.discord} target="_blank" rel="noopener noreferrer" 
                             className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500/20 to-indigo-700/20 hover:from-indigo-500/30 hover:to-indigo-700/30 rounded-full text-sm transition-colors border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                            Discord
                          </a>
                        )}
                        {rugAnalysis.data.link.github && (
                          <a href={rugAnalysis.data.link.github} target="_blank" rel="noopener noreferrer" 
                             className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-gray-600/20 to-gray-800/20 hover:from-gray-600/30 hover:to-gray-800/30 rounded-full text-sm transition-colors border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            GitHub
                          </a>
                        )}
                      </div>
                    )}
                    
                    {/* Risk Factors */}
                    {tokenRisk && tokenRisk.factors.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <h3 className="text-sm font-medium uppercase opacity-70">Risk Factors</h3>
                        {tokenRisk.factors.map((factor, idx) => (
                          <div key={idx} className={`p-3 rounded-lg border ${
                            factor.risk === 'high' ? 'bg-red-900/20 border-red-500/30' : 
                            factor.risk === 'medium' ? 'bg-amber-900/20 border-amber-500/30' : 
                            'bg-emerald-900/20 border-emerald-500/30'
                          }`}>
                            <div className="flex items-center gap-2">
                              {factor.risk === 'high' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              ) : factor.risk === 'medium' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span className="font-medium">{factor.name}</span>
                            </div>
                            <p className="mt-1 text-sm opacity-80 ml-7">{factor.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Key Metrics */}
                  <div className="lg:w-2/5">
                    {/* Risk Score for Mobile */}
                    {tokenRisk && (
                      <div className="col-span-2 sm:hidden flex justify-center mb-4">
                        <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-xl backdrop-blur-lg ${
                          tokenRisk.level === 'High' ? 'bg-gradient-to-br from-red-500/20 to-red-800/50 border-2 border-red-500/50' : 
                          tokenRisk.level === 'Medium' ? 'bg-gradient-to-br from-amber-500/20 to-amber-800/50 border-2 border-amber-500/50' : 
                          'bg-gradient-to-br from-emerald-500/20 to-emerald-800/50 border-2 border-emerald-500/50'
                        }`}>
                          <span className="text-4xl font-bold">{tokenRisk.score}</span>
                          <span className={`text-xs font-medium ${
                            tokenRisk.level === 'High' ? 'text-red-300' : 
                            tokenRisk.level === 'Medium' ? 'text-amber-300' : 
                            'text-emerald-300'
                          }`}>{tokenRisk.level} Risk</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/40 backdrop-blur-md rounded-lg p-3 border border-white/10">
                        <div className="text-xs uppercase tracking-wider opacity-70 mb-1">Holders</div>
                        <div className="text-lg font-medium">{getNumericValue(tokenStats?.data?.holder_count || securityInfo?.data?.goplus?.holder_count).toLocaleString()}</div>
                      </div>
                      
                      <div className="bg-black/40 backdrop-blur-md rounded-lg p-3 border border-white/10">
                        <div className="text-xs uppercase tracking-wider opacity-70 mb-1">Bluechip Holders</div>
                        <div className="text-lg font-medium">{tokenStats?.data?.bluechip_owner_count || '0'}</div>
                        <div className="text-xs opacity-70">{tokenStats?.data?.bluechip_owner_percentage || '0%'} of total</div>
                      </div>
                      
                      <div className="bg-black/40 backdrop-blur-md rounded-lg p-3 border border-white/10">
                        <div className="text-xs uppercase tracking-wider opacity-70 mb-1">Buy Tax</div>
                        <div className="text-lg font-medium flex items-center gap-1">
                          <span>{getNumericValue(securityInfo?.data?.goplus?.buy_tax || launchSecurity?.data?.security?.buy_tax || 0)}%</span>
                          {getNumericValue(securityInfo?.data?.goplus?.buy_tax || launchSecurity?.data?.security?.buy_tax || 0) > 10 && (
                            <span className="text-red-400 text-sm">High</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-black/40 backdrop-blur-md rounded-lg p-3 border border-white/10">
                        <div className="text-xs uppercase tracking-wider opacity-70 mb-1">Sell Tax</div>
                        <div className="text-lg font-medium flex items-center gap-1">
                          <span>{getNumericValue(securityInfo?.data?.goplus?.sell_tax || launchSecurity?.data?.security?.sell_tax || 0)}%</span>
                          {getNumericValue(securityInfo?.data?.goplus?.sell_tax || launchSecurity?.data?.security?.sell_tax || 0) > 10 && (
                            <span className="text-red-400 text-sm">High</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-black/40 backdrop-blur-md rounded-lg p-3 border border-white/10">
                        <div className="text-xs uppercase tracking-wider opacity-70 mb-1">Tokens Burned</div>
                        <div className="text-lg font-medium">{getBurnPercentage()}</div>
                        <div className="h-1.5 mt-1 bg-black/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                            style={{ width: getBurnPercentage() !== 'N/A' ? getBurnPercentage() : '0%' }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="bg-black/40 backdrop-blur-md rounded-lg p-3 border border-white/10">
                        <div className="text-xs uppercase tracking-wider opacity-70 mb-1">Liquidity Locked</div>
                        <div className="text-lg font-medium">{getLockPercentage()}</div>
                        <div className="h-1.5 mt-1 bg-black/30 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              parseFloat(getLockPercentage()) > 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              parseFloat(getLockPercentage()) > 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                              'bg-gradient-to-r from-red-500 to-pink-500'
                            }`}
                            style={{ width: getLockPercentage() !== 'N/A' ? getLockPercentage() : '0%' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Creator & Owner Info */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {securityInfo?.data?.goplus?.creator_address && (
                    <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10">
                      <div className="text-sm uppercase tracking-wider opacity-70 mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Creator
                      </div>
                      <div className="text-sm font-mono break-all">{securityInfo.data.goplus.creator_address}</div>
                      {securityInfo.data.goplus.creator_percent > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between items-center text-sm">
                            <span>Creator Balance</span>
                            <span className={securityInfo.data.goplus.creator_percent > 20 ? 'text-red-400' : 'text-white'}>{securityInfo.data.goplus.creator_percent}%</span>
                          </div>
                          <div className="w-full bg-black/30 rounded-full h-2 mt-1 overflow-hidden">
                            <div 
                              className={`h-2 rounded-full ${
                                securityInfo.data.goplus.creator_percent > 20 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                                securityInfo.data.goplus.creator_percent > 5 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 
                                'bg-gradient-to-r from-emerald-500 to-emerald-600'
                              }`}
                              style={{ width: `${Math.min(securityInfo.data.goplus.creator_percent * 2, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {securityInfo?.data?.goplus?.owner_address && (
                    <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10">
                      <div className="text-sm uppercase tracking-wider opacity-70 mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        Owner
                      </div>
                      <div className="text-sm font-mono break-all">{securityInfo.data.goplus.owner_address}</div>
                      {securityInfo.data.goplus.owner_percent > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between items-center text-sm">
                            <span>Owner Balance</span>
                            <span className={securityInfo.data.goplus.owner_percent > 20 ? 'text-red-400' : 'text-white'}>{securityInfo.data.goplus.owner_percent}%</span>
                          </div>
                          <div className="w-full bg-black/30 rounded-full h-2 mt-1 overflow-hidden">
                            <div 
                              className={`h-2 rounded-full ${
                                securityInfo.data.goplus.owner_percent > 20 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                                securityInfo.data.goplus.owner_percent > 5 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 
                                'bg-gradient-to-r from-emerald-500 to-emerald-600'
                              }`}
                              style={{ width: `${Math.min(securityInfo.data.goplus.owner_percent * 2, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>
              
              {/* Key Risk Factors */}
              {tokenRisk && tokenRisk.factors.length > 0 && (
                <GlassCard className="p-6 mb-6">
                  <h2 className="text-lg font-medium mb-4">Key Risk Factors</h2>
                  <div className="space-y-3">
                    {tokenRisk.factors.map((factor, index) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        factor.risk === 'high' ? 'bg-red-500/10 border border-red-500/30' : 
                        factor.risk === 'medium' ? 'bg-amber-500/10 border border-amber-500/30' : 
                        'bg-emerald-500/10 border border-emerald-500/30'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{factor.name}</div>
                          <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                            factor.risk === 'high' ? 'bg-red-500/20 text-red-400' : 
                            factor.risk === 'medium' ? 'bg-amber-500/20 text-amber-400' : 
                            'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {factor.risk.charAt(0).toUpperCase() + factor.risk.slice(1)} Risk
                          </div>
                        </div>
                        <div className="text-sm mt-1 opacity-80">{factor.description}</div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Security Status */}
                <GlassCard className="p-6">
                  <h2 className="text-lg font-medium mb-4">Security Status</h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`bg-black/15 p-4 rounded-lg flex flex-col items-center justify-center ${
                      securityInfo?.data?.goplus?.is_honeypot === 0 ? 'border border-emerald-500/30' : 'border border-red-500/30'
                    }`}>
                      <div className={`text-lg font-medium ${
                        securityInfo?.data?.goplus?.is_honeypot === 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {securityInfo?.data?.goplus?.is_honeypot === 0 ? 'Not a Honeypot' : 'Potential Honeypot'}
                      </div>
                      <div className="text-xs opacity-70 text-center mt-1">Honeypot check</div>
                    </div>
                    
                    <div className={`bg-black/15 p-4 rounded-lg flex flex-col items-center justify-center ${
                      securityInfo?.data?.goplus?.is_blacklisted === 0 ? 'border border-emerald-500/30' : 'border border-red-500/30'
                    }`}>
                      <div className={`text-lg font-medium ${
                        securityInfo?.data?.goplus?.is_blacklisted === 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {securityInfo?.data?.goplus?.is_blacklisted === 0 ? 'Not Blacklisted' : 'Blacklisted'}
                      </div>
                      <div className="text-xs opacity-70 text-center mt-1">Blacklist status</div>
                    </div>
                    
                    <div className={`bg-black/15 p-4 rounded-lg flex flex-col items-center justify-center ${
                      securityInfo?.data?.goplus?.is_open_source === 1 ? 'border border-emerald-500/30' : 'border border-red-500/30'
                    }`}>
                      <div className={`text-lg font-medium ${
                        securityInfo?.data?.goplus?.is_open_source === 1 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {securityInfo?.data?.goplus?.is_open_source === 1 ? 'Open Source' : 'Closed Source'}
                      </div>
                      <div className="text-xs opacity-70 text-center mt-1">Contract verification</div>
                    </div>
                    
                    <div className={`bg-black/15 p-4 rounded-lg flex flex-col items-center justify-center ${
                      securityInfo?.data?.goplus?.renounced === 1 ? 'border border-emerald-500/30' : 'border border-amber-500/30'
                    }`}>
                      <div className={`text-lg font-medium ${
                        securityInfo?.data?.goplus?.renounced === 1 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {securityInfo?.data?.goplus?.renounced === 1 ? 'Renounced' : 'Not Renounced'}
                      </div>
                      <div className="text-xs opacity-70 text-center mt-1">Ownership status</div>
                    </div>
                  </div>
                  
                  {/* Tax Information */}
                  <div className="mt-6">
                    <h3 className="text-sm font-medium uppercase opacity-70 mb-3">Transaction Taxes</h3>
                    <div className="space-y-4">
                      <div className="bg-black/15 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm font-medium">Buy Tax</div>
                          <div className={`text-base font-medium ${getNumericValue(securityInfo?.data?.goplus?.buy_tax || 0) > 10 ? 'text-red-400' : 'text-white'}`}>
                            {getNumericValue(securityInfo?.data?.goplus?.buy_tax || 0)}%
                          </div>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              getNumericValue(securityInfo?.data?.goplus?.buy_tax || 0) > 15 ? 'bg-red-500' : 
                              getNumericValue(securityInfo?.data?.goplus?.buy_tax || 0) > 5 ? 'bg-amber-500' : 
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(getNumericValue(securityInfo?.data?.goplus?.buy_tax || 0) * 3, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="bg-black/15 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm font-medium">Sell Tax</div>
                          <div className={`text-base font-medium ${getNumericValue(securityInfo?.data?.goplus?.sell_tax || 0) > 10 ? 'text-red-400' : 'text-white'}`}>
                            {getNumericValue(securityInfo?.data?.goplus?.sell_tax || 0)}%
                          </div>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              getNumericValue(securityInfo?.data?.goplus?.sell_tax || 0) > 15 ? 'bg-red-500' : 
                              getNumericValue(securityInfo?.data?.goplus?.sell_tax || 0) > 5 ? 'bg-amber-500' : 
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(getNumericValue(securityInfo?.data?.goplus?.sell_tax || 0) * 3, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {securityInfo?.data?.goplus?.honeypot_data?.simulationResult?.transferTax && (
                        <div className="bg-black/15 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-sm font-medium">Transfer Tax</div>
                            <div className={`text-base font-medium ${getNumericValue(securityInfo?.data?.goplus?.honeypot_data?.simulationResult?.transferTax || 0) > 5 ? 'text-red-400' : 'text-white'}`}>
                              {getNumericValue(securityInfo?.data?.goplus?.honeypot_data?.simulationResult?.transferTax || 0)}%
                            </div>
                          </div>
                          <div className="w-full bg-black/20 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                getNumericValue(securityInfo?.data?.goplus?.honeypot_data?.simulationResult?.transferTax || 0) > 10 ? 'bg-red-500' : 
                                getNumericValue(securityInfo?.data?.goplus?.honeypot_data?.simulationResult?.transferTax || 0) > 3 ? 'bg-amber-500' : 
                                'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(getNumericValue(securityInfo?.data?.goplus?.honeypot_data?.simulationResult?.transferTax || 0) * 5, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Simulation Results */}
                  {securityInfo?.data?.goplus?.honeypot_data?.simulationResult && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium uppercase opacity-70 mb-3">Transaction Simulation</h3>
                      <div className="bg-black/15 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs opacity-70">Buy Gas</div>
                            <div className="text-base font-medium mt-1">{securityInfo.data.goplus.honeypot_data.simulationResult.buyGas}</div>
                          </div>
                          <div>
                            <div className="text-xs opacity-70">Sell Gas</div>
                            <div className="text-base font-medium mt-1">{securityInfo.data.goplus.honeypot_data.simulationResult.sellGas}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-xs opacity-70">Simulation Status</div>
                            <div className={`text-base font-medium mt-1 ${securityInfo.data.goplus.honeypot_data.simulationSuccess ? 'text-emerald-400' : 'text-red-400'}`}>
                              {securityInfo.data.goplus.honeypot_data.simulationSuccess ? 'Success' : 'Failed'}
                            </div>
                            {!securityInfo.data.goplus.honeypot_data.simulationSuccess && (
                              <div className="text-xs text-red-400 mt-1">Warning: Failed simulation may indicate sell restrictions</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </GlassCard>

                {/* Contract Info */}
                <GlassCard className="p-6">
                  <h2 className="text-lg font-medium mb-4">Contract Information</h2>
                  
                  <div className="space-y-4">
                    {securityInfo?.data?.goplus?.creator_address && (
                      <div className="bg-black/15 p-4 rounded-lg">
                        <div className="text-xs uppercase tracking-wider opacity-70 mb-2">Creator</div>
                        <div className="text-sm font-mono break-all">{securityInfo.data.goplus.creator_address}</div>
                        {securityInfo.data.goplus.creator_percent > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between items-center text-sm">
                              <span>Creator Balance</span>
                              <span>{securityInfo.data.goplus.creator_percent}%</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-2 mt-1">
                              <div 
                                className={`h-2 rounded-full ${
                                  securityInfo.data.goplus.creator_percent > 20 ? 'bg-red-500' : 
                                  securityInfo.data.goplus.creator_percent > 5 ? 'bg-amber-500' : 
                                  'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(securityInfo.data.goplus.creator_percent * 2, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {securityInfo?.data?.goplus?.owner_address && (
                      <div className="bg-black/15 p-4 rounded-lg">
                        <div className="text-xs uppercase tracking-wider opacity-70 mb-2">Owner</div>
                        <div className="text-sm font-mono break-all">{securityInfo.data.goplus.owner_address}</div>
                        {securityInfo.data.goplus.owner_percent > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between items-center text-sm">
                              <span>Owner Balance</span>
                              <span>{securityInfo.data.goplus.owner_percent}%</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-2 mt-1">
                              <div 
                                className={`h-2 rounded-full ${
                                  securityInfo.data.goplus.owner_percent > 20 ? 'bg-red-500' : 
                                  securityInfo.data.goplus.owner_percent > 5 ? 'bg-amber-500' : 
                                  'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(securityInfo.data.goplus.owner_percent * 2, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Contract Attributes */}
                    <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10 mt-4">
                      <div className="text-sm uppercase tracking-wider opacity-70 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Contract Attributes
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {/* Display positive attributes */}
                        {securityInfo?.data?.goplus?.is_open_source === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-emerald-700/20 text-emerald-300 rounded-full text-xs border border-emerald-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Open Source
                          </span>
                        )}
                        {securityInfo?.data?.goplus?.is_whitelisted === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-emerald-700/20 text-emerald-300 rounded-full text-xs border border-emerald-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Whitelisted
                          </span>
                        )}
                        {securityInfo?.data?.goplus?.is_in_dex === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-emerald-700/20 text-emerald-300 rounded-full text-xs border border-emerald-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Listed in DEX
                          </span>
                        )}
                        {securityInfo?.data?.goplus?.is_tradable === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-emerald-700/20 text-emerald-300 rounded-full text-xs border border-emerald-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Tradable
                          </span>
                        )}
                        {securityInfo?.data?.goplus?.is_anti_whale === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-emerald-700/20 text-emerald-300 rounded-full text-xs border border-emerald-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Anti-Whale
                          </span>
                        )}
                        {securityInfo?.data?.goplus?.renounced === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-emerald-700/20 text-emerald-300 rounded-full text-xs border border-emerald-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Renounced
                          </span>
                        )}
                        
                        {/* Display neutral attributes */}
                        {securityInfo?.data?.goplus?.is_mintable === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-700/20 text-amber-300 rounded-full text-xs border border-amber-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Mintable
                          </span>
                        )}
                        {securityInfo?.data?.goplus?.is_proxy === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-700/20 text-amber-300 rounded-full text-xs border border-amber-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Proxy
                          </span>
                        )}
                        {securityInfo?.data?.goplus?.external_call === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-700/20 text-amber-300 rounded-full text-xs border border-amber-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            External Call
                          </span>
                        )}
                        {securityInfo?.data?.goplus?.anti_whale_modifiable === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-700/20 text-amber-300 rounded-full text-xs border border-amber-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Anti-Whale Modifiable
                          </span>
                        )}
                        {securityInfo?.data?.goplus?.trading_cooldown === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-700/20 text-amber-300 rounded-full text-xs border border-amber-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Trading Cooldown
                          </span>
                        )}
                        {securityInfo?.data?.goplus?.transfer_pausable === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-700/20 text-amber-300 rounded-full text-xs border border-amber-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Transfer Pausable
                          </span>
                        )}
                        {securityInfo?.data?.goplus?.slippage_modifiable === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-700/20 text-amber-300 rounded-full text-xs border border-amber-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Slippage Modifiable
                          </span>
                        )}
                        {securityInfo?.data?.goplus?.is_low_liq === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-700/20 text-amber-300 rounded-full text-xs border border-amber-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Low Liquidity
                          </span>
                        )}
                        
                        {/* Display negative attributes */}
                        {securityInfo?.data?.goplus?.is_honeypot === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-red-500/20 to-red-700/20 text-red-300 rounded-full text-xs border border-red-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Honeypot
                          </span>
                        )}
                        {securityInfo?.data?.goplus?.is_blacklisted === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-red-500/20 to-red-700/20 text-red-300 rounded-full text-xs border border-red-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Blacklisted
                          </span>
                        )}
                        {securityInfo?.data?.goplus?.selfdestruct === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-red-500/20 to-red-700/20 text-red-300 rounded-full text-xs border border-red-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Self-Destruct
                          </span>
                        )}
                        {securityInfo?.data?.goplus?.can_take_back_ownership === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-red-500/20 to-red-700/20 text-red-300 rounded-full text-xs border border-red-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Can Take Back Ownership
                          </span>
                        )}
                        {securityInfo?.data?.goplus?.hidden_owner === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-red-500/20 to-red-700/20 text-red-300 rounded-full text-xs border border-red-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Hidden Owner
                          </span>
                        )}
                        {securityInfo?.data?.goplus?.cannot_buy === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-red-500/20 to-red-700/20 text-red-300 rounded-full text-xs border border-red-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Cannot Buy
                          </span>
                        )}
                        {securityInfo?.data?.goplus?.cannot_sell_all === 1 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-red-500/20 to-red-700/20 text-red-300 rounded-full text-xs border border-red-500/30 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Cannot Sell All
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Security Flags */}
                  {((securityInfo?.data?.goplus?.flags && securityInfo.data.goplus.flags.length > 0) || 
                    (launchSecurity?.data?.security?.flags && launchSecurity.data.security.flags.length > 0)) && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium uppercase opacity-70 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Security Flags
                      </h3>
                      <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-red-500/20">
                        <div className="flex flex-wrap gap-2">
                          {securityInfo?.data?.goplus?.flags?.map((flag, idx) => (
                            <span key={`goplus-${idx}`} className="px-3 py-1.5 bg-gradient-to-r from-red-500/20 to-red-700/20 text-red-300 rounded-full text-xs border border-red-500/30 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {flag}
                            </span>
                          ))}
                          {launchSecurity?.data?.security?.flags?.map((flag, idx) => (
                            <span key={`launch-${idx}`} className="px-3 py-1.5 bg-gradient-to-r from-red-500/20 to-red-700/20 text-red-300 rounded-full text-xs border border-red-500/30 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {flag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </div>
              
              {/* Holder Analysis */}
              {securityInfo?.data?.goplus?.honeypot_data?.holderAnalysis && (
                <GlassCard className="p-6 mb-6 backdrop-blur-md bg-black/30 border border-white/10">
                  <h2 className="text-lg font-medium mb-4 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Holder Analysis</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10">
                      <div className="text-sm font-medium mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        Holder Statistics
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                          <div className="text-xs opacity-70">Total Holders</div>
                          <div className="text-lg font-medium">{securityInfo.data.goplus.honeypot_data.holderAnalysis.holders}</div>
                        </div>
                        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                          <div className="text-xs opacity-70">Successful Holders</div>
                          <div className="text-lg font-medium text-emerald-400">{securityInfo.data.goplus.honeypot_data.holderAnalysis.successful}</div>
                        </div>
                        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                          <div className="text-xs opacity-70">Failed Holders</div>
                          <div className="text-lg font-medium text-red-400">{securityInfo.data.goplus.honeypot_data.holderAnalysis.failed}</div>
                        </div>
                        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                          <div className="text-xs opacity-70">Siphoned Holders</div>
                          <div className="text-lg font-medium text-amber-400">{securityInfo.data.goplus.honeypot_data.holderAnalysis.siphoned}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10">
                      <div className="text-sm font-medium mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                        </svg>
                        Gas & Tax Analysis
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center text-sm mb-1.5">
                            <span>Average Gas</span>
                            <span className="font-mono">{Math.round(securityInfo.data.goplus.honeypot_data.holderAnalysis.averageGas).toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                              style={{ width: `${Math.min(securityInfo.data.goplus.honeypot_data.holderAnalysis.averageGas / 200000 * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center text-sm mb-1.5">
                            <span>Average Tax</span>
                            <span className={`font-mono ${
                              securityInfo.data.goplus.honeypot_data.holderAnalysis.averageTax > 15 ? 'text-red-400' : 
                              securityInfo.data.goplus.honeypot_data.holderAnalysis.averageTax > 5 ? 'text-amber-400' : 
                              'text-emerald-400'
                            }`}>{securityInfo.data.goplus.honeypot_data.holderAnalysis.averageTax}%</span>
                          </div>
                          <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className={`h-2.5 rounded-full ${
                                securityInfo.data.goplus.honeypot_data.holderAnalysis.averageTax > 15 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                                securityInfo.data.goplus.honeypot_data.holderAnalysis.averageTax > 5 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 
                                'bg-gradient-to-r from-emerald-500 to-emerald-600'
                              }`}
                              style={{ width: `${Math.min(securityInfo.data.goplus.honeypot_data.holderAnalysis.averageTax * 3, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center text-sm mb-1.5">
                            <span>Highest Tax</span>
                            <span className={`font-mono ${
                              securityInfo.data.goplus.honeypot_data.holderAnalysis.highestTax > 20 ? 'text-red-400' : 
                              securityInfo.data.goplus.honeypot_data.holderAnalysis.highestTax > 10 ? 'text-amber-400' : 
                              'text-emerald-400'
                            }`}>{securityInfo.data.goplus.honeypot_data.holderAnalysis.highestTax}%</span>
                          </div>
                          <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className={`h-2.5 rounded-full ${
                                securityInfo.data.goplus.honeypot_data.holderAnalysis.highestTax > 20 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                                securityInfo.data.goplus.honeypot_data.holderAnalysis.highestTax > 10 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 
                                'bg-gradient-to-r from-emerald-500 to-emerald-600'
                              }`}
                              style={{ width: `${Math.min(securityInfo.data.goplus.honeypot_data.holderAnalysis.highestTax * 2, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {securityInfo.data.goplus.honeypot_data.holderAnalysis.taxDistribution && 
                    securityInfo.data.goplus.honeypot_data.holderAnalysis.taxDistribution.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium uppercase opacity-70 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                        Tax Distribution
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {securityInfo.data.goplus.honeypot_data.holderAnalysis.taxDistribution.map((item, idx) => (
                          <div key={idx} className="bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10">
                            <div className="text-xs opacity-70">{item.tax}% Tax</div>
                            <div className="text-base font-medium">{item.count} wallets</div>
                            <div className="mt-2 h-1.5 bg-black/30 rounded-full overflow-hidden">
                              <div 
                                className={`h-1.5 rounded-full bg-gradient-to-r ${
                                  item.tax > 15 ? 'from-red-500 to-red-600' : 
                                  item.tax > 5 ? 'from-amber-500 to-amber-600' : 
                                  'from-emerald-500 to-emerald-600'
                                }`}
                                style={{ width: `${Math.min(item.count / 10 * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </GlassCard>
              )}
            </>
          )}

          {/* Wallets Tab */}
          {activeTab === 'wallets' && (
            <div>
              <GlassCard className="p-6 mb-6">
                {/* Sub-tabs for different wallet types */}
                <div className="flex overflow-x-auto pb-2 gap-2 mb-6">
                  {getUniqueMakerTags().map(tag => (
                    <button
                      key={tag}
                      onClick={() => setActiveMakerTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                        activeMakerTag === tag 
                          ? 'bg-white/20 text-white' 
                          : 'bg-black/20 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {tag.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
                
                <h2 className="text-lg font-medium mb-4">{activeMakerTag ? activeMakerTag.replace(/_/g, ' ') : 'All'} Wallets</h2>
                
                <div className="space-y-4">
                  {topTraders
                    .filter(trader => activeMakerTag ? trader.maker_token_tags?.includes(activeMakerTag) : true)
                    .map((trader, index) => (
                      <div key={index} className="bg-black/15 p-4 rounded-lg">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{trader.wallet_tag_v2 || 'Trader'}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                typeof trader.profit === 'number' && trader.profit > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {typeof trader.profit === 'number' ? 
                                  `${trader.profit > 0 ? '+' : ''}${trader.profit.toFixed(2)} ETH` : 
                                  '0.00 ETH'}
                              </span>
                            </div>
                            <div className="text-sm font-mono opacity-70">{formatAddress(trader.address)}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {trader.tags?.map((tag, tagIdx) => (
                                <span key={tagIdx} className="px-2 py-0.5 bg-black/20 rounded-full text-xs">
                                  {tag}
                                </span>
                              ))}
                              {trader.maker_token_tags?.map((tag, tagIdx) => (
                                <span key={tagIdx} className={`px-2 py-0.5 rounded-full text-xs ${
                                  tag === 'sniper' ? 'bg-red-500/20 text-red-400' :
                                  tag === 'dev_team' ? 'bg-blue-500/20 text-blue-400' :
                                  tag === 'top_holder' ? 'bg-purple-500/20 text-purple-400' :
                                  'bg-amber-500/20 text-amber-400'
                                }`}>
                                  {tag.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-4 min-w-[200px]">
                            <div className="text-center">
                              <div className="text-xs uppercase tracking-wider opacity-70">Bought</div>
                              <div className="text-base">{typeof trader.buy_amount_cur === 'number' ? trader.buy_amount_cur.toLocaleString() : '0'}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs uppercase tracking-wider opacity-70">Sold</div>
                              <div className="text-base">{typeof trader.sell_amount_cur === 'number' ? trader.sell_amount_cur.toLocaleString() : '0'}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs uppercase tracking-wider opacity-70">Last Active</div>
                              <div className="text-base">{typeof trader.last_active_timestamp === 'number' ? new Date(trader.last_active_timestamp * 1000).toLocaleDateString() : 'Unknown'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {activeMakerTag && topTraders.filter(trader => trader.maker_token_tags?.includes(activeMakerTag)).length === 0 && (
                    <div className="bg-black/10 p-4 rounded-lg text-center">
                      <p className="text-sm opacity-70">No wallets found with this tag</p>
                    </div>
                  )}
                </div>
              </GlassCard>
              
              {activeMakerTag && (
                <GlassCard className="p-6 mb-6">
                  <h2 className="text-lg font-medium mb-4">Tag Statistics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-black/15 p-4 rounded-lg">
                      <div className="text-xs uppercase tracking-wider opacity-70 mb-1">Total Wallets</div>
                      <div className="text-lg font-medium">
                        {topTraders.filter(trader => trader.maker_token_tags?.includes(activeMakerTag)).length}
                      </div>
                    </div>
                    
                    <div className="bg-black/15 p-4 rounded-lg">
                      <div className="text-xs uppercase tracking-wider opacity-70 mb-1">Avg. Profit</div>
                      <div className="text-lg font-medium">
                        {(() => {
                          const filteredTraders = topTraders.filter(trader => 
                            trader.maker_token_tags?.includes(activeMakerTag) && 
                            typeof trader.profit === 'number'
                          );
                          if (filteredTraders.length === 0) return '0.00 ETH';
                          const avgProfit = filteredTraders.reduce((sum, trader) => 
                            sum + (typeof trader.profit === 'number' ? trader.profit : 0), 0
                          ) / filteredTraders.length;
                          return `${avgProfit > 0 ? '+' : ''}${avgProfit.toFixed(2)} ETH`;
                        })()}
                      </div>
                    </div>
                    
                    <div className="bg-black/15 p-4 rounded-lg">
                      <div className="text-xs uppercase tracking-wider opacity-70 mb-1">Total Volume</div>
                      <div className="text-lg font-medium">
                        {(() => {
                          const totalVolume = topTraders
                            .filter(trader => trader.maker_token_tags?.includes(activeMakerTag))
                            .reduce((sum, trader) => {
                              const buyVol = typeof trader.buy_amount_cur === 'number' ? trader.buy_amount_cur : 0;
                              const sellVol = typeof trader.sell_amount_cur === 'number' ? trader.sell_amount_cur : 0;
                              return sum + buyVol + sellVol;
                            }, 0);
                          return totalVolume.toLocaleString();
                        })()}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}
            </div>
          )}

          {/* Liquidity Tab */}
          {activeTab === 'liquidity' && (
            <>
              {/* Lock Status */}
              <GlassCard className="p-6 mb-6">
                <h2 className="text-lg font-medium mb-4">Liquidity Status</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Lock Information */}
                <div className="space-y-4">
                    <div className="bg-black/15 p-4 rounded-lg">
                      <div className="text-sm font-medium mb-3">Lock Status</div>
                      <div className={`flex flex-col items-center py-3 ${
                        (securityInfo?.data?.goplus?.lockInfo?.isLock || launchSecurity?.data?.security?.lock_summary?.is_locked)
                          ? 'bg-emerald-500/10 border border-emerald-500/30 rounded-lg'
                          : 'bg-red-500/10 border border-red-500/30 rounded-lg'
                      }`}>
                        <div className={`text-xl font-bold ${
                          (securityInfo?.data?.goplus?.lockInfo?.isLock || launchSecurity?.data?.security?.lock_summary?.is_locked)
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}>
                          {(securityInfo?.data?.goplus?.lockInfo?.isLock || launchSecurity?.data?.security?.lock_summary?.is_locked)
                            ? 'Liquidity Locked'
                            : 'Liquidity Not Locked'
                          }
                          </div>
                        <div className="text-sm mt-1 opacity-80">
                          {(securityInfo?.data?.goplus?.lockInfo?.isLock || launchSecurity?.data?.security?.lock_summary?.is_locked)
                            ? 'Higher security: Project has locked its liquidity'
                            : 'High risk: Liquidity can be removed at any time'
                          }
                        </div>
                        </div>
                      </div>
                    
                    {/* Lock Percentage */}
                    {(securityInfo?.data?.goplus?.lockInfo?.lockPercent || launchSecurity?.data?.security?.lock_summary?.lock_percent) && (
                      <div className="bg-black/15 p-4 rounded-lg">
                        <div className="text-sm font-medium mb-2">Lock Percentage</div>
                        <div className="flex items-center gap-4">
                          <div className="relative w-24 h-24">
                            <svg className="w-24 h-24" viewBox="0 0 36 36">
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#444"
                                strokeWidth="1"
                                strokeDasharray="100, 100"
                              />
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="3"
                                strokeDasharray={`${getNumericValue(securityInfo?.data?.goplus?.lockInfo?.lockPercent || 
                                              launchSecurity?.data?.security?.lock_summary?.lock_percent || 0) * 100}, 100`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-bold">{
                                getNumericValue(securityInfo?.data?.goplus?.lockInfo?.lockPercent || 
                                              launchSecurity?.data?.security?.lock_summary?.lock_percent || 0) * 100
                              }%</span>
                              <span className="text-xs">Locked</span>
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-sm">
                                <span>Locked</span>
                                <span>{
                                  getNumericValue(securityInfo?.data?.goplus?.lockInfo?.lockPercent || 
                                                launchSecurity?.data?.security?.lock_summary?.lock_percent || 0) * 100
                                }%</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span>Unlocked</span>
                                <span>{
                                  getNumericValue(securityInfo?.data?.goplus?.lockInfo?.leftLockPercent || 
                                                launchSecurity?.data?.security?.lock_summary?.left_lock_percent || 0) * 100
                                }%</span>
                              </div>
                              {(securityInfo?.data?.goplus?.lockInfo?.lockTag?.length || 
                                launchSecurity?.data?.security?.lock_summary?.lock_tags?.length) && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {securityInfo?.data?.goplus?.lockInfo?.lockTag?.map((tag, idx) => (
                                    <span key={`goplus-${idx}`} className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                                      {tag}
                                    </span>
                                  ))}
                                  {launchSecurity?.data?.security?.lock_summary?.lock_tags?.map((tag, idx) => (
                                    <span key={`launch-${idx}`} className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Burn Information */}
                  <div className="space-y-4">
                    <div className="bg-black/15 p-4 rounded-lg">
                      <div className="text-sm font-medium mb-3">Token Burn Status</div>
                      <div className={`flex flex-col items-center py-3 ${
                        launchSecurity?.data?.security?.burn_status
                          ? 'bg-emerald-500/10 border border-emerald-500/30 rounded-lg'
                          : 'bg-amber-500/10 border border-amber-500/30 rounded-lg'
                      }`}>
                        <div className={`text-xl font-bold ${
                          launchSecurity?.data?.security?.burn_status
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}>
                          {launchSecurity?.data?.security?.burn_status
                            ? 'Token Burn Detected'
                            : 'No Token Burn Detected'
                          }
                        </div>
                        <div className="text-sm mt-1 opacity-80">
                          {launchSecurity?.data?.security?.burn_status
                            ? 'Some tokens have been permanently removed from circulation'
                            : 'No tokens have been burned or removed from circulation'
                          }
                        </div>
                      </div>
                    </div>
                    
                    {/* Burn Ratio */}
                    {launchSecurity?.data?.security?.burn_ratio && (
                      <div className="bg-black/15 p-4 rounded-lg">
                        <div className="text-sm font-medium mb-2">Burn Information</div>
                        <div className="flex items-center gap-4">
                          <div className="relative w-24 h-24">
                            <svg className="w-24 h-24" viewBox="0 0 36 36">
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#444"
                                strokeWidth="1"
                                strokeDasharray="100, 100"
                              />
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="3"
                                strokeDasharray={`${getNumericValue(launchSecurity?.data?.security?.burn_ratio || 0) * 100}, 100`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-bold">{
                                getNumericValue(launchSecurity?.data?.security?.burn_ratio || 0) * 100
                              }%</span>
                              <span className="text-xs">Burned</span>
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="space-y-3">
                              {launchSecurity?.data?.security?.dev_token_burn_amount && (
                                <div>
                                  <div className="text-xs opacity-70">Dev Token Burn Amount</div>
                                  <div className="text-base font-medium">{launchSecurity.data.security.dev_token_burn_amount}</div>
                                </div>
                              )}
                              {launchSecurity?.data?.security?.dev_token_burn_ratio && (
                                <div>
                                  <div className="text-xs opacity-70">Dev Token Burn Ratio</div>
                                  <div className="text-base font-medium">
                                    {formatPercentage(launchSecurity.data.security.dev_token_burn_ratio)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
              
              {/* LP Holders Table */}
              {securityInfo?.data?.goplus?.lp_holders && securityInfo.data.goplus.lp_holders.length > 0 && (
                <GlassCard className="p-6 mb-6">
                  <h2 className="text-lg font-medium mb-4">
                    LP Holders {securityInfo.data.goplus.lp_holder_count && `(${securityInfo.data.goplus.lp_holder_count})`}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-full">
                      <thead className="bg-black/20">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase">Address</th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase">Balance</th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase">Percent</th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase">Tag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {securityInfo.data.goplus.lp_holders.map((holder, idx) => (
                          <tr key={idx} className="hover:bg-white/5">
                            <td className="px-4 py-2 text-sm font-mono">{formatAddress(holder.address)}</td>
                            <td className="px-4 py-2 text-sm">{holder.balance}</td>
                            <td className="px-4 py-2 text-sm">{(parseFloat(holder.percent) * 100).toFixed(2)}%</td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                holder.is_locked === 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {holder.is_locked === 1 ? 'Locked' : 'Unlocked'}
                              </span>
                              {holder.is_contract === 1 && (
                                <span className="ml-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                                  Contract
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm">{holder.tag || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              )}
              
              {/* Lock Detail Information */}
              {((launchSecurity?.data?.security?.lock_summary?.lock_detail && 
                 launchSecurity.data.security.lock_summary.lock_detail.length > 0) ||
                  (securityInfo?.data?.goplus?.lockInfo?.lockDetail && 
                   securityInfo.data.goplus.lockInfo.lockDetail.length > 0)) && (
                <GlassCard className="p-6 mb-6">
                  <h2 className="text-lg font-medium mb-4">Lock Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {launchSecurity?.data?.security?.lock_summary?.lock_detail?.map((lock, idx) => (
                      <div key={`launch-${idx}`} className="bg-black/15 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium">Pool {idx + 1}</div>
                          <div className="text-sm">{formatPercentage(lock.percent)}</div>
                        </div>
                        <div className="text-xs opacity-70 mt-1 break-all">{lock.pool}</div>
                        {lock.is_blackhole && (
                          <div className="mt-2">
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                              Black Hole
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {securityInfo?.data?.goplus?.lockInfo?.lockDetail?.map((lock, idx) => (
                      <div key={`goplus-${idx}`} className="bg-black/15 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium">Pool {idx + 1}</div>
                          <div className="text-sm">{formatPercentage(lock.percent)}</div>
                        </div>
                        <div className="text-xs opacity-70 mt-1 break-all">{lock.pool}</div>
                        {lock.isBlackHole && (
                          <div className="mt-2">
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                              Black Hole
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
              
              {/* Pair Information */}
              {securityInfo?.data?.goplus?.honeypot_data?.pair && (
                <GlassCard className="p-6 mb-6">
                  <h2 className="text-lg font-medium mb-4">Pair Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-black/15 p-4 rounded-lg">
                        <div className="text-xs uppercase tracking-wider opacity-70 mb-2">Pair</div>
                        <div className="text-base font-medium">{securityInfo.data.goplus.honeypot_data.pair.pair.name}</div>
                        <div className="text-xs mt-1 opacity-70 font-mono overflow-hidden text-ellipsis">
                          {securityInfo.data.goplus.honeypot_data.pair.pair.address}
                        </div>
                      </div>
                      
                      <div className="bg-black/15 p-4 rounded-lg">
                        <div className="text-xs uppercase tracking-wider opacity-70 mb-2">Liquidity</div>
                        <div className="text-lg font-medium">${securityInfo.data.goplus.honeypot_data.pair.liquidity.toLocaleString()}</div>
                        <div className="text-xs mt-1 opacity-70">
                          Created: {new Date(parseInt(securityInfo.data.goplus.honeypot_data.pair.createdAtTimestamp) * 1000).toLocaleDateString()}
                        </div>
                        {securityInfo.data.goplus.honeypot_data.pair.creationTxHash && (
                          <div className="text-xs mt-1">
                            <a 
                              href={`https://etherscan.io/tx/${securityInfo.data.goplus.honeypot_data.pair.creationTxHash}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline"
                            >
                              View creation transaction
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-black/15 p-4 rounded-lg">
                        <div className="text-xs uppercase tracking-wider opacity-70 mb-2">Reserves</div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="text-sm">Token0 ({securityInfo.data.goplus.honeypot_data.token.symbol})</div>
                            <div className="text-sm font-mono">{securityInfo.data.goplus.honeypot_data.pair.reserves0}</div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm">Token1 ({securityInfo.data.goplus.honeypot_data.withToken.symbol})</div>
                            <div className="text-sm font-mono">{securityInfo.data.goplus.honeypot_data.pair.reserves1}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-black/15 p-4 rounded-lg">
                        <div className="text-xs uppercase tracking-wider opacity-70 mb-2">Router</div>
                        <div className="text-sm font-mono overflow-hidden text-ellipsis">
                          {securityInfo.data.goplus.honeypot_data.router}
                        </div>
                        <div className="text-xs mt-2 flex flex-wrap gap-2">
                          <span className="px-2 py-0.5 bg-black/20 rounded-full">Type: {securityInfo.data.goplus.honeypot_data.pair.pair.type}</span>
                          <span className="px-2 py-0.5 bg-black/20 rounded-full">Chain: {securityInfo.data.goplus.honeypot_data.chain.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}
            </>
          )}

          {/* Traders Tab */}
          {activeTab === 'traders' && (
            <>
              {/* Token Trading Stats */}
              {tokenStats?.data && (
                <GlassCard className="p-6 mb-6">
                  <h2 className="text-lg font-medium mb-4">Token Trading Statistics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-black/15 p-4 rounded-lg">
                        <div className="text-sm font-medium mb-3">Holder Metrics</div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span>Total Holders</span>
                              <span>{tokenStats.data.holder_count.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-blue-500"
                                style={{ width: '100%' }}
                              ></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span>Bluechip Holders</span>
                              <span>{tokenStats.data.bluechip_owner_count.toLocaleString()} 
                                <span className="text-xs opacity-70 ml-1">
                                  ({formatPercentage(tokenStats.data.bluechip_owner_percentage)})
                                </span>
                              </span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-emerald-500"
                                style={{ width: `${getNumericValue(tokenStats.data.bluechip_owner_percentage, 0) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="bg-black/10 p-3 rounded-lg">
                              <div className="text-xs opacity-70">Signal Count</div>
                              <div className="text-lg font-medium">{tokenStats.data.signal_count.toLocaleString()}</div>
                            </div>
                            <div className="bg-black/10 p-3 rounded-lg">
                              <div className="text-xs opacity-70">Degen Call Count</div>
                              <div className="text-lg font-medium">{tokenStats.data.degen_call_count.toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-black/15 p-4 rounded-lg">
                        <div className="text-sm font-medium mb-3">Top Trader Percentages</div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span>Top Rat Traders</span>
                              <span>{formatPercentage(tokenStats.data.top_rat_trader_percentage)}</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-purple-500"
                                style={{ width: `${getNumericValue(tokenStats.data.top_rat_trader_percentage, 0) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span>Top Bundler Traders</span>
                              <span>{formatPercentage(tokenStats.data.top_bundler_trader_percentage)}</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-blue-500"
                                style={{ width: `${getNumericValue(tokenStats.data.top_bundler_trader_percentage, 0) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span>Top Entrapment Traders</span>
                              <span>{formatPercentage(tokenStats.data.top_entrapment_trader_percentage)}</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-amber-500"
                                style={{ width: `${getNumericValue(tokenStats.data.top_entrapment_trader_percentage, 0) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-black/15 p-4 rounded-lg">
                        <div className="text-sm font-medium mb-3">What These Metrics Mean</div>
                        <div className="space-y-2 text-sm opacity-80">
                          <p><span className="font-medium text-purple-400">Rat Traders</span>: Traders who frequently move in and out of positions quickly.</p>
                          <p><span className="font-medium text-blue-400">Bundler Traders</span>: Traders who execute multiple transactions together.</p>
                          <p><span className="font-medium text-amber-400">Entrapment Traders</span>: Traders who use strategies to influence token price.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}
              {/* Traders Tab content - only showing token trading statistics, 
                   Wallet by Maker Tags and Top Traders sections have been moved to the Wallets tab */}
            </>
          )}
        </>
      )}

      {/* Raw Data Display */}
      {analysisComplete && showAllData && (
        <div className="mt-8 space-y-6">
          <GlassCard className="p-6 backdrop-blur-md bg-black/30 border border-white/10">
            <h2 className="text-lg font-medium mb-4 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Raw API Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {securityInfo && (
                <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10">
                  <h3 className="text-base font-medium mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Security Info
                  </h3>
                  <pre className="bg-black/30 p-4 rounded-lg text-xs overflow-auto max-h-[400px] border border-white/5 font-mono text-gray-300">
                    {JSON.stringify(securityInfo, null, 2)}
                  </pre>
                </div>
              )}
              {rugAnalysis && (
                <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10">
                  <h3 className="text-base font-medium mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Rug Analysis
                  </h3>
                  <pre className="bg-black/30 p-4 rounded-lg text-xs overflow-auto max-h-[400px] border border-white/5 font-mono text-gray-300">
                    {JSON.stringify(rugAnalysis, null, 2)}
                  </pre>
                </div>
              )}
              {launchSecurity && (
                <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10">
                  <h3 className="text-base font-medium mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Launch Security
                  </h3>
                  <pre className="bg-black/30 p-4 rounded-lg text-xs overflow-auto max-h-[400px] border border-white/5 font-mono text-gray-300">
                    {JSON.stringify(launchSecurity, null, 2)}
                  </pre>
                </div>
              )}
              {tokenStats && (
                <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10">
                  <h3 className="text-base font-medium mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    Token Stats
                  </h3>
                  <pre className="bg-black/30 p-4 rounded-lg text-xs overflow-auto max-h-[400px] border border-white/5 font-mono text-gray-300">
                    {JSON.stringify(tokenStats, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {error && (
        <div className="mt-6 bg-red-900/20 border border-red-500/30 text-red-300 rounded-lg p-4 text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default TokenInvestigation; 