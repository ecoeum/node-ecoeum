/*
 Some ideas and codes come from conradoqg's naivecoin project
 https://github.com/conradoqg/naivecoin
 Thank you very much, conradoqg.
 */
'use strict';
const EventEmitter = require('events');
const utils = require('../util');
const R = require('ramda');
const Transaction = require('../trans');
const Block = require('./block');
const Config = require('../ecoeum-config.json');
const request = require('co-request');
const async = require('async');
const AppError = require('../util/appError');
const ExtendedError = require('../util/extendedError');

class Chain {
    constructor(db) {
        this.db = db;
        this.blocks = [];
        this.lastBlock = undefined;
        this.emitter = new EventEmitter();
        this.transactions = [];
        this.initChain();
        this.isLoadFromDb=false;   //load data from db sign
        //defalut 0 un sync  1 syncing  2 sync finsh -1 ansync failed ;
        this.isSync = 0;
        // this.initTrans();

    }

    initTrans() {
        if (this.transactions.length == 0) {
            const all = this.db.queryAll('trans');
            all.then((data) => {
                R.map((row) => {
                    let trans = row.doc;
                    delete trans['_id'];
                    delete trans['_rev'];
                    this.transactions.push(trans);
                }, data.data.rows);
            }).catch(error => {

            })
        }
    }

    /**
     * init BlockChain
     */
    loadLastBlock() {
        const body = {"selector": {"index": {"$gt": 0}}, "fields": [], "sort": [{"index": "desc"}], "limit": 1}
        return this.db.request('block', 'POST', '_find', body);
    }

    initChain() {
        // when start app we must get All block from db;
        // sometimes we must wait create table;
        setTimeout(() => {
            this.initAllBlockFromDb();
        }, 500);

    }

    initAllBlockFromDb() {
        console.log("load data begining..............");
        this.db.findAll('block').then((data) => {
            let rows = [];
            data.forEach(item => {
                let row = item.doc;;
                rows.push(row);
            })
            var isEven = item => item._id.indexOf('_design') == -1;
            let _rows = R.filter(isEven, rows);

            rows.forEach(item => {
                delete item['_id'];
                delete item['_rev'];
            })

            //Order By Desc；
            this.blocks = R.sort(R.ascend(R.path(['index'])))(_rows)

            if (this.blocks.length == 0) {
                this.blocks.push(Block.genesis);

                this.db.insert('block', Block.genesis);
            }
            this.isLoadFromDb=true;  //load data from db finish
            console.log("load data finishing..............");
        }).catch(err => {
            console.log('find db Error', err);
        })
    }

    async queryBlock(limit, bookmark) {
        let data = await this.db.queryBlock(limit, bookmark);
        R.map(x => {
            delete x._id;
            delete x._rev;
        })(data.docs);
        return data;
    }


    createBlock(remark) {
        var lastIndex = this.blocks.length - 1;
        var currentIndex = this.blocks.length;
        var currentTimestamp = new Date().getTime();
        var prevHash = this.blocks[lastIndex].currentHash;
        var currentHash = utils.getHash(currentIndex + currentTimestamp + prevHash + remark);
        var currentBlock = new Block(currentIndex, currentTimestamp, currentHash, prevHash, remark);
        this.blocks.push(currentBlock);
        return currentBlock;
    }


    //current miner commit
    newBlock(newBlock) {
        // It only adds the block if it's valid (we need to compare to the previous one)
        if (this.checkBlock(newBlock, this.getLastBlock())) {
            this.blocks.push(newBlock);
            //this.blocksDb.write(this.blocks);
            this.db.insert('block', newBlock);
            // After adding the block it removes the transactions of this block from the list of pending transactions
            this.removeBlockTransactionsFromTransactions(newBlock);
            //console.info(`Block added: ${JSON.stringify(newBlock)}`);
            this.broadcastBlock(newBlock);
            return newBlock;
        }
    }

    removeBlockTransactionsFromTransactions(newBlock) {
        this.transactions = R.reject((transaction) => {
            return R.find(R.propEq('id', transaction.id), newBlock.transactions);
        }, this.transactions);
        //this.transactionsDb.write(this.transactions);
    }

