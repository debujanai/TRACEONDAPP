'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';

// UNCX Lock Contract ABI - Fixed with correct function signatures
const UNCX_LOCK_ABI = [
  "function setApprovalForAll(address operator, bool approved)",
  "function lock((address nftPositionManager, uint256 nft_id, address dustRecipient, address owner, address additionalCollector, address collectAddress, uint256 unlockDate, uint16 countryCode, string feeName, bytes[] r)) returns (uint256)",
  "function getFee(string memory _name) view returns (tuple(string name, uint256 lpFee, uint256 collectFee, uint256 flatFee, address flatFeeToken))",
  "function getNumUserLocks(address _user) view returns (uint256)",
  "function getUserLockAtIndex(address _user, uint256 _index) view returns (tuple(uint256 lock_id, address nftPositionManager, uint256 nft_id, address owner, address pendingOwner, address additionalCollector, address collectAddress, uint256 unlockDate, uint16 countryCode, uint256 ucf))",
  "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
  "function getLock(uint256 _lockId) view returns (tuple(uint256 lock_id, address nftPositionManager, address pool, uint256 nft_id, address owner, address pendingOwner, address additionalCollector, address collectAddress, uint256 unlockDate, uint16 countryCode, uint256 ucf))",
  "error Error(string)",
  "event onLock(uint256 indexed lockId, address indexed nftPositionManager, uint256 indexed nftId, address owner, address additionalCollector, address collectAddress, uint256 unlockDate, uint16 countryCode, uint256 ucf, address pool, tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity) position)"
];

// Uniswap V3 Position Manager ABI (only the functions we need)
const UNISWAP_V3_POSITION_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)"
];

// ERC20 ABI for token symbol lookup
const ERC20_ABI = [
  "function symbol() view returns (string)"
];

// Contract addresses
const UNISWAP_V3_POSITION_NFT = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

// Define network types
type NetworkName = 'ethereum' | 'arbitrum' | 'optimism' | 'polygon' | 'base' | 'bsc' | 'avalanche' | 'celo' | 'sepolia';

// UNCX Lock Contract addresses for different networks
const UNCX_LOCK_ADDRESSES: Record<NetworkName, string> = {
  ethereum: "0xFD235968e65B0990584585763f837A5b5330e6DE",
  arbitrum: "0x6b5360B419e0851b4b81644e0F63c1A9778f2506",
  optimism: "0x1cE6d27F7e5494573684436d99574e8288eBBD2D",
  polygon: "0x40f6301edb774e8B22ADC874f6cb17242BaEB8c4",
  base: "0x231278eDd38B00B07fBd52120CEf685B9BaEBCC1",
  bsc: "0xfe88DAB083964C56429baa01F37eC2265AbF1557",
  avalanche: "0x625e1b2e78DC5b978237f9c29DE2910062D80a05",
  celo: "0xb108D212d1aEDf054354E7E707eab5bce6e029C6",
  sepolia: "0x6a976ECb2377E7CbB5B48913b0faA1D7446D4dC7"
};

// Network currency symbols
const NETWORK_CURRENCY_SYMBOLS: Record<NetworkName, string> = {
  ethereum: 'ETH',
  arbitrum: 'ETH',
  optimism: 'ETH',
  polygon: 'MATIC',
  base: 'ETH',
  bsc: 'BNB',
  avalanche: 'AVAX',
  celo: 'CELO',
  sepolia: 'ETH'
};

// Get the native currency symbol for the current network
const getNativeCurrencySymbol = (networkName: NetworkName): string => {
  return NETWORK_CURRENCY_SYMBOLS[networkName] || 'ETH';
};

// Default fee names for different networks
const DEFAULT_FEE_NAMES: Record<NetworkName, string> = {
  ethereum: "LVP", // From the successful Ethereum transaction
  arbitrum: "DEFAULT",
  optimism: "DEFAULT",
  polygon: "DEFAULT",
  base: "DEFAULT",
  bsc: "DEFAULT",
  avalanche: "DEFAULT",
  celo: "DEFAULT",
  sepolia: "DEFAULT"
};

// Helper function to get chain ID to network name mapping
const getNetworkName = (chainId: number): NetworkName => {
  switch (chainId) {
    case 1: return 'ethereum';
    case 42161: return 'arbitrum';
    case 10: return 'optimism';
    case 137: return 'polygon';
    case 8453: return 'base';
    case 56: return 'bsc';
    case 43114: return 'avalanche';
    case 42220: return 'celo';
    case 11155111: return 'sepolia';
    default: return 'polygon'; // Default to polygon if network not recognized
  }
};

