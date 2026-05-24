const BirthDeathChart = {
  props: {
    historyData: { type: Array, default: () => [] }
  },
  template: `
    <div>
      <h5 class="mb-3">年度出生/死亡人口</h5>
      <div ref="barChart" style="height: 400px;"></div>
      <h5 class="mb-3 mt-4">年度出生率/死亡率/自然增长率</h5>
      <div ref="lineChart" style="height: 400px;"></div>
    </div>
  `,
  watch: {
    historyData: {
      handler() { this.renderCharts(); },
      deep: true
    }
  },
  mounted() {
    this.renderCharts();
    this._onTabShow = () => this.$nextTick(() => this.renderCharts());
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab =>
      tab.addEventListener('shown.bs.tab', this._onTabShow)
    );
  },
  beforeUnmount() {
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab =>
      tab.removeEventListener('shown.bs.tab', this._onTabShow)
    );
  },
  methods: {
    renderCharts() {
      this.renderBarChart();
      this.renderLineChart();
    },
    renderBarChart() {
      const el = this.$refs.barChart;
      if (!el || el.clientWidth === 0) return;
      let chart = echarts.getInstanceByDom(el);
      if (chart) chart.dispose();
      chart = echarts.init(el);
      const sorted = [...this.historyData].sort((a, b) => a.year - b.year);
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['出生人口', '死亡人口'] },
        xAxis: { type: 'category', data: sorted.map(r => r.year) },
        yAxis: { type: 'value', name: '万人' },
        series: [
          { name: '出生人口', type: 'bar', data: sorted.map(r => r.births), itemStyle: { color: '#4CAF50' } },
          { name: '死亡人口', type: 'bar', data: sorted.map(r => r.deaths), itemStyle: { color: '#F44336' } }
        ],
        grid: { left: 60, right: 20, top: 30, bottom: 40 },
        dataZoom: [{ type: 'slider', start: 0, end: 100 }]
      });
    },
    renderLineChart() {
      const el = this.$refs.lineChart;
      if (!el || el.clientWidth === 0) return;
      let chart = echarts.getInstanceByDom(el);
      if (chart) chart.dispose();
      chart = echarts.init(el);
      const sorted = [...this.historyData].sort((a, b) => a.year - b.year);
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['出生率', '死亡率', '自然增长率'] },
        xAxis: { type: 'category', data: sorted.map(r => r.year) },
        yAxis: { type: 'value', name: '‰' },
        series: [
          { name: '出生率', type: 'line', data: sorted.map(r => r.birthRate), smooth: true, itemStyle: { color: '#4CAF50' } },
          { name: '死亡率', type: 'line', data: sorted.map(r => r.deathRate), smooth: true, itemStyle: { color: '#F44336' } },
          { name: '自然增长率', type: 'line', data: sorted.map(r => r.naturalGrowthRate), smooth: true, itemStyle: { color: '#2196F3' } }
        ],
        grid: { left: 60, right: 20, top: 30, bottom: 40 },
        dataZoom: [{ type: 'slider', start: 0, end: 100 }]
      });
    }
  }
};
