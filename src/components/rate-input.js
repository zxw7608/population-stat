const RateInput = {
  props: {
    modelValue: { type: Number, required: true },
    label: { type: String, required: true },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 }
  },
  emits: ['update:modelValue'],
  template: `
    <div class="mb-3">
      <label class="form-label">{{ label }}</label>
      <div class="input-group" style="max-width: 200px">
        <input type="number" class="form-control" :class="{ 'is-invalid': !valid }"
               :value="modelValue" step="0.01" :min="min" :max="max"
               @input="onInput">
        <span class="input-group-text">‰</span>
        <div class="invalid-feedback" v-if="!valid">
          请输入 {{ min }}-{{ max }} 之间的数值
        </div>
      </div>
    </div>
  `,
  computed: {
    valid() {
      const v = this.modelValue;
      return !isNaN(v) && v >= this.min && v <= this.max;
    }
  },
  methods: {
    onInput(e) {
      const val = parseFloat(e.target.value);
      this.$emit('update:modelValue', isNaN(val) ? 0 : val);
    }
  }
};
