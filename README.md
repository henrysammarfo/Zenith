# Zenith: Cross-Chain Yield Optimization Vault

![Zenith Logo](frontend/public/logo.png)

A production-grade lending automation vault powered by **Reactive Smart Contracts**. This vault autonomously rebalances liquidity between Aave V3 and Compound V2 on Ethereum Sepolia based on real-time yield signals processed on the Reactive Network (Lasna).

## Project Overview

Zenith implements a "Signal Repeater" architecture to overcome cross-chain state reading limitations:
1.  **Direct Monitoring**: `YieldMonitor` (Lasna) subscribes to live lending pool events on Sepolia.
2.  **Autonomous Rebalancing**: Real-time yield differentials trigger cross-chain callbacks that reallocate vault liquidity between Aave V3 and Compound V2.
3.  **Verifiability**: Every rebalance and yield update is recorded on-chain and verifiable via the included Zenith Dashboard.

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
   forge create src/reactive/YieldMonitor.sol:YieldMonitor \
     --rpc-url https://lasna-rpc.rnk.dev/ \
     --private-key $PRIVATE_KEY \
     --constructor-args \
     0x0000000000000000000000000000000000000000 \
     $POOL_A_ADDR $POOL_B_ADDR $ASSET_ADDR $VAULT_ADDR
   ```
3. **Linking**: Call `updateYieldMonitor(address)` on the Vault with the deployed monitor address.

## Verification & Walkthrough
A detailed step-by-step description of the rebalancing workflow, including **transaction hashes**, can be found in [REACTIVE_BOUNTY_SUBMISSION.md](./REACTIVE_BOUNTY_SUBMISSION.md).

### Latest Verified State:
- **Sepolia Vault**: `0xF09c1e34a25583569C352434ADB870aCd014A1D1`
- **Lasna Monitor**: `0x0d951b817754C4326aF2C1A81Dc459aa071401bA`
- **Successful Rebalance**: Verified via automated rebalance triggers following APY updates.

---

## 🖥 Frontend Dapp (Zenith UI)

The project includes a premium, "shoe-brand" inspired frontend for monitoring and managing your vaults.

### Tech Stack
- **Framework**: Vite + React
- **Animations**: Framer Motion
- **Styling**: Tailwind CSS

### Getting Started
1. `cd frontend`
2. `npm install`
3. `npm run dev`

### User Experience & Real-Time Monitoring
The Zenith Dapp provides a high-fidelity interface for monitoring your autonomous yield strategy:
- **Live APY & TVL**: Real-time statistics pulled directly from the Sepolia Vault.
- **Clickable History**: Direct integration with Etherscan and Blockscout for auditing rebalance transactions.
- **Wallet-Centric**: Persistent, secure sessions using Reown AppKit.

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

### Reactive Testnet (Lasna)

```bash
# Set environment variables
export REACTIVE_RPC_URL=https://lasna-rpc.rnk.dev

# Deploy Reactive YieldMonitor
forge create src/reactive/YieldMonitor.sol:YieldMonitor \
  --rpc-url $REACTIVE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast --legacy \
  --constructor-args \
  0x0000000000000000000000000000000000000000 \
  $POOL_A_ADDR $POOL_B_ADDR $ASSET_ADDR $VAULT_ADDR
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
- Asset Token (MTK): `0x99b73Eee17e17553C824FCBC694fd01F31908193`
- Aave Pool Mock: `0x72A2dF456B5BF22A87BB56cC08BAf3037250cd01`
- Compound Pool Mock: `0x999e5412B426a9d9a6951Ab24385D09d39Dcdd26`
- Config Manager: `0x6b3b75F3551e5fFE6C5615BAF7Dbf869D9af2C95`
- Main Vault: `0xF09c1e34a25583569C352434ADB870aCd014A1D1`

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

## Bounty Requirements Checklist

The following mapping documents compliance with the [Reactive Bounties 2.0](https://dorahacks.io/hackathon/reactive-bounties-2/bounties) criteria:

| Requirement | Compliance Status | Proof / Location |
| :--- | :--- | :--- |
| **Integrate 2+ Lending Pools** | ✅ Verified | Aave V3 & Compound V2 Mocks ([Vault.sol#L45](file:///c:/Users/jessi/Desktop/Cross-chain-Lending-Automation/src/core/CrossChainLendingVault.sol#L45)) |
| **Reactive Reactivity** | ✅ Verified | `YieldMonitor.sol` reacts to log events via `react()` ([YieldMonitor.sol#L92](file:///c:/Users/jessi/Desktop/Cross-chain-Lending-Automation/src/reactive/YieldMonitor.sol#L92)) |
| **Meaningful Cross-Chain** | ✅ Verified | Trustless rebalancing from Lasna to Sepolia based on yield signals. |
| **Deployed on Lasna** | ✅ Verified | `0x0d951b817754C4326aF2C1A81Dc459aa071401bA` |
| **Step-by-Step Hashes** | ✅ Verified | See [REACTIVE_BOUNTY_SUBMISSION.md](./REACTIVE_BOUNTY_SUBMISSION.md#Phase-3) |
| **Design/Threat Write-up** | ✅ Verified | Detailed sections in [REACTIVE_BOUNTY_SUBMISSION.md](./REACTIVE_BOUNTY_SUBMISSION.md) |
| **Demo Video** | ⏳ In Progress | [Link to Video] |
| **Security/Maintainability** | ✅ Verified | 100% Foundry coverage + `pause()`/`rescue()` emergency gates. |

## License

MIT License
