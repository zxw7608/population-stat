const SimulationPanel = {
  props: {
    historyData: { type: Array, default: () => [] },
    ageDistribution: { type: Object, default: null },
    ageGroups: { type: Array, default: () => [] }
  },
  template: `
    <div>
      <div v-if="!hasBaseData" class="alert alert-warning">
        请先在"数据管理"页面上传年龄分布数据
      </div>
      <div v-else>
        <div class="row mb-4">
          <div class="col-md-4">
            <rate-input label="推演出⽣率" v-model="birthRate" :min="0" :max="100"></rate-input>
          </div>
          <div class="col-md-4">
            <rate-input label="推演死亡率" v-model="deathRate" :min="0" :max="100"></rate-input>
          </div>
          <div class="col-md-4 d-flex align-items-end">
            <button class="btn btn-sm btn-outline-secondary" @click="resetRates">重置为最末年数值</button>
          </div>
        </div>

        <div class="mb-4">
          <label class="form-label">目标年份：<strong>{{ targetYear }}</strong></label>
          <input type="range" class="form-range" v-model.number="targetYear"
                 :min="sliderMin" :max="2100" step="1">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" @click="targetYear = Math.min(2100, currentYear + 10)">+10年</button>
            <button class="btn btn-outline-primary" @click="targetYear = Math.min(2100, currentYear + 20)">+20年</button>
            <button class="btn btn-outline-primary" @click="targetYear = Math.min(2100, currentYear + 50)">+50年</button>
            <button class="btn btn-outline-primary" @click="targetYear = 2100">2100年</button>
          </div>
        </div>

        <div class="card mb-3">
          <div class="card-header d-flex justify-content-between">
            <span>{{ targetYear }}年 人口推演结果</span>
            <span class="text-muted">总人口：{{ result ? result.totalPopulation.toFixed(2) : '—' }} 万人</span>
          </div>
          <div class="card-body">
            <div ref="resultChart" style="height: 400px;"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      birthRate: 5.63,
      deathRate: 8.04,
      targetYear: null,
      result: null
    };
  },
  computed: {
    hasBaseData() { return this.ageDistribution && this.ageDistribution.ages; },
    currentYear() {
      if (this.historyData.length) return Math.max(...this.historyData.map(r => r.year));
      return new Date().getFullYear();
    },
    sliderMin() { return this.currentYear; },
    baseYear() {
      return this.ageDistribution?.meta?.baseYear || 2000;
    }
  },
  mounted() {
    this._onTabShow = () => this.$nextTick(() => this.renderResultChart());
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab =>
      tab.addEventListener('shown.bs.tab', this._onTabShow)
    );
  },
  beforeUnmount() {
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab =>
      tab.removeEventListener('shown.bs.tab', this._onTabShow)
    );
  },
  watch: {
    historyData: {
      handler() { this.resetRates(); this.initTargetYear(); this.runSimulation(); },
      immediate: true
    },
    birthRate() { this.runSimulation(); },
    deathRate() { this.runSimulation(); },
    targetYear() { this.runSimulation(); },
    ageDistribution() { this.runSimulation(); },
    ageGroups() { if (this.result) this.renderResultChart(); }
  },
  methods: {
    initTargetYear() {
      if (this.targetYear === null && this.historyData.length) {
        this.targetYear = this.currentYear;
      }
    },
    resetRates() {
      if (this.historyData.length) {
        const last = this.historyData.reduce((a, b) => a.year > b.year ? a : b);
        this.birthRate = last.birthRate;
        this.deathRate = last.deathRate;
      }
    },
    runSimulation() {
      if (!this.hasBaseData || !this.historyData.length) return;

      const dist = this.ageDistribution.ages.map(a => a.count);
      const histRates = this.historyData
        .filter(r => r.year >= this.baseYear)
        .sort((a,b) => a.year - b.year)
        .map(r => ({ year: r.year, birthRate: r.birthRate, deathRate: r.deathRate }));

      this.result = simulate({
        baseDistribution: dist,
        historicalRates: histRates,
        projectionBirthRate: this.birthRate,
        projectionDeathRate: this.deathRate,
        baseYear: this.baseYear,
        currentYear: this.currentYear,
        targetYear: this.targetYear
      });
      this.$nextTick(() => this.renderResultChart());
    },
    renderResultChart() {
      if (!this.result) return;
      const el = this.$refs.resultChart;
      if (!el || el.clientWidth === 0) return;
      let chart = echarts.getInstanceByDom(el);
      if (chart) chart.dispose();
      chart = echarts.init(el);
      const groups = classifyByGroups(this.result.distribution, this.ageGroups);
      chart.setOption({
        animation: false,
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: groups.map(g => g.name), axisLabel: { rotate: 30 } },
        yAxis: { type: 'value', name: '万人' },
        series: [{
          type: 'bar', data: groups.map(g => g.count),
          itemStyle: { color: '#FF9800' }
        }],
        grid: { left: 60, right: 20, top: 20, bottom: 80 }
      });
    }
  }
};
