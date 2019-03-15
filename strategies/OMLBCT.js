// helpers
var _ = require('lodash');
var log = require('../core/log');
const axios = require('axios');
const moment = require('moment');

// let's create our own method
var method = {};

method.buy = function (amountDollar, price) {
  // cacl new balance and new asset
  if (this.balance >= amountDollar) {
    this.balance = this.balance - amountDollar;
    this.asset = this.asset + amountDollar / price;
    return true;
  } else {
    log.info(`Not enough money to buy, balance = ${this.balance}, amount dollar = ${amountDollar}`);
    return false;
  }
}

method.sell = function (amountAsset, price) {
  // cacl new balance and new asset
  if (this.asset - amountAsset >= -0.000001) { // Sai số qua nhiều lần mua bán
    this.asset = this.asset - amountAsset;
    this.balance = this.balance + amountAsset * price;
    return true;
  } else {
    log.info(`Not enough asset to sell, asset = ${this.asset}, amount asset = ${amountAsset}`);
    return false;
  }
}

// prepare everything our method needs
method.init = function () {
  // config.OMLBCT = {
  //   startBalance: 2500,
  //   startAsset: 0,
  //   stopLoss: -8,
  //   takeProfit: 2,
  //   amountForOneTrade: 100,
  //   stopTrade: 24
  // }

  // Cấu hình random siêu lời
  // startBalance: 2500,
  // startAsset: 0,
  // stopLoss: -2,
  // takeProfit: 4,
  // amountForOneTrade: 100,
  // stopTrade: 24,
  // backtest: true
  this.balance = this.settings.startBalance;
  this.asset = this.settings.startAsset;
  this.stopLoss = this.settings.stopLoss;
  this.takeProfit = this.settings.takeProfit;
  this.amountForOneTrade = this.settings.amountForOneTrade;
  this.stopTrade = this.settings.stopTrade;
  // this.advices = [0,1,1,1,1,1,1,0,0,1,1,0,1]

  this.historyTrades = [];
  this.managerTrades = [];

  this.id = 0;
}

method.check = function (candle) {
  let advice = Math.floor((100*Math.random()) % 2);
  // axios.get('http://localhost:5000/rf_advice', {
  //   params: {
  //     open: candle.open,
  //     high: candle.high,
  //     low: candle.low,
  //     close: candle.close,
  //     volume: candle.volume,
  //     trades: candle.trades,
  //   }
  // }).then((result) => {
    // buy
    if (advice === 1) {
      if (this.buy(this.amountForOneTrade, candle.close)) {
        this.managerTrades.push({
          close: candle.close,
          asset: this.amountForOneTrade / candle.close,
          wait: 0,
          isTrading: true,
          id: this.id
        })
        if (this.settings.backtest) {
          this.historyTrades.push({
            asset: this.amountForOneTrade / candle.close,
            candleBuy: candle,
            id: this.id++
          })
        }
      }
    }

    // sell
    for (let i = 0; i < this.managerTrades.length; i++) {
      let curTrade = this.managerTrades[i];
      // Tăng biến đợi của trade lên 1
      curTrade.wait++;
      let pecentProfit = 100 * (candle.close - curTrade.close) / curTrade.close;

      sell = () => {
        this.sell(curTrade.asset, candle.close);
        curTrade.isTrading = false;
        if (this.settings.backtest) {
          for(let j = 0; j < this.historyTrades.length; j++) {
            if(this.historyTrades[j].id === curTrade.id) {
              this.historyTrades[j].candleSell = candle;
            }
          }
        }
      }

      // Profit greater than takeProfit
      if (pecentProfit >= this.takeProfit) {
        sell();
      } else

      // Profit less than stopLoss
      if (pecentProfit <= this.stopLoss) {
        sell();
      } else

      // Vượt quá giới hạn trade
      if (curTrade.wait >= this.stopTrade) {
        sell();
      }
    }
    // Clear trading === false
    this.managerTrades = this.managerTrades.filter(trade => {
      return trade.isTrading === true;
    })

    this.finalClose = candle.close;
  // })
}

const caclDistance2Dates = (date1, date2) => {
  let i = 0;
  let diff = date2 - date1;

  return diff/3600 + 'h';
}

method.finished = function () {
  // Sell all Asset
  this.sell(this.asset, this.finalClose);
  // Report
  for(let i = 0; i < this.historyTrades.length; i++) {
    let curTrade = this.historyTrades[i];
    if(curTrade.candleSell) {
      log.write(`Hold: ${caclDistance2Dates(curTrade.candleBuy.start.unix(), curTrade.candleSell.start.unix())} \t\t buy: ${curTrade.candleBuy.close} \t\t sell: ${curTrade.candleSell.close} \t\t profit: ${100* (curTrade.candleSell.close - curTrade.candleBuy.close)/curTrade.candleBuy.close} %`)
    }
  }
  log.write(`Start Balance: \t\t ${this.settings.startBalance}`);
  log.write(`End balance: \t\t ${this.balance}`);
  log.write(`Profit ($): \t\t ${this.balance - this.settings.startBalance} $`);
  log.write(`Profit (%): \t\t ${100*(this.balance - this.settings.startBalance)/this.settings.startBalance} %`);
}

module.exports = method;
