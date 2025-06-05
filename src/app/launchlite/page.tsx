'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { ethers } from 'ethers';
import AppLayout from '@/components/AppLayout';
import { useWallet } from '@/contexts/WalletContext';
import { AnimatePresence, motion } from 'framer-motion';
import LiquidityLockTab from '@/components/LiquidityLockTab';

// Add Ownable interface for renounceOwnership
const OWNABLE_ABI = [
  "function renounceOwnership() public",
  "function owner() view returns (address)"
];

// Add Uniswap/Router interface for liquidity
const ROUTER_ABI = [
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
  "function WETH() external pure returns (address)"
];

// Add Uniswap V3 NonfungiblePositionManager interface
const POSITION_MANAGER_ABI = [
  "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
  "function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  "function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) external payable returns (address pool)",
  "function WETH9() external view returns (address)",
  "function multicall(bytes[] calldata data) external payable returns (bytes[] memory)"
];

// Add Uniswap V3 Pool interface
const POOL_FACTORY_ABI = [
  "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
  "function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)"
];

// Add Uniswap V3 Pool interface
const POOL_ABI = [
  "function initialize(uint160 sqrtPriceX96) external",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function fee() external view returns (uint24)",
  "function tickSpacing() external view returns (int24)",
  "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
];

// ERC20 interface for approvals and token information
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function totalSupply() external view returns (uint256)"
];

// Router addresses for different networks
const ROUTER_ADDRESSES: Record<number, string> = {
  1: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Ethereum Mainnet - Uniswap V2
  5: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Goerli - Uniswap V2
  11155111: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Sepolia - Uniswap V2
  137: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", // Polygon - QuickSwap
  80001: "0x8954AfA98594b838bda56FE4C12a09D7739D179b" // Mumbai - QuickSwap
};

// Factory addresses for different networks
// Keeping this commented as reference
/* const FACTORY_ADDRESSES: Record<number, string> = {
  1: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Ethereum Mainnet - Uniswap V2
  5: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Goerli - Uniswap V2
  11155111: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Sepolia - Uniswap V2
  137: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32", // Polygon - QuickSwap
  80001: "0x7ed5118E042F22DA546C9aeF8f3c1774D816A2C1" // Mumbai - QuickSwap
}; */

// Native token names for different networks
const NATIVE_TOKEN_SYMBOLS: Record<number, string> = {
  1: "ETH", // Ethereum
  5: "ETH", // Goerli
  11155111: "ETH", // Sepolia
  137: "MATIC", // Polygon
  80001: "MATIC" // Mumbai
};

// Types for contract deployment
interface ContractDetails {
  name: string;
  symbol: string;
  decimals: string;
  totalSupply: string;
  features: string[];
  optimizationLevel: 'none' | 'standard' | 'high';
  logoUrl?: string;
  description?: string;
  buyTax: number;
  sellTax: number;
}

interface AbiItem {
  type: string;
  name?: string;
  inputs?: Array<{ name: string; type: string }>;
  outputs?: Array<{ name: string; type: string }>;
  stateMutability?: string;
}

interface DeploymentResponse {
  contractCode: string;
  abi: AbiItem[];
  bytecode: string;
  logoUrl?: string;
}

interface DeploymentResult {
  address: string;
  txHash: string;
  blockNumber: number;
  gasUsed: string;
  verificationStatus: 'pending' | 'success' | 'failed';
  constructorArgs?: string; // Add this for manual verification
}

// Add liquidity interface
interface PriceRatio {
  tokenPerPair: string;
  pairPerToken: string;
  usdValue: string;
}



interface LiquidityDetails {
  tokenAmount: string;
  pairAmount: string;
  slippage: number;
  pairType: 'native' | 'token';
  pairToken?: {symbol: string, name: string, address: string, decimals: number};
  dex: 'uniswap_v2' | 'uniswap_v3' | 'quickswap';
  priceRatio: PriceRatio;
  percentageOfSupply: number;
  feeTier?: 100 | 500 | 3000 | 10000; // Fee tiers for Uniswap V3: 0.01%, 0.05%, 0.3%, 1%
}

// Gas optimization utilities
const getGasPrice = async (provider: ethers.Provider): Promise<bigint> => {
  const feeData = await provider.getFeeData();
  return feeData.maxFeePerGas || feeData.gasPrice || BigInt(0);
};

const optimizeGas = async (provider: ethers.Provider, estimatedGas: bigint): Promise<{
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}> => {
  const feeData = await provider.getFeeData();
  const baseGas = feeData.maxFeePerGas || feeData.gasPrice || BigInt(0);
  
  // Apply optimization based on network congestion and estimated gas
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || baseGas / BigInt(10);
  const maxFeePerGas = baseGas + maxPriorityFeePerGas;
  
  return {
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
};

// Helper function to safely convert BigInt to string for JSON serialization
const safeStringify = (obj: any): string => {
  return JSON.stringify(obj, (_, value) => 
    typeof value === 'bigint' ? value.toString() : value
  );
};

// Update DEX addresses for different networks
const DEX_ADDRESSES: Record<number, {
  v2Router: string;
  v3Router?: string;
  v3PositionManager?: string;
  v3Factory?: string; // Added V3 Factory address
  factory: string;
  name: string;
  icon?: string;
}> = {
  1: {
    v2Router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    v3Router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    v3PositionManager: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    v3Factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984", // Uniswap V3 Factory
    factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    name: "Uniswap",
    icon: "https://app.uniswap.org/favicon.png"
  },
  5: {
    v2Router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    v3Router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    v3PositionManager: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    v3Factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    name: "Uniswap (Goerli)",
    icon: "https://app.uniswap.org/favicon.png"
  },
  11155111: {
    v2Router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    v3Router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    v3PositionManager: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    v3Factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    name: "Uniswap (Sepolia)",
    icon: "https://app.uniswap.org/favicon.png"
  },
  137: {
    v2Router: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
    v3Router: "0xE592427A0AEce92De3Edee1F18E0157C05861564", // Uniswap V3 on Polygon
    v3PositionManager: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88", // Uniswap V3 NonfungiblePositionManager on Polygon
    v3Factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984", // Uniswap V3 Factory on Polygon
    factory: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
    name: "QuickSwap/Uniswap",
    icon: "https://quickswap.exchange/favicon.png"
  },
  80001: {
    v2Router: "0x8954AfA98594b838bda56FE4C12a09D7739D179b",
    factory: "0x7ed5118E042F22DA546C9aeF8f3c1774D816A2C1",
    name: "QuickSwap (Mumbai)",
    icon: "https://quickswap.exchange/favicon.png"
  }
};

// Update token pairs with price feeds
const TOKEN_PAIRS: Record<number, Array<{
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  priceFeed?: string; // Chainlink price feed address
  logoUrl?: string;
}>> = {
  1: [ // Ethereum Mainnet
    {
      symbol: "USDT",
      name: "Tether USD",
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      decimals: 6,
      priceFeed: "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D",
      logoUrl: "https://assets.coingecko.com/coins/images/325/small/Tether.png"
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
      priceFeed: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
      logoUrl: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png"
    },
    {
      symbol: "WETH",
      name: "Wrapped Ether",
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      decimals: 18,
      priceFeed: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
      logoUrl: "https://assets.coingecko.com/coins/images/2518/small/weth.png"
    }
  ],
  137: [ // Polygon
    {
      symbol: "USDT",
      name: "Tether USD",
      address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      decimals: 6,
      priceFeed: "0x0A6513e40db6EB1b165753AD52E80663aeA50545",
      logoUrl: "https://assets.coingecko.com/coins/images/325/small/Tether.png"
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      decimals: 6,
      priceFeed: "0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7",
      logoUrl: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png"
    },
    {
      symbol: "WMATIC",
      name: "Wrapped Matic",
      address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
      decimals: 18,
      priceFeed: "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0",
      logoUrl: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png"
    }
  ],
  // Add testnet pairs
  5: [ // Goerli
    {
      symbol: "USDC",
      name: "USD Coin (Test)",
      address: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
      decimals: 6,
      priceFeed: "0xAb5c49580294Aff77670F839ea425f5b78ab3Ae7"
    }
  ],
  11155111: [ // Sepolia
    {
      symbol: "USDC",
      name: "USD Coin (Test)",
      address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      decimals: 6,
      priceFeed: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E"
    }
  ],
  80001: [ // Mumbai
    {
      symbol: "USDT",
      name: "Tether USD (Test)",
      address: "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832",
      decimals: 6
    },
    {
      symbol: "USDC",
      name: "USD Coin (Test)",
      address: "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23",
      decimals: 6
    }
  ]
};

// Add price feed ABI for getting token prices
const CHAINLINK_PRICE_FEED_ABI = [
  "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function decimals() external view returns (uint8)"
];

// Add a new type for the tab selection
type TabType = 'deploy' | 'liquidity' | 'manage' | 'liquiditylock';

interface TabProps {
  name: TabType;
  label: string;
  icon: ReactNode;
}

const tabs: TabProps[] = [
  {
    name: 'deploy',
    label: 'Deploy',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    )
  },
  {
    name: 'liquidity',
    label: 'Liquidity',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
      </svg>
    )
  },
  {
    name: 'manage',
    label: 'Renounce Ownership',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10"></path>
        <path d="M18 20V4"></path>
        <path d="M6 20v-4"></path>
      </svg>
    )
  },
  {
    name: 'liquiditylock',
    label: 'Lock LP',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    )
  }
];

// Add this new type for transaction status tracking
interface TransactionStatus {
  approvals: 'pending' | 'complete' | 'skipped' | 'idle';
  poolCreation: 'pending' | 'complete' | 'skipped' | 'idle';
  positionMinting: 'pending' | 'complete' | 'idle';
}

