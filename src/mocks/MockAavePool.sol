// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IAaveLendingPool} from "../interfaces/IAaveLendingPool.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockAavePool
 * @dev Mock implementation of Aave V3 Pool for testing
 */
contract MockAavePool is IAaveLendingPool {
    ERC20 public immutable ASSET;
    
    // Mock state variables
    uint256 private _currentLiquidityRate;
    uint256 private _totalLiquidity;
    mapping(address => uint256) private _balances;
    
    event Supply(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint16 indexed referralCode);
    event Withdraw(address indexed reserve, address user, address indexed to, uint256 amount);

    constructor(address _asset) {
        ASSET = ERC20(_asset);
        _currentLiquidityRate = 5 * 1e25; // 5% APY in Ray format
        _totalLiquidity = 1000e18; // Initial liquidity
    }
    
    function supply(address _asset, uint256 amount, address onBehalfOf, uint16 referralCode) external override {
        require(_asset == address(ASSET), "MockAavePool: Invalid asset");
        // The vault is the msg.sender here, so it transfers from itself to the pool
        bool success = ASSET.transferFrom(onBehalfOf, address(this), amount);
        require(success, "MockAavePool: transferFrom failed");
        _balances[onBehalfOf] += amount;
        _totalLiquidity += amount;
        
        emit Supply(_asset, onBehalfOf, onBehalfOf, amount, referralCode);
    }
    
    function withdraw(address _asset, uint256 amount, address to) external override returns (uint256) {
        require(_asset == address(ASSET), "MockAavePool: Invalid asset");
        // In a real scenario, the caller (vault) would have the balance.
        // require(_balances[msg.sender] >= amount, "MockAavePool: Insufficient balance");
        
        _balances[msg.sender] -= amount;
        _totalLiquidity -= amount;
        bool success = ASSET.transfer(to, amount);
        require(success, "MockAavePool: Transfer failed");
        
        emit Withdraw(_asset, msg.sender, to, amount);
        return amount;
    }
    
    function getReserveData(address _asset) external view override returns (ReserveData memory) {
        require(_asset == address(ASSET), "MockAavePool: Invalid asset");
        return ReserveData({
            currentLiquidityRate: _currentLiquidityRate,
            currentStableBorrowRate: 0,
            currentVariableBorrowRate: 0,
            liquidityIndex: 1e27,
            variableBorrowIndex: 1e27,
            lastUpdateTimestamp: block.timestamp,
            aTokenAddress: address(this),
            stableDebtTokenAddress: address(0),
            variableDebtTokenAddress: address(0),
            interestRateStrategyAddress: address(0),
            id: 0
        });
    }
    
    function getReserveNormalizedIncome(address _asset) external view override returns (uint256) {
        require(_asset == address(ASSET), "MockAavePool: Invalid asset");
        return 1e27; // 1 Ray = no income accrued
    }
    
    // Mock functions for testing
    function setLiquidityRate(uint256 newRate) external {
        _currentLiquidityRate = newRate;
    }
    
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
}
