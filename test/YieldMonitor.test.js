const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox");

describe("YieldMonitor", function () {
  let yieldMonitor;
  let poolA;
  let poolB;
  let asset;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    // Deploy mock asset (using standard ERC20)
    const SimpleERC20 = await ethers.getContractFactory("SimpleERC20");
    asset = await SimpleERC20.deploy("Mock Token", "MTK", 18);
    await asset.waitForDeployment();
    const assetAddress = await asset.getAddress();

    // Deploy mock lending pools
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
  });

  describe("Deployment", function () {
    it("Should set correct initial values", async function () {
      expect(await yieldMonitor.poolA()).to.equal(await poolA.getAddress());
      expect(await yieldMonitor.poolB()).to.equal(await poolB.getAddress());
      expect(await yieldMonitor.asset()).to.equal(await asset.getAddress());
      expect(await yieldMonitor.isPaused()).to.equal(false);
    });
  });

  describe("Yield Rate Calculation", function () {
    it("Should calculate correct APY for both pools", async function () {
      const [poolA_Apy, poolB_Apy, difference] = await yieldMonitor.getCurrentYieldData();

      expect(poolA_Apy).to.be.closeTo(500, 5);
      expect(poolB_Apy).to.be.closeTo(500, 5);
      expect(difference).to.be.closeTo(0, 5);
    });
  });

  describe("Yield Check and Rebalancing", function () {
    it("Should trigger rebalancing when yield difference exceeds threshold", async function () {
      // Change Aave rate to 6.5% (above threshold)
      await poolA.setLiquidityRate(ethers.parseUnits("6", 25));

      // Check yields
      const [poolA_Apy, poolB_Apy, difference] = await yieldMonitor.getCurrentYieldData();
      expect(poolA_Apy).to.be.closeTo(600, 5);
      expect(poolB_Apy).to.be.closeTo(500, 5);
      expect(difference).to.be.closeTo(100, 5);

      // Trigger yield check
      await yieldMonitor.checkYieldRates();

      // Verify last update values
      expect(await yieldMonitor.lastPoolA_Apy()).to.be.closeTo(600, 5);
      expect(await yieldMonitor.lastPoolB_Apy()).to.be.closeTo(500, 5);
    });

    it("Should not trigger rebalancing below threshold", async function () {
      // Change Aave rate to 5.1% (0.1% difference)
      await poolA.setLiquidityRate(ethers.parseUnits("5.1", 25));

      // Trigger yield check
      await yieldMonitor.checkYieldRates();

      // Verify no rebalance was triggered
      const [poolA_Apy, poolB_Apy, difference] = await yieldMonitor.getCurrentYieldData();
      expect(difference).to.be.closeTo(10, 5);
      expect(difference).to.be.lessThan(50);
    });
  });

  describe("Pause/Resume", function () {
    it("Should allow pausing and resuming", async function () {
      // Pause monitoring
      await yieldMonitor.ownerPause(true);
      expect(await yieldMonitor.isPaused()).to.equal(true);

      // Should reject yield checks while paused
      await expect(yieldMonitor.checkYieldRates())
        .to.be.revertedWith("YieldMonitor: Monitoring is paused");

      // Resume monitoring
      await yieldMonitor.ownerPause(false);
      expect(await yieldMonitor.isPaused()).to.equal(false);

      // Should work after resume
      await yieldMonitor.checkYieldRates();
    });
  });

  describe("Configuration", function () {
    it("Should allow updating vault address", async function () {
      const newVault = ethers.Wallet.createRandom().address;
      
      await yieldMonitor.updateVaultAddress(newVault);
      expect(await yieldMonitor.vaultAddress()).to.equal(newVault);
    });
  });
});
