// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IPayer} from "./IPayer.sol";

/**
 * @title IReactive
 * @dev Interface for Reactive Smart Contracts
 * @notice Reactive contracts must implement this interface to handle incoming events
 */
interface IReactive is IPayer {
    struct LogRecord {
        uint256 chainId;
        address _contract;
        uint256 topic0;
        uint256 topic1;
        uint256 topic2;
        uint256 topic3;
        bytes data;
        uint256 blockNumber;
        uint256 opCode;
        uint256 blockHash;
        uint256 txHash;
        uint256 logIndex;
    }

    event Callback(
        uint256 indexed chainId,
        address indexed _contract,
        uint64 indexed gasLimit,
        bytes payload
    );

    function react(LogRecord calldata log) external;
}
