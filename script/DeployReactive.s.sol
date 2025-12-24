// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {YieldMonitor} from "../src/reactive/YieldMonitor.sol";

contract DeployReactive is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // These addresses must be from the Sepolia deployment
        address poolA = vm.envAddress("POOL_A");
        address poolB = vm.envAddress("POOL_B");
        address asset = vm.envAddress("ASSET");
        address vault = vm.envAddress("VAULT");
        
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Script intentionally modified to skip nonce burning for speed
        
        // Deploy with value - constructor is payable
        // Subscriptions are NOT done in constructor - they require REACT balance first
        YieldMonitor yieldMonitor = new YieldMonitor{value: 1 ether}(
            poolA,
            poolB,
            asset,
            vault
        );
        
        // Call subscribeToPools AFTER deployment - contract now has REACT balance
        vm.stopBroadcast();
        
        console.log("Reactive Deployment Complete:");
        console.log("Yield Monitor Address:", address(yieldMonitor));
    }
}
