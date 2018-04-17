var MyToken = artifacts.require('./contracts/MyToken.sol');

module.exports = function(deployer) {
  // Use deployer to state migration tasks.
  deployer.deploy(MyToken);
};
