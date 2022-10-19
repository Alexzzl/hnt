


import pkg from '@helium/crypto';
const { Keypair } = pkg;
import Address from '@helium/address';
console.log(Address.default)
import bip39 from 'bip39';

import tx from '@helium/transactions'
const { Transaction, PaymentV1, PaymentV2 } = tx;
import cli from '@helium/http';
const { Client } = cli;

import currency from '@helium/currency';
const { Balance, CurrencyType } = currency;


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


    // construct a payment txn
    // const paymentTxn = new PaymentV1({
    //     payer: bob.address,
    //     payee: alice,
    //     amount: 10,
    //     nonce: account.speculativeNonce + 1,
    // })

    // construct a PaymentV2 txn for the purpose
    // of calculating the fee
    const paymentTxnForFee = new PaymentV2({
        payer: bob.address,
        payments: [
            {
                payee: alice,
                amount: account.balance.integerBalance,
            }
        ],
        nonce: account.speculativeNonce + 1,
    })

    // calculate max sendable amount
    const feeInDC = new Balance(paymentTxnForFee.fee, CurrencyType.dataCredit)
    const oracle = await client.oracle.getCurrentPrice()
    const feeInHNT = feeInDC.toNetworkTokens(oracle.price)
    const amountToSend = account.balance.minus(feeInHNT).integerBalance

    // construct a PaymentV2 txn to sign
    const paymentTxn = new PaymentV2({
        payer: bob.address,
        payments: [
            {
                payee: alice,
                amount: amountToSend,
            },
        ],
        nonce: account.speculativeNonce + 1,
    })
    // sign the payment txn with bob's keypair
    const signedPaymentTxn = await paymentTxn.sign({ payer: bob })

    // submit the serialized txn to the Blockchain HTTP API
    client.transactions.submit(signedPaymentTxn.toString())
    return signedPaymentTxn.toString()
}


run().then(result => {
    console.log(result)
})
