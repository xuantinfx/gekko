// helpers
var _ = require('lodash');
var log = require('../core/log');
var fs = require('fs');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  // add the indicator to the strategy
  // define the indicators we need
  this.addIndicator('rsi', 'RSI', this.settings);
  this.addIndicator('macd', 'MACD', this.settings);
  this.candles = [];
}

// what happens on every new candle?
method.update = function(candle) {
  // nothing!
  let rsi = this.indicators.rsi;
  let macd = this.indicators.macd;
  let rsiVal = rsi.result;
  let macdVal = macd.result;
  this.candles.push({...candle, macd: macdVal, rsi: rsiVal});
}

method.finished = function() {
  let strWrite = '';
  // write header
  for(let key in this.candles[this.candles.length - 1]) {
    strWrite += key + ','
  }
  strWrite += '\n';
  // write data
  for(let i = 0; i < this.candles.length; i++) {
    for(let key in this.candles[i]) {
      strWrite += this.candles[i][key] + ','
    }
    strWrite += '\n';
  }
  fs.writeFileSync(this.settings.fileName, strWrite);
}

// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
//   var digits = 8;
//   var ppo = this.indicators.ppo.result;
//   var result = ppo.ppo;
//   var signal = ppo.PPOsignal;
//   var hist = ppo.PPOhist;
//   var momentumResult = this.indicators[momentumName][momentumName];

//   log.debug('\t', 'PPO:', result.toFixed(digits));
//   log.debug('\t', 'PPOsignal:', signal.toFixed(digits));
//   log.debug('\t', 'PPOhist:', hist.toFixed(digits));
//   log.debug('\t', momentum + ':', momentumResult.toFixed(digits));
//   log.debug('\t', 'price:', candle.close.toFixed(digits));
}

method.check = function() {
//   var ppo = this.indicators.ppo.result;
//   var hist = ppo.PPOhist;

//   var value = this.indicators[momentumName][momentumName];

//   var thresholds = {
//     low: momentumSettings.thresholds.low + hist * settings.thresholds.weightLow,
//     high: momentumSettings.thresholds.high + hist * settings.thresholds.weightHigh
//   };

//   if(value < thresholds.low) {

//     // new trend detected
//     if(this.trend.direction !== 'up')
//       this.trend = {
//         duration: 0,
//         persisted: false,
//         direction: 'up',
//         adviced: false
//       };

//     this.trend.duration++;

//     log.debug('In uptrend since', this.trend.duration, 'candle(s)');

//     if(this.trend.duration >= settings.thresholds.persistence)
//       this.trend.persisted = true;

//     if(this.trend.persisted && !this.trend.adviced) {
//       this.trend.adviced = true;
//       this.advice('long');
//     } else
//       this.advice();

//   } else if(value > thresholds.high) {

//     // new trend detected
//     if(this.trend.direction !== 'down')
//       this.trend = {
//         duration: 0,
//         persisted: false,
//         direction: 'down',
//         adviced: false
//       };

//     this.trend.duration++;

//     log.debug('In downtrend since', this.trend.duration, 'candle(s)');

//     if(this.trend.duration >= settings.thresholds.persistence)
//       this.trend.persisted = true;

//     if(this.trend.persisted && !this.trend.adviced) {
//       this.trend.adviced = true;
//       this.advice('short');
//     } else
//       this.advice();


//   } else {

//     log.debug('In no trend');

//     // we're not in an up nor in a downtrend
//     // but for now we ignore sideways trends
//     //
//     // read more @link:
//     //
//     // https://github.com/askmike/gekko/issues/171

//     // this.trend = {
//     //   direction: 'none',
//     //   duration: 0,
//     //   persisted: false,
//     //   adviced: false
//     // };

//     this.advice();
//   }

}

module.exports = method;
