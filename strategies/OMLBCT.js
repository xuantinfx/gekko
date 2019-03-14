// helpers
var _ = require('lodash');
var log = require('../core/log');
const axios = require('axios');
const moment = require('moment');

// let's create our own method
var method = {};

method.buy = function(amountDollar, price) {
  // cacl new balance and new asset
  if(this.balance >= amountDollar) {
    this.balance = this.balance - amountDollar;
    this.asset = this.asset + amountDollar/price;
  } else {
    log.info(`Not enought money to buy, balance = ${this.balance}, amount dollar = ${amountDollar}`);
  }
}

method.sell = function(amountAsset, price) {
  // cacl new balance and new asset
  if(this.asset >= amountAsset) {
    this.asset = this.asset - amountAsset;
    this.balance = this.balance + amountAsset*price;
  } else {
    log.info(`Not enought asset to sell, asset = ${this.asset}, amount asset = ${amountAsset}`);
  }
}

// prepare everything our method needs
method.init = function() {
  this.balance = this.settings.startBalance;
  this.asset = this.settings.startAsset;
  this.stopLoss = this.settings.stopLoss;
  this.takeProfit = this.settings.takeProfit;
  this.amountForOneTrade = this.settings.amountForOneTrade;
  this.stopTrade = this.settings.stopTrade;
  this.buy = 1, stay = 0;
  // this.advices = [0,1,1,1,1,1,1,0,0,1,1,0,1]

  this.historyTrades = [];
  this.managerTrades = [];
}

method.check = function(candle) {
  let advice = this.buy; // buy or stay
  // buy
  if (advice === this.buy) {
    this.buy(this.amountForOneTrade, candle.close);
    this.managerTrades.push({
      close: candle.close,
      asset: this.amountForOneTrade / candle.close,
      wait: 0,
      isTrading: true
    })
  }

  // sell
  for ( let i = 0; i < this.managerTrades.length; i++ ) {
    let curTrade = this.managerTrades[i];
    // Tăng biến đợi của trade lên 1
    curTrade.wait++;
    let pecentProfit = 100 * (candle.close - curTrade.close)/curTrade.close;

    sell = () => {
      this.sell(curTrade.asset, candle.close);
      curTrade.isTrading = false;
    }

    // Profit gearther than takeProfit
    if(pecentProfit >= this.takeProfit) {
      sell();
    }

    // Profit less than stopLoss
    if(pecentProfit <= this.stopLoss) {
      sell();
    }

    // Vượt quá giới hạn trade
    if(curTrade.wait >= this.stopTrade) {
      sell();
    }    
  }

  
  // Clear trading === false
  this.managerTrades = this.managerTrades.filter(trade => {
    return trade.isTrading === true;
  })

  this.finalClose = candle.close;
}

method.finished = function() {
  // Sell all Asset
  this.sell(this.asset, this.finalClose);
  // Report
  log.write(`Start Balance: \t\t ${this.settings.startBalance}`);
  log.write(`End balance: \t\t ${this.balance}`);
  log.write(`Profit ($): \t\t ${this.balance - this.startBalance}`);
  log.write(`Profit (%): \t\t ${100*(this.balance - this.startBalance)/this.startBalance}`);
}

module.exports = method;