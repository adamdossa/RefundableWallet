# RefundableWallet

Work in progress

## Specification
https://github.com/lukso-io/rico/blob/master/refundable.js

## Notes

In the specification, my reading says that at any time, the amount available for withdrawal is:  
`this.balance * (timeSinceLastWithdrawal / totalDispersalTime)`

Since users can impact the value of `this.balance` by refunding or buying tokens, this means that the wallet owner is incentivised to order their transactions relative to token holders (e.g. it is better to mine your transaction just after a purchase (`buy`) of tokens transaction has gone through, and conversely just before a `refund` of tokens goes through).

In this implementation I made the withdrawal rate constant and initialised it to the initial (and only) wallet deposit divided by the specified `dispersalLength` (number of blocks over which the deposit can be claimed).

This means it is possible to fully drain the contract before the `dispersalLength` has passed (if token holders choose to `refund` some of their tokens) but means there is no advantage to the wallet owner of ordering their transactions relative to others.
