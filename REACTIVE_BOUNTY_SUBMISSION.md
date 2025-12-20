# Cross-Chain Lending Automation Vault - Reactive Bounties 2.0 Submission

## Overview
This project implements a cross-chain lending automation vault using Reactive Smart Contracts that monitors yield rates across multiple lending protocols and automatically reallocates funds to maximize returns.

## Reactive Network Implementation

### Architecture
- **Reactive Contract**: `YieldMonitor` deployed on Reactive Network
- **Destination Contracts**: `CrossChainLendingVault`, mock lending pools on Ethereum Sepolia
- **Event-Driven**: Monitors lending pool events and triggers rebalancing automatically
- **Dual-State**: Separate states for Reactive Network and destination chains

## How Reactive Contracts Solve the Problem

Traditional vaults require:
- Manual monitoring of yield rates
- Off-chain computation for optimal allocation
- Manual triggering of rebalancing transactions
- High gas costs and latency

**Reactive Contracts enable:**
- **Autonomous monitoring**: Real-time event processing on-chain
- **Automatic rebalancing**: Trustless cross-chain transactions
- **Reduced operational overhead**: No manual intervention needed
- **Faster response times**: Immediate reaction to yield changes

## Smart Contracts

### 1. YieldMonitor (Reactive Contract)
- **Interface**: `IReactive` with `react(LogRecord)` function
- **Events Monitored**: Interest rate updates from lending pools
- **Callback Events**: Triggers rebalancing transactions on destination chains
- **ReactVM Detection**: Uses `vmOnly` modifier for security
- **State Separation**: Isolated ReactVM environment for event processing

### 2. CrossChainLendingVault (Destination Contract)
- **Single Interface**: Users deposit once, vault handles allocation
- **Pool Integration**: Aave V3 and Compound V2 mock implementations
- **Yield Tracking**: Real-time APY calculation and monitoring
- **Rebalancing Logic**: Automatic fund movement based on yield differentials
- **Security Features**: Reentrancy guards, access controls, emergency functions

### 3. Mock Lending Pools
- **MockAavePool**: Simulates Aave V3 with `getReserveData()` and rate updates
- **MockCompoundPool**: Simulates Compound V2 with `supplyRatePerBlock()` and exchange rates
- **Event Emission**: `InterestRateUpdated` events for reactive monitoring

## Deployment

### Reactive Network Deployment

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key

# Deploy to Reactive Testnet
npx hardhat run scripts/deploy-reactive.js --network reactive
```

### Ethereum Sepolia Deployment

```bash
# Deploy destination contracts
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

## Step-by-Step Workflow

### 1. Initial Setup

1. Deploy mock ERC20 token for testing
2. Deploy mock lending pools (Aave and Compound)
3. Deploy YieldMonitor reactive contract on Reactive Network
4. Deploy CrossChainLendingVault on Ethereum Sepolia
5. Configure cross-contract references

### 2. User Deposit Flow

1. User approves vault to spend tokens
2. User calls `deposit(amount)` on vault
3. Vault splits funds between lending pools (50/50 initially)
4. Vault supplies tokens to each pool
5. User receives vault shares representing their deposit

### 3. Yield Monitoring Flow

1. Lending pools emit `InterestRateUpdated` events
2. Reactive Network forwards events to YieldMonitor
3. YieldMonitor calculates current APYs for both pools
4. If yield difference > threshold (0.5%), triggers rebalancing

### 4. Automatic Rebalancing Flow

1. YieldMonitor emits `Callback` event with rebalancing data
2. Reactive Network creates transaction on Ethereum Sepolia
3. Vault's `rebalance()` function executes
4. Funds move from lower-yield to higher-yield pool
5. New allocation optimizes for current yields

## Transaction Hashes (Lasna Testnet Deployment)

This section provides the actual contract addresses and transaction hashes from the deployment to the Lasna testnet, serving as verifiable proof of the live implementation.

### Contract Addresses
- **Asset Token (LVT)**: `0x9F54700Ae37615C4D751FEE27138A1Cc4276e43d`
- **MockAavePool (Pool A)**: `0xCa684B6C02035Bd145b5b66F46eca88e11830E38`
- **MockCompoundPool (Pool B)**: `0x0D90622938AE7B15cAAa617325394dc30D4CF4a6`
- **YieldMonitor (Reactive Contract)**: `0x1278ecD03AdCe50d4B98abf42E375101E30708e8`
- **ConfigManager**: `0x809303cC124eABCDa2c6aFF9eefEd30EB662362a`
- **CrossChainLendingVault**: `0xACb9831e3E33580b6077FD79c1C5837272ec9e5f`

### Deployment Transaction Hashes
- **Asset Token Deployment**: `0x6fb4c365cbfd81dccf73152836355529b11a7a9b5e4bd4849e0de0306a8cf342`
- **MockAavePool Deployment**: `0x3eaf422d1975d67fc3a717a9fc1958fec7940146b17ab0b1ce13d909f85399b7`
- **MockCompoundPool Deployment**: `0x11178c8a9a8df9fdcdf2806dd9c2d3d1146900ae593c2c6a63fce63e02045499`
- **YieldMonitor Deployment**: `0x7b5a40312140df96c88112433eccab6d7fcdac874c6892b50f23ed3c70024ee9`
- **ConfigManager Deployment**: `0xec3b81b194557c7f67736eb65a7dde6f876e422ec04f113a987ffd901549ef3d`
- **CrossChainLendingVault Deployment**: `0x6fd0125ed3f1feb40aa8cc2a6852f133125e706dbc1e6eb77878003a922d3a69`

