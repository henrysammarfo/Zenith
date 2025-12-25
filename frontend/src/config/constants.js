export const ZENITH_VAULT_ADDRESS = "0xF09c1e34a25583569C352434ADB870aCd014A1D1";
export const YIELD_MONITOR_ADDRESS = "0x0d951b817754C4326aF2C1A81Dc459aa071401bA";
export const ASSET_ADDRESS = "0x99b73Eee17e17553C824FCBC694fd01F31908193";

export const VAULT_ABI = [
    "function totalAssets() external view returns (uint256)",
    "function getYieldData() external view returns (tuple(uint256 poolAApy, uint256 poolBApy, uint256 lastUpdate, uint256 yieldDifference))",
    "function getPoolAllocations() external view returns (tuple(address poolAddress, uint256 percentage, bool isActive)[] memory)",
    "function deposit(uint256 assets, address receiver) external returns (uint256)",
    "function redeem(uint256 shares, address receiver, address owner) external returns (uint256)",
    "function checkYieldsAndRebalance() external",
    "function balanceOf(address account) external view returns (uint256)"
];

export const MONITOR_ABI = [
    "function getCurrentYieldData() external view returns (uint256, uint256, uint256)"
];

export const ERC20_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function claimFaucet() external",
    "function lastClaimTime(address user) external view returns (uint256)",
    "function MAX_SUPPLY() external view returns (uint256)",
    "function COOLDOWN() external view returns (uint256)"
];
