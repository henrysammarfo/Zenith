// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title SimpleERC20
 * @dev Simple ERC20 token for testing
 */
contract SimpleERC20 is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals
    ) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**decimals);
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