### Configuration Transaction Hashes
- **Update YieldMonitor (Set Vault Address)**: `0x588d88c6df204652397d8c6eb9eb05851bb4dc2ed1f58ca20e88bf1a8261e1ad`
- **Update ConfigManager (Set Vault Address)**: `0x4ca63f0ff2f124ae0c80e609a0c5fdb8f84d39be19673d3606165b1ef3e670b6`
- **Mint Test Tokens**: `0xb3df058a7fc26e77e460ea5efb4c32c224bfd6d32b9dfc31da3afd92a224288c`

## Configuration Parameters

### Rebalancing Strategy
- **Threshold**: 50 basis points (0.5% yield difference)
- **Rebalance Amount**: 10% of allocation per rebalance
- **Max Allocation**: 90% to single pool
- **Update Frequency**: Event-driven or manual checks

### Risk Management
- **Minimum Deposit**: 0.01 ETH
- **Emergency Withdraw**: 1% fee
- **Pause Function**: Can halt all operations
- **Access Control**: Owner and authorized users only

## Security Considerations

### Reactive Network Security
- **vmOnly Modifier**: Ensures only ReactVM can call critical functions
- **Address Authorization**: First parameter always replaced with ReactVM address
- **Gas Limits**: Configurable limits for callback transactions
- **Event Validation**: Only processes events from subscribed contracts

### Destination Contract Security
- **Reentrancy Guards**: Prevents recursive calls
- **Access Control**: Owner-based configuration management
- **Input Validation**: Checks amounts, addresses, and conditions
- **Emergency Controls**: Pause/resume and emergency withdraw functions

## Testing Strategy

### Unit Tests
- **Contract Deployment**: Verify all contracts deploy correctly
- **Deposit/Withdraw**: Test user interaction flows
- **Yield Calculation**: Verify APY calculations are accurate
- **Rebalancing Logic**: Test threshold triggers and fund movements
- **Access Control**: Verify only authorized users can configure

### Integration Tests
- **End-to-End Flow**: Complete user journey
- **Cross-Chain**: Reactive Network to Ethereum Sepolia
- **Event Processing**: Verify event-driven rebalancing
- **Error Handling**: Test failure scenarios and recovery

## Advanced Features

### Competitive Advantages
1. **Multi-Protocol Support**: Extensible to any lending protocol
2. **Configurable Strategy**: User-defined rebalancing parameters
3. **Real-Time Monitoring**: Immediate response to market changes
4. **Gas Optimization**: Efficient rebalancing with minimal transactions
5. **Risk Management**: Multiple layers of security and controls

### Future Enhancements
1. **Multi-Chain Support**: Expand to other blockchains
2. **Advanced Strategies**: Time-weighted, volatility-adjusted allocation
3. **Yield Prediction**: ML-based yield forecasting
4. **Governance**: Community-driven strategy parameters
5. **Insurance**: Protection against smart contract risks

## Requirements Compliance

✅ **Reactive Contracts**: Implements IReactive interface with react() function
✅ **Event Monitoring**: Listens to lending pool rate updates
✅ **Automatic Rebalancing**: Cross-chain transactions triggered by yield differences
✅ **Single Vault Interface**: Users deposit once, vault handles allocation
✅ **Configurable Strategy**: Threshold and percentage parameters
✅ **Security Features**: Access controls, emergency functions, reentrancy guards
✅ **Test Coverage**: Comprehensive test suite for all components
✅ **Documentation**: Complete setup and usage instructions
✅ **Deployment Scripts**: Automated deployment for both networks

## Getting Started

### Prerequisites

- Node.js 16+
- Hardhat development environment
- Private key for Reactive Network
- Ethereum Sepolia RPC endpoint

### Installation

```bash
git clone <repository>
cd cross-chain-lending-vault
npm install
```

### Configuration

```bash
# Copy environment file
cp .env.example .env

# Edit with your values
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=your_sepolia_rpc
```

### Deployment

```bash
# Deploy to Reactive Network
npm run deploy:reactive

# Deploy to Ethereum Sepolia
npm run deploy:sepolia
```

### Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- --grep "Vault"
```

## Demo Video Outline

1. **Introduction** (30s)
   - Problem overview
   - Reactive Network solution
   - Architecture explanation

2. **Deployment Demo** (60s)

   - Environment setup
   - Contract deployment
   - Configuration verification

3. **User Flow Demo** (90s)
   - Token minting and approval
   - Vault deposit interaction
   - Share receipt verification

4. **Rebalancing Demo** (60s)
   - Yield rate simulation
   - Event monitoring visualization
   - Automatic rebalancing execution

5. **Advanced Features** (60s)
   - Configuration management
   - Security controls
   - Monitoring dashboard

## Conclusion

This implementation demonstrates the power of Reactive Smart Contracts for creating autonomous, event-driven DeFi applications. The cross-chain lending vault showcases how reactivity enables more efficient, secure, and user-friendly financial products compared to traditional approaches.

The solution meets all bounty requirements and provides a solid foundation for further innovation in reactive DeFi applications.
