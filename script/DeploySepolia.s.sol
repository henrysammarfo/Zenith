// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {CrossChainLendingVault} from "../src/core/CrossChainLendingVault.sol";
import {ConfigManager} from "../src/core/ConfigManager.sol";
import {MockAavePool} from "../src/mocks/MockAavePool.sol";
import {MockCompoundPool} from "../src/mocks/MockCompoundPool.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MTK") {
        _mint(msg.sender, 1000000000 * 10**18);
    }
}

contract DeploySepolia is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        MockERC20 asset = new MockERC20();
        MockAavePool poolA = new MockAavePool(address(asset));
        MockCompoundPool poolB = new MockCompoundPool(address(asset));
        ConfigManager configManager = new ConfigManager(address(0));
        
        // Note: YieldMonitor is deployed separately on Reactive Network.
        // We initialize with a placeholder and update it after YieldMonitor deployment.
        CrossChainLendingVault vault = new CrossChainLendingVault(
            address(asset),
            address(poolA),
            address(poolB),
            address(0x1), // Placeholder for YieldMonitor
            "CrossChain Lending Vault",
            "CCLV"
        );
        
        configManager.updateVaultAddress(address(vault));
        configManager.authorizeUser(deployer);
        
        vm.stopBroadcast();
        
        console.log("Sepolia Deployment Complete:");
        console.log("Asset Token:", address(asset));
        console.log("Aave Pool:", address(poolA));
        console.log("Compound Pool:", address(poolB));
        console.log("Config Manager:", address(configManager));
        console.log("Main Vault:", address(vault));
    }
}
