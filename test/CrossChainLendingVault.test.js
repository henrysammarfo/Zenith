const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox");

describe("CrossChainLendingVault", function () {
  let vault;
  let asset;
  let poolA;
  let poolB;
  let yieldMonitor;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy mock asset (using standard ERC20)
    const SimpleERC20 = await ethers.getContractFactory("SimpleERC20");
    asset = await SimpleERC20.deploy("Mock Token", "MTK", 18);
    await asset.waitForDeployment();
    
    // Mint initial supply to deployer (who is also the owner for this test)
        
    // Deploy mock lending pools
    const assetAddress = await asset.getAddress();
    const MockAavePool = await ethers.getContractFactory("MockAavePool");
    poolA = await MockAavePool.deploy(assetAddress);
    await poolA.waitForDeployment();
    const poolAAddress = await poolA.getAddress();

    const MockCompoundPool = await ethers.getContractFactory("MockCompoundPool");
    poolB = await MockCompoundPool.deploy(assetAddress);
    await poolB.waitForDeployment();
    const poolBAddress = await poolB.getAddress();

    // Deploy yield monitor
    const YieldMonitor = await ethers.getContractFactory("YieldMonitor");
    yieldMonitor = await YieldMonitor.deploy(
      poolAAddress,
      poolBAddress,
      assetAddress,
      ethers.ZeroAddress
    );
    await yieldMonitor.waitForDeployment();
    const yieldMonitorAddress = await yieldMonitor.getAddress();

    // Deploy vault
    const CrossChainLendingVault = await ethers.getContractFactory("CrossChainLendingVault");
    vault = await CrossChainLendingVault.deploy(
      assetAddress,
      poolAAddress,
      poolBAddress,
      yieldMonitorAddress
    );
    await vault.waitForDeployment();

    // Update yield monitor with vault address
    const vaultAddress = await vault.getAddress();
    await yieldMonitor.updateVaultAddress(vaultAddress);

    // Transfer and approve tokens for users
    await asset.transfer(user1.address, ethers.parseEther("1000"));
    await asset.transfer(user2.address, ethers.parseEther("1000"));
    await asset.connect(user1).approve(vaultAddress, ethers.parseEther("1000"));
    await asset.connect(user2).approve(vaultAddress, ethers.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("Should set correct initial values", async function () {
      expect(await vault.asset()).to.equal(await asset.getAddress());
      expect(await vault.poolA()).to.equal(await poolA.getAddress());
      expect(await vault.poolB()).to.equal(await poolB.getAddress());
      expect(await vault.yieldMonitor()).to.equal(await yieldMonitor.getAddress());
      expect(await vault.totalDeposits()).to.equal(0);
      expect(await vault.totalShares()).to.equal(0);
    });
  });

  describe("Deposits", function () {
    it("Should allow users to deposit", async function () {
      const depositAmount = ethers.parseEther("100");
      
      await expect(vault.connect(user1).deposit(depositAmount))
        .to.emit(vault, "Deposited")
        .withArgs(user1.address, depositAmount, depositAmount);
      
      expect(await vault.totalDeposits()).to.equal(depositAmount);
      expect(await vault.totalShares()).to.equal(depositAmount);
      expect(await vault.getUserShares(user1.address)).to.equal(depositAmount);
    });

    it("Should reject deposits below minimum", async function () {
      const smallAmount = ethers.parseEther("0.001");
      
      await expect(vault.connect(user1).deposit(smallAmount))
        .to.be.revertedWith("Vault: Amount below minimum");
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      const depositAmount = ethers.parseEther("100");
      await vault.connect(user1).deposit(depositAmount);
    });

    it("Should allow users to withdraw", async function () {
      const withdrawAmount = ethers.parseEther("50");
      
      await expect(vault.connect(user1).withdraw(withdrawAmount))
        .to.emit(vault, "Withdrawn")
        .withArgs(user1.address, withdrawAmount, withdrawAmount);
      
      expect(await vault.getUserShares(user1.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should reject withdrawals of insufficient shares", async function () {
      const excessAmount = ethers.parseEther("200");
      
      await expect(vault.connect(user1).withdraw(excessAmount))
        .to.be.revertedWith("Vault: Insufficient shares");
    });
  });

  describe("Yield Monitoring", function () {
    it("Should track yield rates correctly", async function () {
      const [poolA_Apy, poolB_Apy, difference] = await vault.getCurrentYieldData();

      expect(poolA_Apy).to.be.closeTo(500, 5);
      expect(poolB_Apy).to.be.closeTo(500, 5);
      expect(difference).to.be.closeTo(0, 5);
    });
  });

  describe("Rebalancing", function () {
    it("Should trigger rebalancing when yield difference exceeds threshold", async function () {
      // Create initial deposit
      const depositAmount = ethers.parseEther("100");
      await vault.connect(user1).deposit(depositAmount);

      // Set total allocated in YieldMonitor
      await yieldMonitor.setTotalAllocated(depositAmount);
      
      // Change Aave rate to 6%
      await poolA.setLiquidityRate(ethers.parseUnits("6", 25)); // 6% APY
      
      // Trigger yield check
      await yieldMonitor.checkYieldRates();
      
      // Verify rebalance was triggered (check events)
      const filter = yieldMonitor.filters.RebalanceTriggered();
      const events = await yieldMonitor.queryFilter(filter);
      expect(events.length).to.be.greaterThan(0);
    });
  });

  describe("Configuration", function () {
    it("Should allow owner to update configuration", async function () {
      const newThreshold = 75; // 0.75%
      
      await expect(vault.connect(owner).updateRebalanceThreshold(newThreshold))
        .to.emit(vault, "ConfigurationUpdated");
      
      expect(await vault.rebalanceThreshold()).to.equal(newThreshold);
    });

    it("Should reject configuration updates from non-owners", async function () {
      await expect(vault.connect(user1).updateRebalanceThreshold(75))
        .to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });
  });
});
