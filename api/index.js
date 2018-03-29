'use strict';
const cors = require('koa2-cors');
class Api {
    constructor(node, blockchain, account, miner,db,peer) {
        const Koa = require('koa');
        global.app = new Koa();

        // 具体参数我们在后面进行解释
        app.use(cors({
            origin: function (ctx) {
                return "*"; // 允许来自所有域名请求
            },
            exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
            maxAge: 5,
            credentials: true,
            allowMethods: ['GET', 'POST', 'DELETE'],
            allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
        }));
        require('./routers')(blockchain,account,peer);
        global.blockchain = blockchain;

    }

    listen(host, port) {
        app.listen(port);
        console.log(new Date().toLocaleString() + " compile-chain api  server listen on " + port)
    }
}

module.exports = Api;

