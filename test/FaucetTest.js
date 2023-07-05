const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require('chai');
const { ethers } = require("hardhat");

describe('Faucet',function(){
    async function deployContractAndSetVariables() {
        const Faucet = await ethers.getContractFactory('Faucet');
        const faucet = await Faucet.deploy();

        const [owner, signer2, signer3] = await ethers.getSigners();

        await signer2.sendTransaction({to: faucet.target, value:ethers.parseEther("1")});

        let withdrawAmount = ethers.parseUnits('1','ether');
        console.log("Signer 1 address: ",owner.address);
        return {faucet,owner,withdrawAmount,signer2, signer3};
    }

    it('should deploy and set the owner correctly', async function (){
        const {faucet, owner} = await loadFixture(deployContractAndSetVariables);
        expect(await faucet.owner()).to.equal(owner.address);
    });
    it('should not allow withdrawals above .1 ETH at a time',async function(){
        const {faucet,withdrawAmount} = await loadFixture(deployContractAndSetVariables);
        await expect( faucet.withdraw(withdrawAmount)).to.be.reverted;
    });
    it("Should fail WithdrawAll since withdrawer is not the owner",async function(){
        const {faucet,signer3}= await loadFixture(deployContractAndSetVariables);
        await expect(faucet.connect(signer3).withdrawAll()).to.be.revertedWith("Not Authorized");
    })
    it("should succeed to withdraw if amount <= .1 Eth", async function(){
        const {faucet,signer3} = await loadFixture(deployContractAndSetVariables);
        const prevBalance = await signer3.provider.getBalance(signer3.address);
        await faucet.connect(signer3).withdraw(ethers.parseEther('.01'));
        const curBalance = await signer3.provider.getBalance(signer3.address);
        expect(curBalance).to.be.greaterThan(prevBalance);
    })
    it("Should succeed WithdrawAll since msg.sender is the owner", async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);
    const prevBalance = await ethers.provider.getBalance(owner.address)

    await faucet.withdrawAll()
    
    const currentBalance = await ethers.provider.getBalance(owner.address)
    const faucetBalance = await ethers.provider.getBalance(faucet.target)

    expect(faucetBalance).to.equal(0);
    
    describe("WithdrawAll", function(){
      it("should transfer the balance from the contract to the owner", async function () {
        expect(prevBalance).to.be.lt(currentBalance);
    })
    }) 
  });
    it("should destroy Faucet since mg.sender is owner", async function(){
        const {faucet} = await loadFixture(deployContractAndSetVariables);
        await faucet.destroyFaucet();
        expect(await ethers.provider.getCode(faucet.target)).to.be.equal("0x");
    })
    it("Should not destroy Faucet since msg.sender is not the owner", async function () {
    const { faucet, signer3 } = await loadFixture(deployContractAndSetVariables);

    
    
    await expect(faucet.connect(signer3).destroyFaucet()).to.be.revertedWith("Not Authorized");
 
  });

});