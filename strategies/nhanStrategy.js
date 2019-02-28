var strat = {};

// Prepare everything our strat needs
strat.init = function() {
  // const settings = {
  //   rsi: {
  //     interval: 14
  //   },
  //   macd: {
  //     short: 12,
  //     long: 26,
  //     signal: 9,
  //     thresholds: {
  //       down: -0.05,
  //       up: 0.05,
  //       persistence: 1
  //     } 
  //   }
  // }

  console.log(this.settings);
  this.addIndicator('rsi1', 'RSI', this.settings.rsi);

  this.addIndicator('macd1', 'MACD', this.settings.macd);
};

// For debugging purposes.
strat.log = function() {
  // your code!
};

strat.check = function(candle) {
  const rsiResult = this.indicators.rsi1.result;
  const macdResult = this.indicators.macd1.result;
  if (macdResult > this.settings.macd.thresholds.up && rsiResult < 30) this.advice ('long');
  else if (macdResult < this.settings.macd.thresholds.down && rsiResult > 70) this.advice('short');
  else this.advice();
};

strat.end = function() {};

module.exports = strat;
