'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';

interface SecurityIssue {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: string;
}

interface RawSecurityIssue {
  title: string;
  description: string;
  impact: string;
  confidence: string;
}

interface LPHolder {
  address: string;
  tag: string;
  value: any;
  is_contract: number;
  balance: string;
  percent: string;
  NFT_list: any;
  is_locked: number;
  status: string;
}

interface TokenHolder {
  address: string;
  tag: string;
  is_contract: number;
  balance: string;
  percent: string;
  is_locked: number;
}

interface DexInfo {
  liquidity_type: string;
  name: string;
  liquidity: string;
  pair: string;
  poolManager?: string;
}

interface RiskFactor {
  type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  status: boolean;
  isSafe: boolean;
}

interface AnalysisData {
  name: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
  verified: boolean;
  creationDate: string;
  creator: string;
  holders: number;
  transactions: number;
  marketCap: string;
  riskLevel: string;
  buyTax: string;
  sellTax: string;
  riskFactors: RiskFactor[];
  cexListings: string[];
  topHolders: TokenHolder[];
  lpHolders: LPHolder[];
  lpTotalSupply: string;
  lpHolderCount: string;
  dexInfo: DexInfo[];
  contractName: string;
  compiler: string;
  securityIssues: SecurityIssue[];
}

interface DexLiquidityInfo {
  name: string;
  liquidity_type: string;
  liquidity: string;
  pair: string;
}

interface SecurityAnalysis {
  title: string;
  value: string;
  description: string;
}

interface TradingIndicator {
  title: string;
  value: string;
  description: string;
}

interface WalletInfo {
  address: string;
  buy_volume_cur: number;
  sell_volume_cur: number;
  buy_tx_count_cur: number;
  sell_tx_count_cur: number;
  netflow_usd: number;
  profit: number;
  last_active_timestamp: number;
  is_suspicious: boolean;
  is_new: boolean;
  transfer_in: boolean;
  twitter_username: string;
  tags: string[];
  maker_token_tags: string[];
  wallet_tag_v2: string;
  tag_rank: Record<string, any>;
}

interface RiskAnalysis {
  token_name: string;
  token_symbol: string;
  chain_id: string;
  total_supply: string;
  holder_count: string;
  lp_holder_count: string;
  creator_address: string;
  creator_balance: string;
  creator_percent: string;
  owner_address: string;
  owner_balance: string;
  owner_percent: string;
  security_anaylsis: Record<string, SecurityAnalysis>;
  tax_and_trading_info: {
    buy_tax: string;
    sell_tax: string;
    trading_indicators: Record<string, TradingIndicator>;
  };
  dex_liquidity_info: DexLiquidityInfo[];
  lp_holders_analysis: LPHolder[];
}

interface RugTraceData {
  overview: {
    token_overview: {
      name: string;
      symbol: string;
      image_url: string;
      price_usd: string;
      total_supply: string;
    };
    holder_statistics: {
      total_holders: number;
      bluechip_owners: number;
      bluechip_owner_percentage: string;
    };
    trading_activity: {
      signal_count: number;
      degen_call_count: number;
    };
    trader_analysis: {
      top_rat_trader_percentage: string;
      top_bundler_trader_percentage: string;
      top_entrapment_trader_percentage: string;
    };
    risk_assessment: {
      high_rat_trader: boolean;
      high_bundler_trader: boolean;
      high_entrapment_trader: boolean;
      high_degen_calls: boolean;
      low_bluechip_owners: boolean;
    };
  };
  risk_analysis: RiskAnalysis;
  wallets_involved: WalletInfo[];
  liquidity: {
    health_score: {
      score: number;
      status: string;
    };
    metrics: {
      top_10_holders: string;
      lp_locked: string;
      buy_tax: string;
      sell_tax: string;
    };
    lock_details: {
      lock_status: string;
      lock_percentage: string;
    };
    lp_holders: LPHolder[];
    address: string;
  };
  past_rugs: {
    token_info: {
      description: string;
    };
    social_links: {
      website: string;
      twitter_username: string;
      telegram: string;
    };
    analytics: {
      geckoterminal: string;
    };
    community_voting: {
      likes: number;
      dislikes: number;
    };
    rug_status: {
      is_rug_pull: boolean;
      rug_info: any;
    };
  };
}

