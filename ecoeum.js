'use strict';
const colors = require('colors');
const Blocks = require('./block');
const Transaction = require('./trans');
const Account = require('./account');
const Miner = require('./miner/miner');
const Peer = require('./peer');
const config = require('./ecoeum-config');
const Db = require('./block/db/db');
const db = new Db();
db.initDb();
global.blocks = new Blocks(db);
global.trans = new Transaction();
global.miner = new Miner(global.blocks);
const peer = new Peer(global.blocks);
const Api = require('./api');
const account = new Account('account', global.blocks);
const app = new Api(null, blocks, account, null, db, peer);
app.listen(config.peer.host, config.peer.port);

//every 30000 seconds generate one block
setInterval(function () {
    if(!peer.isMiner) return;   //if current peer is not miner, can not generate block
    console.log('generate new block..........');
    global.miner.mine(config.SystemKeyPair2.publicKey, config.SystemKeyPair2.publicKey);
 }, 30000);

