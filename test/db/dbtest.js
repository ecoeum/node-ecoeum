const assert = require("assert");
const DataBase = require('../../block/db/db')
const db = new DataBase();
const R = require('ramda');
describe('dbTest', function () {

        it("create db by name", function (done) {
            db.initDb();
            done();
        });

        it('insert', function (done) {
            let data = {
                "_id": "0a0627c1-01a4-11e8-8521-e559c339d62",
                "index": 101,
                "previousHash": 100,
                "timestamp": 1516866468924,
                "nonce": 0,
                "transactions": [
                    {
                        "id": 101,
                        "hash": "563b8aa350...3eecfbd26b",
                        "type": "regular",
                        "data": {
                            "inputs": [],
                            "outputs": [{"name": "1"}]
                        }
                    }
                ],
                "hash": "c4e0b8df46...199754d1ed"
            }
            db.insert('test', data).then((data) => {
            }).catch(err => {
                console.log(err);
            });
            console.log('yyyy');
            done();
        });


        it('queryById', function (done) {
            const _q = db.queryById('test', '0a0627c1-01a4-11e8-8521-e559c339d921');
            console.log(_q);
            _q.then(data => {
                console.log(data);
            }).catch(err => {
                console.log(err);
            })
            console.log('end queryById');
            done();
        });

        it('request', function (done) {
            var body = {
                "selector": {
                    "index": {
                        "$gte": 0
                    }
                },
                "fields": [],
                "sort": [
                    {
                        "index": "desc"
                    }
                ],
                "limit": 3,
                bookmark: 'g2wAAAACaAJkAA5zdGFydGtleV9kb2NpZG0AAAAgNzhiYWVhYjdiNDdmNjI1YTdkNWUzNWIxODFlZmNhZDZoAmQACHN0YXJ0a2V5bAAAAAFiAAABpWpq1'
            }
            const ret = db.request('block', 'POST', '_find', body);
            ret.then((body) => {
                body.docs.forEach(item => {
                    console.log(item.index, 'index');
                })
                console.log(body.bookmark, '0000')
            })

            done();
        })

        it("createIndex", function (done) {
            db.createIndex('block', "index", "index_trans_id").then((body) => {
                console.log('success', body);
            }).catch(err => {
                console.log('error', err)
            });
            done();
        });

        it("findAll", function (done) {
            const params = {};
            db.findAll('block', params).then((body) => {
                console.log('success', body.length);
                var byAge = R.descend(R.prop('index'));
            }).catch(err => {
                console.log('error', err)
            });
            done();
        })


        it("queryAddress", function (done) {
            const body = {
                "selector": {
                    "transactions": {
                        "$elemMatch": {
                            "id": "5ce001ce1e453a8bbc86ddaa5135395b0536d9eb366cb910d74a1b52154fbdfe"
                        }
                    }
                }, "fields": []
            }
            const ret = db.request('block', 'POST', '_find', body);
            ret.then((body) => {
                console.log(body.docs, '0000')
            })
            done();
        })


        /*it("queryAddress", function (done) {
         const body = {
         "selector": {
         "transactions": {
         "$elemMatch": {
         //"$elemMatch": {
         "data.inputs":{
         "$elemMatch": {
         "address":"115905bdc8a30536934d0df159c2746c0a063163bf2a835142551e8ea2045405"
         }
         }
         //}
         }
         }
         }, "fields": []
         }
         const ret = db.request('block', 'POST', '_find', body);
         ret.then((body) => {
         console.log(body.docs, '0000',body.docs.length)
         })
         done();
         })*/

        it("queryAddress", function (done) {
            db.findByTranscationInputsAddress("115905bdc8a30536934d0df159c2746c0a063163bf2a835142551e8ea2045405").then(body => {
                console.log('0000 input ', body.docs.length)
                body.docs.map(item => {
                    console.log(item._id, 'input');
                })
            })

            db.findByTranscationOutputsAddress("115905bdc8a30536934d0df159c2746c0a063163bf2a835142551e8ea2045405").then(body => {
                console.log('0000 output ', body.docs.length)
                body.docs.map(item => {
                    console.log(item._id, 'output');
                })
            })
            done();
        });


        it("queryAddressInputOrOutput", function (done) {
            const body = {
                "selector": {
                    "transactions": {
                        "$elemMatch": {

                            "$or": [{
                                "data.inputs": {
                                    "$elemMatch": {
                                        "address": "115905bdc8a30536934d0df159c2746c0a063163bf2a835142551e8ea2045405"
                                    }
                                },
                                "data.outputs": {
                                    "$elemMatch": {
                                        "address": "115905bdc8a30536934d0df159c2746c0a063163bf2a835142551e8ea2045405"
                                    }
                                }
                            }]

                        }
                    }
                }, "fields": []
            }
            const ret = db.request('block', 'POST', '_find', body);
            ret.then((body) => {
                console.log(body.docs.length)
                body.docs.map(item => {
                    console.log(item._id);
                })
            })
            done();
        })

        it("getBalance", function (done) {
            this.timeout(1200000);
            console.log(new Date());
            const address = 'c6941e8a70b9b234139bda93b51efd7393194782b2a7bd8fcbeb5fc712061ae8';
            //const allData = await db.findAll('block');
            //let allData = [];
            let inputAmount = 0
            let outputAmount = 0
            let inputkey = {};
            let outputkey = {};
            db.findAll('block').then(allData => {
                allData.forEach(item => {
                        const {transactions} = item.doc;
                        if (undefined !== transactions && transactions.length) {

                            transactions.forEach(tran => {

                                const inputs = tran.data.inputs;
                                const outputs = tran.data.outputs;

                                if (undefined !== inputs && inputs.length) {
                                    inputs.forEach(input => {
                                        //console.log(input)
                                        if (input.address == address) {
                                            //console.log(address,item.doc._id,input.amount)
                                            inputAmount += input.amount * -1;
                                            inputkey[input.transaction] = input;
                                        }
                                    })
                                }
                                if (undefined !== outputs && outputs.length) {
                                    outputs.forEach(output => {
                                        //console.log(output);
                                        if (output.address == address) {

                                            // console.log(address, item.doc._id, output.amount)
                                            outputAmount += output.amount;
                                            outputkey[tran.hash] = output;
                                        }
                                    })
                                }

                                //console.log(transactions[0])
                            });
                        }
                    }
                )
                console.log(inputAmount, outputAmount,outputAmount+inputAmount);
                //console.log(outputkey);
            })

            done();
        })
    }
)
;