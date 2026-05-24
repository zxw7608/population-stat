/**
 * 单阶段人口推演：从起始年逐年递推到目标年
 *
 * @param {Object} params
 * @param {number[]} params.baseDistribution - 起始年每岁人数（万人），length=101，index=age
 * @param {number} params.birthRate - 推演出生率 (‰)
 * @param {number} params.deathRate - 推演死亡率 (‰)
 * @param {number} params.startYear
 * @param {number} params.targetYear
 * @returns {{ year: number, distribution: number[], totalPopulation: number }}
 */
function simulate({
  baseDistribution,
  birthRate,
  deathRate,
  startYear,
  targetYear
}) {
  let dist = [...baseDistribution];
  const years = targetYear - startYear;
  if (years <= 0) {
    return {
      year: targetYear,
      distribution: dist,
      totalPopulation: sumDistribution(dist)
    };
  }

  for (let step = 0; step < years; step++) {
    const totalPop = dist.reduce((s, c) => s + c, 0);
    const newDist = new Array(101).fill(0);

    // 新生儿 = 总人口 × 出生率 / 1000
    newDist[0] = totalPop * birthRate / 1000;

    // 年龄递进 + 死亡
    for (let age = 1; age < 100; age++) {
      newDist[age] = dist[age - 1] * (1 - deathRate / 1000);
    }
    // 100+ 岁 = 99岁存活者 + 原100+岁存量
    newDist[100] = dist[99] * (1 - deathRate / 1000) + dist[100];

    dist = newDist;
  }

  return {
    year: targetYear,
    distribution: dist,
    totalPopulation: sumDistribution(dist)
  };
}
