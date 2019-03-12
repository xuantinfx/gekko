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
  this.results = require('../Result_Backtest.json')
  this.i = 0;
//   this.candles = [];
}

// what happens on every new candle?
method.update = function(candle) {
  

}

method.log = function(candle) {

}

method.check = function(candle) {
    // nothing!
  let rsi = this.indicators.rsi;
  let macd = this.indicators.macd;
  let rsiVal = rsi.result;
  let macdVal = macd.result;
  let result = _.find(this.results, item => item.start == moment(candle.start).unix() * 1000).result;
console.log(result[4] - result[0])
  if(result[4] - result[0] > 0) {
    this.advice('long');
  } else if(result[4] - result[0] < 0) {
    this.advice('short');
  } else this.advice();
  this.i++
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
