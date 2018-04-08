/**
 * Created by Administrator on 2018-4-2.
 */
'use strict';
const slots = require('./slots');

let lastSlot=0;
function getDelegateId()
{

    var lastslot=slots.getSlotNumber(slots.getTime(1523103954 * 1000));
    console.log("11111"+lastslot);

    var currentSlot = slots.getSlotNumber();
    //console.log(currentSlot);
    //var lastBlock = this.chain.last();
    //assert(!!lastBlock);
    // this.printBlockChain();
    //var lastSlot = slots.getSlotNumber(slots.getTime(lastBlock.getTimestamp() * 1000));
    //console.log("lastSlot="+lastSlot);

     console.log( " Date.now() % 20000="+Date.now() % 20000);
    // if (currentSlot === lastSlot || Date.now() % 10000 > 5000) {
    //     return
    // }

    //console.log("new method timestamp");
    //console.log(slots.getSlotTime(currentSlot))
    const timestamp=slots.getSlotTime(currentSlot);
    const genSlotNumber=slots.getSlotNumber(timestamp);
    console.log("generate next block slotnumber used slots.getSlotTime(currentSlot) is ");
    console.log("%d %d",currentSlot,genSlotNumber);

    if(currentSlot!=genSlotNumber){
        console.log("error, generate slotnumber by orginal slotnumber is not equal!")
    }
    //console.log("slot generator slotnumber is ");
    //console.log(slots.getSlotNumber());


    var delegateId = currentSlot % slots.delegates;
    console.log("delegateId"+delegateId);
    lastSlot=currentSlot;
}

setInterval(function () {
    getDelegateId();
}, 1000);