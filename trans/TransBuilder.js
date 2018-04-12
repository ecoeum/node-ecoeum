/*
 Some ideas and codes come from conradoqg's naivecoin project
 https://github.com/conradoqg/naivecoin
 Thank you very much, conradoqg.
 */
'use strict';
const R = require('ramda');
const CryptoUtil = require('../util/cryptoUtil');
const CryptoEdDSAUtil = require('../util/cryptoEdDSAUtil');
const AppError = require('../util/appError');
const Transaction = require('../trans');

module.exports = class TransactionBuilder {
    constructor() {
        this.listOfUTXO = null;
        this.outputAddresses = null;
        this.totalAmount = null;
        this.changeAddress = null;
        this.feeAmount = 0;
        this.secretKey = null;
        this.type = 'regular';
        //todo:add by usermtl
        this.coinRate='';  //token:main coin=0.05
        this.coinName=''; //token name
        this.content='';  //save other content
    }

    from(listOfUTXO) {
        this.listOfUTXO = listOfUTXO;
        return this;
    }

    to(address, amount) {
        this.outputAddress = address;
        this.totalAmount = amount;
        return this;
    }

    change(changeAddress) {
        this.changeAddress = changeAddress;
        return this;
    }

    fee(amount) {
        this.feeAmount = amount;
        return this;
    }

    sign(secretKey) {
        this.secretKey = secretKey;
        return this;
    }

    setType(type) {
        this.type = type;
        return this;
    }

    setCoinRate(coinRate) {
        this.coinRate = coinRate;
        return this;
    }

    setCoinName(coinName) {
        this.coinName = coinName;
        return this;
    }

    setContent(content) {
        this.content = content;
        return this;
    }


    //todo: usermtl ->if judge utxo relative operation
    needJudgeUtxo()
    {
        if(this.type=="CREATETOKEN" || this.type=="CREATEDOC" )
            return false;
        else
            return true;
    }

    //todo: usermtl ->if judge utxo outputAddress operation
    needJudgeoutputAddress()
    {
        if(this.type=="CREATETOKEN" || this.type=="CREATEDOC" )
            return false;
        else
            return true;
    }

    //todo: usermtl ->if judge utxo totalAmount operation
    needJudgeTotalAmount()
    {
        if(this.type=="CREATETOKEN" || this.type=="CREATEDOC" )
            return false;
        else
            return true;
    }

    build() {
        if(this.needJudgeUtxo())
            if (this.listOfUTXO == null) throw new AppError('It\'s necessary to inform a list of unspent output transactions.');
        if(this.needJudgeoutputAddress())
            if (this.outputAddress == null) throw new AppError('It\'s necessary to inform the destination address.');
        if(this.needJudgeTotalAmount())
        {
            if (this.totalAmount == null) throw new AppError('It\'s necessary to inform the transaction value.');
            let totalAmountOfUTXO = R.sum(R.pluck('amount', this.listOfUTXO));
            let changeAmount = totalAmountOfUTXO - this.totalAmount - this.feeAmount;
        }

        let self = this;
        let inputs = R.map((utxo) => {
            let txiHash = CryptoUtil.hash({
                transaction: utxo.transaction,
                index: utxo.index,
                address: utxo.address
            });
            utxo.signature = CryptoEdDSAUtil.signHash(CryptoEdDSAUtil.generateKeyPairFromSecret(self.secretKey), txiHash);
            return utxo;
        }, this.listOfUTXO);

        let outputs = [];

        if(this.needJudgeTotalAmount())
        {
            // Add target receiver
            outputs.push({
                amount: this.totalAmount,
                address: this.outputAddress
            });

            // Add change amount
            if (changeAmount > 0) {
                outputs.push({
                    amount: changeAmount,
                    address: this.changeAddress
                });
            } else {
                //if (this.type != 'CREATEUSER') {  todo:usermtl
                if (this.type == 'SEND') {
                    throw new AppError('The sender does not have enough to pay for the transaction.' + this.type);
                }
            }
        }

        // The remaining value is the fee to be collected by the block's creator.

        return Transaction.fromJson({
            id: CryptoUtil.randomId(64),
            hash: null,
            type: this.type,
            data: {
                inputs: inputs,
                outputs: outputs
            },
            //todo:usermlt
            coinRate:this.coinRate,
            coinName:this.coinName,
            content:this.content
        });
    }
}