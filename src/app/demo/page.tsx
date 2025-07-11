'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface PhishTraceResponse {
  overview: {
    urlAnalysis: {
      riskLevel: string;
      url: string;
    };
    securityScore: {
      score: string;
      color: string;
    };
    detectionSummary: {
      malicious: number;
      suspicious: number;
      harmless: number;
      undetected: number;
    };
  };
  details: {
    originalUrl: string;
    finalUrl: string;
    pageTitle: string;
    analysisDate: string;
  };
  security: {
    engineCount: number;
    results: Array<{
      vendor: string;
      method: string;
      category: string;
      result: string;
    }>;
  };
  domainRegistration: {
    domain: string;
    domainAge: string;
    registrationDate: string;
    expirationDate: string;
    lastUpdated: string;
    registrar: string;
  };
  sslCertificate: {
    status: string;
    issuedTo: string;
    issuedBy: string;
    validFrom: string;
    validUntil: string;
    certAge: string;
    daysUntilExpiration: string;
    riskLevel: string;
    riskDescription: string;
  };
  screenshot: {
    url: string;
    dimensions: string;
    format: string;
    size: string;
    width: number;
    height: number;
  };
  phishingPatterns: any[];
  securityRisk: {
    level: string;
    color: string;
    score: string;
  };
}

