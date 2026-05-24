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
      <div class="mb-3">
        <div class="btn-group btn-group-sm" role="group">
          <button type="button" class="btn" :class="viewMode === 'group' ? 'btn-primary' : 'btn-outline-primary'" @click="viewMode='group'">按分组</button>
          <button type="button" class="btn" :class="viewMode === 'age' ? 'btn-primary' : 'btn-outline-primary'" @click="viewMode='age'">按每岁</button>
        </div>
      </div>
      <div v-if="ageDistribution">
        <div ref="chart" style="height: 500px;"></div>
      </div>
      <div v-else class="alert alert-secondary">请先在"数据管理"页面上传年龄分布数据</div>
    </div>
  `,
  data() {
    return { viewMode: 'group' };
  },
  watch: {
    ageDistribution() { this.renderChart(); },
    ageGroups() { this.renderChart(); },
    viewMode() { this.renderChart(); }
  },
  mounted() {
    if (this.ageDistribution) this.renderChart();
  },
  methods: {
    renderChart() {
      const chart = echarts.init(this.$refs.chart);
      if (this.viewMode === 'group') {
        const dist = this.ageDistribution.ages.map(a => a.count);
        const groups = classifyByGroups(dist, this.ageGroups);
        chart.setOption({
          title: { text: '年龄分组分布', left: 'center' },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: groups.map(g => g.name), axisLabel: { rotate: 30 } },
          yAxis: { type: 'value', name: '万人' },
          series: [{ type: 'bar', data: groups.map(g => g.count), itemStyle: { color: '#1976D2' } }],
          grid: { left: 60, right: 20, top: 50, bottom: 80 }
        });
      } else {
        const ages = this.ageDistribution.ages;
        chart.setOption({
          title: { text: '每岁人口分布', left: 'center' },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: ages.map(a => a.age), name: '年龄' },
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
  }
};
