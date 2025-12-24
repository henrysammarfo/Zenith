# Zenith: Cross-Chain Yield Optimization Vault
 - Reactive Bounties 2.0 Submission

## Overview
Zenith implements a "Signal Repeater" architecture to overcome cross-chain state reading limitations:
It autonomously monitors yield rates across multiple lending protocols (Aave V3 and Compound V2 mocks) on Ethereum Sepolia and reallocates liquidity to the highest-yielding pool using trustless cross-chain callbacks.

## Why Reactive Contracts?

Traditional cross-chain automation relies on **Keepers** (off-chain bots) or **Oracles**, which introduce significant trade-offs:
1. **Centralization Risk**: Keepers are often centralized or require complex economic incentives (like Chainlink Keepers) to remain reliable.
2. **Latency**: Off-chain bots must poll the chain, wait for confirmations, and then trigger transactions, leading to "yield leakage" during high-volatility periods.
3. **Complexity**: Managing multi-chain private keys and gas for bots is an operational burden.

**The Reactive Solution:**
- **Emergency Controls**: Integrated `pause()` and `rescueTokens()` functions in both the Vault and YieldMonitor to allow the owner to halt automation or recover funds in case of external protocols (Aave/Compound) behaving unexpectedly.
- **Dynamic Optimization**: The rebalancing threshold is now configurable on-chain, allowing for fine-tuning based on network congestion or gas price volatility without re-deploying.
- **Lasna Protocol Alignment**: Updated to the latest `ISystemContract` patterns, including explicit `payable` casting and the official `REACTIVE_IGNORE` wildcard signature.

## Deployment Log & Runbook

### Phase 1:### Sepolia (L1) Deployment
- **Asset Token (MTK)**: `0x6C27674247e791fc1c0bDE7e728F93FAc19A0960`
- **Aave Pool Mock**: `0x90b065B3410a9c3EeA0e3713D0Aab4Af7C007557`
- **Compound Pool Mock**: `0x7716BD6c58F5efc3472dC7B0F5ee3D4f14A8cc6f`
- **Config Manager**: `0x52C9ac1bEd4369f5723F9E176341704Ac4C81034`
- **Main Vault**: `0x69782E6D3386b571A19684539c62c1B99d5c7A13`

**Sepolia Deployment TXs**:
| Contract | Transaction Hash |
| :--- | :--- |
| Asset | `0x4a37aa94fb4493ed70bcf724d95f1a47d496dd0f8353a37a47229254b16591d3` |
| Pools | `0x4dfb71e31ad5d6ce91cafc4e187b6f8cf68714c626b6f1e346226002223a5c44`, `0x645c0d7879feffbe244748c75f46c26e88da54917bcfd0c10b2cfb4184d54724` |
| Config | `0xee219cb92c1f2aa8385e72090332e66b19ed778bd2545cc61adb2a4d92f6d30a` |
| Vault | `0x30a8518b7cd3bca0af3527342e7ca7bef1e056327d498a1badfdd89ad770541e` |
### Phase 2: Reactive Lasna (Automation)
1. **Deploy Yield Monitor**:
   ```bash
   forge create src/reactive/YieldMonitor.sol:YieldMonitor \
     --rpc-url https://lasna-rpc.rnk.dev/ \
     --private-key $PRIVATE_KEY \
     --constructor-args \
     0x0000000000000000000000000000000000000000 \
     $POOL_A_ADDR $POOL_B_ADDR $ASSET_ADDR $VAULT_ADDR
   ```
2. **Link Vault**:
   ```bash
   cast send 0x5D3235c4eB39f5c3729e75932D62E40f77D8e70f "updateYieldMonitor(address)" [YIELD_MONITOR_ADDR] --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY
   ```

## Architecture

- **Reactive Contract**: `YieldMonitor` (Deployed on Reactive Network). Subscribes to Lending Pool events.
- **Destination Contracts**: 
    - `CrossChainLendingVault`: ERC4626-compliant vault managing user assets.
    - `MockAavePool` & `MockCompoundPool`: Mock implementations for testing and demonstration.
