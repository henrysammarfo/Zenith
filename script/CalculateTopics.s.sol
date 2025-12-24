// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";

contract CalculateTopics is Script {
    function run() public pure {
        // Aave V3: ReserveDataUpdated
        // event ReserveDataUpdated(address indexed reserve, uint256 liquidityRate, uint256 stableBorrowRate, uint256 variableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex);
        bytes32 aaveTopic = keccak256("ReserveDataUpdated(address,uint256,uint256,uint256,uint256,uint256)");
        
        // Compound V2 (Mock): Mint
        // event Mint(address indexed minter, uint256 mintAmount, uint256 mintTokens);
        bytes32 compoundTopic = keccak256("Mint(address,uint256,uint256)");

        console.log("=== CALCULATED TOPIC HASHES ===");
        console.log("Aave ReserveDataUpdated:");
        console.logBytes32(aaveTopic);
        
        console.log("");
        console.log("Compound Mint:");
        console.logBytes32(compoundTopic);
    }
}
