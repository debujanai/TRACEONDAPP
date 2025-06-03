'use client';

import { useRouter } from 'next/navigation';
import { useToken } from '@/contexts/TokenContext';
import { useWallet } from '@/contexts/WalletContext';
import { addSearchToHistory } from '@/lib/supabase';
import { calculateRiskScore } from '@/lib/token-analysis';
import { motion } from 'framer-motion';

const TokenSearchForm = () => {
  const router = useRouter();
  const { isConnected, useCredits: spendCredits, userProfile } = useWallet();
  const {
    address, setAddress,
    setLoading, setError,
    setSecurityInfo, setRugAnalysis, setLaunchSecurity,
    setTokenStats, setTopTraders, setTokenRisk, setAnalysisComplete
  } = useToken();

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
    
    try {
      // Use the token-investigation API endpoint that returns all data
      const response = await fetch('/api/token-investigation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Set all the data from the combined response
      setSecurityInfo(data.securityInfo || null);
      setRugAnalysis(data.rugAnalysis || null);
      setLaunchSecurity(data.launchSecurity || null);
      setTokenStats(data.tokenStats || null);
      setTopTraders(Array.isArray(data.topTraders?.data) ? data.topTraders.data : []);
      
      // Calculate risk score based on fetched data
      const riskScore = calculateRiskScore(data.securityInfo, data.launchSecurity, data.rugAnalysis);
      setTokenRisk(riskScore);
      
      setAnalysisComplete(true);
      
      // Navigate to rugtrace page
      router.push(`/rugtrace`);
    } catch (err) {
      console.error('API error:', err);
      setError('Failed to fetch token data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter token address..."
          className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors"
        />
        <motion.button 
          type="submit" 
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-lg px-6 py-3 transition-colors duration-300 disabled:opacity-50 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 border border-white/10"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          Analyze Token
        </motion.button>
      </form>
    </div>
  );
};

export default TokenSearchForm;