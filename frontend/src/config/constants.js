export const CONFIG = {
    MOCK: {
        VAULT: "0x4e30c7578e27f3b66451d3b57277629d43df3c56",
        MONITOR: "0x3830772Ec746270f79a65cd897cb16eA890759f5",
        ASSET: "0xc866e23c6c889a67fd1b86be9a4871b6f3427ced",
        POOL_A: "0x16e4307a045b06b125446fe612860a98df51f245",
        POOL_B: "0xf11a3c025b7ab4d0c9ba15c3f8957cfc5102965b",
        ASSET_NAME: "MTK",
        COLOR: "text-white"
    },
    OFFICIAL: {
        VAULT: "0xb00dEd35D013729c118419647F735B40C9823421",
        MONITOR: "0x222639064B9E11F218c9F982025438Ba2Fea706B",
        ASSET: "0x94A9d9ac8A2257646765261540A7007414bB3e9C", // Official Sepolia USDC
        POOL_A: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", // Official Aave V3 Pool
        POOL_B: "0x39AA39c021dfbaE8faC545936693aC917d5E7563", // Official Compound V2 cUSDC
        ASSET_NAME: "USDC",
        COLOR: "text-blue-400"
    }
};

export const START_BLOCK = 7000000n;

// Legacy exports for backward compatibility if needed, but components should use CONFIG
export const ZENITH_VAULT_ADDRESS = CONFIG.MOCK.VAULT;
export const YIELD_MONITOR_ADDRESS = CONFIG.MOCK.MONITOR;
export const ASSET_ADDRESS = CONFIG.MOCK.ASSET;
export const POOL_A_ADDRESS = CONFIG.MOCK.POOL_A;
export const POOL_B_ADDRESS = CONFIG.MOCK.POOL_B;

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
