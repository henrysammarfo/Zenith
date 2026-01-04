# Zenith: High-Fidelity Cross-Chain Yield Optimization

🚀 **Overview**
Zenith is a production-grade lending automation vault that leverages **Reactive Smart Contracts** to autonomously rebalance liquidity between major lending protocols (**Aave V3** and **Compound V2**) on Ethereum Sepolia. By utilizing the **Reactive Network (Lasna)**, Zenith eliminates the need for centralized off-chain keepers, providing a trustless, event-driven pipeline for yield optimization.

🏗 **Architecture**
Zenith follows a **"Signal Repeater"** model designed specifically for the Reactive Network:
*   **YieldMonitor (Reactive Contract)**: Deployed on Lasna, it subscribes to yield-changing events on Sepolia (e.g., `ReserveDataUpdated`).
*   **Signal Propagation**: When the Monitor detects a profitable yield differential, it emits a cross-chain **Callback** via the ReactVM.
*   **Local Audit & Rebalance**: The `CrossChainLendingVault` on Sepolia receives the callback, performs a local yield audit to verify the opportunity, and reallocates assets between underlying pools.

✨ **Key Features**
*   **ERC-4626 Compliant**: Standardized vault interface for seamless integration with DeFi wallets and aggregators.
*   **Trustless Automation**: Rebalancing is triggered by live on-chain logs, processed by Lasna, and executed on Sepolia without human or bot intervention.
*   **Security-First Logic**: The Vault performs its own yield check upon receiving a signal, ensuring that "garbage input" cannot trigger a loss-making rebalance.
*   **Dynamic Configuration**: On-chain management of rebalance thresholds (basis points), percentage shifts, and emergency pause controls.

🛡 **Security & Adversarial Resilience**
*   **Authorized Callbacks**: Strict verification that rebalancing triggers originate solely from the verified Reactive Monitor.
*   **rnOnly Protection**: Reactive logic is gated to prevent unauthorized external manipulation of the automation trigger.
*   **Emergency Gates**: Integrated `pause()` and `rescueTokens()` functions in both the Vault and Monitor for immediate human intervention in black-swan events.

🔍 **Workflow Proof (The Zenith Cycle)**
To demonstrate production-grade reactivity, we have executed a full autonomous rebalancing cycle:
1. **Origin (APY Update)**: 0x9d71327038e267d81de1a5c4b94357f98a2ea8f6ccc4aa8e1c957f0249c5d6af
2. **Reactive (Signal Emitted)**: 0xdc3347f75f750c1825fa2b87f4749f50e854966e6012678696b940ce6f6631be
3. **Destination (Vault Rebalance)**: 0x1f8dd7866d8c17dfd8656c9cc8f120ed5eeeefce26355381e09e04cdc91f15c6

🛠 **Technology Stack**
*   **Smart Contracts**: Solidity 0.8.20+ (Foundry Tooling)
*   **Infrastructure**: Ethereum Sepolia, Reactive Network Lasna
*   **Library**: `reactive-lib` for trustless cross-chain signaling.
*   **Frontend**: React/Vite/Wagmi with a high-contrast dashboard for real-time tracking.

🔗 **Resources**
*   **GitHub**: henrysammarfo/Zenith
*   **Submission Details**: REACTIVE_BOUNTY_SUBMISSION.md
