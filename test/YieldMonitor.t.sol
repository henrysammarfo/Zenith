// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {YieldMonitor} from "../src/reactive/YieldMonitor.sol";
import {MockAavePool} from "../src/mocks/MockAavePool.sol";
import {MockCompoundPool} from "../src/mocks/MockCompoundPool.sol";
import {CrossChainLendingVault} from "../src/core/CrossChainLendingVault.sol";
import {SimpleERC20} from "../src/ERC20.sol";
import {IReactive} from "reactive-lib/interfaces/IReactive.sol"; // Import LogRecord

contract YieldMonitorTest is Test {
    YieldMonitor public yieldMonitor;
    MockAavePool public poolA;
    MockCompoundPool public poolB;
    CrossChainLendingVault public vault;
    SimpleERC20 public asset;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    
    // Define Callback event explicitly to match IReactive.sol exactly
    event Callback(uint256 indexed chainId, address indexed _contract, uint64 indexed gasLimit, bytes payload);
    
    function setUp() public {
        vm.startPrank(owner);
        
        asset = new SimpleERC20("Mock Token", "MTK", 18);
        
        poolA = new MockAavePool(address(asset));
        poolB = new MockCompoundPool(address(asset));
        
        // Etch the service address so detectVm() sets vm = false
        vm.etch(address(0x0000000000000000000000000000000000fffFfF), hex"00");
        
        yieldMonitor = new YieldMonitor(address(poolA), address(poolB), address(asset), address(0));
        vault = new CrossChainLendingVault(address(asset), address(poolA), address(poolB), address(yieldMonitor), "Windsurf Vault", "WSV");

        yieldMonitor.setVaultAddress(address(vault));
        
        asset.mint(user1, 1000 ether);

        vm.stopPrank();
    }
    
    function testReactTrigger() public {
        // Test that a relevant log triggers the Callback event
        
        vm.startPrank(address(0xdeadbeef)); // Simulate reactive network caller
        
        uint256 aaveYieldTopic0 = 0x804c9b842b2748a22bb64b345453a3de7ca54a6ca45ce00d415894979e22897a;
        
        IReactive.LogRecord memory log = IReactive.LogRecord({
            chain_id: 11155111,
            _contract: address(poolA),
            topic_0: aaveYieldTopic0,
            topic_1: 0,
            topic_2: 0,
            topic_3: 0,
            data: hex"",
            block_number: 0,
            op_code: 0,
            block_hash: 0,
            tx_hash: 0,
            log_index: 0
        });

        // Expect the Callback event to be emitted
        vm.expectEmit(true, true, true, true);
        bytes memory expectedPayload = abi.encodeWithSignature("checkYieldsAndRebalance()");
        emit Callback(11155111, address(vault), 500000, expectedPayload);
        
        yieldMonitor.react(log);
        
        vm.stopPrank();
    }

    function testPauseAndResume() public {
        vm.startPrank(owner);
        yieldMonitor.pause();
        assertTrue(yieldMonitor.isPaused());

        yieldMonitor.resume();
        assertFalse(yieldMonitor.isPaused());
        vm.stopPrank();
    }
}