    //other miner send
    checkBlock(newBlock, previousBlock, referenceBlockchain = this.blocks) {
        /*
         check block
         Persist Block
         */


        const blockHash = newBlock.toHash();

        if (Number(previousBlock.index) + 1 !== Number(newBlock.index)) { // Check if the block is the last one
            console.error(`Invalid index: expected '${previousBlock.index + 1}' got '${newBlock.index}'`);
            throw new ExtendedError(`Invalid index: expected '${previousBlock.index + 1}' got '${newBlock.index}'`);
        } else if (previousBlock.hash !== newBlock.previousHash) { // Check if the previous block is correct
            console.error(`Invalid previoushash: expected '${previousBlock.hash}' got '${newBlock.previousHash}'`);
            throw new ExtendedError(`Invalid previoushash: expected '${previousBlock.hash}' got '${newBlock.previousHash}'`);
        } else if (blockHash !== newBlock.hash) { // Check if the hash is correct
            console.error(`Invalid hash: expected '${blockHash}' got '${newBlock.hash}'`);
            throw new ExtendedError(`Invalid hash: expected '${blockHash}' got '${newBlock.hash}'`);
        }

        // INFO: Here it would need to check if the block follows some expectation regarging the minimal number of transactions, value or data size to avoid empty blocks being mined.

        // For each transaction in this block, check if it is valid
        R.forEach(this.checkTransaction.bind(this), newBlock.transactions, referenceBlockchain);

         // Check if the sum of output transactions are equal the sum of input transactions + MINING_REWARD (representing the reward for the block miner)
         let sumOfInputsAmount = R.sum(R.flatten(R.map(R.compose(R.map(R.prop('amount')), R.prop('inputs'), R.prop('data')), newBlock.transactions))) + Config.MINING_REWARD;
         let sumOfOutputsAmount = R.sum(R.flatten(R.map(R.compose(R.map(R.prop('amount')), R.prop('outputs'), R.prop('data')), newBlock.transactions)));

         let isInputsAmountGreaterOrEqualThanOutputsAmount = R.gte(sumOfInputsAmount, sumOfOutputsAmount);

         if (!isInputsAmountGreaterOrEqualThanOutputsAmount) {
             console.error(`Invalid block balance: inputs sum '${sumOfInputsAmount}', outputs sum '${sumOfOutputsAmount}'`);
             throw new ExtendedError(`Invalid block balance: inputs sum '${sumOfInputsAmount}', outputs sum '${sumOfOutputsAmount}'`, { sumOfInputsAmount, sumOfOutputsAmount });
         }

         // Check if there is double spending
         let listOfTransactionIndexInputs = R.flatten(R.map(R.compose(R.map(R.compose(R.join('|'), R.props(['transaction', 'index']))), R.prop('inputs'), R.prop('data')), newBlock.transactions));
         let doubleSpendingList = R.filter((x) => x >= 2, R.map(R.length, R.groupBy(x => x)(listOfTransactionIndexInputs)));

         if (R.keys(doubleSpendingList).length) {
             console.error(`There are unspent output transactions being used more than once: unspent output transaction: '${R.keys(doubleSpendingList).join(', ')}'`);
             throw new ExtendedError(`There are unspent output transactions being used more than once: unspent output transaction: '${R.keys(doubleSpendingList).join(', ')}'`);
         }

        // Check if there is only 1 fee transaction and 1 reward transaction;
        let transactionsByType = R.countBy(R.prop('type'), newBlock.transactions);
        if (transactionsByType.fee && transactionsByType.fee > 1) {
            console.error(`Invalid fee transaction count: expected '1' got '${transactionsByType.fee}'`);
            throw new ExtendedError(`Invalid fee transaction count: expected '1' got '${transactionsByType.fee}'`);
        }

        if (transactionsByType.reward && transactionsByType.reward > 1) {
            console.error(`Invalid reward transaction count: expected '1' got '${transactionsByType.reward}'`);
            throw new ExtendedError(`Invalid reward transaction count: expected '1' got '${transactionsByType.reward}'`);
        }

        return true;
    }

    getBlockHeight() {
        return this.blocks.length - 1;
    }

    PersistBlock(block) {

    }

    getAllBlocks() {
        return this.blocks;
    }


    //get last block
    getLastBlock() {
        return R.last(this.blocks);
    }


    /**
     * when our block index < others peer block ,then add others peer last block to my chain
     */
    addBlock(newBlock,broadcastBlock=true) {
        console.log("addBlock");
        if (this.checkBlock(newBlock, this.getLastBlock())) {
            this.blocks.push(newBlock);
            this.db.insert('block', newBlock);
            // After adding the block it removes the transactions of this block from the list of pending transactions
            this.removeBlockTransactionsFromTransactions(newBlock);

            console.info(`Block added: ${newBlock.hash}`);
            if(broadcastBlock)  this.emitter.emit('blockAdded', newBlock);
            return newBlock;
        }
    }


