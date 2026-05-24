# 人口统计可视化页面 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 构建一个纯前端人口统计可视化单页应用，支持历史趋势图表、年龄分布分析、数据导入导出和未来人口模拟推演。

**架构：** 分层架构——Vue 3 组件层负责 UI 渲染和交互，纯 JS 引擎层处理数据解析、年龄分类和人口推演计算，JSON 数据层存储历史和基准数据。全部通过 CDN 加载，无构建工具。

**技术栈：** Vue 3 (CDN global build) + Bootstrap 5 (CDN) + ECharts 5 (CDN) + SheetJS/xlsx (CDN)

---

> **文件结构说明：** 由于无构建工具，Vue 组件使用 `.js` 文件定义组件选项对象，通过 `<script>` 标签加载，模板使用内联字符串或 DOM 模板。

### 创建的文件清单

| 文件 | 职责 |
|------|------|
| `index.html` | 入口 HTML，CDN 引用，挂载点 |
| `src/app.js` | Vue 应用初始化，根组件，Tab 路由，全局状态管理 |
| `src/engine/age-classifier.js` | 纯函数：年龄数组 + 分组配置 → 聚合结果 |
| `src/engine/population-engine.js` | 两阶段人口推演模拟引擎 |
| `src/engine/data-parser.js` | Excel/CSV 解析，JSON 导出，模板生成 |
| `src/components/birth-death-chart.js` | ECharts 出生/死亡条形图 + 出生率/死亡率折线 |
| `src/components/age-distribution.js` | ECharts 年龄分布柱状图（分组/每岁切换） |
| `src/components/rate-input.js` | 数值输入组件（带校验） |
| `src/components/age-group-editor.js` | 年龄分组增删改查 + 导入导出 |
| `src/components/data-manager.js` | 文件上传、预览表格、JSON 下载、模板下载 |
| `src/components/simulation-panel.js` | 模拟参数控制 + 推演结果展示 |
| `src/data/population-history.json` | 逐年人口数据（1949-2025） |
| `src/data/base-age-distribution.json` | 2000 年普查每岁人数 |
| `src/data/age-groups.json` | 默认年龄分组配置 |
| `scripts/convert.js` | Node.js 离线转换脚本 |
| `package.json` | xlsx 依赖声明 |

---

### 任务 1：项目脚手架 — index.html + 目录结构

**文件：**
- 创建：`index.html`
- 创建：`package.json`

- [ ] **步骤 1：创建目录结构**

```bash
mkdir -p src/components src/engine src/data scripts
```

- [ ] **步骤 2：创建 package.json**

```json
{
  "name": "population-stat",
  "version": "1.0.0",
  "description": "人口统计可视化",
  "scripts": {
    "convert": "node scripts/convert.js"
  },
  "dependencies": {
    "xlsx": "^0.18.5"
  }
}
```

- [ ] **步骤 3：创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>人口统计可视化</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/vue@3.4.27/dist/vue.global.prod.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
</head>
<body>
  <div id="app">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
      <div class="container">
        <span class="navbar-brand">人口统计可视化</span>
      </div>
    </nav>
    <div class="container">
      <ul class="nav nav-tabs mb-4" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-trend" type="button">历史趋势</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-age" type="button">年龄分布</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-data" type="button">数据管理</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-sim" type="button">模拟推演</button>
        </li>
      </ul>
      <div class="tab-content">
        <div class="tab-pane fade show active" id="tab-trend">
          <birth-death-chart :history-data="populationHistory"></birth-death-chart>
        </div>
        <div class="tab-pane fade" id="tab-age">
          <age-distribution
            :age-distribution="baseAgeDistribution"
            :age-groups="ageGroups"
            :discrepancy-note="baseAgeDistribution?.meta?.discrepancyNote || ''"
          ></age-distribution>
        </div>
        <div class="tab-pane fade" id="tab-data">
          <data-manager
            @update-history="onHistoryUpdate"
            @update-age-dist="onAgeDistUpdate"
            @update-groups="onGroupsUpdate"
          ></data-manager>
        </div>
        <div class="tab-pane fade" id="tab-sim">
          <simulation-panel
            :history-data="populationHistory"
            :age-distribution="baseAgeDistribution"
            :age-groups="ageGroups"
          ></simulation-panel>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="src/engine/age-classifier.js"></script>
  <script src="src/engine/population-engine.js"></script>
  <script src="src/engine/data-parser.js"></script>
  <script src="src/components/rate-input.js"></script>
  <script src="src/components/birth-death-chart.js"></script>
  <script src="src/components/age-distribution.js"></script>
  <script src="src/components/age-group-editor.js"></script>
  <script src="src/components/data-manager.js"></script>
  <script src="src/components/simulation-panel.js"></script>
  <script src="src/app.js"></script>
