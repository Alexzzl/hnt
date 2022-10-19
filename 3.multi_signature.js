import pkg from '@helium/crypto';
const { Keypair, MultisigSignature, KeySignature } = pkg;
import Address from '@helium/address'
import addr from '@helium/address';
const { MultisigAddress } = addr;
import bip39 from 'bip39';

import tx from '@helium/transactions'
const { Transaction, PaymentV1, PaymentV2 } = tx;
import cli from '@helium/http';
const { Client } = cli;


const mnemonic_str = bip39.generateMnemonic()
// console.log(typeof mnemonic_str)
const mnemonic = mnemonic_str.split(" ")
// console.log(mnemonic)
// initialize an owned keypair from a 12 word mnemonic
async function run() {
    const client = new Client()
    const vars = await client.vars.get()
    // console.log(vars)
    Transaction.config(vars)

    // initialize an owned keypair from a 12 word mnemonic
    const bob = await Keypair.fromWords(mnemonic)

    // get the speculative nonce for the keypair
    const account = await client.accounts.get(bob.address.b58)

    // initialize an address from a b58 string
    const aliceAddress = Address.default.fromB58('148d8KTRcKA5JKPekBcKFd4KfvprvFRpjGtivhtmRmnZ8MFYnP3')

    // initialize multisig address with the full set of addreses and required number of signatures
    const multisigAddress = await MultisigAddress.create([bob.address, aliceAddress], 1)

    // create random payee address
    const payeeAddress = Address.default.fromB58('13dSybmfNofup3rBGat2poGfuab4BhYZNKUJFczSi4jcwLmoXvD')



    // construct a payment txn
    // const paymentTxn = new PaymentV1({
    //     payer: bob.address,
    //     payee: alice,
    //     amount: 10,
    //     nonce: account.speculativeNonce + 1,
    // })

    // construct a PaymentV2 txn
    const paymentTxn = new PaymentV2({
        payer: multisigAddress,
        payments: [
            {
                payee: payeeAddress,
                amount: 20,
            },
        ],
        nonce: account.speculativeNonce + 1,
    })

    // Create signatures payload, a map of address to signature, and finally a KeySignature list
    const bobSignature = (await paymentTxn.sign({ payer: bob })).signature || new Uint8Array()
    // console.log(bobSignature)
    const signatureMap = new Map([[bob.address, await bob.sign(paymentTxn.serialize())]])
    // console.log(signatureMap)
    const signatures = KeySignature.fromMap([bob.address, aliceAddress], signatureMap)
    console.log(signatures)
    // Construct multisig signature using the address, the full set of all addresses, and the required signatures
    const multisigSig = new MultisigSignature([bob.address, aliceAddress], signatures)

    // Update signature on payment trasnaction
    await paymentTxn.sign({ payer: multisigSig })

    // submit the serialized txn to the Blockchain HTTP API
    client.transactions.submit(paymentTxn.toString())

    return paymentTxn.toString()
}


run().then(result => {
    console.log(result)
})
