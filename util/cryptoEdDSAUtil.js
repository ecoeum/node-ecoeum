const crypto = require('crypto');
const elliptic = require('elliptic');
const EdDSA = elliptic.eddsa;
const moment = require('moment');
const ec = new EdDSA('ed25519');
const SALT = 'w1nqniytk6uhu5so6zzqd23749b9xx93s9625cmnqv9bb4z3wzgwlzw0sbcheq8r';

class CryptoEdDSAUtil {
    static generateSecret(password) {
        const MYSALT = SALT + moment().format('x');
        let secret = crypto.pbkdf2Sync(password, MYSALT, 10000, 512, 'sha512').toString('hex');
        return secret;
    }

    static generateKeyPairFromSecret(secret) {
        // Create key pair from secret
        let keyPair = ec.keyFromSecret(secret); // hex string, array or Buffer        
        //console.debug(`Public key: \n${elliptic.utils.toHex(keyPair.getPublic())}`);
        return keyPair;
    }

    static signHash(keyPair, messageHash) {
        let signature = keyPair.sign(messageHash).toHex().toLowerCase();
        //console.debug(`Signature: \n${signature}`);
        return signature;
    }

    static verifySignature(publicKey, signature, messageHash) {
        let key = ec.keyFromPublic(publicKey, 'hex');
        let verified = key.verify(messageHash, signature);
        //console.debug(`Verified: ${verified}`);
        return verified;
    }

    static toHex(data) {
        return elliptic.utils.toHex(data);
    }
}

module.exports = CryptoEdDSAUtil;