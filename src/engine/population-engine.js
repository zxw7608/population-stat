/**
 * 单阶段人口推演：从起始年逐年递推到目标年
 * 使用年龄别死亡率进行逐年迭代
 *
 * @param {Object} params
 * @param {number[]} params.baseDistribution - 起始年每岁人数（万人），length=101，index=age
 * @param {number} params.birthRate - 推演出⽣率 (‰)
 * @param {number[]} params.mortalityRates - 年龄别死亡率 (‰)，length=101，index=age
 * @param {number} params.startYear
 * @param {number} params.targetYear
 * @returns {{ year: number, distribution: number[], totalPopulation: number }}
 */
function simulate({
  baseDistribution,
  birthRate,
  mortalityRates,
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

    // 新生⼉ = 总⼈⼝ × 出⽣率 / 1000
    newDist[0] = totalPop * birthRate / 1000;

    // 年龄递进 + 年龄别死亡（死亡率截断至1000‰防止为负）
    for (let age = 1; age < 100; age++) {
      const rate = Math.min(mortalityRates[age - 1], 1000);
      newDist[age] = dist[age - 1] * (1 - rate / 1000);
    }
    const rate99 = Math.min(mortalityRates[99], 1000);
    const rate100 = Math.min(mortalityRates[100], 1000);
    newDist[100] = dist[99] * (1 - rate99 / 1000) + dist[100] * (1 - rate100 / 1000);

    dist = newDist;
  }

  return {
    year: targetYear,
    distribution: dist,
    totalPopulation: sumDistribution(dist)
  };
}
