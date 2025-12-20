const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ConfigManager", function () {
  let configManager;
  let owner;
  let authorizedUser;
  let unauthorizedUser;

  beforeEach(async function () {
    [owner, authorizedUser, unauthorizedUser] = await ethers.getSigners();
    
    const ConfigManager = await ethers.getContractFactory("ConfigManager");
    configManager = await ConfigManager.deploy(ethers.ZeroAddress);
    await configManager.waitForDeployment();
    
    // Authorize user
    await configManager.authorizeUser(authorizedUser.address);
  });

  describe("Deployment", function () {
    it("Should set correct initial configuration", async function () {
      const config = await configManager.getConfig();
      
      expect(config.rebalanceThreshold).to.equal(50); // 0.5%
      expect(config.rebalancePercentage).to.equal(1000); // 10%
      expect(config.maxAllocationPercentage).to.equal(9000); // 90%
      expect(config.minDepositAmount).to.equal(ethers.parseUnits("0.01", 18));
      expect(config.emergencyWithdrawFee).to.equal(100); // 1%
      expect(config.autoRebalanceEnabled).to.equal(true);
      expect(config.paused).to.equal(false);
    });
  });

  describe("Configuration Updates", function () {
    it("Should allow owner to update rebalance threshold", async function () {
      const newThreshold = 75; // 0.75%
      
      await expect(configManager.connect(owner).updateRebalanceThreshold(newThreshold))
        .to.emit(configManager, "ConfigUpdated");
      
      const config = await configManager.getConfig();
      expect(config.rebalanceThreshold).to.equal(newThreshold);
    });

    it("Should reject threshold update above maximum", async function () {
      await expect(configManager.connect(owner).updateRebalanceThreshold(600)) // 6%
        .to.be.revertedWith("ConfigManager: Threshold too high");
    });

    it("Should allow authorized user to update configuration", async function () {
      const newPercentage = 1500; // 15%
      
      await expect(configManager.connect(authorizedUser).updateRebalancePercentage(newPercentage))
        .to.emit(configManager, "ConfigUpdated");
      
      const config = await configManager.getConfig();
      expect(config.rebalancePercentage).to.equal(newPercentage);
    });

    it("Should reject unauthorized configuration updates", async function () {
      await expect(configManager.connect(unauthorizedUser).updateRebalanceThreshold(75))
        .to.be.revertedWith("ConfigManager: Not authorized");
    });
  });

  describe("User Authorization", function () {
    it("Should allow owner to authorize users", async function () {
      const newUser = ethers.Wallet.createRandom().address;
      
      await expect(configManager.connect(owner).authorizeUser(newUser))
        .to.emit(configManager, "UserAuthorized");
      
      expect(await configManager.isAuthorized(newUser)).to.equal(true);
    });

    it("Should allow owner to deauthorize users", async function () {
      await expect(configManager.connect(owner).deauthorizeUser(authorizedUser.address))
        .to.emit(configManager, "UserDeauthorized");
      
      expect(await configManager.isAuthorized(authorizedUser.address)).to.equal(false);
    });
  });

  describe("Pause/Resume", function () {
    it("Should allow pausing and resuming", async function () {
      // Pause
      await expect(configManager.connect(owner).pause())
        .to.emit(configManager, "ConfigUpdatedBool").withArgs("paused", false, true);
      
      let config = await configManager.getConfig();
      expect(config.paused).to.equal(true);
      
      // Resume
      await expect(configManager.connect(owner).unpause())
        .to.emit(configManager, "ConfigUpdatedBool").withArgs("paused", true, false);
      
      config = await configManager.getConfig();
      expect(config.paused).to.equal(false);
    });

    it("Should reject pause when already paused", async function () {
      await configManager.connect(owner).pause();
      
      await expect(configManager.connect(owner).pause())
        .to.be.revertedWith("ConfigManager: Already paused");
    });
  });
});
