'use strict';
const crypto = require('crypto');

class CryptoUtil {
    static hash(data) {
        const str = typeof (data) == 'object' ? JSON.stringify(data) : data.toString();
        return crypto.createHash('sha256').update(str).digest('hex');
    }

    static randomId(size = 64) {
        return crypto.randomBytes(Math.floor(size / 2)).toString('hex');
    }

}

module.exports = CryptoUtil;