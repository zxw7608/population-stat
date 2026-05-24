/**
 * Script to parse data.txt and data2.txt and generate:
 * - src/data/population-history.json
 * - src/data/base-age-distribution.json
 * - src/data/age-groups.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── Helper: robust TSV split ──────────────────────────────────────────────
function splitTsv(line) {
  // Split on tabs, trim each field, keep non-empty ones
  return line.split('\t').map(s => s.trim());
}

// ── Helper: check if string looks like a number ───────────────────────────
function isNumeric(s) {
  return s !== '' && !isNaN(Number(s));
}

// ══════════════════════════════════════════════════════════════════════════
// 1. Parse data.txt  →  population-history.json
// ══════════════════════════════════════════════════════════════════════════
function parsePopulationHistory() {
  const content = fs.readFileSync(path.join(ROOT, 'data.txt'), 'utf-8');
  const lines = content.split('\n');

  // Row indices (0-based) — verified against the file structure:
  // line 3 (idx 2): years
  // line 4 (idx 3): birth rates
  // line 5 (idx 4): death rates
  // line 6 (idx 5): natural growth rates
  // line 9 (idx 8): year-end total population
  // line 15 (idx 14): births
  // line 16 (idx 15): deaths
  function getDataCols(rowIdx) {
    const fields = splitTsv(lines[rowIdx]);
    // First field is either empty (years row) or a label — skip it
    // Then take all remaining fields that look numeric
    const numeric = [];
    for (let i = 1; i < fields.length; i++) {
      if (isNumeric(fields[i])) {
        numeric.push(Number(fields[i]));
      }
    }
    return numeric;
  }

  const years           = getDataCols(2);   // line 3
  const birthRates      = getDataCols(3);   // line 4
  const deathRates      = getDataCols(4);   // line 5
  const naturalRates    = getDataCols(5);   // line 6
  const totalPop        = getDataCols(8);   // line 9
  const births          = getDataCols(14);  // line 15
  const deaths          = getDataCols(15);  // line 16

  if (years.length === 0) {
    throw new Error('Failed to parse years from data.txt');
  }

  // Build records (data is 2025→1949, we want 1949→2025)
  const records = [];
  const n = years.length;
  for (let i = 0; i < n; i++) {
    records.push({
      year: years[i],
      totalPopulation: totalPop[i] ?? null,
      births: births[i] ?? null,
      deaths: deaths[i] ?? null,
      birthRate: birthRates[i] ?? null,
      deathRate: deathRates[i] ?? null,
      naturalGrowthRate: naturalRates[i] ?? null
    });
  }
  records.reverse(); // oldest first

  return {
    meta: {
      lastUpdated: '2026-05-24',
      source: '国家统计局年鉴'
    },
    records
  };
}

// ══════════════════════════════════════════════════════════════════════════
// 2. Parse data2.txt  →  base-age-distribution.json
// ══════════════════════════════════════════════════════════════════════════
function parseAgeDistribution() {
  const content = fs.readFileSync(path.join(ROOT, 'data2.txt'), 'utf-8');
  const lines = content.split('\n');

  const ages = [];

  // Matches: "0岁", "1岁", ... "99岁"
  const singleAgeRe = /^(\d+)岁$/;
  // Matches: "100岁及以上"
  const maxAgeRe = /^100岁及以上$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const fields = splitTsv(line);
    if (fields.length < 2) continue;

    const firstField = fields[0].trim();
    const secondField = fields[1].trim();

    // Per-age row: e.g. "0岁"
    const singleMatch = firstField.match(singleAgeRe);
    if (singleMatch) {
      const age = parseInt(singleMatch[1], 10);
      const count = parseInt(secondField, 10);
      if (!isNaN(count)) {
        ages.push({ age, count });
      }
      continue;
    }

    // 100+ row: "100岁及以上"
    if (maxAgeRe.test(firstField)) {
      const count = parseInt(secondField, 10);
      if (!isNaN(count)) {
        ages.push({ age: 100, count });
      }
      continue;
    }

    // Group rows like "0-4岁", "5-9岁" etc — skip silently
  }

  return {
    meta: {
      baseYear: 2000,
      source: '第五次全国人口普查',
      discrepancyNote: '普查汇总 12.43 亿 vs 年鉴 12.67 亿，误差约 1.9%'
    },
    ages
  };
}

// ══════════════════════════════════════════════════════════════════════════
// 3. Create age-groups.json (static config)
// ══════════════════════════════════════════════════════════════════════════
function createAgeGroups() {
  return {
    groups: [
      { name: '学前', min: 0, max: 6 },
      { name: '小学初中', min: 7, max: 13 },
      { name: '高中', min: 14, max: 17 },
      { name: '大学', min: 18, max: 22 },
      { name: '婚育/职场新人', min: 23, max: 32 },
      { name: '中坚劳动力', min: 33, max: 64 },
      { name: '老年', min: 65, max: 120 }
    ]
  };
}

// ══════════════════════════════════════════════════════════════════════════
// Write output
// ══════════════════════════════════════════════════════════════════════════
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`Wrote: ${filePath}`);
}

// ── Validation ────────────────────────────────────────────────────────────
function validateJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  JSON.parse(raw); // throws if invalid
  const stats = fs.statSync(filePath);
  console.log(`Validated: ${filePath} (${stats.size} bytes)`);
}

// ══════════════════════════════════════════════════════════════════════════
// Main
// ══════════════════════════════════════════════════════════════════════════
const dataDir = path.join(ROOT, 'src', 'data');

try {
  console.log('=== Generating population-history.json ===');
  const history = parsePopulationHistory();
  console.log(`  Records: ${history.records.length} (${history.records[0].year}-${history.records[history.records.length-1].year})`);
  writeJson(path.join(dataDir, 'population-history.json'), history);

  console.log('=== Generating base-age-distribution.json ===');
  const dist = parseAgeDistribution();
  console.log(`  Ages: ${dist.ages.length} (${dist.ages[0].age}-${dist.ages[dist.ages.length-1].age})`);
  writeJson(path.join(dataDir, 'base-age-distribution.json'), dist);

  console.log('=== Generating age-groups.json ===');
  const groups = createAgeGroups();
  console.log(`  Groups: ${groups.groups.length}`);
  writeJson(path.join(dataDir, 'age-groups.json'), groups);

  // Validate all
  console.log('=== Validating JSON ===');
  validateJson(path.join(dataDir, 'population-history.json'));
  validateJson(path.join(dataDir, 'base-age-distribution.json'));
  validateJson(path.join(dataDir, 'age-groups.json'));

  console.log('\nDone — all 3 files created and validated.');
} catch (err) {
  console.error('ERROR:', err.message);
  console.error(err.stack);
  process.exit(1);
}
