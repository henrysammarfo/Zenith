// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {CrossChainLendingVault} from "../src/core/CrossChainLendingVault.sol";
import {YieldMonitor} from "../src/reactive/YieldMonitor.sol";

contract DeployOfficial is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Official Sepolia Addresses
        address usdc = 0x94A9d9ac8A2257646765261540A7007414bB3e9C;
        address aavePool = 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951;
        address compoundPool = 0x39AA39c021dfbaE8faC545936693aC917d5E7563;
        address systemContract = 0x0000000000000000000000000000000000000000; // Placeholder for Reactive

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Vault
        CrossChainLendingVault vault = new CrossChainLendingVault(
            usdc,
            aavePool,
            compoundPool,
            address(0), // No monitor yet
            "Zenith Official USDC Vault",
            "zUSDC"
        );

        console2.log("Official Vault Deployed at:", address(vault));

        vm.stopBroadcast();
    }
}
