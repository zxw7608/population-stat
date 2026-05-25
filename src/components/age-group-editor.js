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
          <div class="col-1"></div>
          <div class="col-4">分组名称</div>
          <div class="col-2">最小年龄</div>
          <div class="col-2">最大年龄</div>
          <div class="col-3"></div>
        </div>
        <div
          v-for="(g, i) in localGroups" :key="i"
          class="row mb-2 align-items-center age-group-row"
          :class="{ 'dragging': dragIndex === i, 'drag-over': dragOverIndex === i }"
          draggable="true"
          @dragstart="onDragStart(i, $event)"
          @dragover="onDragOver(i, $event)"
          @dragend="onDragEnd"
          @dragleave="onDragLeave(i)"
          @drop="onDrop(i, $event)"
        >
          <div class="col-1 drag-handle" title="拖拽排序">
            <span class="text-muted" style="cursor: grab; font-size: 1.1rem; user-select: none;">⋮⋮</span>
          </div>
          <div class="col-4">
            <input class="form-control form-control-sm" v-model="g.name">
          </div>
          <div class="col-2">
            <input class="form-control form-control-sm" type="number" v-model.number="g.min" :min="0" :max="120">
          </div>
          <div class="col-2">
            <input class="form-control form-control-sm" type="number" v-model.number="g.max" :min="0" :max="120">
          </div>
          <div class="col-3">
            <button class="btn btn-sm btn-outline-danger" @click="remove(i)">删除</button>
          </div>
        </div>
        <button class="btn btn-sm btn-outline-primary" @click="add">+ 添加分组</button>
        <button class="btn btn-sm btn-primary ms-2" @click="save">保存分组</button>
      </div>
      <input type="file" ref="importFile" accept=".json" style="display:none" @change="onImport">
    </div>
  `,
  data() {
    return {
      localGroups: JSON.parse(JSON.stringify(this.groups)),
      dragIndex: -1,
      dragOverIndex: -1
    };
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
    onDragStart(i, e) {
      this.dragIndex = i;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', i);
      e.target.style.opacity = '0.4';
    },
    onDragOver(i, e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      this.dragOverIndex = i;
    },
    onDragLeave(i) {
      if (this.dragOverIndex === i) this.dragOverIndex = -1;
    },
    onDragEnd(e) {
      e.target.style.opacity = '1';
      this.dragIndex = -1;
      this.dragOverIndex = -1;
    },
    onDrop(i, e) {
      e.preventDefault();
      const from = this.dragIndex;
      if (from < 0 || from === i) return;
      const item = this.localGroups.splice(from, 1)[0];
      this.localGroups.splice(i, 0, item);
      this.dragIndex = -1;
      this.dragOverIndex = -1;
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