</body>
</html>
```

- [ ] **步骤 4：验证 — 在浏览器中打开 index.html**

打开 `index.html`，确认页面加载无 JS 报错，Bootstrap Tab 导航可见。

- [ ] **步骤 5：Commit**

```bash
git add index.html package.json
git commit -m "feat: add project scaffolding with CDN links and tab layout"
```

---

### 任务 2：数据文件 — 将现有数据转为 JSON

**文件：**
- 创建：`src/data/population-history.json`
- 创建：`src/data/base-age-distribution.json`
- 创建：`src/data/age-groups.json`

- [ ] **步骤 1：创建 population-history.json**

基于 `data.txt` 中 1949-2025 年的数据逐条录入。格式示例（全部 77 条记录）：

```json
{
  "meta": {
    "lastUpdated": "2026-05-24",
    "source": "国家统计局年鉴"
  },
  "records": [
    {
      "year": 1949,
      "totalPopulation": 54167,
      "births": 975.006,
      "deaths": 541.67,
      "birthRate": 36,
      "deathRate": 20,
      "naturalGrowthRate": 16
    },
    {
      "year": 1950,
      "totalPopulation": 55196,
      "births": 2023.2155,
      "deaths": 984.267,
      "birthRate": 37,
      "deathRate": 18,
      "naturalGrowthRate": 19
    }
  ]
}
```

> 注：完整 77 条记录在实现时根据 data.txt 逐条生成。data.txt 中出生率/死亡率行（Row 4-6）和出生/死亡人口行（Row 15-16）需合并为单条 record。

- [ ] **步骤 2：创建 base-age-distribution.json**

基于 `data2.txt` 中 2000 年普查每岁数据：

```json
{
  "meta": {
    "baseYear": 2000,
    "source": "第五次全国人口普查",
    "discrepancyNote": "普查汇总 12.43 亿 vs 年鉴 12.67 亿，误差约 1.9%"
  },
  "ages": [
    { "age": 0, "count": 13793799 },
    { "age": 1, "count": 11495247 },
    { "age": 2, "count": 14010711 },
    { "age": 3, "count": 14454335 },
    { "age": 4, "count": 15224282 },
    { "age": 5, "count": 16933559 },
    { "age": 6, "count": 16470140 },
    { "age": 7, "count": 17914756 },
    { "age": 8, "count": 18752106 },
    { "age": 9, "count": 20082026 },
    { "age": 10, "count": 26210044 },
    { "age": 11, "count": 25137678 },
    { "age": 12, "count": 24576191 },
    { "age": 13, "count": 26282644 },
    { "age": 14, "count": 23190076 },
    { "age": 15, "count": 20429326 },
    { "age": 16, "count": 20313426 },
    { "age": 17, "count": 20065048 },
    { "age": 18, "count": 23100427 },
    { "age": 19, "count": 19122938 },
    { "age": 20, "count": 18393809 },
    { "age": 21, "count": 18924822 },
    { "age": 22, "count": 18831591 },
    { "age": 23, "count": 17931155 },
    { "age": 24, "count": 20491797 },
    { "age": 25, "count": 21136635 },
    { "age": 26, "count": 22874423 },
    { "age": 27, "count": 23630435 },
    { "age": 28, "count": 24800391 },
    { "age": 29, "count": 25160381 },
    { "age": 30, "count": 28012344 },
    { "age": 31, "count": 25018386 },
    { "age": 32, "count": 27718516 },
    { "age": 33, "count": 21736582 },
    { "age": 34, "count": 24828470 },
    { "age": 35, "count": 24799129 },
    { "age": 36, "count": 24144848 },
    { "age": 37, "count": 27866189 },
    { "age": 38, "count": 20923112 },
    { "age": 39, "count": 11414017 },
    { "age": 40, "count": 14684726 },
    { "age": 41, "count": 13059787 },
    { "age": 42, "count": 17135981 },
    { "age": 43, "count": 18998424 },
    { "age": 44, "count": 17364027 },
    { "age": 45, "count": 18612172 },
    { "age": 46, "count": 18513434 },
    { "age": 47, "count": 16745695 },
    { "age": 48, "count": 17236621 },
    { "age": 49, "count": 14413123 },
    { "age": 50, "count": 14711260 },
    { "age": 51, "count": 13913927 },
    { "age": 52, "count": 12083027 },
    { "age": 53, "count": 11737540 },
    { "age": 54, "count": 10858446 },
    { "age": 55, "count": 10045173 },
    { "age": 56, "count": 9708711 },
    { "age": 57, "count": 8821540 },
    { "age": 58, "count": 8869780 },
    { "age": 59, "count": 8925171 },
    { "age": 60, "count": 9141141 },
    { "age": 61, "count": 7574442 },
    { "age": 62, "count": 8611865 },
    { "age": 63, "count": 8128275 },
    { "age": 64, "count": 8248125 },
    { "age": 65, "count": 7808592 },
    { "age": 66, "count": 7220066 },
    { "age": 67, "count": 7456399 },
    { "age": 68, "count": 6503311 },
    { "age": 69, "count": 5792092 },
    { "age": 70, "count": 6499332 },
    { "age": 71, "count": 5045743 },
    { "age": 72, "count": 5359819 },
    { "age": 73, "count": 4606896 },
    { "age": 74, "count": 4062359 },
    { "age": 75, "count": 4057266 },
    { "age": 76, "count": 3575411 },
    { "age": 77, "count": 3025726 },
    { "age": 78, "count": 2838736 },
    { "age": 79, "count": 2431191 },
    { "age": 80, "count": 2310212 },
    { "age": 81, "count": 1740870 },
    { "age": 82, "count": 1546079 },
    { "age": 83, "count": 1304628 },
    { "age": 84, "count": 1087369 },
    { "age": 85, "count": 898283 },
    { "age": 86, "count": 772037 },
    { "age": 87, "count": 583159 },
    { "age": 88, "count": 441245 },
    { "age": 89, "count": 335974 },
    { "age": 90, "count": 285875 },
    { "age": 91, "count": 181689 },
    { "age": 92, "count": 140092 },
    { "age": 93, "count": 100237 },
    { "age": 94, "count": 75701 },
    { "age": 95, "count": 58097 },
    { "age": 96, "count": 42063 },
    { "age": 97, "count": 31168 },
    { "age": 98, "count": 23294 },
    { "age": 99, "count": 15134 },
    { "age": 100, "count": 17877 }
  ]
}
```

- [ ] **步骤 3：创建 age-groups.json**

```json
{
  "groups": [
    { "name": "学前", "min": 0, "max": 6 },
    { "name": "小学初中", "min": 7, "max": 13 },
    { "name": "高中", "min": 14, "max": 17 },
    { "name": "大学", "min": 18, "max": 22 },
    { "name": "婚育/职场新人", "min": 23, "max": 32 },
    { "name": "中坚劳动力", "min": 33, "max": 64 },
    { "name": "老年", "min": 65, "max": 120 }
  ]
}
```

- [ ] **步骤 4：Commit**

```bash
git add src/data/
git commit -m "feat: add initial JSON data files from census and yearbook"
```

---

### 任务 3：引擎 — AgeClassifier.js

**文件：**
- 创建：`src/engine/age-classifier.js`

- [ ] **步骤 1：实现 classifyByGroups 函数**

```js
// src/engine/age-classifier.js
/**
 * 按分组配置将每岁人口数聚合为分组结果
 * @param {number[]} distribution - 每岁人口数数组（实际人数），索引为年龄
 * @param {{ name: string, min: number, max: number }[]} groups - 分组配置
 * @returns {{ name: string, count: number }[]}
 */
