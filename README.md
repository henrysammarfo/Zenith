# Zenith: Cross-Chain Yield Optimization Vault

A production-grade lending automation vault powered by **Reactive Smart Contracts**. This vault autonomously rebalances liquidity between Aave V3 and Compound V2 on Ethereum Sepolia based on real-time yield signals processed on the Reactive Network (Lasna).

## Project Overview

Zenith implements a "Signal Repeater" architecture to overcome cross-chain state reading limitations:
1.  **YieldMonitor (Reactive)** lives on the Lasna network, subscribing to yield-changing events on Sepolia.
2.  **CrossChainLendingVault (Destination)** lives on Sepolia, managing user funds and local yield calculations.
3.  **Automation**: When conditions change, the Monitor sends a cross-chain callback to the Vault, which then rebalances liquidity to the highest-yielding pool.

## Key Features
- **ERC4626 Compliant**: Standardized vault interface for seamless integration.
- **Bi-directional Rebalancing**: Moves funds from Aave → Compound or vice-versa.
- **Configurable Strategy**: Rebalance thresholds and percentages are manageable via an on-chain `ConfigManager`.
- **Security First**: Integrated pausing mechanisms and authorized reactive execution.

## Deployment & Setup

### Environment
1. Clone the repository.
2. Setup environment variables:
   ```bash
   cp .env.example .env
   # Fill in PRIVATE_KEY and RPC URLs
   ```

### Quick Deploy
1. **Sepolia Components**:
   ```bash
   forge script script/DeploySepolia.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --legacy
   ```
2. **Reactive Monitor**:
   ```bash
   forge script script/DeployReactive.s.sol --rpc-url https://lasna-rpc.rnk.dev/ --broadcast --legacy
   ```
3. **Linking**: Call `updateYieldMonitor(address)` on the Vault with the deployed monitor address.

## Verification & Walkthrough
A detailed step-by-step description of the rebalancing workflow, including **transaction hashes**, can be found in [REACTIVE_BOUNTY_SUBMISSION.md](./REACTIVE_BOUNTY_SUBMISSION.md).

### Latest Verified State:
- **Sepolia Vault**: `0x8f361be39c3c8e0447ec4aa014e355eb52cf6448`
- **Lasna Monitor**: `0xce47699939797AF265EBE8CCA4679f906597A928`
- **Successful Rebalance**: Confirmed shift from 50/50 to 0.7/0.3 allocation upon simulated yield update.
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
export PRIVATE_KEY=0x...
export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key

# Deploy to Sepolia
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
```

### Reactive Testnet (Kopli)

```bash
# Set environment variables
export REACTIVE_RPC_URL=https://kopli-rpc.rnk.dev

# Deploy Reactive YieldMonitor
forge create src/reactive/YieldMonitor.sol:YieldMonitor \
  --rpc-url $REACTIVE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args \
  0x0000000000000000000000000000000000000000 \ # System Contract (Mock for local)
  <POOL_A_ADDR> \
  <POOL_B_ADDR> \
  <ASSET_ADDR> \
  <VAULT_ADDR>
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

## Bounty Submission Details

For a detailed breakdown of the submission requirements, threat model, and design trade-offs, see [REACTIVE_BOUNTY_SUBMISSION.md](REACTIVE_BOUNTY_SUBMISSION.md).

## License

MIT License
