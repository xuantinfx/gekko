<template lang='pug'>
  div
    h2.contain Backtest
    .hr
    h3.contain History
      table
        tr 
          th Index
          th Strategy
          th Date
          th Time
          th Details
        tr(v-for='i in 10') 
          td {{i}}
          td MACD
          td 2019-02-20
          td 10-23-45
          td 
            a(href='https://www.google.com/', target='_blank') Link
    config-builder(v-on:config='check')
    div(v-if='backtestable')
      .txt--center
        a.w100--s.my1.btn--primary(href='#', v-if='backtestState !== "fetching"', v-on:click.prevent='run') Backtest
        div(v-if='backtestState === "fetching"').scan-btn
          p Running backtest..
          spinner
    result(v-if='backtestResult && backtestState === "fetched"', :result='backtestResult')
</template>

<script>
import configBuilder from './backtestConfigBuilder.vue'
import result from './result/result.vue'
import { get, post } from '../../tools/ajax'
import spinner from '../global/blockSpinner.vue'

export default {
  data: () => {
    return {
      backtestable: false,
      backtestState: 'idle',
      backtestResult: false,
      config: false,
      backtestHistory: []
    }
  },
  mounted: function () {
    get('backtestHistory', (err, response) => {
      if (err) console.log(err);
      else {
        this.backtestHistory = response;
      }
    })
  },
  methods: {
    check: function(config) {
      // console.log('CHECK', config);
      this.config = config;

      if(!config.valid)
        return this.backtestable = false;

      this.backtestable = true;
    },
    run: function() {
      this.backtestState = 'fetching';

      post('backtest', this.config, (error, response) => {
        this.backtestState = 'fetched';
        this.backtestResult = response;
      });
    }
  },
  components: {
    configBuilder,
    result,
    spinner
  }
}
</script>
