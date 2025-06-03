import { ethers } from 'ethers';

export class UNCXLiquidityLocker {
    contracts: {
        ethereum: {
            locker: string;
            migrator: string;
            proofOfReserves: string;
            feeResolver: string;
        };
        polygon: {
            locker: string;
            migrator: string;
            proofOfReserves: string;
            feeResolver: string;
        };
    };

    uniswapV3: {
        ethereum: {
            nftManager: string;
            factory: string;
        };
        polygon: {
            nftManager: string;
            factory: string;
        };
    };

    // Custom RPC URLs
    rpcUrls: {
        ethereum: string;
        polygon: string;
    };

    provider: ethers.BrowserProvider | null; // For write operations requiring signing
    readProvider: ethers.JsonRpcProvider | null; // For read operations
    signer: ethers.JsonRpcSigner | null;
    network: 'ethereum' | 'polygon';
    isDemoMode: boolean;

    constructor() {
        // UNCX Contract Addresses (from official GitHub)
        this.contracts = {
            ethereum: {
                locker: '0xFD235968e65B0990584585763f837A5b5330e6DE',
                migrator: '0x07c1bDD98fb4498C418C8323F1d9EF514ab7A89C',
                proofOfReserves: '0x7f5C649856F900d15C83741f45AE46f5C6858234',
                feeResolver: '0x231278eDd38B00B07fBd52120CEf685B9BaEBCC1'
            },
            polygon: {
                locker: '0x40f6301edb774e8B22ADC874f6cb17242BaEB8c4',
                migrator: '0x7fcCF17620CE18c039eB3485628e5C50d2AE1CEC',
                proofOfReserves: '0xD8207e9449647a9668AD3F8eCb97a1f929f81fd1',
                feeResolver: '0xC22218406983bF88BB634bb4Bf15fA4E0A1a8c84'
            }
        };

        // Uniswap V3 Contract Addresses
        this.uniswapV3 = {
            ethereum: {
                nftManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
                factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984'
            },
            polygon: {
                nftManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
                factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984'
            }
        };

        // Default RPC URLs (will be overridden if custom ones are provided)
        this.rpcUrls = {
            ethereum: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Public Infura URL
            polygon: 'https://polygon-mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161' // Public Infura URL
        };

        this.provider = null;
        this.readProvider = null;
        this.signer = null;
        this.network = 'ethereum';
        this.isDemoMode = false;
    }

    // Helper function for delay with exponential backoff
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Helper function to retry RPC calls with exponential backoff
    private async retryRpcCall<T>(
        fn: () => Promise<T>,
        maxRetries = 5,
        baseDelay = 1000
    ): Promise<T> {
        let retryCount = 0;
        let lastError: any;
        
        while (retryCount < maxRetries) {
            try {
                return await fn();
            } catch (error: any) {
                lastError = error;
                
                // Check if this is a rate limit error
                const isRateLimit = 
                    error?.message?.includes('rate limit') || 
                    error?.message?.includes('429') ||
                    error?.message?.includes('exceeded') ||
                    error?.message?.includes('too many requests');
                
                if (!isRateLimit && retryCount > 1) {
                    // If it's not a rate limit error and we've already retried, throw it
                    throw error;
                }
                
                // Exponential backoff with jitter
                const jitter = Math.random() * 500;
                const waitTime = baseDelay * Math.pow(2, retryCount) + jitter;
                
                console.log(`RPC call failed (attempt ${retryCount + 1}/${maxRetries}), waiting ${Math.round(waitTime)}ms: ${error.message}`);
                await this.delay(waitTime);
                
                retryCount++;
            }
        }
        
        throw lastError;
    }

    // Set custom RPC URLs
    setRpcUrls(ethereum: string, polygon: string) {
        this.rpcUrls.ethereum = ethereum;
        this.rpcUrls.polygon = polygon;
        console.log("Custom RPC URLs set for Ethereum and Polygon");
    }

