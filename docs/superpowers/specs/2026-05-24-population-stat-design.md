# 人口统计可视化页面 — 设计规格

## 概述

构建一个纯前端人口统计可视化单页应用，支持历史数据图表展示、年龄段分布分析、Excel 数据导入/JSON 导出，以及基于出生率/死亡率参数模拟未来人口结构变化。

## 技术选型

- Vue 3 (CDN)
- Bootstrap 5 (CDN)
- ECharts 5 (CDN)
- SheetJS (xlsx, CDN) — Excel 解析
- 纯静态页面，无构建工具

## 文件结构

```
population-stat/
├── index.html                  # 入口
├── src/
│   ├── App.vue                 # 根组件，Tab 路由
│   ├── components/
│   │   ├── BirthDeathChart.vue       # 出生死亡条形图
│   │   ├── AgeDistribution.vue       # 年龄分布图
│   │   ├── DataManager.vue           # 数据上传/下载面板
│   │   ├── SimulationPanel.vue       # 模拟推演面板
│   │   ├── AgeGroupEditor.vue        # 年龄分组配置面板
│   │   └── RateInput.vue             # 出生率/死亡率输入组件
│   ├── engine/
│   │   ├── PopulationEngine.js       # 人口推演引擎
│   │   ├── DataParser.js             # Excel/CSV → JSON 解析
│   │   └── AgeClassifier.js          # 年龄段分类（读取配置）
│   └── data/
│       ├── population-history.json       # 逐年人口数据
│       ├── base-age-distribution.json    # 基准年每岁人口数
│       └── age-groups.json               # 年龄分组配置
├── scripts/
│   └── convert.js               # Node.js 离线转换脚本
└── package.json                 # (仅含 xlsx 依赖用于 convert.js)
```

## 页面布局

4 个 Tab 页签：

### Tab 1: 历史趋势
- 上排：年度出生/死亡人口条形图 (ECharts Bar)
- 下排：年度出生率/死亡率/自然增长率折线图 (ECharts Line)
- 数据源：`population-history.json`

### Tab 2: 年龄分布
- 年龄分组柱状图/饼图 (ECharts)
- 分组按 `age-groups.json` 配置实时聚合
- 可切换"按分组" / "按每岁"视图
- 顶部黄色提示条：显示普查汇总与年鉴总数偏差

### Tab 3: 数据管理
- 上传区域：拖拽或点击上传 .xlsx / .xls / .csv
- 解析预览表格：可校验数据
- 按钮：下载 `population-history.json`、下载 `base-age-distribution.json`
- 年龄分组编辑器：增/删/改分组，导入/导出分组配置

### Tab 4: 模拟推演
- 参数输入：出生率 (‰)、死亡率 (‰)，默认取最末年值
- 目标年份滑块 (2026 ~ 2100)
- 预设按钮：[+10年] [+20年] [+50年] [2100年]
- 推演结果图表：目标年份年龄分布柱状图
- 与当前年份对比模式（可选切换）

## JSON 数据格式

### population-history.json

```json
{
  "meta": {
    "lastUpdated": "2026-05-24",
    "source": "国家统计局年鉴"
  },
  "records": [
    {
      "year": 2025,
      "totalPopulation": 140489,
      "births": 791.91,
      "deaths": 1130.89,
      "birthRate": 5.63,
      "deathRate": 8.04,
      "naturalGrowthRate": -2.41,
      "malePopulation": 71685,
      "femalePopulation": 68804,
      "urbanPopulation": 95380,
      "ruralPopulation": 45109
    }
  ]
}
```

### base-age-distribution.json

```json
{
  "meta": {
    "baseYear": 2000,
    "source": "第五次全国人口普查",
    "discrepancyNote": "普查汇总 12.43 亿 vs 年鉴 12.67 亿，误差约 1.9%"
  },
  "ages": [
    { "age": 0, "count": 13793799 },
    { "age": 1, "count": 11495247 }
  ]
}
```

`ages` 数组从 0 岁到 100+ 岁，共 101 个元素。

### age-groups.json

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

## 模拟推演引擎

### 单位约定

