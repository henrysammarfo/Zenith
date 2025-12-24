// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ICompoundLendingPool} from "../interfaces/ICompoundLendingPool.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockCompoundPool
 * @dev Mock implementation of Compound V2 cToken for testing
 */
contract MockCompoundPool is ICompoundLendingPool, ERC20 {
    ERC20 public immutable ASSET;
    uint256 private _totalSupplyMock; // Renamed to avoid ERC20 conflict
    uint256 private _exchangeRate;
    // No need for _balances mapping as ERC20 handles it
    
    // Mock supply rate per block (scaled by 1e18)
    uint256 private _supplyRatePerBlock;
    uint256 private _borrowRatePerBlock;

    event Mint(address indexed minter, uint256 mintAmount, uint256 mintTokens);
    event Redeem(address indexed redeemer, uint256 redeemAmount, uint256 redeemTokens);

    constructor(address _asset) ERC20("Mock Compound Token", "mCOMP") {
        ASSET = ERC20(_asset);
        _exchangeRate = 1e18; // 1:1 exchange rate initially
        _totalSupplyMock = 0;
        _supplyRatePerBlock = 23782343988; // Exactly 500 basis points (5% APY)
        _borrowRatePerBlock = 45472326; // ~6% APY
    }
    
    function mint(uint256 mintAmount) external override returns (uint256) {
        bool success = ASSET.transferFrom(msg.sender, address(this), mintAmount);
        require(success, "MockCompoundPool: transferFrom failed");
        uint256 cTokenAmount = (mintAmount * 1e18) / _exchangeRate;
        _mint(msg.sender, cTokenAmount);
        _totalSupplyMock += cTokenAmount;
        emit Mint(msg.sender, mintAmount, cTokenAmount);
        return 0; // Success
    }
    
    function redeem(uint256 redeemTokens) external override returns (uint256) {
        uint256 underlyingAmount = (redeemTokens * _exchangeRate) / 1e18;
        _burn(msg.sender, redeemTokens);
        _totalSupplyMock -= redeemTokens;
        bool success = ASSET.transfer(msg.sender, underlyingAmount);
        require(success, "MockCompoundPool: Transfer failed");
        emit Redeem(msg.sender, underlyingAmount, redeemTokens);
        return 0; // Success
    }
    
    function redeemUnderlying(uint256 redeemAmount) external override returns (uint256) {
        uint256 cTokenAmount = (redeemAmount * 1e18) / _exchangeRate;
        require(balanceOf(msg.sender) >= cTokenAmount, "MockCompoundPool: Insufficient balance");
        _burn(msg.sender, cTokenAmount);
        _totalSupplyMock -= cTokenAmount;
        bool success = ASSET.transfer(msg.sender, redeemAmount);
        require(success, "MockCompoundPool: Transfer failed");
        emit Redeem(msg.sender, redeemAmount, cTokenAmount);
        return 0; // Success
    }
    
    function supplyRatePerBlock() external view override returns (uint256) {
        return _supplyRatePerBlock;
    }
    
    function borrowRatePerBlock() external view returns (uint256) {
        return _borrowRatePerBlock;
    }
    
    function exchangeRateCurrent() external view override returns (uint256) {
        return _exchangeRate;
    }
    
    function balanceOf(address account) public view override(ICompoundLendingPool, ERC20) returns (uint256) {
        return super.balanceOf(account);
    }

    
    // Mock functions for testing
    function setSupplyRatePerBlock(uint256 newRate) external {
        _supplyRatePerBlock = newRate;
    }
    
    function setExchangeRate(uint256 newRate) external {
        _exchangeRate = newRate;
    }
}
