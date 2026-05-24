// src/engine/age-classifier.js
/**
 * 按分组配置将每岁人口数聚合为分组结果
 * @param {number[]} distribution - 每岁人口数数组（万人），索引为年龄
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
    return { name: g.name, count: Math.round(count * 100) / 100 };
  });
}

/**
 * 计算分布总人口
 * @param {number[]} distribution - 每岁人口数数组（万人）
 * @returns {number} 总人口（万人）
 */
function sumDistribution(distribution) {
  const total = distribution.reduce((s, c) => s + c, 0);
  return Math.round(total * 100) / 100;
}
