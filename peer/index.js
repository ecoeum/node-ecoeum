'use strict';
const request = require('co-request');
const config = require('../ecoeum-config');
const Koa = require('koa');
const app = new Koa();
const async = require('async');
const R = require('ramda');
const os = require('os');
const Block = require('../block/block');
const Blocks = require('../block/blocks');

class Peer {
    constructor(blockchain) {
        this.transactions = [];
        this.host = config.peer.host;
        this.port = config.peer.port;
        this.blockchain = blockchain
        this.isMiner=false;
        this.peers = [];
        this.peers = config.peerList;
        this.connectToPeers(this.peers);
        function interval(_this) {
            _this.connectToPeers(_this.peers);
        }

        function findMiner(_this) {
            _this.processMiner(_this.peers);
        }

        interval(this);
        setInterval(interval, 10000, this);
        setInterval(findMiner, 30000, this); //find miner,findMiner>interval,or the ping peer result is not correct
        this.blockchain.isSync = 2;

    }

    addTrans(transData) {
        this.transactions.push(transData);
        orderTrans();
    }

    orderTrans() {
        //new block
    }

    /**
     * broadcast to every peers ;
     * check whether we have is if not add it ;
     */
    broadcastTrans(transData) {
        this.addTrans(transData);

        this.peers.map(peer => {
            const ret = sendTrans(peer, transactions);
        });

    }

    async sendTrans(peer, transactions) {
        let URL = `${peer.url}/node/reviceNewTrans`;
        return request({uri: URL, method: "POST", form: {url: me.url}});
    }

    receiveTrans(transData) {

        this.addTrans(transData);
    }

    newPeer() {
    }

    checkPeers() {
    }


    /*
     ping peer is it onLine;
     if Receive remote response 200 we think is onLine;
     */
    pingPeer(peer, me) {
        const URL = `${peer.url}/peer/ping`;
        return request({uri: URL,timeout:5000});
    }

    // initPeerNodse from dabebase when fist start App;
    initPeerFromdb() {
        console.log('initPeerFromdb');
    }

    sendLatestBlock(peer, block) {
        const URL = `${peer.url}/blocks/latest`;
        console.info(`Posting latest block to: ${URL}`);

        const ret = request({uri: URL,method: "POST", form: {block: block}});
        ret.then((res) => {
            console.warn(`post latest block to ${URL}: success.`);
        }).catch((err) => {
            console.warn(`Unable to post latest block to ${URL}: ${err.message}`);
        })

    }

    getBlocks(peer) {
        const URL = `${peer.url}/blocks`;
        let self = this;
        console.info(`Getting blocks from: ${URL}`);
        const ret = request({uri: URL});
        ret.then((res) => {
            console.log("getBlocks checkReceiveBlocks");
            self.checkReceivedBlocks(Blocks.fromJson(JSON.parse(res.body)));

        }).catch((err) => {
            console.warn(`Unable to get blocks from ${URL}: ${err.message}`);
        })
    }

    checkReceivedBlock(block) {
        console.log("-------------------checkReceivedBlock doing--------------------------");
        return this.checkReceivedBlocks([block]);
    }

    checkReceivedBlocks(blocks) {
        console.log("-------------------checkReceivedBlocks doing--------------------------");
        const receivedBlocks = blocks.sort((b1, b2) => (b1.index - b2.index));
        const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];

        const latestBlockHeld = this.blockchain.getLastBlock();

        // If the received blockchain is not longer than blockchain. Do nothing.
        if (latestBlockReceived.index <= latestBlockHeld.index) {
            console.info('Received blockchain is not longer than blockchain. Do nothing');
            return false;
        }

