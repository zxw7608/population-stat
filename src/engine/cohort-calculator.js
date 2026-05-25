/**
 * 从逐年出生/死亡数据推算当前年龄分布
 * 追踪每个出生队列逐年存活 → 残差归入 pre-data 槽位
 *
 * @param {{ year: number, births: number, deathRate: number, totalPopulation: number }[]} records
 * @returns {number[]} 长度 101，按年龄索引，单位：万人
 */
function calculateCohortDistribution(records) {
  if (!records.length) return new Array(101).fill(0);

  const sorted = [...records].sort((a, b) => a.year - b.year);
  const latestYear = sorted[sorted.length - 1].year;
  const earliestYear = sorted[0].year;

  const map = new Map(sorted.map(r => [r.year, r]));
  const dist = new Array(101).fill(0);
  let trackedTotal = 0;

  for (let birthYear = earliestYear; birthYear <= latestYear; birthYear++) {
    const data = map.get(birthYear);
    if (!data) continue;
    let cohort = data.births; // 万人

    for (let y = birthYear + 1; y <= latestYear; y++) {
      const yr = map.get(y);
      if (yr && yr.deathRate > 0) {
        cohort *= (1 - yr.deathRate / 1000);
      }
    }

    const age = latestYear - birthYear;
    dist[Math.min(age, 100)] = cohort;
    trackedTotal += cohort;
  }

  // 残差 = 出生早于 earliestYear 的存活人口，归入最年轻可能的年龄
  const residual = sorted[sorted.length - 1].totalPopulation - trackedTotal;
  const preDataAge = Math.min(latestYear - earliestYear + 1, 100);
  dist[preDataAge] = Math.max(0, residual);

  return dist;
}
