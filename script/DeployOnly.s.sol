// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {YieldMonitor} from "../src/reactive/YieldMonitor.sol";

contract DeployOnly is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address poolA = vm.envAddress("POOL_A");
        address poolB = vm.envAddress("POOL_B");
        address asset = vm.envAddress("ASSET");
        address vault = vm.envAddress("VAULT");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy ONLY
        YieldMonitor yieldMonitor = new YieldMonitor{value: 0.1 ether}(
            poolA,
            poolB,
            asset,
            vault
        );
        
        vm.stopBroadcast();
        
        console.log("Deployed YieldMonitor to:", address(yieldMonitor));
        console.log("PLEASE UPDATE .env WITH THIS ADDRESS");
    }
}
