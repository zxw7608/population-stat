// src/engine/data-parser.js
const DataParser = {
  /**
   * 解析 Excel/CSV 工作表为逐年数据 records
   * @param {Object} worksheet - SheetJS worksheet 对象
   * @returns {{ records: Object[], errors: string[] }}
   */
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

  /**
   * 解析年龄分布工作表
   * @param {Object} worksheet - SheetJS worksheet
   * @returns {{ ages: { age: number, count: number }[], errors: string[] }}
   */
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

  /**
   * 关键词匹配列名
   */
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

  /**
   * 生成逐年数据模板 Workbook
   */
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

  /**
   * 生成年龄分布模板 Workbook
   */
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

  /**
   * 将 Workbook 导出为 Blob 下载
   */
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

  /**
   * 将 JSON 对象导出为文件下载
   */
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
