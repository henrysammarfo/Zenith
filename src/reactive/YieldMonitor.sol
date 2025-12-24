// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AbstractReactive} from "reactive-lib/abstract-base/AbstractReactive.sol";
import {IReactive} from "reactive-lib/interfaces/IReactive.sol";
import {IAaveLendingPool} from "../interfaces/IAaveLendingPool.sol";
import {ICompoundLendingPool} from "../interfaces/ICompoundLendingPool.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title YieldMonitor
 * @dev Reactive contract that monitors lending pool yield rates and triggers rebalancing
 * @notice Inherits from AbstractReactive for proper Lasna precompile compatibility
 */
contract YieldMonitor is IReactive, AbstractReactive, Ownable {
    // Constants
    uint256 private constant SEPOLIA_CHAIN_ID = 11155111;
    uint256 private constant CALLBACK_GAS_LIMIT = 500000;
    uint256 private constant BLOCKS_PER_YEAR_COMPOUND = 2102400;
    uint256 private constant SECONDS_PER_YEAR = 31536000;
    uint256 private constant RAY = 1e27;
    
    // Topic hashes for specific subscription (Verified via CalculateTopics.s.sol)
    uint256 private constant AAVE_YIELD_TOPIC_0 = 0x804c9b842b2748a22bb64b345453a3de7ca54a6ca45ce00d415894979e22897a;
    uint256 private constant COMPOUND_MINT_TOPIC_0 = 0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f;
    
    // State variables
    address public vaultAddress;
    IAaveLendingPool public poolA; // Aave Pool
    ICompoundLendingPool public poolB; // Compound Pool
    address public asset;
    bool public isPaused;
    uint256 public rebalanceThreshold; // APY difference in basis points
    
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
    event ThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event TokensRescued(address token, uint256 amount);
    
    constructor(
        address _poolA,
        address _poolB,
        address _asset,
        address _vault
    ) payable Ownable(msg.sender) {
        poolA = IAaveLendingPool(_poolA);
        poolB = ICompoundLendingPool(_poolB);
        asset = _asset;
        vaultAddress = _vault;
        isPaused = false;
        rebalanceThreshold = 50; // default 0.5%
        lastUpdateBlock = block.number;
        
        if (!vm) {
            // Subscribe to Pool A YieldRecord events (ReserveDataUpdated)
            service.subscribe(
                SEPOLIA_CHAIN_ID,
                address(poolA),
                AAVE_YIELD_TOPIC_0,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );

            // Subscribe to Pool B Mint events
            service.subscribe(
                SEPOLIA_CHAIN_ID,
                address(poolB),
                COMPOUND_MINT_TOPIC_0,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );
        }
    }
    
    
    
    /**
     * @notice Main reactive function that processes incoming events
     */
    function react(LogRecord calldata log) external override rnOnly {
        if (isPaused) return;
        
        // If we see a relevant event, tell the Vault to check itself.
        if (log.topic_0 == AAVE_YIELD_TOPIC_0 || log.topic_0 == COMPOUND_MINT_TOPIC_0) {
            bytes memory payload = abi.encodeWithSignature("checkYieldsAndRebalance()");
            // forge-lint: disable-next-line(unsafe-typecast)
            emit Callback(SEPOLIA_CHAIN_ID, vaultAddress, uint64(CALLBACK_GAS_LIMIT), payload);
        }
    }

    /**
     * @notice Manually trigger a vault rebalance check (owner only)
     * @dev Used for debugging cross-chain connectivity
     */
    function manualTrigger() external onlyOwner {
        bytes memory payload = abi.encodeWithSignature("checkYieldsAndRebalance()");
        // forge-lint: disable-next-line(unsafe-typecast)
        emit Callback(SEPOLIA_CHAIN_ID, vaultAddress, uint64(CALLBACK_GAS_LIMIT), payload);
    }
    
    /**
     * @notice Check current yields and trigger rebalance if threshold exceeded
     */
    
    // ==================== Admin Functions ====================
    
    /**
     * @notice Pause the monitor
     */
    function pause() external onlyOwner {
        isPaused = true;
        emit MonitorPaused();
    }
    
    /**
     * @notice Resume the monitor
     */
    function resume() external onlyOwner {
        isPaused = false;
        emit MonitorResumed();
    }
    
    /**
     * @notice Update the rebalance threshold
     * @param newThreshold New threshold in basis points
     */
    function setRebalanceThreshold(uint256 newThreshold) external onlyOwner {
        uint256 oldThreshold = rebalanceThreshold;
        rebalanceThreshold = newThreshold;
        emit ThresholdUpdated(oldThreshold, newThreshold);
    }
    
    /**
     * @notice Update the vault address
     * @param newVault New vault address
     */
    function setVaultAddress(address newVault) external onlyOwner {
        require(newVault != address(0), "Invalid vault address");
        vaultAddress = newVault;
    }
    
    /**
     * @notice Update the total allocated amount
     * @param amount New total allocated amount
     */
    function updateTotalAllocated(uint256 amount) external onlyOwner {
        totalAllocated = amount;
    }
    
    /**
     * @notice Emergency rescue of stuck tokens
     * @param token Token address (use address(0) for native token)
     * @param amount Amount to rescue
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            (bool success, ) = token.call(
                abi.encodeWithSignature("transfer(address,uint256)", msg.sender, amount)
            );
            require(success, "Token rescue failed");
        }
        emit TokensRescued(token, amount);
    }
    
    /**
     * @notice Get current pool yields
     */
    
    /**
     * @notice Manually trigger a yield check (for testing)
     */
    /**
     * @notice Manually trigger a yield check (for testing)
     */

    /**
     * @notice Check if the contract thinks it is in a VM
     */
    function getVmStatus() external view returns (bool) {
        return vm;
    }
}
