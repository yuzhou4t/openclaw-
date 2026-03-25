/**
 * 机构服务
 * 管理机构信息和统计分析
 */

// 常见机构名称映射
const INSTITUTION_KEYWORDS = {
  // 美国顶尖院校
  'MIT': 'Massachusetts Institute of Technology',
  'Stanford': 'Stanford University',
  'Harvard': 'Harvard University',
  'Yale': 'Yale University',
  'Princeton': 'Princeton University',
  'Columbia': 'Columbia University',
  'Chicago': 'University of Chicago',
  'Berkeley': 'University of California Berkeley',
  'Princeton': 'Princeton University',
  'Oxford': 'University of Oxford',
  'Cambridge': 'University of Cambridge',
  // 中国院校
  'Peking University': 'Peking University',
  'Tsinghua': 'Tsinghua University',
  'Fudan': 'Fudan University',
  'Shanghai Jiao Tong': 'Shanghai Jiao Tong University',
  'CUHK': 'Chinese University of Hong Kong',
  'HKU': 'University of Hong Kong',
  // 金融机构
  'IMF': 'International Monetary Fund',
  'World Bank': 'World Bank',
  'Federal Reserve': 'Federal Reserve',
  'NBER': 'National Bureau of Economic Research',
  'SEC': 'Securities and Exchange Commission',
  // 金融机构/公司
  'Goldman': 'Goldman Sachs',
  'Morgan Stanley': 'Morgan Stanley',
  'BlackRock': 'BlackRock',
  'Vanguard': 'Vanguard'
};

/**
 * 从作者信息中提取机构
 */
function extractInstitution(authorInfo) {
  // 这里的实现需要更复杂的解析
  // 暂时返回空，实际应该从论文元数据或作者主页获取
  return null;
}

/**
 * 获取所有机构统计
 */
async function getAllInstitutions() {
  const { Paper } = require('../models');

  const papers = await Paper.findAll({
    attributes: ['authors', 'citations', 'category', 'publishDate']
  });

  // 机构统计（简化版，实际需要从作者信息中提取）
  const institutionStats = {};

  // 这里应该分析作者所属机构
  // 暂时返回一个示例结构

  return institutionStats;
}

/**
 * 机构详情
 */
async function getInstitutionDetail(institutionName) {
  // 实际实现需要关联论文和机构
  // 这里返回示例数据

  const { Paper } = require('../models');

  return {
    name: institutionName,
    stats: {
      totalPapers: 0,
      totalCitations: 0,
      avgCitations: 0,
      activeResearchers: 0
    },
    papers: [],
    topAuthors: [],
    yearStats: {},
    categoryStats: {}
  };
}

/**
 * 获取机构排名
 */
async function getInstitutionRankings(category = null, year = null, limit = 20) {
  const { Paper } = require('../models');

  // 示例排名数据
  const rankings = [
    { name: 'Harvard University', papers: 156, citations: 45200, hIndex: 89 },
    { name: 'MIT', papers: 142, citations: 42100, hIndex: 85 },
    { name: 'Stanford University', papers: 138, citations: 38900, hIndex: 82 },
    { name: 'University of Chicago', papers: 124, citations: 35600, hIndex: 78 },
    { name: 'Yale University', papers: 98, citations: 28400, hIndex: 71 },
    { name: 'Columbia University', papers: 96, citations: 26800, hIndex: 69 },
    { name: 'Princeton University', papers: 88, citations: 24500, hIndex: 66 },
    { name: 'UC Berkeley', papers: 86, citations: 23200, hIndex: 64 },
    { name: 'Peking University', papers: 156, citations: 18500, hIndex: 58 },
    { name: 'Tsinghua University', papers: 142, citations: 16200, hIndex: 54 },
    { name: 'Fudan University', papers: 98, citations: 12400, hIndex: 48 },
    { name: 'CUHK', papers: 76, citations: 9800, hIndex: 42 },
    { name: 'National Bureau of Economic Research', papers: 312, citations: 89600, hIndex: 95 },
    { name: 'World Bank', papers: 186, citations: 45600, hIndex: 78 },
    { name: 'International Monetary Fund', papers: 124, citations: 32400, hIndex: 65 }
  ];

  let filtered = rankings;

  if (category) {
    // 按类别筛选
    filtered = filtered.map(i => ({
      ...i,
      papers: Math.floor(i.papers * 0.3),
      citations: Math.floor(i.citations * 0.3)
    }));
  }

  return filtered.slice(0, limit);
}

/**
 * 获取研究机构地图数据
 */
async function getInstitutionMap() {
  // 返回按国家/地区分组的机构数据
  return {
    'United States': [
      { name: 'Harvard University', lat: 42.3770, lng: -71.1167 },
      { name: 'MIT', lat: 42.3601, lng: -71.0942 },
      { name: 'Stanford University', lat: 37.4275, lng: -122.1697 },
      { name: 'University of Chicago', lat: 41.7886, lng: -87.5987 }
    ],
    'China': [
      { name: 'Peking University', lat: 39.9905, lng: 116.3178 },
      { name: 'Tsinghua University', lat: 40.0006, lng: 116.3264 },
      { name: 'Fudan University', lat: 31.2983, lng: 121.5029 }
    ],
    'United Kingdom': [
      { name: 'Oxford University', lat: 51.7548, lng: -1.2544 },
      { name: 'Cambridge University', lat: 52.2053, lng: 0.1218 }
    ],
    'Hong Kong': [
      { name: 'HKU', lat: 22.2843, lng: 114.1728 },
      { name: 'CUHK', lat: 22.4195, lng: 114.2084 }
    ]
  };
}

module.exports = {
  getAllInstitutions,
  getInstitutionDetail,
  getInstitutionRankings,
  getInstitutionMap,
  INSTITUTION_KEYWORDS
};
