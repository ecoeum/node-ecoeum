'use strict';

const R = require('ramda');
const CryptoUtil = require('../util/cryptoUtil');
const AppError = require('../util/appError');
const CryptoEdDSAUtil = require('../util/cryptoEdDSAUtil');
const HTTPError = require('../util/httpError');
const TransType = require('./transcation_types')

class Transaction {
    constructor() {
        this.id = null;
        this.hash = null;
        this.type = null;
        this.data = {
            inputs: [],
            outputs: []
        },
        this.coinRate = '';  //token:main coin
        this.coinName = ''; //token name
        this.content = '';  //save other content
    }

    toHash() {
        return CryptoUtil.hash(this.id + this.type + JSON.stringify(this.data)+this.coinRate+this.coinName+this.content);
    }

    /**
     *  Transcation chec ;
     *  step one:Verify that the hash in the Transfer matches my hash result ;
     *  step two:Verify that the input signature hash in each Transfer is consistent ;
     */
    check() {
        //console.log(this.hash,this.toHash());
        if (this.hash != this.toHash()) {
            throw new AppError(`Invalid transaction hash '${this.hash}'`, this);
        }

        R.map((input) => {
            const inputHash = CryptoUtil.hash({
                transaction: input.transaction,
                index: input.index,
                address: input.address
            });
            if (!CryptoEdDSAUtil.verifySignature(input.address, input.signature, inputHash)) {
                console.error(`Invalid transaction input signature '${JSON.stringify(input)}'`);
                throw new AppError(`Invalid transaction input signature '${JSON.stringify(input)}'`, input);
            }
        }, this.data.inputs || []);
        return true;
    }

    static fromJson(data) {
        let transaction = new Transaction();
        R.forEachObjIndexed((value, key) => {
            transaction[key] = value;
        }, data)
        transaction.hash = transaction.toHash();
        return transaction;
    }

    async newTrans(transData) {
        const requestTransaction = Transaction.fromJson(transData);
        if (requestTransaction.hash != transData.hash) {
            throw new HTTPError(409, `Transaction '${requestTransaction.id}' data may be modified`);
        }
        //if Exist on current transcationList show Error;
        let transactionFound = global.blockchain.getTransactionById(requestTransaction.id);
        if (transactionFound != null) throw new HTTPError(409, `Transaction '${requestTransaction.id}' already exists`);
        try {
            await global.blockchain.addTransaction(requestTransaction);
        } catch (ex) {
            console.log(ex.message.green, ex instanceof AppError)
            if (ex instanceof AppError) throw new HTTPError(400, ex.message, requestTransaction, ex);
            else throw ex;
        }
        return transData;
    }

}

module.exports = Transaction;