引擎内部统一使用**实际人数**（非"万人"）。基准分布 `base-age-distribution.json` 已是实际人数，`population-history.json` 中的"万人"字段在进入引擎前需乘以 10000 转换。

### 算法（两阶段推演）

**阶段一：追赶到当前年份**

基准年（2000）→ 当前年份（如 2025），使用 `population-history.json` 中每年的**实际**出生率/死亡率：

```
2001 年 age[0]   = 2000 年总人口 × birthRate(2000) / 1000
2001 年 age[n]   = 2000 年 age[n-1] × (1 - deathRate(2000) / 1000)
...
重复至当前年份
```

**阶段二：未来推演**

当前年份 → 目标年份，使用用户指定的出生率/死亡率：

```
Y+1 年 age[0]   = Y 年总人口 × userBirthRate / 1000
Y+1 年 age[n]   = Y 年 age[n-1] × (1 - userDeathRate / 1000)
Y+1 年 age[100] += Y 年 age[100]（百岁及以上累积，不再死亡）
```

- 101 个年龄槽位（0 ~ 100+）
- 总人口 = sum(所有 age 槽位) / 10000，仅用于展示（万人）
- 统一死亡率接口，后续可替换为分年龄死亡率表
- 推演完成后按 `age-groups.json` 聚合

### 函数签名

```js
function simulate({
  baseDistribution,       // number[101] 实际人数
  historicalRates,        // [{ year, birthRate, deathRate }] 阶段一用
  projectionBirthRate,    // ‰ 阶段二用
  projectionDeathRate,    // ‰ 阶段二用
  baseYear,               // 基准年年份（如 2000）
  currentYear,            // 当前数据最末年（如 2025）
  targetYear              // 目标推演年份（如 2050）
}) => {
  distribution: number[101],  // 实际人数
  totalPopulation: number,    // 万人
  groups: { [name]: number }  // 万人
}
```

## 数据转换模板

### Excel → JSON 转换规则

`DataParser.js` 和 `convert.js` 均实现以下规则：

**生成 population-history.json：**
- 第一行识别为表头，需包含：年份、人口出生率、人口死亡率、年末总人口、出生人口、死亡人口 等列
- 列名通过关键词匹配（"出生率"匹配"人口出生率 (‰)"）
- 自动标准化为 JSON 格式

**生成 base-age-distribution.json：**
- 识别年龄列和人口数列
- 支持两种格式：
  - 每岁一行（如 data2.txt）
  - 分组汇总（自动按平均分配到每岁）

### 用户数据提供模板

用户只需提供两份数据，格式不限（Excel/CSV/TXT）：

**表 A — 逐年数据**（对应现有 data.txt）：

| 年份 | 人口出生率 (‰) | 人口死亡率 (‰) | 年末总人口 (万人) | 出生人口 (万人) | 死亡人口 (万人) | ... |
|------|---------------|---------------|------------------|---------------|---------------|-----|
| 2025 | 5.63          | 8.04          | 140489           | 791.91        | 1130.89       | ... |

**表 B — 某年份年龄分布**（对应现有 data2.txt）：

| 年龄 | 人口数   |
|------|---------|
| 0    | 13793799 |
| 1    | 11495247 |
| ...  | ...     |
| 100+ | 17877   |

页面内置模板下载按钮，可下载空模板 Excel。

## 错误处理

| 场景 | 处理 |
|------|------|
| 普查与年鉴总数不一致 | 年龄分布图顶部黄色提示条 |
| 上传非 Excel/CSV 文件 | Toast 提示"请上传 .xlsx / .xls / .csv 文件" |
| 必填列缺失 | 预览表缺失列标红，阻止下载 JSON |
| 出生率/死亡率输入非法 | 即时校验：0-100 之间，红色边框 |
| 基准年数据缺失 | 模拟 Tab 置灰，提示"请先在数据管理页面上传年龄分布数据" |
| 年份滑块超出历史数据 | 图表仅显示已有数据范围，缺失标注"暂无数据" |

## 模板提供

页面"数据管理"Tab 提供两个模板下载按钮：
1. **下载逐年数据模板** — 预填表头的空 Excel（含列名说明）
2. **下载年龄分布模板** — 0-100+ 岁行头，人口数列空白待填
