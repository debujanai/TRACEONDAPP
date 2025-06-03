import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';

// Define the types for our traders data
interface TraderData {
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
}

interface TopTradersInfoProps {
  data: {
    code: number;
    msg: string;
    data: TraderData[];
  };
}

// Function to format tag text for display
const formatTagText = (tag: string): string => {
  // Special case handling for common tags
  if (tag === 'transfer_in') return 'Transfer In';
  if (tag === 'is_new' || tag === 'new_wallet') return 'New Wallet';
  if (tag === 'suspicious') return 'Suspicious';
  
  // General formatting for other tags - capitalize words and replace underscores with spaces
  return tag
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Function to get tag color based on tag type
const getTagColor = (tag: string): string => {
  // Special cases
  if (tag === 'transfer_in') {
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  }
  
  if (tag === 'new_wallet' || tag === 'is_new') {
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  }
  
  if (tag === 'suspicious') {
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
  
  // Standard tag types
  if (tag.includes('scam') || tag.includes('suspicious')) {
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  } else if (tag.includes('whale') || tag === 'TOP61' || tag.includes('TOP')) {
    return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  } else if (tag.includes('transfer')) {
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  } else if (tag === 'smart_degen' || tag.includes('smart')) {
    return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
  } else if (tag.includes('owner')) {
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  } else if (tag === 'sandwich_bot' || tag.includes('bot')) {
    return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  }
  return 'bg-green-500/20 text-green-400 border-green-500/30';
};

export default function TopTradersInfo({ data }: TopTradersInfoProps) {
  const [sortField, setSortField] = useState<keyof TraderData>('profit');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  
  // Only show wallets that have tags (from tags array, maker_token_tags array, or special flags)
  // But exclude wallets that only have TOP tags and no other meaningful tags
  const walletsWithTags = useMemo(() => {
    // Move safeData initialization inside useMemo
    const safeData = data?.data || [];
    
    return safeData.filter(trader => {
      // Check for special flags first (always include these)
      if (trader.transfer_in || trader.is_new || trader.is_suspicious) {
        return true;
      }
      
      // Get all tags for this trader
      const traderTags = [
        ...(trader.tags || []),
        ...(trader.maker_token_tags || [])
      ];
      
      if (trader.wallet_tag_v2) {
        traderTags.push(trader.wallet_tag_v2);
      }
      
      // If no tags at all, exclude
      if (traderTags.length === 0) {
        return false;
      }
      
      // Check if it has any non-TOP tags
      const hasNonTopTags = traderTags.some(tag => 
        !(tag.startsWith('TOP') || /TOP\d+/.test(tag))
      );
      
      // Include if it has any non-TOP tags
      return hasNonTopTags;
    });
  }, [data]);
  
  // Extract all unique tags for the filter tabs, but exclude TOP tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    
    walletsWithTags.forEach(trader => {
      // Add wallet_tag_v2 if exists and is not a TOP tag
      if (trader.wallet_tag_v2 && !trader.wallet_tag_v2.startsWith('TOP') && !/TOP\d+/.test(trader.wallet_tag_v2)) {
        tagSet.add(trader.wallet_tag_v2);
      }
      
      // Add tags from tags array, excluding TOP tags
      if (trader.tags && trader.tags.length > 0) {
        trader.tags.forEach(tag => {
          if (!tag.startsWith('TOP') && !/TOP\d+/.test(tag)) {
            tagSet.add(tag);
          }
        });
      }
      
      // Add tags from maker_token_tags array, excluding TOP tags
      if (trader.maker_token_tags && trader.maker_token_tags.length > 0) {
        trader.maker_token_tags.forEach(tag => {
          if (!tag.startsWith('TOP') && !/TOP\d+/.test(tag)) {
            tagSet.add(tag);
          }
        });
      }
      
      // Add special flags as tags
      if (trader.transfer_in) tagSet.add('transfer_in');
      if (trader.is_new) tagSet.add('new_wallet');
      if (trader.is_suspicious) tagSet.add('suspicious');
    });
    
    // Sort tags alphabetically for better UX
    return ['all', ...Array.from(tagSet).sort()];
  }, [walletsWithTags]);
  
  // Filter wallets based on selected tag
  const filteredWallets = useMemo(() => {
    if (selectedTag === 'all') {
      return walletsWithTags;
    }
    
    return walletsWithTags.filter(trader => {
      // Check wallet_tag_v2
      if (trader.wallet_tag_v2 === selectedTag) return true;
      
      // Check tags array
      if (trader.tags && trader.tags.includes(selectedTag)) return true;
      
      // Check maker_token_tags array
      if (trader.maker_token_tags && trader.maker_token_tags.includes(selectedTag)) return true;
      
      // Check special flags
      if (selectedTag === 'transfer_in' && trader.transfer_in) return true;
      if (selectedTag === 'new_wallet' && trader.is_new) return true;
      if (selectedTag === 'suspicious' && trader.is_suspicious) return true;
      
      return false;
    });
  }, [walletsWithTags, selectedTag]);
  
  const handleSort = (field: keyof TraderData) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Sort the filtered wallets based on sort field and direction
  const sortedData = useMemo(() => {
    return [...filteredWallets].sort((a, b) => {
      // Handle number sorting
      if (typeof a[sortField] === 'number' && typeof b[sortField] === 'number') {
        return sortDirection === 'asc' 
          ? (a[sortField] as number) - (b[sortField] as number)
          : (b[sortField] as number) - (a[sortField] as number);
      }
      
      // Handle string sorting
      if (typeof a[sortField] === 'string' && typeof b[sortField] === 'string') {
        return sortDirection === 'asc'
          ? (a[sortField] as string).localeCompare(b[sortField] as string)
          : (b[sortField] as string).localeCompare(a[sortField] as string);
      }
      
      // Default return for null/undefined cases
      return 0;
    });
  }, [filteredWallets, sortField, sortDirection]);
  
  // Format large numbers for display
  const formatNumber = (num: number) => {
    if (Math.abs(num) >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    } else if (Math.abs(num) >= 1_000) {
      return `${(num / 1_000).toFixed(2)}K`;
    } else {
      return num.toFixed(2);
    }
  };
  
  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return 'Unknown';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Get all tags for a trader, excluding TOP tags
  const getAllTags = (trader: TraderData) => {
    const allTags: string[] = [];
    
    // Add tags from tags array
    if (trader.tags && trader.tags.length > 0) {
      trader.tags.forEach(tag => {
        if (!tag.startsWith('TOP') && !/TOP\d+/.test(tag)) {
          allTags.push(tag);
        }
      });
    }
    
    // Add tags from maker_token_tags array
    if (trader.maker_token_tags && trader.maker_token_tags.length > 0) {
      trader.maker_token_tags.forEach(tag => {
        if (!tag.startsWith('TOP') && !/TOP\d+/.test(tag)) {
          allTags.push(tag);
        }
      });
    }
    
    // Add wallet_tag_v2 if it's not a TOP tag
    if (trader.wallet_tag_v2 && !trader.wallet_tag_v2.startsWith('TOP') && !/TOP\d+/.test(trader.wallet_tag_v2)) {
      allTags.push(trader.wallet_tag_v2);
    }
    
    // Add special flags
    if (trader.transfer_in) allTags.push('transfer_in');
    if (trader.is_new) allTags.push('new_wallet');
    if (trader.is_suspicious) allTags.push('suspicious');
    
    return allTags;
  };
  
  // Handle non-existent or empty data
  if (!data || !data.data || data.data.length === 0) {
    return (
      <motion.div 
        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl font-medium mb-4">No Wallet Data Available</h2>
        <p className="text-white/70">Unable to fetch wallet information for this token.</p>
      </motion.div>
    );
  }
  
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
        <h2 className="text-xl font-medium mb-6">Key Wallets Involved</h2>
        
        {/* Tag Filter Tabs */}
        <div className="mb-6">
          <p className="text-sm text-white/70 mb-2">Filter by wallet tag:</p>
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-2 pb-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                    selectedTag === tag
                      ? `${tag === 'all' ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-white/20 text-white' : getTagColor(tag)}`
                      : 'bg-black/30 text-white/70 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  {tag === 'all' ? 'All Tags' : formatTagText(tag)}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Total Number of Wallets */}
        <div className="mb-4 text-sm text-white/70">
          <span>{selectedTag === 'all' ? 'Total' : formatTagText(selectedTag)} wallets: </span>
          <span className="font-medium text-white">{filteredWallets.length}</span>
          {selectedTag !== 'all' && (
            <span> (out of {walletsWithTags.length} total)</span>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-white/60 border-b border-white/10">
                <th className="text-left pb-3 px-3">
                  <button 
                    onClick={() => handleSort('address')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Wallet
                    {sortField === 'address' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="text-right pb-3 px-3">
                  <button 
                    onClick={() => handleSort('buy_volume_cur')}
                    className="flex items-center justify-end gap-1 hover:text-white transition-colors ml-auto"
                  >
                    Buy Volume ($)
                    {sortField === 'buy_volume_cur' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="text-right pb-3 px-3">
                  <button 
                    onClick={() => handleSort('sell_volume_cur')}
                    className="flex items-center justify-end gap-1 hover:text-white transition-colors ml-auto"
                  >
                    Sell Volume ($)
                    {sortField === 'sell_volume_cur' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="text-right pb-3 px-3">
                  <button 
                    onClick={() => handleSort('buy_tx_count_cur')}
                    className="flex items-center justify-end gap-1 hover:text-white transition-colors ml-auto"
                  >
                    Buy Txs
                    {sortField === 'buy_tx_count_cur' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="text-right pb-3 px-3">
                  <button 
                    onClick={() => handleSort('sell_tx_count_cur')}
                    className="flex items-center justify-end gap-1 hover:text-white transition-colors ml-auto"
                  >
                    Sell Txs
                    {sortField === 'sell_tx_count_cur' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="text-right pb-3 px-3">
                  <button 
                    onClick={() => handleSort('netflow_usd')}
                    className="flex items-center justify-end gap-1 hover:text-white transition-colors ml-auto"
                  >
                    Net Flow ($)
                    {sortField === 'netflow_usd' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="text-right pb-3 px-3">
                  <button 
                    onClick={() => handleSort('profit')}
                    className="flex items-center justify-end gap-1 hover:text-white transition-colors ml-auto"
                  >
                    Profit ($)
                    {sortField === 'profit' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="text-right pb-3 px-3">
                  <button 
                    onClick={() => handleSort('last_active_timestamp')}
                    className="flex items-center justify-end gap-1 hover:text-white transition-colors ml-auto"
                  >
                    Last Active
                    {sortField === 'last_active_timestamp' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="text-left pb-3 px-3">
                  <span className="flex items-center gap-1">
                    Tags
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((trader) => (
                <tr 
                  key={trader.address} 
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                    trader.is_suspicious ? 'bg-red-500/10' : ''
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <a 
                        href={`https://etherscan.io/address/${trader.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-blue-400 hover:underline"
                      >
                        {formatAddress(trader.address)}
                      </a>
                      
                      {/* Twitter username if available */}
                      {trader.twitter_username && (
                        <a
                          href={`https://twitter.com/${trader.twitter_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                        >
                          @{trader.twitter_username}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="text-right py-3 px-3 font-mono text-green-400">${formatNumber(trader.buy_volume_cur)}</td>
                  <td className="text-right py-3 px-3 font-mono text-red-400">${formatNumber(trader.sell_volume_cur)}</td>
                  <td className="text-right py-3 px-3 font-mono">{trader.buy_tx_count_cur}</td>
                  <td className="text-right py-3 px-3 font-mono">{trader.sell_tx_count_cur}</td>
                  <td className={`text-right py-3 px-3 font-mono ${
                    trader.netflow_usd > 0 ? 'text-green-400' : 
                    trader.netflow_usd < 0 ? 'text-red-400' : ''
                  }`}>
                    {trader.netflow_usd > 0 ? '+' : ''}{formatNumber(trader.netflow_usd)}
                  </td>
                  <td className={`text-right py-3 px-3 font-mono ${
                    trader.profit > 0 ? 'text-green-400' : 
                    trader.profit < 0 ? 'text-red-400' : ''
                  }`}>
                    {trader.profit > 0 ? '+' : ''}{formatNumber(trader.profit)}
                  </td>
                  <td className="text-right py-3 px-3 text-white/60">
                    {formatDate(trader.last_active_timestamp)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {getAllTags(trader).map((tag, index) => (
                        <span 
                          key={index} 
                          className={`px-2 py-0.5 rounded-full text-xs border ${getTagColor(tag)}`}
                        >
                          {formatTagText(tag)}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedData.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-white/60">No wallets found with the selected tag.</p>
          </div>
        )}
        
        {sortedData.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/20 p-4 rounded-lg border border-white/10">
              <h3 className="text-sm font-medium mb-2">Trading Stats Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/70 text-xs">Total Buy Volume:</span>
                  <span className="text-green-400 font-medium">${formatNumber(sortedData.reduce((sum, trader) => sum + trader.buy_volume_cur, 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70 text-xs">Total Sell Volume:</span>
                  <span className="text-red-400 font-medium">${formatNumber(sortedData.reduce((sum, trader) => sum + trader.sell_volume_cur, 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70 text-xs">Total Buy Transactions:</span>
                  <span className="font-medium">{sortedData.reduce((sum, trader) => sum + trader.buy_tx_count_cur, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70 text-xs">Total Sell Transactions:</span>
                  <span className="font-medium">{sortedData.reduce((sum, trader) => sum + trader.sell_tx_count_cur, 0)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-black/20 p-4 rounded-lg border border-white/10">
              <h3 className="text-sm font-medium mb-2">Top Trader Types</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/70 text-xs">Suspicious Wallets:</span>
                  <span className="text-red-400 font-medium">{sortedData.filter(trader => trader.is_suspicious).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70 text-xs">New Wallets:</span>
                  <span className="text-green-400 font-medium">{sortedData.filter(trader => trader.is_new).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70 text-xs">Early Sellers:</span>
                  <span className="font-medium">{sortedData.filter(trader => trader.sell_tx_count_cur > trader.buy_tx_count_cur).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70 text-xs">Profitable Traders:</span>
                  <span className="font-medium">{sortedData.filter(trader => trader.profit > 0).length}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-black/20 p-4 rounded-lg border border-white/10">
              <h3 className="text-sm font-medium mb-2">Risk Analysis</h3>
              <div className="space-y-3">
                {sortedData.filter(trader => trader.is_suspicious).length > 0 && (
                  <div className="text-xs text-red-400">
                    <span className="font-medium">Warning:</span> {sortedData.filter(trader => trader.is_suspicious).length} suspicious wallets detected
                  </div>
                )}
                
                {sortedData.filter(trader => trader.profit > 10000).length > 0 && (
                  <div className="text-xs text-yellow-400">
                    <span className="font-medium">Note:</span> {sortedData.filter(trader => trader.profit > 10000).length} traders made over $10K profits
                  </div>
                )}
                
                {sortedData.filter(trader => trader.sell_volume_cur > trader.buy_volume_cur * 2).length > 0 && (
                  <div className="text-xs text-orange-400">
                    <span className="font-medium">Caution:</span> {sortedData.filter(trader => trader.sell_volume_cur > trader.buy_volume_cur * 2).length} wallets sold more than twice what they bought
                  </div>
                )}
                
                {sortedData.filter(trader => 
                  (trader.tags && trader.tags.some(tag => tag.toLowerCase().includes('whale'))) ||
                  (trader.wallet_tag_v2 && trader.wallet_tag_v2.toLowerCase().includes('whale')) ||
                  (trader.maker_token_tags && trader.maker_token_tags.some(tag => tag.toLowerCase().includes('whale')))
                ).length > 0 && (
                  <div className="text-xs text-purple-400">
                    <span className="font-medium">Important:</span> {sortedData.filter(trader => 
                      (trader.tags && trader.tags.some(tag => tag.toLowerCase().includes('whale'))) ||
                      (trader.wallet_tag_v2 && trader.wallet_tag_v2.toLowerCase().includes('whale')) ||
                      (trader.maker_token_tags && trader.maker_token_tags.some(tag => tag.toLowerCase().includes('whale')))
                    ).length} whale wallets involved
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-white/10">
          <h3 className="text-sm font-medium mb-2">Insights</h3>
          <ul className="space-y-2 text-xs text-white/70">
            <li className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
              <span>Wallets marked as &quot;Suspicious&quot; might indicate potential wash trading or market manipulation.</span>
            </li>
            <li className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
              <span>High profit wallets with many sell transactions may suggest early investors or team members taking profits.</span>
            </li>
            <li className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
              <span>A high number of new wallets may indicate artificial inflation of holder counts.</span>
            </li>
            <li className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
              <span>Negative net flow values show traders removing liquidity from the token.</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
} 