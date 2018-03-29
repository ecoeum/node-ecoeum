'use strict';
const Koa = require('koa');
global.app = new Koa();
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
var router = new Router();
app.listen(3003);
app.use(bodyParser());
app.use(router.routes());

router.post('/node/ping', (ctx, next) => {
    console.log(new Date().toLocaleString() + ' post ' + ' /newblock');
    console.log(ctx.request.body);
    ctx.body = ctx.request.body;
});


console.log(new Date().toLocaleString() + "Peers  server listen on 3003")
