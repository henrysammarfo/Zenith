// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {YieldMonitor} from "../src/reactive/YieldMonitor.sol";

contract FixReactive is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        address poolA = vm.envAddress("POOL_A");
        address poolB = vm.envAddress("POOL_B");
        address asset = vm.envAddress("ASSET");
        address vault = vm.envAddress("VAULT");

        vm.startBroadcast(deployerPrivateKey);

        new YieldMonitor{value: 2 ether}(
            address(0),
            poolA,
            poolB,
            asset,
            vault
        );

        vm.stopBroadcast();
        
        // Output the address
        // console.log("New YieldMonitor deployed at:", address(monitor));
    }
}
