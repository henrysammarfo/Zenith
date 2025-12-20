// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {CrossChainLendingVault} from "../src/core/CrossChainLendingVault.sol";
import {MockAavePool} from "../src/mocks/MockAavePool.sol";
import {MockCompoundPool} from "../src/mocks/MockCompoundPool.sol";
import {YieldMonitor} from "../src/reactive/YieldMonitor.sol";
import {SimpleERC20} from "../src/ERC20.sol";

contract CrossChainLendingVaultTest is Test {
    CrossChainLendingVault public vault;
    MockAavePool public poolA;
    MockCompoundPool public poolB;
    YieldMonitor public yieldMonitor;
    SimpleERC20 public asset;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public yieldMonitorAddr;
    
    uint256 public constant INITIAL_DEPOSIT = 100 ether;
    
    event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares);
    event Rebalanced(address indexed fromPool, address indexed toPool, uint256 amount);
    
    function setUp() public {
        vm.startPrank(owner);
        
        asset = new SimpleERC20("Mock Token", "MTK", 18);
        
        poolA = new MockAavePool(address(asset));
        poolB = new MockCompoundPool(address(asset));
        
        yieldMonitor = new YieldMonitor(address(poolA), address(poolB), address(asset), address(0));
        yieldMonitorAddr = address(yieldMonitor);
        
        vault = new CrossChainLendingVault(address(asset), address(poolA), address(poolB), yieldMonitorAddr, "Windsurf Vault", "WSV");
        
        yieldMonitor.updateVaultAddress(address(vault));

        asset.mint(address(this), 1000 ether);
        asset.mint(user1, 1000 ether);
        
        vm.stopPrank();
    }
    
    function testDepositAndRedeem() public {
        vm.startPrank(user1);
        asset.approve(address(vault), INITIAL_DEPOSIT);
        
        // Test Deposit
        vm.expectEmit(true, true, true, true);
        emit Deposit(user1, user1, INITIAL_DEPOSIT, INITIAL_DEPOSIT);
        vault.deposit(INITIAL_DEPOSIT, user1);
        assertEq(vault.totalAssets(), INITIAL_DEPOSIT);
        assertEq(vault.balanceOf(user1), INITIAL_DEPOSIT);

        // Test Redeem
        uint256 sharesToRedeem = vault.balanceOf(user1) / 2;
        uint256 assetsToReceive = vault.previewRedeem(sharesToRedeem);
        vm.expectEmit(true, true, true, true);
        emit Withdraw(user1, user1, user1, assetsToReceive, sharesToRedeem);
        vault.redeem(sharesToRedeem, user1, user1);
        assertEq(vault.balanceOf(user1), INITIAL_DEPOSIT - sharesToRedeem);
        
        vm.stopPrank();
    }

    function testRebalancing() public {
        vm.startPrank(user1);
        asset.approve(address(vault), INITIAL_DEPOSIT);
        vault.deposit(INITIAL_DEPOSIT, user1);
        vm.stopPrank();

        // Set yield rates to trigger rebalance from B to A
        poolA.setLiquidityRate(7 * 1e25); // 7%
        poolB.setSupplyRatePerBlock(11891171759); // ~2.5%

        // The vault has 100 ether total, 50 in each pool.
        // The rebalance percentage is 10%.
        // Amount to rebalance is 10% of the allocation in the fromPool (poolB).
        // 10% of 50 ether is 5 ether.
        uint256 rebalanceAmount = 5 ether;

        vm.expectEmit(true, true, true, true);
        emit Rebalanced(address(poolB), address(poolA), rebalanceAmount);

        vm.prank(yieldMonitorAddr);
        vault.rebalance(address(poolB), address(poolA), rebalanceAmount);
    }
}
