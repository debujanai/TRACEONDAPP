import { motion } from 'framer-motion';

interface SecurityInfoProps {
  data: {
    goplus: {
      token_name: string;
      token_symbol: string;
      creator_address: string;
      owner_address: string;
      total_supply: number;
      holder_count: number;
      is_open_source: number;
      is_proxy: number;
      is_mintable: number;
      is_blacklisted: number;
      is_whitelisted: number;
      is_in_dex: number;
      is_honeypot: number;
      buy_tax: number;
      sell_tax: number;
      creator_balance: number;
      creator_percent: number;
      owner_balance: number;
      owner_percent: number;
      lp_holder_count: number;
      top_10_holder_rate: number;
      lockInfo: {
        isLock: boolean;
        lockPercent: number;
        leftLockPercent: number;
      };
      honeypot_data?: {
        summary: {
          risk: string;
        };
        honeypotResult: {
          isHoneypot: boolean;
        };
        simulationResult: {
          buyGas: number;
          sellGas: number;
          buyTax: number;
          sellTax: number;
          transferTax: number;
        };
      };
      cannot_sell_all?: number;
      can_take_back_ownership?: number;
      selfdestruct?: number;
      hidden_owner?: number;
      slippage_modifiable?: number;
      transfer_pausable?: number;
      trading_cooldown?: number;
      external_call?: number;
      renounced?: number;
    };
  } | null;
}

