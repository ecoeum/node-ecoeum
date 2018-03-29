'use strict';
const assert = require("assert");
const Account = require('../../account')
const CryptoEdDSAUtil = require('../../util/cryptoEdDSAUtil');
const CryptoUtil = require('../../util/cryptoUtil');
describe('Account', function () {
    it("createNewAccountByPassword", function (done) {
        const account = new Account(null, null);
        let password = "password"
        const key = account.createNewAccountByPassword(password);
        done();
    });

    it("checkPassword", function (done) {
        const secretKey = '36a7f23757fd7b6116b7d7e158ec1badf3d2a126927bd51e2cf06640293ca02cadaf08d99c3b5e915d0abba8636776a9b240d8819e0f470d22043f88f47caf839c0da9f485aa13eb934e0ceb175439febe97a9d4b5f477353d70aff138ef9c8dda9606ca57e9d758b9f83da4ce4714d1cf25d3691ffd5fcb6e838d897cee805afe77045e3135c0ff058931ca3d1198f09d08158297b196ac69434c558c08ea14f5ba8f136b40b63abf007fceb3fc116bf80113a7d1992051137548d7186341d717b99f7d683318619567dfdad799e38b07ddd9994130479ffe9f10931a90437cf0a597caec5fafdf476f84c826c63f54ad53f606855d67a1c3e020b06bd54222c7aa74b8d287ffaa36cf67464cc0b0120f329da1053a9fa29c374d26a6a5ceadddc17b88f0f5627ce8cfb71d1fa283659deeb322122b8870897d810e3564750669570fbc756079c23e8887c7d4fe36d8014e37ca35e47194d6d756d655c306bee589f1ff2e7482e75e157d0fbf6a1a5eb15a3fbcfc0ffa0289001400a250459fb067fa015100524c24ca8d097755bdcebaeeb36bc7186037c224ebcff412a5665002ff61ea0f57c958182c0d8eb246afb2dfd4a43fb32dd0ebae55a789cf8d5c9c2df83bf49884f5fd990a4e4b0b92e2d0a060805b675dc3f4875891fa3545a26035b4650cec588338e4dd87b096f9c7a55de173aa9babc0cc31bbe04cb382ac';
        const publicKey = '40f5d68e2df7df4780484d8f6f806a2c784067014c04799147f0d028600618e4';
        const keyPairRaw = CryptoEdDSAUtil.generateKeyPairFromSecret(secretKey);
        console.log(publicKey == CryptoEdDSAUtil.toHex(keyPairRaw.getPublic()));
        done();
    });
    it("sign", function (done) {
        const secretKey = '36a7f23757fd7b6116b7d7e158ec1badf3d2a126927bd51e2cf06640293ca02cadaf08d99c3b5e915d0abba8636776a9b240d8819e0f470d22043f88f47caf839c0da9f485aa13eb934e0ceb175439febe97a9d4b5f477353d70aff138ef9c8dda9606ca57e9d758b9f83da4ce4714d1cf25d3691ffd5fcb6e838d897cee805afe77045e3135c0ff058931ca3d1198f09d08158297b196ac69434c558c08ea14f5ba8f136b40b63abf007fceb3fc116bf80113a7d1992051137548d7186341d717b99f7d683318619567dfdad799e38b07ddd9994130479ffe9f10931a90437cf0a597caec5fafdf476f84c826c63f54ad53f606855d67a1c3e020b06bd54222c7aa74b8d287ffaa36cf67464cc0b0120f329da1053a9fa29c374d26a6a5ceadddc17b88f0f5627ce8cfb71d1fa283659deeb322122b8870897d810e3564750669570fbc756079c23e8887c7d4fe36d8014e37ca35e47194d6d756d655c306bee589f1ff2e7482e75e157d0fbf6a1a5eb15a3fbcfc0ffa0289001400a250459fb067fa015100524c24ca8d097755bdcebaeeb36bc7186037c224ebcff412a5665002ff61ea0f57c958182c0d8eb246afb2dfd4a43fb32dd0ebae55a789cf8d5c9c2df83bf49884f5fd990a4e4b0b92e2d0a060805b675dc3f4875891fa3545a26035b4650cec588338e4dd87b096f9c7a55de173aa9babc0cc31bbe04cb382ac';
        const publicKey = '40f5d68e2df7df4780484d8f6f806a2c784067014c04799147f0d028600618e4';
        const keyPairRaw = CryptoEdDSAUtil.generateKeyPairFromSecret(secretKey);
        const message = "99999";
        const messageHash = CryptoUtil.hash(message)+'111';
        console.log(messageHash);
        const sign = CryptoEdDSAUtil.signHash(keyPairRaw, messageHash);
        console.log(sign);

        const verified = CryptoEdDSAUtil.verifySignature(publicKey, sign, messageHash);
        console.log(verified);
        //let isValidSignature = CryptoEdDSAUtil.verifySignature(txInput.address, txInput.signature, txInputHash);
        done();
    });
});