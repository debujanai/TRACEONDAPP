export interface TokenSecurityResponse {
  code: number;
  message: string;
  result: Record<string, TokenInfo>;
}

export interface TokenInfo {
  anti_whale_modifiable: string;
  buy_tax: string;
  can_take_back_ownership: string;
  cannot_buy: string;
  cannot_sell_all: string;
  creator_address: string;
  creator_balance: string;
  creator_percent: string;
  dex: DexInfo[];
  external_call: string;
  hidden_owner: string;
  holder_count: string;
  holders: HolderInfo[];
  honeypot_with_same_creator: string;
  is_anti_whale: string;
  is_blacklisted: string;
  is_honeypot: string;
  is_in_cex: {
    listed: string;
    cex_list?: string[];
  };
  is_in_dex: string;
  is_mintable: string;
  is_open_source: string;
  is_proxy: string;
  is_whitelisted: string;
  lp_holder_count: string;
  lp_holders?: LpHolderInfo[];
  lp_total_supply?: string;
  owner_address: string;
  owner_balance: string;
  owner_change_balance: string;
  owner_percent: string;
  personal_slippage_modifiable: string;
  selfdestruct: string;
  sell_tax: string;
  slippage_modifiable: string;
  token_name: string;
  token_symbol: string;
  total_supply: string;
  trading_cooldown: string;
  transfer_pausable: string;
  transfer_tax: string;
  trust_list: string;
}

export interface DexInfo {
  liquidity_type: string;
  name: string;
  liquidity: string;
  pair: string;
}

export interface HolderInfo {
  address: string;
  tag: string;
  is_contract: number;
  balance: string;
  percent: string;
  is_locked: number;
}

export interface LpHolderInfo {
  address: string;
  tag: string;
  value: null | unknown;
  is_contract: number;
  balance: string;
  percent: string;
  NFT_list: null | unknown;
  is_locked: number;
}

export interface SecurityRiskLevel {
  level: string;
  color: string;
} 