- **Security Layer**: `ConfigManager` handles authorized ReactVM addresses and strategy parameters.

## Threat Model & Adversarial Thinking

To ensure "100% Perfection," we analyzed potential attack vectors:

| Threat | Mitigation |
| :--- | :--- |
| **Unauthorized Rebalancing** | The `rebalance` function in the Vault uses a custom modifier that validates `msg.sender == authorizedReactVM`. This address is managed by `ConfigManager` and only updated by the owner. |
| **Yield Manipulation** | Adversaries might try to manipulate mock pool rates to trigger frequent rebalancing (gas griefing). The Vault implements a **Rebalance Threshold** (e.g., 0.5%) and a **Cooldown/Max Allocation** strategy to ensure rebalancing only occurs when profitable. |
| **Callback Gas Exhaustion** | The Reactive Network handles callback gas. The `YieldMonitor` specifies a `CALLBACK_GAS_LIMIT`. If an attacker triggers complex state changes during a callback, the transaction fails gracefully without compromising the Vault's core assets. |
| **Front-running Rebalance** | Since rebalancing moves large sums, it could be front-run. The Vault uses internal accounting and safe transfers to ensure balances are always verified before and after pool movement. |

## Design Trade-offs

1. **Precision vs. Gas**: We use basis points (1/100th of 1%) for all yield calculations. While `uint256` could offer more precision, basis points are standard in DeFi and keep gas costs predictable for complex rebalancing logic.
2. **Proportional vs. Absolute Rebalancing**: The current implementation moves a percentage of the total allocation (e.g., 10%) per trigger. This prevents single-pool drain risks and allows the vault to "trial" the new pool before committing 100% of liquidity.
3. **Internal Overrides (ERC4626)**: We chose to override `_deposit` and `_withdraw` (OpenZeppelin 5.0+) rather than generic hooks. This ensures that assets are **always** in a lending pool or in transit, never sitting idle in the vault.

## Contract Addresses
- **Asset Token (MTK)**: `0xfd4cdb992a478f885580afa464d38114465a93a4`
- **MockAavePool (Pool A)**: `0x312e80aa2582d27100cf18e2a4115a2c6c5ca3a8`
- **MockCompoundPool (Pool B)**: `0x557540d0efef69af82b9a25b204165c116d7b92b`
- **YieldMonitor (Reactive Contract)**: `0xce47699939797AF265EBE8CCA4679f906597A928`
- **ConfigManager**: `0xeece7a6b0ef7f41b090eba683b56c13bedb06621`
- **CrossChainLendingVault**: `0x8f361be39c3c8e0447ec4aa014e355eb52cf6448`

## Operational Maturity

- **Emergency Pause**: Both `ConfigManager` and `YieldMonitor` can be paused by the owner to halt all reactive triggers during market instability.
- **Foundry-First Toolkit**: Entirely built and tested with Foundry for industry-standard reliability.

## Deployment Instructions

### Environment Setup
```bash
export PRIVATE_KEY=0x...
### Deployment

1. Copy `.env.example` to `.env` and fill in your `PRIVATE_KEY` and `RPC_URLS`.
2. Deploy Sepolia infrastructure:
   ```bash
   forge script script/DeploySepolia.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --legacy
   ```
3. Update `.env` with the deployed addresses.
4. Deploy Reactive Monitor:
   ```bash
   forge create src/reactive/YieldMonitor.sol:YieldMonitor \
     --rpc-url https://lasna-rpc.rnk.dev/ \
     --private-key $PRIVATE_KEY \
     --constructor-args \
     0x0000000000000000000000000000000000000000 \
     $POOL_A_ADDR $POOL_B_ADDR $ASSET_ADDR $VAULT_ADDR
   ```

## Requirements Checklist Compliance
✅ **Reactivity**: Uses `IReactive` and `react()` to respond to log events.
✅ **Meaningful Use**: Automates yield optimization that would otherwise require centralized bots.
✅ **Deployed**: Ready for Lasna testnet deployment.
✅ **Single Interface**: Users only interact with the `CrossChainLendingVault`.
✅ **Security**: Robust access controls and adversarial mitigations.
