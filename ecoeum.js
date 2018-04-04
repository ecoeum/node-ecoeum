'use strict';
const colors = require('colors');
const Blocks = require('./block');
const Transaction = require('./trans');
const Account = require('./account');
const Miner = require('./miner/miner');
const Peer = require('./peer');
const config = require('./ecoeum-config');
const Db = require('./block/db/db');
const Consensus = require('./consensus');
const db = new Db();
db.initDb();
global.blocks = new Blocks(db);
global.trans = new Transaction();
global.miner = new Miner(global.blocks);
const peer = new Peer(global.blocks);
const consensus=new Consensus(global.blocks, peer);
const Api = require('./api');
const account = new Account('account', global.blocks);
const app = new Api(null, blocks, account, null, db, peer);
app.listen(config.peer.host, config.peer.port);