function classifyByGroups(distribution, groups) {
  return groups.map(g => {
    let count = 0;
    const end = Math.min(g.max, distribution.length - 1);
    for (let age = g.min; age <= end; age++) {
      count += distribution[age] || 0;
    }
    return { name: g.name, count: Math.round(count / 10000 * 100) / 100 };
  });
}

/**
 * 计算分布总人口
 * @param {number[]} distribution - 每岁人口数数组（实际人数）
 * @returns {number} 总人口（万人）
 */
function sumDistribution(distribution) {
  const total = distribution.reduce((s, c) => s + c, 0);
  return Math.round(total / 100) / 100;
}
```

- [ ] **步骤 2：验证 — 浏览器控制台测试**

打开 `index.html`，在浏览器控制台执行：

```js
const testDist = new Array(101).fill(1000000);
const groups = [{ name: "测试组", min: 0, max: 9 }];
const result = classifyByGroups(testDist, groups);
console.assert(result[0].count === 1000, "classifyByGroups failed");
console.log("AgeClassifier tests passed");
```

- [ ] **步骤 3：Commit**

```bash
git add src/engine/age-classifier.js
git commit -m "feat: add AgeClassifier engine"
```

---

### 任务 4：引擎 — PopulationEngine.js

**文件：**
- 创建：`src/engine/population-engine.js`

- [ ] **步骤 1：实现 simulate 函数**

```js
// src/engine/population-engine.js
/**
 * 两阶段人口推演
 * 阶段一：baseYear → currentYear，使用 historicalRates
 * 阶段二：currentYear → targetYear，使用 projectionBirthRate/projectionDeathRate
 */
