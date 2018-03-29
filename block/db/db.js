const dbconfig = require('../../ecoeum-config').dbconfig;
const async = require('async');
const R = require('ramda');


const viewAddress = {
    "_id": "_design/unspentTransactionsAddress",
    "views": {
        "addressView1": {
            "map": "function(doc) {if (doc.transactions) {for (var i in doc.transactions) {if (doc.transactions[i].data) {if (doc.transactions[i].data.outputs) {for (var j in doc.transactions[i].data.outputs) {for (var k in doc.transactions[i].data.outputs) {emit(doc.transactions[i].data.outputs[j].address, doc) } } } } } } }"
        }
    }
}

const viewHash = {
    "_id": "_design/unspentTransactionsHash",
    "views": {
        "viewHash1": {
            "map": "function(doc) {if (doc.transactions) {for (var i in doc.transactions) {if (doc.transactions[i].hash) {emit(doc.transactions[i].hash, doc) } } } }"
        }
    }
}


module.exports = class Db {

    constructor() {
        let url = '';
        if (dbconfig.user === 'admin') {
            url = `${dbconfig.protocol}://${dbconfig.user}:${dbconfig.password}@${dbconfig.host}:${dbconfig.port}`;
        } else {
            url = `${dbconfig.protocol}://${dbconfig.host}:${dbconfig.port}`;
        }

        this.nano = require('nano')(url);
    }

    initIndex() {
        return this.createIndex('block', "index", "index_trans_id");
    }

    initDb() {
        const dbnameList = ['block', 'peer'];
        async.forEachOf(dbnameList, (value, key) => {

            this.nano.db.create(value, (err, body, header) => {

                if (value === 'block') {
                    this.initView(this);
                }
            });

        });
        this.initIndex().then(() => {
            console.log('create Index Success');
        });
    }

    initView(_this) {
        const __this = _this;
        setTimeout(function () {
            __this.createView('block', viewHash);
            __this.createView('block', viewAddress);
        }, 2000)
    }

    insert(dbname, data) {
        const db = this.nano.use(dbname);
        return new Promise((resolve, reject) => {
            db.insert(data, function (err, body, header) {
                if (err) {
                    return reject(err.message);
                }
                return resolve(body);
            });
        });
    }

    /**
     * if _id is not Exist is will reject otherwise return documents;
     * @param dbname
     * @param _id
     * @returns {Promise}
     */
    queryById(dbname, _id) {
        const db = this.nano.use(dbname);
        return new Promise((resolve, reject) => {
            db.get(_id, function (err, body) {
                if (!err) {
                    return resolve(body)
                } else {
                    return reject(err.message);
                }
            });
        });

    }

    request(dbname, method, doc, body) {
        return new Promise((resolve, reject) => {
            console.log('db:');
            console.log(body);
            this.nano.request({db: dbname, method, doc, body}, (err, body) => {
                if (err) {
                    reject(err.message)
                } else {
                    resolve(body);
                }
            })
        });
    }

    createIndex(dbname, fields, alisName, type = "json") {
        const body = {
            "index": {
                "fields": [fields]
            },
            "name": alisName,
            "type": type
        }

        return new Promise((resolve, reject) => {
            this.nano.request({db: dbname, method: "POST", doc: "_index", body}, (err, body) => {
                if (err) {
                    reject(err.message)
                } else {
                    resolve(body);
                }
            })
        });
    }

    createView(dbname, viewData) {
        return this.insert(dbname, viewData);
    }

    /**
     * can not use order by;
     * @param dbname
     * @param limit
     * @return {Promise}
     */
    findAll(dbname) {
        let body = {"sort": [{"index": "desc"}]};
        return new Promise((resolve, reject) => {
            this.nano.request({
                db: dbname,
                method: "GET",
                doc: "_all_docs",
                qs: {include_docs: true},
                body
            }, (err, body) => {
                if (err) {
                    reject(err.message)
                } else {
                    resolve(body.rows);
                }
            })
        });
    }

    queryBlock(limit, bookmark) {
        let body = {
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
            ]
        }
        if (limit) {
            body.limit = limit;
        }
        if (bookmark) {
            body.bookmark = bookmark;
        }
        return this.request('block', 'POST', '_find', body);

    }

    replicateFromRemote(source, target, options) {
        return new Promise((resolve, reject) => {
            this.nano.db.replicate(source, target, options, function (err, body) {
                if (err) {
                    reject(err)
                }
                resolve(body)
            })
        });
    }

    view(dbname, designname, viewname, params) {
        return new Promise((resolve, reject) => {
            const db = this.nano.use(dbname);
            db.view(designname, viewname, params, function (err, body) {
                if (err) {
                    return reject(err.msg)
                }
                return resolve(body);
            });
        });
    }


    getBlockByIndex(index){

        const db = this.nano.use('block');
        return new Promise((resolve, reject) => {
            db.get({"index":index}, function (err, body) {
                if (!err) {
                    return resolve(body)
                } else {
                    return reject(err.message);
                }
            });
        });
    }


    findByTranscationHash(dbname, designname, viewname, params) {
        return this.view(dbname, designname, viewname, params);
    }

    findByTranscationOutputsAddress(address) {
        const body = {
            "selector": {
                "transactions": {
                    "$elemMatch": {
                        "data.outputs": {
                            "$elemMatch": {
                                "address": address
                            }
                        }
                    }
                }
            }, "fields": []
        }
        return this.request('block', 'POST', '_find', body);
    }

    findByTranscationInputsAddress(address) {
        const body = {
            "selector": {
                "transactions": {
                    "$elemMatch": {
                        "data.inputs": {
                            "$elemMatch": {
                                "address": address
                            }
                        }
                    }
                }
            }, "fields": []
        }
        return this.request('block', 'POST', '_find', body);
    }
}