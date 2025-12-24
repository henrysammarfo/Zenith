// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {YieldMonitor} from "../src/reactive/YieldMonitor.sol";

/**
 * @title DeployYieldMonitor
 * @dev Step 1: Deploy YieldMonitor to Lasna with initial REACT funding
 * @notice After deployment, run SubscribeYieldMonitor.s.sol to activate subscriptions
 */
contract DeployYieldMonitor is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // These addresses must be from the Sepolia deployment
        address poolA = vm.envAddress("POOL_A");
        address poolB = vm.envAddress("POOL_B");
        address asset = vm.envAddress("ASSET");
        address vault = vm.envAddress("VAULT");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // --- DEPLOYMENT ---
        
        // Deploy with 1 ETH for REACT fees
        YieldMonitor yieldMonitor = new YieldMonitor{value: 1 ether}(
            poolA,
            poolB,
            asset,
            vault
        );
        
        vm.stopBroadcast();
        
        console.log("===========================================");
        console.log("STEP 1 COMPLETE: YieldMonitor Deployed");
        console.log("===========================================");
        console.log("Yield Monitor Address:", address(yieldMonitor));
        console.log("");
        console.log("NEXT STEP: Run SubscribeYieldMonitor.s.sol");
        console.log("Set YIELD_MONITOR env var to:", address(yieldMonitor));
    }
}