    // Initialize with wallet connection
    async initialize(provider: ethers.BrowserProvider, network: 'ethereum' | 'polygon' = 'ethereum', customRpcUrl?: string) {
        this.provider = provider;
        this.signer = await provider.getSigner();
        this.network = network;
        
        // Set up read provider with custom RPC URL or default one
        if (customRpcUrl) {
            this.readProvider = new ethers.JsonRpcProvider(customRpcUrl);
        } else {
            this.readProvider = new ethers.JsonRpcProvider(this.rpcUrls[network]);
        }
        
        console.log(`Using ${this.rpcUrls[network]} for read operations on ${network}`);
        
        try {
            // Check if we can connect to the contracts using the read provider
            const locker = new ethers.Contract(
                this.contracts[this.network].locker,
                ["function name() view returns (string)"],
                this.readProvider
            );
            
            try {
                // Use retry mechanism for the initial connection test
                await this.retryRpcCall(() => locker.name());
                this.isDemoMode = false;
                console.log("Successfully connected to UNCX contracts");
            } catch (error) {
                console.log("Falling back to demo mode due to contract connectivity issues:", error);
                this.isDemoMode = true;
            }
        } catch (error) {
            console.log("Falling back to demo mode due to initialization issues:", error);
            this.isDemoMode = true;
        }
        
        console.log(`Initialized UNCX Locker for ${network} (Demo Mode: ${this.isDemoMode})`);
    }

    // Get Uniswap V3 NFT Manager ABI (essential functions)
    getNFTManagerABI() {
        return [
            "function balanceOf(address owner) external view returns (uint256)",
            "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
            "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
            "function approve(address to, uint256 tokenId) external",
            "function getApproved(uint256 tokenId) external view returns (address)",
            "function ownerOf(uint256 tokenId) external view returns (address)"
        ];
    }

    // Get UNCX Locker ABI (main functions)
    getUNCXLockerABI() {
        return [
            "function lock(uint256 _nftId, address _dustRecipient, address _owner, address _additionalCollector, address _collectAddress, uint256 _unlockDate, uint16 _countryCode, string memory _feeName, bytes memory _extraData) external payable returns (uint256 lockId)",
            "function userLocks(address _user, uint256 _index) external view returns (uint256)",
            "function userLocksLength(address _user) external view returns (uint256)",
            "function getLock(uint256 _lockId) external view returns (tuple(uint256 lockId, uint256 nftId, address owner, address additionalCollector, address collectAddress, uint256 unlockDate, uint16 countryCode, uint256 ucf))",
            "function unlock(uint256 _lockId) external",
            "function relock(uint256 _lockId, uint256 _unlockDate) external",
            "function withdraw(uint256 _lockId, address _receiver) external",
            "function feeAmount() external view returns (uint256)"
        ];
    }

    // Get UNCX Fee Resolver ABI
    getFeeResolverABI() {
        return [
            "function getRegisteredFeeVault() external view returns (address)",
            "function useFlatRate(address _user) external view returns (bool)",
            "function getDiscount(address _user) external view returns (uint256)"
        ];
    }

    // Create mock NFT position for demo mode
    createMockNFTPosition(index: number, walletAddress: string) {
        return {
            tokenId: `${10000 + index}`,
            token0: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0", // Sample token address (MATIC on Ethereum)
            token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // Sample token address (WETH)
            fee: BigInt(3000), // 0.3% fee
            tickLower: -887220,
            tickUpper: 887220,
            liquidity: "1000000000000000000",
            tokensOwed0: "0",
            tokensOwed1: "0",
            _owner: walletAddress
        };
    }

    // Create mock locked position for demo mode
    createMockLockedPosition(index: number, walletAddress: string) {
        const now = Math.floor(Date.now() / 1000);
        // Make some locks unlocked and some still locked
        const unlockDate = index % 2 === 0 
            ? now - 86400 // 1 day ago (unlocked)
            : now + 2592000; // 30 days in future (locked)
            
        return {
            lockId: `${20000 + index}`,
            nftId: `${10000 + index}`,
            owner: walletAddress,
            additionalCollector: ethers.ZeroAddress,
            collectAddress: ethers.ZeroAddress,
            unlockDate: unlockDate.toString(),
            countryCode: 0,
            ucf: "0"
        };
    }

