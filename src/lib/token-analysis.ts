/**
 * Calculates a risk score for a token based on security, launch, and rug analysis data
 */
export interface TokenRiskFactor {
  name: string;
  risk: 'high' | 'medium' | 'low';
  description: string;
}

export interface TokenRiskResult {
  score: number;
  level: 'High' | 'Medium' | 'Low';
  factors: TokenRiskFactor[];
}

interface DataObject {
  data?: {
    goplus?: {
      is_honeypot?: number;
      is_open_source?: number;
      creator_percent?: number;
      owner_percent?: number;
      lockInfo?: {
        isLock?: boolean;
      };
      buy_tax?: number;
      sell_tax?: number;
      anti_whale_modifiable?: number;
      personal_slippage_modifiable?: number;
      slippage_modifiable?: number;
      renounced?: number;
      [key: string]: unknown;
    };
    security?: {
      is_honeypot?: boolean;
      is_open_source?: boolean;
      lock_summary?: {
        is_locked?: boolean;
      };
      buy_tax?: string;
      sell_tax?: string;
      is_renounced?: boolean;
      [key: string]: unknown;
    };
    link?: {
      website?: string;
      telegram?: string;
      twitter_username?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export const calculateRiskScore = (
  securityInfo: DataObject | null, 
  launchSecurity: DataObject | null, 
  rugAnalysis: DataObject | null
): TokenRiskResult => {
  let score = 50; // Start with a neutral score
  const factors: TokenRiskFactor[] = [];

  // Check for honeypot
  if (securityInfo?.data?.goplus?.is_honeypot === 1 || 
      launchSecurity?.data?.security?.is_honeypot === true) {
    score += 30;
    factors.push({
      name: 'Honeypot',
      risk: 'high',
      description: 'Token appears to be a honeypot (cannot sell)'
    });
  }

  // Check for open source
  if (securityInfo?.data?.goplus?.is_open_source === 0 || 
      launchSecurity?.data?.security?.is_open_source === false) {
    score += 15;
    factors.push({
      name: 'Closed Source',
      risk: 'high',
      description: 'Contract source code is not verified'
    });
  }

  // Check for high creator/owner balance
  const creatorPercent = securityInfo?.data?.goplus?.creator_percent;
  const ownerPercent = securityInfo?.data?.goplus?.owner_percent;
  if ((typeof creatorPercent === 'number' && creatorPercent > 20) || 
      (typeof ownerPercent === 'number' && ownerPercent > 20)) {
    score += 15;
    factors.push({
      name: 'High Owner Balance',
      risk: 'high',
      description: 'Creator or owner holds a large percentage of tokens'
    });
  }

  // Check for liquidity lock
  if (!(securityInfo?.data?.goplus?.lockInfo?.isLock || 
        launchSecurity?.data?.security?.lock_summary?.is_locked)) {
    score += 20;
    factors.push({
      name: 'Unlocked Liquidity',
      risk: 'high',
      description: 'Liquidity is not locked and can be removed at any time'
    });
  }

  // Check for high taxes
  const buyTax = securityInfo?.data?.goplus?.buy_tax;
  const sellTax = securityInfo?.data?.goplus?.sell_tax;
  const launchBuyTax = launchSecurity?.data?.security?.buy_tax;
  const launchSellTax = launchSecurity?.data?.security?.sell_tax;
  
  if ((typeof buyTax === 'number' && buyTax > 10) || 
      (typeof sellTax === 'number' && sellTax > 10) ||
      (typeof launchBuyTax === 'string' && parseFloat(launchBuyTax) > 10) || 
      (typeof launchSellTax === 'string' && parseFloat(launchSellTax) > 10)) {
    score += 10;
    factors.push({
      name: 'High Taxes',
      risk: 'medium',
      description: 'Token has high buy or sell taxes'
    });
  }

  // Check for modifiable variables
  if (securityInfo?.data?.goplus?.anti_whale_modifiable === 1 || 
      securityInfo?.data?.goplus?.personal_slippage_modifiable === 1 || 
      securityInfo?.data?.goplus?.slippage_modifiable === 1) {
    score += 15;
    factors.push({
      name: 'Modifiable Parameters',
      risk: 'medium',
      description: 'Contract has modifiable parameters that can be changed by owner'
    });
  }

  // Check for ownership renouncement
  if (securityInfo?.data?.goplus?.renounced === 0 && 
      launchSecurity?.data?.security?.is_renounced === false) {
    score += 5;
    factors.push({
      name: 'Ownership Not Renounced',
      risk: 'low',
      description: 'Contract ownership has not been renounced'
    });
  }

  // Check for social links
  if (!rugAnalysis?.data?.link?.website && 
      !rugAnalysis?.data?.link?.telegram && 
      !rugAnalysis?.data?.link?.twitter_username) {
    score += 10;
    factors.push({
      name: 'No Social Presence',
      risk: 'medium',
      description: 'Token has no verified social media presence'
    });
  }

  // Determine risk level
  let level: 'High' | 'Medium' | 'Low';
  if (score >= 70) {
    level = 'High';
  } else if (score >= 40) {
    level = 'Medium';
  } else {
    level = 'Low';
  }

  return {
    score,
    level,
    factors
  };
}; 