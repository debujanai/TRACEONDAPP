import { motion } from 'framer-motion';
import Image from 'next/image';

interface TokenStatsData {
  holder_count: number;
  bluechip_owner_count: number;
  bluechip_owner_percentage: string;
  signal_count: number;
  degen_call_count: number;
  top_rat_trader_percentage: string;
  top_bundler_trader_percentage: string;
  top_entrapment_trader_percentage: string;
}

interface TokenData {
  data: {
    attributes: {
      name: string;
      symbol: string;
      total_supply: string;
      price_usd: string;
      image_url: string | null;
    }
  }
}

interface TokenStatsInfoProps {
  data: TokenStatsData;
  tokenData?: TokenData;
}

export default function TokenStatsInfo({ data, tokenData }: TokenStatsInfoProps) {
  // Format percentage for display
  const formatPercentage = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0%';
    return `${(numValue * 100).toFixed(2)}%`;
  };

  // Format large numbers with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  // Format token price
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return '$0.00';
    
    if (numPrice < 0.00001) {
      return `$${numPrice.toExponential(4)}`;
    }
    
    return `$${numPrice.toFixed(numPrice < 0.01 ? 8 : 4)}`;
  };
  
  // Format token supply
  const formatSupply = (supply: string) => {
    const numSupply = parseFloat(supply);
    if (isNaN(numSupply)) return '0';
    
    if (numSupply >= 1_000_000_000) {
      return `${(numSupply / 1_000_000_000).toFixed(2)}B`;
    } else if (numSupply >= 1_000_000) {
      return `${(numSupply / 1_000_000).toFixed(2)}M`;
    } else if (numSupply >= 1_000) {
      return `${(numSupply / 1_000).toFixed(2)}K`;
    }
    
    return numSupply.toFixed(2);
  };

  // Get color based on percentage value
  const getPercentageColor = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'text-white';
    
    if (numValue >= 0.5) return 'text-red-400';
    if (numValue >= 0.25) return 'text-orange-400';
    if (numValue >= 0.1) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <motion.div 
        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl font-medium mb-6">Token Overview</h2>
        
        {/* Token Basic Information */}
        {tokenData && (
          <div className="mb-6 bg-black/20 p-4 rounded-lg border border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                {tokenData.data.attributes.image_url ? (
                  <div className="h-10 w-10 rounded-full overflow-hidden">
                    <Image 
                      src={tokenData.data.attributes.image_url} 
                      alt={`${tokenData.data.attributes.name} logo`}
                      className="h-full w-full object-cover"
                      width={40}
                      height={40}
                      onError={(e) => {
                        // If image fails to load, replace with the letter
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.classList.add('bg-gradient-to-br', 'from-purple-500/30', 'to-blue-500/30', 'flex', 'items-center', 'justify-center');
                        const span = document.createElement('span');
                        span.className = 'text-lg font-bold';
                        span.textContent = tokenData.data.attributes.symbol.charAt(0);
                        target.parentElement!.appendChild(span);
                      }}
                    />
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-purple-500/30 to-blue-500/30 h-10 w-10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold">{tokenData.data.attributes.symbol.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium">{tokenData.data.attributes.name}</h3>
                  <p className="text-sm text-white/70">{tokenData.data.attributes.symbol}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="bg-black/30 px-4 py-2 rounded-lg">
                  <div className="text-xs text-white/70">Price</div>
                  <div className="text-base font-medium">{formatPrice(tokenData.data.attributes.price_usd)}</div>
                </div>
                <div className="bg-black/30 px-4 py-2 rounded-lg">
                  <div className="text-xs text-white/70">Total Supply</div>
                  <div className="text-base font-medium">{formatSupply(tokenData.data.attributes.total_supply)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Holder Statistics */}
          <div className="bg-black/20 p-4 rounded-lg border border-white/10">
            <h3 className="text-base font-medium mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Holder Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Total Holders:</span>
                <span className="text-white font-medium">{formatNumber(data.holder_count)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Bluechip Owners:</span>
                <span className="text-white font-medium">{formatNumber(data.bluechip_owner_count)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Bluechip Owner %:</span>
                <span className={`font-medium ${getPercentageColor(data.bluechip_owner_percentage)}`}>
                  {formatPercentage(data.bluechip_owner_percentage)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Trading Signals */}
          <div className="bg-black/20 p-4 rounded-lg border border-white/10">
            <h3 className="text-base font-medium mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                <polyline points="16 7 22 7 22 13"></polyline>
              </svg>
              Trading Activity
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Signal Count:</span>
                <span className="text-white font-medium">{formatNumber(data.signal_count)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Degen Call Count:</span>
                <span className="text-white font-medium">{formatNumber(data.degen_call_count)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Trader Percentages */}
        <div className="mt-6 bg-black/20 p-4 rounded-lg border border-white/10">
          <h3 className="text-base font-medium mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Trader Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/30 p-3 rounded-lg">
              <div className="text-xs text-white/70 mb-1">Rat Trader %</div>
              <div className={`text-lg font-medium ${getPercentageColor(data.top_rat_trader_percentage)}`}>
                {formatPercentage(data.top_rat_trader_percentage)}
              </div>
            </div>
            <div className="bg-black/30 p-3 rounded-lg">
              <div className="text-xs text-white/70 mb-1">Bundler Trader %</div>
              <div className={`text-lg font-medium ${getPercentageColor(data.top_bundler_trader_percentage)}`}>
                {formatPercentage(data.top_bundler_trader_percentage)}
              </div>
            </div>
            <div className="bg-black/30 p-3 rounded-lg">
              <div className="text-xs text-white/70 mb-1">Entrapment Trader %</div>
              <div className={`text-lg font-medium ${getPercentageColor(data.top_entrapment_trader_percentage)}`}>
                {formatPercentage(data.top_entrapment_trader_percentage)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Risk Assessment */}
        <div className="mt-6 bg-black/20 p-4 rounded-lg border border-white/10">
          <h3 className="text-base font-medium mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Risk Assessment
          </h3>
          <div className="space-y-3 text-sm">
            {parseFloat(data.top_rat_trader_percentage) > 0.1 && (
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>High percentage of rat traders may indicate potential market manipulation.</span>
              </div>
            )}
            
            {parseFloat(data.top_bundler_trader_percentage) > 0.1 && (
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>Presence of bundler traders suggests coordinated trading activity.</span>
              </div>
            )}
            
            {parseFloat(data.top_entrapment_trader_percentage) > 0.1 && (
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>Entrapment traders detected - exercise caution when trading this token.</span>
              </div>
            )}
            
            {data.degen_call_count > 5 && (
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>High number of degen calls indicates speculative trading interest.</span>
              </div>
            )}
            
            {parseFloat(data.bluechip_owner_percentage) < 0.1 && (
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>Low percentage of bluechip owners may indicate less institutional interest.</span>
              </div>
            )}
            
            {/* Default message if no risks detected */}
            {parseFloat(data.top_rat_trader_percentage) <= 0.1 && 
             parseFloat(data.top_bundler_trader_percentage) <= 0.1 && 
             parseFloat(data.top_entrapment_trader_percentage) <= 0.1 && 
             data.degen_call_count <= 5 && 
             parseFloat(data.bluechip_owner_percentage) >= 0.1 && (
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>No significant risk factors detected in the token stats.</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 