const EthergotchiGlobal = artifacts.require("EthergotchiGlobal");

module.exports = function (deployer) {
  deployer.deploy(EthergotchiGlobal);
};
