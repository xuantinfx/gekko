var util = require('../../core/util');
var _ = require('lodash');
var fs = require('fs');
var toml = require('toml');

var config = util.getConfig();
var dirs = util.dirs();
var log = require(dirs.core + 'log');
var CandleBatcher = require(dirs.core + 'candleBatcher');

var moment = require('moment');
var isLeecher = config.market && config.market.type === 'leech';

var Actor = function(done) {
  _.bindAll(this);

  this.done = done;

  this.batcher = new CandleBatcher(config.multipleTradingAdvisor.candleSize);

  this.strategyNames = config.multipleTradingAdvisor.methods;

  this.setupStrategy();

  var mode = util.gekkoMode();

  // the stitcher will try to pump in historical data
  // so that the strat can use this data as a "warmup period"
  //
  // the realtime "leech" market won't use the stitcher
  if(mode === 'realtime' && !isLeecher) {
    var Stitcher = require(dirs.tools + 'dataStitcher');
    var stitcher = new Stitcher(this.batcher);
    stitcher.prepareHistoricalData(done);
  } else
    done();
}

Actor.prototype.setupStrategy = function() {
  this.strategy = [];
  _.each(this.strategyNames, strategyName => {
    if(!fs.existsSync(dirs.methods + strategyName + '.js'))
      util.die('Gekko can\'t find the strategy "' + strategyName + '"');

    log.info('\t', 'Using the strategy: ' + strategyName);

    const strategy = require(dirs.methods + strategyName);

    // bind all trading strategy specific functions
    // to the WrappedStrategy.
    const WrappedStrategy = require('./baseTradingMethod');

    _.each(strategy, function(fn, name) {
      WrappedStrategy.prototype[name] = fn;
    });

    let stratSettings;
    if(config[strategyName]) {
      stratSettings = config[strategyName];
    }
    let tempStrategy = new WrappedStrategy(stratSettings);
    this.strategy.push(tempStrategy);
    tempStrategy
      .on('advice', e => {
        console.log('advice', strategyName)
        e.strategyName = strategyName;
        this.relayAdvice(e);
      })
      .on(
        'stratWarmupCompleted',
        e => {
          console.log('stratWarmupCompleted', strategyName)
          e.strategyName = strategyName;
          this.deferredEmit('stratWarmupCompleted', e)
        }
      )
      .on(
        'stratUpdate',
        e => {
          console.log('stratUpdate', strategyName)
          e.strategyName = strategyName;
          this.deferredEmit('stratUpdate', e)
        }
      ).on('stratNotification',
        e => {
          console.log('stratNotification', strategyName)
          e.strategyName = strategyName;
          this.deferredEmit('stratNotification', e)
        }
      )

      tempStrategy
      .on('tradeCompleted', e => {
        console.log('tradeCompleted')
        e.strategyName = strategyName;
        this.processTradeCompleted(e);
      })
  })
  this.batcher
  .on('candle', _candle => {
    const { id, ...candle } = _candle;
    console.log('batcher');
    this.deferredEmit('candle', candle);
    this.emitStratCandle(candle);
  });
}

// HANDLERS
// process the 1m candles
Actor.prototype.processCandle = function(candle, done) {
  this.candle = candle;
  const completedBatch = this.batcher.write([candle]);
  if(completedBatch) {
    this.next = done;
  } else {
    done();
    this.next = false;
  }
  this.batcher.flush();
}

// propogate a custom sized candle to the trading strategy
Actor.prototype.emitStratCandle = function(candle) {
  const next = this.next || _.noop;
  _.each(this.strategy, strategy => {
    strategy.tick(candle, next);
  })
}

Actor.prototype.processTradeCompleted = function(trade) {
  _.each(this.strategy, strategy => {
    strategy.processTrade(trade);
  })
}

// pass through shutdown handler
Actor.prototype.finish = function(done) {
  _.each(this.strategy, strategy => {
    strategy.finish(done);
  })
}

// EMITTERS
Actor.prototype.relayAdvice = function(advice) {
  advice.date = this.candle.start.clone().add(1, 'minute');
  this.deferredEmit('advice', advice);
}


module.exports = Actor;
