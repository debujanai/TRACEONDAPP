import React from 'react';
import { motion } from 'framer-motion';

interface LiquidityData {
  address: string;
  security: {
    top_10_holder_rate: string;
    buy_tax: string;
    sell_tax: string;
    lockInfo?: Array<{
      address: string;
      balance: string;
      percent: string;
      tag?: string;
      is_locked?: number;
      locked_detail?: Array<{
        amount: string;
        end_time: string;
        opt_time: string;
      }>;
    }>;
    lock_summary?: {
      is_locked: boolean;
      lock_percent: string;
      left_lock_percent: string;
    };
  };
}

interface LiquidityInfoProps {
  data: LiquidityData;
}

const LiquidityInfo: React.FC<LiquidityInfoProps> = ({ data }) => {
  // Calculate liquidity health score (improved version)
  const isLiquidityLocked = data.security.lock_summary?.is_locked || false;
  const lockPercentage = data.security.lock_summary?.lock_percent || '0';
  
  // Format top holder rate - if it's a decimal value like 0.19, convert to 19%
  const rawTopHolderRate = data.security.top_10_holder_rate || '0';
  const topHolderRateNum = parseFloat(rawTopHolderRate);
  const formattedTopHolderRate = topHolderRateNum <= 1 ? 
    `${(topHolderRateNum * 100).toFixed(2)}`.replace(/\.00$/, '') : 
    rawTopHolderRate;
  
  const buyTax = parseFloat(data.security.buy_tax || '0');
  const sellTax = parseFloat(data.security.sell_tax || '0');

  // Calculate health score: 0-100 with improved weighting
  let liquidityHealthScore = 0;
  
  // Convert lock percentage to a number between 0-100
  const lockPercentageNum = parseFloat(lockPercentage);
  const normalizedLockPercentage = lockPercentageNum <= 1 ? lockPercentageNum * 100 : lockPercentageNum;
  
  // Convert top holder rate to a percentage between 0-100
  const topHolderRatePercent = topHolderRateNum <= 1 ? topHolderRateNum * 100 : topHolderRateNum;
  
  // 1. Liquidity Lock Score (0-40 points)
  if (isLiquidityLocked) {
    // Scale points based on lock percentage: 0% locked = 0 points, 100% locked = 40 points
    liquidityHealthScore += Math.min(40, normalizedLockPercentage * 0.4);
  }
  
  // 2. Holder Concentration Score (0-35 points)
  // Lower concentration (lower top holder rate) is better
  if (topHolderRatePercent <= 20) {
    liquidityHealthScore += 35; // Excellent distribution
  } else if (topHolderRatePercent <= 40) {
    liquidityHealthScore += 28; // Very good distribution
  } else if (topHolderRatePercent <= 60) {
    liquidityHealthScore += 21; // Good distribution
  } else if (topHolderRatePercent <= 80) {
    liquidityHealthScore += 14; // Concerning concentration
  } else {
    liquidityHealthScore += 7; // High concentration risk
  }
  
  // 3. Tax Structure Score (0-25 points)
  // Calculate average tax
  const avgTax = (buyTax + sellTax) / 2;
  
  if (avgTax <= 1) {
    liquidityHealthScore += 25; // Excellent tax structure
  } else if (avgTax <= 3) {
    liquidityHealthScore += 20; // Very good tax structure
  } else if (avgTax <= 5) {
    liquidityHealthScore += 15; // Good tax structure
  } else if (avgTax <= 10) {
    liquidityHealthScore += 10; // Moderate tax structure
  } else if (avgTax <= 15) {
    liquidityHealthScore += 5; // High tax structure
  } // 0 points for extremely high taxes
  
  // Round the score
  liquidityHealthScore = Math.round(liquidityHealthScore);
  
  // Determine status based on score
  const getLiquidityStatus = () => {
    if (liquidityHealthScore >= 80) return { text: 'Excellent', color: 'green' };
    if (liquidityHealthScore >= 65) return { text: 'Good', color: 'green' };
    if (liquidityHealthScore >= 50) return { text: 'Moderate', color: 'orange' };
    if (liquidityHealthScore >= 30) return { text: 'Risky', color: 'orange' };
    return { text: 'High Risk', color: 'red' };
  };
  
  const status = getLiquidityStatus();

  // For lockPercentage display
  const getFormattedPercentage = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0%';
    const percent = num <= 1 ? num * 100 : num;
    return `${percent % 1 === 0 ? percent : percent.toFixed(2)}`.replace(/\.00$/, '') + '%';
  };

  return (
    <div className="space-y-6">
      {/* Liquidity Health Score */}
      <motion.div
        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-sm uppercase tracking-wider text-white/70 mb-4">LIQUIDITY HEALTH SCORE</h2>
        
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-['ClashGrotesk-Regular'] bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              {liquidityHealthScore}/100
            </span>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              status.color === 'green' ? 'bg-green-500/20 text-green-400' : 
              status.color === 'orange' ? 'bg-orange-500/20 text-orange-400' : 
              'bg-red-500/20 text-red-400'
            }`}>
              {status.text}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-400"></div>
            <span className="text-xs text-white/70">Good</span>
            
            <div className="h-3 w-3 rounded-full bg-orange-400 ml-2"></div>
            <span className="text-xs text-white/70">Moderate</span>
            
            <div className="h-3 w-3 rounded-full bg-red-400 ml-2"></div>
            <span className="text-xs text-white/70">High Risk</span>
          </div>
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="backdrop-blur-md bg-black/30 rounded-xl p-4 border border-white/10">
            <div className="text-xs text-white/70 mb-1">Top 10 Holders</div>
            <div className="text-xl font-medium">{formattedTopHolderRate}%</div>
          </div>
          
          <div className="backdrop-blur-md bg-black/30 rounded-xl p-4 border border-white/10">
            <div className="text-xs text-white/70 mb-1">LP Locked</div>
            <div className="text-xl font-medium">
              {isLiquidityLocked ? 'Yes' : 'No'}
            </div>
          </div>
          
          <div className="backdrop-blur-md bg-black/30 rounded-xl p-4 border border-white/10">
            <div className="text-xs text-white/70 mb-1">Buy Tax</div>
            <div className="text-xl font-medium">{buyTax}%</div>
          </div>
          
          <div className="backdrop-blur-md bg-black/30 rounded-xl p-4 border border-white/10">
            <div className="text-xs text-white/70 mb-1">Sell Tax</div>
            <div className="text-xl font-medium">{sellTax}%</div>
          </div>
        </div>
      </motion.div>

      {/* Liquidity Lock Details */}
      <motion.div
        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h2 className="text-sm uppercase tracking-wider text-white/70 mb-6">Liquidity Lock Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="backdrop-blur-md bg-black/30 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
              Liquidity Lock Status
            </h3>
            <div className="flex items-center gap-3">
              {isLiquidityLocked ? (
                <div className="flex items-center text-green-400 gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span className="font-medium">Locked</span>
                </div>
              ) : (
                <div className="flex items-center text-red-400 gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  <span className="font-medium">Not Locked</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="backdrop-blur-md bg-black/30 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
              Lock Percentage
            </h3>
            <div className="text-xl font-medium">
              {getFormattedPercentage(lockPercentage)}
            </div>
          </div>
        </div>
        
        {/* LP Holders List */}
        {data.security.lockInfo && data.security.lockInfo.length > 0 && (
          <div className="mt-6 backdrop-blur-md bg-black/30 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-medium mb-4">LP Holder Distribution</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {data.security.lockInfo.map((holder, index) => (
                <div key={index} className="bg-black/40 rounded-lg p-3 border border-white/10">
                  <div className="flex justify-between items-center">
                    <div className="truncate max-w-[200px] md:max-w-md">
                      <div className="text-sm font-medium truncate">{holder.address}</div>
                      {holder.tag && (
                        <div className="text-xs text-white/60">{holder.tag}</div>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-sm font-medium">{getFormattedPercentage(holder.percent)}</div>
                      {holder.is_locked === 1 && (
                        <div className="text-xs text-green-400">Locked</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LiquidityInfo; 