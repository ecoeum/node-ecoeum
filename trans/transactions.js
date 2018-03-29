'use strict';
const Tran = require('./index');
const R = require('ramda');

class Transactions extends Array {
    static fromJson(data) {
        let transactions = new Transactions();
        R.forEach((transaction) => {
            transactions.push(Tran.fromJson(transaction));
        }, data);
        return transactions;
    }
}

module.exports = Transactions;