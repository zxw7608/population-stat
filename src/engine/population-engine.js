// src/engine/population-engine.js
/**
 * 两阶段人口推演
 * 阶段一：baseYear → currentYear，使用 historicalRates
 * 阶段二：currentYear → targetYear，使用 projectionBirthRate/projectionDeathRate
 *
 * @param {Object} params
 * @param {number[]} params.baseDistribution - 基准年每岁实际人数 (length=101, index=age)
 * @param {{ year: number, birthRate: number, deathRate: number }[]} params.historicalRates
 * @param {number} params.projectionBirthRate - 推演出生率 (‰)
 * @param {number} params.projectionDeathRate - 推演死亡率 (‰)
 * @param {number} params.baseYear
 * @param {number} params.currentYear
 * @param {number} params.targetYear
 * @returns {{ year: number, distribution: number[], totalPopulation: number }}
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

    // 新生儿
    newDist[0] = Math.round(totalPop * birthRate / 1000);

    // 年龄递进 + 死亡
    for (let age = 1; age < 100; age++) {
      newDist[age] = Math.round(dist[age - 1] * (1 - deathRate / 1000));
    }
    // 100+ 岁：99岁存活者 + 原100+岁存活者（不再死亡）
    newDist[100] = Math.round(dist[99] * (1 - deathRate / 1000)) + dist[100];

    dist = newDist;
  }

  return {
    year: targetYear,
    distribution: dist,
    totalPopulation: sumDistribution(dist)
  };
}
