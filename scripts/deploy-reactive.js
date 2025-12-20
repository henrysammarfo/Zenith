const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying to Reactive Network...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Reactive Network configuration
  const reactiveProvider = new ethers.JsonRpcProvider("https://reactive-rpc.testnet.singularity.network", {
    chainId: 11155111,
    name: "Reactive Testnet"
  });
  
  const reactiveWallet = new ethers.Wallet(process.env.PRIVATE_KEY, reactiveProvider);
  
  // Deploy mock asset
  console.log("Deploying SimpleERC20...");
  const SimpleERC20 = await ethers.getContractFactory("SimpleERC20", reactiveWallet);
  const asset = await SimpleERC20.deploy("Mock Token", "MTK", 18);
  await asset.waitForDeployment();
  console.log("SimpleERC20 deployed to:", await asset.getAddress());
  
  // Deploy mock lending pools
  console.log("Deploying MockAavePool...");
  const MockAavePool = await ethers.getContractFactory("MockAavePool", reactiveWallet);
  const poolA = await MockAavePool.deploy(await asset.getAddress());
  await poolA.waitForDeployment();
  console.log("MockAavePool deployed to:", await poolA.getAddress());
  
  console.log("Deploying MockCompoundPool...");
  const MockCompoundPool = await ethers.getContractFactory("MockCompoundPool", reactiveWallet);
  const poolB = await MockCompoundPool.deploy(await asset.getAddress());
  await poolB.waitForDeployment();
  console.log("MockCompoundPool deployed to:", await poolB.getAddress());
  
  // Deploy yield monitor
  console.log("Deploying YieldMonitor...");
  const YieldMonitor = await ethers.getContractFactory("YieldMonitor", reactiveWallet);
  const yieldMonitor = await YieldMonitor.deploy(
    await poolA.getAddress(),
    await poolB.getAddress(),
    await asset.getAddress(),
    reactiveWallet.address
  );
  await yieldMonitor.waitForDeployment();
  console.log("YieldMonitor deployed to:", await yieldMonitor.getAddress());
  
  // Deploy main vault
  console.log("Deploying CrossChainLendingVault...");
  const CrossChainLendingVault = await ethers.getContractFactory("CrossChainLendingVault", reactiveWallet);
  const vault = await CrossChainLendingVault.deploy(
    await asset.getAddress(),
    await poolA.getAddress(),
    await poolB.getAddress(),
    await yieldMonitor.getAddress()
  );
  await vault.waitForDeployment();
  console.log("CrossChainLendingVault deployed to:", await vault.getAddress());
  
  console.log("Deployment complete!");
  console.log("=== Reactive Network Contract Addresses ===");
  console.log("Asset:", await asset.getAddress());
  console.log("Pool A (Aave):", await poolA.getAddress());
  console.log("Pool B (Compound):", await poolB.getAddress());
  console.log("Yield Monitor:", await yieldMonitor.getAddress());
  console.log("Main Vault:", await vault.getAddress());
  console.log("========================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
