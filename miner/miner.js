/*
 Some ideas and codes come from conradoqg's naivecoin project
 https://github.com/conradoqg/naivecoin
 Thank you very much, conradoqg.
 this method has been already given up from 2018-04-08. We will usd dpos method
 */
'use strict';
const R = require('ramda');
const Block = require('../block/block');
const Config = require('../ecoeum-config');
const UUID = require('node-uuid');
const CryptoUtil = require('../util/cryptoUtil');
const moment = require('moment');

class Miner {
    constructor(blockchain) {
        this.blockchain = blockchain;
    }

    mine(rewardAddr, feeAddr) {
        if(!this.blockchain.isLoadFromDb)
        {
            console.log("loading data from db is not finish,miner can't work!");
            return;
        }

        let nextBlock = Miner.generateNextBlock(rewardAddr, feeAddr, this.blockchain);
        console.log("---------------------do proveWorkFor------------------");
        console.log("---------------------new block begin package tranactions------------------");
        const transactionList = R.pipe(
            R.countBy(R.prop('type')),
            R.toString,
            R.replace('{', ''),
            R.replace('}', ''),
            R.replace(/"/g, '')
        )(nextBlock.transactions);

        console.info(`Mining a new block contain ${nextBlock.transactions.length} (${transactionList}) transactions`);
        this.blockchain.newBlock(nextBlock);   //add and broadcast block
    }


    static generateNextBlock(rewardAddr, feeAddr, blockchain) {
        const previousBlock = blockchain.getLastBlock();
        const index = previousBlock.index + 1;
        const previousHash = previousBlock.hash;
        const timestamp = Number(moment().format('X'));
        const blocks = blockchain.getAllBlocks();
        const candidateTransactions = blockchain.transactions;
        let miner = '';
        if (rewardAddr != null) {
            miner = rewardAddr;
        }

        const transactionsInBlocks = R.flatten(R.map(R.prop('transactions'), blocks));
        const inputTransactionsInTransaction = R.compose(R.flatten, R.map(R.compose(R.prop('inputs'), R.prop('data'))));

        // Select transactions that can be mined
        let rejectedTransactions = [];
        let selectedTransactions = [];

        R.forEach((transaction) => {
            // Check if any of the inputs is found in the selectedTransactions or in the blockchain
            let transactionInputFoundAnywhere = R.map((input) => {
                let findInputTransactionInTransactionList = R.find(
                    R.whereEq({
                        'transaction': input.transaction,
                        'index': input.index
                    }));

                // Find the candidate transaction in the selected transaction list (avoiding double spending)
                let wasItFoundInSelectedTransactions = R.not(R.isNil(findInputTransactionInTransactionList(inputTransactionsInTransaction(selectedTransactions))));

                // Find the candidate transaction in the blockchain (avoiding mining invalid transactions)
                let wasItFoundInBlocks = R.not(R.isNil(findInputTransactionInTransactionList(inputTransactionsInTransaction(transactionsInBlocks))));

                return wasItFoundInSelectedTransactions || wasItFoundInBlocks;
            }, transaction.data.inputs);

            // If no input was found, add the transaction to the transaction list to be mined
            if (R.all(R.equals(false), transactionInputFoundAnywhere)) {
                selectedTransactions.push(transaction);
            } else {
                rejectedTransactions.push(transaction);
            }
        }, candidateTransactions);

        console.info(`Selected ${selectedTransactions.length} candidate transactions contain ${rejectedTransactions.length} being rejected.`);

        // Get the first two avaliable transactions, if there aren't TRANSACTIONS_PER_BLOCK, it's empty
        let transactions = R.defaultTo([], R.take(Config.TRANSACTIONS_PER_BLOCK, selectedTransactions));

        // Add fee transaction (1 satoshi per transaction)
        if (transactions.length > 0) {
            let feeTransaction = Block.fromJson({
                id: CryptoUtil.randomId(),
                hash: null,
                type: 'fee',
                data: {
                    inputs: [],
                    outputs: [
                        {
                            amount: Config.FEE_PER_TRANSACTION * transactions.length, // satoshis format
                            address: feeAddr, // INFO: Usually here is a locking script (to check who and when this transaction output can be used), in this case it's a simple destination address
                        }
                    ]
                }
            });

            transactions.push(feeTransaction);
        }

        // Add reward transaction
        if (rewardAddr != null) {
            let rewardTransaction = Block.fromJson({
                id: CryptoUtil.randomId(),
                hash: null,
                type: 'reward',
                data: {
                    inputs: [],
                    outputs: [
                        {
                            amount: Config.MINING_REWARD,
                            address: rewardAddr,
                        }
                    ]
                }
            });

            transactions.push(rewardTransaction);
        }

        return Block.fromJson({
            index,
            nonce: 0,
            previousHash,
            timestamp,
            transactions,
            miner
        });
    }
}

module.exports = Miner;
