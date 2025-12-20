// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ConfigManager} from "../src/core/ConfigManager.sol";

/**
 * @title ConfigManagerTest
 * @dev Test suite for the configuration manager
 */
contract ConfigManagerTest is Test {
    ConfigManager public configManager;
    
    address public owner = address(0x1);
    address public authorizedUser = address(0x2);
    address public unauthorizedUser = address(0x3);
    
    event ConfigUpdated(string parameter, uint256 oldValue, uint256 newValue);
    event ConfigUpdatedBool(string parameter, bool oldValue, bool newValue);
    event UserAuthorized(address indexed user);
    event UserDeauthorized(address indexed user);
    
    function setUp() public {
        vm.startPrank(owner);
        configManager = new ConfigManager(address(0));
        vm.stopPrank();
    }
    
    function testDeployment() public view {
        ConfigManager.StrategyConfig memory config = configManager.getConfig();
        assertEq(config.rebalanceThreshold, 50); // 0.5%
        assertEq(config.rebalancePercentage, 1000); // 10%
        assertEq(config.maxAllocationPercentage, 9000); // 90%
        assertEq(config.minDepositAmount, 1e16); // 0.01 ETH
        assertEq(config.emergencyWithdrawFee, 100); // 1%
        assertEq(config.autoRebalanceEnabled, true);
        assertEq(config.paused, false);
    }
    
    function testUpdateRebalanceThreshold() public {
        vm.startPrank(owner);
        
        vm.expectEmit(true, true, true, true);
        emit ConfigUpdated("rebalanceThreshold", 50, 75);
        
        configManager.updateRebalanceThreshold(75);
        
        ConfigManager.StrategyConfig memory config = configManager.getConfig();
        assertEq(config.rebalanceThreshold, 75);
        
        vm.stopPrank();
    }
    
    function testUpdateRebalanceThresholdTooHigh() public {
        vm.startPrank(owner);
        
        vm.expectRevert("ConfigManager: Threshold too high");
        configManager.updateRebalanceThreshold(600); // 6%
        
        vm.stopPrank();
    }
    
    function testUpdateRebalancePercentage() public {
        vm.startPrank(owner);
        
        vm.expectEmit(true, true, true, true);
        emit ConfigUpdated("rebalancePercentage", 1000, 1500);
        
        configManager.updateRebalancePercentage(1500);
        
        ConfigManager.StrategyConfig memory config = configManager.getConfig();
        assertEq(config.rebalancePercentage, 1500);
        
        vm.stopPrank();
    }
    
    function testUpdateRebalancePercentageTooHigh() public {
        vm.startPrank(owner);
        
        vm.expectRevert("ConfigManager: Percentage too high");
        configManager.updateRebalancePercentage(6000); // 60%
        
        vm.stopPrank();
    }
    
    function testUpdateMaxAllocationPercentage() public {
        vm.startPrank(owner);
        
        vm.expectEmit(true, true, true, true);
        emit ConfigUpdated("maxAllocationPercentage", 9000, 9500);
        
        configManager.updateMaxAllocationPercentage(9500);
        
        ConfigManager.StrategyConfig memory config = configManager.getConfig();
        assertEq(config.maxAllocationPercentage, 9500);
        
        vm.stopPrank();
    }
    
    function testUpdateMinDepositAmount() public {
        vm.startPrank(owner);
        
        vm.expectEmit(true, true, true, true);
        emit ConfigUpdated("minDepositAmount", 1e16, 5e16);
        
        configManager.updateMinDepositAmount(5e16);
        
        ConfigManager.StrategyConfig memory config = configManager.getConfig();
        assertEq(config.minDepositAmount, 5e16);
        
        vm.stopPrank();
    }
    
    function testUpdateMinDepositAmountTooLow() public {
        vm.startPrank(owner);
        
        vm.expectRevert("ConfigManager: Minimum too low");
        configManager.updateMinDepositAmount(1e14); // 0.0001 ETH
        
        vm.stopPrank();
    }
    
    function testUpdateEmergencyWithdrawFee() public {
        vm.startPrank(owner);
        
        vm.expectEmit(true, true, true, true);
        emit ConfigUpdated("emergencyWithdrawFee", 100, 200);
        
        configManager.updateEmergencyWithdrawFee(200);
        
        ConfigManager.StrategyConfig memory config = configManager.getConfig();
        assertEq(config.emergencyWithdrawFee, 200);
        
        vm.stopPrank();
    }
    
    function testToggleAutoRebalance() public {
        vm.startPrank(owner);
        
        vm.expectEmit(true, true, true, true);
        emit ConfigUpdatedBool("autoRebalanceEnabled", true, false);
        
        configManager.toggleAutoRebalance();
        
        ConfigManager.StrategyConfig memory config = configManager.getConfig();
        assertEq(config.autoRebalanceEnabled, false);
        
        vm.stopPrank();
    }
    
    function testPause() public {
        vm.startPrank(owner);
        
        vm.expectEmit(true, true, true, true);
        emit ConfigUpdatedBool("paused", false, true);
        
        configManager.pause();
        
        ConfigManager.StrategyConfig memory config = configManager.getConfig();
        assertEq(config.paused, true);
        
        vm.stopPrank();
    }
    
    function testUnpause() public {
        vm.startPrank(owner);
        
        // Pause first
        configManager.pause();
        
        vm.expectEmit(true, true, true, true);
        emit ConfigUpdatedBool("paused", true, false);
        
        configManager.unpause();
        
        ConfigManager.StrategyConfig memory config = configManager.getConfig();
        assertEq(config.paused, false);
        
        vm.stopPrank();
    }
    
    function testAuthorizeUser() public {
        vm.startPrank(owner);
        
        vm.expectEmit(true, false, false, false);
        emit UserAuthorized(authorizedUser);
        
        configManager.authorizeUser(authorizedUser);
        
        assertTrue(configManager.isAuthorized(authorizedUser));
        assertFalse(configManager.isAuthorized(unauthorizedUser));
        
        vm.stopPrank();
    }
    
    function testDeauthorizeUser() public {
        vm.startPrank(owner);
        
        // Authorize first
        configManager.authorizeUser(authorizedUser);
        assertTrue(configManager.isAuthorized(authorizedUser));
        
        vm.expectEmit(true, false, false, false);
        emit UserDeauthorized(authorizedUser);
        
        configManager.deauthorizeUser(authorizedUser);
        
        assertFalse(configManager.isAuthorized(authorizedUser));
        
        vm.stopPrank();
    }
    
    function testAuthorizedUserCanUpdateConfig() public {
        vm.startPrank(owner);
        configManager.authorizeUser(authorizedUser);
        vm.stopPrank();
        
        vm.startPrank(authorizedUser);
        
        vm.expectEmit(true, true, true, true);
        emit ConfigUpdated("rebalanceThreshold", 50, 75);
        
        configManager.updateRebalanceThreshold(75);
        
        ConfigManager.StrategyConfig memory config = configManager.getConfig();
        assertEq(config.rebalanceThreshold, 75);
        
        vm.stopPrank();
    }
    
    function testUnauthorizedUserCannotUpdateConfig() public {
        vm.startPrank(unauthorizedUser);
        
        vm.expectRevert("ConfigManager: Not authorized");
        configManager.updateRebalanceThreshold(75);
        
        vm.stopPrank();
    }
    
    function testUpdateVaultAddress() public {
        vm.startPrank(owner);
        
        address newVault = address(0x123);
        configManager.updateVaultAddress(newVault);
        
        assertEq(configManager.vaultAddress(), newVault);
        
        vm.stopPrank();
    }
    
    function testPauseWhenAlreadyPaused() public {
        vm.startPrank(owner);
        
        configManager.pause();
        
        vm.expectRevert("ConfigManager: Already paused");
        configManager.pause();
        
        vm.stopPrank();
    }
    
    function testUnpauseWhenNotPaused() public {
        vm.startPrank(owner);
        
        vm.expectRevert("ConfigManager: Not paused");
        configManager.unpause();
        
        vm.stopPrank();
    }
    
    function testAuthorizeAlreadyAuthorizedUser() public {
        vm.startPrank(owner);
        
        configManager.authorizeUser(authorizedUser);
        
        vm.expectRevert("ConfigManager: User already authorized");
        configManager.authorizeUser(authorizedUser);
        
        vm.stopPrank();
    }
    
    function testDeauthorizeUnauthorizedUser() public {
        vm.startPrank(owner);
        
        vm.expectRevert("ConfigManager: User not authorized");
        configManager.deauthorizeUser(unauthorizedUser);
        
        vm.stopPrank();
    }
}
