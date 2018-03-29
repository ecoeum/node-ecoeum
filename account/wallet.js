'use strict';
const R = require('ramda');
const CryptoUtil = require('../util/cryptoUtil');
const CryptoEdDSAUtil = require('../util/cryptoEdDSAUtil');

class Wallet {
    constructor() {
        this.id = null;
        this.passwordHash = null;
        this.secret = null;
        this.keyPairs = [];
    }

    static createAccount(){
        return generateAddress();
    }

    static fromPassword(password) {
        let wallet = new Wallet();
        wallet.id = CryptoUtil.randomId();
        wallet.passwordHash = CryptoUtil.hash(password);
        return wallet;
    }

    generateAddress() {
        if (this.secret == null) {
            this.generateSecret();
        }
        const lastKeyPair = R.last(this.keyPairs);

        let seed = (lastKeyPair == null ?  this.secret : CryptoEdDSAUtil.generateSecret(R.propOr(null, 'secretKey', lastKeyPair)));

        let keyPairRaw = CryptoEdDSAUtil.generateKeyPairFromSecret(seed);

        let newKeyPair = {
            index: this.keyPairs.length + 1,
            secretKey: CryptoEdDSAUtil.toHex(keyPairRaw.getSecret()),
            publicKey: CryptoEdDSAUtil.toHex(keyPairRaw.getPublic())
        };
        this.keyPairs.push(newKeyPair);
        return newKeyPair.publicKey;
    }

    generateSecret() {
        this.secret = CryptoEdDSAUtil.generateKeyPairFromSecret(this.passwordHash);
        return this.secret;
    }

    getAddresses() {

    }


}

module.exports = Wallet;
