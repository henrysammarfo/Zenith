// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {YieldMonitor} from "../src/reactive/YieldMonitor.sol";

contract CheckVmStatus is Script {
    function run() public view {
        address monitorAddr = 0xF0Bd2926D2836C1823ff29ddb90F84F58891f739;
        YieldMonitor monitor = YieldMonitor(payable(monitorAddr));
        
        console.log("Checking VM Status for:", monitorAddr);
        bool isVm = monitor.getVmStatus();
        console.log("VM Status (true=VM, false=Network):", isVm);
    }
}
