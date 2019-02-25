<template lang='pug'>
  div
    spinner(v-if="fetchState === 'fetching'")
    template(v-else-if='fetchState === "fetched" && backtestResult', lang='pug')
        div.contain {{ this.$route.params.name }}
        result(:result='backtestResult')
    div(v-else) Backtest result for {{ this.$route.params.name }} could not be found
</template>

<script>
import result from '.././result/result.vue';
import { get } from '../../../tools/ajax';
import spinner from '../../global/blockSpinner.vue';
import backtestConfigBuilderVue from '../backtestConfigBuilder.vue';

export default {
  data: function() {
    return {
      fetchState: 'fetching',
      backtestResult: null,
    };
  },
  mounted: function() {
    this.fetchState = 'fetching';

    get('backtestHistory/' + this.$route.params.name, (err, response) => {
      this.fetchState = 'fetched';
      if (err) {
        this.backtestResult = null;
      } else {
        this.backtestResult = response;
      }
    });
  },
  components: {
    result,
    spinner,
  },
};
</script>