export default function ContractDeploy() {
  const [activeTab, setActiveTab] = useState<TabType>('deploy');
  const [loading, setLoading] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState<'deployment' | null>(null);
  const [contractDetails, setContractDetails] = useState<ContractDetails>({
    name: '',
    symbol: '',
    decimals: '18',
    totalSupply: '1000000',
    features: [],
    optimizationLevel: 'standard',
    logoUrl: '',
    buyTax: 0,
    sellTax: 0,
  });
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResponse | null>(null);
  const [deployedContract, setDeployedContract] = useState<DeploymentResult | null>(null);
  const [tokenLogo, setTokenLogo] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const { isConnected, address, connectWallet, userProfile, useCredits } = useWallet();
  const [currentNetwork, setCurrentNetwork] = useState('');
  const [networkChainId, setNetworkChainId] = useState<number>(1); // Default to Ethereum Mainnet
  const [liquidityDetails, setLiquidityDetails] = useState<LiquidityDetails>({
    tokenAmount: '0',
    pairAmount: '0.1',
    slippage: 0.5,
    pairType: 'native',
    dex: 'quickswap',
    priceRatio: {
      tokenPerPair: '0',
      pairPerToken: '0',
      usdValue: '0'
    },
    percentageOfSupply: 0,
    feeTier: 3000 // Default to 0.3% fee tier
  });
  const [liquidityLoading, setLiquidityLoading] = useState(false);
  const [liquidityTxHash, setLiquidityTxHash] = useState('');
  const [liquiditySuccess, setLiquiditySuccess] = useState(false);
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const [customTokenDetails, setCustomTokenDetails] = useState({
    name: '',
    symbol: '',
    decimals: 18,
    totalSupply: '0'
  });
  const [fetchingTokenDetails, setFetchingTokenDetails] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Manage tab state
  const [manageTokenAddress, setManageTokenAddress] = useState('');
  const [manageTokenDetails, setManageTokenDetails] = useState<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    owner: string;
    isOwner: boolean;
    ownershipRenounced: boolean;
  }>({
    name: '',
    symbol: '',
    decimals: 18, 
    totalSupply: '0',
    owner: '',
    isOwner: false,
    ownershipRenounced: false
  });
  const [isRenouncing, setIsRenouncing] = useState(false);
  const [manageFetchingDetails, setManageFetchingDetails] = useState(false);
  const [manageSuccess, setManageSuccess] = useState(false);
  const [manageTxHash, setManageTxHash] = useState('');
  
  const [liquidityTxStatus, setLiquidityTxStatus] = useState<TransactionStatus>({
    approvals: 'idle',
    poolCreation: 'idle',
    positionMinting: 'idle'
  });

  // Available features for the token
  const availableFeatures = [
    { id: 'Mintable', name: 'Mintable', description: 'Allows creation of new tokens' },
    { id: 'Burnable', name: 'Burnable', description: 'Allows token destruction' },
    { id: 'Pausable', name: 'Pausable', description: 'Allows pausing token transfers' },
    { id: 'Access Control', name: 'Access Control', description: 'Role-based permissions' },
    { id: 'Flash Minting', name: 'Flash Minting', description: 'Allows flash loans' },
  ];

  // Get block explorer URL based on network
  const getBlockExplorerUrl = (address: string): string => {
    const explorers: Record<number, string> = {
      1: `https://etherscan.io/address/${address}`, // Ethereum Mainnet
      5: `https://goerli.etherscan.io/address/${address}`, // Goerli
      11155111: `https://sepolia.etherscan.io/address/${address}`, // Sepolia
      17000: `https://holesky.etherscan.io/address/${address}`, // Holesky
      137: `https://polygonscan.com/address/${address}`, // Polygon Mainnet
      80001: `https://mumbai.polygonscan.com/address/${address}`, // Polygon Mumbai Testnet
    };
    
    return explorers[networkChainId] || `https://etherscan.io/address/${address}`;
  };
  
  // Get block explorer base URL for transactions
  const getBlockExplorerBaseUrl = (): string => {
    const explorers: Record<number, string> = {
      1: 'https://etherscan.io', 
      5: 'https://goerli.etherscan.io', 
      11155111: 'https://sepolia.etherscan.io',
      17000: 'https://holesky.etherscan.io',
      137: 'https://polygonscan.com',
      80001: 'https://mumbai.polygonscan.com', 
    };
    
    return explorers[networkChainId] || 'https://etherscan.io';
  };

  // Check if MetaMask is installed and connected
  useEffect(() => {
    if (isConnected && window.ethereum) {
      // Get current network
      window.ethereum.request({ method: 'eth_chainId' })
        .then((chainId) => {
          const parsedChainId = parseInt(chainId as string, 16);
          updateNetworkInfo(parsedChainId);
          setNetworkChainId(parsedChainId);
        })
        .catch(console.error);
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId) => {
        const parsedChainId = parseInt(chainId as string, 16);
        updateNetworkInfo(parsedChainId);
        setNetworkChainId(parsedChainId);
      });
    }
    
    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [isConnected]);

  const updateNetworkInfo = (chainId: number) => {
    const networks = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet',
      17000: 'Holesky Testnet',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai Testnet',
    };
    setCurrentNetwork(networks[chainId as keyof typeof networks] || `Unknown Network (${chainId})`);
  };

  // Helper function to switch networks
  const switchNetwork = async (chainId: number) => {
    if (!window.ethereum) return;
    
    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          const networks = {
            137: {
              chainId: `0x${(137).toString(16)}`,
              chainName: 'Polygon Mainnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
              },
              rpcUrls: ['https://polygon-rpc.com/'],
              blockExplorerUrls: ['https://polygonscan.com/']
            },
            80001: {
              chainId: `0x${(80001).toString(16)}`,
              chainName: 'Polygon Mumbai Testnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
              },
              rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
              blockExplorerUrls: ['https://mumbai.polygonscan.com/']
            }
          };
          
          // Add the network if it's one we support
          if (networks[chainId as keyof typeof networks]) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [networks[chainId as keyof typeof networks]],
            });
          }
        } catch (addError) {
          console.error('Error adding network:', addError);
        }
      } else {
        console.error('Error switching network:', switchError);
      }
    }
  };

  const handleGenerateDetails = async () => {
    console.log('Starting contract generation...');
    console.log('Contract details:', contractDetails);
    
    // Validate required fields
    if (!contractDetails.name || !contractDetails.symbol || !contractDetails.totalSupply) {
      console.error('Validation failed:', {
        name: !contractDetails.name ? 'missing' : 'ok',
        symbol: !contractDetails.symbol ? 'missing' : 'ok',
        totalSupply: !contractDetails.totalSupply ? 'missing' : 'ok'
      });
      setError('Please fill in all required fields');
      return;
    }
    
    // Check if wallet is connected to use the service
    if (!isConnected) {
      console.error('Wallet not connected');
      setError('Please connect your wallet to use this service');
      return;
    }

    // Deduct credits for the service (5 credits for contract generation)
    const creditSuccess = await useCredits(5);
    if (!creditSuccess) {
      console.error('Insufficient credits');
      setError('Insufficient credits to use this service.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Sending request to generate contract...');
      // Generate contract code with selected features
      const response = await fetch('/api/deploy-contract/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractDetails: {
            name: contractDetails.name,
            symbol: contractDetails.symbol,
            decimals: contractDetails.decimals,
            totalSupply: contractDetails.totalSupply,
            features: contractDetails.features,
            optimizationLevel: contractDetails.optimizationLevel,
            logoUrl: contractDetails.logoUrl,
            buyTax: Math.floor(contractDetails.buyTax * 100), // Convert to basis points (1% = 100)
            sellTax: Math.floor(contractDetails.sellTax * 100), // Convert to basis points (1% = 100)
          }
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate contract');
      }

      setDeploymentResult(data);
      setStep(2);
      console.log('Contract generation successful');
    } catch (error) {
      console.error('Contract generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate contract');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGenerate = async () => {
    setAutoGenerating(true);
    setError('');
    
    try {
      // System prompt for AI to generate token details
      const systemPrompt = "You are a crypto token creation assistant. Generate a creative ERC20 token with a name, symbol, description, and select appropriate features from this list: Mintable, Burnable, Pausable, Access Control, Flash Minting.";
      
      // User prompt to guide the generation
      const userPrompt = "Create a unique and attractive ERC20 token with a creative name, short symbol (2-5 characters), brief description, and select appropriate features from the available options. Return the result as a JSON object with name, symbol, description, decimals (default 18), totalSupply (a number between 100,000 and 10,000,000,000), and an array of selected features.";
      
      const response = await fetch('/api/generate-token-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ systemPrompt, userPrompt }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to auto-generate token details');
      }
      
      const data = await response.json();
      
      // Process features to ensure they're strings
      let processedFeatures: string[] = [];
      if (Array.isArray(data.features)) {
        processedFeatures = data.features.map((feature: any) => 
          typeof feature === 'string' ? feature : 
          (feature && typeof feature === 'object' && feature.name) ? feature.name : 
          String(feature)
        ).filter(Boolean);
      }
      
      // Update the form with generated data
      setContractDetails(prev => ({
        ...prev,
        name: data.name || '',
        symbol: data.symbol || '',
        decimals: data.decimals || '18',
        totalSupply: data.totalSupply?.toString() || '1000000',
        features: processedFeatures,
        description: data.description || '',
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to auto-generate token details');
    } finally {
      setAutoGenerating(false);
    }
  };

  const handleDeploy = async () => {
    if (!deploymentResult) {
      setError('No contract details to deploy');
      return;
    }

    if (!isConnected || !window.ethereum) {
      setError('Please connect your wallet to deploy the contract');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Create ethers provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Parse user-specified decimals (defaulting to 18 if invalid)
      const tokenDecimals = parseInt(contractDetails.decimals) || 18;
      
      // Create contract factory
      const factory = new ethers.ContractFactory(
        deploymentResult.abi,
        deploymentResult.bytecode,
        signer
      );
      
      // Check how many constructor parameters the contract expects
      const constructorAbi = deploymentResult.abi.find(item => item.type === 'constructor');
      const constructorParams = constructorAbi?.inputs || [];
      console.log('Constructor expects', constructorParams.length, 'parameters:', constructorParams);
      
      // Prepare basic constructor arguments
      const baseArgs = [
        contractDetails.name,
        contractDetails.symbol,
        tokenDecimals,
        ethers.parseUnits(contractDetails.totalSupply, 0) // Use 0 for decimals here to avoid over-multiplication
      ];
      
      // Convert tax values to basis points (1% = 100 basis points)
      const buyTaxBasisPoints = Math.floor(contractDetails.buyTax * 100);
      const sellTaxBasisPoints = Math.floor(contractDetails.sellTax * 100);
      
      // Add tax parameters if the constructor accepts them
      let deployArgs = baseArgs;
      if (constructorParams.length >= 6) {
        // Contract expects tax parameters - we'll pass 0 for now and set them later
        deployArgs = [
          ...baseArgs,
          0, // Initial buyTax is 0, will be set in a separate transaction
          0  // Initial sellTax is 0, will be set in a separate transaction
        ];
      }
      
      console.log('Deploying contract with arguments:', deployArgs);
      console.log('Tax settings to be applied after deployment:', {
        buyTax: contractDetails.buyTax,
        sellTax: contractDetails.sellTax,
        convertedBuyTax: buyTaxBasisPoints,
        convertedSellTax: sellTaxBasisPoints
      });
      
      // Deploy contract with constructor arguments
      const contract = await factory.deploy(...deployArgs);
      
      console.log('Contract deployment initiated');
      
      // Get deployment transaction
      const tx = contract.deploymentTransaction();
      if (!tx) {
        throw new Error('Failed to get deployment transaction');
      }
      
      // Wait for deployment and get receipt
      console.log('Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Failed to get deployment receipt');
      }
      
      // Get deployed contract address
      const deployedAddress = await contract.getAddress();
      console.log('Deployed at address:', deployedAddress);

      // Create a contract instance with the deployed address
      const deployedContract = new ethers.Contract(
        deployedAddress,
        deploymentResult.abi,
        signer
      );

      // Set buy tax in a separate transaction if needed
      if (buyTaxBasisPoints > 0) {
        console.log(`Setting buy tax to ${buyTaxBasisPoints} basis points...`);
        const setBuyTaxTx = await deployedContract.setBuyTax(buyTaxBasisPoints);
        const buyTaxReceipt = await setBuyTaxTx.wait();
        console.log('Buy tax set successfully:', buyTaxReceipt.hash);
      }

      // Set sell tax in a separate transaction if needed
      if (sellTaxBasisPoints > 0) {
        console.log(`Setting sell tax to ${sellTaxBasisPoints} basis points...`);
        const setSellTaxTx = await deployedContract.setSellTax(sellTaxBasisPoints);
        const sellTaxReceipt = await setSellTaxTx.wait();
        console.log('Sell tax set successfully:', sellTaxReceipt.hash);
      }

      // Verify tax settings are correctly set
      try {
        const verifiedBuyTax = await deployedContract.buyTax();
        const verifiedSellTax = await deployedContract.sellTax();
        const taxWallet = await deployedContract.taxWallet();
        
        console.log('Tax verification:', {
          buyTax: {
            expected: buyTaxBasisPoints,
            actual: Number(verifiedBuyTax),
            match: Number(verifiedBuyTax) === buyTaxBasisPoints
          },
          sellTax: {
            expected: sellTaxBasisPoints,
            actual: Number(verifiedSellTax),
            match: Number(verifiedSellTax) === sellTaxBasisPoints
          },
          taxWallet,
          taxWalletIsDeployer: taxWallet.toLowerCase() === (await signer.getAddress()).toLowerCase()
        });
      } catch (verifyError) {
        console.error('Error verifying tax settings:', verifyError);
      }

      // Properly encode constructor arguments
      const contractInterface = new ethers.Interface(deploymentResult.abi);
      console.log('Contract ABI Interface:', deploymentResult.abi);
      console.log('Constructor arguments:', deployArgs);

      const encodedArgs = contractInterface.encodeDeploy(deployArgs);

      // Remove the function selector (first 10 characters after '0x')
      const encodedConstructorArgs = encodedArgs.substring(10);
      console.log('Encoded constructor args:', encodedConstructorArgs);

      // Update the verification code to use the dynamic arguments too
      // Format constructor arguments properly for verification
      const formattedArgs = deployArgs.map(arg => 
        typeof arg === 'bigint' ? arg.toString() : arg
      );
      
      console.log('Formatted constructor args for verification:', formattedArgs);
      
      // Verify contract on Etherscan/Polygonscan
      console.log('Starting contract verification process...');
      
      // Some block explorers need a delay before verification
      const delayForVerification = async (ms: number) => {
        console.log(`Waiting ${ms}ms before starting verification...`);
        return new Promise(resolve => setTimeout(resolve, ms));
      };
      
      // Wait a bit to ensure the contract is fully deployed and indexed
      await delayForVerification(10000); // Use the same delay for all networks
      
      // Try to verify the contract with retries
      let verificationSuccess = false;
      let verificationAttempts = 0;
      const maxAttempts = 8; // Increase max attempts to match Polygon settings
      
      while (!verificationSuccess && verificationAttempts < maxAttempts) {
        try {
          verificationAttempts++;
          console.log(`Verification attempt ${verificationAttempts}/${maxAttempts}...`);
          
          const verificationResponse = await fetch('/api/deploy-contract/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: safeStringify({
              address: deployedAddress,
              encodedConstructorArgs,
              constructorArguments: formattedArgs,
              contractCode: deploymentResult.contractCode, // This is already the contract source code, not bytecode
              chainId: networkChainId,
              network: currentNetwork,
              compiler: {
                version: "0.8.20", // Make sure this matches the compiler version used for generation
                optimizationEnabled: contractDetails.optimizationLevel !== 'none',
                optimizationRuns: contractDetails.optimizationLevel === 'high' ? 1000 : 200
              }
            }),
          });
          
          const verificationData = await verificationResponse.json();
          
          if (verificationResponse.ok) {
            console.log('Verification request successful:', verificationData);
            
            // Check if verification is pending but successful
            if (verificationData.status === 'pending') {
              console.log('Verification submitted successfully but processing:', verificationData.message);
            }
            
            verificationSuccess = true;
          } else {
            console.warn(`Verification attempt ${verificationAttempts} failed:`, verificationData);
            // Wait before retrying
            if (verificationAttempts < maxAttempts) {
              await delayForVerification(12000); // Increase retry delay to match Polygon settings
            }
          }
        } catch (verifyError) {
          console.error(`Verification attempt ${verificationAttempts} error:`, verifyError);
          if (verificationAttempts < maxAttempts) {
            await delayForVerification(12000); // Increase retry delay to match Polygon settings
          }
        }
      }
      
      // Set deployment result
      setDeployedContract({
        address: deployedAddress,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        verificationStatus: verificationSuccess ? 'success' : 'failed',
        constructorArgs: encodedConstructorArgs, // Store for manual verification if needed
      });

      // Update manage token details in case the user navigates to manage tab
      setManageTokenAddress(deployedAddress);
      setManageTokenDetails({
        name: contractDetails.name,
        symbol: contractDetails.symbol,
        decimals: tokenDecimals,
        totalSupply: ethers.parseUnits(contractDetails.totalSupply, 0).toString(),
        owner: await signer.getAddress(), // By default, the deployer is the owner
        isOwner: true, // The deployer is the owner
        ownershipRenounced: false // By default, ownership is not renounced on deployment
      });

      // If logo URL exists, submit token information to Etherscan
      if (contractDetails.logoUrl) {
        try {
          console.log('Submitting token info to block explorer...');
          
          // Wait a bit to ensure the contract is available on the explorer
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Prepare token info data
          const tokenInfoData = {
            address: deployedAddress,
            tokenName: contractDetails.name,
            tokenSymbol: contractDetails.symbol,
            decimals: tokenDecimals,
            totalSupply: ethers.parseUnits(contractDetails.totalSupply, 0).toString(),
            logoUrl: contractDetails.logoUrl,
            description: contractDetails.description || `${contractDetails.name} (${contractDetails.symbol}) token`,
            chainId: networkChainId,
            // Add network specific info
            network: currentNetwork,
            // Include owner address for verification
            ownerAddress: await signer.getAddress(),
          };
          
          // Submit token info to our API endpoint
          const metadataResponse = await fetch('/api/token-metadata/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: safeStringify(tokenInfoData),
          });
          
          if (metadataResponse.ok) {
            console.log('Token info submitted successfully');
          } else {
            const errorData = await metadataResponse.json();
            console.warn('Token info submission warning:', errorData.message || 'Unknown error');
          }
        } catch (infoError) {
          console.error('Error submitting token info:', infoError);
          // Don't block the deployment success if metadata submission fails
        }
      }

      setShowSuccessModal('deployment');
    } catch (error) {
      console.error('Deployment error:', error);
      setError(error instanceof Error ? error.message : 'Failed to deploy contract');
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = (featureId: string) => {
    setContractDetails(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId],
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please upload a valid image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size exceeds 2MB limit');
      return;
    }

    setTokenLogo(file);
    setLogoUploading(true);
    
    try {
      // Create a preview for immediate display
      const reader = new FileReader();
      reader.onloadend = () => {
        // Set a preview image
        const preview = reader.result as string;
        setContractDetails(prev => ({
          ...prev,
          logoUrl: preview // Temporary URL for preview
        }));
      };
      reader.readAsDataURL(file);
      
      // Upload to Pinata/IPFS
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-to-pinata', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      
      // Set the IPFS URL
      setContractDetails(prev => ({
        ...prev,
        logoUrl: data.ipfsUrl
      }));
      
      console.log('Uploaded to IPFS:', data.ipfsUrl);
    } catch (error) {
      console.error('Logo upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  // Function to add liquidity
  const addLiquidity = async () => {
    if ((!deployedContract && !customTokenAddress) || !window.ethereum) {
      setError('Contract not deployed or wallet not connected');
      return;
    }

    setLiquidityLoading(true);
    setError('');
    setLiquidityTxStatus({
      approvals: 'idle',
      poolCreation: 'idle',
      positionMinting: 'idle'
    });
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Use either deployed contract address or custom token address
      const tokenAddress = activeTab === 'deploy' ? deployedContract?.address : customTokenAddress;
      
      // Parse token amount with decimals
      const tokenDecimals = activeTab === 'deploy' ? 
        (parseInt(contractDetails.decimals) || 18) : 
        customTokenDetails.decimals;
      
      const tokenAmount = ethers.parseUnits(liquidityDetails.tokenAmount, tokenDecimals);
      
      // Get router address for current network
      const dexInfo = DEX_ADDRESSES[networkChainId];
      if (!dexInfo) {
        throw new Error(`Unsupported network for liquidity addition: ${currentNetwork}`);
      }
      
      // Create token contract instance
      const token = new ethers.Contract(tokenAddress!, ERC20_ABI, signer);
      
      // Calculate slippage factor (convert percentage to basis points)
      const slippageFactor = 1000 - (liquidityDetails.slippage * 10); // Convert 0.5% to 995
      
      let addLiquidityTx;
      
      // Handle different DEX types
      if (liquidityDetails.dex === 'uniswap_v3' && dexInfo.v3PositionManager && dexInfo.v3Factory) {
        // Uniswap V3 implementation
        console.log("Using Uniswap V3 for liquidity addition");
        
        // Get the position manager contract
        const positionManagerAddress = dexInfo.v3PositionManager;
        const positionManager = new ethers.Contract(positionManagerAddress, POSITION_MANAGER_ABI, signer);
        
        // Get factory contract
        const factoryAddress = dexInfo.v3Factory;
        const factory = new ethers.Contract(factoryAddress, POOL_FACTORY_ABI, signer);
        
        // Get the WETH address for native token pairs
        const WETH9 = await positionManager.WETH9();
        
        // Determine token0 and token1 (tokens must be sorted by address)
        let token0, token1, amount0Desired, amount1Desired, amount0Min, amount1Min, ethValue = BigInt(0);
        
        if (liquidityDetails.pairType === 'native') {
          // Native token (ETH/MATIC) pair
          const nativeAmount = ethers.parseEther(liquidityDetails.pairAmount);
          
          // Sort token addresses
          if (tokenAddress!.toLowerCase() < WETH9.toLowerCase()) {
            token0 = tokenAddress!;
            token1 = WETH9;
            amount0Desired = tokenAmount;
            amount1Desired = nativeAmount;
            // Following the Solidity contract example, set minimums to 0 for initial transaction
            amount0Min = BigInt(0);
            amount1Min = BigInt(0);
            ethValue = nativeAmount; // ETH value to send
          } else {
            token0 = WETH9;
            token1 = tokenAddress!;
            amount0Desired = nativeAmount;
            amount1Desired = tokenAmount;
            // Following the Solidity contract example, set minimums to 0 for initial transaction
            amount0Min = BigInt(0);
            amount1Min = BigInt(0);
            ethValue = nativeAmount; // ETH value to send
          }
          
          // Check existing allowance before approving
          setLiquidityTxStatus(prev => ({...prev, approvals: 'pending'}));
          const allowance = await token.allowance(await signer.getAddress(), positionManagerAddress);
          if (allowance < tokenAmount) {
            console.log('Approving token for position manager...');
            const approveTx = await token.approve(
              positionManagerAddress, 
              tokenAmount,
              { gasLimit: 150000 }
            );
            const approveReceipt = await approveTx.wait();
            console.log('Token approved for position manager, gas used:', approveReceipt.gasUsed.toString());
            setLiquidityTxStatus(prev => ({...prev, approvals: 'complete'}));
          } else {
            console.log('Token already approved for position manager, skipping approval');
            setLiquidityTxStatus(prev => ({...prev, approvals: 'skipped'}));
          }
        } else if (liquidityDetails.pairType === 'token' && liquidityDetails.pairToken) {
          // Token to token pair in V3
          const pairToken = liquidityDetails.pairToken;
          const pairTokenContract = new ethers.Contract(pairToken.address, ERC20_ABI, signer);
          
          // Parse pair token amount with proper decimals
          const pairTokenAmount = ethers.parseUnits(liquidityDetails.pairAmount, pairToken.decimals);
          
          // Sort token addresses
          if (tokenAddress!.toLowerCase() < pairToken.address.toLowerCase()) {
            token0 = tokenAddress!;
            token1 = pairToken.address;
            amount0Desired = tokenAmount;
            amount1Desired = pairTokenAmount;
            // Following the Solidity contract example, set minimums to 0 for initial transaction
            amount0Min = BigInt(0);
            amount1Min = BigInt(0);
          } else {
            token0 = pairToken.address;
            token1 = tokenAddress!;
            amount0Desired = pairTokenAmount;
            amount1Desired = tokenAmount;
            // Following the Solidity contract example, set minimums to 0 for initial transaction
            amount0Min = BigInt(0);
            amount1Min = BigInt(0);
          }
          
          // Check existing allowances before approving
          const tokenAllowance = await token.allowance(await signer.getAddress(), positionManagerAddress);
          if (tokenAllowance < tokenAmount) {
            console.log('Approving token for position manager...');
            const approveTx = await token.approve(
              positionManagerAddress, 
              tokenAmount,
              { gasLimit: 150000 }
            );
            const approveReceipt = await approveTx.wait();
            console.log('Token approved for position manager, gas used:', approveReceipt.gasUsed.toString());
          } else {
            console.log('Token already approved for position manager, skipping approval');
          }
          
          const pairTokenAllowance = await pairTokenContract.allowance(await signer.getAddress(), positionManagerAddress);
          if (pairTokenAllowance < pairTokenAmount) {
            console.log(`Approving ${pairToken.symbol} for position manager...`);
            const approveTx = await pairTokenContract.approve(
              positionManagerAddress, 
              pairTokenAmount,
              { gasLimit: 150000 }
            );
            const approveReceipt = await approveTx.wait();
            console.log(`${pairToken.symbol} approved for position manager, gas used: ${approveReceipt.gasUsed.toString()}`);
          } else {
            console.log(`${pairToken.symbol} already approved for position manager, skipping approval`);
          }
        } else {
          throw new Error('Invalid pair type or missing pair token');
        }
        
        // Use the selected fee tier or default to 0.3%
        const fee = liquidityDetails.feeTier || 3000;
        
        // Check if pool exists
        const poolAddress = await factory.getPool(token0, token1, fee).catch(() => null);
        console.log(`Pool exists: ${!!poolAddress && poolAddress !== ethers.ZeroAddress}, address: ${poolAddress || 'none'}`);
        
        try {
          // Set position minting as pending
          setLiquidityTxStatus(prev => ({...prev, positionMinting: 'pending'}));
          
          // Use multicall pattern like Uniswap V3 UI does
          const calldata = [];
          
          // IMPORTANT: Make sure we have the tokens in the correct order
          // Uniswap V3 requires token0 and token1 to be in address sort order
          if (token0.toLowerCase() > token1.toLowerCase()) {
            throw new Error('Tokens must be sorted by address in ascending order');
          }
          
          // For full range positions, use TickMath MIN_TICK and MAX_TICK constants
          // This is exactly what Uniswap contract uses
          const tickSpacing = getTickSpacing(fee);
          const minTickAdjusted = Math.ceil(TickMath.MIN_TICK / tickSpacing) * tickSpacing;
          const maxTickAdjusted = Math.floor(TickMath.MAX_TICK / tickSpacing) * tickSpacing;
          
          console.log('Adjusted ticks for full range:', {
            minTickAdjusted,
            maxTickAdjusted,
            tickSpacing
          });
          
          // If pool doesn't exist, create and initialize it
          if (!poolAddress || poolAddress === ethers.ZeroAddress) {
            console.log('Pool does not exist, will create and initialize...');
            
            // Use a more precise price calculation approach based on the contract
            // The price should be the ratio between token1 and token0 amounts
            let sqrtPriceX96;
            
            // Calculate the price based on the amounts
            // Price = token1/token0 (in wei amounts)
            if (amount1Desired > BigInt(0) && amount0Desired > BigInt(0)) {
              // Convert the price to square root X96 format using the same technique as Uniswap
              const price = Number(amount1Desired) / Number(amount0Desired);
              sqrtPriceX96 = calculateSqrtPriceX96(price);
            } else if (amount0Desired > BigInt(0)) {
              // If only token0 is provided, use a very low price
              sqrtPriceX96 = calculateSqrtPriceX96(0.00001);
            } else if (amount1Desired > BigInt(0)) {
              // If only token1 is provided, use a very high price
              sqrtPriceX96 = calculateSqrtPriceX96(100000);
            } else {
              // Default price (1:1)
              sqrtPriceX96 = calculateSqrtPriceX96(1);
            }
            
            console.log('Creating pool with sqrtPriceX96:', sqrtPriceX96.toString());
            
            // First create and initialize the pool
            const createAndInitializePoolData = positionManager.interface.encodeFunctionData(
              'createAndInitializePoolIfNecessary',
              [token0, token1, fee, sqrtPriceX96]
            );
            calldata.push(createAndInitializePoolData);
          }
          
          // Deadline 20 minutes from now
          const deadline = Math.floor(Date.now() / 1000) + 20 * 60;
          
          // Prepare mint parameters
          const recipient = await signer.getAddress();
          
          // Add mint call with proper parameters
          const mintParams = {
            token0,
            token1, 
            fee,
            tickLower: minTickAdjusted,
            tickUpper: maxTickAdjusted,
            amount0Desired,
            amount1Desired,
            amount0Min, // Following the Solidity contract example
            amount1Min, // Following the Solidity contract example
            recipient,
            deadline
          };
          
          console.log('Mint params:', {
            token0,
            token1,
            fee,
            tickLower: minTickAdjusted,
            tickUpper: maxTickAdjusted,
            amount0Desired: amount0Desired.toString(),
            amount1Desired: amount1Desired.toString(),
            amount0Min: amount0Min.toString(),
            amount1Min: amount1Min.toString(),
            recipient,
            deadline
          });
          
          const mintData = positionManager.interface.encodeFunctionData('mint', [mintParams]);
          calldata.push(mintData);
          
          // Execute multicall
          console.log('Executing multicall with', calldata.length, 'functions');
          const txOptions = {
            value: ethValue,
            gasLimit: 15000000, // Increase gas limit even more for safety
          };
          
          console.log('Transaction options:', {
            value: ethValue.toString(),
            gasLimit: txOptions.gasLimit.toString()
          });
          
          const tx = await positionManager.multicall(calldata, txOptions);
          addLiquidityTx = tx;
          
          console.log('Multicall transaction sent:', addLiquidityTx.hash);
          
          // Wait for the transaction receipt to ensure it's successful
          console.log('Waiting for transaction confirmation...');
          const receipt = await tx.wait();
          console.log('Transaction confirmed, status:', receipt.status);
          
          if (receipt.status === 0) {
            throw new Error('Transaction failed');
          }
          
          // Look for IncreaseLiquidity event to extract the position ID
          if (receipt.logs) {
            for (const log of receipt.logs) {
              try {
                // Try to find the Transfer event from NonfungiblePositionManager for the newly minted position
                if (log.address.toLowerCase() === positionManagerAddress.toLowerCase()) {
                  const transferEventTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'; // Transfer event topic
                  if (log.topics[0].toLowerCase() === transferEventTopic && log.topics[1].toLowerCase() === '0x0000000000000000000000000000000000000000000000000000000000000000') {
                    // Found a Transfer from address 0, which is a mint event
                    // topic[3] contains the tokenId
                    const tokenId = ethers.toBigInt(log.topics[3]);
                    console.log('Created position with ID:', tokenId.toString());
                  }
                }
              } catch (err) {
                console.error('Error parsing log:', err);
              }
            }
          }
          
          setLiquidityTxStatus(prev => ({...prev, poolCreation: 'complete', positionMinting: 'complete'}));
        } catch (err) {
          console.error('Error in multicall operation:', err);
          const mintErr = err as Error;
          
          if (mintErr.message && (mintErr.message.includes('tick') || mintErr.message.includes('liquidity'))) {
            // Try with adjusted ticks
            console.log('Retrying with exact full range...');
            
            // For retry, use TickMath.MIN_TICK and TickMath.MAX_TICK directly
            const retryTickSpacing = getTickSpacing(fee);
            const retryMinTick = Math.ceil(-887272 / retryTickSpacing) * retryTickSpacing;
            const retryMaxTick = Math.floor(887272 / retryTickSpacing) * retryTickSpacing;
            
            console.log('Trying with exact full range:', {
              retryMinTick,
              retryMaxTick,
              tickSpacing: retryTickSpacing
            });
            
            const retryCalldata = [];
            
            // If pool doesn't exist, create and initialize it
            if (!poolAddress || poolAddress === ethers.ZeroAddress) {
              // Calculate price ratio based on ratio of token amounts with safeguards
              let sqrtPriceX96;
              if (amount1Desired > BigInt(0) && amount0Desired > BigInt(0)) {
                const price = Number(amount1Desired) / Number(amount0Desired);
                sqrtPriceX96 = calculateSqrtPriceX96(price);
              } else {
                // Default to 1:1 price for retry
                sqrtPriceX96 = calculateSqrtPriceX96(1);
              }
              
              console.log('Retrying pool creation with sqrtPriceX96:', sqrtPriceX96.toString());
              
              const createAndInitializePoolData = positionManager.interface.encodeFunctionData(
                'createAndInitializePoolIfNecessary',
                [token0, token1, fee, sqrtPriceX96]
              );
              retryCalldata.push(createAndInitializePoolData);
            }
            
            // Deadline 20 minutes from now
            const deadline = Math.floor(Date.now() / 1000) + 20 * 60;
            
            // Prepare mint parameters - use zero for min amounts
            const recipient = await signer.getAddress();
            
            // Always set min amounts to 0 for the retry to match the Solidity contract example
            const retryAmount0Min = BigInt(0);
            const retryAmount1Min = BigInt(0);
            
            // Add mint call with wider ticks
            const retryMintParams = {
              token0,
              token1,
              fee,
              tickLower: retryMinTick,
              tickUpper: retryMaxTick,
              amount0Desired,
              amount1Desired,
              amount0Min: retryAmount0Min,
              amount1Min: retryAmount1Min,
              recipient,
              deadline
            };
            
            console.log('Retry mint params:', {
              token0,
              token1,
              fee,
              tickLower: retryMinTick,
              tickUpper: retryMaxTick,
              amount0Desired: amount0Desired.toString(),
              amount1Desired: amount1Desired.toString(),
              amount0Min: retryAmount0Min.toString(),
              amount1Min: retryAmount1Min.toString(),
              recipient,
              deadline
            });
            
            const retryMintData = positionManager.interface.encodeFunctionData('mint', [retryMintParams]);
            retryCalldata.push(retryMintData);
            
            // Execute multicall
            console.log('Executing multicall with adjusted parameters');
            const retryTxOptions = {
              value: ethValue,
              gasLimit: 15000000, // Increased gas limit even more
            };
            
            const retryTx = await positionManager.multicall(
              retryCalldata,
              retryTxOptions
            );
            
            addLiquidityTx = retryTx;
            console.log('Retry multicall transaction sent:', retryTx.hash);
            
            // Wait for the transaction receipt to ensure it's successful
            console.log('Waiting for retry transaction confirmation...');
            const retryReceipt = await retryTx.wait();
            console.log('Retry transaction confirmed, status:', retryReceipt.status);
            
            if (retryReceipt.status === 0) {
              throw new Error('Retry transaction failed');
            }
            
            // Look for IncreaseLiquidity event to extract the position ID
            if (retryReceipt.logs) {
              for (const log of retryReceipt.logs) {
                try {
                  // Try to find the Transfer event from NonfungiblePositionManager for the newly minted position
                  if (log.address.toLowerCase() === positionManagerAddress.toLowerCase()) {
                    const transferEventTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'; // Transfer event topic
                    if (log.topics[0].toLowerCase() === transferEventTopic && log.topics[1].toLowerCase() === '0x0000000000000000000000000000000000000000000000000000000000000000') {
                      // Found a Transfer from address 0, which is a mint event
                      // topic[3] contains the tokenId
                      const tokenId = ethers.toBigInt(log.topics[3]);
                      console.log('Created position with ID (retry):', tokenId.toString());
                    }
                  }
                } catch (err) {
                  console.error('Error parsing retry log:', err);
                }
              }
            }
            
            setLiquidityTxStatus(prev => ({...prev, poolCreation: 'complete', positionMinting: 'complete'}));
          } else {
            throw err; // Re-throw other errors
          }
        }
      } else {
        // Use V2 Router or QuickSwap
        // Get the appropriate router based on selected DEX
        const routerAddress = dexInfo.v2Router;
        if (!routerAddress) {
          throw new Error(`Router address not found for network: ${currentNetwork}`);
        }
        
        console.log(`Using router at ${routerAddress} for ${dexInfo.name}`);
        
        // Create router contract instance
        const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);
        
        // Handle different pair types (native vs token)
        if (liquidityDetails.pairType === 'native') {
          // Native token (ETH/MATIC) pair
          // Parse native token amount in wei
          const nativeAmount = ethers.parseEther(liquidityDetails.pairAmount);
          
          // Calculate minimum amounts (accounting for slippage)
          const amountTokenMin = tokenAmount * BigInt(slippageFactor) / BigInt(1000);
          const amountETHMin = nativeAmount * BigInt(slippageFactor) / BigInt(1000);
          
          console.log(`Adding ${NATIVE_TOKEN_SYMBOLS[networkChainId] || 'ETH'}/Token liquidity with params:`, {
            tokenAddress,
            tokenAmount: tokenAmount.toString(),
            nativeAmount: nativeAmount.toString(),
            amountTokenMin: amountTokenMin.toString(),
            amountETHMin: amountETHMin.toString(),
            slippage: liquidityDetails.slippage
          });
          
          // Check if token is approved for router
          const allowance = await token.allowance(await signer.getAddress(), routerAddress);
          if (allowance < tokenAmount) {
            console.log('Approving token for router...');
            // Approve tokens to router with higher gas limit
            const approveTx = await token.approve(
              routerAddress, 
              tokenAmount,
              { gasLimit: 100000 } // Explicit gas limit for approval
            );
            const approveReceipt = await approveTx.wait();
            console.log('Token approved for router, gas used:', approveReceipt.gasUsed.toString());
          }
          
          // Deadline 20 minutes from now
          const deadline = Math.floor(Date.now() / 1000) + 20 * 60;
          
          // Estimate gas for the transaction
          const gasEstimate = await router.addLiquidityETH.estimateGas(
            tokenAddress!,
            tokenAmount,
            amountTokenMin,
            amountETHMin,
            await signer.getAddress(),
            deadline,
            { value: nativeAmount }
          ).catch(err => {
            console.warn('Gas estimation failed, using default:', err);
            return BigInt(500000); // Default gas limit if estimation fails
          });
          
          // Add 20% buffer to gas estimate
          const gasLimit = gasEstimate * BigInt(120) / BigInt(100);
          console.log(`Estimated gas: ${gasEstimate}, using gas limit: ${gasLimit}`);
          
          // Add liquidity ETH/MATIC with explicit gas settings
          addLiquidityTx = await router.addLiquidityETH(
            tokenAddress!,
            tokenAmount,
            amountTokenMin,
            amountETHMin,
            await signer.getAddress(),
            deadline,
            { 
              value: nativeAmount,
              gasLimit
            }
          );
        } else if (liquidityDetails.pairType === 'token' && liquidityDetails.pairToken) {
          // Token to token pair
          const pairToken = liquidityDetails.pairToken;
          const pairTokenContract = new ethers.Contract(pairToken.address, ERC20_ABI, signer);
          
          // Parse pair token amount with proper decimals
          const pairTokenAmount = ethers.parseUnits(liquidityDetails.pairAmount, pairToken.decimals);
          
          // Calculate minimum amounts (accounting for slippage)
          const amountTokenMin = tokenAmount * BigInt(slippageFactor) / BigInt(1000);
          const amountPairTokenMin = pairTokenAmount * BigInt(slippageFactor) / BigInt(1000);
          
          console.log(`Adding Token/${pairToken.symbol} liquidity with params:`, {
            tokenAddress,
            pairTokenAddress: pairToken.address,
            tokenAmount: tokenAmount.toString(),
            pairTokenAmount: pairTokenAmount.toString(),
            amountTokenMin: amountTokenMin.toString(),
            amountPairTokenMin: amountPairTokenMin.toString(),
            slippage: liquidityDetails.slippage
          });
          
          // Check if token is approved for router
          const tokenAllowance = await token.allowance(await signer.getAddress(), routerAddress);
          if (tokenAllowance < tokenAmount) {
            console.log('Approving token for router...');
            // Approve tokens to router with higher gas limit
            const approveTx = await token.approve(
              routerAddress, 
              tokenAmount,
              { gasLimit: 100000 } // Explicit gas limit for approval
            );
            const approveReceipt = await approveTx.wait();
            console.log('Token approved for router, gas used:', approveReceipt.gasUsed.toString());
          }
          
          // Check if pair token is approved for router
          const pairTokenAllowance = await pairTokenContract.allowance(await signer.getAddress(), routerAddress);
          if (pairTokenAllowance < pairTokenAmount) {
            console.log(`Approving ${pairToken.symbol} for router...`);
            // Approve pair token to router with higher gas limit
            const approveTx = await pairTokenContract.approve(
              routerAddress, 
              pairTokenAmount,
              { gasLimit: 100000 } // Explicit gas limit for approval
            );
            const approveReceipt = await approveTx.wait();
            console.log(`${pairToken.symbol} approved for router, gas used: ${approveReceipt.gasUsed.toString()}`);
          }
          
          // Deadline 20 minutes from now
          const deadline = Math.floor(Date.now() / 1000) + 20 * 60;
          
          // Estimate gas for the transaction
          const gasEstimate = await router.addLiquidity.estimateGas(
            tokenAddress!,
            pairToken.address,
            tokenAmount,
            pairTokenAmount,
            amountTokenMin,
            amountPairTokenMin,
            await signer.getAddress(),
            deadline
          ).catch(err => {
            console.warn('Gas estimation failed, using default:', err);
            return BigInt(500000); // Default gas limit if estimation fails
          });
          
          // Add 20% buffer to gas estimate
          const gasLimit = gasEstimate * BigInt(120) / BigInt(100);
          console.log(`Estimated gas: ${gasEstimate}, using gas limit: ${gasLimit}`);
          
          // Add liquidity token/token with explicit gas settings
          addLiquidityTx = await router.addLiquidity(
            tokenAddress!,
            pairToken.address,
            tokenAmount,
            pairTokenAmount,
            amountTokenMin,
            amountPairTokenMin,
            await signer.getAddress(),
            deadline,
            { 
              gasLimit
            }
          );
        } else {
          throw new Error('Invalid pair type or missing pair token');
        }
      }
      
      console.log('Liquidity transaction sent:', addLiquidityTx.hash);
      setLiquidityTxHash(addLiquidityTx.hash);
      
      // Wait for transaction confirmation
      const receipt = await addLiquidityTx.wait();
      console.log('Liquidity added successfully:', receipt);
      setLiquidityTxStatus(prev => ({...prev, positionMinting: 'complete'}));
      setLiquiditySuccess(true);
      
      // Inside the addLiquidity function, after we get the transaction receipt, let's capture the NFT tokenId for V3
      // Add this after:
      // const receipt = await addLiquidityTx.wait();
      // console.log('Liquidity added successfully:', receipt);

      // Add this code:
      let nftTokenId;
      if (liquidityDetails.dex === 'uniswap_v3' && receipt && receipt.logs) {
        // Try to extract NFT tokenId from the logs (Transfer event from the position manager)
        try {
          // Lookup for the Transfer event in the logs
          const positionManagerAddress = DEX_ADDRESSES[networkChainId]?.v3PositionManager?.toLowerCase();
          const transferEventTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'; // Transfer event topic
          
          for (const log of receipt.logs) {
            if (log.address.toLowerCase() === positionManagerAddress && 
                log.topics[0].toLowerCase() === transferEventTopic) {
              // This is a Transfer event from the position manager
              // The tokenId is the 4th topic (index 3)
              if (log.topics.length >= 4) {
                nftTokenId = BigInt(log.topics[3]).toString();
                console.log('Found NFT position with tokenId:', nftTokenId);
                break;
              }
            }
          }
        } catch (err) {
          console.error('Error extracting NFT tokenId:', err);
        }
      }

      // Store the tokenId in state
      if (nftTokenId) {
        setLiquidityTxHash(addLiquidityTx.hash + `|${nftTokenId}`);
      } else {
        setLiquidityTxHash(addLiquidityTx.hash);
      }
    } catch (error: any) {
      console.error('Error adding liquidity:', error);
      
      // Improved error handling with more specific messages
      if (error.code === 'ACTION_REJECTED') {
        setError('Transaction was rejected by the user');
      } else if (error.message && error.message.includes('insufficient funds')) {
        setError('Insufficient funds to complete this transaction');
      } else if (error.message && error.message.includes('gas required exceeds allowance')) {
        setError('Transaction requires more gas than allowed. Try increasing slippage tolerance.');
      } else if (error.data?.message) {
        setError(`Transaction failed: ${error.data.message}`);
      } else {
        setError(error.message || 'Failed to add liquidity. Check console for details.');
      }
    } finally {
      setLiquidityLoading(false);
    }
  };

  // Get Dex name based on network
  const getDexName = (): string => {
    const dexNames: Record<number, string> = {
      1: "Uniswap",
      5: "Uniswap (Goerli)",
      11155111: "Uniswap (Sepolia)",
      137: "QuickSwap",
      80001: "QuickSwap (Mumbai)"
    };
    
    return dexNames[networkChainId] || "Uniswap";
  };

  // Get pool explorer URL
  const getPoolExplorerUrl = (): string => {
    if (!deployedContract && !customTokenAddress) return '';
    
    // Use the appropriate token address
    const tokenAddress = deployedContract ? deployedContract.address : customTokenAddress;
    
    // Different explorer URLs based on network and selected DEX
    if (networkChainId === 137) {
      // Polygon
      if (liquidityDetails.dex === 'uniswap_v3') {
        // Uniswap V3 on Polygon
        return `https://app.uniswap.org/tokens/polygon/${tokenAddress}`;
      } else {
        // QuickSwap or default
        return `https://polygonscan.com/token/${tokenAddress}`;
      }
    } else if (networkChainId === 80001) {
      // Mumbai - Link to token on Mumbai scan
      return `https://mumbai.polygonscan.com/token/${tokenAddress}`;
    } else if (networkChainId === 1) {
      // Ethereum - Check DEX type like we do for Polygon
      if (liquidityDetails.dex === 'uniswap_v3') {
        // Uniswap V3 on Ethereum
        return `https://app.uniswap.org/tokens/ethereum/${tokenAddress}`;
      } else {
        // Uniswap V2 or default
        return `https://etherscan.io/token/${tokenAddress}`;
      }
    } else if (networkChainId === 11155111) {
      // Sepolia - Check DEX type like we do for Polygon and Ethereum
      if (liquidityDetails.dex === 'uniswap_v3') {
        // Uniswap V3 on Sepolia
        return `https://app.uniswap.org/tokens/sepolia/${tokenAddress}`;
      } else {
        // Uniswap V2 or default
        return `https://sepolia.etherscan.io/token/${tokenAddress}`;
      }
    } else if (networkChainId === 5) {
      // Goerli - Link to token on Goerli scan
      return `https://goerli.etherscan.io/token/${tokenAddress}`;
    } else {
      // Fallback to Etherscan token page
      return `https://etherscan.io/token/${tokenAddress}`;
    }
  };

  // Get native token symbol based on current network
  const getNativeTokenSymbol = (): string => {
    return NATIVE_TOKEN_SYMBOLS[networkChainId] || 'ETH';
  };



  // Update the getAvailableDEXs function
  const getAvailableDEXs = (chainId: number): Array<'uniswap_v2' | 'uniswap_v3' | 'quickswap'> => {
    const dex = DEX_ADDRESSES[chainId];
    if (!dex) return [];
    
    // Define available DEXes based on network
    switch (chainId) {
      case 1: // Ethereum Mainnet
        return ['uniswap_v2', 'uniswap_v3'];
      case 5: // Goerli
        return ['uniswap_v2'];
      case 11155111: // Sepolia
        return ['uniswap_v2', 'uniswap_v3'];
      case 137: // Polygon - supports both QuickSwap and Uniswap V3
        return ['quickswap', 'uniswap_v3'];
      case 80001: // Mumbai
        return ['quickswap'];
      default:
        return [];
    }
  };

  // Add function to get token price from Chainlink
  const getTokenPrice = async (
    provider: ethers.Provider,
    priceFeed: string
  ): Promise<number> => {
    try {
      const feedContract = new ethers.Contract(
        priceFeed,
        CHAINLINK_PRICE_FEED_ABI,
        provider
      );
      
      const [, answer] = await feedContract.latestRoundData();
      const decimals = await feedContract.decimals();
      
      // Convert BigInt to string first, then to number to avoid precision issues
      const answerStr = answer.toString();
      const divisor = Math.pow(10, Number(decimals));
      return Number(answerStr) / divisor;
    } catch (error) {
      console.error('Error getting price:', error);
      return 0;
    }
  };

  // Update calculatePriceRatios to use price feeds
  const calculatePriceRatios = async (
    provider: ethers.Provider,
    tokenAmt: string,
    pairAmt: string,
    totalSupply: string,
    pairToken?: typeof TOKEN_PAIRS[number][number]
  ): Promise<PriceRatio> => {
    if (!tokenAmt || !pairAmt || parseFloat(tokenAmt) === 0 || parseFloat(pairAmt) === 0) {
      return {
        tokenPerPair: '0',
        pairPerToken: '0',
        usdValue: '0'
      };
    }

    const tokenPerPair = (parseFloat(tokenAmt) / parseFloat(pairAmt)).toString();
    const pairPerToken = (parseFloat(pairAmt) / parseFloat(tokenAmt)).toString();
    
    let usdValue = '0';
    
    try {
      if (liquidityDetails.pairType === 'native') {
        // Get native token price from Chainlink
        const nativePriceFeed = TOKEN_PAIRS[networkChainId]?.find(t => 
          t.symbol === 'WETH' || t.symbol === 'WMATIC'
        )?.priceFeed;
        
        if (nativePriceFeed) {
          const nativePrice = await getTokenPrice(provider, nativePriceFeed);
          usdValue = (parseFloat(pairPerToken) * nativePrice).toString();
        }
      } else if (pairToken?.priceFeed) {
        const tokenPrice = await getTokenPrice(provider, pairToken.priceFeed);
        usdValue = (parseFloat(pairPerToken) * tokenPrice).toString();
      } else if (pairToken?.symbol.includes('USD')) {
        usdValue = pairPerToken;
      }
    } catch (error) {
      console.error('Error calculating USD value:', error);
    }

    return { tokenPerPair, pairPerToken, usdValue };
  };

  // Update useEffect for price calculations
  useEffect(() => {
    const updatePrices = async () => {
      if (!window.ethereum) return;
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const pairToken = TOKEN_PAIRS[networkChainId]?.find(t => 
        liquidityDetails.pairType === 'token' && 
        t.address === liquidityDetails.pairToken?.address
      );
      
      try {
        // Use the correct total supply based on active tab
        const totalSupply = activeTab === 'deploy' ? 
          contractDetails.totalSupply : 
          ethers.formatUnits(customTokenDetails.totalSupply, customTokenDetails.decimals);
        
        const newRatios = await calculatePriceRatios(
          provider,
          liquidityDetails.tokenAmount,
          liquidityDetails.pairAmount,
          totalSupply,
          pairToken
        );
        
        setLiquidityDetails(prev => ({
          ...prev,
          priceRatio: newRatios,
          percentageOfSupply: parseFloat(totalSupply) > 0 ? 
            (parseFloat(liquidityDetails.tokenAmount) / parseFloat(totalSupply)) * 100 : 0
        }));
      } catch (error) {
        console.error('Error updating prices:', error);
      }
    };
    
    updatePrices();
  }, [liquidityDetails.tokenAmount, liquidityDetails.pairAmount, networkChainId, liquidityDetails.pairType, liquidityDetails.pairToken?.address, activeTab, contractDetails.totalSupply, customTokenDetails.totalSupply, customTokenDetails.decimals]);

  // Function to fetch token details when a custom address is entered
  const fetchTokenDetails = async () => {
    if (!customTokenAddress || !ethers.isAddress(customTokenAddress) || !window.ethereum) {
      setError('Please enter a valid token address');
      return;
    }

    setFetchingTokenDetails(true);
    setError('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenContract = new ethers.Contract(customTokenAddress, ERC20_ABI, provider);
      
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        tokenContract.name().catch(() => 'Unknown Token'),
        tokenContract.symbol().catch(() => 'UNKNOWN'),
        tokenContract.decimals().catch(() => 18),
        tokenContract.totalSupply().catch(() => '0')
      ]);

      setCustomTokenDetails({
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: totalSupply.toString()
      });

      // Update the liquidity details with the custom token
      setLiquidityDetails(prev => ({
        ...prev,
        tokenAmount: '0'
      }));
      
    } catch (error) {
      console.error('Error fetching token details:', error);
      setError('Failed to fetch token details. Please make sure this is a valid ERC20 token address.');
    } finally {
      setFetchingTokenDetails(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to fetch token details for the manage tab
  const fetchManageTokenDetails = async () => {
    if (!manageTokenAddress || !ethers.isAddress(manageTokenAddress) || !window.ethereum) {
      setError('Please enter a valid token address');
      return;
    }

    setManageFetchingDetails(true);
    setError('');
    setManageSuccess(false);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const currentAddress = await signer.getAddress();
      
      // Create token contract instance
      const tokenContract = new ethers.Contract(
        manageTokenAddress, 
        [...ERC20_ABI, ...OWNABLE_ABI], 
        provider
      );
      
      // Fetch basic token info
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        tokenContract.name().catch(() => 'Unknown Token'),
        tokenContract.symbol().catch(() => 'UNKNOWN'),
        tokenContract.decimals().catch(() => 18),
        tokenContract.totalSupply().catch(() => '0')
      ]);
      
      // Try to get owner - this will fail if the contract is not Ownable
      let owner = ethers.ZeroAddress; // Default to zero address
      let isOwner = false;
      let ownershipRenounced = false;
      
      try {
        // First check if the contract is Ownable by trying to call the owner function
        owner = await tokenContract.owner();
        console.log("Contract owner address:", owner);
        
        // Check if the owner is the zero address (0x0000000000000000000000000000000000000000)
        // Using strict comparison with ethers.ZeroAddress
        ownershipRenounced = owner === ethers.ZeroAddress;
        console.log("Ownership renounced:", ownershipRenounced);
        
        // Check if the current user is the owner (only if ownership is not renounced)
        isOwner = !ownershipRenounced && owner.toLowerCase() === currentAddress.toLowerCase();
        console.log("Is current user the owner:", isOwner);
      } catch (err) {
        console.log('Not an ownable contract or error accessing owner function:', err);
        // Don't assume ownership is renounced just because there was an error
        ownershipRenounced = false;
      }
      
      // Log the final state for debugging
      console.log("Final ownership state:", {
        owner,
        ownershipRenounced,
        isOwner,
        currentAddress
      });
      
      setManageTokenDetails({
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: totalSupply.toString(),
        owner,
        isOwner,
        ownershipRenounced
      });
      
    } catch (error) {
      console.error('Error fetching token details for management:', error);
      setError('Failed to fetch token details. Please make sure this is a valid ERC20 token.');
    } finally {
      setManageFetchingDetails(false);
    }
  };
  
  // Function to get liquidity pair address
  const getLiquidityPairAddress = async (tokenAddress: string, pairType: 'native' | 'token', pairTokenAddress?: string): Promise<string> => {
    if (!window.ethereum) return '';
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get the correct router and factory for the current network
      const dexInfo = DEX_ADDRESSES[networkChainId];
      if (!dexInfo) throw new Error(`Unsupported network: ${networkChainId}`);
      
      // For Uniswap V3, return an empty string as we can't easily compute the pair address
      if (liquidityDetails.dex === 'uniswap_v3') {
        // Instead, we could return a message or a placeholder
        console.log('Uniswap V3 pools do not have predictable addresses like V2 pools');
        return '';
      }
      
      const factoryAddress = dexInfo.factory;
      
      // For native token pairs, we need to get the WETH address
      let otherTokenAddress;
      if (pairType === 'native') {
        // Create router instance to get WETH address
        const router = new ethers.Contract(dexInfo.v2Router, ROUTER_ABI, provider);
        otherTokenAddress = await router.WETH();
      } else {
        // For token pairs, use the pair token address
        otherTokenAddress = pairTokenAddress;
      }
      
      if (!otherTokenAddress) throw new Error('Could not determine pair token address');
      
      // Use create2 to compute the expected pair address
      // Note: This is specific to Uniswap V2 (and forks like QuickSwap, PancakeSwap)
      const salt = ethers.keccak256(
        ethers.solidityPacked(
          ['address', 'address'],
          [tokenAddress < otherTokenAddress ? tokenAddress : otherTokenAddress,
           tokenAddress < otherTokenAddress ? otherTokenAddress : tokenAddress]
        )
      );
      
      const initCodeHash = '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f'; // Uniswap V2
      
      const pairAddress = ethers.getCreate2Address(
        factoryAddress,
        salt,
        initCodeHash
      );
      
      return pairAddress;
    } catch (error) {
      console.error('Error getting liquidity pair address:', error);
      return '';
    }
  };
  


  // Add this function to get fee tier name
  const getFeeTierName = (feeTier: number): string => {
    switch(feeTier) {
      case 100:
        return '0.01%';
      case 500:
        return '0.05%';
      case 3000:
        return '0.3%';
      case 10000:
        return '1%';
      default:
        return '0.3%';
    }
  };

  // Helper function to calculate sqrt price for Uniswap V3 pool initialization
  const calculateSqrtPriceX96 = (price: number): bigint => {
    // price = token1/token0
    const sqrtPrice = Math.sqrt(price);
    // Multiply by 2^96
    return BigInt(Math.floor(sqrtPrice * 2 ** 96));
  };

  // Helper to get tick spacing for a fee tier
  const getTickSpacing = (fee: number): number => {
    switch (fee) {
      case 100: // 0.01%
        return 1;
      case 500: // 0.05%
        return 10;
      case 3000: // 0.3%
        return 60;
      case 10000: // 1%
        return 200;
      default:
        return 60; // Default to 0.3% fee tier
    }
  };

  // Helper to calculate tick ranges based on fee tier
  const calculateTicks = (fee: number): { minTick: number, maxTick: number } => {
    const tickSpacing = getTickSpacing(fee);
    // For full range, we use the max and min tick values based on fee tier
    // Min tick rounded to the nearest multiple of tickSpacing for the lower end
    const minTick = Math.ceil(-887272 / tickSpacing) * tickSpacing;
    // Max tick rounded to the nearest multiple of tickSpacing for the upper end
    const maxTick = Math.floor(887272 / tickSpacing) * tickSpacing;
    
    return { minTick, maxTick };
  };

  // Add a helper function to get the correct network name for Uniswap URLs
  // This should be added near other helper functions 
  const getUniswapNetworkName = (chainId: number): string => {
    switch (chainId) {
      case 1:
        return 'ethereum';
      case 137:
        return 'polygon';
      case 42161:
        return 'arbitrum';
      case 10:
        return 'optimism';
      case 56:
        return 'bnb';
      case 43114:
        return 'avalanche';
      case 8453:
        return 'base';
      default:
        return 'ethereum'; // Default fallback
    }
  };

  // Fix the transaction link to properly handle the tokenId case
  const getTransactionLink = (txHash: string): string => {
    // If txHash contains a tokenId (separated by |), only use the actual tx hash part
    if (txHash.includes('|')) {
      return `${getBlockExplorerBaseUrl()}/tx/${txHash.split('|')[0]}`;
    }
    return `${getBlockExplorerBaseUrl()}/tx/${txHash}`;
  };

  // Fix the Uniswap position link with the correct format
  const getUniswapPositionLink = (txHash: string): string => {
    if (txHash.includes('|')) {
      const tokenId = txHash.split('|')[1];
      
      // Map chainId to network name
      const networkName = (() => {
        switch (networkChainId) {
          case 1: return 'ethereum';
          case 137: return 'polygon';
          case 42161: return 'arbitrum';
          case 10: return 'optimism';
          case 56: return 'bnb';
          case 43114: return 'avalanche';
          case 8453: return 'base';
          default: return 'ethereum';
        }
      })();
      
      // Use the correct format: https://app.uniswap.org/positions/v3/{networkName}/{tokenId}
      return `https://app.uniswap.org/positions/v3/${networkName}/${tokenId}`;
    }
    return '';
  };

  // First, add back the renounceContractOwnership function but only for the manage tab
  const renounceContractOwnership = async () => {
    if (!manageTokenAddress || !ethers.isAddress(manageTokenAddress) || !window.ethereum) {
      setError('Please enter a valid token address');
      return;
    }
    
    if (!manageTokenDetails.isOwner) {
      setError('You are not the owner of this contract');
      return;
    }
    
    setIsRenouncing(true);
    setError('');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create token contract instance with owner functions
      const ownableContract = new ethers.Contract(
        manageTokenAddress,
        OWNABLE_ABI,
        signer
      );
      
      // Call renounceOwnership
      console.log('Renouncing ownership...');
      const renounceOwnershipTx = await ownableContract.renounceOwnership();
      const receipt = await renounceOwnershipTx.wait();
      console.log('Ownership renounced successfully:', receipt.hash);
      
      // Update the UI
      setManageTxHash(receipt.hash);
      setManageSuccess(true);
      
      // Update the token details to reflect the ownership change
      setManageTokenDetails(prev => ({
        ...prev,
        owner: '0x0000000000000000000000000000000000000000',
        isOwner: false,
        ownershipRenounced: true
      }));
      
    } catch (error) {
      console.error('Error renouncing ownership:', error);
      setError(error instanceof Error ? error.message : 'Failed to renounce ownership');
    } finally {
      setIsRenouncing(false);
    }
  };

  // Add this component inside the liquidity tab section, after the error message display
  const renderTransactionStatus = () => {
    if (liquidityDetails.dex !== 'uniswap_v3' || 
        (liquidityTxStatus.approvals === 'idle' && 
         liquidityTxStatus.poolCreation === 'idle' && 
         liquidityTxStatus.positionMinting === 'idle')) {
      return null;
    }
    
    return (
      <div className="mb-6 backdrop-blur-md bg-black/40 border border-white/10 rounded-xl p-4">
        <h3 className="text-sm font-medium mb-3">Transaction Progress</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
              liquidityTxStatus.approvals === 'complete' ? 'bg-emerald-500/50' :
              liquidityTxStatus.approvals === 'pending' ? 'bg-amber-500/50 animate-pulse' :
              liquidityTxStatus.approvals === 'skipped' ? 'bg-blue-500/50' : 'bg-white/10'
            }`}>
              {liquidityTxStatus.approvals === 'complete' || liquidityTxStatus.approvals === 'skipped' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : liquidityTxStatus.approvals === 'pending' ? (
                <div className="w-3 h-3 rounded-full bg-amber-300 animate-ping"></div>
              ) : null}
            </div>
            <div>
              <p className="text-sm">Token Approvals</p>
              <p className="text-xs opacity-70">
                {liquidityTxStatus.approvals === 'complete' ? 'Completed' :
                 liquidityTxStatus.approvals === 'pending' ? 'In progress...' :
                 liquidityTxStatus.approvals === 'skipped' ? 'Already approved (skipped)' : 'Waiting...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
              liquidityTxStatus.poolCreation === 'complete' ? 'bg-emerald-500/50' :
              liquidityTxStatus.poolCreation === 'pending' ? 'bg-amber-500/50 animate-pulse' :
              liquidityTxStatus.poolCreation === 'skipped' ? 'bg-blue-500/50' : 'bg-white/10'
            }`}>
              {liquidityTxStatus.poolCreation === 'complete' || liquidityTxStatus.poolCreation === 'skipped' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : liquidityTxStatus.poolCreation === 'pending' ? (
                <div className="w-3 h-3 rounded-full bg-amber-300 animate-ping"></div>
              ) : null}
            </div>
            <div>
              <p className="text-sm">Pool Creation/Initialization</p>
              <p className="text-xs opacity-70">
                {liquidityTxStatus.poolCreation === 'complete' ? 'Completed' :
                 liquidityTxStatus.poolCreation === 'pending' ? 'In progress...' :
                 liquidityTxStatus.poolCreation === 'skipped' ? 'Pool already exists (skipped)' : 'Waiting...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
              liquidityTxStatus.positionMinting === 'complete' ? 'bg-emerald-500/50' :
              liquidityTxStatus.positionMinting === 'pending' ? 'bg-amber-500/50 animate-pulse' : 'bg-white/10'
            }`}>
              {liquidityTxStatus.positionMinting === 'complete' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : liquidityTxStatus.positionMinting === 'pending' ? (
                <div className="w-3 h-3 rounded-full bg-amber-300 animate-ping"></div>
              ) : null}
            </div>
            <div>
              <p className="text-sm">Position Minting</p>
              <p className="text-xs opacity-70">
                {liquidityTxStatus.positionMinting === 'complete' ? 'Completed' :
                 liquidityTxStatus.positionMinting === 'pending' ? 'In progress...' : 'Waiting...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {/* Background elements */}
        <motion.div 
          className="absolute top-1/4 right-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl opacity-20"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 8,
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute bottom-1/3 left-1/4 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl opacity-20"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.25, 0.2]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 10,
            ease: "easeInOut",
            delay: 2
          }}
        />

        {/* Header */}
        <motion.div 
          className="relative z-10 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="inline-block backdrop-blur-md bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-white/10 rounded-full px-6 py-2 mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span className="text-xs uppercase tracking-widest text-white/70">Token Deployment</span>
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-5xl font-['ClashGrotesk-Regular'] mb-2 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            LaunchLite
          </motion.h1>
          <motion.p 
            className="text-sm opacity-70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Deploy and manage your token with ease
          </motion.p>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          className="relative mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex overflow-x-auto no-scrollbar pb-2 sm:pb-0 gap-2 w-full">
            {tabs.map((tab, index) => (
              <motion.button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.name 
                    ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-white/20 text-white shadow-md' 
                    : 'bg-black/30 text-white/70 hover:bg-white/10 border border-transparent'
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className={activeTab === tab.name ? 'text-purple-400' : 'text-white/70'}>
                  {tab.icon}
                </span>
                {tab.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'deploy' ? (
              // Token Deployment Tab Content
              <>
                {step === 1 ? (
                  <div className="backdrop-blur-lg bg-black/40 rounded-2xl p-6 border border-white/10 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-medium">Token Details</h2>
                      <button
                        onClick={handleAutoGenerate}
                        disabled={autoGenerating}
                        className="flex items-center gap-2 px-4 py-2 backdrop-blur-md bg-black/50 border border-purple-500/30 rounded-xl text-sm hover:bg-black/60 transition-all hover:border-purple-500/50 group"
                      >
                        {autoGenerating ? (
                          <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400 group-hover:text-purple-300 transition-colors">
                            <path d="M20 16.8A9 9 0 1 1 11.3 3.3"></path>
                            <path d="M16 8h8V0"></path>
                          </svg>
                        )}
                        <span className="text-purple-400 group-hover:text-purple-300 transition-colors">Auto Generate</span>
                      </button>
                    </div>
                    
                    <p className="text-sm opacity-70 mb-6">Configure your token&apos;s specifications and features below.</p>
                    
                    {error && (
                      <div className="mb-6 backdrop-blur-md bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Token Name</label>
                        <input
                          type="text"
                          value={contractDetails.name}
                          onChange={(e) => setContractDetails({...contractDetails, name: e.target.value})}
                          placeholder="MyToken"
                          className="w-full backdrop-blur-md bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Token Symbol</label>
                        <input
                          type="text"
                          value={contractDetails.symbol}
                          onChange={(e) => setContractDetails({...contractDetails, symbol: e.target.value})}
                          placeholder="MTK"
                          className="w-full backdrop-blur-md bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Decimals</label>
                        <input
                          type="number"
                          value={contractDetails.decimals}
                          onChange={(e) => setContractDetails({...contractDetails, decimals: e.target.value})}
                          placeholder="18"
                          className="w-full backdrop-blur-md bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Total Supply</label>
                        <input
                          type="text"
                          value={contractDetails.totalSupply}
                          onChange={(e) => setContractDetails({...contractDetails, totalSupply: e.target.value})}
                          placeholder="1000000"
                          className="w-full backdrop-blur-md bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                        />
                      </div>
                    </div>
                    
                    {/* Logo Upload Section */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">Token Logo</label>
                      <div className="flex items-center gap-4">
                        <div className={`w-20 h-20 rounded-full ${contractDetails.logoUrl ? '' : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20'} border border-white/20 flex items-center justify-center overflow-hidden`}>
                          {contractDetails.logoUrl ? (
                            <img 
                              src={contractDetails.logoUrl} 
                              alt="Token Logo" 
                              className="w-full h-full object-cover"
                              onError={() => {
                                setContractDetails(prev => ({...prev, logoUrl: ''}));
                              }}
                            />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
                              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                              <path d="M12 12v9"></path>
                              <path d="m16 16-4-4-4 4"></path>
                            </svg>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <input
                            type="file"
                            id="token-logo"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="token-logo"
                            className="inline-block px-4 py-2 backdrop-blur-md bg-black/50 border border-white/10 rounded-xl text-sm hover:bg-black/60 transition-all cursor-pointer"
                          >
                            {logoUploading ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>
                                <span>Uploading...</span>
                              </div>
                            ) : (
                              <span>Choose Logo Image</span>
                            )}
                          </label>
                          <p className="mt-1 text-xs opacity-70">Recommended: 256x256px PNG or JPG. Max 2MB.</p>
                        </div>
                      </div>
                    </div>
                    
                    {contractDetails.description && (
                      <div className="mb-6 backdrop-blur-md bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                        <h4 className="text-sm font-medium mb-1">Description</h4>
                        <p className="text-sm opacity-80">{contractDetails.description}</p>
                      </div>
                    )}
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-3">Token Features</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {availableFeatures.map((feature) => (
                          <div
                            key={feature.id}
                            onClick={() => handleFeatureToggle(feature.id)}
                            className={`backdrop-blur-md rounded-xl p-4 cursor-pointer transition-all border ${
                              contractDetails.features.includes(feature.id)
                                ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-white/20 shadow-lg shadow-purple-500/10'
                                : 'bg-black/30 border-white/10 hover:bg-black/40'
                            }`}
                          >
                            <div className="flex items-center">
                              <div className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center ${
                                contractDetails.features.includes(feature.id)
                                  ? 'bg-purple-500/50'
                                  : 'bg-white/10'
                              }`}>
                                {contractDetails.features.includes(feature.id) && (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-medium">{feature.name}</h4>
                                <p className="text-xs opacity-70">{feature.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-3">Transaction Taxes</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Buy Tax ({contractDetails.buyTax}%)</label>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            step="0.5"
                            value={contractDetails.buyTax}
                            onChange={(e) => setContractDetails({...contractDetails, buyTax: parseFloat(e.target.value)})}
                            className="w-full h-1 bg-purple-500/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                          />
                          <div className="flex justify-between mt-1 text-xs text-white/60">
                            <span>0%</span>
                            <span>50%</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Sell Tax ({contractDetails.sellTax}%)</label>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            step="0.5"
                            value={contractDetails.sellTax}
                            onChange={(e) => setContractDetails({...contractDetails, sellTax: parseFloat(e.target.value)})}
                            className="w-full h-1 bg-purple-500/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                          />
                          <div className="flex justify-between mt-1 text-xs text-white/60">
                            <span>0%</span>
                            <span>50%</span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-xs opacity-70">
                        Taxes will be collected on buys and sells and sent to the contract owner address. 
                        These taxes apply when tokens are swapped on decentralized exchanges like Uniswap or QuickSwap.
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-3">Gas Optimization</h3>
                      <div className="flex flex-wrap gap-4">
                        {['none', 'standard', 'high'].map((level) => (
                          <div
                            key={`optimization-${level}`}
                            onClick={() => setContractDetails({...contractDetails, optimizationLevel: level as any})}
                            className={`backdrop-blur-md rounded-xl px-5 py-3 cursor-pointer transition-all border ${
                              contractDetails.optimizationLevel === level
                                ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-white/20 shadow-lg shadow-purple-500/10'
                                : 'bg-black/30 border-white/10 hover:bg-black/40'
                            }`}
                          >
                            <span className="text-sm capitalize">{level}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {!isConnected ? (
                      <div className="mt-8 text-center">
                        <button
                          onClick={connectWallet}
                          className="bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-500/90 hover:to-blue-500/90 border border-white/10 rounded-xl px-6 py-3 text-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 active:scale-98 transform"
                        >
                          Connect Wallet to Continue
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <span className="opacity-70">Current Network: </span>
                          <span className="font-medium">{currentNetwork}</span>
                        </div>
                        <button
                          onClick={handleGenerateDetails}
                          disabled={loading}
                          className="bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-500/90 hover:to-blue-500/90 border border-white/10 rounded-xl px-6 py-3 text-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 active:scale-98 transform disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>
                              <span>Generating...</span>
                            </div>
                          ) : (
                            'Generate Contract'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="backdrop-blur-lg bg-black/40 rounded-2xl p-6 border border-white/10 shadow-lg">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-medium">Contract Preview</h2>
                        <div className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1 text-xs text-emerald-400">
                          Ready for Deployment
                        </div>
                      </div>
                      
                      <div className="backdrop-blur-md bg-black/60 rounded-xl p-4 font-mono text-sm overflow-x-auto border border-white/10 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                        <pre className="text-green-400 opacity-90 whitespace-pre-wrap">
                          {deploymentResult?.contractCode}
                        </pre>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="backdrop-blur-md bg-black/30 rounded-xl p-4 border border-white/10">
                          <p className="text-sm text-white/60 mb-1">Token Name</p>
                          <p className="font-medium">{contractDetails.name}</p>
                        </div>
                        <div className="backdrop-blur-md bg-black/30 rounded-xl p-4 border border-white/10">
                          <p className="text-sm text-white/60 mb-1">Token Symbol</p>
                          <p className="font-medium">{contractDetails.symbol}</p>
                        </div>
                        <div className="backdrop-blur-md bg-black/30 rounded-xl p-4 border border-white/10">
                          <p className="text-sm text-white/60 mb-1">Total Supply</p>
                          <p className="font-medium">{Number(contractDetails.totalSupply).toLocaleString()} ${contractDetails.symbol}</p>
                        </div>
                      </div>
                      
                      {(contractDetails.buyTax > 0 || contractDetails.sellTax > 0) && (
                        <div className="backdrop-blur-md bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 my-4">
                          <h3 className="text-sm font-medium mb-2">Transaction Taxes</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-white/60 mb-1">Buy Tax</p>
                              <p className="font-medium">{contractDetails.buyTax}% ({Math.floor(contractDetails.buyTax * 100)} basis points)</p>
                              <p className="text-xs text-white/60 mt-1">Contract value: {Math.floor(contractDetails.buyTax * 100)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-white/60 mb-1">Sell Tax</p>
                              <p className="font-medium">{contractDetails.sellTax}% ({Math.floor(contractDetails.sellTax * 100)} basis points)</p>
                              <p className="text-xs text-white/60 mt-1">Contract value: {Math.floor(contractDetails.sellTax * 100)}</p>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-amber-400">
                            <p>• Taxes are automatically applied on buys and sells through DEX routers</p>
                            <p>• Tax collected is sent to the contract owner (taxWallet)</p>
                            <p>• Owner can update tax rates and tax wallet through contract functions</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <div className="flex justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-medium">Deployed Features</h3>
                            <p className="text-sm opacity-70">These features will be included in your token</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {contractDetails.features.map((feature, index) => (
                            <div key={`feature-${index}-${feature}`} className="backdrop-blur-md bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-white/10 p-3 text-center">
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                          <div key="feature-ownable" className="backdrop-blur-md bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-white/10 p-3 text-center">
                            <span className="text-sm">Ownable</span>
                          </div>
                          <div key="feature-erc20" className="backdrop-blur-md bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg border border-white/10 p-3 text-center">
                            <span className="text-sm">ERC20</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Add Optimization Level Display */}
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-2">Gas Optimization</h3>
                        <div className="backdrop-blur-md bg-black/30 rounded-lg border border-white/10 p-3">
                          <span className="text-sm capitalize">{typeof contractDetails.optimizationLevel === 'string' ? contractDetails.optimizationLevel : 'standard'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="backdrop-blur-lg bg-black/40 rounded-2xl p-6 border border-white/10 shadow-lg">
                      <h2 className="text-xl font-medium mb-4">Deploy Contract</h2>
                      
                      <div className="flex items-center rounded-xl p-4 backdrop-blur-md bg-blue-500/10 border border-blue-500/30 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 mr-3">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <div>
                          <p className="text-sm">Deploying to <span className="font-medium">{currentNetwork}</span></p>
                          <p className="text-xs opacity-70 mt-1">Make sure you're connected to the right network before deploying</p>
                        </div>
                      </div>
                      
                      {/* Network Selector */}
                      <div className="mb-6">
                        <h3 className="text-sm font-medium mb-2">Select Network</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <button 
                            onClick={() => switchNetwork(1)}
                            className={`backdrop-blur-md rounded-lg border p-3 text-center transition-all ${
                              networkChainId === 1 ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-white/20' : 'bg-black/30 border-white/10 hover:bg-black/40'
                            }`}
                          >
                            <span className="text-sm">Ethereum Mainnet</span>
                          </button>
                          <button 
                            onClick={() => switchNetwork(137)}
                            className={`backdrop-blur-md rounded-lg border p-3 text-center transition-all ${
                              networkChainId === 137 ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-white/20' : 'bg-black/30 border-white/10 hover:bg-black/40'
                            }`}
                          >
                            <span className="text-sm">Polygon Mainnet</span>
                          </button>
                          <button 
                            onClick={() => switchNetwork(11155111)}
                            className={`backdrop-blur-md rounded-lg border p-3 text-center transition-all ${
                              networkChainId === 11155111 ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-white/20' : 'bg-black/30 border-white/10 hover:bg-black/40'
                            }`}
                          >
                            <span className="text-sm">Sepolia Testnet</span>
                          </button>
                          <button 
                            onClick={() => switchNetwork(80001)}
                            className={`backdrop-blur-md rounded-lg border p-3 text-center transition-all ${
                              networkChainId === 80001 ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-white/20' : 'bg-black/30 border-white/10 hover:bg-black/40'
                            }`}
                          >
                            <span className="text-sm">Polygon Mumbai</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <button
                          onClick={() => setStep(1)}
                          className="px-6 py-3 backdrop-blur-md bg-black/30 border border-white/10 rounded-xl text-sm hover:bg-black/40 transition-all"
                        >
                          Go Back
                        </button>
                        <button
                          onClick={handleDeploy}
                          disabled={!isConnected || loading}
                          className="bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-500/90 hover:to-blue-500/90 border border-white/10 rounded-xl px-6 py-3 text-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 active:scale-98 transform disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>
                              <span>Deploying...</span>
                            </div>
                          ) : (
                            'Deploy Contract'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : activeTab === 'liquidity' ? (
              // Liquidity Management Tab Content
              <div className="backdrop-blur-lg bg-black/40 rounded-2xl p-6 border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-medium">Add Liquidity</h2>
                  <div className="flex items-center gap-2">
                    {getAvailableDEXs(networkChainId).map((dex) => (
                      <button
                        key={dex}
                        onClick={() => setLiquidityDetails(prev => ({ ...prev, dex: dex as any }))}
                        className={`backdrop-blur-md rounded-full px-4 py-1 text-xs transition-all ${
                          liquidityDetails.dex === dex
                            ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                            : 'bg-black/40 border-white/10 text-white/70 hover:bg-black/60'
                        }`}
                      >
                        {dex === 'uniswap_v2' ? 'Uniswap V2' :
                         dex === 'uniswap_v3' ? 'Uniswap V3' :
                         'QuickSwap'}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="mb-6 backdrop-blur-md bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {liquiditySuccess && (
                  <div className="mb-6 backdrop-blur-md bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-emerald-400 mb-1">Liquidity Added Successfully!</h3>
                      <p className="text-xs opacity-80">Your liquidity has been added to the pool. View transaction on the block explorer.</p>
                      <a 
                        href={liquidityTxHash ? getTransactionLink(liquidityTxHash) : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-400 mt-2 inline-flex items-center"
                      >
                        View Transaction
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                    </div>
                  </div>
                )}

                {liquidityDetails.dex === 'uniswap_v3' && liquidityTxHash.includes('|') && (
                  <div className="mb-6 backdrop-blur-md bg-purple-600/10 border border-purple-600/30 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-purple-400 mb-2">Uniswap V3 Position</h3>
                    <p className="text-xs opacity-80 mb-2">
                      Your liquidity is now available as an NFT position. You can view and manage this position on Uniswap.
                    </p>
                    <div className="font-mono text-xs bg-black/30 p-3 rounded-lg mb-3">
                      Position ID: {liquidityTxHash.split('|')[1]}
                    </div>
                    <a 
                      href={getUniswapPositionLink(liquidityTxHash)}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="flex items-center justify-center gap-2 px-4 py-2 backdrop-blur-md bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm hover:bg-purple-500/30 transition-all"
                    >
                      View on Uniswap
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </a>
                  </div>
                )}

                {/* Token Address Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Token Address</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTokenAddress}
                      onChange={(e) => setCustomTokenAddress(e.target.value)}
                      placeholder="Enter token contract address"
                      className="flex-1 backdrop-blur-md bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all font-mono"
                    />
                    <button
                      onClick={fetchTokenDetails}
                      disabled={fetchingTokenDetails || !customTokenAddress}
                      className="px-4 py-2 backdrop-blur-md bg-purple-500/20 border border-purple-500/30 rounded-xl text-sm hover:bg-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {fetchingTokenDetails ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>
                          <span>Loading...</span>
                        </div>
                      ) : (
                        'Fetch Token'
                      )}
                    </button>
                  </div>
                  {customTokenDetails.symbol && (
                    <div className="mt-3 p-3 backdrop-blur-md bg-purple-500/10 border border-purple-500/30 rounded-xl">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-white/60 mb-1">Name</p>
                          <p className="font-medium">{customTokenDetails.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60 mb-1">Symbol</p>
                          <p className="font-medium">{customTokenDetails.symbol}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60 mb-1">Decimals</p>
                          <p className="font-medium">{customTokenDetails.decimals}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60 mb-1">Total Supply</p>
                          <p className="font-medium">{ethers.formatUnits(customTokenDetails.totalSupply, customTokenDetails.decimals)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Network Selector */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Select Network</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button 
                      onClick={() => switchNetwork(1)}
                      className={`backdrop-blur-md rounded-lg border p-3 text-center transition-all ${
                        networkChainId === 1 ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-white/20' : 'bg-black/30 border-white/10 hover:bg-black/40'
                      }`}
                    >
                      <span className="text-sm">Ethereum</span>
                    </button>
                    <button 
                      onClick={() => switchNetwork(137)}
                      className={`backdrop-blur-md rounded-lg border p-3 text-center transition-all ${
                        networkChainId === 137 ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-white/20' : 'bg-black/30 border-white/10 hover:bg-black/40'
                      }`}
                    >
                      <span className="text-sm">Polygon</span>
                    </button>
                    <button 
                      onClick={() => switchNetwork(11155111)}
                      className={`backdrop-blur-md rounded-lg border p-3 text-center transition-all ${
                        networkChainId === 11155111 ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-white/20' : 'bg-black/30 border-white/10 hover:bg-black/40'
                      }`}
                    >
                      <span className="text-sm">Sepolia</span>
                    </button>
                    <button 
                      onClick={() => switchNetwork(80001)}
                      className={`backdrop-blur-md rounded-lg border p-3 text-center transition-all ${
                        networkChainId === 80001 ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-white/20' : 'bg-black/30 border-white/10 hover:bg-black/40'
                      }`}
                    >
                      <span className="text-sm">Mumbai</span>
                    </button>
                  </div>
                </div>

                {/* Liquidity Form */}
                {customTokenDetails.symbol && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Token Input Section */}
                      <div className="backdrop-blur-md bg-black/40 rounded-xl p-4 border border-white/10">
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-medium">Token Amount</label>
                          <div className="text-xs opacity-70">
                            Balance: {customTokenDetails.symbol}
                          </div>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={liquidityDetails.tokenAmount}
                            onChange={(e) => setLiquidityDetails({...liquidityDetails, tokenAmount: e.target.value})}
                            placeholder="0.0"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                          />
                          <button
                            onClick={() => setLiquidityDetails(prev => ({
                              ...prev,
                              tokenAmount: ethers.formatUnits(customTokenDetails.totalSupply, customTokenDetails.decimals)
                            }))}
                            className="px-3 py-1 text-xs bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30"
                          >
                            MAX
                          </button>
                        </div>
                        <div className="text-xs opacity-70">
                          ≈ ${(parseFloat(liquidityDetails.tokenAmount) * parseFloat(liquidityDetails.priceRatio.usdValue)).toFixed(2)} USD
                        </div>
                      </div>

                      {/* Pair Token Input Section */}
                      <div className="backdrop-blur-md bg-black/40 rounded-xl p-4 border border-white/10">
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center gap-2">
                                                      <label className="text-sm font-medium">
                                {liquidityDetails.pairType === 'native' 
                                  ? `${getNativeTokenSymbol()} Amount`
                                  : `${liquidityDetails.pairToken?.symbol || 'Token'} Amount`}
                              </label>
                              <div className="dropdown relative" ref={dropdownRef}>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDropdownOpen(!dropdownOpen);
                                  }}
                                className="px-2 py-1 text-xs bg-black/50 border border-white/10 rounded-lg flex items-center gap-1"
                              >
                                <span>{liquidityDetails.pairType === 'native' ? getNativeTokenSymbol() : liquidityDetails.pairToken?.symbol || 'Select'}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                              </button>
                              {dropdownOpen && (
                                <div className="absolute mt-1 bg-black/90 border border-white/10 rounded-lg p-2 shadow-lg z-10 min-w-[150px]">
                                  <div 
                                    onClick={() => {
                                      setLiquidityDetails(prev => ({ ...prev, pairType: 'native' }));
                                      setDropdownOpen(false);
                                    }}
                                    className="py-1 px-2 rounded hover:bg-white/10 cursor-pointer text-sm"
                                  >
                                    {getNativeTokenSymbol()}
                                  </div>
                                  {TOKEN_PAIRS[networkChainId]?.map((token) => (
                                    <div 
                                      key={token.address}
                                      onClick={() => {
                                        setLiquidityDetails(prev => ({ 
                                          ...prev, 
                                          pairType: 'token',
                                          pairToken: token
                                        }));
                                        setDropdownOpen(false);
                                      }}
                                      className="py-1 px-2 rounded hover:bg-white/10 cursor-pointer text-sm"
                                    >
                                      {token.symbol}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs opacity-70">
                            Balance: --
                          </div>
                        </div>
                        <input
                          type="text"
                          value={liquidityDetails.pairAmount}
                          onChange={(e) => setLiquidityDetails({...liquidityDetails, pairAmount: e.target.value})}
                          placeholder="0.0"
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 mb-2"
                        />
                        <div className="text-xs opacity-70">
                          ≈ ${parseFloat(liquidityDetails.pairAmount).toFixed(2)} USD
                        </div>
                      </div>
                    </div>

                    {/* Price and Ratio Information */}
                    <div className="backdrop-blur-md bg-black/40 rounded-xl p-4 border border-white/10 mb-6">
                      <h3 className="text-sm font-medium mb-3">Price and Pool Share</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-white/60 mb-1">Price</p>
                          <p className="text-sm">1 {customTokenDetails.symbol} = {parseFloat(liquidityDetails.priceRatio.pairPerToken).toFixed(6)} {liquidityDetails.pairType === 'native' ? getNativeTokenSymbol() : liquidityDetails.pairToken?.symbol}</p>
                          <p className="text-xs text-white/60 mt-1">≈ ${parseFloat(liquidityDetails.priceRatio.usdValue).toFixed(6)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60 mb-1">Reverse Price</p>
                          <p className="text-sm">1 {liquidityDetails.pairType === 'native' ? getNativeTokenSymbol() : liquidityDetails.pairToken?.symbol} = {parseFloat(liquidityDetails.priceRatio.tokenPerPair).toFixed(6)} {customTokenDetails.symbol}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60 mb-1">Share of Supply</p>
                          <p className="text-sm">{liquidityDetails.percentageOfSupply.toFixed(2)}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Advanced Settings */}
                    <div className="backdrop-blur-md bg-black/40 rounded-xl p-4 border border-white/10 mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium">Advanced Settings</h3>
                        <div className="text-xs text-white/60">Slippage Tolerance: {liquidityDetails.slippage}%</div>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={liquidityDetails.slippage}
                        onChange={(e) => setLiquidityDetails({...liquidityDetails, slippage: parseFloat(e.target.value)})}
                        className="w-full h-1 bg-purple-500/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex justify-between mt-2 text-xs text-white/60">
                        <span>0.1%</span>
                        <span>5%</span>
                      </div>
                    </div>

                    {/* Add Liquidity Button */}
                    <button
                      onClick={addLiquidity}
                      disabled={liquidityLoading || !isConnected || !customTokenAddress || !liquidityDetails.tokenAmount || !liquidityDetails.pairAmount}
                      className="w-full bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-500/90 hover:to-blue-500/90 border border-white/10 rounded-xl px-6 py-3 text-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 active:scale-98 transform disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {liquidityLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>
                          <span>Adding Liquidity...</span>
                        </div>
                      ) : !isConnected ? (
                        'Connect Wallet to Add Liquidity'
                      ) : (
                        'Add Liquidity'
                      )}
                    </button>
                  </>
                )}

                {!isConnected && (
                  <div className="text-center py-8">
                    <button
                      onClick={connectWallet}
                      className="bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-500/90 hover:to-blue-500/90 border border-white/10 rounded-xl px-6 py-3 text-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 active:scale-98 transform"
                    >
                      Connect Wallet to Manage Liquidity
                    </button>
                  </div>
                )}

                {/* Fee Tier Selector for Uniswap V3 */}
                {liquidityDetails.dex === 'uniswap_v3' && (
                  <div className="mt-4 mb-2">
                    <h3 className="text-sm font-medium mb-2">Select Fee Tier</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {[100, 500, 3000, 10000].map((fee) => (
                        <button
                          key={`fee-${fee}`}
                          onClick={() => setLiquidityDetails(prev => ({ ...prev, feeTier: fee as 100 | 500 | 3000 | 10000 }))}
                          className={`backdrop-blur-md rounded-lg p-2 text-sm text-center transition-all ${
                            liquidityDetails.feeTier === fee
                              ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/20'
                              : 'bg-black/30 border border-white/10 hover:bg-black/40'
                          }`}
                        >
                          {getFeeTierName(fee)}
                          <div className="text-xs opacity-70 mt-1">
                            {fee === 100 ? 'Very stable pairs' :
                             fee === 500 ? 'Stable pairs' :
                             fee === 3000 ? 'Most pairs' :
                             'Exotic pairs'}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-white/60">
                      Higher fee tiers are suitable for more volatile pairs. Most tokens work well with 0.3%.
                    </div>
                  </div>
                )}

                {liquidityDetails.dex === 'uniswap_v3' && (
                  <div className="mt-4 backdrop-blur-md bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 mr-3 flex-shrink-0 mt-1">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <div>
                        <p className="text-sm text-blue-400 font-medium mb-2">About Uniswap V3</p>
                        <p className="text-xs opacity-80 mb-2">Uniswap V3 uses concentrated liquidity which means:</p>
                        <ul className="text-xs opacity-80 list-disc pl-4 space-y-1">
                          <li>More capital efficient trading with better rates</li>
                          <li>Position may show "low liquidity" in some interfaces even when it's working correctly</li>
                          <li>Your position will appear as an NFT in your wallet</li>
                          <li>Perfect for actual trading but takes more work to set up correctly</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {renderTransactionStatus()}

              </div>
            ) : activeTab === 'liquiditylock' ? (
              // Liquidity Lock Tab Content
              <LiquidityLockTab />
            ) : (
              // Manage Contracts Tab Content
              <div className="backdrop-blur-lg bg-black/40 rounded-2xl p-6 border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-medium">Manage Existing Contracts</h2>
                  <div className="backdrop-blur-md bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1 text-xs text-blue-400">
                    {currentNetwork}
                  </div>
                </div>

                {error && (
                  <div className="mb-6 backdrop-blur-md bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {manageSuccess && (
                  <div className="mb-6 backdrop-blur-md bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-emerald-400 mb-1">Ownership Successfully Renounced!</h3>
                      <p className="text-xs opacity-80">The contract is now fully decentralized. No administrative functions can be called.</p>
                      <a 
                        href={manageTxHash ? getTransactionLink(manageTxHash) : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-400 mt-2 inline-flex items-center"
                      >
                        View Transaction
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                    </div>
                  </div>
                )}

                {/* Contract Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Contract Address</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manageTokenAddress}
                      onChange={(e) => setManageTokenAddress(e.target.value)}
                      placeholder="Enter token contract address"
                      className="flex-1 backdrop-blur-md bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all font-mono"
                    />
                    <button
                      onClick={fetchManageTokenDetails}
                      disabled={manageFetchingDetails || !manageTokenAddress}
                      className="px-4 py-2 backdrop-blur-md bg-purple-500/20 border border-purple-500/30 rounded-xl text-sm hover:bg-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {manageFetchingDetails ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>
                          <span>Loading...</span>
                        </div>
                      ) : (
                        'Fetch Contract'
                      )}
                    </button>
                  </div>
                </div>

                {/* Network Selector */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Select Network</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button 
                      onClick={() => switchNetwork(1)}
                      className={`backdrop-blur-md rounded-lg border p-3 text-center transition-all ${
                        networkChainId === 1 ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-white/20' : 'bg-black/30 border-white/10 hover:bg-black/40'
                      }`}
                    >
                      <span className="text-sm">Ethereum</span>
                    </button>
                    <button 
                      onClick={() => switchNetwork(137)}
                      className={`backdrop-blur-md rounded-lg border p-3 text-center transition-all ${
                        networkChainId === 137 ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-white/20' : 'bg-black/30 border-white/10 hover:bg-black/40'
                      }`}
                    >
                      <span className="text-sm">Polygon</span>
                    </button>
                    <button 
                      onClick={() => switchNetwork(11155111)}
                      className={`backdrop-blur-md rounded-lg border p-3 text-center transition-all ${
                        networkChainId === 11155111 ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-white/20' : 'bg-black/30 border-white/10 hover:bg-black/40'
                      }`}
                    >
                      <span className="text-sm">Sepolia</span>
                    </button>
                    <button 
                      onClick={() => switchNetwork(80001)}
                      className={`backdrop-blur-md rounded-lg border p-3 text-center transition-all ${
                        networkChainId === 80001 ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-white/20' : 'bg-black/30 border-white/10 hover:bg-black/40'
                      }`}
                    >
                      <span className="text-sm">Mumbai</span>
                    </button>
                  </div>
                </div>

                {/* Contract Details */}
                {manageTokenDetails.symbol && (
                  <>
                    <div className="backdrop-blur-md bg-black/40 rounded-xl p-4 border border-white/10 mb-6">
                      <h3 className="text-lg font-medium mb-3">Contract Details</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-white/60 mb-1">Name</p>
                          <p className="font-medium">{manageTokenDetails.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60 mb-1">Symbol</p>
                          <p className="font-medium">{manageTokenDetails.symbol}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60 mb-1">Decimals</p>
                          <p className="font-medium">{manageTokenDetails.decimals}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60 mb-1">Total Supply</p>
                          <p className="font-medium">{ethers.formatUnits(manageTokenDetails.totalSupply, manageTokenDetails.decimals)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="backdrop-blur-md bg-black/40 rounded-xl p-4 border border-white/10 mb-6">
                      <h3 className="text-lg font-medium mb-3">Ownership Status</h3>
                      <div className="flex items-center mb-2">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          manageTokenDetails.ownershipRenounced 
                            ? 'bg-emerald-500' 
                            : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="font-medium">
                            {manageTokenDetails.ownershipRenounced 
                              ? 'Ownership Renounced (Decentralized)' 
                              : `Owner: ${manageTokenDetails.owner.substring(0, 6)}...${manageTokenDetails.owner.substring(38)}`}
                          </p>
                          {manageTokenDetails.isOwner && (
                            <p className="text-xs text-emerald-400">You are the owner of this contract</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        {manageTokenDetails.ownershipRenounced ? (
                          <div className="backdrop-blur-md bg-black/20 border border-emerald-500/30 rounded-xl p-4">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 mr-3">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                              </svg>
                              <p className="text-sm">This contract has been renounced and is fully decentralized.</p>
                            </div>
                          </div>
                        ) : manageTokenDetails.isOwner ? (
                          <>
                            <div className="backdrop-blur-md bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
                              <div className="flex">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 mr-3 flex-shrink-0">
                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                  <line x1="12" y1="9" x2="12" y2="13"></line>
                                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                                <div>
                                  <p className="text-sm text-amber-400 font-medium mb-1">Warning: Renouncing ownership is permanent</p>
                                  <p className="text-xs opacity-80">Once ownership is renounced, any owner-restricted functions like minting, pausing, or updating the contract will be permanently disabled. This action cannot be reversed.</p>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={renounceContractOwnership}
                              disabled={isRenouncing}
                              className="w-full bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-500/90 hover:to-blue-500/90 border border-white/10 rounded-xl px-6 py-3 text-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 active:scale-98 transform disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isRenouncing ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>
                                  <span>Renouncing Ownership...</span>
                                </div>
                              ) : (
                                'Renounce Ownership'
                              )}
                            </button>
                          </>
                        ) : (
                          <div className="backdrop-blur-md bg-black/20 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60 mr-3">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                              </svg>
                              <p className="text-sm">You are not the owner of this contract. Only the owner can renounce ownership.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="backdrop-blur-md bg-black/40 rounded-xl p-4 border border-white/10">
                      <h3 className="text-lg font-medium mb-3">Links</h3>
                      <div className="flex flex-col md:flex-row gap-3">
                        <a
                          href={`${getBlockExplorerUrl(manageTokenAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 backdrop-blur-md bg-purple-500/10 border border-purple-500/30 rounded-xl text-sm hover:bg-purple-500/20 transition-all text-center"
                        >
                          <span>View on Block Explorer</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </a>
                        <a
                          href={getPoolExplorerUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 backdrop-blur-md bg-blue-500/10 border border-blue-500/30 rounded-xl text-sm hover:bg-blue-500/20 transition-all text-center"
                        >
                          <span>View on DEX</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M8 12h8M12 8v8"></path>
                          </svg>
                        </a>
                      </div>
                    </div>
                  </>
                )}

                {!isConnected && (
                  <div className="text-center py-8">
                    <button
                      onClick={connectWallet}
                      className="bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-500/90 hover:to-blue-500/90 border border-white/10 rounded-xl px-6 py-3 text-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 active:scale-98 transform"
                    >
                      Connect Wallet to Manage Contracts
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-black/80 border border-white/20 rounded-2xl p-6 w-full max-w-lg">
            <button
              onClick={() => setShowSuccessModal(null)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
            
            {showSuccessModal === 'deployment' && (
              <>
                <h3 className="text-2xl font-medium text-center mb-2">Deployment Successful!</h3>
                <p className="text-center text-white/60 mb-6">Your token has been successfully deployed to the blockchain.</p>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                    <p className="text-sm text-white/60 mb-1">Contract Address</p>
                    <p className="font-mono text-sm break-all">{deployedContract?.address}</p>
                  </div>
                  <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                    <p className="text-sm text-white/60 mb-1">Transaction Hash</p>
                    <p className="font-mono text-sm break-all">{deployedContract?.txHash}</p>
                  </div>
                  
                  {(contractDetails.buyTax > 0 || contractDetails.sellTax > 0) && (
                    <div className="bg-black/30 p-4 rounded-lg border border-amber-500/20">
                      <p className="text-sm text-white/60 mb-1">Tax Settings</p>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <p className="text-xs text-amber-400">Buy Tax</p>
                          <p className="font-mono text-sm">{contractDetails.buyTax}% ({Math.floor(contractDetails.buyTax * 100)} basis points)</p>
                        </div>
                        <div>
                          <p className="text-xs text-amber-400">Sell Tax</p>
                          <p className="font-mono text-sm">{contractDetails.sellTax}% ({Math.floor(contractDetails.sellTax * 100)} basis points)</p>
                        </div>
                      </div>
                      <p className="text-xs mt-2 text-white/60">Taxes are automatically applied on DEX trades and sent to the contract owner.</p>
                      <p className="text-xs mt-1 text-white/60">Tax rates were set in separate transactions after deployment.</p>
                    </div>
                  )}
                  
                  <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                    <div className="flex justify-between">
                      <p className="text-sm text-white/60 mb-1">Verification Status</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        deployedContract?.verificationStatus === 'success' 
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : deployedContract?.verificationStatus === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {deployedContract?.verificationStatus === 'success'
                          ? 'Verified'
                          : deployedContract?.verificationStatus === 'pending'
                          ? 'Pending'
                          : 'Failed'}
                      </span>
                    </div>
                    <p className="text-xs mt-1 opacity-80">
                      {deployedContract?.verificationStatus === 'success'
                        ? 'Your contract has been verified and source code is visible on the block explorer.'
                        : deployedContract?.verificationStatus === 'pending'
                        ? 'Verification is in progress. It may take a few minutes to complete.'
                        : 'Verification failed. You can try to verify manually using the source code below.'}
                    </p>
                  </div>
                  
                  {deployedContract?.verificationStatus === 'failed' && deploymentResult?.contractCode && (
                    <div className="bg-black/30 p-4 rounded-lg border border-white/10 mt-2">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-white/60">Contract Source Code</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(deploymentResult.contractCode);
                              alert('Source code copied to clipboard!');
                            }}
                            className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-md hover:bg-purple-500/30"
                          >
                            Copy Code
                          </button>
                          <a
                            href={`${getBlockExplorerBaseUrl()}/verifyContract?a=${deployedContract?.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30"
                          >
                            Verify Manually
                          </a>
                        </div>
                      </div>
                      <p className="text-xs text-amber-400 mb-2">
                        If automatic verification failed, you can manually verify your contract using this source code
                      </p>
                      <details>
                        <summary className="text-sm cursor-pointer hover:text-purple-400">View Source Code</summary>
                        <pre className="mt-2 text-xs overflow-auto max-h-[200px] p-2 bg-black/50 rounded-md text-green-400 font-mono whitespace-pre-wrap">
                          {deploymentResult.contractCode}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-3">
                  <a 
                    href={`${getBlockExplorerBaseUrl()}/address/${deployedContract?.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-500/90 hover:to-blue-500/90 border border-white/10 rounded-xl text-sm"
                  >
                    <span>View Contract on Explorer</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </a>
                  
                  {deployedContract?.verificationStatus === 'failed' && (
                    <a 
                      href={`${getBlockExplorerBaseUrl()}/verifyContract?a=${deployedContract?.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 backdrop-blur-md bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-sm hover:bg-amber-500/20"
                    >
                      <span>Verify Contract Manually</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                    </a>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowSuccessModal(null);
                      setActiveTab('liquidity');
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 backdrop-blur-md bg-black/50 border border-white/10 rounded-xl text-sm hover:bg-black/60"
                  >
                    <span>Manage Liquidity</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}


    </AppLayout>
  );
}

const TickMath = {
  MIN_TICK: -887272,
  MAX_TICK: 887272
};
