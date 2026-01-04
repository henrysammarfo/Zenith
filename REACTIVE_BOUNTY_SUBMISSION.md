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

**The Reactive Advantage:**
- **Eliminating the "Keeper Middleman"**: Zenith replaces off-chain bots with a Native Event-Driven Architecture, ensuring trustless rebalancing.
- **Protocol Compliance**: Unlike "custom pool" designs, Zenith is explicitly built to automate **Existing Lending Pools**. The architecture currently supports **Aave V3** and **Compound V2/V3** interfaces.
- **Atomic-Like Precision**: Zenith reacts to APY shifts exactly when protocols emit their yield events.

## Protocol Compatibility & Mainnet Readiness

Zenith is designed for immediate production deployment upon official protocol support on Reactive Network.

| Protocol | Version | Interface | Signal Event |
| :--- | :--- | :--- | :--- |
| **Aave** | V3 | `supply()`, `withdraw()` | `ReserveDataUpdated` (Topic 0: `0x804c9...`) |
| **Compound** | V2/V3 | `mint()`, `redeemUnderlying()` | `Mint` / `AccrueInterest` |

> [!NOTE]
> For hackathon demonstration on Sepolia, Zenith utilizes **Signal Replication** via mock instances of these protocols. This allows us to manually trigger yield volatility to prove the **Reactive rebalancing logic** in real-time. The code is 1:1 compatible with the official Aave and Compound deployments.

## Deployment Log & Runbook

### Phase 1:### Sepolia (L1) Deployment
- **Asset Token (MTK)**: `0xc866e23c6c889a67fd1b86be9a4871b6f3427ced`
- **Aave Pool Mock**: `0x16e4307a045b06b125446fe612860a98df51f245`
- **Compound Pool Mock**: `0xf11a3c025b7ab4d0c9ba15c3f8957cfc5102965b`
- **Config Manager**: `0x8401e37c4e5212b7f545bad02bd39ab89d6fbbb7`
- **Main Vault**: `0x4e30c7578e27f3b66451d3b57277629d43df3c56`

**Sepolia Deployment TXs**:
| Contract | Transaction Hash |
| :--- | :--- |
| Asset | `0x0a64762d9d764312569e84ce24d6325af905fe5a3cdcd185d41211f70d3a6d5d` |
| Pools | `0xae84b953d56508ae680cc53c95061e2c663476a1710006cb75651ae196b1d73b`, `0xf723d8774936a4d929b6fb70029a05d8db3584cc1a2b3a38e833d482bd0b4701` |
| Config | `0xca8e43f1391b4a761dc83a54eb74085e03107b3f3d20b3712e43b1b77ebc514d` |
| Vault | `0x3e9560472725835ca8c0b250612397c93a9b5a6edfcb5e7e86987ed9be0f17d7` |

### Phase 2: Reactive Network (Lasna) Deployment
- **YieldMonitor Contract**: `0x3830772Ec746270f79a65cd897cb16eA890759f5`
- **Deploy Transaction**: `0x93f725454335149e00b40f2488be4e45c8ee67efd10c03acbf4f667c83d77d30`
- **Status**: **Active** with 2 REACT balance
- **Subscriptions**: 2 active (Pool A events + Pool B events)

### Phase 3: Workflow Proof (The Zenith Cycle)
To demonstrate production-grade reactivity, we have executed multiple autonomous rebalancing cycles.

| Step | Action | Transaction Hash | Network |
| :--- | :--- | :--- | :--- |
| **1. Origin** | APY Update on Sepolia (Pool A Rate Change) | Emits `ReserveDataUpdated` event | Sepolia |
| **2. Reactive** | YieldMonitor processes event, emits Callback | `0xe4f2b994d4cc7d` (latest) | Lasna |
| **3. Reactive** | YieldMonitor processes event, emits Callback | `0x6df743e711187d` | Lasna |
| **4. Destination** | Vault `checkYieldsAndRebalance()` called | Callback triggers rebalance | Sepolia |

### Phase 4: Official Protocol Verification (Production Environment)
To fulfill the bounty requirement for existing lending pools, we have deployed a parallel production-ready environment using official Sepolia assets and protocols.

| Component | Official Sepolia Address | Role |
| :--- | :--- | :--- |
| **Asset** | `0x94A9d9ac8A2257646765261540A7007414bB3e9C` | **USDC** (Circle Official) |
| **Pool A** | `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951` | **Aave V3** Lending Pool |
| **Pool B** | `0x39AA39c021dfbaE8faC545936693aC917d5E7563` | **Compound V2** cUSDC |
| **Zenith Vault** | `0xb00dEd35D013729c118419647F735B40C9823421` | Official USDC Optimization Vault |
| **YieldMonitor** | `0x222639064B9E11F218c9F982025438Ba2Fea706B` | Official Lasna Monitor |

> [!TIP]
> Use the **"Demo / Official" toggle** in the Zenith Dashboard to verify this environment. It uses the exact same `IReactive` logic as the Demo environment but interacts with established multi-billion dollar protocols.


> [!IMPORTANT]
> The YieldMonitor at `0x3830772Ec746270f79a65cd897cb16eA890759f5` is **actively processing events**. View live status at: https://lasna.blockscout.com/address/0x3830772Ec746270f79a65cd897cb16eA890759f5

## Architecture

![Zenith Architecture](docs/architecture.png)

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
- **Asset Token (MTK)**: `0xc866e23c6c889a67fd1b86be9a4871b6f3427ced`
- **MockAavePool (Pool A)**: `0x16e4307a045b06b125446fe612860a98df51f245`
- **MockCompoundPool (Pool B)**: `0xf11a3c025b7ab4d0c9ba15c3f8957cfc5102965b`
- **YieldMonitor (Reactive Contract)**: `0x3830772Ec746270f79a65cd897cb16eA890759f5`
- **ConfigManager**: `0x8401e37c4e5212b7f545bad02bd39ab89d6fbbb7`
- **CrossChainLendingVault**: `0x4e30c7578e27f3b66451d3b57277629d43df3c56`

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
   forge create --broadcast src/reactive/YieldMonitor.sol:YieldMonitor \
     --rpc-url https://lasna-rpc.rnk.dev/ \
     --private-key $PRIVATE_KEY \
     --value 2ether --legacy \
     --constructor-args \
     0x0000000000000000000000000000000000000000 \
     $POOL_A $POOL_B $ASSET $VAULT
   ```

## Requirements Checklist Compliance
✅ **Reactivity**: Uses `IReactive` and `react()` to respond to log events.
✅ **Meaningful Use**: Automates yield optimization that would otherwise require centralized bots.
✅ **Deployed on Lasna**: `0x3830772Ec746270f79a65cd897cb16eA890759f5` (Active)
✅ **Single Interface**: Users only interact with the `CrossChainLendingVault`.
✅ **Security**: Robust access controls and adversarial mitigations.
✅ **Step-by-Step Workflow**: Transaction hashes provided in Phase 3 above.
