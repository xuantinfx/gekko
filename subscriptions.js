// 
// Subscriptions glue plugins to events
// flowing through the Gekko.
// 

var subscriptions = [
  {
    emitter: 'market',
    event: 'candle',
    handler: 'processCandle'
  },
  {
    emitter: 'market',
    event: 'marketUpdate',
    handler: 'processMarketUpdate'
  },
  {
    emitter: 'market',
    event: 'marketStart',
    handler: 'processMarketStart'
  },
  {
    emitter: ['tradingAdvisor', 'multipleTradingAdvisor'],
    event: 'stratWarmupCompleted',
    handler: 'processStratWarmupCompleted'
  },
  {
    emitter: ['tradingAdvisor', 'multipleTradingAdvisor'],
    event: 'advice',
    handler: 'processAdvice'
  },
  {
    emitter: ['tradingAdvisor', 'multipleTradingAdvisor'],
    event: 'stratCandle',
    handler: 'processStratCandle'
  },
  {
    emitter: ['tradingAdvisor', 'multipleTradingAdvisor'],
    event: 'stratUpdate',
    handler: 'processStratUpdate'
  },
  {
    emitter: ['tradingAdvisor', 'multipleTradingAdvisor'],
    event: 'stratNotification',
    handler: 'processStratNotification'
  },
  {
    emitter: ['trader', 'paperTrader', 'multiPaperTrader'],
    event: 'tradeInitiated',
    handler: 'processTradeInitiated'
  },
  {
    emitter: ['trader', 'paperTrader', 'multiPaperTrader'],
    event: 'tradeAborted',
    handler: 'processTradeAborted'
  },
  {
    emitter: ['trader', 'paperTrader', 'multiPaperTrader'],
    event: 'tradeCompleted',
    handler: 'processTradeCompleted'
  },
  {
    emitter: 'trader',
    event: 'tradeCancelled',
    handler: 'processTradeCancelled'
  },
  {
    emitter: 'trader',
    event: 'tradeErrored',
    handler: 'processTradeErrored'
  },
  {
    emitter: ['trader', 'paperTrader', 'multiPaperTrader'],
    event: 'portfolioChange',
    handler: 'processPortfolioChange'
  },
  {
    emitter: ['trader', 'paperTrader', 'multiPaperTrader'],
    event: 'triggerCreated',
    handler: 'processTriggerCreated'
  },
  {
    emitter: ['trader', 'paperTrader', 'multiPaperTrader'],
    event: 'triggerAborted',
    handler: 'processTriggerAborted'
  },
  {
    emitter: ['trader', 'paperTrader', 'multiPaperTrader'],
    event: 'triggerFired',
    handler: 'processTriggerFired'
  },
  {
    emitter: ['trader', 'paperTrader', 'multiPaperTrader'],
    event: 'portfolioValueChange',
    handler: 'processPortfolioValueChange'
  },
  {
    emitter: ['performanceAnalyzer', 'multiPerformanceAnalyzer'],
    event: 'performanceReport',
    handler: 'processPerformanceReport'
  },
  {
    emitter: ['performanceAnalyzer', 'multiPerformanceAnalyzer'],
    event: 'roundtripUpdate',
    handler: 'processRoundtripUpdate'
  },
  {
    emitter: ['performanceAnalyzer', 'multiPerformanceAnalyzer'],
    event: 'roundtrip',
    handler: 'processRoundtrip'
  },
];

module.exports = subscriptions;