    checkChain(blockchainToValidate) {
        console.log("checkChain begin....");
        // Check if the genesis block is the same
        if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(Block.genesis)) {
            console.error('Genesis blocks aren\'t the same');
            throw new ExtendedError('Genesis blocks aren\'t the same');
        }

        // Compare every block to the previous one (it skips the first one, because it was verified before)
        try {
            for (let i = 1; i < blockchainToValidate.length; i++) {
                this.checkBlock(blockchainToValidate[i], blockchainToValidate[i - 1], blockchainToValidate);
            }
        } catch (ex) {
            console.error('Invalid block sequence');
            throw new ExtendedError('Invalid block sequence', null, ex);
        }
        console.log("checkChain finish....");
        return true;
    }

    /**
     *
     * @param newBlockchain
     */
    replaceChain(newBlockchain) {
        // It doesn't make sense to replace this blockchain by a smaller one
        if (newBlockchain.length <= this.blocks.length) {
            console.error('Blockchain shorter than the current blockchain');
            throw new ExtendedError('Blockchain shorter than the current blockchain');
        }

        // Verify if the new blockchain is correct
        this.checkChain(newBlockchain);

        // Get the blocks that diverges from our blockchain
        console.info('Received blockchain is valid. Replacing current blockchain with received blockchain');
        let newBlocks = R.takeLast(newBlockchain.length - this.blocks.length, newBlockchain);

        // Add each new block to the blockchain
        R.forEach((block) => {
            this.addBlock(block, false);
        }, newBlocks);

        //this.emitter.emit('blockchainReplaced', newBlocks);
    }

    async addTransaction(newTransaction, emit = true) {
        //check new transaction already in the transactions 
        const isExistsTrans = R.none(R.propEq('id', newTransaction.id), this.transactions);
        if (!isExistsTrans) {
            console.error(`Transaction '${newTransaction.id}' is already in the blockchain`);
            throw new ExtendedError(`Transaction '${newTransaction.id}' is already in the blockchain`, newTransaction);
        }

        // It only adds the transaction if it's valid
        if (await this.checkTransaction(newTransaction, this.blocks)) {
            this.transactions.push(newTransaction);
            //console.info(`TODO Write to DB`);
            //newTransaction._id = newTransaction.id;
            //this.db.insert('trans', newTransaction);
            //delete newTransaction['_id'];
            //console.info(`Transaction added: ${newTransaction.id}`);
            if (emit) this.emitter.emit('transactionAdded', newTransaction);
            this.transactionAdded(newTransaction);
            return newTransaction;
        }

    }

    async checkTransaction(transaction, referenceBlockchain = this.blocks) {
        transaction.check(trans);
        //check  current transaction in current blocks
        const isExistsBlockchain = R.map((block) => {
            return R.none(R.propEq('id', transaction.id), block.transactions);
        }, referenceBlockchain);

        if (!isExistsBlockchain) {
            console.error(`Transaction '${transaction.id}' is already in the blockchain`);
            throw new ExtendedError(`Transaction '${transaction.id}' is already in the blockchain`, transaction);
        }

        for (let i = 0; i < transaction.data.inputs.length; i++) {
            let trans = transaction.data.inputs[i];
            const data = await this.getBlockfromDbByTranscationHash(trans.transaction);

            if (data.docs.length == 0) {
                throw new ExtendedError(`Transaction '${trans.transaction}' no Exists`, trans);
            }
        }
        return true;
    }

    getTransactionById(id) {
        R.find(R.propEq('id', id), this.transactions);
    }

    transactionAdded(newTransaction) {
        this.broadcast(this.sendTransaction, newTransaction);
    }

    sendTransaction(peer, newTransaction) {
        const URL = `${peer.url}/newtrans`;
        //return request({uri: URL, method: "POST", form: newTransaction});
        return request({uri: URL, method: "POST",json: true,headers: {"content-type": 'application/json'},body: newTransaction});
    }

    broadcastBlock(newBlock) {
        this.broadcast(this.sendBlock, newBlock);
    }

    sendBlock(peer, newBlock) {
        const URL = `${peer.url}/newblock`;
        return request({uri: URL, method: "POST",json: true,headers: {"content-type": 'application/json'},body: newBlock});
    }

    broadcast(fn, ...args) {
        // Call the function for every peer connected
        console.info('Broadcasting');

        Config.peerList.map((peer) => {
            fn.apply(this, [peer, ...args]);
        }, this);
    }

    getTransactionFromBlocks(transactionId) {
        return R.find(R.compose(R.find(R.propEq('id', transactionId)), R.prop('transactions')), this.blocks);
    };

    async getBlockFromDb(address) {
        const params = {
            key: address
        }
        return this.db.view('block', 'unspentTransactionsAddress', 'addressView1', params);
    }

    async getBlockByInputTransAddress(address) {
        return await this.db.findByTranscationInputsAddress(address);
    }

    async getBlockByOutputTransAddress(address) {
        return await this.db.findByTranscationOutputsAddress(address);
    }

    async getBlockfromDbByTranscationHash(hash) {
        const body = {
            "selector": {
                "transactions": {
                    "$elemMatch": {
                        hash
                    }
                }
            }, "fields": []
        }
        return await this.db.request('block', 'POST', '_find', body);
    }

    async getUnspentTransactionsForAddress(address) {

        let unspentTransactions = [];
        //load who has address in transcation inputdata;
        let data = await this.getBlockByInputTransAddress(address);
        let _inputblocks = data.docs;
        //load who has address in transcation outputdata;
        data = await this.getBlockByOutputTransAddress(address);

        let _outputblocks = data.docs;

        let unspentblocks = _inputblocks;

        R.map(x => {
            if (R.indexOf(x, _inputblocks) < 0) {
                unspentblocks.push(x);
            }
        })(_outputblocks);
        const k = data => {
            delete data['_id'];
            delete data['_rev'];
            return data;
        }
        unspentblocks = (R.map(k)(unspentblocks));


        const selectTxs = (transaction) => {
            let index = 0;
            // Create a list of all transactions outputs found for an address (or all).
            R.forEach((txOutput) => {
                if (address && txOutput.address == address) {
                    txOutputs.push({
                        //transaction: transaction.id,
                        transaction: transaction.hash,
                        index: index,
                        amount: txOutput.amount,
                        address: txOutput.address
                    });
                }
                index++;
            }, transaction.data.outputs);

            // Create a list of all transactions inputs found for an address (or all).
            R.forEach((txInput) => {
                if (address && txInput.address != address) return;

                txInputs.push({
                    transaction: txInput.transaction,
                    index: txInput.index,
                    amount: txInput.amount,
                    address: txInput.address
                });
            }, transaction.data.inputs);
        };

        // Considers both transactions in block and unconfirmed transactions (enabling transaction chain)
        let txOutputs = [];
        let txInputs = [];
        R.forEach(R.pipe(R.prop('transactions'), R.forEach(selectTxs)), unspentblocks);
        R.forEach(selectTxs, this.transactions);

        // Cross both lists and find transactions outputs without a corresponding transaction input
        let unspentTransactionOutput = [];
        R.forEach((txOutput) => {
            if (!R.any((txInput) => txInput.transaction == txOutput.transaction && txInput.index == txOutput.index, txInputs)) {
                unspentTransactionOutput.push(txOutput);
            }
        }, txOutputs);

        return unspentTransactionOutput;

    }


    async getBalanceForAddress(addressId) {
        let utxo = await this.getUnspentTransactionsForAddress(addressId);

        if (utxo == null || utxo.length == 0) throw new AppError(`No transactions found for address '${addressId}'`);
        return R.sum(R.map(R.prop('amount'), utxo));
    }

    async getBlockByIndex(index) {
        const body = {
            "selector": {
                "index": index
            },
            "fields": [],
            "sort": [
                {
                    "index": "desc"
                }
            ],
            "limit": 1
        }
        return this.db.request('block', 'POST', '_find', body);
    }

    async getBlockByHash(hash) {
        const body = {
            "selector": {
                "hash": hash
            },
            "fields": [],
            "limit": 1
        }
        return this.db.request('block', 'POST', '_find', body);
    }

    asyncBlockFromPeers(peersList) {
        console.log('start to sync block from other peers');
        // get max peers List Height;
        const peer = R.sort(R.descend(R.prop('height')), peersList)[0];

        if (peer == undefined || peer == null || peer.height == 0) {
            this.isSync = 2;
            return;
        }

        // get My Block height;
        const latestBlockHeld = this.getLastBlock();
        if (latestBlockHeld.index >= peer.height) {
            this.isSync = 2;
            return;
        }

        if (this.isSync != 0) return;
        //begin Synchronization whole db
        this.isSync = 1;
        let _target = peer.url.split(':');
        _target[2] = 5984;
        this.db.replicateFromRemote(R.join(':', _target) + '/block','block', {}).then(body => {
            //console.log(body);
            console.log('sync block from other peers success')
            this.isSync = 2;
        }).catch(err => {
            console.log(err)
            console.log('sync block from other peers error');
            this.isSync = -1;
        });
    }
}

module.exports = Chain;
