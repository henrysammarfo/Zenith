// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {YieldMonitor} from "../src/reactive/YieldMonitor.sol";

contract DeployReactive is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Sepolia Addresses
        address poolA = 0x72A2dF456B5BF22A87BB56cC08BAf3037250cd01;
        address poolB = 0x999e5412B426a9d9a6951Ab24385D09d39Dcdd26;
        address asset = 0x99b73Eee17e17553C824FCBC694fd01F31908193;
        address vault = 0xF09c1e34a25583569C352434ADB870aCd014A1D1;

        vm.startBroadcast(deployerPrivateKey);

        YieldMonitor monitor = new YieldMonitor(
            address(0), // System Contract Mock
            poolA,
            poolB,
            asset,
            vault
        );

        vm.stopBroadcast();

        console.log("YieldMonitor Deployed to:", address(monitor));
    }
}
