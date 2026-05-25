const { createApp } = Vue;

const App = {
  data() {
    return {
      populationHistory: [],
      ageGroups: [],
      mortalityRates: []
    };
  },
  computed: {
    ageDistribution() {
      if (!this.populationHistory.length) return [];
      return calculateCohortDistribution(this.populationHistory);
    }
  },
  methods: {
    onHistoryUpdate(records) { this.populationHistory = records; },
    onGroupsUpdate(groups) { this.ageGroups = groups; }
  },
  async mounted() {
    try {
      const resp = await fetch('src/data/mortality-rates.json');
      this.mortalityRates = await resp.json();
    } catch (e) {
      console.log('死亡率数据加载失败，使用空数组');
    }
  }
};

const app = createApp(App);
app.component('birth-death-chart', BirthDeathChart);
app.component('age-distribution', AgeDistribution);
app.component('data-manager', DataManager);
app.component('simulation-panel', SimulationPanel);
app.component('age-group-editor', AgeGroupEditor);
app.component('rate-input', RateInput);
app.mount('#app');
