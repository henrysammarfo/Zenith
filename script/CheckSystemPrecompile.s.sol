// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";

contract CheckSystemPrecompile is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        console.log("Checking System Precompile at 0x64...");
        
        vm.startBroadcast(deployerPrivateKey);
        
        bytes memory payload = abi.encode(block.number);
        (bool success, bytes memory ret) = address(0x64).call(payload);
        
        console.log("Success:", success);
        console.log("Return Length:", ret.length);
        
        if (success && ret.length == 32) {
            address impl = abi.decode(ret, (address));
            console.log("Implementation Address:", impl);
        } else {
            console.log("PRECOMPILE FAILED or returned invalid data.");
        }
        
        vm.stopBroadcast();
    }
}
