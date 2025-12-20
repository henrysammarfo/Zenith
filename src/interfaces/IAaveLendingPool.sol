// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAaveLendingPool
 * @dev Interface for the Aave V3 Lending Pool
 */
interface IAaveLendingPool {
    struct ReserveData {
        uint256 currentLiquidityRate;
        uint256 currentStableBorrowRate;
        uint256 currentVariableBorrowRate;
        uint256 liquidityIndex;
        uint256 variableBorrowIndex;
        uint256 lastUpdateTimestamp;
        address aTokenAddress;
        address stableDebtTokenAddress;
        address variableDebtTokenAddress;
        address interestRateStrategyAddress;
        uint8 id;
    }

    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;

    function withdraw(address asset, uint256 amount, address to) external returns (uint256);

    function getReserveData(address asset) external view returns (ReserveData memory);

    function getReserveNormalizedIncome(address asset) external view returns (uint256);
}
