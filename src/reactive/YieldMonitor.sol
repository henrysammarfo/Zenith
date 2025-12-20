// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IReactive} from "../interfaces/IReactive.sol";
import {IAaveLendingPool} from "../interfaces/IAaveLendingPool.sol";
import {ICompoundLendingPool} from "../interfaces/ICompoundLendingPool.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title YieldMonitor
 * @dev Reactive contract that monitors lending pool yield rates and triggers rebalancing
 */
contract YieldMonitor is IReactive, Ownable {
    // Constants
    uint256 private constant SEPOLIA_CHAIN_ID = 11155111;
    uint256 private constant CALLBACK_GAS_LIMIT = 200000;
    uint256 private constant REBALANCE_THRESHOLD = 50; // 0.5% in basis points
    uint256 private constant BLOCKS_PER_YEAR_COMPOUND = 2102400;
    uint256 private constant SECONDS_PER_YEAR = 31536000;
    uint256 private constant RAY = 1e27;
    
    // State variables
    address public vaultAddress;
    IAaveLendingPool public poolA; // Aave Pool
    ICompoundLendingPool public poolB; // Compound Pool
    address public asset;
    bool public isPaused;
    
    // Yield tracking
    uint256 public lastPoolAApy;
    uint256 public lastPoolBApy;
    uint256 public lastUpdateBlock;
    uint256 public totalAllocated;
    
    // Events
    event YieldRateUpdated(uint256 poolAApy, uint256 poolBApy, uint256 difference);
    event RebalanceTriggered(address indexed fromPool, address indexed toPool, uint256 amount);
    event MonitorPaused();
    event MonitorResumed();
    
    constructor(
        address _poolA,
        address _poolB,
        address _asset,
        address _vault
    ) Ownable(msg.sender) {
        poolA = IAaveLendingPool(_poolA);
        poolB = ICompoundLendingPool(_poolB);
        asset = _asset;
        vaultAddress = _vault;
        isPaused = false;
        lastUpdateBlock = block.number;
    }
    
    /**
     * @notice Main reactive function that processes incoming events
     */
    function react(LogRecord calldata log) external override {
        require(!isPaused, "YieldMonitor: Monitoring is paused");
        
        // Check if this is a rate update event from either pool
        if (log._contract == address(poolA) || log._contract == address(poolB)) {
            _checkAndRebalance();
        }
    }
    
    /**
     * @notice Manually trigger yield check and potential rebalance
     */
    function checkYieldRates() external {
        require(!isPaused, "YieldMonitor: Monitoring is paused");
        _checkAndRebalance();
    }
    
    /**
     * @notice Internal function to check yields and trigger rebalancing if needed
     */
    function _checkAndRebalance() internal {
        (uint256 poolAApy, uint256 poolBApy) = _getCurrentYields();
        
        lastPoolAApy = poolAApy;
        lastPoolBApy = poolBApy;
        lastUpdateBlock = block.number;
        
        uint256 yieldDifference = poolAApy > poolBApy ? 
            poolAApy - poolBApy : poolBApy - poolAApy;
        
        emit YieldRateUpdated(poolAApy, poolBApy, yieldDifference);
        
        // Trigger rebalancing if difference exceeds threshold
        if (yieldDifference >= REBALANCE_THRESHOLD) {
            _triggerRebalance(poolAApy, poolBApy);
        }
    }
    
    /**
     * @notice Get current yields from both pools in basis points (10000 = 100%)
     */
    function _getCurrentYields() internal view returns (uint256 poolAApy, uint256 poolBApy) {
        // Aave Pool yield
        IAaveLendingPool.ReserveData memory aaveData = poolA.getReserveData(asset);
        poolAApy = _rayToApy(aaveData.currentLiquidityRate);

        // Compound Pool yield
        uint256 supplyRatePerBlock = poolB.supplyRatePerBlock();
        poolBApy = _blockRateToApy(supplyRatePerBlock);
    }
    
    /**
     * @notice Convert Aave Ray rate to APY in basis points
     */
    function _rayToApy(uint256 rayRate) internal pure returns (uint256) {
        return rayRate / 1e23;
    }

    function _blockRateToApy(uint256 blockRate) internal pure returns (uint256) {
        return (blockRate * BLOCKS_PER_YEAR_COMPOUND * 10000) / 1e18;
    }
    
        
    /**
     * @notice Trigger rebalancing by emitting callback event
     */
    function _triggerRebalance(uint256 poolAApy, uint256 poolBApy) internal {
        address fromPool = poolAApy > poolBApy ? address(poolB) : address(poolA);
        address toPool = poolAApy > poolBApy ? address(poolA) : address(poolB);
        
        // Calculate rebalance amount (10% of current allocation for safety)
        uint256 rebalanceAmount = _calculateRebalanceAmount(fromPool, toPool);
        
        if (rebalanceAmount > 0) {
            bytes memory payload = abi.encodeWithSignature(
                "rebalance(address,address,uint256)",
                fromPool,
                toPool,
                rebalanceAmount
            );
            
            emit Callback(
                SEPOLIA_CHAIN_ID,
                vaultAddress,
                // forge-lint: disable-next-line(unsafe-typecast)
                uint64(CALLBACK_GAS_LIMIT),
                payload
            );
            
            emit RebalanceTriggered(fromPool, toPool, rebalanceAmount);
        }
    }
    
    /**
     * @notice Calculate amount to rebalance between pools
     */
    function _calculateRebalanceAmount(address /* fromPool */, address /* toPool */) internal view returns (uint256) {
        // Rebalance 10% of total allocation
        return totalAllocated / 10;
    }
    
    /**
     * @notice Pause monitoring (emergency function)
     */
    function pause() external {
        isPaused = true;
        emit MonitorPaused();
    }

    function ownerPause(bool paused) external onlyOwner {
        isPaused = paused;
        if (paused) {
            emit MonitorPaused();
        } else {
            emit MonitorResumed();
        }
    }
    
    /**
     * @notice Resume monitoring
     */
    function resume() external {
        isPaused = false;
        emit MonitorResumed();
    }
    
    /**
     * @notice Update vault address
     */
    function setTotalAllocated(uint256 amount) external onlyOwner {
        totalAllocated = amount;
    }

    function updateVaultAddress(address newVault) external onlyOwner {
        vaultAddress = newVault;
    }
    
    /**
     * @notice Get current yield data
     */
    function getCurrentYieldData() external view returns (uint256 poolAApy, uint256 poolBApy, uint256 difference) {
        (poolAApy, poolBApy) = _getCurrentYields();
        difference = poolAApy > poolBApy ? poolAApy - poolBApy : poolBApy - poolAApy;
    }
    
    /**
     * @notice Pay function required by IPayer interface
     */
    function pay(uint256 amount) external override {
        // Implementation for payment functionality
        payable(msg.sender).transfer(amount);
    }
    
    // Receive function for ETH payments
    receive() external payable {}
}
