// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IVault
 * @dev Interface for the cross-chain lending vault
 */
interface IVault {
    struct PoolAllocation {
        address poolAddress;
        uint256 percentage; // Basis points (10000 = 100%)
        bool isActive;
    }

    struct YieldData {
        uint256 poolAApy;
        uint256 poolBApy;
        uint256 lastUpdate;
        uint256 yieldDifference; // In basis points
    }

    struct UserInfo {
        uint256 depositedAmount;
        uint256 vaultShares;
        uint256 lastDepositTime;
    }

    function getYieldData() external view returns (YieldData memory);
    function getPoolAllocations() external view returns (PoolAllocation[] memory);
    function rebalance(address sender, address fromPool, address toPool, uint256 amount) external;
    
    /**
     * @notice Check yields and rebalance if necessary (called by YieldMonitor)
     */
    function checkYieldsAndRebalance() external;
    
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount, uint256 shares);
    event Rebalanced(address indexed fromPool, address indexed toPool, uint256 amount);
    event YieldUpdated(uint256 poolAApy, uint256 poolBApy, uint256 difference);
}
