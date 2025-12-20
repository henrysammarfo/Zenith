// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ConfigManager
 * @dev Manages configuration parameters for the vault strategy
 */
contract ConfigManager is Ownable {
    struct StrategyConfig {
        uint256 rebalanceThreshold; // In basis points (10000 = 100%)
        uint256 rebalancePercentage; // Percentage to rebalance (10000 = 100%)
        uint256 maxAllocationPercentage; // Max allocation to single pool
        uint256 minDepositAmount; // Minimum deposit amount
        uint256 emergencyWithdrawFee; // Fee for emergency withdrawals (basis points)
        bool autoRebalanceEnabled;
        bool paused;
    }
    
    StrategyConfig public config;
    address public vaultAddress;
    
    mapping(address => bool) public authorizedUsers;
    
    event ConfigUpdated(string parameter, uint256 oldValue, uint256 newValue);
    event ConfigUpdatedBool(string parameter, bool oldValue, bool newValue);
    event UserAuthorized(address indexed user);
    event UserDeauthorized(address indexed user);
    event VaultUpdated(address indexed oldVault, address indexed newVault);
    
    constructor(address _vault) Ownable(msg.sender) {
        vaultAddress = _vault;
        
        // Default configuration
        config = StrategyConfig({
            rebalanceThreshold: 50, // 0.5%
            rebalancePercentage: 1000, // 10%
            maxAllocationPercentage: 9000, // 90%
            minDepositAmount: 1e16, // 0.01 ETH
            emergencyWithdrawFee: 100, // 1%
            autoRebalanceEnabled: true,
            paused: false
        });
    }
    
    modifier onlyAuthorized() {
        _onlyAuthorized();
        _;
    }

    function _onlyAuthorized() internal view {
        require(msg.sender == owner() || authorizedUsers[msg.sender], "ConfigManager: Not authorized");
    }
    
    modifier whenNotPaused() {
        _whenNotPaused();
        _;
    }

    function _whenNotPaused() internal view {
        require(!config.paused, "ConfigManager: Contract is paused");
    }
    
    function updateRebalanceThreshold(uint256 newThreshold) external onlyAuthorized {
        require(newThreshold <= 500, "ConfigManager: Threshold too high"); // Max 5%
        uint256 oldValue = config.rebalanceThreshold;
        config.rebalanceThreshold = newThreshold;
        emit ConfigUpdated("rebalanceThreshold", oldValue, newThreshold);
    }
    
    function updateRebalancePercentage(uint256 newPercentage) external onlyAuthorized {
        require(newPercentage <= 5000, "ConfigManager: Percentage too high"); // Max 50%
        uint256 oldValue = config.rebalancePercentage;
        config.rebalancePercentage = newPercentage;
        emit ConfigUpdated("rebalancePercentage", oldValue, newPercentage);
    }
    
    function updateMaxAllocationPercentage(uint256 newMaxAllocation) external onlyAuthorized {
        require(newMaxAllocation <= 9500, "ConfigManager: Max allocation too high"); // Max 95%
        uint256 oldValue = config.maxAllocationPercentage;
        config.maxAllocationPercentage = newMaxAllocation;
        emit ConfigUpdated("maxAllocationPercentage", oldValue, newMaxAllocation);
    }
    
    function updateMinDepositAmount(uint256 newMinDeposit) external onlyAuthorized {
        require(newMinDeposit >= 1e15, "ConfigManager: Minimum too low"); // Min 0.001 ETH
        uint256 oldValue = config.minDepositAmount;
        config.minDepositAmount = newMinDeposit;
        emit ConfigUpdated("minDepositAmount", oldValue, newMinDeposit);
    }
    
    function updateEmergencyWithdrawFee(uint256 newFee) external onlyAuthorized {
        require(newFee <= 500, "ConfigManager: Fee too high"); // Max 5%
        uint256 oldValue = config.emergencyWithdrawFee;
        config.emergencyWithdrawFee = newFee;
        emit ConfigUpdated("emergencyWithdrawFee", oldValue, newFee);
    }
    
    function toggleAutoRebalance() external onlyAuthorized {
        bool oldValue = config.autoRebalanceEnabled;
        config.autoRebalanceEnabled = !oldValue;
        emit ConfigUpdatedBool("autoRebalanceEnabled", oldValue, config.autoRebalanceEnabled);
    }
    
    function pause() external onlyOwner {
        require(!config.paused, "ConfigManager: Already paused");
        bool oldValue = config.paused;
        config.paused = true;
        emit ConfigUpdatedBool("paused", oldValue, config.paused);
        emit ConfigUpdated("paused", 0, 1);
    }
    
    function unpause() external onlyOwner {
        require(config.paused, "ConfigManager: Not paused");
        bool oldValue = config.paused;
        config.paused = false;
        emit ConfigUpdatedBool("paused", oldValue, config.paused);
        emit ConfigUpdated("paused", 1, 0);
    }
    
    function authorizeUser(address user) external onlyOwner {
        require(!authorizedUsers[user], "ConfigManager: User already authorized");
        authorizedUsers[user] = true;
        emit UserAuthorized(user);
    }
    
    function deauthorizeUser(address user) external onlyOwner {
        require(authorizedUsers[user], "ConfigManager: User not authorized");
        authorizedUsers[user] = false;
        emit UserDeauthorized(user);
    }
    
    function updateVaultAddress(address newVault) external onlyOwner {
        address oldVault = vaultAddress;
        vaultAddress = newVault;
        emit VaultUpdated(oldVault, newVault);
    }
    
    function getConfig() external view returns (StrategyConfig memory) {
        return config;
    }
    
    function isAuthorized(address user) external view returns (bool) {
        return authorizedUsers[user];
    }
}
