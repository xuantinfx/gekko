// helpers
var _ = require('lodash');
var log = require('../core/log');
// const axios = require('axios');
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

  this.tradesHistory = [];
  this.tradesManager = [];

  this.id = 0;

  this.advice = require('../BTC_USDT_1h_OMLBCT_backtest.json');
}

method.check = function (candle) {
  if (!this.startOpen) {
    this.startOpen = candle.open;
  }

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

  let advice = this.advice[new Date(candle.start).getTime()];
  console.log(new Date(candle.start).getTime(), advice);

  if (advice == 1) {
    if (this.buy(this.amountForOneTrade, candle.close)) {
      this.tradesManager.push({
        close: candle.close,
        asset: this.amountForOneTrade / candle.close,
        wait: 0,
        isTrading: true,
        id: this.id
      })
      if (this.settings.backtest) {
        this.tradesHistory.push({
          asset: this.amountForOneTrade / candle.close,
          candleBuy: candle,
          id: this.id++
        })
      }
    }
  }

  // sell
  for (let i = 0; i < this.tradesManager.length; i++) {
    let curTrade = this.tradesManager[i];
    // Tăng biến đợi của trade lên 1
    curTrade.wait++;
    let pecentProfit = 100 * (candle.close - curTrade.close) / curTrade.close;

    finalizeTrade = (sellingPrice) => {
      curTrade.isTrading = false;
      if (this.settings.backtest) {
        for (let j = 0; j < this.tradesHistory.length; j++) {
          if (this.tradesHistory[j].id === curTrade.id) {
            this.tradesHistory[j].candleSell = candle;
            this.tradesHistory[j].candleSell.sellingPrice = sellingPrice;
          }
        }
      }
    }

    // Profit less than stopLoss
    if (pecentProfit <= this.stopLoss) {
      this.sell(curTrade.asset, candle.low);
      finalizeTrade(candle.low)
    } else

      // Profit greater than takeProfit
      if (pecentProfit >= this.takeProfit) {
        this.sell(curTrade.asset, candle.high);
        finalizeTrade(candle.high)
      } else

        // Vượt quá giới hạn trade
        if (curTrade.wait >= this.stopTrade) {
          this.sell(curTrade.asset, candle.close);
          finalizeTrade(candle.close)
        }
  }
  // Clear trading === false
  this.tradesManager = this.tradesManager.filter(trade => {
    return trade.isTrading === true;
  })

  this.finalClose = candle.close;
  this.finalTime = candle.start;
  // })
}

const caclDistance2Dates = (date1, date2) => {
  let i = 0;
  let diff = date2 - date1;

  return diff / 3600 + 'h';
}

method.finished = function () {
  // Sell all Asset
  this.sell(this.asset, this.finalClose);
  
  // Report
  let totalProfitPerTrade = 0;
  for (let i = 0; i < this.tradesHistory.length; i++) {
    let curTrade = this.tradesHistory[i];
    if (!curTrade.candleSell) {
      console.log(curTrade.id);
      curTrade.candleSell = {
        start: this.finalTime,
        close: this.finalClose,
        sellingPrice: this.finalClose
      }
    }

    log.write(`${curTrade.candleBuy.start.format('DD-MM-YYYY hh-mm-ss')} \t Hold: ${caclDistance2Dates(curTrade.candleBuy.start.unix(), curTrade.candleSell.start.unix())} \t buy: ${curTrade.candleBuy.close} \t sell: ${curTrade.candleSell.sellingPrice} \t profit: ${100* (curTrade.candleSell.sellingPrice - curTrade.candleBuy.close)/curTrade.candleBuy.close} %`)
    totalProfitPerTrade += (100 * (curTrade.candleSell.sellingPrice - curTrade.candleBuy.close) / curTrade.candleBuy.close);
  }
  log.write(`\n`);
  log.write(`Start Balance: \t\t\t ${this.settings.startBalance} $`);
  log.write(`End balance: \t\t\t ${this.balance} $`);
  log.write(`Profit: \t\t\t ${this.balance - this.settings.startBalance} $`);
  log.write(`Total Profit: \t\t\t ${100*(this.balance - this.settings.startBalance)/this.settings.startBalance} %`);
  log.write(`Total Profit Per Trade: \t ${totalProfitPerTrade} %`);
  log.write(`Profit versus Market: \t\t ${100*(this.balance - this.settings.startBalance)/this.startOpen} %`)
  log.write(`Number of profitable trades: \t ${_.filter(this.tradesHistory, curTrade => {
    if (!curTrade.candleSell) {
      return false;
    }
    return (curTrade.candleSell.sellingPrice - curTrade.candleBuy.close) > 0;
  }).length}`);
  log.write(`Number of loss-making trades: \t ${
    _.filter(this.tradesHistory, curTrade => {
      if (!curTrade.candleSell) return false;
      return (curTrade.candleSell.sellingPrice - curTrade.candleBuy.close) < 0;
    }).length
  }`);
  log.write(`Market: \t\t\t ${100 * (this.finalClose - this.startOpen) / this.startOpen} %`);
  log.write(`Start Price (open): \t\t ${this.startOpen} $`);
  log.write(`End Price (close): \t\t ${this.finalClose} $`);
  log.write(`\n`);
}

module.exports = method;
