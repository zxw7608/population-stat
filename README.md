# 人口统计可视化

中国人口数据可视化与推演工具。

[打开页面](https://zxw7608.github.io/population-stat/)

### 功能

- **历史趋势** — 1949-2025 年出生/死亡人口柱状图及出生率/死亡率折线图
- **年龄分布与推演** — 基于逐年出生队列追踪的当前年龄分布 + 自定义出生率/死亡率的未来推演
- **数据管理** — 上传 Excel/CSV 逐年数据，下载模板和 JSON

### 技术

纯前端静态页面：Vue 3 + Bootstrap 5 + ECharts 5，全部 CDN 加载，无构建工具。

### 本地运行

```bash
npm install   # 仅 xlsx 依赖（离线转换脚本用）
npm run dev   # 启动本地服务器 → http://localhost:3000
```

Excel 离线转 JSON：

```bash
npm run convert -- --input data.xlsx --output src/data/
```
