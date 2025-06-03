// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20FlashMint.sol";

contract FallbackToken is ERC20, Ownable, ERC20Burnable, ERC20FlashMint {
    
    
    constructor() ERC20("FallbackToken", "FBT")  {
        
        _transferOwnership(msg.sender);
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
    
    
    /**
     * @dev Burns tokens from the caller's account with a reason.
     * @param amount The amount of tokens to burn
     * @param reason The reason for burning tokens
     */
    function burnWithReason(uint256 amount, string memory reason) public {
        burn(amount);
        emit TokensBurned(msg.sender, amount, reason);
    }
    
    // Event emitted when tokens are burned with a reason
    event TokensBurned(address indexed burner, uint256 amount, string reason);
    /**
     * @dev Returns the maximum flash loan amount for a token.
     */
    function maxFlashLoan(address token) public view override returns (uint256) {
        return token == address(this) ? type(uint256).max - totalSupply() : 0;
    }
    
    /**
     * @dev Returns the flash loan fee for a token.
     */
    function flashFee(address token, uint256 amount) public view override returns (uint256) {
        require(token == address(this), "ERC20FlashMint: wrong token");
        return amount * 3 / 1000; // 0.3% fee
    }
}