'use strict';
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const util = require('../util/index');
const Transaction = require('../trans');
const Account = require('../account');
const Block = require('../block/block');
const R = require('ramda');
const HTTPError = require('../util/httpError');
const config = require('../ecoeum-config.json');
const os = require('os');
var router = new Router();

module.exports = function (blockchain, account, peer) {

    /**
     * if block is not synchronization,the api transaction is not allowed
     */
    app.use(async (ctx, next) => {
        if (blockchain.isSync == -1) throw new HTTPError(404, 'Block sync failed');
        if (blockchain.isSync == 0) throw new HTTPError(404, 'wating Block sync');
        if (blockchain.isSync == 1) throw new HTTPError(404, `Block Syncing'`);
        await next();
    });

    router.get('/', (ctx, next) => {
        ctx.body = "ecoeum-chain api!";
    });

    /**
     * @api {get} /blocks getNewsBlocksDefault
     * @apiName getNewsBlocksDefault
     * @apiGroup Block
     * @apiDescription getNewsBlocks from BlockChain , will be order by block height desc , max record count 25;
     *
     *
     * @apiSuccess {Object} body       Result
     * @apiSuccess {Array}   body.docs   List of Blocks;
     * @apiSuccess {String}  body.bookmark important bookmark use for paging
     */
    router.get('/blocks', async (ctx, next) => {
        //ctx.body = await global.blocks.queryBlock();
        ctx.body=global.blocks.getAllBlocks();
    });

    /**
     * @api {get} /blocks/:limit getNewsBlocksLimit
     * @apiName getNewsBlocksLimit
     * @apiGroup Block
     * @apiDescription getNewsBlocks from BlockChain , will be order by block height desc , max record count for params limit;
     *
     *
     * @apiSuccess {Object} body       Result
     * @apiSuccess {Array}   body.docs   List of Blocks;
     * @apiSuccess {String}  body.bookmark important bookmark use for paging
     */
    router.get('/blocks/:limit', async (ctx, next) => {
        ctx.body = await global.blocks.queryBlock(parseInt(ctx.params.limit));
    });

    /**
     * @api {get} /blocks/:limit/:bookmark getNewsBlocksPaging
     * @apiName getNewsBlocksPaging
     * @apiGroup Block
     * @apiDescription getNewsBlocks from BlockChain , will be order by block height desc , max record count for params limit;
     * when you want to query next limit count must use bookmark params;
     *
     *
     * @apiSuccess {Object} body       Result
     * @apiSuccess {Array}   body.docs   List of Blocks;
     * @apiSuccess {String}  body.bookmark important bookmark use for paging
     */
    router.get('/blocks/:limit/:bookmark', async (ctx, next) => {
        ctx.body = await global.blocks.queryBlock(parseInt(ctx.params.limit), ctx.params.bookmark);
    });

    /**
     * @api {get} /block/:hash getBlockByHash
     * @apiName getBlockByHash
     * @apiGroup Block
     * @apiDescription find Block by Block Hash;
     *
     *
     * @apiErrorExample {json} Error-Response:
     *     HTTP/1.1 404 Not Found
     *     {
     *       "error": "NotFound"
     *     }
     *
     * @apiSuccess {Object} body       Result
     * @apiSuccess {Number}   body.index   Block index
     * @apiSuccess {String}  body.previousHash previousHash
     * @apiSuccess {String}  body.someothers  see result
     */
    router.get('/block/:hash([a-zA-Z0-9]{64})', async (ctx, next) => {
        let blockFound = await blockchain.getBlockByHash(ctx.params.hash);
        if (blockFound == null || blockFound.docs.length == 0) throw new HTTPError(404, `Block not found with index '${ctx.params.index}'`);
        blockFound = blockFound.docs[0];
        delete blockFound["_id"];
        delete blockFound["_rev"];
        ctx.body = blockFound;
    });

    /**
     * @api {get} /blockchain/blocks/transcation/:hash getBlockByTranscationHash
     * @apiName getBlockByTranscationHash
     * @apiGroup Transcation
     * @apiDescription find Block by getBlockByTranscationHash
     *
     *
     * @apiSuccess {Object} body       Result

     */
    router.get('/blockchain/blocks/transcation/:hash([a-zA-Z0-9]{64})', async (ctx, next) => {
        let blockFound = await blockchain.getBlockfromDbByTranscationHash(ctx.params.hash);
        if (blockFound == null || blockFound.docs.length == 0) throw new HTTPError(404, `Block not found with hash '${ctx.params.hash}'`);


        blockFound = blockFound.docs[0];
        delete blockFound['_id'];
        delete blockFound['_rev'];

        ctx.body = new Array(blockFound);
    });

    /**
     * @api {get} /block/:index getBlockByIndex
     * @apiName getBlockByIndex
     * @apiGroup Block
     * @apiDescription find Block by Block index;
     *
     *
     * @apiSuccess {Object} body       Result
     * @apiSuccess {Number}   body.index   Block index
     * @apiSuccess {String}  body.previousHash
     * @apiSuccess {String}  body......
     */

    router.get('/block/:index', async (ctx, next) => {
        let blockFound = await blockchain.getBlockByIndex(parseInt(ctx.params.index));
        if (blockFound == null || blockFound.docs.length == 0) throw new HTTPError(404, `Block not found with index '${ctx.params.index}'`);
        blockFound = blockFound.docs[0];
        delete blockFound["_id"];
        delete blockFound["_rev"];
        ctx.body = blockFound;
    });


    router.get('/peer/transactions/:transactionId([a-zA-Z0-9]{64})/confirmations', (ctx, next) => {
        let confirmations = peer.getConfirmations(ctx.request.query.transactionId);
        ctx.body = {confirmations: confirmations};
    });


    router.get('/getChainHeight', (ctx, next) => {
        ctx.body = {
            peer: peer,
            height: blockchain.getBlockHeight()
        }
    });


    router.get('/lastblocks', (ctx, next) => {
        ctx.body = global.blocks.lastBlock;
    });

    router.post('/newtrans', async (ctx, next) => {
        ctx.body = await global.trans.newTrans(ctx.request.body);
    });

    /**
     * @api {post} /account/createtrans createTrans
     * @apiName createtrans
     * @apiGroup Account
     * @apiDescription create transcation ,when user want to transfer accounts ; TODO: it will be broadcast to others peers;
     * @apiParam {String} secretKey from user secretKey
     * @apiParam {String} fromAddressId from user addreess
     * @apiParam {String} toAddressId to user address
     * @apiParam {Number} amount transfer amount
     * @apiParam {String} changeAddressId value equals from user address
     *
     * @apiSuccess {Object} body       Result same to unconfirmtrans;


     */
    router.post('/account/createtrans', async (ctx, next) => {
        const {secretKey, fromAddressId, toAddressId, amount, changeAddressId} = ctx.request.body;
        const data = await account.createTrans(secretKey, fromAddressId, toAddressId, amount, changeAddressId);
        ctx.body = await global.trans.newTrans(data);
    });


    /**
     * @api {post} /account/createTokentrans create token Trans
     * @apiName createtrans
     * @apiGroup Account
     * @apiDescription create transcation ,when user want to transfer accounts ; TODO: it will be broadcast to others peers;
     * @apiParam {String} secretKey from user secretKey
     * @apiParam {String} fromAddressId from user addreess
     * @apiParam {String} toAddressId to user address
     * @apiParam {Number} amount transfer amount
     * @apiParam {String} changeAddressId value equals from user address
     * @apiParam {coinRate} token/main coin
     * @apiParam {coinName} coinName
     * @apiParam {content} cointent
     * @apiSuccess {Object} body       Result same to unconfirmtrans;


     */
    router.post('/account/createTokentrans', async (ctx, next) => {
        const {secretKey, fromAddressId, toAddressId, amount, changeAddressId,coinRate,coinName,content} = ctx.request.body;
        const data = await account.createTokenTrans(secretKey, fromAddressId, toAddressId, amount, changeAddressId,coinRate,coinName,content);
        ctx.body = await global.trans.newTrans(data);
    });


    /**
     * @api {post} /account/createOthertrans
     * @apiName createtrans
     * @apiGroup Account
     * @apiDescription create transcation ,when user want to transfer accounts ; TODO: it will be broadcast to others peers;
     * @apiParam {String} secretKey from user secretKey
     * @apiParam {String} fromAddressId from user addreess
     * @apiParam {String} toAddressId to user address
     * @apiParam {Number} amount transfer amount
     * @apiParam {String} changeAddressId value equals from user address
     * @apiParam {content} cointent
     * @apiSuccess {Object} body       Result same to unconfirmtrans;


     */
    router.post('/account/createOthertrans', async (ctx, next) => {
        const {secretKey, fromAddressId, toAddressId, amount, changeAddressId,content} = ctx.request.body;
        const data = await account.createOtherTrans(secretKey, fromAddressId, toAddressId, amount, changeAddressId,content);
        ctx.body = await global.trans.newTrans(data);
    });

    /**
     * @api {get} /account/banlance/:addressId getAccountBanlance
     * @apiName getAccountBanlance
     * @apiGroup Account
     * @apiDescription create transcation ,when user want to transfer accounts ; TODO: it will be broadcast to others peers;
     * @apiParam {String} addressId address
     *
     * @apiSuccess {Number} banlance banlance of address

     */
    router.get('/account/banlance/:addressId', async (ctx, next) => {
        ctx.body = {
            balance: await blockchain.getBalanceForAddress(ctx.params.addressId)
        };
    });


    router.get('/blockchain/blocks/transactions/:transactionId([a-zA-Z0-9]{64})', (ctx,next) => {
        let transactionFromBlock = blockchain.getTransactionFromBlocks(ctx.request.query.transactionId);
        ctx.body = transactionFromBlock;
    });


    router.post('/newblock', (ctx, next) => {
        console.log('^^^^^^^^^^^^^^^^^^^^^^^^reveive new block:' + new Date().toLocaleString() + ' post ' + ' /newblock\n');
        let newblock = Block.fromJson(ctx.request.body);
        console.log(newblock);
        ctx.body=peer.checkReceivedBlock(newblock);
    });

    router.post('/node/reviceNewTrans', (ctx, next) => {
        ctx.body = {ret: true}
    })


    /**
     * @api {post} /account/createNewAccountByPassword createNewAccountByPassword
     * @apiName createNewAccountByPassword
     * @apiGroup Account
     * @apiDescription create keypair by password , same password every time will generation difference keypair
     * @apiParam {String} password In params;
     *
     * @apiSuccess {Object} body       Result
     * @apiSuccess {String}   body.secretKey    back up your the private key,if forget password is can't to find back secretKey;
     * @apiSuccess {String}  body.publicKey     your addredss,you can get balance by this ;

     */

    router.post('/account/createNewAccountByPassword', (ctx, next) => {
        const password = ctx.request.body.password;
        ctx.body = account.createNewAccountByPassword(password);
    });

    router.get('/peer/ping', (ctx, next) => {
        let platform = os.platform()+"_"+os.arch()+"_"+os.release();
        ctx.body = {
            height: blockchain.getBlockHeight(),
            isOnline: true,
            os:platform,
            isMiner:peer.isMiner
        }
    });

    /**
     * @api {get} /peer/unconf
     * irmtrans unconfirmtrans
     * @apiName unconfirmtrans
     * @apiGroup Peer
     * @apiDescription get all unconfirmtrans , it in memory

     *
     * @apiSuccess {Object} body       Result
     * @apiSuccess {String}   body.id
     * @apiSuccess {String}  body.hash
     * @apiSuccess {String}  body.type
     * @apiSuccess {Array}  body.data
     * @apiSuccess {Array}  body.data.inputs    utxo List;
     * @apiSuccess {String}  body.data.inputs.transcation transcationHash
     * @apiSuccess {Number}  body.data.inputs.index
     * @apiSuccess {Number}  body.data.inputs.amount
     * @apiSuccess {String}  body.data.inputs.address   from address
     * @apiSuccess {String}  body.data.inputs.signature
     * @apiSuccess {Array}  body.data.outputs   outputs ArrayList;
     * @apiSuccess {Number}  body.data.outputs.amount
     * @apiSuccess {String}  body.data.outputs.address  to address;

     */
    router.get('/peer/unconfirmtrans', (ctx, next) => {
        ctx.body = blockchain.transactions;
    });


    router.get('/peer/transactions/:transactionId([a-zA-Z0-9]{64})/confirmations', (ctx, next) => {
        let confirmations = peer.getConfirmations(ctx.request.query.transactionId);
        ctx.body = {confirmations: confirmations};
    });

    router.get('/blocks/:index', (ctx, next) => {
        const index = ctx.params.index;
        //get from current blocks;
        if (typeof(index) == 'number') {
            ctx.body = [];
            return;
        }
        console.log(blockchain.block);
        ctx.body = R.find((R.propEq('index', index)), blockchain.block);
    });

    router.post('/account/generateAddressForWallet', (ctx, next) => {
        const password = ctx.request.body.password;
        const address = account.generateAddressForWallet(ac.id);
        ctx.body = address;
    });

    router.post('/peer/list',(ctx,next)=>{
        ctx.body = peer.peers;
    });

    router.post('/peer/all',(ctx,next)=>{
        let platform = os.platform()+"_"+os.arch()+"_"+os.release();
        let me = {
            url:"http://"+config.peer.host+":"+config.peer.port,
            height: blockchain.getBlockHeight(),
            isOnline: true,
            os:platform,
            isMiner:peer.isMiner
        }
        let list = peer.peers.slice(0) || [];
        list.push(me);
        ctx.body = list;
    });

    router.get('/asMiner',(ctx, next) => {
        peer.isMiner=true;
        ctx.body={
            miner:peer.host,
            status:'success'
        };
    });

    /*router.post('/demo',(ctx,next)=>{
        console.log('xxxxx');
        console.log(ctx.request.body);
        console.log('end');
        ctx.body = ctx.request.body;
        ctx.body.ret = 'success';
    })*/

    //user defined error process
    app.use(async (ctx, next) => {
        try {
            console.log(new Date().toLocaleString(), ctx.method, ctx.url);
            await next()
            if (ctx.status === 404) ctx.throw(404)
        } catch (err) {
            ctx.status = err.status || 500
            ctx.body = err.body || err.message
            console.error(ctx.url);
            console.error(err.toString());
            console.error(err.stack + "\n");
        }
    })
    app
        .use(bodyParser())
        .use(router.routes())
        .use(router.allowedMethods());

    app.on('error', (err, ctx) => {
        console.error(ctx.url);
        console.error(err);
        console.error(err.stack);
    })
}