function simulate({
  baseDistribution,
  historicalRates,
  projectionBirthRate,
  projectionDeathRate,
  baseYear,
  currentYear,
  targetYear
}) {
  let dist = [...baseDistribution];
  const totalYears = targetYear - baseYear;
  const histMap = new Map(historicalRates.map(r => [r.year, r]));

  for (let step = 0; step < totalYears; step++) {
    const currentY = baseYear + step;
    const isHistorical = currentY < currentYear;

    let birthRate, deathRate;
    if (isHistorical) {
      const hr = histMap.get(currentY);
      if (!hr) continue;
      birthRate = hr.birthRate;
      deathRate = hr.deathRate;
    } else {
      birthRate = projectionBirthRate;
      deathRate = projectionDeathRate;
    }

    const totalPop = dist.reduce((s, c) => s + c, 0);
    const newDist = new Array(101).fill(0);

    newDist[0] = Math.round(totalPop * birthRate / 1000);

    for (let age = 1; age < 100; age++) {
      newDist[age] = Math.round(dist[age - 1] * (1 - deathRate / 1000));
    }
    newDist[100] = Math.round(dist[99] * (1 - deathRate / 1000)) + dist[100];

    dist = newDist;
  }

  return {
    year: targetYear,
    distribution: dist,
    totalPopulation: sumDistribution(dist)
  };
}
```

- [ ] **步骤 2：验证 — 浏览器控制台测试**

```js
const baseDist = new Array(101).fill(1000000);
const histRates = [
  { year: 2000, birthRate: 14.03, deathRate: 6.45 },
  { year: 2001, birthRate: 13.38, deathRate: 6.43 }
];
const result = simulate({
  baseDistribution: baseDist,
  historicalRates: histRates,
  projectionBirthRate: 5.63,
  projectionDeathRate: 8.04,
  baseYear: 2000,
  currentYear: 2002,
  targetYear: 2005
});
console.assert(result.year === 2005, "year check");
console.assert(result.distribution.length === 101, "distribution length check");
console.assert(result.totalPopulation > 0, "totalPopulation > 0");
console.log("PopulationEngine tests passed, totalPopulation:", result.totalPopulation.toFixed(2), "万人");
```

- [ ] **步骤 3：Commit**

```bash
git add src/engine/population-engine.js
git commit -m "feat: add PopulationEngine with two-phase simulation"
```

---

### 任务 5：引擎 — DataParser.js

**文件：**
- 创建：`src/engine/data-parser.js`

- [ ] **步骤 1：实现 DataParser**

```js
// src/engine/data-parser.js
const DataParser = {
  parsePopulationHistory(worksheet) {
    const json = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    if (json.length === 0) return { records: [], errors: ['文件为空'] };

    const errors = [];
    const firstRow = json[0];
    const colMap = this._detectColumns(firstRow, errors);
    if (errors.length > 0) return { records: [], errors };

    const records = json.map((row, i) => {
      const year = parseInt(row[colMap.year]);
      if (isNaN(year)) {
        errors.push(`第 ${i + 2} 行：无法识别年份`);
        return null;
      }
      return {
        year,
        totalPopulation: parseFloat(row[colMap.totalPopulation]) || 0,
        births: parseFloat(row[colMap.births]) || 0,
        deaths: parseFloat(row[colMap.deaths]) || 0,
        birthRate: parseFloat(row[colMap.birthRate]) || 0,
        deathRate: parseFloat(row[colMap.deathRate]) || 0,
        naturalGrowthRate: Math.round((parseFloat(row[colMap.birthRate] || 0) - parseFloat(row[colMap.deathRate] || 0)) * 100) / 100,
        malePopulation: parseFloat(row[colMap.malePopulation]) || null,
        femalePopulation: parseFloat(row[colMap.femalePopulation]) || null,
        urbanPopulation: parseFloat(row[colMap.urbanPopulation]) || null,
        ruralPopulation: parseFloat(row[colMap.ruralPopulation]) || null
      };
    }).filter(Boolean);

    return { records, errors };
  },

  parseAgeDistribution(worksheet) {
    const json = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    if (json.length === 0) return { ages: [], errors: ['文件为空'] };

    const errors = [];
    const firstRow = json[0];
    const ageCol = Object.keys(firstRow).find(k => /年龄|age/i.test(k));
    const countCol = Object.keys(firstRow).find(k => /人口|人数|count|population/i.test(k));

    if (!ageCol) return { ages: [], errors: ['未找到"年龄"列'] };
    if (!countCol) return { ages: [], errors: ['未找到"人口数"列'] };

    const ages = [];
    for (const row of json) {
      let age = parseInt(row[ageCol]);
      if (isNaN(age)) continue;
      let count = parseInt(row[countCol]);
      if (isNaN(count)) count = 0;
      if (age > 100) age = 100;
      ages.push({ age, count });
    }

    ages.sort((a, b) => a.age - b.age);
    const filled = [];
    for (let a = 0; a <= 100; a++) {
      const found = ages.find(x => x.age === a);
      filled.push({ age: a, count: found ? found.count : 0 });
    }
    return { ages: filled, errors };
  },

  _detectColumns(firstRow, errors) {
    const keys = Object.keys(firstRow);
    const find = (keywords) => keys.find(k => keywords.some(kw => k.includes(kw)));

    const year = find(['年份', 'year']);
    const birthRate = find(['出生率']);
    const deathRate = find(['死亡率']);
    const totalPopulation = find(['总人口', '年末总人口']);
    const births = find(['出生人口', '出生人数']);
    const deaths = find(['死亡人口', '死亡人数']);
    const malePopulation = find(['男性']);
    const femalePopulation = find(['女性']);
    const urbanPopulation = find(['城镇']);
    const ruralPopulation = find(['乡村']);

    const missing = [];
    if (!year) missing.push('年份');
    if (!birthRate) missing.push('出生率');
    if (!deathRate) missing.push('死亡率');
    if (!totalPopulation) missing.push('总人口');
    if (!births) missing.push('出生人口');
    if (!deaths) missing.push('死亡人口');
    if (missing.length) errors.push(`缺少列：${missing.join('、')}`);

    return { year, birthRate, deathRate, totalPopulation, births, deaths,
             malePopulation, femalePopulation, urbanPopulation, ruralPopulation };
  },

  generateHistoryTemplate() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([[
      '年份', '人口出生率 (‰)', '人口死亡率 (‰)', '年末总人口 (万人)',
      '出生人口 (万人)', '死亡人口 (万人)', '男性人口 (万人)',
      '女性人口 (万人)', '城镇人口 (万人)', '乡村人口 (万人)'
    ]]);
    ws['!cols'] = new Array(10).fill({ wch: 18 });
    XLSX.utils.book_append_sheet(wb, ws, '逐年数据');
    return wb;
  },

  generateAgeTemplate() {
    const wb = XLSX.utils.book_new();
    const rows = [['年龄', '人口数']];
    for (let a = 0; a <= 100; a++) {
      rows.push([a, null]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 10 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, '年龄分布');
    return wb;
  },

  downloadWorkbook(wb, filename) {
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};
```

- [ ] **步骤 2：Commit**

```bash
git add src/engine/data-parser.js
git commit -m "feat: add DataParser with Excel/CSV parsing and template generation"
```

---

### 任务 6：组件 — RateInput.js

**文件：**
- 创建：`src/components/rate-input.js`

- [ ] **步骤 1：实现 RateInput 组件**

```js
// src/components/rate-input.js
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
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/rate-input.js
git commit -m "feat: add RateInput component"
```

---

### 任务 7：组件 — BirthDeathChart.js

**文件：**
- 创建：`src/components/birth-death-chart.js`

- [ ] **步骤 1：实现 BirthDeathChart 组件**

```js
// src/components/birth-death-chart.js
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
  },
  methods: {
    renderCharts() {
      this.renderBarChart();
      this.renderLineChart();
    },
    renderBarChart() {
      const chart = echarts.init(this.$refs.barChart);
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
      const chart = echarts.init(this.$refs.lineChart);
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
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/birth-death-chart.js
git commit -m "feat: add BirthDeathChart component with bar and line charts"
```

---

### 任务 8：组件 — AgeDistribution.js

**文件：**
- 创建：`src/components/age-distribution.js`

- [ ] **步骤 1：实现 AgeDistribution 组件**

```js
// src/components/age-distribution.js
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
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/age-distribution.js
git commit -m "feat: add AgeDistribution component with group/age toggle"
```

---

### 任务 9：组件 — AgeGroupEditor.js

**文件：**
- 创建：`src/components/age-group-editor.js`

- [ ] **步骤 1：实现 AgeGroupEditor 组件**

```js
// src/components/age-group-editor.js
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
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/age-group-editor.js
git commit -m "feat: add AgeGroupEditor component with CRUD and import/export"
```

---

### 任务 10：组件 — DataManager.js

**文件：**
- 创建：`src/components/data-manager.js`

- [ ] **步骤 1：实现 DataManager 组件**

```js
// src/components/data-manager.js
const DataManager = {
  emits: ['update-history', 'update-age-dist', 'update-groups'],
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
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">年龄分布数据 (base-age-distribution)</div>
            <div class="card-body">
              <input type="file" class="form-control" accept=".xlsx,.xls,.csv" @change="onAgeFile">
              <div v-if="agePreview.length" class="mt-2" style="max-height: 200px; overflow: auto">
                <table class="table table-sm table-bordered small">
                  <thead><tr><th>年龄</th><th>人口数</th></tr></thead>
                  <tbody><tr v-for="r in agePreview.slice(0, 10)"><td>{{ r.age }}</td><td>{{ r.count }}</td></tr></tbody>
                </table>
                <div class="text-muted small">共 {{ agePreview.length }} 行（仅显示前 10 行）</div>
              </div>
              <div v-if="ageErrors.length" class="alert alert-danger mt-2 py-1 small">
                <div v-for="e in ageErrors">{{ e }}</div>
              </div>
              <button v-if="ageData" class="btn btn-sm btn-success mt-2" @click="downloadAge">下载 base-age-distribution.json</button>
              <button class="btn btn-sm btn-outline-secondary mt-2 ms-1" @click="downloadAgeTemplate">下载年龄分布模板</button>
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
      ageData: null,
      agePreview: [],
      ageErrors: [],
      groups: []
    };
  },
  mounted() {
    this.loadDefaultData();
  },
  methods: {
    async loadDefaultData() {
      try {
        const [histResp, ageResp, groupsResp] = await Promise.all([
          fetch('src/data/population-history.json'),
          fetch('src/data/base-age-distribution.json'),
          fetch('src/data/age-groups.json')
        ]);
        const hist = await histResp.json();
        this.historyRecords = hist.records;
        this.$emit('update-history', hist.records);
        const age = await ageResp.json();
        this.ageData = age;
        this.$emit('update-age-dist', age);
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
      if (!/\\.(xlsx|xls|csv)$/i.test(file.name)) {
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
    onAgeFile(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (!/\\.(xlsx|xls|csv)$/i.test(file.name)) {
        alert('请上传 .xlsx / .xls / .csv 文件');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const { ages, errors } = DataParser.parseAgeDistribution(ws);
        this.ageData = {
          meta: { baseYear: new Date().getFullYear(), source: '用户上传', discrepancyNote: '' },
          ages
        };
        this.agePreview = ages;
        this.ageErrors = errors;
        this.$emit('update-age-dist', this.ageData);
      };
      reader.readAsArrayBuffer(file);
    },
    downloadHistory() {
      DataParser.downloadJSON({ meta: { lastUpdated: new Date().toISOString().slice(0,10), source: '用户上传' }, records: this.historyRecords }, 'population-history.json');
    },
    downloadAge() {
      DataParser.downloadJSON(this.ageData, 'base-age-distribution.json');
    },
    downloadHistoryTemplate() {
      DataParser.downloadWorkbook(DataParser.generateHistoryTemplate(), '逐年数据模板.xlsx');
    },
    downloadAgeTemplate() {
      DataParser.downloadWorkbook(DataParser.generateAgeTemplate(), '年龄分布模板.xlsx');
    },
    onGroupsUpdate(groups) {
      this.groups = groups;
      this.$emit('update-groups', groups);
    }
  }
};
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/data-manager.js
git commit -m "feat: add DataManager component with upload, preview, download"
```

---

### 任务 11：组件 — SimulationPanel.js

**文件：**
- 创建：`src/components/simulation-panel.js`

- [ ] **步骤 1：实现 SimulationPanel 组件**

```js
// src/components/simulation-panel.js
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
      targetYear: 2050,
      result: null
    };
  },
  computed: {
    hasBaseData() { return this.ageDistribution && this.ageDistribution.ages; },
    currentYear() {
      if (this.historyData.length) return Math.max(...this.historyData.map(r => r.year));
      return new Date().getFullYear();
    },
    sliderMin() { return this.currentYear + 1; },
    baseYear() {
      return this.ageDistribution?.meta?.baseYear || 2000;
    }
  },
  watch: {
    historyData: {
      handler() { this.resetRates(); this.runSimulation(); },
      immediate: true
    },
    birthRate() { this.runSimulation(); },
    deathRate() { this.runSimulation(); },
    targetYear() { this.runSimulation(); },
    ageDistribution() { this.runSimulation(); },
    ageGroups() { if (this.result) this.renderResultChart(); }
  },
  methods: {
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
      if (!this.$refs.resultChart || !this.result) return;
      const chart = echarts.init(this.$refs.resultChart);
      const groups = classifyByGroups(this.result.distribution, this.ageGroups);
      chart.setOption({
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
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/simulation-panel.js
git commit -m "feat: add SimulationPanel with slider, presets, and projection chart"
```

---

### 任务 12：App.js — 根组件集成

**文件：**
- 创建：`src/app.js`

- [ ] **步骤 1：实现 App 初始化**

```js
// src/app.js
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
```

- [ ] **步骤 2：验证 — 浏览器打开 index.html**

检查：
- 4 个 Tab 可切换
- 历史趋势 Tab 显示图表
- 年龄分布 Tab 显示图表
- 数据管理 Tab 可上传文件、下载模板
- 模拟推演 Tab 滑块和预设按钮正常工作

- [ ] **步骤 3：Commit**

```bash
git add src/app.js
git commit -m "feat: wire up App root component with all tabs"
```

---

### 任务 13：离线转换脚本 convert.js

**文件：**
- 创建：`scripts/convert.js`

- [ ] **步骤 1：实现 Node.js 转换脚本**

```js
// scripts/convert.js
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const inputFile = args[args.indexOf('--input') + 1] || args[1];
const outputDir = args[args.indexOf('--output') + 1] || 'src/data/';

if (!inputFile) {
  console.log('用法: node scripts/convert.js --input data.xlsx [--output src/data/]');
  process.exit(1);
}

const wb = XLSX.readFile(inputFile);

function detectAndParseHistory(sheet) {
  const json = XLSX.utils.sheet_to_json(sheet, { defval: null });
  if (!json.length) return null;

  const firstRow = json[0];
  const keys = Object.keys(firstRow);
  const find = (kws) => keys.find(k => kws.some(kw => k.includes(kw)));
  const yearCol = find(['年份', 'year']);
  const brCol = find(['出生率']);
  const drCol = find(['死亡率']);
  const tpCol = find(['总人口', '年末']);
  const birthsCol = find(['出生人口', '出生人数']);
  const deathsCol = find(['死亡人口', '死亡人数']);

  if (!yearCol || !brCol || !drCol) return null;

  const records = json.map(row => ({
    year: parseInt(row[yearCol]),
    totalPopulation: parseFloat(row[tpCol]) || 0,
    births: parseFloat(row[birthsCol]) || 0,
    deaths: parseFloat(row[deathsCol]) || 0,
    birthRate: parseFloat(row[brCol]) || 0,
    deathRate: parseFloat(row[drCol]) || 0,
    naturalGrowthRate: Math.round((parseFloat(row[brCol] || 0) - parseFloat(row[drCol] || 0)) * 100) / 100
  })).filter(r => !isNaN(r.year));

  return { meta: { lastUpdated: new Date().toISOString().slice(0,10), source: inputFile }, records };
}

function detectAndParseAge(sheet) {
  const json = XLSX.utils.sheet_to_json(sheet, { defval: null });
  if (!json.length) return null;

  const firstRow = json[0];
  const keys = Object.keys(firstRow);
  const find = (kws) => keys.find(k => kws.some(kw => k.includes(kw)));
  const ageCol = find(['年龄', 'age']);
  const countCol = find(['人口', '人数', 'count']);

  if (!ageCol || !countCol) return null;

  const ages = [];
  for (const row of json) {
    let age = parseInt(row[ageCol]);
    if (isNaN(age) || age < 0) continue;
    if (age > 100) age = 100;
    const count = parseInt(row[countCol]) || 0;
    ages.push({ age, count });
  }
  ages.sort((a, b) => a.age - b.age);

  const filled = [];
  for (let a = 0; a <= 100; a++) {
    const found = ages.find(x => x.age === a);
    filled.push({ age: a, count: found ? found.count : 0 });
  }

  return { meta: { baseYear: 2000, source: inputFile, discrepancyNote: '' }, ages: filled };
}

for (const sheetName of wb.SheetNames) {
  const sheet = wb.Sheets[sheetName];
  const historyData = detectAndParseHistory(sheet);
  if (historyData) {
    const outPath = path.join(outputDir, 'population-history.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(historyData, null, 2), 'utf8');
    console.log(`已生成: ${outPath} (${historyData.records.length} 条记录)`);
    continue;
  }
  const ageData = detectAndParseAge(sheet);
  if (ageData) {
    const outPath = path.join(outputDir, 'base-age-distribution.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(ageData, null, 2), 'utf8');
    console.log(`已生成: ${outPath} (${ageData.ages.length} 个年龄)`);
    continue;
  }
  console.log(`跳过: ${sheetName}（未识别格式）`);
}
```

- [ ] **步骤 2：验证 — 运行脚本**

```bash
npm install
node scripts/convert.js --input data.txt
```

预期：输出识别结果或提示格式不匹配（data.txt 为 TSV 非 Excel，需先转为 xlsx 或直接用后续的页面内置解析器处理）。

- [ ] **步骤 3：Commit**

```bash
git add scripts/convert.js
git commit -m "feat: add offline convert script for Excel/CSV to JSON"
```

---

### 任务 14：集成验证 & 收尾

**文件：** 无新增

- [ ] **步骤 1：完整功能验证**

在浏览器中打开 `index.html`：

| 检查项 | 预期 |
|--------|------|
| Tab 1 历史趋势 | 条形图和折线图均渲染，数据滑块可缩放 |
| Tab 2 年龄分布 | 分组柱状图渲染，切换到"按每岁"视图正常 |
| Tab 2 偏差提示 | 黄色提示条显示普查与年鉴误差 |
| Tab 3 上传 xlsx | 上传后预览表显示数据，可下载 JSON |
| Tab 3 模板下载 | 两个模板按钮可下载 .xlsx |
| Tab 3 分组编辑 | 可增删改分组，可导出/导入 JSON |
| Tab 4 模拟推演 | 滑块/预设按钮正常，图表实时更新 |
| Tab 4 参数默认值 | 出生率/死亡率为最末年数值 |
| Tab 4 基准数据缺失 | 年龄分布未加载时显示警告提示 |

- [ ] **步骤 2：修复验证中发现的问题**

（根据验证结果逐步修复，每个修复单独 commit）

- [ ] **步骤 3：最终 Commit**

```bash
git add -A
git commit -m "chore: final integration polish and fixes"
```

