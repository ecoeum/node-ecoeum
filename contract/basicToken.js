/**
 * Created by usermtl on 2018-2-26.
 */
'use strict';

class BasicToken {
    /*
    var _name;   token name
    var _symbol; token symbole
    var _decimals; token decimals
    var _totalSupply; token totalsupply
    var _owner;;    token owner
    */
    constructor(jsonObj) {
        var resMap=new Map();
        this._name = jsonObj.name;
        this._symbol=jsonObj.symbol;
        this._decimals=jsonObj.decimals;
        this._totalSupply=jsonObj.totalSupply;
        this._owner=jsonObj.owner;
        jsonObj.balance=jsonObj.totalSupply;
        this.setBalance(jsonObj);
        resMap.set("function","constructor");
        resMap.set("isToken",true);  //is token contract or not
        resMap.set("name",this._name);
        resMap.set("symbol",this._symbol);
        resMap.set("decimals",this._decimals);
        resMap.set("totalSupply",this._totalSupply);
        resMap.set("owner",this._owner);
        resMap.set("balances",this._totalSupply);  //balance of owner
      //  jsonObj.stub.setData(resMap);   //store contract info to stub
    };

    //total supply
    totalSupply(jsonObj) {
        var reqMap=new Map();
        reqMap.set("function","totalSupply");
        reqMap.set("isToken",true);  //is token contract or not
        reqMap.set("name",this._name);
        reqMap.set("symbol",this._symbol);
        //var resSupply=jsonObj.stub.getData(reqMap);  //get contract totoal supply from stub
        //return this.resSupply;
        return this._totalSupply;
    };

    //get owner
    owner(jsonObj)
    {
        var reqMap=new Map();
        reqMap.set("isToken",true); //is token contract or not
        reqMap.set("name",this._name);
        resMap.set("symbol",this._symbol);
        resMap.set("function","owner");
        var resOwner=jsonObj.stub.getData(reqMap);  //get constract owner from stub
        return resOwner;
    }

    //balance of address
    balanceOf(jsonObj){
        console.log('address='+jsonObj.address);
        var reqMap=new Map();
        reqMap.set("isToken",true);  //is token contract or not
        reqMap.set("name",this._name);
        reqMap.set("symbol",this._symbol);
        reqMap.set("address",jsonObj.address);
        reqMap.set("function","balanceOf");
       // var resBalance=jsonObj.stub.getData(reqMap);  //get balance of address from stub
       // return resBalance;
        return this._totalSupply;
    }

    setBalance(jsonObj){
        var reqMap=new Map();
        reqMap.set("isToken",true);  //is token contract or not
        reqMap.set("name",this._name);
        reqMap.set("symbol",this._symbol);
        reqMap.set("address",jsonObj.address);
        reqMap.set("balance",jsonObj.balance);
        reqMap.set("function","setBalance");
        //var resBalance=jsonObj.stub.setData(reqMap);   //set balance of address to stub
        //return resBalance;
        return jsonObj.balance;
    }

    //transfer
    transfer(jsonObj){
        var ownerBalance=balanceOf(jsonObj.stub,this._owner);
        var addressBalance=balanceOf(jsonObj.stub,jsonObj.address);
        if(ownerBalance<value) {
            ownerBalance=ownerBalance-value;
            addressBalance=addressBalance+value;
        }

        //set owner balance
        setBalance(
            {
                "stub":jsonObj.stub,
                "address":this._owner,
                "balance":ownerBalance
            })
        //set to balance
        setBalance({
            "stub":jsonObj.stub,
            "address":jsonObj.address,
            "balance":addressBalance
        });
    }

    //Transfer
    Transfer(jsonObj){
        var fromBalance=balanceOf(jsonObj.stub,jsonObj.fromAddress);
        var toBalance=balanceOf(jsonObj.stub,jsonObj.toAddress);
        if(fromBalance<toBalance) {
            fromBalance=fromBalance-value;
            toBalance=toBalance+value;
        }
        //set from balance
        setBalance(
            {
                "stub":jsonObj.stub,
                "address":jsonObj.fromAddress,
                "balance":fromBalance
            })
        //set to balance
        setBalance(
            {
                "stub":jsonObj.stub,
                "address":jsonObj.toAddress,
                "balance":toBalance
            })
    }
}

//module.exports = BasicToken;
