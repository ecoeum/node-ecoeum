/**
 * Created by Administrator on 2018-4-2.
 */
'use strict';
const slots = require('./slots');

let lastSlot=0;
function getDelegateId()
{
    var currentSlot = slots.getSlotNumber();
    console.log("currentSlot="+currentSlot);
    //var lastBlock = this.chain.last();
    //assert(!!lastBlock);
    // this.printBlockChain();
    //var lastSlot = slots.getSlotNumber(slots.getTime(lastBlock.getTimestamp() * 1000));
    //console.log("lastSlot="+lastSlot);

    console.log( " Date.now() % 10000="+Date.now() % 10000);
    if (currentSlot === lastSlot || Date.now() % 10000 > 5000) {
        return
    }

    var delegateId = currentSlot % slots.delegates;
    console.log("delegateId"+delegateId);
    lastSlot=currentSlot;
}

setInterval(function () {
    getDelegateId();
}, 1000);