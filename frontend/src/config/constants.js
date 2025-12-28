export const ZENITH_VAULT_ADDRESS = "0xF09c1e34a25583569C352434ADB870aCd014A1D1";
export const YIELD_MONITOR_ADDRESS = "0x0d951b817754C4326aF2C1A81Dc459aa071401bA";
export const ASSET_ADDRESS = "0x99b73Eee17e17553C824FCBC694fd01F31908193";
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
