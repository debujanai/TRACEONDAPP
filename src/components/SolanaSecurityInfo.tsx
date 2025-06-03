import { motion } from 'framer-motion';

interface SolanaTokenSecurity {
  // Metadata
  metadata?: {
    name: string;
    symbol: string;
    description: string;
    uri: string;
  };
  // Token info
  total_supply?: string;
  holder_count?: string;
  holders?: Array<{
    account: string;
    balance: string;
    is_locked: number;
    locked_detail: unknown[];
    percent: string;
    tag: string;
    token_account: string;
  }>;
  // Authority and security info
  creators?: Array<{
    address: string;
    malicious_address: number;
  }>;
  balance_mutable_authority?: {
    authority: unknown[];
    status: string;
  };
  closable?: {
    authority: unknown[];
    status: string;
  };
  default_account_state?: string;
  default_account_state_upgradable?: {
    authority: unknown[];
    status: string;
  };
  freezable?: {
    authority: unknown[];
    status: string;
  };
  metadata_mutable?: {
    metadata_upgrade_authority: unknown[];
    status: string;
  };
  mintable?: {
    authority: unknown[];
    status: string;
  };
  non_transferable?: string;
  transfer_fee?: Record<string, unknown>;
  transfer_fee_upgradable?: {
    authority: unknown[];
    status: string;
  };
  transfer_hook?: unknown[];
  transfer_hook_upgradable?: {
    authority: unknown[];
    status: string;
  };
  trusted_token?: number;
  [key: string]: unknown;
}

interface SolanaSecurityInfoProps {
  data: {
    data: {
      result?: {
        [key: string]: SolanaTokenSecurity;
      };
      code?: number;
      message?: string;
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
  const isPositive = positive ? valueStr === '1' || valueStr === 'true' : valueStr === '0' || valueStr === 'false';
  
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

export default function SolanaSecurityInfo({ data }: SolanaSecurityInfoProps) {
  if (!data || !data.data || !data.data.result) {
    return (
      <div className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg">
        <h2 className="text-xl font-medium mb-4">No Solana Security Data Available</h2>
        <p className="text-white/70">Unable to fetch security information for this Solana token.</p>
      </div>
    );
  }

  // Get the first token address key from the result object
  const tokenAddress = Object.keys(data.data.result)[0];
  
  // Access the security data
  const security = data.data.result[tokenAddress];

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
            <h2 className="text-xl font-medium mb-1">
              {security.metadata?.name || 'Unknown'} ({security.metadata?.symbol || 'Unknown'})
            </h2>
            <p className="text-sm opacity-70">Security Analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-black/30 px-2 py-1 rounded-full">Chain: Solana</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-black/20 rounded-lg border border-white/10 p-4">
            <h3 className="text-xs uppercase tracking-wide opacity-70 mb-1">Total Supply</h3>
            <p className="text-lg font-medium">{security.total_supply ? parseFloat(security.total_supply).toLocaleString() : 'N/A'}</p>
          </div>
          <div className="bg-black/20 rounded-lg border border-white/10 p-4">
            <h3 className="text-xs uppercase tracking-wide opacity-70 mb-1">Holder Count</h3>
            <p className="text-lg font-medium">{security.holder_count || 'N/A'}</p>
          </div>
          <div className="bg-black/20 rounded-lg border border-white/10 p-4">
            <h3 className="text-xs uppercase tracking-wide opacity-70 mb-1">Token URI</h3>
            <p className="text-xs font-medium truncate">
              {security.metadata?.uri ? (
                <a 
                  href={security.metadata.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  {security.metadata.uri}
                </a>
              ) : 'N/A'}
            </p>
          </div>
        </div>

        {security.creators && security.creators.length > 0 && (
          <div className="grid grid-cols-1 gap-4 mt-4">
            <div className="bg-black/20 rounded-lg border border-white/10 p-4">
              <h3 className="text-xs uppercase tracking-wide opacity-70 mb-2">Creators</h3>
              <div className="space-y-3">
                {security.creators.map((creator, index) => (
                  <div key={index} className="overflow-hidden text-ellipsis">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{creator.address}</p>
                      {creator.malicious_address === 1 && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Malicious</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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
            title="Mintable" 
            value={security.mintable?.status || '0'}
            info="New tokens can be created, potentially diluting value" 
          />
          <SecurityIndicator 
            title="Freezable" 
            value={security.freezable?.status || '0'}
            info="Token accounts can be frozen by authorities" 
          />
          <SecurityIndicator 
            title="Closable" 
            value={security.closable?.status || '0'}
            info="Token accounts can be closed by authorities" 
          />
          <SecurityIndicator 
            title="Balance Mutable" 
            value={security.balance_mutable_authority?.status || '0'}
            info="Token balances can be modified by authorities" 
          />
          <SecurityIndicator 
            title="Metadata Mutable" 
            value={security.metadata_mutable?.status || '0'}
            info="Token metadata can be updated by authorities" 
          />
          <SecurityIndicator 
            title="Transfer Fee" 
            value={Object.keys(security.transfer_fee || {}).length > 0 ? '1' : '0'}
            info="Token transfers incur fees" 
          />
          <SecurityIndicator 
            title="Non-Transferable" 
            value={security.non_transferable || '0'}
            info="Token cannot be transferred between accounts" 
          />
          <SecurityIndicator 
            title="Trusted Token" 
            value={security.trusted_token || '0'}
            positive={true}
            info="Token is recognized as trusted" 
          />
          {security.creators && (
            <SecurityIndicator 
              title="Malicious Creator" 
              value={security.creators.some(c => c.malicious_address === 1) ? '1' : '0'}
              info="Token creator has been flagged as malicious" 
            />
          )}
        </div>
      </motion.div>

      {/* Top Holders Analysis */}
      {security.holders && security.holders.length > 0 && (
        <motion.div 
          className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <h2 className="text-xl font-medium mb-6">Top Holders Analysis</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-4 py-3 text-xs font-medium uppercase text-white/70">Account</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-white/70">Token Account</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-white/70">Balance</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-white/70">Percent</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-white/70">Status</th>
                </tr>
              </thead>
              <tbody>
                {security.holders.map((holder, index) => (
                  <tr key={index} className="border-b border-white/10">
                    <td className="px-4 py-3 text-sm truncate max-w-[150px]">
                      {holder.account}
                    </td>
                    <td className="px-4 py-3 text-sm truncate max-w-[150px]">
                      {holder.token_account}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {parseFloat(holder.balance).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {parseFloat(holder.percent).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {holder.is_locked === 1 ? (
                        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                          Locked
                        </span>
                      ) : (
                        <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">
                          Unlocked
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
} 