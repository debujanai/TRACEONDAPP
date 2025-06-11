'use client';

import { useState, ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { TokenInfo, DexInfo, HolderInfo, LpHolderInfo } from '@/components/TokenSecurityTypes';
import { useWallet } from '@/contexts/WalletContext';
import { addSearchToHistory } from '@/lib/supabase';

type TabType = 'overview' | 'security' | 'holders' | 'trading' | 'advanced';

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
    name: 'security',
    label: 'Security',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    )
  },
  {
    name: 'holders',
    label: 'Holders',
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
    name: 'trading',
    label: 'Trading',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
      </svg>
    )
  },
  {
    name: 'advanced',
    label: 'Advanced Analysis',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
      </svg>
    )
  }
];

// Adding interface for audit response
interface SecurityIssue {
  title: string;
  description: string;
  impact?: string;
  confidence?: string;
}

interface AuditResponse {
  contractAddress: string;
  contractName: string;
  compiler: string;
  securityAnalysis: {
    issues: SecurityIssue[];
  };
}

interface TokenData {
  result: Record<string, TokenInfo>;
}

interface ApiError {
  message: string;
}

interface SecurityCheckProps {
  name: string;
  value: boolean | string;
  invert?: boolean;
}

export default function TokenSecurity() {
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState('1');
  const [loading, setLoading] = useState(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [error, setError] = useState('');
  const [showAllHolders, setShowAllHolders] = useState(false);
  const [showAllLpHolders, setShowAllLpHolders] = useState(false);
  const [showAllDexes, setShowAllDexes] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [previousTab, setPreviousTab] = useState<TabType>('overview');
  const [direction, setDirection] = useState(0);
  
  // Add state for audit response
  const [auditData, setAuditData] = useState<AuditResponse | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const { isConnected, connectWallet, userProfile, updateCredits } = useWallet();

  // Determine animation direction when tab changes
  useEffect(() => {
    if (previousTab === activeTab) return;
    
    const prevIndex = tabs.findIndex(tab => tab.name === previousTab);
    const activeIndex = tabs.findIndex(tab => tab.name === activeTab);
    
    setDirection(activeIndex > prevIndex ? 1 : -1);
    setPreviousTab(activeTab);
  }, [activeTab, previousTab]);

  // Extract token data from the response
  const tokenInfo = tokenData && tokenData.result ? 
    Object.values(tokenData.result)[0] as TokenInfo : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError('Please connect your wallet to use this service.');
      return;
    }
    
    // Deduct credits for the service (5 credits for CodeReveal)
    const requiredCredits = 5;
    if (!userProfile || userProfile.credits < requiredCredits) {
      setError(`Insufficient credits to use this service. Required: ${requiredCredits}`);
      return;
    }
    
    // Update credits
    await updateCredits(-requiredCredits);

    // Save search to history
    if (userProfile) {
      try {
        console.log('Saving search to history:', address);
        await addSearchToHistory(
          userProfile.id,
          `CodeReveal: ${address}`,
          address,
          'code_audit'
        );
      } catch (historyError) {
        console.error('Error saving search to history:', historyError);
        // Continue with the search even if logging fails
      }
    }
    
    setLoading(true);
    setError('');
    setAuditData(null);
    setAuditError('');

    try {
      // Fetch token security data
      const response = await fetch('/api/token-security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, chainId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch token data');
      }
      
      setTokenData({ result: { [address]: data.result } });

      // Also fetch audit data
      setAuditLoading(true);
      try {
        const auditResponse = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        });

        const auditResult = await auditResponse.json();
        
        if (!auditResponse.ok) {
          throw new Error(auditResult.error || 'Failed to fetch audit data');
        }
        
        setAuditData(auditResult);
      } catch (auditErr: unknown) {
        const error = auditErr as ApiError;
        setAuditError(error.message || 'An error occurred fetching audit data');
        console.error('Error fetching audit data:', error);
      } finally {
        setAuditLoading(false);
      }
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(error.message || 'An error occurred');
      console.error('Error fetching token data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format large numbers with T/B/M suffix
  const formatLargeNumber = (num: string) => {
    const n = parseFloat(num);
    if (n >= 1e12) return `${(n / 1e12).toFixed(3)}T`;
    if (n >= 1e9) return `${(n / 1e9).toFixed(3)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(3)}M`;
    return n.toLocaleString();
  };

  // Security risk assessment helper
  const getSecurityRiskLevel = () => {
    if (!tokenInfo) return { level: 'unknown', color: 'bg-gray-500' };
    
    const riskFactors = [
      tokenInfo.is_honeypot === '1',
      tokenInfo.hidden_owner === '1',
      tokenInfo.can_take_back_ownership === '1',
      tokenInfo.selfdestruct === '1',
      tokenInfo.buy_tax !== '0',
      tokenInfo.sell_tax !== '0',
      tokenInfo.is_blacklisted === '1',
      tokenInfo.is_mintable === '1',
      tokenInfo.cannot_sell_all === '1'
    ];
    
    const riskCount = riskFactors.filter(Boolean).length;
    
    if (riskCount >= 3) return { level: 'High Risk', color: 'bg-red-500' };
    if (riskCount >= 1) return { level: 'Medium Risk', color: 'bg-amber-500' };
    return { level: 'Low Risk', color: 'bg-emerald-500' };
  };

  const securityRisk = getSecurityRiskLevel();

  // Update the TabNavigation component to fix the selected tab styling
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
            <span className="text-xs uppercase tracking-widest text-white/70">Security Analysis</span>
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-5xl font-['ClashGrotesk-Regular'] mb-2 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            CodeReveal
          </motion.h1>
          <motion.p 
            className="text-sm opacity-70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Analyze smart contract vulnerabilities and security risks
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
                placeholder="Enter contract address..."
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
              <option value="56">BSC</option>
              <option value="137">Polygon</option>
              <option value="42161">Arbitrum</option>
            </motion.select>
            <motion.button 
              type="submit" 
              disabled={loading || auditLoading}
              className="bg-black border border-white/20 text-white rounded-xl px-6 py-3 text-sm transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              whileHover={{ 
                scale: 1.03, 
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                boxShadow: "0 0 15px rgba(255, 255, 255, 0.2)"
              }}
              whileTap={{ scale: 0.97 }}
            >
              {(loading || auditLoading) ? 'Analyzing...' : 'Analyze'}
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
          {auditError && (
            <motion.div 
              className="mt-4 backdrop-blur-md bg-red-500/10 border border-red-500/30 rounded-xl p-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-red-400 text-sm">{auditError}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Results Section */}
        {tokenInfo && (
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
            {/* Token Overview Card */}
                    <motion.div 
                      className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      whileHover={{ boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12), 0 0 1px rgba(255, 255, 255, 0.2)" }}
                    >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Token Overview</h2>
                <div className={`${securityRisk.color} px-4 py-1 rounded-full text-xs font-medium`}>
                  {securityRisk.level}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
                  <p className="text-sm text-white/60 mb-1">Token Name</p>
                  <p className="font-medium">{tokenInfo.token_name || 'N/A'}</p>
                </div>
                        <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
                  <p className="text-sm text-white/60 mb-1">Symbol</p>
                  <p className="font-medium">{tokenInfo.token_symbol || 'N/A'}</p>
                </div>
                        <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
                  <p className="text-sm text-white/60 mb-1">Total Supply</p>
                  <p className="font-medium">{tokenInfo.total_supply ? formatLargeNumber(tokenInfo.total_supply) : 'N/A'}</p>
                </div>
                        <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
                  <p className="text-sm text-white/60 mb-1">Holder Count</p>
                  <p className="font-medium">{tokenInfo.holder_count ? parseInt(tokenInfo.holder_count).toLocaleString() : 'N/A'}</p>
                </div>
                        <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
                  <p className="text-sm text-white/60 mb-1">Buy Tax</p>
                  <p className="font-medium">{tokenInfo.buy_tax ? (parseFloat(tokenInfo.buy_tax) * 100).toFixed(1) : '0'}%</p>
                </div>
                        <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
                  <p className="text-sm text-white/60 mb-1">Sell Tax</p>
                  <p className="font-medium">{tokenInfo.sell_tax ? (parseFloat(tokenInfo.sell_tax) * 100).toFixed(1) : '0'}%</p>
                </div>
              </div>
              
              {/* Additional Token Info - CEX Listings */}
              {tokenInfo.is_in_cex && tokenInfo.is_in_cex.listed === "1" && tokenInfo.is_in_cex.cex_list && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-3 text-white/70">Listed On Exchanges</h3>
                  <div className="flex flex-wrap gap-2">
                    {tokenInfo.is_in_cex.cex_list.map((cex, index) => (
                      <span key={index} className="text-xs px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                        {cex}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Creator Info */}
              {tokenInfo.creator_address && (
                        <div className="mt-6 backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                  <h3 className="text-sm font-medium mb-3 text-white/70">Creator Info</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-white/60 mb-1">Creator Address</p>
                      <p className="text-sm break-all">{tokenInfo.creator_address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60 mb-1">Creator Balance</p>
                      <p className="text-sm">{tokenInfo.creator_balance ? formatLargeNumber(tokenInfo.creator_balance) : '0'}</p>
                    </div>
                  </div>
                </div>
              )}
                    </motion.div>
                  </motion.div>
                )}
            
                {/* Security Tab - Basic Security Checks */}
                {activeTab === 'security' && (
                  <motion.div 
                    className="space-y-6 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div 
                      className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      whileHover={{ boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12), 0 0 1px rgba(255, 255, 255, 0.2)" }}
                    >
              <h2 className="text-xl font-medium mb-4">Security Risk Checks</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SecurityCheck name="Is Honeypot" value={tokenInfo.is_honeypot === '1'} invert={true} />
                        <SecurityCheck name="Hidden Ownership" value={tokenInfo.hidden_owner === '1'} invert={true} />
                        <SecurityCheck name="Ownership Takeover" value={tokenInfo.can_take_back_ownership === '1'} invert={true} />
                        <SecurityCheck name="Self-Destruct Function" value={tokenInfo.selfdestruct === '1'} invert={true} />
                        <SecurityCheck name="Is Blacklisted" value={tokenInfo.is_blacklisted === '1'} invert={true} />
                        <SecurityCheck name="Can't Sell All" value={tokenInfo.cannot_sell_all === '1'} invert={true} />
                        <SecurityCheck name="Is Open Source" value={tokenInfo.is_open_source === '1'} />
                        <SecurityCheck name="Listed on CEX" value={tokenInfo.is_in_cex?.listed === '1'} />
                        <SecurityCheck name="Is Mintable" value={tokenInfo.is_mintable === '1'} invert={true} />
                        <SecurityCheck name="Anti-Whale System" value={tokenInfo.is_anti_whale === '1'} />
                        <SecurityCheck name="Proxy Contract" value={tokenInfo.is_proxy === '1'} />
                        <SecurityCheck name="Transfer Pausable" value={tokenInfo.transfer_pausable === '1'} invert={true} />
              </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* Holders Tab */}
                {activeTab === 'holders' && (
                  <motion.div 
                    className="space-y-6 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
            {/* Top Holders */}
            {tokenInfo.holders && tokenInfo.holders.length > 0 && (
                      <motion.div 
                        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-medium">Top Holders</h2>
                  <button 
                    onClick={() => setShowAllHolders(!showAllHolders)}
                    className="text-xs backdrop-blur-md bg-white/5 px-3 py-1 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                  >
                    {showAllHolders ? 'Show Less' : 'Show All'}
                  </button>
                </div>
                
                        <div className="space-y-2 overflow-y-auto no-scrollbar" 
                     style={{ 
                       maxHeight: showAllHolders ? '400px' : 'auto',
                       paddingRight: '5px'
                     }}>
                  {(showAllHolders ? tokenInfo.holders : tokenInfo.holders.slice(0, 5)).map((holder: HolderInfo, index: number) => (
                            <motion.div
                              key={index}
                              className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <p className="text-sm truncate">{holder.address}</p>
                            {holder.tag && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">
                                {holder.tag}
                              </span>
                            )}
                            {holder.is_contract === 1 && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">
                                Contract
                              </span>
                            )}
                            {holder.is_locked === 1 && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full">
                                Locked
                              </span>
                            )}
                          </div>
                          <div className="flex items-center mt-2">
                                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(parseFloat(holder.percent)*2, 100)}%` }}></div>
                            <span className="ml-2 text-xs">{parseFloat(holder.percent).toFixed(2)}%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs opacity-70">Balance</p>
                          <p className="text-sm">{formatLargeNumber(holder.balance)}</p>
                        </div>
                      </div>
                            </motion.div>
                  ))}
                </div>
                      </motion.div>
            )}
            
            {/* LP Holders */}
            {tokenInfo.lp_holders && tokenInfo.lp_holders.length > 0 && (
                      <motion.div 
                        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-medium">Liquidity Providers</h2>
                    <p className="text-xs text-white/60 mt-1">
                      Total LP Holders: {tokenInfo.lp_holder_count} | 
                      Total Supply: {tokenInfo.lp_total_supply ? formatLargeNumber(tokenInfo.lp_total_supply) : 'N/A'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowAllLpHolders(!showAllLpHolders)}
                    className="text-xs backdrop-blur-md bg-white/5 px-3 py-1 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                  >
                    {showAllLpHolders ? 'Show Less' : 'Show All'}
                  </button>
                </div>
                
                        <div className="space-y-2 overflow-y-auto no-scrollbar" 
                     style={{ 
                       maxHeight: showAllLpHolders ? '400px' : 'auto',
                       paddingRight: '5px'
                     }}>
                  {(showAllLpHolders ? tokenInfo.lp_holders : tokenInfo.lp_holders.slice(0, 5)).map((holder: LpHolderInfo, index: number) => (
                            <motion.div
                              key={index}
                              className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <p className="text-sm truncate">{holder.address}</p>
                            {holder.tag && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">
                                {holder.tag}
                              </span>
                            )}
                            {holder.is_contract === 1 && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">
                                Contract
                              </span>
                            )}
                            {holder.is_locked === 1 && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full">
                                Locked
                              </span>
                            )}
                          </div>
                          <div className="flex items-center mt-2">
                                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(parseFloat(holder.percent)*2, 100)}%` }}></div>
                            <span className="ml-2 text-xs">{parseFloat(holder.percent).toFixed(3)}%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs opacity-70">Balance</p>
                          <p className="text-sm">{formatLargeNumber(holder.balance)}</p>
                        </div>
                      </div>
                            </motion.div>
                  ))}
                </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Trading Tab */}
                {activeTab === 'trading' && (
                  <motion.div 
                    className="space-y-6 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
            {/* Dexes */}
            {tokenInfo.dex && tokenInfo.dex.length > 0 && (
                      <motion.div 
                        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-medium">Trading Pairs</h2>
                  {tokenInfo.dex.length > 6 && (
                    <button 
                      onClick={() => setShowAllDexes(!showAllDexes)}
                      className="text-xs backdrop-blur-md bg-white/5 px-3 py-1 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                    >
                      {showAllDexes ? 'Show Less' : 'Show All'}
                    </button>
                  )}
                </div>
                
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto no-scrollbar" 
                  style={{ 
                    maxHeight: showAllDexes ? '400px' : 'auto',
                    paddingRight: '5px'
                  }}>
                  {(showAllDexes ? tokenInfo.dex : tokenInfo.dex.slice(0, 6)).map((dex: DexInfo, index: number) => (
                            <motion.div
                              key={index}
                              className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">{dex.pair}</p>
                          <div className="flex items-center mt-1">
                            <p className="text-xs opacity-70">{dex.name}</p>
                            <span className="ml-2 text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">
                              {dex.liquidity_type}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs opacity-70">Liquidity</p>
                          <p className="text-sm">${parseFloat(dex.liquidity).toLocaleString()}</p>
                        </div>
                      </div>
                            </motion.div>
                          ))}
                    </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Advanced Analysis Tab */}
                {activeTab === 'advanced' && (
                  <motion.div 
                    className="space-y-6 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {auditLoading ? (
                      <motion.div 
                        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-10 border border-white/10 shadow-lg flex justify-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="flex flex-col items-center gap-6">
                          <div className="relative w-24 h-24">
                            {/* Code scanning animation */}
                            <motion.div 
                              className="absolute inset-0 rounded-lg border-2 border-blue-500/50"
                            />
                            
                            {/* Scanning line */}
                            <motion.div 
                              className="absolute w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                              animate={{ 
                                top: [0, '100%', 0],
                              }}
                              transition={{ 
                                duration: 2.5, 
                                ease: "easeInOut", 
                                repeat: Infinity 
                              }}
                            />
                            
                            {/* Code lines */}
                            <div className="absolute inset-3 flex flex-col justify-around">
                              {[...Array(5)].map((_, i) => (
                                <motion.div 
                                  key={i}
                                  className="h-1 bg-white/20 rounded-full"
                                  style={{ width: `${60 + Math.random() * 40}%` }}
                                  animate={{ 
                                    opacity: [0.3, 0.6, 0.3],
                                    width: [`${60 + Math.random() * 40}%`, `${60 + Math.random() * 40}%`]
                                  }}
                                  transition={{ 
                                    duration: 2, 
                                    ease: "easeInOut", 
                                    repeat: Infinity,
                                    delay: i * 0.2
                                  }}
                                />
                  ))}
                </div>
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
                              Auditing Smart Contract
                            </motion.h3>
                            <p className="text-sm text-white/60">Scanning for vulnerabilities</p>
                  </div>
              </div>
                      </motion.div>
                    ) : auditError ? (
                      <motion.div 
                        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <div className="backdrop-blur-md bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                          <p className="text-red-400">{auditError}</p>
                        </div>
                      </motion.div>
                    ) : auditData && auditData.securityAnalysis ? (
                      <motion.div 
                        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-xl font-medium">Smart Contract Analysis</h2>
                          <div className="text-sm text-white/60">
                            <p>Contract: {auditData.contractName}</p>
                            <p>Compiler: {auditData.compiler}</p>
                          </div>
                        </div>
                
                {auditData.securityAnalysis.issues.length > 0 ? (
                          <motion.div 
                            className="space-y-4 overflow-hidden no-scrollbar"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                    {auditData.securityAnalysis.issues.map((issue, index) => (
                              <motion.div
                                key={index}
                                className="backdrop-blur-md bg-black/50 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-medium mb-3">{issue.title}</h3>
                                    <p className="text-sm leading-relaxed opacity-80 mb-4">{issue.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {issue.impact && (
                                        <span className="text-xs px-3 py-1.5 bg-red-500/20 text-red-300 rounded-full">
                              Impact: {issue.impact}
                            </span>
                          )}
                          {issue.confidence && (
                                        <span className="text-xs px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-full">
                              Confidence: {issue.confidence}
                            </span>
                          )}
                        </div>
                      </div>
                                  <div className={`w-2 h-2 rounded-full ${
                                    issue.impact?.toLowerCase() === 'high' ? 'bg-red-500' :
                                    issue.impact?.toLowerCase() === 'medium' ? 'bg-yellow-500' :
                                    'bg-blue-500'
                                  }`} />
                  </div>
                              </motion.div>
                            ))}
                          </motion.div>
                ) : (
                          <motion.div 
                            className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="flex items-center gap-3">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                <path d="M9 12l2 2 4-4"></path>
                              </svg>
                              <p className="text-emerald-400 font-medium">No security issues found in the audit.</p>
                  </div>
                            <p className="text-emerald-400/70 text-sm mt-2">
                              The smart contract code appears to follow security best practices. However, always conduct your own due diligence before interacting with any smart contract.
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    ) : (
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
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                          </svg>
                        </motion.div>
                        <motion.h3 
                          className="text-xl font-medium mb-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.8 }}
                        >
                          Advanced Security Analysis
                        </motion.h3>
                        <motion.p 
                          className="text-sm opacity-70 max-w-lg mx-auto"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.9 }}
                        >
                          Click the Analyze button to perform an in-depth security audit of the smart contract code.
                        </motion.p>
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
                  Analyzing Contract
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
        
        {!loading && !tokenInfo && !error && (
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
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </motion.div>
            <motion.h3 
              className="text-xl font-medium mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              Analyze Smart Contract
            </motion.h3>
            <motion.p 
              className="text-sm opacity-70 max-w-lg mx-auto mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              Enter a contract address to analyze its security risks, audit for vulnerabilities, and check for potential scam indicators.
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

// Security Check Component with animations
function SecurityCheck({ name, value, invert = false }: SecurityCheckProps) {
  const isSecure = invert ? !value : !!value;
  
  return (
    <motion.div 
      className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, backgroundColor: "rgba(0, 0, 0, 0.6)" }}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm">{name}</span>
        {typeof value === 'boolean' ? (
          <motion.span 
            className={`text-xs px-3 py-1 rounded-full ${
            isSecure 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/20 text-red-400'
            }`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {isSecure ? 'Secure' : 'Risk'}
          </motion.span>
        ) : (
          <span className="text-sm">{value}</span>
        )}
      </div>
    </motion.div>
  );
} 