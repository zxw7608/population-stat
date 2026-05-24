const { createApp } = Vue;

const App = {
  data() {
    return {
      populationHistory: [],
      baseAgeDistribution: null,
      ageGroups: []
    };
  },
  methods: {
    onHistoryUpdate(records) { this.populationHistory = records; },
    onAgeDistUpdate(data) { this.baseAgeDistribution = data; },
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
