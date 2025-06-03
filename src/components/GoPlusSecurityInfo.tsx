import { motion } from 'framer-motion';

interface GoPlusSecurity {
  token_name: string;
  token_symbol: string;
  creator_address: string;
  owner_address: string;
  total_supply: string;
  holder_count: string;
  is_open_source: string;
  is_proxy: string;
  is_mintable: string;
  is_blacklisted: string;
  is_whitelisted: string;
  is_in_dex: string;
  is_honeypot: string;
  buy_tax: string;
  sell_tax: string;
  creator_balance: string;
  creator_percent: string;
  owner_balance: string;
  owner_percent: string;
  lp_holder_count: string;
  lp_holders: Array<{
    address: string;
    tag: string;
    is_contract: number;
    balance: string;
    percent: string;
    is_locked: number;
  }>;
  holders: Array<{
    address: string;
    tag: string;
    is_contract: number;
    balance: string;
    percent: string;
    is_locked: number;
  }>;
  dex: Array<{
    liquidity_type: string;
    name: string;
    liquidity: string;
    pair: string;
  }>;
  [key: string]: unknown;
}

interface GoPlusSecurityInfoProps {
  data: {
    data: {
      result: {
        [key: string]: Record<string, unknown>;
      }
    }
  };
}

// Helper function to render a security indicator
const SecurityIndicator = ({
  title,
  value,
  positive = false,
  info = '',
}: {
  title: string;
  value: unknown;
  positive?: boolean;
  info?: string;
}) => {
  // Convert unknown value to string for comparison
  const valueStr = String(value);
  const isPositive = positive ? valueStr === '1' : valueStr === '0';
  
  return (
    <motion.div 
      className="bg-black/20 rounded-lg border border-white/10 p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <span 
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            isPositive 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {isPositive ? 'Safe' : 'Risk'}
        </span>
      </div>
      {info && (
        <p className="text-xs opacity-70 mt-1">{info}</p>
      )}
    </motion.div>
  );
};

