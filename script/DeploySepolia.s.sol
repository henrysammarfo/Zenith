// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {CrossChainLendingVault} from "../src/core/CrossChainLendingVault.sol";
import {ConfigManager} from "../src/core/ConfigManager.sol";
import {MockAavePool} from "../src/mocks/MockAavePool.sol";
import {MockCompoundPool} from "../src/mocks/MockCompoundPool.sol";
import {ZenithToken} from "../src/mocks/ZenithToken.sol";

contract DeploySepolia is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        ZenithToken asset = new ZenithToken();
        MockAavePool poolA = new MockAavePool(address(asset));
        MockCompoundPool poolB = new MockCompoundPool(address(asset));
        ConfigManager configManager = new ConfigManager(address(0));
        
        // Fund pools with initial liquidity (1,000,000 MTK each)
        require(asset.transfer(address(poolA), 1_000_000 * 10**18), "Transfer to Pool A failed");
        require(asset.transfer(address(poolB), 1_000_000 * 10**18), "Transfer to Pool B failed");
        
        // Note: YieldMonitor is deployed separately on Reactive Network.
        CrossChainLendingVault vault = new CrossChainLendingVault(
            address(asset),
            address(poolA),
            address(poolB),
            address(0x1), 
            "Zenith Vault Shares",
            "ZTH"
        );
        
        configManager.updateVaultAddress(address(vault));
        configManager.authorizeUser(deployer);
        
        vm.stopBroadcast();
        
        console.log("Zenith Protocol Deployment Complete:");
        console.log("Asset Token (MTK):", address(asset));
        console.log("Aave Pool (Pool A):", address(poolA));
        console.log("Compound Pool (Pool B):", address(poolB));
        console.log("Vault Shares (ZTH):", address(vault));
    }
}
