// helpers
var _ = require('lodash');
var log = require('../core/log');
var fs = require('fs');
const csvStringify = require('csv-stringify/lib/sync');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function () {
  this.candles = [];
};

// what happens on every new candle?
method.update = function (candle) {
  this.candles.push(candle)
};

// method.finished = function() {
//   let strWrite = '';
//   // write header
//   for(let key in this.candles[this.candles.length - 1]) {
//     strWrite += key + ','
//   }
//   strWrite += '\n';
//   // write data
//   for(let i = 0; i < this.candles.length; i++) {
//     for(let key in this.candles[i]) {
//       strWrite += this.candles[i][key] + ','
//     }
//     strWrite += '\n';
//   }
//   fs.writeFileSync(this.settings.fileName, strWrite);
// }

method.finished = function () {
  const writeCandle2Csv = (candles, fileName) => {
    let strWrite = '';
    // write header
    for (let key in candles[0]) {
      strWrite += key + ',';
    }
    strWrite += '\n';
    // write data
    for (let i = 0; i < candles.length; i++) {
      for (let key in candles[i]) {
        strWrite += candles[i][key] + ',';
      }
      strWrite += '\n';
    }
    fs.writeFileSync(fileName, strWrite);
  };

  const calculateTrendByPercentage = function (price, futurePrice) {
    if (price <= 0) return 0;
    return (futurePrice - price) / Math.abs(price);
  };

  //classify candle action
  const STAY = 0,
    BUY = 1;
  for (let i = 0; i < this.candles.length; i++) {
    this.candles[i].start = new Date(this.candles[i].start).getTime();
    if (i >= this.candles.length - this.settings.horizon) // last h candles will be ignored
      this.candles[i].action = STAY;
    else {
      let profitLimitFlag = 0,
        stopLimitFlag = 0;

      // see if within h candles, will profit limit be triggered?
      for (let j = i + 1; j <= i + this.settings.horizon; j++) {
        let upTrend = calculateTrendByPercentage(
          this.candles[i].close,
          this.candles[j].high
        );
        let downTrend = calculateTrendByPercentage(
          this.candles[i].close,
          this.candles[j].low
        );

        if (downTrend <= -this.settings.stopLimit) {
          stopLimitFlag = 1;
          break;
        } else if (upTrend >= this.settings.profitLimit) {
          profitLimitFlag = 1;
          break;
        } else continue;
      }

      //classify the candle action into BUY or STAY according to flags
      if (stopLimitFlag === 1 || (stopLimitFlag === 0 && profitLimitFlag === 0)) this.candles[i].action = STAY;
      else this.candles[i].action = BUY;

    }
  }

  let data = csvStringify(this.candles, {
    header: true,
    columns: ['start', 'open', 'high', 'low', 'close', 'volume', 'trades', 'action']
  });
  fs.writeFileSync(this.settings.fileName, data);

};

// for debugging purposes log the last
// calculated parameters.
method.log = function (candle) {
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
};

method.check = function () {
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
};

module.exports = method;
