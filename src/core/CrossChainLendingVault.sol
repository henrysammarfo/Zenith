// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IVault} from "../interfaces/IVault.sol";
import {IAaveLendingPool} from "../interfaces/IAaveLendingPool.sol";
import {ICompoundLendingPool} from "../interfaces/ICompoundLendingPool.sol";

/**
 * @title CrossChainLendingVault
 * @dev Main vault contract that manages user deposits and automated rebalancing, compliant with ERC4626
 */
contract CrossChainLendingVault is ERC4626, IVault, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Constants
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant MIN_DEPOSIT = 1e16; // 0.01 ETH minimum
    uint256 private constant MAX_ALLOCATION = 9000; // 90% max allocation to single pool
    
    IAaveLendingPool public poolA; // Aave Pool
    ICompoundLendingPool public poolB; // Compound Pool
    address public yieldMonitor;
    
    // Pool allocations
    PoolAllocation[] public poolAllocations;
    
    // Configuration
    uint256 public rebalanceThreshold; // In basis points
    uint256 public rebalancePercentage; // Percentage of allocation to rebalance
    bool public autoRebalanceEnabled;
    
    // Events
    event ConfigurationUpdated(string parameter, uint256 oldValue, uint256 newValue);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event YieldMonitorUpdated(address indexed oldMonitor, address indexed newMonitor);
    
    constructor(
        address _asset,
        address _poolA,
        address _poolB,
        address _yieldMonitor,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) ERC4626(IERC20(_asset)) Ownable(msg.sender) {
        poolA = IAaveLendingPool(_poolA);
        poolB = ICompoundLendingPool(_poolB);
        yieldMonitor = _yieldMonitor;
        
        // Initialize with 50/50 allocation
        poolAllocations.push(PoolAllocation({
            poolAddress: _poolA,
            percentage: 5000, // 50%
            isActive: true
        }));
        
        poolAllocations.push(PoolAllocation({
            poolAddress: _poolB,
            percentage: 5000, // 50%
            isActive: true
        }));
        
        rebalanceThreshold = 50; // 0.5%
        rebalancePercentage = 1000; // 10%
        autoRebalanceEnabled = true;
    }
    
    
    
    /**
     * @notice Rebalance funds between pools (called by YieldMonitor)
     */
    function rebalance(address fromPool, address toPool, uint256 amount) external {
        require(msg.sender == yieldMonitor, "Vault: Only yield monitor can rebalance");
        require(amount > 0, "Vault: Amount must be > 0");

        if (fromPool == address(poolA)) {
            poolA.withdraw(asset(), amount, address(this));
        } else {
            poolB.redeemUnderlying(amount);
        }

        if (toPool == address(poolA)) {
            IERC20(asset()).forceApprove(address(poolA), amount);
            poolA.supply(asset(), amount, address(this), 0);
        } else {
            IERC20(asset()).forceApprove(address(poolB), amount);
            poolB.mint(amount);
        }
        
        emit Rebalanced(fromPool, toPool, amount);
    }
    
    /**
     * @notice Get vault balance across all pools
     */
    function totalAssets() public view override returns (uint256) {
        address aTokenAddress = poolA.getReserveData(asset()).aTokenAddress;
        uint256 balanceA = IERC20(aTokenAddress).balanceOf(address(this));

        uint256 cTokenBalanceB = poolB.balanceOf(address(this));
        uint256 exchangeRateB = poolB.exchangeRateCurrent();
        uint256 balanceB = (cTokenBalanceB * exchangeRateB) / 1e18;

        return balanceA + balanceB;
    }
    
    /**
     * @notice Get user shares
     */
    
    /**
     * @notice Get current yield data from pools
     */
    function getYieldData() external view override returns (YieldData memory) {
        (uint256 poolAApy, uint256 poolBApy) = _getCurrentYields();
        uint256 difference = poolAApy > poolBApy ? poolAApy - poolBApy : poolBApy - poolAApy;

        return YieldData({
            poolAApy: poolAApy,
            poolBApy: poolBApy,
            lastUpdate: block.timestamp,
            yieldDifference: difference
        });
    }
    
    /**
     * @notice Get pool allocations
     */
    function getPoolAllocations() external view override returns (PoolAllocation[] memory) {
        return poolAllocations;
    }
    
    /**
     * @notice Update rebalance threshold
     */
    function updateRebalanceThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold <= 500, "Vault: Threshold too high"); // Max 5%
        uint256 oldThreshold = rebalanceThreshold;
        rebalanceThreshold = newThreshold;
        emit ConfigurationUpdated("rebalanceThreshold", oldThreshold, newThreshold);
    }
    
    /**
     * @notice Update rebalance percentage
     */
    function updateRebalancePercentage(uint256 newPercentage) external onlyOwner {
        require(newPercentage <= 5000, "Vault: Percentage too high"); // Max 50%
        uint256 oldPercentage = rebalancePercentage;
        rebalancePercentage = newPercentage;
        emit ConfigurationUpdated("rebalancePercentage", oldPercentage, newPercentage);
    }
    
    /**
     * @notice Toggle auto rebalancing
     */
    function toggleAutoRebalance() external onlyOwner {
        autoRebalanceEnabled = !autoRebalanceEnabled;
        emit ConfigurationUpdated("autoRebalanceEnabled", autoRebalanceEnabled ? 0 : 1, autoRebalanceEnabled ? 1 : 0);
    }
    
    /**
     * @notice Update yield monitor contract
     */
    function updateYieldMonitor(address newMonitor) external onlyOwner {
        address oldMonitor = yieldMonitor;
        yieldMonitor = newMonitor;
        emit YieldMonitorUpdated(oldMonitor, newMonitor);
    }
    
    /**
     * @notice Emergency withdraw function
     */
    function emergencyWithdraw() external nonReentrant {
        uint256 userShares = balanceOf(msg.sender);
        require(userShares > 0, "Vault: No shares to withdraw");

        uint256 userBalance = previewRedeem(userShares);

        _deallocateFromPools(userBalance);

        redeem(userShares, msg.sender, msg.sender);

        emit EmergencyWithdraw(msg.sender, userBalance);
    }
    
    /**
     * @notice Redeem shares for assets
     */
    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) public override returns (uint256 assets) {
        require(receiver != address(0), "ERC4626: redeem from the zero address");
        require(owner != address(0), "ERC4626: redeem from the zero address");

        assets = previewRedeem(shares);

        if (msg.sender != owner) {
            _spendAllowance(owner, msg.sender, shares);
        }

        _beforeWithdraw(assets, shares);

        _burn(owner, shares);

        // Transfer assets to receiver
        IERC20(asset()).safeTransfer(receiver, assets);

        emit Withdraw(msg.sender, receiver, owner, assets, shares);

        return assets;
    }
    
    /**
     * @notice Internal function to allocate funds to pools
     */
    function _afterDeposit(uint256 assets, uint256) internal {
        _allocateToPools(assets);
    }

    function _beforeWithdraw(uint256 assets, uint256) internal {
        _deallocateFromPools(assets);
    }

    function _allocateToPools(uint256 amount) internal {
        for (uint256 i = 0; i < poolAllocations.length; i++) {
            PoolAllocation storage allocation = poolAllocations[i];
            if (allocation.isActive && allocation.percentage > 0) {
                uint256 poolAmount = (amount * allocation.percentage) / BASIS_POINTS;
                if (poolAmount > 0) {
                    if (allocation.poolAddress == address(poolA)) {
                        IERC20(asset()).forceApprove(address(poolA), poolAmount);
                        poolA.supply(asset(), poolAmount, address(this), 0);
                    } else {
                        IERC20(asset()).forceApprove(address(poolB), poolAmount);
                        poolB.mint(poolAmount);
                    }
                }
            }
        }
    }
    
    /**
     * @notice Internal function to deallocate funds from pools
     */
    function _deallocateFromPools(uint256 amount) internal {
        // Simple implementation - withdraw proportionally from all pools
        for (uint256 i = 0; i < poolAllocations.length; i++) {
            PoolAllocation storage allocation = poolAllocations[i];
            if (allocation.isActive && allocation.percentage > 0) {
                uint256 poolAmount = (amount * allocation.percentage) / BASIS_POINTS;
                if (poolAmount > 0) {
                    if (allocation.poolAddress == address(poolA)) {
                        poolA.withdraw(asset(), poolAmount, address(this));
                    } else {
                        poolB.redeemUnderlying(poolAmount);
                    }
                }
            }
        }
    }
    
    /**
     * @notice Internal function to get current yields
     */
    function _getCurrentYields() internal view returns (uint256 poolAApy, uint256 poolBApy) {
        // Aave Pool yield
        IAaveLendingPool.ReserveData memory aaveData = poolA.getReserveData(asset());
        poolAApy = _rayToApy(aaveData.currentLiquidityRate);
        
        // Compound Pool yield
        uint256 supplyRatePerBlock = poolB.supplyRatePerBlock();
        poolBApy = _blockRateToApy(supplyRatePerBlock);
    }
    
    /**
     * @notice Convert Ray rate to APY in basis points
     */
    function _rayToApy(uint256 rayRate) internal pure returns (uint256) {
        // Aave's rate is an annualized rate in Ray (27 decimals). To get basis points, divide by 10^23.
        return rayRate / 1e23;
    }
    
    /**
     * @notice Convert block rate to APY in basis points
     */
    function _blockRateToApy(uint256 blockRate) internal pure returns (uint256) {
        // Compound's rate is per block (scaled by 1e18). APY = (rate * blocks_per_year).
        // To get basis points, we multiply by 10000. APY_bp = (blockRate * 2102400 * 10000) / 1e18
        return (blockRate * 2102400) / 1e16;
    }
}