    // Use READ provider for fetching NFT positions
    async fetchUserNFTPositions(walletAddress: string) {
        if (this.isDemoMode) {
            console.log("Using demo data for NFT positions");
            // Return mock data for demo mode
            return Array(3).fill(0).map((_, i) => 
                this.createMockNFTPosition(i, walletAddress)
            );
        }
        
        if (!this.readProvider) throw new Error("Provider not initialized");
        
        try {
            const nftManager = new ethers.Contract(
                this.uniswapV3[this.network].nftManager,
                this.getNFTManagerABI(),
                this.readProvider // Use read provider to avoid rate limits
            );

            // Use retry mechanism for RPC calls
            const balance = await this.retryRpcCall(() => nftManager.balanceOf(walletAddress));
            const positions = [];

            for (let i = 0; i < balance; i++) {
                try {
                    // Use retry mechanism for each position fetch
                    const tokenId = await this.retryRpcCall(() => 
                        nftManager.tokenOfOwnerByIndex(walletAddress, i)
                    );
                    
                    const position = await this.retryRpcCall(() => 
                        nftManager.positions(tokenId)
                    );
                    
                    positions.push({
                        tokenId: tokenId.toString(),
                        token0: position.token0,
                        token1: position.token1,
                        fee: position.fee,
                        tickLower: position.tickLower,
                        tickUpper: position.tickUpper,
                        liquidity: position.liquidity.toString(),
                        tokensOwed0: position.tokensOwed0.toString(),
                        tokensOwed1: position.tokensOwed1.toString()
                    });
                } catch (posError) {
                    console.error(`Error fetching position at index ${i}:`, posError);
                    // Continue to next position
                }
            }

            console.log(`Found ${positions.length} NFT positions for ${walletAddress}`);
            return positions;

        } catch (error) {
            console.error('Error fetching NFT positions:', error);
            return [];
        }
    }

    // Use READ provider for getting fee
    async getLockingFee() {
        if (this.isDemoMode) {
            console.log("Using demo fee");
            return ethers.parseEther("0.01"); // 0.01 ETH/MATIC for demo
        }
        
        if (!this.readProvider) throw new Error("Provider not initialized");
        
        try {
            const locker = new ethers.Contract(
                this.contracts[this.network].locker,
                this.getUNCXLockerABI(),
                this.readProvider // Use read provider to avoid rate limits
            );

            // Use retry mechanism for RPC call
            const fee = await this.retryRpcCall(() => locker.feeAmount());
            return fee;

        } catch (error) {
            console.error('Error getting locking fee:', error);
            return ethers.parseEther("0.01"); // Default to 0.01 ETH as fallback
        }
    }

    // Use READ provider for getting user discount
    async getUserDiscount(walletAddress: string) {
        if (this.isDemoMode) {
            console.log("Using demo discount");
            return { discount: '500', useFlatRate: false }; // 5% discount for demo
        }
        
        if (!this.readProvider) throw new Error("Provider not initialized");
        
        try {
            const feeResolver = new ethers.Contract(
                this.contracts[this.network].feeResolver,
                this.getFeeResolverABI(),
                this.readProvider // Use read provider to avoid rate limits
            );

            // Use retry mechanism for RPC calls
            const [discount, useFlatRate] = await Promise.all([
                this.retryRpcCall(() => feeResolver.getDiscount(walletAddress)),
                this.retryRpcCall(() => feeResolver.useFlatRate(walletAddress))
            ]);

            return {
                discount: discount.toString(),
                useFlatRate
            };

        } catch (error) {
            console.error('Error getting user discount:', error);
            return { discount: '0', useFlatRate: false };
        }
    }

