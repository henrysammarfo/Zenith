// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {MockAavePool} from "../src/mocks/MockAavePool.sol";

contract TriggerEvents is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address poolA = vm.envAddress("POOL_A");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Triggering Event on Mock Aave Pool:", poolA);
        
        // Change rate to 7% (previous was 6%)
        // 7 * 1e25 = 70000000000000000000000000
        uint256 newRate = 7 * 1e25;
        MockAavePool(poolA).setLiquidityRate(newRate);
        
        console.log("Liquidity Rate Updated to 7%. Event Emitted.");
        
        vm.stopBroadcast();
    }
}
