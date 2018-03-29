/**
 * Created by usermtl on 2018-2-26.
 */
'use strict';
const BasicToken=require('./basicToken');
class Contract {

    constructor(jsonObj){
        this._contract=new BasicToken(jsonObj);  //generate token
    }
    //depoly basicToken,save contract file to block
    depoly(stub){


    }
    //Execute contract function
    execute(jsonObj){
        var res=this._contract[jsonObj.functionName](jsonObj);
    }
}

module.exports = Contract;
