// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {CrossChainLendingVault} from "../src/core/CrossChainLendingVault.sol";
import {YieldMonitor} from "../src/reactive/YieldMonitor.sol";
import {ConfigManager} from "../src/core/ConfigManager.sol";
import {MockAavePool} from "../src/mocks/MockAavePool.sol";
import {MockCompoundPool} from "../src/mocks/MockCompoundPool.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev Simple ERC20 token for testing deployments
 */
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MTK") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}

/**
 * @title Deploy
 * @dev Deployment script for the cross-chain lending vault system
 */
contract Deploy is Script {
    CrossChainLendingVault public vault;
    YieldMonitor public yieldMonitor;
    ConfigManager public configManager;
    MockERC20 public asset;
    MockAavePool public poolA;
    MockCompoundPool public poolB;
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy mock asset (for testing)
        asset = new MockERC20();
        
        // Deploy mock lending pools (for testing)
        poolA = new MockAavePool(address(asset));
        poolB = new MockCompoundPool(address(asset));
        
        // Deploy yield monitor
        yieldMonitor = new YieldMonitor(
            address(poolA),
            address(poolB),
            address(asset),
            address(0) // Will be set after vault deployment
        );
        
        // Deploy config manager
        configManager = new ConfigManager(address(0));
        
        // Deploy main vault
        vault = new CrossChainLendingVault(
            address(asset),
            address(poolA),
            address(poolB),
            address(yieldMonitor),
            "CrossChain Lending Vault",
            "CCLV"
        );
        
        // Update yield monitor with vault address
        yieldMonitor.updateVaultAddress(address(vault));
        
        // Update config manager with vault address
        configManager.updateVaultAddress(address(vault));
        
        // Authorize deployer in config manager
        configManager.authorizeUser(deployer);
        
        vm.stopBroadcast();
        
        console.log("Deployment Complete:");
        console.log("Asset Token:", address(asset));
        console.log("Aave Pool:", address(poolA));
        console.log("Compound Pool:", address(poolB));
        console.log("Yield Monitor:", address(yieldMonitor));
        console.log("Config Manager:", address(configManager));
        console.log("Main Vault:", address(vault));
    }
}

/**
 * @title DeployMainnet
 * @dev Deployment script for mainnet with real lending pools
 */
contract DeployMainnet is Script {
    CrossChainLendingVault public vault;
    YieldMonitor public yieldMonitor;
    ConfigManager public configManager;
    
    // Mainnet addresses (example - update with actual addresses)
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant AAVE_POOL = 0x87870bCA3F6E3B5C73A0C7D4b3BB5C3a5c8E4E9e; // Example
    address constant CETH = 0x4ddC2D193948926DC02B92A0A0C4e2d1E40C8a9A; // Compound ETH
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy yield monitor
        yieldMonitor = new YieldMonitor(
            AAVE_POOL,
            CETH,
            WETH,
            address(0) // Will be set after vault deployment
        );
        
        // Deploy config manager
        configManager = new ConfigManager(address(0));
        
        // Deploy main vault
        vault = new CrossChainLendingVault(
            WETH,
            AAVE_POOL,
            CETH,
            address(yieldMonitor),
            "CrossChain Lending Vault",
            "CCLV"
        );
        
        // Update yield monitor with vault address
        yieldMonitor.updateVaultAddress(address(vault));
        
        // Update config manager with vault address
        configManager.updateVaultAddress(address(vault));
        
        // Authorize deployer in config manager
        configManager.authorizeUser(deployer);
        
        vm.stopBroadcast();
        
        console.log("Mainnet Deployment Complete:");
        console.log("WETH:", WETH);
        console.log("Aave Pool:", AAVE_POOL);
        console.log("Compound ETH:", CETH);
        console.log("Yield Monitor:", address(yieldMonitor));
        console.log("Config Manager:", address(configManager));
        console.log("Main Vault:", address(vault));
    }
}

/**
 * @title DeploySepolia
 * @dev Deployment script for Sepolia testnet
 */
contract DeploySepolia is Script {
    CrossChainLendingVault public vault;
    YieldMonitor public yieldMonitor;
    ConfigManager public configManager;
    
    // Sepolia addresses (update with actual testnet addresses)
    address constant WETH_SEPOLIA = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    address constant AAVE_POOL_SEPOLIA = 0x6aE43d0C2824f45B8124C8d5A7B3D6E5c9b1d2e3; // Example
    address constant CETH_SEPOLIA = 0x4ddC2D193948926DC02B92A0A0C4e2d1E40C8a9A; // Same address on testnets
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy yield monitor
        yieldMonitor = new YieldMonitor(
            AAVE_POOL_SEPOLIA,
            CETH_SEPOLIA,
            WETH_SEPOLIA,
            address(0) // Will be set after vault deployment
        );
        
        // Deploy config manager
        configManager = new ConfigManager(address(0));
        
        // Deploy main vault
        vault = new CrossChainLendingVault(
            WETH_SEPOLIA,
            AAVE_POOL_SEPOLIA,
            CETH_SEPOLIA,
            address(yieldMonitor),
            "CrossChain Lending Vault",
            "CCLV"
        );
        
        // Update yield monitor with vault address
        yieldMonitor.updateVaultAddress(address(vault));
        
        // Update config manager with vault address
        configManager.updateVaultAddress(address(vault));
        
        // Authorize deployer in config manager
        configManager.authorizeUser(deployer);
        
        vm.stopBroadcast();
        
        console.log("Sepolia Deployment Complete:");
        console.log("WETH Sepolia:", WETH_SEPOLIA);
        console.log("Aave Pool Sepolia:", AAVE_POOL_SEPOLIA);
        console.log("Compound ETH Sepolia:", CETH_SEPOLIA);
        console.log("Yield Monitor:", address(yieldMonitor));
        console.log("Config Manager:", address(configManager));
        console.log("Main Vault:", address(vault));
    }
}