export default function Example() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [rugTraceData, setRugTraceData] = useState<RugTraceData | null>(null);
  const [activeTab, setActiveTab] = useState<'codeReveal' | 'rugTrace'>('codeReveal');
  const { isConnected, connectWallet, userProfile, updateCredits } = useWallet();
  const [showAllWallets, setShowAllWallets] = useState(false);

  // Mock function to validate Ethereum address
  const isValidAddress = (addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  // Function to analyze contract
  const analyzeContract = async (addr: string): Promise<void> => {
    if (!isConnected) {
      setError('Please connect your wallet to use this service.');
      return;
    }
    
    if (!userProfile || userProfile.credits < 2) {
      setError('Insufficient credits. Required: 2');
      return;
    }

    if (!isValidAddress(addr)) {
      setError('Please enter a valid Ethereum contract address');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisData(null);
    setRugTraceData(null);

    try {
      await updateCredits(-2);
      
      // Fetch both Code Reveal and Rug Trace data in parallel
      const [codeRevealResponse, rugTraceResponse] = await Promise.all([
        fetch('https://api.traceonai.io/codereveal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_TRACEON_API_KEY || 'e445a866-530b-4d9c-9f03-0fa5a2bb24d2',
          },
          body: JSON.stringify({
            address: addr,
            chainId: "1"
          })
        }),
        fetch('https://api.traceonai.io/rugtrace', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_TRACEON_API_KEY || 'e0d5e4f1-cbcb-42e4-9ecd-e17be007c9fc',
          },
          body: JSON.stringify({
            address: addr
          })
        })
      ]);

      if (!codeRevealResponse.ok || !rugTraceResponse.ok) {
        throw new Error('Failed to fetch contract data');
      }

      const [codeRevealData, rugTraceData] = await Promise.all([
        codeRevealResponse.json(),
        rugTraceResponse.json()
      ]);

      // Transform API response to match our UI format
      const transformedData: AnalysisData = {
        name: codeRevealData.result.overview.token_name,
        symbol: codeRevealData.result.overview.token_symbol,
        totalSupply: codeRevealData.result.overview.total_supply,
        decimals: 18,
        verified: codeRevealData.result.security.is_open_source === "1",
        creationDate: new Date().toISOString().split('T')[0],
        creator: codeRevealData.result.overview.creator_info.creator_address,
        holders: parseInt(codeRevealData.result.overview.holder_count),
        transactions: 0,
        marketCap: "N/A",
        riskLevel: codeRevealData.result.overview.security_risk.level.split(' ')[0],
        buyTax: codeRevealData.result.overview.buy_tax,
        sellTax: codeRevealData.result.overview.sell_tax,
        contractName: codeRevealData.result.advanced?.contractName || 'Unknown',
        compiler: codeRevealData.result.advanced?.compiler || 'Unknown',
        securityIssues: (codeRevealData.result.advanced?.securityAnalysis?.issues || []).map((issue: RawSecurityIssue) => ({
          ...issue,
          impact: issue.impact.toLowerCase() as 'high' | 'medium' | 'low'
        })),
        cexListings: codeRevealData.result.overview.is_in_cex.listed === "1" ? codeRevealData.result.overview.is_in_cex.cex_list : [],
        topHolders: codeRevealData.result.holders.token_holders,
        lpHolders: codeRevealData.result.holders.lp_holders,
        lpTotalSupply: codeRevealData.result.holders.lp_total_supply,
        lpHolderCount: codeRevealData.result.holders.lp_holder_count,
        dexInfo: codeRevealData.result.trading.dex,
        riskFactors: [
          {
            type: "Honeypot",
            severity: "high" as const,
            description: "Contract appears to be a honeypot",
            status: true,
            isSafe: codeRevealData.result.security.is_honeypot === "0"
          },
          {
            type: "Hidden Owner",
            severity: "high" as const,
            description: "Contract has hidden owner functionality",
            status: true,
            isSafe: codeRevealData.result.security.hidden_owner === "0"
          },
          {
            type: "Ownership Control",
            severity: "high" as const,
            description: "Contract ownership can be reclaimed",
            status: true,
            isSafe: codeRevealData.result.security.can_take_back_ownership === "0"
          },
          {
            type: "Self-Destruct",
            severity: "high" as const,
            description: "Contract can be self-destructed",
            status: true,
            isSafe: codeRevealData.result.security.selfdestruct === "0"
          },
          {
            type: "Blacklist",
            severity: "medium" as const,
            description: "Contract contains blacklist functionality",
            status: true,
            isSafe: codeRevealData.result.security.is_blacklisted === "0"
          },
          {
            type: "Trading Restriction",
            severity: "medium" as const,
            description: "Cannot sell all tokens at once",
            status: true,
            isSafe: codeRevealData.result.security.cannot_sell_all === "0"
          },
          {
            type: "Supply Control",
            severity: "medium" as const,
            description: "Token supply can be increased through minting",
            status: true,
            isSafe: codeRevealData.result.security.is_mintable === "0"
          },
          {
            type: "Transfer Control",
            severity: "medium" as const,
            description: "Token transfers can be paused",
            status: true,
            isSafe: codeRevealData.result.security.transfer_pausable === "0"
          },
          {
            type: "Anti-Whale",
            severity: "low" as const,
            description: "Contract has anti-whale mechanisms",
            status: true,
            isSafe: codeRevealData.result.security.is_anti_whale === "0"
          },
          {
            type: "Proxy Implementation",
            severity: "medium" as const,
            description: "Contract is a proxy contract",
            status: true,
            isSafe: codeRevealData.result.security.is_proxy === "0"
          }
        ].filter(factor => factor.status) // Only show active risk factors
      };

      // Set Rug Trace data
      setRugTraceData(rugTraceData);

      // Set transformed data
      setAnalysisData(transformedData);
    } catch (error) {
      console.error('Error analyzing contract:', error);
      setError('Failed to analyze contract. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await analyzeContract(address);
  };

  return (
    <div className="min-h-screen w-full bg-black text-[#00ff41] relative overflow-hidden font-mono">
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDI2MDAiIGZpbGwtb3BhY2l0eT0iMC4yIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJWNmgydjR6bS00IDI0aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHptMC02aC0yVjZoMnY0em0tOCAxOGgtMnYtNGgydjR6bTAtNmgtMnYtNGgydjR6bTAtNmgtMnYtNGgydjR6bTAtNmgtMlY2aDJ2NHptLTQgMjRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJWNmgydjR6bS04IDE4aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHptMC02aC0yVjZoMnY0em0tNCAxOGgtMnYtNGgydjR6bTAtNmgtMnYtNGgydjR6bTAtNmgtMnYtNGgydjR6bTAtNmgtMlY2aDJ2NHptLTggMThoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJWNmgydjR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
      
      {/* Animated background elements */}
      <motion.div 
        className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#00ff41]/5 rounded-full blur-[100px] opacity-30"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.4, 0.3]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 15,
          ease: "easeInOut" 
        }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-[#00ff41]/5 rounded-full blur-[100px] opacity-20"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.3, 0.2]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 18,
          ease: "easeInOut",
          delay: 2
        }}
      />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-[#00ff41]/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-black border border-[#00ff41] rounded-none flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00ff41]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#00ff41] uppercase tracking-widest">
                SYNTHR
              </h1>
              <p className="text-xs text-[#00ff41]/50 uppercase tracking-wider">Contract Analyzer v1.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {!isConnected ? (
              <motion.button 
                onClick={connectWallet}
                className="bg-black border border-[#00ff41] hover:bg-[#00ff41]/10 text-[#00ff41] px-5 py-2 text-sm font-bold uppercase tracking-wider"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Connect Wallet
              </motion.button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="px-4 py-1 border border-[#00ff41]/30 bg-[#00ff41]/5 text-sm uppercase tracking-wider">
                  {userProfile?.credits || 0} Credits
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.h1 
            className="text-5xl font-bold mb-4 text-[#00ff41] uppercase tracking-widest"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            CONTRACT SCANNER
          </motion.h1>
          <motion.div 
            className="h-1 w-40 mx-auto bg-[#00ff41]/50 mb-6"
            initial={{ width: 0 }}
            animate={{ width: 160 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
          <motion.p 
            className="text-lg max-w-2xl mx-auto text-[#00ff41]/70 uppercase tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Analyze Ethereum contracts for security vulnerabilities and risks
          </motion.p>
        </div>

        {/* Search Form */}
        <motion.div 
          className="border border-[#00ff41]/30 bg-[#00ff41]/5 rounded-none p-6 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="address" className="block text-sm font-medium mb-2 text-[#00ff41]/70 uppercase tracking-wider">
                Contract Address
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-black border border-[#00ff41]/30 text-[#00ff41] placeholder-[#00ff41]/30 focus:outline-none focus:border-[#00ff41] transition-all uppercase font-mono"
              />
            </div>
            <div className="md:self-end">
              <motion.button 
                type="submit"
                disabled={loading}
                className="w-full md:w-auto bg-black border border-[#00ff41] hover:bg-[#00ff41]/10 text-[#00ff41] px-6 py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {loading ? 'ANALYZING...' : 'ANALYZE CONTRACT'}
              </motion.button>
            </div>
          </form>
          {error && (
            <motion.div 
              className="mt-4 border border-red-500/30 bg-red-500/5 p-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-red-500 text-sm uppercase tracking-wider">{error}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Tab Navigation */}
        {(analysisData || rugTraceData) && !loading && (
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('codeReveal')}
              className={`px-6 py-3 uppercase tracking-wider font-bold border ${
                activeTab === 'codeReveal'
                  ? 'border-[#00ff41] bg-[#00ff41]/10'
                  : 'border-[#00ff41]/30 hover:border-[#00ff41]/60'
              }`}
            >
              Code Reveal
            </button>
            <button
              onClick={() => setActiveTab('rugTrace')}
              className={`px-6 py-3 uppercase tracking-wider font-bold border ${
                activeTab === 'rugTrace'
                  ? 'border-[#00ff41] bg-[#00ff41]/10'
                  : 'border-[#00ff41]/30 hover:border-[#00ff41]/60'
              }`}
            >
              Rug Trace
            </button>
          </div>
        )}

        {/* Tab Content */}
        {!loading && (
          <>
            {/* Code Reveal Content */}
            {activeTab === 'codeReveal' && analysisData && (
              <div className="space-y-8">
                {/* Overview Card */}
                <motion.div 
                  className="border border-[#00ff41]/30 bg-[#00ff41]/5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="bg-[#00ff41]/10 px-6 py-4 border-b border-[#00ff41]/30 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#00ff41] uppercase tracking-wider">
                      CONTRACT OVERVIEW
                    </h2>
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      analysisData.riskLevel === 'Low' ? 'border border-green-500 text-green-500' :
                      analysisData.riskLevel === 'Medium' ? 'border border-yellow-500 text-yellow-500' :
                      'border border-red-500 text-red-500'
                    }`}>
                      {analysisData.riskLevel} RISK
                    </span>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm uppercase font-bold mb-4 text-[#00ff41]/50 tracking-wider">
                          TOKEN INFORMATION
                        </h3>
                        <div className="space-y-4">
                          <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4 hover:border-[#00ff41]/40 transition-all">
                            <div className="flex justify-between">
                              <span className="text-sm text-[#00ff41]/50 uppercase tracking-wider">Name</span>
                              <span className="font-bold">{analysisData.name}</span>
                            </div>
                          </div>
                          <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4 hover:border-[#00ff41]/40 transition-all">
                            <div className="flex justify-between">
                              <span className="text-sm text-[#00ff41]/50 uppercase tracking-wider">Symbol</span>
                              <span className="font-bold">{analysisData.symbol}</span>
                            </div>
                          </div>
                          <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4 hover:border-[#00ff41]/40 transition-all">
                            <div className="flex justify-between">
                              <span className="text-sm text-[#00ff41]/50 uppercase tracking-wider">Total Supply</span>
                              <span className="font-bold">{analysisData.totalSupply}</span>
                            </div>
                          </div>
                          <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4 hover:border-[#00ff41]/40 transition-all">
                            <div className="flex justify-between">
                              <span className="text-sm text-[#00ff41]/50 uppercase tracking-wider">Decimals</span>
                              <span className="font-bold">{analysisData.decimals}</span>
                            </div>
                          </div>
                          <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4 hover:border-[#00ff41]/40 transition-all">
                            <div className="flex justify-between">
                              <span className="text-sm text-[#00ff41]/50 uppercase tracking-wider">Buy Tax</span>
                              <span className="font-bold">{analysisData.buyTax}%</span>
                            </div>
                          </div>
                          <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4 hover:border-[#00ff41]/40 transition-all">
                            <div className="flex justify-between">
                              <span className="text-sm text-[#00ff41]/50 uppercase tracking-wider">Sell Tax</span>
                              <span className="font-bold">{analysisData.sellTax}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm uppercase font-bold mb-4 text-[#00ff41]/50 tracking-wider">
                          MARKET DATA
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4 hover:border-[#00ff41]/40 transition-all">
                            <div className="text-sm text-[#00ff41]/50 mb-1 uppercase tracking-wider">Holders</div>
                            <div className="text-xl font-bold">{analysisData.holders.toLocaleString()}</div>
                          </div>
                          <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4 hover:border-[#00ff41]/40 transition-all">
                            <div className="text-sm text-[#00ff41]/50 mb-1 uppercase tracking-wider">Transactions</div>
                            <div className="text-xl font-bold">{analysisData.transactions.toLocaleString()}</div>
                          </div>
                          <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4 hover:border-[#00ff41]/40 transition-all">
                            <div className="text-sm text-[#00ff41]/50 mb-1 uppercase tracking-wider">Market Cap</div>
                            <div className="text-xl font-bold">{analysisData.marketCap || 'N/A'}</div>
                          </div>
                          <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4 hover:border-[#00ff41]/40 transition-all">
                            <div className="text-sm text-[#00ff41]/50 mb-1 uppercase tracking-wider">Verified</div>
                            <div className="text-xl font-bold">{analysisData.verified ? 'YES' : 'NO'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Risk Analysis Card */}
                <motion.div 
                  className="border border-[#00ff41]/30 bg-[#00ff41]/5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="bg-[#00ff41]/10 px-6 py-4 border-b border-[#00ff41]/30">
                    <h2 className="text-xl font-bold text-[#00ff41] uppercase tracking-wider">
                      SECURITY ANALYSIS
                    </h2>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {analysisData.riskFactors.map((factor, index) => (
                      <motion.div 
                        key={index}
                        className={`border p-4 ${
                          factor.isSafe 
                            ? 'border-green-500 bg-green-500/5'
                            : factor.severity === 'high' 
                              ? 'border-red-500 bg-red-500/5'
                              : factor.severity === 'medium'
                                ? 'border-yellow-500 bg-yellow-500/5'
                                : 'border-orange-500 bg-orange-500/5'
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold uppercase tracking-wider">{factor.type}</h3>
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 text-xs uppercase tracking-wider ${
                              factor.isSafe
                                ? 'border border-green-500 text-green-500'
                                : factor.severity === 'high'
                                  ? 'border border-red-500 text-red-500'
                                  : factor.severity === 'medium'
                                    ? 'border border-yellow-500 text-yellow-500'
                                    : 'border border-orange-500 text-orange-500'
                            }`}>
                              {factor.isSafe ? 'SAFE' : `${factor.severity.toUpperCase()} RISK`}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-[#00ff41]/70 uppercase tracking-wide">
                          {factor.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Exchange Listings & Holders */}
                <motion.div 
                  className="border border-[#00ff41]/30 bg-[#00ff41]/5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="bg-[#00ff41]/10 px-6 py-4 border-b border-[#00ff41]/30">
                    <h2 className="text-xl font-bold text-[#00ff41] uppercase tracking-wider">
                      EXCHANGE LISTINGS & HOLDERS
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* CEX Listings */}
                      <div>
                        <h3 className="text-sm uppercase font-bold mb-4 text-[#00ff41]/50 tracking-wider">
                          CENTRALIZED EXCHANGES
                        </h3>
                        <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                          {analysisData.cexListings && analysisData.cexListings.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {analysisData.cexListings.map((cex: string, index: number) => (
                                <div key={index} className="border border-[#00ff41]/30 p-2 text-center">
                                  <span className="text-sm font-bold uppercase tracking-wider">{cex}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-[#00ff41]/70 uppercase tracking-wide text-center">
                              No CEX listings found
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Top Holders */}
                      <div>
                        <h3 className="text-sm uppercase font-bold mb-4 text-[#00ff41]/50 tracking-wider">
                          TOP HOLDERS
                        </h3>
                        <div className="space-y-2">
                          {analysisData.topHolders && analysisData.topHolders.map((holder: TokenHolder, index: number) => (
                            <div key={index} className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="text-sm font-mono">{holder.address.slice(0, 6)}...{holder.address.slice(-4)}</div>
                                  {holder.tag && (
                                    <span className="text-xs text-[#00ff41]/50 uppercase tracking-wider">{holder.tag}</span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold">{holder.percent}%</div>
                                  <div className="text-xs text-[#00ff41]/50">{holder.balance} tokens</div>
                                </div>
                              </div>
                              {holder.is_locked && (
                                <div className="mt-2 text-xs">
                                  <span className="border border-green-500 text-green-500 px-2 py-1 uppercase tracking-wider">Locked</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* DEX Information */}
                <motion.div 
                  className="border border-[#00ff41]/30 bg-[#00ff41]/5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="bg-[#00ff41]/10 px-6 py-4 border-b border-[#00ff41]/30">
                    <h2 className="text-xl font-bold text-[#00ff41] uppercase tracking-wider">
                      DECENTRALIZED EXCHANGES
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-4">
                      {analysisData.dexInfo.map((dex, index) => (
                        <div key={index} className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold uppercase tracking-wider">{dex.name}</h3>
                                <span className={`text-xs px-2 py-1 uppercase tracking-wider ${
                                  dex.liquidity_type === 'UniV2' ? 'border border-blue-500 text-blue-500' :
                                  dex.liquidity_type === 'UniV3' ? 'border border-purple-500 text-purple-500' :
                                  'border border-pink-500 text-pink-500'
                                }`}>
                                  {dex.liquidity_type}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm font-mono text-[#00ff41]/70">{dex.pair}</p>
                                {dex.poolManager && (
                                  <span className="text-xs text-[#00ff41]/50">Pool Manager: {dex.poolManager}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="text-lg font-bold">{parseFloat(dex.liquidity).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6
                              })}</div>
                              <span className="text-sm text-[#00ff41]/70">Liquidity</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {analysisData.dexInfo.length === 0 && (
                        <p className="text-center text-[#00ff41]/70 uppercase tracking-wide p-4">
                          No DEX listings found
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* LP Holders */}
                <motion.div 
                  className="border border-[#00ff41]/30 bg-[#00ff41]/5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="bg-[#00ff41]/10 px-6 py-4 border-b border-[#00ff41]/30">
                    <h2 className="text-xl font-bold text-[#00ff41] uppercase tracking-wider flex justify-between items-center">
                      <span>LP HOLDERS</span>
                      <span className="text-sm">Total Supply: {analysisData.lpTotalSupply}</span>
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {analysisData.lpHolders.map((holder, index) => (
                        <div key={index} className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{holder.address.slice(0, 6)}...{holder.address.slice(-4)}</span>
                                {holder.tag && (
                                  <span className="text-xs px-2 py-1 bg-[#00ff41]/10 border border-[#00ff41]/30">
                                    {holder.tag}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-[#00ff41]/70 mt-1">
                                {holder.is_contract ? 'Contract' : 'EOA'}
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="text-lg font-bold">{(parseFloat(holder.percent) * 100).toFixed(4)}%</div>
                              <div className="text-sm text-[#00ff41]/70">{holder.balance} LP</div>
                              {holder.is_locked === 1 && (
                                <span className="mt-1 text-xs px-2 py-1 border border-green-500 text-green-500">
                                  LOCKED
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Advanced Security Analysis */}
                <motion.div 
                  className="border border-[#00ff41]/30 bg-[#00ff41]/5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="bg-[#00ff41]/10 px-6 py-4 border-b border-[#00ff41]/30">
                    <h2 className="text-xl font-bold text-[#00ff41] uppercase tracking-wider flex justify-between items-center">
                      <span>SECURITY ANALYSIS</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Contract: {analysisData.contractName}</span>
                        <span>Compiler: {analysisData.compiler}</span>
                      </div>
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {analysisData.securityIssues.map((issue, index) => (
                        <motion.div 
                          key={index}
                          className={`border p-4 ${
                            issue.impact.toLowerCase() === 'high' ? 'border-red-500 bg-red-500/5' :
                            issue.impact.toLowerCase() === 'medium' ? 'border-yellow-500 bg-yellow-500/5' :
                            'border-green-500 bg-green-500/5'
                          }`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold uppercase tracking-wider">{issue.title}</h3>
                            <div className="flex gap-2">
                              <span className={`px-2 py-1 text-xs uppercase tracking-wider ${
                                issue.impact.toLowerCase() === 'high' ? 'border border-red-500 text-red-500' :
                                issue.impact.toLowerCase() === 'medium' ? 'border border-yellow-500 text-yellow-500' :
                                'border border-green-500 text-green-500'
                              }`}>
                                {issue.impact} Impact
                              </span>
                              <span className="px-2 py-1 text-xs border border-[#00ff41] uppercase tracking-wider">
                                {issue.confidence} Confidence
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-[#00ff41]/70 whitespace-pre-line">
                            {issue.description}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Binary visualization - added for cyberpunk effect */}
                <motion.div 
                  className="border border-[#00ff41]/30 bg-[#00ff41]/5 p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h2 className="text-xl font-bold text-[#00ff41] uppercase tracking-wider mb-4">
                    BINARY SIGNATURE
                  </h2>
                  <div className="overflow-hidden h-20 font-mono text-xs leading-none tracking-tighter">
                    {Array.from({ length: 20 }).map((_, rowIndex) => (
                      <div key={rowIndex} className="flex">
                        {Array.from({ length: 100 }).map((_, colIndex) => {
                          // Use indices to determine the value and opacity deterministically
                          const value = (rowIndex + colIndex) % 2 === 0 ? '1' : '0';
                          const initialOpacity = (rowIndex * colIndex) % 3 === 0 ? 0.9 : 0.3;
                          const targetOpacity = initialOpacity === 0.9 ? 0.3 : 0.9;
                          
                          return (
                            <motion.span 
                              key={`${rowIndex}-${colIndex}`}
                              className="text-[#00ff41]/70"
                              initial={{ opacity: initialOpacity }}
                              animate={{ opacity: targetOpacity }}
                              transition={{ 
                                repeat: Infinity, 
                                duration: 1 + ((rowIndex + colIndex) % 4),
                                repeatType: 'reverse'
                              }}
                            >
                              {value}
                            </motion.span>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

            {/* Rug Trace Content */}
            {activeTab === 'rugTrace' && rugTraceData && (
              <div className="space-y-8">
                {/* Token Overview */}
                <motion.div 
                  className="border border-[#00ff41]/30 bg-[#00ff41]/5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="bg-[#00ff41]/10 px-6 py-4 border-b border-[#00ff41]/30">
                    <h2 className="text-xl font-bold text-[#00ff41] uppercase tracking-wider">
                      Token Overview
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      {rugTraceData.overview.token_overview.image_url && (
                        <img 
                          src={rugTraceData.overview.token_overview.image_url} 
                          alt={rugTraceData.overview.token_overview.name}
                          className="w-32 h-32 object-contain border border-[#00ff41]/30 p-2"
                        />
                      )}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                          <div className="text-sm text-[#00ff41]/50 mb-1">Price USD</div>
                          <div className="text-xl font-bold">${parseFloat(rugTraceData.overview.token_overview.price_usd).toLocaleString()}</div>
                        </div>
                        <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                          <div className="text-sm text-[#00ff41]/50 mb-1">Total Supply</div>
                          <div className="text-xl font-bold">{parseFloat(rugTraceData.overview.token_overview.total_supply).toLocaleString()}</div>
                        </div>
                        <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                          <div className="text-sm text-[#00ff41]/50 mb-1">Total Holders</div>
                          <div className="text-xl font-bold">{rugTraceData.overview.holder_statistics.total_holders.toLocaleString()}</div>
                        </div>
                        <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                          <div className="text-sm text-[#00ff41]/50 mb-1">Bluechip Owners</div>
                          <div className="text-xl font-bold">{rugTraceData.overview.holder_statistics.bluechip_owners.toLocaleString()}</div>
                          <div className="text-sm text-[#00ff41]/50 mt-1">
                            ({(parseFloat(rugTraceData.overview.holder_statistics.bluechip_owner_percentage) * 100).toFixed(2)}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Tax & Trading Information - NEW SECTION */}
                <motion.div 
                  className="border border-[#00ff41]/30 bg-[#00ff41]/5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="bg-[#00ff41]/10 px-6 py-4 border-b border-[#00ff41]/30">
                    <h2 className="text-xl font-bold text-[#00ff41] uppercase tracking-wider">
                      Tax & Trading Information
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm uppercase font-bold mb-4 text-[#00ff41]/50 tracking-wider">
                          Tax Information
                        </h3>
                        <div className="space-y-4">
                          <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-[#00ff41]/70">Buy Tax</span>
                              <span className="text-xl font-bold">{rugTraceData.risk_analysis.tax_and_trading_info.buy_tax}%</span>
                            </div>
                          </div>
                          <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-[#00ff41]/70">Sell Tax</span>
                              <span className="text-xl font-bold">{rugTraceData.risk_analysis.tax_and_trading_info.sell_tax}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm uppercase font-bold mb-4 text-[#00ff41]/50 tracking-wider">
                          Trading Indicators
                        </h3>
                        <div className="space-y-4">
                          {Object.entries(rugTraceData.risk_analysis.tax_and_trading_info.trading_indicators).map(([key, indicator]: [string, any]) => (
                            <div 
                              key={key} 
                              className={`border p-4 ${
                                indicator.value === 'Safe' ? 'border-green-500 bg-green-500/5' : 'border-red-500 bg-red-500/5'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-sm font-bold">{indicator.title}</span>
                                <span className={`px-2 py-1 text-xs uppercase ${
                                  indicator.value === 'Safe' ? 'border border-green-500 text-green-500' : 'border border-red-500 text-red-500'
                                }`}>
                                  {indicator.value}
                                </span>
                              </div>
                              <p className="text-xs text-[#00ff41]/70 mt-2">{indicator.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Risk Analysis */}
                <motion.div 
                  className="border border-[#00ff41]/30 bg-[#00ff41]/5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="bg-[#00ff41]/10 px-6 py-4 border-b border-[#00ff41]/30">
                    <h2 className="text-xl font-bold text-[#00ff41] uppercase tracking-wider">
                      Risk Analysis
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm uppercase font-bold mb-4 text-[#00ff41]/50 tracking-wider">
                          Security Analysis
                        </h3>
                        <div className="space-y-4">
                          {Object.entries(rugTraceData.risk_analysis.security_anaylsis).map(([key, value]: [string, any]) => (
                            <div key={key} className={`border p-4 ${
                              value.value === 'Safe' ? 'border-green-500 bg-green-500/5' : 'border-red-500 bg-red-500/5'
                            }`}>
                              <div className="flex justify-between items-start">
                                <span className="text-sm font-bold">{value.title}</span>
                                <span className={`px-2 py-1 text-xs uppercase ${
                                  value.value === 'Safe' ? 'border border-green-500 text-green-500' : 'border border-red-500 text-red-500'
                                }`}>
                                  {value.value}
                                </span>
                              </div>
                              <p className="text-xs text-[#00ff41]/70 mt-2">{value.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm uppercase font-bold mb-4 text-[#00ff41]/50 tracking-wider">
                          Trading Indicators
                        </h3>
                        <div className="space-y-4">
                          {Object.entries(rugTraceData.risk_analysis.tax_and_trading_info.trading_indicators).map(([key, value]: [string, any]) => (
                            <div 
                              key={key} 
                              className={`border p-4 ${
                                value.value === 'Safe' ? 'border-green-500 bg-green-500/5' : 'border-red-500 bg-red-500/5'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-sm font-bold">{value.title}</span>
                                <span className={`px-2 py-1 text-xs uppercase ${
                                  value.value === 'Safe' ? 'border border-green-500 text-green-500' : 'border border-red-500 text-red-500'
                                }`}>
                                  {value.value}
                                </span>
                              </div>
                              <p className="text-xs text-[#00ff41]/70 mt-2">{value.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Wallets Involved */}
                <motion.div 
                  className="border border-[#00ff41]/30 bg-[#00ff41]/5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="bg-[#00ff41]/10 px-6 py-4 border-b border-[#00ff41]/30">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-[#00ff41] uppercase tracking-wider">
                        Notable Wallets
                      </h2>
                      <motion.button
                        onClick={() => setShowAllWallets(!showAllWallets)}
                        className="px-4 py-2 border border-[#00ff41] text-sm uppercase tracking-wider hover:bg-[#00ff41]/10"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {showAllWallets ? 'Show Less' : 'Show All'}
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {rugTraceData.wallets_involved
                        .slice(0, showAllWallets ? undefined : 5)
                        .map((wallet, index) => (
                        <div key={index} className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
                                {wallet.tags.map((tag, tagIndex) => (
                                  <span key={tagIndex} className="px-2 py-1 text-xs border border-[#00ff41]/30 bg-[#00ff41]/10">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-[#00ff41]/50">Buy Volume:</span>
                                  <span className="ml-2">${wallet.buy_volume_cur.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-[#00ff41]/50">Sell Volume:</span>
                                  <span className="ml-2">${wallet.sell_volume_cur.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-[#00ff41]/50">Buy Tx Count:</span>
                                  <span className="ml-2">{wallet.buy_tx_count_cur}</span>
                                </div>
                                <div>
                                  <span className="text-[#00ff41]/50">Sell Tx Count:</span>
                                  <span className="ml-2">{wallet.sell_tx_count_cur}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold ${wallet.profit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {wallet.profit > 0 ? '+' : ''}{wallet.profit.toLocaleString()} USD
                              </div>
                              <div className="text-sm text-[#00ff41]/50">Profit/Loss</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!showAllWallets && rugTraceData.wallets_involved.length > 5 && (
                        <div className="text-center text-sm text-[#00ff41]/70 pt-2">
                          {rugTraceData.wallets_involved.length - 5} more wallets not shown
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Liquidity Analysis */}
                <motion.div 
                  className="border border-[#00ff41]/30 bg-[#00ff41]/5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="bg-[#00ff41]/10 px-6 py-4 border-b border-[#00ff41]/30">
                    <h2 className="text-xl font-bold text-[#00ff41] uppercase tracking-wider flex justify-between items-center">
                      <span>Liquidity Analysis</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Health Score:</span>
                        <span className={`px-3 py-1 text-sm uppercase tracking-wider ${
                          rugTraceData.liquidity.health_score.score >= 80 ? 'border border-green-500 text-green-500' :
                          rugTraceData.liquidity.health_score.score >= 60 ? 'border border-yellow-500 text-yellow-500' :
                          'border border-red-500 text-red-500'
                        }`}>
                          {rugTraceData.liquidity.health_score.score}/100
                        </span>
                      </div>
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* DEX Information */}
                      <div>
                        <h3 className="text-sm uppercase font-bold mb-4 text-[#00ff41]/50 tracking-wider">
                          DEX Information
                        </h3>
                        <div className="space-y-4">
                          {rugTraceData.risk_analysis.dex_liquidity_info.map((dex, index) => (
                            <div key={index} className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-bold">{dex.name}</div>
                                  <div className="text-sm font-mono text-[#00ff41]/70 mt-1">{dex.pair}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold">${parseFloat(dex.liquidity_type).toLocaleString()}</div>
                                  <div className="text-sm text-[#00ff41]/70">Liquidity</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* LP Holders */}
                      <div>
                        <h3 className="text-sm uppercase font-bold mb-4 text-[#00ff41]/50 tracking-wider">
                          LP Holders
                        </h3>
                        <div className="space-y-4">
                          {rugTraceData.liquidity.lp_holders.map((holder, index) => (
                            <div key={index} className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono">{holder.address.slice(0, 6)}...{holder.address.slice(-4)}</span>
                                    {holder.tag && (
                                      <span className="text-xs px-2 py-1 bg-[#00ff41]/10 border border-[#00ff41]/30">
                                        {holder.tag}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-[#00ff41]/70 mt-1">
                                    {holder.is_contract === 1 ? 'Contract' : 'EOA'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold">{(parseFloat(holder.percent) * 100).toFixed(4)}%</div>
                                  <div className="text-sm text-[#00ff41]/70">{holder.balance} LP</div>
                                  {holder.is_locked === 1 && (
                                    <span className="mt-1 text-xs px-2 py-1 border border-green-500 text-green-500">
                                      {holder.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Token Information & Social Links */}
                <motion.div 
                  className="border border-[#00ff41]/30 bg-[#00ff41]/5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="bg-[#00ff41]/10 px-6 py-4 border-b border-[#00ff41]/30">
                    <h2 className="text-xl font-bold text-[#00ff41] uppercase tracking-wider">
                      Additional Information
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm uppercase font-bold mb-4 text-[#00ff41]/50 tracking-wider">
                          Description
                        </h3>
                        <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                          <p className="text-sm">{rugTraceData.past_rugs.token_info.description}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm uppercase font-bold mb-4 text-[#00ff41]/50 tracking-wider">
                          Links & Analytics
                        </h3>
                        <div className="space-y-4">
                          {Object.entries(rugTraceData.past_rugs.social_links).map(([platform, link]) => (
                            link && (
                              <a 
                                key={platform}
                                href={platform === 'twitter_username' ? `https://twitter.com/${link}` : link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between border border-[#00ff41]/20 bg-[#00ff41]/5 p-4 hover:border-[#00ff41]/40"
                              >
                                <span className="text-sm uppercase">{platform.replace('_', ' ')}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                  <polyline points="15 3 21 3 21 9"></polyline>
                                  <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                              </a>
                            )
                          ))}
                          <a 
                            href={rugTraceData.past_rugs.analytics.geckoterminal}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between border border-[#00ff41]/20 bg-[#00ff41]/5 p-4 hover:border-[#00ff41]/40"
                          >
                            <span className="text-sm uppercase">GeckoTerminal</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <polyline points="15 3 21 3 21 9"></polyline>
                              <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </>
        )}

        {/* Initial State */}
        {!loading && !analysisData && !rugTraceData && !error && (
          <motion.div 
            className="border border-[#00ff41]/30 bg-[#00ff41]/5 p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="mx-auto w-20 h-20 mb-6 flex items-center justify-center border border-[#00ff41]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#00ff41]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
                <line x1="9" y1="2" x2="9" y2="22"></line>
                <line x1="15" y1="2" x2="15" y2="22"></line>
                <line x1="2" y1="9" x2="22" y2="9"></line>
                <line x1="2" y1="15" x2="22" y2="15"></line>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-[#00ff41] uppercase tracking-wider">
              ENTER CONTRACT ADDRESS
            </h2>
            <div className="h-1 w-40 mx-auto bg-[#00ff41]/50 mb-6"></div>
            <p className="max-w-md mx-auto text-[#00ff41]/70 uppercase tracking-wide">
              PASTE AN ETHEREUM SMART CONTRACT ADDRESS ABOVE TO ANALYZE SECURITY VULNERABILITIES AND RISK FACTORS
            </p>
          </motion.div>
        )}

        {/* Binary code animation at the bottom */}
        <div className="mt-12 overflow-hidden h-6 font-mono text-xs leading-none tracking-tighter">
          <motion.div 
            className="flex"
            animate={{ x: [-1000, 1000] }}
            transition={{ 
              repeat: Infinity, 
              duration: 30,
              ease: "linear"
            }}
          >
            {Array.from({ length: 500 }).map((_, i) => {
              // Use index to determine the value deterministically
              const value = i % 2 === 0 ? '1' : '0';
              // Use index to determine initial opacity deterministically
              const initialOpacity = i % 3 === 0 ? 0.8 : 0.2;
              const targetOpacity = initialOpacity === 0.8 ? 0.2 : 0.8;
              
              return (
                <motion.span 
                  key={i}
                  className="text-[#00ff41]/50"
                  initial={{ opacity: initialOpacity }}
                  animate={{ opacity: targetOpacity }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2 + (i % 5),
                    repeatType: 'reverse'
                  }}
                >
                  {value}
                </motion.span>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-12 py-6 border-t border-[#00ff41]/20">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 border border-[#00ff41] flex items-center justify-center">
              <div className="h-3 w-3 bg-[#00ff41]"></div>
            </div>
            <span className="text-sm font-bold text-[#00ff41] uppercase tracking-wider">
              SYNTHR
            </span>
          </div>
          <div className="text-center text-xs text-[#00ff41]/50 uppercase tracking-wider">
            © 2023 SYNTHR LABS // ALL SYSTEMS OPERATIONAL
          </div>
          <div className="flex gap-4">
            <div className="text-[#00ff41]/50 text-xs uppercase tracking-wider">
              TERMINAL v1.0.2
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 