export default function GoPlusSecurityInfo({ data }: GoPlusSecurityInfoProps) {
  if (!data || !data.data || !data.data.result) {
    return (
      <div className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg">
        <h2 className="text-xl font-medium mb-4">No Security Data Available</h2>
        <p className="text-white/70">Unable to fetch security information.</p>
      </div>
    );
  }

  // Get the first token address key from the result object
  const tokenAddress = Object.keys(data.data.result)[0];
  // Cast the security data to our GoPlusSecurity interface
  const security = data.data.result[tokenAddress] as unknown as GoPlusSecurity;

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Token Overview */}
      <motion.div 
        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-medium mb-1">{security.token_name} ({security.token_symbol})</h2>
            <p className="text-sm opacity-70">Security Analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-black/30 px-2 py-1 rounded-full">Chain ID: 1 (Ethereum)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-black/20 rounded-lg border border-white/10 p-4">
            <h3 className="text-xs uppercase tracking-wide opacity-70 mb-1">Total Supply</h3>
            <p className="text-lg font-medium">{Number(security.total_supply).toLocaleString()}</p>
          </div>
          <div className="bg-black/20 rounded-lg border border-white/10 p-4">
            <h3 className="text-xs uppercase tracking-wide opacity-70 mb-1">Holder Count</h3>
            <p className="text-lg font-medium">{Number(security.holder_count).toLocaleString()}</p>
          </div>
          <div className="bg-black/20 rounded-lg border border-white/10 p-4">
            <h3 className="text-xs uppercase tracking-wide opacity-70 mb-1">LP Holder Count</h3>
            <p className="text-lg font-medium">{Number(security.lp_holder_count).toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/20 rounded-lg border border-white/10 p-4">
            <h3 className="text-xs uppercase tracking-wide opacity-70 mb-2">Creator</h3>
            <div className="overflow-hidden text-ellipsis">
              <p className="text-sm font-medium mb-1">{security.creator_address}</p>
              <div className="flex justify-between">
                <span className="text-xs opacity-70">Balance:</span>
                <span className="text-xs">{security.creator_balance} ({security.creator_percent}%)</span>
              </div>
            </div>
          </div>
          <div className="bg-black/20 rounded-lg border border-white/10 p-4">
            <h3 className="text-xs uppercase tracking-wide opacity-70 mb-2">Owner</h3>
            <div className="overflow-hidden text-ellipsis">
              <p className="text-sm font-medium mb-1">{security.owner_address}</p>
              <div className="flex justify-between">
                <span className="text-xs opacity-70">Balance:</span>
                <span className="text-xs">{security.owner_balance} ({security.owner_percent}%)</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Security Analysis */}
      <motion.div 
        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h2 className="text-xl font-medium mb-6">Security Analysis</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <SecurityIndicator 
            title="Honeypot Risk" 
            value={security.is_honeypot}
            info="Contracts designed to trap investors by preventing them from selling" 
          />
          <SecurityIndicator 
            title="Open Source" 
            value={security.is_open_source}
            positive={true} 
            info="Contract code is publicly visible and verifiable"
          />
          <SecurityIndicator 
            title="Proxy Contract" 
            value={security.is_proxy}
            info="Contract logic can be upgraded, potentially changing functionality" 
          />
          <SecurityIndicator 
            title="Mintable" 
            value={security.is_mintable}
            info="New tokens can be created, potentially diluting value" 
          />
          <SecurityIndicator 
            title="Can Take Back Ownership" 
            value={security.can_take_back_ownership}
            info="Contract owner can regain renounced ownership" 
          />
          <SecurityIndicator 
            title="Hidden Owner" 
            value={security.hidden_owner}
            info="Contract ownership is concealed" 
          />
          <SecurityIndicator 
            title="Self Destruct" 
            value={security.selfdestruct}
            info="Contract can be destroyed, potentially locking funds" 
          />
          <SecurityIndicator 
            title="External Call" 
            value={security.external_call}
            info="Contract makes external calls that could pose security risks" 
          />
          <SecurityIndicator 
            title="Blacklisted" 
            value={security.is_blacklisted}
            info="Token is flagged in official blacklists" 
          />
          <SecurityIndicator 
            title="Anti-Whale Mechanisms" 
            value={security.is_anti_whale}
            positive={true}
            info="Protections against large holders manipulating price" 
          />
          <SecurityIndicator 
            title="Whitelisted" 
            value={security.is_whitelisted}
            positive={true}
            info="Token is recognized in official whitelists" 
          />
          <SecurityIndicator 
            title="On DEX" 
            value={security.is_in_dex}
            positive={true}
            info="Token is available on decentralized exchanges" 
          />
        </div>
      </motion.div>

      {/* Tax Information */}
      <motion.div 
        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className="text-xl font-medium mb-6">Tax & Trading Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black/20 rounded-lg border border-white/10 p-4">
                <h3 className="text-xs uppercase tracking-wide opacity-70 mb-1">Buy Tax</h3>
                <p className="text-lg font-medium">{Number(security.buy_tax)}%</p>
              </div>
              <div className="bg-black/20 rounded-lg border border-white/10 p-4">
                <h3 className="text-xs uppercase tracking-wide opacity-70 mb-1">Sell Tax</h3>
                <p className="text-lg font-medium">{Number(security.sell_tax)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <SecurityIndicator 
                title="Cannot Buy" 
                value={security.cannot_buy}
                info="Token cannot be purchased" 
              />
              <SecurityIndicator 
                title="Cannot Sell All" 
                value={security.cannot_sell_all}
                info="Users cannot sell all their tokens at once" 
              />
              <SecurityIndicator 
                title="Trading Cooldown" 
                value={security.trading_cooldown}
                info="Enforces delays between trades" 
              />
              <SecurityIndicator 
                title="Transfer Pausable" 
                value={security.transfer_pausable}
                info="Token transfers can be frozen by contract owner" 
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-4">DEX Liquidity Information</h3>
            <div className="space-y-4">
              {security.dex.map((dex, index) => (
                <div key={index} className="bg-black/20 rounded-lg border border-white/10 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{dex.name}</span>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{dex.liquidity_type}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="opacity-70">Liquidity:</span>
                    <span>${parseFloat(dex.liquidity).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-70">Pair Address:</span>
                    <span className="text-xs truncate max-w-[180px]">{dex.pair}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* LP Holders Analysis */}
      <motion.div 
        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <h2 className="text-xl font-medium mb-6">LP Holders Analysis</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="px-4 py-3 text-xs font-medium uppercase text-white/70">Address</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-white/70">Tag</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-white/70">Balance</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-white/70">Percent</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-white/70">Status</th>
              </tr>
            </thead>
            <tbody>
              {security.lp_holders.map((holder, index) => (
                <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs truncate max-w-[180px]">{holder.address}</span>
                      {holder.is_contract === 1 && (
                        <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded-full">Contract</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{holder.tag || '-'}</td>
                  <td className="px-4 py-3 text-sm">{parseFloat(holder.balance).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{(parseFloat(holder.percent) * 100).toFixed(4)}%</td>
                  <td className="px-4 py-3 text-sm">
                    {holder.is_locked === 1 ? (
                      <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">Locked</span>
                    ) : (
                      <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">Unlocked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Top Token Holders */}

    </motion.div>
  );
} 