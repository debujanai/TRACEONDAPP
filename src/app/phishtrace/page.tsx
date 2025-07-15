'use client';

import { useState, ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useWallet } from '@/contexts/WalletContext';
import { addSearchToHistory } from '@/lib/supabase';

// Add custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

// Define tab types
type TabType = 'overview' | 'details' | 'security' | 'domain' | 'screenshot';

interface TabProps {
  name: TabType;
  label: string;
  icon: ReactNode;
}

interface ApiResponse {
  data: {
    attributes: {
      last_analysis_stats: {
        malicious: number;
        suspicious: number;
        undetected: number;
        harmless: number;
        timeout: number;
      };
      last_analysis_results: Record<string, {
        category: string;
        result: string;
        method: string;
        engine_name: string;
      }>;
      url: string;
      title?: string;
      last_final_url: string;
      last_analysis_date?: number;
    }
  }
}

interface DomainInfoResponse {
  domain: string;
  domainInfo: {
    creationDate?: string;
    expirationDate?: string;
    lastUpdated?: string;
    registrar?: string;
    domainAge?: number;
    error?: string;
  };
  sslInfo: {
    issuer?: {
      CN?: string;
      O?: string;
    };
    subject?: {
      CN?: string;
    };
    validFrom?: string;
    validTo?: string;
    isValid?: boolean;
    daysToExpiration?: number;
    certAge?: number;
    fingerprint?: string;
    serialNumber?: string;
    error?: string;
  };
}

interface ScreenshotResponse {
  url: string;
  width: number;
  height: number;
  type: string;
  size: number;
  size_pretty: string;
}

interface ApiError {
  message: string;
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
    name: 'details',
    label: 'Details',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
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
    name: 'domain',
    label: 'Domain Info',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
    )
  },
  {
    name: 'screenshot',
    label: 'Screenshot',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
    )
  }
];