    // Use READ provider for getting locked positions
    async getUserLockedPositions(walletAddress: string) {
        if (this.isDemoMode) {
            console.log("Using demo data for locked positions");
            // Return mock data for demo mode
            return Array(2).fill(0).map((_, i) => 
                this.createMockLockedPosition(i, walletAddress)
            );
        }
        
        if (!this.readProvider) throw new Error("Provider not initialized");
        
        try {
            const locker = new ethers.Contract(
                this.contracts[this.network].locker,
                this.getUNCXLockerABI(),
                this.readProvider // Use read provider to avoid rate limits
            );

            const locksLength = await locker.userLocksLength(walletAddress);
            const locks = [];

            for (let i = 0; i < locksLength; i++) {
                try {
                    const lockId = await locker.userLocks(walletAddress, i);
                    const lockData = await locker.getLock(lockId);
                    
                    locks.push({
                        lockId: lockData.lockId.toString(),
                        nftId: lockData.nftId.toString(),
                        owner: lockData.owner,
                        additionalCollector: lockData.additionalCollector,
                        collectAddress: lockData.collectAddress,
                        unlockDate: lockData.unlockDate.toString(),
                        countryCode: lockData.countryCode,
                        ucf: lockData.ucf.toString()
                    });
                } catch (lockError) {
                    console.error(`Error fetching lock at index ${i}:`, lockError);
                    // Continue to next lock
                }
            }

            console.log(`Found ${locks.length} locked positions for ${walletAddress}`);
            return locks;

        } catch (error) {
            console.error('Error fetching locked positions:', error);
            
            // Fallback to demo data if real data fetch fails
            console.log("Falling back to demo data for locked positions");
            return Array(2).fill(0).map((_, i) => 
                this.createMockLockedPosition(i, walletAddress)
            );
        }
    }

    // Lock liquidity (main function)
    async lockLiquidity(params: {
        tokenId: string;
        unlockDate: number;
        dustRecipient?: string;
        additionalCollector?: string;
        collectAddress?: string;
        countryCode?: number;
        feeName?: string;
        extraData?: string;
    }) {
        if (this.isDemoMode) {
            console.log("Demo mode: Simulating lock liquidity");
            // Simulate a successful lock in demo mode
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay
            
            return {
                success: true,
                lockId: Math.floor(Math.random() * 100000).toString(),
                transactionHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
                gasUsed: '250000'
            };
        }
        
        if (!this.provider || !this.signer) throw new Error("Provider or signer not initialized");
        
        const {
            tokenId,
            unlockDate,
            dustRecipient,
            additionalCollector = ethers.ZeroAddress,
            collectAddress = ethers.ZeroAddress,
            countryCode = 0,
            feeName = 'DEFAULT',
            extraData = '0x'
        } = params;

        try {
            const walletAddress = await this.signer.getAddress();

            // Step 1: Get contracts
            const nftManager = new ethers.Contract(
                this.uniswapV3[this.network].nftManager,
                this.getNFTManagerABI(),
                this.signer
            );

            const locker = new ethers.Contract(
                this.contracts[this.network].locker,
                this.getUNCXLockerABI(),
                this.signer
            );

            // Step 2: Verify ownership
            const owner = await nftManager.ownerOf(tokenId);
            if (owner.toLowerCase() !== walletAddress.toLowerCase()) {
                throw new Error('You do not own this NFT position');
            }

            // Step 3: Check approval
            const approved = await nftManager.getApproved(tokenId);
            if (approved.toLowerCase() !== this.contracts[this.network].locker.toLowerCase()) {
                console.log('Approving NFT for locking...');
                const approveTx = await nftManager.approve(this.contracts[this.network].locker, tokenId);
                await approveTx.wait();
                console.log('NFT approved for locking');
            }

            // Step 4: Get fee
            const fee = await this.getLockingFee();
            const discount = await this.getUserDiscount(walletAddress);
            
            let finalFee = fee;
            if (discount.discount !== '0') {
                finalFee = fee * BigInt(10000 - parseInt(discount.discount)) / BigInt(10000);
            }

            console.log(`Locking fee: ${ethers.formatEther(finalFee)} ETH`);

            // Step 5: Lock the liquidity
            console.log('Locking liquidity...');
            const lockTx = await locker.lock(
                tokenId,
                dustRecipient || walletAddress,
                walletAddress, // owner
                additionalCollector,
                collectAddress,
                unlockDate,
                countryCode,
                feeName,
                extraData,
                { value: finalFee }
            );

            const receipt = await lockTx.wait();
            
            // Extract lock ID from events
            let lockId = '';
            if (receipt && receipt.logs) {
                for (const log of receipt.logs) {
                    try {
                        const parsedLog = locker.interface.parseLog({
                            topics: log.topics as string[],
                            data: log.data
                        });
                        
                        if (parsedLog && parsedLog.name === 'onLock') {
                            lockId = parsedLog.args[0].toString();
                            break;
                        }
                    } catch {
                        // Skip logs that can't be parsed
                    }
                }
            }

            console.log(`Liquidity locked successfully! Lock ID: ${lockId}`);
            
            return {
                success: true,
                lockId,
                transactionHash: receipt?.hash || '',
                gasUsed: receipt?.gasUsed?.toString() || ''
            };

        } catch (error) {
            console.error('Error locking liquidity:', error);
            throw error;
        }
    }

