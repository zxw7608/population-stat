const DataManager = {
  emits: ['update-history', 'update-groups'],
  template: `
    <div>
      <h5>上传数据</h5>
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">逐年数据 (population-history)</div>
            <div class="card-body">
              <input type="file" class="form-control" accept=".xlsx,.xls,.csv" @change="onHistoryFile">
              <div v-if="historyPreview.length" class="mt-2" style="max-height: 200px; overflow: auto">
                <table class="table table-sm table-bordered small">
                  <thead><tr><th v-for="k in historyColumns">{{ k }}</th></tr></thead>
                  <tbody>
                    <tr v-for="r in historyPreview" :class="{'table-danger': r._missing}">
                      <td v-for="k in historyColumns">{{ r[k] ?? '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="historyErrors.length" class="alert alert-danger mt-2 py-1 small">
                <div v-for="e in historyErrors">{{ e }}</div>
              </div>
              <button v-if="historyRecords.length" class="btn btn-sm btn-success mt-2" @click="downloadHistory">下载 population-history.json</button>
              <button class="btn btn-sm btn-outline-secondary mt-2 ms-1" @click="downloadHistoryTemplate">下载逐年数据模板</button>
            </div>
          </div>
        </div>
      </div>

      <h5>年龄分组配置</h5>
      <age-group-editor :groups="groups" @update:groups="onGroupsUpdate"></age-group-editor>
    </div>
  `,
  data() {
    return {
      historyRecords: [],
      historyPreview: [],
      historyErrors: [],
      historyColumns: [],
      groups: []
    };
  },
  mounted() {
    this.loadDefaultData();
  },
  methods: {
    async loadDefaultData() {
      try {
        const [histResp, groupsResp] = await Promise.all([
          fetch('src/data/population-history.json'),
          fetch('src/data/age-groups.json')
        ]);
        const hist = await histResp.json();
        this.historyRecords = hist.records;
        this.$emit('update-history', hist.records);
        const groups = await groupsResp.json();
        this.groups = groups.groups;
        this.$emit('update-groups', groups.groups);
      } catch (e) {
        console.log('默认数据加载中...');
      }
    },
    onHistoryFile(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
        alert('请上传 .xlsx / .xls / .csv 文件');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const { records, errors } = DataParser.parsePopulationHistory(ws);
        this.historyRecords = records;
        this.historyErrors = errors;
        this.historyColumns = records.length ? Object.keys(records[0]) : [];
        this.historyPreview = records.slice(0, 20).map(r => ({ ...r, _missing: errors.length > 0 }));
        this.$emit('update-history', records);
      };
      reader.readAsArrayBuffer(file);
    },
    downloadHistory() {
      DataParser.downloadJSON({ meta: { lastUpdated: new Date().toISOString().slice(0,10), source: '用户上传' }, records: this.historyRecords }, 'population-history.json');
    },
    downloadHistoryTemplate() {
      DataParser.downloadWorkbook(DataParser.generateHistoryTemplate(), '逐年数据模板.xlsx');
    },
    onGroupsUpdate(groups) {
      this.groups = groups;
      this.$emit('update-groups', groups);
    }
  }
};