export default function PhishTrace() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanData, setScanData] = useState<ApiResponse | null>(null);
  const [domainData, setDomainData] = useState<DomainInfoResponse | null>(null);
  const [screenshotData, setScreenshotData] = useState<ScreenshotResponse | null>(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [screenshotError, setScreenshotError] = useState('');
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

  // Function to convert URL to Base64
  const toBase64 = (str: string): string => {
    // Convert to base64 and remove padding characters (=)
    const base64 = Buffer.from(str).toString('base64').replace(/=/g, '');
    return base64;
  };

  // Function to detect common phishing patterns in URLs
  const detectPhishingPatterns = (urlToCheck: string) => {
    const patterns = [
      { pattern: /secure.*login/i, risk: "high", description: "Contains 'secure' and 'login'" },
      { pattern: /verify.*account/i, risk: "high", description: "Contains 'verify' and 'account'" },
      { pattern: /confirm.*payment/i, risk: "high", description: "Contains 'confirm' and 'payment'" },
      { pattern: /update.*billing/i, risk: "high", description: "Contains 'update' and 'billing'" },
      { pattern: /password.*reset/i, risk: "medium", description: "Contains 'password' and 'reset'" },
      { pattern: /signin|sign-in|log-in|login/, risk: "medium", description: "Contains login-related terms" },
      { pattern: /paypal|apple|google|microsoft|amazon|facebook|netflix|instagram/, risk: "medium", description: "Contains popular brand name" },
      { pattern: /\.(tk|ml|ga|cf|gq|top)$/i, risk: "medium", description: "Uses commonly abused TLD" },
      { pattern: /[0-9]{6,}/, risk: "low", description: "Contains long number sequence" },
      { pattern: /\.(zip|exe|apk)$/i, risk: "high", description: "Links to executable file" },
    ];
    
    return patterns.filter(p => p.pattern.test(urlToCheck));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError('Please connect your wallet to use this service.');
      return;
    }
    
    // Deduct credits for the service (3 credits for PhishTrace)
    const requiredCredits = 3;
    if (!userProfile || userProfile.credits < requiredCredits) {
      setError(`Insufficient credits to use this service. Required: ${requiredCredits}`);
      return;
    }

    // Validate URL format
    if (!url.trim() || !url.match(/^(http|https):\/\/[^ "]+$/)) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    
    // Update credits
    await updateCredits(-requiredCredits);

    // Save search to history
    if (userProfile) {
      try {
        await addSearchToHistory(
          userProfile.id,
          `PhishTrace: ${url}`,
          url,
          'phish_trace'
        );
      } catch (historyError) {
        // Continue with the search even if logging fails
      }
    }
    
    setLoading(true);
    setError('');
    setScanData(null);
    setDomainData(null);
    setScreenshotData(null);
    setScreenshotError('');

    try {
      // Convert URL to base64
      const base64Url = toBase64(url);

      // Call APIs in parallel
      const [scanResponse, domainResponse] = await Promise.all([
        // Security scan API
        fetch('/api/phishtrace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: base64Url })
        }),
        // Domain & SSL Info API
        fetch('/api/domain-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        })
      ]);

      const [scanDataResult, domainDataResult] = await Promise.all([
        scanResponse.json(),
        domainResponse.json()
      ]);
      
      if (!scanResponse.ok) {
        throw new Error('Unable to complete security scan. Please try again.');
      }
      
      setScanData(scanDataResult);
      setDomainData(domainDataResult);

      // If scan is successful and we're on the screenshot tab, load the screenshot
      if (activeTab === 'screenshot') {
        loadScreenshot();
      }
    } catch (err: unknown) {
      setError('Unable to analyze the URL at this time. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load screenshot when user switches to screenshot tab
  useEffect(() => {
    if (activeTab === 'screenshot' && scanData && !screenshotData && !screenshotLoading && !screenshotError) {
      loadScreenshot();
    }
  }, [activeTab, scanData]);

  // Function to load screenshot
  const loadScreenshot = async () => {
    if (!url || screenshotLoading) return;
    
    setScreenshotLoading(true);
    setScreenshotError('');
    
    try {
      const response = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error('Unable to generate screenshot at this time.');
      }
      
      setScreenshotData(data.screenshot);
    } catch (err: unknown) {
      setScreenshotError('Unable to generate screenshot at this time. Please try again.');
    } finally {
      setScreenshotLoading(false);
    }
  };

  // Calculate security score based on scan results
  const getSecurityRisk = () => {
    if (!scanData) return { level: 'unknown', color: 'bg-gray-500', score: 0 };
    
    const stats = scanData.data.attributes.last_analysis_stats;
    const totalEngines = stats.malicious + stats.suspicious + stats.harmless + stats.undetected;
    const riskScore = ((stats.malicious * 100) + (stats.suspicious * 50)) / totalEngines;
    
    // Check for phishing patterns in URL
    const phishingPatterns = detectPhishingPatterns(url);
    const patternScore = phishingPatterns.reduce((score, pattern) => {
      return score + (pattern.risk === 'high' ? 20 : pattern.risk === 'medium' ? 10 : 5);
    }, 0);
    
    // Combine scores (weighted)
    const combinedScore = (riskScore * 0.7) + (Math.min(patternScore, 30) * 0.3);
    
    if (stats.malicious > 0 || patternScore > 15) return { level: 'High Risk', color: 'bg-red-500', score: combinedScore };
    if (stats.suspicious > 0 || patternScore > 5) return { level: 'Medium Risk', color: 'bg-amber-500', score: combinedScore };
    if (stats.harmless > 0 && stats.harmless > stats.undetected) return { level: 'Low Risk', color: 'bg-emerald-500', score: combinedScore };
    return { level: 'Unknown', color: 'bg-gray-500', score: combinedScore };
  };

  const securityRisk = getSecurityRisk();
  
  // Get phishing patterns in current URL
  const phishingPatterns = url ? detectPhishingPatterns(url) : [];

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

  // Calculate detection counts by category
  const getDetectionCounts = () => {
    if (!scanData || !scanData.data.attributes.last_analysis_results) {
      return { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 };
    }

    const results = scanData.data.attributes.last_analysis_results;
    const counts = {
      malicious: 0,
      suspicious: 0,
      harmless: 0,
      undetected: 0
    };

    Object.values(results).forEach(result => {
      if (result.category === 'malicious') counts.malicious++;
      else if (result.category === 'suspicious') counts.suspicious++;
      else if (result.category === 'harmless') counts.harmless++;
      else if (result.category === 'undetected') counts.undetected++;
    });

    return counts;
  };

  const detectionCounts = getDetectionCounts();

  return (
    <AppLayout>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
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
            PhishTrace
          </motion.h1>
          <motion.p 
            className="text-sm opacity-70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Detect phishing and malicious URLs with real-time scanning
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
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL to scan (https://example.com)..."
                className="w-full backdrop-blur-md bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                whileFocus={{ scale: 1.01, borderColor: "rgba(255, 255, 255, 0.2)" }}
              />
            </div>
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
              {loading ? 'Scanning...' : 'Scan URL'}
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
        {scanData && (
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
                    {/* URL Overview Card */}
                    <motion.div 
                      className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      whileHover={{ boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12), 0 0 1px rgba(255, 255, 255, 0.2)" }}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-medium">URL Analysis</h2>
                        <div className={`${securityRisk.color} px-4 py-1 rounded-full text-xs font-medium`}>
                          {securityRisk.level}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 mb-6">
                        <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
                          <p className="text-sm text-white/60 mb-1">URL</p>
                          <p className="font-medium break-all">{scanData.data.attributes.url || 'N/A'}</p>
                        </div>
                      </div>
                      
                      {/* Security Score */}
                      <div className="mb-6">
                        <h3 className="text-sm font-medium mb-3 text-white/70">Security Score</h3>
                        <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="h-4 bg-black/50 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    securityRisk.score > 50 ? 'bg-red-500' : 
                                    securityRisk.score > 20 ? 'bg-amber-500' : 
                                    'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.max(securityRisk.score, 5)}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-center">
                              <span className={`text-xl font-medium ${
                                securityRisk.score > 50 ? 'text-red-400' : 
                                securityRisk.score > 20 ? 'text-amber-400' : 
                                'text-emerald-400'
                              }`}>
                                {Math.round(securityRisk.score * 100) / 100}% Risk
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Detection Summary */}
                      <div>
                        <h3 className="text-sm font-medium mb-3 text-white/70">Detection Summary</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="backdrop-blur-md bg-red-500/10 rounded-xl p-3 border border-red-500/20">
                            <p className="text-xs text-red-400 mb-1">Malicious</p>
                            <p className="text-xl font-medium text-red-300">{detectionCounts.malicious}</p>
                          </div>
                          <div className="backdrop-blur-md bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                            <p className="text-xs text-amber-400 mb-1">Suspicious</p>
                            <p className="text-xl font-medium text-amber-300">{detectionCounts.suspicious}</p>
                          </div>
                          <div className="backdrop-blur-md bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                            <p className="text-xs text-emerald-400 mb-1">Harmless</p>
                            <p className="text-xl font-medium text-emerald-300">{detectionCounts.harmless}</p>
                          </div>
                          <div className="backdrop-blur-md bg-gray-500/10 rounded-xl p-3 border border-gray-500/20">
                            <p className="text-xs text-gray-400 mb-1">Undetected</p>
                            <p className="text-xl font-medium text-gray-300">{detectionCounts.undetected}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Phishing Patterns Detection */}
                      {phishingPatterns.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-sm font-medium mb-3 text-white/70">Phishing Pattern Detection</h3>
                          <div className="backdrop-blur-md bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                            <p className="text-sm text-red-400 mb-3">
                              Warning: This URL contains patterns commonly used in phishing attempts
                            </p>
                            <div className="space-y-2">
                              {phishingPatterns.map((pattern, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full ${
                                    pattern.risk === 'high' ? 'bg-red-500' : 
                                    pattern.risk === 'medium' ? 'bg-amber-500' : 
                                    'bg-yellow-500'
                                  }`}></span>
                                  <span className="text-sm">{pattern.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
            
                {/* Details Tab */}
                {activeTab === 'details' && (
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
                      <h2 className="text-xl font-medium mb-4">URL Details</h2>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                          <p className="text-sm text-white/60 mb-1">Original URL</p>
                          <p className="font-medium break-all">{scanData.data.attributes.url}</p>
                        </div>
                        
                        <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                          <p className="text-sm text-white/60 mb-1">Final URL (after redirects)</p>
                          <p className="font-medium break-all">{scanData.data.attributes.last_final_url || scanData.data.attributes.url}</p>
                        </div>
                        
                        {scanData.data.attributes.title && (
                          <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                            <p className="text-sm text-white/60 mb-1">Page Title</p>
                            <p className="font-medium">{scanData.data.attributes.title}</p>
                          </div>
                        )}
                        
                        <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                          <p className="text-sm text-white/60 mb-1">Analysis Date</p>
                          <p className="font-medium">
                            {scanData.data.attributes.last_analysis_date ? 
                              new Date(scanData.data.attributes.last_analysis_date * 1000).toLocaleString() : 
                              'N/A'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* Security Tab */}
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
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-medium">Security Scan Results</h2>
                        {scanData && scanData.data.attributes.last_analysis_results && (
                          <div className="bg-black/50 px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                            {Object.keys(scanData.data.attributes.last_analysis_results).length} Security Engines
                          </div>
                        )}
                      </div>
                      
                      {scanData && scanData.data.attributes.last_analysis_results && 
                        Object.keys(scanData.data.attributes.last_analysis_results).length > 9 && (
                          <div className="flex items-center gap-2 mb-3 text-white/60 text-xs">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 5v14M5 12h14"></path>
                            </svg>
                            <span>Scroll down to see all {Object.keys(scanData.data.attributes.last_analysis_results).length} results</span>
                          </div>
                        )
                      }
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {scanData && scanData.data.attributes.last_analysis_results && 
                          Object.entries(scanData.data.attributes.last_analysis_results)
                            .sort((a, b) => {
                              // First prioritize by result type: phishing and malicious first
                              const resultPriority = {
                                'phishing': 0,
                                'malicious': 1,
                                'suspicious': 2,
                                'malware': 3
                              };
                              
                              const resultA = a[1].result.toLowerCase();
                              const resultB = b[1].result.toLowerCase();
                              
                              // Check if result contains priority keywords
                              const resultPriorityA = 
                                resultA.includes('phish') ? resultPriority.phishing :
                                resultA.includes('malicious') ? resultPriority.malicious :
                                resultA.includes('suspicious') ? resultPriority.suspicious :
                                resultA.includes('malware') ? resultPriority.malware : 10;
                                
                              const resultPriorityB = 
                                resultB.includes('phish') ? resultPriority.phishing :
                                resultB.includes('malicious') ? resultPriority.malicious :
                                resultB.includes('suspicious') ? resultPriority.suspicious :
                                resultB.includes('malware') ? resultPriority.malware : 10;
                              
                              // If result priorities are different, sort by them
                              if (resultPriorityA !== resultPriorityB) {
                                return resultPriorityA - resultPriorityB;
                              }
                              
                              // Then sort by category as before
                              const categories = {
                                'malicious': 0,
                                'suspicious': 1,
                                'harmless': 2,
                                'undetected': 3
                              };
                              const catA = categories[a[1].category as keyof typeof categories] || 4;
                              const catB = categories[b[1].category as keyof typeof categories] || 4;
                              return catA - catB;
                            })
                            .map(([vendor, result], index) => (
                              <motion.div
                                key={vendor}
                                className={`backdrop-blur-md rounded-xl p-4 border ${
                                  result.category === 'malicious' ? 'bg-red-500/10 border-red-500/30' :
                                  result.category === 'suspicious' ? 'bg-amber-500/10 border-amber-500/30' :
                                  result.category === 'harmless' ? 'bg-emerald-500/10 border-emerald-500/30' :
                                  'bg-black/50 border-white/10'
                                }`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.03 }}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="font-medium">{vendor}</div>
                                    <div className="text-sm opacity-70 mt-1">{result.method}</div>
                                  </div>
                                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    result.category === 'malicious' ? 'bg-red-500/20 text-red-300' :
                                    result.category === 'suspicious' ? 'bg-amber-500/20 text-amber-300' :
                                    result.category === 'harmless' ? 'bg-emerald-500/20 text-emerald-300' :
                                    'bg-gray-500/20 text-gray-300'
                                  }`}>
                                    {result.result}
                                  </div>
                                </div>
                              </motion.div>
                            ))
                        }
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* Domain Info Tab */}
                {activeTab === 'domain' && domainData && (
                  <motion.div 
                    className="space-y-6 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Domain Registration Info */}
                    <motion.div 
                      className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      whileHover={{ boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12), 0 0 1px rgba(255, 255, 255, 0.2)" }}
                    >
                      <h2 className="text-xl font-medium mb-4">Domain Registration</h2>
                      
                      {domainData.domainInfo.error ? (
                        <div className="backdrop-blur-md bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                          <p className="text-red-400">{domainData.domainInfo.error}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                            <p className="text-sm text-white/60 mb-1">Domain</p>
                            <p className="font-medium break-all">{domainData.domain}</p>
                          </div>
                          
                          <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                            <p className="text-sm text-white/60 mb-1">Domain Age</p>
                            <p className="font-medium">
                              {domainData.domainInfo.domainAge ? 
                                `${domainData.domainInfo.domainAge} days (${Math.floor(domainData.domainInfo.domainAge / 365)} years, ${Math.floor((domainData.domainInfo.domainAge % 365) / 30)} months)` : 
                                'Unknown'}
                            </p>
                          </div>
                          
                          <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                            <p className="text-sm text-white/60 mb-1">Registration Date</p>
                            <p className="font-medium">
                              {domainData.domainInfo.creationDate ? 
                                new Date(domainData.domainInfo.creationDate).toLocaleDateString() : 
                                'Unknown'}
                            </p>
                          </div>
                          
                          <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                            <p className="text-sm text-white/60 mb-1">Expiration Date</p>
                            <p className="font-medium">
                              {domainData.domainInfo.expirationDate ? 
                                new Date(domainData.domainInfo.expirationDate).toLocaleDateString() : 
                                'Unknown'}
                            </p>
                          </div>
                          
                          <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                            <p className="text-sm text-white/60 mb-1">Last Updated</p>
                            <p className="font-medium">
                              {domainData.domainInfo.lastUpdated ? 
                                new Date(domainData.domainInfo.lastUpdated).toLocaleDateString() : 
                                'Unknown'}
                            </p>
                          </div>
                          
                          <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                            <p className="text-sm text-white/60 mb-1">Registrar</p>
                            <p className="font-medium">{domainData.domainInfo.registrar || 'Unknown'}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Domain Age Risk Assessment */}
                      {domainData.domainInfo.domainAge !== undefined && domainData.domainInfo.domainAge !== null && (
                        <div className="mt-6">
                          <h3 className="text-sm font-medium mb-3 text-white/70">Domain Age Risk Assessment</h3>
                          <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="h-4 bg-black/50 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      domainData.domainInfo.domainAge < 30 ? 'bg-red-500' : 
                                      domainData.domainInfo.domainAge < 180 ? 'bg-amber-500' : 
                                      'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(5, Math.min(100, domainData.domainInfo.domainAge / 365 * 100)))}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div className="text-center">
                                <span className={`text-xl font-medium ${
                                  domainData.domainInfo.domainAge < 30 ? 'text-red-400' : 
                                  domainData.domainInfo.domainAge < 180 ? 'text-amber-400' : 
                                  'text-emerald-400'
                                }`}>
                                  {domainData.domainInfo.domainAge < 30 ? 'High Risk' : 
                                   domainData.domainInfo.domainAge < 180 ? 'Medium Risk' : 
                                   'Low Risk'}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm mt-2 text-white/70">
                              {domainData.domainInfo.domainAge < 30 ? 
                                'Recently created domains (less than 30 days old) are often used for phishing attacks.' : 
                                domainData.domainInfo.domainAge < 180 ? 
                                'Domains less than 6 months old have a higher risk of being used for malicious purposes.' : 
                                'Established domains (older than 6 months) are generally more trustworthy.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                    
                    {/* SSL Certificate Info */}
                    <motion.div 
                      className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      whileHover={{ boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12), 0 0 1px rgba(255, 255, 255, 0.2)" }}
                    >
                      <h2 className="text-xl font-medium mb-4">SSL Certificate</h2>
                      
                      {domainData.sslInfo.error ? (
                        <div className="backdrop-blur-md bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                          <p className="text-red-400">{domainData.sslInfo.error}</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Certificate Status */}
                          <div className="backdrop-blur-md rounded-xl p-4 border border-white/10 bg-black/50">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">Certificate Status</h3>
                              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                domainData.sslInfo.isValid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                              }`}>
                                {domainData.sslInfo.isValid ? 'Valid' : 'Invalid'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Certificate Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                              <p className="text-sm text-white/60 mb-1">Issued To</p>
                              <p className="font-medium">{domainData.sslInfo.subject?.CN || 'Unknown'}</p>
                            </div>
                            
                            <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                              <p className="text-sm text-white/60 mb-1">Issued By</p>
                              <p className="font-medium">
                                {domainData.sslInfo.issuer?.O ? 
                                  `${domainData.sslInfo.issuer.O} ${domainData.sslInfo.issuer.CN ? `(${domainData.sslInfo.issuer.CN})` : ''}` : 
                                  domainData.sslInfo.issuer?.CN || 'Unknown'}
                              </p>
                            </div>
                            
                            <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                              <p className="text-sm text-white/60 mb-1">Valid From</p>
                              <p className="font-medium">
                                {domainData.sslInfo.validFrom ? 
                                  new Date(domainData.sslInfo.validFrom).toLocaleString() : 
                                  'Unknown'}
                              </p>
                            </div>
                            
                            <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                              <p className="text-sm text-white/60 mb-1">Valid Until</p>
                              <p className="font-medium">
                                {domainData.sslInfo.validTo ? 
                                  new Date(domainData.sslInfo.validTo).toLocaleString() : 
                                  'Unknown'}
                              </p>
                            </div>
                            
                            <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                              <p className="text-sm text-white/60 mb-1">Certificate Age</p>
                              <p className="font-medium">{domainData.sslInfo.certAge ? `${domainData.sslInfo.certAge} days` : 'Unknown'}</p>
                            </div>
                            
                            <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                              <p className="text-sm text-white/60 mb-1">Days Until Expiration</p>
                              <p className={`font-medium ${
                                domainData.sslInfo.daysToExpiration && domainData.sslInfo.daysToExpiration < 30 ? 'text-red-400' : ''
                              }`}>
                                {domainData.sslInfo.daysToExpiration !== undefined ? 
                                  `${domainData.sslInfo.daysToExpiration} days` : 
                                  'Unknown'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Certificate Risk Assessment */}
                          <div className="mt-2">
                            <h3 className="text-sm font-medium mb-3 text-white/70">SSL Certificate Risk Assessment</h3>
                            <div className="backdrop-blur-md bg-black/50 rounded-xl p-4 border border-white/10">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <div className="h-4 bg-black/50 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        !domainData.sslInfo.isValid ? 'bg-red-500' : 
                                        domainData.sslInfo.certAge && domainData.sslInfo.certAge < 7 ? 'bg-amber-500' : 
                                        'bg-emerald-500'
                                      }`}
                                      style={{ width: `${
                                        !domainData.sslInfo.isValid ? 100 : 
                                        domainData.sslInfo.certAge && domainData.sslInfo.certAge < 7 ? 50 : 
                                        100
                                      }%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="text-center">
                                  <span className={`text-xl font-medium ${
                                    !domainData.sslInfo.isValid ? 'text-red-400' : 
                                    domainData.sslInfo.certAge && domainData.sslInfo.certAge < 7 ? 'text-amber-400' : 
                                    'text-emerald-400'
                                  }`}>
                                    {!domainData.sslInfo.isValid ? 'High Risk' : 
                                     domainData.sslInfo.certAge && domainData.sslInfo.certAge < 7 ? 'Medium Risk' : 
                                     'Low Risk'}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm mt-2 text-white/70">
                                {!domainData.sslInfo.isValid ? 
                                  'Invalid SSL certificate. This site may be insecure or impersonating a legitimate website.' : 
                                  domainData.sslInfo.certAge && domainData.sslInfo.certAge < 7 ? 
                                  'Recently issued certificates (less than 7 days old) can be a sign of a newly created phishing site.' : 
                                  'The SSL certificate appears valid and has been in use for some time.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
                
                {/* Screenshot Tab */}
                {activeTab === 'screenshot' && (
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
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-medium">Website Screenshot</h2>
                        <div className={`${securityRisk.color} px-4 py-1 rounded-full text-xs font-medium`}>
                          {securityRisk.level}
                        </div>
                      </div>
                      
                      {screenshotLoading && (
                        <div className="flex justify-center items-center py-20">
                          <div className="flex flex-col items-center gap-4">
                            <div className="relative w-12 h-12">
                              <motion.div 
                                className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 border-r-blue-500"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                              />
                            </div>
                            <p className="text-sm text-white/70">Generating screenshot...</p>
                          </div>
                        </div>
                      )}
                      
                      {screenshotError && (
                        <div className="backdrop-blur-md bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                          <p className="text-red-400">{screenshotError}</p>
                          <button 
                            onClick={loadScreenshot}
                            className="mt-4 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm hover:bg-black/70 transition-colors"
                          >
                            Try Again
                          </button>
                        </div>
                      )}
                      
                      {screenshotData && !screenshotLoading && !screenshotError && (
                        <div>
                          <div className="backdrop-blur-md bg-black/50 rounded-xl p-2 border border-white/10 overflow-hidden">
                            <div className="relative">
                              {securityRisk.score > 30 && (
                                <div id="screenshot-warning-overlay" className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-black/70 z-10">
                                  <div className="text-center p-6">
                                    <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-500/20 border border-red-500/30">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                      </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-red-400 mb-2">Warning: Potentially Malicious Site</h3>
                                    <p className="text-sm text-white/70 mb-4">This website has been flagged as potentially dangerous.</p>
                                    <button 
                                      className="bg-black/50 border border-white/20 rounded-lg px-6 py-2 text-sm hover:bg-red-500/20 hover:border-red-500/30 transition-colors"
                                      onClick={() => {
                                        const warningOverlay = document.getElementById('screenshot-warning-overlay');
                                        if (warningOverlay) warningOverlay.style.display = 'none';
                                      }}
                                    >
                                      View Anyway (Not Recommended)
                                    </button>
                                  </div>
                                </div>
                              )}
                              <img 
                                src={screenshotData.url} 
                                alt="Website Screenshot" 
                                className="w-full h-auto rounded-lg"
                                style={{ maxHeight: '600px', objectFit: 'contain' }}
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="backdrop-blur-md bg-black/50 rounded-xl p-3 border border-white/10">
                              <p className="text-xs text-white/60 mb-1">Dimensions</p>
                              <p className="font-medium">{screenshotData.width} × {screenshotData.height}</p>
                            </div>
                            <div className="backdrop-blur-md bg-black/50 rounded-xl p-3 border border-white/10">
                              <p className="text-xs text-white/60 mb-1">Format</p>
                              <p className="font-medium">{screenshotData.type.toUpperCase()}</p>
                            </div>
                            <div className="backdrop-blur-md bg-black/50 rounded-xl p-3 border border-white/10">
                              <p className="text-xs text-white/60 mb-1">Size</p>
                              <p className="font-medium">{screenshotData.size_pretty}</p>
                            </div>
                          </div>
                          
                          <div className="mt-6">
                            <div className="backdrop-blur-md bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
                              <div className="flex items-start gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400 mt-0.5">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="8" x2="12" y2="12"></line>
                                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <div>
                                  <p className="text-sm text-yellow-400 mb-1">Disclaimer</p>
                                  <p className="text-xs text-white/70">
                                    This screenshot is provided for analysis purposes only. The image is generated safely through a proxy service. 
                                    Do not enter any personal information on websites flagged as suspicious.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
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
                  Scanning URL
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
        
        {!loading && !scanData && !error && (
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
                <path d="M9 12l2 2 4-4"></path>
              </svg>
            </motion.div>
            <motion.h3 
              className="text-xl font-medium mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              Detect Phishing URLs
            </motion.h3>
            <motion.p 
              className="text-sm opacity-70 max-w-lg mx-auto mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              Enter a URL to analyze for phishing and security threats. 
              Our tool will check against multiple security engines to identify potential risks.
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