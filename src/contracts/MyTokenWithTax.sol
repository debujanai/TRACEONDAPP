// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract MyTokenWithTax is IERC20 {
    // TOKEN DETAILS - CUSTOMIZE THESE
    string public name = "MyAwesomeToken";
    string public symbol = "MAT";
    uint8 public decimals = 18;
    uint256 private _totalSupply = 1000000 * 10**decimals; // 1 Million tokens
    
    // DIRECT BUY/SELL PRICING
    uint256 public buyPrice = 0.001 ether;  // Price to buy 1 token directly
    uint256 public sellPrice = 0.0008 ether; // Price to sell 1 token directly
    
    // TAX STRUCTURE - CUSTOMIZE THESE (in basis points, 100 = 1%)
    struct TaxRates {
        uint256 marketing;      // Marketing tax
        uint256 development;    // Development tax  
        uint256 charity;        // Charity tax
        uint256 buyback;        // Buyback tax
        uint256 team;           // Team tax
        uint256 liquidity;      // Auto-liquidity tax
    }
    
    TaxRates public buyTax = TaxRates({
        marketing: 200,     // 2%
        development: 100,   // 1%
        charity: 50,        // 0.5%
        buyback: 100,       // 1%
        team: 100,          // 1%
        liquidity: 50       // 0.5%
    });
    
    TaxRates public sellTax = TaxRates({
        marketing: 300,     // 3%
        development: 200,   // 2%
        charity: 100,       // 1%
        buyback: 200,       // 2%
        team: 150,          // 1.5%
        liquidity: 100      // 1%
    });
    
    // TAX WALLETS - CUSTOMIZE THESE ADDRESSES
    address public marketingWallet;
    address public developmentWallet;
    address public charityWallet;
    address public buybackWallet;
    address public teamWallet;
    address public liquidityWallet;
    
    // CONTRACT STATE
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    mapping(address => bool) public isExcludedFromFees;
    mapping(address => bool) public automatedMarketMakerPairs;
    
    address public owner;
    address public uniswapV2Pair;
    
    bool public tradingEnabled = false;
    bool public buyEnabled = true;
    bool public sellEnabled = true;
    bool public swapEnabled = true;
    bool private swapping;
    
    uint256 public swapTokensAtAmount = 1000 * 10**decimals; // Auto-swap threshold
    uint256 public maxTransactionAmount = 10000 * 10**decimals; // Max transaction limit
    uint256 public maxWalletAmount = 20000 * 10**decimals; // Max wallet limit
    
    // ACCUMULATED TAX TRACKING
    uint256 public accumulatedMarketing;
    uint256 public accumulatedDevelopment;
    uint256 public accumulatedCharity;
    uint256 public accumulatedBuyback;
    uint256 public accumulatedTeam;
    uint256 public accumulatedLiquidity;
    
    // EVENTS
    event TokensPurchased(address indexed buyer, uint256 tokenAmount, uint256 ethAmount);
    event TokensSold(address indexed seller, uint256 tokenAmount, uint256 ethAmount);
    event TaxCollected(string taxType, uint256 amount);
    event TaxDistributed(string taxType, address wallet, uint256 amount);
    event SwapAndLiquify(uint256 tokensSwapped, uint256 ethReceived);
    event BuybackExecuted(uint256 ethAmount, uint256 tokensReceived);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    modifier lockTheSwap {
        swapping = true;
        _;
        swapping = false;
    }
    
    constructor() {
        // Emit ownership transfer from zero address to deployer
        emit OwnershipTransferred(address(0), msg.sender);
        
        owner = msg.sender;
        
        // Initialize tax wallets (you can change these later)
        marketingWallet = msg.sender;
        developmentWallet = msg.sender;
        charityWallet = msg.sender;
        buybackWallet = msg.sender;
        teamWallet = msg.sender;
        liquidityWallet = msg.sender;
        
        // Exclude owner and contract from fees
        isExcludedFromFees[owner] = true;
        isExcludedFromFees[address(this)] = true;
        isExcludedFromFees[marketingWallet] = true;
        
        // Mint total supply to owner
        _balances[owner] = _totalSupply;
        emit Transfer(address(0), owner, _totalSupply);
    }
    
    // STANDARD ERC20 FUNCTIONS
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }
    
    function allowance(address tokenOwner, address spender) public view override returns (uint256) {
        return _allowances[tokenOwner][spender];
    }
    
    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        uint256 currentAllowance = _allowances[sender][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        
        _transfer(sender, recipient, amount);
        _approve(sender, msg.sender, currentAllowance - amount);
        
        return true;
    }
    
    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        require(_balances[sender] >= amount, "ERC20: transfer amount exceeds balance");
        
        if (!tradingEnabled) {
            require(isExcludedFromFees[sender] || isExcludedFromFees[recipient], "Trading not enabled");
        }
        
        // Check transaction limits
        if (!isExcludedFromFees[sender] && !isExcludedFromFees[recipient]) {
            require(amount <= maxTransactionAmount, "Transfer amount exceeds max transaction");
            
            // Only check max wallet if recipient is not a DEX pair
            if (uniswapV2Pair != address(0) && recipient != uniswapV2Pair) {
                require(_balances[recipient] + amount <= maxWalletAmount, "Wallet would exceed max balance");
            }
        }
        
        bool takeFee = !swapping && !isExcludedFromFees[sender] && !isExcludedFromFees[recipient];
        
        if (takeFee) {
            uint256 totalTax = 0;
            TaxRates memory currentTax;
            
            // Determine tax type
            if (automatedMarketMakerPairs[sender]) {
                // Buy transaction
                currentTax = buyTax;
            } else if (automatedMarketMakerPairs[recipient]) {
                // Sell transaction
                currentTax = sellTax;
            } else {
                // Regular transfer - no tax
                _balances[sender] -= amount;
                _balances[recipient] += amount;
                emit Transfer(sender, recipient, amount);
                return;
            }
            
            // Calculate individual taxes
            uint256 marketingTax = (amount * currentTax.marketing) / 10000;
            uint256 developmentTax = (amount * currentTax.development) / 10000;
            uint256 charityTax = (amount * currentTax.charity) / 10000;
            uint256 buybackTax = (amount * currentTax.buyback) / 10000;
            uint256 teamTax = (amount * currentTax.team) / 10000;
            uint256 liquidityTax = (amount * currentTax.liquidity) / 10000;
            
            totalTax = marketingTax + developmentTax + charityTax + buybackTax + teamTax + liquidityTax;
            
            // Accumulate taxes
            accumulatedMarketing += marketingTax;
            accumulatedDevelopment += developmentTax;
            accumulatedCharity += charityTax;
            accumulatedBuyback += buybackTax;
            accumulatedTeam += teamTax;
            accumulatedLiquidity += liquidityTax;
            
            // Transfer tax to contract
            _balances[sender] -= totalTax;
            _balances[address(this)] += totalTax;
            emit Transfer(sender, address(this), totalTax);
            
            amount -= totalTax;
        }
        
        // Auto-swap accumulated taxes
        if (swapEnabled && !swapping && !automatedMarketMakerPairs[sender] && 
            _balances[address(this)] >= swapTokensAtAmount) {
            swapAndDistributeTaxes();
        }
        
        // Execute transfer
        _balances[sender] -= amount;
        _balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }
    
    function _approve(address tokenOwner, address spender, uint256 amount) internal {
        require(tokenOwner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        
        _allowances[tokenOwner][spender] = amount;
        emit Approval(tokenOwner, spender, amount);
    }
    
    // DIRECT BUY/SELL FUNCTIONS
    function buyTokens() public payable {
        require(buyEnabled, "Direct buying is disabled");
        require(msg.value > 0, "Send ETH to buy tokens");
        
        uint256 tokenAmount = (msg.value * 10**decimals) / buyPrice;
        require(_balances[address(this)] >= tokenAmount, "Not enough tokens in contract");
        
        _balances[address(this)] -= tokenAmount;
        _balances[msg.sender] += tokenAmount;
        
        emit Transfer(address(this), msg.sender, tokenAmount);
        emit TokensPurchased(msg.sender, tokenAmount, msg.value);
    }
    
    function sellTokens(uint256 tokenAmount) public {
        require(sellEnabled, "Direct selling is disabled");
        require(tokenAmount > 0, "Token amount must be greater than 0");
        require(_balances[msg.sender] >= tokenAmount, "Insufficient token balance");
        
        uint256 ethAmount = (tokenAmount * sellPrice) / 10**decimals;
        require(address(this).balance >= ethAmount, "Not enough ETH in contract");
        
        _balances[msg.sender] -= tokenAmount;
        _balances[address(this)] += tokenAmount;
        
        payable(msg.sender).transfer(ethAmount);
        
        emit Transfer(msg.sender, address(this), tokenAmount);
        emit TokensSold(msg.sender, tokenAmount, ethAmount);
    }
    
    // TAX DISTRIBUTION SYSTEM
    function swapAndDistributeTaxes() internal lockTheSwap {
        uint256 totalAccumulated = accumulatedMarketing + accumulatedDevelopment + 
                                 accumulatedCharity + accumulatedBuyback + 
                                 accumulatedTeam + accumulatedLiquidity;
        
        if (totalAccumulated == 0) return;
        
        uint256 contractBalance = _balances[address(this)];
        uint256 toSwap = totalAccumulated > contractBalance ? contractBalance : totalAccumulated;
        
        // Distribute tokens directly to wallets (without swapping)
        uint256 marketingTokens = (accumulatedMarketing * toSwap) / totalAccumulated;
        uint256 developmentTokens = (accumulatedDevelopment * toSwap) / totalAccumulated;
        uint256 charityTokens = (accumulatedCharity * toSwap) / totalAccumulated;
        uint256 buybackTokens = (accumulatedBuyback * toSwap) / totalAccumulated;
        uint256 teamTokens = (accumulatedTeam * toSwap) / totalAccumulated;
        uint256 liquidityTokens = (accumulatedLiquidity * toSwap) / totalAccumulated;
        
        // Send tokens to wallets
        if (marketingTokens > 0) {
            _balances[marketingWallet] += marketingTokens;
            _balances[address(this)] -= marketingTokens;
            emit Transfer(address(this), marketingWallet, marketingTokens);
            emit TaxDistributed("Marketing", marketingWallet, marketingTokens);
        }
        
        if (developmentTokens > 0) {
            _balances[developmentWallet] += developmentTokens;
            _balances[address(this)] -= developmentTokens;
            emit Transfer(address(this), developmentWallet, developmentTokens);
            emit TaxDistributed("Development", developmentWallet, developmentTokens);
        }
        
        if (charityTokens > 0) {
            _balances[charityWallet] += charityTokens;
            _balances[address(this)] -= charityTokens;
            emit Transfer(address(this), charityWallet, charityTokens);
            emit TaxDistributed("Charity", charityWallet, charityTokens);
        }
        
        if (buybackTokens > 0) {
            // Send to dead address (burn)
            _balances[address(this)] -= buybackTokens;
            _balances[address(0xdead)] += buybackTokens;
            emit Transfer(address(this), address(0xdead), buybackTokens);
            emit BuybackExecuted(0, buybackTokens);
        }
        
        if (teamTokens > 0) {
            _balances[teamWallet] += teamTokens;
            _balances[address(this)] -= teamTokens;
            emit Transfer(address(this), teamWallet, teamTokens);
            emit TaxDistributed("Team", teamWallet, teamTokens);
        }
        
        if (liquidityTokens > 0) {
            _balances[liquidityWallet] += liquidityTokens;
            _balances[address(this)] -= liquidityTokens;
            emit Transfer(address(this), liquidityWallet, liquidityTokens);
            emit TaxDistributed("Liquidity", liquidityWallet, liquidityTokens);
        }
        
        // Reset accumulated amounts
        accumulatedMarketing = 0;
        accumulatedDevelopment = 0;
        accumulatedCharity = 0;
        accumulatedBuyback = 0;
        accumulatedTeam = 0;
        accumulatedLiquidity = 0;
    }
    
    // Function to manually set a DEX pair for tax calculations
    function setAutomatedMarketMakerPair(address pair, bool value) public onlyOwner {
        require(pair != address(0), "Cannot use zero address");
        automatedMarketMakerPairs[pair] = value;
        
        // If adding a new pair, store the most recently added one
        if (value) {
            uniswapV2Pair = pair;
        }
    }
    
    // OWNER MANAGEMENT FUNCTIONS
    function setTaxWallets(
        address _marketing,
        address _development,
        address _charity,
        address _buyback,
        address _team,
        address _liquidity
    ) external onlyOwner {
        marketingWallet = _marketing;
        developmentWallet = _development;
        charityWallet = _charity;
        buybackWallet = _buyback;
        teamWallet = _team;
        liquidityWallet = _liquidity;
    }
    
    function setBuyTaxes(
        uint256 _marketing,
        uint256 _development,
        uint256 _charity,
        uint256 _buyback,
        uint256 _team,
        uint256 _liquidity
    ) external onlyOwner {
        uint256 totalTax = _marketing + _development + _charity + _buyback + _team + _liquidity;
        require(totalTax <= 2500, "Total buy tax cannot exceed 25%");
        
        buyTax = TaxRates(_marketing, _development, _charity, _buyback, _team, _liquidity);
    }
    
    function setSellTaxes(
        uint256 _marketing,
        uint256 _development,
        uint256 _charity,
        uint256 _buyback,
        uint256 _team,
        uint256 _liquidity
    ) external onlyOwner {
        uint256 totalTax = _marketing + _development + _charity + _buyback + _team + _liquidity;
        require(totalTax <= 2500, "Total sell tax cannot exceed 25%");
        
        sellTax = TaxRates(_marketing, _development, _charity, _buyback, _team, _liquidity);
    }
    
    function setDirectPrices(uint256 _buyPrice, uint256 _sellPrice) external onlyOwner {
        buyPrice = _buyPrice;
        sellPrice = _sellPrice;
    }
    
    function enableTrading() external onlyOwner {
        tradingEnabled = true;
    }
    
    function renounceOwnership() external onlyOwner {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    function setExcludeFromFees(address account, bool excluded) external onlyOwner {
        isExcludedFromFees[account] = excluded;
    }
    
    function setSwapEnabled(bool enabled) external onlyOwner {
        swapEnabled = enabled;
    }
    
    function setSwapTokensAtAmount(uint256 amount) external onlyOwner {
        swapTokensAtAmount = amount;
    }
    
    function setMaxTransactionAmount(uint256 amount) external onlyOwner {
        maxTransactionAmount = amount;
    }
    
    function setMaxWalletAmount(uint256 amount) external onlyOwner {
        maxWalletAmount = amount;
    }
    
    // MANUAL TAX DISTRIBUTION
    function manualSwapAndDistribute() external onlyOwner {
        swapAndDistributeTaxes();
    }
    
    // EMERGENCY FUNCTIONS
    function withdrawStuckETH() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    function withdrawStuckTokens(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20(tokenAddress).transfer(owner, amount);
    }
    
    function addLiquidityETH() external payable onlyOwner {
        // Add ETH for direct buy/sell functionality
    }
    
    // VIEW FUNCTIONS
    function getTotalBuyTax() public view returns (uint256) {
        return buyTax.marketing + buyTax.development + buyTax.charity + 
               buyTax.buyback + buyTax.team + buyTax.liquidity;
    }
    
    function getTotalSellTax() public view returns (uint256) {
        return sellTax.marketing + sellTax.development + sellTax.charity + 
               sellTax.buyback + sellTax.team + sellTax.liquidity;
    }
    
    function getAccumulatedTaxes() public view returns (
        uint256 marketing,
        uint256 development,
        uint256 charity,
        uint256 buyback,
        uint256 team,
        uint256 liquidity
    ) {
        return (
            accumulatedMarketing,
            accumulatedDevelopment,
            accumulatedCharity,
            accumulatedBuyback,
            accumulatedTeam,
            accumulatedLiquidity
        );
    }
    
    receive() external payable {
        if (msg.value > 0 && buyEnabled) {
            buyTokens();
        }
    }
} 