'use strict';
const R = require('ramda');
const CryptoUtil = require('../util/cryptoUtil');
const Transaction = require('../trans');
const Transactions = require('./../trans/transactions');

class Block {
    toHash() {
        return CryptoUtil.hash(this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce + this.miner);
    }

    /**
     * genesis Block ;
     */
    static get genesis() {
        let genesisBlock = Block.fromJson({
            index: 0,
            previousHash: '0',
            timestamp: 1520006400,
            nonce: 0,
            miner: '',
            transactions: [
                Transaction.fromJson({
                    id: '63ec3ac02f822450039df13ddf7c3c0f19bab4acd4dc928c62fcd78d5ebc6dba',
                    hash: null,
                    type: 'regular',
                    data: {
                        inputs: [],
                        outputs: []
                    }
                })
            ]
        });
        return genesisBlock;
    }

    static fromJson(data) {
        let block = new Block();
        R.forEachObjIndexed((value, key) => {
            if (key === 'transactions' && value) {
                block[key] = Transactions.fromJson(value);
            } else {
                block[key] = value;
            }

        }, data);
        block.hash = block.toHash();
        return block;
    }
}

module.exports = Block;