// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IPayer
 * @dev Interface for payment functionality in reactive contracts
 */
interface IPayer {
    function pay(uint256 amount) external;
}