// Get the appropriate lock contract address based on the current network
const getLockContractAddress = async (provider: ethers.BrowserProvider): Promise<string> => {
  const network = await provider.getNetwork();
  const networkName = getNetworkName(Number(network.chainId));
  return UNCX_LOCK_ADDRESSES[networkName] || UNCX_LOCK_ADDRESSES.polygon;
};

// Get the appropriate fee name based on the current network
const getDefaultFeeName = async (provider: ethers.BrowserProvider): Promise<string> => {
  const network = await provider.getNetwork();
  const networkName = getNetworkName(Number(network.chainId));
  return DEFAULT_FEE_NAMES[networkName] || "DEFAULT";
};

// Type for ethers provider
type EthereumProvider = ethers.Eip1193Provider;

interface Position {
  tokenId: string;
  token0: string;
  token1: string;
  fee: number;
  liquidity: string;
  token0Symbol: string;
  token1Symbol: string;
}

// Define interface for locked position
interface LockedPosition {
  lockId: string;
  nftId: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  fee: number;
  unlockDate: number;
  unlockDateFormatted: string;
  liquidity: string;
}

const LiquidityLockTab: React.FC = () => {
  const { isConnected, address, connectWallet } = useWallet();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [lockDuration, setLockDuration] = useState<number>(30); // Default 30 days
  const [isApproving, setIsApproving] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [flatFee, setFlatFee] = useState<string>("0.01"); // Default flat fee in native currency
  const [countryCode, setCountryCode] = useState<number>(0); // Default country code
  const [estimatedGasFee, setEstimatedGasFee] = useState<string>("0.002"); // Estimated gas fee in native currency
  const [useHardcodedFee, setUseHardcodedFee] = useState<boolean>(false);
  const [currentNetwork, setCurrentNetwork] = useState<NetworkName>('polygon');
  const [feeName, setFeeName] = useState<string>("DEFAULT");
  const [lockedPositions, setLockedPositions] = useState<LockedPosition[]>([]);
  const [loadingLocked, setLoadingLocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'lock' | 'view'>('lock');
  
  // Hardcoded fee value in wei (0.01 MATIC/ETH/etc.)
  const HARDCODED_FEE = "10000000000000000";

  // Helper function to get token symbol
  const getTokenSymbol = async (tokenAddress: string, provider: ethers.BrowserProvider) => {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        provider
      );
      
      const symbol = await tokenContract.symbol();
      return symbol;
    } catch (err) {
      console.error("Error getting token symbol:", err);
      return tokenAddress.substring(0, 6);
    }
  };

  // Fetch user's Uniswap V3 positions
  const fetchPositions = async () => {
    if (!isConnected || !address || !window.ethereum) return;

    setLoading(true);
    setError(null);
    
    try {
      // Get provider from window.ethereum
      const provider = new ethers.BrowserProvider(window.ethereum as EthereumProvider);
      
      // Create contract instance for Uniswap V3 Position NFT
      const positionContract = new ethers.Contract(
        UNISWAP_V3_POSITION_NFT,
        UNISWAP_V3_POSITION_ABI,
        provider
      );
      
      // Get number of positions owned by user
      const balance = await positionContract.balanceOf(address);
      const balanceNumber = Number(balance);
      
      if (balanceNumber === 0) {
        setPositions([]);
        setLoading(false);
        return;
      }
      
      // Fetch all positions
      const positionPromises = [];
      for (let i = 0; i < balanceNumber; i++) {
        positionPromises.push(fetchPositionDetails(i, positionContract, provider));
      }
      
      const fetchedPositions = await Promise.all(positionPromises);
      setPositions(fetchedPositions.filter(Boolean) as Position[]);
    } catch (err) {
      console.error("Error fetching positions:", err);
      setError("Failed to fetch your liquidity positions. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch details for a single position
  const fetchPositionDetails = async (
    index: number, 
    positionContract: ethers.Contract, 
    provider: ethers.BrowserProvider
  ): Promise<Position | null> => {
    try {
      // Get token ID for the position
      const tokenId = await positionContract.tokenOfOwnerByIndex(address, index);
      
      // Get position details
      const position = await positionContract.positions(tokenId);
      
      // Get token symbols
      const [token0Symbol, token1Symbol] = await Promise.all([
        getTokenSymbol(position.token0, provider),
        getTokenSymbol(position.token1, provider)
      ]);
      
      return {
        tokenId: tokenId.toString(),
        token0: position.token0,
        token1: position.token1,
        fee: Number(position.fee),
        liquidity: position.liquidity.toString(),
        token0Symbol,
        token1Symbol
      };
    } catch (err) {
      console.error("Error fetching position details:", err);
      return null;
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchPositions();
    }
  }, [isConnected, address]);

  // Reset states when position changes
  useEffect(() => {
    setIsApproved(false);
    setSuccess(null);
    setError(null);
    setTxHash(null);
  }, [selectedPosition]);

  // Get the flat fee from the contract
  const getFlatFeeFromContract = async (provider: ethers.BrowserProvider) => {
    try {
      const lockContract = new ethers.Contract(
        await getLockContractAddress(provider),
        UNCX_LOCK_ABI,
        provider
      );
      
      // Get the DEFAULT fee struct
      const feeStruct = await lockContract.getFee("DEFAULT");
      
      // Return the flatFee in ether
      const fee = ethers.formatEther(feeStruct.flatFee);
      
      // Estimate gas cost while we're at it
      try {
        const gasPrice = await provider.getFeeData();
        if (gasPrice.gasPrice) {
          // Assuming around 500,000 gas units for the transaction
          const gasCost = gasPrice.gasPrice * BigInt(500000);
          const estimatedGas = ethers.formatEther(gasCost);
          setEstimatedGasFee(estimatedGas);
          console.log("Estimated gas cost:", estimatedGas);
        }
      } catch (err) {
        console.error("Error estimating gas:", err);
      }
      
      return fee;
    } catch (err) {
      console.error("Error getting flat fee:", err);
      return "0.01"; // Default fallback value
    }
  };

  // In useEffect, after fetchPositions
  useEffect(() => {
    if (isConnected && window.ethereum) {
      const fetchFee = async () => {
        const provider = new ethers.BrowserProvider(window.ethereum as EthereumProvider);
        const fee = await getFlatFeeFromContract(provider);
        setFlatFee(fee);
      };
      
      fetchFee();
    }
  }, [isConnected]);

  // Add a useEffect to detect the current network and set appropriate values
  useEffect(() => {
    if (isConnected && window.ethereum) {
      const detectNetwork = async () => {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum as EthereumProvider);
          const network = await provider.getNetwork();
          const networkName = getNetworkName(Number(network.chainId));
          setCurrentNetwork(networkName);
          
          // Set the appropriate fee name for the network
          const defaultFeeName = await getDefaultFeeName(provider);
          setFeeName(defaultFeeName);
          
          console.log(`Connected to network: ${networkName}, using fee name: ${defaultFeeName}`);
        } catch (err) {
          console.error("Error detecting network:", err);
        }
      };
      
      detectNetwork();
    }
  }, [isConnected]);

  // Approve UNCX to transfer the NFT position
  const approveUNCX = async () => {
    if (!isConnected || !selectedPosition || !window.ethereum) {
      setError("Please connect your wallet and select a position first");
      return;
    }

    setIsApproving(true);
    setError(null);
    setSuccess(null);
    setTxHash(null);
    
    try {
      // Get provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum as EthereumProvider);
      const signer = await provider.getSigner();
      
      // Create contract instance for Uniswap V3 Position NFT
      const positionContract = new ethers.Contract(
        UNISWAP_V3_POSITION_NFT,
        [
          "function setApprovalForAll(address operator, bool approved)",
          "function isApprovedForAll(address owner, address operator) view returns (bool)"
        ],
        signer
      );
      
      // Check if already approved
      const isAlreadyApproved = await positionContract.isApprovedForAll(address, await getLockContractAddress(provider));
      
      if (isAlreadyApproved) {
        setSuccess("Position is already approved for UNCX");
        setIsApproved(true);
        setIsApproving(false);
        return;
      }
      
      // Approve UNCX lock contract to transfer the position
      const tx = await positionContract.setApprovalForAll(await getLockContractAddress(provider), true);
      setTxHash(tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        // Verify approval was successful
        const isApprovedAfterTx = await positionContract.isApprovedForAll(address, await getLockContractAddress(provider));
        
        if (isApprovedAfterTx) {
          setSuccess("Successfully approved UNCX to lock your position");
          setIsApproved(true);
        } else {
          throw new Error("Approval transaction succeeded but approval is not active");
        }
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err: any) {
      console.error("Error approving UNCX:", err);
      setError(err.message || "Failed to approve UNCX. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  // Helper function to interpret UNCX Locker error codes
  const interpretUNCXError = (errorCode: string): string => {
    switch (errorCode) {
      case "TF":
        return "Transfer Failed: The transaction couldn't transfer the required fee. Make sure you have enough MATIC to cover the fee.";
      case "FLAT FEE":
        return "Incorrect fee amount. The contract requires the exact fee amount specified.";
      case "DATE PASSED":
        return "The unlock date has already passed. Please choose a future date.";
      case "COUNTRY":
        return "Invalid country code. Please set a valid country code.";
      case "INVALID NFT POSITION MANAGER":
        return "The NFT position manager is not whitelisted by UNCX.";
      case "OWNER CANNOT = address(0)":
        return "Owner address cannot be the zero address.";
      case "COLLECT_ADDR":
        return "Collect address cannot be the zero address.";
      case "MILLISECONDS":
        return "Invalid unlock date format. Please ensure you're using Unix timestamp in seconds.";
      case "NOT FOUND":
        return "Fee structure not found. The specified fee name is invalid.";
      default:
        return `Error: ${errorCode}`;
    }
  };

  // Helper function to check if we have enough gas for the transaction
  const checkGasAndBalance = async (provider: ethers.BrowserProvider, signer: ethers.JsonRpcSigner, feeAmount: bigint): Promise<boolean> => {
    try {
      // Get wallet balance
      const balance = await provider.getBalance(await signer.getAddress());
      console.log("Wallet balance:", ethers.formatEther(balance));
      console.log("Required fee:", ethers.formatEther(feeAmount));
      
      // Estimate gas cost
      try {
        const gasPrice = await provider.getFeeData();
        if (gasPrice.gasPrice) {
          // Assuming around 500,000 gas units for the transaction
          const gasCost = gasPrice.gasPrice * BigInt(500000);
          const estimatedGas = ethers.formatEther(gasCost);
          setEstimatedGasFee(estimatedGas);
          console.log("Estimated gas cost:", estimatedGas);
        }
      } catch (err) {
        console.error("Error estimating gas:", err);
      }
      
      // Get current network
      const network = await provider.getNetwork();
      const networkName = getNetworkName(Number(network.chainId));
      const currencySymbol = getNativeCurrencySymbol(networkName);
      
      // Check if we have at least 3x the fee amount (fee + gas)
      if (balance < (feeAmount * BigInt(3))) {
        setError(`Insufficient balance. You need at least ${ethers.formatEther(feeAmount * BigInt(3))} ${currencySymbol} to cover the fee and gas.`);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Error checking gas and balance:", err);
      return true; // Continue with the transaction even if the check fails
    }
  };

  // Lock the position using UNCX
  const lockPosition = async () => {
    if (!isConnected || !selectedPosition || !window.ethereum || !isApproved) {
      setError("Please connect your wallet, select a position, and approve UNCX first");
      return;
    }

    setIsLocking(true);
    setError(null);
    setTxHash(null);
    
    try {
      // Get provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum as EthereumProvider);
      const signer = await provider.getSigner();
      
      // Get the current network
      const network = await provider.getNetwork();
      const networkName = getNetworkName(Number(network.chainId));
      console.log(`Current network: ${networkName}`);
      
      // Get the appropriate lock contract address
      const lockContractAddress = await getLockContractAddress(provider);
      console.log(`Using lock contract address: ${lockContractAddress}`);
      
      // Create contract instance for UNCX lock contract
      const lockContract = new ethers.Contract(
        lockContractAddress,
        UNCX_LOCK_ABI,
        signer
      );
      
      // Create contract instance for Uniswap V3 Position NFT
      const positionContract = new ethers.Contract(
        UNISWAP_V3_POSITION_NFT,
        UNISWAP_V3_POSITION_ABI,
        signer
      );
      
      // Calculate unlock date (current time + lockDuration days)
      const unlockDate = Math.floor(Date.now() / 1000) + (lockDuration * 24 * 60 * 60);

      // Get the appropriate fee name for the current network
      const defaultFeeName = await getDefaultFeeName(provider);
      console.log(`Using fee name: ${defaultFeeName}`);
      
      // Get the fee from the contract
      const feeStruct = await lockContract.getFee(defaultFeeName);
      console.log("Fee struct from contract:", feeStruct);
      setFlatFee(ethers.formatEther(feeStruct.flatFee));
      
      // IMPORTANT: We need to send the exact fee amount from the contract
      const exactFlatFee = feeStruct.flatFee;
      console.log("Exact flat fee (wei):", exactFlatFee.toString());
      console.log("Exact flat fee (ETH):", ethers.formatEther(exactFlatFee));
      
      // Verify the NFT is actually approved
      const isApprovedForAll = await positionContract.isApprovedForAll(address, lockContractAddress);
      if (!isApprovedForAll) {
        // If approval check fails, try to approve again to ensure it's properly set
        const approveTx = await positionContract.setApprovalForAll(lockContractAddress, true);
        await approveTx.wait();
        
        // Verify the approval was successful
        const isApprovedAfterTx = await positionContract.isApprovedForAll(address, lockContractAddress);
        if (!isApprovedAfterTx) {
          throw new Error("Failed to approve NFT transfer. Please try again.");
        }
      }
      
      // CRITICAL: Structure the lock parameters correctly
      // The contract expects a single struct parameter
      const lockParams = {
        nftPositionManager: UNISWAP_V3_POSITION_NFT,
        nft_id: selectedPosition,
        dustRecipient: address,
        owner: address,
        additionalCollector: address,
        collectAddress: address,
        unlockDate: unlockDate,
        countryCode: countryCode,
        feeName: defaultFeeName, // Use the network-specific fee name
        r: []
      };
      
      console.log("Lock params:", lockParams);
      
      // Call the lock function with the correct parameters
      // The contract expects the exact fee amount as the transaction value
      const tx = await lockContract.lock(
        lockParams, // Pass the struct directly
        {
          value: exactFlatFee,
          gasLimit: 1000000
        }
      );
      
      setTxHash(tx.hash);
      console.log("Transaction sent:", tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);
      
      if (receipt.status === 1) {
        setSuccess("Successfully locked your liquidity position!");
        // Reset states
        setSelectedPosition(null);
        setIsApproved(false);
        // Refresh positions after locking
        fetchPositions();
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err: any) {
      // Try to extract the revert reason if it exists
      console.error("Lock transaction error details:", err);
      
      if (err.data) {
        // This might be a contract revert with reason
        const errorMessage = err.data.message || err.message;
        
        // Check if the error is a known UNCX error code
        if (errorMessage.includes("reverted: ")) {
          const errorCode = errorMessage.split("reverted: ")[1].replace(/"/g, '');
          setError(interpretUNCXError(errorCode));
        } else {
          setError(`Contract error: ${errorMessage}`);
        }
      } else if (err.message) {
        if (err.message.includes("reverted: ")) {
          // Try to extract the revert reason from the error message
          const errorCode = err.message.split("reverted: ")[1].replace(/"/g, '');
          setError(interpretUNCXError(errorCode));
        } else if (err.message.includes("\"reason\":\"")) {
          // Extract the reason from the JSON error
          const reasonMatch = err.message.match(/"reason":"([^"]+)"/);
          if (reasonMatch && reasonMatch[1]) {
            setError(interpretUNCXError(reasonMatch[1]));
          } else {
            setError(err.message);
          }
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to lock position. Please try again.");
      }
    } finally {
      setIsLocking(false);
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  // Check if a lock has expired
  const isLockExpired = (unlockDate: number): boolean => {
    return unlockDate < Math.floor(Date.now() / 1000);
  }

  // Fetch user's locked positions
  const fetchLockedPositions = async () => {
    if (!isConnected || !address || !window.ethereum) return;

    setLoadingLocked(true);
    setError(null);
    
    try {
      // Get provider
      const provider = new ethers.BrowserProvider(window.ethereum as EthereumProvider);
      
      // Get the appropriate lock contract address
      const lockContractAddress = await getLockContractAddress(provider);
      
      // Create contract instance for UNCX lock contract
      const lockContract = new ethers.Contract(
        lockContractAddress,
        UNCX_LOCK_ABI,
        provider
      );
      
      // Get number of locks for the user
      const numLocks = await lockContract.getNumUserLocks(address);
      const numLocksNumber = Number(numLocks);
      
      if (numLocksNumber === 0) {
        setLockedPositions([]);
        setLoadingLocked(false);
        return;
      }
      
      // Fetch all locks
      const lockPromises = [];
      for (let i = 0; i < numLocksNumber; i++) {
        lockPromises.push(fetchLockDetails(i, lockContract, provider));
      }
      
      const fetchedLocks = await Promise.all(lockPromises);
      setLockedPositions(fetchedLocks.filter(Boolean) as LockedPosition[]);
    } catch (err: any) {
      console.error("Error fetching locked positions:", err);
      
      // Provide a more descriptive error message
      let errorMessage = "Failed to fetch your locked positions.";
      
      if (err.message) {
        if (err.message.includes("user rejected")) {
          errorMessage = "Transaction was rejected by the user.";
        } else if (err.message.includes("network")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (err.message.includes("contract")) {
          errorMessage = "Contract error. The UNCX lock contract might be unavailable.";
        }
      }
      
      setError(errorMessage);
      setLockedPositions([]); // Clear positions on error
    } finally {
      setLoadingLocked(false);
    }
  };
  
  // Fetch details for a single lock
  const fetchLockDetails = async (
    index: number, 
    lockContract: ethers.Contract, 
    provider: ethers.BrowserProvider
  ): Promise<LockedPosition | null> => {
    try {
      // Get lock details from getUserLockAtIndex
      const userLock = await lockContract.getUserLockAtIndex(address, index);
      const lockId = userLock.lock_id.toString();
      
      try {
        // Get more detailed lock information using getLock function
        const lock = await lockContract.getLock(lockId);
        
        // Check if the lock has a valid pool address
        if (lock.pool && lock.pool !== ethers.ZeroAddress) {
          // Try to get token information from the pool
          try {
            // Create a minimal pool interface to get token0 and token1
            const poolInterface = new ethers.Interface([
              "function token0() view returns (address)",
              "function token1() view returns (address)",
              "function fee() view returns (uint24)"
            ]);
            
            const poolContract = new ethers.Contract(lock.pool, poolInterface, provider);
            
            // Get token addresses and fee from the pool
            const [token0, token1, fee] = await Promise.all([
              poolContract.token0(),
              poolContract.token1(),
              poolContract.fee()
            ]);
            
            // Get token symbols
            const [token0Symbol, token1Symbol] = await Promise.all([
              getTokenSymbol(token0, provider),
              getTokenSymbol(token1, provider)
            ]);
            
            return {
              lockId: lock.lock_id.toString(),
              nftId: lock.nft_id.toString(),
              token0: token0,
              token1: token1,
              token0Symbol,
              token1Symbol,
              fee: Number(fee),
              unlockDate: Number(lock.unlockDate),
              unlockDateFormatted: formatDate(Number(lock.unlockDate)),
              liquidity: "N/A" // We don't have liquidity information from the pool
            };
          } catch (poolError) {
            console.error("Error getting pool information:", poolError);
          }
        }
        
        // Fallback: Return lock with basic information
        return {
          lockId: lock.lock_id.toString(),
          nftId: lock.nft_id.toString(),
          token0: ethers.ZeroAddress,
          token1: ethers.ZeroAddress,
          token0Symbol: "Unknown",
          token1Symbol: "Unknown",
          fee: 0,
          unlockDate: Number(lock.unlockDate),
          unlockDateFormatted: formatDate(Number(lock.unlockDate)),
          liquidity: "0"
        };
      } catch (lockError) {
        console.error("Error fetching detailed lock information:", lockError);
        
        // Use the basic information from getUserLockAtIndex if getLock fails
        return {
          lockId: userLock.lock_id.toString(),
          nftId: userLock.nft_id.toString(),
          token0: ethers.ZeroAddress,
          token1: ethers.ZeroAddress,
          token0Symbol: "Unknown",
          token1Symbol: "Unknown",
          fee: 0,
          unlockDate: Number(userLock.unlockDate),
          unlockDateFormatted: formatDate(Number(userLock.unlockDate)),
          liquidity: "0"
        };
      }
    } catch (err) {
      console.error("Error fetching lock details:", err);
      return null;
    }
  };

  // Effect to fetch locked positions when connected
  useEffect(() => {
    if (isConnected) {
      fetchLockedPositions();
    }
  }, [isConnected, address, currentNetwork]);

  // Add this useEffect to clear error state when switching tabs
  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <motion.div
        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm uppercase tracking-wider text-white/70">UNCX LIQUIDITY LOCKING</h2>
          <div className="text-xs bg-black/30 px-3 py-1 rounded-full border border-white/10">
            Network: {currentNetwork.charAt(0).toUpperCase() + currentNetwork.slice(1)}
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex mb-6 border-b border-white/10">
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'lock' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('lock')}
          >
            Lock Liquidity
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'view' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('view')}
          >
            View Locked Positions
          </button>
        </div>
        
        {activeTab === 'lock' ? (
          // Lock Tab Content
          <>
            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-white/70 mb-4">Connect your wallet to view and lock your liquidity positions</p>
                <button 
                  onClick={connectWallet}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                >
                  Connect Wallet
                </button>
              </div>
            ) : (
              <>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : positions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/70">No liquidity positions found</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
                        Select a position to lock
                      </h3>
                      
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {positions.map((position) => (
                          <div 
                            key={position.tokenId}
                            className={`bg-black/40 rounded-lg p-4 border transition-all cursor-pointer ${
                              selectedPosition === position.tokenId 
                                ? 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                                : 'border-white/10 hover:border-white/30'
                            }`}
                            onClick={() => setSelectedPosition(position.tokenId)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-sm font-medium">
                                  Position #{position.tokenId}
                                </div>
                                <div className="text-xs text-white/60 mt-1">
                                  {position.token0Symbol}/{position.token1Symbol} - {position.fee/10000}%
                                </div>
                              </div>
                              <div className="flex items-center">
                                {selectedPosition === position.tokenId && (
                                  <div className="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
                                )}
                                <div className="text-sm font-medium">
                                  Select
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                        Lock Duration
                      </h3>
                      
                      <div className="flex flex-wrap gap-3">
                        {[30, 90, 180, 365].map((days) => (
                          <button
                            key={days}
                            className={`px-4 py-2 rounded-lg text-sm ${
                              lockDuration === days 
                                ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white' 
                                : 'bg-black/40 border border-white/10 text-white/70 hover:text-white hover:border-white/30'
                            }`}
                            onClick={() => setLockDuration(days)}
                          >
                            {days} Days
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* <div className="mb-6">
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
                        Country Code
                      </h3>
                      
                      <div className="flex items-center bg-black/40 rounded-lg border border-white/10 p-2">
                        <input
                          type="number"
                          value={countryCode}
                          onChange={(e) => setCountryCode(parseInt(e.target.value) || 0)}
                          className="bg-transparent w-32 px-2 py-1 text-white focus:outline-none"
                          placeholder="Country code"
                          min="0"
                          max="999"
                        />
                      </div>
                      <p className="text-xs text-white/60 mt-1">
                        Set to 0 if you're not sure. This is used for compliance purposes.
                      </p>
                    </div> */}
{/*                     
                    <div className="mb-6">
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                        Locking Fee (in {getNativeCurrencySymbol(currentNetwork)})
                      </h3>
                      
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center bg-black/40 rounded-lg border border-white/10 p-2">
                          <input
                            type="text"
                            value={flatFee}
                            readOnly
                            className="bg-transparent w-32 px-2 py-1 text-white focus:outline-none cursor-not-allowed"
                          />
                          <div className="text-white/70 ml-2">{getNativeCurrencySymbol(currentNetwork)}</div>
                        </div>
                        <p className="text-xs text-white/60">
                          This is the required flat fee for the UNCX protocol to lock your position. The fee is handled automatically by the contract.
                        </p>
                        <div className="flex justify-between items-center bg-black/20 rounded-lg p-3 border border-white/5">
                          <div>
                            <span className="text-xs text-white/80 font-medium">Estimated Total Cost</span>
                            <p className="text-xs text-white/60">Including transaction gas</p>
                          </div>
                          <div className="text-sm font-medium">
                            {(parseFloat(flatFee) + parseFloat(estimatedGasFee)).toFixed(6)} {getNativeCurrencySymbol(currentNetwork)}
                          </div>
                        </div>
                      </div>
                    </div> */}
                    
                    {error && (
                      <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {error}
                      </div>
                    )}
                    
                    {success && (
                      <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                        {success}
                      </div>
                    )}
                    
                    {txHash && (
                      <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm">
                        <span className="text-blue-400">Transaction Hash: </span>
                        <a 
                          href={`https://polygonscan.com/tx/${txHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 underline hover:text-blue-300"
                        >
                          {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
                        </a>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={approveUNCX}
                        disabled={!selectedPosition || isApproving || isApproved}
                        className={`px-6 py-3 rounded-lg text-white font-medium flex-1 flex justify-center items-center ${
                          !selectedPosition || isApproving
                            ? 'bg-gray-600/50 cursor-not-allowed'
                            : isApproved
                            ? 'bg-green-600/50 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 transition-opacity'
                        }`}
                      >
                        {isApproving ? (
                          <>
                            <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                            Approving...
                          </>
                        ) : isApproved ? (
                          'Step 1: ✓ Approved'
                        ) : (
                          'Step 1: Approve UNCX'
                        )}
                      </button>
                      
                      <button
                        onClick={lockPosition}
                        disabled={!selectedPosition || isLocking || !isApproved}
                        className={`px-6 py-3 rounded-lg text-white font-medium flex-1 flex justify-center items-center ${
                          !selectedPosition || isLocking || !isApproved
                            ? 'bg-gray-600/50 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-500 hover:opacity-90 transition-opacity'
                        }`}
                      >
                        {isLocking ? (
                          <>
                            <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                            Locking...
                          </>
                        ) : (
                          'Step 2: Lock Position'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        ) : (
          // View Locked Positions Tab Content
          <>
            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-white/70 mb-4">Connect your wallet to view your locked positions</p>
                <button 
                  onClick={connectWallet}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                >
                  Connect Wallet
                </button>
              </div>
            ) : (
              <>
                {loadingLocked ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : lockedPositions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/70">No locked positions found</p>
                    <button 
                      onClick={fetchLockedPositions}
                      className="mt-4 px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white/70 text-sm hover:text-white hover:border-white/30"
                    >
                      Refresh
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex justify-between items-center">
                      <h3 className="text-sm font-medium">Your Locked Positions</h3>
                      <button 
                        onClick={fetchLockedPositions}
                        className="px-3 py-1 bg-black/40 border border-white/10 rounded-lg text-white/70 text-xs hover:text-white hover:border-white/30"
                      >
                        Refresh
                      </button>
                    </div>
                    
                    {error && (
                      <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {error}
                      </div>
                    )}
                    
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {lockedPositions.map((lock) => (
                        <div 
                          key={lock.lockId}
                          className="bg-black/40 rounded-lg p-4 border border-white/10 hover:border-white/30 transition-all"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="text-sm font-medium flex items-center">
                                <span>Lock #{lock.lockId}</span>
                                <span className="mx-2 text-white/30">|</span>
                                <span>Position #{lock.nftId}</span>
                              </div>
                              <div className="text-xs text-white/60 mt-1">
                                {lock.token0Symbol === "Unknown" ? (
                                  <span className="text-yellow-400">Position information unavailable</span>
                                ) : (
                                  `${lock.token0Symbol}/${lock.token1Symbol} - ${lock.fee/10000}%`
                                )}
                              </div>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full ${isLockExpired(lock.unlockDate) ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {isLockExpired(lock.unlockDate) ? 'Unlocked' : 'Locked'}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                              <div className="text-white/50 mb-1">Unlock Date</div>
                              <div className="font-medium">{lock.unlockDateFormatted}</div>
                            </div>
                            <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                              <div className="text-white/50 mb-1">Status</div>
                              <div className="font-medium">
                                {isLockExpired(lock.unlockDate) ? (
                                  <span className="text-green-400">Ready to withdraw</span>
                                ) : (
                                  <span className="text-blue-400">
                                    {Math.ceil((lock.unlockDate - Math.floor(Date.now() / 1000)) / (24 * 60 * 60))} days left
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex justify-end">
                            <a 
                              href={`https://${currentNetwork === 'ethereum' ? '' : currentNetwork + '.'}uncx.network/liquidity/${currentNetwork === 'ethereum' ? 'eth' : currentNetwork}/locks`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-purple-400 hover:text-purple-300"
                            >
                              View on UNCX
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </motion.div>
      
      <motion.div
        className="backdrop-blur-lg bg-gradient-to-b from-black/40 to-black/60 rounded-2xl p-6 border border-white/10 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h2 className="text-sm uppercase tracking-wider text-white/70 mb-6">UNCX LIQUIDITY LOCKING BENEFITS</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="backdrop-blur-md bg-black/30 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
              Enhanced Security
            </h3>
            <p className="text-sm text-white/70">
              UNCX provides secure, time-locked liquidity protection that helps build trust with your community and investors.
            </p>
          </div>
          
          <div className="backdrop-blur-md bg-black/30 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
              Transparent Verification
            </h3>
            <p className="text-sm text-white/70">
              All locks are verifiable on-chain, providing complete transparency for your token's liquidity status.
            </p>
          </div>
          
          <div className="backdrop-blur-md bg-black/30 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
              Customizable Lock Duration
            </h3>
            <p className="text-sm text-white/70">
              Choose lock periods that align with your project roadmap, from 30 days to multiple years.
            </p>
          </div>
          
          <div className="backdrop-blur-md bg-black/30 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
              Uniswap V3 Compatible
            </h3>
            <p className="text-sm text-white/70">
              Lock concentrated liquidity positions from Uniswap V3 with full NFT position support.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LiquidityLockTab;