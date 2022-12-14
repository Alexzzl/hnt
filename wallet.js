import { Keypair, Address } from '@helium/crypto'
import { PaymentV1, Transaction } from '@helium/transactions'
import { Client } from '@helium/http'

const client = new Client()

// the transactions library needs to be configured
// with the latest chain vars in order to calcluate fees
const vars = await client.vars.get()
Transaction.config(vars)

bip39 = require('bip39')
const mnemonic_str = bip39.generateMnemonic()
console.log(typeof mnemonic_str)
const mnemonic = mnemonic_str.split(" ")
// initialize an owned keypair from a 12 word mnemonic
const bob = await Keypair.fromWords(mnemonic)

// initialize an address from a b58 string
const alice = Address.fromB58('148d8KTRcKA5JKPekBcKFd4KfvprvFRpjGtivhtmRmnZ8MFYnP3')

// get the speculative nonce for the keypair
const account = await client.accounts.get(bob.address.b58)

// construct a payment txn
const paymentTxn = new PaymentV1({
  payer: bob.address,
  payee: alice,
  amount: 10,
  nonce: account.speculativeNonce + 1,
})

// an appropriate transaction fee is calculated at initialization
console.log('transaction fee is:', paymentTxn.fee)

// sign the payment txn with bob's keypair
const signedPaymentTxn = await paymentTxn.sign({ payer: bob })

// submit the serialized txn to the Blockchain HTTP API
client.transactions.submit(signedPaymentTxn.toString())