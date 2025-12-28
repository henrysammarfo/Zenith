export const ZENITH_VAULT_ADDRESS = "0x4e30c7578e27f3b66451d3b57277629d43df3c56";
export const YIELD_MONITOR_ADDRESS = "0x06d7c3899B3C63fa69a9f25EE496b139A5eA1740";
export const ASSET_ADDRESS = "0xc866e23c6c889a67fd1b86be9a4871b6f3427ced";
export const POOL_A_ADDRESS = "0x16e4307a045b06b125446fe612860a98df51f245";
export const POOL_B_ADDRESS = "0xf11a3c025b7ab4d0c9ba15c3f8957cfc5102965b";
export const START_BLOCK = 7000000n; // Much safer range for Sepolia deployment



// Proper JSON ABI format for viem/wagmi
export const VAULT_ABI = [
    {
        name: "totalAssets",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }]
    },
    {
        name: "getYieldData",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{
            name: "",
            type: "tuple",
            components: [
                { name: "poolAApy", type: "uint256" },
                { name: "poolBApy", type: "uint256" },
                { name: "lastUpdate", type: "uint256" },
                { name: "yieldDifference", type: "uint256" }
            ]
        }]
    },
    {
        name: "getPoolAllocations",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{
            name: "",
            type: "tuple[]",
            components: [
                { name: "poolAddress", type: "address" },
                { name: "percentage", type: "uint256" },
                { name: "isActive", type: "bool" }
            ]
        }]
    },
    {
        name: "deposit",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "assets", type: "uint256" },
            { name: "receiver", type: "address" }
        ],
        outputs: [{ name: "", type: "uint256" }]
    },
    {
        name: "redeem",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "shares", type: "uint256" },
            { name: "receiver", type: "address" },
            { name: "owner", type: "address" }
        ],
        outputs: [{ name: "", type: "uint256" }]
    },
    {
        name: "checkYieldsAndRebalance",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [],
        outputs: []
    },
    {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }]
    },
    // Events for activity tracking
    {
        name: "Rebalanced",
        type: "event",
        inputs: [
            { name: "fromPool", type: "address", indexed: true },
            { name: "toPool", type: "address", indexed: true },
            { name: "amount", type: "uint256", indexed: false }
        ]
    },
    {
        name: "Deposit",
        type: "event",
        inputs: [
            { name: "sender", type: "address", indexed: true },
            { name: "owner", type: "address", indexed: true },
            { name: "assets", type: "uint256", indexed: false },
            { name: "shares", type: "uint256", indexed: false }
        ]
    },
    {
        name: "Withdraw",
        type: "event",
        inputs: [
            { name: "sender", type: "address", indexed: true },
            { name: "receiver", type: "address", indexed: true },
            { name: "owner", type: "address", indexed: true },
            { name: "assets", type: "uint256", indexed: false },
            { name: "shares", type: "uint256", indexed: false }
        ]
    }
];

export const MONITOR_ABI = [
    {
        name: "getCurrentYieldData",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [
            { name: "", type: "uint256" },
            { name: "", type: "uint256" },
            { name: "", type: "uint256" }
        ]
    }
];

export const ERC20_ABI = [
    {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }]
    },
    {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" }
        ],
        outputs: [{ name: "", type: "bool" }]
    },
    {
        name: "allowance",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" }
        ],
        outputs: [{ name: "", type: "uint256" }]
    },
    {
        name: "claimFaucet",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [],
        outputs: []
    },
    {
        name: "lastClaimTime",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "user", type: "address" }],
        outputs: [{ name: "", type: "uint256" }]
    },
    {
        name: "MAX_SUPPLY",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }]
    },
    {
        name: "COOLDOWN",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }]
    }
];