export default function Demo() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisData, setAnalysisData] = useState<PhishTraceResponse | null>(null);
  const [showAllResults, setShowAllResults] = useState(false);

  const analyzeUrl = async (urlToAnalyze: string): Promise<void> => {
    if (!urlToAnalyze) {
      setError('Please enter a URL to analyze');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisData(null);

    try {
      const response = await fetch('https://api.traceonai.io/phishtrace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_TRACEON_API_KEY || 'e445a866-530b-4d9c-9f03-0fa5a2bb24d2',
        },
        body: JSON.stringify({
          url: urlToAnalyze
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze URL');
      }

      const data = await response.json();
      setAnalysisData(data);
    } catch (error) {
      console.error('Error analyzing URL:', error);
      setError('Failed to analyze URL. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await analyzeUrl(url);
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
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#00ff41] uppercase tracking-widest">
                SYNTHR
              </h1>
              <p className="text-xs text-[#00ff41]/50 uppercase tracking-wider">Phishing Analyzer v1.0</p>
            </div>
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
            PHISHING SCANNER
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
            Analyze URLs for phishing and security threats
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
              <label htmlFor="url" className="block text-sm font-medium mb-2 text-[#00ff41]/70 uppercase tracking-wider">
                URL to Analyze
              </label>
              <input
                type="text"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://"
                className="w-full px-4 py-3 bg-black border border-[#00ff41]/30 text-[#00ff41] placeholder-[#00ff41]/30 focus:outline-none focus:border-[#00ff41] transition-all font-mono"
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
                {loading ? 'ANALYZING...' : 'ANALYZE URL'}
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

        {/* Analysis Results */}
        {analysisData && !loading && (
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
                  ANALYSIS OVERVIEW
                </h2>
                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  analysisData.overview.urlAnalysis.riskLevel === 'Low Risk' ? 'border border-green-500 text-green-500' :
                  analysisData.overview.urlAnalysis.riskLevel === 'Medium Risk' ? 'border border-yellow-500 text-yellow-500' :
                  'border border-red-500 text-red-500'
                }`}>
                  {analysisData.overview.urlAnalysis.riskLevel}
                </span>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm uppercase font-bold mb-4 text-[#00ff41]/50 tracking-wider">
                      URL Information
                    </h3>
                    <div className="space-y-4">
                      <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                        <div className="text-sm text-[#00ff41]/50 mb-1">Original URL</div>
                        <div className="font-mono break-all">{analysisData.details.originalUrl}</div>
                      </div>
                      <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                        <div className="text-sm text-[#00ff41]/50 mb-1">Final URL</div>
                        <div className="font-mono break-all">{analysisData.details.finalUrl}</div>
                      </div>
                      <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                        <div className="text-sm text-[#00ff41]/50 mb-1">Page Title</div>
                        <div>{analysisData.details.pageTitle}</div>
                      </div>
                      <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                        <div className="text-sm text-[#00ff41]/50 mb-1">Analysis Date</div>
                        <div>{analysisData.details.analysisDate}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm uppercase font-bold mb-4 text-[#00ff41]/50 tracking-wider">
                      Security Overview
                    </h3>
                    <div className="space-y-4">
                      <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                        <div className="text-sm text-[#00ff41]/50 mb-1">Security Score</div>
                        <div className="flex items-center gap-2">
                          <div className="text-xl font-bold">{analysisData.overview.securityScore.score}</div>
                          <div className="text-sm text-[#00ff41]/50">/ 100</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-red-500/30 bg-red-500/5 p-4">
                          <div className="text-sm text-red-500 mb-1">Malicious</div>
                          <div className="text-xl font-bold text-red-500">{analysisData.overview.detectionSummary.malicious}</div>
                        </div>
                        <div className="border border-yellow-500/30 bg-yellow-500/5 p-4">
                          <div className="text-sm text-yellow-500 mb-1">Suspicious</div>
                          <div className="text-xl font-bold text-yellow-500">{analysisData.overview.detectionSummary.suspicious}</div>
                        </div>
                        <div className="border border-green-500/30 bg-green-500/5 p-4">
                          <div className="text-sm text-green-500 mb-1">Harmless</div>
                          <div className="text-xl font-bold text-green-500">{analysisData.overview.detectionSummary.harmless}</div>
                        </div>
                        <div className="border border-[#00ff41]/30 bg-[#00ff41]/5 p-4">
                          <div className="text-sm text-[#00ff41]/50 mb-1">Undetected</div>
                          <div className="text-xl font-bold">{analysisData.overview.detectionSummary.undetected}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Security Results */}
            <motion.div 
              className="border border-[#00ff41]/30 bg-[#00ff41]/5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-[#00ff41]/10 px-6 py-4 border-b border-[#00ff41]/30">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-[#00ff41] uppercase tracking-wider flex items-center gap-4">
                    <span>Security Analysis</span>
                    <span className="text-sm">Total Engines: {analysisData.security.engineCount}</span>
                  </h2>
                  <motion.button
                    onClick={() => setShowAllResults(!showAllResults)}
                    className="px-4 py-2 border border-[#00ff41] text-sm uppercase tracking-wider hover:bg-[#00ff41]/10"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {showAllResults ? 'Show Less' : 'Show All'}
                  </motion.button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {analysisData.security.results
                    .slice(0, showAllResults ? undefined : 10)
                    .map((result, index) => (
                    <motion.div 
                      key={index}
                      className={`border p-4 ${
                        result.category === 'malicious' ? 'border-red-500 bg-red-500/5' :
                        result.category === 'suspicious' ? 'border-yellow-500 bg-yellow-500/5' :
                        result.category === 'harmless' ? 'border-green-500 bg-green-500/5' :
                        'border-[#00ff41]/30 bg-[#00ff41]/5'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold uppercase tracking-wider">{result.vendor}</h3>
                          <p className="text-sm text-[#00ff41]/70 mt-1">Method: {result.method}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs uppercase tracking-wider ${
                          result.category === 'malicious' ? 'border border-red-500 text-red-500' :
                          result.category === 'suspicious' ? 'border border-yellow-500 text-yellow-500' :
                          result.category === 'harmless' ? 'border border-green-500 text-green-500' :
                          'border border-[#00ff41] text-[#00ff41]'
                        }`}>
                          {result.result}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  {!showAllResults && analysisData.security.results.length > 10 && (
                    <div className="text-center text-sm text-[#00ff41]/70 pt-2">
                      {analysisData.security.results.length - 10} more results not shown
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Domain & SSL Information */}
            <motion.div 
              className="border border-[#00ff41]/30 bg-[#00ff41]/5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-[#00ff41]/10 px-6 py-4 border-b border-[#00ff41]/30">
                <h2 className="text-xl font-bold text-[#00ff41] uppercase tracking-wider">
                  Domain & SSL Information
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Domain Registration */}
                  <div>
                    <h3 className="text-sm uppercase font-bold mb-4 text-[#00ff41]/50 tracking-wider">
                      Domain Registration
                    </h3>
                    <div className="space-y-4">
                      <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                        <div className="text-sm text-[#00ff41]/50 mb-1">Domain</div>
                        <div className="font-mono">{analysisData.domainRegistration.domain}</div>
                      </div>
                      <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                        <div className="text-sm text-[#00ff41]/50 mb-1">Domain Age</div>
                        <div>{analysisData.domainRegistration.domainAge}</div>
                      </div>
                      <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                        <div className="text-sm text-[#00ff41]/50 mb-1">Registration Date</div>
                        <div>{analysisData.domainRegistration.registrationDate}</div>
                      </div>
                      <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                        <div className="text-sm text-[#00ff41]/50 mb-1">Expiration Date</div>
                        <div>{analysisData.domainRegistration.expirationDate}</div>
                      </div>
                      <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                        <div className="text-sm text-[#00ff41]/50 mb-1">Registrar</div>
                        <div>{analysisData.domainRegistration.registrar}</div>
                      </div>
                    </div>
                  </div>

                  {/* SSL Certificate */}
                  <div>
                    <h3 className="text-sm uppercase font-bold mb-4 text-[#00ff41]/50 tracking-wider">
                      SSL Certificate
                    </h3>
                    <div className="space-y-4">
                      <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm text-[#00ff41]/50 mb-1">Status</div>
                            <div>{analysisData.sslCertificate.status}</div>
                          </div>
                          <span className={`px-2 py-1 text-xs uppercase tracking-wider ${
                            analysisData.sslCertificate.riskLevel === 'Low Risk' ? 'border border-green-500 text-green-500' :
                            analysisData.sslCertificate.riskLevel === 'Medium Risk' ? 'border border-yellow-500 text-yellow-500' :
                            'border border-red-500 text-red-500'
                          }`}>
                            {analysisData.sslCertificate.riskLevel}
                          </span>
                        </div>
                      </div>
                      <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                        <div className="text-sm text-[#00ff41]/50 mb-1">Issued To</div>
                        <div>{analysisData.sslCertificate.issuedTo}</div>
                      </div>
                      <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                        <div className="text-sm text-[#00ff41]/50 mb-1">Issued By</div>
                        <div>{analysisData.sslCertificate.issuedBy}</div>
                      </div>
                      <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                        <div className="text-sm text-[#00ff41]/50 mb-1">Valid From</div>
                        <div>{analysisData.sslCertificate.validFrom}</div>
                      </div>
                      <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                        <div className="text-sm text-[#00ff41]/50 mb-1">Valid Until</div>
                        <div>{analysisData.sslCertificate.validUntil}</div>
                      </div>
                      <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                        <div className="text-sm text-[#00ff41]/50 mb-1">Days Until Expiration</div>
                        <div>{analysisData.sslCertificate.daysUntilExpiration}</div>
                      </div>
                      <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                        <div className="text-sm text-[#00ff41]/50 mb-1">Risk Description</div>
                        <div className="text-sm">{analysisData.sslCertificate.riskDescription}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Screenshot */}
            {analysisData.screenshot && (
              <motion.div 
                className="border border-[#00ff41]/30 bg-[#00ff41]/5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="bg-[#00ff41]/10 px-6 py-4 border-b border-[#00ff41]/30">
                  <h2 className="text-xl font-bold text-[#00ff41] uppercase tracking-wider">
                    Website Screenshot
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-4">
                    <div className="relative w-full" style={{ paddingBottom: '62.5%' }}>
                      <img 
                        src={analysisData.screenshot.url} 
                        alt="Website Screenshot"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    </div>
                    <div className="mt-4 text-sm text-[#00ff41]/70 grid grid-cols-2 gap-4">
                      <div>Dimensions: {analysisData.screenshot.dimensions}</div>
                      <div>Format: {analysisData.screenshot.format}</div>
                      <div>Size: {analysisData.screenshot.size}</div>
                      <div>Resolution: {analysisData.screenshot.width} × {analysisData.screenshot.height}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Initial State */}
        {!loading && !analysisData && !error && (
          <motion.div 
            className="border border-[#00ff41]/30 bg-[#00ff41]/5 p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="mx-auto w-20 h-20 mb-6 flex items-center justify-center border border-[#00ff41]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#00ff41]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                <line x1="6" y1="1" x2="6" y2="4"></line>
                <line x1="10" y1="1" x2="10" y2="4"></line>
                <line x1="14" y1="1" x2="14" y2="4"></line>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-[#00ff41] uppercase tracking-wider">
              ENTER URL TO ANALYZE
            </h2>
            <div className="h-1 w-40 mx-auto bg-[#00ff41]/50 mb-6"></div>
            <p className="max-w-md mx-auto text-[#00ff41]/70 uppercase tracking-wide">
              PASTE A URL ABOVE TO ANALYZE FOR PHISHING AND SECURITY THREATS
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
              const value = i % 2 === 0 ? '1' : '0';
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