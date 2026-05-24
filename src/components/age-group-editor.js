const AgeGroupEditor = {
  props: {
    groups: { type: Array, default: () => [] }
  },
  emits: ['update:groups'],
  template: `
    <div class="card mb-3">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span>年龄分组配置</span>
        <div>
          <button class="btn btn-sm btn-outline-secondary me-1" @click="importConfig">导入</button>
          <button class="btn btn-sm btn-outline-secondary" @click="exportConfig">导出</button>
        </div>
      </div>
      <div class="card-body">
        <div class="row mb-2 fw-bold text-muted small">
          <div class="col-4">分组名称</div>
          <div class="col-3">最小年龄</div>
          <div class="col-3">最大年龄</div>
          <div class="col-2"></div>
        </div>
        <div class="row mb-2" v-for="(g, i) in localGroups" :key="i">
          <div class="col-4">
            <input class="form-control form-control-sm" v-model="g.name">
          </div>
          <div class="col-3">
            <input class="form-control form-control-sm" type="number" v-model.number="g.min" :min="0" :max="120">
          </div>
          <div class="col-3">
            <input class="form-control form-control-sm" type="number" v-model.number="g.max" :min="0" :max="120">
          </div>
          <div class="col-2">
            <button class="btn btn-sm btn-outline-danger" @click="remove(i)">×</button>
          </div>
        </div>
        <button class="btn btn-sm btn-outline-primary" @click="add">+ 添加分组</button>
        <button class="btn btn-sm btn-primary ms-2" @click="save">保存分组</button>
      </div>
      <input type="file" ref="importFile" accept=".json" style="display:none" @change="onImport">
    </div>
  `,
  data() {
    return { localGroups: JSON.parse(JSON.stringify(this.groups)) };
  },
  watch: {
    groups: {
      handler(v) { this.localGroups = JSON.parse(JSON.stringify(v)); },
      deep: true
    }
  },
  methods: {
    add() {
      this.localGroups.push({ name: '新分组', min: 0, max: 0 });
    },
    remove(i) {
      this.localGroups.splice(i, 1);
    },
    save() {
      this.$emit('update:groups', JSON.parse(JSON.stringify(this.localGroups)));
    },
    exportConfig() {
      DataParser.downloadJSON({ groups: this.localGroups }, 'age-groups.json');
    },
    importConfig() {
      this.$refs.importFile.click();
    },
    onImport(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target.result);
          if (json.groups && Array.isArray(json.groups)) {
            this.localGroups = json.groups;
            this.$emit('update:groups', JSON.parse(JSON.stringify(json.groups)));
          }
        } catch (ex) {
          alert('JSON 解析失败');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    }
  }
};
