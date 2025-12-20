# Cross-Chain Lending Automation Vault

A DeFi vault that automatically rebalances liquidity between multiple lending protocols using Reactive Smart Contracts.

## Overview

This vault monitors yield rates across multiple lending pools (Aave V3 and Compound V2) on Ethereum Sepolia and automatically reallocates funds to maximize returns based on configurable yield differentials.

## Architecture

### Core Components

1. **CrossChainLendingVault** - Main vault contract handling user deposits/withdrawals
2. **YieldMonitor** - Reactive contract that monitors lending pool events and triggers rebalancing
3. **ConfigManager** - Manages strategy parameters and configuration
4. **Mock Pools** - Test implementations of Aave and Compound pools

### Key Features

- **Automated Yield Monitoring**: Real-time tracking of APY rates across pools
- **Dynamic Rebalancing**: Automatic fund allocation when yield differences exceed thresholds
- **Reactive Architecture**: Event-driven responses using Reactive Network
- **Configurable Strategy**: Adjustable rebalancing parameters and thresholds
- **Emergency Controls**: Pause/resume functionality and emergency withdrawals

## How It Works

1. **Deposit**: Users deposit assets into the vault, receiving vault shares
2. **Allocation**: Funds are distributed across lending pools based on configured percentages
3. **Monitoring**: YieldMonitor continuously tracks APY rates from both pools
4. **Rebalancing**: When yield difference > threshold, funds automatically move to higher-yield pool
5. **Withdrawal**: Users can withdraw their shares at any time

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd cross-chain-lending-vault

# Install dependencies
forge install

# Build contracts
forge build
```

## Testing

```bash
# Run all tests
forge test

# Run specific test file
forge test --match-test testDeposit

# Run tests with verbosity
forge test -vvv
```

## Deployment

### Local Testing

```bash
# Start local node
anvil

# Deploy to local network
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

### Sepolia Testnet

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export SEPOLIA_RPC_URL=your_sepolia_rpc_url

# Deploy to Sepolia
forge script script/Deploy.s.sol:DeploySepolia --rpc-url sepolia --broadcast --verify
```

## Configuration

### Strategy Parameters

- `rebalanceThreshold`: Minimum yield difference to trigger rebalancing (basis points)
- `rebalancePercentage`: Percentage of allocation to rebalance (basis points)
- `maxAllocationPercentage`: Maximum allocation to single pool (basis points)
- `minDepositAmount`: Minimum deposit amount
- `autoRebalanceEnabled`: Toggle automatic rebalancing

### Example Configuration

```solidity
// 0.5% yield difference threshold
configManager.updateRebalanceThreshold(50);

// Rebalance 10% of allocation
configManager.updateRebalancePercentage(1000);

// Max 90% allocation to single pool
configManager.updateMaxAllocationPercentage(9000);
```

## Contract Addresses

### Local Testing
- Mock Token: Deployed during setup
- Mock Aave Pool: Deployed during setup
- Mock Compound Pool: Deployed during setup
- Yield Monitor: Deployed during setup
- Config Manager: Deployed during setup
- Main Vault: Deployed during setup

### Sepolia Testnet
- WETH Sepolia: `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14`
- Aave Pool Sepolia: Update with actual address
- Compound ETH Sepolia: `0x4Ddc2D193948926Dc02B92a0A0c4E2d1E40C8A9a`

## API Reference

### CrossChainLendingVault

```solidity
function deposit(uint256 amount) external
function withdraw(uint256 sharesAmount) external
function getVaultBalance() external view returns (uint256)
function getCurrentYieldData() external view returns (YieldData memory)
function getPoolAllocations() external view returns (PoolAllocation[] memory)
```

### YieldMonitor

```solidity
function checkYieldRates() external
function pause() external
function resume() external
function getCurrentYieldData() external view returns (uint256, uint256, uint256)
```

### ConfigManager

```solidity
function updateRebalanceThreshold(uint256 newThreshold) external
function updateRebalancePercentage(uint256 newPercentage) external
function toggleAutoRebalance() external
function pause() external
function unpause() external
```

## Security Considerations

- **Reactive Network Authorization**: First parameter always replaced with ReactVM address
- **Gas Limit Controls**: Configurable gas limits for callback transactions
- **Emergency Controls**: Pause functionality and emergency withdrawals
- **Access Control**: Owner and authorized user management
- **Reentrancy Protection**: Built-in reentrancy guards

## Yield Calculations

### Aave V3
- Uses `getReserveData()` to fetch `currentLiquidityRate`
- Converts Ray rate (per second) to APY in basis points

### Compound V2
- Uses `supplyRatePerBlock()` to fetch rate per block
- Converts block rate to annual APY in basis points

## Events

```solidity
event Deposited(address indexed user, uint256 amount, uint256 shares);
event Withdrawn(address indexed user, uint256 amount, uint256 shares);
event Rebalanced(address indexed fromPool, address indexed toPool, uint256 amount);
event YieldUpdated(uint256 poolA_Apy, uint256 poolB_Apy, uint256 difference);
```

## Risk Factors

- **Smart Contract Risk**: Potential vulnerabilities in vault or lending protocols
- **Market Risk**: Yield rates can fluctuate significantly
- **Liquidity Risk**: Withdrawals may be limited by pool liquidity
- **Technical Risk**: Reactive Network downtime or failures

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Support

For questions or support, please open an issue in the repository.
