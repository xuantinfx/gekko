// helpers
var _ = require('lodash');
var log = require('../core/log');
const axios = require('axios');
const moment = require('moment');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  // add the indicator to the strategy
  // define the indicators we need
  this.addIndicator('rsi', 'RSI', this.settings);
  this.addIndicator('macd', 'MACD', this.settings);
  this.results = require('../Result_Backtest.json');
  this.info = {
    bought: false,
    closePriceAtBought: 0
  };
  this.stopLoss = 0.0002;
  this.takeProfit = 0.004;
}

// what happens on every new candle?
method.update = function(candle) {

}

method.log = function(candle) {

}

method.check = function(candle) {
  let rsi = this.indicators.rsi;
  let macd = this.indicators.macd;
  let rsiVal = rsi.result;
  let macdVal = macd.result;
  let result = _.find(this.results, item => item.start == moment(candle.start).unix() * 1000).result;
  // Tìm điểm lãi nhất
  let maxProfitIndex = -1; // Mặc định là không có lãi
  for ( let i = 1; i < result.length; i++ ) {
    if(result[i] > result[0]) { // Nếu trend tăng
      if(maxProfitIndex === -1) { // Trước đó chưa tìm được điểm lãi nhất
        maxProfitIndex = i;
      } 
      // else if (result[i] > result[maxProfitIndex]) { // Nếu tìm được điểm lãi mà có lãi hơn cái đã tìm trước đó
      //   maxProfitIndex = i;
      // }
    }
  }

  // Nếu trend tăng và chưa mua trước đó
  if(maxProfitIndex >= 1 && !this.info.bought) {
   this.advice('long');
   this.info.closePriceAtBought = candle.close;
   this.info.bought = true;
   this.restTurn = maxProfitIndex;
  }

  // Nếu đã mua
  if(this.info.bought) {
    // Nếu có lời quá ngưỡng take profit thì bán luôn
    if(this.info.closePriceAtBought < candle.close 
      && ((candle.close - this.info.closePriceAtBought)/this.info.closePriceAtBought) >= this.takeProfit) {
      log.debug('sell with profit', candle.close - this.info.closePriceAtBought)
      this.advice('short');
      this.info.bought = false;
    } else
    // tới điểm giới hạn bán mà vẫn chưa bán được thì bán mặc dù lời hay lỗ
    if (this.restTurn <= 0) {
      log.debug('sell random', candle.close - this.info.closePriceAtBought)
      this.advice('short');
      this.info.bought = false;
    } 
    if (this.info.closePriceAtBought > candle.close
      && ((this.info.closePriceAtBought - candle.close)/candle.close) >= this.stopLoss) { // Lỗ quá ngưỡng cho phép thì bán luôn
      log.debug('sell with loss', candle.close - this.info.closePriceAtBought)
      this.advice('short');
      this.info.bought = false;
    }else {
      this.restTurn--;
    }
  }




//   this.candles.push({...candle, macd: macdVal, rsi: rsiVal});
    // candleTemp = _.cloneDeep(candle);
    // candleTemp.start = moment(candleTemp.start).unix() * 1000;
    // axios.get(
    //     this.settings.api, 
    //     {
    //         params: {...candleTemp, macd: macdVal, rsi: rsiVal}
    //     })
    //     .then((response) => {
    //         // handle success
    //         console.log(response.data.advice);
    //         let advice = response.data.advice;
    //         if(advice == 'sell') {
    //             this.advice('short');
    //         } else if (advice == 'buy') {
    //             this.advice('long');
    //         }
    //     })
    //     .catch(function (error) {
    //         // handle error
    //         console.log(error);
    //     })
}

module.exports = method;
