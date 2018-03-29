/**
 * Created by usermtl on 2018-2-26.
 */
const Contract=require('./index');
var stub;
var jsObj={
    "stub":stub,
    "name" : 'testToken',
    "symbol":"TKN",
    "decimals":1000000,
    "totalSupply":1000000000,
    "owner":'0x00'
}
var objCon=new Contract(jsObj);

 jsObj={
     "stub":stub,
    "functionName" : 'totalSupply',
    "symbol":"TKN",
    "decimals":1000000,
    "totalSupply":1000000000,
    "owner":'0x00'
}
objCon.execute(jsObj);



jsObj={
    "stub":stub,
    "functionName" : 'setBalance',
    "address":"0x00",
    "balance":9999999
}
objCon.execute(jsObj);








//objCon.execute('totalSupply',params);
//params=(stub,'0x00');

//objCon.execute('balanceOf',(stub,'0x00'));