// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISystemContract
 * @dev Interface for the Reactive Network system contract
 */
interface ISystemContract {
    function subscribe(
        uint256 chainId,
        address _contract,
        uint256 topic0,
        uint256 topic1,
        uint256 topic2,
        uint256 topic3
    ) external;

    function depositTo(address recipient) external payable;

    function unsubscribe(
        uint256 chainId,
        address _contract,
        uint256 topic0,
        uint256 topic1,
        uint256 topic2,
        uint256 topic3
    ) external;
}
