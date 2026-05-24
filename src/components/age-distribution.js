const AgeDistribution = {
  props: {
    ageDistribution: { type: Object, default: null },
    ageGroups: { type: Array, default: () => [] },
    discrepancyNote: { type: String, default: '' }
  },
  template: `
    <div>
      <div v-if="discrepancyNote" class="alert alert-warning py-2">
        ⚠ {{ discrepancyNote }}
      </div>
      <div v-if="ageDistribution">
        <div class="row">
          <div class="col-md-6">
            <div ref="groupChart" style="height: 400px;"></div>
          </div>
          <div class="col-md-6">
            <div ref="ageChart" style="height: 400px;"></div>
          </div>
        </div>
      </div>
      <div v-else class="alert alert-secondary">请先在"数据管理"页面上传年龄分布数据</div>
    </div>
  `,
  watch: {
    ageDistribution() { this.renderCharts(); },
    ageGroups() { this.renderCharts(); }
  },
  mounted() {
    if (this.ageDistribution) this.renderCharts();
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
      this.renderGroupChart();
      this.renderAgeChart();
    },
    renderGroupChart() {
      const el = this.$refs.groupChart;
      if (!el || el.clientWidth === 0) return;
      let chart = echarts.getInstanceByDom(el);
      if (chart) chart.dispose();
      chart = echarts.init(el);
      const dist = this.ageDistribution.ages.map(a => a.count);
      const groups = classifyByGroups(dist, this.ageGroups);
      chart.setOption({
        animation: false,
        title: { text: '按分组', left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: groups.map(g => g.name), axisLabel: { rotate: 30 } },
        yAxis: { type: 'value', name: '万人' },
        series: [{ type: 'bar', data: groups.map(g => g.count), itemStyle: { color: '#1976D2' } }],
        grid: { left: 60, right: 20, top: 50, bottom: 80 }
      });
    },
    renderAgeChart() {
      const el = this.$refs.ageChart;
      if (!el || el.clientWidth === 0) return;
      let chart = echarts.getInstanceByDom(el);
      if (chart) chart.dispose();
      chart = echarts.init(el);
      const ages = this.ageDistribution.ages;
      chart.setOption({
        animation: false,
        title: { text: '按每岁', left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ages.map(a => a.age), name: '年龄', axisLabel: { interval: 4 } },
        yAxis: { type: 'value', name: '万人' },
        series: [{
          type: 'bar',
          data: ages.map(a => Math.round(a.count / 100) / 100),
          itemStyle: { color: '#1976D2' }
        }],
        grid: { left: 60, right: 20, top: 50, bottom: 50 },
        dataZoom: [{ type: 'slider', start: 0, end: 100 }]
      });
    }
  }
};
