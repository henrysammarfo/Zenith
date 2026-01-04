// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {YieldMonitor} from "../src/reactive/YieldMonitor.sol";

contract DeployOfficialMonitor is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Config for Official Monitor (Pointing to official Sepolia pools)
        address systemContract = 0x0000000000000000000000000000000000000000; // Placeholder
        address officialVault = 0xb00dEd35D013729c118419647F735B40C9823421;
        address aavePool = 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951;
        address compoundPool = 0x39AA39c021dfbaE8faC545936693aC917d5E7563;
        address usdc = 0x94A9d9ac8A2257646765261540A7007414bB3e9C;

        vm.startBroadcast(deployerPrivateKey);

        YieldMonitor monitor = new YieldMonitor{value: 2 ether}(
            systemContract,
            officialVault,
            aavePool,
            compoundPool,
            usdc
        );

        console2.log("Official YieldMonitor Deployed at:", address(monitor));

        vm.stopBroadcast();
    }
}
