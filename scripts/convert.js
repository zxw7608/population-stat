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

// 检测每个 sheet 的类型并转换
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
