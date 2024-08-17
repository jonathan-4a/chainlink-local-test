import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { assert } from "chai";
import { ethers } from "hardhat";

describe("Sender and Receiver", function () {
  // Define a chain selector for the test scenario.
  const chainSelector = "16015286601757825753";
  async function deployFixture() {
    // Get signers, with the first one typically being the deployer.
    const [owner, alice] = await ethers.getSigners();

    const CCIPLocalSimulator = await ethers.getContractFactory(
      "CCIPLocalSimulator"
    );
    const CrossChainNameServiceRegister = await ethers.getContractFactory(
      "CrossChainNameServiceRegister"
    );
    const CrossChainNameServiceReceiver = await ethers.getContractFactory(
      "CrossChainNameServiceReceiver"
    );
    const CrossChainNameServiceLookup = await ethers.getContractFactory(
      "CrossChainNameServiceLookup"
    );

    // Deploy the contract.
    const ccipLocalSimulator = await CCIPLocalSimulator.deploy();
    const routerAddress = await ccipLocalSimulator.configuration();
    const crossChainNameServiceLookup =
      await CrossChainNameServiceLookup.deploy();
    const crossChainNameServiceReceiver =
      await CrossChainNameServiceReceiver.deploy(
        routerAddress[1],
        crossChainNameServiceLookup.getAddress(),
        routerAddress[0]
      );

    const crossChainNameServiceRegister =
      await CrossChainNameServiceRegister.deploy(
        routerAddress[1],
        crossChainNameServiceLookup.getAddress()
      );

    await crossChainNameServiceRegister.enableChain(
      routerAddress[0],
      crossChainNameServiceReceiver.getAddress(),
      1e8
    );

    await crossChainNameServiceLookup.setCrossChainNameServiceAddress(
      crossChainNameServiceRegister.getAddress()
    );
    await crossChainNameServiceLookup.setCrossChainNameServiceAddress(
      crossChainNameServiceReceiver.getAddress()
    );

    console.log({ alice });

    await crossChainNameServiceRegister.register("alice.ccns");

    const actualAddress = await crossChainNameServiceLookup.lookup(
      "alice.ccns"
    );


    assert.equal( 
      actualAddress,
      alice.address,
      "Alice's address is not correct"
    );

    return {
      owner,
      ccipLocalSimulator,
      crossChainNameServiceLookup,
      crossChainNameServiceReceiver,
      crossChainNameServiceRegister,
    };
  }

  it("Should get Alice’s EOA address", async () => {
    const { owner } = await loadFixture(deployFixture);
  });
});
