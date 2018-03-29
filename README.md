# Node-ecoeum
Node-ecoeum is a block chain project included block chain, chain browser, wallet and Smart Contracts components.It is aiming to propose a relatively simple block chain model to implement a relatively single application scenario. such as integration, archival storage and sharing applications program.Node-ecoeum is applied Node.js, koa, Crypto-js, couchdb and other technologies.Node-ecoeum is still at the stage of development.
## Features
- Easy to install: clone source code, using npm install to complete the installation. Use Docker packaging is next plan.
- Easy to understand: the code structure is by domain, divided into nodes, blocks, accounts, consensus, transactions and other  domains, the boundaries of each domain is clear, easy to understand
- High-performance: using node.js , event driven and non-blocking I/O models
- big file support: using couchdb as the block storage, supporting the storage of big files
- Completeness: Node-ecoeum is still at the stage of development, yet it already has a complete concept of nodes, blocks, storage, accounts, mining, consensus, trading, APIs, browsers, wallets, contracts.
## Install
### install node.js
https://nodejs.org/  node.js version:v7.9.0+
### install Couchdb
http://docs.couchdb.org/en/2.1.1/install/unix.html#installing
version: 2.1.1+
Linux：/home/couchdb/couchdb/etc/default.ini modify bind_address = 0.0.0.0
WINDOWS:  couchdb/etc/default.ini  modify bind_address = 0.0.0.0
### install application
clone source code
npm install
## Run
node ecoeum.js
## Test
### transaction
curl -H "Content-type: application/json" -X POST -d '{secretKey: param1,	fromAddressId: param2,
    toAddressId:param3, amount:param4, changeAddressId:param4}'   http://127.0.0.1:3000/account/createtrans
request example:
{
    "secretKey": "c649202451c01197c060a24efc191c2bf1a0894611e7d65e07a7c024fb55742ab4eeaf57f83007a115ac70925430385cc0140f4f9e153a951d3147e107d50dabf90d17ee4ea1bff6c9e4088d50c2fad5695acee4841d626609afabe66e16de5469485d969811efd3509fb238775b11ae2efa241c4907fee582db0c54e651c1a128d91321adb05184f562cab1fe35649dd890465f1dbed2c9b6582c03a2f945da03c7a9b6e5d23f4af42b91fc0662f5e0938391cf24c74fa4ab87fea66b3a3d0e4e82505fbe2f646d5f6ecfa62d3d7d6fd2cc3ce330d59d0f0926a84a38f4947513731f4335c6e99a46cc67d75cf266f9e930e02fdcb156830cf10e58cbc460a0132f951b88d36bb1e89ef19fa6636d025b4df025b3fc0d5001a63aaaaaa55a57b3e5b70e0dbfa37763b80d40e6f687c30e35c6c8949b176c03d88741de5baee4ffff82bddaeb14479a09d3d03178977e70955cb450fccd30d323356aea75b447944de3ff7e417eb42594c60384e9f0d8e18c502cc3680be4562582b52dbbfb89bb1a7a7e7c87391cf71315d7f5df7d55643f65081571004a080aab7031ec3e88ec797ba13a0240bbf8c5543c963bf6bbc3e378c1f2445ae0a5561b5a75548ae5e0242eb52b1d14e59d7354a0fbbabea23e557c59d4aa562ecd0fff8af98d865d9c0dd4d959d032445543fa3a98bc57d331a7fbd81dbf2a21c2ca5e9fe229be72",
    "fromAddressId": "c6941e8a70b9b234139bda93b51efd7393194782b2a7bd8fcbeb5fc712061ae8",
    "toAddressId":"4b129e06a81f57e5bef2ca673fe751b91c024cfb87f13ece3d3897af79736740",
    "amount":6,
    "changeAddressId":"c6941e8a70b9b234139bda93b51efd7393194782b2a7bd8fcbeb5fc712061ae8"
}
### peer
curl -H "Content-type:application/json" -X POST 'http://127.0.0.1:3000/peer/list'
### block
curl -X GET --header 'Content-Type: application/json' 'http://127.0.0.1:3000/blocks'
## Thans
 Some ideas and codes come from conradoqg's naivecoin project
 https://github.com/conradoqg/naivecoin
 Thank you very much, conradoqg.