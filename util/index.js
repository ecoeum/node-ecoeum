'use strict';

const CryptoJS = require("crypto-js");

module.exports = {
    getHash: data => {
        return CryptoJS.SHA256(data).toString();
    }
};