const { createApp } = Vue;

const App = {
  data() {
    return {
      populationHistory: [],
      ageGroups: []
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