        console.info(`Blockchain possibly behind. We got: ${latestBlockHeld.index}, Peer got: ${latestBlockReceived.index}`);
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) { // We can append the received block to our chain
            console.info('Appending received block to our chain');
            this.blockchain.addBlock(latestBlockReceived);
            return true;
        } else if (receivedBlocks.length === 1) {
            //height of current's peer is not enough,so can not process receive block,broadcast it.
            console.info('Querying chain from our peers');
            this.broadcast(this.getBlocks);
            return null;
        } else { // Received blockchain is longer than current blockchain
            console.info('Received blockchain is longer than current blockchain');
            this.blockchain.replaceChain(receivedBlocks);
            return true;
        }
    }

    async getLatestBlock(peer) {
        const URL = `${peer.url}/blockchain/blocks/latest`;
        const ret = await request({uri: URL});
        if (ret.statusCode != 200) {
            consoe.warn(`Unable to get latest block from ${URL}`);
        }
        const block = ret.data;
        return this.checkReceivedBlock(block);

    }

    getConfirmation(peer, transactionId) {
        // Get if the transaction has been confirmed in that peer
        const URL = `${peer.url}/blockchain/blocks/transactions/${transactionId}`;
        console.info(`Getting transactions from: ${URL}`);
        const ret = request({uri: URL});
        ret.then(() => {
            return true
        }).catch((err) => {
            return false;
        })
    }

    getConfirmations(transactionId) {
        // Get from all peers if the transaction has been confirmed
        let foundLocally = this.blockchain.getTransactionFromBlocks(transactionId) != null ? true : false;
        return Promise.all(R.map((peer) => {
                return this.getConfirmation(peer, transactionId);
            }, this.peers))
            .then((values) => {
                return R.sum([foundLocally, ...values]);
            });
    }

    broadcast(fn, ...args) {
        // Call the function for every peer connected
        console.info('Broadcasting block');
        this.peers.map((peer) => {
            fn.apply(this, [peer, ...args]);
        }, this);
    }

    // when connection others peer success must call this;
    initPeerConnection(peer) {
        console.error("initPeerConnection in TODO List")
    }

    broadcast(fn, ...args) {
        // Call the function for every peer connected
        console.info('Broadcasting');
        this.peers.map((peer) => {
            fn.apply(this, [peer, ...args]);
        }, this);
    }

    // when others peer connect to my ;
    connectTopeer(newPeer) {

        this.connectToPeers([newPeer]);
        return newPeer;
    }

    connectToPeers(peers) {
        let me = {url: `http://${this.host}:${this.port}`};

        async.forEachOf(peers, (peer, key) => {
            if (peer.url != me.url) {
                this.pingPeer(peer, me).then(data => {
                    peer.status ='1'
                    peer.height = JSON.parse(data.body).height;
                    peer.isMiner= JSON.parse(data.body).isMiner;
                    console.log(`${peer.url}==>online`);
                    const t = R.findIndex(R.propEq('url', peer.url), peers);
                    this.peers = R.insert(t, peer, R.remove(t, 1, peers));
                    this.initPeerConnection(peer);
                    this.broadcast(this.pingPeer, peer);
                }).catch(err => {
                    const t = R.findIndex(R.propEq('url', peer.url), peers);
                    this.peers[t].status = '0';
                    this.peers[t].height = 0;
                    peer.isMiner=false;
                    //console.log(`节点${peer.url}异常:${err.message}`)
                })
            }
        });
    }


    processMiner(peers)
    {
        let me = {url: `http://${this.host}:${this.port}`};
        let chainHasMiner=this.isMiner;
        let peerMiner=me.url;
        var peerObj;
        //loop peers to find whether there is a miner in chain.
        if(!chainHasMiner) {
            for(var i=0;i<peers.length;i++) {
                peerObj=peers[i];
                if (String.valueOf(peerObj.status)!=='0' && peerObj.url !== me.url) {
                    if(peerObj.isMiner) {
                        chainHasMiner=true;
                        peerMiner=peerObj.url;
                        break;
                    }
                }
            };
        }

        /*if there is not miner working and current peer is not miner,
         chosed the highest chain of peer onlined as miner
         */
        if(!chainHasMiner) {
            console.log("warning:--------------there is not miner in chain--------------");
            let peerUrl=null;
            //candidate miner only is online peer
            var candidatePeers=R.filter(obj => obj.status==='1')(peers);
            //console.log(candidatePeers);
            const candidatePeer = R.sort(R.descend(R.prop('height')), candidatePeers)[0];
            //only current peer is working,chose this peer as miner
            if(candidatePeer==undefined)
            {
                peerUrl=me.url;
                console.log("there is not any peer except me,candidatePeer is me");
            }
            else{
                //there are more than one working peers,chosed the highest peer as miner
                if (this.blockchain.height!=null && candidatePeer.height<=this.blockchain.height){
                    console.log("My chain is higher than others,candidatePeer is me!");
                    peerUrl=me.url;
                }
                else{
                    peerUrl=candidatePeer.url;
                    console.log("My chain is lower than others,candidatePeer is not me!");
                }
            }

            if(peerUrl)
            {
                let minerUrl =peerUrl+'/asMiner';
                console.log("Import:----------System candidate "+minerUrl+",Procssing--------");
                const minerCandidate = request({uri: minerUrl});
                minerCandidate.then((res) => {
                    console.log("Import:----------System chose "+JSON.parse(res.body).miner+" as Miner Successfully!--------");
                }).catch((err) => {
                    console.warn(`Error:----------System chose ${minerUrl} as Miner of Chain Failed: ${err.message}`);
                })
            }
        }
        else {
            console.log("-------------------current miner is :"+peerMiner+" ,Working...-----------------------");
        }
    }

    getBlocksFromPeer(peer) {
        const URL = `${peer.url}/blocks`;
        const blocksList = request({uri: URL, method: "get"});
        const thisPeerHeight = blockchain.getBlockHeight();
        if (blocksList.length > thisPeerHeight)
            R.append(R.takeLast(blocksList.length - thisPeerHeight)(blocksList))(blockchain.getAllBlocks());
    }
}

module.exports = Peer;