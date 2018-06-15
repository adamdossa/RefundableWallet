pragma solidity ^0.4.23;

import '../RefundableWallet.sol';

contract RefundableWalletMock is RefundableWallet {

  uint256 blockNumber;

  constructor(address _token, uint256 _dispersalLength) public payable
    RefundableWallet(_token, _dispersalLength)
  {
  }

  function getBlockNumber() public view returns(uint256) {
    return blockNumber;
  }

  function setBlockNumber(uint256 _blockNumber) public {
    blockNumber = _blockNumber;
  }

}