export default function SecurityInfo({ data }: SecurityInfoProps) {
  // Early return with loading state if data is null or goplus is undefined
  if (!data || !data.goplus) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10"
      >
        <div className="flex items-center justify-center h-40">
          <div className="text-white/70">Loading security data...</div>
        </div>
      </motion.div>
    );
  }

  const { goplus } = data;
  
  // Calculate overall risk score (0-100)
  const calculateRiskScore = (): number => {
    let riskyFeatures = 0;
    let totalFeatures = 0;
    
    // Check critical security features
    if (goplus.is_honeypot === 1) riskyFeatures += 5;
    if (goplus.cannot_sell_all === 1) riskyFeatures += 5;
    if (goplus.can_take_back_ownership === 1) riskyFeatures += 4;
    if (goplus.selfdestruct === 1) riskyFeatures += 4;
    if (goplus.is_blacklisted === 1) riskyFeatures += 3;
    if (goplus.is_mintable === 1) riskyFeatures += 3;
    if (goplus.external_call === 1) riskyFeatures += 2;
    if (goplus.hidden_owner === 1) riskyFeatures += 2;
    if (goplus.is_proxy === 1) riskyFeatures += 2;
    if (goplus.buy_tax > 10) riskyFeatures += 2;
    if (goplus.sell_tax > 10) riskyFeatures += 2;
    if (goplus.lockInfo?.lockPercent < 0.5) riskyFeatures += 2;
    if (goplus.top_10_holder_rate > 0.5) riskyFeatures += 1;
    
    // Count total features checked
    totalFeatures = 13;
    
    // Calculate score (100 = no risks, 0 = all risks)
    return Math.max(0, Math.min(100, 100 - (riskyFeatures / totalFeatures) * 100));
  };
  
  const riskScore = calculateRiskScore();
  
  const getRiskLevel = (score: number): { text: string; color: string } => {
    if (score >= 90) return { text: 'SAFE', color: 'bg-green-500' };
    if (score >= 70) return { text: 'LOW RISK', color: 'bg-green-400' };
    if (score >= 50) return { text: 'MEDIUM RISK', color: 'bg-yellow-500' };
    if (score >= 30) return { text: 'HIGH RISK', color: 'bg-orange-500' };
    return { text: 'CRITICAL RISK', color: 'bg-red-500' };
  };
  
  const riskLevel = getRiskLevel(riskScore);
  
  const Badge = ({ value, good = true, warning = false, neutral = false }: { value: React.ReactNode; good?: boolean; warning?: boolean; neutral?: boolean }) => {
    let colorClass = 'bg-gray-500 text-white';
    
    if (neutral) {
      colorClass = 'bg-blue-500/30 text-blue-300 border border-blue-500/50';
    } else if (warning) {
      colorClass = 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50';
    } else if (good) {
      colorClass = 'bg-green-500/30 text-green-300 border border-green-500/50';
    } else {
      colorClass = 'bg-red-500/30 text-red-300 border border-red-500/50';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {value}
      </span>
    );
  };
  
  const SecurityItem = ({ label, value, good = true, warning = false, neutral = false }: 
    { label: string; value: React.ReactNode; good?: boolean; warning?: boolean; neutral?: boolean }) => (
    <div className="flex items-center justify-between py-2 border-b border-white/10">
      <span className="text-sm text-white/70">{label}</span>
      {typeof value === 'number' && value <= 1 ? (
        <Badge 
          value={value === 1 ? 'Yes' : 'No'} 
          good={value === 1 ? good : !good}
          warning={warning} 
          neutral={neutral} 
        />
      ) : (
        <span className="text-sm font-medium text-white/90">{value}</span>
      )}
    </div>
  );
  
  const RiskCategory = ({title, children}: {title: string, children: React.ReactNode}) => (
    <div className="p-4 border border-white/10 rounded-lg bg-black/20">
      <h4 className="text-sm font-bold text-white/90 mb-3">{title}</h4>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Risk Score Summary */}
      <motion.div 
        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between mb-6">
          <div>
            <div className="text-sm uppercase text-white/50 tracking-wider mb-1">Token Security Score</div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                {riskScore.toFixed(0)}/100
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${riskLevel.color}`}>
                {riskLevel.text}
              </span>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-xs text-white/70">Safe</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span className="text-xs text-white/70">Warning</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span className="text-xs text-white/70">Risk</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 items-start">
          <div className="flex flex-col items-center justify-center py-3 px-2 bg-black/20 rounded-lg border border-white/10">
            <div className="text-xs text-white/50 mb-1">Token</div>
            <div className="font-medium">{goplus.token_symbol}</div>
          </div>
          <div className="flex flex-col items-center justify-center py-3 px-2 bg-black/20 rounded-lg border border-white/10">
            <div className="text-xs text-white/50 mb-1">Holders</div>
            <div className="font-medium">{goplus.holder_count?.toLocaleString() || 'N/A'}</div>
          </div>
          <div className="flex flex-col items-center justify-center py-3 px-2 bg-black/20 rounded-lg border border-white/10">
            <div className="text-xs text-white/50 mb-1">Buy Tax</div>
            <div className="font-medium">{goplus.buy_tax}%</div>
          </div>
          <div className="flex flex-col items-center justify-center py-3 px-2 bg-black/20 rounded-lg border border-white/10">
            <div className="text-xs text-white/50 mb-1">Sell Tax</div>
            <div className="font-medium">{goplus.sell_tax}%</div>
          </div>
        </div>
      </motion.div>

      {/* Critical Risk Factors */}
      <motion.div 
        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h3 className="text-xl font-medium mb-4 text-white">Critical Risk Factors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RiskCategory title="Contract Risks">
            <SecurityItem 
              label="Is Honeypot" 
              value={goplus.is_honeypot} 
              good={false} 
            />
            <SecurityItem 
              label="Cannot Sell All" 
              value={goplus.cannot_sell_all || 0} 
              good={false} 
            />
            <SecurityItem 
              label="Take Back Ownership" 
              value={goplus.can_take_back_ownership || 0} 
              good={false} 
            />
            <SecurityItem 
              label="Self Destruct" 
              value={goplus.selfdestruct || 0} 
              good={false} 
            />
            <SecurityItem 
              label="Hidden Owner" 
              value={goplus.hidden_owner || 0} 
              good={false} 
            />
          </RiskCategory>
          
          <RiskCategory title="Tax & Trading">
            <SecurityItem 
              label="Buy Tax" 
              value={`${goplus.buy_tax}%`} 
              good={goplus.buy_tax <= 5}
              warning={goplus.buy_tax > 5 && goplus.buy_tax <= 10}
              neutral={goplus.buy_tax === 0}
            />
            <SecurityItem 
              label="Sell Tax" 
              value={`${goplus.sell_tax}%`} 
              good={goplus.sell_tax <= 5}
              warning={goplus.sell_tax > 5 && goplus.sell_tax <= 10}
              neutral={goplus.sell_tax === 0}
            />
            <SecurityItem 
              label="Slippage Modifiable" 
              value={goplus.slippage_modifiable || 0} 
              good={false} 
            />
            <SecurityItem 
              label="Transfer Pausable" 
              value={goplus.transfer_pausable || 0} 
              good={false} 
            />
            <SecurityItem 
              label="Trading Cooldown" 
              value={goplus.trading_cooldown || 0} 
              good={false} 
            />
          </RiskCategory>
        </div>
      </motion.div>

      {/* Security Overview */}
      <motion.div 
        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3 className="text-xl font-medium mb-4 text-white">Security Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RiskCategory title="Contract Security">
            <SecurityItem 
              label="Open Source" 
              value={goplus.is_open_source} 
              good={true} 
            />
            <SecurityItem 
              label="Is Proxy" 
              value={goplus.is_proxy} 
              good={false} 
            />
            <SecurityItem 
              label="Is Mintable" 
              value={goplus.is_mintable} 
              good={false} 
            />
            <SecurityItem 
              label="External Calls" 
              value={goplus.external_call || 0} 
              good={false} 
            />
            <SecurityItem 
              label="Renounced" 
              value={goplus.renounced || 0} 
              good={true} 
            />
          </RiskCategory>
          
          <RiskCategory title="Liquidity & Distribution">
            <SecurityItem 
              label="Listed in DEX" 
              value={goplus.is_in_dex} 
              good={true} 
            />
            <SecurityItem 
              label="Top 10 Holders Rate" 
              value={`${(goplus.top_10_holder_rate * 100).toFixed(2)}%`} 
              good={goplus.top_10_holder_rate < 0.5}
              warning={goplus.top_10_holder_rate >= 0.5 && goplus.top_10_holder_rate < 0.8}
            />
            <SecurityItem 
              label="LP Holder Count" 
              value={goplus.lp_holder_count} 
              good={goplus.lp_holder_count > 10}
              warning={goplus.lp_holder_count <= 10 && goplus.lp_holder_count > 3}
              neutral={false}
            />
            {goplus.lockInfo && (
              <SecurityItem 
                label="Liquidity Locked" 
                value={`${(goplus.lockInfo.lockPercent * 100).toFixed(2)}%`}
                good={goplus.lockInfo.lockPercent > 0.8}
                warning={goplus.lockInfo.lockPercent > 0.5 && goplus.lockInfo.lockPercent <= 0.8}
                neutral={false}
              />
            )}
          </RiskCategory>
        </div>
      </motion.div>

      {/* Creator & Ownership */}
      <motion.div 
        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h3 className="text-lg font-medium mb-4 text-white">Creator & Ownership</h3>
        <div className="space-y-2">
          <div className="p-3 bg-black/20 rounded-lg border border-white/10">
            <div className="text-xs text-white/50 mb-1">Creator Address</div>
            <div className="text-sm font-mono bg-black/40 p-2 rounded border border-white/10 overflow-auto">
              {goplus.creator_address}
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-white/50">Balance</span>
              <span className="text-sm">{goplus.creator_balance?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-white/50">% of Supply</span>
              <span className="text-sm">{goplus.creator_percent || '0'}%</span>
            </div>
          </div>
          
          <div className="p-3 bg-black/20 rounded-lg border border-white/10">
            <div className="text-xs text-white/50 mb-1">Owner Address</div>
            <div className="text-sm font-mono bg-black/40 p-2 rounded border border-white/10 overflow-auto">
              {goplus.owner_address}
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-white/50">Balance</span>
              <span className="text-sm">{goplus.owner_balance?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-white/50">% of Supply</span>
              <span className="text-sm">{goplus.owner_percent || '0'}%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Honeypot Analysis */}
      {goplus.honeypot_data && (
        <motion.div 
          className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <h3 className="text-lg font-medium mb-4 text-white">Honeypot Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-white/10 rounded-lg bg-black/20">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-bold text-white/90">Risk Level</div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  goplus.honeypot_data.summary.risk === 'low' 
                    ? 'bg-green-500/30 text-green-300' 
                    : goplus.honeypot_data.summary.risk === 'medium'
                      ? 'bg-yellow-500/30 text-yellow-300'
                      : 'bg-red-500/30 text-red-300'
                }`}>
                  {goplus.honeypot_data.summary.risk.toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-2">
                <SecurityItem 
                  label="Is Honeypot" 
                  value={goplus.honeypot_data.honeypotResult.isHoneypot ? 'Yes' : 'No'} 
                  good={!goplus.honeypot_data.honeypotResult.isHoneypot}
                />
                <SecurityItem 
                  label="Buy Gas" 
                  value={goplus.honeypot_data.simulationResult.buyGas} 
                  neutral={true}
                />
                <SecurityItem 
                  label="Sell Gas" 
                  value={goplus.honeypot_data.simulationResult.sellGas} 
                  neutral={true}
                />
              </div>
            </div>
            
            <div className="p-4 border border-white/10 rounded-lg bg-black/20">
              <div className="text-sm font-bold text-white/90 mb-4">Tax Analysis</div>
              <div className="space-y-2">
                <SecurityItem 
                  label="Buy Tax" 
                  value={`${goplus.honeypot_data.simulationResult.buyTax}%`} 
                  good={goplus.honeypot_data.simulationResult.buyTax <= 5}
                  warning={goplus.honeypot_data.simulationResult.buyTax > 5 && goplus.honeypot_data.simulationResult.buyTax <= 10}
                />
                <SecurityItem 
                  label="Sell Tax" 
                  value={`${goplus.honeypot_data.simulationResult.sellTax}%`} 
                  good={goplus.honeypot_data.simulationResult.sellTax <= 5}
                  warning={goplus.honeypot_data.simulationResult.sellTax > 5 && goplus.honeypot_data.simulationResult.sellTax <= 10}
                />
                <SecurityItem 
                  label="Transfer Tax" 
                  value={`${goplus.honeypot_data.simulationResult.transferTax}%`} 
                  good={goplus.honeypot_data.simulationResult.transferTax <= 5}
                  warning={goplus.honeypot_data.simulationResult.transferTax > 5 && goplus.honeypot_data.simulationResult.transferTax <= 10}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
} 
