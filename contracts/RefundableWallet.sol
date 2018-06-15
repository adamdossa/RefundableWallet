pragma solidity ^0.4.23;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/math/Math.sol';

contract RefundableWallet is Ownable {
  using SafeMath for uint256;

  ERC20 public token;

  //Number of token base units per ETH (WEI * WAD)
  uint256 public tokenRate;

  //Initial total supply of token
  uint256 public initialTotalSupply;

  //Block number of initial ETH deposit
  uint256 public startingBlock;

  //Number of blocks over which to disperse ETH
  uint256 public dispersalLength;

  //Initial amount of ETH deposited
  uint256 public deposit;

  //Disperse ETH
  uint256 public dispersal;

  //Accuracy for arithmetic (from DSMath Library)
  uint256 constant WAD = 10 ** 18;

  constructor(address _token, uint256 _dispersalLength) public payable {
    //Token should have finished minting
    token = ERC20(_token);
    initialTotalSupply = token.totalSupply();
    dispersalLength = _dispersalLength;
    deposit = address(this).balance;
    startingBlock = getBlockNumber();
    tokenRate = wdiv(initialTotalSupply, deposit);
  }

  function buy() payable public {
    require(msg.value > 0);
    uint256 tokenAmount = msg.value.mul(tokenRate).div(WAD);
    require(token.balanceOf(address(this)) > tokenAmount);
    require(token.transfer(msg.sender, tokenAmount));
  }

  function refund(uint256 _amount) public {
    uint256 refundAmount = calculateRefund(_amount);
    require(token.transferFrom(msg.sender, address(this), _amount));
    msg.sender.transfer(refundAmount);
  }

  function pullEther(uint256 _amount) public onlyOwner {
    require(getDispersableEther().sub(dispersal) >= _amount);
    dispersal = dispersal.add(_amount);
    msg.sender.transfer(_amount);
  }

  function calculateRefund(uint256 _amount) public view returns(uint256) {
    uint256 numerator = _amount.mul(getRefundableBalance());
    uint256 denominator = token.totalSupply().sub(token.balanceOf(address(this)));
    emit Log(numerator, denominator);
    emit Log(getRefundableBalance(), getRefundableBalance());
    return wdiv(numerator, denominator).div(WAD);
  }

  event Log(uint numerator, uint denominator);

  function getRefundableBalance() public view returns(uint256) {
    return address(this).balance.sub(getDispersableEther().sub(dispersal));
  }

  function getDispersableEther() public view returns(uint256) {
    return wmul(deposit, wdiv(getBlockNumber().sub(startingBlock), dispersalLength));
  }

  function wmul(uint256 _x, uint256 _y) internal pure returns(uint256) {
    return _x.mul(_y).add(WAD / 2) / WAD;
  }

  function wdiv(uint256 _x, uint256 _y) internal pure returns(uint256) {
    return _x.mul(WAD).add(_y / 2) / _y;
  }

  function getBlockNumber() public view returns(uint256) {
    return block.number;
  }

}
