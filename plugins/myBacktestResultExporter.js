// Small plugin that subscribes to some events, stores
// them and sends it to the parent process.

const log = require('../core/log');
const _ = require('lodash');
const get = require('lodash.get');
const util = require('../core/util.js');
const env = util.gekkoEnv();
const config = util.getConfig();
const moment = require('moment');
const fs = require('fs');

const MyBacktestResultReporter = function() {
  this.performanceReport;
  this.roundtrips = [];
  this.stratUpdates = [];
  this.stratCandles = [];
  this.trades = [];
  this.dates = {
    start: false,
    end: false
  };
  this.endPrice = false;
  this.candleSize = config.tradingAdvisor.candleSize;

  this.candleProps = config.myBacktestResultExporter.data.stratCandleProps;

  if(!config.myBacktestResultExporter.data.stratUpdates)
    this.processStratUpdate = null;

  if(!config.myBacktestResultExporter.data.roundtrips)
    this.processRoundtrip = null;

  if(!config.myBacktestResultExporter.data.stratCandles)
    this.processStratCandles = null;

  if(!config.myBacktestResultExporter.data.portfolioValues)
    this.processPortfolioValueChange = null;

  if(!config.myBacktestResultExporter.data.trades)
    this.processTradeCompleted = null;

  _.bindAll(this);
}


MyBacktestResultReporter.prototype.processCandle = function(candle, done) {
  this.dates.end = candle.start.clone().add(1, 'minute');

  if(!this.dates.start) {
    this.dates.start = candle.start;
    this.startPrice = candle.close;
  }

  this.endPrice = candle.close;

  done();
}

MyBacktestResultReporter.prototype.processPortfolioValueChange = function(portfolio) {
  this.portfolioValue = portfolio.balance;
}

MyBacktestResultReporter.prototype.processStratCandle = function(candle) {
  let strippedCandle;

  if(!this.candleProps) {
    strippedCandle = {
      ...candle,
      start: candle.start.unix()
    }
  } else {
    strippedCandle = {
      ..._.pick(candle, this.candleProps),
      start: candle.start.unix()
    }
  }

  if(config.myBacktestResultExporter.data.portfolioValues)
    strippedCandle.portfolioValue = this.portfolioValue;

  this.stratCandles.push(strippedCandle);
};

MyBacktestResultReporter.prototype.processRoundtrip = function(roundtrip) {
  this.roundtrips.push({
    ...roundtrip,
    entryAt: roundtrip.entryAt.unix(),
    exitAt: roundtrip.exitAt.unix()
  });
};

MyBacktestResultReporter.prototype.processTradeCompleted = function(trade) {
  this.trades.push({
    ...trade,
    date: trade.date.unix()
  });
};

MyBacktestResultReporter.prototype.processStratUpdate = function(stratUpdate) {
  this.stratUpdates.push({
    ...stratUpdate,
    date: stratUpdate.date.unix()
  });
}

MyBacktestResultReporter.prototype.processPerformanceReport = function(performanceReport) {
  this.performanceReport = performanceReport;
}

MyBacktestResultReporter.prototype.finalize = function(done) {
  const backtest = {
    market: config.watch,
    tradingAdvisor: config.tradingAdvisor,
    strategyParameters: config[config.tradingAdvisor.method],
    performanceReport: this.performanceReport
  };

  if(config.myBacktestResultExporter.data.stratUpdates)
    backtest.stratUpdates = this.stratUpdates;

  if(config.myBacktestResultExporter.data.roundtrips)
    backtest.roundtrips = this.roundtrips;

  if(config.myBacktestResultExporter.data.stratCandles)
    backtest.stratCandles = this.stratCandles;

  if(config.myBacktestResultExporter.data.trades)
    backtest.trades = this.trades;

  if(env === 'child-process') {
    process.send({backtest});
  }

  if(config.myBacktestResultExporter.writeToDisk) {
    this.writeToDisk(backtest, done);
  } else {
    done();
  }
};

MyBacktestResultReporter.prototype.writeToDisk = function(backtest, next) {
  this.backtest = backtest;
  const filename = `${config.myBacktestResultExporter.fileNamePrefix}${this.backtest.market.exchange}-${this.backtest.market.asset}-${this.backtest.market.currency}.csv`;
  const filePath = util.dirs().gekko + filename;
  fs.readFile(filePath, (err, data) => {
    let dataOut = config.myBacktestResultExporter.dataOut;
    let table = dataOut.table;
    const mergeData = (oldData) => {
      let record = '';
      let table = config.myBacktestResultExporter.dataOut.table;
      for(let key in table.rawData) {
        record += `${get(this, key, "")},`;
      }
      for(let key in table.recipe) {
        record += `${eval(table.recipe[key])},`;
      }
      record += '\n';
      return oldData + record;
    }

    if(err) {
      let strData = "";
      // Write info
      for(let key in dataOut.info) {
        let value = get(this, key, "");
        strData += `${dataOut.info[key]}: ${value}\n`;
      }
      // Write Table header
      for(let key in table.rawData) {
        strData += `${table.rawData[key]},`;
      }
      for(let key in table.recipe) {
        strData += `${key},`;
      }
      strData += '\n';
      strData = mergeData(strData);
      fs.writeFileSync(filePath, strData);
    } else {
      strData = mergeData(data.toString());
      fs.writeFileSync(filePath, strData);
    }
  })
}

module.exports = MyBacktestResultReporter;
