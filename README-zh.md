# node-ecoeum
[英文](https://github.com/ecoeum/node-ecoeum)

node-ecoeum是ecoeum协议的nodejs实现。ecoeum是一个区块链项目，包含了区块链、链浏览器、钱包和具体应用合约等，旨在提出相对简单的区块链模型，降低区块链的开发难度，满足企业自主实现功能相对单一的应用场景，如积分、档案存储与共享。node-ecoeum由node.js、koa、crypto-js、couchdb等技术创建。目前node-ecoeum仍在开发中。

## 主要特性
* 易安装：下载源码安装，使用npm install即可完成安装。下一步将采用docker打包
* 易理解：代码结构按领域划分，分为节点、块、账户、共识、交易等领域，各个领域界线清楚，代码易于理解
* 高效性：使用node.js开发，基于事件驱动和非阻塞I/O模型
* 大文件支持：采用couchdb做为块存储，支持存储大文件
* 完备性：虽然node-ecoeum仍在开发中，但已具备了节点、块、存储、账户、挖矿、共识、交易、API、浏览器、钱包、合约等完整概念，而不是只在内存里实现一个链结构。
## 安装
### 1、安装node.js
参见https://nodejs.org/
node.js 版本:v7.9.0及以上
### 2、安装Couchdb
参见http://docs.couchdb.org/en/2.1.1/install/unix.html#installing
建议版本2.1.1及以上
安装完毕后开放外部访问：
Linux：配置 /home/couchdb/couchdb/etc/default.ini 修改 bind_address = 0.0.0.0
WINDOWS:配置  couchdb/etc/default.ini 修改 bind_address = 0.0.0.0
### 3、安装应用
git clone https://github.com/ecoeum/node-ecoeum

npm install

## 运行
运行两个节点的区域链。
node ecoeum.js
## 测试
### 1、交易
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
### 2、节点
curl -H "Content-type:application/json" -X POST 'http://127.0.0.1:3000/peer/list'
request example:
[
    {
        "url":"http://192.168.10.112:3000",
        "status":"1",
        "height":108,
        "isMiner":false
    },{
        "url":"http://192.168.10.19:3000",
        "status":"0",
        "height":0,
        "isMiner":false
    }
]
### 3、块查看
curl -X GET --header 'Content-Type: application/json' 'http://127.0.0.1:3000/blocks' 
 result demo:
			 {
			"index": 220,
			"nonce": 0,
			"previousHash": "6d4d647ef5cf3bf73366964bdb9c7d5b96e5d855186393a486ad0039a176980c",
			"timestamp": 1521777593,
			"transactions": [
			{
			"id": "8473b62f3d1ff806c17613ec4aeeafcad18ac8ffb9c7ab069c01aab4136a1975",
			"hash": "fb28e8a14babefdda3553de3a7c0b0f81afdc634ca3e4dd6a7533531700665dd",
			"type": "reward",
			"data": {
			"inputs": [],
			"outputs": [
			{
			"amount": 5,
			"address": "4b129e06a81f57e5bef2ca673fe751b91c024cfb87f13ece3d3897af79736740"
			}
			]
			}
			}
			],
			"miner": "4b129e06a81f57e5bef2ca673fe751b91c024cfb87f13ece3d3897af79736740",
			"hash": "1400b56a61acc62f67a220d532eed8497488020c1f9a463357cb02eb5a75f185"
			},

## 致谢
一些想法和代码来自conradoqg的naivecoin项目（https://github.com/conradoqg/naivecoin）
非常感谢conradoqg。
## License
MIT license