const _ = require('lodash');
const fs = require('co-fs');

const gekkoRoot = __dirname + '/../../';
var util = require(__dirname + '/../../core/util');

var config = {};

config.debug = false;
config.silent = false;

util.setConfig(config);

module.exports = function*() {
  const backtestName = this.params.name;
  const backtestHistoryDir = yield fs.readdir(gekkoRoot + 'backtestHistory/');
  const backtestHistory = backtestHistoryDir
    .filter(f => _.last(f, 5).join('') === '.json')
    .map(f => f.slice(0, -5));

  console.log('backtestName: ', _.indexOf(backtestHistory, backtestName));
  //return a specific backtest result
  if (backtestName) {
    if (_.indexOf(backtestHistory, backtestName) >= 0) {
      try {
        console.log('readFile')
        this.body = yield fs.readFile(
          gekkoRoot + 'backtestHistory/' + backtestName + '.json'
        );
      } catch (err) {
        console.err(err);
        this.body = {};
      }
    } else {
      this.body = {};
    }
    return;
  }

  //read all backtest history name
  const finalResult = [];

  backtestHistory.forEach(item => {
    const tokens = item.split('_');
    console.log(tokens);
    finalResult.push({
      name: item,
      strategy: tokens[1],
      date: tokens[2],
      time: tokens[3],
    });
  });

  this.body = finalResult;
};
