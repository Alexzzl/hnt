


// import { Keypair } from '@helium/crypto'
import pkg from '@helium/crypto';
const { Keypair } = pkg;
import Address from '@helium/address';
// const { Address } = addr;
console.log(Address.default)
import bip39 from 'bip39';

import tx from '@helium/transactions'
const { Transaction, PaymentV1, PaymentV2 } = tx;
// import { PaymentV1, Transaction } from '@helium/transactions'
import cli from '@helium/http';
const { Client } = cli;


const mnemonic_str = bip39.generateMnemonic()
console.log(typeof mnemonic_str)
const mnemonic = mnemonic_str.split(" ")
console.log(mnemonic)
// initialize an owned keypair from a 12 word mnemonic
async function run() {
    const client = new Client()
    const vars = await client.vars.get()
    console.log(vars)
    Transaction.config(vars)

    // initialize an owned keypair from a 12 word mnemonic
    const bob = await Keypair.fromWords(mnemonic)

    // get the speculative nonce for the keypair
    const account = await client.accounts.get(bob.address.b58)

    // initialize an address from a b58 string
    const alice = Address.default.fromB58('148d8KTRcKA5JKPekBcKFd4KfvprvFRpjGtivhtmRmnZ8MFYnP3')
    const charlie = Address.default.fromB58('13JoEpkGQUd8bzn2BquFZe1CbmfzhL4cYpEohWH71yxy7cEY59Z')

    // construct a payment txn
    // const paymentTxn = new PaymentV1({
    //     payer: bob.address,
    //     payee: alice,
    //     amount: 10,
    //     nonce: account.speculativeNonce + 1,
    // })

    // construct a PaymentV2 txn
    const paymentTxn = new PaymentV2({
        payer: bob.address,
        payments: [
            {
                payee: alice,
                amount: 20,
            },
            {
                payee: charlie,
                amount: 10,
            },
        ],
        nonce: account.speculativeNonce + 1,
    })

    // an appropriate transaction fee is calculated at initialization
    console.log('transaction fee is:', paymentTxn.fee)

    // sign the payment txn with bob's keypair
    const signedPaymentTxn = await paymentTxn.sign({ payer: bob })

    // submit the serialized txn to the Blockchain HTTP API
    client.transactions.submit(signedPaymentTxn.toString())
    return paymentTxn.fee
}


run().then(result => {
    console.log(result)
})
