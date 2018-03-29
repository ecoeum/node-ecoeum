'use strict';
const cors = require('koa2-cors');
class Api {
    constructor(node, blockchain, account, miner, db, peer) {
        const Koa = require('koa');
        global.app = new Koa();

        app.use(cors({
            origin: function (ctx) {
                return "*";
            },
            exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
            maxAge: 5,
            credentials: true,
            allowMethods: ['GET', 'POST', 'DELETE'],
            allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
        }));
        require('./routers')(blockchain, account, peer);
        global.blockchain = blockchain;

    }

    listen(host, port) {
        app.listen(port);
        console.log(new Date().toLocaleString() + " node-ecoeum api  server listen on " + port)
    }
}

module.exports = Api;