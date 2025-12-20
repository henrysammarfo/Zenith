// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ICompoundLendingPool} from "../interfaces/ICompoundLendingPool.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockCompoundPool
 * @dev Mock implementation of Compound V2 cToken for testing
 */
contract MockCompoundPool is ICompoundLendingPool {
    ERC20 public immutable ASSET;
    uint256 private _totalSupply;
    uint256 private _exchangeRate;
    mapping(address => uint256) private _balances;
    
    // Compound-specific rates
    uint256 private _supplyRatePerBlock;
    uint256 private _borrowRatePerBlock;
    
    event Mint(address minter, uint256 mintAmount, uint256 mintTokens);
    event Redeem(address redeemer, uint256 redeemAmount, uint256 redeemTokens);

    constructor(address _asset) {
        ASSET = ERC20(_asset);
        _exchangeRate = 1e18; // 1:1 exchange rate initially
        _totalSupply = 0;
        _supplyRatePerBlock = 23782343519; // ~5% APY
        _borrowRatePerBlock = 45472326; // ~6% APY
    }
    
    function mint(uint256 mintAmount) external override returns (uint256) {
        // The vault is the msg.sender here, so it transfers from itself to the pool
        bool success = ASSET.transferFrom(msg.sender, address(this), mintAmount);
        require(success, "MockCompoundPool: transferFrom failed");
        uint256 cTokenAmount = (mintAmount * 1e18) / _exchangeRate;
        _balances[msg.sender] += cTokenAmount;
        _totalSupply += cTokenAmount;
        emit Mint(msg.sender, mintAmount, cTokenAmount);
        return 0; // Success
    }

    function redeem(uint256 redeemTokens) external override returns (uint256) {
        uint256 underlyingAmount = (redeemTokens * _exchangeRate) / 1e18;
        _balances[msg.sender] -= redeemTokens;
        _totalSupply -= redeemTokens;
        bool success = ASSET.transfer(msg.sender, underlyingAmount);
        require(success, "MockCompoundPool: Transfer failed");
        emit Redeem(msg.sender, underlyingAmount, redeemTokens);
        return 0; // Success
    }

    function redeemUnderlying(uint256 redeemAmount) external override returns (uint256) {
        uint256 cTokenAmount = (redeemAmount * 1e18) / _exchangeRate;
        require(_balances[msg.sender] >= cTokenAmount, "MockCompoundPool: Insufficient balance");
        _balances[msg.sender] -= cTokenAmount;
        _totalSupply -= cTokenAmount;
        bool success = ASSET.transfer(msg.sender, redeemAmount);
        require(success, "MockCompoundPool: Transfer failed");
        emit Redeem(msg.sender, redeemAmount, cTokenAmount);
        return 0; // Success
    }
    
    function supplyRatePerBlock() external view override returns (uint256) {
        return _supplyRatePerBlock;
    }
    
    function borrowRatePerBlock() external view override returns (uint256) {
        return _borrowRatePerBlock;
    }
    
    function exchangeRateCurrent() external view override returns (uint256) {
        return _exchangeRate;
    }
    
    function balanceOf(address account) external view override returns (uint256) {
        return (_balances[account] * _exchangeRate) / 1e18;
    }
    
    // Mock functions for testing
    function setSupplyRatePerBlock(uint256 newRate) external {
        _supplyRatePerBlock = newRate;
    }
    
    function setBorrowRatePerBlock(uint256 newRate) external {
        _borrowRatePerBlock = newRate;
    }
    
    function accrueInterest() external {
        // Mock interest accrual - increase exchange rate
        uint256 interestPerBlock = _supplyRatePerBlock;
        _exchangeRate += (interestPerBlock * _exchangeRate) / (1e18);
    }
}
