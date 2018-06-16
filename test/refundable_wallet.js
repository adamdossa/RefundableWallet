const assertFail = require("./helpers/assertFail");
const RefundableWallet = artifacts.require("./RefundableWalletMock.sol");
const Token = artifacts.require("./Token.sol");

contract('RefundableWallet', function (accounts) {

  var token;
  var wallet;

  // =========================================================================
  it("0. initialize token contract and fund refundable wallet", async () => {

    token = await Token.new({from: accounts[0]});
    console.log("Token Address: ", token.address);

    //Mint some tokens
    await token.mint(accounts[1], 300*10**18, {from: accounts[0]});
    await token.mint(accounts[2], 600*10**18, {from: accounts[0]});
    await token.mint(accounts[3], 900*10**18, {from: accounts[0]});

    //Create wallet contract
    wallet = await RefundableWallet.new(token.address, 1000, {from: accounts[0], value: 90*10**18});
    console.log("Refundable Wallet - Address: ", wallet.address);
    console.log("Refundable Wallet - Deposit: ", (await wallet.deposit()).toNumber());
    console.log("Refundable Wallet - Start Block: ", (await wallet.startingBlock()).toNumber());
    console.log("Refundable Wallet - Dispersal Length: ", (await wallet.dispersalLength()).toNumber());
    console.log("Refundable Wallet - Token Rate: ", (await wallet.tokenRate()).toNumber());

  });

  it("1. time 0 - full refund", async () => {
    await token.approve(wallet.address, 150*10**18, {from: accounts[1]});
    let initialBalance = await web3.eth.getBalance(accounts[1]);
    await wallet.refund(150*10**18, {from: accounts[1], gasPrice: 0});
    let finalBalance = await web3.eth.getBalance(accounts[1]);
    //accounts[1] should get (150 / 1800) * 90 = 7.5 ETH
    assert.equal(finalBalance.sub(initialBalance).toNumber(), 7.5 * 10**18);
  });

  it("2. time 100 - pull ether", async () => {
    await wallet.setBlockNumber(100);
    let initialBalance = await web3.eth.getBalance(accounts[0]);

    //Unable to pull from non-owner account
    await assertFail(async () => {
      await wallet.pullEther(9*10**18, {from: accounts[1], gasPrice: 0});
    });

    //Unable to pull more than allowance
    await assertFail(async () => {
      await wallet.pullEther(10*10**18, {from: accounts[0], gasPrice: 0});
    });

    //Pull a portion of dispersable ether
    await wallet.pullEther(4*10**18, {from: accounts[0], gasPrice: 0});

    //Still unable to pull more than allowance
    await assertFail(async () => {
      await wallet.pullEther(6*10**18, {from: accounts[0], gasPrice: 0});
    });

    //Pull remaining dispersed ether
    await wallet.pullEther(5*10**18, {from: accounts[0], gasPrice: 0});

    let finalBalance = await web3.eth.getBalance(accounts[0]);
    //accounts[0] should get (150 / 1800) * 90 = 7.5 ETH
    assert.equal(finalBalance.sub(initialBalance), 9 * 10**18);
  });

  it("3. time 200 - partial refund", async () => {
    await token.approve(wallet.address, 330*10**18, {from: accounts[2]});
    let initialBalance = await web3.eth.getBalance(accounts[2]);
    await wallet.refund(330*10**18, {from: accounts[2], gasPrice: 0});
    let finalBalance = await web3.eth.getBalance(accounts[2]);
    //accounts[1] should get (330 / 1650) * (90 - 16.5) = 14.7 ETH
    assert.equal(finalBalance.sub(initialBalance).toNumber(), 14.7 * 10**18);
  });

  it("4. time 500 - rebuy", async () => {
    //buy 20 tokens at a cost of 1 ETH
    let initialWalletBalance = await token.balanceOf(wallet.address);
    let initialBuyerBalance = await token.balanceOf(accounts[3]);
    await wallet.buy({from: accounts[3], value: 1*10**18});
    let finalWalletBalance = await token.balanceOf(wallet.address);
    let finalBuyerBalance = await token.balanceOf(accounts[3]);
    assert.equal(initialWalletBalance.sub(finalWalletBalance).toNumber(), 20*10**18);
    assert.equal(finalBuyerBalance.sub(initialBuyerBalance).toNumber(), 20*10**18);
  });


});
