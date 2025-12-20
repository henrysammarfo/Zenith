const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying to Reactive Network Testnet...");
  
  // Check for environment variables
  if (!process.env.PRIVATE_KEY) {
    throw new Error("❌ PRIVATE_KEY environment variable is required");
  }
  
  const [deployer] = await ethers.getSigners();

  console.log("📡 Deployer Address:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  try {
    // Deploy mock ERC20 token
    console.log("🪙 Deploying MockERC20...");
    const SimpleERC20 = await ethers.getContractFactory("SimpleERC20");
    const asset = await SimpleERC20.deploy("Lending Vault Token", "LVT", 18);
    await asset.waitForDeployment();
    const assetAddress = await asset.getAddress();
    console.log("✅ MockERC20 deployed to:", assetAddress);
    
    // Deploy mock lending pools
    console.log("🏦 Deploying MockAavePool...");
    const MockAavePool = await ethers.getContractFactory("MockAavePool");
    const poolA = await MockAavePool.deploy(assetAddress);
    await poolA.waitForDeployment();
    const poolAAddress = await poolA.getAddress();
    console.log("✅ MockAavePool deployed to:", poolAAddress);
    
    console.log("🏦 Deploying MockCompoundPool...");
    const MockCompoundPool = await ethers.getContractFactory("MockCompoundPool");
    const poolB = await MockCompoundPool.deploy(assetAddress);
    await poolB.waitForDeployment();
    const poolBAddress = await poolB.getAddress();
    console.log("✅ MockCompoundPool deployed to:", poolBAddress);
    
    // Deploy YieldMonitor reactive contract
    console.log("🔍 Deploying YieldMonitor (Reactive Contract)...");
    const YieldMonitor = await ethers.getContractFactory("YieldMonitor");
    const yieldMonitor = await YieldMonitor.deploy(
      poolAAddress,
      poolBAddress,
      assetAddress,
      deployer.address
    );
    await yieldMonitor.waitForDeployment();
    const yieldMonitorAddress = await yieldMonitor.getAddress();
    console.log("✅ YieldMonitor deployed to:", yieldMonitorAddress);
    
    // Deploy ConfigManager
    console.log("⚙️ Deploying ConfigManager...");
    const ConfigManager = await ethers.getContractFactory("ConfigManager");
    const configManager = await ConfigManager.deploy(deployer.address);
    await configManager.waitForDeployment();
    const configManagerAddress = await configManager.getAddress();
    console.log("✅ ConfigManager deployed to:", configManagerAddress);
    
    // Deploy main vault
    console.log("🏛️ Deploying CrossChainLendingVault...");
    const CrossChainLendingVault = await ethers.getContractFactory("CrossChainLendingVault");
    const vault = await CrossChainLendingVault.deploy(
      assetAddress,
      poolAAddress,
      poolBAddress,
      yieldMonitorAddress
    );
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log("✅ CrossChainLendingVault deployed to:", vaultAddress);
    
    // Setup cross-references
    console.log("🔗 Setting up cross-references...");
    
    // Update YieldMonitor with vault address
    const updateTx1 = await yieldMonitor.updateVaultAddress(vaultAddress);
    await updateTx1.wait();
    console.log("✅ YieldMonitor vault address updated");
    console.log("📝 Transaction:", updateTx1.hash);
    
    // Update ConfigManager with vault address  
    const updateTx2 = await configManager.updateVaultAddress(vaultAddress);
    await updateTx2.wait();
    console.log("✅ ConfigManager vault address updated");
    console.log("📝 Transaction:", updateTx2.hash);
    
    // Mint tokens for testing
    console.log("💰 Minting test tokens...");
    const mintTx = await asset.mint(deployer.address, ethers.parseEther("10000"));
    await mintTx.wait();
    console.log("✅ Tokens minted");
    console.log("📝 Transaction:", mintTx.hash);
    
    console.log("\n🎉 REACTIVE NETWORK DEPLOYMENT COMPLETE!");
    console.log("=====================================");
    console.log("📍 Contract Addresses:");
    console.log("Asset Token:", assetAddress);
    console.log("Pool A (Aave):", poolAAddress);
    console.log("Pool B (Compound):", poolBAddress);
    console.log("Yield Monitor:", yieldMonitorAddress);
    console.log("Config Manager:", configManagerAddress);
    console.log("Main Vault:", vaultAddress);
    console.log("=====================================");
    
    console.log("\n📋 NEXT STEPS:");
    console.log("1. Add these addresses to your DApp frontend");
    console.log("2. Test deposit/withdrawal functionality");
    console.log("3. Trigger yield rate changes to test rebalancing");
    console.log("4. Monitor Reactive Network events");
    
    // Save deployment info
    const deploymentInfo = {
      network: (await ethers.provider.getNetwork()).name,
      chainId: (await ethers.provider.getNetwork()).chainId.toString(),
      deployer: deployer.address,
      contracts: {
        asset: assetAddress,
        poolA: poolAAddress,
        poolB: poolBAddress,
        yieldMonitor: yieldMonitorAddress,
        configManager: configManagerAddress,
        vault: vaultAddress
      },
      transactions: {
        assetDeployment: (await asset.deploymentTransaction()).hash,
        poolADeployment: (await poolA.deploymentTransaction()).hash,
        poolBDeployment: (await poolB.deploymentTransaction()).hash,
        yieldMonitorDeployment: (await yieldMonitor.deploymentTransaction()).hash,
        configManagerDeployment: (await configManager.deploymentTransaction()).hash,
        vaultDeployment: (await vault.deploymentTransaction()).hash,
        updateYieldMonitor: updateTx1.hash,
        updateConfigManager: updateTx2.hash,
        mintTokens: mintTx.hash
      },
      timestamp: new Date().toISOString()
    };
    
    require('fs').writeFileSync(
      './reactive-deployment.json',
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n💾 Deployment info saved to reactive-deployment.json");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
