// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ZenithToken (MTK)
 * @dev Organic fixed-supply token with a built-in daily faucet for testing.
 */
contract ZenithToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;
    uint256 public constant FAUCET_AMOUNT = 100 * 10**18;
    uint256 public constant COOLDOWN = 1 days;

    mapping(address => uint256) public lastClaimTime;

    constructor() ERC20("Zenith Asset Token", "MTK") Ownable(msg.sender) {
        // Mint initial supply to deployer for pool funding
        _mint(msg.sender, 10_000_000 * 10**18);
    }

    /**
     * @notice Claim tokens from the faucet (once every 24 hours)
     */
    function claimFaucet() external {
        require(block.timestamp >= lastClaimTime[msg.sender] + COOLDOWN, "ZenithToken: Faucet cooldown active");
        require(totalSupply() + FAUCET_AMOUNT <= MAX_SUPPLY, "ZenithToken: Max supply reached");

        lastClaimTime[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Admin minting for protocol initialization (limited by MAX_SUPPLY)
     */
    function adminMint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "ZenithToken: Max supply exceeded");
        _mint(to, amount);
    }
}
