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

  this.historyTrades = [];
  this.managerTrades = [];

  this.id = 0;

  this.advice = require('../BTC_USDT_1h_OMLBCT_backtest.json');
}

method.check = function (candle) {
  if (!this.startClose) {
    this.startClose = candle.close;
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
  let advice = this.advice[new Date(candle.start).getTime()] || 0;

  if (advice == 1) {
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
        for (let j = 0; j < this.historyTrades.length; j++) {
          if (this.historyTrades[j].id === curTrade.id) {
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
  let totalProfit = 0;
  for (let i = 0; i < this.historyTrades.length; i++) {
    let curTrade = this.historyTrades[i];
    if (!curTrade.candleSell) {
      curTrade.candleSell = {
        start: this.finalTime,
        close: this.finalClose
      }
    }

    log.write(`${curTrade.candleBuy.start.format('DD-MM-YYYY hh-mm-ss')} \t Hold: ${caclDistance2Dates(curTrade.candleBuy.start.unix(), curTrade.candleSell.start.unix())} \t buy: ${curTrade.candleBuy.close} \t sell: ${curTrade.candleSell.close} \t profit: ${100* (curTrade.candleSell.close - curTrade.candleBuy.close)/curTrade.candleBuy.close} %`)
    totalProfit += (100 * (curTrade.candleSell.close - curTrade.candleBuy.close) / curTrade.candleBuy.close);
  }
  log.write(`\n`);
  log.write(`Start Balance: \t\t ${this.settings.startBalance}`);
  log.write(`End balance: \t\t ${this.balance}`);
  log.write(`Profit ($): \t\t ${this.balance - this.settings.startBalance} $`);
  log.write(`Profit (%): \t\t ${100*(this.balance - this.settings.startBalance)/this.settings.startBalance} %`);
  log.write(`Total Profit: \t\t ${totalProfit}`)
  log.write(`Trade make profit up: \t ${_.filter(this.historyTrades, curTrade => {
    if (!curTrade.candleSell) {
      return false;
    }
    return (curTrade.candleSell.close - curTrade.candleBuy.close) > 0;
  }).length}`);
  log.write(`Trade make profit down:  ${
    _.filter(this.historyTrades, curTrade => {
      if (!curTrade.candleSell) return false;
      return (curTrade.candleSell.close - curTrade.candleBuy.close) < 0;
    }).length
  }`);
  log.write(`Market: \t\t ${100 * (this.finalClose - this.startClose) / this.startClose} %`);
  log.write(`Start Price: \t\t ${this.startClose} $`);
  log.write(`End Price: \t\t ${this.finalClose} $`);
  log.write(`\n`);
}

module.exports = method;
