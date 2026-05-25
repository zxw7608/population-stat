const SimulationPanel = {
  props: {
    historyData: { type: Array, default: () => [] },
    ageGroups: { type: Array, default: () => [] },
    mortalityRates: { type: Array, default: () => [] }
  },
  template: `
    <div>
      <div v-if="!hasBaseData" class="alert alert-warning">
        请先在"数据管理"页面上传逐年数据
      </div>
      <div v-else>
        <div class="d-flex gap-3 align-items-end mb-3 flex-wrap">
          <rate-input label="推演出⽣率" v-model="birthRate" :min="0" :max="100"></rate-input>
          <div class="pb-2">
            <button class="btn btn-sm btn-outline-secondary" @click="resetRates">重置为最末年数值</button>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label">目标年份：<strong>{{ targetYear }}</strong></label>
          <input type="range" class="form-range" v-model.number="targetYear"
                 :min="sliderMin" :max="2300" step="1">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary" @click="targetYear = Math.max(sliderMin, targetYear - 1)">−1</button>
            <button class="btn btn-outline-secondary" @click="targetYear = Math.min(2300, targetYear + 1)">+1</button>
            <button class="btn btn-outline-primary" @click="targetYear = Math.min(2300, targetYear + 10)">+10年</button>
            <button class="btn btn-outline-primary" @click="targetYear = Math.min(2300, targetYear + 20)">+20年</button>
            <button class="btn btn-outline-primary" @click="targetYear = Math.min(2300, targetYear + 50)">+50年</button>
            <button class="btn btn-outline-primary" @click="targetYear = 2300">2300年</button>
          </div>
        </div>

        <details class="mb-3 small text-muted">
          <summary class="user-select-none cursor-pointer">推演算法说明</summary>
          <div class="card card-body bg-light mt-2">
            <p class="mb-1"><strong>数据基准：</strong>从逐年出生/死亡数据推算的 {{ currentYear }} 年年龄分布（队列追踪法）。</p>
            <p class="mb-1"><strong>队列追踪法：</strong>每个出生年份的队列 × 逐年存活率(1−死亡率/1000) 累积至 {{ currentYear }}，{{ earliestYear }} 年前出生者以残差归入 {{ preDataAge }} 岁（最年轻可能年龄）。</p>
            <p class="mb-1"><strong>推演：</strong>{{ currentYear }} → {{ targetYear }}，直接使用2020年年龄别死亡率驱动各年龄存活计算。</p>
            <p class="mb-1"><strong>逐年计算公式：</strong></p>
            <ul class="mb-1 ps-3">
              <li>新生儿 = 总人口 × 出生率 ÷ 1000</li>
              <li>年龄 n (1-99) = 上一年年龄 n-1 存活者 × (1 − 该年龄死亡率 ÷ 1000)</li>
              <li>100+ 岁 = 99 岁存活者 × (1 − 99岁死亡率 ÷ 1000) + 原 100+ 岁 × (1 − 100岁死亡率 ÷ 1000)</li>
            </ul>
            <p class="mb-0"><strong>死亡率来源：</strong>2020年年龄别死亡率（0-100岁各岁数据），预数据年前人口从 {{ preDataAge }} 岁起逐年老化并经历对应年龄死亡率，不再"不老不死"。</p>
          </div>
        </details>

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
      targetYear: null,
      result: null
    };
  },
  computed: {
    hasBaseData() { return this.historyData.length > 0; },
    currentYear() {
      if (this.historyData.length) return Math.max(...this.historyData.map(r => r.year));
      return new Date().getFullYear();
    },
    earliestYear() {
      if (this.historyData.length) return Math.min(...this.historyData.map(r => r.year));
      return 1949;
    },
    preDataAge() { return this.currentYear - this.earliestYear + 1; },
    sliderMin() { return this.currentYear; },
    baseDistribution() {
      if (!this.historyData.length) return [];
      return calculateCohortDistribution(this.historyData);
    },
    chartYMax() {
      if (!this.baseDistribution.length || !this.ageGroups.length) return null;
      const groups = classifyByGroups(this.baseDistribution, this.ageGroups);
      const max = Math.max(...groups.map(g => g.count));
      return Math.ceil(max / 5000) * 5000; // 取整到5000万
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
    targetYear() { this.runSimulation(); },
    ageGroups() { if (this.result) this.renderResultChart(); },
    mortalityRates() { this.runSimulation(); }
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
      }
    },
    runSimulation() {
      if (!this.hasBaseData) return;
      if (!this.mortalityRates || !this.mortalityRates.length) return;

      this.result = simulate({
        baseDistribution: this.baseDistribution,
        birthRate: this.birthRate,
        mortalityRates: this.mortalityRates,
        startYear: this.currentYear,
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
        yAxis: { type: 'value', name: '万人', max: this.chartYMax },
        series: [{
          type: 'bar', data: groups.map(g => g.count),
          itemStyle: { color: '#FF9800' }
        }],
        grid: { left: 60, right: 20, top: 20, bottom: 80 }
      });
    }
  }
};
