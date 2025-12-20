// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {YieldMonitor} from "../src/reactive/YieldMonitor.sol";
import {MockAavePool} from "../src/mocks/MockAavePool.sol";
import {MockCompoundPool} from "../src/mocks/MockCompoundPool.sol";
import {CrossChainLendingVault} from "../src/core/CrossChainLendingVault.sol";
import {SimpleERC20} from "../src/ERC20.sol";

contract YieldMonitorTest is Test {
    YieldMonitor public yieldMonitor;
    MockAavePool public poolA;
    MockCompoundPool public poolB;
    CrossChainLendingVault public vault;
    SimpleERC20 public asset;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    
    event YieldRateUpdated(uint256 poolAApy, uint256 poolBApy, uint256 difference);
    event RebalanceTriggered(address indexed fromPool, address indexed toPool, uint256 amount);
    
    function setUp() public {
        vm.startPrank(owner);
        
        asset = new SimpleERC20("Mock Token", "MTK", 18);
        
        poolA = new MockAavePool(address(asset));
        poolB = new MockCompoundPool(address(asset));
        
        yieldMonitor = new YieldMonitor(address(poolA), address(poolB), address(asset), address(0));
        vault = new CrossChainLendingVault(address(asset), address(poolA), address(poolB), address(yieldMonitor), "Windsurf Vault", "WSV");

        yieldMonitor.updateVaultAddress(address(vault));
        
        asset.mint(user1, 1000 ether);

        vm.stopPrank();
    }
    
    function testYieldRateUpdateAndRebalance() public {
        vm.startPrank(user1);
        asset.approve(address(vault), 100 ether);
        vault.deposit(100 ether, user1);
        vm.stopPrank();

        vm.startPrank(owner);
        yieldMonitor.setTotalAllocated(100 ether);
        vm.stopPrank();

        poolA.setLiquidityRate(600 * 1e23); // 6%
        
        vm.expectEmit(true, true, true, true);
        emit RebalanceTriggered(address(poolB), address(poolA), 10 ether);
        yieldMonitor.checkYieldRates();
        
        assertEq(yieldMonitor.lastPoolAApy(), 600);
        assertEq(yieldMonitor.lastPoolBApy(), 500);
    }

    function testNoRebalanceBelowThreshold() public {
        poolA.setLiquidityRate(501 * 1e23); // 5.01%
        
        yieldMonitor.checkYieldRates();
        
        assertEq(yieldMonitor.lastPoolAApy(), 501);
        assertEq(yieldMonitor.lastPoolBApy(), 500);
    }

    function testPauseAndResume() public {
        vm.startPrank(owner);
        yieldMonitor.ownerPause(true);
        assertTrue(yieldMonitor.isPaused());

        vm.expectRevert("YieldMonitor: Monitoring is paused");
        yieldMonitor.checkYieldRates();

        yieldMonitor.ownerPause(false);
        assertFalse(yieldMonitor.isPaused());

        yieldMonitor.checkYieldRates();
        vm.stopPrank();
    }
}
