'use strict';
const slots = require('./slots');
const peer = require('../peer');
const R = require('ramda');
const Block = require('../block/block');
const Config = require('../ecoeum-config');
const UUID = require('node-uuid');
const CryptoUtil = require('../util/cryptoUtil');
const moment = require('moment');

class Consensus {
    constructor(blockchain, peer) {
        this.blockchain = blockchain;
        this.peer = peer;
        this.Delegates = [];
        this.currentSlot = 0;
        this.lastSlot = 0;
        function processDelegate(_this) {
            _this.getDelegateId();
        }
        setTimeout(()=>{
            console.log("current peer consensus start......")
            setInterval(processDelegate, 1000, this);
        },slots.interval*slots.delegates*1000);

    }

    getDelegateId() {
        let canGenerateBlock = false;
        let peerUrl = "";
        this.currentSlot = slots.getSlotNumber();
        //console.log("currentSlot is %d ",this.currentSlot);
        // if height of current peer is not enough, peer will not generate if it is delegate
        var onlinePeers = R.filter(obj => obj.status === '1')(this.peer.peers);
        const heighestPeer = R.sort(R.descend(R.prop('height')), onlinePeers)[0];
        if (heighestPeer == undefined) {
            //the choseDelegates must have current peer
            canGenerateBlock = true;
            console.log("there is not any peer except me,I will be the only Delegater!");
        } else {
            //there are more than one working peers,chosed the highest peer as miner
            // console.log(this.blockchain.getBlockHeight());
            // console.log(heighestPeer.height);
            if (this.blockchain.getBlockHeight() != null && heighestPeer.height < this.blockchain.getBlockHeight()) {
                //the choseDelegates must have current peer,problem:
                console.log("My chain is higher than others,I can as Delegater!");
                canGenerateBlock = true;
            } else if(this.blockchain.getBlockHeight() != null && heighestPeer.height == this.blockchain.getBlockHeight()) {
                console.log("My chain is  equal with others,I can as Delegater!");
                canGenerateBlock = true;
            }  else if(this.blockchain.getBlockHeight()==null || this.blockchain.getBlockHeight()==undefined){
                console.log("the blockchain is null,I will be the only Delegater!");
                canGenerateBlock = true;
            }
            else {
                canGenerateBlock = false;
                console.log("My chain is lower than others,I can not as Delegater!");
            }
        }

        if (!canGenerateBlock) return;
        var lastBlock = this.blockchain.getLastBlock();
        if(lastBlock==undefined || lastBlock==null) return;

        this.lastSlot = slots.getSlotNumber(slots.getTime(lastBlock.timestamp * 1000));
        //console.log("lastSlot %d" , this.lastSlot);
        //there will leave slots.inteval-5 m to generate block and broadcast in this slots
        if (this.currentSlot === this.lastSlot || (Date.now() % (slots.interval*1000) > 5000)) return;

        var delegateId = (this.currentSlot % slots.delegates)+1;
        console.log("chosed delegate Id is " + delegateId);
        if(delegateId==this.peer.id){
            console.log("Now it's my turn to create a block")
            this.generateBlockByDelegate(this.peer.addr,this.peer.addr);
            return;
        }else{
            var delegateIdIsOnline =R.filter(obj=>obj.id===delegateId)(R.filter(obj => obj.status === '1')(this.peer.peers));
            if(delegateIdIsOnline==undefined || delegateIdIsOnline==null || delegateIdIsOnline.length<=0) {
                console.log("current delegate id is offline,skip this slot");
                return;
            }
        }
    }

    /*
    //chose Delegate for generate block
    choseDelegates() {
        this.Delegates = [];  //init delegates
        var onlinePeers = R.filter(obj => obj.status === '1')(this.peer.peers);
        onlinePeers.push({
            "url":`http://${this.peer.host}:${this.peer.port}`,
            "status":"1",
            "height":this.blockchain.height,
            "isMiner":this.peer.isMiner
        });
        //online peers order by "height",chosed slots.delegates peer as Delegates
        let candidateDelegates = R.sort(R.descend(R.prop('height')), onlinePeers);
        let chosedDelegates = R.take(slots.delegates)(candidateDelegates);
        //there may be chosedDelegates<slots.delegates,because use R
        for (var i = 0; i < chosedDelegates.length && i < slots.delegates; i++) {
            this.Delegates.push({
                "ID": i + 1,
                "URL": chosedDelegates[i].url,
                "STATUS": 1     //0-bad 1-valiad
            })
        }
    }
    */

     generateBlockByDelegate(rewardAddr, feeAddr) {
        if(!this.blockchain.isLoadFromDb)
        {
            console.log("loading data from db is not finish,miner can't work!");
            return;
        }

        let nextBlock =this.generateNextBlock(rewardAddr, feeAddr, this.blockchain);
        console.log("---------------------new block begin package tranactions------------------");
        const transactionList = R.pipe(
            R.countBy(R.prop('type')),
            R.toString,
            R.replace('{', ''),
            R.replace('}', ''),
            R.replace(/"/g, '')
        )(nextBlock.transactions);

        console.info(`Generage a new block contain ${nextBlock.transactions.length} (${transactionList}) transactions`);
        this.blockchain.newBlock(nextBlock);   //add and broadcast block
    }

    generateNextBlock(rewardAddr, feeAddr, blockchain) {
        const previousBlock = blockchain.getLastBlock();
        const index = previousBlock.index + 1;
        const previousHash = previousBlock.hash;
        //const timestamp = Number(moment().format('X'));  //这个timestamp有问题，有时生成以后的在前面取时有问题
        const timestamp =Math.floor(Date.now() / 1000);

        //use timestamp with the current slot generating timestamp,not current time tampstamp,
        //or there will be error compute late block's slot

        const genSlotNumber= slots.getSlotNumber(slots.getTime(timestamp * 1000));
        if(this.currentSlot!=genSlotNumber){
            console.log("important error, generate slotnumber by orginal slotnumber is not equal!")
            return null;
        }

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

module.exports = Consensus;