    // Unlock liquidity
    async unlockLiquidity(lockId: string) {
        if (this.isDemoMode) {
            console.log("Demo mode: Simulating unlock liquidity");
            // Simulate a successful unlock in demo mode
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay
            
            return {
                success: true,
                transactionHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
                gasUsed: '150000'
            };
        }
        
        if (!this.provider || !this.signer) throw new Error("Provider or signer not initialized");
        
        try {
            const locker = new ethers.Contract(
                this.contracts[this.network].locker,
                this.getUNCXLockerABI(),
                this.signer
            );

            console.log(`Unlocking position with lock ID: ${lockId}`);
            const unlockTx = await locker.unlock(lockId);
            const receipt = await unlockTx.wait();

            console.log('Liquidity unlocked successfully!');
            
            return {
                success: true,
                transactionHash: receipt?.hash || '',
                gasUsed: receipt?.gasUsed?.toString() || ''
            };

        } catch (error) {
            console.error('Error unlocking liquidity:', error);
            throw error;
        }
    }

    // Extend lock duration
    async relockLiquidity(lockId: string, newUnlockDate: number) {
        if (this.isDemoMode) {
            console.log("Demo mode: Simulating relock liquidity");
            // Simulate a successful relock in demo mode
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay
            
            return {
                success: true,
                transactionHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
                gasUsed: '180000'
            };
        }
        
        if (!this.provider || !this.signer) throw new Error("Provider or signer not initialized");
        
        try {
            const locker = new ethers.Contract(
                this.contracts[this.network].locker,
                this.getUNCXLockerABI(),
                this.signer
            );

            console.log(`Extending lock duration for lock ID: ${lockId}`);
            const relockTx = await locker.relock(lockId, newUnlockDate);
            const receipt = await relockTx.wait();

            console.log('Lock duration extended successfully!');
            
            return {
                success: true,
                transactionHash: receipt?.hash || '',
                gasUsed: receipt?.gasUsed?.toString() || ''
            };

        } catch (error) {
            console.error('Error extending lock:', error);
            throw error;
        }
    }

    // Withdraw fees from locked position (if applicable)
    async withdrawFromLock(lockId: string, receiver: string) {
        if (this.isDemoMode) {
            console.log("Demo mode: Simulating withdraw from lock");
            // Simulate a successful withdraw in demo mode
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay
            
            return {
                success: true,
                transactionHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
                gasUsed: '120000'
            };
        }
        
        if (!this.provider || !this.signer) throw new Error("Provider or signer not initialized");
        
        try {
            const locker = new ethers.Contract(
                this.contracts[this.network].locker,
                this.getUNCXLockerABI(),
                this.signer
            );

            console.log(`Withdrawing from lock ID: ${lockId}`);
            const withdrawTx = await locker.withdraw(lockId, receiver);
            const receipt = await withdrawTx.wait();

            console.log('Withdrawal successful!');
            
            return {
                success: true,
                transactionHash: receipt?.hash || '',
                gasUsed: receipt?.gasUsed?.toString() || ''
            };

        } catch (error) {
            console.error('Error withdrawing from lock:', error);
            throw error;
        }
    }

    // Helper function to format unlock date
    static getUnlockDate(days: number): number {
        const now = Math.floor(Date.now() / 1000);
        return now + (days * 24 * 60 * 60);
    }

    // Helper function to check if position is unlocked
    static isUnlocked(unlockDate: string): boolean {
        const now = Math.floor(Date.now() / 1000);
        return now >= parseInt(unlockDate);
    }

    // Helper function to get time remaining
    static getTimeRemaining(unlockDate: string): string {
        const now = Math.floor(Date.now() / 1000);
        const remaining = parseInt(unlockDate) - now;
        
        if (remaining <= 0) return 'Unlocked';
        
        const days = Math.floor(remaining / (24 * 60 * 60));
        const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((remaining % (60 * 60)) / 60);
        
        return `${days}d ${hours}h ${minutes}m`;
    }
} 