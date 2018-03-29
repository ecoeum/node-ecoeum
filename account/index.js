'use strict';
const R = require('ramda');
const util = require('../util');
const Wallet = require('./wallet');
const CryptoEdDSAUtil = require('../util/cryptoEdDSAUtil');
const request = require('co-request');
const config = require('../ecoeum-config');
const transcation_types = require('../trans/transcation_types');
const UUID = require('node-uuid');
const moment = require('moment');
const Transcation = require('../trans');
const TransBuilder = require('../trans/TransBuilder');
const CryptoUtil = require('../util/cryptoUtil');
const AppError = require('../util/appError');

const accountDocumentId = 'account20180224132315';

class Account {

    constructor(dbName, blocks) {
        this.blocks = blocks;
    }

    createNewAccountByPassword(password) {
        const secret = CryptoEdDSAUtil.generateSecret(password);
        //console.log(secret);
        const keyPairRaw = CryptoEdDSAUtil.generateKeyPairFromSecret(secret);
        const key = {
            secretKey: CryptoEdDSAUtil.toHex(keyPairRaw.getSecret()),
            publicKey: CryptoEdDSAUtil.toHex(keyPairRaw.getPublic())
        }
        //广播到自己;
        this.broadcast(key.publicKey);
        return key;
    }

    broadcast(publicKey) {
        const timestamp = moment().format('X');
        const URL = `http://${config.peer.host}:${config.peer.port}/newtrans`;


        let transcation = Transcation.fromJson({
            id: CryptoUtil.randomId(64),
            hash: null,
            type: transcation_types.CREATEUSER,
            data: {
                inputs: [],
                outputs: [
                    {
                        amount: 0,
                        address: publicKey,
                    }
                ]
            }
        });

        return request({
            url: URL,
            method: "POST",
            json: true,
            headers: {"content-type": "application/json",},
            body: transcation
        });
    }

    async createTrans(secretKey, fromAddressId, toAddressId, amount, changeAddressId) {

        const keyPairRaw = CryptoEdDSAUtil.generateKeyPairFromSecret(secretKey);

        if (CryptoEdDSAUtil.toHex(keyPairRaw.getPublic()) != fromAddressId) {
            throw new AppError(`Secret key Error`);
        }
        //TODO: Here you need to verify that the sender's address is a valid address

        //unspentTransactions;
        let unspentTransactions = await this.blocks.getUnspentTransactionsForAddress(fromAddressId);
        let tx = new TransBuilder();
        tx.from(unspentTransactions);
        tx.to(toAddressId, amount);
        tx.change(changeAddressId || fromAddressId);
        tx.fee(config.FEE_PER_TRANSACTION);
        tx.sign(secretKey);
        tx.setType(transcation_types.SEND);
        let newTransaction = Transcation.fromJson(tx.build());
        return newTransaction;
    }

}

module.exports = Account
